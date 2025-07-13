import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    // 获取认证令牌
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 验证用户会话
    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 删除用户账户
    // 1. 删除用户会话
    await AuthService.logout(token);
    
    // 2. 删除用户数据
    // 这里需要实现删除用户相关数据的逻辑
    // 例如：删除用户的账单、交易记录等
    
    // 3. 删除用户账户
    const success = await AuthService.deleteUser(user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}