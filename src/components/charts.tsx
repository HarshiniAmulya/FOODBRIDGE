"use client";

import { motion } from "framer-motion";

export const CATEGORY_COLORS: Record<string, string> = {
  prepared_meals: "#c8441c",
  bakery: "#e9a23b",
  produce: "#3f8f5b",
  dairy: "#2c6650",
  packaged: "#9db856",
};

/* ---------------- Weekly bar chart (pure SVG) ---------------- */
export function WeeklyBars({
  data,
  height = 190,
  accent = "#e9a23b",
}: {
  data: { day: string; meals: number }[];
  height?: number;
  accent?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.meals));
  return (
    <div>
      <div className="flex items-end gap-2.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.max(3, (d.meals / max) * 100);
          return (
            <div key={d.day + i} className="group relative flex flex-1 flex-col items-center justify-end gap-2 self-stretch">
              <span className="pointer-events-none absolute -top-1 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-cream opacity-0 transition-opacity group-hover:opacity-100">
                {d.meals}
              </span>
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: `${pct}%`, transformOrigin: "bottom" }}
                className={`w-full rounded-t-lg ${i === data.length - 1 ? "" : "opacity-80"}`}
              >
                <div
                  className="h-full w-full rounded-t-lg transition-colors group-hover:opacity-100"
                  style={{ background: i === data.length - 1 ? accent : "#2c6650" }}
                />
              </motion.div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Category donut ---------------- */
export function CategoryDonut({
  data,
  size = 190,
}: {
  data: { key: string; label: string; meals: number }[];
  size?: number;
}) {
  const total = Math.max(
    1,
    data.reduce((s, d) => s + d.meals, 0)
  );
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e3d7bd"
            strokeWidth={stroke}
          />
          {data.map((d) => {
            const frac = d.meals / total;
            const dash = frac * c;
            const el = (
              <motion.circle
                key={d.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={CATEGORY_COLORS[d.key] ?? "#2c6650"}
                strokeWidth={stroke}
                strokeLinecap="butt"
                initial={{ strokeDasharray: `0 ${c}` }}
                whileInView={{ strokeDasharray: `${dash} ${c - dash}` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-3xl font-semibold">{total.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">meals</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-3 rounded-sm"
              style={{ background: CATEGORY_COLORS[d.key] ?? "#2c6650" }}
            />
            <span className="font-semibold">{d.label}</span>
            <span className="text-ink/50">{Math.round((d.meals / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
