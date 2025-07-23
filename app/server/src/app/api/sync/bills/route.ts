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
          // 直接使用客户端传来的时间数据，不做任何转换
          const billDate = bill.date || null;
          const createdAt = bill.createdAt || null;
          const updatedAt = bill.updatedAt || null;

          // Upsert bill – rely on ON CONFLICT for simplicity (SQLite/Turso)
          await db.execute({
            sql: `INSERT INTO bills (id, user_id, amount, category, description, merchant, account, bill_date, created_at, updated_at, is_deleted)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                   ON CONFLICT(id) DO UPDATE SET amount = excluded.amount,
                                               category = excluded.category,
                                               description = excluded.description,
                                               merchant = excluded.merchant,
                                               account = excluded.account,
                                               bill_date = excluded.bill_date,
                                               updated_at = excluded.updated_at,
                                               is_deleted = 0`,
            args: [
              bill.id,
              user.id,
              bill.amount ?? 0,
              bill.category ?? null,
              bill.notes ?? null,
              bill.merchant ?? null,
              bill.account ?? null,
              billDate, // 直接使用客户端传来的时间
              createdAt, // 直接使用客户端传来的时间
              updatedAt, // 直接使用客户端传来的时间
            ],
          });
          uploaded += 1;
          break;
        }
        case "delete": {
          // 对于删除操作，使用客户端传来的updatedAt时间
          const updatedAt = bill.updatedAt || null;
          await db.execute({
            sql: `UPDATE bills SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?`,
            args: [updatedAt, bill.id, user.id],
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
