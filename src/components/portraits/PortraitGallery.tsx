import { useMemo, useState } from 'react';
import ProceduralPortrait from './ProceduralPortrait';
import {
  applyPortraitAuthenticity,
  auditPortraitCoherence,
} from '../../services/portraitAuthenticityService';
import './PortraitGallery.css';

type GalleryCharacter = {
  name: string;
  label: string;
  notes: string[];
  character: any;
};

const baseStats = {
  strength: 5,
  intelligence: 5,
  charisma: 5,
  constitution: 5,
};

const baseAppearance = {
  skinColor: '#c58f68',
  hairColor: '#4b2f21',
  eyeColor: '#4b3a2a',
  hairstyle: 'short straight',
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
  height: 170,
  weight: 68,
  affect: 'neutral',
  garment: { name: 'simple tunic', material: 'linen' },
  headgear: { name: 'none', material: 'none' },
  footwear: { name: 'leather shoes', material: 'leather' },
  belt: { name: 'plain belt', material: 'leather' },
  accessory: { name: 'none', material: 'none' },
  palette: {
    primary: '#746B5B',
    secondary: '#8F8068',
    accent: '#A77F4F',
  },
};

const makeCharacter = (overrides: Partial<GalleryCharacter['character']>): any => {
  const {
    stats: statsOverrides,
    appearance: appearanceOverrides,
    equippedItems: equippedItemOverrides,
    ...characterOverrides
  } = overrides;

  return {
    name: 'QA subject',
    profession: 'Artisan',
    age: 35,
    gender: 'Male',
    health: 90,
    maxHealth: 100,
    fatigue: 10,
    maxFatigue: 100,
    wealthLevel: 'modest',
    class: 'Commoner',
    era: 'RENAISSANCE_EARLY_MODERN',
    culturalZone: 'EUROPEAN',
    portraitSeed: 1001,
    ...characterOverrides,
    stats: {
      ...baseStats,
      ...statsOverrides,
    },
    appearance: {
      ...baseAppearance,
      ...appearanceOverrides,
      palette: {
        ...baseAppearance.palette,
        ...appearanceOverrides?.palette,
      },
    },
    equippedItems: {
      ...equippedItemOverrides,
    },
  };
};

