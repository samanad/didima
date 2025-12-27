const { ethers } = require('ethers');
const { getCache, setCache } = require('../config/redis');

// USDT BEP20 ABI (minimal for basic operations)
const USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// KLOJI Token ABI (similar to USDT)
const KLOJI_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.usdtContract = null;
    this.klojiContract = null;
    this.wallet = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(
        process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/'
      );

      // Initialize contracts
      this.usdtContract = new ethers.Contract(
        process.env.USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
        USDT_ABI,
        this.provider
      );

      this.klojiContract = new ethers.Contract(
        process.env.KLOJI_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
        KLOJI_ABI,
        this.provider
      );

      // Initialize wallet if private key is provided
      if (process.env.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        console.log('🔐 Wallet initialized:', this.wallet.address);
      }

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`🌐 Connected to BSC Network: ${network.name} (Chain ID: ${network.chainId})`);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Get USDT balance for an address
  async getUsdtBalance(address) {
    try {
      if (!this.isInitialized) throw new Error('Blockchain service not initialized');
      
      const balance = await this.usdtContract.balanceOf(address);
      const decimals = await this.usdtContract.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      throw error;
    }
  }

  // Get KLOJI balance for an address
  async getKlojiBalance(address) {
    try {
      if (!this.isInitialized) throw new Error('Blockchain service not initialized');
      
      const balance = await this.klojiContract.balanceOf(address);
      const decimals = await this.klojiContract.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error getting KLOJI balance:', error);
      throw error;
    }
  }

  // Transfer USDT from central wallet to user
  async transferUsdtToUser(userAddress, amount) {
    try {
      if (!this.isInitialized || !this.wallet) {
        throw new Error('Blockchain service or wallet not initialized');
      }

      const decimals = await this.usdtContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Check balance
      const balance = await this.usdtContract.balanceOf(this.wallet.address);
      if (balance < amountWei) {
        throw new Error('Insufficient USDT balance in central wallet');
      }

      // Send transaction
      const tx = await this.usdtContract.connect(this.wallet).transfer(userAddress, amountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice.toString()
      };
    } catch (error) {
      console.error('Error transferring USDT to user:', error);
      throw error;
    }
  }

  // Transfer KLOJI from central wallet to user
  async transferKlojiToUser(userAddress, amount) {
    try {
      if (!this.isInitialized || !this.wallet) {
        throw new Error('Blockchain service or wallet not initialized');
      }

      const decimals = await this.klojiContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Check balance
      const balance = await this.klojiContract.balanceOf(this.wallet.address);
      if (balance < amountWei) {
        throw new Error('Insufficient KLOJI balance in central wallet');
      }

      // Send transaction
      const tx = await this.klojiContract.connect(this.wallet).transfer(userAddress, amountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice.toString()
      };
    } catch (error) {
      console.error('Error transferring KLOJI to user:', error);
      throw error;
    }
  }

  // Get transaction details
  async getTransactionDetails(txHash) {
    try {
      if (!this.isInitialized) throw new Error('Blockchain service not initialized');
      
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!tx || !receipt) {
        throw new Error('Transaction not found');
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
        nonce: tx.nonce,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        logs: receipt.logs
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw error;
    }
  }

  // Get current gas price
  async getGasPrice() {
    try {
      if (!this.isInitialized) throw new Error('Blockchain service not initialized');
      
      const gasPrice = await this.provider.getFeeData();
      return {
        gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
        maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : null
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
  async estimateGas(from, to, data, value = '0') {
    try {
      if (!this.isInitialized) throw new Error('Blockchain service not initialized');
      
      const gasEstimate = await this.provider.estimateGas({
        from,
        to,
        data,
        value: ethers.parseEther(value)
      });

      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }

  // Get block information
  async getBlockInfo(blockNumber = 'latest') {
    try {
      if (!this.isInitialized) throw new Error('Blockchain service not initialized');
      
      const block = await this.provider.getBlock(blockNumber);
      
      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner,
        difficulty: block.difficulty.toString()
      };
    } catch (error) {
      console.error('Error getting block info:', error);
      throw error;
    }
  }

  // Get token price from DEX (simulated for now)
  async getTokenPrice(tokenAddress, baseToken = 'USDT') {
    try {
      // Check cache first
      const cacheKey = `token_price:${tokenAddress}:${baseToken}`;
      const cachedPrice = await getCache(cacheKey);
      
      if (cachedPrice) {
        return cachedPrice;
      }

      // For now, return a simulated price
      // In production, this would query PancakeSwap or other DEX APIs
      let price = 0.85; // Default KLOJI price
      
      if (tokenAddress.toLowerCase() === process.env.KLOJI_CONTRACT_ADDRESS?.toLowerCase()) {
        price = 0.85 + (Math.random() - 0.5) * 0.1; // Simulate price volatility
      }

      // Cache price for 1 minute
      await setCache(cacheKey, price, 60);
      
      return price;
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0.85; // Fallback price
    }
  }

  // Validate wallet address
  static isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Format address for display
  static formatAddress(address) {
    if (!ethers.isAddress(address)) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      provider: this.provider ? 'Connected' : 'Disconnected',
      wallet: this.wallet ? 'Connected' : 'Not connected',
      network: this.provider ? 'BSC' : 'Unknown'
    };
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

// Initialize blockchain service
const initializeBlockchain = async () => {
  try {
    await blockchainService.initialize();
  } catch (error) {
    console.error('Failed to initialize blockchain service:', error);
  }
};

module.exports = {
  blockchainService,
  initializeBlockchain,
  BlockchainService
};
