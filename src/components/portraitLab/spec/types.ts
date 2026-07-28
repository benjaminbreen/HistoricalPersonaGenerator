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

/**
 * How the hair is *arranged*, as distinct from how long it is and what it does
 * on its own. Length and texture were the only two axes for a long time, and a
 * contact sheet of forty-two personas made the cost obvious: every one of them
 * wore the same bowl cut at a slightly different length. Silhouette is the
 * loudest signal at 96px — louder than any amount of interior shading — and
 * arrangement is also the part of hair that carries culture and period, which
 * is exactly what this project is trying to show.
 *
 * The vocabulary is small on purpose. Each entry has to be distinguishable from
 * every other entry *in outline alone*, at thumbnail size, on a head that may
 * also be wearing a hat. A `chignon` and a `gathered_bun` are different things
 * to a historian of dress and the same seven pixels to this renderer, so they
 * share `bun` and the difference lives in the prose instead.
 */
export type HairSilhouette =
  | 'loose'         // falls free; the old behaviour, and still the commonest
  | 'bangs'         // blunt fringe cut straight across the forehead
  | 'bowl'          // fringe plus a blunt horizontal edge at the jaw
  | 'bob'           // blunt jaw-length, no fringe, ears exposed
  | 'swept'         // parted off-centre and swept across
  | 'tied_back'     // pulled back off the face, gathered low
  | 'ponytail'      // gathered high, tail falling behind one shoulder
  | 'bun'           // gathered into a knot high at the back of the crown
  | 'top_knot'      // knot standing on top of the crown, bound at the base
  | 'twin_buns'     // two knots, one above each temple
  | 'updo'          // piled above the crown, wider than the skull
  | 'braid_single'  // one plait falling forward over a shoulder
  | 'braid_twin'    // two plaits framing the face
  | 'braid_crown'   // plaits wound around the head above the hairline
  | 'locs'          // hanging ropes, separated to the ends
  | 'cornrows'      // rows braided flat against the scalp
  | 'afro'          // a halo standing out evenly all round
  | 'tonsure'       // shaved crown inside a ring of hair
  | 'shaved_sides'; // shaved at the temples, mass kept along the midline
export type Build =
  | 'slight' | 'average' | 'stocky' | 'heavy' | 'athletic' | 'tall' | 'short' | 'imposing';

export type GarmentKind =
  | 'tunic' | 'robe' | 'gown' | 'doublet' | 'work_shirt' | 'wrapped_garment' | 'jacket' | 'bare';

export type HeadwearKind =
  | 'none' | 'cap' | 'brimmed_hat' | 'wrapped_cloth' | 'veil' | 'hood'
  | 'helmet' | 'coronet' | 'band';

/**
 * Conical woven sunhats — douli, sugegasa, salakot, non la, and every other
 * name for a cone of plant fibre. They share `brimmed_hat` with felt hats
 * because they are structurally a crown plus a brim, and the renderer branches
 * on this pattern to draw the cone.
 *
 * It lives here because both the adapter that classifies a hat and the renderer
 * that draws it need the same answer, and when the two lists were maintained
 * separately they drifted: the classifier knew `sugegasa` and the renderer did
 * not, so a sedge sunhat was routed correctly and then drawn as a bowler.
 * Matched against "<name> <material>" — the fibre is often the better signal.
 */
/**
 * Hats that are actually cone-shaped.
 *
 * `straw` used to be in this list, which made every straw hat on earth render
 * as an East Asian conical one — the same pointed silhouette turned up on a
 * Brazilian farmer, a Ryukyu farmer and a Filipino farmer, and read as a bug
 * even where it happened to be plausible. Straw is a material, not a shape: a
 * Mediterranean sun hat and a nón lá are both straw and look nothing alike.
 * The genuinely conical forms are named in the clothing tables (Douli,
 * Sugegasa, Bamboo Hat), so matching those names is enough.
 */
export const CONICAL_HAT_PATTERN =
  /conical|dou ?li|douli|coolie|sedge|kasa|sugegasa|salakot|non la|nón lá|bamboo|rattan|palm leaf|pandanus|rice hat/;

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
  /** The app's raw style name, kept for debugging and for the audit report. */
  hairstyle: string;
  /** `hairstyle` resolved to something the renderer can actually draw. */
  hairSilhouette: HairSilhouette;
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
