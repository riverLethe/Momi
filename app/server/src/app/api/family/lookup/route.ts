import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

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

    // 获取邀请码参数
    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get('inviteCode');

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // 根据邀请码查找家庭空间
    const familySpace = await FamilyService.getFamilySpaceByInviteCode(inviteCode);
    
    if (!familySpace) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // 检查用户是否已经是成员
    const isAlreadyMember = await FamilyService.isFamilyMember(familySpace.id, user.id);
    
    // 获取家庭成员信息
    const members = await FamilyService.getFamilyMembers(familySpace.id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...familySpace,
        members,
        isAlreadyMember
      }
    });
  } catch (error) {
    console.error("Error looking up family space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}