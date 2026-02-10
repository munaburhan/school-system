#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build --prefix frontend

# Clean up processed backend modules if needed
rm -rf backend/node_modules
cd backend
npm install
