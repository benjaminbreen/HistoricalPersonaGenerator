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

import { LegwearForm } from './garmentLayers';

export type Gender = 'Male' | 'Female' | 'Non-binary';

export type FaceShape = 'oval' | 'round' | 'square' | 'long' | 'heart' | 'diamond';
export type EyeShape = 'almond' | 'round' | 'narrow' | 'wide' | 'hooded' | 'large';
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
/**
 * Hats whose *name* says they are cones. These are cones wherever they turn up.
 */
export const CONICAL_HAT_PATTERN =
  /conical|dou ?li|douli|coolie|sedge|kasa|sugegasa|salakot|non la|nón lá|rice hat/;

/**
 * Hats whose name says only what they are woven from.
 *
 * `bamboo`, `straw` and `palm` used to live in the pattern above, which quietly
 * asserted that every plant-fibre hat on earth is an East Asian cone. "Straw
 * Hat" is the single commonest head item in the app — one persona in seven
 * wears one — so that assertion was doing real damage: Provençal farmhands and
 * Andean herders were all issued the same douli. What a woven hat is shaped
 * like is a question about *where*, and the renderer answers it by zone.
 */
export const WOVEN_HAT_PATTERN =
  /straw|bamboo|rattan|reed|sedge|grass|palm|raffia|pandanus|cane|fibre|fiber|wicker/;

/**
 * Where a hat named only for its fibre is a cone anyway.
 *
 * The other half of the rule above, and it lives here for exactly the reason
 * the patterns do: both renderers have to reach the same verdict about the
 * same hat, and while this sat privately in `art/headwear.ts` only one of them
 * could. The sprite tested the name alone, so a Gangetic Plain rice farmer's
 * straw hat was a shallow sunhat in her portrait and a flat-topped cylinder in
 * her sprite — the two pictures beside each other on one card, disagreeing.
 */
export const CONICAL_ZONES = new Set(['EAST_ASIAN', 'SOUTH_ASIAN', 'OCEANIA']);

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

/**
 * How a cloth is decorated, as distinct from what it is cut into.
 *
 * The same collapse as the headgear: 490 garment names, eight silhouettes. But
 * a garment decorates differently from a hat — nothing is *stuck on* it, the
 * treatment is in the weave or along the edge — so it wants its own vocabulary
 * rather than the ornament one. 23% of the entries in `clothing.ts` name a
 * surface, and they group tightly: 37 brocade or figured, 26 printed or
 * painted, 12 embroidered, 11 lace, 11 fur, 8 patterned, 8 beaded.
 *
 * Split by where they live. `brocade`, `print` and `stripe` cover the field;
 * the rest are edge treatments, which matters because the frame leaves only
 * about seventeen rows of chest below the collar — and the neckline is the part
 * of a garment a bust portrait actually shows.
 */
export type GarmentSurfaceKind =
  | 'brocade'    // a woven motif, tone on tone, catching light at the turns
  | 'print'      // a bolder repeat in a contrasting dye
  | 'stripe'     // woven bands
  | 'embroidery' // a worked band following the neckline
  | 'lace'       // openwork at the edge
  | 'furTrim'    // a soft broken edge
  | 'beading';   // beads or spangles along the neck

export interface GarmentSurfaceSpec {
  kind: GarmentSurfaceKind;
  /** Reuses the ornament palette, so gold thread here is gold there. */
  material: OrnamentMaterial;
  /** 0..1 — how dense and how bright. Wealth and material both feed it. */
  intensity: number;
}

/**
 * The state a garment is in, as distinct from what it is or how it is decorated.
 *
 * `clothing.ts` has carried an `adjectives` field on every clothing piece since
 * it was written — 260 of them — and the persona card prints it in words beside
 * the portrait: "Rough, Patched Deer Hide Hide Wrap". The renderer never saw it,
 * because the adapter's `Piece` type had three fields and this was not one of
 * them. So the card said patched and the picture drew new cloth.
 *
 * Wear is worth more than any amount of trim for what this app is trying to
 * show. Ornament is how the rich are told apart from each other; wear is how
 * most of the population is told apart from the rich, and until now the only
 * thing separating a poor persona's clothing from a comfortable one's was dye
 * saturation and the width of a collar band.
 *
 * Deliberately small, and each entry has to be legible in the twenty-seven rows
 * of chest the frame allows. "Ceremonial", "Practical" and "Imported" are real
 * adjectives in the data and say nothing a bust portrait can draw, so they are
 * not here.
 */
