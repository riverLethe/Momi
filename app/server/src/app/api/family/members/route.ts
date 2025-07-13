import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

// 获取家庭成员列表
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

    // 获取家庭ID参数
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");

    if (!familyId) {
      return NextResponse.json(
        { error: "Family ID is required" },
        { status: 400 }
      );
    }

    // 获取家庭成员
    const members = await FamilyService.getFamilyMembers(familyId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Get family members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 添加家庭成员
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
    const { familyId, email, userId } = await request.json();

    if (!familyId) {
      return NextResponse.json(
        { error: "Family ID is required" },
        { status: 400 }
      );
    }

    let success = false;

    // 通过邮箱或用户ID添加成员
    if (email) {
      success = await FamilyService.addMemberByEmail(familyId, email, user.id);
    } else if (userId) {
      success = await FamilyService.addMemberById(familyId, userId, user.id);
    } else {
      return NextResponse.json(
        { error: "Email or user ID is required" },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 400 }
      );
    }

    // 获取更新后的成员列表
    const members = await FamilyService.getFamilyMembers(familyId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Add family member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 删除家庭成员
export async function DELETE(request: NextRequest) {
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
    const { familyId, memberId } = await request.json();

    if (!familyId || !memberId) {
      return NextResponse.json(
        { error: "Family ID and member ID are required" },
        { status: 400 }
      );
    }

    // 验证当前用户是否是家庭创建者
    const isCreator = await FamilyService.isCreator(familyId, user.id);
    if (!isCreator) {
      return NextResponse.json(
        { error: "Only family creator can remove members" },
        { status: 403 }
      );
    }

    // 删除成员
    const success = await FamilyService.removeMember(familyId, memberId);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}