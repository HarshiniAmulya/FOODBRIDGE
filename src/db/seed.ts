// Idempotent seed: populates the platform with a realistic Bengaluru network
// (donors, NGOs, volunteers, beneficiaries) and donations spanning the full
// rescue lifecycle. Timestamps are relative to seed time so urgency is live.
import { db } from "@/db";
import { partners, donations, rescues, notifications } from "@/db/schema";
import { sql } from "drizzle-orm";
import { CATEGORY_META } from "@/lib/domain";

const MIN = 60_000;
const H = 3_600_000;

export async function seedIfEmpty(): Promise<boolean> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(partners);
  if (count > 0) return false;

  const now = Date.now();
  const future = (ms: number) => new Date(now + ms);
  const past = (ms: number) => new Date(now - ms);

  // ----------------------------- Partners --------------------------------
  const partnerRows = [
    // Donors
    { id: "donor-greenfork", name: "GreenFork Bistro", type: "donor", lat: 12.9719, lng: 77.6412, address: "100 Feet Rd, Indiranagar", contact: "+91 98450 11223", tagline: "Neighbourhood kitchen · zero-waste pledge", rating: 4.7 },
    { id: "donor-sunrise", name: "Sunrise Bakery Co.", type: "donor", lat: 12.9352, lng: 77.6245, address: "80 Feet Rd, Koramangala", contact: "+91 98450 44556", tagline: "Artisan bakes, surplus shared daily", rating: 4.5 },
    { id: "donor-meridian", name: "Grand Meridian Hotel", type: "donor", lat: 12.9758, lng: 77.6011, address: "MG Road, Central Bengaluru", contact: "+91 98450 77889", tagline: "Banquets & buffets, 400 covers a night", rating: 4.8 },
    { id: "donor-campus", name: "Campus Events Collective", type: "donor", lat: 12.9698, lng: 77.7500, address: "ITPL Main Rd, Whitefield", contact: "+91 98450 99001", tagline: "Catering for 2,000+ attendee events", rating: 4.2 },
    // NGOs
    { id: "ngo-hope-kitchen", name: "Hope Kitchen Foundation", type: "ngo", lat: 12.9699, lng: 77.5990, address: "Richmond Town", contact: "+91 99010 22334", tagline: "Community kitchen serving 3 wards", capacityMeals: 400, acceptedCategories: ["prepared_meals", "bakery", "produce", "dairy", "packaged"], openFrom: "05:00", openTo: "22:00", rating: 4.8 },
    { id: "ngo-annapoorna", name: "Annapoorna Seva Trust", type: "ngo", lat: 12.9279, lng: 77.6271, address: "HSR Layout", contact: "+91 99010 55667", tagline: "Midday meals for shelter residents", capacityMeals: 250, acceptedCategories: ["prepared_meals", "packaged", "produce"], openFrom: "06:00", openTo: "21:00", rating: 4.6 },
    { id: "ngo-city-shelter", name: "City Shelter Network", type: "ngo", lat: 12.9783, lng: 77.5713, address: "Chickpet", contact: "+91 99010 88990", tagline: "24×7 night shelters across the city", capacityMeals: 600, acceptedCategories: ["prepared_meals", "bakery", "produce", "dairy", "packaged"], openFrom: "00:00", openTo: "23:59", rating: 4.9 },
    { id: "ngo-bright-futures", name: "Bright Futures Home", type: "ngo", lat: 12.9121, lng: 77.6446, address: "BTM Layout", contact: "+91 99010 33445", tagline: "Residential care for 118 children", capacityMeals: 120, acceptedCategories: ["prepared_meals", "bakery", "dairy"], openFrom: "07:00", openTo: "20:00", rating: 4.4 },
    { id: "ngo-riverside", name: "Riverside Community Fridge", type: "ngo", lat: 12.9879, lng: 77.5947, address: "Palace Orchards", contact: "+91 99010 66778", tagline: "Open fridge, take what you need", capacityMeals: 90, acceptedCategories: ["produce", "bakery", "packaged"], openFrom: "08:00", openTo: "21:00", rating: 4.2 },
    // Volunteers
    { id: "vol-asha", name: "Asha Verma", type: "volunteer", lat: 12.9667, lng: 77.6031, address: "Shanthinagar", contact: "+91 98111 20304", tagline: "Refrigerated van · evenings", rating: 4.9 },
    { id: "vol-rahul", name: "Rahul Menon", type: "volunteer", lat: 12.9407, lng: 77.6300, address: "Koramangala 5th Block", contact: "+91 98111 50607", tagline: "Bike courier · quickest in the south", rating: 4.6 },
    { id: "vol-priya", name: "Priya Nair", type: "volunteer", lat: 12.9800, lng: 77.5800, address: "Malleshwaram", contact: "+91 98111 80910", tagline: "Weekend runs · cooler boxes", rating: 4.7 },
    // Beneficiaries
    { id: "ben-learning-center", name: "Udaan Learning Center", type: "beneficiary", lat: 12.9850, lng: 77.6100, address: "Frazer Town", contact: "+91 97330 11223", tagline: "Evening meals for 80 students", rating: 4.5 },
    { id: "ben-elder-care", name: "Silver Years Elder Care", type: "beneficiary", lat: 12.9500, lng: 77.5850, address: "Jayanagar", contact: "+91 97330 44556", tagline: "Soft-diet meals for 60 residents", rating: 4.5 },
  ];
  await db.insert(partners).values(partnerRows);

  // ----------------------------- Donations --------------------------------
  type SeedDonation = {
    id: string; donorId: string; title: string; category: string;
    description: string; quantityMeals: number; quantityKg: number;
    preparedAt: Date; expiresAt: Date; storage: string; sealed: boolean;
    allergens: string; hygieneConfirmed: boolean; status: string;
    safetyStatus: string; safetyFlags: string[]; createdAt: Date;
    address: string; lat: number; lng: number;
  };

  const D: SeedDonation[] = [
    {
      id: "11111111-1111-4111-8111-111111111101", donorId: "donor-meridian",
      title: "Banquet surplus — paneer tikka, veg biryani & dal", category: "prepared_meals",
      description: "Corporate gala under-ran by ~120 covers. Trays held at safe hot-hold, untouched service line.",
      quantityMeals: 120, quantityKg: 46, preparedAt: past(2 * H), expiresAt: future(95 * MIN),
      storage: "hot_hold", sealed: true, allergens: "Dairy, nuts (cashew)", hygieneConfirmed: true,
      status: "listed", safetyStatus: "ok", safetyFlags: [], createdAt: past(30 * MIN),
      address: "Banquet kitchen, Grand Meridian Hotel, MG Road", lat: 12.9758, lng: 77.6011,
    },
    {
      id: "11111111-1111-4111-8111-111111111102", donorId: "donor-sunrise",
      title: "Day-end sourdough, croissants & rolls", category: "bakery",
      description: "Baked this morning; 84 pieces across 6 crates, individually paper-wrapped.",
      quantityMeals: 84, quantityKg: 21, preparedAt: past(9 * H), expiresAt: future(5 * H),
      storage: "ambient", sealed: true, allergens: "Gluten, butter (dairy)", hygieneConfirmed: true,
      status: "listed", safetyStatus: "ok", safetyFlags: [], createdAt: past(50 * MIN),
      address: "Back counter, Sunrise Bakery, Koramangala", lat: 12.9352, lng: 77.6245,
    },
    {
      id: "11111111-1111-4111-8111-111111111103", donorId: "donor-greenfork",
      title: "Fresh produce crates — tomatoes, spinach, beans", category: "produce",
      description: "Over-ordered for the weekend menu. Crisp, unwashed, straight from the morning market run.",
      quantityMeals: 160, quantityKg: 88, preparedAt: past(6 * H), expiresAt: future(22 * H),
      storage: "chilled", sealed: false, allergens: "", hygieneConfirmed: true,
      status: "listed", safetyStatus: "review", safetyFlags: ["Allergen information not provided."],
      createdAt: past(70 * MIN),
      address: "GreenFork Bistro kitchen door, Indiranagar", lat: 12.9719, lng: 77.6412,
    },
    {
      id: "11111111-1111-4111-8111-111111111104", donorId: "donor-campus",
      title: "Sealed conference meal trays — pasta primavera", category: "packaged",
      description: "Tech summit cancelled a breakout session. 150 sealed trays, cold-chained since pack-out.",
      quantityMeals: 150, quantityKg: 52, preparedAt: past(4 * H), expiresAt: future(30 * H),
      storage: "chilled", sealed: true, allergens: "Gluten, dairy", hygieneConfirmed: true,
      status: "listed", safetyStatus: "review",
      safetyFlags: ["Large-volume perishable load — recipient must confirm refrigerated transport."],
      createdAt: past(2 * H),
      address: "Loading bay B, Campus Events, Whitefield", lat: 12.9698, lng: 77.7500,
    },
    {
      id: "11111111-1111-4111-8111-111111111105", donorId: "donor-meridian",
      title: "Breakfast buffet — idli, poha, cut fruit", category: "prepared_meals",
      description: "Sunday brunch over-production, kept in chafing dishes. Fruit cups sealed and chilled.",
      quantityMeals: 95, quantityKg: 34, preparedAt: past(3 * H), expiresAt: future(4 * H),
      storage: "hot_hold", sealed: true, allergens: "None declared", hygieneConfirmed: true,
      status: "claimed", safetyStatus: "ok", safetyFlags: [], createdAt: past(80 * MIN),
      address: "Service lift 2, Grand Meridian Hotel", lat: 12.9758, lng: 77.6011,
    },
    {
      id: "11111111-1111-4111-8111-111111111106", donorId: "donor-sunrise",
      title: "Multigrain loaves & dinner rolls", category: "bakery",
      description: "Wholesale order returned — 60 loaves, shelf-stable until tomorrow evening.",
      quantityMeals: 60, quantityKg: 24, preparedAt: past(12 * H), expiresAt: future(26 * H),
      storage: "ambient", sealed: true, allergens: "Gluten, sesame", hygieneConfirmed: true,
      status: "pickup_scheduled", safetyStatus: "ok", safetyFlags: [], createdAt: past(3 * H),
      address: "Front desk, Sunrise Bakery, Koramangala", lat: 12.9352, lng: 77.6245,
    },
  ];

  // Delivered history (spread across the last 7 days for the impact charts)
  const deliveredSeeds = [
    { n: 1, days: 6, meals: 140, kg: 62, cat: "produce", donor: "donor-greenfork", title: "Market-remainder produce mix" },
    { n: 2, days: 5, meals: 90, kg: 27, cat: "bakery", donor: "donor-sunrise", title: "Evening bread & bun surplus" },
    { n: 3, days: 4, meals: 260, kg: 96, cat: "prepared_meals", donor: "donor-campus", title: "Hackathon dinner overrun" },
    { n: 4, days: 3, meals: 220, kg: 81, cat: "prepared_meals", donor: "donor-meridian", title: "Wedding banquet surplus" },
    { n: 5, days: 2, meals: 75, kg: 22, cat: "dairy", donor: "donor-meridian", title: "Sealed yogurt & lassi cups" },
    { n: 6, days: 1, meals: 180, kg: 58, cat: "packaged", donor: "donor-campus", title: "Boxed lunches from expo" },
  ];
  for (const s of deliveredSeeds) {
    D.push({
      id: `22222222-2222-4222-8222-2222222222${String(s.n).padStart(2, "0")}`,
      donorId: s.donor, title: s.title, category: s.cat,
      description: "",
      quantityMeals: s.meals, quantityKg: s.kg,
      preparedAt: past(s.days * 24 * H + 5 * H), expiresAt: past(s.days * 24 * H - 2 * H),
      storage: "chilled", sealed: true, allergens: "", hygieneConfirmed: true,
      status: "delivered", safetyStatus: "ok", safetyFlags: [],
      createdAt: past(s.days * 24 * H + 6 * H),
      address: "Bengaluru", lat: 12.94 + s.n * 0.01, lng: 77.58 + s.n * 0.01,
    });
  }
  // One expired & unclaimed listing — feeds the "missed rescue" metric.
  D.push({
    id: "33333333-3333-4333-8333-333333333301", donorId: "donor-campus",
    title: "Sangeet dinner trays — paneer & rice", category: "prepared_meals",
    description: "", quantityMeals: 110, quantityKg: 41,
    preparedAt: past(30 * H), expiresAt: past(20 * H),
    storage: "hot_hold", sealed: true, allergens: "", hygieneConfirmed: true,
    status: "expired", safetyStatus: "ok", safetyFlags: [], createdAt: past(31 * H),
    address: "Whitefield", lat: 12.9698, lng: 77.75,
  });

  await db.insert(donations).values(
    D.map((d) => ({
      ...d,
      image: CATEGORY_META[d.category]?.image ?? null,
    }))
  );

  // ----------------------------- Rescues ----------------------------------
  const rescueRows: (typeof rescues.$inferInsert)[] = [
    {
      donationId: "11111111-1111-4111-8111-111111111105",
      ngoId: "ngo-hope-kitchen", status: "claimed", matchScore: 88,
      claimedAt: past(20 * MIN), notes: "Van dispatched after dinner service estimate.",
    },
    {
      donationId: "11111111-1111-4111-8111-111111111106",
      ngoId: "ngo-city-shelter", volunteerId: "vol-rahul", status: "pickup_scheduled",
      matchScore: 81, claimedAt: past(2 * H), scheduledAt: future(40 * MIN),
      notes: "Rahul collecting 3 crates by bike trailer.",
    },
  ];
  const ngoCycle = ["ngo-hope-kitchen", "ngo-city-shelter", "ngo-annapoorna", "ngo-bright-futures"];
  deliveredSeeds.forEach((s, i) => {
    rescueRows.push({
      donationId: `22222222-2222-4222-8222-2222222222${String(s.n).padStart(2, "0")}`,
      ngoId: ngoCycle[i % ngoCycle.length],
      volunteerId: i % 2 === 0 ? "vol-asha" : "vol-priya",
      status: "delivered",
      matchScore: 78 + ((i * 7) % 20),
      claimedAt: past(s.days * 24 * H + 5 * H),
      scheduledAt: past(s.days * 24 * H + 4 * H),
      collectedAt: past(s.days * 24 * H + 3 * H),
      deliveredAt: past(s.days * 24 * H - 2 * H),
      notes: "",
    });
  });
  await db.insert(rescues).values(rescueRows);

  // ----------------------------- Notifications ----------------------------
  await db.insert(notifications).values([
    {
      partnerId: "ngo-hope-kitchen", donationId: "11111111-1111-4111-8111-111111111101",
      kind: "match_alert", title: "Urgent match · 92",
      body: "120 meals at Grand Meridian Hotel — 3.1 km away, deadline in ~1.5h. Claim before the window closes.",
    },
    {
      partnerId: "ngo-city-shelter", donationId: "11111111-1111-4111-8111-111111111101",
      kind: "match_alert", title: "Urgent match · 90",
      body: "120 meals at Grand Meridian Hotel — 2.6 km away. Your 24×7 window fits this pickup.",
    },
    {
      partnerId: "donor-meridian", donationId: "11111111-1111-4111-8111-111111111105",
      kind: "claim", title: "Your donation was claimed",
      body: "Hope Kitchen Foundation claimed “Breakfast buffet — idli, poha, cut fruit”. Match score 88.",
    },
    {
      partnerId: "vol-rahul", donationId: "11111111-1111-4111-8111-111111111106",
      kind: "status", title: "Pickup assigned",
      body: "Collect 60 multigrain loaves from Sunrise Bakery, Koramangala — pickup window opens soon.",
    },
    {
      partnerId: "ngo-annapoorna", donationId: "11111111-1111-4111-8111-111111111104",
      kind: "match_alert", title: "New match · 74",
      body: "150 sealed meal trays in Whitefield — requires refrigerated transport. Deadline ~30h.",
    },
  ]);

  return true;
}
