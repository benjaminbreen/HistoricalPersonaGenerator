/**
 * encounter/RosterStrip.tsx
 *
 * The shelf of saved personas above the footer, and the star that puts a
 * persona on it. Pick two and the encounter button wakes up.
 */

import React, { useEffect, useMemo, useState } from 'react';
import PixelPortrait from '../components/portraitLab/PixelPortrait';
import { HistoricalPersona } from '../services/personaGenerator';
import {
  isSaved, loadRoster, personaRosterId, removePersona, RosterEntry, savePersona, subscribeRoster,
} from './roster';
import './encounter.css';

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export function SavePersonaStar({ persona }: { persona: HistoricalPersona }) {
  const [saved, setSaved] = useState(() => isSaved(persona));
  useEffect(() => {
    setSaved(isSaved(persona));
    return subscribeRoster(() => setSaved(isSaved(persona)));
  }, [persona]);

  return (
    <button
      className={`roster-star ${saved ? 'is-saved' : ''}`}
      title={saved ? 'Remove from your saved personae' : 'Save this persona'}
      aria-label={saved ? 'Remove from saved personae' : 'Save persona'}
      onClick={() => (saved ? removePersona(personaRosterId(persona)) : savePersona(persona))}
    >
      {saved ? '★' : '☆'}
    </button>
  );
}

interface RosterStripProps {
  onEncounter: (a: HistoricalPersona, b: HistoricalPersona) => void;
}

export default function RosterStrip({ onEncounter }: RosterStripProps) {
  const [entries, setEntries] = useState<RosterEntry[]>(() => loadRoster());
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => subscribeRoster(() => {
    const next = loadRoster();
    setEntries(next);
    setSelected((prev) => prev.filter((id) => next.some((e) => e.id === id)));
  }), []);

  const picked = useMemo(
    () => selected
      .map((id) => entries.find((e) => e.id === id))
      .filter((e): e is RosterEntry => !!e),
    [selected, entries]
  );

  if (!entries.length) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev.slice(-1), id];
    });
  };

  return (
    <section className="roster-strip" aria-label="Saved personae">
      <div className="roster-strip-header">
        <span className="roster-strip-title">Saved Personae</span>
        <span className="roster-strip-hint">
          {picked.length === 2 ? 'Two lives chosen. What happens when they meet?'
            : picked.length === 1 ? 'Choose one more to stage an encounter.'
            : 'Select two to stage an encounter.'}
        </span>
        {picked.length === 2 && (
          <button
            className="roster-encounter-button"
            onClick={() => onEncounter(picked[0].persona, picked[1].persona)}
          >
            ⚔ Begin Encounter
          </button>
        )}
      </div>
      <div className="roster-strip-row">
        {entries.map((entry) => {
          const c = entry.persona.character;
          const active = selected.includes(entry.id);
          return (
            <div key={entry.id} className={`roster-card ${active ? 'is-active' : ''}`}>
              <button className="roster-card-portrait" onClick={() => toggle(entry.id)}>
                <PixelPortrait character={c} size={64} animated={false} />
                {active && <span className="roster-card-badge">{selected.indexOf(entry.id) + 1}</span>}
              </button>
              <button
                className="roster-card-remove"
                aria-label={`Remove ${c.name}`}
                onClick={() => removePersona(entry.id)}
              >×</button>
              <div className="roster-card-tip" role="tooltip">
                <strong>{c.name}</strong>
                <span>{c.profession} · {c.age}</span>
                <span>{entry.persona.location}, {formatYear(entry.persona.year)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
