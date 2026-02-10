#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install and Build Frontend
echo "Building Frontend..."
cd frontend
# Force install devDependencies (vite) even if NODE_ENV=production
npm install --include=dev
npm run build
cd ..

# 2. Install Backend Dependencies
echo "Installing Backend..."
cd backend
npm install
cd ..

echo "Build Done!"
