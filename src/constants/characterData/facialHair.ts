/**
 * constants/characterData/facialHair.ts
 *
 * Facial hair was fashion, and fashion has dates.
 *
 * The styles used to be picked uniformly from a flat list, so a soul patch was
 * as likely in Iron Age Gaul as in 1970 and mutton chops turned up across
 * twelve thousand years at a steady nine percent. Each style now carries the
 * window it actually belonged to, plus the places where it meant something.
 */

import type { CulturalZone } from '../../types/characterData';

export type FacialHairStyle =
  | 'full_beard' | 'goatee' | 'mustache' | 'stubble' | 'van_dyke' | 'soul_patch' | 'mutton_chops';

export interface FacialHairContext {
  year: number;
  culturalZone?: CulturalZone;
  placeLower?: string;
}

/** 0 removes the style entirely; 1 is its ordinary rate. */
type StyleWeight = (ctx: FacialHairContext) => number;

const inZone = (ctx: FacialHairContext, ...zones: CulturalZone[]): boolean =>
  !!ctx.culturalZone && zones.includes(ctx.culturalZone);

const place = (ctx: FacialHairContext, ...needles: string[]): boolean =>
  needles.some(n => (ctx.placeLower ?? '').includes(n));

/** 0 outside [start, end], rising and falling at the edges. */
function window(year: number, start: number, full: number, fade: number, end: number): number {
  if (year <= start || year >= end) return 0;
  if (year < full) return (year - start) / (full - start);
  if (year <= fade) return 1;
  return (end - year) / (end - fade);
}

const STYLE_WEIGHTS: Record<FacialHairStyle, StyleWeight> = {
  /**
   * The default across most of history, and closer to obligatory where a beard
   * carried religious weight.
   */
  full_beard: (ctx) => {
    let w = 3;
    // Republican and early imperial Rome shaved; the fashion turned with Hadrian.
    if (inZone(ctx, 'EUROPEAN') && ctx.year > -300 && ctx.year < 120) w *= 0.3;
    // The long clean-shaven eighteenth century, then the Victorian beard boom.
    if (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL') && ctx.year > 1690 && ctx.year < 1840) w *= 0.2;
    if (ctx.year > 1840 && ctx.year < 1910) w *= 2;
    if (ctx.year > 1910 && ctx.year < 1965) w *= 0.3;
    if (inZone(ctx, 'MENA', 'SOUTH_ASIAN')) w *= 2.5;
    // Egyptian priests shaved the whole body; the pharaonic beard was a prop.
    if (place(ctx, 'egypt', 'nile') && ctx.year < 400) w *= 0.4;
    return w;
  },

  /** Ubiquitous, unremarkable, and mostly a fact about not having shaved. */
  stubble: () => 2,

  /**
   * The moustache alone is a soldier's and a horseman's style, and the standing
   * fashion of nineteenth-century Europe.
   */
  mustache: (ctx) => {
    let w = 1.5;
    if (place(ctx, 'steppe', 'mongol', 'kazakh', 'scythian', 'hungar', 'cossack')) w *= 3;
    if (inZone(ctx, 'EAST_ASIAN') && ctx.year > 1000) w *= 2;
    if (ctx.year > 1800 && ctx.year < 1930) w *= 3;
    if (inZone(ctx, 'EUROPEAN') && ctx.year > -300 && ctx.year < 120) w *= 0.4;
    return w;
  },

  /** A scholar's and a courtier's beard rather than a full one. */
  goatee: (ctx) => {
    let w = 0.4;
    if (inZone(ctx, 'EUROPEAN') && ctx.year > 1500 && ctx.year < 1700) w *= 4;
    if (inZone(ctx, 'EAST_ASIAN') && ctx.year > -200) w *= 3;
    if (ctx.year > 1950) w *= 2;
    return w;
  },

  /**
   * Named for a painter who died in 1641. It has no meaning outside the century
   * either side of him.
   */
  van_dyke: (ctx) => (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL')
    ? window(ctx.year, 1570, 1600, 1680, 1730) * 2.5
    : 0),

  /** Squarely Victorian, and briefly transatlantic. */
  mutton_chops: (ctx) => (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL')
    ? window(ctx.year, 1810, 1830, 1885, 1910) * 3
    : 0),

  /**
   * Two separate lives: the small "royale" tuft of the seventeenth century, and
   * the jazz-club soul patch of the twentieth.
   */
  soul_patch: (ctx) => {
    const royale = inZone(ctx, 'EUROPEAN') ? window(ctx.year, 1620, 1640, 1680, 1710) * 0.8 : 0;
    const modern = ctx.year > 1945 ? 1.5 : 0;
    return royale + modern;
  },
};

/**
 * How often men went clean-shaven. Barbering was a real trade and shaving was
 * an ordinary expense, so this moves with fashion and with the razor.
 */
export function cleanShavenChance(ctx: FacialHairContext): number {
  let chance = 0.25;
  if (inZone(ctx, 'EUROPEAN') && ctx.year > -300 && ctx.year < 120) chance = 0.75; // Rome
  if (place(ctx, 'egypt', 'nile') && ctx.year < 400) chance = 0.7;
  if (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL') && ctx.year > 1690 && ctx.year < 1840) chance = 0.7;
  if (ctx.year > 1840 && ctx.year < 1910) chance = 0.2;
  if (ctx.year > 1920) chance = 0.7;
  if (inZone(ctx, 'MENA', 'SOUTH_ASIAN')) chance *= 0.4;
  if (inZone(ctx, 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN')) chance = 0.65; // sparse growth, plucked
  if (inZone(ctx, 'EAST_ASIAN') && ctx.year < 1000) chance = 0.55;
  return Math.max(0.05, Math.min(0.9, chance));
}

/** Weighted style pick for this time and place. */
export function pickFacialHairStyle(
  ctx: FacialHairContext,
  random: () => number,
): FacialHairStyle {
  const entries = (Object.keys(STYLE_WEIGHTS) as FacialHairStyle[])
    .map(style => ({ style, weight: STYLE_WEIGHTS[style](ctx) }))
    .filter(entry => entry.weight > 0);

  if (entries.length === 0) return 'stubble';

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.style;
  }
  return entries[entries.length - 1].style;
}
