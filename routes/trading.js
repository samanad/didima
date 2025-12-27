const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler, formatValidationErrors, InsufficientFundsError, InsufficientLiquidityError, InvalidTransactionError } = require('../middleware/errorHandler');
const { requireWalletConnection } = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const LiquidityPool = require('../models/LiquidityPool');
const { blockchainService } = require('../services/blockchain');
const { setCache, getCache } = require('../config/redis');

const router = express.Router();

// Validation rules
const tradeValidation = [
  body('amount')
    .isFloat({ min: 0.0001 })
    .withMessage('Amount must be greater than 0.0001'),
  body('token')
    .isIn(['KLOJI', 'USDT'])
    .withMessage('Token must be either KLOJI or USDT')
];

// Get current trading price
router.get('/price', asyncHandler(async (req, res) => {
  try {
    // Get price from liquidity pool
    const pool = await LiquidityPool.findOne();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    // Get blockchain price as backup
    let blockchainPrice = pool.tokens.kloji.price;
    try {
      if (process.env.KLOJI_CONTRACT_ADDRESS) {
        blockchainPrice = await blockchainService.getTokenPrice(process.env.KLOJI_CONTRACT_ADDRESS);
      }
    } catch (error) {
      console.error('Error getting blockchain price:', error);
    }

    // Use blockchain price if available, otherwise use pool price
    const currentPrice = blockchainPrice || pool.tokens.kloji.price;

    res.json({
      success: true,
      data: {
        klojiPrice: currentPrice,
        usdtPrice: 1.00,
        priceChange24h: pool.statistics.priceChange24h,
        lastUpdated: pool.statistics.lastPriceUpdate
      }
    });
  } catch (error) {
    console.error('Error getting trading price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trading price'
    });
  }
}));

// Get trading pair information
router.get('/pair/:baseToken/:quoteToken', asyncHandler(async (req, res) => {
  const { baseToken, quoteToken } = req.params;

  if (!['KLOJI', 'USDT'].includes(baseToken) || !['KLOJI', 'USDT'].includes(quoteToken)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid trading pair'
    });
  }

  try {
    const pool = await LiquidityPool.findOne();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    const pairInfo = {
      baseToken,
      quoteToken,
      baseTokenBalance: pool.tokens[baseToken.toLowerCase()].balance,
      quoteTokenBalance: pool.tokens[quoteToken.toLowerCase()].balance,
      price: baseToken === 'KLOJI' ? pool.tokens.kloji.price : 1 / pool.tokens.kloji.price,
      volume24h: pool.statistics.totalVolume24h,
      transactions24h: pool.statistics.totalTransactions24h
    };

    res.json({
      success: true,
      data: pairInfo
    });
  } catch (error) {
    console.error('Error getting trading pair info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trading pair information'
    });
  }
}));

// Calculate trade amounts (preview)
router.post('/calculate', tradeValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors.mapped())
    });
  }

  const { amount, token, type } = req.body;

  try {
    const pool = await LiquidityPool.findOne();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    let calculation;
    
    if (type === 'buy' && token === 'USDT') {
      // Calculate KLOJI output for USDT input
      calculation = pool.calculateSwapAmount('USDT', amount);
    } else if (type === 'sell' && token === 'KLOJI') {
      // Calculate USDT output for KLOJI input
      calculation = pool.calculateSwapAmount('KLOJI', amount);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid trade type or token combination'
      });
    }

    if (!calculation) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate trade amounts'
      });
    }

    // Add network fee
    const networkFee = pool.fees.networkFee;
    const totalCost = calculation.inputAmount + networkFee;

    res.json({
      success: true,
      data: {
        inputToken: calculation.inputToken,
        inputAmount: calculation.inputAmount,
        outputToken: calculation.outputToken,
        outputAmount: calculation.outputAmount,
        tradingFee: calculation.fee,
        networkFee,
        totalCost,
        priceImpact: this.calculatePriceImpact(calculation, pool),
        minimumReceived: calculation.outputAmount * 0.995 // 0.5% slippage tolerance
      }
    });
  } catch (error) {
    console.error('Error calculating trade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trade amounts'
    });
  }
}));

