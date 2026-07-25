/**
 * portraitLab/fixtures.ts
 *
 * Deterministic test personas covering the axes that actually break portraits:
 * complexion range, hair texture, age, headwear occlusion, and each of the five
 * deeply-treated context packs. Shared by the command-line contact sheet and by
 * the in-app A/B lab so both are looking at exactly the same characters.
 */

import { PortraitSource } from './spec/buildSpec';

const baseStats = { strength: 5, intelligence: 5, charisma: 5, constitution: 5 };

const basePersonality = {
  openness: 0.5, conscientiousness: 0.5, extraversion: 0.5,
  agreeableness: 0.5, neuroticism: 0.5,
};

const baseAppearance = {
  skinColor: '#c58f68',
  hairColor: '#4b2f21',
  eyeColor: '#4b3a2a',
  hairstyle: 'short',
  build: 'average',
  faceShape: 'oval',
  eyeShape: 'almond',
  noseShape: 'straight',
  cheekbones: 'average',
  jawline: 'soft',
  hairTexture: 'straight',
  hairLength: 'short',
  facialHair: false,
  skinTone: 'medium',
  skinTexture: 'smooth',
  eyebrowShape: 'straight',
  eyebrowThickness: 'medium',
  eyelashes: 'medium',
  lipShape: 'medium',
  affect: 'neutral',
  height: 170,
  weight: 68,
  garment: { name: 'Simple Tunic', material: 'linen' },
  headgear: { name: 'None', material: 'none' },
  footwear: { name: 'Leather Shoes', material: 'leather' },
  palette: { primary: '#746b5b', secondary: '#8f8068', accent: '#a77f4f' },
};

export interface Fixture {
  name: string;
  note: string;
  character: PortraitSource;
}

function make(
  name: string,
  note: string,
  seed: number,
  overrides: Partial<PortraitSource> & { appearance?: Record<string, any> } = {}
): Fixture {
  const { appearance, ...rest } = overrides;
  return {
    name,
    note,
    character: {
      name,
      age: 34,
      gender: 'Male',
      health: 100,
      maxHealth: 100,
      fatigue: 0,
      maxFatigue: 100,
      wealthLevel: 'modest',
      era: 'MEDIEVAL',
      culturalZone: 'EUROPEAN',
      profession: 'Labourer',
      portraitSeed: seed,
      stats: baseStats,
      personality: basePersonality,
      appearance: { ...baseAppearance, ...(appearance || {}) },
      ...rest,
    },
  };
}

/** The complexion and hair-texture range the app actually generates. */
export const complexionFixtures: Fixture[] = [
  make('Fair · straight', 'European palette, wavy medium hair', 101, {
    appearance: { skinColor: '#f0d3b8', hairColor: '#8b5a2b', eyeColor: '#4169e1', hairTexture: 'wavy', hairLength: 'medium' },
  }),
  make('Olive · curly', 'Mediterranean palette, curly hair, aquiline nose', 102, {
    culturalZone: 'MENA',
    appearance: { skinColor: '#c99a72', hairColor: '#241a15', eyeColor: '#2c1810', hairTexture: 'curly', noseShape: 'aquiline', eyebrowThickness: 'thick' },
  }),
  make('Deep · coily', 'Sub-Saharan palette, coily hair, broad nose', 103, {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    gender: 'Female',
    appearance: { skinColor: '#4a3018', hairColor: '#0a0a0a', eyeColor: '#1a1410', hairTexture: 'coily', hairLength: 'medium', noseShape: 'broad', lipShape: 'full' },
  }),
  make('Deep · kinky', 'Very dark palette — checks shadow chroma, not just value', 104, {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    appearance: { skinColor: '#2d1b0f', hairColor: '#0a0a0a', eyeColor: '#1a1410', hairTexture: 'kinky', hairLength: 'short', noseShape: 'broad', cheekbones: 'high' },
  }),
  make('Tan · straight', 'East Asian palette, narrow eyes, straight black hair', 105, {
    culturalZone: 'EAST_ASIAN',
    gender: 'Female',
    appearance: { skinColor: '#deb887', hairColor: '#0f0f0f', eyeColor: '#2c1810', eyeShape: 'narrow', faceShape: 'round', hairLength: 'long', lipShape: 'bow' },
  }),
  make('Brown · wavy', 'South Asian palette, long wavy hair, full lips', 106, {
    culturalZone: 'SOUTH_ASIAN',
    gender: 'Female',
    appearance: { skinColor: '#8d5524', hairColor: '#1a0a05', eyeColor: '#2c1810', hairTexture: 'wavy', hairLength: 'very_long', lipShape: 'full', eyelashes: 'long' },
  }),
];

