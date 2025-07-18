import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { identityToken, user } = await request.json();

    if (!identityToken) {
      return NextResponse.json(
        { error: "Identity token is required" },
        { status: 400 }
      );
    }

    // Get device information
    const userAgent = request.headers.get("user-agent") || "";
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";

    // Use real authentication service
    const result = await AuthService.authenticateWithApple(
      user || identityToken,
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
