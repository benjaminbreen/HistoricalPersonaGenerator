/**
 * portraitLab/devPanel/generators.ts
 *
 * Each generator turns a seed into 42 personas that vary along exactly one
 * axis. Forty-two is six columns by seven rows, which is about as much as fits
 * on a laptop screen at a size where you can still judge a five-pixel nose.
 *
 * The discipline that makes these useful: everything *except* the axis under
 * test is held fixed. A grid of fully random faces looks impressive and tells
 * you almost nothing, because you cannot attribute what you are seeing to any
 * one decision. `random` is included anyway — it is the honest sample of what
 * the app actually ships — but the single-axis sheets are where bugs surface.
 */

import { CLOTHING_DATA, getClothingData } from '../../../constants/characterData/clothing';
import { PortraitSource } from '../spec/buildSpec';

export const GRID_COLUMNS = 6;
export const GRID_ROWS = 7;
export const CELL_COUNT = GRID_COLUMNS * GRID_ROWS; // 42

export interface Cell {
  /** Shown under the portrait — say what makes this cell different. */
  label: string;
  character: PortraitSource;
}

export interface Generator {
  id: string;
  label: string;
  /** One line on what this sheet is for. Shown in the panel header. */
  blurb: string;
  build: (seed: number) => Cell[];
}

// ---------------------------------------------------------------------------
// Seeded randomness. Self-contained so a sheet is reproducible from its seed
// alone — if you spot something broken you can get back to it.
// ---------------------------------------------------------------------------

function rngFrom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const pick = <T,>(rng: () => number, list: readonly T[]): T =>
  list[Math.floor(rng() * list.length) % list.length];

const between = (rng: () => number, lo: number, hi: number) =>
  Math.round(lo + rng() * (hi - lo));

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

const ZONES = [
  'EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN',
  'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN',
  'SUB_SAHARAN_AFRICAN',
] as const;

const ERAS = [
  'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN',
  'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA',
] as const;

const WEALTH = ['poor', 'modest', 'comfortable', 'wealthy', 'noble'] as const;
const GENDERS = ['Male', 'Female', 'Non-binary'] as const;
const TEXTURES = ['straight', 'wavy', 'curly', 'coily', 'kinky'] as const;
const LENGTHS = ['bald', 'very_short', 'short', 'medium', 'long'] as const;
const FACES = ['oval', 'round', 'square', 'heart', 'long', 'diamond'] as const;
const EYES = ['almond', 'round', 'narrow', 'hooded', 'wide'] as const;
const NOSES = ['straight', 'aquiline', 'broad', 'button', 'hooked'] as const;
const BUILDS = ['slim', 'average', 'heavy', 'muscular'] as const;

const SKIN = [
  '#f5ddc4', '#f0d3b8', '#e8c39e', '#d9a878', '#c98d63',
  '#b57a4d', '#96603a', '#7a4a2b', '#5c3720', '#3d2415', '#2d1b0f',
];

const HAIR = [
  '#0a0a0a', '#1c1410', '#2b1d14', '#4b2f21', '#6b4423',
  '#8b5a2b', '#b07a3c', '#d0a860', '#c0c0c0', '#e8e4dc',
];

const EYE_COLORS = ['#4b3a2a', '#2c1810', '#4169e1', '#3b7a57', '#6b8e9e', '#7a5230'];

const JEWEL_TYPES = ['necklace', 'earrings', 'circlet', 'brooch', 'chain'] as const;
const JEWEL_MATERIALS = ['gold', 'silver', 'bronze', 'gems', 'pearl', 'bone', 'wood'] as const;
const JEWEL_STYLES = ['simple', 'ornate', 'delicate', 'chunky'] as const;

const MARK_TYPES = [
  'scar', 'tattoo', 'paint', 'beauty_mark', 'freckles', 'mole',
  'birthmark', 'piercing', 'structural', 'henna', 'scarification',
] as const;

