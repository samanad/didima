# ISPmanager Socket File Configuration

## Connection Methods in ISPmanager

ISPmanager supports two connection methods for Node.js applications:

### 1. Socket File (Recommended)
- More efficient
- Better performance
- No port conflicts
- Path: Usually `/var/www/www-root/data/www/kloji.com/tmp/app.sock`

### 2. TCP/IP (Port-based)
- Traditional method
- Uses a port number (e.g., 3000)
- May conflict with other services

## How to Configure Socket File Method

### In ISPmanager Panel:

1. Go to **WWW** → **Node.js applications**
2. Create or edit your application
3. Set **Connection method**: `Socket file`
4. **Socket file path**: `/var/www/www-root/data/www/kloji.com/tmp/app.sock`
   - ISPmanager may auto-generate this path
   - Or you can specify a custom path

### In .env File:

```env
# Comment out or remove PORT when using socket file
# PORT=3000

# Set the socket path (ISPmanager will provide this)
SOCKET_PATH=/var/www/www-root/data/www/kloji.com/tmp/app.sock
```

### Create Socket Directory:

```bash
# Create the tmp directory for socket file
mkdir -p /var/www/www-root/data/www/kloji.com/tmp
chown www-root:www-root /var/www/www-root/data/www/kloji.com/tmp
chmod 755 /var/www/www-root/data/www/kloji.com/tmp
```

## How to Configure TCP/IP Method

### In ISPmanager Panel:

1. Go to **WWW** → **Node.js applications**
2. Create or edit your application
3. Set **Connection method**: `TCP/IP`
4. **Port**: `3000` (or any available port)

### In .env File:

```env
PORT=3000
# Don't set SOCKET_PATH when using TCP/IP
```

## Which Method to Use?

- **Socket File**: Better for production, more secure, better performance
- **TCP/IP**: Easier to debug, can test with curl/browser directly

## Testing

### Socket File Method:
```bash
# Test via nginx/apache (ISPmanager handles this)
curl https://kloji.com/health
```

### TCP/IP Method:
```bash
# Test directly
curl http://localhost:3000/health
```

## Troubleshooting

### Socket File Issues:

1. **Permission denied**: 
   ```bash
   chown www-root:www-root /path/to/socket.sock
   chmod 666 /path/to/socket.sock
   ```

2. **Socket file not created**: Check application logs in ISPmanager

3. **Connection refused**: Make sure the application is running and socket path is correct

### TCP/IP Issues:

1. **Port already in use**: Change PORT in .env to a different port
2. **Connection refused**: Check if application is running and firewall allows the port

