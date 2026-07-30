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
// The renderer's material vocabulary, which is a superset of the one this file
// speaks and is kept distinct from it on purpose: `OrnamentMaterial` here is
// the shared record format the card and the saved persona use, and it is not
// this file's business to teach them about kingfisher feather.
import type { OrnamentMaterial as RenderMaterial } from '../components/portraitLab/spec/types';
import { hasCapability } from '../constants/societyCapabilities';

export type OrnamentType =
  | 'necklace' | 'earrings' | 'bracelet' | 'ring' | 'circlet' | 'brooch' | 'chain' | 'anklet';
/**
 * What a piece is made of.
 *
 * Seven of these for a long time, and the shortage told: `bone` was carrying
 * ivory, tusk, tooth, antler and horn, `gems` was carrying every stone in the
 * world, and copper — the first metal most societies ever worked, and the one
 * you actually see on a West African or Andean body — had to arrive disguised
 * as bronze. Faience, feather, amber and jet had nowhere to go at all, so the
 * traditions that should have used them reached for bone instead, which is most
 * of why bone came out at 44% of every ornament in the app.
 */
export type OrnamentMaterial =
  | 'gold' | 'silver' | 'bronze' | 'copper' | 'gems' | 'pearl' | 'bone' | 'wood'
  | 'feather' | 'faience' | 'amber' | 'jet' | 'lacquer';
export type OrnamentStyle = 'simple' | 'ornate' | 'delicate' | 'chunky';

/**
 * How much of the wearer the piece occupies — a separate question from how
 * finely it is made.
 *
 * A Melanesian boar-tusk breastplate is plain work and enormous; a Georgian
 * mourning ring is exquisite and the size of a fingernail. `style` answers the
 * second question and was being asked to answer both, so everything in the app
 * came out the same middling size and a portrait could not tell you whether
 * somebody was wearing a statement or a keepsake.
 */
export type OrnamentScale = 'small' | 'medium' | 'large';

