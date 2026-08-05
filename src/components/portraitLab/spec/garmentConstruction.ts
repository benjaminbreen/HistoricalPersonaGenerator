/**
 * portraitLab/spec/garmentConstruction.ts
 *
 * What a named garment shows, and what a place and period shows on top of it.
 *
 * Both verdicts used to be made inside `art/`, which meant only the bust could
 * reach them. The sprite draws the same person from the knees up, reading the
 * same PortraitSpec, and it saw none of this: a suit had lapels in the portrait
 * and a plain buttoned front in the figure beside it, a Roman tunic had clavi
 * above the neck and nothing below it. Two pictures of one persona on one card,
 * disagreeing about what she is wearing.
 *
 * So the decision moves here and the drawing stays where it was. This file is
 * the same kind of thing as `garmentLayers.ts` and sits beside it for the same
 * reason: pure string functions, no app types and no renderer types, so the
 * generator, the bust and the sprite can all ask and all get the same answer.
 * Each renderer then draws its own version at its own scale — which is not
 * duplication, because a lapel at bust crop and a lapel at 96px full figure are
 * genuinely different drawings of one fact.
 */

import { isOccasionFormal, leavesChestBare } from './garmentLayers';

/**
 * The recognisable thing about a named garment.
 *
 * The kind classifier sorts 393 distinct torso names into eight silhouettes,
 * which is the right thing for a silhouette to do and hopeless as a
 * description: a pair of denim overalls, a Savile Row three-piece and an aloha
 * shirt all come out `work_shirt`. This is the second axis, keyed on the item's
 * own name — the one thing that would let you name the garment across a room.
 */
export type GarmentFeatureKey =
  | 'bib' | 'apron' | 'pallu' | 'toga' | 'broad_collar' | 'ruff'
  | 'shawl_lapel' | 'lapels' | 'mandarin' | 'frogs' | 'knit' | 'cross_collar'
  | 'strip_weave' | 'feathered' | 'fur_collar' | 'hide_edge' | 'shawl'
  | 'poncho' | 'wrapped_edge' | 'placket' | 'tank' | 'tee' | 'yoke';

export interface GarmentFeature {
  key: GarmentFeatureKey;
  /**
   * Whether this feature is itself the front of the garment. When it is, the
   * generic construction pass leaves the centre alone — a row of buttons down
   * the middle of a sari, or through the notch of a lapel, is worse than no
   * buttons at all.
   */
  ownsFront: boolean;
}

/**
 * Read in order, first match wins. The order is by how specific the word is:
 * "smoking jacket" has to be seen before "jacket", and "kente cloth" before
 * "cloth". Nothing here matches a material on its own, because a material is
 * not a garment — "silk" appears in ninety names across six shapes.
 */