/** Age is the axis most procedural portraits fail: this is the check. */
export const ageFixtures: Fixture[] = [
  make('Age 12', 'Larger cranium, no age lines', 201, { age: 12, appearance: { hairLength: 'short' } }),
  make('Age 24', 'Baseline adult', 202, { age: 24 }),
  make('Age 44', 'Early lines, occasional grey', 203, { age: 44, appearance: { facialHair: true, facialHairStyle: 'full_beard' } }),
  make('Age 62', 'Grey, receded, nasolabial folds', 204, { age: 62, appearance: { facialHair: true, facialHairStyle: 'verdi' } }),
  make('Age 78', 'Heavy lines, jowls, thin hair', 205, { age: 78, appearance: { hairLength: 'very_short' } }),
  make('Age 68 · female', 'Ageing without a beard to hide behind', 206, {
    age: 68, gender: 'Female', appearance: { hairLength: 'medium', hairColor: '#6b6b6b' },
  }),
];

export const featureFixtures: Fixture[] = [
  make('Nose · straight', 'Baseline', 301),
  make('Nose · aquiline', 'Convex bridge', 302, { appearance: { noseShape: 'aquiline' } }),
  make('Nose · roman', 'Strong straight bridge', 303, { appearance: { noseShape: 'roman' } }),
  make('Nose · broad', 'Wide base and nostrils', 304, { appearance: { noseShape: 'broad' } }),
  make('Nose · button', 'Short and upturned', 305, { appearance: { noseShape: 'button' } }),
  make('Eyes · round', 'Full iris, sclera above and below', 306, { appearance: { eyeShape: 'round' } }),
  make('Eyes · narrow', 'Lid crops the iris; inner fold', 307, { appearance: { eyeShape: 'narrow' } }),
  make('Eyes · hooded', 'Heavy upper fold', 308, { appearance: { eyeShape: 'hooded' } }),
  make('Face · long', 'Tall skull, narrow', 309, { appearance: { faceShape: 'long', jawline: 'sharp' } }),
  make('Face · round', 'Short skull, wide jaw', 310, { appearance: { faceShape: 'round', jawline: 'round' } }),
  make('Face · square', 'Heavy jaw', 311, { appearance: { faceShape: 'square', jawline: 'square' } }),
  make('Face · heart', 'Wide temples, narrow chin', 312, { appearance: { faceShape: 'heart' } }),
];

export const expressionFixtures: Fixture[] = [
  make('Cheerful', 'High agreeableness and extraversion', 401, {
    personality: { ...basePersonality, agreeableness: 0.92, extraversion: 0.88, neuroticism: 0.15 },
    appearance: { ...baseAppearance, affect: 'friendly' },
  }),
  make('Guarded', 'Low agreeableness', 402, {
    personality: { ...basePersonality, agreeableness: 0.08, neuroticism: 0.7 },
    appearance: { ...baseAppearance, affect: 'guarded' },
  }),
  make('Anxious', 'High neuroticism', 403, {
    personality: { ...basePersonality, neuroticism: 0.95, extraversion: 0.2 },
    appearance: { ...baseAppearance, affect: 'anxious' },
  }),
  make('Exhausted', 'Fatigue drives the resting face', 404, { fatigue: 88 }),
  make('Ill · smallpox', 'Pallor, pocks, sunken eyes', 405, {
    health: 40,
    diseaseHealth: { currentDiseases: [{ disease: { name: 'Smallpox' } }] },
  }),
  make('Ill · plague', 'Severe: neck darkening and pallor', 406, {
    health: 28,
    diseaseHealth: { currentDiseases: [{ disease: { name: 'Bubonic Plague' } }] },
  }),
];

