/**
 * encounter/dialogue/voice.ts
 *
 * The "real language" rendering. Attested greetings come straight from the
 * language data. For everything else this generates *impressionistic* speech —
 * seeded syllables shaped by the language family's broad phonology, clearly a
 * game effect, never a linguistic claim. Reconstructed languages are marked
 * with the linguist's asterisk. When two people cannot talk, this layer shows
 * the pantomime instead.
 */

import { makeRng, hashString, Rng } from '../../components/portraitLab/core/rng';
import { LanguageData } from '../../constants/gameData/languages';
import { SpeakIntent } from '../engine/battle';
import { SpeechLevel } from '../engine/communication';

interface Phonology {
  onsets: string[];
  vowels: string[];
  codas: string[];
  /** Chance a syllable closes with a coda. */
  closed: number;
  /** Chance a word reduplicates its first syllable. */
  redup: number;
}

const GENERIC: Phonology = {
  onsets: ['b', 'd', 'g', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w', 'h', ''],
  vowels: ['a', 'e', 'i', 'o', 'u'],
  codas: ['n', 'r', 'l', 's', ''],
  closed: 0.4, redup: 0.05,
};

const PHONOLOGIES: Array<[RegExp, Phonology]> = [
  [/indo-european/i, {
    onsets: ['b', 'd', 'g', 'k', 'kr', 'l', 'm', 'n', 'p', 'pr', 'r', 's', 'st', 't', 'tr', 'w', 'gh', ''],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ei', 'ou'],
    codas: ['s', 'n', 'r', 'm', 't', 'nt', ''],
    closed: 0.6, redup: 0.02,
  }],
  [/afro-asiatic/i, {
    onsets: ['b', 'd', 'ḥ', 'k', 'kh', 'l', 'm', 'n', 'q', 'r', 's', 'sh', 't', 'w', 'y', 'z', '’'],
    vowels: ['a', 'i', 'u', 'ā', 'ī', 'ū'],
    codas: ['b', 'd', 'k', 'l', 'm', 'n', 'r', 's', 't', ''],
    closed: 0.65, redup: 0.02,
  }],
  [/niger-congo/i, {
    onsets: ['b', 'd', 'f', 'g', 'gb', 'k', 'kp', 'l', 'm', 'mb', 'n', 'nd', 'ng', 'ny', 's', 't', 'w', 'y'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ɔ', 'ɛ'],
    codas: [''],
    closed: 0.05, redup: 0.18,
  }],
  [/sino-tibetan/i, {
    onsets: ['b', 'ch', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'sh', 't', 'ts', 'w', 'x', 'zh'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ao', 'ai', 'ou'],
    codas: ['n', 'ng', ''],
    closed: 0.45, redup: 0.04,
  }],
  [/austronesian/i, {
    onsets: ['b', 'd', 'h', 'k', 'l', 'm', 'n', 'ng', 'p', 'r', 's', 't', 'w', ''],
    vowels: ['a', 'e', 'i', 'o', 'u'],
    codas: ['n', 'ng', 'k', ''],
    closed: 0.2, redup: 0.25,
  }],
  [/turkic|mongolic|tungusic/i, {
    onsets: ['b', 'ch', 'd', 'g', 'k', 'l', 'm', 'n', 'o', 'q', 's', 't', 'y', ''],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ö', 'ü', 'ı'],
    codas: ['n', 'r', 'l', 'k', 'z', 't', ''],
    closed: 0.7, redup: 0.02,
  }],
  [/uto-aztecan|penutian|algonquian|iroquoian|siouan|muskogean|salishan|na-dene|mayan|quechuan|aymaran/i, {
    onsets: ['ch', 'h', 'k', 'kw', 'l', 'm', 'n', 'p', 's', 'sh', 't', 'tl', 'ts', 'w', 'y', ''],
    vowels: ['a', 'e', 'i', 'o', 'u'],
    codas: ['n', 'l', 'k', 'tl', 'h', ''],
    closed: 0.5, redup: 0.06,
  }],
  [/pama-nyungan/i, {
    onsets: ['b', 'd', 'g', 'j', 'k', 'l', 'm', 'n', 'ng', 'ny', 'p', 'r', 'rr', 't', 'w', 'y'],
    vowels: ['a', 'i', 'u'],
    codas: ['n', 'l', 'rr', ''],
    closed: 0.3, redup: 0.12,
  }],
  [/dravidian/i, {
    onsets: ['ch', 'k', 'l', 'm', 'n', 'p', 'r', 't', 'v', 'y', 'nd', 'mb', ''],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ā', 'ī'],
    codas: ['m', 'n', 'r', 'l', ''],
    closed: 0.35, redup: 0.08,
  }],
];

function phonologyFor(lang: LanguageData): Phonology {
  const key = `${lang.family} ${lang.name}`;
  for (const [pattern, phon] of PHONOLOGIES) {
    if (pattern.test(key)) return phon;
  }
  return GENERIC;
}

function syllable(rng: Rng, p: Phonology): string {
  const onset = p.onsets[Math.floor(rng() * p.onsets.length)];
  const vowel = p.vowels[Math.floor(rng() * p.vowels.length)];
  const coda = rng() < p.closed ? p.codas[Math.floor(rng() * p.codas.length)] : '';
  return onset + vowel + coda;
}

function word(rng: Rng, p: Phonology): string {
  const first = syllable(rng, p);
  const count = 1 + Math.floor(rng() * 2.4);
  let out = rng() < p.redup ? first + first : first;
  for (let i = 1; i < count; i++) out += syllable(rng, p);
  return out;
}

/** A stable utterance for this speaker, line, and length — same every replay. */
export function utterance(lang: LanguageData, seedText: string, words: number): string {
  const p = phonologyFor(lang);
  const rng = makeRng(hashString(`${lang.id}|${seedText}`));
  const parts: string[] = [];
  for (let i = 0; i < words; i++) parts.push(word(rng, p));
  let text = parts.join(' ');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return lang.isReconstructed ? `*${text}` : text;
}

/** Attested phrase where the data has one; null otherwise. */
export function attestedPhrase(lang: LanguageData, intent: SpeakIntent): string | null {
  const g = lang.greetings;
  if (!g) return null;
  const mark = (s: string | undefined) => (s ? (lang.isReconstructed ? `*${s}` : s) : null);
  switch (intent) {
    case 'greet': return mark(g.hello);
    case 'flee':
    case 'friendship': return mark(g.goodbye);
    case 'trade-accept': return mark(g.yes ?? g.thanks);
    case 'trade-refuse': return mark(g.no);
    case 'talk-warm': return mark(g.yes);
    case 'talk-miss': return mark(g.no);
    default: return null;
  }
}

const GESTURES: Record<string, string[]> = {
  greet: ['raises an open hand, palm out', 'touches chest, then extends both hands', 'stops at a careful distance and nods slowly'],
  talk: ['points at the horizon, then mimes walking', 'sketches shapes in the dirt with a stick', 'mimes eating, then shrugs a question'],
  'talk-warm': ['nods vigorously, smiling', 'laughs and claps once', 'taps their temple: *understood*'],
  'talk-miss': ['squints, tilts head', 'spreads hands wide: *nothing*', 'looks around as if the meaning fell somewhere nearby'],
  'trade-offer': ['holds out goods on both palms', 'sets an item on the ground and steps back from it', 'points: yours — mine — trade?'],
  'trade-accept': ['presses the item to their chest and bows', 'grins and holds up the new prize'],
  'trade-refuse': ['pushes the air away with both hands', 'turns a shoulder, clutching their goods'],
  befriend: ['offers an open hand, waiting', 'shares out food, half and half'],
  threat: ['draws a line in the dirt with a heel', 'shows a fist, slowly'],
  attack: ['drops everything and charges'],
  flee: ['backs away, then turns and runs'],
  friendship: ['grips your forearm hard, grinning', 'points at you, then themself: *us*'],
  default: ['gestures urgently', 'watches your face for any sign of meaning'],
};

export function gestureFor(intent: SpeakIntent, seedText: string): string {
  const pool = GESTURES[intent] ?? GESTURES.default;
  const rng = makeRng(hashString(seedText));
  return pool[Math.floor(rng() * pool.length)];
}

/** Degrade a fluent English line to what partial comprehension actually yields. */
export function degrade(line: string, level: SpeechLevel, seedText: string): string {
  if (level === 'fluent' || level === 'accented') return line;
  const rng = makeRng(hashString(`degrade|${seedText}`));
  const words = line.replace(/[.,!?—]/g, '').split(/\s+/).filter(Boolean);
  const keep = level === 'partial' ? 0.55 : 0.3;
  const kept = words.filter((w) => w.length > 3 && rng() < keep + w.length / 40);
  if (!kept.length) kept.push(words[Math.floor(rng() * words.length)] ?? '...');
  return kept.slice(0, level === 'partial' ? 6 : 3).join('... ') + '...?';
}
