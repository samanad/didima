# Resolve Git Pull Conflicts

If you get "untracked working tree files would be overwritten" error:

## Option 1: Remove Conflicting Files (Recommended if you want fresh code)

```bash
# Remove the conflicting files
rm -f index.html package.json server.js

# Pull again
git pull origin main
```

## Option 2: Backup and Remove

```bash
# Create backup directory
mkdir -p /tmp/kloji-backup

# Move conflicting files to backup
mv index.html package.json server.js /tmp/kloji-backup/

# Pull again
git pull origin main
```

## Option 3: Force Pull (Overwrites local changes)

```bash
# Reset to match remote exactly
git fetch origin
git reset --hard origin/main
```