const fixtures: GalleryCharacter[] = [
  {
    name: 'Medieval Laborer',
    label: 'Baseline poor working clothing',
    notes: ['Plain garment', 'Straw work hat', 'Weathered skin'],
    character: makeCharacter({
      age: 42,
      gender: 'Male',
      wealthLevel: 'poor',
      class: 'Peasant laborer',
      era: 'MEDIEVAL',
      portraitSeed: 1101,
      stats: { strength: 7, constitution: 6 },
      equippedItems: {
        torso: { name: 'patched wool tunic', material: 'wool', color: 'Brown' },
        head: { name: 'Work Hat', material: 'straw' },
      },
      appearance: {
        skinColor: '#b77f5b',
        hairColor: '#3a251a',
        hairstyle: 'short wavy',
        hairTexture: 'wavy',
        skinTexture: 'weathered',
        facialHair: true,
        facialHairStyle: 'stubble',
        palette: { primary: '#6F6656', secondary: '#8A7A61', accent: '#A08862' },
      },
    }),
  },
  {
    name: 'Early Modern Merchant',
    label: 'High status garment and cap',
    notes: ['Velvet palette', 'Brooch and chain', 'Sharper silhouette'],
    character: makeCharacter({
      age: 51,
      gender: 'Male',
      wealthLevel: 'wealthy',
      class: 'Merchant',
      portraitSeed: 1201,
      stats: { charisma: 8, intelligence: 7 },
      equippedItems: {
        torso: { name: 'velvet doublet', material: 'velvet', color: 'Burgundy' },
        head: { name: 'Velvet Cap', material: 'velvet' },
        necklace: { name: 'gold chain', material: 'gold' },
      },
      appearance: {
        skinColor: '#d2a27a',
        hairColor: '#5a3322',
        hairstyle: 'medium wavy',
        hairLength: 'medium',
        hairTexture: 'wavy',
        facialHair: true,
        facialHairStyle: 'mustache',
        jewelry: [{ type: 'brooch', material: 'gold', style: 'ornate', gems: ['#4169E1'] }],
        palette: { primary: '#6B2E3A', secondary: '#273F5F', accent: '#B88A3B' },
      },
    }),
  },
  {
    name: 'Ottoman Scholar',
    label: 'MENA scholar cap/turban behavior',
    notes: ['Turban coverage', 'Scholarly source cue', 'Subtle background'],
    character: makeCharacter({
      age: 44,
      gender: 'Male',
      class: 'Religious scholar',
      culturalZone: 'MENA',
      portraitSeed: 1301,
      stats: { intelligence: 9, charisma: 6 },
      equippedItems: {
        torso: { name: 'long scholar robe', material: 'wool', color: 'Gray' },
        head: { name: 'Turban', material: 'white cloth' },
      },
      appearance: {
        skinColor: '#a96f4f',
        hairColor: '#24160f',
        eyeColor: '#33271d',
        hairstyle: 'short curly',
        hairTexture: 'curly',
        facialHair: true,
        facialHairStyle: 'full_beard',
      },
      portraitVisualOverrides: {
        background: { base: '#B7A482', accent: '#8F8068', texture: 'subtle', vignette: true },
        notes: ['Fixture mirrors source-inferred scholar headgear.'],
      },
    }),
  },
  {
    name: 'Ming Clerk',
    label: 'East Asian official/scribe',
    notes: ['Cap occlusion', 'Long robe', 'Narrow palette'],
    character: makeCharacter({
      age: 32,
      gender: 'Male',
      class: 'Administrative clerk',
      culturalZone: 'EAST_ASIAN',
      era: 'RENAISSANCE_EARLY_MODERN',
      portraitSeed: 1401,
      stats: { intelligence: 8 },
      equippedItems: {
        torso: { name: 'dark scholar robe', material: 'cotton', color: 'Blue' },
        head: { name: 'Scholar Cap', material: 'cloth' },
      },
      appearance: {
        skinColor: '#c99a72',
        hairColor: '#1c1714',
        hairstyle: 'topknot straight',
        hairLength: 'long',
        hairTexture: 'straight',
        eyeColor: '#2f261f',
      },
    }),
  },
  {
    name: 'Source Probate Widow',
    label: 'Source-first clothing level, not garment replacement',
    notes: ['Palette override only', 'Veil inferred', 'Evidence note path'],
    character: makeCharacter({
      age: 58,
      gender: 'Female',
      wealthLevel: 'modest',
      class: 'Widow and household manager',
      portraitSeed: 1501,
      equippedItems: {
        torso: { name: 'wool gown', material: 'wool', color: 'Gray' },
      },
      appearance: {
        skinColor: '#d0a17b',
        hairColor: '#5d5d5d',
        hairstyle: 'medium straight',
        hairLength: 'medium',
        skinTexture: 'weathered',
      },
      portraitVisualOverrides: {
        headgear: { name: 'Veil', material: 'linen' },
        palette: { primary: '#6F6656', secondary: '#8A7A61', accent: '#A08862' },
        background: { base: '#A99B82', accent: '#8F836F', texture: 'grain', vignette: true },
        notes: ['Simulates adapter output from will_or_inventory.'],
      },
    }),
  },
  {
    name: 'Court Testimony Sailor',
    label: 'Source body condition and occupational cap',
    notes: ['Scar marking', 'Weathered skin', 'Work cap'],
    character: makeCharacter({
      age: 29,
      gender: 'Male',
      class: 'Sailor witness',
      culturalZone: 'NORTH_AMERICAN_COLONIAL',
      era: 'INDUSTRIAL_ERA',
      portraitSeed: 1601,
      stats: { strength: 6, constitution: 7 },
      equippedItems: {
        torso: { name: 'coarse sailor shirt', material: 'linen', color: 'White' },
        head: { name: 'Work Cap', material: 'wool' },
      },
      appearance: {
        skinColor: '#b77d58',
        hairColor: '#3b2a1e',
        hairstyle: 'short wavy',
        skinTexture: 'weathered',
        markings: [{ type: 'scar', location: 'cheek', color: '#8A5A4A', size: 'small', pattern: 'source_body_condition' }],
      },
      portraitVisualOverrides: {
        background: { base: '#839FAA', accent: '#6F8994', texture: 'subtle', vignette: true },
        notes: ['Simulates court testimony or ship log body-condition cues.'],
      },
    }),
  },
];

type SheetId = 'curated' | 'contexts' | 'seeds' | 'faces' | 'headgear';

