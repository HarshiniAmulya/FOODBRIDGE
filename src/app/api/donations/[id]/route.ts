import { NextRequest, NextResponse } from "next/server";
import {
  ensureSeeded,
  expireStale,
  loadWorld,
  serializeWorld,
  toNgoLike,
} from "@/lib/server-data";
import { rankNgos } from "@/lib/matching";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  await expireStale();
  const { id } = await params;
  const world = await loadWorld();
  const row = world.donationRows.find((d) => d.id === id);
  if (!row) return NextResponse.json({ error: "Donation not found" }, { status: 404 });

  const dto = serializeWorld({
    ...world,
    donationRows: [row],
  })[0];

  const ngos = world.partnerRows.filter((p) => p.type === "ngo");
  const matches = rankNgos(
    {
      category: row.category,
      quantityMeals: row.quantityMeals,
      lat: row.lat,
      lng: row.lng,
      expiresAt: row.expiresAt,
    },
    ngos.map(toNgoLike)
  );

  return NextResponse.json({ donation: dto, matches });
}
