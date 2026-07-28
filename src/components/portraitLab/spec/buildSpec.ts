/**
 * portraitLab/spec/buildSpec.ts
 *
 * The adapter. This is the *only* file in portraitLab that knows anything about
 * the app's character model, and it deliberately accepts the same loose shape
 * the existing ProceduralPortrait accepts so the two renderers are drop-in
 * interchangeable.
 *
 * It preserves the app's existing precedence rules:
 *   portraitVisualOverrides  (evidence-aware, from portraitAuthenticityService)
 *     > equippedItems        (what the persona is actually wearing)
 *       > appearance         (the procedural fallback)
 */

import { hashString, unit } from '../core/rng';
import { hexToRgb, hslToRgb, luminance, mixRgb, rgbToHex, rgbToHsl } from '../core/color';
import { hasIntrinsicColor, hexForName } from '../../../constants/gameData/colorNames';
import {
  BackgroundSpec,
  Build,
  ConditionSpec,
  DentalWork,
  Expression,
  GarmentKind,
  GarmentSpec,
  GarmentSurfaceSpec,
  HairLength,
  HairSilhouette,
  HeadwearKind,
  HeadwearSpec,
  JewelrySpec,
  FaceTraits,
  MarkingSpec,
  MoodSpec,
  OrnamentMaterial,
  OrnamentSpec,
  PortraitSpec,
  PoseSpec,
  SkullShape,
  SpecColorSet,
} from './types';

