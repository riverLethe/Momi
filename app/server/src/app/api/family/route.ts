import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../lib/auth";
import { FamilyService } from "../../../../lib/family";

// 获取用户的家庭空间列表
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

    // 获取用户的家庭空间
    const familySpaces = await FamilyService.getUserFamilySpaces(user.id);

    // 获取每个家庭空间的成员
    const spacesWithMembers = await Promise.all(
      familySpaces.map(async (space) => {
        const members = await FamilyService.getFamilyMembers(space.id);
        return {
          ...space,
          members,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: spacesWithMembers,
    });
  } catch (error) {
    console.error("Get family spaces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 创建新的家庭空间
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
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Family name is required" },
        { status: 400 }
      );
    }

    // 创建家庭空间（服务端自动生成邀请码）
    const familySpace = await FamilyService.createFamilySpace(
      name.trim(),
      user.id,
      user.name
    );

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
    console.error("Create family space error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}