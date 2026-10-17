import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { donations, rescues, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ensureSeeded,
  expireStale,
  loadWorld,
  toNgoLike,
  serializeWorld,
} from "@/lib/server-data";
import { rankNgos } from "@/lib/matching";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  await expireStale();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { ngoId?: string };
  if (!body.ngoId) {
    return NextResponse.json({ error: "ngoId is required" }, { status: 400 });
  }

  const world = await loadWorld();
  const row = world.donationRows.find((d) => d.id === id);
  if (!row) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  if (row.status !== "listed") {
    return NextResponse.json(
      { error: `Donation is ${row.status} and can no longer be claimed` },
      { status: 409 }
    );
  }
  const ngo = world.partnerRows.find((p) => p.id === body.ngoId && p.type === "ngo");
  if (!ngo) return NextResponse.json({ error: "Unknown NGO" }, { status: 404 });

  const match = rankNgos(
    {
      category: row.category,
      quantityMeals: row.quantityMeals,
      lat: row.lat,
      lng: row.lng,
      expiresAt: row.expiresAt,
    },
    [toNgoLike(ngo)]
  )[0];

  const [rescue] = await db
    .insert(rescues)
    .values({
      donationId: row.id,
      ngoId: ngo.id,
      status: "claimed",
      matchScore: match?.score ?? null,
      notes: match?.eligible
        ? `Claimed via smart match (score ${match.score}).`
        : "Claimed manually — organization outside top matches.",
    })
    .returning();
  await db.update(donations).set({ status: "claimed" }).where(eq(donations.id, row.id));

  const donor = world.partnersById.get(row.donorId)!;
  const volunteers = world.partnerRows.filter((p) => p.type === "volunteer");
  await db.insert(notifications).values([
    {
      partnerId: row.donorId,
      donationId: row.id,
      kind: "claim",
      title: "Your donation was claimed",
      body: `${ngo.name} claimed “${row.title}”${match ? ` · match score ${match.score}` : ""}. They will coordinate pickup.`,
    },
    {
      partnerId: ngo.id,
      donationId: row.id,
      kind: "claim",
      title: "Claim confirmed",
      body: `You claimed ${row.quantityMeals} meals from ${donor.name}. Schedule a pickup before ${new Date(
        row.expiresAt
      ).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`,
    },
    ...volunteers.map((v) => ({
      partnerId: v.id,
      donationId: row.id,
      kind: "status",
      title: "Pickup task available",
      body: `${ngo.name} needs a runner for “${row.title}” at ${row.address}.`,
    })),
  ]);

  const fresh = await loadWorld();
  const dto = serializeWorld({
    ...fresh,
    donationRows: fresh.donationRows.filter((d) => d.id === row.id),
  })[0];
  void rescue;

  return NextResponse.json({ donation: dto });
}