const seedFixtures: GalleryCharacter[] = Array.from({ length: 24 }, (_, index) => {
  const seed = 2101 + index;
  return {
    name: `Seed ${seed}`,
    label: 'Identical inputs; seed only',
    notes: ['Look for silhouette, expression, and texture variation.'],
    character: makeCharacter({ portraitSeed: seed }),
  };
});

const faceShapes = ['oval', 'round', 'square', 'long', 'heart', 'diamond'] as const;
const ages = [19, 42, 71];
const faceFixtures: GalleryCharacter[] = ages.flatMap((age, ageIndex) =>
  faceShapes.map((faceShape, faceIndex) => ({
    name: `${faceShape} · age ${age}`,
    label: age < 25 ? 'Young' : age >= 60 ? 'Older' : 'Adult',
    notes: [`${faceShape} face`, `${age}-year-old baseline`],
    character: makeCharacter({
      age,
      gender: faceIndex % 2 === 0 ? 'Female' : 'Male',
      portraitSeed: 3100 + ageIndex * 100 + faceIndex,
      appearance: {
        faceShape,
        eyeShape: (['almond', 'round', 'narrow', 'hooded', 'wide', 'almond'] as const)[faceIndex],
        noseShape: (['straight', 'button', 'broad', 'aquiline', 'straight', 'roman'] as const)[faceIndex],
        jawline: faceIndex % 3 === 0 ? 'soft' : faceIndex % 3 === 1 ? 'square' : 'sharp',
        cheekbones: faceIndex % 2 === 0 ? 'high' : 'low',
        hairstyle: age >= 60 ? 'short wavy' : faceIndex % 2 === 0 ? 'medium curly' : 'short straight',
        hairLength: faceIndex % 2 === 0 ? 'medium' : 'short',
        hairTexture: faceIndex % 2 === 0 ? 'curly' : 'straight',
      },
    }),
  }))
);

const faceRegressionFixtures: GalleryCharacter[] = [
  {
    name: 'Eye and nose baseline',
    label: 'Regression: level eyes, clean nose',
    notes: ['One-pixel eye baseline', 'Broad nose at dark tonal contrast', 'No facial hair occlusion'],
    character: makeCharacter({
      age: 34,
      gender: 'Male',
      culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
      portraitSeed: 3434,
      appearance: {
        skinColor: '#9d7356',
        skinTone: 'dark',
        hairColor: '#211813',
        eyeColor: '#30251d',
        eyeShape: 'narrow',
        noseShape: 'broad',
        faceShape: 'long',
        hairstyle: 'short straight',
        facialHair: false,
      },
    }),
  },
  {
    name: 'Full beard baseline',
    label: 'Regression: readable lower face',
    notes: ['Separated mustache', 'Visible mouth', 'Tapered jaw silhouette'],
    character: makeCharacter({
      age: 34,
      gender: 'Male',
      culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
      portraitSeed: 3434,
      appearance: {
        skinColor: '#9d7356',
        skinTone: 'dark',
        hairColor: '#211813',
        eyeColor: '#30251d',
        eyeShape: 'narrow',
        noseShape: 'broad',
        faceShape: 'long',
        hairstyle: 'short straight',
        facialHair: true,
        facialHairStyle: 'full_beard',
        facialHairThickness: 'thick',
      },
    }),
  },
  {
    name: 'Bald crown baseline',
    label: 'Regression: rounded exposed skull',
    notes: ['No artificial skull-height increase', 'Elliptical crown', 'Rounded chin'],
    character: makeCharacter({
      age: 48,
      gender: 'Male',
      portraitSeed: 3441,
      appearance: {
        faceShape: 'oval',
        jawline: 'soft',
        hairLength: 'bald',
        hairstyle: 'bald',
        facialHair: false,
      },
    }),
  },
  {
    name: 'Crew cut baseline',
    label: 'Regression: scalp-following hair',
    notes: ['No flat cap', 'Visible forehead', 'Curved shoulder line'],
    character: makeCharacter({
      age: 33,
      gender: 'Male',
      portraitSeed: 3442,
      appearance: {
        faceShape: 'square',
        jawline: 'square',
        hairLength: 'very_short',
        hairstyle: 'crew',
        facialHair: false,
      },
    }),
  },
  {
    name: 'Coat collar baseline',
    label: 'Regression: split collar',
    notes: ['Narrow neck', 'Sloped shoulders', 'No horizontal collar bar'],
    character: makeCharacter({
      age: 48,
      gender: 'Male',
      portraitSeed: 3443,
      wealthLevel: 'wealthy',
      class: 'Guard',
      equippedItems: {
        torso: { name: 'wool coat', material: 'wool', color: 'Gray' },
      },
      appearance: {
        faceShape: 'oval',
        jawline: 'soft',
        hairLength: 'short',
        hairstyle: 'short parted',
        facialHair: false,
      },
      portraitVisualOverrides: {
        garmentKind: 'jacket',
      },
    }),
  },
  {
    name: 'Gray feather crown baseline',
    label: 'Regression: descriptor priority',
    notes: ['Gray feathers, not royal metal', 'Natural female jaw', 'Dress neckline covers neck base'],
    character: makeCharacter({
      age: 29,
      gender: 'Female',
      portraitSeed: 3444,
      wealthLevel: 'comfortable',
      class: 'Farmer',
      culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
      equippedItems: {
        head: { name: 'Gray Feather Crown', material: 'gray feathers', color: 'Gray' },
        torso: { name: 'Elk Tooth Dress', material: 'hide', color: 'Dark Brown' },
      },
      appearance: {
        skinColor: '#a87858',
        skinTone: 'dark',
        hairColor: '#2d211b',
        faceShape: 'long',
        jawline: 'soft',
        noseShape: 'broad',
        hairLength: 'medium',
        hairstyle: 'medium straight',
        facialHair: false,
      },
      portraitVisualOverrides: {
        garmentKind: 'gown',
      },
    }),
  },
];