const FEATURES: Array<[RegExp, GarmentFeatureKey, boolean]> = [
  [/overall|dungaree|pinafore|bib/i, 'bib', true],
  [/apron|smock/i, 'apron', true],
  [/sari|saree|pallu|dupatta|odhani|angavastram|upper cloth/i, 'pallu', true],
  [/toga|palla|stola|chiton|peplos|himation|senator/i, 'toga', true],
  [/usekh|broad collar|pharaoh|egyptian/i, 'broad_collar', true],
  [/ruff|elizabethan|court doublet|spanish jacket/i, 'ruff', false],
  [/smoking jacket|dinner jacket|tuxedo|opera/i, 'shawl_lapel', true],
  [/suit|blazer|tailcoat|frock coat|morning coat|business|savile|dinner/i, 'lapels', true],
  // Evening dress named for the evening. A dinner jacket on a man; on a woman
  // the same words mean a gown, and it takes whatever the rules below give it.
  [/evening wear|formal wear|black tie|white tie|full dress/i, 'shawl_lapel', true],
  [/nehru|zhongshan|mao|bandhgala|sherwani|achkan|jodhpuri|kurta|kurti|dashiki|agbada/i, 'mandarin', true],
  [/qipao|cheongsam|changshan|magua|frog/i, 'frogs', true],
  // Knitwear, which has no seams and no facings and is therefore the one modern
  // garment that cannot be described by any of the above. Before this a
  // cardigan was drawn as an undifferentiated field of colour with a hemmed
  // neck — the same picture a peasant smock got.
  [/cardigan|sweater|jumper|pullover|gansey|guernsey|knitwear|jersey\b|fleece|sweatshirt|hoodie|union suit/i, 'knit', true],
  // The overlapping Y-front. One construction across East Asia and northern
  // India, and the thing that tells a kimono from a dressing gown at a glance —
  // which is what every one of these used to be drawn as.
  [/cross.?collar|hanfu|kimono|yukata|hanbok|jeogori|\bjama\b|angarkha|shenyi|zhiduo|\bdeel\b/i, 'cross_collar', true],
  [/kente|aso oke|aso ebi|ankara|adire|strip.?weav/i, 'strip_weave', false],
  [/feather|plume/i, 'feathered', false],
  [/fur|pelt|leopard|jaguar|lion mane|buffalo robe|ermine|sable|mink/i, 'fur_collar', false],
  // Skin that was never cut to a pattern. Read after the fur rule so a trimmed
  // hide keeps its fur edge, and before the cloth wrap because a hide behaves
  // differently at the edge: it is torn and tied, not woven and bordered.
  [/hide|buckskin|deerskin|rawhide|kaross|\bskins?\b|skin (?:wrap|dress|tunic|cloak|garment)/i, 'hide_edge', true],
  [/shawl|stole|mantilla|fichu/i, 'shawl', false],
  [/poncho|ruana/i, 'poncho', true],
  // A length of cloth taken round the body and over one shoulder. This is the
  // single largest hole in the table: `wrapped_garment` is 34% of everything
  // the generator dresses people in, and every one of them was falling to the
  // generic construction — a hide wrap, a tapa, a sarong and a wrap dress all
  // drawn as a plain shirt with a hemmed neck.
  [/\bwrap(?:s|per|ped|ping)?\b|tapa\b|bark.?cloth|sarong|\bkain\b|lava ?lava|khanga|\bkanga\b|pagne|\bmanta\b|sampot/i, 'wrapped_edge', true],
  // Cut away at the shoulder, which is the one thing about it: a tank top drawn
  // with a crew rib is a t-shirt.
  [/tank top|singlet|camisole|vest top|bandeau/i, 'tank', true],
  // Both of these have to be read *before* the placket rule below, because that
  // rule matches the bare word "shirt" and a t-shirt is a shirt: every t-shirt
  // in the app was being drawn with a turned collar and a buttoned front. The
  // leading word boundary is what keeps "sweatshirt" out — which contains the
  // letters of "tshirt" and is knitwear anyway.
  [/\bt[- ]?shirt|tee shirt|\btees?\b|board short|resort wear/i, 'tee', true],
  // A buttoned front opening with a collar turned down over it, which is what
  // an unqualified shirt, blouse or jacket has been since about 1850 — and
  // between them those three words are the largest single group of names the
  // industrial and modern tables produce. The rule used to require a qualifier
  // ("work shirt", "dress shirt"), so "Olive Shirt" and "Charcoal Blouse" got
  // the same undifferentiated field a peasant smock did. `lapels` above has
  // already taken anything tailored, so what reaches here is workwear.
  [/guayabera|polo|aloha|shirt|blouse|chambray|\bjackets?\b|\bcoats?\b|windbreaker|anorak/i, 'placket', true],
  [/embroider|zardozi|kundan|brocade|zari|beaded|jeweled|jewelled/i, 'yoke', false],
];

/**
 * The two wrapped features describe cloth crossing the *chest*, so both are
 * wrong wherever the named garment covers only the lower body: a wrap skirt is
 * worn with a blouse and a hide kilt with nothing, and a selvedge drawn over
 * either says the cloth continues up over the shoulder when it does not. The
 * verdict is already made twice in the codebase — `bodice` for the skirted
 * constructions, `leavesChestBare` for the loincloth family — so it is read
 * here rather than made a third time.
 */
const CHEST_FEATURES = new Set<GarmentFeatureKey>(['wrapped_edge', 'hide_edge']);

