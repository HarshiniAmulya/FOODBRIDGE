"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartHandshake,
  Bell,
  ChevronDown,
  X,
  MapPin,
  UtensilsCrossed,
  Truck,
  Users,
  CheckCheck,
  Eye,
  Sparkles,
  HandHeart,
} from "lucide-react";
import { usePersona, initials, PERSONA_STYLE, NoteDto } from "./persona";
import { formatCountdown } from "@/lib/domain";

const LINKS = [
  { href: "/donations", label: "Rescue Board" },
  { href: "/donate", label: "Donate Food" },
  { href: "/impact", label: "Impact" },
  { href: "/partners", label: "Network" },
];

const GROUP_ICONS: Record<string, typeof MapPin> = {
  donor: UtensilsCrossed,
  ngo: HandHeart,
  volunteer: Truck,
  beneficiary: Users,
};

export function Nav() {
  const pathname = usePathname();
  const { persona, setPersonaId, partners, unread, notes, markAllRead } = usePersona();
  const [notifOpen, setNotifOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-forest text-cream transition-transform duration-300 group-hover:-rotate-6">
              <HeartHandshake className="size-5" strokeWidth={2} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              FoodBridge<span className="italic text-clay">·AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-forest text-cream" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2" ref={wrapRef}>
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative grid size-10 place-items-center rounded-full border border-ink/15 bg-cream transition-colors hover:bg-parchment"
                aria-label="Notifications"
              >
                <Bell className="size-4.5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min size-4.5 min-w-4.5 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-cream">
                    {unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-12 w-90 overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-2xl shadow-ink/20"
                  >
                    <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                      <p className="text-sm font-bold">
                        {persona ? `Alerts for ${persona.name}` : "Alerts"}
                      </p>
                      {persona && unread > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs font-semibold text-moss hover:text-forest"
                        >
                          <CheckCheck className="size-3.5" /> Mark read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!persona ? (
                        <EmptyNote text="Pick a persona to receive live rescue alerts." />
                      ) : notes.length === 0 ? (
                        <EmptyNote text="No alerts yet — new matches will appear here instantly." />
                      ) : (
                        notes.map((n) => <NoteRow key={n.id} n={n} />)
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Persona switcher */}
            <button
              onClick={() => setPersonaOpen(true)}
              className="flex h-10 items-center gap-2 rounded-full border border-ink/15 bg-cream pl-1.5 pr-3 transition-colors hover:bg-parchment"
            >
              <span
                className={`grid size-7 place-items-center rounded-full text-[11px] font-bold ${
                  persona ? "bg-forest text-cream" : "bg-sand text-ink/60"
                }`}
              >
                {persona ? initials(persona.name) : <Eye className="size-3.5" />}
              </span>
              <span className="hidden max-w-36 truncate text-sm font-semibold sm:block">
                {persona ? persona.name : "Guest view"}
              </span>
              <ChevronDown className="size-4 text-ink/50" />
            </button>
          </div>
        </div>
      </header>

      {/* Persona modal */}
      <AnimatePresence>
        {personaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
            onClick={() => setPersonaOpen(false)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-ink/10 bg-cream shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-6 pt-6">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-clay">
                    <Sparkles className="size-3.5" /> Demo mode
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold">
                    Step into the network
                  </h3>
                  <p className="mt-1 text-sm text-ink/60">
                    Act as any actor group — claims, pickups and alerts follow your persona.
                  </p>
                </div>
                <button
                  onClick={() => setPersonaOpen(false)}
                  className="grid size-9 place-items-center rounded-full hover:bg-ink/5"
                >
                  <X className="size-4.5" />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
                <PersonaOption
                  active={persona === null}
                  onSelect={() => {
                    setPersonaId(null);
                    setPersonaOpen(false);
                  }}
                  icon={<Eye className="size-4" />}
                  name="Guest observer"
                  meta="Watch the platform without acting"
                  badge={PERSONA_STYLE.guest}
                />
                {(["donor", "ngo", "volunteer", "beneficiary"] as const).map((type) => {
                  const list = partners.filter((p) => p.type === type);
                  if (list.length === 0) return null;
                  const Icon = GROUP_ICONS[type];
                  return (
                    <div key={type}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
                        <Icon className="size-3.5" /> {PERSONA_STYLE[type].label}s
                      </p>
                      <div className="space-y-1.5">
                        {list.map((p) => (
                          <PersonaOption
                            key={p.id}
                            active={persona?.id === p.id}
                            onSelect={() => {
                              setPersonaId(p.id);
                              setPersonaOpen(false);
                            }}
                            icon={initials(p.name)}
                            name={p.name}
                            meta={p.tagline ?? p.address}
                            badge={PERSONA_STYLE[type]}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PersonaOption({
  active,
  onSelect,
  icon,
  name,
  meta,
  badge,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  name: string;
  meta: string;
  badge: { label: string; classes: string };
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
        active
          ? "border-forest bg-forest text-cream shadow-lg shadow-forest/20"
          : "border-ink/10 bg-cream hover:border-forest/40 hover:bg-parchment"
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
          active ? "bg-cream/15 text-cream" : "bg-forest/10 text-forest"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span className={`block truncate text-xs ${active ? "text-cream/70" : "text-ink/55"}`}>
          {meta}
        </span>
      </span>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${active ? "border-cream/30 text-cream/90" : badge.classes}`}>
        {badge.label}
      </span>
    </button>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-sm text-ink/50">{text}</p>;
}

function NoteRow({ n }: { n: NoteDto }) {
  const tone =
    n.kind === "match_alert"
      ? "bg-clay/10 text-clay"
      : n.kind === "claim"
        ? "bg-leaf/15 text-forest"
        : "bg-amber/15 text-amber-900";
  return (
    <div className={`border-b border-ink/5 px-4 py-3 ${n.read ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
          {n.kind.replace("_", " ")}
        </span>
        <span className="ml-auto text-[11px] text-ink/45">
          {formatCountdown(n.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm font-bold">{n.title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-ink/65">{n.body}</p>
    </div>
  );
}
