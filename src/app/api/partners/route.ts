import { NextResponse } from "next/server";
import { ensureSeeded, loadWorld, toPartnerDto } from "@/lib/server-data";

export async function GET() {
  await ensureSeeded();
  const world = await loadWorld();
  const order = { donor: 0, ngo: 1, volunteer: 2, beneficiary: 3 } as Record<string, number>;
  const data = world.partnerRows
    .map(toPartnerDto)
    .sort((a, b) => order[a.type] - order[b.type] || a.name.localeCompare(b.name));
  return NextResponse.json({ partners: data });
}
