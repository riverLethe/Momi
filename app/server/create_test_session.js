const { createClient } = require("@libsql/client");
const jwt = require("jsonwebtoken");
require('dotenv').config();

async function createTestSession() {
  const db = createClient({
    url: process.env.DATABASE_URL || "file:./data/momiq.db",
  });

  try {
    console.log('Creating test session...');
    
    // 使用已存在的测试用户
    const userId = 'id_dvvxmq3q3mcnerd5j';
    const sessionId = 'test_session_' + Date.now();
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
    
    console.log('JWT_SECRET:', JWT_SECRET);
    
    // 创建JWT token
    const token = jwt.sign(
      {
        userId,
        sessionId,
        email: "apple@example.com",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // 创建session记录
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();
    
    await db.execute({
      sql: `INSERT INTO user_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [sessionId, userId, token, expiresAt, createdAt],
    });
    
    console.log('✅ Test session created successfully!');
    console.log('Token:', token);
    console.log('Session ID:', sessionId);
    console.log('User ID:', userId);
    
    return token;
  } catch (error) {
    console.error('❌ Error creating test session:', error);
  } finally {
    await db.close();
  }
}

createTestSession();