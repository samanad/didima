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

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tradingRoutes = require('./routes/trading');
const portfolioRoutes = require('./routes/portfolio');
const liquidityRoutes = require('./routes/liquidity');
const blockchainRoutes = require('./routes/blockchain');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import database connection
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Import blockchain service
const { initializeBlockchain } = require('./services/blockchain');

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

// Session configuration with Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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
        console.error('Error creating prices.json:', writeError);
        return res.status(500).json({ error: 'Failed to create prices file', details: writeError.message });
      }
    }

    // Check file permissions
    try {
      fs.accessSync(DATA_FILE, fs.constants.R_OK);
    } catch (accessError) {
      console.error('Cannot read prices.json:', accessError);
      return res.status(500).json({ error: 'Cannot read prices file', details: accessError.message });
    }

    const data = fs.readFileSync(DATA_FILE, 'utf8');
    
    // Handle empty file
    if (!data || data.trim() === '') {
      return res.json([]);
    }

    // Parse JSON
    let prices;
    try {
      prices = JSON.parse(data);
    } catch (parseError) {
      console.error('Error parsing prices.json:', parseError);
      // If file is corrupted, reset it
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
        return res.json([]);
      } catch (resetError) {
        console.error('Error resetting prices.json:', resetError);
        return res.status(500).json({ error: 'Corrupted prices file and cannot reset', details: parseError.message });
      }
    }

    // Ensure it's an array
    if (!Array.isArray(prices)) {
      console.warn('prices.json is not an array, resetting');
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return res.json([]);
    }

    res.json(prices);
  } catch (error) {
    console.error('Unexpected error reading prices:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to read prices', 
      details: error.message,
      filePath: DATA_FILE
    });
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/trading', authMiddleware, tradingRoutes);
app.use('/api/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/liquidity', liquidityRoutes);
app.use('/api/blockchain', blockchainRoutes);

// WebSocket endpoint for real-time updates
app.get('/api/ws', (req, res) => {
  res.json({ message: 'WebSocket endpoint' });
});

// Error handling middleware
app.use(errorHandler);

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
