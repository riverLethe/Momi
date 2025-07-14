import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

// 删除家庭空间
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
    const { familyId } = await request.json();

    if (!familyId) {
      return NextResponse.json(
        { error: "Family ID is required" },
        { status: 400 }
      );
    }

    // 检查用户是否是创建者
    const isCreator = await FamilyService.isCreator(familyId, user.id);
    if (!isCreator) {
      return NextResponse.json(
        { error: "Only the creator can delete the family space" },
        { status: 403 }
      );
    }

    // 删除家庭空间
    const success = await FamilyService.deleteFamilySpace(familyId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete family space" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete family space error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
