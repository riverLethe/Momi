#!/bin/bash

echo "🚀 Setting up Turso for production deployment..."

# 检查 Turso CLI 是否安装
if ! command -v turso &> /dev/null; then
    echo "📦 Installing Turso CLI..."
    curl -sSfL https://get.tur.so/install.sh | bash
    echo "✅ Turso CLI installed"
fi

# 检查是否已登录
if ! turso auth whoami &> /dev/null; then
    echo "🔐 Please login to Turso:"
    turso auth login
fi

# 获取数据库名称（或使用默认值）
DB_NAME=${1:-"momiq-prod"}

echo "📊 Creating Turso database: $DB_NAME"

# 检查数据库是否已存在
if turso db show "$DB_NAME" &> /dev/null; then
    echo "⚠️  Database $DB_NAME already exists"
    read -p "Do you want to continue with existing database? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
else
    # 创建数据库
    turso db create "$DB_NAME"
    echo "✅ Database $DB_NAME created"
fi

# 获取数据库连接信息
echo "🔗 Getting database connection info..."
DB_URL=$(turso db show "$DB_NAME" --url)
AUTH_TOKEN=$(turso db tokens create "$DB_NAME")

echo ""
echo "🎉 Turso setup completed!"
echo ""
echo "📋 Add these environment variables to your production environment:"
echo ""
echo "DATABASE_URL=\"$DB_URL\""
echo "TURSO_AUTH_TOKEN=\"$AUTH_TOKEN\""
echo ""
echo "🚀 Next steps:"
echo "1. Add the above variables to your hosting platform (Vercel, Railway, etc.)"
echo "2. Run: npm run db:deploy"
echo "3. Run: npm run db:seed (if needed)"
echo ""
echo "💡 To manage your database:"
echo "   turso db shell $DB_NAME       # Open database shell"
echo "   turso db list                 # List all databases"
echo "   turso db usage $DB_NAME       # Check usage stats" 