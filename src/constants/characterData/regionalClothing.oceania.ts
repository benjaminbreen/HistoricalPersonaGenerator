/**
 * constants/characterData/regionalClothing.oceania.ts
 *
 * See regionalClothing.ts for the mechanism. The OCEANIA zone table is written
 * for Polynesia and Hawaii — tapa, feather cloaks, greenstone, whale tooth —
 * and applies that wardrobe to Australia and New Guinea as well, which have
 * next to nothing in common with it. This file overrides the regions where
 * that substitution is worst.
 *
 * Covered: the four Australian regions, New Guinea and Melanesia, New Zealand.
 * Left to the zone table: Polynesia, Hawaii and Central Pacific, Micronesia —
 * the zone table is already written for this wardrobe, so an entry here would
 * only restate it. Also left out: "Indonesian and Melanesian Islands", which
 * groups Sulawesi, the Andamans, Vanuatu, New Caledonia and the Chatham
 * Islands under one key — four unrelated dress traditions, and no single
 * wardrobe could cover it honestly.
 *
 * `getClothingData` only reaches this file for `MODERN_ERA` when the year is
 * unknown or before 1960; from 1960 on it takes the contemporary table by
 * zone, not by region. So the `MODERN_ERA` entries below matter for the early
 * twentieth century, not for the present day.
 */

import type { EraClothingMap, WealthClothingMap } from './clothing';
import { TROPICAL_COLORS, NORTHERN_COLORS, INDUSTRIAL_COLORS, MODERN_COLORS } from './clothingPalettes';
import { HistoricalEra } from '../../types';

/** Traditional dress across these four eras did not change enough to write out four times. */
const PRE_CONTACT_ERAS = [
    HistoricalEra.PREHISTORY,
    HistoricalEra.ANTIQUITY,
    HistoricalEra.MEDIEVAL,
    HistoricalEra.RENAISSANCE_EARLY_MODERN,
];

const withEras = (eras: HistoricalEra[], wealth: WealthClothingMap): EraClothingMap =>
    Object.fromEntries(eras.map(e => [e, wealth])) as EraClothingMap;

/* ============================================================================
 * AUSTRALIA
 *
 * Four regions, one dress history: minimal or no clothing for most of the
 * year, cold answered with fire and shelter rather than cloth, and skin
 * cloaks a feature of the cooler southeast and Tasmania specifically, not the
 * continent generally. `european_contact` for every Australian region is
 * fixed at 1788 (societyCapabilities.ts), so INDUSTRIAL_ERA and MODERN_ERA
 * here are mission and station dress; the four eras before that are shared
 * across all four regions, cloaked or not.
 * ========================================================================= */

