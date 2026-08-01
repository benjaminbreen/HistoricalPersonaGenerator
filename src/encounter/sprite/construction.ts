/**
 * encounter/sprite/construction.ts
 *
 * What shape the clothes actually are.
 *
 * `PortraitSpec.garment.kind` has eight values — robe, gown, tunic, jacket,
 * doublet, work_shirt, wrapped_garment, bare — and the renderer was drawing
 * essentially one silhouette across all of them. But the generator's *names*
 * carry far more than the kind does. A sample of 900 personas turns up dhoti,
 * choli, sari, lungi, kilt, loincloth, kalasiris, schenti, breechclout,
 * churidar, odhani, kirtle, thobe, kurta, changshan, braies, jerkin, apron and
 * a dozen more. Those are not colours of the same garment; they are different
 * *garments*, and drawing a choli — a cropped fitted blouse worn above a bare
 * midriff — as a full-length robe is not a shading problem.
 *
 * So construction is read from the name, and the name is already there. The
 * `kind` is only the fallback for when the name says nothing useful.
 *
 * The vocabulary is deliberately about **silhouette**, not culture: what
 * covers the torso, what covers the legs, where the hems fall, whether the
 * midriff or chest is bare. A lungi and a kilt are the same construction to a
 * renderer even though nobody would confuse them anywhere else, and keeping
 * that distinction out of here is what stops this file turning into an
 * ethnography with a bug budget.
 */

import { PortraitSpec } from '../../components/portraitLab/spec/types';

export type Construction =
  /** Long straight fall from the shoulders: robe, thobe, kurta, kalasiris. */
  | 'robe'
  /** Fitted bodice into a flared skirt: dress, gown, kirtle. */
  | 'gown'
  /** Hip-to-knee, belted, over separate legs or bare: tunic, shirt, smock. */
  | 'tunic'
  /** Open down the front, hip length: jacket, jerkin, doublet, coat. */
  | 'jacket'
  /** Cropped blouse above a bare midriff, with a skirt below: choli. */
  | 'crop_top'
  /** Wrapped lower body, bare chest: dhoti, lungi, kilt, loincloth, schenti. */
  | 'wrapped_lower'
  /** A skirt with a separate upper garment. */
  | 'skirted'
  /** Legs covered as two separate tubes: trousers, churidar, braies. */
  | 'trousered'
  /** Nothing but what decency needs. */
  | 'bare';

/** A second layer worn over whatever the construction is. */
export type OverLayer = 'none' | 'drape' | 'apron' | 'cloak';

export interface GarmentShape {
  construction: Construction;
  over: OverLayer;
  /** Chest bare above the wrap or blouse. */
  bareChest: boolean;
  /** Midriff bare between a cropped top and the skirt below. */
  bareMidriff: boolean;
}

const RE = {
  wrappedLower: /dhoti|lungi|kilt|loincloth|breechclout|schenti|langot|veshti|sarong|malo|perizoma/,
  cropTop: /choli|bandeau|kanchuka/,
  skirted: /\bskirt|petticoat|wrapper|lehenga|sari\b|saree/,
  trousered: /trouser|churidar|braies|pantaloon|hose\b|breeches|salwar|shalwar|pyjama|pajama/,
  gown: /gown|dress|kirtle|cotehardie|frock|stola|chemise/,
  jacket: /jacket|jerkin|doublet|coat|vest|waistcoat|angarkha|caftan jacket/,
  robe: /robe|thobe|kurta|changshan|kalasiris|kaftan|caftan|kimono|hanbok|abaya|djellaba|tunica talaris/,
  tunic: /tunic|shirt|smock|blouse|t-shirt|kameez|chiton|exomis/,
  drape: /sari\b|saree|odhani|dupatta|shawl|pallu|stole|himation|toga|wrap\b/,
  apron: /apron|pinafore/,
  cloak: /cloak|mantle|cape|chlamys|paenula/,
};

/**
 * Read the construction off the item, falling back to the coarse kind.
 *
 * Order matters: the specific constructions are tested before the general
 * ones, because "cotton bronze simple choli" contains neither "robe" nor
 * "dress" but a name like "sari skirt" contains both a drape and a skirt and
 * should resolve to the skirt with the drape over it.
 */
export function readShape(spec: PortraitSpec, accessoryName = ''): GarmentShape {
  const kind = spec.garment.kind;
  if (kind === 'bare') {
    return { construction: 'bare', over: 'none', bareChest: true, bareMidriff: true };
  }
  const n = `${spec.garment.name}`.toLowerCase();

  // A shawl, cloak or wrap is usually an *accessory*, not the garment — the
  // generator puts "Rough Wool Wool Shawl" in the accessory slot and names the
  // garment separately. Reading the over-layer from the garment name alone
  // meant every shawl in the app was silently dropped.
  const a = accessoryName.toLowerCase();
  const over: OverLayer =
    RE.apron.test(n) || RE.apron.test(a) ? 'apron'
    : RE.cloak.test(n) || RE.cloak.test(a) ? 'cloak'
    : RE.drape.test(n) || RE.drape.test(a) ? 'drape'
    : 'none';

  let construction: Construction;
  if (RE.cropTop.test(n)) construction = 'crop_top';
  else if (RE.wrappedLower.test(n)) construction = 'wrapped_lower';
  else if (RE.trousered.test(n)) construction = 'trousered';
  else if (RE.skirted.test(n)) construction = 'skirted';
  else if (RE.gown.test(n)) construction = 'gown';
  else if (RE.jacket.test(n)) construction = 'jacket';
  else if (RE.robe.test(n)) construction = 'robe';
  else if (RE.tunic.test(n)) construction = 'tunic';
  else {
    // The name said nothing; fall back to what the kind can carry.
    construction =
      kind === 'robe' ? 'robe'
      : kind === 'gown' ? 'gown'
      : kind === 'jacket' || kind === 'doublet' ? 'jacket'
      : kind === 'wrapped_garment' ? 'robe'
      : 'tunic';
  }

  return {
    construction,
    over,
    // A wrapped lower garment leaves the chest bare unless something is worn
    // over it; a crop top leaves the midriff bare by definition.
    bareChest: construction === 'wrapped_lower' && over === 'none',
    bareMidriff: construction === 'crop_top',
  };
}

/** Where each construction's main hem falls, 0 at the hip … 1 at the ankle. */
export function hemFraction(c: Construction, spec: PortraitSpec): number {
  switch (c) {
    case 'robe':
    case 'gown':
    case 'skirted':
      return 0.97;
    case 'crop_top':
      return 0.92;          // the skirt below it, not the blouse
    case 'wrapped_lower':
      // Knee-length by default; the long-wrapped names reach the ankle.
      return /lungi|sarong|veshti|dhoti/.test(spec.garment.name.toLowerCase()) ? 0.9 : 0.42;
    case 'jacket':
      return 0.24;
    case 'trousered':
      return 0.3;
    case 'tunic':
    default:
      return 0.36;
  }
}
