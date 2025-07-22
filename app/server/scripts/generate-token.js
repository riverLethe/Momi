const jwt = require('jsonwebtoken');

// 使用与服务器相同的secret
const JWT_SECRET = 'your-super-secret-key';

const payload = {
  userId: 'test_user_2',
  sessionId: 'test_session_2',
  email: 'testuser2@example.com'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated JWT Token:');
console.log(token);