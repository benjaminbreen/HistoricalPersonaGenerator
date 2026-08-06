/**
 * constants/characterData/clothingPalettes.ts
 *
 * The era and zone colour palettes, in their own module so the regional
 * clothing files can import them without importing clothing.ts — which
 * imports the regional files back, and the cycle left TROPICAL_COLORS in
 * temporal dead zone at load.
 */

export interface ClothingPalette {
    primary: string[];
    secondary: string[];
    accent: string[];
}

// ERA-SPECIFIC COLOR PALETTES
//
// Grounded in what dyers could actually achieve. Before the first aniline dye
// (mauveine, 1856) every colour on a garment came from madder, weld, woad and
// indigo, lichens, tannins and insect reds — all of which give softer, slightly
// greyed hues than a modern screen colour. Fully saturated cloth was not just
// unusual, it was a statement of wealth: good indigo, kermes scarlet and Tyrian
// purple were among the most expensive substances in the pre-modern world.
//
// So the rule here is that ordinary people wear undyed wool, linen and cheap
// plant dyes — creams, greys, browns, russets, weld yellows, pale woad — and
// deep saturated colour is reserved for the wealthy tiers. Pure #FFFFFF and
// pure #000000 are avoided throughout: bleached linen is warm off-white, and a
// true fast black was difficult and costly until the early modern period.

export const PREHISTORIC_COLORS: ClothingPalette = {
    // Hide, fur and bast fibre, with ochre and plant dyes over the top.
    primary: ['#8a5a3c', '#6b4a33', '#9a6b45', '#c8a882', '#6b4226', '#877258'],
    secondary: ['#e6d5b8', '#cbb493', '#b9a58c', '#ddbf94', '#c8b99c'],
    accent: ['#6b7a3a', '#8a3324', '#c19a3f', '#a8763f', '#7d8a4a']
};

export const ANCIENT_COLORS: ClothingPalette = {
    // Undyed wool and linen for most; madder, indigo and — for the very few —
    // Tyrian purple, which cost more by weight than silver.
    primary: ['#e8e0cc', '#ddd2b8', '#8c3a2e', '#5b3a6b', '#33456b', '#4a5450'],
    secondary: ['#e0d3b0', '#b5703c', '#7d5533', '#b98a52', '#96603a'],
    accent: ['#c9a227', '#b0b3ba', '#9c3a34', '#48618f', '#e8e0cc']
};

export const MEDIEVAL_COLORS: ClothingPalette = {
    // Woad blue, madder russet, weld yellow and a great deal of undyed cloth.
    // The old palette led with #251df5 — a pure electric blue no medieval dyer
    // could reach, and the reason so many peasants were turning up in neon.
    primary: ['#3f5378', '#5a5f63', '#4a4232', '#7a3a34', '#3a4250', '#6d5326'],
    secondary: ['#e3d5a8', '#ddd8cf', '#8d8a80', '#c9c4b8', '#efe9dc'],
    accent: ['#2f4a7a', '#4a6b3a', '#a9702c', '#6e3524', '#c9a227']
};

export const RENAISSANCE_COLORS: ClothingPalette = {
    // The era black became fashionable and achievable at the top of society,
    // alongside kermes crimson and murrey.
    primary: ['#7d2b2e', '#2b3a5e', '#5a3355', '#1c1a19', '#3f4a48', '#6b2f52'],
    secondary: ['#f0e9d8', '#c9a227', '#b0b3ba', '#e0d3b0', '#d8cbb8'],
    accent: ['#c9a227', '#b0b3ba', '#7d2b2e', '#2b3a5e', '#f0e9d8']
};

export const INDUSTRIAL_COLORS: ClothingPalette = {
    // Dark wools and the new cheap blacks; bright aniline colours exist from
    // 1856 but read as novelty rather than as everyday dress.
    primary: ['#1c1a19', '#33413f', '#5c5c5c', '#6b4a33', '#2f3a40', '#232323'],
    secondary: ['#f0ece0', '#e6ddc8', '#cfcfcf', '#d8d8d8', '#e5e2da'],
    accent: ['#8f2f2c', '#2b3a5e', '#3d6b3f', '#6e2723', '#4a6b8a']
};

