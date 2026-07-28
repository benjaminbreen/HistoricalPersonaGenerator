/**
 * portraitLab/core/color.ts
 *
 * The single biggest quality lever in this system.
 *
 * Most procedural pixel art shades by multiplying RGB toward black, which
 * produces grey, muddy, lifeless shadows. Real pixel artists hue-shift: as a
 * surface turns away from the light its hue rotates toward the ambient/sky
 * colour and its saturation *rises*; as it turns into the light the hue rotates
 * toward the key light and saturation *falls*. That single rule is most of what
 * separates a Stardew Valley portrait from a programmer-art one.
 *
 * Every material in a portrait — skin, hair, wool, linen, silk, bronze, pearl —
 * is expressed as a 7-step Ramp built by this file, and every drawing operation
 * addresses colours by ramp index rather than by literal hex. That means a
 * feature drawn in "one step darker than its surroundings" stays correct no
 * matter what colour the surroundings turned out to be.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Ramp index 0 is the brightest specular, 6 the deepest core shadow. */
export const RAMP_LEN = 7;
/** The index a surface sits at when it faces the viewer with no modelling. */
export const RAMP_BASE = 3;

export interface Ramp {
  steps: RGB[];
  /** One step beyond the darkest — used for silhouette edges, never for form. */
  outline: RGB;
  baseHex: string;
}

export interface RampOptions {
  /** 0..1 strength of the drift toward the light and shadow tints. */
  shift?: number;
  /** Multiplier on the value spread. Cloth and metal want more, skin less. */
  contrast?: number;
  /** Multiplier on how much chroma the shadow steps gain. */
  saturation?: number;
}

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

