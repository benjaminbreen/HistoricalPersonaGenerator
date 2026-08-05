/**
 * portraitLab/spec/garmentLayers.ts
 *
 * Which half of the body a garment's name is about.
 *
 * Every garment vocabulary in this project has assumed one named item covers
 * the whole figure, which is true of a robe, a sari, a kalasiris and a tunic —
 * and false of most clothing worn after about 1800. The clothing tables know
 * this perfectly well: the modern European poor male entry is
 * `[T-shirt, Jeans]`, which is one outfit written as two items, and the
 * generator picked one of the two at random. Half those personas were
 * described as wearing a t-shirt and nothing else; the other half, jeans and
 * nothing else. Both renderers then drew whichever it was from shoulder to
 * shin, so "Charcoal Chinos" came out as a charcoal smock reaching the calf.
 *
 * So the vocabulary gains an axis, and this is it. It lives in `spec/` beside
 * `headwearForm.ts` for the same reason that file does: a verdict about what an
 * item *is* has to be reachable by the generator, the bust and the sprite
 * alike, and while it sat privately inside one of them the three disagreed.
 *
 * Pure string functions — no app types, no renderer types. Anything may import
 * this.
 */

/** Which part of the body a named garment covers. */
export type GarmentLayer =
  /** Ends around the hip. Something else has to cover the legs. */
  | 'top'
  /** Covers the legs, and only the legs. */
  | 'bottom'
  /** One garment for the whole figure: a robe, a dress, a suit, a sari. */
  | 'whole';

/**
 * Names that are whole outfits even though they contain a leg-garment word.
 *
 * Tested before anything else, because a "Skirt Suit" is not a skirt, "Bib
 * Overalls" are not a bib, and a "Salwar Kameez" is not a pair of salwar. A
 * suit in particular is `whole` by definition — jacket *and* trousers is
 * exactly what the word means, and what distinguishes it from a blazer.
 */
const ATOMIC_WHOLE =
  /suit\b|coverall|boiler ?suit|jumpsuit|romper|overall|dungaree|kameez|sheath|kaba and slit/i;

/**
 * Garments that cover the legs and stop there.
 *
 * The wrapped forms — dhoti, lungi, kilt, sarong — are here beside the tailored
 * ones because the question this answers is "do the legs need something else",
 * not "how is it constructed". What goes *above* one of them is a separate
 * question, and `leavesChestBare` answers it.
 */
const BOTTOM = new RegExp([
  'trouser', 'pants?\\b', 'pantaloon', 'jean', 'chino', 'slack', 'legging',
  'jodhpur', 'breech', 'braies', '\\bshorts\\b', 'bermudas?\\b', 'churidar',
  'salwar\\b', 'shalwar\\b', 'pyjama', 'pajama', 'hose\\b', 'tights',
  'skirt', 'petticoat', 'lehenga', 'sarong', 'sampot', 'kilt', 'dhoti',
  'veshti', 'lungi', 'loincloth', 'breechcloth', 'breechclout', 'schenti',
  'langot', 'malo\\b', 'perizoma', 'wrapper',
].join('|'), 'i');

/**
 * Garments that dress the whole figure on their own.
 *
 * The outerwear at the end of the list is here rather than under `top` because
 * a hide cloak or a feather cape *is* the whole of what a persona is wearing.
 * Filing one as a top is how a Tehuelche herder ends up in slacks.
 */
