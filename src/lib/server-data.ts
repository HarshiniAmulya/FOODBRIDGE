import { db } from "@/db";
import {
  partners,
  donations,
  rescues,
  DonationRow,
  PartnerRow,
  RescueRow,
  NotificationRow,
} from "@/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { seedIfEmpty } from "@/db/seed";
import { PartnerDto, DonationDto, RescueDto, urgencyOf } from "@/lib/domain";
import { NgoLike } from "@/lib/matching";

export async function ensureSeeded() {
  try {
    await seedIfEmpty();
  } catch (e) {
    console.error("seed check failed", e);
  }
}

/** Lazily expires unclaimed listings whose collection deadline passed. */
export async function expireStale() {
  await db
    .update(donations)
    .set({ status: "expired" })
    .where(and(eq(donations.status, "listed"), lt(donations.expiresAt, new Date())));
}

export function toPartnerDto(p: PartnerRow): PartnerDto {
  return {
    id: p.id,
    name: p.name,
    type: p.type as PartnerDto["type"],
    lat: p.lat,
    lng: p.lng,
    address: p.address,
    contact: p.contact,
    tagline: p.tagline,
    capacityMeals: p.capacityMeals,
    acceptedCategories: p.acceptedCategories ?? [],
    openFrom: p.openFrom ?? "06:00",
    openTo: p.openTo ?? "22:00",
    rating: p.rating ?? 4.5,
  };
}

export function toNgoLike(p: PartnerRow): NgoLike {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    contact: p.contact,
    lat: p.lat,
    lng: p.lng,
    capacityMeals: p.capacityMeals ?? 0,
    acceptedCategories: p.acceptedCategories ?? [],
    openFrom: p.openFrom ?? "06:00",
    openTo: p.openTo ?? "22:00",
    rating: p.rating ?? 4.5,
  };
}

export function toDonationDto(
  d: DonationRow,
  donor: PartnerRow,
  rescue: RescueRow | null,
  partnersById: Map<string, PartnerRow>
): DonationDto {
  const ngo = rescue ? partnersById.get(rescue.ngoId) : undefined;
  const volunteer = rescue?.volunteerId
    ? partnersById.get(rescue.volunteerId)
    : undefined;
  const rescueDto: RescueDto | null = rescue
    ? {
        id: rescue.id,
        status: rescue.status,
        matchScore: rescue.matchScore,
        ngoId: rescue.ngoId,
        ngoName: ngo?.name ?? rescue.ngoId,
        volunteerId: rescue.volunteerId,
        volunteerName: volunteer?.name ?? null,
        claimedAt: rescue.claimedAt.toISOString(),
        scheduledAt: rescue.scheduledAt?.toISOString() ?? null,
        collectedAt: rescue.collectedAt?.toISOString() ?? null,
        deliveredAt: rescue.deliveredAt?.toISOString() ?? null,
        notes: rescue.notes,
      }
    : null;
  return {
    id: d.id,
    title: d.title,
    category: d.category as DonationDto["category"],
    description: d.description ?? "",
    quantityMeals: d.quantityMeals,
    quantityKg: d.quantityKg,
    preparedAt: d.preparedAt.toISOString(),
    expiresAt: d.expiresAt.toISOString(),
    storage: d.storage,
    sealed: d.sealed ?? false,
    allergens: d.allergens ?? "",
    hygieneConfirmed: d.hygieneConfirmed ?? false,
    address: d.address,
    lat: d.lat,
    lng: d.lng,
    status: d.status as DonationDto["status"],
    safetyStatus: d.safetyStatus as DonationDto["safetyStatus"],
    safetyFlags: d.safetyFlags ?? [],
    image: d.image,
    createdAt: d.createdAt.toISOString(),
    donor: toPartnerDto(donor),
    rescue: rescueDto,
    urgency: urgencyOf(d.expiresAt),
  };
}

export interface World {
  partnerRows: PartnerRow[];
  donationRows: DonationRow[];
  rescueRows: RescueRow[];
  partnersById: Map<string, PartnerRow>;
  rescueByDonation: Map<string, RescueRow>;
}

export async function loadWorld(): Promise<World> {
  const [partnerRows, donationRows, rescueRows] = await Promise.all([
    db.select().from(partners),
    db.select().from(donations).orderBy(desc(donations.createdAt)),
    db.select().from(rescues).orderBy(desc(rescues.createdAt)),
  ]);
  const partnersById = new Map(partnerRows.map((p) => [p.id, p]));
  const rescueByDonation = new Map<string, RescueRow>();
  for (const r of rescueRows) {
    // rescueRows sorted newest first — first occurrence is the latest
    if (!rescueByDonation.has(r.donationId)) rescueByDonation.set(r.donationId, r);
  }
  return { partnerRows, donationRows, rescueRows, partnersById, rescueByDonation };
}

export function serializeWorld(world: World): DonationDto[] {
  return world.donationRows
    .map((d) => {
      const donor = world.partnersById.get(d.donorId);
      if (!donor) return null;
      return toDonationDto(
        d,
        donor,
        world.rescueByDonation.get(d.id) ?? null,
        world.partnersById
      );
    })
    .filter((x): x is DonationDto => x !== null);
}

export type { DonationRow, PartnerRow, RescueRow, NotificationRow };
