/**
 * portraitLab/spec/types.ts
 *
 * The PortraitSpec is the only thing the renderer knows about. Everything the
 * app already computes — the authenticity context packs, the clothing tables,
 * the cultural markings, the disease model, the Big Five personality vector —
 * is funnelled through `buildPortraitSpec` into this shape, and the art code
 * never touches an app type. That boundary is what lets this system live beside
 * the existing renderer instead of fighting it.
 */

export type Gender = 'Male' | 'Female' | 'Non-binary';

export type FaceShape = 'oval' | 'round' | 'square' | 'long' | 'heart' | 'diamond';
export type EyeShape = 'almond' | 'round' | 'narrow' | 'wide' | 'hooded';
export type NoseShape = 'straight' | 'aquiline' | 'broad' | 'button' | 'roman';
export type LipShape = 'thin' | 'medium' | 'full' | 'bow' | 'wide';
export type Jawline = 'sharp' | 'soft' | 'square' | 'round' | 'oval';
export type Cheekbones = 'high' | 'average' | 'low';
export type BrowShape = 'straight' | 'arched' | 'rounded' | 'angular';
export type BrowThickness = 'thin' | 'medium' | 'thick' | 'bushy';
export type HairLength = 'bald' | 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily' | 'kinky';
export type Build =
  | 'slight' | 'average' | 'stocky' | 'heavy' | 'athletic' | 'tall' | 'short' | 'imposing';

export type GarmentKind =
  | 'tunic' | 'robe' | 'gown' | 'doublet' | 'work_shirt' | 'wrapped_garment' | 'jacket' | 'bare';

export type HeadwearKind =
  | 'none' | 'cap' | 'brimmed_hat' | 'wrapped_cloth' | 'veil' | 'hood'
  | 'helmet' | 'coronet' | 'band';

export type FacialHairStyle =
  | 'full_beard' | 'goatee' | 'mustache' | 'stubble' | 'van_dyke' | 'soul_patch'
  | 'mutton_chops' | 'imperial' | 'handlebar' | 'forked_beard' | 'chin_curtain' | 'verdi';

/**
 * The renderer's expression vocabulary. Deliberately small: at 96px a face has
 * room for about a dozen legible states, and inventing more just produces
 * mush. External expression names are mapped onto these.
 */
export type Expression =
  | 'neutral' | 'content' | 'smile' | 'grin' | 'smirk'
  | 'sad' | 'concern' | 'scowl' | 'weary' | 'guarded'
  | 'surprise' | 'thinking' | 'determined';

export interface SpecColorSet {
  primary: string;
  secondary: string;
  accent: string;
}

export interface GarmentSpec {
  kind: GarmentKind;
  name: string;
  material: string;
  colors: SpecColorSet;
  /** Trim, embroidery, and metal fittings scale with this. */
  ornament: number;
}

export interface HeadwearSpec {
  kind: HeadwearKind;
  name: string;
  material: string;
  color: string;
  accent: string;
  ornament: number;
}

export interface JewelrySpec {
  type: 'necklace' | 'earrings' | 'bracelet' | 'ring' | 'circlet' | 'brooch' | 'chain' | 'anklet';
  material: 'gold' | 'silver' | 'bronze' | 'gems' | 'pearl' | 'bone' | 'wood';
  style: 'simple' | 'ornate' | 'delicate' | 'chunky';
}

export interface MarkingSpec {
  /**
   * `culturalMarkings.ts` emits more than the portrait vocabulary originally
   * assumed — piercings are the single most common marking in real output, and
   * structural modifications (lip plates, ear plugs, neck coils) appear too.
   */
  type:
    | 'scar' | 'tattoo' | 'paint' | 'beauty_mark' | 'freckles' | 'mole'
    | 'birthmark' | 'piercing' | 'structural' | 'henna' | 'scarification';
  location: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  pattern?: string;
}

export interface ConditionSpec {
  healthRatio: number;
  fatigueRatio: number;
  /** Lowercased disease names, already normalised. */
  diseases: string[];
  severity: 0 | 1 | 2 | 3;
  pallor: number;
  fever: number;
}

export interface MoodSpec {
  /** -1 despondent .. +1 delighted. Drives the resting mouth and brow. */
  valence: number;
  /** 0 heavy-lidded .. 1 alert. Drives lid aperture and blink rate. */
  energy: number;
  /** 0 open .. 1 closed off. Narrows the eyes and lowers the brow. */
  guarded: number;
}

export interface BackgroundSpec {
  base: string;
  accent: string;
  vignette: boolean;
  texture: 'none' | 'subtle' | 'grain';
}

export interface PortraitSpec {
  seed: number;
  gender: Gender;
  age: number;

  skinColor: string;
  hairColor: string;
  eyeColor: string;
  lipColor?: string;

  faceShape: FaceShape;
  jawline: Jawline;
  cheekbones: Cheekbones;
  eyeShape: EyeShape;
  noseShape: NoseShape;
  lipShape: LipShape;
  browShape: BrowShape;
  browThickness: BrowThickness;
  eyelashes: 'short' | 'medium' | 'long';

  hairLength: HairLength;
  hairTexture: HairTexture;
  hairstyle: string;
  /** 0..1, blended into the hair colour before ramping. */
  grayAmount: number;
  /** 0..1, receded hairline for older men. */
  recession: number;

  facialHair: { style: FacialHairStyle; thickness: 'sparse' | 'medium' | 'thick' } | null;

  build: Build;
  /** 0..1, drives crow's feet, nasolabial folds, and jowls. */
  ageLines: number;
  /** 0..1, how far the upper lid has folded down over the lash line. */
  lidDroop: number;

  garment: GarmentSpec;
  headwear: HeadwearSpec | null;
  jewelry: JewelrySpec[];
  markings: MarkingSpec[];
  glasses: { style: 'round' | 'square' | 'oval' | 'half_rim' } | null;

  condition: ConditionSpec;
  mood: MoodSpec;
  background: BackgroundSpec;

  contextPackId?: string;
  culturalZone?: string;
  era?: string;
  wealth: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
}
