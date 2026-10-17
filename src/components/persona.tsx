"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PartnerDto } from "@/lib/domain";

export interface NoteDto {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  donationId: string | null;
  createdAt: string;
}

interface PersonaCtx {
  partners: PartnerDto[];
  loading: boolean;
  persona: PartnerDto | null; // null = guest observer
  setPersonaId: (id: string | null) => void;
  unread: number;
  notes: NoteDto[];
  refreshNotes: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const Ctx = createContext<PersonaCtx | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [personaId, setPersonaIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [unread, setUnread] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPersonaIdState(window.localStorage.getItem("fb-persona"));
    setHydrated(true);
    fetch("/api/partners")
      .then((r) => r.json())
      .then((d) => setPartners(d.partners ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persona = useMemo(
    () => partners.find((p) => p.id === personaId) ?? null,
    [partners, personaId]
  );

  const setPersonaId = useCallback((id: string | null) => {
    setPersonaIdState(id);
    if (id) window.localStorage.setItem("fb-persona", id);
    else window.localStorage.removeItem("fb-persona");
  }, []);

  const refreshNotes = useCallback(async () => {
    if (!personaId) {
      setNotes([]);
      setUnread(0);
      return;
    }
    try {
      const r = await fetch(`/api/notifications?partnerId=${personaId}`);
      const d = await r.json();
      setNotes(d.notifications ?? []);
      setUnread(d.unread ?? 0);
    } catch {
      /* ignore */
    }
  }, [personaId]);

  useEffect(() => {
    if (!hydrated) return;
    refreshNotes();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(refreshNotes, 12_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [hydrated, refreshNotes]);

  const markAllRead = useCallback(async () => {
    if (!personaId) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: personaId }),
    }).catch(() => {});
    refreshNotes();
  }, [personaId, refreshNotes]);

  const value = useMemo(
    () => ({
      partners,
      loading,
      persona,
      setPersonaId,
      unread,
      notes,
      refreshNotes,
      markAllRead,
    }),
    [partners, loading, persona, setPersonaId, unread, notes, refreshNotes, markAllRead]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePersona() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const PERSONA_STYLE: Record<string, { label: string; classes: string }> = {
  donor: { label: "Donor", classes: "bg-amber/20 text-amber-900 border-amber/40" },
  ngo: { label: "NGO", classes: "bg-leaf/15 text-forest border-leaf/40" },
  volunteer: { label: "Volunteer", classes: "bg-limesoft/40 text-forest border-limesoft" },
  beneficiary: { label: "Beneficiary", classes: "bg-parchment text-ink/70 border-sand" },
  guest: { label: "Guest", classes: "bg-ink/5 text-ink/60 border-ink/15" },
};
