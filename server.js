const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import routes (with error handling - make them optional)
let authRoutes, userRoutes, tradingRoutes, portfolioRoutes, liquidityRoutes, blockchainRoutes;
let errorHandler, authMiddleware;
let connectDB, connectRedis, initializeBlockchain;

try {
  authRoutes = require('./routes/auth');
} catch (e) {
  console.warn('Could not load auth routes:', e.message);
  authRoutes = null;
}

try {
  userRoutes = require('./routes/users');
} catch (e) {
  console.warn('Could not load user routes:', e.message);
  userRoutes = null;
}

try {
  tradingRoutes = require('./routes/trading');
} catch (e) {
  console.warn('Could not load trading routes:', e.message);
  tradingRoutes = null;
}

try {
  portfolioRoutes = require('./routes/portfolio');
} catch (e) {
  console.warn('Could not load portfolio routes:', e.message);
  portfolioRoutes = null;
}

try {
  liquidityRoutes = require('./routes/liquidity');
} catch (e) {
  console.warn('Could not load liquidity routes:', e.message);
  liquidityRoutes = null;
}

try {
  blockchainRoutes = require('./routes/blockchain');
} catch (e) {
  console.warn('Could not load blockchain routes:', e.message);
  blockchainRoutes = null;
}

// Import middleware (with error handling)
try {
  const errorHandlerModule = require('./middleware/errorHandler');
  errorHandler = errorHandlerModule.errorHandler;
} catch (e) {
  console.warn('Could not load error handler:', e.message);
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };
}

try {
  const authModule = require('./middleware/auth');
  authMiddleware = authModule.authMiddleware;
} catch (e) {
  console.warn('Could not load auth middleware:', e.message);
  authMiddleware = (req, res, next) => next(); // Pass through if not available
}

// Import database connection (optional)
try {
  const dbModule = require('./config/database');
  connectDB = dbModule.connectDB;
} catch (e) {
  console.warn('Could not load database config:', e.message);
  connectDB = () => console.log('Database connection skipped');
}

try {
  const redisModule = require('./config/redis');
  connectRedis = redisModule.connectRedis;
} catch (e) {
  console.warn('Could not load redis config:', e.message);
  connectRedis = () => console.log('Redis connection skipped');
}

// Import blockchain service (optional)
try {
  const blockchainModule = require('./services/blockchain');
  initializeBlockchain = blockchainModule.initializeBlockchain;
} catch (e) {
  console.warn('Could not load blockchain service:', e.message);
  initializeBlockchain = () => console.log('Blockchain initialization skipped');
}

// Price tracker configuration
const ADMIN_IP = '165.22.58.120';
const DATA_FILE = path.join(__dirname, 'prices.json');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize prices file if it doesn't exist (with error handling)
try {
  if (!fs.existsSync(DATA_FILE)) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      console.log('Created prices.json at:', DATA_FILE);
    } catch (writeError) {
      console.error('Warning: Could not create prices.json:', writeError.message);
      console.error('File path:', DATA_FILE);
    }
  }
} catch (error) {
  console.error('Error initializing prices.json:', error);
}

// Connect to databases (with error handling for optional services)
try {
  connectDB();
} catch (error) {
  console.error('Database connection error (non-critical):', error.message);
}

try {
  connectRedis();
} catch (error) {
  console.error('Redis connection error (non-critical):', error.message);
}

try {
  initializeBlockchain();
} catch (error) {
  console.error('Blockchain initialization error (non-critical):', error.message);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);

// Session configuration (with optional Redis)
let sessionConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Try to use Redis store if available
try {
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  sessionConfig.store = new RedisStore({ client: redisClient });
  console.log('Using Redis session store');
} catch (error) {
  console.warn('Redis session store not available, using memory store:', error.message);
  // Will use default memory store
}

app.use(session(sessionConfig));

// Serve static files from public folder (for Plesk Document Root: /httpdocs/public)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Disable caching for HTML, JS, and CSS files to prevent Cloudflare caching issues
    if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }
}));

