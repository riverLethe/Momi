import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { db } from "@/lib/database";
import { SyncService } from "@/lib/sync";

interface BillSyncOperation {
  action: "create" | "update" | "delete";
  bill: any; // loosely-typed – validated below
}

export async function POST(request: NextRequest) {
  try {
    // 1) Auth
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const user = token ? await AuthService.validateSession(token) : null;
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 2) Parse body
    const body = (await request.json()) as
      | BillSyncOperation[]
      | { bills: BillSyncOperation[] };
    const operations: BillSyncOperation[] = Array.isArray(body)
      ? body
      : body?.bills || [];

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ success: true, uploaded: 0 });
    }

    let uploaded = 0;

    for (const op of operations) {
      const { action, bill } = op;
      if (!bill || !bill.id) continue;

      switch (action) {
        case "create":
        case "update": {
          // Upsert bill – rely on ON CONFLICT for simplicity (SQLite/Turso)
          await db.execute({
            sql: `INSERT INTO bills (id, user_id, amount, category, description, bill_date, created_at, updated_at, is_deleted)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                   ON CONFLICT(id) DO UPDATE SET amount = excluded.amount,
                                               category = excluded.category,
                                               description = excluded.description,
                                               bill_date = excluded.bill_date,
                                               updated_at = excluded.updated_at,
                                               is_deleted = 0`,
            args: [
              bill.id,
              user.id,
              bill.amount ?? 0,
              bill.category ?? null,
              bill.note ?? null,
              bill.date ?? new Date().toISOString(),
              bill.createdAt ?? new Date().toISOString(),
              new Date().toISOString(),
            ],
          });
          uploaded += 1;
          break;
        }
        case "delete": {
          await db.execute({
            sql: `UPDATE bills SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?`,
            args: [new Date().toISOString(), bill.id, user.id],
          });
          uploaded += 1;
          break;
        }
      }
    }

    return NextResponse.json({ success: true, uploaded });
  } catch (error) {
    console.error("Bill sync upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth
    const token = AuthService.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const user = token ? await AuthService.validateSession(token) : null;
    if (!user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // lastSync query param
    const { searchParams } = new URL(request.url);
    const lastSync = searchParams.get("lastSync") || undefined;

    const data = await SyncService.getUserSyncData(user.id, lastSync);

    return NextResponse.json({ success: true, bills: data.bills });
  } catch (error) {
    console.error("Bill sync download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
