/**
 * encounter/engine/communication.ts
 *
 * Whether two personas can talk at all, and through what. Built on
 * `getLanguageComprehension`, which already knows about lingua francas,
 * pidgins, and family distance; this adds the case where two educated
 * strangers reach for a prestige language neither speaks natively.
 */

import { LANGUAGES, LanguageData, getLanguageComprehension } from '../../constants/gameData/languages';
import { HistoricalPersona } from '../../services/personaGenerator';

export type SpeechLevel = 'fluent' | 'accented' | 'partial' | 'fragments' | 'pidgin' | 'gesture';

export interface CommunicationReport {
  level: SpeechLevel;
  /** 0..1 mutual intelligibility, best channel found. */
  score: number;
  /** The tongue they meet in, when there is one. */
  via: string | null;
  viaKind: 'shared' | 'related' | 'lingua-franca' | 'pidgin' | 'none';
  /** One sentence for the HUD. */
  note: string;
}

const LINGUA_FRANCAS = ['LATIN', 'CLASSICAL_ARABIC', 'SANSKRIT', 'CLASSICAL_CHINESE', 'OLD_FRENCH'];

function isLettered(p: HistoricalPersona): boolean {
  const c = p.character;
  if ((c.stats?.intelligence ?? 0) >= 9) return true;
  if (c.wealthLevel === 'wealthy' || c.wealthLevel === 'noble') return true;
  return /scribe|scholar|priest|monk|imam|clerk|physician|calligrapher|poet|teacher|astronomer|official/i
    .test(c.profession || '');
}

/** A prestige language both could plausibly have studied, live in both their lifetimes. */
function sharedLinguaFranca(a: HistoricalPersona, b: HistoricalPersona): LanguageData | null {
  if (!isLettered(a) || !isLettered(b)) return null;
  for (const id of LINGUA_FRANCAS) {
    const lang = LANGUAGES[id];
    if (!lang) continue;
    const covers = (p: HistoricalPersona) =>
      p.year >= lang.period[0] - 200 && p.year <= lang.period[1] + 400 &&
      lang.culturalZones?.includes(p.character.culturalZone as any);
    if (covers(a) && covers(b)) return lang;
  }
  return null;
}

export function assessCommunication(a: HistoricalPersona, b: HistoricalPersona): CommunicationReport {
  const langA = a.languageData;
  const langB = b.languageData;

  if (!langA || !langB) {
    return {
      level: 'gesture', score: 0, via: null, viaKind: 'none',
      note: 'No common tongue — everything must be shown, not said.',
    };
  }

  const direct = Math.max(
    getLanguageComprehension(langA, langB),
    getLanguageComprehension(langB, langA)
  );

  const franca = sharedLinguaFranca(a, b);
  const francaScore = franca ? 0.55 : 0;

  const score = Math.max(direct, francaScore);
  const usingFranca = franca !== null && francaScore > direct;

  if (langA.id === langB.id) {
    return {
      level: 'fluent', score: 1, via: langA.name, viaKind: 'shared',
      note: `Both speak ${langA.name}.`,
    };
  }
  if (usingFranca) {
    return {
      level: 'accented', score, via: franca!.name, viaKind: 'lingua-franca',
      note: `Neither's mother tongue — but both were schooled in ${franca!.name}.`,
    };
  }
  if (langA.family === 'Pidgin' || langB.family === 'Pidgin') {
    return {
      level: 'pidgin', score: Math.max(score, 0.4), via: langA.family === 'Pidgin' ? langA.name : langB.name,
      viaKind: 'pidgin',
      note: 'A trade tongue built for moments exactly like this one.',
    };
  }
  if (score >= 0.55) {
    return {
      level: 'accented', score, via: langA.name, viaKind: 'related',
      note: `${langA.name} and ${langB.name} are close kin — slow speech carries.`,
    };
  }
  if (score >= 0.3) {
    return {
      level: 'partial', score, via: null, viaKind: 'related',
      note: `${langA.name} and ${langB.name} share old roots. Perhaps half is understood.`,
    };
  }
  if (score > 0.03) {
    return {
      level: 'fragments', score, via: null, viaKind: 'none',
      note: 'A few loanwords from traders, and much pointing.',
    };
  }
  return {
    level: 'gesture', score: 0, via: null, viaKind: 'none',
    note: `${langA.name} and ${langB.name} have nothing in common. Hands and faces must serve.`,
  };
}
