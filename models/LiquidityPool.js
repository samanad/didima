const mongoose = require('mongoose');

const liquidityPoolSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Central Liquidity Pool',
    required: true
  },
  network: {
    type: String,
    default: 'BEP20',
    required: true
  },
  tokens: {
    kloji: {
      balance: {
        type: Number,
        default: 1000000,
        min: 0
      },
      price: {
        type: Number,
        default: 0.85,
        min: 0
      },
      decimals: {
        type: Number,
        default: 18
      }
    },
    usdt: {
      balance: {
        type: Number,
        default: 850000,
        min: 0
      },
      price: {
        type: Number,
        default: 1.00,
        min: 0
      },
      decimals: {
        type: Number,
        default: 18
      }
    }
  },
  fees: {
    networkFee: {
      type: Number,
      default: 0.5,
      min: 0
    },
    tradingFee: {
      type: Number,
      default: 0.1, // 0.1%
      min: 0,
      max: 1
    },
    withdrawalFee: {
      type: Number,
      default: 0.1,
      min: 0
    }
  },
  statistics: {
    totalVolume24h: {
      type: Number,
      default: 0
    },
    totalTransactions24h: {
      type: Number,
      default: 0
    },
    priceChange24h: {
      type: Number,
      default: 0
    },
    lastPriceUpdate: {
      type: Date,
      default: Date.now
    }
  },
  networkIntegrations: [{
    platform: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    },
    lastSync: {
      type: Date,
      default: Date.now
    },
    apiEndpoint: String,
    apiKey: String
  }],
  maintenance: {
    isUnderMaintenance: {
      type: Boolean,
      default: false
    },
    reason: String,
    startTime: Date,
    estimatedEndTime: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
liquidityPoolSchema.index({ network: 1 });
liquidityPoolSchema.index({ 'tokens.kloji.price': 1 });
liquidityPoolSchema.index({ 'statistics.lastPriceUpdate': 1 });

// Virtual for total pool value
liquidityPoolSchema.virtual('totalValue').get(function() {
  const klojiValue = this.tokens.kloji.balance * this.tokens.kloji.price;
  const usdtValue = this.tokens.usdt.balance * this.tokens.usdt.price;
  return klojiValue + usdtValue;
});

// Virtual for kloji price in USDT
liquidityPoolSchema.virtual('klojiPriceInUsdt').get(function() {
  return this.tokens.kloji.price / this.tokens.usdt.price;
});

// Method to update balances
liquidityPoolSchema.methods.updateBalances = function(klojiChange = 0, usdtChange = 0) {
  this.tokens.kloji.balance += klojiChange;
  this.tokens.usdt.balance += usdtChange;
  
  // Ensure balances don't go negative
  this.tokens.kloji.balance = Math.max(0, this.tokens.kloji.balance);
  this.tokens.usdt.balance = Math.max(0, this.tokens.usdt.balance);
  
  this.lastUpdated = new Date();
  return this.save();
};

// Method to update KLOJI price
liquidityPoolSchema.methods.updateKlojiPrice = function(newPrice) {
  const oldPrice = this.tokens.kloji.price;
  this.tokens.kloji.price = newPrice;
  
  // Calculate 24h price change
  if (oldPrice > 0) {
    this.statistics.priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100;
  }
  
  this.statistics.lastPriceUpdate = new Date();
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add transaction volume
liquidityPoolSchema.methods.addTransactionVolume = function(volume) {
  this.statistics.totalVolume24h += volume;
  this.statistics.totalTransactions24h += 1;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to reset daily statistics
liquidityPoolSchema.methods.resetDailyStats = function() {
  this.statistics.totalVolume24h = 0;
  this.statistics.totalTransactions24h = 0;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to check if pool has sufficient liquidity
liquidityPoolSchema.methods.hasSufficientLiquidity = function(klojiAmount, usdtAmount) {
  return this.tokens.kloji.balance >= klojiAmount && this.tokens.usdt.balance >= usdtAmount;
};

// Method to calculate swap amounts (constant product formula)
liquidityPoolSchema.methods.calculateSwapAmount = function(inputToken, inputAmount) {
  if (inputToken === 'USDT') {
    // Calculate KLOJI output for USDT input
    const k = this.tokens.kloji.balance * this.tokens.usdt.balance;
    const newUsdtBalance = this.tokens.usdt.balance + inputAmount;
    const newKlojiBalance = k / newUsdtBalance;
    const klojiOutput = this.tokens.kloji.balance - newKlojiBalance;
    
    return {
      inputToken: 'USDT',
      inputAmount,
      outputToken: 'KLOJI',
      outputAmount: klojiOutput,
      fee: inputAmount * this.fees.tradingFee
    };
  } else if (inputToken === 'KLOJI') {
    // Calculate USDT output for KLOJI input
    const k = this.tokens.kloji.balance * this.tokens.usdt.balance;
    const newKlojiBalance = this.tokens.kloji.balance + inputAmount;
    const newUsdtBalance = k / newKlojiBalance;
    const usdtOutput = this.tokens.usdt.balance - newUsdtBalance;
    
    return {
      inputToken: 'KLOJI',
      inputAmount,
      outputToken: 'USDT',
      outputAmount: usdtOutput,
      fee: inputAmount * this.tokens.kloji.price * this.fees.tradingFee
    };
  }
  
  return null;
};

// Static method to get pool status
liquidityPoolSchema.statics.getPoolStatus = function() {
  return this.findOne().select('tokens statistics fees maintenance networkIntegrations');
};

// Static method to get price history
liquidityPoolSchema.statics.getPriceHistory = function(hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        'statistics.lastPriceUpdate': { $gte: startTime }
      }
    },
    {
      $project: {
        timestamp: '$statistics.lastPriceUpdate',
        klojiPrice: '$tokens.kloji.price',
        usdtPrice: '$tokens.usdt.price',
        volume: '$statistics.totalVolume24h'
      }
    },
    {
      $sort: { timestamp: 1 }
    }
  ]);
};

module.exports = mongoose.model('LiquidityPool', liquidityPoolSchema);
