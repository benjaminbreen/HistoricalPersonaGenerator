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
import { LegwearForm } from '../../components/portraitLab/spec/garmentLayers';
import { unit } from '../../components/portraitLab/core/rng';

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
  /**
   * One length of cloth or hide wound round the body and knotted at a shoulder.
   *
   * The commonest garment in the app's deep-time range and the one it had no
   * word for: hide wraps, bark cloth, tapa, pelts, plant-fibre wraps, kaross.
   * All of them fell through to `robe` — the floor-length tailored fall of a
   * thobe or a kimono — which is the least like them of the nine. A wrap is
   * *cut from nothing*: it stops at the calf because that is the length of the
   * skin, it has no sleeves because it has no armscye, and its top edge runs
   * diagonally from one armpit to the opposite shoulder because a single cloth
   * has to be knotted somewhere. Those three facts are the whole silhouette and
   * none of them survive being drawn as a robe.
   */
  | 'wrapped_cloth'
  /** A skirt with a separate upper garment. */
  | 'skirted'
  /** Legs covered as two separate tubes: trousers, churidar, braies. */
  | 'trousered'
  /**
   * A top worn over a separate leg garment, so the hem falls where the
   * garment's own cut says rather than wherever the legs stop needing cover.
   * A t-shirt ends at the hip; a kurta or a dashiki ends near the knee. It is
   * the commonest silhouette of the last two centuries and the renderer had no
   * entry for it — every twentieth-century figure was drawn in a smock.
   */
  | 'shirt'
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
  /**
   * What covers the legs, when that is a garment in its own right.
   *
   * Null is the historical default and stays the default: for most of the range
   * this app covers, the named garment is the whole outfit and what is under it
   * is neither named nor visible. From the nineteenth century on the generator
   * dresses people in two pieces, and then this is what the lower half is —
   * which also shortens the upper one, because a shirt worn over trousers ends
   * at the hip and the same shirt worn over nothing has to reach the knee.
   */
  legs: LegwearForm | null;
  /**
   * Whether the lower half is a *second cloth* rather than more of the first.
   *
   * True whenever a skirt, a wrap or a pair of trousers is its own garment, so
   * the two halves take different ramps and the waist between them reads as a
   * join. A robe, a sari and a dress are one length of cloth and stay one.
   */
  twoTone: boolean;
  /**
   * Which half the *named* garment is, when there are two.
   *
   * The named garment always takes the primary colour — that is what the card
   * beside the picture is describing — so this decides which way round the two
   * ramps go. A blouse worn with a skirt puts the primary on the chest; a sari
   * or a pair of jeans arriving as the torso garment puts it on the legs and
   * paints an unnamed top above in the second colour.
   */
  lowerNamed: boolean;
  /**
   * Which shoulder a single wrapped cloth leaves uncovered: -1, 0 or 1.
   *
   * Zero for everything tailored, because a garment cut with two armscyes
   * covers both shoulders whatever else it does. Only the wrapped forms have a
   * choice about it, and the choice is the loudest thing about their outline.
   */
  bareShoulder: -1 | 0 | 1;
}