const headgearCases = [
  ['Straw Work Hat', 'straw', 'EUROPEAN', 'Male'],
  ['Linen Coif', 'linen', 'EUROPEAN', 'Female'],
  ['Wimple', 'linen', 'EUROPEAN', 'Female'],
  ['Velvet Cap', 'velvet', 'EUROPEAN', 'Male'],
  ['Turban', 'white linen', 'MENA', 'Male'],
  ['Kufi Cap', 'cotton', 'MENA', 'Male'],
  ['Hijab', 'linen', 'MENA', 'Female'],
  ['Pagri', 'cotton', 'SOUTH_ASIAN', 'Male'],
  ['Dupatta', 'silk', 'SOUTH_ASIAN', 'Female'],
  ['Scholar Cap', 'black cloth', 'EAST_ASIAN', 'Male'],
  ['Bamboo Dou Li', 'bamboo', 'EAST_ASIAN', 'Female'],
  ['Navy Gele', 'cotton', 'SUB_SAHARAN_AFRICAN', 'Female'],
  ['Kufi', 'woven cotton', 'SUB_SAHARAN_AFRICAN', 'Male'],
  ['Feather Headdress', 'feathers', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'Male'],
  ['Gray Feather Crown', 'gray feathers', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'Female'],
  ['Head Wrap', 'woven cloth', 'OCEANIA', 'Female'],
  ['War Helmet', 'bronze', 'EUROPEAN', 'Male'],
] as const;

const zoneAppearance: Record<string, Partial<typeof baseAppearance>> = {
  EUROPEAN: { skinColor: '#d2a27a', hairColor: '#5a3322', eyeColor: '#4b3a2a' },
  MENA: { skinColor: '#a96f4f', hairColor: '#24160f', eyeColor: '#33271d' },
  SOUTH_ASIAN: { skinColor: '#94613f', hairColor: '#1f1712', eyeColor: '#2c2119' },
  EAST_ASIAN: { skinColor: '#c99a72', hairColor: '#1c1714', eyeColor: '#2f261f' },
  SUB_SAHARAN_AFRICAN: { skinColor: '#654321', hairColor: '#0a0a0a', eyeColor: '#1a1410', hairTexture: 'coily' },
  NORTH_AMERICAN_PRE_COLUMBIAN: { skinColor: '#a46f4d', hairColor: '#17120f', eyeColor: '#29201a' },
  OCEANIA: { skinColor: '#70482f', hairColor: '#17120f', eyeColor: '#29201a', hairTexture: 'curly' },
};

