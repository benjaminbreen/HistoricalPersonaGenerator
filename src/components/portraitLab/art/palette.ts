/**
 * portraitLab/art/palette.ts
 *
 * Every colour a portrait will use, resolved once, up front.
 *
 * Materials are not just colours — linen, silk, wool, bronze and pearl all
 * respond to light differently, and encoding that in the ramp (rather than in
 * ad-hoc per-renderer fudge factors) is what makes a silk robe read as silk.
 */

import {
  buildRamp, hexToRgb, hslToRgb, luminance, mixRgb, Ramp, RampOptions, RGB,
  rgbToHex, rgbToHsl,
} from '../core/color';
import { MAT, MAT_COUNT, RampBook } from '../core/raster';
import { ornamentRamp } from './ornaments';
import { OrnamentMaterial, PortraitSpec } from '../spec/types';

/**
 * The same ramp with its hue rotated and its saturation scaled, at identical
 * lightness on every step.
 *
 * Deliberately not `tintRamp`, which mixes toward a target colour and therefore
 * moves value as well as hue — mixing a mid-red into a dark complexion lightens
 * it, and the whole point of the flesh tints is that they must not disturb the
 * modelling. Holding L exactly means a zone can be recoloured after the face has
 * been shaded and the form is untouched.
 */
function hueShifted(ramp: Ramp, degrees: number, saturation: number): Ramp {
  const shift = (c: RGB): RGB => {
    const hsl = rgbToHsl(c);
    return hslToRgb({
      h: (hsl.h + degrees + 360) % 360,
      s: Math.max(0, Math.min(1, hsl.s * saturation)),
      l: hsl.l,
    });
  };
  return { steps: ramp.steps.map(shift), outline: shift(ramp.outline), baseHex: ramp.baseHex };
}

export interface PortraitRamps {
  book: RampBook;
  skin: Ramp;
  /**
   * Flesh where the blood is near the surface — cheeks, nose, ears — and flesh
   * where the bone is, or where a beard sits under the skin: the jaw and chin.
   * The three-zone face is the oldest rule in portrait painting and the thing
   * that most separates painted flesh from tinted plastic. Both are the skin
   * ramp at the same lightness with the hue nudged, so they cost nothing and can
   * never fight the modelling.
   */
  skinWarm: Ramp;
  skinCool: Ramp;
  hair: Ramp;
  beard: Ramp;
  brow: Ramp;
  sclera: Ramp;
  iris: Ramp;
  lip: Ramp;
  clothA: Ramp;
  clothB: Ramp;
  clothC: Ramp;
  headwear: Ramp;
  headwearAccent: Ramp;
  foliage: Ramp;
  metal: Ramp;
  gem: Ramp;
  leather: Ramp;
  background: Ramp;
  lash: RGB;
  pupil: RGB;
  glint: RGB;
  teeth: RGB;
}

/**
 * How each fabric or substance behaves under the key light. `contrast` widens
 * the value range, `shift` controls how far the hue rotates into shadow, and
 * `saturation` scales chroma overall.
 */
const MATERIAL_RESPONSE: Array<[RegExp, RampOptions]> = [
  [/silk|satin|brocade/i, { contrast: 1.4, shift: 0.34, saturation: 1.08 }],
  [/velvet/i, { contrast: 1.28, shift: 0.42, saturation: 1.12 }],
  [/linen|cotton|hemp|calico|muslin/i, { contrast: 0.86, shift: 0.3, saturation: 0.95 }],
  [/wool|felt|broadcloth|serge/i, { contrast: 0.95, shift: 0.36, saturation: 0.98 }],
  [/fur|shearling|sheepskin/i, { contrast: 1.1, shift: 0.34, saturation: 0.94 }],
  [/leather|hide|rawhide/i, { contrast: 1.18, shift: 0.3, saturation: 1.04 }],
  [/barkcloth|bark cloth|fibre|fiber|plant|raffia|grass|straw|reed/i, { contrast: 0.9, shift: 0.28, saturation: 0.9 }],
  [/steel|iron|bronze|brass|copper|silver|gold|metal/i, { contrast: 1.7, shift: 0.22, saturation: 1.05 }],
];

