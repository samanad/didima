# Upgrade Node.js on ISPmanager Server

## Current Issue
- Node.js version: 16.20.2 (too old)
- Required: Node.js 18+ 
- npm install was killed (likely memory/timeout issue)

## Solution: Upgrade Node.js

### Option 1: Using NVM (Recommended)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version
npm --version
```

### Option 2: Using NodeSource (Ubuntu/Debian)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Option 3: Using ISPmanager Panel

1. Log into ISPmanager
2. Go to **System** → **Node.js**
3. Install Node.js 18.x or higher
4. Select it as the default version

## After Upgrading Node.js

```bash
# Navigate to project
cd /var/www/www-root/data/www/kloji.com

# Clear npm cache
npm cache clean --force

# Try install again (with more memory if needed)
NODE_OPTIONS="--max-old-space-size=4096" npm install

# Or just regular install
npm install
```

## If npm install Still Gets Killed

Try installing with less memory usage:

```bash
# Install with reduced memory
NODE_OPTIONS="--max-old-space-size=2048" npm install --no-audit --no-fund
```

Or install dependencies one by one (slower but uses less memory).

