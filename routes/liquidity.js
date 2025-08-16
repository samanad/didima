const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const LiquidityPool = require('../models/LiquidityPool');

const router = express.Router();

// Get liquidity pool status
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const pool = await LiquidityPool.getPoolStatus();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    res.json({
      success: true,
      data: pool
    });
  } catch (error) {
    console.error('Error getting liquidity pool status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get liquidity pool status'
    });
  }
}));

// Get price history
router.get('/price-history', asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;

  try {
    const priceHistory = await LiquidityPool.getPriceHistory(parseInt(hours));

    res.json({
      success: true,
      data: {
        hours: parseInt(hours),
        priceHistory
      }
    });
  } catch (error) {
    console.error('Error getting price history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price history'
    });
  }
}));

// Get network integrations
router.get('/integrations', asyncHandler(async (req, res) => {
  try {
    const pool = await LiquidityPool.findOne().select('networkIntegrations');
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    res.json({
      success: true,
      data: {
        integrations: pool.networkIntegrations
      }
    });
  } catch (error) {
    console.error('Error getting network integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get network integrations'
    });
  }
}));

module.exports = router;
