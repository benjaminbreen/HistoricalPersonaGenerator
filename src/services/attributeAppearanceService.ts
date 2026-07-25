/**
 * services/attributeAppearanceService.ts
 *
 * Makes the portrait agree with the persona.
 *
 * The renderer reads `appearance`; it never saw `attributes`. So a persona
 * carrying Pox-Scarred, Disfigured or Blind was drawn with clear skin and two
 * good eyes, and "Brigantina the One-Eyed" had both of hers. This maps the
 * attributes that are visible in a bust portrait onto the appearance fields and
 * marking types the renderer already understands.
 *
 * Attributes that cannot show in a head-and-shoulders portrait — Lame,
 * Clubfoot, Bowed Legs — are deliberately left alone rather than faked.
 */

import type { AttributeBadge } from '../types/attributeTypes';

export interface AppearanceMarking {
  type: 'scar' | 'tattoo' | 'paint' | 'beauty_mark' | 'freckles' | 'mole' | 'birthmark';
  location: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  pattern?: string;
}

/** Attributes that put a mark on the face. */
const FACE_MARKS: Record<string, AppearanceMarking> = {
  scarred: { type: 'scar', location: 'face', color: '#b08878', size: 'medium' },
  burn_scarred: { type: 'scar', location: 'face', color: '#c09080', size: 'medium' },
  disfigured: { type: 'scar', location: 'face', color: '#b07868', size: 'large' },
  pox_scarred: { type: 'freckles', location: 'face', color: '#b58a7a', size: 'small', pattern: 'pitting' },
  vitiligo: { type: 'birthmark', location: 'face', color: '#f0e2d4', size: 'medium', pattern: 'patches' },
  birthmark_omen: { type: 'birthmark', location: 'face', color: '#9c5a4a', size: 'medium' },
  cleft_lip: { type: 'scar', location: 'face', color: '#b8867a', size: 'small', pattern: 'lip' },
  // A ruined eye. The renderer reads the pattern and draws over the eye itself.
  blind: { type: 'scar', location: 'face', color: '#b07868', size: 'large', pattern: 'eye_loss' },
  trachoma: { type: 'scar', location: 'face', color: '#bb8d80', size: 'small', pattern: 'eye_loss' },
};

/** Attributes that change the body rather than mark it. */
const BUILD_OVERRIDES: Record<string, string> = {
  gaunt: 'slight',
  frail: 'slight',
  corpulent: 'imposing',
  strong: 'imposing',
  athletic: 'athletic',
};

export interface AppearanceAdjustments {
  markings: AppearanceMarking[];
  build?: string;
  hairColor?: string;
}

/**
 * What a persona's attributes — and an earned byname — should change about the
 * portrait.
 */
export function appearanceFromAttributes(
  attributes: AttributeBadge[] | undefined,
  name?: string,
): AppearanceAdjustments {
  const result: AppearanceAdjustments = { markings: [] };
  const ids = new Set((attributes ?? []).map(attr => attr.id));

  // A byname is a public claim about the face, so it counts as evidence too:
  // someone called "the One-Eyed" is missing an eye whatever else is true.
  if (name && / the One-Eyed$/.test(name)) ids.add('blind');
  if (name && / the Scarred$/.test(name)) ids.add('scarred');

  for (const id of ids) {
    const mark = FACE_MARKS[id];
    if (mark) result.markings.push(mark);
  }

  for (const id of ids) {
    if (BUILD_OVERRIDES[id]) { result.build = BUILD_OVERRIDES[id]; break; }
  }

  if (ids.has('prematurely_gray')) result.hairColor = 'grey';
  if (ids.has('red_haired')) result.hairColor = 'auburn';
  if (ids.has('albino')) result.hairColor = 'white';

  return result;
}

/**
 * Merge the adjustments into an appearance object in place-safe fashion.
 * Cultural markings are kept; attribute markings are added alongside them.
 */
export function applyAttributeAppearance(
  appearance: any,
  attributes: AttributeBadge[] | undefined,
  name?: string,
): any {
  if (!appearance) return appearance;
  const adjustments = appearanceFromAttributes(attributes, name);
  if (adjustments.markings.length === 0 && !adjustments.build && !adjustments.hairColor) {
    return appearance;
  }

  const existing = Array.isArray(appearance.markings) ? appearance.markings : [];
  return {
    ...appearance,
    markings: [...existing, ...adjustments.markings],
    ...(adjustments.build ? { build: adjustments.build } : {}),
    ...(adjustments.hairColor ? { hairColor: adjustments.hairColor } : {}),
  };
}
