"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  URGENCY_META,
  STATUS_LABELS,
  Urgency,
  formatCountdown,
} from "@/lib/domain";

/* ---------------- Reveal on scroll ---------------- */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Animated counter ---------------- */
export function Counter({
  value,
  className,
  duration = 1.6,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("en-IN"));
  const [text, setText] = useState("0");

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setText(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
    }
  }, [inView, value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/* ---------------- Chips ---------------- */
export function UrgencyChip({ urgency, className = "" }: { urgency: Urgency; className?: string }) {
  const meta = URGENCY_META[urgency];
  const live = urgency === "critical" || urgency === "high";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color} ${className}`}
    >
      <span className="relative flex size-1.5">
        {live && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: meta.dot }}
          />
        )}
        <span className="relative inline-flex size-1.5 rounded-full" style={{ background: meta.dot }} />
      </span>
      {meta.label}
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  listed: "bg-amber/15 text-amber-900 border-amber/40",
  claimed: "bg-leaf/15 text-forest border-leaf/40",
  pickup_scheduled: "bg-limesoft/30 text-forest border-limesoft",
  collected: "bg-moss/15 text-moss border-moss/40",
  delivered: "bg-forest text-cream border-forest",
  expired: "bg-ink/10 text-ink/50 border-ink/15",
  cancelled: "bg-ink/10 text-ink/50 border-ink/15",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_TONE[status] ?? "bg-ink/5 text-ink/60 border-ink/10"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SafetyChip({ status }: { status: "ok" | "review" | "rejected" }) {
  const map = {
    ok: "bg-leaf/15 text-forest border-leaf/40",
    review: "bg-amber/15 text-amber-900 border-amber/50",
    rejected: "bg-clay/10 text-clay border-clay/40",
  } as const;
  const label = { ok: "Safety passed", review: "Needs review", rejected: "Rejected" }[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${map[status]}`}>
      {label}
    </span>
  );
}

/* ---------------- Live countdown ---------------- */
export function CountdownText({
  to,
  className = "",
  prefix = "",
}: {
  to: string;
  className?: string;
  prefix?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={className}>
      {prefix}
      {now ? formatCountdown(to, now) : "…"}
    </span>
  );
}

/* ---------------- Section heading ---------------- */
export function SectionTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] ${
        dark ? "text-limesoft" : "text-clay"
      }`}
    >
      <span className={`h-px w-10 ${dark ? "bg-limesoft/60" : "bg-clay/60"}`} />
      {children}
    </p>
  );
}
