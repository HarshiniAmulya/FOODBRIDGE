"use client";

import { useMemo } from "react";
import {
  MapPin,
  Clock,
  Star,
  UtensilsCrossed,
  Phone,
  HandHeart,
  Truck,
  Users,
  Building2,
} from "lucide-react";
import type { PartnerDto } from "@/lib/domain";
import { CATEGORY_META } from "@/lib/domain";
import { Reveal } from "@/components/ui";
import { usePersona, initials } from "@/components/persona";

const GROUPS: { type: PartnerDto["type"]; title: string; blurb: string; icon: typeof HandHeart }[] = [
  { type: "ngo", title: "Rescue organisations", blurb: "Ranked by the matching engine on every listing.", icon: HandHeart },
  { type: "volunteer", title: "Collection volunteers", blurb: "The couriers who move food inside the window.", icon: Truck },
  { type: "donor", title: "Food donors", blurb: "Kitchens that choose redistribution over the bin.", icon: UtensilsCrossed },
  { type: "beneficiary", title: "Beneficiary organisations", blurb: "Where rescued meals are served to the community.", icon: Users },
];

export function PartnerList() {
  const { partners } = usePersona();
  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, list: partners.filter((p) => p.type === g.type) })),
    [partners]
  );
  const maxCap = Math.max(1, ...partners.map((p) => p.capacityMeals ?? 0));

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6">
      {grouped.map((g, gi) => (
        <section key={g.type}>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-forest text-cream">
                <g.icon className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold md:text-3xl">{g.title}</h2>
                <p className="text-sm text-ink/55">{g.blurb}</p>
              </div>
            </div>
          </Reveal>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.list.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                {g.type === "ngo" ? (
                  <NgoCard p={p} maxCap={maxCap} />
                ) : (
                  <SimpleCard p={p} type={g.type} />
                )}
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function NgoCard({ p, maxCap }: { p: PartnerDto; maxCap: number }) {
  return (
    <div className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-cream p-6 shadow-lg shadow-ink/5 transition-all hover:-translate-y-1 hover:border-forest/40 hover:shadow-xl">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 place-items-center rounded-2xl bg-forest text-sm font-bold text-cream">
          {initials(p.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight">{p.name}</h3>
          <p className="flex items-center gap-1 text-xs text-ink/55">
            <MapPin className="size-3 shrink-0 text-clay" /> {p.address}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1 text-xs font-bold text-amber-900">
          <Star className="size-3" /> {p.rating.toFixed(1)}
        </span>
      </div>
      <p className="mt-3 text-sm italic text-ink/60">“{p.tagline}”</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.acceptedCategories.map((c) => (
          <span key={c} className="rounded-full border border-leaf/30 bg-leaf/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">
            {CATEGORY_META[c]?.label ?? c}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-xs font-bold">
          <span className="uppercase tracking-wider text-ink/50">Daily capacity</span>
          <span>{p.capacityMeals} meals</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-leaf to-limesoft transition-all duration-700"
            style={{ width: `${((p.capacityMeals ?? 0) / maxCap) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-xs font-semibold text-ink/60">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-moss" /> {p.openFrom} – {p.openTo}
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="size-3.5 text-moss" /> {p.contact}
        </span>
      </div>
    </div>
  );
}

function SimpleCard({ p, type }: { p: PartnerDto; type: PartnerDto["type"] }) {
  const tone =
    type === "donor"
      ? "bg-amber/15 text-amber-900"
      : type === "volunteer"
        ? "bg-limesoft/40 text-forest"
        : "bg-ink/5 text-ink/60";
  const Icon = type === "donor" ? Building2 : type === "volunteer" ? Truck : Users;
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-ink/10 bg-cream p-5 shadow-lg shadow-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl">
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-lg font-semibold">{p.name}</h3>
        <p className="truncate text-xs text-ink/55">{p.tagline}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink/50">
          <MapPin className="size-3 text-clay" /> {p.address}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1 text-xs font-bold text-amber-900">
        <Star className="size-3" /> {p.rating.toFixed(1)}
      </span>
    </div>
  );
}