function materialOptions(material: string): RampOptions {
  for (const [pattern, options] of MATERIAL_RESPONSE) {
    if (pattern.test(material)) return options;
  }
  return { contrast: 1, shift: 0.34 };
}

/**
 * Substances that can be the body of a metal fitting.
 *
 * What used to live here was a second, poorer copy of the ornament material
 * table: seven flat hexes with no sheen, no specular and no per-material
 * contrast, including a slot called `gems` set to a single amethyst that every
 * stone in the app was painted with. `ORNAMENT_MATERIALS` in `ornaments.ts` had
 * described all of these properly since the headwear was written, and now the
 * buckles, clasps, buttons and spectacle frames read from it too.
 */
const FITTING_METALS = new Set<OrnamentMaterial>(['gold', 'gilt', 'silver', 'bronze', 'copper']);

/**
 * Illness reads on skin before anywhere else: chroma drains, the value drifts
 * toward grey-green, and a fever pushes it back warm and blotchy.
 */
function conditionSkin(hex: string, pallor: number, fever: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  const sick = hslToRgb({
    h: hsl.h + 6 * pallor,
    s: Math.max(0, hsl.s * (1 - 0.42 * pallor)),
    l: Math.min(0.96, hsl.l * (1 - 0.06 * pallor) + 0.03 * pallor),
  });
  if (fever <= 0) return rgbToHex(sick);
  return rgbToHex(mixRgb(sick, { r: 196, g: 96, b: 82 }, fever * 0.14));
}

/**
 * The second colour a covering is allowed to be patterned in.
 *
 * A pattern at this size is not a hue difference, it is a *value* difference: a
 * madder check on a madder ground is not a check, it is a slightly noisy field.
 * So the persona's own accent is kept whenever it already stands apart, and
 * pushed apart when it does not — rather than being dropped for a neutral,
 * which would throw away the one piece of period-correct colour information
 * the clothing tables actually supply.
 */
function contrastingAccent(base: string, accent: string): string {
  const baseLum = luminance(hexToRgb(base));
  const accentRgb = hexToRgb(accent);
  if (Math.abs(luminance(accentRgb) - baseLum) >= 0.16) return accent;
  const hsl = rgbToHsl(accentRgb);
  // Dark grounds take a light pattern and light grounds a dark one, which is
  // also how dyers actually worked: the cheap contrast is the undyed yarn.
  const away = baseLum > 0.5 ? -0.32 : 0.32;
  return rgbToHex(hslToRgb({ ...hsl, l: Math.max(0.08, Math.min(0.94, hsl.l + away)) }));
}

