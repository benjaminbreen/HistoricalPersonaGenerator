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
import { PortraitSpec } from '../spec/types';

export interface PortraitRamps {
  book: RampBook;
  skin: Ramp;
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

const METAL_BASE: Record<string, string> = {
  gold: '#cfa044',
  silver: '#b9bcc2',
  bronze: '#a8763f',
  gems: '#8c4f7a',
  pearl: '#e5ddd0',
  bone: '#ddd2ba',
  wood: '#7a5a3c',
};

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

export function buildPortraitRamps(spec: PortraitSpec): PortraitRamps {
  const skinHex = conditionSkin(spec.skinColor, spec.condition.pallor, spec.condition.fever);
  const skinRgb = hexToRgb(skinHex);

  // Skin holds a narrower value range than cloth — overshading a face is the
  // fastest way to make it look like plastic.
  const skin = buildRamp(skinHex, { contrast: 0.82, shift: 0.3, saturation: 1.02 });

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

  const clothA = buildRamp(spec.garment.colors.primary, materialOptions(spec.garment.material));
  const clothB = buildRamp(spec.garment.colors.secondary, materialOptions(spec.garment.material));
  const clothC = buildRamp(spec.garment.colors.accent, { contrast: 1.15, shift: 0.3, saturation: 1.1 });

  const headwear = spec.headwear
    ? buildRamp(spec.headwear.color, materialOptions(spec.headwear.material))
    : buildRamp(spec.garment.colors.secondary, { contrast: 1 });

  const metalKey = spec.jewelry.find(item => METAL_BASE[item.material])?.material || 'bronze';
  const metal = buildRamp(METAL_BASE[metalKey] || '#a8763f', {
    contrast: 1.75,
    shift: 0.2,
    saturation: 1.05,
  });
  const gem = buildRamp('#7b3f6d', { contrast: 1.5, shift: 0.28, saturation: 1.3 });
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
