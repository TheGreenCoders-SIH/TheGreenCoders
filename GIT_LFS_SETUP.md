# Git LFS Setup for Model Files

## What is Git LFS?

Git Large File Storage (Git LFS) is an extension that allows you to store large files (like ML models) efficiently in Git repositories. Instead of storing the actual file, Git stores a pointer, and the large file is stored on a separate server.

## Installation Steps

### 1. Install Git LFS

**Windows:**
```bash
# Download and install from: https://git-lfs.github.com/
# Or use chocolatey:
choco install git-lfs

# Or use winget:
winget install GitHub.GitLFS
```

**After installation, initialize Git LFS:**
```bash
git lfs install
```

### 2. Track Model Files

Navigate to your repository and track the model file types:

```bash
cd f:/TheGreenCoders/TheGreenCoders

# Track all .pth files (PyTorch models)
git lfs track "*.pth"

# Track all .pkl files (Pickle models)
git lfs track "*.pkl"

# Track all .h5 files (if you have any)
git lfs track "*.h5"
```

This creates/updates a `.gitattributes` file.

### 3. Add and Commit .gitattributes

```bash
git add .gitattributes
git commit -m "Configure Git LFS for model files"
```

### 4. Add Model Files

Now add your model files:

```bash
git add models/*.pth models/*.pkl
git commit -m "Add model files via Git LFS"
```

### 5. Push to GitHub

```bash
git push origin main
```

## Verify Git LFS is Working

Check if files are tracked by LFS:
```bash
git lfs ls-files
```

You should see your model files listed.

## Important Notes

1. **GitHub LFS Limits:**
   - Free accounts: 1 GB storage, 1 GB bandwidth per month
   - Paid accounts: More storage and bandwidth available
   - Your 4 model files (~360 MB total) should fit within the free tier

2. **Alternative: Remove .gitignore entries**
   
   If you don't want to use Git LFS, you can:
   - Remove `*.pth` and `*.pkl` from `.gitignore`
   - Commit the files normally
   - Accept GitHub's warnings (they're just warnings, not errors)

3. **Team Access:**
   - All team members will need Git LFS installed to clone/pull the repository
   - They'll automatically download the large files when they clone

## Troubleshooting

If you get errors about file size:
- Make sure Git LFS is installed: `git lfs version`
- Verify tracking: `git lfs track`
- Check status: `git lfs status`

## Quick Start Commands

```bash
# Install Git LFS (one-time setup)
git lfs install

# Track model files
git lfs track "*.pth"
git lfs track "*.pkl"

# Add and commit
git add .gitattributes
git add models/*.pth models/*.pkl
git commit -m "Add models via Git LFS"

# Push
git push origin main
```