const RE = {
  // `breechcloth` and `breechclout` are the same object spelled two ways and
  // only one of them was here, which is how a persona in a breechcloth came out
  // in a smock.
  wrappedLower: /dhoti|lungi|kilt|loincloth|breechclout|breechcloth|schenti|langot|veshti|sarong|malo\b|maro\b|perizoma/,
  cropTop: /choli|bandeau|kanchuka|breast band|breast.?cloth/,
  skirted: /\bskirt|petticoat|wrapper|lehenga|sari\b|saree/,
  /**
   * A single cloth or skin wound round the body — tested before the tailored
   * constructions, because the words it matches are exactly the ones that
   * previously fell past every rule here into the `robe` fallback.
   *
   * `\bwrap\b` at the end is the catch-all and has to stay last inside this
   * pattern: "Wrap Dress" and "Wrap Skirt" are tailored garments that happen to
   * fasten by wrapping, and they are claimed by `gown` and `skirted` before
   * this ever runs.
   */
  wrappedCloth: /bark ?cloth|bark-cloth|\btapa\b|kaross|pelt|animal hide|skin garment|leaf covering|plant.?fibre|plant.?fiber|hide wrap|skin wrap|fur wrap|wrap cloth|woven cloth|upper cloth|traditional cloth|minimal wrap|\bwrap\b/,
  // Leggings cover the legs and nothing else. Absent from this list they were
  // reaching the kind fallback and being drawn as floor-length robes.
  trousered: /trouser|churidar|braies|pantaloon|hose\b|breeches|legging|salwar|shalwar|pyjama|pajama/,
  gown: /gown|dress|kirtle|cotehardie|frock|stola|chemise/,
  jacket: /jacket|jerkin|doublet|coat|vest|waistcoat|angarkha|caftan jacket/,
  robe: /robe|thobe|kurta|changshan|kalasiris|kaftan|caftan|kimono|hanbok|abaya|djellaba|tunica talaris/,
  tunic: /tunic|shirt|smock|blouse|t-shirt|kameez|chiton|exomis/,
  /**
   * Cloth that goes *over* whatever is underneath: a sari's pallu, a shawl, a
   * himation.
   *
   * `wrap\b` used to be in here and was the single busiest pattern in the file
   * — it fired on "Hide Wrap", "Wrap Dress", "Wrap Skirt", "Wrap Cloth",
   * "Wrap Kilt", 105 of 130 drapes in a 600-persona sample — hanging a
   * sari-style sash diagonally across garments that have no such thing. A wrap
   * dress is a dress; the wrapping is how it fastens, not something worn on top
   * of it. The named drapes below are the ones that really are a second cloth.
   */
  drape: /sari\b|saree|odhani|dupatta|chunni|orna\b|pallu|shawl|stole|himation|toga|rebozo|manta\b|khanga|kanga\b/,
  apron: /apron|pinafore/,
  cloak: /cloak|mantle|cape|chlamys|paenula/,
  /** A name that really is describing an uncovered body rather than a garment. */
  nothing: /^\s*(bare|naked|nude|none|nothing|no clothing|unclothed)\b|^\s*$/,
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
  const legs: LegwearForm | null = spec.legwear?.form ?? null;
  const n = `${spec.garment.name}`.toLowerCase();

  // `kind` is the bust's verdict, and the bust is cropped at the collarbone: a
  // figure in a loincloth has bare shoulders, so `bare` is the right answer
  // *there*. Taking it at face value here — which is what an early return did —
  // threw the name away before this file's whole vocabulary could look at it,
  // and every persona wearing a loincloth or a breechcloth was drawn with no
  // clothing whatsoever from the neck down. `bare` has to mean the name
  // describes no garment, not that the garment stops above the frame.
  if (kind === 'bare' && RE.nothing.test(n)) {
    return {
      construction: 'bare', over: 'none', bareChest: true, bareMidriff: true,
      legs, twoTone: legs !== null, lowerNamed: false, bareShoulder: 0,
    };
  }

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
  // Last of the name tests, because "Wrap Dress", "Wrap Skirt" and "Hide Wrap
  // Kilt" all contain a wrap word and all of them are something more specific.
  // What is left over by this point genuinely is one cloth and nothing else.
  else if (RE.wrappedCloth.test(n)) construction = 'wrapped_cloth';
  else {
    // The name said nothing; fall back to what the kind can carry.
    construction =
      kind === 'robe' ? 'robe'
      : kind === 'gown' ? 'gown'
      : kind === 'jacket' || kind === 'doublet' ? 'jacket'
      // A `wrapped_garment` used to land on `robe`, which meant a hide skin, a
      // sheet of bark cloth and a tailored kaftan were the same silhouette —
      // and since this is the kind the whole pre-industrial half of the corpus
      // arrives under, a floor-length robe became the app's default figure.
      : kind === 'wrapped_garment' ? 'wrapped_cloth'
      // The bust saw bare shoulders and the name still described something, so
      // whatever it is, it is worn below them.
      : kind === 'bare' ? 'wrapped_lower'
      : 'tunic';
  }

  // A named leg garment settles what the torso garment is: whatever the name
  // suggested, a thing worn *above trousers* is a top. Without this a kurta
  // worn over churidar stayed `robe` and swept the floor, and a work shirt
  // worn over drill trousers stayed `tunic` and reached the calf — both of
  // them hiding the very garment that had just been named.
  // A skirt is not drawn on the legs, it is drawn *as* the lower half of the
  // trunk — one fall of cloth from the waist, which is what `skirted` already
  // builds. Routing a blouse-and-skirt through the shirt case instead would
  // have meant re-solving the flare, the drape and the hem scallop in the leg
  // code for no gain. A jacket takes this branch too: a jacket over a skirt is
  // still a skirted figure, and left as a `jacket` its coat hem stopped at the
  // thigh with the named skirt drawn nowhere at all.
  if (legs === 'skirt' || legs === 'wrapped') {
    if (construction !== 'crop_top' && construction !== 'wrapped_lower') {
      construction = 'skirted';
    }
  } else if (legs && (construction === 'robe' || construction === 'gown'
      || construction === 'tunic' || construction === 'trousered')) {
    construction = 'shirt';
  }

  // The garment on the card is trousers and nothing was found for the chest.
  // That is not a figure in a knee-length pair of trousers: it is a figure in
  // trousers and an unnamed shirt, and drawing it the other way round is what
  // put a persona whose card read "Charcoal Chinos" in a charcoal smock.
  const namedIsLower = !legs && construction === 'trousered';
  const lower: LegwearForm | null = legs ?? (namedIsLower ? 'trousers' : null);

  return {
    construction: namedIsLower ? 'shirt' : construction,
    over,
    // A wrapped lower garment leaves the chest bare unless something is worn
    // over it; a crop top leaves the midriff bare by definition.
    bareChest: construction === 'wrapped_lower' && over === 'none',
    bareMidriff: construction === 'crop_top',
    legs: lower,
    // Trousers and a skirt are visibly a second garment; a pair of hose under a
    // long tunic is not, and painting those in a contrasting colour would
    // invent a join the eye has no reason to see.
    twoTone: lower !== null && lower !== 'hose',
    lowerNamed: namedIsLower,
    // Which way the cloth is knotted, and whether it is knotted at all. Seeded
    // off the persona so a figure always wears it the same way, and on its own
    // stream so adding it does not shift anything else drawn from the seed.
    bareShoulder: construction === 'wrapped_cloth' && over === 'none'
      ? (unit(spec.seed, 'wrap-knot') < 0.28 ? 0
        : unit(spec.seed, 'wrap-side') < 0.5 ? -1 : 1)
      : 0,
  };
}

