"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Leaf,
  AlarmClock,
  CheckCircle2,
  XCircle,
  Flame,
  Activity,
  Trophy,
  ArrowUpRight,
  Megaphone,
  HandHeart,
  Bell,
} from "lucide-react";
import type { StatsDto } from "@/lib/domain";
import { formatCountdown } from "@/lib/domain";
import { Reveal, Counter, SectionTag } from "@/components/ui";
import { WeeklyBars, CategoryDonut } from "@/components/charts";
import { initials } from "@/components/persona";

export function ImpactDashboard() {
  const [stats, setStats] = useState<StatsDto | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  if (!stats) {
    return <div className="mx-auto h-[70vh] max-w-7xl animate-pulse px-4"><div className="h-full rounded-3xl bg-cream" /></div>;
  }

  const kpis = [
    { icon: UtensilsCrossed, value: stats.mealsRescued, label: "Meals rescued", hint: "verified deliveries" },
    { icon: Leaf, value: stats.co2SavedKg, label: "kg CO₂e avoided", hint: `${stats.kgRescued.toLocaleString("en-IN")} kg of food kept out of landfill` },
    { icon: CheckCircle2, value: stats.completedRescues, label: "Completed rescues", hint: "claim → delivery, end to end" },
    { icon: AlarmClock, value: stats.activeListings, label: "Live listings", hint: `${stats.urgencyLive.critical} critical · ${stats.urgencyLive.high} high urgency` },
    { icon: XCircle, value: stats.expiredCount, label: "Missed rescues", hint: "tracked to close the gap" },
  ];

  const maxMeals = Math.max(1, ...stats.leaderboard.map((l) => l.meals));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <Reveal key={k.label} delay={i * 0.06}>
            <div className={`flex h-full flex-col rounded-3xl border p-5 ${i === 4 ? "border-clay/30 bg-clay/5" : "border-ink/10 bg-cream shadow-lg shadow-ink/5"}`}>
              <k.icon className={`size-5 ${i === 4 ? "text-clay" : "text-moss"}`} />
              <p className="mt-4 font-display text-4xl font-semibold xl:text-5xl">
                <Counter value={k.value} />
              </p>
              <p className="mt-1 text-sm font-bold">{k.label}</p>
              <p className="mt-auto pt-2 text-xs leading-snug text-ink/50">{k.hint}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <div className="h-full rounded-3xl border border-ink/10 bg-cream p-6 shadow-lg shadow-ink/5 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/50">Last 7 days</p>
                <h3 className="mt-1 font-display text-2xl font-semibold">Meals rescued per day</h3>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-leaf/10 px-3 py-1.5 text-xs font-bold text-forest">
                <Activity className="size-3.5" /> live
              </span>
            </div>
            <div className="mt-8">
              <WeeklyBars data={stats.weekly} />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="h-full rounded-3xl border border-ink/10 bg-cream p-6 shadow-lg shadow-ink/5 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/50">By category</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">What gets rescued</h3>
            <div className="mt-8">
              <CategoryDonut data={stats.categoryShare} />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Leaderboard + activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div className="rounded-3xl border border-ink/10 bg-forest p-6 text-cream shadow-lg shadow-forest/20 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-limesoft">Leaderboard</p>
                <h3 className="mt-1 font-display text-2xl font-semibold">Rescue partners of the week</h3>
              </div>
              <Trophy className="size-6 text-amber" />
            </div>
            <div className="mt-7 space-y-5">
              {stats.leaderboard.slice(0, 4).map((l, i) => (
                <div key={l.ngoId} className="flex items-center gap-4">
                  <span className="font-display text-2xl font-semibold text-cream/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid size-10 place-items-center rounded-full bg-cream/10 text-xs font-bold">
                    {initials(l.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-bold">{l.name}</p>
                      <p className="shrink-0 text-sm font-semibold text-limesoft">
                        {l.meals.toLocaleString("en-IN")} meals
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber to-limesoft"
                        style={{ width: `${(l.meals / maxMeals) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-cream/55">
                      {l.rescues} rescues · reliability {l.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/partners"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-limesoft underline decoration-amber decoration-2 underline-offset-4"
            >
              Meet the whole network <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="rounded-3xl border border-ink/10 bg-cream p-6 shadow-lg shadow-ink/5 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/50">Network pulse</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">Latest activity</h3>
            <ul className="mt-6 space-y-1">
              {stats.recent.slice(0, 7).map((n) => {
                const Icon =
                  n.kind === "match_alert" ? Megaphone : n.kind === "claim" ? HandHeart : Bell;
                return (
                  <li key={n.id} className="flex gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-parchment">
                    <span
                      className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                        n.kind === "match_alert"
                          ? "bg-clay/10 text-clay"
                          : n.kind === "claim"
                            ? "bg-leaf/15 text-forest"
                            : "bg-amber/15 text-amber-900"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug">{n.title}</p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-ink/60">{n.body}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/40">
                        {formatCountdown(n.createdAt)}
                      </p>
                    </div>
                    {n.donationId && (
                      <Link
                        href={`/donations/${n.donationId}`}
                        className="ml-auto self-center text-ink/40 hover:text-clay"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* Missed rescues callout */}
      <Reveal>
        <div className="mt-6 flex flex-wrap items-center gap-5 rounded-3xl border border-clay/25 bg-clay/5 p-6 md:p-8">
          <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-clay text-cream">
            <Flame className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl font-semibold">
              {stats.expiredCount} listing{stats.expiredCount === 1 ? "" : "s"} expired unclaimed.
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/65">
              We publish misses alongside wins — they are the strongest argument for growing the
              NGO and volunteer network. The future surplus-prediction module will pre-alert
              partners before these windows ever open.
            </p>
          </div>
          <Link
            href="/donations"
            className="inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-bold text-cream transition-transform hover:-translate-y-0.5"
          >
            Rescue what&apos;s live <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </Reveal>

      <div className="mt-12 border-t border-ink/10 pt-6">
        <SectionTag>Methodology</SectionTag>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/60">
          Meals are counted only when a rescue reaches <em>delivered</em> status — claims and
          pickups don&apos;t inflate the numbers. CO₂e uses a conservative 2.5 kg CO₂e per kg of
          food diverted. Every figure recomputes from live database records on each load.
        </p>
      </div>
    </div>
  );
}
