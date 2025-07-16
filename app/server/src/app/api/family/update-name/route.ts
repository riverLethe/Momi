import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

// 更新家庭名称
export async function PUT(request: NextRequest) {
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
    const { familyId, name } = await request.json();

    if (!familyId || !name) {
      return NextResponse.json(
        { error: "Family ID and name are required" },
        { status: 400 }
      );
    }

    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: "Family name cannot be empty" },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: "Family name is too long" },
        { status: 400 }
      );
    }

    // 更新家庭名称
    const updatedSpace = await FamilyService.updateFamilyName(
      familyId,
      name.trim(),
      user.id
    );

    if (!updatedSpace) {
      return NextResponse.json(
        { error: "Failed to update family name. You must be the creator to update the family name." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      familySpace: updatedSpace,
    });
  } catch (error) {
    console.error("Error updating family name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}