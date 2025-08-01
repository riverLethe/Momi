import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";
import { db } from "../../../../../lib/database";

/**
 * GET /api/family/bills - 获取家庭空间的账单列表
 */
export async function GET(request: NextRequest) {
  try {
    // 认证用户
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");
    const limit = parseInt(searchParams.get("limit") || "500");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!familyId) {
      return NextResponse.json(
        { error: "Family ID is required" },
        { status: 400 }
      );
    }

    // 验证用户是否为家庭成员
    const familySpace = await FamilyService.getFamilySpace(familyId);
    if (!familySpace) {
      return NextResponse.json(
        { error: "Family space not found" },
        { status: 404 }
      );
    }

    const members = await FamilyService.getFamilyMembers(familyId);
    const isMember = members.some((member) => member.userId === user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this family space" },
        { status: 403 }
      );
    }

    // 获取家庭成员ID列表（排除当前用户）
    const otherMemberIds = members
      .filter((member) => member.userId !== user.id)
      .map((member) => member.userId);

    // 如果没有其他成员，返回空结果
    if (otherMemberIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          bills: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
          familySpace: {
            id: familySpace.id,
            name: familySpace.name,
          },
        },
      });
    }

    // 构建查询条件 - 隐式共享模型：只包含其他家庭成员的账单
    let sql = `
      SELECT 
        b.id,
        b.amount,
        b.category,
        b.description as notes,
        b.bill_date as date,
        b.created_at as createdAt,
        b.updated_at as updatedAt,
        b.user_id as createdBy,
        u.name as creatorName,
        b.family_space_id as familyId,
        fs.name as familyName,
        CASE WHEN b.family_space_id IS NOT NULL THEN 1 ELSE 0 END as isFamilyBill
      FROM bills b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN family_spaces fs ON b.family_space_id = fs.id
      WHERE (b.user_id IN (${otherMemberIds.map(() => "?").join(",")}) OR (b.family_space_id = ? AND b.user_id != ?))
        AND b.is_deleted = 0
    `;

    const args: any[] = [...otherMemberIds, familyId, user.id];

    // 添加日期过滤
    if (startDate) {
      sql += " AND b.bill_date >= ?";
      args.push(startDate);
    }
    if (endDate) {
      sql += " AND b.bill_date <= ?";
      args.push(endDate);
    }

    // 添加排序和分页
    sql += " ORDER BY b.bill_date DESC, b.created_at DESC LIMIT ? OFFSET ?";
    args.push(limit, offset);

    // 执行查询
    const result = await db.execute({
      sql,
      args,
    });

    // 转换数据格式 - 不转换时间格式，直接返回原始数据
    const bills = result.rows.map((row: any) => ({
      id: row.id,
      amount: row.amount,
      category: row.category,
      notes: row.notes,
      date: row.date, // 直接返回原始时间数据
      createdAt: row.createdAt, // 直接返回原始时间数据
      updatedAt: row.updatedAt, // 直接返回原始时间数据
      createdBy: row.createdBy,
      creatorName: row.creatorName,
      isFamilyBill: Boolean(row.isFamilyBill),
      familyId: row.familyId,
      familyName: row.familyName,
    }));

    // 获取总数 - 使用相同的查询逻辑（排除当前用户）
    let countSql = `
      SELECT COUNT(*) as total
      FROM bills b
      WHERE (b.user_id IN (${otherMemberIds.map(() => "?").join(",")}) OR (b.family_space_id = ? AND b.user_id != ?))
        AND b.is_deleted = 0
    `;
    const countArgs: any[] = [...otherMemberIds, familyId, user.id];

    if (startDate) {
      countSql += " AND b.bill_date >= ?";
      countArgs.push(startDate);
    }
    if (endDate) {
      countSql += " AND b.bill_date <= ?";
      countArgs.push(endDate);
    }

    const countResult = await db.execute({
      sql: countSql,
      args: countArgs,
    });

    const total = countResult.rows[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        bills,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + (bills.length || 0) < (total as number),
        },
        familySpace: {
          id: familySpace.id,
          name: familySpace.name,
        },
      },
    });
  } catch (error) {
    console.error("Get family bills error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family/bills - 创建家庭账单
 */
export async function POST(request: NextRequest) {
  try {
    // 认证用户
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const {
      familyId,
      amount,
      category,
      notes,
      date,
      merchant,
      createdAt,
      updatedAt,
    } = body;

    // 验证必需字段
    if (!familyId || !amount || !category) {
      return NextResponse.json(
        { error: "Family ID, amount, and category are required" },
        { status: 400 }
      );
    }

    // 验证用户是否为家庭成员
    const familySpace = await FamilyService.getFamilySpace(familyId);
    if (!familySpace) {
      return NextResponse.json(
        { error: "Family space not found" },
        { status: 404 }
      );
    }

    const members = await FamilyService.getFamilyMembers(familyId);
    const isMember = members.some((member) => member.userId === user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this family space" },
        { status: 403 }
      );
    }

    // 生成账单ID
    const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 使用客户端传来的时间数据，如果没有则使用null
    const billDate = date || null;
    const billCreatedAt = createdAt || null;
    const billUpdatedAt = updatedAt || null;

    // 创建账单
    await db.execute({
      sql: `INSERT INTO bills (id, user_id, amount, category, description, bill_date, created_at, updated_at, family_space_id, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        billId,
        user.id,
        amount,
        category,
        notes || null,
        billDate, // 使用客户端传来的时间
        billCreatedAt, // 使用客户端传来的时间
        billUpdatedAt, // 使用客户端传来的时间
        familyId,
      ],
    });

    // 更新用户的最后记账时间
    try {
      await FamilyService.updateLastTransactionTime(user.id);
    } catch (error) {
      console.error("Failed to update last transaction time:", error);
    }

    // 返回创建的账单 - 直接返回原始时间数据
    const bill = {
      id: billId,
      amount,
      category,
      notes,
      date: billDate, // 直接返回原始时间数据
      createdAt: billCreatedAt, // 直接返回原始时间数据
      updatedAt: billUpdatedAt, // 直接返回原始时间数据
      createdBy: user.id,
      creatorName: user.email,
      isFamilyBill: true,
      familyId,
      familyName: familySpace.name,
    };

    return NextResponse.json({
      success: true,
      data: { bill },
    });
  } catch (error) {
    console.error("Create family bill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