export type GarmentWearKind =
  | 'patched'   // a square of other cloth set in and stitched round
  | 'darned'    // a worked mend, smaller and in the garment's own colour
  | 'torn'      // an unmended split, the cloth parting
  | 'faded'     // the dye gone where the light reaches it
  | 'worn'      // the nap rubbed off the crests: shoulders, fold tops
  | 'stained';  // what the work leaves on the front of what you work in

export interface GarmentWearSpec {
  kind: GarmentWearKind;
  /** 0..1 — how far it has gone. Poverty and age both feed it. */
  intensity: number;
}

/**
 * What is on the chest, when the lower body is a skirt.
 *
 * A skirted construction is two garments and the eye reads the join, which is
 * why the sprite draws them in two colours. But *which* colour goes on the
 * chest is not a drawing decision, it is a fact about the item — and with the
 * two renderers deciding it separately they disagreed on every persona who
 * wore one. The sprite painted the chest in the palette's secondary while the
 * bust painted it in the garment's own colour, so a walnut sari came out
 * walnut to the collar in the portrait and cream in the sprite, side by side
 * on one card.
 *
 * The split is real and the item's name carries it. A sari, wrapper or shawl
 * takes its own cloth over the shoulder, so the chest is the named garment.
 * A skirt, petticoat or lehenga names only the lower half and the bodice above
 * it is a separate blouse the item never mentions.
 */
export type BodiceSource =
  /** The named cloth covers the chest too — a drape over the shoulder. */
  | 'self'
  /** The name is the lower garment; the chest is an unnamed blouse. */
  | 'separate';

export interface GarmentSpec {
  kind: GarmentKind;
  name: string;
  material: string;
  colors: SpecColorSet;
  /**
   * Set only for skirted constructions, where the chest and the lower body are
   * different garments. Null means one piece of cloth, and both views draw the
   * whole thing in `colors.primary`.
   */
  bodice: BodiceSource | null;
  /** Trim, embroidery, and metal fittings scale with this. */
  ornament: number;
  /** Decoration read out of the item's own name. */
  surfaces: GarmentSurfaceSpec[];
  /** What the item's own adjectives say has happened to it. */
  wear: GarmentWearSpec[];
}

/**
 * The lower garment, where the outfit names one of its own.
 *
 * Null for most of the range this app covers, and that is the honest answer: a
 * robe, a sari, a kalasiris and a tunic are one garment for the whole figure,
 * and whatever is under them is neither named nor visible. From about the
 * nineteenth century the lower half becomes a named thing — jeans, chinos, a
 * skirt, churidar — and until this existed the renderers had nowhere to put it.
 * The bust never draws it, but it is here rather than in the sprite's own
 * source because the *colour* has to be resolved once: both views build their
 * ramps off the spec, and a persona whose card says denim should not be indigo
 * in one picture and oatmeal in the other.
 */
export interface LegwearSpec {
  name: string;
  material: string;
  color: string;
  /** Resolved once here so the two renderers cannot disagree about the shape. */
  form: LegwearForm;
}

export interface HeadwearSpec {
  kind: HeadwearKind;
  name: string;
  material: string;
  color: string;
  accent: string;
  ornament: number;
  /** The decorative parts this item is made of, read out of its own name. */
  ornaments: OrnamentSpec[];
}

