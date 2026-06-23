#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Build Process ---"

# 1. Clean up any leftover build artifacts (optional but recommended)
echo "Cleaning up old build..."
rm -rf dist

# 2. Force npm to install ALL dependencies, including devDependencies
# This prevents the "Cannot find module" and "@types/node" errors during build,
# even if NODE_ENV is set to production.
echo "Installing dependencies..."
npm install --production=false

# 3. Compile the TypeScript code
echo "Compiling TypeScript..."
npm run build

echo "--- Build Completed Successfully! ---"
