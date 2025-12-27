# Fix Git Ownership Issue

If you get "fatal: detected dubious ownership" error, run:

```bash
git config --global --add safe.directory /var/www/www-root/data/www/kloji.com
```

Then continue with:
```bash
git pull origin main
```

## Alternative: Fix Ownership

If you want to change ownership instead:

```bash
# Change ownership to www-root user
chown -R www-root:www-root /var/www/www-root/data/www/kloji.com

# Then switch to www-root user
su - www-root
cd /var/www/www-root/data/www/kloji.com
git pull origin main
```

