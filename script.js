// Global variables
let klojiPrice = 0.85;
let userKlojiBalance = 10000000; // 10 million KLOJI
let userUsdtBalance = 400; // 400 USDT
let isWalletConnected = false;

// Central liquidity pool (shared across network) - waiting for real data
let centralPool = {
    kloji: null, // Waiting for real data
    usdt: null,  // Waiting for real data
    networkFee: 0.5 // 0.5 USDT per transaction
};

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const buyForm = document.getElementById('buyForm');
const sellForm = document.getElementById('sellForm');
const buyAmount = document.getElementById('buyAmount');
const buyReceive = document.getElementById('buyReceive');
const sellAmount = document.getElementById('sellAmount');
const sellReceive = document.getElementById('sellReceive');
const klojiBalanceEl = document.getElementById('klojiBalance');
const usdtBalanceEl = document.getElementById('usdtBalance');
const klojiUsdValueEl = document.getElementById('klojiUsdValue');
const totalValueEl = document.getElementById('totalValue');
const totalUsdtValueEl = document.getElementById('totalUsdtValue');
const poolKlojiEl = document.getElementById('poolKloji');
const poolUsdtEl = document.getElementById('poolUsdt');
const toast = document.getElementById('toast');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updatePortfolio();
    // Removed simulatePriceUpdates() - no fake changing values
});

// Initialize the application
function initializeApp() {
    // Force set balances (ignore localStorage for balances)
    userKlojiBalance = 10000000; // 10 million KLOJI
    userUsdtBalance = 400; // 400 USDT
    
    // Clear old localStorage data to prevent caching issues
    const savedData = localStorage.getItem('klojiExchangeData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            // Only load price, not balances (balances are fixed)
            klojiPrice = data.klojiPrice || 0.85;
        } catch (e) {
            console.error('Error parsing saved data:', e);
            // Clear corrupted data
            localStorage.removeItem('klojiExchangeData');
        }
    }
    
    // Force update portfolio immediately
    updatePortfolio();
    updateLiquidityPool();
    
    // Save with correct values to override any cached data
    saveData();
}