const WHOLE = new RegExp([
  'dress\\b', 'gown', 'robe', 'kaftan', 'caftan', 'abaya', 'thobe', 'dishdasha',
  // The Egyptian and Levantine forms of the same garment as the thobe. Absent,
  // they classified as tops, and the generator put a pair of trousers under a
  // galabeya.
  'galabeya', 'gallabiy', 'jellabiy', 'galabiy', 'kandura', 'bisht', 'chador', 'jubba',
  'djellaba', 'agbada', 'boubou', 'kimono', 'hanbok', 'hanfu', 'sari\\b', 'saree',
  'qipao', 'cheongsam', 'changshan', 'kalasiris', 'toga', 'himation', 'chiton',
  'peplos', 'stola', 'palla\\b', 'cassock', 'habit\\b', 'sherwani', 'achkan',
  'jama\\b', 'houppelande', 'cotehardie', 'kirtle', 'smock frock',
  'senator wear', 'haute couture', 'aso ebi', 'resort wear', 'evening wear',
  'cloak', 'cape\\b', 'mantle', 'stole\\b', 'shawl', 'poncho', 'ruana',
  'wrap\\b', 'tapa', 'barkcloth', 'bark ?cloth', 'leopard skin', 'skin garment',
].join('|'), 'i');

/**
 * Lower garments customarily worn with nothing on the chest, or with a loose
 * cloth over one shoulder. A dhoti is not a pair of trousers waiting for a
 * shirt, and the sprite already draws that figure well.
 */
const BARE_ABOVE =
  /dhoti|veshti|lungi|loincloth|breechcloth|breechclout|schenti|langot|malo\b|perizoma|kilt|grass skirt/i;

export function garmentLayerFor(name: string): GarmentLayer {
  if (ATOMIC_WHOLE.test(name)) return 'whole';
  if (BOTTOM.test(name)) return 'bottom';
  if (WHOLE.test(name)) return 'whole';
  return 'top';
}

export function leavesChestBare(name: string): boolean {
  return BARE_ABOVE.test(name);
}

/**
 * Compound names, which the work-dress tables are full of.
 *
 * `workDress.ts` writes outfits the way a costume historian would — "Frock Coat
 * and Trousers", "Cotton Blouse and Wrap Skirt", "Western Coat over Dhoti" — so
 * a good share of the industrial and modern corpus already names both halves
 * and had only ever been read as one string. Splitting on the conjunction costs
 * nothing and means those personas need nothing invented for them at all.
 */
