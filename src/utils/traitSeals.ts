/**
 * utils/traitSeals.ts
 *
 * The one or two things about a person that are genuinely off the end of the
 * scale, in a form a portrait can wear.
 *
 * The card already prints eleven ability scores and five personality figures,
 * and a reader takes almost nothing from a wall of numbers — the 10 and the 3
 * look the same until you go looking. A seal is the opposite claim: it says
 * nothing at all about the ordinary and one thing about the extraordinary.
 *
 * So the bar is deliberately high. A score of 10 or 1 is about one draw in two
 * hundred (see `personaRarityService`, whose model this quotes rather than
 * re-derives), and a personality trait is only sealed in the outer one per cent
 * of its range. That puts a seal on something under a fifth of personas and
 * two seals on very few, which is the frequency at which a mark still means
 * something. Both cuts are constants below; they are the tuning knob.
 *
 * Nothing here is a value judgement dressed as a fact. A low score seals as
 * readily as a high one — "sickly" is exactly as unusual a life as "never
 * ails", and the app's whole business is that both were lived.
 */

import { statStanding } from '../services/personaRarityService';

export type SealFamily = 'body' | 'mind' | 'temper';

export interface TraitSeal {
  /** Stable key, for React and for tests. */
  id: string;
  /** The monogram stamped into the wax. */
  glyph: string;
  /** Two or three words, in the register the biography uses. */
  epithet: string;
  /** "top 1% for neuroticism" — the claim the seal is making. */
  standing: string;
  /** Which end of the scale, so the rim can say so without the label open. */
  direction: 'top' | 'bottom';
  family: SealFamily;
}

/** A score this far out, or further, earns a seal. About 1 draw in 200 either way. */
const STAT_HIGH = 10;
const STAT_LOW = 1;

/**
 * Personality is a uniform draw on 0..1, so the cut *is* the share: 0.99 is the
 * top one per cent and nothing more needs deriving.
 */
const TRAIT_HIGH = 0.99;
const TRAIT_LOW = 0.01;

/** Never more than this many on one face, however remarkable the person. */
const MAX_SEALS = 2;

interface Entry {
  label: string;
  /**
   * The monogram in the wax. Two letters rather than one because four of the
   * sixteen begin with C — a seal that could equally mean charisma, cunning,
   * constitution or conscientiousness is not telling anyone anything.
   */
  glyph: string;
  family: SealFamily;
  high: string;
  low: string;
}

/**
 * The epithets.
 *
 * Written as something a neighbour would say rather than something a character
 * sheet would print — "ox-strong", not "Strength 10". They are the same
 * vocabulary `statToText` works in, one register shorter, and they carry no
 * pronoun so they fit any persona.
 *
 * One rule governs the wording, and it is worth stating because the obvious
 * candidates break it. An epithet may be an English idiom — "all thumbs",
 * "hawk-eyed", "silver-tongued" — because the narrator is speaking modern
 * English about every persona in the app, in every millennium, and always has.
 * What an epithet may *not* do is make a claim about the person's own world.
 * "Unlettered" was the first draft for a low intelligence score and it is
 * exactly that: it says letters existed and this person did not have them,
 * which for a Neolithic herder is not a description of their mind but a
 * statement about a technology that had not been invented. The same trap is
 * waiting in any word that presumes schooling, coinage, clocks or scripture.
 */
const STATS: Record<string, Entry> = {
  strength: { label: 'strength', glyph: 'St', family: 'body', high: 'ox-strong', low: 'slight-built' },
  dexterity: { label: 'dexterity', glyph: 'Dx', family: 'body', high: 'deft-handed', low: 'all thumbs' },
  stamina: { label: 'stamina', glyph: 'Sm', family: 'body', high: 'tireless', low: 'soon winded' },
  constitution: { label: 'constitution', glyph: 'Cn', family: 'body', high: 'never ails', low: 'sickly' },
  intelligence: { label: 'intelligence', glyph: 'In', family: 'mind', high: 'quick-witted', low: 'slow of wit' },
  wisdom: { label: 'wisdom', glyph: 'Ws', family: 'mind', high: 'an old head', low: 'rash' },
  perception: { label: 'perception', glyph: 'Pc', family: 'mind', high: 'hawk-eyed', low: 'dim-sighted' },
  craftiness: { label: 'craftiness', glyph: 'Cf', family: 'mind', high: 'sly', low: 'plain-dealing' },
  charisma: { label: 'charisma', glyph: 'Ch', family: 'temper', high: 'silver-tongued', low: 'hard going' },
  persuasion: { label: 'persuasion', glyph: 'Ps', family: 'temper', high: 'a coaxing tongue', low: 'blunt-spoken' },
  luck: { label: 'luck', glyph: 'Lk', family: 'temper', high: "fortune's own", low: 'ill-starred' },
};

const TRAITS: Record<string, Entry> = {
  openness: { label: 'openness', glyph: 'Op', family: 'mind', high: 'head full of elsewhere', low: 'set in old ways' },
  conscientiousness: { label: 'conscientiousness', glyph: 'Cs', family: 'mind', high: 'exacting', low: 'slapdash' },
  extraversion: { label: 'extraversion', glyph: 'Ex', family: 'temper', high: 'never quiet', low: 'solitary' },
  agreeableness: { label: 'agreeableness', glyph: 'Ag', family: 'temper', high: 'gentle-hearted', low: 'prickly' },
  neuroticism: { label: 'neuroticism', glyph: 'Nr', family: 'temper', high: 'nerve-wracked', low: 'unshakeable' },
};

/** "top 1%", "bottom 0.5%" — rounded to something a person can hold in their head. */
function standingPhrase(direction: 'top' | 'bottom', share: number, label: string): string {
  const percent = share * 100;
  const figure = percent < 1 ? `${percent.toFixed(1)}%` : `${Math.round(percent)}%`;
  return `${direction} ${figure} for ${label}`;
}

interface SealInput {
  stats?: Record<string, number> | null;
  personality?: Record<string, number> | null;
}

export function traitSeals(character: SealInput | null | undefined): TraitSeal[] {
  if (!character) return [];
  const stats = character.stats || {};
  const personality = character.personality || {};

  // `share` rides along so the rarest seal can win the cut, rather than
  // whichever key happens to come first in the table.
  const found: Array<TraitSeal & { share: number }> = [];

  for (const [key, entry] of Object.entries(STATS)) {
    const value = stats[key];
    if (typeof value !== 'number') continue;
    if (value < STAT_HIGH && value > STAT_LOW) continue;
    const { direction, share } = statStanding(value);
    found.push({
      id: `stat:${key}`,
      glyph: entry.glyph,
      epithet: direction === 'top' ? entry.high : entry.low,
      standing: standingPhrase(direction, share, entry.label),
      direction,
      family: entry.family,
      share,
    });
  }

  for (const [key, entry] of Object.entries(TRAITS)) {
    const value = personality[key];
    if (typeof value !== 'number') continue;
    if (value < TRAIT_HIGH && value > TRAIT_LOW) continue;
    const direction = value >= TRAIT_HIGH ? 'top' : 'bottom';
    const share = direction === 'top' ? 1 - value : value;
    found.push({
      id: `trait:${key}`,
      glyph: entry.glyph,
      epithet: direction === 'top' ? entry.high : entry.low,
      standing: standingPhrase(direction, Math.max(share, 0.001), entry.label),
      direction,
      family: entry.family,
      share,
    });
  }

  return found
    .sort((a, b) => a.share - b.share)
    .slice(0, MAX_SEALS)
    .map(({ share, ...seal }) => seal);
}
