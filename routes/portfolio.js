const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const LiquidityPool = require('../models/LiquidityPool');

const router = express.Router();

// Get user portfolio
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    let portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      // Create portfolio if it doesn't exist
      portfolio = new Portfolio({ userId });
      await portfolio.save();
    }

    // Get current KLOJI price
    const pool = await LiquidityPool.findOne();
    const currentPrice = pool ? pool.tokens.kloji.price : 0.85;

    // Calculate current values
    const currentValues = portfolio.getValueAtPrice(currentPrice);

    res.json({
      success: true,
      data: {
        portfolio: portfolio.summary,
        currentValues,
        klojiPrice: currentPrice,
        lastUpdated: portfolio.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio'
    });
  }
}));

// Get portfolio performance
router.get('/performance', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = '30d' } = req.query;

  try {
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Get transaction history for the period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const transactions = await Transaction.find({
      userId,
      createdAt: { $gte: startDate },
      status: 'completed'
    }).sort({ createdAt: 1 });

    // Calculate performance metrics
    let totalBought = 0;
    let totalSold = 0;
    let totalSpent = 0;
    let totalReceived = 0;

    transactions.forEach(tx => {
      if (tx.type === 'buy') {
        totalBought += tx.amount;
        totalSpent += tx.totalValue;
      } else if (tx.type === 'sell') {
        totalSold += tx.amount;
        totalReceived += tx.totalValue;
      }
    });

    const currentPrice = 0.85; // Get from pool in production
    const currentValue = portfolio.balances.kloji * currentPrice + portfolio.balances.usdt;
    const totalInvestment = totalSpent;
    const totalReturn = totalReceived + currentValue;
    const profitLoss = totalReturn - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

    res.json({
      success: true,
      data: {
        period,
        metrics: {
          totalBought,
          totalSold,
          totalSpent,
          totalReceived,
          currentValue,
          totalInvestment,
          totalReturn,
          profitLoss,
          profitLossPercentage
        },
        transactions: transactions.length
      }
    });
  } catch (error) {
    console.error('Error getting portfolio performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio performance'
    });
  }
}));

// Get portfolio allocation
router.get('/allocation', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Get current KLOJI price
    const pool = await LiquidityPool.findOne();
    const currentPrice = pool ? pool.tokens.kloji.price : 0.85;

    // Calculate allocations
    const klojiValue = portfolio.balances.kloji * currentPrice;
    const usdtValue = portfolio.balances.usdt;
    const totalValue = klojiValue + usdtValue;

    const allocation = {
      kloji: {
        balance: portfolio.balances.kloji,
        value: klojiValue,
        percentage: totalValue > 0 ? (klojiValue / totalValue) * 100 : 0
      },
      usdt: {
        balance: portfolio.balances.usdt,
        value: usdtValue,
        percentage: totalValue > 0 ? (usdtValue / totalValue) * 100 : 0
      },
      totalValue
    };

    res.json({
      success: true,
      data: allocation
    });
  } catch (error) {
    console.error('Error getting portfolio allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio allocation'
    });
  }
}));

// Get top portfolios (leaderboard)
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const topPortfolios = await Portfolio.getTopPortfolios(parseInt(limit));

    res.json({
      success: true,
      data: {
        portfolios: topPortfolios,
        total: topPortfolios.length
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
}));

// Get portfolio value over time
router.get('/value-history', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = '30d' } = req.query;

  try {
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Get transaction history for the period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const transactions = await Transaction.find({
      userId,
      createdAt: { $gte: startDate },
      status: 'completed'
    }).sort({ createdAt: 1 });

    // Simulate portfolio value over time
    // In production, you'd store historical portfolio snapshots
    const valueHistory = [];
    let currentKloji = 0;
    let currentUsdt = 1000; // Starting balance
    let currentPrice = 0.85;

    // Add starting point
    valueHistory.push({
      date: startDate,
      klojiBalance: currentKloji,
      usdtBalance: currentUsdt,
      totalValue: currentKloji * currentPrice + currentUsdt,
      price: currentPrice
    });

    // Calculate value changes based on transactions
    transactions.forEach(tx => {
      if (tx.type === 'buy') {
        currentKloji += tx.amount;
        currentUsdt -= tx.totalValue;
      } else if (tx.type === 'sell') {
        currentKloji -= tx.amount;
        currentUsdt += tx.totalValue;
      }

      // Simulate price changes
      currentPrice += (Math.random() - 0.5) * 0.01;

      valueHistory.push({
        date: tx.createdAt,
        klojiBalance: currentKloji,
        usdtBalance: currentUsdt,
        totalValue: currentKloji * currentPrice + currentUsdt,
        price: currentPrice
      });
    });

    res.json({
      success: true,
      data: {
        period,
        valueHistory
      }
    });
  } catch (error) {
    console.error('Error getting portfolio value history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio value history'
    });
  }
}));

module.exports = router;
