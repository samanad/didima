# Troubleshooting "Failed to Start Node.js" Error

## Step 1: Check Application Logs

In ISPmanager:
- Go to **WWW** → **Node.js applications**
- Select your application
- Click **Logs**
- Look for error messages

Or via SSH:
```bash
tail -f /var/log/ispmanager/nodejs/kloji.com.log
# Or
tail -f /var/www/www-root/data/www/kloji.com/logs/*.log
```

## Step 2: Check Node.js Version

```bash
node --version
```

**Must be 18.0.0 or higher!** If it's 16.x, you need to upgrade.

## Step 3: Test Server Manually

```bash
cd /var/www/www-root/data/www/kloji.com

# Test if server starts manually
node server.js
```

This will show you the exact error message.

## Step 4: Check Dependencies

```bash
cd /var/www/www-root/data/www/kloji.com

# Check if node_modules exists
ls -la node_modules/

# If missing or incomplete, reinstall
npm install
```

## Step 5: Check .env File

```bash
cd /var/www/www-root/data/www/kloji.com

# Check if .env exists
ls -la .env

# View .env content (check for syntax errors)
cat .env
```

Common .env issues:
- Missing required variables
- Syntax errors (quotes, spaces)
- Wrong socket path

## Step 6: Check File Permissions

```bash
cd /var/www/www-root/data/www/kloji.com

# Check permissions
ls -la server.js
ls -la package.json

# Fix if needed
chown www-root:www-root server.js package.json
chmod 755 server.js
```

## Step 7: Check Socket File Path

```bash
# Verify socket directory exists
ls -la /var/www/www-root/data/nodejs/

# Check if socket file path in .env matches ISPmanager
cat .env | grep SOCKET_PATH
```

## Step 8: Common Error Messages and Fixes

### "Cannot find module"
```bash
npm install
```

### "Port already in use"
- Change PORT in .env or use socket file instead

### "EADDRINUSE"
- Another process is using the port/socket
- Kill the process or change port

### "SyntaxError" or "ParseError"
- Check server.js for syntax errors
- Run: `node -c server.js` to check syntax

### "ENOENT: no such file or directory"
- Missing file (check paths in .env)
- Missing directory (create it)

### "Permission denied"
```bash
chown -R www-root:www-root /var/www/www-root/data/www/kloji.com
chmod 755 server.js
```

## Step 9: Minimal Test

Create a minimal test server:

```bash
cd /var/www/www-root/data/www/kloji.com

# Create test.js
cat > test.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});
server.listen(3000, () => {
  console.log('Test server running on port 3000');
});
EOF

# Test it
node test.js
```

If this works, the issue is with server.js or dependencies.

## Step 10: Check ISPmanager Configuration

In ISPmanager panel, verify:
- **Application root**: `/var/www/www-root/data/www/kloji.com`
- **Application startup file**: `server.js` (not `app.js` or `index.js`)
- **Node.js version**: 18.x or higher
- **Connection method**: Socket file or TCP/IP (match your .env)
- **Socket path**: `/var/www/www-root/data/nodejs/1.sock` (if using socket)

## Quick Fix Commands

```bash
cd /var/www/www-root/data/www/kloji.com

# 1. Pull latest code
git pull origin main

# 2. Ensure .env exists
cp env.example .env
nano .env  # Edit with your settings

# 3. Install dependencies
npm install

# 4. Fix permissions
chown -R www-root:www-root .
chmod 755 server.js

# 5. Test manually
node server.js
```

If manual test works but ISPmanager doesn't, check ISPmanager logs and configuration.