function splitCompound(name: string): string[] {
  // "Kaba and Slit" is the name of one garment, not two joined by a conjunction.
  if (/kaba and slit/i.test(name)) return [name];
  const parts = name.split(/\s+(?:and|&|over)\s+/i).map(p => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [name];
}

/** Words that turn up after a conjunction and are not a garment half. */
const NOT_A_HALF =
  /^(tie|cravat|stock|caps?\b|hats?\b|bonnet|apron|belt|collar|high collar|sash|scarf|veil|blouse piece|sleeve garters)/i;

/**
 * What a garment name says is on each half of the body.
 *
 * `top` and `bottom` are null where the name does not supply one. `whole` means
 * a single garment dresses the figure and nothing else is wanted — but a name
 * that supplies *both* a whole-body garment and a leg one ("Achkan and
 * Churidar") is a complete outfit rather than a whole, so the achkan becomes
 * the top and `whole` stays false.
 */
export interface GarmentPair {
  top: string | null;
  bottom: string | null;
  whole: boolean;
}

export function readGarmentPair(name: string): GarmentPair {
  const parts = splitCompound(name);
  const pair: GarmentPair = { top: null, bottom: null, whole: false };
  let wholePart: string | null = null;

  for (const part of parts) {
    if (parts.length > 1 && NOT_A_HALF.test(part)) continue;
    switch (garmentLayerFor(part)) {
      case 'whole': if (!wholePart) wholePart = part; break;
      case 'bottom': if (!pair.bottom) pair.bottom = part; break;
      default: if (!pair.top) pair.top = part; break;
    }
  }

  if (wholePart) {
    // A whole garment named alongside a leg one is the upper half of a two-part
    // outfit — an achkan over churidar, a coat over a dhoti — so it is drawn as
    // the top and the legs keep what they were given.
    if (pair.bottom) pair.top = wholePart;
    else pair.whole = true;
  }
  if (!pair.whole && !pair.top && !pair.bottom) pair.top = name;
  return pair;
}

/**
 * How the legs are covered, in the terms a renderer can draw.
 *
 * Five entries, chosen the way every other vocabulary here was: each has to be
 * distinguishable from the rest in silhouette on a 352px figure. Jeans and
 * flannel trousers are the same shape and are told apart by their cloth, so
 * they share `trousers`; hose is a different shape, because it follows the leg
 * instead of hanging off the hip.
 */
export type LegwearForm =
  /** Two tubes hanging from the hip, breaking over the shoe. */
  | 'trousers'
  /** The same, cut off at or above the knee. */
  | 'shorts'
  /** Cut close to the leg: hose, tights, leggings, churidar. */
  | 'hose'
  /** One fall from the waist, with no division between the legs. */
  | 'skirt'
  /** Cloth wound round the lower body: dhoti, lungi, sarong. */
  | 'wrapped';

export function legwearFormFor(name: string): LegwearForm {
  if (/\bshorts\b|bermuda|board short/i.test(name)) return 'shorts';
  if (/hose\b|tights|legging|churidar|stocking/i.test(name)) return 'hose';
  if (/skirt|petticoat|lehenga|kilt|sampot/i.test(name)) return 'skirt';
  if (/dhoti|veshti|lungi|sarong|loincloth|breechcloth|breechclout|schenti|wrap/i.test(name)) return 'wrapped';
  return 'trousers';
}

/**
 * Garments that are a top and a bottom cut from the same cloth.
 *
 * A suit is `whole` to the layer classifier, and rightly so — nothing else is
 * wanted for the legs, and the generator must not go looking for a pair of
 * trousers to pair with one. But `whole` was then read by the renderers as
 * "one garment, therefore one silhouette", and they drew a knee-length coat
 * with bare shins under it: the trousers are part of the suit and nobody had
 * told the sprite they existed. Same for overalls and a boiler suit.
 *
 * So this is the third answer between "the legs have their own named garment"
 * and "the legs have nothing": the legs are covered, in the cloth already named.
 */
const MATCHED_LEGS = /suit\b|coverall|boiler ?suit|jumpsuit|overall|dungaree|tracksuit|romper/i;

/**
 * Formal dress named for the occasion rather than the cut, which is the one
 * place the answer genuinely depends on who is wearing it.
 *
 * "Evening Wear" is a dinner suit on a man and a floor-length gown on a woman,
 * and the tables write the one name for both. Read as a `whole` garment with no
 * legs it produced the second of those for everybody: a twentieth-century film
 * director came out in a scarlet dress to the shin, on a card whose own text
 * said evening wear.
 */
const OCCASION_FORMAL =
  /evening wear|formal wear|dinner dress|black tie|white tie|full dress|dress clothes/i;

export function impliesMatchingLegs(name: string, gender?: string): boolean {
  // A swimsuit, a bathing suit and a suit of armour are not two-piece.
  if (/swim|bathing|armou?r|space ?suit|diving/i.test(name)) return false;
  if (MATCHED_LEGS.test(name)) return true;
  return gender === 'Male' && OCCASION_FORMAL.test(name);
}

/** Whether this name is formal dress that only says what the evening was. */
export function isOccasionFormal(name: string): boolean {
  return OCCASION_FORMAL.test(name);
}

/**
 * The eras whose ordinary dress puts a separate named garment on the legs.
 *
 * Gating on era rather than on wealth or zone is deliberate. It is not that
 * pre-industrial people had nothing on their legs — braies and hose go back a
 * long way — but that in those centuries the leg covering is usually hidden
 * under the garment above it, unnamed in the tables, and invisible at this
 * crop. From the nineteenth century on it is the loudest thing about the
 * silhouette, and a figure drawn without it reads as wearing a nightshirt.
 *
 * Where a zone's modern dress is genuinely one piece — a sari, a dhoti, an
 * agbada — the layer classifier says so and no pairing happens. This is a gate
 * on the era only, never a claim about the culture.
 */
export const TWO_PIECE_ERAS = new Set(['INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA']);
