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

/**
 * What a dye cost, which before 1856 is very nearly the same question as how
 * bright it is.
 *
 * `everyday` colours came out of a dyepot any household could keep — madder
 * roots, weld, onion skin, walnut hull, turmeric, safflower, a shallow woad
 * vat. They are not all dull: a turmeric wrap or a safflower-dyed sash is
 * vivid, and cheap, and the reason "poor" must not mean "grey".
 *
 * `costly` wanted a specialist — a deep indigo vat, a mineral ground to
 * pigment, a mordant worth more than the cloth.
 *
 * `precious` is the short list that was priced against silver: murex purple,
 * lapis ultramarine, kermes on silk.
 */
export type DyeTier = 'everyday' | 'costly' | 'precious';

export interface NamedColor {
  name: string;
  hex: string;
  /** Absent means `everyday`. */
  tier?: DyeTier;
}

/**
 * The dye and pigment vocabulary. Names here are what the card prints, so they
 * are chosen to be readable rather than technical — "Madder" over "Alizarin".
 *
 * The muted half of this table is the honest description of undyed and
 * single-bath cloth, and it stays. What it cannot do on its own is describe the
 * other half of the historical record: turmeric, safflower, marigold, henna,
 * vermilion and verdigris are all pre-modern, several of them cheap, and all of
 * them bright. Leaving them out made "before aniline" mean "before colour",
 * which is a claim about dye chemistry that dye chemistry does not support.
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
  // The bright reds. Vermilion is ground cinnabar and was painted on cloth as
  // often as it was on panel; scarlet and cochineal are the insect dyes, which
  // is why they cost what they did and why they are still vivid at eight
  // centuries' remove. Henna and annatto are the cheap end of the same band.
  { name: 'Vermilion', hex: '#d4482c', tier: 'costly' },
  { name: 'Scarlet', hex: '#bb2f2a', tier: 'costly' },
  { name: 'Cochineal', hex: '#a92b48', tier: 'costly' },
  { name: 'Henna', hex: '#b5502e' },
  { name: 'Annatto', hex: '#c85f2c' },

  // Blues — woad and indigo
  { name: 'Indigo', hex: '#2e3f5c' },
  { name: 'Woad', hex: '#3a4f6d' },
  { name: 'Navy', hex: '#23304a' },
  { name: 'Blue', hex: '#41608c' },
  { name: 'Slate', hex: '#566370' },
  // Mineral blues, which reach a chroma no vat dye does. Every name in this
  // table is a single word on purpose: the generator prefixes it to an item
  // name and then recovers the colour by reading the first word back, so a
  // two-word dye survives onto the card and dies on the round trip.
  { name: 'Azurite', hex: '#3a63a8', tier: 'costly' },
  { name: 'Lapis', hex: '#2f4f9c', tier: 'precious' },

  // Yellows — weld, saffron, ochre
  { name: 'Saffron', hex: '#d9a441' },
  { name: 'Yellow', hex: '#c8a63e' },
  { name: 'Ochre', hex: '#b1803c' },
  // Turmeric and marigold are the cheapest bright colours that have ever
  // existed. Both are fugitive — they wash out within a season — which made
  // them poor people's dyes rather than rich people's, and is exactly why the
  // wealth ladder must not be a brightness ladder.
  { name: 'Turmeric', hex: '#dfa62c' },
  { name: 'Marigold', hex: '#d9822f' },

  // Greens — overdyed weld and woad
  { name: 'Green', hex: '#5a6b3b' },
  { name: 'Sage', hex: '#8a9476' },
  { name: 'Forest', hex: '#374a2e' },
  { name: 'Olive', hex: '#6e6b3a' },
  { name: 'Teal', hex: '#3b6560' },
  // Copper greens. A true bright green was hard to dye and easy to paint, so
  // these show up on trim, borders and painted bark far more than on a field.
  { name: 'Verdigris', hex: '#3c8f7f', tier: 'costly' },
  { name: 'Malachite', hex: '#4f8f57', tier: 'costly' },
  { name: 'Turquoise', hex: '#3d9aa6', tier: 'costly' },

  // Browns — walnut, oak gall, undyed wool
  { name: 'Brown', hex: '#6f5237' },
  { name: 'Walnut', hex: '#5b4229' },
  { name: 'Tan', hex: '#a98a63' },
  { name: 'Umber', hex: '#4f3c2b' },
  { name: 'Russet', hex: '#8a5a3b' },

  // Pinks — safflower, sappanwood, brazilwood
  { name: 'Rose', hex: '#cf7288' },
  { name: 'Safflower', hex: '#d9607a' },

  // Purples — lichen, murex, expensive and rare
  { name: 'Purple', hex: '#5c3f63', tier: 'costly' },
  { name: 'Violet', hex: '#6a4a78', tier: 'costly' },
  { name: 'Tyrian', hex: '#6a2450', tier: 'precious' },

  // Neutrals and metals
  { name: 'Grey', hex: '#8a8781' },
  { name: 'Charcoal', hex: '#3a3a38' },
  { name: 'Black', hex: '#1f1f22' },
  { name: 'Silver', hex: '#b9bcc2', tier: 'costly' },
  { name: 'Gold', hex: '#cfa044', tier: 'precious' },
  { name: 'Bronze', hex: '#a8763f', tier: 'costly' },
];

const BY_NAME = new Map(NAMED_COLORS.map(c => [c.name.toLowerCase(), c.hex]));

const TIER_BY_HEX = new Map(
  NAMED_COLORS.map(c => [c.hex.toLowerCase(), c.tier ?? 'everyday' as DyeTier])
);

/** What a colour cost, if it is one we have a name for. Unknown hexes are everyday. */
export function tierForHex(hex: string | undefined): DyeTier {
  if (!hex) return 'everyday';
  return TIER_BY_HEX.get(hex.trim().toLowerCase()) ?? 'everyday';
}

/** Whether a purse of this size could reach a dye of that tier. */
export const TIER_RANK: Record<DyeTier, number> = { everyday: 0, costly: 1, precious: 2 };

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
