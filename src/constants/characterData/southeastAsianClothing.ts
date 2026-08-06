/**
 * constants/characterData/southeastAsianClothing.ts
 *
 * The SOUTHEAST_ASIAN zone table. One in twelve generated personas fall
 * in this zone, and until this file was filled in they had no wardrobe
 * of their own: `getClothingData`'s cross-cultural fallback dressed them
 * out of the South Asian and prehistoric tables instead — a Javanese
 * farmer in a Cotton Lungi, a Luzon fisherman in a Fur Cloak.
 *
 * Mainland (Burma, Thailand, Laos, Cambodia, Vietnam) and maritime
 * (Indonesia, Malaysia, the Philippines) dress are both drawn from,
 * rather than split into two tables — a single `garments` list mixes
 * sarong/kain and sampot/longyi terms so a random pull can land on
 * either tradition. Cotton is absent before ANTIQUITY (bark cloth and
 * bast fibre only; cotton weaving arrives with Indian Ocean trade
 * contact) and batik and the kebaya are absent before
 * RENAISSANCE_EARLY_MODERN, when both are first attested in Java.
 * Footwear is barefoot for most people through most of the table —
 * sandals were the exception, not boots.
 */
import type { ClothingPalette, ClothingPiece, ClothingSet, EraClothingMap } from './clothing';
import { HistoricalEra } from '../../types';
import {
    PREHISTORIC_COLORS,
    TROPICAL_COLORS,
    MEDIEVAL_COLORS,
    RENAISSANCE_COLORS,
    INDUSTRIAL_COLORS,
    MODERN_COLORS,
} from './clothingPalettes';

const NONE: ClothingPiece = { name: 'None', material: 'None' };

const wear = (
    garments: ClothingPiece[],
    headgear: ClothingPiece[],
    footwear: ClothingPiece[],
    belts: ClothingPiece[],
    accessories: ClothingPiece[],
    palette: ClothingPalette
): ClothingSet => ({ garments, headgear, footwear, belts, accessories, palette });