export const MODERN_COLORS: ClothingPalette = {
    // Synthetic dyes: anything goes, so this is the one palette allowed real
    // saturation — though still short of screen primaries.
    primary: ['#1c1a19', '#f2efe8', '#6b6b6b', '#2b3a5e', '#33413f', '#6f7a85'],
    secondary: ['#7a5433', '#4a6b8a', '#b5824f', '#96603a', '#c8ab86'],
    accent: ['#b02f3f', '#c9a227', '#4f9a4f', '#d4602f', '#3d7fbf']
};

// CULTURAL ZONE SPECIFIC PALETTES
export const EAST_ASIAN_COLORS: ClothingPalette = {
    // Indigo above all — the working colour of East Asia — with madder and
    // safflower reds, and gold and black silk at the top.
    primary: ['#7d2b26', '#c9a227', '#1f1d1c', '#ece5d6', '#33456b', '#4a6b45'],
    secondary: ['#b0b3ba', '#ece5d6', '#4a6b45', '#b5563f', '#d8cbb8'],
    accent: ['#c9a227', '#7d2b26', '#1f1d1c', '#ece5d6', '#33456b']
};

export const MENA_COLORS: ClothingPalette = {
    // Undyed cotton and wool against strong sun, indigo, saffron and madder.
    primary: ['#33456b', '#e6dcc2', '#cbb493', '#7a5433', '#3a4a48', '#b5703c'],
    secondary: ['#2b3a5e', '#7d2b26', '#4a6b3a', '#c9a227', '#b98a52'],
    accent: ['#c9a227', '#b0b3ba', '#43598f', '#9c3a34', '#e6dcc2']
};

export const TROPICAL_COLORS: ClothingPalette = {
    // Barkcloth and plant fibre, turmeric, and the reds and browns of local
    // earths and woods.
    primary: ['#e0d3b0', '#7a5433', '#ece5d6', '#4a6b45', '#b5703c', '#cbb493'],
    secondary: ['#c9a227', '#8c3a2e', '#33456b', '#b5563f', '#b98a52'],
    accent: ['#c9a227', '#8c3a2e', '#4a6b45', '#e0d3b0', '#7a5433']
};

export const NORTHERN_COLORS: ClothingPalette = {
    // Heavy undyed wool in the natural fleece greys and browns, with woad and
    // madder where they could be got.
    primary: ['#3a4a48', '#5c5c5c', '#6b4a33', '#232323', '#2f3a40', '#4a6180'],
    secondary: ['#efe9dc', '#cfcfcf', '#c8a882', '#b5824f', '#96603a'],
    accent: ['#8f3330', '#4a6b3a', '#2b3a5e', '#6e2723', '#43598f']
};

export const MEDIEVAL_MENA_COLORS: ClothingPalette = {
    // The same electric #251df5 appeared here; replaced with the indigo and
    // deep blues the region actually dyed with.
    primary: ['#33456b', '#2b3a5e', '#5a3355', '#1f1d1c', '#3a4a48', '#6b2f52'],
    secondary: ['#f0e9d8', '#c9a227', '#b0b3ba', '#e0d3b0', '#d8cbb8'],
    accent: ['#c9a227', '#b0b3ba', '#43598f', '#7d2b26', '#f0e9d8']
};

export const INDUSTRIAL_MENA_COLORS: ClothingPalette = {
    primary: ['#1c1a19', '#33413f', '#5c5c5c', '#6b4a33', '#2f3a40', '#232323'],
    secondary: ['#f0ece0', '#e6ddc8', '#cfcfcf', '#d8d8d8', '#e5e2da'],
    accent: ['#8f2f2c', '#2b3a5e', '#3d6b3f', '#6e2723', '#4a6b8a']
};
