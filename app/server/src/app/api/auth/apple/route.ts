import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { authorizationCode, state } = await request.json();

    if (!authorizationCode) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Get device information
    const userAgent = request.headers.get("user-agent") || "";
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";

    // Use real authentication service
    const result = await AuthService.loginWithApple(
      authorizationCode,
      state,
      userAgent,
      ipAddress,
      userAgent
    );

    if (!result) {
      return NextResponse.json(
        { error: "Apple authentication failed" },
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
    console.error("Apple login error:", error);
    return NextResponse.json(
      { error: "Apple authentication failed" },
      { status: 500 }
    );
  }
}
