/**
 * encounter/roster.ts
 *
 * The shelf of saved personas, in localStorage. Whole HistoricalPersona
 * objects are stored — they are plain data and regeneration is not
 * deterministic across code changes, so the record itself is the save.
 */

import { HistoricalPersona } from '../services/personaGenerator';

const KEY = 'hpg-roster-v1';
export const ROSTER_CAP = 24;

export interface RosterEntry {
  id: string;
  savedAt: number;
  persona: HistoricalPersona;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeRoster(fn: Listener): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) fn(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function loadRoster(): RosterEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e?.persona?.character?.name) : [];
  } catch {
    return [];
  }
}

function persist(entries: RosterEntry[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full: drop the oldest and retry once.
    try {
      window.localStorage.setItem(KEY, JSON.stringify(entries.slice(1)));
    } catch { /* give up quietly */ }
  }
  notify();
}

export function personaRosterId(persona: HistoricalPersona): string {
  const c = persona.character;
  return `${c.portraitSeed ?? 0}-${c.name}-${persona.year}`.replace(/\s+/g, '_');
}

export function isSaved(persona: HistoricalPersona): boolean {
  const id = personaRosterId(persona);
  return loadRoster().some((e) => e.id === id);
}

export function savePersona(persona: HistoricalPersona): RosterEntry[] {
  const entries = loadRoster();
  const id = personaRosterId(persona);
  if (entries.some((e) => e.id === id)) return entries;
  const next = [...entries, { id, savedAt: Date.now(), persona }].slice(-ROSTER_CAP);
  persist(next);
  return next;
}

export function removePersona(id: string): RosterEntry[] {
  const next = loadRoster().filter((e) => e.id !== id);
  persist(next);
  return next;
}
