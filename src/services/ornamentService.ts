/**
 * services/ornamentService.ts
 *
 * Gives personas the jewellery the app was already built to display.
 *
 * `appearance.jewelry` is read in three places — the equipment list, the
 * appearance panel, and the portrait renderer, which draws necklaces, earrings,
 * circlets, bracelets and rings in pixels. Nothing ever wrote to it, so every
 * persona took the empty-array early return and the whole capability sat idle.
 *
 * What a person wears on the body is one of the most legible historical signals
 * there is: material availability, wealth, marital status, religion, trade
 * reach. So the table below is keyed on zone and period rather than on a
 * generic fantasy tier, and metal is gated on the society actually smelting it —
 * a forager in 9000 BCE gets shell and bone, not a gold torc.
 */

import type { CulturalZone } from '../types/characterData';
import { hasCapability } from '../constants/societyCapabilities';

export type OrnamentType =
  | 'necklace' | 'earrings' | 'bracelet' | 'ring' | 'circlet' | 'brooch' | 'chain' | 'anklet';
export type OrnamentMaterial =
  | 'gold' | 'silver' | 'bronze' | 'gems' | 'pearl' | 'bone' | 'wood';
export type OrnamentStyle = 'simple' | 'ornate' | 'delicate' | 'chunky';

export interface OrnamentPiece {
  type: OrnamentType;
  material: OrnamentMaterial;
  style: OrnamentStyle;
  gems?: string[];
}

export interface OrnamentContext {
  year: number;
  culturalZone?: CulturalZone;
  placeLower?: string;
  /** 'Male' | 'Female' | anything else, which is treated as unspecified. */
  gender?: string;
  wealth?: 'destitute' | 'poor' | 'modest' | 'comfortable' | 'wealthy' | string;
  socialClass?: string;
  profession?: string;
  attributeIds?: string[];
}

/**
 * The renderer draws these; the rest appear in the equipment and appearance
 * lists only. Weighting toward the visible ones keeps the portrait and the card
 * telling the same story.
 */
const RENDERED: ReadonlySet<OrnamentType> = new Set(['necklace', 'earrings', 'circlet', 'bracelet', 'ring']);

/**
 * Stone and glass colours that a period could actually supply. The renderer
 * needs hex; the card needs a word, so the reverse lookup below turns the first
 * colour back into the stone it stands for rather than printing "#a3562f" or,
 * worse, a generic colour name like "Rust".
 */
const GEM_SETS = {
  earth: ['#a3562f', '#7d4a2e', '#c98b4b'],          // carnelian, jasper, amber
  turquoise: ['#3fa9a0', '#2f8f95', '#7fc7bd'],
  lapis: ['#2a4b9b', '#375fbf', '#1f3a78'],
  jade: ['#4f9a6a', '#3d7d55', '#7fbf95'],
  shell: ['#f0e4d0', '#e8d3b8', '#cbb79a'],
  coral: ['#c84a3c', '#e0705c', '#9c3628'],
  garnet: ['#8c1f2c', '#a83243', '#6d1520'],
  glass: ['#4a6fa5', '#6f9c7d', '#b06a8c'],
} as const;

const STONE_NAMES: Record<keyof typeof GEM_SETS, string> = {
  earth: 'carnelian', turquoise: 'turquoise', lapis: 'lapis lazuli', jade: 'jade',
  shell: 'shell', coral: 'coral', garnet: 'garnet', glass: 'glass',
};

const STONE_BY_HEX = new Map<string, string>(
  (Object.keys(GEM_SETS) as Array<keyof typeof GEM_SETS>).flatMap(
    key => GEM_SETS[key].map(hex => [hex, STONE_NAMES[key]] as [string, string])));

/**
 * What the card says a piece is. `material` is constrained to the renderer's
 * seven-value union, so "gems" and "pearl" have to be turned back into English.
 */
export function describeOrnament(piece: OrnamentPiece): string {
  const stone = piece.gems?.length ? STONE_BY_HEX.get(piece.gems[0]) : undefined;
  const noun =
    piece.material === 'gems' ? `${stone ?? 'stone'} beads`
    : piece.material === 'pearl' ? (stone === 'shell' ? 'shell' : 'pearl')
    : piece.material === 'bone' ? 'bone'
    : piece.material === 'wood' ? 'wood'
    : piece.material;
  const withStone = piece.material !== 'gems' && stone && stone !== 'shell'
    ? `${noun} set with ${stone}`
    : noun;
  return `${piece.style} ${withStone}`;
}

