/**
 * constants/characterData/materialColors.ts
 *
 * What a material actually looks like.
 *
 * The portrait resolved any item without an explicit colour to the garment
 * palette's primary, so a fur hood came out magenta and straw hats came out
 * whatever the tunic was. Undyed and natural materials are not a matter of
 * taste — fox fur is fox-coloured — so they get their own colours here, chosen
 * deterministically from the item so the same persona always looks the same.
 */

/** Ordered most specific first; the first pattern that matches wins. */
const MATERIAL_COLORS: Array<{ match: RegExp; colors: string[] }> = [
  // --- Fur, by animal where the name says which
  { match: /arctic fox|ermine|white fur|polar/i, colors: ['#EDE7DC', '#DCD4C6', '#F2EDE4'] },
  { match: /fox fur|fox/i, colors: ['#9C5A2E', '#B06B34', '#8A4E28'] },
  { match: /wolf|husky/i, colors: ['#7E7A72', '#6B6660', '#918C82'] },
  { match: /bear/i, colors: ['#4A3728', '#3C2C20', '#57402E'] },
  { match: /seal|otter|beaver/i, colors: ['#4E4237', '#3F352C', '#5C4E41'] },
  { match: /sable|mink|marten/i, colors: ['#3E2E24', '#4A382C'] },
  { match: /rabbit|hare|coney/i, colors: ['#9B8C7A', '#8A7C6C', '#ADA091'] },
  { match: /sheepskin|fleece/i, colors: ['#D9CFBC', '#C6BBA6'] },
  { match: /\bfur\b/i, colors: ['#6B5744', '#7C6650', '#544436', '#8A7460'] },

  // --- Hide and leather
  { match: /rawhide|untanned/i, colors: ['#C0AC8E', '#B29C7E'] },
  { match: /buckskin|deerskin|deer hide/i, colors: ['#C2A579', '#B0946B'] },
  { match: /leather|hide|tanned/i, colors: ['#7A5638', '#8B6540', '#69482F', '#96714A'] },
  { match: /sinew|gut|bladder/i, colors: ['#CFC3A8'] },

  // --- Plant fibre
  { match: /straw|reed|rush|palm|raffia|grass|sedge/i, colors: ['#D8C486', '#C9B478', '#E2D097'] },
  { match: /bark|tapa|bast/i, colors: ['#B79A73', '#A68A65'] },
  { match: /bamboo|rattan|cane/i, colors: ['#C9B37B', '#B8A26C'] },
  { match: /coir|hemp|jute|flax|sisal/i, colors: ['#B3A184', '#C2B094'] },

  // --- Undyed cloth. Dyed cloth is left to the palette, which is correct.
  { match: /undyed wool|homespun|raw wool|felt/i, colors: ['#B8AC97', '#A79B86', '#CFC5B2', '#8E8474'] },
  { match: /undyed linen|unbleached/i, colors: ['#D6CDB8', '#C7BDA6'] },

  // --- Hard materials
  { match: /bone|antler|horn|ivory|tusk/i, colors: ['#E0D6BF', '#D2C6AB'] },
  { match: /shell|nacre|mother of pearl|pearl/i, colors: ['#E8E2D8', '#DCD2C4'] },
  { match: /iron|steel/i, colors: ['#8A8D91', '#787C81'] },
  { match: /bronze/i, colors: ['#A97843'] },
  { match: /copper/i, colors: ['#B06E43'] },
  { match: /brass/i, colors: ['#B39247'] },
  { match: /silver/i, colors: ['#BFC3C6'] },
  { match: /gold|gilt/i, colors: ['#C9A227'] },
  { match: /jade/i, colors: ['#6F9A73'] },
  { match: /turquoise/i, colors: ['#5E9AA5'] },
  { match: /coral/i, colors: ['#B85A48'] },
  { match: /amber/i, colors: ['#B57A2A'] },
  { match: /obsidian|jet/i, colors: ['#26242A'] },
  { match: /clay|terracotta|earthenware/i, colors: ['#A5654A'] },
  { match: /wood|carved wood|oak|ash\b|willow/i, colors: ['#7A5C3C', '#8D6C48'] },
];

/**
 * A colour for this material, or undefined if the material is dyed cloth and
 * should follow the garment palette instead.
 */
export function naturalMaterialColor(
  material: string | undefined,
  name: string | undefined,
  seed: number,
): string | undefined {
  const text = `${material ?? ''} ${name ?? ''}`;
  if (!text.trim()) return undefined;

  for (const entry of MATERIAL_COLORS) {
    if (entry.match.test(text)) {
      const index = Math.abs(Math.floor(seed)) % entry.colors.length;
      return entry.colors[index];
    }
  }
  return undefined;
}
