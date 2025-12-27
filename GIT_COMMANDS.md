# Useful Git Commands

## Pull Only Changed Files (Standard)

```bash
# Pull latest changes (only downloads what changed)
git pull origin main
```

## Pull Without Overwriting Local Changes

```bash
# Fetch changes first to see what's new
git fetch origin

# See what files changed
git diff HEAD origin/main --name-only

# Pull with rebase (keeps your local commits on top)
git pull --rebase origin main

# Or pull and merge (creates merge commit)
git pull origin main
```

## Pull Specific Files Only

```bash
# Fetch without merging
git fetch origin

# Checkout specific files from remote
git checkout origin/main -- path/to/file1.js path/to/file2.js

# Example: Pull only server.js
git checkout origin/main -- server.js
```

## See What Will Change Before Pulling

```bash
# Fetch changes
git fetch origin

# See list of files that changed
git diff --name-only HEAD origin/main

# See detailed changes
git diff HEAD origin/main

# See summary of commits
git log HEAD..origin/main --oneline
```

## Pull and Keep Local Changes

```bash
# Stash local changes
git stash

# Pull latest
git pull origin main

# Apply your local changes back
git stash pop
```

## Force Pull (Overwrite Local Changes)

```bash
# WARNING: This will overwrite local changes!
git fetch origin
git reset --hard origin/main
```

## Safe Pull (Recommended)

```bash
# 1. Check current status
git status

# 2. See what will change
git fetch origin
git log HEAD..origin/main --oneline

# 3. Pull changes
git pull origin main

# 4. If conflicts occur, resolve them
git status  # Shows conflicted files
# Edit conflicted files, then:
git add .
git commit -m "Resolve merge conflicts"
```