export function hexToRgb(hex: string): RGB {
  const value = hex.trim();
  if (value.startsWith('rgb')) {
    const parts = value.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      return { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]) };
    }
  }
  const cleaned = value.replace('#', '');
  // Only actual hex digits. Without this guard the length checks below happily
  // ran `parseInt` over words: "Rust" fell through to the grey fallback and
  // came out drab, while "Russet", "Indigo" and "Madder" are six characters or
  // more and parsed to `{ r: null, g: null, b: 14 }` — NaN channels that then
  // propagated silently through the whole ramp. Every dyed item in the app was
  // arriving here as its dye's *name*, so this was not an edge case; it was
  // most of the wardrobe. `buildSpec.resolveColor` now translates names before
  // they get here, and this makes the failure impossible rather than merely
  // unlikely.
  if (!/^[0-9a-f]+$/i.test(cleaned)) return { r: 128, g: 128, b: 128 };
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  if (cleaned.length >= 6) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  }
  return { r: 128, g: 128, b: 128 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToCss({ r, g, b }: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = ((h % 360) + 360) % 360;
  if (s <= 0) {
    const v = clamp(l, 0, 1) * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toChannel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const hk = hue / 360;
  return {
    r: clamp(toChannel(hk + 1 / 3), 0, 1) * 255,
    g: clamp(toChannel(hk), 0, 1) * 255,
    b: clamp(toChannel(hk - 1 / 3), 0, 1) * 255,
  };
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/**
 * How far the value drops per shadow step (multiplicative), and how far it
 * climbs per highlight step (toward the light tint).
 */
const SHADOW_VALUE = [0, 0.15, 0.30, 0.46];
const HIGHLIGHT_LIFT = [0, 0.15, 0.31, 0.50];

/** Ambient sky, and the key light. Shadows drift toward one, highlights the other. */
const SHADOW_TINT: RGB = { r: 58, g: 46, b: 92 };
const WARM_LIGHT_TINT: RGB = { r: 255, g: 238, b: 198 };
const COOL_LIGHT_TINT: RGB = { r: 214, g: 224, b: 242 };

/** Push a colour away from (or toward) its own grey, preserving its value. */
function scaleChroma(color: RGB, amount: number): RGB {
  const grey = luminance(color) * 255;
  return {
    r: grey + (color.r - grey) * amount,
    g: grey + (color.g - grey) * amount,
    b: grey + (color.b - grey) * amount,
  };
}

/**
 * Build a material's ramp.
 *
 * This works in RGB rather than HSL on purpose. Rotating hue in HSL while
 * holding lightness — the obvious implementation — makes a pale complexion's
 * shadows march off into vivid salmon and then magenta, because HSL saturation
 * means something very different at l=0.85 than at l=0.4. Multiplying toward a
 * shadow colour and lifting toward a light colour is both what painters
 * describe and what actually behaves.
 */
export function buildRamp(baseColor: string, options: RampOptions = {}): Ramp {
  const { shift = 0.34, contrast = 1, saturation = 1 } = options;

  const base = hexToRgb(baseColor);
  const baseHsl = rgbToHsl(base);
  const baseLum = luminance(base);
  // Near-neutral materials — black hair, grey wool, steel — take a cool
  // highlight; anything with real hue takes a warm one.
  const lightTint = baseHsl.s < 0.14 ? COOL_LIGHT_TINT : WARM_LIGHT_TINT;

  const steps: RGB[] = [];
  for (let i = 0; i < RAMP_LEN; i += 1) {
    const offset = i - RAMP_BASE;
    const magnitude = Math.abs(offset);

    if (offset === 0) {
      steps.push({ ...base });
      continue;
    }

    if (offset > 0) {
      // Shadow: drop the value, drift toward the ambient, gain a little chroma.
      const factor = Math.max(0.08, 1 - SHADOW_VALUE[magnitude] * contrast);
      // The small absolute term matters only for very dark materials, where a
      // pure multiply leaves the shadow steps indistinguishable.
      const drop = 3 * magnitude * contrast;
      let color: RGB = {
        r: Math.max(0, base.r * factor - drop),
        g: Math.max(0, base.g * factor - drop),
        b: Math.max(0, base.b * factor - drop),
      };
      color = mixRgb(color, SHADOW_TINT, shift * (magnitude / 3) * 0.55);
      color = scaleChroma(color, 1 + 0.1 * magnitude * saturation);
      steps.push(color);
    } else {
      // Highlight: climb toward the light, losing chroma as it goes — and the
      // brighter the material already is, the more it washes out.
      const lift = HIGHLIGHT_LIFT[magnitude] * contrast;
      // An already-light material has to climb toward white, not toward the
      // tint, or its highlight steps collapse into each other.
      const target = mixRgb(lightTint, { r: 255, g: 255, b: 255 }, baseLum);
      let color = mixRgb(base, target, Math.min(0.92, lift));
      color = mixRgb(color, lightTint, shift * (magnitude / 3) * 0.12);
      color = scaleChroma(color, 1 - 0.09 * magnitude * baseLum);
      steps.push(color);
    }
  }

  // The outline keeps the material's hue — a red cloak gets a warm edge, blue
  // wool a cool one — but has to stay genuinely dark, or a pale face ends up
  // ringed in pink.
  const darkest = steps[RAMP_LEN - 1];
  const outline = mixRgb(mixRgb(darkest, SHADOW_TINT, 0.25), { r: 0, g: 0, b: 0 }, 0.55);

  return { steps, outline, baseHex: rgbToHex(base) };
}

/** Sample a ramp at a fractional index, clamped to its ends. */
export function rampAt(ramp: Ramp, index: number): RGB {
  const i = clamp(Math.round(index), 0, RAMP_LEN - 1);
  return ramp.steps[i];
}

/** A ramp shifted wholesale toward another colour — for dyed or faded cloth. */
export function tintRamp(ramp: Ramp, color: string, amount: number): Ramp {
  const target = hexToRgb(color);
  return {
    steps: ramp.steps.map(step => mixRgb(step, target, amount)),
    outline: mixRgb(ramp.outline, target, amount * 0.5),
    baseHex: ramp.baseHex,
  };
}

export function luminance({ r, g, b }: RGB): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
