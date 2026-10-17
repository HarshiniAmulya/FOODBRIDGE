# FoodBridge AI — Smart Surplus Food Rescue & Redistribution Platform

> **Rescue Surplus. Redistribute Hope.**
> Built for Hackfest · GreenTech & Impact · Social Innovation track

FoodBridge AI connects **food donors** (restaurants, hotels, bakeries, events), **NGOs**,
**collection volunteers** and **beneficiary organisations** on one platform. It identifies
available surplus food, ranks the most suitable nearby NGOs with a transparent rule-based
matching engine, prioritises time-sensitive donations, coordinates collection, and measures
the outcome on a live impact dashboard.

---

## Features

| Area | What it does |
| --- | --- |
| **Smart donor ⇄ NGO matching** | Hard eligibility rules (food category, capacity, reach-before-deadline, operating hours) + a transparent 100-pt score: **distance 40 · capacity 25 · time window 20 · reliability 15**. Fully explainable per match. |
| **Urgency-aware alerts** | Listings decay in real time (critical < 2h, high < 6h). Top-matched NGOs receive instant in-app rescue alerts. |
| **Food-safety screening** | Every listing is checked before going live: hot-hold age, ambient-holding of perishables, cold-chain gaps, missing hygiene declarations, allergen gaps, deadline sanity. Risky listings are flagged for review, impossible ones rejected. |
| **Pickup coordination** | Claim → schedule pickup (volunteer courier) → collected → delivered — every step time-stamped and notified. |
| **Impact dashboard** | Meals rescued, kg CO₂e avoided, completed rescues, weekly trend, category share, NGO leaderboard, and missed (expired) listings — all computed live from the database. |
| **Maps** | Leaflet + OpenStreetMap/CARTO tiles, pulsing markers for critical rescues, click-to-pick location for donors. |
| **Persona demo mode** | Switch between donor / NGO / volunteer / beneficiary personas to experience every side of the workflow. |

> **Note:** The prototype uses rule-based logic for matching (by design — no trained ML model
> is needed). Historical-data **surplus prediction** is the documented future scope.

## Tech stack

- **App:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide icons, Fraunces + Manrope fonts
- **Database:** PostgreSQL + Drizzle ORM (`drizzle-kit push` for schema sync)
- **Maps:** Leaflet / react-leaflet with OpenStreetMap + CARTO tiles
- **Matching & safety:** TypeScript rule-based engine (`src/lib/matching.ts`)

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Landing experience
│   ├── donate/                   # 4-step donation form (safety screening + map picker)
│   ├── donations/                # Rescue board (list + live map)
│   ├── donations/[id]/           # Rescue detail: matches, claim, timeline
│   ├── impact/                   # Impact dashboard (charts, leaderboard, feed)
│   ├── partners/                 # Network directory
│   └── api/                      # REST routes: donations, claim, advance, match, stats…
├── components/                   # Nav, persona, map, charts, form, cards…
├── db/                           # Drizzle schema + idempotent seed (Bengaluru network)
└── lib/
    ├── matching.ts               # Matching engine + food-safety screener
    ├── domain.ts                 # Shared types, urgency/status logic
    └── server-data.ts            # Serializers + data loaders
```

## Run it locally

Full instructions (including GitHub push) are below — short version:

```bash
npm install
cp .env.example .env        # then set DATABASE_URL
npx drizzle-kit push        # create tables
npm run dev                 # http://localhost:3000
```

The database **seeds itself** on first API call with a realistic 14-partner Bengaluru
network (times are relative to seed time, so urgency countdowns are live immediately).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npx drizzle-kit push` | Sync DB schema |

## Credits

Photos: Pexels · Maps: © OpenStreetMap contributors, © CARTO · Icons: Lucide
