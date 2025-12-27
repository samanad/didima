const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { blockchainService } = require('../services/blockchain');

const router = express.Router();

// Get blockchain service status
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const status = blockchainService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status'
    });
  }
}));

// Get current gas price
router.get('/gas-price', asyncHandler(async (req, res) => {
  try {
    const gasPrice = await blockchainService.getGasPrice();
    
    res.json({
      success: true,
      data: gasPrice
    });
  } catch (error) {
    console.error('Error getting gas price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gas price'
    });
  }
}));

// Get block information
router.get('/block/:blockNumber', asyncHandler(async (req, res) => {
  const { blockNumber } = req.params;

  try {
    const blockInfo = await blockchainService.getBlockInfo(blockNumber);
    
    res.json({
      success: true,
      data: blockInfo
    });
  } catch (error) {
    console.error('Error getting block info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get block information'
    });
  }
}));

// Get transaction details
router.get('/transaction/:txHash', asyncHandler(async (req, res) => {
  const { txHash } = req.params;

  try {
    const txDetails = await blockchainService.getTransactionDetails(txHash);
    
    res.json({
      success: true,
      data: txDetails
    });
  } catch (error) {
    console.error('Error getting transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction details'
    });
  }
}));

// Get token price
router.get('/token-price/:tokenAddress', asyncHandler(async (req, res) => {
  const { tokenAddress } = req.params;
  const { baseToken = 'USDT' } = req.query;

  try {
    const price = await blockchainService.getTokenPrice(tokenAddress, baseToken);
    
    res.json({
      success: true,
      data: {
        tokenAddress,
        baseToken,
        price
      }
    });
  } catch (error) {
    console.error('Error getting token price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token price'
    });
  }
}));

// Validate wallet address
router.post('/validate-address', asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({
      success: false,
      message: 'Address is required'
    });
  }

  try {
    const isValid = blockchainService.isValidAddress(address);
    const formatted = blockchainService.formatAddress(address);
    
    res.json({
      success: true,
      data: {
        address,
        isValid,
        formatted: isValid ? formatted : address
      }
    });
  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address'
    });
  }
}));

// Estimate gas for transaction
router.post('/estimate-gas', asyncHandler(async (req, res) => {
  const { from, to, data, value = '0' } = req.body;

  if (!from || !to || !data) {
    return res.status(400).json({
      success: false,
      message: 'From address, to address, and data are required'
    });
  }

  try {
    const gasEstimate = await blockchainService.estimateGas(from, to, data, value);
    
    res.json({
      success: true,
      data: {
        gasEstimate,
        from,
        to,
        data,
        value
      }
    });
  } catch (error) {
    console.error('Error estimating gas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate gas'
    });
  }
}));

module.exports = router;
