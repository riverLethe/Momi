import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { FamilyService } from "@/lib/family";

export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");

    if (!familyId) {
      return NextResponse.json({ error: "家庭ID不能为空" }, { status: 400 });
    }

    // 验证用户是否是家庭创建者
    const isCreator = await FamilyService.isCreator(familyId, user.id);
    if (!isCreator) {
      return NextResponse.json({ error: "只有家庭创建者可以查看加入请求" }, { status: 403 });
    }

    // 获取待处理的加入请求
    const pendingRequests = await FamilyService.getPendingJoinRequests(familyId);

    return NextResponse.json({
      success: true,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("获取加入请求失败:", error);
    return NextResponse.json(
      { error: "获取加入请求失败" },
      { status: 500 }
    );
  }
}