/**
 * Where each construction's main hem falls, 0 at the hip … 1 at the ankle.
 *
 * The tunable hems come back in here. `tunicHem`, `coatHem` and `robeLift`
 * were left stranded when constructions took over hem placement — their
 * sliders moved and nothing happened, which is worse than not having them.
 * Constructions decide the *kind* of hem; these decide where that kind sits.
 */
/**
 * Tops that reach the knee even with trousers under them.
 *
 * The kurta, the dashiki, the agbada, the achkan: all worn over separate
 * legwear, none of them a shirt. Lumping them in with a t-shirt puts a South
 * Asian clerk in a cropped kurta, which is a different garment; keeping them
 * floor-length hides the churidar that was named beside them.
 */
const LONG_TOP =
  /kurta|kurti|achkan|sherwani|dashiki|agbada|boubou|kaftan|caftan|thobe|kameez|changshan|tunic|smock|shirtwaist|banian/i;

export function hemFraction(
  c: Construction, spec: PortraitSpec, t: HemTuning, legs: LegwearForm | null = null
): number {
  // A floor-length garment stops `robeLift` px above the ankle, expressed as a
  // fraction so it survives the figure being any height.
  const floorLen = Math.max(0.6, 1 - t.robeLift / 40);
  switch (c) {
    case 'shirt':
      // Just below the hip, where a shirt ends, tucked or not. The long forms
      // keep a knee-length fall — far enough down to read as a kurta and far
      // enough up that the trousers under it are still the lower half.
      return LONG_TOP.test(spec.garment.name) ? 0.40 : 0.08;
    case 'skirted':
      // A skirt worn as its own named garment stops on the shin. A robe, a
      // sari and a lehenga go to the floor, and so did this until the modern
      // wardrobe started producing blouse-and-skirt outfits — which came out as
      // full-length gowns, the same failure the smocks were.
      if (legs === 'skirt') return floorLen - 0.16;
      return floorLen;
    case 'robe':
    case 'gown':
      return floorLen;
    case 'crop_top':
      return floorLen - 0.05;   // the skirt below it, not the blouse
    case 'wrapped_cloth': {
      // Mid-calf, and the length is a fact about the material rather than a
      // choice: a wrap is as long as the skin or the bolt it was cut from, and
      // the ones that are wider than they are long stop above the knee. The
      // named full-length forms — a kaross, a blanket wrap — keep their fall.
      const wn = spec.garment.name.toLowerCase();
      if (/kaross|blanket|full|long|robe/.test(wn)) return floorLen - 0.05;
      return /minimal|short|brief|scant/.test(wn) ? 0.42 : floorLen - 0.22;
    }
    case 'wrapped_lower':
      // The long-wrapped names reach the ankle; a loincloth, a kilt and a
      // schenti sit between the mid-thigh and the knee.
      //
      // This used to read `t.tunicHem + 0.08` for the short case and describe
      // itself as knee-length, which it was when `tunicHem` was small. It is
      // 0.76 now, so the "short" branch was landing at 0.84 of the way to the
      // ankle — *longer* than the dhoti it exists to be shorter than, and the
      // reason every loincloth in the app was drawn as a long skirt. A hem this
      // specific has no business being derived from a tunic's.
      return /lungi|sarong|veshti|dhoti/.test(spec.garment.name.toLowerCase())
        ? floorLen - 0.07
        : 0.34;
    case 'jacket':
      return t.coatHem;
    case 'trousered':
      return t.coatHem + 0.06;
    case 'tunic':
    default:
      return t.tunicHem;
  }
}

/** The hem-placement slice of the tuning, so this file need not import it all. */
export interface HemTuning {
  tunicHem: number;
  coatHem: number;
  robeLift: number;
}