interface Tradition {
  id: string;
  zones?: CulturalZone[];
  yearRange: [number, number];
  /** Restrict to one sex where the practice genuinely was. */
  sex?: 'Male' | 'Female';
  /** 0 = anyone, 1 = only the wealthy. Compared against a privilege score. */
  minPrivilege?: number;
  weight: number;
  piece: OrnamentPiece;
  /** Skip unless the society smelts metal, keeps herds, etc. */
  requires?: 'metallurgy' | 'coinage' | 'urban_settlement' | 'european_contact';
}

/**
 * Ordered loosely by region. Each entry is one practice, not one object: the
 * style and material carry the period, and the type decides where it is worn.
 */
const TRADITIONS: Tradition[] = [
  // ---- Before metal, anywhere ----
  { id: 'shell-strand', yearRange: [-12000, -2500], weight: 40,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', gems: [...GEM_SETS.shell] } },
  { id: 'pierced-tooth', yearRange: [-12000, -1000], weight: 30,
    piece: { type: 'necklace', material: 'bone', style: 'chunky' } },
  { id: 'bone-ear-plug', yearRange: [-12000, 500], weight: 18,
    piece: { type: 'earrings', material: 'bone', style: 'simple' } },
  { id: 'stone-bead', yearRange: [-12000, -500], weight: 22,
    piece: { type: 'bracelet', material: 'gems', style: 'simple', gems: [...GEM_SETS.earth] } },

  // ---- Europe ----
  { id: 'eu-bronze-torc', zones: ['EUROPEAN' as CulturalZone], yearRange: [-2200, 100], weight: 28, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'bronze', style: 'chunky' } },
  { id: 'eu-fibula', zones: ['EUROPEAN' as CulturalZone], yearRange: [-800, 700], weight: 34,
    requires: 'metallurgy', piece: { type: 'brooch', material: 'bronze', style: 'ornate', gems: [...GEM_SETS.garnet] } },
  { id: 'eu-roman-signet', zones: ['EUROPEAN' as CulturalZone], yearRange: [-300, 500], weight: 24, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'ring', material: 'gold', style: 'simple', gems: [...GEM_SETS.earth] } },
  { id: 'eu-viking-armring', zones: ['EUROPEAN' as CulturalZone], yearRange: [750, 1150], weight: 26, minPrivilege: 0.4,
    requires: 'metallurgy', piece: { type: 'bracelet', material: 'silver', style: 'chunky' } },
  { id: 'eu-pilgrim-badge', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1100, 1550], weight: 22,
    requires: 'metallurgy', piece: { type: 'brooch', material: 'bronze', style: 'simple' } },
  { id: 'eu-rosary', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1250, 1900], weight: 28,
    piece: { type: 'chain', material: 'wood', style: 'simple' } },
  { id: 'eu-pearl-rope', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1500, 1800], weight: 20, minPrivilege: 0.7, sex: 'Female',
    piece: { type: 'necklace', material: 'pearl', style: 'delicate' } },
  { id: 'eu-mourning-ring', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1700, 1910], weight: 18, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'ring', material: 'gold', style: 'delicate' } },
  { id: 'eu-pocket-chain', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1800, 1950], weight: 22, sex: 'Male', minPrivilege: 0.4,
    requires: 'metallurgy', piece: { type: 'chain', material: 'silver', style: 'simple' } },
  { id: 'eu-wedding-band', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1850, 2030], weight: 34,
    requires: 'metallurgy', piece: { type: 'ring', material: 'gold', style: 'simple' } },

  // ---- Mediterranean, Near East, North Africa ----
  { id: 'mena-lapis-collar', zones: ['MENA' as CulturalZone], yearRange: [-3000, -300], weight: 26, minPrivilege: 0.5,
    piece: { type: 'necklace', material: 'gems', style: 'ornate', gems: [...GEM_SETS.lapis] } },
  { id: 'mena-hoop', zones: ['MENA' as CulturalZone], yearRange: [-2000, 1900], weight: 32,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'simple' } },
  { id: 'mena-silver-anklet', zones: ['MENA' as CulturalZone], yearRange: [-1000, 1950], weight: 24, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'anklet', material: 'silver', style: 'chunky' } },
  { id: 'mena-amulet', zones: ['MENA' as CulturalZone], yearRange: [-2500, 1900], weight: 28,
    piece: { type: 'necklace', material: 'gems', style: 'simple', gems: [...GEM_SETS.turquoise] } },
  { id: 'mena-signet', zones: ['MENA' as CulturalZone], yearRange: [-2000, 1700], weight: 20, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'ring', material: 'silver', style: 'ornate', gems: [...GEM_SETS.earth] } },

  // ---- South Asia ----
  // Shell and terracotta bangles are Harappan; glass ones only become ordinary
  // in the later first millennium BCE.
  { id: 'sa-shell-bangles', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-2500, 200], weight: 42, sex: 'Female',
    piece: { type: 'bracelet', material: 'pearl', style: 'chunky', gems: [...GEM_SETS.shell] } },
  { id: 'sa-glass-bangles', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-200, 2030], weight: 42, sex: 'Female',
    piece: { type: 'bracelet', material: 'gems', style: 'chunky', gems: [...GEM_SETS.glass] } },
  { id: 'sa-jhumka', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [200, 2030], weight: 30, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'ornate' } },
  { id: 'sa-rudraksha', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-500, 2030], weight: 24,
    piece: { type: 'necklace', material: 'wood', style: 'simple' } },
  { id: 'sa-nose-ring', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [1100, 2030], weight: 22, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'delicate' } },
  { id: 'sa-toe-ring', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-200, 2030], weight: 18, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'ring', material: 'silver', style: 'simple' } },

  // ---- East and Southeast Asia ----
  { id: 'ea-jade-pendant', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-3000, 2030], weight: 34,
    piece: { type: 'necklace', material: 'gems', style: 'simple', gems: [...GEM_SETS.jade] } },
  { id: 'ea-hairpin', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-500, 1920], weight: 28, sex: 'Female', minPrivilege: 0.4,
    piece: { type: 'circlet', material: 'gems', style: 'delicate', gems: [...GEM_SETS.jade] } },
  { id: 'ea-cash-string', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-200, 1900], weight: 20,
    requires: 'coinage', piece: { type: 'chain', material: 'bronze', style: 'simple' } },
  { id: 'ea-silver-collar', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [1000, 1950], weight: 18, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'silver', style: 'ornate' } },

  // ---- Sub-Saharan Africa ----
  // Stone and eggshell beadwork is ancient here; the glass bead is a trade good
  // that arrives with the Indian Ocean and Saharan networks, not before them.
  { id: 'ssa-stone-collar', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-3000, 700], weight: 40,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', gems: [...GEM_SETS.earth] } },
  { id: 'ssa-glass-collar', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [700, 2030], weight: 40,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', gems: [...GEM_SETS.glass] } },
  { id: 'ssa-copper-cuff', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-500, 2030], weight: 30,
    requires: 'metallurgy', piece: { type: 'bracelet', material: 'bronze', style: 'chunky' } },
  { id: 'ssa-cowrie', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-2000, 1950], weight: 30,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', gems: [...GEM_SETS.shell] } },
  { id: 'ssa-gold-ornament', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [800, 1900], weight: 20, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'gold', style: 'ornate' } },
  { id: 'ssa-ivory-band', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-500, 1900], weight: 18, minPrivilege: 0.5,
    piece: { type: 'bracelet', material: 'bone', style: 'chunky' } },

  // ---- The Americas ----
  { id: 'am-turquoise', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-1000, 2030], weight: 34,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', gems: [...GEM_SETS.turquoise] } },
  { id: 'am-shell-gorget', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-2000, 1800], weight: 28,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', gems: [...GEM_SETS.shell] } },
  { id: 'am-quillwork-band', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-3000, 1900], weight: 22,
    piece: { type: 'circlet', material: 'bone', style: 'simple' } },
  { id: 'am-trade-silver', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone],
    yearRange: [1650, 1900], weight: 24, requires: 'european_contact',
    piece: { type: 'brooch', material: 'silver', style: 'ornate' } },
  { id: 'sam-tupu', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-500, 1900], weight: 30, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'brooch', material: 'silver', style: 'simple' } },
  { id: 'sam-gold-ear-spool', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-800, 1550], weight: 22, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'chunky' } },
  { id: 'sam-spondylus', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-2500, 1600], weight: 26,
    piece: { type: 'necklace', material: 'pearl', style: 'chunky', gems: [...GEM_SETS.coral] } },
  { id: 'sam-seed-strand', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-4000, 2030], weight: 26,
    piece: { type: 'necklace', material: 'wood', style: 'simple' } },

  // ---- Oceania ----
  { id: 'oc-shell-valuable', zones: ['OCEANIA' as CulturalZone], yearRange: [-4000, 2030], weight: 40,
    piece: { type: 'necklace', material: 'pearl', style: 'chunky', gems: [...GEM_SETS.shell] } },
  { id: 'oc-boar-tusk', zones: ['OCEANIA' as CulturalZone], yearRange: [-3000, 1950], weight: 26,
    piece: { type: 'necklace', material: 'bone', style: 'chunky' } },
  { id: 'oc-greenstone', zones: ['OCEANIA' as CulturalZone], yearRange: [1000, 2030], weight: 24,
    piece: { type: 'necklace', material: 'gems', style: 'simple', gems: [...GEM_SETS.jade] } },

  // ---- Modern, everywhere ----
  { id: 'modern-watch-chain', yearRange: [1880, 1960], weight: 14, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'chain', material: 'silver', style: 'simple' } },
  { id: 'modern-studs', yearRange: [1950, 2030], weight: 26, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'delicate' } },
  { id: 'modern-crucifix', yearRange: [1850, 2030], weight: 20,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'silver', style: 'delicate' } },
  { id: 'colonial-glass-bead', zones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1600, 1900], weight: 26,
    piece: { type: 'necklace', material: 'gems', style: 'simple', gems: [...GEM_SETS.glass] } },
  { id: 'colonial-hoop', zones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1600, 1950], weight: 20,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'silver', style: 'simple' } },
];

