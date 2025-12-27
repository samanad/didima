const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_IP = '165.22.58.120';
const DATA_FILE = path.join(__dirname, 'prices.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize prices file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// IP verification middleware
function verifyAdminIP(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const cleanIP = clientIP.replace('::ffff:', ''); // Remove IPv6 prefix if present
  
  if (cleanIP === ADMIN_IP) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin IP required.' });
  }
}

// Get all prices
app.get('/api/prices', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const prices = JSON.parse(data);
    res.json(prices);
  } catch (error) {
    console.error('Error reading prices:', error);
    res.status(500).json({ error: 'Failed to read prices' });
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

    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const prices = JSON.parse(data);

    prices.push({
      price: priceValue,
      timestamp: timestamp
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(prices, null, 2));
    res.json({ success: true, price: priceValue, timestamp });
  } catch (error) {
    console.error('Error saving price:', error);
    res.status(500).json({ error: 'Failed to save price' });
  }
});

// Trust proxy to get real IP (important for production)
app.set('trust proxy', true);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin IP: ${ADMIN_IP}`);
});