// Setup event listeners
function setupEventListeners() {
    // Wallet connection
    connectWalletBtn.addEventListener('click', toggleWalletConnection);
    
    // Buy form
    buyForm.addEventListener('submit', handleBuy);
    buyAmount.addEventListener('input', updateBuyReceive);
    
    // Sell form
    sellForm.addEventListener('submit', handleSell);
    sellAmount.addEventListener('input', updateSellReceive);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Handle wallet connection
function toggleWalletConnection() {
    if (!isWalletConnected) {
        isWalletConnected = true;
        connectWalletBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
        connectWalletBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        showToast('Wallet connected successfully!', 'success');
    } else {
        isWalletConnected = false;
        connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        connectWalletBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        showToast('Wallet disconnected', 'error');
    }
}

// Handle buy transaction
function handleBuy(e) {
    e.preventDefault();
    
    if (!isWalletConnected) {
        showToast('Please connect your wallet first', 'error');
        return;
    }
    
    const usdtAmount = parseFloat(buyAmount.value);
    if (!usdtAmount || usdtAmount <= 0) {
        showToast('Please enter a valid USDT amount', 'error');
        return;
    }
    
    const totalCost = usdtAmount + centralPool.networkFee;
    if (totalCost > userUsdtBalance) {
        showToast('Insufficient USDT balance (including network fee)', 'error');
        return;
    }
    
    if (usdtAmount > centralPool.usdt) {
        showToast('Insufficient liquidity in the pool', 'error');
        return;
    }
    
    const klojiToReceive = usdtAmount / klojiPrice;
    if (klojiToReceive > centralPool.kloji) {
        showToast('Insufficient KLOJI in the pool', 'error');
        return;
    }
    
    // Execute transaction
    userUsdtBalance -= totalCost;
    userKlojiBalance += klojiToReceive;
    
    // Update central pool
    centralPool.usdt += usdtAmount;
    centralPool.kloji -= klojiToReceive;
    
    updatePortfolio();
    updateLiquidityPool();
    saveData();
    buyForm.reset();
    buyReceive.value = '';
    
    showToast(`Successfully bought ${klojiToReceive.toFixed(4)} KLOJI for ${usdtAmount} USDT!`, 'success');
}

// Handle sell transaction
function handleSell(e) {
    e.preventDefault();
    
    if (!isWalletConnected) {
        showToast('Please connect your wallet first', 'error');
        return;
    }
    
    const klojiAmount = parseFloat(sellAmount.value);
    if (!klojiAmount || klojiAmount <= 0) {
        showToast('Please enter a valid KLOJI amount', 'error');
        return;
    }
    
    if (klojiAmount > userKlojiBalance) {
        showToast('Insufficient KLOJI balance', 'error');
        return;
    }
    
    const usdtToReceive = klojiAmount * klojiPrice;
    const totalUsdtNeeded = usdtToReceive + centralPool.networkFee;
    
    if (totalUsdtNeeded > centralPool.usdt) {
        showToast('Insufficient USDT liquidity in the pool', 'error');
        return;
    }
    
    // Execute transaction
    userKlojiBalance -= klojiAmount;
    userUsdtBalance += usdtToReceive;
    
    // Update central pool
    centralPool.kloji += klojiAmount;
    centralPool.usdt -= totalUsdtNeeded;
    
    updatePortfolio();
    updateLiquidityPool();
    saveData();
    sellForm.reset();
    sellReceive.value = '';
    
    showToast(`Successfully sold ${klojiAmount.toFixed(4)} KLOJI for ${usdtToReceive.toFixed(2)} USDT!`, 'success');
}

// Update buy receive amount
function updateBuyReceive() {
    const usdtAmount = parseFloat(buyAmount.value) || 0;
    const klojiToReceive = usdtAmount / klojiPrice;
    buyReceive.value = klojiToReceive.toFixed(4);
}

// Update sell receive amount
function updateSellReceive() {
    const klojiAmount = parseFloat(sellAmount.value) || 0;
    const usdtToReceive = klojiAmount * klojiPrice;
    sellReceive.value = usdtToReceive.toFixed(2);
}

// Update portfolio display
function updatePortfolio() {
    // Force set balances to ensure they're correct
    userKlojiBalance = 10000000; // 10 million KLOJI
    userUsdtBalance = 400; // 400 USDT
    
    if (klojiBalanceEl) {
        klojiBalanceEl.textContent = userKlojiBalance.toLocaleString('en-US', {maximumFractionDigits: 2});
    }
    if (usdtBalanceEl) {
        usdtBalanceEl.textContent = userUsdtBalance.toLocaleString('en-US', {maximumFractionDigits: 2});
    }
    
    // Total value is set to 12000000000 USD
    const totalValue = 12000000000;
    if (totalValueEl) {
        totalValueEl.textContent = `$${totalValue.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
    }
    if (totalUsdtValueEl) {
        totalUsdtValueEl.textContent = `${totalValue.toLocaleString('en-US', {maximumFractionDigits: 2})} USD`;
    }
    
    // Calculate KLOJI USD value based on total
    const klojiUsdtValue = totalValue - userUsdtBalance;
    if (klojiUsdValueEl) {
        klojiUsdValueEl.textContent = `$${klojiUsdtValue.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
    }
    
    // Update price displays
    document.querySelectorAll('.current-price').forEach(el => {
        el.textContent = `$${klojiPrice.toFixed(2)}`;
    });
}

// Update liquidity pool display - waiting for real data
function updateLiquidityPool() {
    // Pool reserves - waiting for real data from backend
    if (poolKlojiEl) {
        if (centralPool.kloji !== null && centralPool.kloji !== undefined) {
            poolKlojiEl.textContent = centralPool.kloji.toLocaleString();
        } else {
            poolKlojiEl.textContent = 'Waiting for data...';
        }
    }
    if (poolUsdtEl) {
        if (centralPool.usdt !== null && centralPool.usdt !== undefined) {
            poolUsdtEl.textContent = centralPool.usdt.toLocaleString();
        } else {
            poolUsdtEl.textContent = 'Waiting for data...';
        }
    }
}

// Handle navigation
function handleNavigation(e) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
}

// Save data to localStorage (only save price, balances are fixed)
function saveData() {
    const data = {
        klojiPrice: klojiPrice,
        // Balances are fixed: klojiBalance = 10000000, usdtBalance = 400
        // Pool reserves are static - waiting for new numbers
    };
    localStorage.setItem('klojiExchangeData', JSON.stringify(data));
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastContent = toast.querySelector('.toast-content');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'toast-icon fas fa-check-circle';
    } else {
        toastIcon.className = 'toast-icon fas fa-exclamation-circle';
    }
    
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Removed simulatePriceUpdates() - no fake changing values
// Pool reserves are static and will be updated when new numbers are provided

// Add some interactive animations
function addAnimations() {
    // Animate portfolio cards on hover
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    portfolioCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Animate trading cards
    const tradingCards = document.querySelectorAll('.trading-card');
    tradingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', addAnimations);

// Add loading animation
function showLoading(element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

// Enhanced form validation
function validateAmount(amount, maxAmount, currency) {
    if (!amount || amount <= 0) {
        showToast(`Please enter a valid ${currency} amount`, 'error');
        return false;
    }
    
    if (amount > maxAmount) {
        showToast(`Insufficient ${currency} balance`, 'error');
        return false;
    }
    
    return true;
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.closest('form')) {
            activeElement.closest('form').dispatchEvent(new Event('submit'));
        }
    }
});

// Add responsive menu toggle for mobile
function setupMobileMenu() {
    const nav = document.querySelector('.nav');
    const header = document.querySelector('.header');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.style.display = 'none';
    
    header.insertBefore(mobileMenuBtn, nav);
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        nav.classList.toggle('mobile-open');
    });
    
    // Hide mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!header.contains(e.target)) {
            nav.classList.remove('mobile-open');
        }
    });
    
    // Show/hide mobile menu button based on screen size
    function handleResize() {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
            nav.classList.add('mobile-nav');
        } else {
            mobileMenuBtn.style.display = 'none';
            nav.classList.remove('mobile-nav', 'mobile-open');
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', setupMobileMenu);

// Add CSS for mobile menu
const mobileMenuCSS = `
    .mobile-menu-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #667eea;
        cursor: pointer;
        padding: 0.5rem;
    }
    
    .mobile-nav {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 1rem;
        border-radius: 0 0 15px 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
    }
    
    .mobile-nav.mobile-open {
        transform: translateY(0);
        opacity: 1;
    }
    
    @media (max-width: 768px) {
        .header {
            position: relative;
        }
    }
`;

// Inject mobile menu CSS
const style = document.createElement('style');
style.textContent = mobileMenuCSS;
document.head.appendChild(style); 