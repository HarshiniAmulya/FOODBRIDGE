import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { donations, rescues, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ensureSeeded,
  loadWorld,
  serializeWorld,
} from "@/lib/server-data";

const FLOW: Record<string, string> = {
  claimed: "pickup_scheduled",
  pickup_scheduled: "collected",
  collected: "delivered",
};

const STEP_COPY: Record<string, { title: string; body: (t: string) => string }> = {
  pickup_scheduled: {
    title: "Pickup scheduled",
    body: (t) => `A courier has been assigned for “${t}”. Stand by for handover.`,
  },
  collected: {
    title: "Food collected",
    body: (t) => `“${t}” is on the move. Cold-chain check completed at handover.`,
  },
  delivered: {
    title: "Rescue delivered",
    body: (t) => `“${t}” reached the community and is being served. Thank you!`,
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    volunteerId?: string;
    note?: string;
  };

  const world = await loadWorld();
  const row = world.donationRows.find((d) => d.id === id);
  if (!row) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  const rescue = world.rescueByDonation.get(row.id);
  if (!rescue) {
    return NextResponse.json({ error: "No rescue in progress" }, { status: 409 });
  }
  const next = FLOW[rescue.status];
  if (!next) {
    return NextResponse.json(
      { error: `Rescue is already ${rescue.status}` },
      { status: 409 }
    );
  }
  if (next === "pickup_scheduled" && !body.volunteerId && !rescue.volunteerId) {
    return NextResponse.json(
      { error: "volunteerId is required to schedule a pickup" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { status: next };
  if (next === "pickup_scheduled") {
    update.scheduledAt = new Date();
    if (body.volunteerId) update.volunteerId = body.volunteerId;
  }
  if (next === "collected") update.collectedAt = new Date();
  if (next === "delivered") update.deliveredAt = new Date();
  if (body.note) update.notes = body.note;

  await db.update(rescues).set(update).where(eq(rescues.id, rescue.id));
  await db.update(donations).set({ status: next }).where(eq(donations.id, row.id));

  const volunteerName = body.volunteerId
    ? world.partnersById.get(body.volunteerId)?.name
    : rescue.volunteerId
      ? world.partnersById.get(rescue.volunteerId)?.name
      : null;

  const copy = STEP_COPY[next];
  await db.insert(notifications).values([
    {
      partnerId: row.donorId,
      donationId: row.id,
      kind: "status",
      title: copy.title,
      body: copy.body(row.title) + (volunteerName ? ` Courier: ${volunteerName}.` : ""),
    },
    {
      partnerId: rescue.ngoId,
      donationId: row.id,
      kind: "status",
      title: copy.title,
      body: copy.body(row.title),
    },
  ]);

  const fresh = await loadWorld();
  const dto = serializeWorld({
    ...fresh,
    donationRows: fresh.donationRows.filter((d) => d.id === row.id),
  })[0];

  return NextResponse.json({ donation: dto });
}
