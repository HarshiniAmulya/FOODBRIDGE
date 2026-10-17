"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  BellRing,
  UtensilsCrossed,
  ClipboardList,
  HandHeart,
  PartyPopper,
  Star,
} from "lucide-react";
import type { DonationDto, MatchDto, PartnerDto } from "@/lib/domain";
import {
  CATEGORIES,
  CATEGORY_META,
  STORAGE_LABELS,
  URGENCY_META,
  urgencyOf,
} from "@/lib/domain";
import { UrgencyChip, CountdownText } from "@/components/ui";
import { MatchCard } from "@/components/match-card";
import { usePersona, initials } from "@/components/persona";

const LocationPicker = dynamic(
  () => import("@/components/map").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-2xl bg-parchment" /> }
);

const STEPS = [
  { n: "01", label: "Your kitchen", icon: UtensilsCrossed },
  { n: "02", label: "The food", icon: ClipboardList },
  { n: "03", label: "Safety & storage", icon: ShieldCheck },
  { n: "04", label: "Pickup & deadline", icon: MapPin },
];

const PREPARED_PICKS = [
  { label: "Just now", hours: 0 },
  { label: "1h ago", hours: 1 },
  { label: "2h ago", hours: 2 },
  { label: "4h ago", hours: 4 },
  { label: "8h ago", hours: 8 },
];

const DEADLINE_PICKS = [
  { label: "+1h", hours: 1 },
  { label: "+2h", hours: 2 },
  { label: "+4h", hours: 4 },
  { label: "+8h", hours: 8 },
  { label: "+24h", hours: 24 },
];

interface FormState {
  donorId: string;
  title: string;
  category: string;
  description: string;
  quantityMeals: number;
  quantityKg: number;
  preparedHoursAgo: number;
  storage: string;
  sealed: boolean;
  hygieneConfirmed: boolean;
  allergens: string;
  address: string;
  lat: number | null;
  lng: number | null;
  deadlineHours: number;
}

interface PostResult {
  donation: DonationDto;
  matches: MatchDto[];
  notified: number;
  safety: { status: string; flags: string[] };
}

const DEFAULT_FORM: FormState = {
  donorId: "",
  title: "",
  category: "prepared_meals",
  description: "",
  quantityMeals: 40,
  quantityKg: 12,
  preparedHoursAgo: 1,
  storage: "hot_hold",
  sealed: true,
  hygieneConfirmed: true,
  allergens: "",
  address: "",
  lat: null,
  lng: null,
  deadlineHours: 4,
};