export const SOUTHEAST_ASIAN_CLOTHING: EraClothingMap = {
    // Pre-cotton: bark cloth and bast fibre, Dong Son bronze and Sa
    // Huynh-tradition jade toward the late end of the period.
    [HistoricalEra.PREHISTORY]: {
        poor: {
            Male: wear(
                [{ name: 'Bark Cloth Loincloth', material: 'Beaten Bark' },
                 { name: 'Woven Fibre Wrap', material: 'Bast Fibre' },
                 { name: 'Rattan Waist Apron', material: 'Rattan' }],
                [{ name: 'Woven Palm Headband', material: 'Palm Leaf' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Shell Bead Necklace', material: 'Cowrie Shell' }, NONE],
                TROPICAL_COLORS
            ),
            Female: wear(
                [{ name: 'Bast Fibre Wrap Skirt', material: 'Bast Fibre' },
                 { name: 'Bark Cloth Skirt', material: 'Beaten Bark' },
                 { name: 'Woven Rattan Apron', material: 'Rattan' }],
                [{ name: 'Woven Fibre Headband', material: 'Bast Fibre' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Shell Bead Necklace', material: 'Cowrie Shell' }, NONE],
                TROPICAL_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Woven Bast-Fibre Kilt', material: 'Bast Fibre' },
                 { name: 'Bark Cloth Wrap', material: 'Beaten Bark' },
                 { name: 'Plaited Rattan Wrap', material: 'Rattan' }],
                [{ name: 'Woven Palm Headband', material: 'Palm Leaf' },
                 { name: 'Feather Headdress', material: 'Hornbill Feather' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Woven Fibre Belt', material: 'Bast Fibre' }],
                [{ name: 'Shell Bead Necklace', material: 'Cowrie Shell' },
                 { name: 'Bronze Armlet', material: 'Bronze' },
                 { name: 'Boar Tusk Pendant', material: 'Boar Tusk' }],
                TROPICAL_COLORS
            ),
            Female: wear(
                [{ name: 'Woven Bast-Fibre Skirt', material: 'Bast Fibre' },
                 { name: 'Bark Cloth Wrap Skirt', material: 'Beaten Bark' },
                 { name: 'Patterned Fibre Skirt', material: 'Bast Fibre' }],
                [{ name: 'Woven Fibre Headband', material: 'Bast Fibre' },
                 { name: 'Flower Garland', material: 'Fresh Flowers' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Woven Fibre Belt', material: 'Bast Fibre' }],
                [{ name: 'Shell Bead Necklace', material: 'Cowrie Shell' },
                 { name: 'Bronze Armlet', material: 'Bronze' },
                 { name: 'Woven Fibre Anklet', material: 'Bast Fibre' }],
                TROPICAL_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Fine Bark Cloth Wrap', material: 'Beaten Bark', adjectives: ['Fine'] },
                 { name: 'Bronze-Studded Hide Wrap', material: 'Deer Hide' },
                 { name: 'Woven Ikat Kilt', material: 'Bast Fibre' }],
                [{ name: 'Feather Headdress', material: 'Hornbill Feather' },
                 { name: 'Bronze Diadem', material: 'Bronze' },
                 { name: 'Woven Fibre Turban', material: 'Bast Fibre' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Rattan Sandals', material: 'Rattan' }],
                [{ name: 'Bronze Belt', material: 'Bronze' }, { name: 'Woven Fibre Sash', material: 'Bast Fibre' }],
                [{ name: 'Jade Lingling-o Earring', material: 'Nephrite' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Bronze Bracelet', material: 'Bronze' }],
                TROPICAL_COLORS
            ),
            Female: wear(
                [{ name: 'Fine Bast-Fibre Wrap Skirt', material: 'Bast Fibre', adjectives: ['Fine'] },
                 { name: 'Woven Ikat Wrap Skirt', material: 'Bast Fibre' },
                 { name: 'Bronze-Ornamented Bark Cloth Wrap', material: 'Beaten Bark' }],
                [{ name: 'Woven Fibre Headdress', material: 'Bast Fibre' },
                 { name: 'Bronze Hair Pin', material: 'Bronze' },
                 { name: 'Feather Ornament', material: 'Hornbill Feather' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Rattan Sandals', material: 'Rattan' }],
                [{ name: 'Bronze Belt', material: 'Bronze' }, { name: 'Woven Fibre Sash', material: 'Bast Fibre' }],
                [{ name: 'Jade Lingling-o Earring', material: 'Nephrite' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Bronze Bracelet', material: 'Bronze' }],
                TROPICAL_COLORS
            ),
        },
    },

    // ~500 BCE-500 CE: Dong Son culture into early Funan, Champa, Pyu.
    // Cotton and glass and carnelian trade beads arrive with Indian
    // Ocean contact; Indianized courts are only just beginning.
    [HistoricalEra.ANTIQUITY]: {
        poor: {
            Male: wear(
                [{ name: 'Wrapped Cotton Loincloth', material: 'Rough Cotton' },
                 { name: 'Bark Cloth Wrap', material: 'Beaten Bark' },
                 { name: 'Plaited Fibre Kilt', material: 'Bast Fibre' }],
                [{ name: 'Woven Palm Hat', material: 'Palm Leaf' }, { name: 'Cotton Headcloth', material: 'Rough Cotton' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Shell Pendant', material: 'Shell' }, NONE],
                TROPICAL_COLORS
            ),
            Female: wear(
                [{ name: 'Wrapped Cotton Skirt', material: 'Rough Cotton' },
                 { name: 'Bark Cloth Skirt', material: 'Beaten Bark' }],
                [{ name: 'Cotton Headcloth', material: 'Rough Cotton' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Shell Bracelet', material: 'Shell' }, NONE],
                TROPICAL_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Wrapped Cotton Sampot', material: 'Cotton' },
                 { name: 'Cotton Kilt', material: 'Cotton' },
                 { name: 'Plaited Fibre Wrap', material: 'Bast Fibre' }],
                [{ name: 'Cotton Turban', material: 'Cotton' }, { name: 'Woven Palm Hat', material: 'Palm Leaf' }, NONE],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Fibre Sandals', material: 'Bast Fibre' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Bronze Bangle', material: 'Bronze' },
                 { name: 'Krama Scarf', material: 'Cotton' }],
                TROPICAL_COLORS
            ),
            Female: wear(
                [{ name: 'Wrapped Cotton Skirt', material: 'Cotton' },
                 { name: 'Woven Ikat Wrap Skirt', material: 'Ikat Cotton' },
                 { name: 'Cotton Breast Wrap and Skirt', material: 'Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Flower Garland', material: 'Fresh Flowers' }, NONE],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Fibre Sandals', material: 'Bast Fibre' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Bronze Bangle', material: 'Bronze' },
                 { name: 'Glass Bead Necklace', material: 'Trade Glass' }],
                TROPICAL_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Fine Cotton Sampot', material: 'Fine Cotton' },
                 { name: 'Silk-Bordered Wrap', material: 'Silk-Trimmed Cotton' },
                 { name: 'Gold-Threaded Cotton Wrap', material: 'Gold Thread and Cotton' }],
                [{ name: 'Gold Diadem', material: 'Gold' }, { name: 'Cotton Turban with Gold Thread', material: 'Gold-Threaded Cotton' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Leather Sandals', material: 'Leather' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Woven Silk Sash', material: 'Silk' }],
                [{ name: 'Gold Ear Flare', material: 'Gold' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Bronze Armlet', material: 'Bronze' }],
                TROPICAL_COLORS
            ),
            Female: wear(
                [{ name: 'Fine Cotton Wrap Skirt', material: 'Fine Cotton' },
                 { name: 'Silk-Bordered Wrap Skirt', material: 'Silk-Trimmed Cotton' },
                 { name: 'Silk Ikat Wrap Skirt', material: 'Silk Ikat' }],
                [{ name: 'Gold Hair Ornament', material: 'Gold' }, { name: 'Flower and Gold Headdress', material: 'Gold and Fresh Flowers' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Leather Sandals', material: 'Leather' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Woven Silk Sash', material: 'Silk' }],
                [{ name: 'Gold Ear Flare', material: 'Gold' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Gold Bracelet', material: 'Gold' }],
                TROPICAL_COLORS
            ),
        },
    },

    // ~500-1500: Khmer Empire, Srivijaya, Pagan, Majapahit. Gold-thread
    // songket weaving is established in the Malay world; batik and the
    // kebaya are not — both are a Java-specific development of the next
    // era and are held back until then.
    [HistoricalEra.MEDIEVAL]: {
        poor: {
            Male: wear(
                [{ name: 'Wrapped Cotton Sampot', material: 'Coarse Cotton' },
                 { name: 'Plaited Fibre Wrap', material: 'Bast Fibre' },
                 { name: 'Bark Cloth Wrap', material: 'Beaten Bark' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Woven Palm Hat', material: 'Palm Leaf' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Shell Pendant', material: 'Shell' }, NONE],
                MEDIEVAL_COLORS
            ),
            Female: wear(
                [{ name: 'Wrapped Cotton Skirt', material: 'Coarse Cotton' },
                 { name: 'Cotton Breast Wrap', material: 'Coarse Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Shell Bracelet', material: 'Shell' }, NONE],
                MEDIEVAL_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Sampot Chong Kben', material: 'Cotton' },
                 { name: 'Longyi', material: 'Cotton' },
                 { name: 'Cotton Wrap and Sash', material: 'Cotton' }],
                [{ name: 'Cotton Turban', material: 'Cotton' }, { name: 'Woven Palm Hat', material: 'Palm Leaf' }, NONE],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Leather Sandals', material: 'Leather' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Bronze Bangle', material: 'Bronze' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Krama Scarf', material: 'Cotton' }],
                MEDIEVAL_COLORS
            ),
            Female: wear(
                [{ name: 'Kemben and Kain', material: 'Cotton' },
                 { name: 'Sampot and Blouse', material: 'Cotton' },
                 { name: 'Htamein and Blouse', material: 'Cotton' },
                 { name: 'Woven Ikat Wrap Skirt', material: 'Ikat Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Flower Garland', material: 'Fresh Flowers' }, NONE],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Plaited Leather Sandals', material: 'Leather' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Bronze Bangle', material: 'Bronze' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Betel Nut Pouch', material: 'Woven Fibre' }],
                MEDIEVAL_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Songket Sampot', material: 'Gold-Thread Songket' },
                 { name: 'Silk Sampot Chong Kben', material: 'Silk' },
                 { name: 'Gold-Bordered Longyi', material: 'Gold-Bordered Silk' }],
                [{ name: 'Gold Diadem', material: 'Gold' }, { name: 'Gold-Threaded Turban', material: 'Gold-Threaded Silk' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Gold-Embroidered Sandals', material: 'Leather and Gold Thread' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Silk Sash', material: 'Silk' }],
                [{ name: 'Gold Ear Flare', material: 'Gold' },
                 { name: 'Kris', material: 'Gold and Steel' },
                 { name: 'Betel Box', material: 'Brass' }],
                MEDIEVAL_COLORS
            ),
            Female: wear(
                [{ name: 'Songket Kain and Kemben', material: 'Gold-Thread Songket' },
                 { name: 'Silk Sampot and Blouse', material: 'Silk' },
                 { name: 'Ikat Kain and Kemben', material: 'Silk Ikat' }],
                [{ name: 'Gold Hair Ornament', material: 'Gold' }, { name: 'Flower and Gold Headdress', material: 'Gold and Fresh Flowers' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Gold-Embroidered Sandals', material: 'Leather and Gold Thread' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Silk Sash', material: 'Silk' }],
                [{ name: 'Gold Ear Flare', material: 'Gold' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Gold Bracelet', material: 'Gold' }],
                MEDIEVAL_COLORS
            ),
        },
    },

    // ~1500-1800: Melaka and its successor sultanates, Ayutthaya,
    // Toungoo Burma, Spanish Philippines from 1565. Batik dyeing and the
    // kebaya both take their earliest documented form in Java in this
    // window; the songkok spreads with Islam. The poor tier keeps a
    // plainer blouse rather than "kebaya" — a court garment first,
    // decades from being everyday wear for a labourer's wife.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
        poor: {
            Male: wear(
                [{ name: 'Wrapped Cotton Sarong', material: 'Coarse Cotton' },
                 { name: 'Longyi', material: 'Cotton' },
                 { name: 'Sampot', material: 'Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Woven Palm Hat', material: 'Palm Leaf' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Betel Nut Pouch', material: 'Woven Fibre' }, NONE],
                RENAISSANCE_COLORS
            ),
            Female: wear(
                [{ name: 'Wrapped Cotton Sarong', material: 'Coarse Cotton' },
                 { name: 'Cotton Kemben and Skirt', material: 'Coarse Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Plaited Fibre Cord', material: 'Bast Fibre' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Shell Bracelet', material: 'Shell' }, NONE],
                RENAISSANCE_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Baju and Sarong', material: 'Cotton' },
                 { name: 'Sampot and Shirt', material: 'Cotton' },
                 { name: 'Longyi and Cotton Jacket', material: 'Cotton' }],
                [{ name: 'Songkok', material: 'Cotton Velvet' }, { name: 'Non La', material: 'Palm Leaf' }, { name: 'Cotton Turban', material: 'Cotton' }],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Leather Sandals', material: 'Leather' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Betel Nut Pouch', material: 'Woven Fibre' },
                 { name: 'Bronze Bangle', material: 'Bronze' },
                 { name: 'Krama Scarf', material: 'Cotton' }],
                RENAISSANCE_COLORS
            ),
            Female: wear(
                [{ name: 'Kain and Kebaya', material: 'Batik Cotton' },
                 { name: 'Sampot and Blouse', material: 'Cotton' },
                 { name: 'Baju Kurung', material: 'Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Selendang Shoulder Cloth', material: 'Cotton' }, NONE],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Leather Sandals', material: 'Leather' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Bronze Bangle', material: 'Bronze' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Stud Earrings', material: 'Gold Plate' }],
                RENAISSANCE_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Songket Sarong and Baju', material: 'Gold-Thread Songket' },
                 { name: 'Silk Sampot and Jacket', material: 'Silk' },
                 { name: 'Gold-Bordered Longyi and Silk Jacket', material: 'Silk and Gold Thread' }],
                [{ name: 'Songkok', material: 'Velvet and Gold Thread' }, { name: 'Silk Turban', material: 'Silk' }, { name: 'Gold Diadem', material: 'Gold' }],
                [{ name: 'Gold-Embroidered Sandals', material: 'Leather and Gold Thread' }, { name: 'Barefoot', material: 'None' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Silk Sash', material: 'Silk' }],
                [{ name: 'Kris', material: 'Gold and Damascened Steel' },
                 { name: 'Gold Ear Flare', material: 'Gold' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' }],
                RENAISSANCE_COLORS
            ),
            Female: wear(
                [{ name: 'Songket Kain and Kebaya', material: 'Gold-Thread Songket' },
                 { name: 'Silk Sampot and Blouse', material: 'Silk' },
                 { name: 'Batik Kain and Kebaya', material: 'Fine Batik Cotton' }],
                [{ name: 'Gold Hair Ornament', material: 'Gold' }, { name: 'Selendang Shoulder Cloth', material: 'Silk' }],
                [{ name: 'Gold-Embroidered Sandals', material: 'Leather and Gold Thread' }, { name: 'Barefoot', material: 'None' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Silk Sash', material: 'Silk' }],
                [{ name: 'Gold Ear Flare', material: 'Gold' },
                 { name: 'Carnelian Bead Necklace', material: 'Carnelian' },
                 { name: 'Gold Bracelet', material: 'Gold' }],
                RENAISSANCE_COLORS
            ),
        },
    },

    // ~1800-1900s: Dutch East Indies, British Burma/Malaya, French
    // Indochina, Spanish then American Philippines. Cotton drill and
    // imported prints alongside the indigenous weaving trades, which
    // colonial rule did not displace; the barong tagalog and the
    // Vietnamese ao ngu than (the ao dai's direct precursor) both take
    // their recognisable form in this period.
    [HistoricalEra.INDUSTRIAL_ERA]: {
        poor: {
            Male: wear(
                [{ name: 'Wrapped Cotton Sarong', material: 'Cotton' },
                 { name: 'Longyi', material: 'Cotton' },
                 { name: 'Cotton Trousers and Shirt', material: 'Coarse Cotton', adjectives: ['Worn'] }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Straw Hat', material: 'Straw' }, NONE],
                [{ name: 'Barefoot', material: 'None' }, { name: 'Rubber Sandals', material: 'Rubber' }],
                [{ name: 'Rope Belt', material: 'Jute Rope' }],
                [{ name: 'Betel Nut Pouch', material: 'Woven Fibre' }, NONE],
                INDUSTRIAL_COLORS
            ),
            Female: wear(
                [{ name: 'Sarong and Blouse', material: 'Cotton', adjectives: ['Faded'] },
                 { name: 'Kemben and Skirt', material: 'Coarse Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, NONE],
                [{ name: 'Barefoot', material: 'None' }],
                [{ name: 'Rope Belt', material: 'Jute Rope' }],
                [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, NONE],
                INDUSTRIAL_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Baju and Sarong', material: 'Cotton' },
                 { name: 'Cotton Trousers and Shirt', material: 'Cotton Drill' },
                 { name: 'Longyi and Cotton Jacket', material: 'Cotton' }],
                [{ name: 'Songkok', material: 'Velvet' }, { name: 'Salakot', material: 'Woven Rattan' }, { name: 'Straw Hat', material: 'Straw' }],
                [{ name: 'Leather Sandals', material: 'Leather' }, { name: 'Bakya Clogs', material: 'Wood and Leather' }],
                [{ name: 'Leather Belt', material: 'Leather' }],
                [{ name: 'Wristwatch', material: 'Steel' }, { name: 'Betel Nut Pouch', material: 'Woven Fibre' }],
                INDUSTRIAL_COLORS
            ),
            Female: wear(
                [{ name: 'Kain and Kebaya', material: 'Batik Cotton' },
                 { name: "Baro't Saya", material: 'Piña and Cotton' },
                 { name: 'Sampot and Blouse', material: 'Cotton' }],
                [{ name: 'Cotton Headcloth', material: 'Cotton' }, { name: 'Selendang Shoulder Cloth', material: 'Cotton' }, NONE],
                [{ name: 'Leather Sandals', material: 'Leather' }, { name: 'Bakya Clogs', material: 'Wood and Leather' }],
                [{ name: 'Woven Cotton Sash', material: 'Cotton' }],
                [{ name: 'Stud Earrings', material: 'Gold Plate' }, { name: 'Glass Bead Necklace', material: 'Glass' }],
                INDUSTRIAL_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Barong Tagalog and Trousers', material: 'Piña Cloth' },
                 { name: 'Songket Sarong and Baju', material: 'Gold-Thread Songket' },
                 { name: 'Western Suit and Sarong', material: 'Wool and Cotton' }],
                [{ name: 'Songkok', material: 'Velvet and Gold Thread' }, { name: 'Top Hat', material: 'Felt' }, NONE],
                [{ name: 'Leather Shoes', material: 'Calfskin' }, { name: 'Gold-Embroidered Sandals', material: 'Leather and Gold Thread' }],
                [{ name: 'Leather Belt', material: 'Calfskin' }, { name: 'Gold Belt', material: 'Gold' }],
                [{ name: 'Kris', material: 'Gold and Damascened Steel' },
                 { name: 'Gold Pocket Watch', material: 'Gold' },
                 { name: 'Wristwatch', material: 'Gold' }],
                INDUSTRIAL_COLORS
            ),
            Female: wear(
                [{ name: "Baro't Saya", material: 'Piña Cloth' },
                 { name: 'Songket Kain and Kebaya', material: 'Gold-Thread Songket' },
                 { name: 'Silk Ao Ngu Than', material: 'Silk' }],
                [{ name: 'Gold Hair Ornament', material: 'Gold' }, { name: 'Selendang Shoulder Cloth', material: 'Silk' }, NONE],
                [{ name: 'Leather Shoes', material: 'Calfskin' }, { name: 'Gold-Embroidered Sandals', material: 'Leather and Gold Thread' }],
                [{ name: 'Gold Belt', material: 'Gold' }, { name: 'Silk Sash', material: 'Silk' }],
                [{ name: 'Gold Necklace', material: 'Gold' }, { name: 'Pearl Earrings', material: 'Pearl' }, { name: 'Gold Bracelet', material: 'Gold' }],
                INDUSTRIAL_COLORS
            ),
        },
    },

    // Independence-era and after: national dress standardises (ao dai,
    // barong tagalog, batik shirt) as formal and ceremonial wear, worn
    // alongside — not replaced by — ordinary global clothing.
    [HistoricalEra.MODERN_ERA]: {
        poor: {
            Male: wear(
                [{ name: 'T-shirt', material: 'Cotton', adjectives: ['Faded'] },
                 { name: 'Sarong', material: 'Printed Cotton', adjectives: ['Worn'] },
                 { name: 'Work Trousers', material: 'Cotton Drill', adjectives: ['Worn'] }],
                [{ name: 'Baseball Cap', material: 'Cotton' }, { name: 'Straw Hat', material: 'Straw' }, NONE],
                [{ name: 'Rubber Sandals', material: 'Rubber' }, { name: 'Barefoot', material: 'None' }],
                [{ name: 'Rope Belt', material: 'Jute Rope' }],
                [{ name: 'Wristwatch', material: 'Steel', adjectives: ['Cheap'] }, NONE],
                MODERN_COLORS
            ),
            Female: wear(
                [{ name: 'T-shirt', material: 'Cotton' },
                 { name: 'Sarong and Blouse', material: 'Printed Cotton', adjectives: ['Faded'] },
                 { name: 'Print Dress', material: 'Cotton', adjectives: ['Faded'] }],
                [{ name: 'Headscarf', material: 'Cotton' }, NONE],
                [{ name: 'Rubber Sandals', material: 'Rubber' }, { name: 'Barefoot', material: 'None' }],
                [NONE],
                [{ name: 'Glass Bead Necklace', material: 'Glass' }, NONE],
                MODERN_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Batik Shirt', material: 'Batik Cotton' },
                 { name: 'Shirt and Trousers', material: 'Cotton' },
                 { name: 'Sarong and Shirt', material: 'Cotton' }],
                [{ name: 'Songkok', material: 'Velvet' }, { name: 'Baseball Cap', material: 'Cotton' }, NONE],
                [{ name: 'Sandals', material: 'Leather' }, { name: 'Trainers', material: 'Canvas and Rubber' }],
                [{ name: 'Leather Belt', material: 'Leather' }],
                [{ name: 'Wristwatch', material: 'Steel' }, NONE],
                MODERN_COLORS
            ),
            Female: wear(
                [{ name: 'Kebaya and Kain', material: 'Batik Cotton' },
                 { name: 'Blouse and Skirt', material: 'Cotton' },
                 { name: "Baro't Saya", material: 'Cotton' }],
                [{ name: 'Hijab', material: 'Cotton' }, { name: 'Selendang Shoulder Cloth', material: 'Cotton' }, NONE],
                [{ name: 'Sandals', material: 'Leather' }, { name: 'Flat Shoes', material: 'Synthetic Leather' }],
                [NONE],
                [{ name: 'Stud Earrings', material: 'Gold Plate' }, NONE],
                MODERN_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Barong Tagalog and Trousers', material: 'Piña Cloth' },
                 { name: 'Batik Shirt and Trousers', material: 'Silk Batik' },
                 { name: 'Wool Suit', material: 'Worsted Wool' }],
                [{ name: 'Songkok', material: 'Velvet and Gold Thread' }, NONE],
                [{ name: 'Leather Shoes', material: 'Calfskin' }],
                [{ name: 'Leather Belt', material: 'Calfskin' }],
                [{ name: 'Gold Wristwatch', material: 'Gold' }, { name: 'Signet Ring', material: 'Gold' }],
                MODERN_COLORS
            ),
            Female: wear(
                [{ name: 'Songket Kebaya and Kain', material: 'Silk Songket' },
                 { name: 'Ao Dai', material: 'Silk' },
                 { name: 'Terno Gown', material: 'Piña Cloth' }],
                [{ name: 'Gold Hair Ornament', material: 'Gold' }, NONE],
                [{ name: 'Heeled Sandals', material: 'Leather' }],
                [NONE],
                [{ name: 'Gold Necklace', material: 'Gold' }, { name: 'Pearl Earrings', material: 'Pearl' }],
                MODERN_COLORS
            ),
        },
    },

    // Written as the near-future extension of MODERN_ERA rather than as
    // a costume change: sustainable and heat-adapted fabrics replace
    // cotton and rubber one-for-one, and the sarong, batik and songket
    // silhouettes persist because they are the practical answer to a
    // hot, humid climate that a wardrobe redesign does not change.
    [HistoricalEra.FUTURE_ERA]: {
        poor: {
            Male: wear(
                [{ name: 'Cooling-Fibre Sarong', material: 'Recycled Cotton Blend' },
                 { name: 'Work Shirt', material: 'Hemp Blend', adjectives: ['Worn'] },
                 { name: 'T-shirt', material: 'Recycled Cotton', adjectives: ['Faded'] }],
                [{ name: 'Sun-Shade Cap', material: 'Woven Composite' }, { name: 'Straw Hat', material: 'Straw' }, NONE],
                [{ name: 'Rubber Sandals', material: 'Recycled Rubber' }, { name: 'Barefoot', material: 'None' }],
                [{ name: 'Woven Cord Belt', material: 'Hemp' }],
                [{ name: 'Solar Wristband', material: 'Recycled Polymer' }, NONE],
                MODERN_COLORS
            ),
            Female: wear(
                [{ name: 'Cooling-Fibre Sarong and Blouse', material: 'Recycled Cotton Blend' },
                 { name: 'T-shirt', material: 'Recycled Cotton' }],
                [{ name: 'Headscarf', material: 'Hemp Blend' }, NONE],
                [{ name: 'Rubber Sandals', material: 'Recycled Rubber' }, { name: 'Barefoot', material: 'None' }],
                [NONE],
                [{ name: 'Glass Bead Necklace', material: 'Recycled Glass' }, NONE],
                MODERN_COLORS
            ),
        },
        common: {
            Male: wear(
                [{ name: 'Batik-Print Cooling Shirt', material: 'Smart Cotton Blend' },
                 { name: 'Sarong and Tech Shirt', material: 'Moisture-Wicking Cotton' },
                 { name: 'Trousers and Shirt', material: 'Bamboo Fibre' }],
                [{ name: 'Songkok', material: 'Woven Composite' }, { name: 'Sun-Shade Cap', material: 'Woven Composite' }, NONE],
                [{ name: 'Sandals', material: 'Bio-Leather' }, { name: 'Trainers', material: 'Recycled Composite' }],
                [{ name: 'Belt', material: 'Bio-Leather' }],
                [{ name: 'Solar Wristband', material: 'Recycled Polymer' }, NONE],
                MODERN_COLORS
            ),
            Female: wear(
                [{ name: 'Kebaya and Kain', material: 'Digital Batik Print' },
                 { name: 'Blouse and Skirt', material: 'Bamboo Fibre' },
                 { name: "Baro't Saya", material: 'Recycled Piña Blend' }],
                [{ name: 'Hijab', material: 'Cooling Fabric' }, { name: 'Selendang Shoulder Cloth', material: 'Bamboo Fibre' }, NONE],
                [{ name: 'Sandals', material: 'Bio-Leather' }, { name: 'Flat Shoes', material: 'Recycled Composite' }],
                [NONE],
                [{ name: 'Stud Earrings', material: 'Recycled Gold Plate' }, NONE],
                MODERN_COLORS
            ),
        },
        wealthy: {
            Male: wear(
                [{ name: 'Songket-Pattern Smart Shirt', material: 'Silk-Metal Thread Blend' },
                 { name: 'Barong Tagalog', material: 'Engineered Piña Fibre' },
                 { name: 'Tailored Suit and Sarong', material: 'Bio-Wool Blend' }],
                [{ name: 'Songkok', material: 'Silk and Gold Thread' }, NONE],
                [{ name: 'Leather Shoes', material: 'Lab-Grown Leather' }],
                [{ name: 'Belt', material: 'Lab-Grown Leather' }],
                [{ name: 'Smart Wristband', material: 'Gold and Polymer' }, { name: 'Signet Ring', material: 'Gold' }],
                MODERN_COLORS
            ),
            Female: wear(
                [{ name: 'Songket Kebaya and Kain', material: 'Silk-Metal Thread Songket' },
                 { name: 'Ao Dai', material: 'Engineered Silk' },
                 { name: 'Terno Gown', material: 'Engineered Piña Fibre' }],
                [{ name: 'Gold Hair Ornament', material: 'Gold' }, NONE],
                [{ name: 'Heeled Sandals', material: 'Lab-Grown Leather' }],
                [NONE],
                [{ name: 'Gold Necklace', material: 'Gold' }, { name: 'Cultured Pearl Earrings', material: 'Cultured Pearl' }],
                MODERN_COLORS
            ),
        },
    },
};
