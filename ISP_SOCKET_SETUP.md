# ISPmanager Socket File Setup for Kloji.com

## Your Socket File Path
```
/var/www/www-root/data/nodejs/1.sock
```

## Configuration Steps

### 1. Update .env File

On your server, edit the `.env` file:

```bash
cd /var/www/www-root/data/www/kloji.com
nano .env
```

Add or update these lines:

```env
# Socket file configuration (ISPmanager)
SOCKET_PATH=/var/www/www-root/data/nodejs/1.sock

# Don't set PORT when using socket file
# PORT=3000

# Other required settings
NODE_ENV=production
JWT_SECRET=your-very-long-random-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=info@samaneha.com
```

### 2. Verify Socket Directory Exists

```bash
# Check if the directory exists
ls -la /var/www/www-root/data/nodejs/

# If it doesn't exist, create it (ISPmanager usually creates it)
mkdir -p /var/www/www-root/data/nodejs/
chown www-root:www-root /var/www/www-root/data/nodejs/
chmod 755 /var/www/www-root/data/nodejs/
```

### 3. In ISPmanager Panel

1. Go to **WWW** → **Node.js applications**
2. Select your application (kloji.com)
3. Verify:
   - **Connection method**: `Socket file`
   - **Socket file path**: `/var/www/www-root/data/nodejs/1.sock`
   - **Application root**: `/var/www/www-root/data/www/kloji.com`
   - **Application startup file**: `server.js`
   - **Node.js version**: 18.x or higher

### 4. Restart Application

In ISPmanager, click **Restart** on your Node.js application.

### 5. Check Logs

```bash
# View application logs
tail -f /var/log/ispmanager/nodejs/kloji.com.log

# Or in ISPmanager: Node.js applications → Your app → Logs
```

You should see:
```
🚀 Kloji Exchange Backend running on socket: /var/www/www-root/data/nodejs/1.sock
```

### 6. Test the Application

```bash
# Test via web
curl https://kloji.com/health

# Should return: {"status":"ok","message":"Kloji Exchange Backend is running"}
```

## Troubleshooting

### Socket File Not Created

If the socket file doesn't appear:

1. Check application logs for errors
2. Verify `.env` file has correct `SOCKET_PATH`
3. Check file permissions:
   ```bash
   ls -la /var/www/www-root/data/nodejs/1.sock
   ```

### Permission Denied

```bash
# Fix socket permissions (ISPmanager usually handles this)
chown www-root:www-root /var/www/www-root/data/nodejs/1.sock
chmod 666 /var/www/www-root/data/nodejs/1.sock
```

### Application Won't Start

1. Check Node.js version: `node --version` (should be 18+)
2. Check if dependencies are installed: `npm list`
3. Check logs in ISPmanager panel

