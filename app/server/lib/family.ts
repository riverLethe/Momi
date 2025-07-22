import { db } from "./database";
import { v4 as uuidv4 } from "uuid";

// 类型定义
export interface FamilySpace {
  id: string;
  name: string;
  createdBy: string;
  creatorName: string;
  inviteCode: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  name: string;
  isCreator: boolean;
  joinedAt: string;
  lastTransactionTime?: string;
}

export interface FamilyJoinRequest {
  id: string;
  familyId: string;
  userId: string;
  username: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

// 家庭空间服务
export class FamilyService {
  /**
   * 生成邀请码
   */
  static generateInviteCode(): string {
    return 'FAM' + Math.floor(1000 + Math.random() * 9000);
  }

  /**
   * 创建家庭空间
   */
  static async createFamilySpace(
    name: string,
    userId: string,
    userName: string,
    customInviteCode?: string
  ): Promise<FamilySpace> {
    const id = `family_${uuidv4()}`;
    const inviteCode = customInviteCode || this.generateInviteCode();
    const now = new Date().toISOString();

    // 创建家庭空间
    await db.execute({
      sql: `INSERT INTO family_spaces (id, name, created_by, creator_name, invite_code, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, name, userId, userName, inviteCode, now],
    });

    // 添加创建者作为成员
    await db.execute({
      sql: `INSERT INTO family_members (id, family_id, user_id, username, is_creator, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [`member_${uuidv4()}`, id, userId, userName, 1, now],
    });

    return {
      id,
      name,
      createdBy: userId,
      creatorName: userName,
      inviteCode,
      createdAt: now,
    };
  }

  /**
   * 获取家庭空间详情
   */
  static async getFamilySpace(id: string): Promise<FamilySpace | null> {
    const result = await db.execute({
      sql: `SELECT * FROM family_spaces WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const space = result.rows[0];
    return {
      id: space.id as string,
      name: space.name as string,
      createdBy: space.created_by as string,
      creatorName: space.creator_name as string,
      inviteCode: space.invite_code as string,
      createdAt: space.created_at as string,
    };
  }

  /**
   * 通过邀请码获取家庭空间
   */
  static async getFamilySpaceByInviteCode(inviteCode: string): Promise<FamilySpace | null> {
    const result = await db.execute({
      sql: `SELECT * FROM family_spaces WHERE invite_code = ?`,
      args: [inviteCode],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const space = result.rows[0];
    return {
      id: space.id as string,
      name: space.name as string,
      createdBy: space.created_by as string,
      creatorName: space.creator_name as string,
      inviteCode: space.invite_code as string,
      createdAt: space.created_at as string,
    };
  }

  /**
   * 获取家庭成员
   */
  static async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const result = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ?`,
      args: [familyId],
    });

    return result.rows.map((row) => ({
      id: row.id as string,
      familyId: row.family_id as string,
      userId: row.user_id as string,
      name: row.username as string,
      isCreator: Boolean(row.is_creator),
      joinedAt: row.joined_at as string,
      lastTransactionTime: row.last_transaction_time as string | undefined,
    }));
  }

  /**
   * 获取用户的家庭空间
   */
  static async getUserFamilySpaces(userId: string): Promise<FamilySpace[]> {
    const result = await db.execute({
      sql: `SELECT fs.* FROM family_spaces fs
            JOIN family_members fm ON fs.id = fm.family_id
            WHERE fm.user_id = ?`,
      args: [userId],
    });

    return result.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      createdBy: row.created_by as string,
      creatorName: row.creator_name as string,
      inviteCode: row.invite_code as string,
      createdAt: row.created_at as string,
    }));
  }

  /**
   * 创建加入家庭空间的请求
   */
  static async createJoinRequest(
    inviteCode: string,
    userId: string,
    userName: string,
    userEmail?: string
  ): Promise<FamilyJoinRequest | null> {
    // 查找家庭空间
    const space = await this.getFamilySpaceByInviteCode(inviteCode);
    if (!space) {
      return null;
    }

    // 检查用户是否已经是成员
    const memberResult = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [space.id, userId],
    });

    if (memberResult.rows.length > 0) {
      throw new Error('用户已经是家庭成员');
    }

    // 检查是否已有待处理的请求
    const existingRequestResult = await db.execute({
      sql: `SELECT * FROM family_join_requests WHERE family_id = ? AND user_id = ? AND status = 'pending'`,
      args: [space.id, userId],
    });

    if (existingRequestResult.rows.length > 0) {
      throw new Error('已有待处理的加入请求');
    }

    // 创建加入请求
    const requestId = `join_req_${uuidv4()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO family_join_requests (id, family_id, user_id, username, user_email, status, requested_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [requestId, space.id, userId, userName, userEmail, 'pending', now],
    });

    return {
      id: requestId,
      familyId: space.id,
      userId,
      username: userName,
      userEmail,
      status: 'pending',
      requestedAt: now,
    };
  }

  /**
   * 加入家庭空间（保留原方法用于直接加入）
   */
  static async joinFamilySpace(
    inviteCode: string,
    userId: string,
    userName: string
  ): Promise<FamilySpace | null> {
    // 查找家庭空间
    const space = await this.getFamilySpaceByInviteCode(inviteCode);
    if (!space) {
      return null;
    }

    // 检查用户是否已经是成员
    const memberResult = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [space.id, userId],
    });

    if (memberResult.rows.length > 0) {
      return space; // 用户已经是成员
    }

    // 添加用户为成员
    await db.execute({
      sql: `INSERT INTO family_members (id, family_id, user_id, username, is_creator, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [`member_${uuidv4()}`, space.id, userId, userName, 0, new Date().toISOString()],
    });

    return space;
  }

  /**
   * 添加成员通过邮箱
   */
  static async addMemberByEmail(
    familyId: string,
    email: string,
    currentUserId: string
  ): Promise<boolean> {
    // 验证当前用户是否是创建者
    const isCreator = await this.isCreator(familyId, currentUserId);
    if (!isCreator) {
      return false;
    }

    // 查找用户
    const userResult = await db.execute({
      sql: `SELECT * FROM users WHERE email = ? AND is_deleted = 0`,
      args: [email],
    });

    if (userResult.rows.length === 0) {
      return false; // 用户不存在
    }

    const user = userResult.rows[0];
    const userId = user.id as string;
    const userName = user.name as string;

    // 检查用户是否已经是成员
    const memberResult = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [familyId, userId],
    });

    if (memberResult.rows.length > 0) {
      return true; // 用户已经是成员
    }

    // 添加用户为成员
    await db.execute({
      sql: `INSERT INTO family_members (id, family_id, user_id, username, is_creator, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [`member_${uuidv4()}`, familyId, userId, userName, 0, new Date().toISOString()],
    });

    return true;
  }

  /**
   * 添加成员通过用户ID
   */
  static async addMemberById(
    familyId: string,
    targetUserId: string,
    currentUserId: string
  ): Promise<boolean> {
    // 验证当前用户是否是创建者
    const isCreator = await this.isCreator(familyId, currentUserId);
    if (!isCreator) {
      return false;
    }

    // 查找用户
    const userResult = await db.execute({
      sql: `SELECT * FROM users WHERE id = ? AND is_deleted = 0`,
      args: [targetUserId],
    });

    if (userResult.rows.length === 0) {
      return false; // 用户不存在
    }

    const user = userResult.rows[0];
    const userId = user.id as string;
    const userName = user.name as string;

    // 检查用户是否已经是成员
    const memberResult = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [familyId, userId],
    });

    if (memberResult.rows.length > 0) {
      return true; // 用户已经是成员
    }

    // 添加用户为成员
    await db.execute({
      sql: `INSERT INTO family_members (id, family_id, user_id, username, is_creator, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [`member_${uuidv4()}`, familyId, userId, userName, 0, new Date().toISOString()],
    });

    return true;
  }

  /**
   * 退出家庭空间
   */
  static async leaveFamilySpace(familyId: string, userId: string): Promise<boolean> {
    // 检查用户是否是创建者
    const isCreator = await this.isCreator(familyId, userId);
    if (isCreator) {
      return false; // 创建者不能退出，只能解散
    }

    // 检查用户是否是成员
    const memberResult = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [familyId, userId],
    });

    if (memberResult.rows.length === 0) {
      return false; // 用户不是成员
    }

    // 移除成员
    await db.execute({
      sql: `DELETE FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [familyId, userId],
    });

    return true;
  }

  /**
   * 删除家庭空间
   */
  static async deleteFamilySpace(familyId: string, userId: string): Promise<boolean> {
    try {
      // 验证当前用户是否是创建者
      const isCreator = await this.isCreator(familyId, userId);
      if (!isCreator) {
        return false;
      }

      // 验证家庭空间是否存在
      const familySpace = await this.getFamilySpace(familyId);
      if (!familySpace) {
        return false;
      }

      // 使用事务确保操作的原子性
      // 1. 删除所有成员
      await db.execute({
        sql: `DELETE FROM family_members WHERE family_id = ?`,
        args: [familyId],
      });

      // 2. 删除家庭空间
      await db.execute({
        sql: `DELETE FROM family_spaces WHERE id = ?`,
        args: [familyId],
      });

      // 验证删除是否成功
      const verifyDeletion = await db.execute({
        sql: `SELECT COUNT(*) as count FROM family_spaces WHERE id = ?`,
        args: [familyId],
      });

      const count = verifyDeletion.rows[0].count as number;
      return count === 0;
    } catch (error) {
      console.error('Error deleting family space:', error);
      return false;
    }
  }

  /**
   * 更新用户最后记账时间
   */
  static async updateLastTransactionTime(userId: string): Promise<void> {
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE family_members SET last_transaction_time = ? WHERE user_id = ?`,
      args: [now, userId],
    });
  }

  /**
   * 检查用户是否是创建者
   */
  static async isCreator(familyId: string, userId: string): Promise<boolean> {
    const result = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_creator = 1`,
      args: [familyId, userId],
    });

    return result.rows.length > 0;
  }

  /**
   * 检查用户是否是家庭成员
   */
  static async isFamilyMember(familyId: string, userId: string): Promise<boolean> {
    const result = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [familyId, userId],
    });

    return result.rows.length > 0;
  }

  /**
   * 删除家庭成员
   */
  static async removeMember(familyId: string, memberId: string): Promise<boolean> {
    try {
      await db.execute({
        sql: `DELETE FROM family_members WHERE family_id = ? AND id = ?`,
        args: [familyId, memberId],
      });
      return true;
    } catch (error) {
      console.error('Error removing family member:', error);
      return false;
    }
  }

  /**
   * 更新邀请码
   */
  static async updateInviteCode(familyId: string, newInviteCode: string): Promise<FamilySpace | null> {
    await db.execute({
      sql: `UPDATE family_spaces SET invite_code = ? WHERE id = ?`,
      args: [newInviteCode, familyId],
    });

    return this.getFamilySpace(familyId);
  }

  /**
   * 更新家庭名称
   */
  static async updateFamilyName(familyId: string, newName: string, userId: string): Promise<FamilySpace | null> {
    // 验证当前用户是否是创建者
    const isCreator = await this.isCreator(familyId, userId);
    if (!isCreator) {
      return null;
    }

    await db.execute({
      sql: `UPDATE family_spaces SET name = ? WHERE id = ?`,
      args: [newName, familyId],
    });

    return this.getFamilySpace(familyId);
  }

  /**
   * 获取完整的家庭空间信息（包括成员）
   */
  static async getFamilySpaceWithMembers(familyId: string): Promise<any> {
    const space = await this.getFamilySpace(familyId);
    if (!space) {
      return null;
    }

    const members = await this.getFamilyMembers(familyId);

    return {
      ...space,
      members,
    };
  }

  /**
   * 获取家庭的待处理加入请求
   */
  static async getPendingJoinRequests(familyId: string): Promise<FamilyJoinRequest[]> {
    const result = await db.execute({
      sql: `SELECT * FROM family_join_requests WHERE family_id = ? AND status = 'pending' ORDER BY requested_at DESC`,
      args: [familyId],
    });

    return result.rows.map((row) => ({
      id: row.id as string,
      familyId: row.family_id as string,
      userId: row.user_id as string,
      username: row.username as string,
      userEmail: row.user_email as string | undefined,
      status: row.status as 'pending' | 'approved' | 'rejected',
      requestedAt: row.requested_at as string,
      respondedAt: row.responded_at as string | undefined,
      respondedBy: row.responded_by as string | undefined,
    }));
  }

  /**
   * 批准加入请求
   */
  static async approveJoinRequest(
    requestId: string,
    approverId: string
  ): Promise<boolean> {
    // 获取请求详情
    const requestResult = await db.execute({
      sql: `SELECT * FROM family_join_requests WHERE id = ? AND status = 'pending'`,
      args: [requestId],
    });

    if (requestResult.rows.length === 0) {
      return false;
    }

    const request = requestResult.rows[0];
    const familyId = request.family_id as string;
    const userId = request.user_id as string;
    const username = request.username as string;

    // 验证批准者是否是家庭创建者
    const isCreator = await this.isCreator(familyId, approverId);
    if (!isCreator) {
      return false;
    }

    // 检查用户是否已经是成员（防止重复加入）
    const memberResult = await db.execute({
      sql: `SELECT * FROM family_members WHERE family_id = ? AND user_id = ?`,
      args: [familyId, userId],
    });

    if (memberResult.rows.length > 0) {
      // 用户已经是成员，更新请求状态为已批准
      await db.execute({
        sql: `UPDATE family_join_requests SET status = 'approved', responded_at = ?, responded_by = ? WHERE id = ?`,
        args: [new Date().toISOString(), approverId, requestId],
      });
      return true;
    }

    // 添加用户为家庭成员
    await db.execute({
      sql: `INSERT INTO family_members (id, family_id, user_id, username, is_creator, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [`member_${uuidv4()}`, familyId, userId, username, 0, new Date().toISOString()],
    });

    // 更新请求状态
    await db.execute({
      sql: `UPDATE family_join_requests SET status = 'approved', responded_at = ?, responded_by = ? WHERE id = ?`,
      args: [new Date().toISOString(), approverId, requestId],
    });

    return true;
  }

  /**
   * 拒绝加入请求
   */
  static async rejectJoinRequest(
    requestId: string,
    rejecterId: string
  ): Promise<boolean> {
    // 获取请求详情
    const requestResult = await db.execute({
      sql: `SELECT * FROM family_join_requests WHERE id = ? AND status = 'pending'`,
      args: [requestId],
    });

    if (requestResult.rows.length === 0) {
      return false;
    }

    const request = requestResult.rows[0];
    const familyId = request.family_id as string;

    // 验证拒绝者是否是家庭创建者
    const isCreator = await this.isCreator(familyId, rejecterId);
    if (!isCreator) {
      return false;
    }

    // 更新请求状态
    await db.execute({
      sql: `UPDATE family_join_requests SET status = 'rejected', responded_at = ?, responded_by = ? WHERE id = ?`,
      args: [new Date().toISOString(), rejecterId, requestId],
    });

    return true;
  }

  /**
   * 获取用户的加入请求状态
   */
  static async getUserJoinRequestStatus(
    familyId: string,
    userId: string
  ): Promise<FamilyJoinRequest | null> {
    const result = await db.execute({
      sql: `SELECT * FROM family_join_requests WHERE family_id = ? AND user_id = ? ORDER BY requested_at DESC LIMIT 1`,
      args: [familyId, userId],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      familyId: row.family_id as string,
      userId: row.user_id as string,
      username: row.username as string,
      userEmail: row.user_email as string | undefined,
      status: row.status as 'pending' | 'approved' | 'rejected',
      requestedAt: row.requested_at as string,
      respondedAt: row.responded_at as string | undefined,
      respondedBy: row.responded_by as string | undefined,
    };
  }
}