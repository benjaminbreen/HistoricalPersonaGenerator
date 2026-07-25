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
import { hexToRgb, mixRgb, rgbToHex } from '../core/color';
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
  personality?: Record<string, number>;
  stats?: Record<string, number>;
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

const GARMENT_KEYWORDS: Array<[RegExp, GarmentKind]> = [
  [/(robe|kaftan|caftan|jama|hanfu|cassock|habit|abaya|thobe|dishdasha|boubou)/i, 'robe'],
  [/(gown|dress|kirtle|frock|sari|saree|lehenga)/i, 'gown'],
  [/(doublet|jerkin|waistcoat|bodice|breastplate|surcoat|tabard)/i, 'doublet'],
  [/(coat|jacket|suit|blazer|overcoat|parka|anorak|chapan)/i, 'jacket'],
  [/(wrap|wrapper|sarong|pagne|barkcloth|bark cloth|drape|toga|himation|shawl|mantle|blanket|lavalava|kain)/i, 'wrapped_garment'],
  [/(shirt|blouse|smock|chemise|shift|tee|kurta top)/i, 'work_shirt'],
  [/(tunic|kurta|chiton|dashiki|kaross)/i, 'tunic'],
  [/(bare|none|naked|nude)/i, 'bare'],
];

const HEADWEAR_KEYWORDS: Array<[RegExp, HeadwearKind]> = [
  [/(veil|wimple|mantilla|dupatta|niqab|chador)/i, 'veil'],
  [/(hood|cowl|capuche)/i, 'hood'],
  [/(helmet|helm|casque|morion|sallet|kabuto)/i, 'helmet'],
  [/(crown|circlet|diadem|coronet|tiara)/i, 'coronet'],
  [/(turban|headcloth|head cloth|headwrap|head wrap|gele|keffiyeh|shemagh|pagri|scarf|kerchief|tignon)/i, 'wrapped_cloth'],
  [/(cap|coif|bonnet|kufi|taqiyah|biretta|skullcap|futou|headband|fillet|beret|toque)/i, 'cap'],
  [/(brim|tricorn|bicorne|sombrero|straw|petasos|boater|bowler|top hat|wide[- ]?hat|conical|douli|hat)/i, 'brimmed_hat'],
];

function classify<T>(name: string, table: Array<[RegExp, T]>, fallback: T): T {
  for (const [pattern, value] of table) {
    if (pattern.test(name)) return value;
  }
  return fallback;
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
  [/barkcloth|bark cloth|fibre|fiber|plant/i, '#a98a63'],
];

function colorForMaterial(material: string | undefined): string | null {
  if (!material) return null;
  for (const [pattern, color] of MATERIAL_COLORS) {
    if (pattern.test(material)) return color;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

const ZONE_BACKGROUNDS: Record<string, [string, string]> = {
  EUROPEAN: ['#5a6b70', '#8c9689'],
  MENA: ['#7d6a4f', '#b39b6e'],
  SOUTH_ASIAN: ['#6b5a70', '#a08462'],
  EAST_ASIAN: ['#57685f', '#8a9280'],
  SUB_SAHARAN_AFRICAN: ['#7a5a44', '#b0885c'],
  NORTH_AMERICAN_PRE_COLUMBIAN: ['#6c6350', '#9d8f6c'],
  NORTH_AMERICAN_COLONIAL: ['#5d6357', '#8d8b70'],
  SOUTH_AMERICAN: ['#5f6a52', '#96936a'],
  OCEANIA: ['#4d6b6b', '#83a08c'],
};

function backgroundFor(
  source: PortraitSource,
  overrides: Record<string, any> | undefined
): BackgroundSpec {
  const provided = overrides?.background;
  const zone = source.culturalZone || 'EUROPEAN';
  const [base, accent] = ZONE_BACKGROUNDS[zone] || ZONE_BACKGROUNDS.EUROPEAN;
  return {
    base: provided?.base || base,
    accent: provided?.accent || accent,
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
  let grayAmount = 0;
  if (age > 62) grayAmount = 0.55 + unit(seed, 'gray-old') * 0.4;
  else if (age > 46) grayAmount = unit(seed, 'gray-mid') > 0.45 ? 0.18 + unit(seed, 'gray-amt') * 0.4 : 0.05;
  else if (age > 35) grayAmount = unit(seed, 'gray-early') > 0.8 ? 0.12 : 0;
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
      primary: garmentPiece.color || palette.primary || '#7c6a54',
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
    headwear = {
      kind: explicitKind || classify(`${name} ${headPiece?.material || ''}`, HEADWEAR_KEYWORDS, 'cap'),
      name,
      material: (headPiece?.material || 'cloth').toLowerCase(),
      color: headPiece?.color || colorForMaterial(headPiece?.material) || palette.secondary || '#5c5347',
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

    garment,
    headwear,
    jewelry: (appearance.jewelry || []) as JewelrySpec[],
    markings: (appearance.markings || []) as MarkingSpec[],
    glasses: appearance.hasGlasses ? { style: appearance.glassesStyle || 'round' } : null,

    condition,
    mood,
    background: backgroundFor(source, overrides),

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
