/**
 * portraitLab/spec/headwearForm.ts
 *
 * Which *kind* of wrap, and which kind of veil.
 *
 * `HeadwearKind` has nine values and the clothing tables carry 263 distinct
 * head items, so `wrapped_cloth` and `veil` are each doing the work of a
 * dozen real garments. The bust resolves them further — six wraps, four veils
 * — and the sprite did not, drawing one turban and one veil for all of them.
 *
 * These are the bust's own classifiers, moved here for the same reason
 * `CONICAL_ZONES` was: a verdict about what an item *is* belongs beside the
 * item, where both renderers can reach it, not inside one of them. Each view
 * still draws the answer at its own scale — a gele is a sculptural flare on a
 * 96px bust and four extra pixels of width on a sprite — but they are the same
 * gele because they came off the same function.
 */

/**
 * A turban is wound, a gele is tied and sculpted, a kerchief is knotted, and a
 * keffiyeh is not tied at all but laid square over the head and held by a cord.
 * Drawing the act is what tells them apart.
 */
export type WrapForm = 'turban' | 'safa' | 'gele' | 'keffiyeh' | 'kerchief' | 'headcloth';

export function wrapFormFor(text: string): WrapForm {
  if (/safa|peta|kalgi|pagri/i.test(text)) return 'safa';
  if (/turban/i.test(text)) return 'turban';
  if (/gele|aso ?oke|ankara|duku|doek|dhuku/i.test(text)) return 'gele';
  if (/keffiyeh|shemagh|kufiya|ghutra|agal/i.test(text)) return 'keffiyeh';
  if (/kerchief|scarf|babushka|tignon|head tie|fichu/i.test(text)) return 'kerchief';
  return 'headcloth';
}

/**
 * A dupatta is laid over the head and slips; a hijab is pinned to the skull; a
 * mantilla sits high on a comb and falls behind. Only the last of these — the
 * wimple, the chador, the nun's veil — is the enclosing sheet that all four
 * used to be drawn as.
 */
export type VeilForm = 'draped' | 'wrapped' | 'mantilla' | 'enveloping';

export function veilFormFor(text: string): VeilForm {
  if (/dupatta|odhani|orna|chunni|chunari|bridal veil/i.test(text)) return 'draped';
  if (/mantilla|lace/i.test(text)) return 'mantilla';
  if (/hijab|khimar|shayla|amira|head ?scarf/i.test(text)) return 'wrapped';
  return 'enveloping';
}

/**
 * The wrap, in the four numbers a sprite-scale head can actually carry.
 *
 * `rise` is height above the crown as a fraction of head height, `wide` is
 * width as a multiple of the skull's, `fall` how far below the jaw the cloth
 * hangs (0 for anything that stops at the hairline), and `band` whether the
 * form has a distinct cord or edge at the brow — the agal on a keffiyeh, the
 * knot on a kerchief.
 *
 * Deliberately coarse. At this size a wrap has about three legible degrees of
 * freedom and inventing more just produces mush, which is the lesson every
 * other vocabulary in this renderer has already learned.
 */
export interface WrapMetrics {
  rise: number;
  wide: number;
  fall: number;
  band: boolean;
}

export const WRAP_METRICS: Record<WrapForm, WrapMetrics> = {
  // Wound high and bulky, and the bulk is the point.
  turban:    { rise: 0.30, wide: 1.14, fall: 0, band: false },
  // A turban with a crest at the front: taller still, and narrower.
  safa:      { rise: 0.42, wide: 1.08, fall: 0, band: true },
  // Tied and sculpted outward — much wider than the head, and flaring.
  gele:      { rise: 0.36, wide: 1.42, fall: 0, band: false },
  // Not wound at all: a square of cloth over the crown, falling past the ears
  // and held down by a dark cord.
  keffiyeh:  { rise: 0.10, wide: 1.20, fall: 0.55, band: true },
  // Small, close, knotted behind; covers the hairline and little else.
  kerchief:  { rise: 0.08, wide: 1.04, fall: 0.10, band: true },
  headcloth: { rise: 0.18, wide: 1.08, fall: 0.18, band: false },
};

