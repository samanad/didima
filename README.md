# Kloji Token Exchange

A modern, responsive web application for buying and selling Kloji (KLOJI) tokens. Built with HTML5, CSS3, and vanilla JavaScript, this platform provides a seamless trading experience with real-time price updates and portfolio management.

## 🌟 Features

### Trading Functionality
- **Buy KLOJI Tokens**: Purchase tokens using USD with real-time price calculations
- **Sell KLOJI Tokens**: Sell tokens for USD with instant conversion
- **Real-time Price Updates**: Simulated price fluctuations every 10 seconds
- **Live Portfolio Tracking**: Monitor your KLOJI and USD balances

### User Experience
- **Wallet Connection**: Simulated wallet connection for trading
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive UI**: Smooth animations and hover effects
- **Toast Notifications**: Real-time feedback for all transactions
- **Local Storage**: Persistent data storage for user balances

### Modern Design
- **Glassmorphism Effects**: Beautiful backdrop blur and transparency
- **Gradient Backgrounds**: Eye-catching color schemes
- **Smooth Animations**: CSS transitions and JavaScript animations
- **Professional Layout**: Clean, organized interface

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/samanad/didima.git
   cd didima
   ```

2. Open the project:
   - Simply open `index.html` in your web browser
   - Or use a local server for development

### Using a Local Server (Optional)
If you want to run it on a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 📱 Usage

### Connecting Your Wallet
1. Click the "Connect Wallet" button in the header
2. The button will change to "Connected" with a green background
3. You can now perform trading operations

### Buying KLOJI Tokens
1. Navigate to the "Trade" section
2. In the "Buy KLOJI" card, enter the USD amount you want to spend
3. The KLOJI amount you'll receive will be calculated automatically
4. Click "Buy KLOJI" to complete the transaction

### Selling KLOJI Tokens
1. In the "Sell KLOJI" card, enter the KLOJI amount you want to sell
2. The USD amount you'll receive will be calculated automatically
3. Click "Sell KLOJI" to complete the transaction

### Viewing Your Portfolio
- Navigate to the "Portfolio" section to see your current balances
- Your total portfolio value is calculated in real-time
- Balances are automatically updated after each transaction

## 🛠️ Technical Details

### File Structure
```
didima/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # Project documentation
```

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Interactive functionality and data management
- **Font Awesome**: Icons for enhanced UI
- **Google Fonts**: Inter font family for typography

### Key Features Implementation

#### Real-time Price Simulation
```javascript
function simulatePriceUpdates() {
    setInterval(() => {
        const changePercent = (Math.random() - 0.5) * 0.1;
        klojiPrice *= (1 + changePercent);
        klojiPrice = Math.max(0.1, Math.min(2.0, klojiPrice));
        updatePortfolio();
    }, 10000);
}
```

#### Local Storage for Data Persistence
```javascript
function saveData() {
    const data = {
        klojiBalance: userKlojiBalance,
        usdBalance: userUsdBalance,
        klojiPrice: klojiPrice
    };
    localStorage.setItem('klojiExchangeData', JSON.stringify(data));
}
```

#### Responsive Design
The website uses CSS Grid and Flexbox for responsive layouts:
- Desktop: Full layout with side-by-side trading cards
- Tablet: Adjusted spacing and font sizes
- Mobile: Single-column layout with mobile menu

## 🎨 Design Features

### Color Scheme
- **Primary**: Purple gradient (#667eea to #764ba2)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)
- **Background**: Gradient with glassmorphism effects

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Responsive**: Scales appropriately on different screen sizes

### Animations
- **Hover Effects**: Cards lift and scale on hover
- **Transitions**: Smooth color and transform transitions
- **Loading States**: Visual feedback during operations

## 📊 Data Management

### User Data
- **KLOJI Balance**: Stored in localStorage
- **USD Balance**: Stored in localStorage
- **Price History**: Simulated real-time updates

### Transaction History
- All transactions are logged with timestamps
- Success/error messages displayed via toast notifications
- Data persists across browser sessions

## 🔧 Customization

### Modifying the Token
To change the token name or symbol:
1. Update the title in `index.html`
2. Replace "KLOJI" with your token name in the HTML
3. Update the JavaScript variables in `script.js`

### Changing Colors
Modify the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #10b981;
    --error-color: #ef4444;
}
```

### Adding New Features
The modular JavaScript structure makes it easy to add new features:
- Add new event listeners in `setupEventListeners()`
- Create new functions for additional functionality
- Extend the UI with new HTML sections

## 🌐 Browser Support

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need support:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🚀 Deployment

### GitHub Pages
1. Push your code to the repository
2. Go to Settings > Pages
3. Select the source branch (usually `main`)
4. Your site will be available at `https://username.github.io/didima`

### Other Hosting Platforms
- **Netlify**: Drag and drop the project folder
- **Vercel**: Connect your GitHub repository
- **Firebase**: Use Firebase Hosting
- **AWS S3**: Upload files to S3 bucket

## 🔮 Future Enhancements

- [ ] Real blockchain integration
- [ ] Multiple token support
- [ ] Advanced charting
- [ ] Order book functionality
- [ ] User authentication
- [ ] Transaction history
- [ ] API integration for real prices
- [ ] Dark mode toggle
- [ ] PWA capabilities

---

**Built with ❤️ for the Kloji community** 