export interface OrnamentPiece {
  type: OrnamentType;
  material: OrnamentMaterial;
  style: OrnamentStyle;
  scale?: OrnamentScale;
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
 *
 * This list has to match `drawJewelry` in `portraitLab/art/details.ts` exactly,
 * and for a long time it did not: it promoted `bracelet` and `ring`, which the
 * renderer has no case for because a bust crop contains no hands, and left out
 * `brooch` and `chain`, which it draws. So the weighting was pushing pieces
 * *toward* the two slots guaranteed to be invisible — 104 pieces in 600
 * personas, assigned and then silently dropped — while under-weighting two that
 * would have shown. Anklets are in the same position as bracelets and rings.
 *
 * They stay in `OrnamentType` and still reach the equipment list, which is the
 * right home for a thing someone owns and wears out of frame. They simply must
 * not be the ones this table reaches for first.
 */
const RENDERED: ReadonlySet<OrnamentType> = new Set(['necklace', 'earrings', 'circlet', 'brooch', 'chain']);

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
 * The same stone, in the vocabulary the portrait renderer draws in.
 *
 * The card and the portrait have to agree about what a piece is made of, and
 * for a long time they did not: this file chose jade, wrote it into `gems` as
 * three greens, printed "jade beads" — and the renderer, which had no field to
 * receive the stone in, drew amethyst. So the identification lives here, beside
 * the table it identifies, and both readers take it from the same place.
 *
 * By exact hex, deliberately. Matching a bead's colour to the nearest stone
 * *seems* more forgiving and is wrong in the case that matters: `glass` is a
 * strand of mixed trade beads — blue, green, pink — so its members each land
 * nearest some other stone, and nearest-hue silently renames a glass necklace
 * to lapis. A stone is a fact about the object, not an inference from its
 * colour.
 */
const RENDER_MATERIAL: Record<keyof typeof GEM_SETS, RenderMaterial> = {
  earth: 'carnelian', turquoise: 'turquoise', lapis: 'lapis', jade: 'jade',
  shell: 'shell', coral: 'coral', garnet: 'ruby', glass: 'glass',
};

const MATERIAL_BY_HEX = new Map<string, RenderMaterial>(
  (Object.keys(GEM_SETS) as Array<keyof typeof GEM_SETS>).flatMap(
    key => GEM_SETS[key].map(hex => [hex.toLowerCase(), RENDER_MATERIAL[key]] as const)));

export function stoneMaterialForHex(hex: string | undefined): RenderMaterial | undefined {
  return hex ? MATERIAL_BY_HEX.get(hex.trim().toLowerCase()) : undefined;
}

/**
 * What the card says a piece is.
 *
 * `material` is a storage union rather than English — "gems" is not a
 * substance and "pearl" covers shell — so it has to be turned back into words a
 * reader would use. The scale goes in front where it is not the middle one,
 * because "heavy copper collar" and "small copper collar" are different objects
 * and the card was calling both of them the same thing.
 */
export function describeOrnament(piece: OrnamentPiece): string {
  const stone = piece.gems?.length ? STONE_BY_HEX.get(piece.gems[0]) : undefined;
  const noun =
    piece.material === 'gems' ? `${stone ?? 'stone'} beads`
    : piece.material === 'pearl' ? (stone === 'shell' ? 'shell' : 'pearl')
    : piece.material === 'feather' ? 'feather'
    : piece.material === 'faience' ? 'faience'
    : piece.material === 'lacquer' ? 'lacquer'
    : piece.material;
  const withStone = piece.material !== 'gems' && stone && stone !== 'shell'
    ? `${noun} set with ${stone}`
    : noun;
  const size = piece.scale === 'large' ? 'heavy ' : piece.scale === 'small' ? 'small ' : '';
  return `${size}${piece.style} ${withStone}`;
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
 * style and material carry the period, the scale carries how much of the wearer
 * it takes up, and the type decides where it is worn.
 *
 * Two things about this table were quietly wrong for a long time.
 *
 * The first is that the four entries at the top carry no `zones`, so they are
 * eligible *everywhere*, while any given place and century offers only a
 * handful of local practices to compete with them. Two of those four were bone.
 * The arithmetic of that is unforgiving: bone came out at 44% of every ornament
 * in the app, and a wall of personas from six continents were all wearing the
 * same pierced tooth. The global entries are now narrower in period, lower in
 * weight, and — the part that actually fixes it — outnumbered, because every
 * zone has been given the practices it should have had.
 *
 * The second is that this is a table about ornament, and ornament is the most
 * *conspicuous* thing most people in history owned. A broad faience collar, a
 * boar-tusk breastplate, a Berber fibula, a Zhou jade — these are not small
 * tasteful items, they are the whole point of the outfit, and the table had no
 * way to say so. Hence `scale`, and hence a good deal of `large`.
 */
const TRADITIONS: Tradition[] = [
  // ---- Before metal, anywhere ----
  // Deliberately few, deliberately early, deliberately outweighed by the local
  // entries below. These describe the deep past, not a default.
  { id: 'shell-strand', yearRange: [-12000, -3000], weight: 22,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', scale: 'medium', gems: [...GEM_SETS.shell] } },
  { id: 'pierced-tooth', yearRange: [-12000, -3500], weight: 16,
    piece: { type: 'necklace', material: 'bone', style: 'chunky', scale: 'large' } },
  { id: 'bone-ear-plug', yearRange: [-12000, -2000], weight: 10,
    piece: { type: 'earrings', material: 'bone', style: 'simple', scale: 'medium' } },
  { id: 'stone-bead', yearRange: [-12000, -2000], weight: 14,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.earth] } },

  // ---- Europe ----
  { id: 'eu-amber-strand', zones: ['EUROPEAN' as CulturalZone], yearRange: [-4000, 600], weight: 26,
    piece: { type: 'necklace', material: 'amber', style: 'chunky', scale: 'large' } },
  { id: 'eu-jet-pendant', zones: ['EUROPEAN' as CulturalZone], yearRange: [-2200, 1400], weight: 18,
    piece: { type: 'necklace', material: 'jet', style: 'simple', scale: 'medium' } },
  { id: 'eu-bronze-torc', zones: ['EUROPEAN' as CulturalZone], yearRange: [-2200, 100], weight: 28, minPrivilege: 0.4,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'bronze', style: 'chunky', scale: 'large' } },
  { id: 'eu-fibula', zones: ['EUROPEAN' as CulturalZone], yearRange: [-800, 700], weight: 30,
    requires: 'metallurgy', piece: { type: 'brooch', material: 'bronze', style: 'ornate', scale: 'medium', gems: [...GEM_SETS.garnet] } },
  { id: 'eu-roman-signet', zones: ['EUROPEAN' as CulturalZone], yearRange: [-300, 500], weight: 18, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'ring', material: 'gold', style: 'simple', scale: 'small', gems: [...GEM_SETS.earth] } },
  { id: 'eu-viking-armring', zones: ['EUROPEAN' as CulturalZone], yearRange: [750, 1150], weight: 22, minPrivilege: 0.4,
    requires: 'metallurgy', piece: { type: 'bracelet', material: 'silver', style: 'chunky', scale: 'large' } },
  { id: 'eu-pilgrim-badge', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1100, 1550], weight: 22,
    requires: 'metallurgy', piece: { type: 'brooch', material: 'bronze', style: 'simple', scale: 'small' } },
  { id: 'eu-rosary', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1250, 1900], weight: 26,
    piece: { type: 'chain', material: 'wood', style: 'simple', scale: 'medium' } },
  { id: 'eu-pearl-rope', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1500, 1800], weight: 18, minPrivilege: 0.7, sex: 'Female',
    piece: { type: 'necklace', material: 'pearl', style: 'delicate', scale: 'medium' } },
  { id: 'eu-mourning-ring', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1700, 1910], weight: 14, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'ring', material: 'gold', style: 'delicate', scale: 'small' } },
  // Whitby jet, cut for a court in mourning and then for everybody in it.
  { id: 'eu-jet-mourning', zones: ['EUROPEAN' as CulturalZone], yearRange: [1840, 1910], weight: 18, sex: 'Female',
    piece: { type: 'necklace', material: 'jet', style: 'ornate', scale: 'large' } },
  { id: 'eu-pocket-chain', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1800, 1950], weight: 18, sex: 'Male', minPrivilege: 0.4,
    requires: 'metallurgy', piece: { type: 'chain', material: 'silver', style: 'simple', scale: 'medium' } },
  { id: 'eu-wedding-band', zones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1850, 2030], weight: 28,
    requires: 'metallurgy', piece: { type: 'ring', material: 'gold', style: 'simple', scale: 'small' } },

  // ---- Mediterranean, Near East, North Africa ----
  // Faience is the most-produced ornamental material of the ancient world and
  // was missing from this table entirely; the broad collar is the single most
  // recognisable thing anyone in this zone and period wore.
  { id: 'mena-faience-collar', zones: ['MENA' as CulturalZone], yearRange: [-3000, -200], weight: 36,
    piece: { type: 'necklace', material: 'faience', style: 'chunky', scale: 'large' } },
  { id: 'mena-lapis-collar', zones: ['MENA' as CulturalZone], yearRange: [-3000, -300], weight: 22, minPrivilege: 0.5,
    piece: { type: 'necklace', material: 'gems', style: 'ornate', scale: 'large', gems: [...GEM_SETS.lapis] } },
  { id: 'mena-carnelian-strand', zones: ['MENA' as CulturalZone], yearRange: [-3000, 700], weight: 26,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.earth] } },
  { id: 'mena-hoop', zones: ['MENA' as CulturalZone], yearRange: [-2000, 1900], weight: 28,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'simple', scale: 'medium' } },
  { id: 'mena-silver-anklet', zones: ['MENA' as CulturalZone], yearRange: [-1000, 1950], weight: 20, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'anklet', material: 'silver', style: 'chunky', scale: 'large' } },
  { id: 'mena-amulet', zones: ['MENA' as CulturalZone], yearRange: [-2500, 1900], weight: 24,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'small', gems: [...GEM_SETS.turquoise] } },
  { id: 'mena-signet', zones: ['MENA' as CulturalZone], yearRange: [-2000, 1700], weight: 16, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'ring', material: 'silver', style: 'ornate', scale: 'small', gems: [...GEM_SETS.earth] } },
  // Amazigh fibulae: heavy silver, worn in pairs, and the family's savings.
  { id: 'mena-berber-fibula', zones: ['MENA' as CulturalZone], yearRange: [600, 1980], weight: 26, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'brooch', material: 'silver', style: 'chunky', scale: 'large' } },
  { id: 'mena-coral-headdress', zones: ['MENA' as CulturalZone], yearRange: [1100, 1950], weight: 18, sex: 'Female',
    piece: { type: 'circlet', material: 'gems', style: 'chunky', scale: 'large', gems: [...GEM_SETS.coral] } },

  // ---- South Asia ----
  // Shell and terracotta bangles are Harappan; glass ones only become ordinary
  // in the later first millennium BCE.
  { id: 'sa-shell-bangles', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-2500, 200], weight: 32, sex: 'Female',
    piece: { type: 'bracelet', material: 'pearl', style: 'chunky', scale: 'large', gems: [...GEM_SETS.shell] } },
  // Etched carnelian is a Harappan signature and travelled as far as Ur.
  { id: 'sa-etched-carnelian', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-2600, -1200], weight: 24,
    piece: { type: 'necklace', material: 'gems', style: 'ornate', scale: 'medium', gems: [...GEM_SETS.earth] } },
  { id: 'sa-glass-bangles', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-200, 2030], weight: 34, sex: 'Female',
    piece: { type: 'bracelet', material: 'gems', style: 'chunky', scale: 'large', gems: [...GEM_SETS.glass] } },
  { id: 'sa-jhumka', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [200, 2030], weight: 28, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'ornate', scale: 'large' } },
  { id: 'sa-gold-torc', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-300, 1300], weight: 16, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'gold', style: 'chunky', scale: 'large' } },
  { id: 'sa-rudraksha', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-500, 2030], weight: 22,
    piece: { type: 'necklace', material: 'wood', style: 'simple', scale: 'medium' } },
  { id: 'sa-nose-ring', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [1100, 2030], weight: 20, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'delicate', scale: 'small' } },
  { id: 'sa-toe-ring', zones: ['SOUTH_ASIAN' as CulturalZone], yearRange: [-200, 2030], weight: 14, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'ring', material: 'silver', style: 'simple', scale: 'small' } },

  // ---- East Asia ----
  { id: 'ea-jade-pendant', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-3000, 2030], weight: 30,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.jade] } },
  // Magatama: the comma-shaped bead of the Japanese and Korean archipelagos,
  // worn in heavy strands and buried with people who mattered.
  { id: 'ea-magatama', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-1000, 800], weight: 22,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', scale: 'large', gems: [...GEM_SETS.jade] } },
  { id: 'ea-hairpin', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-500, 1920], weight: 22, sex: 'Female', minPrivilege: 0.4,
    piece: { type: 'circlet', material: 'gems', style: 'delicate', scale: 'small', gems: [...GEM_SETS.jade] } },
  // Tian-tsui: kingfisher feather cut and glued over gilt silver. The renderer
  // has had a material for this since the headwear was written and nothing had
  // ever asked for it.
  { id: 'ea-kingfisher', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [500, 1900], weight: 16, sex: 'Female', minPrivilege: 0.65,
    piece: { type: 'circlet', material: 'feather', style: 'ornate', scale: 'large' } },
  { id: 'ea-lacquer-pin', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [700, 1900], weight: 16, sex: 'Female',
    piece: { type: 'circlet', material: 'lacquer', style: 'simple', scale: 'small' } },
  { id: 'ea-cash-string', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [-200, 1900], weight: 20,
    requires: 'coinage', piece: { type: 'chain', material: 'bronze', style: 'simple', scale: 'medium' } },
  { id: 'ea-silver-collar', zones: ['EAST_ASIAN' as CulturalZone], yearRange: [1000, 1950], weight: 18, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'silver', style: 'ornate', scale: 'large' } },

  // ---- Southeast Asia ----
  // This zone had no entries at all, so every persona in it fell through to the
  // four global prehistoric practices — which is the single largest source of
  // the bone problem, and also why maritime Southeast Asia had no gold in an
  // app covering maritime Southeast Asia.
  { id: 'sea-gold-earflare', zones: ['SOUTHEAST_ASIAN' as CulturalZone], yearRange: [-500, 1600], weight: 28,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'chunky', scale: 'large' } },
  { id: 'sea-hornbill-feather', zones: ['SOUTHEAST_ASIAN' as CulturalZone], yearRange: [-2000, 1960], weight: 24,
    piece: { type: 'circlet', material: 'feather', style: 'chunky', scale: 'large' } },
  { id: 'sea-glass-bead', zones: ['SOUTHEAST_ASIAN' as CulturalZone], yearRange: [-300, 2030], weight: 28,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.glass] } },
  { id: 'sea-shell-armlet', zones: ['SOUTHEAST_ASIAN' as CulturalZone], yearRange: [-3000, 1900], weight: 22,
    piece: { type: 'bracelet', material: 'pearl', style: 'chunky', scale: 'large', gems: [...GEM_SETS.shell] } },
  { id: 'sea-carnelian-trade', zones: ['SOUTHEAST_ASIAN' as CulturalZone], yearRange: [-200, 1400], weight: 20,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.earth] } },

  // ---- Sub-Saharan Africa ----
  // Stone and eggshell beadwork is ancient here; the glass bead is a trade good
  // that arrives with the Indian Ocean and Saharan networks, not before them.
  { id: 'ssa-ostrich-eggshell', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-8000, 1950], weight: 26,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', scale: 'medium', gems: [...GEM_SETS.shell] } },
  { id: 'ssa-stone-collar', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-3000, 700], weight: 28,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', scale: 'large', gems: [...GEM_SETS.earth] } },
  { id: 'ssa-glass-collar', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [700, 2030], weight: 34,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', scale: 'large', gems: [...GEM_SETS.glass] } },
  // Copper, not bronze. It is the metal this zone actually worked and traded in
  // ingots, and it was only ever filed under bronze because there was no slot.
  { id: 'ssa-copper-cuff', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-500, 2030], weight: 28,
    requires: 'metallurgy', piece: { type: 'bracelet', material: 'copper', style: 'chunky', scale: 'large' } },
  { id: 'ssa-copper-collar', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-200, 1900], weight: 22,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'copper', style: 'chunky', scale: 'large' } },
  { id: 'ssa-cowrie', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-2000, 1950], weight: 26,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', scale: 'medium', gems: [...GEM_SETS.shell] } },
  { id: 'ssa-brass-collar', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [1300, 2030], weight: 22, minPrivilege: 0.4,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'bronze', style: 'chunky', scale: 'large' } },
  { id: 'ssa-gold-ornament', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [800, 1900], weight: 18, minPrivilege: 0.6,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'gold', style: 'ornate', scale: 'large' } },
  { id: 'ssa-amber-strand', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [900, 1950], weight: 16,
    piece: { type: 'necklace', material: 'amber', style: 'chunky', scale: 'large' } },
  { id: 'ssa-ivory-band', zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone], yearRange: [-500, 1900], weight: 14, minPrivilege: 0.5,
    piece: { type: 'bracelet', material: 'bone', style: 'chunky', scale: 'large' } },

  // ---- The Americas ----
  { id: 'am-turquoise', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-1000, 2030], weight: 30,
    piece: { type: 'necklace', material: 'gems', style: 'chunky', scale: 'large', gems: [...GEM_SETS.turquoise] } },
  { id: 'am-shell-gorget', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-2000, 1800], weight: 24,
    piece: { type: 'necklace', material: 'pearl', style: 'simple', scale: 'large', gems: [...GEM_SETS.shell] } },
  { id: 'am-turkey-feather', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-1000, 1900], weight: 24,
    piece: { type: 'circlet', material: 'feather', style: 'chunky', scale: 'large' } },
  // Native copper, cold-hammered — Old Copper Complex, then Hopewell and
  // Mississippian repoussé plates. No smelting involved, so no capability gate.
  { id: 'am-copper-plate', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-4000, 1600], weight: 20,
    piece: { type: 'brooch', material: 'copper', style: 'ornate', scale: 'large' } },
  { id: 'am-abalone', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-3000, 1900], weight: 20,
    piece: { type: 'earrings', material: 'pearl', style: 'chunky', scale: 'large', gems: [...GEM_SETS.shell] } },
  { id: 'am-quillwork-band', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone], yearRange: [-3000, 1900], weight: 18,
    piece: { type: 'circlet', material: 'bone', style: 'simple', scale: 'medium' } },
  { id: 'am-trade-silver', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone],
    yearRange: [1650, 1900], weight: 22, requires: 'european_contact',
    piece: { type: 'brooch', material: 'silver', style: 'ornate', scale: 'medium' } },

  { id: 'sam-tupu', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-500, 1900], weight: 26, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'brooch', material: 'silver', style: 'simple', scale: 'medium' } },
  { id: 'sam-gold-ear-spool', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-800, 1550], weight: 22, minPrivilege: 0.55,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'chunky', scale: 'large' } },
  { id: 'sam-spondylus', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-2500, 1600], weight: 26,
    piece: { type: 'necklace', material: 'pearl', style: 'chunky', scale: 'large', gems: [...GEM_SETS.coral] } },
  // Andean and Amazonian featherwork, which is the most colour anyone anywhere
  // put on a body before aniline dye.
  { id: 'sam-feather-collar', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-1000, 1700], weight: 24,
    piece: { type: 'circlet', material: 'feather', style: 'chunky', scale: 'large' } },
  { id: 'sam-copper-disc', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-1500, 1550], weight: 18,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'copper', style: 'chunky', scale: 'large' } },
  { id: 'sam-seed-strand', zones: ['SOUTH_AMERICAN' as CulturalZone], yearRange: [-4000, 2030], weight: 22,
    piece: { type: 'necklace', material: 'wood', style: 'simple', scale: 'medium' } },

  // ---- Oceania ----
  { id: 'oc-shell-valuable', zones: ['OCEANIA' as CulturalZone], yearRange: [-4000, 2030], weight: 30,
    piece: { type: 'necklace', material: 'pearl', style: 'chunky', scale: 'large', gems: [...GEM_SETS.shell] } },
  { id: 'oc-boar-tusk', zones: ['OCEANIA' as CulturalZone], yearRange: [-3000, 1950], weight: 24,
    piece: { type: 'necklace', material: 'bone', style: 'chunky', scale: 'large' } },
  { id: 'oc-whale-tooth', zones: ['OCEANIA' as CulturalZone], yearRange: [-1000, 1950], weight: 20, minPrivilege: 0.45,
    piece: { type: 'necklace', material: 'bone', style: 'ornate', scale: 'large' } },
  { id: 'oc-feather-lei', zones: ['OCEANIA' as CulturalZone], yearRange: [-1500, 2030], weight: 24,
    piece: { type: 'circlet', material: 'feather', style: 'chunky', scale: 'large' } },
  { id: 'oc-greenstone', zones: ['OCEANIA' as CulturalZone], yearRange: [1000, 2030], weight: 22,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.jade] } },

  // ---- Modern, everywhere ----
  { id: 'modern-watch-chain', yearRange: [1880, 1960], weight: 12, minPrivilege: 0.5,
    requires: 'metallurgy', piece: { type: 'chain', material: 'silver', style: 'simple', scale: 'medium' } },
  { id: 'modern-studs', yearRange: [1950, 2030], weight: 22, sex: 'Female',
    requires: 'metallurgy', piece: { type: 'earrings', material: 'gold', style: 'delicate', scale: 'small' } },
  { id: 'modern-crucifix', yearRange: [1850, 2030], weight: 18,
    requires: 'metallurgy', piece: { type: 'necklace', material: 'silver', style: 'delicate', scale: 'small' } },
  { id: 'colonial-glass-bead', zones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1600, 1900], weight: 24,
    piece: { type: 'necklace', material: 'gems', style: 'simple', scale: 'medium', gems: [...GEM_SETS.glass] } },
  { id: 'colonial-hoop', zones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone], yearRange: [1600, 1950], weight: 18,
    requires: 'metallurgy', piece: { type: 'earrings', material: 'silver', style: 'simple', scale: 'medium' } },
];

const PRIVILEGE: Record<string, number> = {
  destitute: 0.05, poor: 0.2, modest: 0.4, comfortable: 0.65, wealthy: 0.9,
};

/**
 * Metal needs smelting; everything else a person can find or trade for.
 *
 * Copper is the exception that has to be stated: native copper is found in
 * usable lumps and was cold-hammered into sheet for five thousand years by
 * people with no smelting at all — Old Copper Complex, Hopewell, Mississippian.
 * Gating it behind metallurgy would delete the earliest metalwork in the
 * Americas, so traditions that mean *smelted* copper declare `requires`
 * themselves and the rest are left alone.
 */
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
