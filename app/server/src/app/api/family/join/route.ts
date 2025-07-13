import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

// 加入家庭空间
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
    const { inviteCode } = await request.json();

    if (!inviteCode || typeof inviteCode !== "string" || inviteCode.trim() === "") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // 加入家庭空间
    const familySpace = await FamilyService.joinFamilySpace(
      inviteCode.trim(),
      user.id,
      user.name
    );

    if (!familySpace) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    // 获取成员
    const members = await FamilyService.getFamilyMembers(familySpace.id);

    return NextResponse.json({
      success: true,
      data: {
        ...familySpace,
        members,
      },
    });
  } catch (error) {
    console.error("Join family space error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}