const headgearFixtures: GalleryCharacter[] = headgearCases.map(([name, material, culturalZone, gender], index) => ({
  name,
  label: `${culturalZone.replace(/_/g, ' ')} · ${material}`,
  notes: ['Check hair occlusion, scale, and face overlap.'],
  character: makeCharacter({
    gender,
    culturalZone,
    portraitSeed: 4101 + index,
    equippedItems: {
      head: { name, material },
      torso: { name: 'simple woven garment', material: 'cloth', color: 'Brown' },
    },
    appearance: {
      ...zoneAppearance[culturalZone],
      hairstyle: gender === 'Female' ? 'medium curly' : 'short straight',
      hairLength: gender === 'Female' ? 'medium' : 'short',
    },
  }),
}));

const contextCases = [
  {
    name: 'London midwife · 1691',
    context: { year: 1691, region: 'British Isles', location: 'London · Stepney' },
    character: {
      gender: 'Female',
      age: 45,
      profession: 'Midwife',
      class: 'Widow and working practitioner',
      culturalZone: 'EUROPEAN',
      portraitSeed: 5101,
    },
  },
  {
    name: 'London porter · 1734',
    context: { year: 1734, region: 'British Isles', location: 'London' },
    character: {
      gender: 'Male',
      age: 38,
      profession: 'Porter',
      class: 'Laborer',
      wealthLevel: 'poor',
      culturalZone: 'EUROPEAN',
      portraitSeed: 5102,
    },
  },
  {
    name: 'Roman potter · 133',
    context: { year: 133, region: 'Italy', location: 'Rome' },
    character: {
      gender: 'Male',
      age: 41,
      profession: 'Potter',
      class: 'Artisan',
      era: 'ANTIQUITY',
      culturalZone: 'EUROPEAN',
      portraitSeed: 5201,
    },
  },
  {
    name: 'Aegean merchant · −320',
    context: { year: -320, region: 'Mediterranean', location: 'Aegean' },
    character: {
      gender: 'Female',
      age: 34,
      profession: 'Merchant',
      class: 'Merchant household',
      wealthLevel: 'wealthy',
      era: 'ANTIQUITY',
      culturalZone: 'EUROPEAN',
      portraitSeed: 5202,
    },
  },
  {
    name: 'Early Gao birth attendant · 133',
    context: { year: 133, region: 'Sahel', location: 'Gao Region' },
    character: {
      gender: 'Female',
      age: 59,
      profession: 'Birth Attendant',
      class: 'Commoner',
      era: 'ANTIQUITY',
      culturalZone: 'SUB_SAHARAN_AFRICAN',
      portraitSeed: 5301,
      appearance: {
        ...zoneAppearance.SUB_SAHARAN_AFRICAN,
        markings: [{ type: 'body_modification', location: 'face', color: '#333', size: 'medium', pattern: 'plug' }],
      },
      equippedItems: {
        head: { name: 'Navy Gele', material: 'cotton' },
        torso: { name: 'Chocolate Boubou', material: 'cotton' },
      },
    },
  },
  {
    name: 'Medieval Gao trader · 1240',
    context: { year: 1240, region: 'Sahel', location: 'Gao' },
    character: {
      gender: 'Male',
      age: 47,
      profession: 'Trader',
      class: 'Merchant',
      wealthLevel: 'wealthy',
      era: 'MEDIEVAL',
      culturalZone: 'SUB_SAHARAN_AFRICAN',
      portraitSeed: 5302,
      appearance: zoneAppearance.SUB_SAHARAN_AFRICAN,
    },
  },
  {
    name: 'Han farmer · 172',
    context: { year: 172, region: 'North China', location: 'Yellow River' },
    character: {
      gender: 'Female',
      age: 39,
      profession: 'Farmer',
      class: 'Farming household',
      era: 'ANTIQUITY',
      culturalZone: 'EAST_ASIAN',
      portraitSeed: 5401,
      appearance: zoneAppearance.EAST_ASIAN,
    },
  },
  {
    name: 'Song clerk · 1090',
    context: { year: 1090, region: 'South China', location: 'Yangtze' },
    character: {
      gender: 'Male',
      age: 31,
      profession: 'Clerk',
      class: 'Minor official',
      era: 'MEDIEVAL',
      culturalZone: 'EAST_ASIAN',
      portraitSeed: 5402,
      appearance: zoneAppearance.EAST_ASIAN,
    },
  },
  {
    name: 'Ming scholar · 1543',
    context: { year: 1543, region: 'China', location: 'Beijing' },
    character: {
      gender: 'Male',
      age: 52,
      profession: 'Scholar',
      class: 'Gentry',
      wealthLevel: 'wealthy',
      era: 'RENAISSANCE_EARLY_MODERN',
      culturalZone: 'EAST_ASIAN',
      portraitSeed: 5403,
      appearance: zoneAppearance.EAST_ASIAN,
    },
  },
  {
    name: 'Delhi potter · 1655',
    context: { year: 1655, region: 'North India', location: 'Delhi' },
    character: {
      gender: 'Male',
      age: 43,
      profession: 'Potter',
      class: 'Artisan',
      wealthLevel: 'modest',
      era: 'RENAISSANCE_EARLY_MODERN',
      culturalZone: 'SOUTH_ASIAN',
      portraitSeed: 5421,
      appearance: zoneAppearance.SOUTH_ASIAN,
      equippedItems: {
        head: { name: 'Fantasy Crown', material: 'gold and gems' },
        torso: { name: 'European Ball Gown', material: 'silk' },
      },
    },
  },
  {
    name: 'Java cloth seller · 1880',
    context: { year: 1880, region: 'Maritime Southeast Asia', location: 'Java' },
    character: {
      gender: 'Female',
      age: 33,
      profession: 'Cloth Seller',
      class: 'Market household',
      wealthLevel: 'modest',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'SOUTH_ASIAN',
      portraitSeed: 5431,
      appearance: zoneAppearance.SOUTH_ASIAN,
      equippedItems: {
        head: { name: 'Imperial Tiara', material: 'gold' },
        torso: { name: 'Chinese Imperial Robe', material: 'silk' },
      },
    },
  },
  {
    name: 'Hanoi cloth seller · 1843',
    context: { year: 1843, region: 'Mainland Southeast Asia', location: 'Hanoi' },
    character: {
      name: 'Mai Bui',
      gender: 'Female',
      age: 36,
      profession: 'Cloth Seller',
      religion: 'Mahayana Buddhism',
      class: 'Market household',
      wealthLevel: 'modest',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'SOUTH_ASIAN',
      portraitSeed: 5433,
      appearance: zoneAppearance.SOUTH_ASIAN,
      equippedItems: {
        head: { name: 'Ivory Diamond Tikka', material: 'silver and gems' },
        torso: { name: 'Victorian Blouse', material: 'silk' },
      },
    },
  },
  {
    name: 'Irrawaddy boat worker · 1880',
    context: { year: 1880, region: 'Mainland Southeast Asia', location: 'Irrawaddy Delta' },
    character: {
      name: 'Wah Khin',
      gender: 'Female',
      age: 36,
      profession: 'Boat Worker',
      religion: 'Theravada Buddhism',
      class: 'Working household',
      wealthLevel: 'poor',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'SOUTH_ASIAN',
      portraitSeed: 5434,
      appearance: zoneAppearance.SOUTH_ASIAN,
      equippedItems: {
        head: { name: 'Jeweled Hair Flowers', material: 'silver' },
        torso: { name: 'Printed Court Sari', material: 'silk' },
      },
    },
  },
  {
    name: 'Cebu weaver · 1843',
    context: { year: 1843, region: 'Philippines', location: 'Cebu' },
    character: {
      name: 'Teresa Santos',
      gender: 'Female',
      age: 36,
      profession: 'Weaver',
      religion: 'Roman Catholicism',
      class: 'Working household',
      wealthLevel: 'modest',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'SOUTH_ASIAN',
      portraitSeed: 5435,
      appearance: zoneAppearance.SOUTH_ASIAN,
      equippedItems: {
        head: { name: 'Diamond Tikka', material: 'gold and gems' },
        torso: { name: 'Indian Court Sari', material: 'silk' },
      },
    },
  },
  {
    name: 'Spice Islands child watcher · 1843',
    context: { year: 1843, region: 'Maritime Southeast Asia', location: 'Spice Islands' },
    character: {
      name: 'Siti',
      gender: 'Female',
      age: 41,
      profession: 'Child Watcher',
      religion: 'Sunni Islam',
      class: 'Impoverished household',
      wealthLevel: 'poor',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'SOUTH_ASIAN',
      portraitSeed: 5432,
      appearance: zoneAppearance.SOUTH_ASIAN,
      equippedItems: {
        torso: { name: 'Brown Cotton Blouse', material: 'cotton' },
        feet: { name: 'Barefoot', material: 'none' },
      },
    },
  },
  {
    name: 'Tian Shan office manager · 1989',
    context: { year: 1989, region: 'Kazakh Steppes', location: 'Tian Shan Range' },
    character: {
      name: 'Leonid Sidorov',
      gender: 'Male',
      age: 27,
      profession: 'Office Manager',
      class: 'Middle Class',
      wealthLevel: 'comfortable',
      era: 'MODERN_ERA',
      culturalZone: 'EAST_ASIAN',
      portraitSeed: 5451,
      equippedItems: {
        head: { name: 'Turquoise Diamond Tiara', material: 'diamonds and platinum' },
        torso: { name: 'Royal Silk Qipao', material: 'silk' },
        feet: { name: 'Golden Slippers', material: 'gold and silk' },
      },
    },
  },
  {
    name: 'Bismarck laborer · 1820',
    context: { year: 1820, region: 'New Guinea and Melanesia', location: 'Bismarck Archipelago' },
    character: {
      gender: 'Female',
      age: 36,
      profession: 'Laborer',
      religion: 'Local ancestral traditions',
      class: 'Working household',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'OCEANIA',
      portraitSeed: 5501,
      appearance: zoneAppearance.OCEANIA,
      equippedItems: {
        head: { name: 'Pith Helmet', material: 'cork and cloth' },
        torso: { name: 'Aloha Shirt', material: 'printed cotton' },
      },
    },
  },
  {
    name: 'Manus Christian · 1889',
    context: { year: 1889, region: 'New Guinea and Melanesia', location: 'Manus Island' },
    character: {
      gender: 'Female',
      age: 51,
      profession: 'Household worker',
      religion: 'Christianity',
      class: 'Village household',
      era: 'INDUSTRIAL_ERA',
      culturalZone: 'OCEANIA',
      portraitSeed: 5502,
      appearance: zoneAppearance.OCEANIA,
    },
  },
  {
    name: 'Daintree maker · −1965',
    context: { year: -1965, region: 'Australia · North Queensland', location: 'Daintree Rainforest' },
    character: {
      gender: 'Male',
      age: 44,
      profession: 'Maker',
      class: 'Prosperous family',
      wealthLevel: 'comfortable',
      era: 'ANTIQUITY',
      culturalZone: 'OCEANIA',
      portraitSeed: 5521,
      appearance: zoneAppearance.OCEANIA,
      equippedItems: {
        head: { name: 'War Helmet', material: 'bronze' },
        torso: { name: 'Woven Cape', material: 'wool' },
      },
    },
  },
] as const;

