"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  UtensilsCrossed,
  Scale,
  Thermometer,
  AlarmClock,
  ShieldCheck,
  ShieldAlert,
  PackageCheck,
  Sparkles,
  HandHeart,
  Truck,
  Check,
  Leaf,
  CircleDashed,
  Star,
  UserCheck,
} from "lucide-react";
import type { DonationDto, MatchDto } from "@/lib/domain";
import {
  CATEGORY_META,
  STORAGE_LABELS,
  STATUS_ORDER,
  STATUS_LABELS,
  URGENCY_META,
  formatTime,
  formatDate,
} from "@/lib/domain";
import { UrgencyChip, StatusChip, SafetyChip, CountdownText } from "@/components/ui";
import { MatchCard } from "@/components/match-card";
import { usePersona, initials } from "@/components/persona";

const RescueMap = dynamic(
  () => import("@/components/map").then((m) => m.RescueMap),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-3xl bg-parchment" /> }
);

export function RescueDetail() {
  const { id } = useParams<{ id: string }>();
  const { persona, partners, refreshNotes } = usePersona();
  const [donation, setDonation] = useState<DonationDto | null>(null);
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [ngoChoice, setNgoChoice] = useState<string>("");
  const [volChoice, setVolChoice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/donations/${id}`);
    if (r.status === 404) {
      setNotFound(true);
      return;
    }
    const d = await r.json();
    setDonation(d.donation);
    setMatches(d.matches ?? []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const ngos = useMemo(() => partners.filter((p) => p.type === "ngo"), [partners]);
  const volunteers = useMemo(() => partners.filter((p) => p.type === "volunteer"), [partners]);
  const eligible = useMemo(() => matches.filter((m) => m.eligible), [matches]);

  // sensible defaults once data is in
  useEffect(() => {
    if (!ngoChoice) {
      if (persona?.type === "ngo") setNgoChoice(persona.id);
      else if (eligible[0]) setNgoChoice(eligible[0].partnerId);
    }
    if (!volChoice && volunteers[0]) setVolChoice(volunteers[0].id);
  }, [eligible, persona, ngoChoice, volunteers, volChoice]);

  async function act(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Something went wrong");
      else {
        await load();
        refreshNotes();
      }
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <p className="font-display text-6xl font-semibold text-ink/20">404</p>
        <p className="mt-3 font-display text-2xl font-semibold">This rescue doesn&apos;t exist.</p>
        <Link href="/donations" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-forest underline decoration-amber decoration-2 underline-offset-4">
          <ArrowLeft className="size-4" /> Back to the board
        </Link>
      </div>
    );
  }

  if (!donation) {
    return <div className="mx-auto h-[60vh] max-w-6xl animate-pulse px-4 pt-32"><div className="h-full rounded-3xl bg-cream" /></div>;
  }

  const d = donation;
  const live = ["listed", "claimed", "pickup_scheduled", "collected"].includes(d.status);
  const rescue = d.rescue;

  const timeline = STATUS_ORDER.map((s) => {
    const at =
      s === "listed"
        ? d.createdAt
        : s === "claimed"
          ? rescue?.claimedAt
          : s === "pickup_scheduled"
            ? rescue?.scheduledAt
            : s === "collected"
              ? rescue?.collectedAt
              : rescue?.deliveredAt;
    const statusIdx = STATUS_ORDER.indexOf(d.status as (typeof STATUS_ORDER)[number]);
    const done = statusIdx >= STATUS_ORDER.indexOf(s);
    const current = d.status === s;
    return { key: s, label: STATUS_LABELS[s], at: at ?? null, done, current };
  });

  const nextStep =
    d.status === "claimed"
      ? { label: "Schedule pickup", needsVolunteer: true }
      : d.status === "pickup_scheduled"
        ? { label: "Mark collected", needsVolunteer: false }
        : d.status === "collected"
          ? { label: "Mark delivered", needsVolunteer: false }
          : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <Link
        href="/donations"
        className="inline-flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Rescue board
      </Link>

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {d.status === "listed" && <UrgencyChip urgency={d.urgency} />}
            <StatusChip status={d.status} />
            <SafetyChip status={d.safetyStatus} />
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/55">
              {CATEGORY_META[d.category]?.label}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            {d.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/65">
            <span className="grid size-7 place-items-center rounded-full bg-forest text-[10px] font-bold text-cream">
              {initials(d.donor.name)}
            </span>
            <strong>{d.donor.name}</strong>·
            <MapPin className="size-4 text-clay" /> {d.address}
            <span className="flex items-center gap-1 text-amber-700">
              <Star className="size-3.5" /> {d.donor.rating}
            </span>
          </p>
        </div>
        {live && (
          <div
            className="rounded-3xl border p-5 text-right"
            style={{ borderColor: URGENCY_META[d.urgency].dot + "55", background: URGENCY_META[d.urgency].dot + "10" }}
          >
            <p className="flex items-center justify-end gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/55">
              <AlarmClock className="size-4" /> Collection closes in
            </p>
            <CountdownText
              to={d.expiresAt}
              className="mt-1 block font-display text-4xl font-semibold md:text-5xl"
            />
            <p className="mt-1 text-xs font-semibold text-ink/55">
              deadline {formatTime(d.expiresAt)} · {formatDate(d.expiresAt)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------- Left column ---------- */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-ink/10"
          >
            <img
              src={d.image ?? CATEGORY_META[d.category]?.image}
              alt={d.title}
              className="aspect-[16/8] w-full object-cover"
            />
          </motion.div>

          {d.description && (
            <p className="max-w-2xl leading-relaxed text-ink/75">{d.description}</p>
          )}

          {/* Spec grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Spec icon={UtensilsCrossed} label="Meals" value={`${d.quantityMeals}`} />
            <Spec icon={Scale} label="Weight" value={`${d.quantityKg} kg`} />
            <Spec icon={Thermometer} label="Storage" value={STORAGE_LABELS[d.storage] ?? d.storage} small />
            <Spec icon={AlarmClock} label="Prepared" value={`${formatTime(d.preparedAt)} · ${formatDate(d.preparedAt)}`} small />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Badge on={d.sealed} label="Sealed packaging" />
            <Badge on={d.hygieneConfirmed} label="Hygiene declared" />
            <Badge on={d.allergens.trim().length > 0} label={d.allergens ? `Allergens: ${d.allergens}` : "Allergens not listed"} />
          </div>

          {/* Safety panel */}
          <div
            className={`rounded-3xl border p-6 ${
              d.safetyStatus === "ok" ? "border-leaf/40 bg-leaf/5" : "border-amber/50 bg-amber/5"
            }`}
          >
            <p className="flex items-center gap-2 font-display text-xl font-semibold">
              {d.safetyStatus === "ok" ? (
                <>
                  <ShieldCheck className="size-5.5 text-leaf" /> Food-safety screening: passed
                </>
              ) : (
                <>
                  <ShieldAlert className="size-5.5 text-amber-800" /> Flagged for review
                </>
              )}
            </p>
            {d.safetyFlags.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {d.safetyFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink/75">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-700" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink/65">
                Handling window, storage and documentation all check out. Safe to redistribute
                within the deadline.
              </p>
            )}
          </div>

          {/* Map */}
          <div className="overflow-hidden rounded-3xl border border-ink/10 shadow-lg shadow-ink/5">
            <RescueMap
              markers={[
                {
                  id: d.id,
                  lat: d.lat,
                  lng: d.lng,
                  color: URGENCY_META[d.status === "listed" ? d.urgency : "low"].dot,
                  pulse: live,
                  label: d.title,
                  sub: d.address,
                },
              ]}
              activeId={d.id}
              center={[d.lat, d.lng]}
              zoom={13}
              className="h-72"
            />
          </div>
        </div>

        {/* ---------- Right column ---------- */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Status / timeline card */}
          <div className="rounded-3xl border border-ink/10 bg-cream p-6 shadow-xl shadow-ink/10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/50">
              Rescue timeline
            </p>
            <ol className="mt-4 space-y-0">
              {timeline.map((t, i) => (
                <li key={t.key} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < timeline.length - 1 && (
                    <span
                      className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${
                        t.done ? "bg-forest" : "bg-ink/10"
                      }`}
                    />
                  )}
                  <span
                    className={`z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 ${
                      t.current
                        ? "border-amber bg-amber text-ink"
                        : t.done
                          ? "border-forest bg-forest text-cream"
                          : "border-ink/15 bg-cream text-ink/30"
                    }`}
                  >
                    {t.done ? <Check className="size-3.5" strokeWidth={3} /> : <CircleDashed className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className={`text-sm font-bold ${t.done ? "" : "text-ink/40"}`}>{t.label}</p>
                    <p className="text-xs text-ink/50">
                      {t.at ? `${formatTime(t.at)} · ${formatDate(t.at)}` : "pending"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {rescue && (
              <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
                <p className="flex items-center gap-2">
                  <HandHeart className="size-4 text-forest" />
                  <strong>{rescue.ngoName}</strong>
                  {rescue.matchScore !== null && (
                    <span className="ml-auto rounded-full bg-limesoft/40 px-2 py-0.5 text-xs font-bold text-forest">
                      match {rescue.matchScore}
                    </span>
                  )}
                </p>
                {rescue.volunteerName && (
                  <p className="flex items-center gap-2 text-ink/70">
                    <Truck className="size-4 text-moss" /> Courier: {rescue.volunteerName}
                  </p>
                )}
                {rescue.notes && <p className="text-xs italic text-ink/55">{rescue.notes}</p>}
              </div>
            )}
          </div>

          {/* Action card */}
          <div className="rounded-3xl border border-ink/10 bg-cream p-6 shadow-xl shadow-ink/10">
            {d.status === "listed" && (
              <>
                <p className="flex items-center gap-2 font-display text-xl font-semibold">
                  <Sparkles className="size-5 text-clay" /> Claim this rescue
                </p>
                <p className="mt-1.5 text-sm text-ink/60">
                  {persona?.type === "ngo"
                    ? `You are acting as ${persona.name}.`
                    : "Pick which organisation claims it — or switch persona from the top bar."}
                </p>
                <select
                  value={ngoChoice}
                  onChange={(e) => setNgoChoice(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm font-bold outline-none focus:border-forest"
                >
                  {ngos.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} — {n.capacityMeals}/day
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => act(`/api/donations/${d.id}/claim`, { ngoId: ngoChoice })}
                  disabled={busy || !ngoChoice}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-bold text-cream transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-50"
                >
                  {busy ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
                  ) : (
                    <HandHeart className="size-4.5" />
                  )}
                  Claim rescue
                </button>
              </>
            )}

            {nextStep && (
              <>
                <p className="flex items-center gap-2 font-display text-xl font-semibold">
                  <Truck className="size-5 text-moss" /> Coordinate pickup
                </p>
                {nextStep.needsVolunteer && (
                  <select
                    value={volChoice}
                    onChange={(e) => setVolChoice(e.target.value)}
                    className="mt-4 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm font-bold outline-none focus:border-forest"
                  >
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.tagline}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() =>
                    act(`/api/donations/${d.id}/advance`, {
                      ...(nextStep.needsVolunteer ? { volunteerId: volChoice } : {}),
                    })
                  }
                  disabled={busy || (nextStep.needsVolunteer && !volChoice)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-clay py-3.5 text-sm font-bold text-cream transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-50"
                >
                  {busy ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
                  ) : (
                    <ArrowRight className="size-4.5" />
                  )}
                  {nextStep.label}
                </button>
                <p className="mt-3 text-center text-xs text-ink/50">
                  Donor & NGO get notified on every step.
                </p>
              </>
            )}

            {d.status === "delivered" && (
              <div className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-forest text-cream">
                  <PackageCheck className="size-7" />
                </span>
                <p className="mt-4 font-display text-2xl font-semibold">Delivered & served.</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <ImpactMini value={d.quantityMeals} label="meals" />
                  <ImpactMini value={d.quantityKg} label="kg food" />
                  <ImpactMini value={Math.round(d.quantityKg * 2.5)} label="kg CO₂e" icon={<Leaf className="mx-auto size-3.5 text-leaf" />} />
                </div>
              </div>
            )}

            {d.status === "expired" && (
              <div className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink/10 text-ink/40">
                  <AlarmClock className="size-7" />
                </span>
                <p className="mt-4 font-display text-2xl font-semibold">This rescue was missed.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  The window closed before any NGO claimed it. Missed rescues stay on the impact
                  dashboard — they are the gap this platform exists to close.
                </p>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-xs font-semibold text-clay">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Matches */}
      {d.status === "listed" && (
        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay">
                Smart matching engine
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Ranked recipients, with full reasoning.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink/55">
              Score = distance 40 · capacity 25 · time window 20 · reliability 15.
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matches.map((m, i) => (
              <MatchCard
                key={m.partnerId}
                match={m}
                rank={i + 1}
                delay={i * 0.06}
                action={
                  m.eligible ? (
                    <button
                      onClick={() => act(`/api/donations/${d.id}/claim`, { ngoId: m.partnerId })}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-forest py-2 text-xs font-bold text-forest transition-colors hover:bg-forest hover:text-cream disabled:opacity-50"
                    >
                      <UserCheck className="size-4" /> Claim as {m.name.split(" ")[0]}
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4">
      <Icon className="size-4.5 text-moss" />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">{label}</p>
      <p className={`mt-0.5 font-display font-semibold ${small ? "text-sm leading-snug" : "text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}

function Badge({ on, label }: { on: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold ${
        on ? "border-leaf/40 bg-leaf/10 text-forest" : "border-ink/10 bg-parchment text-ink/50"
      }`}
    >
      <span className={`grid size-5 place-items-center rounded-full ${on ? "bg-leaf text-cream" : "bg-ink/15 text-ink/40"}`}>
        <Check className="size-3" strokeWidth={3.5} />
      </span>
      <span className="line-clamp-1">{label}</span>
    </div>
  );
}

function ImpactMini({ value, label, icon }: { value: number; label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-parchment px-2 py-3">
      {icon}
      <p className="font-display text-xl font-semibold">{value.toLocaleString("en-IN")}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">{label}</p>
    </div>
  );
}
