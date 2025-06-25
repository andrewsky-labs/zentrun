# 🐧 Zentrun Linux Build Guide

## 🧩 Overview

This document describes how to build the Zentrun application in a low-glibc Linux environment using Docker. The goal is to ensure the generated binary is compatible with most Linux distributions.

---

## ⚙️ Technical Implementation

### Build Environment

- **Base image**: `node:22-slim` (Debian-based, stable)
- **Node.js version**: 22.x
- **Build tool**: `npm` (configured to use Taobao registry for faster package downloads)

---

## 🚀 Usage Instructions

### Build Steps

1. Make sure Docker is installed and running
2. Run the following commands to build:

```bash
# Build the Docker image
docker build -t zentrun-builder -f Dockerfile.build.linux .

# Run the build
docker run --rm -v $(pwd):/app/dist zentrun-builder
```

### Output

After a successful build, the `dist` directory will contain:

- The Linux executable
- All required dependencies and assets
- Either an AppImage or `.deb` package (depending on build config)

---

## ⚠️ Notes

1. Build time may be long – please be patient
2. Make sure you have at least **10GB of free disk space**
3. The default npm registry is set to **Taobao mirror** to speed up dependency downloads
4. To change the npm registry, modify the related configuration in the Dockerfile
5. The output binary will inherit the `glibc` version of the base image for better compatibility

---

## 🛠 Common Issues

### 1. **Build Fails**
- Check your internet connection
- Ensure you have enough disk space
- Review Docker logs for detailed errors

### 2. **Dependency Issues**
- Some system-level packages may need manual installation
- Ensure `node-gyp` is installed properly
- If download issues occur, verify your npm registry settings

### 3. **Permission Problems**
- Make sure Docker has permission to access your project directory
- Check ownership and access rights of the generated files

---

## 🆘 Support

If you encounter problems:

1. Check the build logs
2. Verify system requirements
3. Search for related issues in the project’s GitHub Issues
4. Still stuck? Open a new issue with detailed error logs
