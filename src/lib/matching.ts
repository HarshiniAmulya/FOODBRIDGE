// ---------------------------------------------------------------------------
// FoodBridge AI — rule-based donor ⇄ NGO matching engine.
// Hard eligibility filters (food category, capacity, reach-in-time, operating
// hours) plus a transparent weighted score: distance 40 · capacity 25 ·
// urgency-window 20 · reliability 15.
// ---------------------------------------------------------------------------

import { CATEGORY_META } from "./domain";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const AVG_SPEED_KMH = 22; // city traffic assumption
const HANDLING_MIN = 15; // dispatch + loading buffer
const SAFETY_BUFFER_MIN = 10; // must arrive at least this long before deadline

export interface NgoLike {
  id: string;
  name: string;
  address?: string;
  contact?: string | null;
  lat: number;
  lng: number;
  capacityMeals: number;
  acceptedCategories: string[];
  openFrom: string;
  openTo: string;
  rating: number;
}

export interface DonationLike {
  category: string;
  quantityMeals: number;
  lat: number;
  lng: number;
  expiresAt: Date | string;
}

export interface MatchResult {
  partnerId: string;
  name: string;
  address: string;
  contact: string | null;
  rating: number;
  capacityMeals: number;
  openFrom: string;
  openTo: string;
  eligible: boolean;
  score: number;
  distanceKm: number;
  etaMinutes: number;
  breakdown: { distance: number; capacity: number; urgency: number; reliability: number };
  reasons: string[];
  blockers: string[];
}