const PRIVILEGE: Record<string, number> = {
  destitute: 0.05, poor: 0.2, modest: 0.4, comfortable: 0.65, wealthy: 0.9,
};

/** Metal needs smelting; everything else a person can find or trade for. */
const METALS: ReadonlySet<OrnamentMaterial> = new Set(['gold', 'silver', 'bronze']);

function privilegeOf(ctx: OrnamentContext): number {
  const fromWealth = PRIVILEGE[(ctx.wealth ?? '').toLowerCase()];
  if (fromWealth !== undefined) return fromWealth;
  const cls = (ctx.socialClass ?? '').toLowerCase();
  if (/noble|patrician|aristocrat|royal|elite/.test(cls)) return 0.85;
  if (/merchant|burgher|official|priest|scholar/.test(cls)) return 0.6;
  if (/serf|slave|beggar|pauper/.test(cls)) return 0.1;
  return 0.4;
}

/**
 * How many pieces someone wears. Ornament is one of the few forms of portable
 * wealth available to people without land, so this rises with means but never
 * falls to nothing: even the destitute keep one strand.
 */
function pieceCount(privilege: number, roll: number): number {
  if (privilege >= 0.8) return roll < 0.45 ? 3 : 2;
  if (privilege >= 0.55) return roll < 0.55 ? 2 : 1;
  if (privilege >= 0.3) return roll < 0.3 ? 2 : 1;
  return roll < 0.55 ? 1 : 0;
}

