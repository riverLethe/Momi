const { createClient } = require("@libsql/client");
require('dotenv').config();

async function createTestFamily() {
  const db = createClient({
    url: process.env.DATABASE_URL || "file:./data/momiq.db",
  });

  try {
    console.log('Creating test family with invite code FAM4615...');
    
    // 首先创建一个测试用户
    const userId = 'test_user_123';
    const userName = 'Test User';
    
    // 检查用户是否已存在
    const existingUser = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId]
    });
    
    if (existingUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (id, email, name, provider, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [userId, 'test@example.com', userName, 'test', new Date().toISOString()]
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }
    
    // 检查家庭是否已存在
    const existingFamily = await db.execute({
      sql: 'SELECT * FROM family_spaces WHERE invite_code = ?',
      args: ['FAM4615']
    });
    
    if (existingFamily.rows.length === 0) {
      // 创建家庭空间
      const familyId = 'family_test_123';
      await db.execute({
        sql: `INSERT INTO family_spaces (id, name, created_by, creator_name, invite_code, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [familyId, '测试家庭', userId, userName, 'FAM4615', new Date().toISOString()]
      });
      console.log('✅ Test family created');
      
      // 添加创建者为成员
      await db.execute({
        sql: `INSERT INTO family_members (id, family_id, user_id, username, is_creator, joined_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [`member_${familyId}`, familyId, userId, userName, 1, new Date().toISOString()]
      });
      console.log('✅ Creator added as member');
    } else {
      console.log('✅ Test family already exists');
    }
    
    // 验证创建
    const result = await db.execute({
      sql: 'SELECT * FROM family_spaces WHERE invite_code = ?',
      args: ['FAM4615']
    });
    
    if (result.rows.length > 0) {
      console.log('✅ Family found:', result.rows[0]);
    } else {
      console.log('❌ Family not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

createTestFamily();