export interface PortraitSource {
  age?: number;
  gender?: string;
  health?: number;
  maxHealth?: number;
  fatigue?: number;
  maxFatigue?: number;
  wealthLevel?: string;
  era?: string;
  culturalZone?: string;
  ethnicCulturalZone?: string;
  portraitSeed?: number;
  profession?: string;
  name?: string;
  /**
   * Only three traits are read, so they are named rather than taken as a
   * `Record<string, number>`. The app's `CharacterPersonality` is an interface
   * and so carries no index signature, which made it structurally incompatible
   * with a record type even though every value in it is a number — the old
   * `character: any` prop on the removed PortraitSwitch was quietly hiding
   * that at every call site.
   */
  personality?: {
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
  };
  /** Accepted from callers and ignored — nothing here is drawn from stats. */
  stats?: object;
  /**
   * The app's trait list. Only the handful that are about a face are read;
   * `left_handed` and `can_swim` are not going to show at 96px.
   */
  attributes?: Array<{ id?: string } | null | undefined>;
  diseaseHealth?: { currentDiseases?: Array<{ disease?: { name?: string } }> };
  equippedItems?: Record<string, { name?: string; material?: string; color?: string } | undefined>;
  appearance?: Record<string, any>;
  portraitVisualOverrides?: Record<string, any>;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const WEALTH_ORNAMENT: Record<string, number> = {
  poor: 0,
  modest: 0.15,
  comfortable: 0.35,
  wealthy: 0.7,
  noble: 1,
};

// ---------------------------------------------------------------------------
// Garment / headwear classification
// ---------------------------------------------------------------------------

/**
 * Order matters: the first match wins. Extended from an audit over the app's
 * real output, where roughly one garment name in seven was matching nothing and
 * silently falling back to a tunic — skirts, cloaks, loincloths and most of the
 * South Asian vocabulary among them.
 */
const GARMENT_KEYWORDS: Array<[RegExp, GarmentKind]> = [
  [/(bare|naked|nude|loincloth|breechcloth|breechclout)/i, 'bare'],
  [/(robe|kaftan|caftan|jama|hanfu|cassock|habit|abaya|thobe|dishdasha|boubou|agbada|achkan|sherwani|toga|houppelande|senator wear)/i, 'robe'],
  [/(gown|dress|kirtle|frock|sari|saree|lehenga|anarkali|farthingale|cotehardie|kimono|ghagra|stola|peplos|peshwaz|haute couture)/i, 'gown'],
  [/(doublet|jerkin|waistcoat|bodice|breastplate|surcoat|tabard|vest|choli|corset)/i, 'doublet'],
  [/(coat|jacket|suit|blazer|overcoat|parka|anorak|chapan|cape|cloak|poncho|cardigan)/i, 'jacket'],
  [/(wrap|wrapper|sarong|pagne|barkcloth|bark cloth|tapa|drape|himation|shawl|mantle|blanket|lavalava|kain|lungi|dhoti|skirt|breast band|hide|skin garment|fur|pelt|odhani|dupatta|traditional cloth|leaf covering|slit|upper cloth|woven cloth)/i, 'wrapped_garment'],
  [/(shirt|blouse|smock|chemise|shift|tee|kurti|kameez|pants|trousers|breeches|leggings|apron|top|guayabera|chinos|shorts|overalls|churidar|jumper|sweater|jeans|kaba|denim|resort wear)/i, 'work_shirt'],
  [/(tunic|kurta|chiton|dashiki|kaross|salwar)/i, 'tunic'],
  [/(none|nothing)/i, 'bare'],
];

/**
 * Same story as the garments: the audit turned up fezzes, hijabs, feathered
 * headdresses, beaded bands and a laurel wreath all being drawn as skullcaps.
 * A plain band across the brow is common enough to deserve its own form.
 */
const HEADWEAR_KEYWORDS: Array<[RegExp, HeadwearKind]> = [
  // Eyewear filed under the head slot is not a head covering at all.
  [/(sunglasses|spectacles|eyeglasses)/i, 'none'],
  [/(veil|wimple|mantilla|dupatta|niqab|chador|hijab|barbette)/i, 'veil'],
  [/(hood|cowl|capuche|zukin|chaperon)/i, 'hood'],
  [/(helmet|helm|casque|morion|sallet|kabuto)/i, 'helmet'],
  [/(crown|diadem|coronet|tiara|headdress|headpiece|sacred feather)/i, 'coronet'],
  // `ornament` used to live in this rule and had to come out: it is a word
  // that attaches to other nouns. "Turban with Gold Ornament" matched here,
  // before the `wrapped_cloth` rule below ever saw it, and the persona lost
  // their turban to keep a hairpin. The late ornament rule at the bottom picks
  // up the genuinely ornament-only names once every covering has had its turn.
  [/(circlet|band|fillet|wreath|garland|passa|jadai|chaplet|hairpin|hair pin|comb|hair flower|laurel|tikka|patti|rakhdi|fascinator|hairpiece|bindi)/i, 'band'],
  [/(turban|headcloth|head cloth|headwrap|head wrap|head tie|gele|keffiyeh|shemagh|pagri|scarf|kerchief|tignon|wrap|duku|gele)/i, 'wrapped_cloth'],
  // Fur headgear is soft and brimless. This has to precede the generic `hat`
  // rule below, or a "Fur Hat" picks up a stiff felt brim.
  [/(fur|pelt|shearling|astrakhan|ushanka|papakha|sheepskin|fox tail)/i, 'cap'],
  [/(cap|coif|bonnet|kufi|taqiyah|biretta|skullcap|futou|beret|toque|fez|tarboosh|hennin|topi|snapback|beanie|biggins|kofia|mitre|songkok)/i, 'cap'],
  // `dou li` is written with a space in the item data, so the old `douli`
  // spelling never matched and those hats fell through to the `cap` fallback.
  [/(brim|tricorn|bicorne|sombrero|straw|petasos|boater|bowler|fedora|homburg|visor|top hat|wide[- ]?hat|conical|dou ?li|bamboo|sedge|sugegasa|kasa|salakot|non la|cheese-cutter|hat)/i, 'brimmed_hat'],
  /**
   * Things that are decoration and nothing else, caught last so that anything
   * which is genuinely a covering has already won. Order is the whole point
   * here: a "Felt Cap with Feather" is a cap and must be matched by the cap
   * rule above, while a "Coral Stickpin" is not a hat of any kind.
   *
   * Before this existed those fell through to the `cap` fallback and were
   * drawn as skullcaps — which is how a stickpin ended up rendering as a solid
   * gold bowl over someone's head, the pin itself a rounding error beside it.
   * They route to `band`, whose own drawing steps aside when the ornament
   * layer has found what the item actually is.
   */
  [/(pin|bodkin|kanzashi|skewer|plume|feather|quill|strand|brooch|medallion|boss|plaque|roundel|flower|blossom|bead|pearl|jewel|gem|stone|coral|amber|jade|shell|ornament)/i, 'band'],
];

/**
 * Hairstyle names, mapped onto silhouettes the renderer can draw.
 *
 * The app has been generating these all along — `getHairstyle` in
 * `npcUtils.ts` picks from era- and gender-specific lists, so a medieval man
 * gets a `bowl_cut` or a `shaved_crown` and an antique woman gets a
 * `braided_crown` or a `gathered_bun` — and the renderer simply never read the
 * field. Every persona was drawn with hair falling free. Wiring this up costs
 * nothing at generation time and buys back an axis of variation that is
 * already period-correct, because the era gating happened upstream.
 *
 * Order matters: the first match wins, so the specific forms have to precede
 * the generic words they contain. `braided_buns` must be tested before
 * `braided`, or every plait in the app resolves to a loose braid.
 */
const HAIRSTYLE_KEYWORDS: Array<[RegExp, HairSilhouette]> = [
  // Shaved and part-shaved forms first — `shaved_crown` contains no other
  // keyword, but `thin_shaved_crown` would otherwise match `thin`.
  [/(tonsure|shaved[_ ]?crown|monk|friar)/i, 'tonsure'],
  [/(mohawk|shaved[_ ]?sides|fade|undercut|sidecut)/i, 'shaved_sides'],

  // Bound and gathered forms.
  [/(twin[_ ]?buns|braided[_ ]?buns|pigtails|bunches|odango)/i, 'twin_buns'],
  [/(top[_ ]?knot|topknot|warrior[_ ]?knot|man[_ ]?bun|elder[_ ]?crown|elder[_ ]?knots)/i, 'top_knot'],
  [/(updo|piled[_ ]?high|high[_ ]?pinned|elaborate[_ ]?bun|pearl[_ ]?net|rolled[_ ]?and[_ ]?set|courtly)/i, 'updo'],
  [/(bun|chignon|gathered|knot|waved[_ ]?and[_ ]?pinned|veiled[_ ]?and[_ ]?bound)/i, 'bun'],
  [/(ponytail|tail|queue)/i, 'ponytail'],
  [/(tied[_ ]?back|swept[_ ]?back|slick(ed)?[_ ]?back|pulled[_ ]?back|high[_ ]?forehead|pompadour)/i, 'tied_back'],

  // Braided forms, most specific first.
  [/(braided[_ ]?crown|crown[_ ]?braid|braided[_ ]?halo)/i, 'braid_crown'],
  [/(cornrow|canerow)/i, 'cornrows'],
  [/(dreadlock|dreads|locs|locks[_ ]?rope|twists)/i, 'locs'],
  [/(plaits|twin[_ ]?braid|maiden[_ ]?braids|tribal[_ ]?braids|shaman[_ ]?braids|side[_ ]?braids)/i, 'braid_twin'],
  [/(braid|plait|elaborate[_ ]?braids)/i, 'braid_single'],

  // Cut forms.
  [/(bowl[_ ]?cut|short[_ ]?bowl|page[_ ]?cut|pageboy)/i, 'bowl'],
  [/(bob[_ ]?cut|shingled|blunt|cropped[_ ]?at[_ ]?the[_ ]?jaw|jaw[_ ]?length)/i, 'bob'],
  [/(bangs|fringe|combed[_ ]?forward|youth[_ ]?locks)/i, 'bangs'],
  [/(afro|halo)/i, 'afro'],
  [/(side[_ ]?part|center[_ ]?part|centre[_ ]?part|parted|side[_ ]?curls|side[_ ]?waves|rolled[_ ]?at[_ ]?the[_ ]?temples|oiled|back[_ ]?and[_ ]?sides)/i, 'swept'],

  // Hair kept under a cloth is bound underneath it, and the sliver that shows
  // at the temples should be flat rather than falling free.
  [/(covered|veiled|wrapped)/i, 'tied_back'],

  // Names that legitimately mean loose hair, listed so they count as *matched*.
  // Without this the audit reports a third of the corpus as an unrecognised
  // style, and a report that cries wolf on its commonest case is a report the
  // next person to read it will skip. A genuine gap should be rare and loud.
  [
    /(loose|wild|messy|tousled|flowing|waves?|curled|curls|locks|shoulder[_ ]?length|waist[_ ]?length|cropped|short[_ ]?styled|short[_ ]?modern|professional|contemporary|youth|maiden|novice|young[_ ]?lady|matron|elder|balding|thin[_ ]?long|thin[_ ]?sides|receding|full[_ ]?beard)/i,
    'loose',
  ],
];

export function classifyHairstyleName(name: string): { silhouette: HairSilhouette; matched: boolean } {
  for (const [pattern, silhouette] of HAIRSTYLE_KEYWORDS) {
    if (pattern.test(name)) return { silhouette, matched: true };
  }
  return { silhouette: 'loose', matched: false };
}

// ---------------------------------------------------------------------------
// Ornaments
// ---------------------------------------------------------------------------

/**
 * What an item is made of, read out of its own name and material.
 *
 * Order matters twice over. The *material* table is consulted first and the
 * first hit wins, so the specific stones precede the generic metals — a "Gilt
 * Silver and Feather" ornament should take its bead colour from the gilt, not
 * from the word silver buried in the middle. And within the shape table, the
 * compound forms precede their parts: `hairpin` must beat `pin`, and
 * `kingfisher` must be tested before `feather` or the signature material of the
 * whole set resolves to a generic dark plume.
 */
const ORNAMENT_MATERIAL_KEYWORDS: Array<[RegExp, OrnamentMaterial]> = [
  [/kingfisher|tian.?tsui/i, 'kingfisher'],
  [/jade|nephrite|jadeite/i, 'jade'],
  [/turquoise/i, 'turquoise'],
  [/lapis|azurite/i, 'lapis'],
  [/coral/i, 'coral'],
  [/amber/i, 'amber'],
  [/ruby|garnet|carnelian/i, 'ruby'],
  [/emerald|malachite/i, 'emerald'],
  [/pearl|nacre|mother.of.pearl/i, 'pearl'],
  [/lacquer|cinnabar/i, 'lacquer'],
  [/shell|cowrie|cowry|conch/i, 'shell'],
  [/gilt|gilded|vermeil/i, 'gilt'],
  [/gold|golden/i, 'gold'],
  [/silver/i, 'silver'],
  [/bronze|brass/i, 'bronze'],
  [/copper/i, 'copper'],
  [/bone|ivory|tusk|antler/i, 'bone'],
  [/wood|ebony|sandalwood|bamboo/i, 'wood'],
  // Feathers by value band. Species is not legible at 96px; brightness is.
  // Birds only. `scarlet` and `crimson` used to live in the second of these and
  // had to come out: they are colour words, and the generator prefixes colours
  // onto item names freely, so a "Crimson Jeweled Veil" was having the *stone*
  // in it classified as a bright feather.
  [/ostrich|egret|swan|heron/i, 'plumeWhite'],
  [/peacock|macaw|parrot|quetzal|pheasant/i, 'plumeBright'],
  [/feather|plume|quill/i, 'plumeDark'],
  [/diamond|crystal|glass|gem|jewel/i, 'silver'],
];

interface OrnamentRule {
  pattern: RegExp;
  kind: OrnamentSpec['kind'];
  placement: OrnamentSpec['placement'];
  paired?: boolean;
  count?: number;
  /**
   * Rules sharing a group are alternatives, not additions. A "Feathered
   * Headdress" matches both the plume rule and the feather rule beneath it, and
   * without this it came out wearing a spray of feathers *and* a single feather
   * next to it — two answers to the same question stuck in one head.
   */
  group?: string;
}

const ORNAMENT_SHAPE_KEYWORDS: OrnamentRule[] = [
  // Feathered forms. A headdress of them is a spray; one named feather is one.
  { pattern: /plume|panache|aigrette|kalgi|feathered head|feather head/i, kind: 'plume', placement: 'crown', count: 3, group: 'feathery' },
  { pattern: /feathers/i, kind: 'plume', placement: 'crown', count: 3, group: 'feathery' },
  { pattern: /feather|quill/i, kind: 'feather', placement: 'crown', group: 'feathery' },

  // Worn *in* the hair rather than around the head.
  { pattern: /hairpin|hair pin|kanzashi|stickpin|skewer|bodkin/i, kind: 'pin', placement: 'temple' },
  { pattern: /comb|peineta/i, kind: 'comb', placement: 'crown' },

  // Hanging and set forms.
  { pattern: /strand|string|dangle|pendant|drop|tassel|fringe/i, kind: 'beadStrand', placement: 'side', paired: true },
  { pattern: /flower|blossom|rose|lotus|jasmine|marigold|bloom/i, kind: 'flower', placement: 'temple' },
  { pattern: /medallion|boss|plaque|disc|roundel|badge|brooch/i, kind: 'medallion', placement: 'brow' },
  { pattern: /bead|pearl|shell|cowrie/i, kind: 'beadStrand', placement: 'side', paired: true },
  { pattern: /jewel|gem|stone|jade|turquoise|coral|amber|ruby|emerald|diamond/i, kind: 'gem', placement: 'brow' },
  // A fitting, where the name says there is one. This deliberately does *not*
  // fire on a bare metal word: "Gold-Threaded Silk Turban" is a turban woven
  // with gold, not a turban with a gold pin in it, and an earlier version that
  // matched any precious metal stuck a hairpin into one head in twelve.
  { pattern: /ornament|filigree|inlaid|set with|studded|mounted|worked/i, kind: 'pin', placement: 'temple' },
];

function ornamentMaterialFor(text: string, fallback: OrnamentMaterial): OrnamentMaterial {
  for (const [pattern, material] of ORNAMENT_MATERIAL_KEYWORDS) {
    if (pattern.test(text)) return material;
  }
  return fallback;
}

/**
 * Read the decorative parts out of a head item.
 *
 * Returns at most two, and the drawing layer trims further. Restraint is the
 * whole difficulty here: the names are florid — "Gilt Silver and Kingfisher-
 * Feather Hair Ornament with Pearl Drops" is a real shape of thing in this data
 * — and honouring every noun in one produces a head that looks like a tackle
 * box. Two parts is enough to say what an object is.
 */
export function ornamentsFor(
  name: string,
  material: string,
  wealth: number
): { ornaments: OrnamentSpec[]; matched: boolean } {
  const text = `${name} ${material}`;
  const ornaments: OrnamentSpec[] = [];
  const used = new Set<string>();

  for (const rule of ORNAMENT_SHAPE_KEYWORDS) {
    if (ornaments.length >= 2) break;
    if (!rule.pattern.test(text)) continue;
    // A rule is spent once its kind is taken, and once anything in its group is.
    if (used.has(rule.kind) || (rule.group && used.has(rule.group))) continue;
    used.add(rule.kind);
    if (rule.group) used.add(rule.group);

    // Feathered forms take a feather colour; everything else takes the stone or
    // metal it is named for, falling back to something plausible for the shape.
    const feathery = rule.kind === 'feather' || rule.kind === 'plume';
    const material_ = feathery
      ? ornamentMaterialFor(text, 'plumeDark')
      : ornamentMaterialFor(text, rule.kind === 'comb' ? 'bone' : 'gilt');

    ornaments.push({
      kind: rule.kind,
      material: material_,
      placement: rule.placement,
      count: rule.count ?? 1,
      // Wealth buys size and stones, which is the one place it should show on a
      // head: a rich woman's hairpin is the same pin with a bigger jewel on it.
      scale: clamp01(0.3 + wealth * 0.7),
      paired: Boolean(rule.paired),
    });
  }

  return { ornaments, matched: ornaments.length > 0 };
}

/**
 * How a garment is decorated, read out of its name and material.
 *
 * Ordered by how much of the cloth the treatment claims. A robe can be brocade
 * *and* fur-trimmed, and those coexist happily — one is the field and one is
 * the edge — but it cannot be brocade and printed, so the field treatments are
 * mutually exclusive by group and the edge treatments by another.
 */
const GARMENT_SURFACE_KEYWORDS: Array<{
  pattern: RegExp;
  kind: GarmentSurfaceSpec['kind'];
  group: 'field' | 'edge';
}> = [
  { pattern: /brocade|damask|figured|jacquard|tissue|cloth of gold|cloth of silver/i, kind: 'brocade', group: 'field' },
  { pattern: /print|painted|block.?print|batik|resist|stamped/i, kind: 'print', group: 'field' },
  { pattern: /striped?|check|plaid|tartan|banded|narrow.strip|kente|ikat/i, kind: 'stripe', group: 'field' },

  { pattern: /embroider|needlework|couched|gold thread|silver thread|zari/i, kind: 'embroidery', group: 'edge' },
  { pattern: /lace|openwork|filet/i, kind: 'lace', group: 'edge' },
  { pattern: /\bfur\b|ermine|sable|miniver|shearling/i, kind: 'furTrim', group: 'edge' },
  { pattern: /bead|spangle|sequin|cowrie|shells?\b/i, kind: 'beading', group: 'edge' },
];

export function garmentSurfacesFor(
  name: string,
  material: string,
  wealth: number
): { surfaces: GarmentSurfaceSpec[]; matched: boolean } {
  const text = `${name} ${material}`;
  const surfaces: GarmentSurfaceSpec[] = [];
  const usedGroups = new Set<string>();

  for (const rule of GARMENT_SURFACE_KEYWORDS) {
    if (usedGroups.has(rule.group)) continue;
    if (!rule.pattern.test(text)) continue;
    usedGroups.add(rule.group);

    // Metal thread is named often enough to be worth honouring; otherwise the
    // treatment takes a plausible default for what it is. Fur is not painted
    // in the ornament palette at all — it takes the garment's own accent.
    const material_ = ornamentMaterialFor(
      text,
      rule.kind === 'furTrim' ? 'bone'
        : rule.kind === 'beading' ? 'pearl'
        : rule.kind === 'lace' ? 'pearl'
        : 'gold'
    );

    surfaces.push({
      kind: rule.kind,
      material: material_,
      // Cloth of gold on a noble is not the same object as a printed cotton on
      // a farmer, and the difference at this size is mostly density.
      intensity: clamp01(0.35 + wealth * 0.65),
    });
  }

  return { surfaces, matched: surfaces.length > 0 };
}

function classify<T>(name: string, table: Array<[RegExp, T]>, fallback: T): T {
  for (const [pattern, value] of table) {
    if (pattern.test(name)) return value;
  }
  return fallback;
}

/**
 * Same classification, but reporting whether anything actually matched.
 *
 * The adapter's keyword tables are the part of this system most likely to be
 * wrong, because the app's clothing data is far larger than any list I can
 * write by hand — so the audit harness needs to be able to ask "which garment
 * names did you fail to recognise?" rather than silently taking the fallback.
 */
export function classifyGarmentName(name: string): { kind: GarmentKind; matched: boolean } {
  for (const [pattern, kind] of GARMENT_KEYWORDS) {
    if (pattern.test(name)) return { kind, matched: true };
  }
  return { kind: 'tunic', matched: false };
}

export function classifyHeadwearName(name: string): { kind: HeadwearKind; matched: boolean } {
  for (const [pattern, kind] of HEADWEAR_KEYWORDS) {
    if (pattern.test(name)) return { kind, matched: true };
  }
  return { kind: 'cap', matched: false };
}

interface Piece {
  name?: string;
  material?: string;
  color?: string;
}

function isEmptyPiece(piece: Piece | null | undefined): boolean {
  if (!piece || !piece.name) return true;
  const name = piece.name.trim().toLowerCase();
  return name === '' || name === 'none' || name === 'barefoot' || name === 'nothing';
}

/**
 * When the app supplies a garment or covering with no colour of its own, the
 * material is the best clue available. A steel helmet painted in the persona's
 * palette secondary reads as a gold bowl, which is how you end up with medieval
 * Londoners in party hats.
 */
const MATERIAL_COLORS: Array<[RegExp, string]> = [
  [/steel|iron/i, '#8e949c'],
  [/bronze/i, '#a8763f'],
  [/brass/i, '#b5913f'],
  [/silver/i, '#b9bcc2'],
  [/gold/i, '#cfa044'],
  [/linen/i, '#d9d0bb'],
  [/cotton|muslin|calico/i, '#cfc7b4'],
  [/silk|satin/i, '#8c6a7a'],
  [/wool|felt|broadcloth/i, '#6b6153'],
  [/leather|hide/i, '#6b482f'],
  [/fur|sheepskin/i, '#8b7358'],
  [/straw|reed|grass|raffia/i, '#c2a463'],
  // Bamboo and its relatives were falling through to the generic garment
  // palette, which is why a woven bamboo hat came out the same grey as a felt
  // one. Split bamboo weathers to a warmer, slightly greener straw than reed.
  [/bamboo|rattan|cane|sedge|palm leaf|pandanus/i, '#c0a566'],
  [/barkcloth|bark cloth|fibre|fiber|plant/i, '#a98a63'],
];

function colorForMaterial(material: string | undefined): string | null {
  if (!material) return null;
  for (const [pattern, color] of MATERIAL_COLORS) {
    if (pattern.test(material)) return color;
  }
  return null;
}

/**
 * The colour of a material that is never dyed, or null for anything that is.
 *
 * Linen, hemp, wool and cotton all take dye, so a generated colour on those is
 * meaningful and must win. Sedge, straw, bark, hide, wood and metal do not, and
 * for those the material *is* the colour — which is the whole reason a sedge
 * sunhat was arriving at the renderer as a lilac bowler.
 */
function intrinsicColorFor(material: string | undefined): string | null {
  if (!hasIntrinsicColor(material)) return null;
  return colorForMaterial(material);
}

/**
 * A colour off an item, which may be a hex — or may be the name of a dye.
 *
 * `applyColorToItem` in `characterGenerator.ts` names an item for its colour
 * and then stores that *word* in `item.color`, because the word is what the
 * equipment panel prints. The renderer wanted a hex, and nothing translated
 * between them, so every dyed garment and every dyed hat in the app has been
 * arriving here as an unparseable string.
 *
 * What it did with one is the interesting part. `hexToRgb` strips a `#`, and
 * for anything six characters or longer runs `parseInt(…, 16)` over the
 * result — so "Rust" fell to the grey fallback and came out drab, while
 * "Russet", "Indigo" and "Madder" parsed to *NaN channels*: `r: null, g: null,
 * b: 14`. That is why the wall of head coverings was cream. It was not a
 * palette decision at all; it was arithmetic on the word.
 *
 * `hexForName` has existed all along for exactly this, and its own comment
 * says to prefer it wherever the colour was chosen, because name → hex is
 * lossless and hex → name is not. It was simply never called from here.
 */
function resolveColor(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }
  if (trimmed.startsWith('rgb')) return trimmed;
  return hexForName(trimmed) || null;
}

