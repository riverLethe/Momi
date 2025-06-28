import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "./database";
import querystring from "querystring";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
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

export class AuthService {
  /**
   * 密码哈希
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * 生成JWT token
   */
  static generateToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * 验证JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  /**
   * 从请求中提取token
   */
  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * 创建用户会话
   */
  static async createSession(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天过期

    const session = await prisma.userSession.create({
      data: {
        userId,
        token: "", // 临时值，稍后更新
        deviceInfo,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // 生成包含session ID的token
    const token = this.generateToken({
      userId,
      email: "", // 稍后从用户信息获取
      sessionId: session.id,
    });

    // 更新session的token
    const updatedSession = await prisma.userSession.update({
      where: { id: session.id },
      data: { token },
    });

    return { session: updatedSession, token };
  }

  /**
   * 验证用户会话
   */
  static async validateSession(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) return null;

      // 检查session是否存在且未过期
      const session = await prisma.userSession.findUnique({
        where: {
          token,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!session) return null;

      // 更新用户最后登录时间
      await prisma.user.update({
        where: { id: session.userId },
        data: { lastLoginAt: new Date() },
      });

      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatar || undefined,
      };
    } catch (error) {
      console.error("Session validation failed:", error);
      return null;
    }
  }

  /**
   * 邮箱密码登录
   */
  static async loginWithEmail(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    try {
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        return null;
      }

      // 验证密码
      const isPasswordValid = await this.verifyPassword(
        password,
        user.password
      );
      if (!isPasswordValid) {
        return null;
      }

      // 创建会话
      const { session, token } = await this.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent
      );

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || undefined,
        },
        token,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error("Email login failed:", error);
      return null;
    }
  }

  /**
   * Google OAuth登录
   */
  static async loginWithGoogle(
    idToken: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    try {
      // 验证Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return null;
      }

      const { sub: googleId, email, name, picture } = payload;

      // 查找或创建用户
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { googleId }],
        },
      });

      if (!user) {
        // 创建新用户
        user = await prisma.user.create({
          data: {
            email,
            name: name || "Google User",
            avatar: picture,
            googleId,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // 更新现有用户
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: name || user.name,
            avatar: picture || user.avatar,
            googleId,
            lastLoginAt: new Date(),
          },
        });
      }

      // 创建会话
      const { session, token } = await this.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || undefined,
        },
        token,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error("Google login failed:", error);
      return null;
    }
  }

  /**
   * Apple Sign In登录
   */
  static async loginWithApple(
    authorizationCode: string,
    state?: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    try {
      // 注意：在实际生产环境中，你需要验证Apple的authorization code
      // 这里为了演示，我们创建一个基于authorization code的用户

      // 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { appleId: authorizationCode },
      });

      if (!user) {
        // 创建新用户
        const email = `apple.${Date.now()}@icloud.com`; // 临时邮箱，实际应从Apple获取
        user = await prisma.user.create({
          data: {
            email,
            name: "Apple User",
            appleId: authorizationCode,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // 更新最后登录时间
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      // 创建会话
      const { session, token } = await this.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || undefined,
        },
        token,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error("Apple login failed:", error);
      return null;
    }
  }

  /**
   * WeChat OAuth登录
   * 使用通过 Expo AuthSession 或前端SDK 获取的 `code` 参数交换 access_token 和用户信息
   */
  static async loginWithWeChat(
    code: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    try {
      const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
      const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

      if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
        throw new Error("WeChat app credentials are not configured");
      }

      // 通过 code 获取 access_token
      const tokenParams = querystring.stringify({
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        code,
        grant_type: "authorization_code",
      });

      const tokenRes = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?${tokenParams}`
      );
      const tokenData: any = await tokenRes.json();

      if (!tokenData || !tokenData.access_token || !tokenData.openid) {
        console.error("WeChat token response invalid:", tokenData);
        return null;
      }

      // 获取用户信息
      const userInfoParams = querystring.stringify({
        access_token: tokenData.access_token,
        openid: tokenData.openid,
        lang: "zh_CN",
      });

      const userRes = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?${userInfoParams}`
      );
      const userData: any = await userRes.json();

      if (!userData || !userData.openid) {
        console.error("WeChat userinfo response invalid:", userData);
        return null;
      }

      const email = `${userData.openid}@wechat.momiq`; // WeChat 不提供邮箱，生成占位邮箱
      const name = userData.nickname || "WeChat User";
      const avatar = userData.headimgurl;

      // 查找或创建用户
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ wechatOpenId: userData.openid }, { email }],
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatar,
            wechatOpenId: userData.openid,
            wechatUnionId: userData.unionid ?? undefined,
            lastLoginAt: new Date(),
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            avatar: avatar || user.avatar,
            wechatOpenId: userData.openid,
            wechatUnionId: userData.unionid ?? user.wechatUnionId ?? undefined,
            lastLoginAt: new Date(),
          },
        });
      }

      // 创建会话
      const { session, token } = await this.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || undefined,
        },
        token,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error("WeChat login failed:", error);
      return null;
    }
  }

  /**
   * 注册新用户
   */
  static async register(
    email: string,
    password: string,
    name: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    try {
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User already exists");
      }

      // 哈希密码
      const hashedPassword = await this.hashPassword(password);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          lastLoginAt: new Date(),
        },
      });

      // 创建会话
      const { session, token } = await this.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || undefined,
        },
        token,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error("Registration failed:", error);
      return null;
    }
  }

  /**
   * 登出用户
   */
  static async logout(token: string): Promise<boolean> {
    try {
      await prisma.userSession.delete({
        where: { token },
      });
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      return false;
    }
  }

  /**
   * 登出所有设备
   */
  static async logoutAllDevices(userId: string): Promise<boolean> {
    try {
      await prisma.userSession.deleteMany({
        where: { userId },
      });
      return true;
    } catch (error) {
      console.error("Logout all devices failed:", error);
      return false;
    }
  }

  /**
   * 获取用户详细信息
   */
  static async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        currency: true,
        language: true,
        theme: true,
        timezone: true,
        notificationsEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastSyncAt: true,
      },
    });
  }

  /**
   * 更新用户信息
   */
  static async updateUser(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}
