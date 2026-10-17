"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  AlarmClock,
  ShieldCheck,
  Route,
  Truck,
  TrendingUp,
  BarChart3,
  UtensilsCrossed,
  HandHeart,
  Search,
  Radar,
  Leaf,
  Flame,
  Wheat,
  Timer,
} from "lucide-react";
import type { DonationDto, MatchDto, StatsDto } from "@/lib/domain";
import { CATEGORY_META, formatCountdown } from "@/lib/domain";
import { Reveal, SectionTag, Counter, UrgencyChip, CountdownText } from "@/components/ui";
import { MatchCard } from "@/components/match-card";

const IMG = {
  hero: "https://images.pexels.com/photos/6591154/pexels-photo-6591154.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  veg: "https://images.pexels.com/photos/16776988/pexels-photo-16776988.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  serve: "https://images.pexels.com/photos/6646923/pexels-photo-6646923.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  soup: "https://images.pexels.com/photos/6646987/pexels-photo-6646987.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export function Landing() {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [live, setLive] = useState<DonationDto[]>([]);
  const [demo, setDemo] = useState<{ donation: DonationDto; matches: MatchDto[] } | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    fetch("/api/donations?status=listed&limit=6")
      .then((r) => r.json())
      .then(async (d) => {
        const list: DonationDto[] = d.donations ?? [];
        setLive(list);
        const target = list.find((x) => x.urgency === "critical") ?? list[0];
        if (target) {
          const r2 = await fetch(`/api/donations/${target.id}`);
          const d2 = await r2.json();
          setDemo({ donation: d2.donation, matches: d2.matches ?? [] });
        }
      })
      .catch(() => {});
  }, []);

  const critical = live.find((d) => d.urgency === "critical") ?? live[0];
  const tickerItems = live.length
    ? live.map((d) => `${d.quantityMeals} meals · ${d.title} · ${CATEGORY_META[d.category]?.label}`)
    : [
        "120 meals · Banquet surplus · MG Road",
        "84 bakes · Sourdough & croissants · Koramangala",
        "160 meals · Produce crates · Indiranagar",
      ];

  return (
    <main className="overflow-x-clip">
      {/* ============================== HERO ============================== */}
      <section className="fb-grain relative bg-cream pt-28 md:pt-36">
        <div className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-limesoft/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-40 size-[26rem] rounded-full bg-amber/15 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative z-10">
            <Reveal>
              <SectionTag>GreenTech × Social Innovation · Bengaluru pilot</SectionTag>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-5 font-display text-[13.5vw] font-semibold leading-[0.92] tracking-tight sm:text-7xl lg:text-[5.6rem]">
                Rescue surplus.
                <br />
                Redistribute{" "}
                <span className="relative inline-block italic text-clay">
                  hope.
                  <svg viewBox="0 0 220 14" className="absolute -bottom-2 left-0 w-full" fill="none">
                    <path d="M3 10C60 3 150 3 217 8" stroke="#e9a23b" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg">
                FoodBridge AI spots surplus food the moment it appears, ranks the NGOs best
                placed to collect it — by <strong>distance, capacity and time left</strong> —
                then coordinates the pickup and measures every rescued meal.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/donate"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-forest px-7 py-3.5 text-sm font-bold text-cream transition-all hover:-translate-y-0.5 hover:bg-pine hover:shadow-xl hover:shadow-forest/25"
                >
                  <UtensilsCrossed className="size-4.5" />
                  Donate surplus food
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/donations"
                  className="inline-flex items-center gap-2.5 rounded-full border-2 border-ink/15 px-7 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:border-forest hover:bg-parchment"
                >
                  <Radar className="size-4.5" />
                  Open rescue board
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-5">
                <HeroStat value={stats?.mealsRescued ?? 965} label="meals rescued" suffix="" />
                <HeroStat
                  value={(stats?.partnerCounts.donor ?? 4) + (stats?.partnerCounts.ngo ?? 5) + (stats?.partnerCounts.volunteer ?? 3)}
                  label="partners on the bridge"
                />
                <HeroStat value={stats?.activeListings ?? 4} label="live listings now" pulse />
              </dl>
            </Reveal>
          </div>

          {/* Collage */}
          <div className="relative z-10 mx-auto w-full max-w-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2rem] border-4 border-cream shadow-2xl shadow-ink/25"
            >
              <img src={IMG.hero} alt="Volunteers packing rescued food" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-2xl bg-cream/90 px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay">Live network</p>
                <p className="font-display text-lg font-semibold">Bengaluru · 14 partners</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-10 -left-4 w-40 overflow-hidden rounded-2xl border-4 border-cream shadow-xl shadow-ink/25 sm:-left-10 sm:w-52"
            >
              <img src={IMG.veg} alt="Fresh market produce" className="aspect-[3/4] w-full object-cover" />
            </motion.div>

            {critical && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                className="animate-floaty absolute -right-3 top-6 w-60 rounded-2xl border border-ink/10 bg-cream p-4 shadow-xl shadow-ink/20 sm:-right-8"
                style={{ ["--tilt" as string]: "2deg" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <UrgencyChip urgency={critical.urgency} />
                  <CountdownText to={critical.expiresAt} className="font-display text-lg font-semibold text-clay" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">{critical.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink/55">
                  <Flame className="size-3.5 text-clay" />
                  {critical.quantityMeals} meals · {critical.donor.name}
                </p>
                <Link
                  href={`/donations/${critical.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-clay py-2 text-xs font-bold text-cream transition-transform hover:scale-[1.02]"
                >
                  Rescue this now <ArrowUpRight className="size-3.5" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Ticker */}
        <div className="relative border-y border-ink/10 bg-forest py-3.5 text-cream">
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
              {[...tickerItems, ...tickerItems].map((t, i) => (
                <span key={i} className="flex items-center gap-10 text-sm font-semibold tracking-wide">
                  <span className="font-display italic text-limesoft">rescued &amp; listed</span>
                  {t}
                  <Wheat className="size-4 text-amber" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== PROBLEM ============================== */}
      <section className="bg-parchment py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Reveal><SectionTag>The paradox</SectionTag></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
                Good food rots while hunger{" "}
                <span className="italic text-clay">persists.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-lg leading-relaxed text-ink/70">
                Restaurants, hotels, bakeries and event caterers discard edible food every
                night — while shelters and community kitchens a few streets away ration
                meals. The gap is not supply. It is{" "}
                <em>communication, matching and coordination</em>. That is the gap FoodBridge
                AI closes.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <Link
                href="/impact"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-forest underline decoration-amber decoration-2 underline-offset-4 hover:text-clay"
              >
                See what we measure <ArrowUpRight className="size-4" />
              </Link>
            </Reveal>
          </div>
          <div>
            {[
              { n: "1.3B", unit: "tonnes", text: "of food is wasted globally every year while supply chains fail the hungry.", src: "UNEP, Food Waste Index" },
              { n: "783M", unit: "people", text: "face chronic hunger — nearly 1 in 10 humans on the planet.", src: "FAO, State of Food Security" },
              { n: "40%", unit: "of food", text: "produced in India is lost or wasted — enough to feed entire cities.", src: "UNEP India estimate" },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="flex items-baseline gap-6 border-t border-ink/15 py-7 first:border-t-0 first:pt-0">
                  <p className="w-44 shrink-0 font-display text-5xl font-semibold text-forest md:text-6xl">
                    {s.n}
                    <span className="ml-1 text-base font-normal italic text-ink/50">{s.unit}</span>
                  </p>
                  <div>
                    <p className="max-w-sm leading-relaxed text-ink/75">{s.text}</p>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40">{s.src}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== WORKFLOW ============================== */}
      <section className="bg-cream py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><SectionTag>How the bridge works</SectionTag></Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
                  Every step, from walk-in cooler to community table.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.16}>
              <p className="max-w-xs text-sm leading-relaxed text-ink/60">
                Six coordinated stages turn a surplus report into a verified delivery — with
                food safety checked at the gate.
              </p>
            </Reveal>
          </div>

          <div className="mt-14">
            {WORKFLOW.map((w, i) => (
              <Reveal key={w.n} delay={i * 0.04}>
                <div className="group grid items-center gap-4 border-t border-ink/12 py-7 transition-colors last:border-b hover:bg-parchment/60 md:grid-cols-[110px_1fr_1.2fr_64px] md:gap-8">
                  <p className="font-display text-5xl font-semibold text-ink/15 transition-colors duration-300 group-hover:text-clay md:text-6xl">
                    {w.n}
                  </p>
                  <h3 className="font-display text-2xl font-semibold md:text-[1.7rem]">{w.title}</h3>
                  <p className="max-w-xl leading-relaxed text-ink/65">{w.text}</p>
                  <span className="hidden size-12 place-items-center justify-self-end rounded-full border border-ink/15 text-ink/50 transition-all duration-300 group-hover:rotate-6 group-hover:border-forest group-hover:bg-forest group-hover:text-cream md:grid">
                    <w.icon className="size-5" />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== MATCHING ENGINE ============================== */}
      <section className="fb-grain relative bg-pine py-24 text-cream md:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 select-none overflow-hidden">
          <p className="text-stroke-cream whitespace-nowrap font-display text-[16vw] font-bold leading-none opacity-60">
            MATCHING ENGINE
          </p>
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal><SectionTag dark>Rule-based smart matching</SectionTag></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-5xl">
                Not a list — a <span className="italic text-amber">ranked decision.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-md leading-relaxed text-cream/70">
                Every new listing is screened for food safety, then scored against every NGO
                in the network. Hard rules filter out ineligible recipients; a transparent
                100-point score ranks the rest.
              </p>
            </Reveal>
            <div className="mt-9 space-y-4">
              {WEIGHTS.map((w, i) => (
                <Reveal key={w.label} delay={0.1 + i * 0.06}>
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-bold">{w.label}</span>
                      <span className="font-display text-lg font-semibold text-limesoft">{w.pts}<span className="text-xs text-cream/50"> pts</span></span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(w.pts / 40) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: w.color }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-cream/55">{w.hint}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Live demo panel */}
          <Reveal delay={0.15}>
            <div className="rounded-[1.8rem] border border-cream/12 bg-cream/[0.05] p-5 backdrop-blur-sm md:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-limesoft">
                  <span className="relative flex size-2">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-limesoft opacity-70" />
                    <span className="relative size-2 rounded-full bg-limesoft" />
                  </span>
                  Live from the network
                </p>
                {demo && <UrgencyChip urgency={demo.donation.urgency} />}
              </div>
              {demo ? (
                <>
                  <h3 className="mt-3 font-display text-2xl font-semibold leading-tight">
                    {demo.donation.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-cream/60">
                    {demo.donation.quantityMeals} meals · {demo.donation.donor.name} · closes in{" "}
                    <CountdownText to={demo.donation.expiresAt} className="font-bold text-amber" />
                  </p>
                  <div className="mt-5 space-y-3">
                    {demo.matches.slice(0, 3).map((m, i) => (
                      <MatchCard key={m.partnerId} match={m} rank={i + 1} delay={0.15 + i * 0.1} dark />
                    ))}
                  </div>
                  <Link
                    href={`/donations/${demo.donation.id}`}
                    className="mt-5 flex items-center justify-center gap-2 rounded-full bg-limesoft py-3 text-sm font-bold text-pine transition-transform hover:scale-[1.01]"
                  >
                    Open this rescue <ArrowRight className="size-4" />
                  </Link>
                </>
              ) : (
                <div className="mt-6 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream/10" />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section className="bg-cream py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal><SectionTag>Why it&apos;s different</SectionTag></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
              Beyond a listing board — an end-to-end rescue operation.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-parchment p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-forest/40 hover:shadow-xl hover:shadow-ink/10">
                  <span className="grid size-12 place-items-center rounded-2xl bg-forest text-cream transition-transform duration-300 group-hover:-rotate-6 group-hover:bg-clay">
                    <f.icon className="size-5.5" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink/65">{f.text}</p>
                  {f.tag && (
                    <span className="mt-auto pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-clay">
                      {f.tag}
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== IMPACT BAND ============================== */}
      <section className="fb-grain bg-forest py-20 text-cream md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><SectionTag dark>Measured, not assumed</SectionTag></Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                  Impact you can audit.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.16}>
              <Link
                href="/impact"
                className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm font-bold transition-colors hover:bg-cream hover:text-forest"
              >
                <BarChart3 className="size-4" /> Full impact dashboard
              </Link>
            </Reveal>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
            <BandStat value={stats?.mealsRescued ?? 965} label="Meals rescued" suffix="" icon={UtensilsCrossed} />
            <BandStat value={stats?.co2SavedKg ?? 865} label="kg CO₂e avoided" suffix="" icon={Leaf} />
            <BandStat value={stats?.completedRescues ?? 6} label="Completed rescues" suffix="" icon={HandHeart} />
            <BandStat value={stats?.expiredCount ?? 1} label="Missed — we track these too" suffix="" icon={Timer} />
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="relative overflow-hidden bg-cream py-28 md:py-36">
        <img
          src={IMG.serve}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.13]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-transparent to-cream" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="font-display text-lg italic text-ink/60">One platform. Four groups. Zero excuses.</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-4 font-display text-5xl font-semibold leading-[0.98] tracking-tight md:text-7xl">
              Feed people,
              <br />
              not <span className="italic text-clay">landfills.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/donate"
                className="group inline-flex items-center gap-2.5 rounded-full bg-forest px-8 py-4 text-sm font-bold text-cream transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/30"
              >
                List surplus in 2 minutes <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/partners"
                className="inline-flex items-center gap-2 text-sm font-bold text-ink/70 underline decoration-amber decoration-2 underline-offset-4 hover:text-clay"
              >
                Meet the network <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

/* ---------------- data ---------------- */

function HeroStat({ value, label, pulse }: { value: number; label: string; suffix?: string; pulse?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50">
        {pulse && (
          <span className="relative flex size-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-clay opacity-70" />
            <span className="relative size-2 rounded-full bg-clay" />
          </span>
        )}
        {label}
      </dt>
      <dd className="mt-1 font-display text-4xl font-semibold text-forest md:text-5xl">
        <Counter value={value} />
      </dd>
    </div>
  );
}

function BandStat({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  suffix: string;
  icon: typeof Leaf;
}) {
  return (
    <Reveal>
      <div className="border-t border-cream/15 pt-5">
        <Icon className="size-5 text-limesoft" />
        <p className="mt-3 font-display text-5xl font-semibold md:text-6xl">
          <Counter value={value} />
        </p>
        <p className="mt-1.5 text-sm font-semibold text-cream/65">{label}</p>
      </div>
    </Reveal>
  );
}

const WORKFLOW = [
  { n: "01", title: "Surplus is reported", text: "A donor lists food type, meal count, preparation time, storage conditions and a hard collection deadline.", icon: UtensilsCrossed },
  { n: "02", title: "Platform checks the listing", text: "Required fields, deadlines and handling details are validated. Risky or incomplete listings are flagged for human review.", icon: ShieldCheck },
  { n: "03", title: "Smart matching ranks NGOs", text: "Eligible recipients are scored on distance, capacity, food preferences and how comfortably they fit the collection window.", icon: Route },
  { n: "04", title: "Rescue alerts go out", text: "The top-ranked organisations receive instant in-app alerts with the score, ETA and deadline attached.", icon: AlarmClock },
  { n: "05", title: "Pickup & redistribution", text: "The claiming NGO schedules a volunteer courier, and every handoff — claimed, collected, delivered — is tracked live.", icon: Truck },
  { n: "06", title: "Impact is recorded", text: "Meals rescued, kg CO₂e avoided, response times and missed opportunities feed a public impact dashboard.", icon: BarChart3 },
];

const WEIGHTS = [
  { label: "Distance to donor", pts: 40, color: "#e9a23b", hint: "Shorter trips protect freshness and beat deadlines." },
  { label: "Capacity fit", pts: 25, color: "#3f8f5b", hint: "The NGO must absorb the full load — with headroom." },
  { label: "Collection window", pts: 20, color: "#c9da8e", hint: "Estimated arrival must beat the deadline, comfortably." },
  { label: "Reliability", pts: 15, color: "#8fb8a3", hint: "Past on-time rescues build the trust score." },
];

const FEATURES = [
  { icon: Route, title: "Smart donor ⇄ NGO matching", text: "Rule-based scoring ranks recipients by distance, quantity fit, capacity and pickup deadline — the core of the platform.", tag: "Core engine" },
  { icon: AlarmClock, title: "Urgency-aware alerts", text: "Listings decay in real time. Critical donations pulse to the top of every board and alert feed until claimed.", tag: "Live" },
  { icon: ShieldCheck, title: "Food-safety screening", text: "Hot-hold age, cold-chain gaps, missing hygiene declarations and allergen gaps are flagged before a listing goes public.", tag: "Gatekeeper" },
  { icon: Truck, title: "Pickup coordination", text: "Claim → schedule → collect → deliver. NGOs assign volunteer couriers and every status change notifies the donor.", tag: "Live" },
  { icon: TrendingUp, title: "Surplus prediction", text: "Historical donation patterns will help kitchens anticipate surplus before it happens and pre-alert nearby NGOs.", tag: "Future scope" },
  { icon: BarChart3, title: "Impact dashboard", text: "Quantities rescued, successful deliveries and missed listings — the metrics Hackfest judges and municipalities ask for.", tag: "Live" },
];
