const mongoose = require('mongoose');
const LiquidityPool = require('../models/LiquidityPool');
require('dotenv').config();

async function migrate() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kloji_exchange');
    console.log('📦 Connected to MongoDB');

    // Create default liquidity pool if it doesn't exist
    const existingPool = await LiquidityPool.findOne();
    
    if (!existingPool) {
      console.log('🏊 Creating default liquidity pool...');
      
      const defaultPool = new LiquidityPool({
        name: 'Central Liquidity Pool',
        network: 'BEP20',
        tokens: {
          kloji: {
            balance: 1000000,
            price: 0.85,
            decimals: 18
          },
          usdt: {
            balance: 850000,
            price: 1.00,
            decimals: 18
          }
        },
        fees: {
          networkFee: 0.5,
          tradingFee: 0.001, // 0.1%
          withdrawalFee: 0.1
        },
        statistics: {
          totalVolume24h: 0,
          totalTransactions24h: 0,
          priceChange24h: 0,
          lastPriceUpdate: new Date()
        },
        networkIntegrations: [
          {
            platform: 'Kloji Exchange',
            status: 'active',
            lastSync: new Date()
          },
          {
            platform: 'Kloji Network Platform 1',
            status: 'active',
            lastSync: new Date()
          },
          {
            platform: 'Kloji Network Platform 2',
            status: 'active',
            lastSync: new Date()
          }
        ]
      });

      await defaultPool.save();
      console.log('✅ Default liquidity pool created');
    } else {
      console.log('✅ Liquidity pool already exists');
    }

    // Create indexes
    console.log('📊 Creating database indexes...');
    
    // User indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 });
    await mongoose.connection.db.collection('users').createIndex({ username: 1 });
    await mongoose.connection.db.collection('users').createIndex({ walletAddress: 1 });
    await mongoose.connection.db.collection('users').createIndex({ status: 1 });
    
    // Portfolio indexes
    await mongoose.connection.db.collection('portfolios').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('portfolios').createIndex({ 'totalValue.usd': -1 });
    
    // Transaction indexes
    await mongoose.connection.db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
    await mongoose.connection.db.collection('transactions').createIndex({ type: 1, status: 1 });
    await mongoose.connection.db.collection('transactions').createIndex({ token: 1, createdAt: -1 });
    await mongoose.connection.db.collection('transactions').createIndex({ transactionHash: 1 }, { sparse: true });
    await mongoose.connection.db.collection('transactions').createIndex({ blockNumber: 1 });
    await mongoose.connection.db.collection('transactions').createIndex({ createdAt: 1 });
    
    // Liquidity pool indexes
    await mongoose.connection.db.collection('liquiditypools').createIndex({ network: 1 });
    await mongoose.connection.db.collection('liquiditypools').createIndex({ 'tokens.kloji.price': 1 });
    await mongoose.connection.db.collection('liquiditypools').createIndex({ 'statistics.lastPriceUpdate': 1 });

    console.log('✅ Database indexes created');

    console.log('🚀 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
