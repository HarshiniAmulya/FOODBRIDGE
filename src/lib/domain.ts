// Shared domain constants, types and helpers (safe for client + server).

export const CATEGORIES = [
  "prepared_meals",
  "bakery",
  "produce",
  "dairy",
  "packaged",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface CategoryMeta {
  label: string;
  image: string;
  perishable: boolean;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  prepared_meals: {
    label: "Prepared meals",
    image:
      "https://images.pexels.com/photos/6646987/pexels-photo-6646987.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    perishable: true,
  },
  bakery: {
    label: "Bakery & bread",
    image:
      "https://images.pexels.com/photos/30826792/pexels-photo-30826792.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    perishable: false,
  },
  produce: {
    label: "Fresh produce",
    image:
      "https://images.pexels.com/photos/16776988/pexels-photo-16776988.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    perishable: true,
  },
  dairy: {
    label: "Dairy & chilled",
    image:
      "https://images.pexels.com/photos/9759673/pexels-photo-9759673.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    perishable: true,
  },
  packaged: {
    label: "Sealed & packaged",
    image:
      "https://images.pexels.com/photos/6995221/pexels-photo-6995221.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    perishable: false,
  },
};

export const STORAGE_LABELS: Record<string, string> = {
  hot_hold: "Hot hold (>63°C)",
  chilled: "Chilled (≤5°C)",
  ambient: "Ambient / dry",
  frozen: "Frozen (≤-18°C)",
};

export type DonationStatus =
  | "listed"
  | "claimed"
  | "pickup_scheduled"
  | "collected"
  | "delivered"
  | "expired"
  | "cancelled";

export const STATUS_LABELS: Record<string, string> = {
  listed: "Awaiting claim",
  claimed: "Claimed",
  pickup_scheduled: "Pickup scheduled",
  collected: "Collected",
  delivered: "Delivered",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const STATUS_ORDER = [
  "listed",
  "claimed",
  "pickup_scheduled",
  "collected",
  "delivered",
] as const;

export type Urgency = "critical" | "high" | "medium" | "low" | "over";

export const URGENCY_META: Record<
  Urgency,
  { label: string; color: string; bg: string; dot: string }
> = {
  critical: {
    label: "Critical",
    color: "text-red-50",
    bg: "bg-clay",
    dot: "#C8441C",
  },
  high: {
    label: "High",
    color: "text-amber-950",
    bg: "bg-amber",
    dot: "#E09A1F",
  },
  medium: {
    label: "Moderate",
    color: "text-forest",
    bg: "bg-limesoft",
    dot: "#7A9E3F",
  },
  low: { label: "Low", color: "text-cream", bg: "bg-forest", dot: "#1E5B45" },
  over: { label: "Expired", color: "text-cream/70", bg: "bg-ink/40", dot: "#6b7280" },
};

export function urgencyOf(expiresAt: string | Date, now = new Date()): Urgency {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return "over";
  const h = ms / 3_600_000;
  if (h < 2) return "critical";
  if (h < 6) return "high";
  if (h < 24) return "medium";
  return "low";
}

export function minutesLeft(expiresAt: string | Date, now = new Date()): number {
  return Math.max(
    0,
    Math.round((new Date(expiresAt).getTime() - now.getTime()) / 60_000)
  );
}

export function formatCountdown(target: string | Date, now = new Date()): string {
  const ms = new Date(target).getTime() - now.getTime();
  const past = ms < 0;
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  let out: string;
  if (days > 0) out = `${days}d ${hours}h`;
  else if (hours > 0) out = `${hours}h ${m}m`;
  else out = `${m}m`;
  return past ? `${out} ago` : out;
}

export function formatTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ---------- Serializable DTOs returned by the API ----------

export interface PartnerDto {
  id: string;
  name: string;
  type: "donor" | "ngo" | "volunteer" | "beneficiary";
  lat: number;
  lng: number;
  address: string;
  contact: string | null;
  tagline: string | null;
  capacityMeals: number | null;
  acceptedCategories: string[];
  openFrom: string;
  openTo: string;
  rating: number;
}

export interface RescueDto {
  id: string;
  status: string;
  matchScore: number | null;
  ngoId: string;
  ngoName: string;
  volunteerId: string | null;
  volunteerName: string | null;
  claimedAt: string;
  scheduledAt: string | null;
  collectedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
}

export interface DonationDto {
  id: string;
  title: string;
  category: Category;
  description: string;
  quantityMeals: number;
  quantityKg: number;
  preparedAt: string;
  expiresAt: string;
  storage: string;
  sealed: boolean;
  allergens: string;
  hygieneConfirmed: boolean;
  address: string;
  lat: number;
  lng: number;
  status: DonationStatus;
  safetyStatus: "ok" | "review" | "rejected";
  safetyFlags: string[];
  image: string | null;
  createdAt: string;
  donor: PartnerDto;
  rescue: RescueDto | null;
  urgency: Urgency;
}

export interface MatchDto {
  partnerId: string;
  name: string;
  address: string;
  rating: number;
  capacityMeals: number;
  openFrom: string;
  openTo: string;
  contact: string | null;
  eligible: boolean;
  score: number;
  distanceKm: number;
  etaMinutes: number;
  breakdown: { distance: number; capacity: number; urgency: number; reliability: number };
  reasons: string[];
  blockers: string[];
}

export interface StatsDto {
  mealsRescued: number;
  kgRescued: number;
  co2SavedKg: number;
  activeListings: number;
  completedRescues: number;
  expiredCount: number;
  partnerCounts: { donor: number; ngo: number; volunteer: number; beneficiary: number };
  weekly: { day: string; meals: number }[];
  categoryShare: { key: string; label: string; meals: number }[];
  leaderboard: { ngoId: string; name: string; meals: number; rescues: number; rating: number }[];
  urgencyLive: { critical: number; high: number };
  recent: {
    id: string;
    kind: string;
    title: string;
    body: string;
    createdAt: string;
    donationId: string | null;
  }[];
}
