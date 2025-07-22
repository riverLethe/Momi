import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";
import { FamilyService } from "../../../../../lib/family";

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const user = await AuthService.getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 获取用户的家庭信息
    const familySpaces = await FamilyService.getUserFamilySpaces(user.id);
    let family = null;
    
    if (familySpaces.length > 0) {
      // 获取家庭信息和成员信息
      family = await FamilyService.getFamilySpaceWithMembers(familySpaces[0].id);
    }
    
    // 构建包含家庭信息的用户profile
    const userProfile = {
      ...user,
      family
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