const contextFixtures: GalleryCharacter[] = contextCases.map((fixture) => {
  const rawCharacter = makeCharacter({ name: fixture.name, ...fixture.character });
  const audit = auditPortraitCoherence(rawCharacter, fixture.context);
  const resolved = applyPortraitAuthenticity(
    rawCharacter,
    fixture.context
  );
  const display = resolved.portraitVisualOverrides?.displayEquipment;
  const identity = resolved.portraitVisualOverrides?.identity;
  return {
    name: fixture.name,
    label: resolved.portraitVisualOverrides?.contextPackId?.replace(/_/g, ' ') || 'No profile matched',
    notes: [
      `Head: ${display?.head?.name || 'None'}`,
      `Torso: ${display?.torso?.name || 'None'}`,
      identity
        ? `${identity.placeTrack} · ${identity.periodTrack} · ${identity.garmentFamily}`
        : 'No resolved portrait identity.',
      audit.issues.length
        ? `Corrected ${audit.issues.length} incompatible generated item${audit.issues.length === 1 ? '' : 's'}.`
        : 'No incompatible generated items detected.',
      resolved.portraitVisualOverrides?.authenticity?.rationale || 'No authenticity rationale.',
    ],
    character: resolved,
  };
});

const sheets: Array<{ id: SheetId; label: string; description: string; fixtures: GalleryCharacter[] }> = [
  {
    id: 'curated',
    label: 'Curated cases',
    description: 'Six source and historical-context fixtures with full diagnostic notes.',
    fixtures,
  },
  {
    id: 'contexts',
    label: 'Anchor worlds',
    description: 'Resolved identity and clothing profiles for London, Mediterranean antiquity, the Sahel, China, South and Southeast Asia, Central Asia, Australia, and Melanesia.',
    fixtures: contextFixtures,
  },
  {
    id: 'seeds',
    label: 'Seed sweep',
    description: 'Twenty-four portraits with identical character data. Only the portrait seed changes.',
    fixtures: seedFixtures,
  },
  {
    id: 'faces',
    label: 'Face & age',
    description: 'A controlled matrix for silhouette, age, jaw, cheekbone, eye alignment, nose legibility, and facial-hair occlusion.',
    fixtures: [...faceFixtures, ...faceRegressionFixtures],
  },
  {
    id: 'headgear',
    label: 'Headgear',
    description: 'Coverage and occlusion stress tests across sixteen named head coverings.',
    fixtures: headgearFixtures,
  },
];

