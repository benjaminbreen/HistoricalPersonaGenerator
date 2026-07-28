/**
 * constants/gameData/zonePalette.ts
 *
 * One accent colour per cultural zone, for the location pills in the card
 * header.
 *
 * Before this, every persona drew the same green region pill and the same tan
 * area pill, so a Levantine card and a West African card were identical above
 * the fold apart from their text. The colour now varies with the zone, which
 * makes two cards side by side legible as two different places.
 *
 * The colours are earth pigments — ochre, terracotta, madder, sage, indigo —
 * rather than an evenly spaced hue wheel, so a card still reads as a page from
 * the same atlas rather than a dashboard legend. Deliberately no skin-adjacent
 * hues: this is a map convention, not a description of people.
 *
 * Ten categories is past the point where every pair is separable at a glance,
 * and that is fine — the pill carries its own text label, so colour only has to
 * group and differentiate, not encode. Where two zones sit close in hue they
 * are geographically adjacent on purpose: East Asian / Oceania / Southeast
 * Asian share a blue-teal family, and MENA / Sub-Saharan / South Asian share
 * the warm arid one.
 *
 * Every value clears 4.5:1 against white text (WCAG AA for normal-size text).
 * The old pills did not — the tan area pill sat at 2.67:1.
 */

/** Zone keys as declared by `CulturalZone` in types/characterData.ts. */
export const ZONE_ACCENTS: Record<string, string> = {
  EUROPEAN: '#4a6b5d',                      // sage — continuous with the old pill green
  MENA: '#8a6a2a',                          // ochre
  SUB_SAHARAN_AFRICAN: '#9c4f32',           // terracotta
  SOUTH_ASIAN: '#9b3f3f',                   // madder
  SOUTHEAST_ASIAN: '#1f6b63',               // deep teal
  EAST_ASIAN: '#3f5f72',                    // slate blue
  OCEANIA: '#2b5a8a',                       // deep sea blue
  NORTH_AMERICAN_PRE_COLUMBIAN: '#566b34',  // woodland olive
  NORTH_AMERICAN_COLONIAL: '#5b5f7a',       // slate violet
  SOUTH_AMERICAN: '#7d4468',                // cochineal plum
};

/** Used when the zone is missing or unrecognised. Matches the previous pill. */
export const ZONE_ACCENT_FALLBACK = '#4a6b5d';

/**
 * The generator writes the zone with spaces rather than underscores
 * (`personaGenerator.ts` does `culturalZone.replace(/_/g, ' ')` on the way
 * out), and older personas and hand-written fixtures use either form. Normalise
 * both before looking up.
 */
export function zoneAccent(zone: string | undefined | null): string {
  if (!zone) return ZONE_ACCENT_FALLBACK;
  const key = zone.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return ZONE_ACCENTS[key] ?? ZONE_ACCENT_FALLBACK;
}
