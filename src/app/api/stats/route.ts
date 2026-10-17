import { NextResponse } from "next/server";
import { ensureSeeded, expireStale, loadWorld } from "@/lib/server-data";
import { CATEGORY_META, urgencyOf } from "@/lib/domain";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc } from "drizzle-orm";

const CO2_PER_KG = 2.5; // kg CO2e avoided per kg of food rescued (kept conservative)

export async function GET() {
  await ensureSeeded();
  await expireStale();
  const world = await loadWorld();

  const delivered = world.donationRows.filter((d) => d.status === "delivered");
  const mealsRescued = delivered.reduce((s, d) => s + d.quantityMeals, 0);
  const kgRescued = delivered.reduce((s, d) => s + d.quantityKg, 0);
  const activeListings = world.donationRows.filter((d) => d.status === "listed").length;
  const completedRescues = delivered.length;
  const expiredCount = world.donationRows.filter((d) => d.status === "expired").length;

  const partnerCounts = { donor: 0, ngo: 0, volunteer: 0, beneficiary: 0 };
  for (const p of world.partnerRows) {
    if (p.type in partnerCounts) {
      partnerCounts[p.type as keyof typeof partnerCounts] += 1;
    }
  }

  // Last-7-days rescued meals (by deliveredAt)
  const weekly: { day: string; meals: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86_400_000);
    const key = day.toDateString();
    const meals = world.rescueRows
      .filter((r) => r.deliveredAt && r.deliveredAt.toDateString() === key)
      .reduce((s, r) => {
        const d = world.donationRows.find((x) => x.id === r.donationId);
        return s + (d?.quantityMeals ?? 0);
      }, 0);
    weekly.push({
      day: day.toLocaleDateString("en-IN", { weekday: "short" }),
      meals,
    });
  }

  const catMap = new Map<string, number>();
  for (const d of delivered) {
    catMap.set(d.category, (catMap.get(d.category) ?? 0) + d.quantityMeals);
  }
  const categoryShare = [...catMap.entries()].map(([key, meals]) => ({
    key,
    label: CATEGORY_META[key]?.label ?? key,
    meals,
  }));

  const lb = new Map<string, { meals: number; rescues: number }>();
  for (const r of world.rescueRows.filter((x) => x.status === "delivered")) {
    const d = world.donationRows.find((x) => x.id === r.donationId);
    const cur = lb.get(r.ngoId) ?? { meals: 0, rescues: 0 };
    cur.meals += d?.quantityMeals ?? 0;
    cur.rescues += 1;
    lb.set(r.ngoId, cur);
  }
  const leaderboard = [...lb.entries()]
    .map(([ngoId, v]) => {
      const p = world.partnersById.get(ngoId);
      return {
        ngoId,
        name: p?.name ?? ngoId,
        meals: v.meals,
        rescues: v.rescues,
        rating: p?.rating ?? 4.5,
      };
    })
    .sort((a, b) => b.meals - a.meals);

  const listed = world.donationRows.filter((d) => d.status === "listed");
  const urgencyLive = {
    critical: listed.filter((d) => urgencyOf(d.expiresAt) === "critical").length,
    high: listed.filter((d) => urgencyOf(d.expiresAt) === "high").length,
  };

  const recent = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(10);

  return NextResponse.json({
    mealsRescued,
    kgRescued,
    co2SavedKg: Math.round(kgRescued * CO2_PER_KG),
    activeListings,
    completedRescues,
    expiredCount,
    partnerCounts,
    weekly,
    categoryShare,
    leaderboard,
    urgencyLive,
    recent: recent.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      donationId: n.donationId,
    })),
  });
}