// Execute buy order (USDT -> KLOJI)
router.post('/buy', [
  body('usdtAmount')
    .isFloat({ min: 0.0001 })
    .withMessage('USDT amount must be greater than 0.0001')
], requireWalletConnection, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors.mapped())
    });
  }

  const { usdtAmount } = req.body;
  const userId = req.user._id;

  try {
    // Get user portfolio
    let portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      // Create portfolio if it doesn't exist
      portfolio = new Portfolio({ userId });
      await portfolio.save();
    }

    // Get liquidity pool
    const pool = await LiquidityPool.findOne();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    // Check if user has sufficient USDT
    if (portfolio.balances.usdt < usdtAmount) {
      throw new InsufficientFundsError('USDT', usdtAmount, portfolio.balances.usdt);
    }

    // Check if pool has sufficient liquidity
    const klojiToReceive = usdtAmount / pool.tokens.kloji.price;
    
    if (pool.tokens.kloji.balance < klojiToReceive) {
      throw new InsufficientLiquidityError('KLOJI', klojiToReceive, pool.tokens.kloji.balance);
    }

    // Calculate fees
    const networkFee = pool.fees.networkFee;
    const tradingFee = usdtAmount * pool.fees.tradingFee;
    const totalCost = usdtAmount + networkFee + tradingFee;

    // Check if user has enough for total cost
    if (portfolio.balances.usdt < totalCost) {
      throw new InsufficientFundsError('USDT', totalCost, portfolio.balances.usdt);
    }

    // Execute the trade
    const klojiReceived = klojiToReceive - (klojiToReceive * pool.fees.tradingFee);

    // Update portfolio
    await portfolio.updateBalances(
      klojiReceived,           // KLOJI change
      -totalCost,              // USDT change (negative)
      pool.tokens.kloji.price
    );

    // Update liquidity pool
    await pool.updateBalances(
      -klojiReceived,          // KLOJI change (negative)
      usdtAmount               // USDT change
    );

    // Add transaction volume
    await pool.addTransactionVolume(usdtAmount);

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'buy',
      status: 'completed',
      token: 'KLOJI',
      amount: klojiReceived,
      price: pool.tokens.kloji.price,
      totalValue: usdtAmount,
      networkFee,
      fromAddress: req.user.walletAddress,
      toAddress: req.user.walletAddress,
      metadata: {
        platform: 'Kloji Exchange',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await transaction.save();

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`trading-${userId}`).emit('trade-executed', {
        type: 'buy',
        klojiReceived,
        usdtSpent: totalCost,
        newBalance: portfolio.balances
      });
    }

    res.json({
      success: true,
      message: 'Buy order executed successfully',
      data: {
        transactionId: transaction._id,
        klojiReceived,
        usdtSpent: totalCost,
        fees: {
          networkFee,
          tradingFee
        },
        newBalances: portfolio.balances,
        transactionHash: transaction.transactionHash
      }
    });
  } catch (error) {
    console.error('Error executing buy order:', error);
    
    if (error instanceof InsufficientFundsError || 
        error instanceof InsufficientLiquidityError || 
        error instanceof InvalidTransactionError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to execute buy order'
    });
  }
}));

// Execute sell order (KLOJI -> USDT)
router.post('/sell', [
  body('klojiAmount')
    .isFloat({ min: 0.0001 })
    .withMessage('KLOJI amount must be greater than 0.0001')
], requireWalletConnection, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors.mapped())
    });
  }

  const { klojiAmount } = req.body;
  const userId = req.user._id;

  try {
    // Get user portfolio
    let portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Get liquidity pool
    const pool = await LiquidityPool.findOne();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Liquidity pool not found'
      });
    }

    // Check if user has sufficient KLOJI
    if (portfolio.balances.kloji < klojiAmount) {
      throw new InsufficientFundsError('KLOJI', klojiAmount, portfolio.balances.kloji);
    }

    // Check if pool has sufficient USDT liquidity
    const usdtToReceive = klojiAmount * pool.tokens.kloji.price;
    const networkFee = pool.fees.networkFee;
    const totalUsdtNeeded = usdtToReceive + networkFee;
    
    if (pool.tokens.usdt.balance < totalUsdtNeeded) {
      throw new InsufficientLiquidityError('USDT', totalUsdtNeeded, pool.tokens.usdt.balance);
    }

    // Calculate fees
    const tradingFee = usdtToReceive * pool.fees.tradingFee;
    const finalUsdtReceived = usdtToReceive - tradingFee - networkFee;

    // Execute the trade
    // Update portfolio
    await portfolio.updateBalances(
      -klojiAmount,            // KLOJI change (negative)
      finalUsdtReceived,       // USDT change
      pool.tokens.kloji.price
    );

    // Update liquidity pool
    await pool.updateBalances(
      klojiAmount,             // KLOJI change
      -totalUsdtNeeded         // USDT change (negative)
    );

    // Add transaction volume
    await pool.addTransactionVolume(usdtToReceive);

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'sell',
      status: 'completed',
      token: 'KLOJI',
      amount: klojiAmount,
      price: pool.tokens.kloji.price,
      totalValue: usdtToReceive,
      networkFee,
      fromAddress: req.user.walletAddress,
      toAddress: req.user.walletAddress,
      metadata: {
        platform: 'Kloji Exchange',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await transaction.save();

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`trading-${userId}`).emit('trade-executed', {
        type: 'sell',
        klojiSold: klojiAmount,
        usdtReceived: finalUsdtReceived,
        newBalance: portfolio.balances
      });
    }

    res.json({
      success: true,
      message: 'Sell order executed successfully',
      data: {
        transactionId: transaction._id,
        klojiSold: klojiAmount,
        usdtReceived: finalUsdtReceived,
        fees: {
          networkFee,
          tradingFee
        },
        newBalances: portfolio.balances,
        transactionHash: transaction.transactionHash
      }
    });
  } catch (error) {
    console.error('Error executing sell order:', error);
    
    if (error instanceof InsufficientFundsError || 
        error instanceof InsufficientLiquidityError || 
        error instanceof InvalidTransactionError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to execute sell order'
    });
  }
}));

// Get user's trading history
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type, status, token } = req.query;

  try {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      token
    };

    const history = await Transaction.getUserHistory(userId, options);
    const total = await Transaction.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        transactions: history,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting trading history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trading history'
    });
  }
}));

// Get trading statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = '30d' } = req.query;

  try {
    const stats = await Transaction.getStats(userId, period);

    res.json({
      success: true,
      data: {
        period,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting trading stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trading statistics'
    });
  }
}));

// Helper function to calculate price impact
function calculatePriceImpact(calculation, pool) {
  const inputValue = calculation.inputAmount;
  const poolValue = pool.totalValue;
  return (inputValue / poolValue) * 100;
}

module.exports = router;
