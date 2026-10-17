"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  UtensilsCrossed,
  Clock,
  ArrowUpRight,
  RefreshCw,
  HandHeart,
  ShieldAlert,
  Flame,
} from "lucide-react";
import type { DonationDto } from "@/lib/domain";
import {
  CATEGORIES,
  CATEGORY_META,
  URGENCY_META,
  STATUS_LABELS,
} from "@/lib/domain";
import { UrgencyChip, StatusChip, CountdownText } from "@/components/ui";
import { usePersona } from "@/components/persona";

const RescueMap = dynamic(
  () => import("@/components/map").then((m) => m.RescueMap),
  { ssr: false, loading: () => <div className="h-full min-h-[400px] animate-pulse bg-parchment" /> }
);

const TABS = [
  { key: "live", label: "Live ops" },
  { key: "listed", label: "Awaiting claim" },
  { key: "delivered", label: "Delivered" },
  { key: "expired", label: "Missed" },
  { key: "all", label: "All" },
] as const;

export function RescueBoard() {
  const { persona } = usePersona();
  const [donations, setDonations] = useState<DonationDto[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("live");
  const [category, setCategory] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const r = await fetch(`/api/donations?status=${tab}`);
      const d = await r.json();
      setDonations(d.donations ?? []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 20_000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = useMemo(
    () => (category === "all" ? donations : donations.filter((d) => d.category === category)),
    [donations, category]
  );

  const criticalCount = donations.filter(
    (d) => d.status === "listed" && (d.urgency === "critical" || d.urgency === "high")
  ).length;

  async function claim(id: string) {
    if (!persona || persona.type !== "ngo" || claiming) return;
    setClaiming(id);
    try {
      const res = await fetch(`/api/donations/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId: persona.id }),
      });
      if (res.ok) await load(true);
    } finally {
      setClaiming(null);
    }
  }

  const markers = filtered.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    color: URGENCY_META[d.status === "listed" ? d.urgency : d.status === "delivered" ? "low" : "medium"].dot,
    pulse: d.status === "listed" && (d.urgency === "critical" || d.urgency === "high"),
    label: d.title,
    sub: `${d.quantityMeals} meals · ${d.donor.name}`,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-full border border-ink/10 bg-cream p-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                tab === t.key ? "bg-forest text-cream" : "text-ink/55 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-ink/15 bg-cream px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c].label}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-clay/10 px-3.5 py-2 text-xs font-bold text-clay">
              <Flame className="size-3.5" /> {criticalCount} urgent
            </span>
          )}
          <button
            onClick={() => load()}
            className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-bold hover:bg-parchment"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            {lastRefresh ? lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "…"}
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
        {/* List */}
        <div className="space-y-4 lg:order-1">
          {loading && donations.length === 0 ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl border border-ink/10 bg-cream" />
            ))
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-ink/20 bg-cream py-20 text-center">
              <UtensilsCrossed className="size-8 text-ink/30" />
              <p className="mt-3 font-display text-xl font-semibold">Nothing here right now</p>
              <p className="mt-1 text-sm text-ink/55">New surplus appears the moment a donor lists it.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((d) => (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                >
                  <div
                    onMouseEnter={() => setActiveId(d.id)}
                    className={`group flex flex-col gap-4 rounded-3xl border bg-cream p-4 transition-all sm:flex-row ${
                      activeId === d.id
                        ? "border-forest/50 shadow-xl shadow-ink/10"
                        : "border-ink/10 hover:border-forest/30 hover:shadow-lg hover:shadow-ink/5"
                    }`}
                  >
                    <Link href={`/donations/${d.id}`} className="relative block w-full shrink-0 overflow-hidden rounded-2xl sm:w-44">
                      <img
                        src={d.image ?? CATEGORY_META[d.category]?.image}
                        alt={d.title}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-2 top-2">
                        <UrgencyChip urgency={d.status === "listed" ? d.urgency : "over"} className={d.status === "listed" ? "" : "hidden"} />
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip status={d.status} />
                        {d.safetyStatus === "review" && (
                          <span className="flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                            <ShieldAlert className="size-3" /> review
                          </span>
                        )}
                        <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-ink/45">
                          {CATEGORY_META[d.category]?.label}
                        </span>
                      </div>
                      <Link href={`/donations/${d.id}`}>
                        <h3 className="mt-2 font-display text-xl font-semibold leading-tight transition-colors group-hover:text-forest">
                          {d.title}
                        </h3>
                      </Link>
                      <p className="mt-1 line-clamp-1 text-sm text-ink/60">
                        {d.donor.name} · {d.quantityMeals} meals · {d.quantityKg} kg
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-ink/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-clay" /> {d.address}
                        </span>
                        {["listed", "claimed", "pickup_scheduled", "collected"].includes(d.status) ? (
                          <span className="flex items-center gap-1 text-clay">
                            <Clock className="size-3.5" />
                            <CountdownText to={d.expiresAt} prefix="closes in " />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {STATUS_LABELS[d.status]} ·{" "}
                            <CountdownText to={d.rescue?.deliveredAt ?? d.expiresAt} />
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        {d.status === "listed" && persona?.type === "ngo" ? (
                          <button
                            onClick={() => claim(d.id)}
                            disabled={claiming === d.id}
                            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-xs font-bold text-cream transition-transform hover:scale-[1.03] disabled:opacity-50"
                          >
                            {claiming === d.id ? (
                              <span className="size-3.5 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
                            ) : (
                              <HandHeart className="size-4" />
                            )}
                            Claim as {persona.name.split(" ")[0]}
                          </button>
                        ) : (
                          <Link
                            href={`/donations/${d.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-forest underline decoration-amber decoration-2 underline-offset-4 hover:text-clay"
                          >
                            {d.status === "listed" ? "View matches & claim" : "Open rescue"}
                            <ArrowUpRight className="size-4" />
                          </Link>
                        )}
                        {d.rescue && (
                          <span className="text-xs font-semibold text-ink/55">
                            → {d.rescue.ngoName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Map */}
        <div className="lg:order-2">
          <div className="sticky top-24 overflow-hidden rounded-3xl border border-ink/10 shadow-xl shadow-ink/10">
            <RescueMap
              markers={markers}
              activeId={activeId}
              onMarkerClick={setActiveId}
              className="h-[420px] lg:h-[calc(100vh-8.5rem)] lg:min-h-[560px]"
            />
            <div className="absolute bottom-4 left-4 rounded-xl bg-cream/95 px-4 py-2.5 text-xs font-bold shadow-lg backdrop-blur">
              <span className="text-clay">●</span> urgent&nbsp;&nbsp;
              <span className="text-amber">●</span> today&nbsp;&nbsp;
              <span className="text-forest">●</span> steady
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