function traditionalCloaked(): WealthClothingMap {
    return {
        poor: {
            Male: {
                garments: [
                    { name: 'Kangaroo-Skin Cloak', material: 'Kangaroo Hide' },
                    { name: 'None', material: 'None', adjectives: ['Warm Weather'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fur-String Belt', material: 'Possum-Fur String' }],
                accessories: [
                    { name: 'Reed-Bead Necklace', material: 'River Reed' },
                    { name: 'None', material: 'None' },
                ],
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'Kangaroo-Skin Cloak', material: 'Kangaroo Hide' },
                    { name: 'None', material: 'None', adjectives: ['Warm Weather'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fibre Cord Belt', material: 'Plant Fibre' }],
                accessories: [
                    { name: 'Kangaroo-Tooth Pendant', material: 'Kangaroo Tooth' },
                    { name: 'None', material: 'None' },
                ],
                palette: TROPICAL_COLORS,
            },
        },
        common: {
            Male: {
                garments: [
                    { name: 'Possum-Skin Cloak', material: 'Sewn Possum Pelts', adjectives: ['Incised'] },
                    { name: 'Kangaroo-Skin Cloak', material: 'Kangaroo Hide', adjectives: ['Incised'] },
                ],
                headgear: [
                    { name: 'Reed Headband', material: 'Woven Reed' },
                    { name: 'None', material: 'None' },
                ],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fur-String Belt', material: 'Possum-Fur String' }],
                accessories: [
                    { name: 'Bone Nose Pin', material: 'Kangaroo Bone' },
                    { name: 'Reed-Bead Necklace', material: 'River Reed' },
                ],
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'Possum-Skin Cloak', material: 'Sewn Possum Pelts', adjectives: ['Incised'] },
                    { name: 'Kangaroo-Skin Cloak', material: 'Kangaroo Hide' },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fibre Cord Belt', material: 'Plant Fibre' }],
                accessories: [
                    { name: 'Shell Pendant', material: 'Freshwater Mussel Shell' },
                    { name: 'Reed-Bead Necklace', material: 'River Reed' },
                ],
                palette: TROPICAL_COLORS,
            },
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Possum-Skin Cloak', material: 'Many Sewn Possum Pelts', adjectives: ['Finely Incised'] },
                ],
                headgear: [{ name: 'Feather Headband', material: 'Emu Feather and Reed' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fur-String Belt', material: 'Possum-Fur String', adjectives: ['Multi-Strand'] }],
                accessories: [
                    { name: 'Baler-Shell Pendant', material: 'Traded Baler Shell' },
                    { name: 'Bone Nose Pin', material: 'Kangaroo Bone' },
                ],
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'Possum-Skin Cloak', material: 'Many Sewn Possum Pelts', adjectives: ['Finely Incised'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fibre Cord Belt', material: 'Plant Fibre', adjectives: ['Finely Twisted'] }],
                accessories: [
                    { name: 'Baler-Shell Pendant', material: 'Traded Baler Shell' },
                    { name: 'Reed-Bead Necklace', material: 'River Reed' },
                ],
                palette: TROPICAL_COLORS,
            },
        },
    };
}

/** Shared by the north, the centre and the west — no cloak country, near-nakedness the ordinary state. */
function traditionalMinimal(extraAccessory?: { name: string; material: string; adjectives?: string[] }): WealthClothingMap {
    const acc = (base: { name: string; material: string; adjectives?: string[] }[]) =>
        extraAccessory ? [extraAccessory, ...base] : base;
    return {
        poor: {
            Male: {
                garments: [
                    { name: 'Pubic Covering', material: 'Bark Fibre' },
                    { name: 'None', material: 'None' },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Hair-String Belt', material: 'Human-Hair String' }],
                accessories: acc([
                    { name: 'Shell Pendant', material: 'Baler Shell' },
                    { name: 'None', material: 'None' },
                ]),
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'String Apron', material: 'Human-Hair String' },
                    { name: 'None', material: 'None' },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fibre Cord Belt', material: 'Plant Fibre' }],
                accessories: acc([
                    { name: 'Shell Pendant', material: 'Baler Shell' },
                    { name: 'None', material: 'None' },
                ]),
                palette: TROPICAL_COLORS,
            },
        },
        common: {
            Male: {
                garments: [
                    { name: 'Pubic Covering', material: 'Bark Fibre', adjectives: ['Twined'] },
                    { name: 'None', material: 'None' },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Hair-String Belt', material: 'Human-Hair String', adjectives: ['Twined'] }],
                accessories: acc([
                    { name: 'Dilly Bag', material: 'Woven Fibre' },
                    { name: 'Shell Pendant', material: 'Baler Shell' },
                ]),
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'String Apron', material: 'Human-Hair String', adjectives: ['Twined'] },
                    { name: 'None', material: 'None' },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fibre Cord Belt', material: 'Plant Fibre', adjectives: ['Twined'] }],
                accessories: acc([
                    { name: 'Dilly Bag', material: 'Woven Fibre' },
                    { name: 'Shell Pendant', material: 'Baler Shell' },
                ]),
                palette: TROPICAL_COLORS,
            },
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Pubic Covering', material: 'Bark Fibre', adjectives: ['Multi-Strand'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Hair-String Belt', material: 'Human-Hair String', adjectives: ['Multi-Strand'] }],
                accessories: acc([
                    { name: 'Pearl-Shell Pendant', material: 'Engraved Pearl Shell' },
                    { name: 'Dilly Bag', material: 'Woven Fibre' },
                ]),
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'String Apron', material: 'Human-Hair String', adjectives: ['Multi-Strand'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Fibre Cord Belt', material: 'Plant Fibre', adjectives: ['Multi-Strand'] }],
                accessories: acc([
                    { name: 'Pearl-Shell Pendant', material: 'Engraved Pearl Shell' },
                    { name: 'Dilly Bag', material: 'Woven Fibre' },
                ]),
                palette: TROPICAL_COLORS,
            },
        },
    };
}

/**
 * Mission and station dress, 1788 on. `coldCoat` adds a blanket or oilskin
 * for the southeast; annual government blanket distributions to Aboriginal
 * people in the southeastern colonies ran through most of the nineteenth
 * century and are the source for the poor-tier entry.
 */
function contactAustralian(palette: typeof INDUSTRIAL_COLORS, coldCoat: boolean): WealthClothingMap {
    return {
        poor: {
            Male: {
                garments: [
                    { name: 'Cotton Work Shirt', material: 'Coarse Cotton' },
                    { name: 'Moleskin Trousers', material: 'Moleskin' },
                    ...(coldCoat ? [{ name: 'Blanket Cloak', material: 'Wool Blanket', adjectives: ['Government-Issue'] }] : []),
                ],
                headgear: [
                    { name: 'Slouch Hat', material: 'Felt' },
                    { name: 'None', material: 'None' },
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' },
                    { name: 'Work Boots', material: 'Leather' },
                ],
                belts: [{ name: 'Leather Belt', material: 'Leather' }],
                accessories: [
                    { name: 'None', material: 'None' },
                    { name: 'Clay Pipe', material: 'Fired Clay' },
                ],
                palette,
            },
            Female: {
                garments: [
                    { name: 'Cotton Dress', material: 'Coarse Cotton' },
                    { name: 'Flour-Sack Dress', material: 'Cotton Sacking' },
                    ...(coldCoat ? [{ name: 'Blanket Cloak', material: 'Wool Blanket', adjectives: ['Government-Issue'] }] : []),
                ],
                headgear: [
                    { name: 'Head Scarf', material: 'Cotton' },
                    { name: 'None', material: 'None' },
                ],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
                accessories: [
                    { name: 'None', material: 'None' },
                    { name: 'Glass-Bead Necklace', material: 'Trade Glass' },
                ],
                palette,
            },
        },
        common: {
            Male: {
                garments: [
                    { name: 'Flannel Shirt', material: 'Wool Flannel' },
                    { name: 'Moleskin Trousers', material: 'Moleskin' },
                ],
                headgear: [{ name: 'Slouch Hat', material: 'Felt' }],
                footwear: [{ name: 'Riding Boots', material: 'Leather' }],
                belts: [{ name: 'Leather Belt', material: 'Leather' }],
                accessories: [
                    { name: 'Clasp Knife', material: 'Iron and Bone' },
                    { name: 'None', material: 'None' },
                ],
                palette,
            },
            Female: {
                garments: [
                    { name: 'Cotton Print Dress', material: 'Printed Cotton' },
                    { name: 'Pinafore', material: 'Cotton' },
                ],
                headgear: [{ name: 'Straw Hat', material: 'Straw' }],
                footwear: [{ name: 'Lace-Up Boots', material: 'Leather' }],
                belts: [{ name: 'Cloth Belt', material: 'Cotton' }],
                accessories: [
                    { name: 'Brooch', material: 'Base Metal' },
                    { name: 'None', material: 'None' },
                ],
                palette,
            },
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Wool Suit', material: 'Fine Wool' },
                    { name: 'Riding Jacket', material: 'Tweed' },
                ],
                headgear: [{ name: 'Felt Riding Hat', material: 'Felt' }],
                footwear: [{ name: 'Leather Boots', material: 'Polished Leather' }],
                belts: [{ name: 'Leather Belt', material: 'Leather' }],
                accessories: [
                    { name: 'Pocket Watch', material: 'Gold' },
                    { name: 'Signet Ring', material: 'Gold' },
                ],
                palette,
            },
            Female: {
                garments: [
                    { name: 'Day Dress', material: 'Fine Cotton', adjectives: ['Tailored'] },
                    { name: 'Riding Habit', material: 'Wool' },
                ],
                headgear: [{ name: 'Wide-Brim Hat', material: 'Straw and Ribbon' }],
                footwear: [{ name: 'Leather Boots', material: 'Kid Leather' }],
                belts: [{ name: 'Silk Sash', material: 'Silk' }],
                accessories: [
                    { name: 'Cameo Brooch', material: 'Shell and Gold' },
                    { name: 'Pearl Earrings', material: 'Pearl' },
                ],
                palette,
            },
        },
    };
}

