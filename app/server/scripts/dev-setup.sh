#!/bin/bash

# MomiQ Backend Development Setup Script
# This script sets up the development environment for the MomiQ backend

set -e

echo "🚀 Setting up MomiQ Backend Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the app/server directory"
    exit 1
fi

# Create data directory for SQLite database
echo "📁 Creating data directory..."
mkdir -p data

# Initialize environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL="file:./data/momiq.db"

# JWT Configuration  
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple Sign In (optional)
APPLE_CLIENT_ID=""
APPLE_PRIVATE_KEY=""
APPLE_KEY_ID=""
APPLE_TEAM_ID=""

# WeChat (optional)
WECHAT_APP_ID=""
WECHAT_APP_SECRET=""

# API Configuration
API_BASE_URL="http://localhost:3000"

# Development settings
NODE_ENV="development"
EOF
    echo "✅ .env file created with default values"
    echo "⚠️  Please update the values in .env file as needed"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Initialize database schema
echo "🗄️ Setting up database schema..."
npm run db:setup

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Update the .env file with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000 to see your app"
echo ""
echo "💡 For production deployment with Turso:"
echo "   Run './scripts/setup-turso.sh' to configure Turso database" 