# Quick Setup Guide for ISPmanager (www-root)

## Step 1: SSH into Your Server

```bash
ssh www-root@your-server-ip
```

## Step 2: Navigate to Domain Directory

```bash
cd /var/www/www-root/data/www/kloji.com
```

## Step 3: Initialize Git and Pull Code

```bash
# Initialize git if needed
git init

# Add remote
git remote add origin https://github.com/samanad/didima.git

# Pull latest code
git pull origin main
```

## Step 4: Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check Node.js/npm installation
- Install all dependencies
- Create `.env` file from `env.example`
- Set up necessary files and permissions

## Step 5: Configure .env File

```bash
nano .env
```

**Minimum required settings:**
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-very-long-random-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=info@samaneha.com
```

**Note:** MongoDB and Redis are optional - the app will work without them.

## Step 6: Configure in ISPmanager Panel

1. Log into ISPmanager
2. Go to **WWW** → **Node.js applications**
3. Click **Create** (or edit existing)
4. Set:
   - **Domain**: `kloji.com`
   - **Application root**: `/var/www/www-root/data/www/kloji.com`
   - **Application startup file**: `server.js`
   - **Node.js version**: 18.x or higher (check with `node --version` on server)
   - **Application mode**: `production`
   - **Port**: `3000` (or let ISPmanager assign one)

5. Click **Save** and then **Start**

## Step 7: Verify

Test these URLs:
- `https://kloji.com/` - Homepage
- `https://kloji.com/api/prices` - Should return `[]`
- `https://kloji.com/api/test-smtp?email=test@example.com` - SMTP test (admin IP: 165.22.58.120 only)

## Troubleshooting

### Check Logs
In ISPmanager: **WWW** → **Node.js applications** → Select your app → **Logs**

Or via SSH:
```bash
tail -f /var/log/ispmanager/nodejs/kloji.com.log
```

### Check if Running
```bash
ps aux | grep node
```

### Test Manually
```bash
cd /var/www/www-root/data/www/kloji.com
node server.js
```

### Common Issues

1. **Port conflict**: Change `PORT` in `.env` to a different port
2. **Permission denied**: 
   ```bash
   chmod 755 server.js
   chmod -R 755 public/
   ```
3. **Module errors**: Run `npm install` again
4. **Application won't start**: Check logs for specific error messages