const AUSTRALIA_MINIMAL = traditionalMinimal();
// Engraved pearl shell (riji) is a Kimberley trade item specifically, and the
// Kimberley falls in this region.
const AUSTRALIA_WEST_ACCESSORY = { name: 'Riji', material: 'Engraved Pearl Shell', adjectives: ['Kimberley'] };

const AUSTRALIA_SOUTHEAST: EraClothingMap = {
    ...withEras(PRE_CONTACT_ERAS, traditionalCloaked()),
    [HistoricalEra.INDUSTRIAL_ERA]: contactAustralian(INDUSTRIAL_COLORS, true),
    [HistoricalEra.MODERN_ERA]: contactAustralian(MODERN_COLORS, true),
};

const AUSTRALIA_NORTH_QUEENSLAND: EraClothingMap = {
    ...withEras(PRE_CONTACT_ERAS, AUSTRALIA_MINIMAL),
    [HistoricalEra.INDUSTRIAL_ERA]: contactAustralian(INDUSTRIAL_COLORS, false),
    [HistoricalEra.MODERN_ERA]: contactAustralian(MODERN_COLORS, false),
};

const AUSTRALIA_OUTBACK_CENTER: EraClothingMap = {
    ...withEras(PRE_CONTACT_ERAS, AUSTRALIA_MINIMAL),
    [HistoricalEra.INDUSTRIAL_ERA]: contactAustralian(INDUSTRIAL_COLORS, false),
    [HistoricalEra.MODERN_ERA]: contactAustralian(MODERN_COLORS, false),
};

