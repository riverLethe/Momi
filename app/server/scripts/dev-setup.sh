#!/bin/bash

echo "🚀 Setting up MomiQ development environment..."

# 创建数据目录
mkdir -p data

# 检查 .env 文件
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << EOF
DATABASE_URL="file:./data/momiq.db"
JWT_SECRET="$(openssl rand -base64 32)"
NODE_ENV="development"
PORT=3000
EOF
  echo "✅ .env file created"
fi

# 安装依赖
echo "📦 Installing dependencies..."
npm install

# 生成 Prisma 客户端
echo "🔧 Generating Prisma client..."
npm run db:generate

# 运行迁移
echo "🗃️ Running database migrations..."
npm run db:migrate --name init

# 种子数据
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Development setup completed!"
echo ""
echo "📧 Demo user: demo@momiq.com"
echo "🔐 Password: password123"
echo ""
echo "🚀 Start development server:"
echo "   npm run dev" 