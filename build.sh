#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Build Process ---"

echo "Cleaning up old build..."
rm -rf dist

echo "Installing dependencies..."
npm install --production=false

echo "Compiling TypeScript..."
npx tsc

echo "--- Build Completed Successfully! ---"
