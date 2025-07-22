#!/usr/bin/env node

const { createClient } = require("@libsql/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function testJoinRequestFlow() {
  console.log("🧪 Testing join request flow...");

  // JWT configuration
  const jwtSecret = process.env.JWT_SECRET || "your-super-secret-key";

  // Database configuration
  let dbConfig;
  
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log("🌐 Using Turso database...");
    dbConfig = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  } else {
    console.log("💾 Using local SQLite database...");
    dbConfig = {
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    };
  }

  const db = createClient(dbConfig);

  try {
    // 1. 创建第二个测试用户
    const testUser2Id = "test_user_2";
    const testUser2Name = "Test User 2";
    const testUser2Email = "testuser2@example.com";

    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, name, email, provider, created_at, updated_at, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [testUser2Id, testUser2Name, testUser2Email, "test", new Date().toISOString(), new Date().toISOString(), 0],
    });

    console.log("✅ Created test user 2");

    // 2. 创建第二个用户的会话
    const sessionId2 = "test_session_2";
    const token2 = jwt.sign(
      {
        sessionId: sessionId2,
        userId: testUser2Id,
        email: testUser2Email,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    await db.execute({
      sql: `INSERT OR REPLACE INTO user_sessions (id, user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        sessionId2,
        testUser2Id,
        token2,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
        new Date().toISOString()
      ],
    });

    console.log("✅ Created session and token for test user 2");
    console.log("📝 User 2 Token:", token2);

    // 4. 测试加入请求API
    console.log("\n🔍 Testing join request API...");
    
    const testInviteCode = "FAM4615"; // 使用之前创建的测试家庭
    
    // 测试发送加入请求
    const joinRequestResponse = await fetch("http://localhost:3000/api/family/request-join", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token2}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inviteCode: "FAM4615" }),
    });

    console.log("📡 Join request response status:", joinRequestResponse.status);
    console.log("📡 Join request response headers:", Object.fromEntries(joinRequestResponse.headers.entries()));

    if (joinRequestResponse.ok) {
      const joinRequestData = await joinRequestResponse.json();
      console.log("✅ Join request sent successfully:", joinRequestData);
    } else {
      const errorData = await joinRequestResponse.text();
      console.log("❌ Join request failed:", joinRequestResponse.status, errorData);
    }

    // 5. 查询数据库中的加入请求
    const requestsResult = await db.execute({
      sql: `SELECT * FROM family_join_requests ORDER BY requested_at DESC LIMIT 5`,
      args: [],
    });

    console.log("\n📋 Recent join requests in database:");
    requestsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, User: ${row.username}, Status: ${row.status}, Requested: ${row.requested_at}`);
    });

    // 6. 获取原始用户的token来测试批准请求
    const originalUserId = "id_dvvxmq3q3mcnerd5j"; // Apple User - 家庭创建者
    const originalSessionResult = await db.execute({
      sql: `SELECT * FROM user_sessions WHERE user_id = ? LIMIT 1`,
      args: [originalUserId],
    });

    if (originalSessionResult.rows.length > 0) {
      const originalSession = originalSessionResult.rows[0];
      
      // 获取用户信息
      const userResult = await db.execute({
        sql: `SELECT * FROM users WHERE id = ?`,
        args: [originalUserId],
      });

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const originalToken = jwt.sign(
          {
            sessionId: originalSession.id,
            userId: originalSession.user_id,
            email: user.email,
          },
          jwtSecret,
          { expiresIn: "24h" }
        );

        console.log("\n📝 Original User Token:", originalToken);

        // 测试获取待处理请求
        const familyId = "family_72782435-da63-4cdf-bdd4-c72129c21e97"; // Apple User's Family
        const pendingRequestsResponse = await fetch(`http://localhost:3000/api/family/join-requests?familyId=${familyId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${originalToken}`,
            "Content-Type": "application/json",
          },
        });

        if (pendingRequestsResponse.ok) {
          const pendingRequestsData = await pendingRequestsResponse.json();
          console.log("✅ Pending requests retrieved:", pendingRequestsData);

          // 如果有待处理的请求，测试批准第一个
          if (pendingRequestsData.requests && pendingRequestsData.requests.length > 0) {
            const firstRequest = pendingRequestsData.requests[0];
            console.log(`\n🔄 Testing approval of request: ${firstRequest.id}`);

            const approveResponse = await fetch("http://localhost:3000/api/family/handle-join-request", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${originalToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                requestId: firstRequest.id, 
                action: "approve" 
              }),
            });

            if (approveResponse.ok) {
              const approveData = await approveResponse.json();
              console.log("✅ Request approved successfully:", approveData);
            } else {
              const errorData = await approveResponse.text();
              console.log("❌ Approval failed:", approveResponse.status, errorData);
            }
          }
        } else {
          const errorData = await pendingRequestsResponse.text();
          console.log("❌ Failed to get pending requests:", pendingRequestsResponse.status, errorData);
        }
      } else {
        console.log("❌ Original user not found");
      }
    } else {
      console.log("❌ Original user session not found");
    }

    console.log("\n🎉 Join request flow test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (require.main === module) {
  testJoinRequestFlow();
}

module.exports = { testJoinRequestFlow };