/**
 * The decorative parts an item is *made of*, as opposed to what shape it is.
 *
 * The clothing tables carry 263 distinct headgear names and this renderer had
 * nine forms to draw them with, so a Kingfisher-Feather Hair Ornament, a Gilt
 * Hairpin Set and a plain linen fillet all came out as the same strip across
 * the brow. Enumerating the 263 is not a plan — the list grows — but counting
 * the words in those names shows the decoration is drawn from a much smaller
 * pot than the names are: 48 mention feathers, 50 a precious metal, 46 a stone
 * or a bead, 15 flowers, and so on down.
 *
 * So the parts are the vocabulary, and the items are compositions of them. A
 * kingfisher ornament is a gilt pin plus a feather in kingfisher blue; an
 * ostrich plume headdress is the same feather at a different scale and
 * material. Eight primitives, authored once and carefully, cover the corpus.
 */
export type OrnamentKind =
  | 'feather'    // a single quill, spine lit, barbs notched
  | 'plume'      // a spray of them, opening away from the head
  | 'pin'        // a shaft with a worked head — hairpin, stickpin, skewer
  | 'comb'       // a toothed crest set into the hair
  | 'beadStrand' // beads hung in a line, swinging free
  | 'gem'        // one set stone, in a claw or a bezel
  | 'flower'     // fresh or worked
  | 'medallion'; // a flat disc, boss or plaque

/**
 * What the part is made of. This is where the vividness lives: at 96px a bead
 * is three pixels and the *relationship* between those three colours is the
 * entire illusion of the material.
 */
export type OrnamentMaterial =
  | 'gold' | 'gilt' | 'silver' | 'bronze' | 'copper'
  | 'jade' | 'turquoise' | 'lapis' | 'coral' | 'amber' | 'ruby' | 'emerald'
  | 'carnelian' | 'glass' | 'faience' | 'jet'
  | 'pearl' | 'kingfisher' | 'shell' | 'bone' | 'wood' | 'lacquer'
  | 'plumeDark' | 'plumeWhite' | 'plumeBright' | 'cloth';

/** Where on the head the part sits. */
export type OrnamentPlacement = 'crown' | 'temple' | 'brow' | 'side';

export interface OrnamentSpec {
  kind: OrnamentKind;
  material: OrnamentMaterial;
  placement: OrnamentPlacement;
  /** How many, before the frame gets a say. */
  count: number;
  /** 0..1 — how showy. Drives size, and whether a pin gets a gem on its head. */
  scale: number;
  /** Mirrored on both sides, or worn on one only. */
  paired: boolean;
}

/**
 * What a piece is made of, and what is set into it.
 *
 * `material` used to be a seven-value union with a slot literally called
 * `gems`, into which jade, turquoise, lapis, amber, coral, garnet, carnelian,
 * crystal and glass were all funnelled — and which the renderer then drew in a
 * single hardcoded amethyst. Meanwhile `ornamentService` knew perfectly well
 * which stone it was, printed the word on the card, and had nowhere to put it:
 * `gems: ['#4f9a6a']` reached the spec adapter and was dropped on the floor. So
 * a card reading "simple jade beads" sat beside a portrait wearing purple, and
 * the two were reading different records of the same object.
 *
 * Both fields now speak `OrnamentMaterial`, the vocabulary the headwear
 * ornaments have used all along — twenty-odd substances with their own
 * contrast, sheen hue and specular behaviour. There is one material table in
 * this renderer now, not two, and the jewellery is drawn from the good one.
 */
export interface JewelrySpec {
  type: 'necklace' | 'earrings' | 'bracelet' | 'ring' | 'circlet' | 'brooch' | 'chain' | 'anklet';
  /** The body of the piece: the metal of a chain, the substance of a bead. */
  material: OrnamentMaterial;
  /**
   * A stone set into it, where the piece has one — the drop on a hoop, the
   * boss of a brooch, the pendant at the low point of a necklace. Absent means
   * the piece is all one substance, and those parts are drawn in `material`.
   */
  stone?: OrnamentMaterial;
  style: 'simple' | 'ornate' | 'delicate' | 'chunky';
  /**
   * How much of the wearer the piece takes up, as distinct from how finely it
   * is worked. Ornament is the most conspicuous thing most people in history
   * owned, and with only `style` to go on every piece in the app came out the
   * same modest size — a boar-tusk breastplate drawn at the scale of a
   * mourning ring.
   */
  scale: 'small' | 'medium' | 'large';
}