const PortraitGallery = () => {
  const requestedSheet = new URLSearchParams(window.location.search).get('portraitSheet');
  const initialSheet = sheets.some(sheet => sheet.id === requestedSheet)
    ? requestedSheet as SheetId
    : 'contexts';
  const [activeSheet, setActiveSheet] = useState<SheetId>(initialSheet);
  const selectedSheet = useMemo(
    () => sheets.find(sheet => sheet.id === activeSheet) || sheets[0],
    [activeSheet]
  );
  const detailed = activeSheet === 'curated' || activeSheet === 'contexts';

  return (
    <main className="portrait-gallery">
      <header className="portrait-gallery__header">
        <div>
          <p className="portrait-gallery__eyebrow">Deterministic portrait QA</p>
          <h1>Portrait contact sheets</h1>
          <p className="portrait-gallery__intro">
            Controlled matrices for judging variety, historical styling, occlusion, and regressions.
          </p>
        </div>
        <div className="portrait-gallery__header-actions">
          <button type="button" onClick={() => window.print()}>Print sheet</button>
          <a href="/" className="portrait-gallery__back">Back to generator</a>
        </div>
      </header>

      <nav className="portrait-gallery__tabs" aria-label="Portrait QA sheets">
        {sheets.map(sheet => (
          <button
            key={sheet.id}
            type="button"
            className={sheet.id === activeSheet ? 'is-active' : ''}
            onClick={() => setActiveSheet(sheet.id)}
          >
            <span>{sheet.label}</span>
            <small>{sheet.fixtures.length}</small>
          </button>
        ))}
      </nav>

      <section className="portrait-gallery__sheet-header">
        <div>
          <span>Sheet {sheets.findIndex(sheet => sheet.id === activeSheet) + 1}/{sheets.length}</span>
          <h2>{selectedSheet.label}</h2>
        </div>
        <p>{selectedSheet.description}</p>
      </section>

      <section className={`portrait-gallery__grid ${detailed ? 'portrait-gallery__grid--detailed' : 'portrait-gallery__grid--contact'}`}>
        {selectedSheet.fixtures.map((fixture, index) => (
          <article className={`portrait-gallery__card ${detailed ? 'portrait-gallery__card--detailed' : 'portrait-gallery__card--contact'}`} key={`${fixture.name}-${index}`}>
            <div className="portrait-gallery__portrait">
              <ProceduralPortrait
                character={fixture.character}
                size={detailed ? 224 : 160}
                useEquippedItems
                animated={false}
              />
            </div>
            <div className="portrait-gallery__body">
              <h3>{fixture.name}</h3>
              <p>{fixture.label}</p>
              {detailed ? (
                <>
                  <dl>
                    <div>
                      <dt>Seed</dt>
                      <dd>{fixture.character.portraitSeed}</dd>
                    </div>
                    <div>
                      <dt>Context</dt>
                      <dd>{fixture.character.era} / {fixture.character.culturalZone}</dd>
                    </div>
                    <div>
                      <dt>Headgear</dt>
                      <dd>{fixture.character.portraitVisualOverrides?.headgear?.name || fixture.character.equippedItems?.head?.name || 'none'}</dd>
                    </div>
                    <div>
                      <dt>Garment</dt>
                      <dd>{fixture.character.portraitVisualOverrides?.garment?.name || fixture.character.equippedItems?.torso?.name || fixture.character.appearance.garment.name}</dd>
                    </div>
                  </dl>
                  <ul>
                    {fixture.notes.map(note => <li key={note}>{note}</li>)}
                  </ul>
                </>
              ) : (
                <code>{fixture.character.portraitSeed}</code>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default PortraitGallery;
