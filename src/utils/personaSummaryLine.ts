/**
 * utils/personaSummaryLine.ts
 *
 * One line under the name, at the top of the character sheet: the trade, the
 * century, the place, and the two things about their temperament a stranger
 * would notice first.
 *
 * The point is orientation, not summary. A reader who has just opened the
 * details modal knows the name and nothing else; this tells them who they are
 * looking at before they start down the columns of eye shapes and hair
 * textures. It is deterministic — the same person reads the same way on every
 * render, which the attribute prose did not, and it shows.
 */

import { HistoricalPersona } from '../services/personaGenerator';
import { hashString, makeRng, Rng } from '../components/portraitLab/core/rng';

/** A pole of a personality dimension, with whether it flatters. */
interface Pole {
  words: string[];
  /** Warm poles pair with cold ones under "but"; like with like takes "and". */
  warm: boolean;
}

const POLES: Record<string, { high: Pole; low: Pole }> = {
  openness: {
    high: { words: ['a curious streak', 'an appetite for the new', 'an open mind'], warm: true },
    low: { words: ['no patience for novelty', 'a preference for the old ways', 'a suspicion of anything new'], warm: false },
  },
  conscientiousness: {
    high: { words: ['a methodical streak', 'a careful hand', 'a habit of order'], warm: true },
    low: { words: ['a careless streak', 'little use for order', 'a habit of leaving things half-done'], warm: false },
  },
  extraversion: {
    high: { words: ['an outgoing disposition', 'a sociable manner', 'a talker’s temperament'], warm: true },
    low: { words: ['a retiring disposition', 'a solitary manner', 'a preference for their own company'], warm: false },
  },
  agreeableness: {
    high: { words: ['a warm manner', 'an obliging nature', 'a good word for most people'], warm: true },
    low: { words: ['a bad attitude', 'a prickly temper', 'a short way with people'], warm: false },
  },
  neuroticism: {
    high: { words: ['a nervous disposition', 'a mind that worries at things', 'a temper close to the surface'], warm: false },
    low: { words: ['an even temper', 'a steady nerve', 'a calm that rarely breaks'], warm: true },
  },
};

const pick = (rng: Rng, items: string[]): string => items[Math.floor(rng() * items.length)];

/**
 * "9th century BCE", "17th century". A century is the plainest way to place a
 * year for a reader who is not going to do the arithmetic themselves.
 */
export function centuryLabel(year: number): string {
  const ordinal = (n: number): string => {
    const tens = n % 100;
    if (tens >= 11 && tens <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };
  if (year < 0) return `${ordinal(Math.ceil(Math.abs(year) / 100))} century BCE`;
  return `${ordinal(Math.floor((year - 1) / 100) + 1)} century`;
}

const withArticle = (noun: string): string =>
  `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;

/**
 * The two dimensions furthest from the middle. Someone at 97% extraversion and
 * 51% openness is described by the first and not the second.
 */
function salientTraits(persona: HistoricalPersona, rng: Rng): string {
  const personality = persona.character.personality;
  if (!personality) return '';

  const ranked = Object.keys(POLES)
    .map((key) => {
      const value = (personality as unknown as Record<string, number>)[key];
      return { key, value, distance: Math.abs((value ?? 0.5) - 0.5) };
    })
    .filter((entry) => typeof entry.value === 'number' && entry.distance > 0.2)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 2);

  if (ranked.length === 0) return '';

  const chosen = ranked.map((entry) => {
    const pole = entry.value > 0.5 ? POLES[entry.key].high : POLES[entry.key].low;
    return { phrase: pick(rng, pole.words), warm: pole.warm };
  });

  if (chosen.length === 1) return chosen[0].phrase;
  const joiner = chosen[0].warm === chosen[1].warm ? ' and ' : ' but ';
  return `${chosen[0].phrase}${joiner}${chosen[1].phrase}`;
}

/**
 * The line itself. Returns '' rather than a half-sentence when there is not
 * enough to say — an empty subtitle is better than "a  from ".
 */
export function personaSummaryLine(persona: HistoricalPersona): string {
  const character = persona.character;
  if (!character?.profession) return '';

  const rng = makeRng(hashString(`summary|${character.id || character.name}|${character.profession}`));

  const place = persona.location && persona.location !== persona.region
    ? persona.location
    : persona.region;

  const opening = `${withArticle(character.profession.toLowerCase())} from ${centuryLabel(persona.year)}${place ? ` ${place}` : ''}`;
  const traits = salientTraits(persona, rng);

  const line = traits ? `${opening}, with ${traits}` : opening;
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
}
