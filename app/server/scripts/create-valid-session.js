const { createClient } = require('@libsql/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = createClient({
  url: process.env.DATABASE_URL || 'file:./data/momiq.db',
});

async function createValidSession() {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
  const sessionId = 'test_session_valid';
  const userId = 'test_user_2';
  const email = 'testuser2@example.com';
  
  // 创建JWT token
  const token = jwt.sign(
    { userId, sessionId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // 插入到数据库
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();
  
  await db.execute({
    sql: 'INSERT OR REPLACE INTO user_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [sessionId, userId, token, expiresAt, createdAt]
  });
  
  console.log('Valid token created:');
  console.log(token);
  
  return token;
}

createValidSession().catch(console.error);