const AUSTRALIA_WEST_DESERT: EraClothingMap = {
    ...withEras(PRE_CONTACT_ERAS, traditionalMinimal(AUSTRALIA_WEST_ACCESSORY)),
    [HistoricalEra.INDUSTRIAL_ERA]: contactAustralian(INDUSTRIAL_COLORS, false),
    [HistoricalEra.MODERN_ERA]: contactAustralian(MODERN_COLORS, false),
};

/* ============================================================================
 * NEW GUINEA AND MELANESIA
 *
 * The largest single region (88 personas) and the most internally diverse —
 * Sepik, the Papuan highlands, the Bismarcks, the Solomons, Fiji. The entry
 * below is deliberately generic: barkcloth, fibre skirts and shell rank
 * ornament cover the coasts and islands honestly, and the penis gourd
 * (koteka) is added as one option among several for the highlands rather than
 * the default, since the region is not only highlands. Bird-of-paradise
 * plumage is festival dress (singsing), not daily wear, and is left out.
 *
 * `european_contact` for this region is pinned to 1930 (the highlands were
 * not entered before then), so the traditional wardrobe below is honest
 * through INDUSTRIAL_ERA and needs only a MODERN_ERA update for the trade
 * cotton that had reached the coasts and larger islands by then.
 * ========================================================================= */