const MARK_LOCATIONS = ['cheek', 'forehead', 'chin', 'brow', 'nose', 'jaw', 'temple', 'lip', 'ear'];
const MARK_COLORS = ['#3b2a1d', '#7a2b1e', '#1e3a5f', '#d8c9a8', '#2e6b4f', '#8a1f3d'];

/**
 * Every distinct head covering in the game data, in the order the tree walks.
 * Pulled from `CLOTHING_DATA` rather than hand-listed so the sheet cannot drift
 * out of sync with what the generator can actually equip.
 */
function collectPieces(key: 'headgear' | 'garments' | 'accessories' | 'belts') {
  const found = new Map<string, { name: string; material: string }>();

  // Harvest only arrays whose immediate parent key is the one asked for.
  // Listing the categories to *skip* instead was the obvious way to write this
  // and it was wrong: the data also has `belts`, so the first hat parade came
  // out full of girdles and sinew belts.
  const walk = (node: unknown, insideTarget: boolean) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      if (!insideTarget) return;
      for (const item of node) {
        if (!item || typeof item !== 'object') continue;
        const piece = item as { name?: string; material?: string };
        if (typeof piece.name !== 'string') continue;
        if (!piece.name || piece.name === 'None' || piece.name === 'Barefoot') continue;
        const id = `${piece.name}|${piece.material ?? ''}`;
        if (!found.has(id)) found.set(id, { name: piece.name, material: piece.material ?? '' });
      }
      return;
    }
    for (const [childKey, child] of Object.entries(node as Record<string, unknown>)) {
      walk(child, childKey === key);
    }
  };

  walk(CLOTHING_DATA, false);
  return [...found.values()];
}

let headgearCache: Array<{ name: string; material: string }> | null = null;
const allHeadgear = () => (headgearCache ??= collectPieces('headgear'));

let accessoryCache: Array<{ name: string; material: string }> | null = null;
const allAccessories = () => (accessoryCache ??= collectPieces('accessories'));

/**
 * A real dye palette for this zone/era/wealth, rather than the flat placeholder
 * these sheets used to carry. Without it every persona on the random sheet came
 * out the same drab olive, which made the sheet useless for judging colour —
 * the axis it is most often used to judge.
 */
function realPalette(
  rng: () => number, zone: string, era: string, wealth: string, gender: string
): { primary: string; secondary: string; accent: string } | undefined {
  try {
    const set: any = getClothingData(zone as any, era as any, wealth as any, gender as any);
    const p = set?.palette;
    if (!p?.primary?.length) return undefined;
    return {
      primary: pick(rng, p.primary),
      secondary: pick(rng, p.secondary?.length ? p.secondary : p.primary),
      accent: pick(rng, p.accent?.length ? p.accent : p.primary),
    };
  } catch {
    return undefined; // a zone/era combination the tables do not cover
  }
}

// ---------------------------------------------------------------------------
// Persona construction
// ---------------------------------------------------------------------------

const BASE_APPEARANCE = {
  skinColor: '#c58f68', hairColor: '#4b2f21', eyeColor: '#4b3a2a',
  hairstyle: 'short', build: 'average', faceShape: 'oval', eyeShape: 'almond',
  noseShape: 'straight', cheekbones: 'average', jawline: 'soft',
  hairTexture: 'straight', hairLength: 'short', facialHair: false,
  skinTone: 'medium', skinTexture: 'smooth', eyebrowShape: 'straight',
  eyebrowThickness: 'medium', eyelashes: 'medium', lipShape: 'medium',
  affect: 'neutral', height: 170, weight: 68,
  garment: { name: 'Simple Tunic', material: 'linen' },
  headgear: { name: 'None', material: 'none' },
  footwear: { name: 'Leather Shoes', material: 'leather' },
  palette: { primary: '#746b5b', secondary: '#8f8068', accent: '#a77f4f' },
};

