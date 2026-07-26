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
import { hasIntrinsicColor } from '../../../constants/gameData/colorNames';
import {
  BackgroundSpec,
  Build,
  ConditionSpec,
  Expression,
  GarmentKind,
  GarmentSpec,
  HeadwearKind,
  HeadwearSpec,
  JewelrySpec,
  MarkingSpec,
  MoodSpec,
  PortraitSpec,
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
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
  };
  /** Accepted from callers and ignored — nothing here is drawn from stats. */
  stats?: object;
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
  [/(circlet|band|fillet|wreath|garland|ornament|passa|jadai|chaplet|hairpin|hair pin|comb|hair flower|laurel|tikka|patti|rakhdi|fascinator|hairpiece|bindi)/i, 'band'],
  [/(turban|headcloth|head cloth|headwrap|head wrap|head tie|gele|keffiyeh|shemagh|pagri|scarf|kerchief|tignon|wrap|duku|gele)/i, 'wrapped_cloth'],
  // Fur headgear is soft and brimless. This has to precede the generic `hat`
  // rule below, or a "Fur Hat" picks up a stiff felt brim.
  [/(fur|pelt|shearling|astrakhan|ushanka|papakha|sheepskin|fox tail)/i, 'cap'],
  [/(cap|coif|bonnet|kufi|taqiyah|biretta|skullcap|futou|beret|toque|fez|tarboosh|hennin|topi|snapback|beanie|biggins|kofia|mitre|songkok)/i, 'cap'],
  // `dou li` is written with a space in the item data, so the old `douli`
  // spelling never matched and those hats fell through to the `cap` fallback.
  [/(brim|tricorn|bicorne|sombrero|straw|petasos|boater|bowler|fedora|homburg|visor|top hat|wide[- ]?hat|conical|dou ?li|bamboo|sedge|sugegasa|kasa|salakot|non la|cheese-cutter|hat)/i, 'brimmed_hat'],
];

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

  let severity: 0 | 1 | 2 | 3 = 0;
  if (diseases.length > 0) severity = 1;
  if (diseases.length > 0 && healthRatio < 0.6) severity = 2;
  if (diseases.length > 1 || healthRatio < 0.35) severity = 3;

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
  };
}

/** The resting face a persona wears when nothing else is driving it. */
export function restingExpression(mood: MoodSpec, condition: ConditionSpec): Expression {
  if (condition.severity >= 2 || condition.fatigueRatio > 0.7) return 'weary';
  if (mood.valence > 0.42) return 'content';
  if (mood.valence < -0.42) return mood.guarded > 0.6 ? 'scowl' : 'sad';
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
    colors: {
      // An intrinsic material outranks whatever colour the generator picked.
      // Straw is the colour of straw; leather is the colour of leather. The
      // old precedence let a generated palette entry paint a sedge sunhat
      // lilac and a bark-cloth wrap sky blue.
      primary: intrinsicColorFor(garmentPiece.material)
        || garmentPiece.color || palette.primary || '#7c6a54',
      secondary: palette.secondary || '#9a8768',
      accent: palette.accent || '#a8834f',
    },
    ornament: ornamentBase,
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
        || headPiece?.color || colorForMaterial(headPiece?.material) || palette.secondary || '#5c5347',
      accent: palette.accent || '#a8834f',
      ornament: ornamentBase,
    };
  }

  // --- everything else ------------------------------------------------------
  const condition = buildCondition(source);
  const mood = buildMood(source, condition);

  const facialHairWanted =
    gender !== 'Female' && Boolean(appearance.facialHair) && age >= 15;

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

    hairLength: appearance.hairLength || 'short',
    hairTexture: appearance.hairTexture || 'straight',
    hairstyle: appearance.hairstyle || 'short',
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
    markings: (appearance.markings || []) as MarkingSpec[],
    glasses: appearance.hasGlasses ? { style: appearance.glassesStyle || 'round' } : null,

    condition,
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