// Serve index.html from public folder with no-cache headers
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join trading room
  socket.on('join-trading', (userId) => {
    socket.join(`trading-${userId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Trust proxy to get real IP (important for production and Cloudflare)
app.set('trust proxy', true);

// IP verification middleware for price tracker
function verifyAdminIP(req, res, next) {
  // Cloudflare passes the real IP in CF-Connecting-IP header
  // Also check X-Forwarded-For and X-Real-IP as fallbacks
  const cloudflareIP = req.headers['cf-connecting-ip'];
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const directIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For (first IP) > direct connection
  let clientIP = cloudflareIP || realIP;
  
  if (!clientIP && forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one (original client)
    clientIP = forwardedFor.split(',')[0].trim();
  }
  
  if (!clientIP) {
    clientIP = directIP;
  }
  
  const cleanIP = clientIP.replace('::ffff:', ''); // Remove IPv6 prefix if present
  
  // Log IP for debugging
  console.log('Price tracker request from IP:', cleanIP, 'Expected:', ADMIN_IP);
  console.log('Headers:', {
    'cf-connecting-ip': cloudflareIP,
    'x-forwarded-for': forwardedFor,
    'x-real-ip': realIP,
    'req.ip': req.ip
  });
  
  if (cleanIP === ADMIN_IP) {
    next();
  } else {
    res.status(403).json({ 
      error: 'Access denied. Admin IP (165.22.58.120) required.',
      receivedIP: cleanIP,
      headers: {
        'cf-connecting-ip': cloudflareIP,
        'x-forwarded-for': forwardedFor,
        'x-real-ip': realIP
      }
    });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Price Tracker API Routes
// Get all prices
app.get('/api/prices', (req, res) => {
  try {
    // Ensure prices.json exists and is readable
    if (!fs.existsSync(DATA_FILE)) {
      console.log('prices.json does not exist, creating it at:', DATA_FILE);
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      } catch (writeError) {
        console.error('Could not create prices.json:', writeError.message);
        // Return empty array anyway
        return res.json([]);
      }
    }

    // Try to read the file
    let data;
    try {
      data = fs.readFileSync(DATA_FILE, 'utf8');
    } catch (readError) {
      console.error('Cannot read prices.json:', readError.message);
      return res.json([]);
    }
    
    // Handle empty file
    if (!data || data.trim() === '') {
      return res.json([]);
    }

    // Parse JSON
    let prices;
    try {
      prices = JSON.parse(data);
    } catch (parseError) {
      console.error('Error parsing prices.json:', parseError.message);
      // If file is corrupted, try to reset it
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
        return res.json([]);
      } catch (resetError) {
        console.error('Error resetting prices.json:', resetError.message);
        // Return empty array anyway
        return res.json([]);
      }
    }

    // Ensure it's an array
    if (!Array.isArray(prices)) {
      console.warn('prices.json is not an array, resetting');
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      } catch (e) {
        // Ignore write errors
      }
      return res.json([]);
    }

    res.json(prices);
  } catch (error) {
    console.error('Unexpected error reading prices:', error.message);
    // Always return empty array on any error to prevent 500
    res.json([]);
  }
});

// Add new price (admin only)
app.post('/api/prices', verifyAdminIP, (req, res) => {
  try {
    const { price } = req.body;
    
    if (!price || isNaN(parseFloat(price))) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    const priceValue = parseFloat(price);
    const timestamp = new Date().toISOString();

    // Read existing prices or initialize empty array
    let prices = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        if (data && data.trim() !== '') {
          prices = JSON.parse(data);
        }
      } catch (readError) {
        console.error('Error reading prices file:', readError);
        prices = [];
      }
    }

    if (!Array.isArray(prices)) {
      prices = [];
    }

    prices.push({
      price: priceValue,
      timestamp: timestamp
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(prices, null, 2));
    res.json({ success: true, price: priceValue, timestamp });
  } catch (error) {
    console.error('Error saving price:', error);
    res.status(500).json({ error: 'Failed to save price: ' + error.message });
  }
});

// API Routes (only use if they loaded successfully)
if (authRoutes) {
  try {
    app.use('/api/auth', authRoutes);
  } catch (e) {
    console.error('Error mounting auth routes:', e.message);
  }
}

if (userRoutes && authMiddleware) {
  try {
    app.use('/api/users', authMiddleware, userRoutes);
  } catch (e) {
    console.error('Error mounting user routes:', e.message);
  }
}

if (tradingRoutes && authMiddleware) {
  try {
    app.use('/api/trading', authMiddleware, tradingRoutes);
  } catch (e) {
    console.error('Error mounting trading routes:', e.message);
  }
}

if (portfolioRoutes && authMiddleware) {
  try {
    app.use('/api/portfolio', authMiddleware, portfolioRoutes);
  } catch (e) {
    console.error('Error mounting portfolio routes:', e.message);
  }
}

if (liquidityRoutes) {
  try {
    app.use('/api/liquidity', liquidityRoutes);
  } catch (e) {
    console.error('Error mounting liquidity routes:', e.message);
  }
}

if (blockchainRoutes) {
  try {
    app.use('/api/blockchain', blockchainRoutes);
  } catch (e) {
    console.error('Error mounting blockchain routes:', e.message);
  }
}

// WebSocket endpoint for real-time updates
app.get('/api/ws', (req, res) => {
  res.json({ message: 'WebSocket endpoint' });
});

// Error handling middleware (only if available)
if (errorHandler) {
  app.use(errorHandler);
} else {
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Kloji Exchange Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Price Tracker Admin IP: ${ADMIN_IP}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io };
