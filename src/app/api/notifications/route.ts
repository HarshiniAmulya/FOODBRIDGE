import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  if (!partnerId) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.partnerId, partnerId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return NextResponse.json({
    unread: rows.filter((r) => !r.read).length,
    notifications: rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      read: n.read,
      donationId: n.donationId,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { partnerId?: string };
  if (!body.partnerId) {
    return NextResponse.json({ error: "partnerId required" }, { status: 400 });
  }
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.partnerId, body.partnerId), eq(notifications.read, false)));
  return NextResponse.json({ ok: true });
}
