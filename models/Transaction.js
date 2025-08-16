const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'transfer', 'deposit', 'withdrawal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  token: {
    type: String,
    enum: ['KLOJI', 'USDT'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  networkFee: {
    type: Number,
    default: 0.5,
    min: 0
  },
  transactionHash: {
    type: String,
    sparse: true
  },
  blockNumber: {
    type: Number
  },
  gasUsed: {
    type: Number
  },
  gasPrice: {
    type: Number
  },
  fromAddress: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid from address format'
    }
  },
  toAddress: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid to address format'
    }
  },
  metadata: {
    orderId: String,
    platform: String,
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  notes: String,
  processedAt: Date
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ token: 1, createdAt: -1 });
transactionSchema.index({ transactionHash: 1 }, { sparse: true });
transactionSchema.index({ blockNumber: 1 });
transactionSchema.index({ createdAt: 1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    type: this.type,
    token: this.token,
    amount: this.amount,
    price: this.price,
    totalValue: this.totalValue,
    status: this.status,
    createdAt: this.createdAt,
    transactionHash: this.transactionHash
  };
});

// Virtual for isBlockchainTransaction
transactionSchema.virtual('isBlockchainTransaction').get(function() {
  return this.transactionHash && this.blockNumber;
});

// Pre-save middleware to calculate total value
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('price')) {
    this.totalValue = this.amount * this.price;
  }
  next();
});

// Method to mark as completed
transactionSchema.methods.markCompleted = function(transactionHash, blockNumber, gasUsed, gasPrice) {
  this.status = 'completed';
  this.transactionHash = transactionHash;
  this.blockNumber = blockNumber;
  this.gasUsed = gasUsed;
  this.gasPrice = gasPrice;
  this.processedAt = new Date();
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.notes = reason;
  this.processedAt = new Date();
  return this.save();
};

// Static method to get user transaction history
transactionSchema.statics.getUserHistory = function(userId, options = {}) {
  const { page = 1, limit = 20, type, status, token, startDate, endDate } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (token) query.token = token;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'username');
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = function(userId, period = '30d') {
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
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalVolume: { $sum: '$totalValue' },
        avgPrice: { $avg: '$price' }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