function traditionalMelanesian(): WealthClothingMap {
    return {
        poor: {
            Male: {
                garments: [
                    { name: 'Bark-Cloth Loincloth', material: 'Beaten Bark Cloth' },
                    { name: 'Netted Fibre Apron', material: 'Woven Plant Fibre' },
                    { name: 'Penis Gourd (Koteka)', material: 'Dried Gourd', adjectives: ['Highland'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Woven Fibre Belt', material: 'Plant Fibre' }],
                accessories: [
                    { name: 'Cowrie-Shell Band', material: 'Cowrie Shell' },
                    { name: 'Bilum Bag', material: 'Netted Plant Fibre' },
                ],
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'Fibre Skirt', material: 'Plant Fibre', adjectives: ['Layered'] },
                    { name: 'Bark-Cloth Wrap', material: 'Beaten Bark Cloth' },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Woven Fibre Belt', material: 'Plant Fibre' }],
                accessories: [
                    { name: 'Cowrie-Shell Necklace', material: 'Cowrie Shell' },
                    { name: 'Bilum Bag', material: 'Netted Plant Fibre' },
                ],
                palette: TROPICAL_COLORS,
            },
        },
        common: {
            Male: {
                garments: [
                    { name: 'Bark-Cloth Loincloth', material: 'Beaten Bark Cloth', adjectives: ['Painted'] },
                    { name: 'Penis Gourd (Koteka)', material: 'Dried Gourd', adjectives: ['Highland', 'Decorated'] },
                ],
                headgear: [
                    { name: 'Woven Fibre Cap', material: 'Plant Fibre' },
                    { name: 'None', material: 'None' },
                ],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Woven Fibre Belt', material: 'Plant Fibre', adjectives: ['Patterned'] }],
                accessories: [
                    { name: 'Kina-Shell Pendant', material: 'Gold-Lip Pearl Shell' },
                    { name: 'Bilum Bag', material: 'Netted Plant Fibre' },
                    { name: 'Boar-Tusk Armband', material: 'Boar Tusk' },
                ],
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'Fibre Skirt', material: 'Plant Fibre', adjectives: ['Layered', 'Dyed'] },
                    { name: 'Bark-Cloth Wrap', material: 'Beaten Bark Cloth', adjectives: ['Painted'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Woven Fibre Belt', material: 'Plant Fibre', adjectives: ['Patterned'] }],
                accessories: [
                    { name: 'Kina-Shell Pendant', material: 'Gold-Lip Pearl Shell' },
                    { name: 'Bilum Bag', material: 'Netted Plant Fibre' },
                ],
                palette: TROPICAL_COLORS,
            },
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Bark-Cloth Loincloth', material: 'Finest Beaten Bark Cloth', adjectives: ['Painted'] },
                ],
                headgear: [{ name: 'Woven Fibre Cap', material: 'Plant Fibre', adjectives: ['Finely Woven'] }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Woven Fibre Belt', material: 'Plant Fibre', adjectives: ['Finely Patterned'] }],
                accessories: [
                    { name: 'Kina-Shell Breastplate', material: 'Gold-Lip Pearl Shell' },
                    { name: 'Curved Boar-Tusk Pendant', material: 'Boar Tusk' },
                    { name: 'Fine Bilum Bag', material: 'Netted Plant Fibre' },
                ],
                palette: TROPICAL_COLORS,
            },
            Female: {
                garments: [
                    { name: 'Fibre Skirt', material: 'Finest Plant Fibre', adjectives: ['Layered', 'Dyed'] },
                ],
                headgear: [{ name: 'None', material: 'None' }],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Woven Fibre Belt', material: 'Plant Fibre', adjectives: ['Finely Patterned'] }],
                accessories: [
                    { name: 'Kina-Shell Necklace', material: 'Gold-Lip Pearl Shell' },
                    { name: 'Fine Bilum Bag', material: 'Netted Plant Fibre' },
                ],
                palette: TROPICAL_COLORS,
            },
        },
    };
}

/** Trade cotton (laplap) had reached the coasts and islands by the early twentieth century; the highlands had not. Both are offered as options. */
function melanesianModern(): WealthClothingMap {
    const base = traditionalMelanesian();
    return {
        poor: {
            Male: { ...base.poor!.Male!, garments: [...base.poor!.Male!.garments, { name: 'Cotton Laplap', material: 'Trade Cotton' }] },
            Female: { ...base.poor!.Female!, garments: [...base.poor!.Female!.garments, { name: 'Cotton Laplap', material: 'Trade Cotton' }] },
        },
        common: {
            Male: { ...base.common!.Male!, garments: [...base.common!.Male!.garments, { name: 'Cotton Laplap', material: 'Trade Cotton' }] },
            Female: { ...base.common!.Female!, garments: [...base.common!.Female!.garments, { name: 'Cotton Laplap', material: 'Trade Cotton' }] },
        },
        wealthy: {
            Male: { ...base.wealthy!.Male!, garments: [...base.wealthy!.Male!.garments, { name: 'Cotton Shirt and Laplap', material: 'Trade Cotton' }] },
            Female: { ...base.wealthy!.Female!, garments: [...base.wealthy!.Female!.garments, { name: 'Cotton Blouse and Laplap', material: 'Trade Cotton' }] },
        },
    };
}

const NEW_GUINEA_MELANESIA: EraClothingMap = {
    ...withEras(
        [...PRE_CONTACT_ERAS, HistoricalEra.INDUSTRIAL_ERA],
        traditionalMelanesian(),
    ),
    [HistoricalEra.MODERN_ERA]: melanesianModern(),
};

/* ============================================================================
 * NEW ZEALAND
 *
 * Māori settlement dates to about 1280 CE (geography.ts already gates the
 * regions on it), so PREHISTORY and ANTIQUITY are left to the zone table —
 * there is no honest entry to write for an uninhabited land. MEDIEVAL and
 * RENAISSANCE_EARLY_MODERN carry the traditional flax and feather wardrobe;
 * INDUSTRIAL_ERA and MODERN_ERA carry European dress, which is what an
 * ordinary New Zealander of either descent actually wore by then and is
 * exactly what the zone table cannot supply. Greenstone (pounamu) is kept as
 * a recurring accessory through the contact eras — it did not stop being
 * worn, only stopped being the whole wardrobe.
 * ========================================================================= */

const MAORI_TRADITIONAL: WealthClothingMap = {
    poor: {
        Male: {
            garments: [
                { name: 'Rain Cape', material: 'Undressed Flax', adjectives: ['Rough'] },
                { name: 'Piupiu', material: 'Flax Fibre' },
            ],
            headgear: [{ name: 'None', material: 'None' }],
            footwear: [{ name: 'Barefoot', material: 'None' }],
            belts: [{ name: 'Flax Cord Belt', material: 'Woven Flax' }],
            accessories: [
                { name: 'Bone Pendant', material: 'Carved Bone' },
                { name: 'None', material: 'None' },
            ],
            palette: NORTHERN_COLORS,
        },
        Female: {
            garments: [
                { name: 'Rain Cape', material: 'Undressed Flax', adjectives: ['Rough'] },
                { name: 'Piupiu', material: 'Flax Fibre' },
            ],
            headgear: [{ name: 'None', material: 'None' }],
            footwear: [{ name: 'Barefoot', material: 'None' }],
            belts: [{ name: 'Flax Cord Belt', material: 'Woven Flax' }],
            accessories: [
                { name: 'Bone Pendant', material: 'Carved Bone' },
                { name: 'None', material: 'None' },
            ],
            palette: NORTHERN_COLORS,
        },
    },
    common: {
        Male: {
            garments: [
                { name: 'Korowai Cloak', material: 'Woven Flax', adjectives: ['Tag'] },
                { name: 'Piupiu', material: 'Flax Fibre' },
            ],
            headgear: [{ name: 'None', material: 'None' }],
            footwear: [{ name: 'Barefoot', material: 'None' }],
            belts: [{ name: 'Flax Cord Belt', material: 'Woven Flax', adjectives: ['Plaited'] }],
            accessories: [
                { name: 'Pounamu Pendant', material: 'Greenstone', adjectives: ['Hei-Tiki'] },
                { name: 'Bone Pendant', material: 'Carved Bone' },
            ],
            palette: NORTHERN_COLORS,
        },
        Female: {
            garments: [
                { name: 'Korowai Cloak', material: 'Woven Flax', adjectives: ['Tag'] },
                { name: 'Piupiu', material: 'Flax Fibre' },
            ],
            headgear: [{ name: 'None', material: 'None' }],
            footwear: [{ name: 'Barefoot', material: 'None' }],
            belts: [{ name: 'Flax Cord Belt', material: 'Woven Flax', adjectives: ['Plaited'] }],
            accessories: [
                { name: 'Pounamu Pendant', material: 'Greenstone', adjectives: ['Hei-Tiki'] },
                { name: 'Bone Pendant', material: 'Carved Bone' },
            ],
            palette: NORTHERN_COLORS,
        },
    },
    wealthy: {
        Male: {
            garments: [
                { name: 'Kahu Kiwi', material: 'Kiwi Feather and Flax', adjectives: ['Fine'] },
                { name: 'Kaitaka Cloak', material: 'Fine Flax', adjectives: ['Taniko-Bordered'] },
            ],
            headgear: [{ name: 'None', material: 'None' }],
            footwear: [{ name: 'Barefoot', material: 'None' }],
            belts: [{ name: 'Flax Cord Belt', material: 'Finely Plaited Flax' }],
            accessories: [
                { name: 'Pounamu Pendant', material: 'Fine Greenstone', adjectives: ['Hei-Tiki'] },
                { name: 'Pounamu Ear Pendant', material: 'Greenstone' },
            ],
            palette: NORTHERN_COLORS,
        },
        Female: {
            garments: [
                { name: 'Kahu Kiwi', material: 'Kiwi Feather and Flax', adjectives: ['Fine'] },
                { name: 'Kaitaka Cloak', material: 'Fine Flax', adjectives: ['Taniko-Bordered'] },
            ],
            headgear: [{ name: 'None', material: 'None' }],
            footwear: [{ name: 'Barefoot', material: 'None' }],
            belts: [{ name: 'Flax Cord Belt', material: 'Finely Plaited Flax' }],
            accessories: [
                { name: 'Pounamu Pendant', material: 'Fine Greenstone', adjectives: ['Hei-Tiki'] },
                { name: 'Pounamu Ear Pendant', material: 'Greenstone' },
            ],
            palette: NORTHERN_COLORS,
        },
    },
};

function newZealandContact(palette: typeof INDUSTRIAL_COLORS): WealthClothingMap {
    return {
        poor: {
            Male: {
                garments: [
                    { name: 'Cotton Shirt', material: 'Trade Cotton' },
                    { name: 'Wool Trousers', material: 'Wool' },
                ],
                headgear: [
                    { name: 'Straw Hat', material: 'Straw' },
                    { name: 'None', material: 'None' },
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' },
                    { name: 'Work Boots', material: 'Leather' },
                ],
                belts: [{ name: 'Leather Belt', material: 'Leather' }],
                accessories: [
                    { name: 'Pounamu Pendant', material: 'Greenstone' },
                    { name: 'None', material: 'None' },
                ],
                palette,
            },
            Female: {
                garments: [
                    { name: 'Cotton Dress', material: 'Trade Cotton' },
                    { name: 'Wool Shawl', material: 'Wool' },
                ],
                headgear: [
                    { name: 'Head Scarf', material: 'Cotton' },
                    { name: 'None', material: 'None' },
                ],
                footwear: [{ name: 'Barefoot', material: 'None' }],
                belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
                accessories: [
                    { name: 'Pounamu Pendant', material: 'Greenstone' },
                    { name: 'None', material: 'None' },
                ],
                palette,
            },
        },
        common: {
            Male: {
                garments: [
                    { name: 'Wool Shirt and Trousers', material: 'Wool and Cotton' },
                    { name: 'Moleskin Trousers', material: 'Moleskin' },
                ],
                headgear: [{ name: 'Bowler Hat', material: 'Felt' }],
                footwear: [{ name: 'Leather Boots', material: 'Leather' }],
                belts: [{ name: 'Leather Belt', material: 'Leather' }],
                accessories: [
                    { name: 'Pounamu Pendant', material: 'Greenstone' },
                    { name: 'Pocket Watch', material: 'Silver' },
                ],
                palette,
            },
            Female: {
                garments: [
                    { name: 'Cotton Print Dress', material: 'Printed Cotton' },
                    { name: 'Wool Jacket', material: 'Wool' },
                ],
                headgear: [{ name: 'Wide-Brim Hat', material: 'Straw' }],
                footwear: [{ name: 'Lace-Up Boots', material: 'Leather' }],
                belts: [{ name: 'Cloth Belt', material: 'Cotton' }],
                accessories: [
                    { name: 'Pounamu Pendant', material: 'Greenstone' },
                    { name: 'Brooch', material: 'Silver' },
                ],
                palette,
            },
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Wool Suit', material: 'Fine Wool', adjectives: ['Tailored'] },
                    { name: 'Riding Coat', material: 'Tweed' },
                ],
                headgear: [{ name: 'Top Hat', material: 'Silk and Felt' }],
                footwear: [{ name: 'Leather Boots', material: 'Polished Leather' }],
                belts: [{ name: 'Leather Belt', material: 'Fine Leather' }],
                accessories: [
                    { name: 'Pounamu Pendant', material: 'Fine Greenstone', adjectives: ['Hei-Tiki'] },
                    { name: 'Gold Watch', material: 'Gold' },
                ],
                palette,
            },
            Female: {
                garments: [
                    { name: 'Silk Day Dress', material: 'Silk', adjectives: ['Tailored'] },
                    { name: 'Wool Travelling Suit', material: 'Wool' },
                ],
                headgear: [{ name: 'Feathered Hat', material: 'Felt and Feather' }],
                footwear: [{ name: 'Leather Boots', material: 'Kid Leather' }],
                belts: [{ name: 'Silk Sash', material: 'Silk' }],
                accessories: [
                    { name: 'Pounamu Pendant', material: 'Fine Greenstone', adjectives: ['Hei-Tiki'] },
                    { name: 'Pearl Brooch', material: 'Pearl and Silver' },
                ],
                palette,
            },
        },
    };
}

const NEW_ZEALAND: EraClothingMap = {
    [HistoricalEra.MEDIEVAL]: MAORI_TRADITIONAL,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: MAORI_TRADITIONAL,
    [HistoricalEra.INDUSTRIAL_ERA]: newZealandContact(INDUSTRIAL_COLORS),
    [HistoricalEra.MODERN_ERA]: newZealandContact(MODERN_COLORS),
};

export const OCEANIA_REGIONS: Partial<Record<string, EraClothingMap>> = {
    'Australia – Southeast': AUSTRALIA_SOUTHEAST,
    'Australia – North and Queensland': AUSTRALIA_NORTH_QUEENSLAND,
    'Australia – Outback and Center': AUSTRALIA_OUTBACK_CENTER,
    'Australia – West and Desert': AUSTRALIA_WEST_DESERT,
    'New Guinea and Melanesia': NEW_GUINEA_MELANESIA,
    'New Zealand': NEW_ZEALAND,
};
