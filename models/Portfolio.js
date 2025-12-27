const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balances: {
    kloji: {
      type: Number,
      default: 0,
      min: 0
    },
    usdt: {
      type: Number,
      default: 1000, // Starting balance
      min: 0
    }
  },
  totalValue: {
    usd: {
      type: Number,
      default: 0
    },
    usdt: {
      type: Number,
      default: 1000
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ 'totalValue.usd': -1 });

// Virtual for portfolio summary
portfolioSchema.virtual('summary').get(function() {
  return {
    klojiBalance: this.balances.kloji,
    usdtBalance: this.balances.usdt,
    totalUsdValue: this.totalValue.usd,
    totalUsdtValue: this.totalValue.usdt,
    lastUpdated: this.lastUpdated
  };
});

// Method to update balances
portfolioSchema.methods.updateBalances = function(klojiChange = 0, usdtChange = 0, klojiPrice) {
  this.balances.kloji += klojiChange;
  this.balances.usdt += usdtChange;
  
  // Ensure balances don't go negative
  this.balances.kloji = Math.max(0, this.balances.kloji);
  this.balances.usdt = Math.max(0, this.balances.usdt);
  
  // Update total values
  if (klojiPrice) {
    this.totalValue.usd = (this.balances.kloji * klojiPrice) + this.balances.usdt;
    this.totalValue.usdt = this.totalValue.usd; // Assuming 1:1 USD:USDT for now
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Method to get portfolio value at specific price
portfolioSchema.methods.getValueAtPrice = function(klojiPrice) {
  const klojiValue = this.balances.kloji * klojiPrice;
  const totalUsd = klojiValue + this.balances.usdt;
  const totalUsdt = totalUsd; // Assuming 1:1 USD:USDT
  
  return {
    klojiValue,
    usdtBalance: this.balances.usdt,
    totalUsd,
    totalUsdt
  };
};

// Static method to get top portfolios
portfolioSchema.statics.getTopPortfolios = function(limit = 10) {
  return this.find()
    .sort({ 'totalValue.usd': -1 })
    .limit(limit)
    .populate('userId', 'username profile.firstName profile.lastName')
    .select('balances totalValue lastUpdated');
};

module.exports = mongoose.model('Portfolio', portfolioSchema);