function eligible(tradition: Tradition, ctx: OrnamentContext, privilege: number): boolean {
  const { year } = ctx;
  if (year < tradition.yearRange[0] || year > tradition.yearRange[1]) return false;
  if (tradition.zones && (!ctx.culturalZone || !tradition.zones.includes(ctx.culturalZone))) return false;
  if (tradition.sex && ctx.gender !== tradition.sex) return false;
  if (tradition.minPrivilege !== undefined && privilege < tradition.minPrivilege) return false;

  const capCtx = { year, culturalZone: ctx.culturalZone, placeLower: ctx.placeLower };
  if (tradition.requires && !hasCapability(tradition.requires, capCtx)) return false;
  // A bronze fibula in a society that does not smelt is the same error as a
  // literate serf in a society without writing.
  if (METALS.has(tradition.piece.material) && !hasCapability('metallurgy', capCtx)) return false;
  return true;
}

/**
 * Pick the ornament a persona is wearing. Deterministic in `rng`, which the
 * caller seeds from the persona.
 */
export function generateOrnament(ctx: OrnamentContext, rng: () => number): OrnamentPiece[] {
  const privilege = privilegeOf(ctx);
  const ids = new Set(ctx.attributeIds ?? []);

  // Vows of poverty and enslavement are claims about what a person may own.
  if (ids.has('monastic') || ids.has('ascetic') || ids.has('enslaved') || ids.has('serf_born')) {
    const plain = TRADITIONS.filter(t => eligible(t, ctx, 0.1) && !METALS.has(t.piece.material));
    if (plain.length === 0 || rng() < 0.5) return [];
    return [plain[Math.floor(rng() * plain.length)].piece];
  }

  const pool = TRADITIONS.filter(t => eligible(t, ctx, privilege));
  if (pool.length === 0) return [];

  const wanted = pieceCount(privilege, rng());
  const chosen: OrnamentPiece[] = [];
  const used = new Set<string>();
  const remaining = [...pool];

  for (let i = 0; i < wanted && remaining.length > 0; i++) {
    // Bias toward what the portrait can actually draw, so the card and the
    // picture agree rather than the jewellery existing only in the text.
    const weights = remaining.map(t =>
      t.weight * (RENDERED.has(t.piece.type) ? 1.6 : 1) * (used.has(t.piece.type) ? 0.15 : 1));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = rng() * total;
    let index = 0;
    for (; index < remaining.length; index++) {
      roll -= weights[index];
      if (roll <= 0) break;
    }
    const pick = remaining[Math.min(index, remaining.length - 1)];
    remaining.splice(remaining.indexOf(pick), 1);
    used.add(pick.piece.type);
    chosen.push({ ...pick.piece, ...(pick.piece.gems ? { gems: [...pick.piece.gems] } : {}) });
  }

  return chosen;
}