/**
 * A skull shaped in infancy by binding. Practised independently across the
 * Andes, Mesoamerica, the Eurasian steppe, Merovingian Europe and elsewhere,
 * and unmistakable at any resolution — which is the point of drawing it.
 */
export type SkullShape = 'natural' | 'elongated';

export interface DentalWork {
  /** Lacquered black (ohaguro and its relatives), filed to points, or inlaid. */
  style: 'blackened' | 'filed' | 'inlay';
  /** Inlay stone: jade, turquoise, gold. Ignored by the other two. */
  color: string;
}

/**
 * How this persona is holding themselves.
 *
 * A portrait set where every sitter faces the lens square-on at the same size
 * reads as generated no matter how well each individual face is drawn — it is
 * the one thing a hundred portraits have in common that a hundred real ones
 * never would. But pose used as decoration is worse than none: a random tilt
 * says nothing, and the viewer learns to ignore it.
 *
 * So pose is a *signal*. The canonical bust is the default and stays the
 * default for most of the population; a deviation appears only when the persona
 * is an outlier on some axis the app already tracks, and the same deviation
 * always means the same thing. Someone who reads fifty of these should be able
 * to learn the vocabulary without being told it: the big ones fill the frame,
 * the wary ones draw back, the ones bent by their work are bent in the picture.
 *
 * `reason` carries the attribute that claimed the pose, for the audit — the
 * point of the whole exercise is that most portraits have no reason at all, and
 * that is measurable rather than hoped for.
 */
