/**
 * constants/gameData/colorNames.ts
 *
 * One table for the names of colours, and one direction of travel.
 *
 * There were two of these, eighty lines apart in `characterGenerator.ts`, and
 * they disagreed: `#228b22` was "Forest" in one and "Forest Green" in the
 * other, `#deb887` was "Tan" in one and "Burlywood" in the other. Both were
 * built out of CSS web primaries — `#ff0000`, `#00ff00`, `#0000ff` — so
 * nearest-match against them named a grey-lilac hat "Silver" and a hemp robe
 * "Forest", and the portrait renderer, which draws the actual hex, disagreed
 * with the label the card printed.
 *
 * Two rules follow from that:
 *
 * 1. The vocabulary is dyestuffs, not screen primaries. Nobody in 1306 wore
 *    `#00ff00`. Nearest-match is only as good as the palette it searches, and
 *    a palette of saturated screen colours cannot produce an honest answer.
 * 2. Some materials are not dyed. Sedge grass, straw, bamboo, leather, fur and
 *    iron are their own colour; asking "what colour is this hat" and painting
 *    the answer on is how a woven sedge sunhat came out lilac.
 */

export interface NamedColor {
  name: string;
  hex: string;
}

/**
 * The dye and pigment vocabulary. Names here are what the card prints, so they
 * are chosen to be readable rather than technical — "Madder" over "Alizarin".
 */
export const NAMED_COLORS: NamedColor[] = [
  // Undyed and bleached
  { name: 'Natural', hex: '#d8cdb6' },
  { name: 'Cream', hex: '#ddd3ba' },
  { name: 'White', hex: '#e8e4d9' },
  { name: 'Ivory', hex: '#e5ddd0' },

  // Reds — madder, kermes, iron oxide
  { name: 'Madder', hex: '#a63a2b' },
  { name: 'Red', hex: '#a33327' },
  { name: 'Crimson', hex: '#8e2436' },
  { name: 'Rust', hex: '#9c5230' },
  { name: 'Maroon', hex: '#5e2a2a' },

  // Blues — woad and indigo
  { name: 'Indigo', hex: '#2e3f5c' },
  { name: 'Woad', hex: '#3a4f6d' },
  { name: 'Navy', hex: '#23304a' },
  { name: 'Blue', hex: '#41608c' },
  { name: 'Slate', hex: '#566370' },

  // Yellows — weld, saffron, ochre
  { name: 'Saffron', hex: '#d9a441' },
  { name: 'Yellow', hex: '#c8a63e' },
  { name: 'Ochre', hex: '#b1803c' },

  // Greens — overdyed weld and woad
  { name: 'Green', hex: '#5a6b3b' },
  { name: 'Sage', hex: '#8a9476' },
  { name: 'Forest', hex: '#374a2e' },
  { name: 'Olive', hex: '#6e6b3a' },
  { name: 'Teal', hex: '#3b6560' },

  // Browns — walnut, oak gall, undyed wool
  { name: 'Brown', hex: '#6f5237' },
  { name: 'Walnut', hex: '#5b4229' },
  { name: 'Tan', hex: '#a98a63' },
  { name: 'Umber', hex: '#4f3c2b' },
  { name: 'Russet', hex: '#8a5a3b' },

  // Purples — lichen, murex, expensive and rare
  { name: 'Purple', hex: '#5c3f63' },
  { name: 'Violet', hex: '#6a4a78' },

  // Neutrals and metals
  { name: 'Grey', hex: '#8a8781' },
  { name: 'Charcoal', hex: '#3a3a38' },
  { name: 'Black', hex: '#1f1f22' },
  { name: 'Silver', hex: '#b9bcc2' },
  { name: 'Gold', hex: '#cfa044' },
  { name: 'Bronze', hex: '#a8763f' },
];

const BY_NAME = new Map(NAMED_COLORS.map(c => [c.name.toLowerCase(), c.hex]));

/**
 * Materials whose colour is not a choice. A sedge hat is the colour of sedge.
 * Cloth fibres are deliberately absent — linen, hemp, wool and cotton all take
 * dye, so naming their colour is meaningful.
 */
const INTRINSIC_COLOR_MATERIALS =
  /\b(sedge|grass|straw|reed|rattan|cane|bamboo|palm leaf|pandanus|raffia|bark ?cloth|leather|hide|rawhide|pelt|fur|sheepskin|shearling|wood|oak|pine|cedar|iron|steel|bronze|copper|brass|gold|silver|pewter|bone|horn|shell|jade|stone|clay)\b/i;

export function hasIntrinsicColor(material: string | undefined): boolean {
  return Boolean(material) && INTRINSIC_COLOR_MATERIALS.test(material as string);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

/** The canonical hex for a colour word, if we know it. */
export function hexForName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return BY_NAME.get(name.trim().toLowerCase());
}

/**
 * The nearest colour word to a hex.
 *
 * Prefer `hexForName` wherever the colour was *chosen* — going name → hex is
 * lossless, and hex → name is not. This exists for the cases where only a hex
 * survives.
 */
export function nameForHex(hex: string | undefined): string {
  if (!hex) return '';
  const target = hexToRgb(hex);
  if (!target) return '';

  let best = NAMED_COLORS[0];
  let bestDistance = Infinity;
  for (const candidate of NAMED_COLORS) {
    const rgb = hexToRgb(candidate.hex);
    if (!rgb) continue;
    // Weighted to rough perceptual sensitivity; an unweighted RGB distance
    // reliably confuses olive with grey, which matters a lot here because most
    // of this palette is muted.
    const distance = Math.sqrt(
      2 * (target.r - rgb.r) ** 2
      + 4 * (target.g - rgb.g) ** 2
      + 3 * (target.b - rgb.b) ** 2
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best.name;
}

/** Colour words that may already be sitting in an item name. */
export const COLOR_WORDS: string[] = NAMED_COLORS.map(c => c.name.toLowerCase())
  .concat(['gray', 'emerald', 'amber', 'ebony', 'turquoise', 'coral', 'scarlet']);
