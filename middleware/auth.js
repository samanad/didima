const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCache } = require('../config/redis');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }

    // Add user to request object
    req.user = user;
    
    // Update last login if it's been more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastLogin || user.lastLogin < oneHourAgo) {
      user.lastLogin = new Date();
      await user.save();
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.status === 'active' && !user.isLocked) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }

    next();
  };
};

// Rate limiting middleware for specific endpoints
const rateLimitByUser = (maxRequests, windowMs) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const key = `rate_limit:${req.user._id}:${req.route.path}`;
    const cache = await getCache(key);
    
    if (cache && cache.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Increment request count
    const count = (cache ? cache.count : 0) + 1;
    await setCache(key, { count }, windowMs / 1000);

    next();
  };
};

// Wallet connection middleware
const requireWalletConnection = async (req, res, next) => {
  if (!req.user.isWalletConnected || !req.user.walletAddress) {
    return res.status(400).json({
      success: false,
      message: 'Wallet must be connected to perform this action.'
    });
  }
  next();
};

// KYC verification middleware
const requireKYC = (level = 'basic') => {
  return async (req, res, next) => {
    if (!req.user.verification.kyc) {
      return res.status(403).json({
        success: false,
        message: 'KYC verification required to perform this action.'
      });
    }

    if (level === 'enhanced' && req.user.verification.kycLevel !== 'enhanced') {
      return res.status(403).json({
        success: false,
        message: 'Enhanced KYC verification required for this action.'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  rateLimitByUser,
  requireWalletConnection,
  requireKYC
};
