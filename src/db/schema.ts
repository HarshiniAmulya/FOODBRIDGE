import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Partners are the four actor groups on FoodBridge AI:
 * donors (restaurants, hotels, bakeries, events), NGOs, volunteers, beneficiaries.
 */
export const partners = pgTable("partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // donor | ngo | volunteer | beneficiary
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address").notNull(),
  contact: text("contact"),
  tagline: text("tagline"),
  // NGO-specific matching profile
  capacityMeals: integer("capacity_meals"),
  acceptedCategories: jsonb("accepted_categories").$type<string[]>().default([]),
  openFrom: text("open_from").default("06:00"),
  openTo: text("open_to").default("22:00"),
  rating: real("rating").default(4.5),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  donorId: text("donor_id")
    .notNull()
    .references(() => partners.id),
  title: text("title").notNull(),
  category: text("category").notNull(), // prepared_meals | bakery | produce | dairy | packaged
  description: text("description").default(""),
  quantityMeals: integer("quantity_meals").notNull(),
  quantityKg: real("quantity_kg").notNull(),
  preparedAt: timestamp("prepared_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // collection deadline
  storage: text("storage").notNull(), // hot_hold | chilled | ambient | frozen
  sealed: boolean("sealed").default(false),
  allergens: text("allergens").default(""),
  hygieneConfirmed: boolean("hygiene_confirmed").default(false),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  status: text("status").notNull().default("listed"),
  // listed | claimed | pickup_scheduled | collected | delivered | expired | cancelled
  safetyStatus: text("safety_status").notNull().default("ok"), // ok | review | rejected
  safetyFlags: jsonb("safety_flags").$type<string[]>().default([]),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rescues = pgTable("rescues", {
  id: uuid("id").primaryKey().defaultRandom(),
  donationId: uuid("donation_id")
    .notNull()
    .references(() => donations.id),
  ngoId: text("ngo_id")
    .notNull()
    .references(() => partners.id),
  volunteerId: text("volunteer_id").references(() => partners.id),
  status: text("status").notNull().default("claimed"),
  // claimed | pickup_scheduled | collected | delivered
  matchScore: integer("match_score"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).defaultNow().notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: text("partner_id")
    .notNull()
    .references(() => partners.id),
  donationId: uuid("donation_id").references(() => donations.id),
  kind: text("kind").notNull().default("system"), // match_alert | claim | status | system
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PartnerRow = typeof partners.$inferSelect;
export type DonationRow = typeof donations.$inferSelect;
export type RescueRow = typeof rescues.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