export function DonateForm() {
  const { partners, persona } = usePersona();
  const donors = useMemo(() => partners.filter((p) => p.type === "donor"), [partners]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostResult | null>(null);

  // Preselect persona-donor or first donor
  useEffect(() => {
    if (form.donorId || donors.length === 0) return;
    const preferred = persona?.type === "donor" ? persona : donors[0];
    selectDonor(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donors, persona]);

  function selectDonor(d: PartnerDto) {
    setForm((f) => ({
      ...f,
      donorId: d.id,
      address: `${d.name} — ${d.address}`,
      lat: d.lat,
      lng: d.lng,
    }));
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const expiresPreview = useMemo(
    () => new Date(Date.now() + form.deadlineHours * 3_600_000).toISOString(),
    [form.deadlineHours]
  );
  const previewUrgency = urgencyOf(expiresPreview);

  const stepValid = [
    !!form.donorId,
    form.title.trim().length >= 6 && form.quantityMeals > 0 && form.quantityKg > 0,
    form.storage !== "",
    !!form.address && form.lat !== null && form.deadlineHours > 0,
  ][step];

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: form.donorId,
          title: form.title,
          category: form.category,
          description: form.description,
          quantityMeals: form.quantityMeals,
          quantityKg: form.quantityKg,
          preparedAt: new Date(Date.now() - form.preparedHoursAgo * 3_600_000).toISOString(),
          expiresAt: expiresPreview,
          storage: form.storage,
          sealed: form.sealed,
          hygieneConfirmed: form.hygieneConfirmed,
          allergens: form.allergens,
          address: form.address,
          lat: form.lat,
          lng: form.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error +
            (data.flags?.length ? ` — ${data.flags.join(" ").toLowerCase()}` : "")
        );
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------- Success screen ---------------- */
  if (result) {
    const eligible = result.matches.filter((m) => m.eligible);
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        <div className="rounded-3xl border border-ink/10 bg-cream p-7 shadow-xl shadow-ink/10 md:p-10">
          <span className="grid size-14 place-items-center rounded-2xl bg-forest text-cream">
            <PartyPopper className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold md:text-4xl">
            Listed. Matched. <span className="italic text-clay">Alerts out.</span>
          </h2>
          <p className="mt-3 max-w-xl text-ink/70">
            “{result.donation.title}” is live on the rescue board.{" "}
            {result.notified > 0 ? (
              <>
                <BellRing className="mx-1 inline size-4 text-amber-700" />
                <strong>{result.notified} organisations</strong> were instantly notified.
              </>
            ) : (
              " No NGO currently fits this window — it stays listed until the deadline."
            )}
          </p>

          {/* safety verdict */}
          <div
            className={`mt-6 rounded-2xl border p-4 ${
              result.safety.status === "ok"
                ? "border-leaf/40 bg-leaf/10"
                : "border-amber/50 bg-amber/10"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-bold">
              {result.safety.status === "ok" ? (
                <>
                  <ShieldCheck className="size-4.5 text-leaf" /> Food-safety screening passed
                </>
              ) : (
                <>
                  <ShieldAlert className="size-4.5 text-amber-800" />
                  Listed with review flags — a coordinator will verify at pickup
                </>
              )}
            </p>
            {result.safety.flags?.length > 0 && (
              <ul className="mt-2 space-y-1 pl-6 text-xs text-ink/70">
                {result.safety.flags.map((f, i) => (
                  <li key={i} className="list-disc">{f}</li>
                ))}
              </ul>
            )}
          </div>

          {eligible.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/50">
                Smart matching — ranked recipients
              </p>
              <div className="mt-3 space-y-3">
                {eligible.slice(0, 3).map((m, i) => (
                  <MatchCard key={m.partnerId} match={m} rank={i + 1} delay={0.1 + i * 0.08} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/donations/${result.donation.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-bold text-cream transition-transform hover:-translate-y-0.5"
            >
              Track this donation <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/donations"
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-6 py-3 text-sm font-bold hover:border-forest"
            >
              Rescue board
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm(DEFAULT_FORM);
                setStep(0);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-bold text-ink/60 hover:text-ink"
            >
              List another
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------- Form ---------------- */
  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[300px_1fr]">
      {/* Left rail */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ol className="space-y-1.5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.n}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    active
                      ? "border-forest bg-forest text-cream shadow-lg shadow-forest/20"
                      : done
                        ? "border-leaf/40 bg-leaf/10 text-forest"
                        : "border-ink/10 bg-cream text-ink/45"
                  }`}
                >
                  <span className="font-display text-xl font-semibold">
                    {done ? <Check className="size-5" /> : s.n}
                  </span>
                  <span className="flex-1 text-sm font-bold">{s.label}</span>
                  <s.icon className={`size-4.5 ${active ? "text-limesoft" : ""}`} />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 rounded-2xl border border-amber/40 bg-amber/10 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <HandHeart className="size-4" /> Safety first
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink/70">
            Every listing passes automated food-safety screening before going live. Missing
            hygiene declarations or cold-chain gaps are flagged — never silently ignored.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl border border-ink/10 bg-cream p-6 shadow-xl shadow-ink/10 md:p-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div>
                <H>Who is donating?</H>
                <p className="mt-1 text-sm text-ink/60">
                  Pick the kitchen this pickup belongs to — location is prefilled from the profile.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {donors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => selectDonor(d)}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                        form.donorId === d.id
                          ? "border-forest bg-forest text-cream shadow-lg shadow-forest/20"
                          : "border-ink/10 bg-parchment hover:border-forest/40"
                      }`}
                    >
                      <span
                        className={`grid size-10 place-items-center rounded-full text-xs font-bold ${
                          form.donorId === d.id ? "bg-cream/15 text-cream" : "bg-forest/10 text-forest"
                        }`}
                      >
                        {initials(d.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{d.name}</span>
                        <span className={`block truncate text-xs ${form.donorId === d.id ? "text-cream/60" : "text-ink/55"}`}>
                          {d.address}
                        </span>
                      </span>
                      <Star className={`ml-auto size-4 shrink-0 ${form.donorId === d.id ? "text-amber" : "text-ink/30"}`} />
                      <span className={`text-xs font-bold ${form.donorId === d.id ? "text-amber" : "text-ink/40"}`}>
                        {d.rating}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <H>What&apos;s the surplus?</H>
                <p className="mt-1 text-sm text-ink/60">Be specific — the matcher uses category and quantity.</p>
                <div className="mt-6 space-y-5">
                  <Field label="Listing title">
                    <input
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g. Banquet surplus — paneer tikka & veg biryani"
                      className="w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-ink/35 focus:border-forest"
                    />
                  </Field>
                  <Field label="Food category">
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => set("category", c)}
                          className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                            form.category === c
                              ? "border-forest bg-forest text-cream"
                              : "border-ink/15 bg-parchment hover:border-forest/40"
                          }`}
                        >
                          {CATEGORY_META[c].label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Approx. meals (servings)">
                      <Stepper value={form.quantityMeals} onChange={(v) => set("quantityMeals", v)} step={10} min={5} />
                    </Field>
                    <Field label="Approx. weight (kg)">
                      <Stepper value={form.quantityKg} onChange={(v) => set("quantityKg", v)} step={2} min={1} />
                    </Field>
                  </div>
                  <Field label="Notes for the collector (optional)">
                    <textarea
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={3}
                      placeholder="Packaging, loading dock, parking, contact person…"
                      className="w-full resize-none rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-forest"
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <H>Safety & storage</H>
                <p className="mt-1 text-sm text-ink/60">
                  These answers feed the screening engine — honesty keeps the network trusted.
                </p>
                <div className="mt-6 space-y-6">
                  <Field label="When was it prepared?">
                    <div className="flex flex-wrap gap-2">
                      {PREPARED_PICKS.map((p) => (
                        <button
                          key={p.hours}
                          onClick={() => set("preparedHoursAgo", p.hours)}
                          className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                            form.preparedHoursAgo === p.hours
                              ? "border-forest bg-forest text-cream"
                              : "border-ink/15 bg-parchment hover:border-forest/40"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="How is it stored right now?">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(STORAGE_LABELS).map(([k, label]) => (
                        <button
                          key={k}
                          onClick={() => set("storage", k)}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                            form.storage === k
                              ? "border-forest bg-forest text-cream"
                              : "border-ink/15 bg-parchment hover:border-forest/40"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Toggle
                      on={form.sealed}
                      onClick={() => set("sealed", !form.sealed)}
                      title="Food is sealed / covered"
                      sub="Lids, cling-film or sealed trays"
                    />
                    <Toggle
                      on={form.hygieneConfirmed}
                      onClick={() => set("hygieneConfirmed", !form.hygieneConfirmed)}
                      title="Hygiene declaration"
                      sub="Handled by trained, gloved staff"
                    />
                  </div>
                  <Field label="Allergens (optional, but recommended)">
                    <input
                      value={form.allergens}
                      onChange={(e) => set("allergens", e.target.value)}
                      placeholder="e.g. Dairy, gluten, nuts — or 'None declared'"
                      className="w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-forest"
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <H>Pickup point & deadline</H>
                <p className="mt-1 text-sm text-ink/60">
                  Tap the map to fine-tune the pickup point. The deadline drives urgency and matching.
                </p>
                <div className="mt-6 space-y-5">
                  <Field label="Pickup address">
                    <div className="flex items-center gap-2 rounded-xl border border-ink/15 bg-cream px-4 py-3 focus-within:border-forest">
                      <MapPin className="size-4 shrink-0 text-clay" />
                      <input
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold outline-none"
                      />
                    </div>
                  </Field>
                  <LocationPicker
                    value={form.lat !== null ? { lat: form.lat, lng: form.lng! } : null}
                    onPick={(lat, lng) => {
                      set("lat", lat);
                      set("lng", lng);
                    }}
                  />
                  <Field label="Collection deadline">
                    <div className="flex flex-wrap gap-2">
                      {DEADLINE_PICKS.map((p) => (
                        <button
                          key={p.hours}
                          onClick={() => set("deadlineHours", p.hours)}
                          className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                            form.deadlineHours === p.hours
                              ? "border-forest bg-forest text-cream"
                              : "border-ink/15 bg-parchment hover:border-forest/40"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div
                    className="flex items-center justify-between rounded-2xl border p-4"
                    style={{ borderColor: URGENCY_META[previewUrgency].dot + "66", background: URGENCY_META[previewUrgency].dot + "12" }}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/55">
                        This listing goes live as
                      </p>
                      <p className="mt-1 flex items-center gap-2">
                        <UrgencyChip urgency={previewUrgency} />
                        <span className="text-sm font-bold">
                          closes <CountdownText to={expiresPreview} />
                        </span>
                      </p>
                    </div>
                    <p className="text-right text-xs leading-relaxed text-ink/60">
                      Short windows alert fewer,
                      <br />
                      more eligible NGOs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-clay/40 bg-clay/10 p-4 text-sm text-clay">
            <ShieldAlert className="mt-0.5 size-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-ink/60 transition-colors enabled:hover:bg-ink/5 disabled:opacity-30"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => stepValid && setStep((s) => s + 1)}
              disabled={!stepValid}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-sm font-bold text-cream transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-40"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!stepValid || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-clay px-7 py-3.5 text-sm font-bold text-cream transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-clay/30 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
                  Screening & matching…
                </>
              ) : (
                <>
                  Publish & alert NGOs <BellRing className="size-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold md:text-3xl">{children}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-ink/15 bg-cream p-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="size-9 rounded-lg bg-parchment text-lg font-bold transition-colors hover:bg-sand"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value || "0", 10)))}
        className="w-full flex-1 bg-transparent text-center font-display text-xl font-semibold outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="size-9 rounded-lg bg-parchment text-lg font-bold transition-colors hover:bg-sand"
      >
        +
      </button>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  title,
  sub,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
        on ? "border-leaf/50 bg-leaf/10" : "border-ink/15 bg-parchment"
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors ${
          on ? "bg-leaf text-cream" : "bg-ink/10 text-ink/40"
        }`}
      >
        <Check className="size-5" strokeWidth={3} />
      </span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-ink/55">{sub}</span>
      </span>
    </button>
  );
}
