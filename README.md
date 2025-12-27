# $kloji Price Tracker

A web application for tracking and visualizing $kloji token prices over time with admin IP verification.

## Features

- **IP-based Admin Verification**: Only the specified admin IP (165.22.58.120) can add new prices
- **Price Entry**: Admin can enter current $kloji prices in USD
- **Interactive Chart**: Visualizes price history over time using Chart.js
- **Real-time Updates**: Chart automatically updates when new prices are added

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

- The system will automatically verify your IP address
- If you're accessing from the admin IP, you'll see the admin panel
- Enter the current price of $kloji in dollars and click "Add Price"
- The chart will update automatically showing all historical prices

## Data Storage

Prices are stored in `prices.json` with timestamps. Each entry includes:
- `price`: The price value in USD
- `timestamp`: ISO timestamp of when the price was added

## Configuration

To change the admin IP, edit the `ADMIN_IP` constant in `server.js`.

