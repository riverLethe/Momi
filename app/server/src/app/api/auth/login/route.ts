import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get device information
    const userAgent = request.headers.get("user-agent") || "";
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";

    // Use real authentication service
    const result = await AuthService.loginWithEmail(
      email,
      password,
      userAgent,
      ipAddress,
      userAgent
    );

    if (!result) {
      return NextResponse.json(
        { error: "Invalid credentials" },
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