/** The five context packs given bespoke garment and headwear treatment. */
export const contextFixtures: Fixture[] = [
  make('London 1740 · woman', 'Linen coif and crossed kerchief', 501, {
    gender: 'Female',
    era: 'RENAISSANCE_EARLY_MODERN',
    profession: 'Washerwoman',
    appearance: { ...baseAppearance, skinColor: '#e8c5a0', hairColor: '#6b4423', hairLength: 'medium' },
    portraitVisualOverrides: {
      contextPackId: 'old_bailey_london_1674_1800',
      garmentKind: 'gown',
      headgearKind: 'cap',
      garment: { name: 'Plain Wool Work Gown', material: 'wool', color: '#67584b' },
      headgear: { name: 'Plain Linen Coif', material: 'linen', color: '#ddd5c3' },
      palette: { primary: '#625649', secondary: '#ddd5c3', accent: '#9a7953' },
      background: { base: '#4e5a5e', accent: '#8b8f80' },
    },
  }),
  make('London 1740 · man', 'Wool coat, neckcloth, felt cap', 502, {
    era: 'RENAISSANCE_EARLY_MODERN',
    profession: 'Porter',
    appearance: { ...baseAppearance, skinColor: '#e0bb9a', hairColor: '#3b2a1c', facialHair: true, facialHairStyle: 'stubble' },
    portraitVisualOverrides: {
      contextPackId: 'old_bailey_london_1674_1800',
      garmentKind: 'work_shirt',
      headgearKind: 'cap',
      garment: { name: 'Coarse Wool Jacket and Linen Shirt', material: 'wool', color: '#5d5548' },
      headgear: { name: 'Felt Work Cap', material: 'felt', color: '#4a4540' },
      palette: { primary: '#625649', secondary: '#cfc6b2', accent: '#9a7953' },
      background: { base: '#4e5a5e', accent: '#8b8f80' },
    },
  }),
  make('Ming China · scholar', 'Cross-collar silk robe, black scholar cap', 503, {
    culturalZone: 'EAST_ASIAN',
    era: 'RENAISSANCE_EARLY_MODERN',
    profession: 'Magistrate',
    wealthLevel: 'wealthy',
    appearance: {
      ...baseAppearance, skinColor: '#e8c5a0', hairColor: '#0f0f0f', eyeShape: 'narrow',
      facialHair: true, facialHairStyle: 'goatee', hairLength: 'medium',
    },
    portraitVisualOverrides: {
      contextPackId: 'china_ming_1368_1650',
      garmentKind: 'robe',
      headgearKind: 'cap',
      garment: { name: 'Fine Long-Sleeved Silk Robe', material: 'silk', color: '#5a4b63' },
      headgear: { name: 'Black Scholar Cap', material: 'cloth', color: '#252522' },
      palette: { primary: '#4f5f59', secondary: '#66566b', accent: '#8a5548' },
      background: { base: '#4f5f57', accent: '#8a9280' },
    },
  }),
  make('Sahel 1350 · weaver', 'Narrow-strip woven robe, wrapped headcloth', 504, {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    era: 'MEDIEVAL',
    profession: 'Weaver',
    appearance: {
      ...baseAppearance, skinColor: '#4a3018', hairColor: '#0a0a0a', eyeColor: '#1a1410',
      hairTexture: 'coily', hairLength: 'short', noseShape: 'broad', lipShape: 'full',
    },
    portraitVisualOverrides: {
      contextPackId: 'sahel_medieval_700_1600',
      garmentKind: 'robe',
      headgearKind: 'wrapped_cloth',
      garment: { name: 'Fine Narrow-Strip Woven Robe', material: 'cotton', color: '#40516a' },
      headgear: { name: 'Wrapped Headcloth', material: 'cotton', color: '#a98258' },
      palette: { primary: '#40516a', secondary: '#b79868', accent: '#596052' },
      background: { base: '#7a5a44', accent: '#c09a63' },
    },
  }),
  make('Mughal 1620 ·官', 'Jama with a side closure, muslin turban', 505, {
    culturalZone: 'SOUTH_ASIAN',
    era: 'RENAISSANCE_EARLY_MODERN',
    profession: 'Scribe',
    wealthLevel: 'wealthy',
    appearance: {
      ...baseAppearance, skinColor: '#a0835a', hairColor: '#1a1a1a', eyeColor: '#2c1810',
      facialHair: true, facialHairStyle: 'full_beard', eyebrowThickness: 'thick',
    },
    portraitVisualOverrides: {
      contextPackId: 'south_asia_mughal_1526_1800',
      garmentKind: 'robe',
      headgearKind: 'wrapped_cloth',
      garment: { name: 'Fine Muslin Jama', material: 'cotton', color: '#d6cbb4' },
      headgear: { name: 'Muslin Turban', material: 'cotton', color: '#e2d9c4' },
      palette: { primary: '#d6cbb4', secondary: '#b8a887', accent: '#9c6b3f' },
      background: { base: '#6b5a70', accent: '#b39b6e' },
    },
  }),
  make('Athens 380 BCE', 'Belted tunic with clavi and a mantle', 506, {
    era: 'ANTIQUITY',
    profession: 'Potter',
    appearance: { ...baseAppearance, skinColor: '#d2a27a', hairColor: '#2c1810', hairTexture: 'curly', facialHair: true, facialHairStyle: 'full_beard' },
    portraitVisualOverrides: {
      contextPackId: 'mediterranean_antiquity_500bce_500ce',
      garmentKind: 'tunic',
      headgearKind: 'none',
      garment: { name: 'Short Belted Wool Tunic', material: 'wool', color: '#9b805e' },
      palette: { primary: '#9a805f', secondary: '#c0aa82', accent: '#8d4d43' },
      background: { base: '#5f6a70', accent: '#b0a173' },
    },
  }),
];

