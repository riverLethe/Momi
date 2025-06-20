import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Get device information
    const userAgent = request.headers.get("user-agent") || "";
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";

    // Use real authentication service
    const result = await AuthService.loginWithGoogle(
      idToken,
      userAgent,
      ipAddress,
      userAgent
    );

    if (!result) {
      return NextResponse.json(
        { error: "Google authentication failed" },
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
    console.error("Google login error:", error);
    return NextResponse.json(
      { error: "Google authentication failed" },
      { status: 500 }
    );
  }
}
