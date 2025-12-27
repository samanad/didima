#!/bin/bash

# ISPmanager Setup Script for Kloji.com
# Run this script on your ISPmanager server via SSH

set -e  # Exit on error

echo "========================================="
echo "Kloji.com ISPmanager Setup Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed.${NC}"
    echo "Please install Node.js first:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "  source ~/.bashrc"
    echo "  nvm install 18"
    echo "  nvm use 18"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}npm version: $NPM_VERSION${NC}"
echo ""

# Check if git is initialized
echo -e "${YELLOW}Checking Git repository...${NC}"
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing Git repository...${NC}"
    git init
    git remote add origin https://github.com/samanad/didima.git || echo "Remote already exists"
fi

# Pull latest code
echo -e "${YELLOW}Pulling latest code from GitHub...${NC}"
git fetch origin
git pull origin main || git pull origin master
echo -e "${GREEN}Code updated successfully${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}Dependencies installed successfully${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from env.example...${NC}"
    cp env.example .env
    echo -e "${GREEN}.env file created${NC}"
    echo -e "${YELLOW}Please edit .env file with your configuration:${NC}"
    echo "  nano .env"
    echo ""
    echo "Important settings to configure:"
    echo "  - PORT (default: 3000)"
    echo "  - NODE_ENV=production"
    echo "  - JWT_SECRET (generate a strong random string)"
    echo "  - SMTP settings (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)"
    echo "  - SMTP_FROM=info@samaneha.com"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi
echo ""

# Create public directory if it doesn't exist
if [ ! -d "public" ]; then
    echo -e "${YELLOW}Creating public directory...${NC}"
    mkdir -p public
    echo -e "${GREEN}Public directory created${NC}"
fi

# Set permissions
echo -e "${YELLOW}Setting file permissions...${NC}"
chmod 755 server.js
chmod -R 755 public/ 2>/dev/null || true
echo -e "${GREEN}Permissions set${NC}"
echo ""

# Create prices.json if it doesn't exist
if [ ! -f "prices.json" ]; then
    echo -e "${YELLOW}Creating prices.json file...${NC}"
    echo "[]" > prices.json
    chmod 644 prices.json
    echo -e "${GREEN}prices.json created${NC}"
fi
echo ""

echo "========================================="
echo -e "${GREEN}Setup completed successfully!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   nano .env"
echo ""
echo "2. Configure Node.js application in ISPmanager:"
echo "   - Go to WWW → Node.js applications"
echo "   - Create new application"
echo "   - Set Application root: $(pwd)"
echo "   - Set Application startup file: server.js"
echo "   - Set Node.js version: $(node --version | cut -d'v' -f2)"
echo "   - Set Application mode: production"
echo ""
echo "3. Start the application in ISPmanager panel"
echo ""
echo "4. Test the application:"
echo "   - https://kloji.com/"
echo "   - https://kloji.com/api/prices"
echo ""