export const headwearFixtures: Fixture[] = [
  make('Brimmed hat', 'Brim shades the whole upper face', 601, {
    appearance: { ...baseAppearance, headgear: { name: 'Broad-Brimmed Felt Hat', material: 'felt' } },
  }),
  make('Hood', 'Eyes sit in a well of shadow', 602, {
    appearance: { ...baseAppearance, headgear: { name: 'Wool Hood', material: 'wool' } },
  }),
  make('Veil', 'Falls past the shoulders', 603, {
    gender: 'Female',
    appearance: { ...baseAppearance, headgear: { name: 'Linen Veil', material: 'linen' }, hairLength: 'long' },
  }),
  make('Turban', 'Layered wrap bands', 604, {
    appearance: { ...baseAppearance, headgear: { name: 'Cotton Turban', material: 'cotton' } },
  }),
  make('Helmet', 'Metal ramp, nasal bar', 605, {
    appearance: { ...baseAppearance, headgear: { name: 'Conical Nasal Helmet', material: 'steel' } },
  }),
  make('Coronet', 'Noble, with a gem', 606, {
    wealthLevel: 'noble',
    appearance: {
      ...baseAppearance,
      headgear: { name: 'Gold Circlet', material: 'gold' },
      hairLength: 'long',
      jewelry: [{ type: 'necklace', material: 'gold', style: 'ornate' }],
    },
  }),
];

export const sheets = [
  { id: 'complexion', label: 'Complexion & hair', fixtures: complexionFixtures },
  { id: 'age', label: 'Age', fixtures: ageFixtures },
  { id: 'features', label: 'Features', fixtures: featureFixtures },
  { id: 'expression', label: 'Mood & health', fixtures: expressionFixtures },
  { id: 'context', label: 'Context packs', fixtures: contextFixtures },
  { id: 'headwear', label: 'Headwear', fixtures: headwearFixtures },
];

export const allFixtures: Fixture[] = sheets.flatMap(sheet => sheet.fixtures);
