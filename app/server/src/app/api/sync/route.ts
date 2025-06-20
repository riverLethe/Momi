import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../../../lib/auth";
import { SyncService } from "../../../../lib/sync";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Parse sync request
    const syncRequest = await request.json();
    const { bills, budgets, lastSyncTime, deviceId, deviceType, appVersion } =
      syncRequest;

    // Get device information
    const userAgent = request.headers.get("user-agent") || "";

    // Perform sync
    const syncResponse = await SyncService.syncUserData(user.id, {
      bills: bills || [],
      budgets: budgets || [],
      lastSyncTime,
      deviceId: deviceId || "unknown",
      deviceType: deviceType || "web",
      appVersion: appVersion || "1.0.0",
    });

    return NextResponse.json({
      success: true,
      data: syncResponse,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync operation failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Get sync statistics
    const stats = await SyncService.getSyncStats(user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Sync stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
