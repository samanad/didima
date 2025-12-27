# Kloji Token Exchange

A modern, responsive web application for buying and selling Kloji (KLOJI) tokens with integrated price tracking. Built with HTML5, CSS3, and vanilla JavaScript, this platform provides a seamless trading experience with real-time price updates and portfolio management.

## 🌟 Features

### Price Tracker (New!)
- **IP-based Admin Verification**: Only the specified admin IP (165.22.58.120) can add new prices
- **Price Entry**: Admin can enter current $kloji prices in USD
- **Interactive Chart**: Visualizes price history over time using Chart.js
- **Real-time Updates**: Chart automatically updates when new prices are added
- **Historical Data**: All prices are stored with timestamps for complete price history

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
- Node.js (>=16.0.0)
- npm or yarn
- MongoDB (for backend features)
- Redis (optional, for session storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/samanad/didima.git
   cd didima
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 📱 Usage

### Price Tracker (Admin)
- The system will automatically verify your IP address
- If you're accessing from the admin IP (165.22.58.120), you'll see the admin panel
- Enter the current price of $kloji in dollars and click "Add Price"
- The chart will update automatically showing all historical prices

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
├── index.html          # Main HTML file with price tracker
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── server.js           # Express backend server
├── routes/             # API route handlers
├── models/             # Database models
├── middleware/         # Express middleware
├── config/             # Configuration files
├── services/           # Business logic services
├── prices.json         # Price data storage
└── README.md           # Project documentation
```

### Technologies Used
- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: MongoDB, Redis
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

### API Endpoints

#### Price Tracker
- `GET /api/prices` - Get all price history
- `POST /api/prices` - Add new price (admin only, IP: 165.22.58.120)

#### Other Endpoints
- `GET /health` - Health check
- `/api/auth/*` - Authentication routes
- `/api/trading/*` - Trading routes
- `/api/portfolio/*` - Portfolio routes
- `/api/liquidity/*` - Liquidity pool routes
- `/api/blockchain/*` - Blockchain integration routes

### Data Storage

#### Price Tracker
Prices are stored in `prices.json` with timestamps. Each entry includes:
- `price`: The price value in USD
- `timestamp`: ISO timestamp of when the price was added

#### User Data
- **KLOJI Balance**: Stored in localStorage
- **USD Balance**: Stored in localStorage
- **Price History**: Simulated real-time updates

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

## 🔧 Configuration

### Price Tracker
To change the admin IP, edit the `ADMIN_IP` constant in `server.js`:
```javascript
const ADMIN_IP = '165.22.58.120';
```

### Environment Variables
See `env.example` for required environment variables.

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

### Production Setup
1. Set up environment variables
2. Configure MongoDB and Redis
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates
5. Set up process manager (PM2 recommended)

### Other Hosting Platforms
- **Netlify**: For static frontend
- **Vercel**: Connect your GitHub repository
- **Heroku**: Full-stack deployment
- **AWS**: EC2 or Elastic Beanstalk
- **DigitalOcean**: Droplet with Node.js

## 🔮 Future Enhancements

- [x] Price tracking with admin IP verification
- [x] Interactive price charts
- [ ] Real blockchain integration
- [ ] Multiple token support
- [ ] Advanced charting features
- [ ] Order book functionality
- [ ] User authentication
- [ ] Transaction history
- [ ] API integration for real prices
- [ ] Dark mode toggle
- [ ] PWA capabilities

---

**Built with ❤️ for the Kloji community**
