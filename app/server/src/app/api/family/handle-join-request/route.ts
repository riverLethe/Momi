import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { FamilyService } from "@/lib/family";

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json({ error: "会话无效" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "请求ID和操作类型不能为空" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "无效的操作类型" }, { status: 400 });
    }

    let success = false;
    let message = "";

    if (action === "approve") {
      success = await FamilyService.approveJoinRequest(requestId, user.id);
      message = success ? "已批准加入请求" : "批准失败";
    } else {
      success = await FamilyService.rejectJoinRequest(requestId, user.id);
      message = success ? "已拒绝加入请求" : "拒绝失败";
    }

    if (!success) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("处理加入请求失败:", error);
    return NextResponse.json(
      { error: "处理加入请求失败" },
      { status: 500 }
    );
  }
}