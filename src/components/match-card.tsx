"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, ShieldCheck, Ban, Star, UtensilsCrossed } from "lucide-react";
import type { MatchDto } from "@/lib/domain";

const PART_MAX = { distance: 40, capacity: 25, urgency: 20, reliability: 15 } as const;

export function MatchCard({
  match,
  rank,
  delay = 0,
  dark = false,
  action,
}: {
  match: MatchDto;
  rank: number;
  delay?: number;
  dark?: boolean;
  action?: React.ReactNode;
}) {
  const parts = [
    { key: "distance" as const, label: "Distance", value: match.breakdown.distance },
    { key: "capacity" as const, label: "Capacity", value: match.breakdown.capacity },
    { key: "urgency" as const, label: "Time window", value: match.breakdown.urgency },
    { key: "reliability" as const, label: "Reliability", value: match.breakdown.reliability },
  ];
  const scorePct = Math.min(100, match.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-4 ${
        dark
          ? match.eligible
            ? "border-cream/15 bg-cream/[0.06]"
            : "border-cream/10 bg-cream/[0.03] opacity-70"
          : match.eligible
            ? "border-ink/10 bg-cream shadow-lg shadow-ink/5"
            : "border-ink/10 bg-parchment opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`font-display text-2xl font-semibold leading-none ${
            dark ? "text-limesoft" : rank === 1 ? "text-clay" : "text-forest"
          }`}
        >
          {String(rank).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${dark ? "text-cream" : ""}`}>{match.name}</p>
          <p className={`flex items-center gap-1 truncate text-xs ${dark ? "text-cream/55" : "text-ink/55"}`}>
            <MapPin className="size-3 shrink-0" /> {match.address}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-display text-xl font-semibold leading-none ${dark ? "text-cream" : ""}`}>
            {match.eligible ? match.score : "–"}
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-cream/50" : "text-ink/50"}`}>
            {match.eligible ? "match" : "ineligible"}
          </p>
        </div>
      </div>

      {match.eligible ? (
        <>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${scorePct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-leaf to-limesoft"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {parts.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <span className={`w-20 text-[10px] font-bold uppercase tracking-wide ${dark ? "text-cream/55" : "text-ink/55"}`}>
                  {p.label}
                </span>
                <div className={`h-1 flex-1 overflow-hidden rounded-full ${dark ? "bg-cream/15" : "bg-ink/10"}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.round((p.value / PART_MAX[p.key]) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: delay + 0.3 }}
                    className={`h-full rounded-full ${dark ? "bg-amber" : "bg-forest"}`}
                  />
                </div>
                <span className={`w-8 text-right text-[10px] font-semibold ${dark ? "text-cream/60" : "text-ink/60"}`}>
                  {p.value}/{PART_MAX[p.key]}
                </span>
              </div>
            ))}
          </div>
          <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold ${dark ? "text-cream/65" : "text-ink/65"}`}>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-leaf" /> {match.distanceKm} km away
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5 text-amber-700" /> ~{match.etaMinutes} min pickup
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-3.5 text-amber" /> {match.rating.toFixed(1)} rating
            </span>
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="size-3.5" /> {match.capacityMeals}/day
            </span>
          </div>
        </>
      ) : (
        <ul className={`mt-3 space-y-1 text-xs ${dark ? "text-cream/60" : "text-ink/60"}`}>
          {match.blockers.slice(0, 2).map((b, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Ban className="mt-0.5 size-3 shrink-0 text-clay" /> {b}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