/**
 * The dye an item is named for.
 *
 * For most equipped items the colour is *only* in the name — "Rust Cotton
 * Cap", "Woad Head Wrap", "Green Linen Veil" all arrive with no `color` field
 * at all, because the generator built the name by prefixing a dye word and
 * then, for these paths, never wrote the word anywhere else. So the name is
 * not a label for the colour; it is the sole record of it, and reading it is
 * the only way the portrait can agree with the equipment panel beside it.
 *
 * First word wins. Dye words lead in every name this table produces, and
 * scanning further finds the material — "Green Linen Veil" in *White* Linen is
 * a real entry, and the right answer for the cloth is green.
 */
function colorFromName(name: string | undefined): string | null {
  if (!name) return null;
  for (const word of name.toLowerCase().split(/[\s,\-]+/)) {
    const hex = hexForName(word);
    if (hex) return hex;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

/**
 * One backdrop pair per cultural zone: a base for the field and a lighter
 * accent for the rake of key light across the upper left.
 *
 * These are all cool or neutral on purpose. Human complexions occupy a narrow
 * warm band — every one of them sits between about 20° and 40° of hue — so a
 * warm ground is a ground the face cannot separate from, no matter how the
 * lighting is handled. Zone character has to come from *which* cool it is
 * (northern steel, Sahelian petrol, indigo, ink-green) and from the accent,
 * not from putting brown behind brown.
 */
const ZONE_BACKGROUNDS: Record<string, [string, string]> = {
  EUROPEAN: ['#4a5a6a', '#8d9a9c'],
  MENA: ['#5c6272', '#a09a8c'],
  SOUTH_ASIAN: ['#4d4870', '#9b8fa8'],
  EAST_ASIAN: ['#3f5a55', '#8b9a8e'],
  SUB_SAHARAN_AFRICAN: ['#2f5560', '#9aa896'],
  NORTH_AMERICAN_PRE_COLUMBIAN: ['#4b5a4e', '#979c84'],
  NORTH_AMERICAN_COLONIAL: ['#445a5c', '#8e9a8e'],
  SOUTH_AMERICAN: ['#3d5a48', '#8ea183'],
  OCEANIA: ['#35606e', '#8fa9ac'],
};

/** Shortest distance between two hues, in degrees. */
const hueGap = (a: number, b: number): number =>
  Math.abs(((a - b) % 360 + 540) % 360 - 180);

/**
 * The guarantee behind the table above, and the one thing that has to hold for
 * a backdrop supplied from outside — the authenticity service picks colours for
 * place, not for legibility, and a warm earth from a context pack will happily
 * bury a warm complexion.
 *
 * The constraint is the whole *figure*, not the face. An earlier version of
 * this checked skin only, which let a green hemp robe sit on a green ground:
 * at this framing the garment occupies more of the silhouette than the head
 * does, so cloth has at least as much claim on the separation as skin.
 *
 * The zone colour sets the intent; the figure sets the constraint. A ground
 * that lands within 45° of either the skin's hue or the garment's is rotated
 * onto the complementary side of whichever it collides with (taking the branch
 * nearer the zone's own hue, so packs stay distinguishable), chroma is capped
 * so the ground never competes with the figure, and value is pushed away from
 * the skin's.
 */
/**
 * Hold a garment's three colours apart in value.
 *
 * Every named feature — a lapel facing, a sari border, a poncho band, a stoop
 * of fringe — is drawn in the secondary or the accent against the primary, and
 * a feature drawn in a colour that matches its ground is not drawn at all. The
 * clothing tables' palettes are not chosen with that in mind: they are chosen
 * to look like a wardrobe, and a wardrobe is full of three browns.
 *
 * So this is a floor, not a scheme. Hue is left exactly where the palette put
 * it — the historical claim is in the hue and it is not this function's to
 * make. Only lightness moves, and only when two colours are close enough that
 * one would vanish into the other.
 */
function separateGarmentColors(primary: string, secondary: string, accent: string): SpecColorSet {
  const GAP = 0.17;
  const shift = (hex: string, from: string): string => {
    const a = rgbToHsl(hexToRgb(hex));
    const b = rgbToHsl(hexToRgb(from));
    const delta = a.l - b.l;
    if (Math.abs(delta) >= GAP) return hex;
    // Move away from whichever side has room. Pushing a pale cloth paler until
    // it clips is how you get two whites instead of a white and a grey.
    const away = delta === 0 ? (b.l > 0.5 ? -1 : 1) : Math.sign(delta);
    const target = b.l + away * GAP;
    const clamped = target > 0.94 ? b.l - GAP : target < 0.08 ? b.l + GAP : target;
    return rgbToHex(hslToRgb({ h: a.h, s: a.s, l: Math.max(0.05, Math.min(0.95, clamped)) }));
  };
  const nextSecondary = shift(secondary, primary);
  return {
    primary,
    secondary: nextSecondary,
    // The accent has to clear both, or a trim can be legible against the cloth
    // and invisible against the facing it runs along.
    accent: shift(shift(accent, primary), nextSecondary),
  };
}

function separateFromFigure(
  hex: string,
  skinHex: string,
  garmentHex: string | undefined,
  range: [number, number]
): string {
  const bg = rgbToHsl(hexToRgb(hex));
  const skin = rgbToHsl(hexToRgb(skinHex));
  const skinLum = luminance(hexToRgb(skinHex));
  const [lo, hi] = range;

  // Only a garment with real chroma can swallow a background. A grey-brown
  // homespun cannot, and treating it as a constraint would rotate every
  // backdrop in the app for no gain.
  const garment = garmentHex ? rgbToHsl(hexToRgb(garmentHex)) : null;
  const garmentBites = garment !== null && garment.s > 0.18;

  // The garment wants a wider berth than the skin does. Skin is never vivid, so
  // 45° of hue plus the value push below is enough to hold it apart; a
  // saturated dyed cloth against a desaturated ground of the same family reads
  // as one mass at 48° and only separates around 50.
  const collides = (h: number) =>
    hueGap(h, skin.h) < 45 || (garmentBites && hueGap(h, garment!.h) < 50);

  let hue = bg.h;
  if (collides(bg.h)) {
    // Complementary branches off whichever part of the figure we clashed with;
    // keep the one closer to where the zone wanted to be, and prefer a branch
    // that does not simply collide with the other half of the figure instead.
    const anchor = hueGap(bg.h, skin.h) < 45 ? skin.h : garment!.h;
    const candidates = [anchor + 120, anchor + 205, anchor + 160]
      .filter(h => !collides(h));
    const usable = candidates.length > 0 ? candidates : [anchor + 160];
    hue = usable.reduce((best, h) =>
      hueGap(bg.h, h) < hueGap(bg.h, best) ? h : best);
  }

  // A backdrop is scenery. Chroma here reads as "painted flat", and it steals
  // saturation contrast from the one saturated thing that matters, the figure.
  const sat = Math.min(bg.s, 0.2);

  // Dark complexions want a backdrop lighter than they are, pale ones a darker
  // backdrop; either way the gap has to be real.
  const wantLighter = skinLum <= 0.42;
  let l = wantLighter ? Math.max(bg.l, skin.l + 0.14) : Math.min(bg.l, skin.l - 0.16);
  l = Math.max(lo, Math.min(hi, l));
  if (Math.abs(luminance(hslToRgb({ h: hue, s: sat, l })) - skinLum) < 0.12) {
    l = wantLighter ? Math.min(hi + 0.08, l + 0.1) : Math.max(lo - 0.08, l - 0.1);
  }

  return rgbToHex(hslToRgb({ h: hue, s: sat, l }));
}

function backgroundFor(
  source: PortraitSource,
  overrides: Record<string, any> | undefined,
  skinHex: string,
  garmentHex: string | undefined
): BackgroundSpec {
  const provided = overrides?.background;
  const zone = source.culturalZone || 'EUROPEAN';
  const [base, accent] = ZONE_BACKGROUNDS[zone] || ZONE_BACKGROUNDS.EUROPEAN;
  return {
    // An explicitly supplied backdrop is still held to the contrast rule — the
    // authenticity service picks for place, not for legibility.
    base: separateFromFigure(provided?.base || base, skinHex, garmentHex, [0.17, 0.44]),
    // The accent only ever appears as a rake of light across the upper corner,
    // so it lives a band above the base rather than competing with it.
    accent: separateFromFigure(provided?.accent || accent, skinHex, garmentHex, [0.42, 0.62]),
    vignette: provided?.vignette ?? true,
    texture: provided?.texture || 'subtle',
  };
}

// ---------------------------------------------------------------------------
// Condition and mood
// ---------------------------------------------------------------------------

function buildCondition(source: PortraitSource): ConditionSpec {
  const health = source.health ?? 100;
  const maxHealth = source.maxHealth ?? 100;
  const fatigue = source.fatigue ?? 0;
  const maxFatigue = source.maxFatigue ?? 100;
  const healthRatio = clamp01(maxHealth > 0 ? health / maxHealth : 1);
  const fatigueRatio = clamp01(maxFatigue > 0 ? fatigue / maxFatigue : 0);

  const diseases = (source.diseaseHealth?.currentDiseases || [])
    .map(entry => (entry?.disease?.name || '').toLowerCase())
    .filter(Boolean);

  // Severity comes from what the illness *is*, not from how much health is
  // left. That distinction matters because the health figure barely moves: over
  // four hundred personas it ran 0.79 to 0.99, so the old ladder's `< 0.6` and
  // `< 0.35` rungs were unreachable and severity never once left 0 or 1 — even
  // though two personas in five are carrying something. A scraped knee and
  // tuberculosis both produced severity 1, and nobody ever looked ill.
  //
  // The disease *names* are the signal that was going unused, and they separate
  // cleanly. What a face shows is not how dangerous a thing is but how long it
  // has been draining you: a broken finger hurts more than worms this week and
  // shows less than worms this year.
  // Anything not on this list stays at severity 1, which is the right home for
  // both a sprained ankle and a name the table has not learned yet.
  const WASTING = /(worm|tubercul|consumption|malaria|ague|rickets|scurvy|typhoid|dysenter|cholera|plague|leprosy|syphilis|tularemia|quinsy|influenza|fever|pox|palsy|dropsy|gout|wasting|flux)/;
  const wasting = diseases.filter(name => WASTING.test(name)).length;

  let severity: 0 | 1 | 2 | 3 = 0;
  if (diseases.length > 0) severity = 1;
  if (wasting > 0) severity = 2;
  // Two chronic conditions at once, or one carried by someone already old
  // enough for it to be doing real damage.
  if (wasting > 1 || (wasting > 0 && ((source.age ?? 30) > 55 || healthRatio < 0.84))) severity = 3;

  const feverish = diseases.some(name =>
    /(fever|influenza|typhoid|malaria|pneumonia|infection|plague|smallpox|measles)/.test(name)
  );

  return {
    healthRatio,
    fatigueRatio,
    diseases,
    severity,
    pallor: clamp01((1 - healthRatio) * 0.8 + severity * 0.12),
    fever: feverish ? clamp01(0.35 + severity * 0.22) : clamp01((1 - healthRatio) * 0.25),
  };
}

function buildMood(source: PortraitSource, condition: ConditionSpec): MoodSpec {
  const personality = source.personality || {};
  const affect = String(source.appearance?.affect || 'neutral').toLowerCase();

  // Personality values are 0..1 in this codebase.
  const extraversion = personality.extraversion ?? 0.5;
  const agreeableness = personality.agreeableness ?? 0.5;
  const neuroticism = personality.neuroticism ?? 0.5;

  let valence = (agreeableness - 0.5) * 0.9 + (extraversion - 0.5) * 0.7 - (neuroticism - 0.5) * 0.8;
  let guarded = clamp01(0.5 - (agreeableness - 0.5) * 1.1 + (neuroticism - 0.5) * 0.6);
  let energy = clamp01(0.55 + (extraversion - 0.5) * 0.8);

  if (affect === 'friendly') { valence += 0.35; guarded -= 0.2; }
  if (affect === 'guarded') { valence -= 0.15; guarded += 0.3; }
  if (affect === 'anxious') { valence -= 0.25; energy += 0.1; guarded += 0.15; }
  if (affect === 'intimidating') { valence -= 0.3; guarded += 0.25; }

  // Illness and exhaustion read on the face before anything else does.
  valence -= condition.severity * 0.12 + condition.fatigueRatio * 0.2;
  energy -= condition.fatigueRatio * 0.45 + condition.severity * 0.12;

  return {
    valence: Math.max(-1, Math.min(1, valence)),
    energy: clamp01(energy),
    guarded: clamp01(guarded),
    disposition: dispositionFor(personality),
  };
}

/**
 * The handful of people whose personality shows on their face as something
 * more specific than cheerful or grim.
 *
 * Every threshold here is deliberately extreme, because this is meant to be a
 * face you notice once in a wall of forty rather than a fourth common mood.
 * `openness` and `conscientiousness` do the work, and both were being thrown
 * away — the adapter read three of the five traits the app generates, and the
 * two it ignored are precisely the two that distinguish a considering face
 * from a determined one. Valence cannot express either: a very curious person
 * is not happier than average, they simply look like they are thinking.
 *
 * Order is most-specific first, and each rule is written to be narrow rather
 * than to cover its trait's whole upper range.
 */
function dispositionFor(personality: {
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
}): Expression | null {
  const openness = personality.openness ?? 0.5;
  const conscientiousness = personality.conscientiousness ?? 0.5;
  const extraversion = personality.extraversion ?? 0.5;
  const agreeableness = personality.agreeableness ?? 0.5;
  const neuroticism = personality.neuroticism ?? 0.5;

  // Sly rather than merely disagreeable: curious, sociable, and not especially
  // interested in being liked.
  if (openness > 0.72 && agreeableness < 0.34 && extraversion > 0.55) return 'smirk';

  // Steady and driven, and untroubled enough to hold a course.
  if (conscientiousness > 0.86 && neuroticism < 0.42) return 'determined';

  // Turned inward. The low extraversion matters: without it this fires on
  // gregarious people who read as animated, not contemplative.
  if (openness > 0.82 && extraversion < 0.45) return 'thinking';

  // No `grin` rule, and not for want of trying. A grin needs high extraversion
  // and high agreeableness, and those two are most of what `valence` is built
  // from — so anyone who qualifies has already been caught by the `content`
  // branch above, which is checked first and rightly so. Every set of
  // thresholds that reached a grin also required a neuroticism low enough to
  // contradict itself. Content already owns that face; a second, louder
  // version of it is not worth an unreachable branch.
  return null;
}

// ---------------------------------------------------------------------------
// Attributes that show on a face
// ---------------------------------------------------------------------------

/**
 * Attributes that already have art, routed into the marking pipeline.
 *
 * `details.ts` has drawn scars, tattoos, scarification and birthmarks since it
 * was written — for `culturalMarkings`, which is a different source of the same
 * shapes. So most of this costs nothing but a mapping: a persona marked
 * `scarred` gets the scar that was always available to draw, and the audit's
 * existing marking coverage report picks it up for free.
 *
 * Location and size are chosen so the face still reads. A large marking on the
 * cheek is fine; the same marking across both eyes is how an earlier version of
 * this renderer buried eighty faces.
 */
const ATTRIBUTE_MARKINGS: Record<string, Omit<MarkingSpec, 'color'> & { color?: string }> = {
  scarred: { type: 'scar', location: 'cheek', size: 'medium', pattern: 'solid' },
  burn_scarred: { type: 'scar', location: 'jaw', size: 'large', pattern: 'burn' },
  scarified: { type: 'scarification', location: 'cheek', size: 'medium', pattern: 'scarification' },
  kin_tattoos: { type: 'tattoo', location: 'cheek', size: 'medium', pattern: 'lines' },
  birthmark_omen: { type: 'birthmark', location: 'temple', size: 'medium', pattern: 'solid' },
};

// ---------------------------------------------------------------------------
// Pose
// ---------------------------------------------------------------------------

const CANONICAL_POSE: PoseSpec = {
  scale: 1, offsetY: 0, chin: 0, tilt: 0, turn: 0,
  shoulderDrop: 0, hunch: 0, square: 0, reason: null,
};

/**
 * Which axes a signal is allowed to touch.
 *
 * A persona gets at most one signal per family, so two signals can never fight
 * over the same number. Without that, a `frail shy stooped` persona accumulates
 * three deviations that cancel into a fourth meaning nobody can read — which is
 * the failure mode that makes pose look like noise rather than information.
 */
type PoseFamily = 'size' | 'address' | 'carriage';

interface PoseSignal {
  /** The attribute id, or a predicate over the whole persona. */
  when: string | ((ids: Set<string>, build: Build, wealth: string) => boolean);
  /** What the audit calls this. Required for predicates, which have no id. */
  label?: string;
  family: PoseFamily;
  pose: Partial<PoseSpec>;
}

/**
 * Read in order. The first match becomes the persona's pose; the first match in
 * a *different* family may join it. Two is the cap — a portrait carrying three
 * simultaneous departures from the canonical bust stops reading as a person
 * held a certain way and starts reading as a mistake.
 *
 * The order is by how much the thing would actually have struck someone in the
 * room. A missing arm changes a silhouette more than a shy disposition does.
 */
const POSE_SIGNALS: PoseSignal[] = [
  // Carriage: bodies shaped by injury, work, or illness.
  { when: 'one_armed', family: 'carriage', pose: { shoulderDrop: 3, hunch: 0.2 } },
  { when: 'hunchback', family: 'carriage', pose: { hunch: 1, offsetY: 1 } },
  { when: 'weavers_stoop', family: 'carriage', pose: { hunch: 0.55 } },
  { when: 'lame', family: 'carriage', pose: { shoulderDrop: 2 } },
  { when: 'palsied', family: 'address', pose: { tilt: 2 } },

  // Size: how much of the frame this person takes up.
  { when: 'towering', family: 'size', pose: { scale: 1.07, offsetY: -2 } },
  { when: 'diminutive', family: 'size', pose: { scale: 0.93, offsetY: 2 } },
  { when: 'corpulent', family: 'size', pose: { scale: 1.04 } },
  { when: 'frail', family: 'size', pose: { scale: 0.95, offsetY: 1 } },

  // Strength and its absence, in the shoulders rather than the head.
  { when: 'strong', family: 'carriage', pose: { square: 0.85 } },
  { when: 'athletic', family: 'carriage', pose: { square: 0.6 } },
  { when: 'gaunt', family: 'carriage', pose: { square: -0.6 } },
  { when: 'consumptive', family: 'carriage', pose: { square: -0.7, hunch: 0.3 } },
  {
    when: (_ids, build) => build === 'imposing' || build === 'stocky',
    label: 'build:broad',
    family: 'carriage',
    pose: { square: 0.5 },
  },
  {
    when: (_ids, build) => build === 'slight',
    label: 'build:slight',
    family: 'carriage',
    pose: { square: -0.4 },
  },

  // Address: how they meet the viewer. Chin up is command, chin tucked is
  // wariness, and turning off-axis is refusal to be looked at straight.
  { when: 'proud', family: 'address', pose: { chin: -2 } },
  { when: 'coward', family: 'address', pose: { chin: 2, turn: -2 } },
  { when: 'crowd_averse', family: 'address', pose: { chin: 1, turn: -2 } },
  { when: 'shy', family: 'address', pose: { chin: 2, turn: -1 } },
  { when: 'brave', family: 'address', pose: { chin: -1 } },
  { when: 'loner', family: 'address', pose: { turn: -2 } },
  { when: 'taciturn', family: 'address', pose: { turn: -1 } },
  { when: 'cunning', family: 'address', pose: { turn: 2 } },
  { when: 'humble', family: 'address', pose: { chin: 1 } },
  { when: 'curious', family: 'address', pose: { tilt: 3 } },
  { when: 'dreamer', family: 'address', pose: { tilt: 3, chin: -1 } },

  // The sitter's own century had a convention for this, and it is the one place
  // where status rather than body decides how a head is held.
  {
    when: (_ids, _build, wealth) => wealth === 'noble',
    label: 'noble',
    family: 'address',
    pose: { chin: -1 },
  },
];

function buildPose(ids: Set<string>, build: Build, wealth: string): PoseSpec {
  const fires = (signal: PoseSignal) =>
    typeof signal.when === 'string' ? ids.has(signal.when) : signal.when(ids, build, wealth);

  const primary = POSE_SIGNALS.find(fires);
  if (!primary) return CANONICAL_POSE;

  const secondary = POSE_SIGNALS.find(s => s.family !== primary.family && fires(s));
  const label = (signal: PoseSignal) =>
    signal.label ?? (typeof signal.when === 'string' ? signal.when : signal.family);

  // Added rather than assigned. The families own an axis each *mostly* — a
  // hunched back also drops the whole figure a pixel, which is a size axis —
  // and spreading the second signal over the first would silently discard
  // whichever of them wrote that number second.
  const pose = { ...CANONICAL_POSE };
  for (const part of secondary ? [primary.pose, secondary.pose] : [primary.pose]) {
    pose.scale *= part.scale ?? 1;
    pose.offsetY += part.offsetY ?? 0;
    pose.chin += part.chin ?? 0;
    pose.tilt += part.tilt ?? 0;
    pose.turn += part.turn ?? 0;
    pose.shoulderDrop += part.shoulderDrop ?? 0;
    pose.hunch += part.hunch ?? 0;
    pose.square += part.square ?? 0;
  }
  pose.hunch = Math.min(1, pose.hunch);
  pose.square = Math.max(-1, Math.min(1, pose.square));
  pose.reason = secondary ? `${label(primary)}+${label(secondary)}` : label(primary);
  return pose;
}

function buildFaceTraits(ids: Set<string>): FaceTraits {
  return {
    gaunt: ids.has('gaunt') || ids.has('frail'),
    poxScarred: ids.has('pox_scarred'),
    toothless: ids.has('toothless'),
    blind: ids.has('blind'),
  };
}

/** The resting face a persona wears when nothing else is driving it. */
export function restingExpression(mood: MoodSpec, condition: ConditionSpec): Expression {
  // Illness, and illness only. Fatigue used to share this test at `> 0.7`,
  // against a value whose measured range across eight hundred personas is
  // 0.04–0.20 with a mean of 0.15 — so it never fired at all. Moving the bound
  // into the real band did not fix it either: at 0.18 it caught a third of the
  // population, because that range is not a spread so much as a cluster with a
  // little noise on it. A signal with no dynamic range cannot be thresholded
  // into a meaningful minority, and pretending otherwise just relocates the
  // bug. Fatigue still tells on the face through pallor and through the drag
  // it puts on valence and energy; it no longer decides this.
  if (condition.severity >= 2) return 'weary';

  // The strong moods keep their faces. A disposition never overrides someone
  // who is plainly delighted or plainly furious — it is a tie-breaker for the
  // large middle of the population, which is where the dull faces were.
  if (mood.valence > 0.42) return 'content';
  if (mood.valence < -0.42) return mood.guarded > 0.6 ? 'scowl' : 'sad';
  if (mood.disposition) return mood.disposition;
  if (mood.guarded > 0.68) return 'guarded';
  if (mood.valence > 0.18) return 'content';
  if (mood.valence < -0.18) return 'concern';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

export function buildPortraitSpec(source: PortraitSource): PortraitSpec {
  const overrides = source.portraitVisualOverrides;
  const appearance = { ...(source.appearance || {}), ...(overrides?.appearance || {}) };

  const seed =
    source.portraitSeed ??
    hashString(
      `${source.name ?? ''}|${source.age ?? 30}|${source.gender ?? 'Male'}|${appearance.skinColor ?? ''}|${source.profession ?? ''}`
    );

  const age = source.age ?? 30;
  const genderRaw = String(source.gender || 'Male');
  const gender = (genderRaw === 'Female' || genderRaw === 'Non-binary' ? genderRaw : 'Male') as PortraitSpec['gender'];
  const wealth = (source.wealthLevel || 'modest') as PortraitSpec['wealth'];
  const ornamentBase = WEALTH_ORNAMENT[wealth] ?? 0.2;

  // --- hair colour, greyed by age ------------------------------------------
  const baseHair = appearance.hairColor || '#4b2f21';
  // Greying is near-universal by the sixties and well underway through the
  // fifties; the old curve left too many fifty-somethings with the hair colour
  // they had at twenty.
  let grayAmount = 0;
  if (age > 66) grayAmount = 0.7 + unit(seed, 'gray-old') * 0.3;
  else if (age > 54) grayAmount = 0.22 + unit(seed, 'gray-late') * 0.4;
  else if (age > 44) grayAmount = 0.12 + unit(seed, 'gray-mid') * 0.38;
  else if (age > 33) grayAmount = unit(seed, 'gray-early') > 0.62 ? 0.06 + unit(seed, 'gray-amt') * 0.14 : 0;
  const hairColor = grayAmount > 0.01
    ? rgbToHex(mixRgb(hexToRgb(baseHair), hexToRgb('#b7b2ab'), grayAmount))
    : baseHair;

  const recession =
    gender === 'Male' && age > 30
      ? clamp01(((age - 30) / 45) * (0.4 + unit(seed, 'recede') * 0.9))
      : 0;

  // --- hair arrangement -----------------------------------------------------
  // The style name and the length are generated independently upstream, so they
  // can contradict each other: `getHairstyle` will happily hand a bun to a
  // persona whose `hairLength` is `very_short`. Rather than drop the style —
  // which is the more specific and more interesting of the two facts — let the
  // arrangement pull the length up to whatever it needs to exist.
  const rawHairLength: HairLength = appearance.hairLength || 'short';
  const rawStyle = String(appearance.hairstyle || '');
  const classified = classifyHairstyleName(rawStyle);

  const LENGTH_ORDER: HairLength[] = ['bald', 'very_short', 'short', 'medium', 'long', 'very_long'];
  /** The shortest length at which an arrangement is physically possible. */
  const MINIMUM_LENGTH: Partial<Record<HairSilhouette, HairLength>> = {
    bun: 'medium', top_knot: 'medium', twin_buns: 'medium', updo: 'medium',
    ponytail: 'medium', braid_single: 'long', braid_twin: 'long',
    braid_crown: 'medium', locs: 'medium', tied_back: 'medium',
    bob: 'medium', bowl: 'short', cornrows: 'very_short',
  };

  let hairSilhouette: HairSilhouette = classified.silhouette;
  let hairLength = rawHairLength;

  if (rawHairLength === 'bald') {
    // Nothing to arrange. A tonsure is the one exception: it *is* a bald crown,
    // and it is the reading a shaved-crown style is after.
    hairSilhouette = hairSilhouette === 'tonsure' ? 'tonsure' : 'loose';
  } else {
    const needed = MINIMUM_LENGTH[hairSilhouette];
    if (needed && LENGTH_ORDER.indexOf(rawHairLength) < LENGTH_ORDER.indexOf(needed)) {
      hairLength = needed;
    }
  }

  // A heavily receded hairline cannot support anything that gathers at the
  // front or frames the face; it can still carry a knot at the back.
  if (recession > 0.55 && (hairSilhouette === 'bangs' || hairSilhouette === 'bowl' || hairSilhouette === 'braid_twin')) {
    hairSilhouette = 'loose';
  }

  // --- garment --------------------------------------------------------------
  const garmentPiece: Piece =
    (overrides?.garment as Piece) ||
    (source.equippedItems?.torso as Piece) ||
    (appearance.garment as Piece) ||
    {};

  const palette = {
    ...(appearance.palette || {}),
    ...(overrides?.palette || {}),
  };

  const garmentKind: GarmentKind =
    (overrides?.garmentKind as GarmentKind) ||
    classify(`${garmentPiece.name || ''} ${garmentPiece.material || ''}`, GARMENT_KEYWORDS, 'tunic');

  const garment: GarmentSpec = {
    kind: isEmptyPiece(garmentPiece) && !palette.primary ? 'tunic' : garmentKind,
    name: garmentPiece.name || 'Simple Garment',
    material: (garmentPiece.material || 'wool').toLowerCase(),
    colors: separateGarmentColors(
      // An intrinsic material outranks whatever colour the generator picked.
      // Straw is the colour of straw; leather is the colour of leather. The
      // old precedence let a generated palette entry paint a sedge sunhat
      // lilac and a bark-cloth wrap sky blue.
      intrinsicColorFor(garmentPiece.material)
        || resolveColor(garmentPiece.color) || colorFromName(garmentPiece.name)
        || resolveColor(palette.primary) || '#7c6a54',
      resolveColor(palette.secondary) || '#9a8768',
      resolveColor(palette.accent) || '#a8834f'
    ),
    ornament: ornamentBase,
    surfaces: garmentSurfacesFor(
      garmentPiece.name || '', garmentPiece.material || '', ornamentBase).surfaces,
  };

  // --- headwear -------------------------------------------------------------
  const headPiece: Piece | null =
    (overrides?.headgear as Piece) ||
    (source.equippedItems?.head as Piece) ||
    (appearance.headgear as Piece) ||
    null;

  const explicitKind = overrides?.headgearKind as HeadwearKind | undefined;
  let headwear: HeadwearSpec | null = null;
  if (explicitKind === 'none') {
    headwear = null;
  } else if (!isEmptyPiece(headPiece) || explicitKind) {
    const name = headPiece?.name || 'Cap';
    const kind = explicitKind || classify(`${name} ${headPiece?.material || ''}`, HEADWEAR_KEYWORDS, 'cap');
    headwear = kind === 'none' ? null : {
      kind,
      name,
      material: (headPiece?.material || 'cloth').toLowerCase(),
      color: intrinsicColorFor(headPiece?.material)
        || resolveColor(headPiece?.color) || colorFromName(name)
        || colorForMaterial(headPiece?.material)
        || resolveColor(palette.secondary) || '#5c5347',
      accent: resolveColor(palette.accent) || '#a8834f',
      ornament: ornamentBase,
      ornaments: ornamentsFor(name, headPiece?.material || '', ornamentBase).ornaments,
    };
  }

  // --- everything else ------------------------------------------------------
  const condition = buildCondition(source);
  const mood = buildMood(source, condition);

  // --- attributes that show on a face ---------------------------------------
  const attributeIds = new Set(
    (source.attributes || [])
      .map(entry => String(entry?.id || ''))
      .filter(Boolean)
  );
  const traits = buildFaceTraits(attributeIds);
  const attributeMarkings: MarkingSpec[] = [];
  for (const [id, marking] of Object.entries(ATTRIBUTE_MARKINGS)) {
    if (!attributeIds.has(id)) continue;
    attributeMarkings.push({
      ...marking,
      // Scars and healed tissue read as a shade of the persona's own skin
      // rather than as a colour of their own; the drawing code shifts against
      // whatever is underneath, so this is mostly a fallback for the cases
      // that do paint.
      color: marking.color || (marking.type === 'tattoo' ? '#2f3a44' : appearance.skinColor || '#c58f68'),
    } as MarkingSpec);
  }

  const facialHairWanted =
    gender !== 'Female' && Boolean(appearance.facialHair) && age >= 15;

  const markings = attributeMarkings.length
    ? [...((appearance.markings || []) as MarkingSpec[]), ...attributeMarkings]
    : (appearance.markings || []) as MarkingSpec[];

  return {
    seed,
    gender,
    age,

    skinColor: appearance.skinColor || '#c58f68',
    hairColor,
    eyeColor: appearance.eyeColor || '#4b3a2a',
    lipColor: appearance.lipColor,

    faceShape: appearance.faceShape || 'oval',
    jawline: appearance.jawline || (gender === 'Female' ? 'soft' : 'square'),
    cheekbones: appearance.cheekbones || 'average',
    eyeShape: appearance.eyeShape || 'almond',
    noseShape: appearance.noseShape || 'straight',
    lipShape: appearance.lipShape || 'medium',
    browShape: appearance.eyebrowShape || 'straight',
    browThickness: appearance.eyebrowThickness || 'medium',
    eyelashes: appearance.eyelashes || 'medium',

    hairLength: hairLength,
    hairTexture: appearance.hairTexture || 'straight',
    hairstyle: appearance.hairstyle || 'short',
    hairSilhouette,
    grayAmount,
    recession,

    facialHair: facialHairWanted
      ? {
          style: appearance.facialHairStyle || 'stubble',
          thickness: appearance.facialHairThickness || 'medium',
        }
      : null,

    build: (appearance.build || 'average') as Build,
    ageLines: clamp01((age - 26) / 46),
    lidDroop: clamp01((age - 44) / 32),

    garment,
    headwear,
    jewelry: (appearance.jewelry || []) as JewelrySpec[],
    markings,
    skull: skullShapeFrom(markings),
    dental: dentalWorkFrom(markings),
    pose: buildPose(attributeIds, (appearance.build || 'average') as Build, wealth),
    glasses: appearance.hasGlasses ? { style: appearance.glassesStyle || 'round' } : null,

    condition,
    traits,
    mood,
    // The garment's primary is what actually fills the lower two-thirds of the
    // frame, so it constrains the backdrop alongside the complexion.
    background: backgroundFor(
      source, overrides, appearance.skinColor || '#c58f68', garment.colors.primary),

    contextPackId: overrides?.contextPackId,
    culturalZone: source.culturalZone,
    era: source.era,
    wealth,
  };
}

/**
 * Modification that has to leave the marking list to be drawn at all.
 *
 * Both of these arrive from `culturalMarkings.ts` as `structural` markings with
 * a pattern string, and both were falling through every case in the drawing
 * code, because neither is something you can stamp onto a finished face: one is
 * a different skull and the other is only visible if the mouth opens. Reading
 * them here turns them into anatomy and into a mouth pose instead.
 */
function skullShapeFrom(markings: MarkingSpec[]): SkullShape {
  for (const marking of markings) {
    const pattern = marking.pattern || '';
    if (/cranial_elongation|elongat/.test(pattern)) return 'elongated';
  }
  return 'natural';
}

function dentalWorkFrom(markings: MarkingSpec[]): DentalWork | null {
  for (const marking of markings) {
    const pattern = marking.pattern || '';
    if (pattern === 'teeth_black') return { style: 'blackened', color: '#14100f' };
    if (pattern === 'teeth_filed') return { style: 'filed', color: '#e8e0d0' };
    if (pattern === 'teeth_inlay') return { style: 'inlay', color: marking.color || '#4f9d7a' };
  }
  return null;
}

/** Map the app's expression vocabulary onto the renderer's. */
export function normalizeExpression(name: string | null | undefined): Expression | null {
  if (!name) return null;
  switch (name) {
    case 'smile': return 'smile';
    case 'approve': return 'grin';
    case 'excited': return 'grin';
    case 'smirk': return 'smirk';
    case 'sad': return 'sad';
    case 'concern': return 'concern';
    case 'scowl': return 'scowl';
    case 'annoyed': return 'scowl';
    case 'angry': return 'scowl';
    case 'tired': return 'weary';
    case 'surprise': return 'surprise';
    case 'confused': return 'thinking';
    case 'thinking': return 'thinking';
    case 'skeptical': return 'guarded';
    case 'determined': return 'determined';
    case 'neutral': return 'neutral';
    default: return null;
  }
}
