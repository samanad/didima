# Step-by-Step ISPmanager Setup (Run as root)

## Step 1: Fix Git Ownership and Add Remote

```bash
# Add safe directory (if still needed)
git config --global --add safe.directory /var/www/www-root/data/www/kloji.com

# Add the remote repository
git remote add origin https://github.com/samanad/didima.git

# Verify remote was added
git remote -v

# Pull the code
git pull origin main
```

## Step 2: If Pull Fails, Try Clone Instead

If the directory is empty or pull doesn't work:

```bash
# Go to parent directory
cd /var/www/www-root/data/www/

# Remove empty kloji.com directory
rm -rf kloji.com

# Clone the repository
git clone https://github.com/samanad/didima.git kloji.com

# Enter the directory
cd kloji.com
```

## Step 3: Run Setup

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

## Step 4: Configure .env

```bash
# Copy example file
cp env.example .env

# Edit the file
nano .env
```

## Step 5: Set Proper Ownership (Important!)

```bash
# Change ownership to www-root
chown -R www-root:www-root /var/www/www-root/data/www/kloji.com
```

