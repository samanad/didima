# Kloji Exchange Backend

A comprehensive Node.js backend for the Kloji Token Exchange platform with USDT BEP20 integration, real-time trading, and blockchain connectivity.

## 🚀 Features

### Core Functionality
- **User Authentication & Management**: JWT-based authentication with role-based access control
- **Trading Engine**: Real-time buy/sell orders with USDT BEP20 integration
- **Portfolio Management**: Track user balances and performance
- **Central Liquidity Pool**: Shared liquidity across multiple platforms
- **Blockchain Integration**: BSC network support with USDT and KLOJI tokens
- **Real-time Updates**: Socket.IO for live trading updates

### Security Features
- **Rate Limiting**: API rate limiting and abuse prevention
- **Input Validation**: Comprehensive request validation
- **Password Security**: Bcrypt hashing with account lockout
- **Session Management**: Redis-based session storage
- **CORS Protection**: Configurable cross-origin resource sharing

### Database & Caching
- **MongoDB**: Primary database with Mongoose ODM
- **Redis**: Caching and session storage
- **Indexing**: Optimized database queries
- **Data Persistence**: Transaction history and audit trails

## 🛠️ Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Blockchain**: Web3.js, Ethers.js
- **Real-time**: Socket.IO
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- Redis 6.0+
- Git

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/samanad/didima.git
cd didima
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment template and configure your settings:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/kloji_exchange
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Blockchain Configuration
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
BSC_CHAIN_ID=56
PRIVATE_KEY=your-private-key-here

# Contract Addresses
USDT_CONTRACT_ADDRESS=0x55d398326f99059fF775485246999027B3197955
KLOJI_CONTRACT_ADDRESS=your-kloji-contract-address-here
```

### 4. Database Setup
Start MongoDB and Redis:
```bash
# MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Redis (Ubuntu/Debian)
sudo systemctl start redis-server
```

### 5. Run Database Migration
```bash
npm run migrate
```

### 6. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john@example.com",
  "password": "SecurePass123"
}
```

#### Connect Wallet
```http
POST /api/auth/connect-wallet
Authorization: Bearer <token>
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

### Trading Endpoints

#### Get Current Price
```http
GET /api/trading/price
```

#### Calculate Trade
```http
POST /api/trading/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100,
  "token": "USDT",
  "type": "buy"
}
```

#### Execute Buy Order
```http
POST /api/trading/buy
Authorization: Bearer <token>
Content-Type: application/json

{
  "usdtAmount": 100
}
```

#### Execute Sell Order
```http
POST /api/trading/sell
Authorization: Bearer <token>
Content-Type: application/json

{
  "klojiAmount": 50
}
```

### Portfolio Endpoints

#### Get Portfolio
```http
GET /api/portfolio
Authorization: Bearer <token>
```

#### Get Performance
```http
GET /api/portfolio/performance?period=30d
Authorization: Bearer <token>
```

#### Get Allocation
```http
GET /api/portfolio/allocation
Authorization: Bearer <token>
```

### Liquidity Pool Endpoints

#### Get Pool Status
```http
GET /api/liquidity/status
```

#### Get Price History
```http
GET /api/liquidity/price-history?hours=24
```

### Blockchain Endpoints

#### Get Service Status
```http
GET /api/blockchain/status
```

#### Get Gas Price
```http
GET /api/blockchain/gas-price
```

#### Validate Address
```http
POST /api/blockchain/validate-address
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/kloji_exchange |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `JWT_SECRET` | JWT signing secret | fallback-secret |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `BSC_RPC_URL` | BSC RPC endpoint | https://bsc-dataseed1.binance.org/ |
| `BSC_CHAIN_ID` | BSC network ID | 56 |
| `PRIVATE_KEY` | Central wallet private key | - |
| `USDT_CONTRACT_ADDRESS` | USDT BEP20 contract | 0x55d398326f99059fF775485246999027B3197955 |
| `KLOJI_CONTRACT_ADDRESS` | KLOJI token contract | - |

### Database Configuration

The backend uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `portfolios` - User portfolio balances
- `transactions` - Trading history
- `liquiditypools` - Central liquidity pool data

### Redis Configuration

Redis is used for:
- Session storage
- API response caching
- Rate limiting
- Real-time data caching

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   JWT_SECRET=<strong-secret-key>
   MONGODB_URI=<production-mongodb-uri>
   REDIS_URL=<production-redis-uri>
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name "kloji-backend"
   pm2 startup
   pm2 save
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t kloji-backend .
docker run -p 3000:3000 --env-file .env kloji-backend
```

## 🔒 Security Considerations

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

### Authentication Security
- JWT token expiration
- Password complexity requirements
- Account lockout after failed attempts
- Secure session management

### Blockchain Security
- Private key management
- Transaction validation
- Gas estimation
- Error handling for failed transactions

## 📊 Monitoring & Logging

### Health Check
```http
GET /health
```

### Logging
The backend uses Morgan for HTTP request logging and custom error logging.

### Metrics
- Request/response times
- Error rates
- Database query performance
- Blockchain transaction success rates

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### API Testing
Use tools like Postman or curl to test the API endpoints.

## 🔄 Database Migrations

### Run Migration
```bash
npm run migrate
```

### Migration Features
- Creates default liquidity pool
- Sets up database indexes
- Initializes default data structures

## 📱 Real-time Features

### WebSocket Events

#### Client Events
- `join-trading` - Join trading room
- `disconnect` - Handle disconnection

#### Server Events
- `trade-executed` - Trade completion notification
- Portfolio balance updates
- Price change notifications

### Socket.IO Integration
```javascript
// Client connection
const socket = io('http://localhost:3000');

socket.emit('join-trading', userId);

socket.on('trade-executed', (data) => {
  console.log('Trade executed:', data);
});
```

## 🚀 Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed data
- Database query optimization
- Indexed database collections

### Rate Limiting
- Per-user rate limiting
- Global API rate limiting
- Configurable limits and windows

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in .env
   - Check network connectivity

2. **Redis Connection Error**
   - Check if Redis is running
   - Verify Redis URL in .env
   - Check Redis configuration

3. **Blockchain Connection Error**
   - Verify BSC RPC URL
   - Check network connectivity
   - Verify contract addresses

4. **JWT Token Issues**
   - Check JWT_SECRET in .env
   - Verify token expiration
   - Check token format in headers

### Debug Mode
```bash
NODE_ENV=development DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting section

---

**Built with ❤️ for the Kloji community**