function parseHM(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function withinWindow(moment: Date, openFrom: string, openTo: string): boolean {
  const from = parseHM(openFrom);
  const to = parseHM(openTo);
  const t = moment.getHours() * 60 + moment.getMinutes();
  if (from <= to) return t >= from && t <= to;
  return t >= from || t <= to; // overnight window e.g. 18:00–06:00
}

export function estimateEtaMinutes(a: GeoPoint, b: GeoPoint): number {
  return Math.round(HANDLING_MIN + (haversineKm(a, b) / AVG_SPEED_KMH) * 60);
}

export function rankNgos(
  donation: DonationLike,
  ngos: NgoLike[],
  now = new Date()
): MatchResult[] {
  const expires = new Date(donation.expiresAt);
  const remainingMin = Math.max(0, (expires.getTime() - now.getTime()) / 60_000);
  const catLabel = CATEGORY_META[donation.category]?.label ?? donation.category;

  const results = ngos.map((ngo) => {
    const distanceKm = haversineKm(ngo, donation);
    const etaMinutes = estimateEtaMinutes(ngo, donation);
    const arrival = new Date(now.getTime() + etaMinutes * 60_000);

    const reasons: string[] = [];
    const blockers: string[] = [];

    // ---- Hard eligibility rules -------------------------------------------
    const catOk = ngo.acceptedCategories.includes(donation.category);
    if (!catOk) blockers.push(`Does not accept “${catLabel}” donations`);

    const capOk = ngo.capacityMeals >= donation.quantityMeals;
    if (!capOk)
      blockers.push(
        `Daily capacity ${ngo.capacityMeals} meals < ${donation.quantityMeals} needed`
      );

    const timeOk = etaMinutes <= remainingMin - SAFETY_BUFFER_MIN;
    if (!timeOk)
      blockers.push(
        `Cannot arrive before deadline (ETA ${etaMinutes}m vs ${Math.round(remainingMin)}m left)`
      );

    const windowOk = withinWindow(arrival, ngo.openFrom, ngo.openTo);
    if (!windowOk)
      blockers.push(
        `Arrival outside operating window ${ngo.openFrom}–${ngo.openTo}`
      );

    // ---- Weighted score ----------------------------------------------------
    const distance = Math.round(40 * Math.max(0, 1 - distanceKm / 25));
    const capacity = Math.round(
      25 * Math.min(1, ngo.capacityMeals / Math.max(1, donation.quantityMeals * 2))
    );
    const slack =
      remainingMin <= 0
        ? 0
        : Math.min(1, remainingMin / Math.max(1, etaMinutes * 3));
    const urgency = Math.round(20 * slack);
    const reliability = Math.round(15 * (ngo.rating / 5));

    const eligible = catOk && capOk && timeOk && windowOk;
    const score = eligible ? distance + capacity + urgency + reliability : 0;

    if (eligible) {
      reasons.push(
        `${distanceKm.toFixed(1)} km away — on site in ~${etaMinutes} min`
      );
      reasons.push(
        `Capacity ${ngo.capacityMeals} meals/day comfortably covers ${donation.quantityMeals} meals`
      );
      reasons.push(
        slack > 0.66
          ? `${Math.round(remainingMin)}-min collection window — comfortable margin`
          : `${Math.round(remainingMin)}-min window — tight but feasible`
      );
      reasons.push(`Reliability ${ngo.rating.toFixed(1)}/5 across past rescues`);
    }

    return {
      partnerId: ngo.id,
      name: ngo.name,
      address: ngo.address ?? "",
      contact: ngo.contact ?? null,
      rating: ngo.rating,
      capacityMeals: ngo.capacityMeals,
      openFrom: ngo.openFrom,
      openTo: ngo.openTo,
      eligible,
      score,
      distanceKm: Math.round(distanceKm * 10) / 10,
      etaMinutes,
      breakdown: { distance, capacity, urgency, reliability },
      reasons,
      blockers,
    };
  });

  return results.sort((a, b) =>
    a.eligible === b.eligible ? b.score - a.score : a.eligible ? -1 : 1
  );
}

// ---------------------------------------------------------------------------
// Food-safety screening — runs before a listing is published.
// ---------------------------------------------------------------------------

export interface SafetyInput {
  category: string;
  preparedAt: Date | string;
  expiresAt: Date | string;
  storage: string;
  sealed: boolean;
  hygieneConfirmed: boolean;
  allergens: string;
  quantityMeals: number;
}

export interface SafetyVerdict {
  status: "ok" | "review" | "rejected";
  flags: string[];
}

export function checkFoodSafety(input: SafetyInput, now = new Date()): SafetyVerdict {
  const flags: string[] = [];
  const prepared = new Date(input.preparedAt);
  const expires = new Date(input.expiresAt);
  const perishable = CATEGORY_META[input.category]?.perishable ?? true;

  const ageH = (now.getTime() - prepared.getTime()) / 3_600_000;
  const windowH = (expires.getTime() - prepared.getTime()) / 3_600_000;

  if (expires.getTime() <= now.getTime()) {
    // Fatal — cannot publish a listing whose deadline already passed.
    return { status: "rejected", flags: ["Collection deadline is already in the past."] };
  }
  if (prepared.getTime() > now.getTime() + 10 * 60_000) {
    flags.push("Preparation time is in the future — please verify the timestamp.");
  }
  if (perishable && input.storage === "ambient" && ageH > 2) {
    flags.push(
      `Perishable food held at ambient temperature for ${ageH.toFixed(1)}h — exceeds the 2-hour guidance.`
    );
  }
  if (perishable && windowH > 24) {
    flags.push(
      `Perishable listing with a ${Math.round(windowH)}h usable window — cold chain must be verified.`
    );
  }
  if (input.storage === "hot_hold" && ageH > 4) {
    flags.push("Hot-held food older than 4h — quality & safety must be re-checked.");
  }
  if (!input.hygieneConfirmed) {
    flags.push("Food-handler hygiene declaration is missing.");
  }
  if (!input.sealed && (input.category === "packaged" || input.category === "dairy")) {
    flags.push("Packaging not sealed — visual verification required at pickup.");
  }
  if (input.allergens.trim().length === 0) {
    flags.push("Allergen information not provided.");
  }
  if (input.quantityMeals >= 120 && input.storage !== "ambient") {
    flags.push(
      "Large-volume perishable load — recipient must confirm refrigerated transport."
    );
  }

  return { status: flags.length === 0 ? "ok" : "review", flags };
}
