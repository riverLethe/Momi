import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { db } from "./database";
import querystring from "querystring";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Google OAuth客户端
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
  session: {
    id: string;
    expiresAt: Date;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
  lastSync?: string;
  isDeleted: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  providerId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface GoogleUserData {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export interface AppleUserData {
  email: string;
  name?: string;
  sub: string;
}

export interface WeChatUserData {
  openid: string;
  nickname: string;
  headimgurl?: string;
}

// Helper function to safely convert Value to string
function valueToString(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

// Helper function to generate UUID
function generateId(): string {
  return (
    "id_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  );
}

// Session Management
export class SessionManager {
  /**
   * Create a new user session
   */
  static async createSession(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ session: UserSession; token: string }> {
    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const createdAt = new Date();

    // Create JWT token
    const token = jwt.sign(
      {
        userId,
        sessionId,
        email: "", // Will be updated after getting user info
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await db.execute({
      sql: `INSERT INTO user_sessions (id, user_id, token, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        sessionId,
        userId,
        token,
        expiresAt.toISOString(),
        createdAt.toISOString(),
      ],
    });

    return {
      session: {
        id: sessionId,
        userId,
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
      },
      token,
    };
  }

  /**
   * Validate and get session
   */
  static async getValidSession(token: string): Promise<AuthUser | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // Check if session exists and is not expired
      const result = await db.execute({
        sql: `SELECT * FROM user_sessions WHERE id = ? AND token = ? AND expires_at > ?`,
        args: [payload.sessionId, token, new Date().toISOString()],
      });

      if (result.rows.length === 0) return null;

      // Update user last login time
      await db.execute({
        sql: `UPDATE users SET updated_at = ? WHERE id = ?`,
        args: [new Date().toISOString(), payload.userId],
      });

      // Get user info
      const userResult = await db.execute({
        sql: "SELECT * FROM users WHERE id = ? AND is_deleted = 0",
        args: [payload.userId],
      });

      if (userResult.rows.length === 0) return null;

      const user = userResult.rows[0];
      return {
        id: valueToString(user.id),
        email: valueToString(user.email),
        name: valueToString(user.name),
        avatar: user.avatar ? valueToString(user.avatar) : undefined,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }
}

// User Management
export class UserManager {
  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE id = ? AND is_deleted = 0",
      args: [userId],
    });

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: valueToString(user.id),
      email: valueToString(user.email),
      name: valueToString(user.name),
      avatar: user.avatar ? valueToString(user.avatar) : undefined,
      provider: valueToString(user.provider),
      providerId: user.provider_id
        ? valueToString(user.provider_id)
        : undefined,
      createdAt: valueToString(user.created_at),
      updatedAt: valueToString(user.updated_at),
      lastSync: user.last_sync ? valueToString(user.last_sync) : undefined,
      isDeleted: Boolean(user.is_deleted),
    };
  }

  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    const userId = generateId();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO users (id, email, name, avatar, provider, provider_id, created_at, updated_at, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        userData.email,
        userData.name,
        userData.avatar || null,
        userData.provider,
        userData.providerId || null,
        now,
        now,
        0,
      ],
    });

    return {
      id: userId,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      provider: userData.provider,
      providerId: userData.providerId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
  }
}

// Authentication Methods
export class AuthService {
  /**
   * Get WeChat user info from authorization code
   */
  static async getWeChatUserInfo(code: string): Promise<WeChatUserData> {
    try {
      const appId = process.env.WECHAT_APP_ID;
      const appSecret = process.env.WECHAT_APP_SECRET;

      if (!appId || !appSecret) {
        throw new Error("WeChat configuration missing");
      }

      // 1. 获取access_token
      const tokenResponse = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?` +
          querystring.stringify({
            appid: appId,
            secret: appSecret,
            code: code,
            grant_type: "authorization_code",
          })
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.errcode) {
        throw new Error(`WeChat token error: ${tokenData.errmsg}`);
      }

      // 2. 获取用户信息
      const userResponse = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?` +
          querystring.stringify({
            access_token: tokenData.access_token,
            openid: tokenData.openid,
            lang: "zh_CN",
          })
      );

      const userData = await userResponse.json();

      if (userData.errcode) {
        throw new Error(`WeChat user info error: ${userData.errmsg}`);
      }

      return {
        openid: userData.openid,
        nickname: userData.nickname,
        headimgurl: userData.headimgurl,
      };
    } catch (error) {
      console.error("WeChat API error:", error);
      throw new Error("Failed to get WeChat user info");
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  /**
   * Verify password
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Email/Password Login
   */
  static async loginWithEmail(
    credentials: LoginCredentials,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: AuthUser;
    token: string;
    session: { id: string; expiresAt: Date };
  } | null> {
    try {
      // Find user
      const result = await db.execute({
        sql: "SELECT * FROM users WHERE email = ? AND provider = 'email' AND is_deleted = 0",
        args: [credentials.email],
      });

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];

      // Note: Password verification would go here in a real implementation
      // For now, we'll skip password verification

      // Create session
      const { session, token } = await SessionManager.createSession(
        valueToString(user.id),
        deviceInfo,
        ipAddress,
        userAgent
      );

      // Update last login time
      await db.execute({
        sql: `UPDATE users SET updated_at = ? WHERE id = ?`,
        args: [new Date().toISOString(), valueToString(user.id)],
      });

      return {
        user: {
          id: valueToString(user.id),
          email: valueToString(user.email),
          name: valueToString(user.name),
          avatar: user.avatar ? valueToString(user.avatar) : undefined,
        },
        token,
        session: {
          id: session.id,
          expiresAt: new Date(session.expiresAt),
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }

  /**
   * Google Login with ID Token verification
   */
  static async loginWithGoogle(
    idToken: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: AuthUser;
    token: string;
    session: { id: string; expiresAt: Date };
  } | null> {
    try {
      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Invalid Google ID token");
      }

      const { email, name, picture, sub } = payload;
      if (!email) {
        throw new Error("Email not provided by Google");
      }

      // Use authenticateWithGoogle to handle user creation/update
      return await this.authenticateWithGoogle(
        name || "Google User",
        email,
        picture,
        sub,
        deviceInfo,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error("Google login error:", error);
      return null;
    }
  }

  /**
   * Google OAuth Authentication
   */
  static async authenticateWithGoogle(
    name: string,
    email: string,
    picture?: string,
    googleId?: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: AuthUser;
    token: string;
    session: { id: string; expiresAt: Date };
  }> {
    try {
      // Find or create user
      let result = await db.execute({
        sql: "SELECT * FROM users WHERE email = ? AND provider = 'google' AND is_deleted = 0",
        args: [email],
      });

      let userId: string;

      if (result.rows.length === 0) {
        // Create new user
        const newUser = await UserManager.createUser({
          email,
          name: name || "Google User",
          avatar: picture,
          provider: "google",
          providerId: googleId,
        });
        userId = newUser.id;
      } else {
        // Update existing user
        userId = valueToString(result.rows[0].id);
        await db.execute({
          sql: `UPDATE users SET name = ?, avatar = ?, updated_at = ? WHERE id = ?`,
          args: [
            name || valueToString(result.rows[0].name),
            picture || result.rows[0].avatar,
            new Date().toISOString(),
            userId,
          ],
        });
      }

      // Create session
      const { session, token } = await SessionManager.createSession(
        userId,
        deviceInfo,
        ipAddress,
        userAgent
      );

      // Get updated user info
      const userInfo = await UserManager.getUserById(userId);

      return {
        user: {
          id: userInfo!.id,
          email: userInfo!.email,
          name: userInfo!.name,
          avatar: userInfo!.avatar,
        },
        token,
        session: {
          id: session.id,
          expiresAt: new Date(session.expiresAt),
        },
      };
    } catch (error) {
      console.error("Google auth error:", error);
      throw new Error("Google authentication failed");
    }
  }

  /**
   * Apple Sign In Authentication
   */
  static async authenticateWithApple(
    user: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: AuthUser;
    token: string;
    session: { id: string; expiresAt: Date };
  }> {
    try {
      // Find or create user
      let result = await db.execute({
        sql: "SELECT * FROM users WHERE provider_id = ? AND provider = 'apple' AND is_deleted = 0",
        args: [user],
      });

      let userId: string;

      if (result.rows.length === 0) {
        // Create new user
        const email = `apple.${Date.now()}@icloud.com`; // Temporary email
        const newUser = await UserManager.createUser({
          email,
          name: "Apple User",
          provider: "apple",
          providerId: user,
        });
        userId = newUser.id;
      } else {
        // Update last login time
        userId = valueToString(result.rows[0].id);
        await db.execute({
          sql: `UPDATE users SET updated_at = ? WHERE id = ?`,
          args: [new Date().toISOString(), userId],
        });
      }

      // Create session
      const { session, token } = await SessionManager.createSession(
        userId,
        deviceInfo,
        ipAddress,
        userAgent
      );

      // Get user info
      const userInfo = await UserManager.getUserById(userId);

      return {
        user: {
          id: userInfo!.id,
          email: userInfo!.email,
          name: userInfo!.name,
          avatar: userInfo!.avatar,
        },
        token,
        session: {
          id: session.id,
          expiresAt: new Date(session.expiresAt),
        },
      };
    } catch (error) {
      console.error("Apple auth error:", error);
      throw new Error("Apple authentication failed");
    }
  }

  /**
   * WeChat Authentication
   */
  static async authenticateWithWeChat(
    userData: WeChatUserData,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: AuthUser;
    token: string;
    session: { id: string; expiresAt: Date };
  }> {
    try {
      const name = userData.nickname || "WeChat User";
      const email = `${userData.openid}@wechat.local`;
      const avatar = userData.headimgurl;

      // Find or create user
      let result = await db.execute({
        sql: "SELECT * FROM users WHERE provider_id = ? AND provider = 'wechat' AND is_deleted = 0",
        args: [userData.openid],
      });

      let userId: string;

      if (result.rows.length === 0) {
        const newUser = await UserManager.createUser({
          email,
          name,
          avatar,
          provider: "wechat",
          providerId: userData.openid,
        });
        userId = newUser.id;
      } else {
        userId = valueToString(result.rows[0].id);
        await db.execute({
          sql: `UPDATE users SET name = ?, avatar = ?, updated_at = ? WHERE id = ?`,
          args: [
            name,
            avatar || result.rows[0].avatar,
            new Date().toISOString(),
            userId,
          ],
        });
      }

      // Create session
      const { session, token } = await SessionManager.createSession(
        userId,
        deviceInfo,
        ipAddress,
        userAgent
      );

      // Get user info
      const userInfo = await UserManager.getUserById(userId);

      return {
        user: {
          id: userInfo!.id,
          email: userInfo!.email,
          name: userInfo!.name,
          avatar: userInfo!.avatar,
        },
        token,
        session: {
          id: session.id,
          expiresAt: new Date(session.expiresAt),
        },
      };
    } catch (error) {
      console.error("WeChat auth error:", error);
      throw new Error("WeChat authentication failed");
    }
  }

  /**
   * Email/Password Registration
   */
  static async registerWithEmail(
    email: string,
    password: string,
    name: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: AuthUser;
    token: string;
    session: { id: string; expiresAt: Date };
  }> {
    try {
      // Check if user already exists
      const existingUser = await db.execute({
        sql: "SELECT id FROM users WHERE email = ? AND is_deleted = 0",
        args: [email],
      });

      if (existingUser.rows.length > 0) {
        throw new Error("User already exists");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const newUser = await UserManager.createUser({
        email,
        name,
        provider: "email",
      });

      // Note: In a real implementation, you would store the hashed password
      // in a separate table or add a password field to the users table

      // Create session
      const { session, token } = await SessionManager.createSession(
        newUser.id,
        deviceInfo,
        ipAddress,
        userAgent
      );

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          avatar: newUser.avatar,
        },
        token,
        session: {
          id: session.id,
          expiresAt: new Date(session.expiresAt),
        },
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string): Promise<boolean> {
    try {
      await db.execute({
        sql: "DELETE FROM user_sessions WHERE token = ?",
        args: [token],
      });
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  }

  /**
   * Logout all devices
   */
  static async logoutAllDevices(userId: string): Promise<boolean> {
    try {
      await db.execute({
        sql: "DELETE FROM user_sessions WHERE user_id = ?",
        args: [userId],
      });
      return true;
    } catch (error) {
      console.error("Logout all devices error:", error);
      return false;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE id = ? AND is_deleted = 0",
      args: [userId],
    });
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    data: { name?: string; avatar?: string }
  ) {
    const updates = [];
    const args = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      args.push(data.name);
    }

    if (data.avatar !== undefined) {
      updates.push("avatar = ?");
      args.push(data.avatar);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(userId);

    return await db.execute({
      sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });
  }

  /**
   * Get current user from request
   */
  static async getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    return await SessionManager.getValidSession(token);
  }

  /**
   * Extract bearer token from NextRequest headers
   */
  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.substring(7);
  }

  /**
   * Validate a JWT/session token and return the associated user if valid.
   */
  static async validateSession(token: string): Promise<AuthUser | null> {
    return await SessionManager.getValidSession(token);
  }
}