export function garmentFeatureFor(
  name: string,
  material: string,
  options: { gender?: string; separateBodice?: boolean } = {}
): GarmentFeature | null {
  const subject = `${name} ${material}`;
  for (const [pattern, key, ownsFront] of FEATURES) {
    if (!pattern.test(subject)) continue;
    if (CHEST_FEATURES.has(key)
      && (options.separateBodice || leavesChestBare(name))) continue;
    // Tailoring is the one verdict in this table that the wearer changes. Only
    // half the people described as being in evening wear are in a dinner
    // jacket; the other half are in a gown, and drawing lapels on it is worse
    // than drawing nothing.
    if (key === 'shawl_lapel' && options.gender && options.gender !== 'Male'
      && isOccasionFormal(name)) continue;
    return { key, ownsFront };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Neckline
// ---------------------------------------------------------------------------

/**
 * The shape of the opening the head comes through.
 *
 * Nine shapes, and the bust cuts its garment mask with exactly these. The
 * sprite has its own nine-value vocabulary keyed on collars rather than on
 * holes — a `lapel` and a `stand` are things sewn to an opening, not shapes of
 * one — and it maps this onto that. The two lists are deliberately not merged:
 * a bust crops at the chest and draws the opening itself, a whole figure mostly
 * shows what is *around* it.
 */
export type NecklineShape =
  | 'round' | 'wide' | 'square' | 'v' | 'cross' | 'high' | 'asymmetric' | 'slit' | 'boat';

/**
 * What a garment kind could plausibly be cut with, where nothing else has an
 * opinion. Every option in a row has to be defensible for that construction
 * anywhere it occurs, because this fires on personas from any century and any
 * continent — a choice made here is not a claim about culture.
 */
const NECKLINES_FOR_KIND: Record<string, NecklineShape[]> = {
  tunic: ['round', 'slit', 'boat'],
  robe: ['cross', 'slit', 'v'],
  gown: ['wide', 'square', 'boat'],
  doublet: ['high', 'square', 'v'],
  work_shirt: ['v', 'slit', 'round'],
  wrapped_garment: ['asymmetric', 'boat', 'wide'],
  jacket: ['v', 'high', 'square'],
  bare: ['wide'],
};

export interface NecklineSource {
  packId?: string;
  kind: string;
  gender?: string;
  wealth?: string;
  culturalZone?: string;
}

/**
 * Which opening this person's garment has.
 *
 * The pack rules used to live in `art/garments.ts` and the sprite could not see
 * them, so it made its own guess off the item's name — the last construction
 * decision in the app that the two renderers took separately. A Ming robe was
 * cut cross-over above the neck and round below it.
 *
 * `pick` chooses from the plausible set for the kind; the caller supplies it so
 * this file stays free of the rng.
 */
export function necklineFor(
  source: NecklineSource, pick: (options: NecklineShape[]) => NecklineShape
): NecklineShape {
  switch (source.packId) {
    case 'old_bailey_london_1674_1800':
      return source.gender === 'Female' ? 'square' : 'v';
    case 'china_ming_1368_1650':
    case 'china_tang_song_yuan_600_1368':
    case 'china_early_imperial_200bce_600ce':
      return 'cross';
    case 'sahel_medieval_700_1600':
    case 'sahel_early_0_700':
      return source.kind === 'wrapped_garment' ? 'asymmetric' : 'wide';
    case 'south_asia_mughal_1526_1800':
      return 'asymmetric';
    case 'mediterranean_antiquity_500bce_500ce':
      return 'round';
    default:
      break;
  }

  const options = NECKLINES_FOR_KIND[source.kind] || ['round'];

  // The one zone-level convention worth honouring outside a context pack: a
  // front-closing overlapped collar is near-universal for East and Central
  // Asian robes across the whole period this app covers, and drawing one of
  // those as a round neck is a more visible error than any of the choices
  // below.
  if (source.kind === 'robe'
    && (source.culturalZone === 'EAST_ASIAN' || source.culturalZone === 'CENTRAL_ASIAN')) {
    return 'cross';
  }

  // Wealth widens and lowers a neckline: cloth to spare, and no work to do in
  // it. Poor dress closes up, because an open neck is heat lost and a snagged
  // hem. This is about as far as a generic rule can honestly go.
  const wealthy = source.wealth === 'wealthy' || source.wealth === 'noble';
  if (wealthy && options.includes('square')) return 'square';
  if (source.wealth === 'poor' && options.includes('slit')) return 'slit';

  return pick(options);
}

// ---------------------------------------------------------------------------
// Context marks
// ---------------------------------------------------------------------------

/**
 * A detail a place and period puts on clothing regardless of what the item is
 * called.
 *
 * The context packs used to be a switch inside the bust's garment pass, which
 * made them both invisible to the sprite and impossible to count. As a list of
 * named marks they are neither: `contextMarksFor` is the only place that reads
 * a pack id, each renderer draws whichever marks it can, and `match-audit` can
 * ask both what they drew.
 *
 * Deliberately about *shape*, not about culture. `clavi` and `strip_seams` both
 * mean "vertical bands down the cloth" and are drawn by the same code at
 * different pitches — the pack decides which is right for the person, and this
 * vocabulary decides what a viewer actually sees.
 */
export type ContextMark =
  /** A folded kerchief crossed over the bodice and tucked in. */
  | 'kerchief'
  /** A neckcloth showing in the opening of a coat. */
  | 'neckcloth'
  /** A row of metal buttons up the coat front. */
  | 'coat_buttons'
  /** Collar bands crossing right over left, the East Asian construction. */
  | 'cross_band'
  /** A decorated band down the centre front. */
  | 'front_panel'
  /** Vertical seams at a regular pitch: cloth woven in narrow strips. */
  | 'strip_seams'
  /** An embroidered panel worked around the neck opening. */
  | 'neck_panel'
  /** A closure running diagonally from the throat to one side. */
  | 'side_closure'
  /** Metal fastenings along that closure. */
  | 'closure_studs'
  /** The pair of woven bands running down from the shoulders. */
  | 'clavi'
  /** A mantle folded over the left shoulder. */
  | 'mantle'
  /** A centre-front opening with nothing sewn over it: no band, no buttons. */
  | 'front_opening'
  /** A bound neck opening with no collar standing on it. */
  | 'collarless_band';

export interface ContextMarkSource {
  gender?: string;
  wealth?: string;
  /** The garment's own `ornament`, 0–1. Decides the optional extras. */
  ornament?: number;
  /**
   * What the pack actually dressed this person in. Several packs offer two
   * looks — a short jacket or a plain wrapped cloth, an office suit or a work
   * coat — and the marks differ between them. Without this the mark would have
   * to be true of both, which in practice means drawing neither.
   */
  garmentName?: string;
}

/**
 * Which marks a pack puts on a person. An unknown or absent pack returns none,
 * and the renderers fall back to their generic construction — which is what 92%
 * of personas get, so that path is the important one and this is the garnish.
 */
export function contextMarksFor(
  packId: string | undefined, source: ContextMarkSource = {}
): ContextMark[] {
  const ornament = source.ornament ?? 0;
  const rich = source.wealth === 'wealthy' || source.wealth === 'noble';
  const name = source.garmentName ?? '';

  switch (packId) {
    case 'old_bailey_london_1674_1800':
      return source.gender === 'Female'
        ? ['kerchief']
        : ['neckcloth', 'coat_buttons'];

    case 'china_ming_1368_1650':
    case 'china_tang_song_yuan_600_1368':
    case 'china_early_imperial_200bce_600ce':
      return ornament > 0.5 ? ['cross_band', 'front_panel'] : ['cross_band'];

    case 'sahel_medieval_700_1600':
    case 'sahel_early_0_700':
      return ornament > 0.3 ? ['strip_seams', 'neck_panel'] : ['strip_seams'];

    case 'south_asia_mughal_1526_1800':
      return ornament > 0.4 ? ['side_closure', 'closure_studs'] : ['side_closure'];

    case 'mediterranean_antiquity_500bce_500ce':
      return rich ? ['clavi', 'mantle'] : ['clavi'];

    // Soviet-era civilian dress: a buttoned wool jacket, and for office work a
    // collared shirt showing in the opening. The pack's own look already picks
    // between the two, so the mark follows what it chose rather than guessing.
    case 'central_asia_soviet_1917_1991':
      return /suit|office|collared/i.test(name)
        ? ['neckcloth', 'coat_buttons']
        : ['coat_buttons'];

    // A short woven jacket worn open over a wrapped cloth. The opening is the
    // detail — these jackets are not buttoned shut down the front the way a
    // European coat is — and where the pack gave a plain wrapped garment
    // instead there is no upper opening to draw at all.
    case 'maritime_southeast_asia_1750_1930':
    case 'mainland_southeast_asia_1000_1930':
      return /jacket/i.test(name) ? ['front_opening'] : [];

    // A collarless shirt or blouse: the neck is bound and nothing stands on it,
    // which is exactly what distinguishes it from every European shirt of the
    // same centuries.
    case 'philippines_1500_1930':
      return ['collarless_band'];

    /**
     * The Australian and Melanesian packs get no marks, on purpose.
     *
     * Both say so themselves — "deliberately broad", "intentionally
     * low-specificity", "avoids pan-Pacific regalia and invented uniforms",
     * and both carry a low or medium confidence rating. A mark is a specific
     * claim about how a garment was made, and there is nothing here to base one
     * on; the honest picture is the plain one these packs already produce.
     */
    default:
      return [];
  }
}
