import { NextRequest, NextResponse } from "next/server";
import { FamilyService } from "@/lib/family";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Processing join request...");

    // 验证用户身份
    const token = AuthService.extractTokenFromRequest(request);
    console.log("📝 Token extracted:", token ? "✅ Found" : "❌ Missing");

    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    console.log("🔐 Validating session...");
    const user = await AuthService.validateSession(token);
    console.log(
      "👤 Session validation result:",
      user ? "✅ Valid" : "❌ Invalid"
    );

    if (!user) {
      return NextResponse.json({ error: "会话无效" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    console.log("📦 Request body:", body);
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: "邀请码不能为空" }, { status: 400 });
    }

    console.log("🏠 Creating join request with code:", inviteCode);

    // 创建加入请求
    const joinRequest = await FamilyService.createJoinRequest(
      inviteCode,
      user.id,
      user.name,
      user.email
    );

    if (!joinRequest) {
      return NextResponse.json({ error: "家庭空间不存在" }, { status: 404 });
    }

    console.log("✅ Join request created successfully:", joinRequest);

    return NextResponse.json({
      success: true,
      message: "加入请求已发送，等待家庭创建者批准",
      request: joinRequest,
    });
  } catch (error: any) {
    console.error("❌ 创建加入请求失败:", error);
    console.error("Error stack:", error.stack);

    if (error.message === "用户已经是家庭成员") {
      return NextResponse.json(
        { error: "您已经是该家庭的成员" },
        { status: 400 }
      );
    }

    if (error.message === "已有待处理的加入请求") {
      return NextResponse.json(
        { error: "您已有待处理的加入请求" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "创建加入请求失败", details: error.message },
      { status: 500 }
    );
  }
}