function persona(
  seed: number,
  overrides: Partial<PortraitSource> & { appearance?: Record<string, any> } = {}
): PortraitSource {
  const { appearance, ...rest } = overrides;
  return {
    name: 'Bench',
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
    stats: { strength: 5, intelligence: 5, charisma: 5, constitution: 5 },
    personality: {
      openness: 0.5, conscientiousness: 0.5, extraversion: 0.5,
      agreeableness: 0.5, neuroticism: 0.5,
    },
    appearance: { ...BASE_APPEARANCE, ...(appearance || {}) },
    ...rest,
  } as PortraitSource;
}

/** The fixed face the single-axis sheets vary *around*. */
const CONTROL = {
  skinColor: '#c98d63', hairColor: '#3b2a1d', eyeColor: '#4b3a2a',
  hairTexture: 'straight', hairLength: 'short',
};

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const random: Generator = {
  id: 'random',
  label: 'Random draw',
  blurb: 'Everything varies at once. The honest sample of what ships — good for spotting the one-in-forty disaster, useless for attribution.',
  build: seed => {
    const rng = rngFrom(seed);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const zone = pick(rng, ZONES);
      const era = pick(rng, ERAS);
      const hat = rng() > 0.35 ? pick(rng, allHeadgear()) : null;
      // Skewed young. A flat 7–88 draw makes two thirds of the sheet elderly
      // and grey-haired, which is neither what the app generates nor what any
      // pre-modern population looked like.
      const age = Math.round(6 + Math.pow(rng(), 1.8) * 78);
      const gender = pick(rng, GENDERS);
      const wealth = pick(rng, WEALTH);
      return {
        label: `${zone.split('_')[0].toLowerCase()} · ${age}`,
        character: persona(seed + i * 7919, {
          age,
          gender,
          culturalZone: zone,
          era,
          wealthLevel: wealth,
          health: between(rng, 35, 100),
          fatigue: between(rng, 0, 70),
          equippedItems: hat ? { head: hat } : undefined,
          appearance: {
            skinColor: pick(rng, SKIN),
            hairColor: pick(rng, HAIR),
            eyeColor: pick(rng, EYE_COLORS),
            hairTexture: pick(rng, TEXTURES),
            hairLength: pick(rng, LENGTHS),
            faceShape: pick(rng, FACES),
            eyeShape: pick(rng, EYES),
            noseShape: pick(rng, NOSES),
            build: pick(rng, BUILDS),
            facialHair: rng() > 0.6,
            palette: realPalette(rng, zone, era, wealth, gender),
          },
        } as any),
      };
    });
  },
};

const hatParade: Generator = {
  id: 'hats',
  label: 'Hat parade',
  blurb: 'One head covering per cell, straight out of the clothing data, on a single unchanging face. Every hat you own, in one glance.',
  build: seed => {
    const hats = allHeadgear();
    const offset = Math.abs(seed) % Math.max(1, hats.length);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const hat = hats[(offset + i) % hats.length];
      return {
        label: hat.name,
        character: persona(4242, {
          equippedItems: { head: hat },
          appearance: { ...CONTROL },
        } as any),
      };
    });
  },
};

const hatMaterials: Generator = {
  id: 'hat-materials',
  label: 'Same hat, every material',
  blurb: 'One silhouette, forty-two materials. Material drives both colour and texture, so this is where felt-pretending-to-be-fur shows up.',
  build: seed => {
    const rng = rngFrom(seed);
    const shapes = ['Cap', 'Wide Brimmed Hat', 'Hood', 'Turban', 'Coif', 'Helmet'];
    const materials = [
      'Fur', 'Sable Fur', 'Wolf Fur', 'Sheepskin', 'Shearling', 'Astrakhan',
      'Woven Bamboo', 'Split Bamboo', 'Straw', 'Sedge', 'Rattan', 'Palm Leaf',
      'Felt', 'Wool', 'Broadcloth', 'Linen', 'Cotton', 'Silk',
      'Leather', 'Hide', 'Bronze', 'Steel', 'Silver', 'Gold',
      'Reed', 'Raffia', 'Barkcloth', 'Plant Fibre',
    ];
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const shape = shapes[i % shapes.length];
      const material = materials[Math.floor(i / shapes.length) % materials.length];
      return {
        label: `${shape} · ${material}`,
        character: persona(4242 + (seed % 97), {
          equippedItems: { head: { name: shape, material } },
          appearance: { ...CONTROL },
        } as any),
      };
    });
  },
};

