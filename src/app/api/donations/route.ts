import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { donations, notifications } from "@/db/schema";
import {
  ensureSeeded,
  expireStale,
  loadWorld,
  serializeWorld,
  toNgoLike,
} from "@/lib/server-data";
import { rankNgos, checkFoodSafety, estimateEtaMinutes } from "@/lib/matching";
import { CATEGORY_META, STATUS_LABELS, formatCountdown } from "@/lib/domain";

const LIVE = ["listed", "claimed", "pickup_scheduled", "collected"];

export async function GET(req: NextRequest) {
  await ensureSeeded();
  await expireStale();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // live | listed | delivered | expired | all
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  const world = await loadWorld();
  let list = serializeWorld(world);

  if (status === "live") list = list.filter((d) => LIVE.includes(d.status));
  else if (status && status !== "all") list = list.filter((d) => d.status === status);
  if (category && category !== "all") list = list.filter((d) => d.category === category);

  const urgencyRank = { critical: 0, high: 1, medium: 2, low: 3, over: 4 };
  list.sort((a, b) => {
    const aLive = LIVE.includes(a.status) ? 0 : 1;
    const bLive = LIVE.includes(b.status) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    if (aLive === 0 && a.status === "listed" && b.status === "listed") {
      const r = urgencyRank[a.urgency] - urgencyRank[b.urgency];
      if (r !== 0) return r;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ donations: list.slice(0, limit) });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = ["donorId", "title", "category", "quantityMeals", "quantityKg", "preparedAt", "expiresAt", "storage", "address", "lat", "lng"] as const;
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return NextResponse.json({ error: `Missing required field: ${k}` }, { status: 422 });
    }
  }
  if (!CATEGORY_META[body.category as string]) {
    return NextResponse.json({ error: "Unknown food category" }, { status: 422 });
  }

  const verdict = checkFoodSafety({
    category: body.category as string,
    preparedAt: new Date(body.preparedAt as string),
    expiresAt: new Date(body.expiresAt as string),
    storage: body.storage as string,
    sealed: !!body.sealed,
    hygieneConfirmed: !!body.hygieneConfirmed,
    allergens: (body.allergens as string) ?? "",
    quantityMeals: Number(body.quantityMeals),
  });
  if (verdict.status === "rejected") {
    return NextResponse.json(
      { error: "Listing failed food-safety screening", flags: verdict.flags },
      { status: 422 }
    );
  }

  const [inserted] = await db
    .insert(donations)
    .values({
      donorId: body.donorId as string,
      title: (body.title as string).trim(),
      category: body.category as string,
      description: ((body.description as string) ?? "").trim(),
      quantityMeals: Number(body.quantityMeals),
      quantityKg: Number(body.quantityKg),
      preparedAt: new Date(body.preparedAt as string),
      expiresAt: new Date(body.expiresAt as string),
      storage: body.storage as string,
      sealed: !!body.sealed,
      allergens: ((body.allergens as string) ?? "").trim(),
      hygieneConfirmed: !!body.hygieneConfirmed,
      address: (body.address as string).trim(),
      lat: Number(body.lat),
      lng: Number(body.lng),
      status: "listed",
      safetyStatus: verdict.status,
      safetyFlags: verdict.flags,
      image: CATEGORY_META[body.category as string]?.image ?? null,
    })
    .returning();

  // ---- Smart matching + rescue alerts --------------------------------------
  const world = await loadWorld();
  const ngos = world.partnerRows.filter((p) => p.type === "ngo");
  const matches = rankNgos(
    {
      category: inserted.category,
      quantityMeals: inserted.quantityMeals,
      lat: inserted.lat,
      lng: inserted.lng,
      expiresAt: inserted.expiresAt,
    },
    ngos.map(toNgoLike)
  );
  const top = matches.filter((m) => m.eligible).slice(0, 3);

  if (top.length > 0) {
    const donor = world.partnersById.get(inserted.donorId);
    await db.insert(notifications).values(
      top.map((m) => ({
        partnerId: m.partnerId,
        donationId: inserted.id,
        kind: "match_alert",
        title: `Rescue alert · match ${m.score}`,
        body: `${inserted.quantityMeals} meals of “${inserted.title}” at ${
          donor?.name ?? "a donor"
        } — ${m.distanceKm} km away (~${m.etaMinutes} min), deadline in ${formatCountdown(
          inserted.expiresAt
        )}. Eligible for your ${CATEGORY_META[inserted.category]?.label} intake.`,
      }))
    );
  }

  const donorRow = world.partnersById.get(inserted.donorId)!;
  const dto = serializeWorld({
    ...world,
    donationRows: [inserted],
  })[0];
  void donorRow;

  return NextResponse.json(
    {
      donation: { ...dto, statusLabel: STATUS_LABELS[dto.status] },
      matches: matches.slice(0, 5),
      notified: top.length,
      safety: verdict,
    },
    { status: 201 }
  );
}