/**
 * The veil, in what a sprite can show.
 *
 * Five numbers and a flag, and between them they are the difference between a
 * dupatta and a wimple:
 *
 *   `open`  how much of the skull's half-width the face opening spans at the
 *           cheek. A hijab clears the whole face and no more (0.80); a dupatta
 *           clears the hair as well, so its edge sits out at the silhouette.
 *   `lead`  where the cloth's front edge crosses the skull: 0 at the crown,
 *           1 at the brow. This is the single most telling number of the five.
 *           A wimple comes down onto the eyebrows; a mantilla stays back on
 *           the crown and everything in front of it is hair.
 *   `chin`  how far *below* the chin the opening reaches, as a fraction of head
 *           height — where the cloth closes again under the jaw, or, on a
 *           `split` veil, where the sheet stops widening and starts to part.
 *   `drop`  the hem, below the chin, as a fraction of head height.
 *   `hug`   how tightly it grips the skull. Cloth pinned to the head hangs
 *           close; cloth merely laid on it stands off and swings.
 *   `split` whether the fall parts into two panels with the chest between them
 *           — which is what a dupatta and a mantilla do and what a chador,
 *           being one sheet, does not.
 *
 * Deliberately coarse, for the reason `WrapMetrics` gives. These are the axes
 * that survive being drawn 12 pixels wide; a seventh would be mush.
 */
export interface VeilMetrics {
  open: number;
  lead: number;
  chin: number;
  drop: number;
  hug: number;
  split: boolean;
}

export const VEIL_METRICS: Record<VeilForm, VeilMetrics> = {
  // Laid over the back of the head and slipping off it. The leading edge is
  // well back on the crown, so the hair in front of it is the frame around the
  // face, and the two ends hang free either side of the throat.
  draped:     { open: 0.96, lead: 0.12, chin: 0.30, drop: 0.70, hug: 0.0, split: true },
  // Pinned to the skull, covering every hair, closing just under the jaw —
  // and the whole face clear. The bust's opening is 0.80 of the half-width.
  wrapped:    { open: 0.80, lead: 0.92, chin: 0.06, drop: 0.55, hug: 0.9, split: false },
  // High on the crown and falling behind: it barely covers the face at all,
  // and what shows in front of it is hair.
  mantilla:   { open: 1.00, lead: 0.02, chin: 0.40, drop: 0.75, hug: 0.2, split: true },
  // The wimple, the chador: one sheet down onto the brows and round under the
  // jaw, and the face is a gap in it.
  enveloping: { open: 0.74, lead: 1.00, chin: 0.02, drop: 0.62, hug: 0.5, split: false },
};

/**
 * The soft caps with a peak thrown forward over the brow, which are five
 * different objects and were being drawn as one dome.
 *
 * These lived privately in `art/headwear.ts`, where only the bust could reach
 * them, and the cost was the same one `CONICAL_ZONES` was moved here to fix:
 * the bust drew a modern persona's baseball cap with its bill and the sprite
 * beside it drew a plain skullcap, the two pictures on one card disagreeing
 * about the same hat. A baseball cap is the commonest head covering the app
 * generates after about 1950.
 *
 * They divide on how the crown is made, and that is the whole recognition. A
 * **newsboy** is eight panels gathered onto a button, so it balloons wider than
 * the skull and flops forward over its own peak. A **flat cap** is one piece of
 * cloth cut to the head, low and sleek. A **baseball cap** is fitted, seamed
 * front and centre, and carries a long curved bill reaching a third of a head
 * past the brow. A **service cap** — Mao, Zhongshan, conductor's, kepi — is
 * stiffened: a flat top flaring wider than its band, and a short flat visor. A
 * **visor** has no crown at all.
 */
export type PeakedForm = 'newsboy' | 'flat' | 'ball' | 'service' | 'visor';

// Gandhi's cap is deliberately absent: it is a brimless boat-shaped khadi cap
// and giving it a peak turns a piece of political dress into a workman's cap.
export const PEAKED_CAP =
  /newsboy|flat cap|cheese-cutter|baker ?boy|baseball|ball cap|snapback|trucker|mao cap|zhongshan cap|visor|official cap|guan cap|service cap|peaked cap|kepi|conductor|engineer cap/i;

export function peakedFormFor(name: string): PeakedForm {
  if (/visor/i.test(name)) return 'visor';
  if (/baseball|ball cap|snapback|trucker/i.test(name)) return 'ball';
  if (/mao|zhongshan|official|guan|service|kepi|conductor|engineer|peaked cap/i.test(name)) return 'service';
  if (/newsboy|baker ?boy|cheese-cutter|eight.?panel/i.test(name)) return 'newsboy';
  return 'flat';
}

/**
 * A hood is a garment, not a veil, and keeps its own numbers: a deeper opening
 * that shades the brow, a cowl that stands off the skull, and a fall that
 * stops on the shoulders rather than covering them.
 */
export const HOOD_METRICS: VeilMetrics =
  { open: 0.88, lead: 1.10, chin: 0.10, drop: 0.50, hug: 0.55, split: false };
