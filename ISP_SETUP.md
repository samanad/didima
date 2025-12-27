# ISPmanager Setup Guide

## Step 1: Access Your Server via SSH

Connect to your ISPmanager server via SSH:
```bash
ssh your-username@your-server-ip
```

## Step 2: Navigate to Your Domain Directory

In ISPmanager, your domain files are typically located at:
```bash
cd /var/www/your-username/data/www/kloji.com
```
or
```bash
cd /home/your-username/kloji.com
```

Check your ISPmanager panel for the exact path.

## Step 3: Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized, initialize it
git init

# Add remote repository
git remote add origin https://github.com/samanad/didima.git

# Pull the latest code
git pull origin main
```

## Step 4: Install Node.js and npm (if not installed)

Check if Node.js is installed:
```bash
node --version
npm --version
```

If not installed, install Node.js (version 18 or higher recommended):
```bash
# Using NodeSource (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Create .env File

```bash
cp env.example .env
nano .env
```

Edit the `.env` file with your configuration:
- Set `PORT=3000` (or the port ISPmanager assigns)
- Set `NODE_ENV=production`
- Configure MongoDB URI if you have MongoDB
- Configure Redis URL if you have Redis
- Set `JWT_SECRET` to a strong random string
- Configure SMTP settings:
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=your-email@gmail.com`
  - `SMTP_PASS=your-app-password`
  - `SMTP_FROM=info@samaneha.com`

## Step 7: Configure ISPmanager Node.js Application

1. Log into ISPmanager panel
2. Go to **WWW** → **Node.js applications**
3. Click **Create**
4. Configure:
   - **Domain**: kloji.com
   - **Application root**: `/var/www/your-username/data/www/kloji.com` (or your path)
   - **Application startup file**: `server.js`
   - **Node.js version**: 18.x or higher
   - **Application mode**: production
   - **Port**: 3000 (or auto-assigned)
   - **Environment variables**: Load from `.env` file

## Step 8: Set Up Reverse Proxy (if needed)

If ISPmanager doesn't automatically set up the reverse proxy:

1. Go to **WWW** → **WWW domains**
2. Select your domain (kloji.com)
3. Enable **Proxy** and set:
   - **Proxy URL**: `http://localhost:PORT` (where PORT is from Step 7)
   - **Proxy path**: `/`

## Step 9: Start the Application

In ISPmanager Node.js applications panel, click **Start** or **Restart**.

## Step 10: Verify Installation

Test the endpoints:
- `https://kloji.com/` - Should show the homepage
- `https://kloji.com/api/prices` - Should return `[]`
- `https://kloji.com/api/test-smtp` - Should test SMTP (admin IP only: 165.22.58.120)

## Troubleshooting

### Check Application Logs
```bash
# In ISPmanager, go to Node.js applications → Logs
# Or via SSH:
tail -f /var/log/ispmanager/nodejs/kloji.com.log
```

### Check if Application is Running
```bash
ps aux | grep node
```

### Test Locally on Server
```bash
cd /path/to/your/app
node server.js
```

### Common Issues

1. **Port already in use**: Change PORT in `.env` file
2. **Permission denied**: Check file permissions:
   ```bash
   chmod 755 server.js
   chmod -R 755 public/
   ```
3. **Module not found**: Run `npm install` again
4. **Cannot connect to MongoDB/Redis**: These are optional - the app will start without them

## File Structure

Your application should have:
```
kloji.com/
├── server.js          # Main application file
├── package.json       # Dependencies
├── .env              # Environment variables (create from env.example)
├── public/           # Static files
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── config/           # Configuration files
├── routes/           # API routes
├── models/           # Database models
└── middleware/       # Express middleware
```

## Security Notes

- Never commit `.env` file to git
- Keep `JWT_SECRET` secure and random
- Use strong passwords for database connections
- Enable HTTPS in ISPmanager
- Keep Node.js and dependencies updated