export function buildPortraitRamps(spec: PortraitSpec): PortraitRamps {
  const skinHex = conditionSkin(spec.skinColor, spec.condition.pallor, spec.condition.fever);
  const skinRgb = hexToRgb(skinHex);

  // Skin holds a narrower value range than cloth — overshading a face is the
  // fastest way to make it look like plastic.
  const skin = buildRamp(skinHex, { contrast: 0.82, shift: 0.3, saturation: 1.02 });
  // The two flesh tints. See `hueShifted` and `drawSkinZones`.
  const skinWarm = hueShifted(skin, -9, 1.1);
  const skinCool = hueShifted(skin, 11, 0.88);

  const hair = buildRamp(spec.hairColor, { contrast: 1.16, shift: 0.4, saturation: 1.05 });
  const beard = buildRamp(
    rgbToHex(mixRgb(hexToRgb(spec.hairColor), skinRgb, 0.16)),
    { contrast: 1.05, shift: 0.38 }
  );
  const brow = buildRamp(
    rgbToHex(mixRgb(hexToRgb(spec.hairColor), skinRgb, 0.1)),
    { contrast: 1.0, shift: 0.36 }
  );

  // Sclera is never white. It picks up the skin around it and sits in shadow.
  const scleraBase = mixRgb({ r: 236, g: 233, b: 228 }, skinRgb, 0.22);
  const sclera = buildRamp(rgbToHex(scleraBase), { contrast: 0.78, shift: 0.36, saturation: 0.8 });

  // Real dark-brown eyes are nearly black, but painting them at their true
  // value turns the whole eye into one blob against the pupil. Portrait
  // painters lift them, and so does this: scale the channels up so the hue is
  // preserved and only the value moves.
  const irisRgb = hexToRgb(spec.eyeColor);
  const irisLum = luminance(irisRgb);
  const irisBase =
    irisLum < 0.19
      ? rgbToHex(
          irisLum < 0.02
            ? { r: 92, g: 70, b: 52 }
            : {
                r: irisRgb.r * (0.19 / irisLum),
                g: irisRgb.g * (0.19 / irisLum),
                b: irisRgb.b * (0.19 / irisLum),
              }
        )
      : spec.eyeColor;
  const iris = buildRamp(irisBase, { contrast: 1.45, shift: 0.32, saturation: 1.22 });

  const lipHex =
    spec.lipColor ||
    rgbToHex(mixRgb(skinRgb, { r: 158, g: 74, b: 74 }, spec.gender === 'Female' ? 0.36 : 0.26));
  const lip = buildRamp(lipHex, { contrast: 0.98, shift: 0.32, saturation: 1.1 });

  /**
   * Wealth in the cloth itself, not only in what is sewn onto it.
   *
   * Before synthetic dyes the expense was in *depth and fastness*, not in
   * brightness: kermes, Tyrian purple, good indigo and lac cost what they did
   * because they held a deep colour through repeated dyeing and kept it for
   * decades. But the cheapest dyes in the world — turmeric, safflower,
   * marigold, henna — are vivid on the first afternoon and merely fugitive, so
   * "poor" has never meant "grey".
   *
   * This used to run from 0.72 to 1.42, and the low end was doing far more work
   * than it looks: most personas are poor or modest, the clothing tables hand
   * every tier in a zone the *same* palette constant, and this multiplied
   * against the material's own factor below. A poor linen tunic arrived at
   * 0.68 chroma and 0.79 contrast off a base that was already muted for being
   * pre-aniline — three separate desaturations of one garment, each defensible
   * alone. The dye access that now runs in `generateClothingPalette` is where
   * the wealth claim belongs, because it decides *which* dye rather than
   * bleaching whichever one was chosen. What is left here is the narrow part
   * that is really about cloth: a fast dye on fine cloth is a little deeper and
   * reflects a little more sharply than the same hue on homespun.
   */
  const WEALTH_RICHNESS: Record<string, { saturation: number; contrast: number }> = {
    poor: { saturation: 0.9, contrast: 0.95 },
    modest: { saturation: 0.96, contrast: 0.98 },
    comfortable: { saturation: 1.0, contrast: 1.0 },
    wealthy: { saturation: 1.15, contrast: 1.1 },
    noble: { saturation: 1.3, contrast: 1.18 },
  };
  const richness = WEALTH_RICHNESS[spec.wealth] || WEALTH_RICHNESS.comfortable;
  const clothOptions = materialOptions(spec.garment.material);
  /**
   * Two reasons a cloth is muted are not twice as many reasons.
   *
   * Material and wealth were multiplied, so coarse cloth on a poor back took
   * both cuts and landed somewhere neither factor intended. They are also not
   * independent claims — "cheap fibre" and "cheap dye" are largely the same
   * observation made twice — so the weaker of the two is the honest answer, and
   * only reductions are pooled this way: a noble's silk should still get both
   * the silk lift and the wealth lift, because those *are* two facts.
   */
  const pool = (material: number, wealth: number): number =>
    material <= 1 && wealth <= 1 ? Math.min(material, wealth) : material * wealth;
  const richCloth: RampOptions = {
    ...clothOptions,
    saturation: pool(clothOptions.saturation ?? 1, richness.saturation),
    contrast: pool(clothOptions.contrast ?? 1, richness.contrast),
  };

  const clothA = buildRamp(spec.garment.colors.primary, richCloth);
  const clothB = buildRamp(spec.garment.colors.secondary, richCloth);
  const clothC = buildRamp(spec.garment.colors.accent, {
    contrast: 1.15 * richness.contrast,
    shift: 0.3,
    saturation: 1.1 * richness.saturation,
  });

  const headwear = spec.headwear
    ? buildRamp(spec.headwear.color, materialOptions(spec.headwear.material))
    : buildRamp(spec.garment.colors.secondary, { contrast: 1 });
  const headwearAccent = spec.headwear
    ? buildRamp(
        contrastingAccent(spec.headwear.color, spec.headwear.accent),
        materialOptions(spec.headwear.material)
      )
    : headwear;

  // Leaves are the one thing on a head whose colour is not a dye choice, so it
  // does not come from the palette: laurel, jasmine greenery and a palm-frond
  // band are all roughly this, and the ramp's own shift carries them into
  // shadow. A little blue-shifted, because foliage read warm at this size looks
  // like straw.
  const foliage = buildRamp('#4d7a3e', { contrast: 1.2, shift: 0.26, saturation: 1.12 });

  /**
   * The metal of this portrait's fittings, and the stone of its settings.
   *
   * Both follow what the persona is actually wearing. A woman in silver
   * earrings gets silver buttons, and — the part that was wrong for as long as
   * this file has existed — a man in jade beads gets jade at every point the
   * renderer reaches for `gem`, rather than the one amethyst everybody shared.
   * Jewellery itself no longer comes through here at all; it resolves per piece
   * in `drawJewelry`. These two are for the hardware sewn onto cloth.
   */
  const metalKey = spec.jewelry.find(item => FITTING_METALS.has(item.material))?.material || 'bronze';
  const metal = ornamentRamp(metalKey);
  const stoneKey =
    spec.jewelry.find(item => item.stone)?.stone
    || spec.jewelry.find(item => !FITTING_METALS.has(item.material))?.material
    || 'carnelian';
  const gem = ornamentRamp(stoneKey);
  const leather = buildRamp('#6b482f', { contrast: 1.2, shift: 0.3 });
  const background = buildRamp(spec.background.base, { contrast: 0.9, shift: 0.3, saturation: 0.9 });

  // Lashes and brows are never pure black — they take the hair's hue, pushed
  // dark, with a little of the skin's warmth mixed back in.
  const lash = mixRgb(hair.steps[6], skin.steps[6], 0.22);

  const book: RampBook = new Array(MAT_COUNT).fill(null);
  book[MAT.SKIN] = skin;
  book[MAT.HAIR] = hair;
  book[MAT.BEARD] = beard;
  book[MAT.BROW] = brow;
  book[MAT.SCLERA] = sclera;
  book[MAT.IRIS] = iris;
  book[MAT.LIP] = lip;
  book[MAT.CLOTH_A] = clothA;
  book[MAT.CLOTH_B] = clothB;
  book[MAT.CLOTH_C] = clothC;
  book[MAT.HEADWEAR] = headwear;
  book[MAT.HEADWEAR_ACCENT] = headwearAccent;
  book[MAT.FOLIAGE] = foliage;
  book[MAT.METAL] = metal;
  book[MAT.GEM] = gem;
  book[MAT.LEATHER] = leather;
  book[MAT.WOOD] = buildRamp('#7a5a3c', { contrast: 1.15 });
  book[MAT.PAINT] = buildRamp('#c8563c', { contrast: 1.1, saturation: 1.2 });
  book[MAT.GLASS] = buildRamp('#9fb2bd', { contrast: 1.3 });
  book[MAT.BG] = background;
  book[MAT.TEETH] = buildRamp('#e6ded1', { contrast: 0.7 });

  return {
    book,
    skin,
    skinWarm,
    skinCool,
    hair,
    beard,
    brow,
    sclera,
    iris,
    lip,
    clothA,
    clothB,
    clothC,
    headwear,
    headwearAccent,
    foliage,
    metal,
    gem,
    leather,
    background,
    lash,
    pupil: mixRgb(iris.steps[6], { r: 12, g: 10, b: 14 }, 0.72),
    glint: { r: 250, g: 250, b: 246 },
    teeth: mixRgb({ r: 236, g: 230, b: 218 }, skinRgb, 0.18),
  };
}
