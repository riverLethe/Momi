import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

// 刷新家庭空间邀请码
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

    // 获取用户的家庭空间
    const userFamilies = await FamilyService.getUserFamilySpaces(user.id);
    if (userFamilies.length === 0) {
      return NextResponse.json(
        { error: "No family space found" },
        { status: 404 }
      );
    }

    const familySpace = userFamilies[0];
    
    // 检查用户是否是创建者
    if (familySpace.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Only family creator can refresh invite code" },
        { status: 403 }
      );
    }

    // 生成新的邀请码并更新
    const newInviteCode = FamilyService.generateInviteCode();
    const updatedSpace = await FamilyService.updateInviteCode(familySpace.id, newInviteCode);
    
    if (!updatedSpace) {
      return NextResponse.json(
        { error: "Failed to update invite code" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSpace);
  } catch (error) {
    console.error("Error refreshing invite code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}