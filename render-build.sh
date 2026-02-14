#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting Render Build Process..."

# 1. Install and Build Frontend
echo "📦 Building Frontend..."
cd frontend
# Force install devDependencies (vite) even if NODE_ENV=production
npm install --include=dev
npm run build
echo "✅ Frontend build complete"
cd ..

# 2. Install Backend Dependencies
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# 3. Run Database Migrations (if database is available)
if [ -n "$DATABASE_URL" ] || [ -n "$DB_HOST" ]; then
    echo "🗄️  Running database migrations..."
    npm run migrate || echo "⚠️  Migration failed or already up to date"
else
    echo "⚠️  No database configuration found, skipping migrations"
fi

cd ..

echo "✅ Build Complete!"