const agesOfMan: Generator = {
  id: 'ages',
  label: 'The seven ages',
  blurb: 'One person walked from six to ninety in even steps. Ageing should be continuous — any cliff you can see here is a threshold in the code.',
  build: seed => Array.from({ length: CELL_COUNT }, (_, i) => {
    const age = Math.round(6 + (i / (CELL_COUNT - 1)) * 84);
    return {
      label: `${age}`,
      character: persona(1000 + (seed % 500), {
        age,
        appearance: { ...CONTROL, facialHair: age > 24 && age < 70 },
      } as any),
    };
  }),
};

const sameFace: Generator = {
  id: 'seeds',
  label: 'One face, forty-two seeds',
  blurb: 'Identical inputs; only the seed moves. Everything you see differing is a seeded decision — this is the true variety budget of the generator.',
  build: seed => Array.from({ length: CELL_COUNT }, (_, i) => ({
    label: `#${(seed + i * 7919) % 100000}`,
    character: persona(seed + i * 7919, { appearance: { ...CONTROL } } as any),
  })),
};

const complexionLadder: Generator = {
  id: 'complexion',
  label: 'Complexion ladder',
  blurb: 'Skin tone down the rows, hair texture across the columns. Shadows on very dark skin need chroma, not just less value — that failure shows here first.',
  build: () => Array.from({ length: CELL_COUNT }, (_, i) => {
    const row = Math.floor(i / GRID_COLUMNS);
    const col = i % GRID_COLUMNS;
    const skin = SKIN[Math.min(SKIN.length - 1, Math.round((row / (GRID_ROWS - 1)) * (SKIN.length - 1)))];
    const texture = TEXTURES[col % TEXTURES.length];
    const dark = row > 4;
    return {
      label: texture,
      character: persona(2200 + i, {
        appearance: {
          ...CONTROL,
          skinColor: skin,
          hairColor: dark ? '#0a0a0a' : HAIR[col % HAIR.length],
          hairTexture: texture,
          hairLength: col % 2 ? 'medium' : 'short',
        },
      } as any),
    };
  }),
};

const grandTour: Generator = {
  id: 'tour',
  label: 'The grand tour',
  blurb: 'Every cultural zone crossed with every era, dressed from that cell of the clothing data. Empty or wrong-looking cells are gaps in the data, not the renderer.',
  build: seed => {
    const rng = rngFrom(seed);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const zone = ZONES[i % ZONES.length];
      const era = ERAS[Math.floor(i / ZONES.length) % ERAS.length];
      const gender = pick(rng, GENDERS);
      const wealth = pick(rng, WEALTH);
      return {
        label: `${zone.split('_')[0].toLowerCase()} · ${era.split('_')[0].toLowerCase()}`,
        character: persona(seed + i * 131, {
          culturalZone: zone,
          era,
          gender,
          wealthLevel: wealth,
          age: between(rng, 18, 70),
          appearance: {
            skinColor: pick(rng, SKIN),
            hairColor: pick(rng, HAIR),
            hairTexture: pick(rng, TEXTURES),
            palette: realPalette(rng, zone, era, wealth, gender),
          },
        } as any),
      };
    });
  },
};

