import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "WeChat authorization code is required" },
        { status: 400 }
      );
    }

    // Get device/client info
    const userAgent = request.headers.get("user-agent") || "";
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";

    const result = await AuthService.loginWithWeChat(
      code,
      userAgent,
      ipAddress,
      userAgent
    );

    if (!result) {
      return NextResponse.json(
        { error: "WeChat authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      session: {
        id: result.session.id,
        expiresAt: result.session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("WeChat login error:", error);
    return NextResponse.json(
      { error: "WeChat authentication failed" },
      { status: 500 }
    );
  }
}