export interface PoseSpec {
  /** Head scale about the chin. 1 is canonical; the frame does not move. */
  scale: number;
  /** Whole figure up (negative) or down the frame, in pixels. */
  offsetY: number;
  /** Chin raised (negative) or tucked (positive), in pixels of feature shift. */
  chin: number;
  /** Head roll, in pixels of horizontal shear per row. Positive leans right. */
  tilt: number;
  /** Head turned off-axis, in pixels. Positive turns to the viewer's right. */
  turn: number;
  /** Shoulder line: one side dropped, in pixels. */
  shoulderDrop: number;
  /** Shoulders pulled forward and up — a stoop, or a flinch. 0..1. */
  hunch: number;
  /** Shoulders squared and the neck shortened; negative narrows and lengthens. */
  square: number;
  /** The attribute this pose came from, or null for the canonical bust. */
  reason: string | null;
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

/**
 * Permanent facts about a face, as distinct from what is currently wrong with
 * one. `ConditionSpec` says a persona has smallpox; this says they survived it
 * thirty years ago and carry the pits. Both can be true, and they are drawn
 * differently — an active rash is red and raised, an old pock is a colourless
 * pit — so they are separate fields rather than one.
 *
 * These come from the app's `attributes`, which the adapter ignored entirely
 * until now. That mattered more than the usual missing-axis complaint: a
 * persona whose own attribute list says `pox_scarred` was rendering with clear
 * skin, on a card that prints the attribute in words directly beside the
 * portrait. The picture was contradicting the text about the same person.
 */
export interface FaceTraits {
  /** Hollow cheeks and temples. Not thinness — the face, specifically. */
  gaunt: boolean;
  /** Healed smallpox pits. */
  poxScarred: boolean;
  /** Lost teeth: the lips fall inward and the mouth narrows. */
  toothless: boolean;
  /** One or both eyes clouded. */
  blind: boolean;
  /**
   * A divergent eye, and which one: -1 for the sitter's right, +1 for the left,
   * 0 for neither.
   *
   * Drawn by pushing that eye's gaze outward while the other holds the viewer.
   * `drawEye` has taken a per-eye `gazeX` since it was written — both eyes were
   * simply always handed the same number — so the whole cost of this is
   * deciding which side and by how much.
   */
  wallEye: -1 | 0 | 1;
  /**
   * Two differently coloured irises. The value is the second colour, applied to
   * the sitter's left eye; null when both eyes match.
   */
  heterochromia: string | null;
  /** A swelling at the base of the throat — endemic goitre, and it is large. */
  goiter: boolean;
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
  /**
   * A face this persona wears *instead of* the one their valence implies,
   * when their personality is pronounced enough to deserve one.
   *
   * Valence, energy and guardedness are three axes and between them they can
   * only really say cheerful, grim or neither — which is why most of the
   * expression vocabulary was only ever reachable by hovering. Someone very
   * curious does not look happier than average; they look like they are
   * thinking. Kept on the mood rather than passed as another argument so that
   * `restingExpression` keeps its two-parameter signature and every existing
   * caller — the component, both sheets, the audit — goes on working.
   *
   * Null for the large majority. It is meant to be rare.
   */
  disposition: Expression | null;
  /**
   * The face this persona wears instead of *any* of the above — the one you
   * notice in a grid of forty.
   *
   * `disposition` is a tie-breaker: it only reaches people whose valence is
   * unremarkable, which is why `smile`, `grin` and `surprise` were dead code in
   * the resting vocabulary. A grin is not a stronger `content`, it is a rarer
   * one, and the branch that decides between them cannot be a threshold —
   * personality is a continuum and any cut on it produces either nobody or a
   * new fourth-commonest mood.
   *
   * So this is a seeded roll instead, gated on stats: the candidate faces are
   * the ones a persona's traits could plausibly support, and the roll picks
   * whether they actually got one. Seeded from the portrait seed, so a given
   * persona wears the same face every time they are drawn.
   *
   * Around one in fourteen personas. Checked before valence, after illness.
   */
  flourish: Expression | null;
}

export interface BackgroundSpec {
  base: string;
  accent: string;
  vignette: boolean;
  /**
   * How much the ground is *modelled* — the depth of the halo behind the head
   * and of the fall from top to bottom. Flat is not a lesser version of deep:
   * a tempera panel and a studio wall are both flat on purpose, and an oil
   * ground is deep on purpose.
   */
  depth?: number;
  /** Pushes the whole ground lighter (negative) or darker (positive). */
  lift?: number;
  /**
   * How hard the vignette closes in, as a multiplier. A century that painted in
   * oil by a single window darkens its corners a great deal more than one that
   * photographed against a lit studio wall.
   */
  vignetteStrength?: number;
  /**
   * The surface the portrait imagines itself made on: the tooth of fresco
   * plaster, the weave of a primed canvas, the silver grain of an albumen
   * print, or nothing at all.
   */
  texture: 'none' | 'subtle' | 'grain' | 'plaster' | 'weave';
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
  /**
   * 0..1, how much of this life was spent in the weather.
   *
   * Sun-darkened brow ridge, nose bridge and cheekbone tops, broken capillaries
   * across the cheeks, and the squint that comes of years of looking into glare.
   *
   * A number rather than a flag because the difference between a fisherman and a
   * carter is real but small, and because the appearance tables also have an
   * opinion here — the two are combined rather than one overriding the other.
   * This used to be read out of an appearance *string* that almost nothing set,
   * so the drawing existed and had nearly nothing to draw: `profession` reached
   * the adapter and its only use in the whole file was salting the seed hash.
   */
  weathering: number;

  garment: GarmentSpec;
  legwear: LegwearSpec | null;
  headwear: HeadwearSpec | null;
  jewelry: JewelrySpec[];
  markings: MarkingSpec[];
  /**
   * Body modification that cannot be laid on top of a finished face, because it
   * changed the face itself. A bound skull is a different skull and blackened
   * teeth need a mouth that shows them, so both are lifted out of `markings`
   * and into the anatomy and the mouth respectively. Left in the marking list
   * they were silently dropped: the renderer had no case for either, and a
   * persona whose own description says the skull was shaped in infancy came out
   * with an ordinary head.
   */
  skull: SkullShape;
  dental: DentalWork | null;
  pose: PoseSpec;
  glasses: { style: 'round' | 'square' | 'oval' | 'half_rim' } | null;

  condition: ConditionSpec;
  traits: FaceTraits;
  mood: MoodSpec;
  background: BackgroundSpec;

  contextPackId?: string;
  culturalZone?: string;
  era?: string;
  wealth: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
}