const trinketShop: Generator = {
  id: 'accessories',
  label: 'Trinket shop',
  blurb: 'Jewellery, piercings and spectacles, one combination per cell. These draw last and on top of everything, so this is the sheet where things overlap badly.',
  build: seed => {
    const rng = rngFrom(seed);
    const accessories = allAccessories();
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const count = 1 + (i % 3);
      const jewelry = Array.from({ length: count }, () => ({
        type: pick(rng, JEWEL_TYPES),
        material: pick(rng, JEWEL_MATERIALS),
        style: pick(rng, JEWEL_STYLES),
      }));
      const glasses = i % 7 === 3;
      const trinket = accessories.length ? accessories[i % accessories.length] : null;
      return {
        label: `${jewelry.map(j => j.type).join('+')}${glasses ? ' +specs' : ''}`,
        character: persona(3300 + i + (seed % 89), {
          wealthLevel: 'wealthy',
          appearance: {
            ...CONTROL,
            jewelry,
            hasGlasses: glasses,
            glassesStyle: pick(rng, ['round', 'square', 'oval', 'half_rim']),
            accessory: trinket,
          },
        } as any),
      };
    });
  },
};

const inkAndScars: Generator = {
  id: 'markings',
  label: 'Ink and scars',
  blurb: 'Tattoos, paint, scarification, piercings and structural modifications at every size. Markings must follow the face, not sit flat on top of it.',
  build: seed => {
    const rng = rngFrom(seed);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const type = MARK_TYPES[i % MARK_TYPES.length];
      const size = (['small', 'medium', 'large'] as const)[Math.floor(i / MARK_TYPES.length) % 3];
      const markings = [{
        type,
        location: pick(rng, MARK_LOCATIONS),
        color: pick(rng, MARK_COLORS),
        size,
      }];
      if (rng() > 0.6) {
        markings.push({
          type: pick(rng, MARK_TYPES),
          location: pick(rng, MARK_LOCATIONS),
          color: pick(rng, MARK_COLORS),
          size: 'small',
        });
      }
      return {
        label: `${type} · ${size}`,
        character: persona(5500 + i + (seed % 71), {
          culturalZone: pick(rng, ZONES),
          appearance: { ...CONTROL, skinColor: pick(rng, SKIN), markings },
        } as any),
      };
    });
  },
};

const plagueWard: Generator = {
  id: 'condition',
  label: 'The plague ward',
  blurb: 'Health falling and fatigue climbing across the grid, ending somewhere close to death. Pallor and fever should arrive gradually rather than snapping on.',
  build: seed => {
    const rng = rngFrom(seed);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const t = i / (CELL_COUNT - 1);
      const health = Math.round(100 - t * 92);
      const fatigue = Math.round(t * 100);
      return {
        label: `hp ${health} · fat ${fatigue}`,
        character: persona(6600 + i + (seed % 53), {
          health,
          fatigue,
          age: between(rng, 20, 65),
          appearance: { ...CONTROL, skinColor: pick(rng, SKIN) },
        } as any),
      };
    });
  },
};

const facesOnly: Generator = {
  id: 'features',
  label: 'Identity parade',
  blurb: 'Bare heads, no hats or hair to hide behind — face shape, eyes, nose and jaw only. If two cells here are indistinguishable, the face model is too narrow.',
  build: seed => {
    const rng = rngFrom(seed);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const face = FACES[i % FACES.length];
      const eye = EYES[Math.floor(i / FACES.length) % EYES.length];
      const nose = NOSES[Math.floor(i / 3) % NOSES.length];
      return {
        label: `${face}/${eye}/${nose}`,
        character: persona(7700 + i, {
          appearance: {
            ...CONTROL,
            hairLength: 'bald',
            faceShape: face,
            eyeShape: eye,
            noseShape: nose,
            jawline: pick(rng, ['soft', 'square', 'pointed', 'strong']),
            cheekbones: pick(rng, ['average', 'high', 'low', 'prominent']),
            lipShape: pick(rng, ['medium', 'thin', 'full', 'bow']),
          },
        } as any),
      };
    });
  },
};

export const GENERATORS: Generator[] = [
  random,
  hatParade,
  hatMaterials,
  facesOnly,
  complexionLadder,
  agesOfMan,
  sameFace,
  trinketShop,
  inkAndScars,
  plagueWard,
  grandTour,
];
