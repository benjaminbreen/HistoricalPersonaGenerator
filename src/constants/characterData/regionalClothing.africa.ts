/**
 * constants/characterData/regionalClothing.africa.ts
 *
 * What nine sub-Saharan regions wore, where `SUB_SAHARAN_AFRICAN` — one
 * cultural zone for the whole continent — is too coarse to say. See
 * `regionalClothing.ts` for the mechanism and the bar for an entry.
 *
 * Coverage follows persona count and how badly the zone table serves each
 * region, not a mechanical sweep of every era. A region with no entry for a
 * given era falls through to the zone table exactly as before — that is the
 * safe default, not a gap to be filled for its own sake.
 *
 * Palettes follow the era, matching the convention already used in the zone
 * table: `MEDIEVAL_COLORS` for `MEDIEVAL`, `RENAISSANCE_COLORS` for
 * `RENAISSANCE_EARLY_MODERN`, `INDUSTRIAL_COLORS` for `INDUSTRIAL_ERA`.
 *
 * Everyday dress only. Initiation and ceremonial regalia — Kuba raffia
 * regalia, Ndebele bridal dress, and the like — is deliberately left out;
 * this table describes what someone wore on an ordinary day, not what a
 * museum cabinet holds.
 */

import type { EraClothingMap } from './clothing';
import { HistoricalEra } from '../../types';
import { MEDIEVAL_COLORS, RENAISSANCE_COLORS, INDUSTRIAL_COLORS } from './clothingPalettes';

export const AFRICAN_REGIONS: Partial<Record<string, EraClothingMap>> = {
  // ---------------------------------------------------------------------
  // Sahel — 65 personas. Narrow-strip weaving on the horizontal loom,
  // indigo from Kano and the Dogon country, and Islam reshaping dress from
  // the eleventh century onward as the Ghana, Mali and Songhai empires and
  // then the Sokoto Caliphate rose along the trade routes. The boubou —
  // three pieces cut from the same narrow strips — is the region's own
  // garment, not a zone-table generality.
  // ---------------------------------------------------------------------
  'Sahel': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: {
          garments: [
            { name: 'Strip-Woven Smock', material: 'Undyed Cotton' },
            { name: 'Waist Wrapper', material: 'Rough Cotton' },
          ],
          headgear: [
            { name: 'Cotton Skullcap', material: 'Plain Cotton' },
            { name: 'None', material: 'None' },
          ],
          footwear: [
            { name: 'Barefoot', material: 'None' },
            { name: 'Plain Sandals', material: 'Untanned Hide' },
          ],
          belts: [{ name: 'Twisted Cord', material: 'Plant Fiber' }],
          accessories: [
            { name: 'Leather Amulet Pouch', material: 'Goat Leather' },
            { name: 'None', material: 'None' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Strip-Cloth Wrapper', material: 'Undyed Cotton' },
            { name: 'Waist Beads Underlayer', material: 'Cotton' },
          ],
          headgear: [
            { name: 'Head Tie', material: 'Plain Cotton' },
            { name: 'None', material: 'None' },
          ],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [
            { name: 'Cowrie Strand', material: 'Cowrie Shell' },
            { name: 'None', material: 'None' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Riga Gown', material: 'Indigo-Dyed Cotton' },
            { name: 'Wide Trousers', material: 'Cotton' },
          ],
          headgear: [
            { name: 'Embroidered Fila Cap', material: 'Cotton' },
            { name: 'Cloth Turban', material: 'Cotton' },
          ],
          footwear: [{ name: 'Tanned Leather Sandals', material: 'Goat Leather' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [
            { name: 'Prayer Beads', material: 'Wood' },
            { name: 'Leather Amulet Pouch', material: 'Goat Leather' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Indigo Wrapper', material: 'Dyed Cotton' },
            { name: 'Fitted Blouse', material: 'Cotton' },
          ],
          headgear: [{ name: 'Dyed Head Tie', material: 'Indigo Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Goat Leather' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [
            { name: 'Silver Earrings', material: 'Silver' },
            { name: 'Cowrie Strand', material: 'Cowrie Shell' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Grand Boubou', material: 'Fine Indigo Cotton', adjectives: ['Wide-Sleeved', 'Embroidered'] },
            { name: 'Sirwal Trousers', material: 'Cotton' },
          ],
          headgear: [
            { name: 'Tagelmust', material: 'Indigo Cloth', adjectives: ['Face-Wrapping'] },
            { name: 'Silk Turban', material: 'Silk' },
          ],
          footwear: [{ name: 'Tooled Leather Babouche', material: 'Sokoto Leather' }],
          belts: [{ name: 'Silver-Mounted Belt', material: 'Leather and Silver' }],
          accessories: [
            { name: 'Silver Dagger', material: 'Silver and Steel' },
            { name: 'Prayer Beads', material: 'Amber' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Grand Boubou Set', material: 'Embroidered Indigo Cotton' },
            { name: 'Fine Wrapper', material: 'Dyed Cotton' },
          ],
          headgear: [{ name: 'Embroidered Veil', material: 'Fine Cotton' }],
          footwear: [{ name: 'Embroidered Leather Sandals', material: 'Sokoto Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry Set', material: 'Silver' },
            { name: 'Amber Beads', material: 'Amber' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Cotton Smock', material: 'Undyed Cotton' },
            { name: 'Waist Wrapper', material: 'Rough Cotton' },
          ],
          headgear: [{ name: 'Cotton Skullcap', material: 'Plain Cotton' }, { name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Rope Belt', material: 'Plant Fiber' }],
          accessories: [{ name: 'Leather Amulet Pouch', material: 'Goat Leather' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Strip-Cloth Wrapper', material: 'Undyed Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Plain Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Riga Gown', material: 'Indigo-Dyed Cotton' },
            { name: 'Sirwal Trousers', material: 'Cotton' },
          ],
          headgear: [{ name: 'Embroidered Fila Cap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Goat Leather' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Prayer Beads', material: 'Wood' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Indigo Wrapper', material: 'Dyed Cotton' },
            { name: 'Fitted Blouse', material: 'Cotton' },
          ],
          headgear: [{ name: 'Dyed Head Tie', material: 'Indigo Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Goat Leather' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Silver Earrings', material: 'Silver' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Grand Boubou', material: 'Silk-Threaded Cotton', adjectives: ['Wide-Sleeved'] },
            { name: 'Sirwal Trousers', material: 'Fine Cotton' },
          ],
          headgear: [
            { name: 'Tagelmust', material: 'Indigo Cloth', adjectives: ['Face-Wrapping'] },
            { name: 'Imported Silk Turban', material: 'Silk' },
          ],
          footwear: [{ name: 'Tooled Leather Babouche', material: 'Sokoto Leather' }],
          belts: [{ name: 'Silver-Mounted Belt', material: 'Leather and Silver' }],
          accessories: [
            { name: 'Silver Dagger', material: 'Silver and Steel' },
            { name: 'Trans-Saharan Trade Beads', material: 'Glass' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Grand Boubou Set', material: 'Embroidered Cotton with Imported Silk' },
          ],
          headgear: [{ name: 'Embroidered Veil', material: 'Fine Cotton and Silk' }],
          footwear: [{ name: 'Embroidered Leather Sandals', material: 'Sokoto Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry Set', material: 'Silver' },
            { name: 'Amber Beads', material: 'Amber' },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    // Bazin — glazed damask cotton, shipped in by colonial-era trading
    // houses — enters the boubou wardrobe here, alongside the older
    // hand-woven cloth rather than replacing it.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Plain Riga', material: 'Imported Cotton' },
            { name: 'Waist Wrapper', material: 'Cotton' },
          ],
          headgear: [{ name: 'Cotton Skullcap', material: 'Plain Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Goat Leather' }],
          belts: [{ name: 'Leather Strip', material: 'Tanned Hide' }],
          accessories: [{ name: 'Leather Amulet Pouch', material: 'Goat Leather' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Imported Cotton Wrapper', material: 'Printed Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Riga Gown', material: 'Bazin Damask' },
            { name: 'Sirwal Trousers', material: 'Cotton' },
          ],
          headgear: [{ name: 'Embroidered Fila Cap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Leather' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Prayer Beads', material: 'Wood' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Wrapper and Blouse Set', material: 'Printed Cotton' },
          ],
          headgear: [{ name: 'Dyed Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Goat Leather' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Silver Earrings', material: 'Silver' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Babban Riga', material: 'Bazin Riche', adjectives: ['Hand-Embroidered'] },
            { name: 'Sirwal Trousers', material: 'Fine Cotton' },
          ],
          headgear: [{ name: 'Silk Turban', material: 'Silk' }],
          footwear: [{ name: 'Tooled Leather Babouche', material: 'Sokoto Leather' }],
          belts: [{ name: 'Silver-Mounted Belt', material: 'Leather and Silver' }],
          accessories: [
            { name: 'Silver Dagger', material: 'Silver and Steel' },
            { name: 'Prayer Beads', material: 'Amber' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Grand Boubou Set', material: 'Bazin Riche', adjectives: ['Embroidered'] }],
          headgear: [{ name: 'Embroidered Veil', material: 'Silk and Cotton' }],
          footwear: [{ name: 'Embroidered Leather Sandals', material: 'Sokoto Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry Set', material: 'Silver' },
            { name: 'Amber Beads', material: 'Amber' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // ---------------------------------------------------------------------
  // Upper Guinea and West African Forests — 165 personas between them, the
  // largest block in the zone. Both wear the boubou-and-wrapper base the
  // zone table already gives, but the wardrobes on top of it come from
  // different peoples: Upper Guinea is Mande and Atlantic-coast country —
  // Wolof, Malinke, Fula — reached by Portuguese trade from the 1440s.
  // The Forests are Yoruba, Akan and Igbo country, and carry kente, aso oke
  // and adire, none of which belong on the Sahel or the coast.
  // ---------------------------------------------------------------------
  'Upper Guinea': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: {
          garments: [
            { name: 'Strip-Cloth Smock', material: 'Undyed Cotton' },
            { name: 'Waist Wrapper', material: 'Rough Cotton' },
          ],
          headgear: [{ name: 'Cotton Cap', material: 'Plain Cotton' }, { name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Twisted Cord', material: 'Plant Fiber' }],
          accessories: [{ name: 'Cowrie Ornament', material: 'Cowrie Shell' }, { name: 'None', material: 'None' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Strip-Cloth Wrapper', material: 'Undyed Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Boubou', material: 'Dyed Cotton' },
            { name: 'Drawstring Trousers', material: 'Cotton' },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Brass Amulet', material: 'Cast Brass' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Indigo Wrapper', material: 'Dyed Cotton' },
            { name: 'Fitted Blouse', material: 'Cotton' },
          ],
          headgear: [{ name: 'Tied Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Amber Beads', material: 'Amber' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Grand Boubou', material: 'Fine Cotton', adjectives: ['Wide-Sleeved'] },
            { name: 'Embroidered Trousers', material: 'Cotton' },
          ],
          headgear: [{ name: 'Wrapped Turban', material: 'Fine Cotton' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Gold-Weight Belt', material: 'Leather and Gold' }],
          accessories: [
            { name: 'Gold Ring', material: 'Cast Gold' },
            { name: 'Trade Beads', material: 'Venetian Glass' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Grand Boubou Set', material: 'Fine Embroidered Cotton' }],
          headgear: [{ name: 'Tied Silk Head Wrap', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Coral Belt', material: 'Coral and Cloth' }],
          accessories: [
            { name: 'Gold Earrings', material: 'Cast Gold' },
            { name: 'Coral Beads', material: 'Red Coral' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
    },
    // Portuguese ships reach the Upper Guinea coast from the 1440s; imported
    // cloth and glass beads mix into the strip-woven wardrobe rather than
    // replacing it, and Fula pastoralist dress — indigo veil, embroidered
    // tunic — stays distinct within the same region.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Cotton Smock', material: 'Undyed Cotton' },
            { name: 'Waist Wrapper', material: 'Rough Cotton' },
          ],
          headgear: [{ name: 'Cotton Cap', material: 'Plain Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Rope Belt', material: 'Plant Fiber' }],
          accessories: [{ name: 'Cowrie Ornament', material: 'Cowrie Shell' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Strip-Cloth Wrapper', material: 'Undyed Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Fula Embroidered Tunic', material: 'Cotton', adjectives: ['Indigo-Trimmed'] },
            { name: 'Boubou', material: 'Dyed Cotton' },
          ],
          headgear: [{ name: 'Indigo Head Wrap', material: 'Indigo Cloth' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Brass Amulet', material: 'Cast Brass' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Indigo Wrapper', material: 'Dyed Cotton' },
            { name: 'Fitted Blouse', material: 'Cotton' },
          ],
          headgear: [{ name: 'Tied Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Amber Beads', material: 'Amber' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Grand Boubou', material: 'Cotton with Imported Silk Trim', adjectives: ['Wide-Sleeved'] },
          ],
          headgear: [{ name: 'Wrapped Turban', material: 'Fine Cotton' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Gold-Weight Belt', material: 'Leather and Gold' }],
          accessories: [
            { name: 'Gold Ring', material: 'Cast Gold' },
            { name: 'Imported Glass Beads', material: 'Venetian Glass' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Grand Boubou Set', material: 'Fine Cotton with Imported Silk' }],
          headgear: [{ name: 'Tied Silk Head Wrap', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Coral Belt', material: 'Coral and Cloth' }],
          accessories: [
            { name: 'Gold Earrings', material: 'Cast Gold' },
            { name: 'Coral Beads', material: 'Red Coral' },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Plain Cotton Smock', material: 'Imported Cotton' },
            { name: 'Waist Wrapper', material: 'Cotton' },
          ],
          headgear: [{ name: 'Cotton Cap', material: 'Plain Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Leather Strip', material: 'Tanned Hide' }],
          accessories: [{ name: 'Cowrie Ornament', material: 'Cowrie Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Printed Cotton Wrapper', material: 'Imported Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Boubou', material: 'Printed Cotton' },
            { name: 'Fula Embroidered Tunic', material: 'Cotton' },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Brass Amulet', material: 'Cast Brass' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Wrapper and Blouse Set', material: 'Printed Cotton' }],
          headgear: [{ name: 'Tied Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Amber Beads', material: 'Amber' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Grand Boubou', material: 'Damask with Gold Thread', adjectives: ['Wide-Sleeved'] },
          ],
          headgear: [{ name: 'Wrapped Turban', material: 'Fine Cotton' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Gold-Weight Belt', material: 'Leather and Gold' }],
          accessories: [
            { name: 'Gold Ring', material: 'Cast Gold' },
            { name: 'Amber Beads', material: 'Amber' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Grand Boubou Set', material: 'Damask and Silk' }],
          headgear: [{ name: 'Tied Silk Head Wrap', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Coral Belt', material: 'Coral and Cloth' }],
          accessories: [
            { name: 'Gold Earrings', material: 'Cast Gold' },
            { name: 'Coral Beads', material: 'Red Coral' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // Yoruba, Akan and Igbo forest kingdoms. Kente is Akan and dates to
  // roughly the seventeenth century, so it enters at RENAISSANCE rather
  // than MEDIEVAL; adinkra stamped cloth and Yoruba adire indigo
  // resist-dye are both nineteenth-century and belong to INDUSTRIAL.
  'West African Forests': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: {
          garments: [
            { name: 'Cotton Wrapper', material: 'Undyed Cotton' },
            { name: 'Bark Cloth Wrap', material: 'Beaten Bark' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Rope Belt', material: 'Plant Fiber' }],
          accessories: [{ name: 'Cowrie Ornament', material: 'Cowrie Shell' }, { name: 'None', material: 'None' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Cotton Wrapper', material: 'Undyed Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Dyed Wrapper', material: 'Indigo Cotton' },
            { name: 'Loose Tunic', material: 'Woven Cotton' },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Bronze Bracelet', material: 'Cast Bronze' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Wrapper Set', material: 'Dyed Cotton' },
            { name: 'Fitted Blouse', material: 'Cotton' },
          ],
          headgear: [{ name: 'Tied Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Coral Beads', material: 'Red Coral' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Wrapper', material: 'Hand-Woven Cotton', adjectives: ['Patterned'] },
            { name: 'Embroidered Tunic', material: 'Cotton' },
          ],
          headgear: [{ name: 'Beaded Crown Cap', material: 'Beadwork' }],
          footwear: [{ name: 'Decorated Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Gold Belt', material: 'Gold Discs' }],
          accessories: [
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
            { name: 'Gold Ring', material: 'Cast Gold' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Wrapper Set', material: 'Patterned Cotton' }],
          headgear: [{ name: 'Beaded Headdress', material: 'Beadwork' }],
          footwear: [{ name: 'Beaded Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Coral Belt', material: 'Red Coral' }],
          accessories: [
            { name: 'Gold Jewelry', material: 'Cast Gold' },
            { name: 'Ivory Ornaments', material: 'Carved Ivory' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
    },
    // Kente is woven on the narrow strip loom by Akan weavers from around
    // the seventeenth century; aso oke, the Yoruba equivalent, and the
    // Yoruba agbada robe are established formalwear by this period too.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Cotton Wrapper', material: 'Undyed Cotton' },
            { name: 'Loose Tunic', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Rope Belt', material: 'Plant Fiber' }],
          accessories: [{ name: 'Cowrie Ornament', material: 'Cowrie Shell' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Iro Wrapper', material: 'Undyed Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Aso Oke Wrapper', material: 'Hand-Woven Cotton' },
            { name: 'Buba Tunic', material: 'Cotton' },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Aso Oke Cloth' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Bronze Bracelet', material: 'Cast Bronze' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Iro and Buba Set', material: 'Aso Oke Cloth' },
          ],
          headgear: [{ name: 'Gele', material: 'Starched Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Coral Beads', material: 'Red Coral' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Kente Wrapper', material: 'Silk and Cotton Strip-Weave', adjectives: ['Patterned'] },
            { name: 'Agbada', material: 'Fine Cotton', adjectives: ['Voluminous'] },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Kente Cloth' }],
          footwear: [{ name: 'Decorated Sandals', material: 'Leather and Gold' }],
          belts: [{ name: 'Gold Belt', material: 'Gold Discs' }],
          accessories: [
            { name: 'Gold Rings', material: 'Cast Gold' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Aso Oke Wrapper Set', material: 'Silk-Threaded Cloth', adjectives: ['Embroidered'] }],
          headgear: [{ name: 'Gele', material: 'Fine Starched Cloth' }],
          footwear: [{ name: 'Beaded Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Coral Belt', material: 'Red Coral' }],
          accessories: [
            { name: 'Gold Jewelry', material: 'Cast Gold' },
            { name: 'Coral Beads', material: 'Red Coral' },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    // Adinkra stamped cloth and Yoruba adire indigo resist-dye are both
    // nineteenth-century, and imported cloth grows alongside them under
    // colonial administration in the Gold Coast and Nigeria.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Plain Cotton Wrapper', material: 'Imported Cotton' },
            { name: 'Work Tunic', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Rope Belt', material: 'Plant Fiber' }],
          accessories: [{ name: 'Cowrie Ornament', material: 'Cowrie Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Adire Wrapper', material: 'Indigo Resist-Dye Cotton' }],
          headgear: [{ name: 'Head Tie', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Waist Bead String', material: 'Glass Beads' }],
          accessories: [{ name: 'Cowrie Strand', material: 'Cowrie Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Buba and Sokoto Set', material: 'Cotton' },
            { name: 'Adinkra-Stamped Wrapper', material: 'Cotton', adjectives: ['Stamped'] },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Bronze Bracelet', material: 'Cast Bronze' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Iro and Buba Set', material: 'Adire Cotton' },
          ],
          headgear: [{ name: 'Gele', material: 'Starched Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Coral Beads', material: 'Red Coral' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Kente Wrapper', material: 'Silk Strip-Weave', adjectives: ['Patterned'] },
            { name: 'Agbada', material: 'Damask', adjectives: ['Embroidered'] },
          ],
          headgear: [{ name: 'Woven Cap', material: 'Kente Cloth' }],
          footwear: [{ name: 'Decorated Sandals', material: 'Leather and Gold' }],
          belts: [{ name: 'Gold Belt', material: 'Gold Discs' }],
          accessories: [
            { name: 'Gold Rings', material: 'Cast Gold' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Aso Oke Wrapper Set', material: 'Silk and Cotton', adjectives: ['Embroidered'] }],
          headgear: [{ name: 'Gele', material: 'Fine Starched Cloth' }],
          footwear: [{ name: 'Beaded Sandals', material: 'Leather and Beads' }],
          belts: [{ name: 'Coral Belt', material: 'Red Coral' }],
          accessories: [
            { name: 'Gold Jewelry', material: 'Cast Gold' },
            { name: 'Coral Beads', material: 'Red Coral' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // ---------------------------------------------------------------------
  // Horn of Africa — 38 personas, and the region the general table serves
  // worst: it is two traditions, not one. The Ethiopian and Eritrean
  // highlands weave handspun cotton — the shamma, netela and gabi, bordered
  // with a woven tibeb stripe — a tradition going back to Aksum. The Somali
  // and Afar lowlands wrap a single length of cloth instead: the guntiino
  // for women, the macawis for men. Both appear in the lists below rather
  // than splitting the region, since the region string does not split.
  // ---------------------------------------------------------------------
  'Horn of Africa': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: {
          garments: [
            { name: 'Plain Shamma', material: 'Handspun Cotton' },
            { name: 'Macawis Wrap', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
          accessories: [{ name: 'Wood Cross Pendant', material: 'Carved Wood' }, { name: 'None', material: 'None' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Plain Kemis', material: 'Handspun Cotton' },
            { name: 'Guntiino Wrap', material: 'Cotton' },
          ],
          headgear: [{ name: 'Cotton Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
          accessories: [{ name: 'Glass Bead Necklace', material: 'Glass Beads' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Shamma', material: 'Cotton', adjectives: ['Tibeb-Bordered'] },
            { name: 'Gabi', material: 'Thick Cotton', adjectives: ['Warm'] },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Silver Cross Pendant', material: 'Silver' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Kemis', material: 'Cotton', adjectives: ['Tibeb-Bordered'] },
            { name: 'Netela Shawl', material: 'Gauze Cotton' },
          ],
          headgear: [{ name: 'Netela Shawl', material: 'Gauze Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Woven Sash', material: 'Cotton' }],
          accessories: [{ name: 'Silver Earrings', material: 'Silver' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Shamma', material: 'Cotton', adjectives: ['Wide Tibeb Border'] },
            { name: 'Embroidered Cape', material: 'Velvet' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Cross Pendant', material: 'Gold' },
            { name: 'Silver-Hilted Dagger', material: 'Silver and Steel' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Kemis', material: 'Cotton', adjectives: ['Wide Tibeb Border', 'Embroidered'] }],
          headgear: [{ name: 'Silk Netela', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Silver' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Jewelry Set', material: 'Gold' },
            { name: 'Silver Cross Pendant', material: 'Silver' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
    },
    // Gondar-era Ethiopia (roughly sixteenth to eighteenth century): the
    // tibeb border widens for the wealthy, and the gabi shawl becomes
    // everyday highland dress rather than a special-occasion piece.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Plain Shamma', material: 'Handspun Cotton' },
            { name: 'Macawis Wrap', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
          accessories: [{ name: 'Wood Cross Pendant', material: 'Carved Wood' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Plain Kemis', material: 'Handspun Cotton' },
            { name: 'Guntiino Wrap', material: 'Cotton' },
          ],
          headgear: [{ name: 'Cotton Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
          accessories: [{ name: 'Glass Bead Necklace', material: 'Glass Beads' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Shamma', material: 'Cotton', adjectives: ['Tibeb-Bordered'] },
            { name: 'Gabi', material: 'Thick Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Silver Cross Pendant', material: 'Silver' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Kemis', material: 'Cotton', adjectives: ['Tibeb-Bordered'] },
            { name: 'Netela Shawl', material: 'Gauze Cotton' },
          ],
          headgear: [{ name: 'Netela Shawl', material: 'Gauze Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Woven Sash', material: 'Cotton' }],
          accessories: [{ name: 'Silver Earrings', material: 'Silver' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Shamma', material: 'Cotton', adjectives: ['Wide Tibeb Border'] },
            { name: 'Embroidered Gabi', material: 'Fine Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Cross Pendant', material: 'Gold' },
            { name: 'Silver-Hilted Dagger', material: 'Silver and Steel' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Kemis', material: 'Cotton', adjectives: ['Wide Tibeb Border', 'Embroidered'] }],
          headgear: [{ name: 'Silk Netela', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Silver' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Jewelry Set', material: 'Gold' },
            { name: 'Silver Cross Pendant', material: 'Silver' },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    // Imported muslin reaches the lowlands through British and Italian
    // Somaliland trade, and the more body-covering dirac dress spreads
    // alongside the older single-cloth guntiino rather than replacing it.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Plain Shamma', material: 'Cotton' },
            { name: 'Macawis Wrap', material: 'Imported Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
          accessories: [{ name: 'Wood Cross Pendant', material: 'Carved Wood' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Plain Kemis', material: 'Cotton' },
            { name: 'Guntiino Wrap', material: 'Imported Cotton' },
          ],
          headgear: [{ name: 'Cotton Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cloth Sash', material: 'Cotton' }],
          accessories: [{ name: 'Glass Bead Necklace', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Shamma', material: 'Cotton', adjectives: ['Tibeb-Bordered'] },
            { name: 'Gabi', material: 'Thick Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Silver Cross Pendant', material: 'Silver' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Kemis', material: 'Cotton', adjectives: ['Tibeb-Bordered'] },
            { name: 'Dirac Dress', material: 'Imported Muslin' },
          ],
          headgear: [{ name: 'Netela Shawl', material: 'Gauze Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cow Hide' }],
          belts: [{ name: 'Woven Sash', material: 'Cotton' }],
          accessories: [{ name: 'Silver Earrings', material: 'Silver' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Shamma', material: 'Cotton', adjectives: ['Wide Tibeb Border'] },
            { name: 'Embroidered Gabi', material: 'Fine Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Cross Pendant', material: 'Gold' },
            { name: 'Silver-Hilted Dagger', material: 'Silver and Steel' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Dirac Dress', material: 'Silk and Muslin', adjectives: ['Embroidered'] }],
          headgear: [{ name: 'Silk Netela', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Silver' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Jewelry Set', material: 'Gold' },
            { name: 'Silver Cross Pendant', material: 'Silver' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // ---------------------------------------------------------------------
  // East African Rift — 68 personas, and two overlapping worlds: pastoral
  // highland and lakeside peoples in hide and beadwork, and the Islamic
  // Swahili coast reaching inland on the caravan routes with the kanzu,
  // kofia and — from the 1860s — the kanga. Both belong in the region.
  // ---------------------------------------------------------------------
  'East African Rift': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: {
          garments: [
            { name: 'Hide Wrap', material: 'Goat Hide' },
            { name: 'Plain Kanzu', material: 'Undyed Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Hide Strip', material: 'Leather Thong' }],
          accessories: [{ name: 'Bead Necklace', material: 'Glass Beads' }, { name: 'None', material: 'None' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Hide Skirt', material: 'Goat Hide' },
            { name: 'Wrapped Cloth', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Cord', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Kanzu', material: 'Cotton', adjectives: ['Ankle-Length'] },
            { name: 'Ochre-Rubbed Hide Cloak', material: 'Cattle Hide' },
          ],
          headgear: [{ name: 'Kofia', material: 'Embroidered Cotton' }, { name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Wrapped Cloth Set', material: 'Imported Cotton' },
            { name: 'Beaded Hide Skirt', material: 'Hide and Beads' },
          ],
          headgear: [{ name: 'Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] }],
          palette: MEDIEVAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Kanzu', material: 'Imported Cotton', adjectives: ['Embroidered'] },
            { name: 'Coastal Robe', material: 'Silk-Trimmed Cotton' },
          ],
          headgear: [{ name: 'Embroidered Kofia', material: 'Silk-Threaded Cotton' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Dagger', material: 'Silver and Steel' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Wrapped Cloth Set', material: 'Imported Silk and Cotton' }],
          headgear: [{ name: 'Embroidered Head Wrap', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Silver' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Jewelry Set', material: 'Gold' },
            { name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
    },
    // Omani traders deepen coastal contact from the seventeenth century;
    // glass trade beads move inland along the caravan routes and become
    // part of the pastoral wardrobe alongside hide, not instead of it.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Hide Wrap', material: 'Goat Hide' },
            { name: 'Plain Kanzu', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Hide Strip', material: 'Leather Thong' }],
          accessories: [{ name: 'Bead Necklace', material: 'Glass Beads' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Hide Skirt', material: 'Goat Hide' },
            { name: 'Wrapped Cloth', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Cord', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Kanzu', material: 'Cotton' },
            { name: 'Beaded Hide Cloak', material: 'Cattle Hide and Beads' },
          ],
          headgear: [{ name: 'Kofia', material: 'Embroidered Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Wrapped Cloth Set', material: 'Imported Cotton' },
            { name: 'Beaded Hide Skirt', material: 'Hide and Beads' },
          ],
          headgear: [{ name: 'Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Kanzu', material: 'Imported Cotton', adjectives: ['Embroidered'] },
          ],
          headgear: [{ name: 'Embroidered Kofia', material: 'Silk-Threaded Cotton' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Dagger', material: 'Silver and Steel' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Wrapped Cloth Set', material: 'Imported Silk and Cotton' }],
          headgear: [{ name: 'Embroidered Head Wrap', material: 'Silk' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Silver' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Jewelry Set', material: 'Gold' },
            { name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    // Two changes date to the Zanzibar Sultanate's nineteenth-century
    // height: the kanga — printed cotton cloth, sold in pairs, carrying a
    // Swahili proverb — appears from the 1860s, and caravan-traded cloth
    // reaches pastoral communities in enough volume that the shuka, a
    // length of red trade cloth, starts to stand in for the hide cloak.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Shuka Wrap', material: 'Red Trade Cloth' },
            { name: 'Plain Kanzu', material: 'Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Hide Strip', material: 'Leather Thong' }],
          accessories: [{ name: 'Bead Necklace', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Kanga Wrap', material: 'Printed Cotton' },
            { name: 'Beaded Hide Skirt', material: 'Hide and Beads' },
          ],
          headgear: [{ name: 'Kanga Head Wrap', material: 'Printed Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Cord', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Kanzu', material: 'Cotton' },
            { name: 'Shuka Wrap', material: 'Red Trade Cloth' },
          ],
          headgear: [{ name: 'Kofia', material: 'Embroidered Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Kanga Pair', material: 'Printed Cotton', adjectives: ['Proverb-Printed'] },
          ],
          headgear: [{ name: 'Buibui Veil', material: 'Black Cotton' }, { name: 'Kanga Head Wrap', material: 'Printed Cotton' }],
          footwear: [{ name: 'Leather Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Kanzu', material: 'Imported Cotton', adjectives: ['Embroidered'] },
          ],
          headgear: [{ name: 'Embroidered Kofia', material: 'Silk-Threaded Cotton' }],
          footwear: [{ name: 'Decorated Leather Sandals', material: 'Tooled Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Dagger', material: 'Silver and Steel' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Kanga Set', material: 'Silk-Threaded Cotton' }],
          headgear: [{ name: 'Embroidered Buibui', material: 'Silk and Cotton' }],
          footwear: [{ name: 'Embroidered Sandals', material: 'Leather and Silver' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Gold Jewelry Set', material: 'Gold' },
            { name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // ---------------------------------------------------------------------
  // Lower Guinea and Congo Basin — 92 personas with Central Africa below.
  // Raffia palm cloth predates cotton here and was already prized by
  // Portuguese traders reaching the Kongo coast in the 1480s; the Kuba
  // kingdom, founded around 1625, wove and appliquéd it further. No entry
  // before RENAISSANCE — the zone table's prehistoric bark cloth already
  // covers the deeper past reasonably, and Kuba's court weaving is what
  // actually distinguishes this region, not an undocumented medieval one.
  // ---------------------------------------------------------------------
  'Lower Guinea and Congo Basin': {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Raffia Cloth Wrap', material: 'Woven Raffia Palm' },
            { name: 'Bark Cloth Wrap', material: 'Beaten Bark' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Wood Amulet', material: 'Carved Wood' }, { name: 'None', material: 'None' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Raffia Cloth Wrap', material: 'Woven Raffia Palm' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Shell Beads', material: 'Shell' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Woven Raffia Wrapper', material: 'Raffia Palm', adjectives: ['Patterned'] },
          ],
          headgear: [{ name: 'Raffia Cap', material: 'Woven Raffia' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Raffia Belt', material: 'Raffia Palm' }],
          accessories: [{ name: 'Copper Bracelet', material: 'Beaten Copper' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Raffia Wrapper Set', material: 'Woven Raffia Palm', adjectives: ['Patterned'] },
          ],
          headgear: [{ name: 'Woven Raffia Cap', material: 'Raffia Palm' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Raffia Belt', material: 'Raffia and Beads' }],
          accessories: [{ name: 'Copper Anklets', material: 'Cast Copper' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Kuba Cloth Wrapper', material: 'Appliquéd Raffia', adjectives: ['Embroidered'] },
          ],
          headgear: [{ name: 'Woven Status Cap', material: 'Raffia and Cowrie' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cowrie-Studded Belt', material: 'Raffia and Cowrie' }],
          accessories: [
            { name: 'Copper Cross Ingot', material: 'Cast Copper' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Kuba Cloth Wrapper Set', material: 'Appliquéd Raffia', adjectives: ['Embroidered'] }],
          headgear: [{ name: 'Woven Status Cap', material: 'Raffia and Cowrie' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cowrie-Studded Belt', material: 'Raffia and Cowrie' }],
          accessories: [
            { name: 'Copper Jewelry', material: 'Cast Copper' },
            { name: 'Shell Beads', material: 'Shell' },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    // Colonial administration on the coast brings imported cloth and
    // mission-tailored dress; raffia weaving persists furthest upriver,
    // away from the coastal trade posts, so it stays in every tier here.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Raffia Cloth Wrap', material: 'Woven Raffia Palm' },
            { name: 'Mission-Tailored Shirt', material: 'Imported Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Wood Amulet', material: 'Carved Wood' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Raffia Cloth Wrap', material: 'Woven Raffia Palm' },
            { name: 'Imported Cotton Wrapper', material: 'Printed Cotton' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Shell Beads', material: 'Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Woven Raffia Wrapper', material: 'Raffia Palm', adjectives: ['Patterned'] },
          ],
          headgear: [{ name: 'Raffia Cap', material: 'Woven Raffia' }],
          footwear: [{ name: 'Imported Leather Shoes', material: 'Leather' }, { name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Raffia Belt', material: 'Raffia Palm' }],
          accessories: [{ name: 'Copper Bracelet', material: 'Beaten Copper' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Raffia Wrapper Set', material: 'Woven Raffia Palm', adjectives: ['Patterned'] },
          ],
          headgear: [{ name: 'Head Wrap', material: 'Imported Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Raffia Belt', material: 'Raffia and Beads' }],
          accessories: [{ name: 'Copper Anklets', material: 'Cast Copper' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Kuba Cloth Wrapper', material: 'Appliquéd Raffia', adjectives: ['Embroidered'] },
          ],
          headgear: [{ name: 'Woven Status Cap', material: 'Raffia and Cowrie' }],
          footwear: [{ name: 'Imported Leather Shoes', material: 'Leather' }],
          belts: [{ name: 'Cowrie-Studded Belt', material: 'Raffia and Cowrie' }],
          accessories: [
            { name: 'Copper Cross Ingot', material: 'Cast Copper' },
            { name: 'Ivory Bracelet', material: 'Carved Ivory' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Kuba Cloth Wrapper Set', material: 'Appliquéd Raffia', adjectives: ['Embroidered'] }],
          headgear: [{ name: 'Woven Status Cap', material: 'Raffia and Cowrie' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cowrie-Studded Belt', material: 'Raffia and Cowrie' }],
          accessories: [
            { name: 'Copper Jewelry', material: 'Cast Copper' },
            { name: 'Shell Beads', material: 'Shell' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // Central Africa — the broader savanna and forest interior away from the
  // Kuba and Kongo courts, so the entry stays plainer: bark cloth and plain
  // raffia rather than the appliqué work, and cotton arrives later and more
  // thinly. Kept to INDUSTRIAL only — thin evidence for a distinct earlier
  // wardrobe, and the zone table's own bark-and-hide entries cover PREHISTORY
  // and ANTIQUITY adequately.
  'Central Africa': {
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Bark Cloth Wrap', material: 'Beaten Bark' },
            { name: 'Plain Raffia Wrap', material: 'Woven Raffia Palm' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Wood Amulet', material: 'Carved Wood' }, { name: 'None', material: 'None' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Bark Cloth Wrap', material: 'Beaten Bark' },
            { name: 'Plain Raffia Wrap', material: 'Woven Raffia Palm' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Shell Beads', material: 'Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Woven Raffia Wrapper', material: 'Raffia Palm' },
            { name: 'Mission-Tailored Shirt', material: 'Imported Cotton' },
          ],
          headgear: [{ name: 'Raffia Cap', material: 'Woven Raffia' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Raffia Belt', material: 'Raffia Palm' }],
          accessories: [{ name: 'Copper Bracelet', material: 'Beaten Copper' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Raffia Wrapper Set', material: 'Woven Raffia Palm' },
            { name: 'Imported Cotton Wrapper', material: 'Printed Cotton' },
          ],
          headgear: [{ name: 'Head Wrap', material: 'Cotton' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Raffia Belt', material: 'Raffia and Beads' }],
          accessories: [{ name: 'Copper Anklets', material: 'Cast Copper' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [
            { name: 'Fine Raffia Wrapper', material: 'Woven Raffia Palm', adjectives: ['Patterned'] },
          ],
          headgear: [{ name: 'Woven Status Cap', material: 'Raffia and Cowrie' }],
          footwear: [{ name: 'Imported Leather Shoes', material: 'Leather' }],
          belts: [{ name: 'Cowrie-Studded Belt', material: 'Raffia and Cowrie' }],
          accessories: [
            { name: 'Copper Bracelet', material: 'Cast Copper' },
            { name: 'Ivory Ornament', material: 'Carved Ivory' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Raffia Wrapper Set', material: 'Woven Raffia Palm', adjectives: ['Patterned'] }],
          headgear: [{ name: 'Woven Status Cap', material: 'Raffia and Cowrie' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Cowrie-Studded Belt', material: 'Raffia and Cowrie' }],
          accessories: [
            { name: 'Copper Jewelry', material: 'Cast Copper' },
            { name: 'Shell Beads', material: 'Shell' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // ---------------------------------------------------------------------
  // Southern Africa — 35 personas. The skin kaross is old, but what marks
  // this region out — the Zulu isidwaba, the Xhosa ochre blanket, Ndebele
  // and Sotho beadwork — belongs to the Nguni and Sotho-Tswana cattle
  // cultures of the last few centuries, and the wool trade blanket that
  // becomes "traditional" Basotho dress only arrives in the 1860s. No
  // MEDIEVAL entry: too little to distinguish this region from the zone
  // table's hide-and-bead entries that far back.
  // ---------------------------------------------------------------------
  'Southern Africa': {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: {
          garments: [
            { name: 'Kaross', material: 'Jackal Skin' },
            { name: 'Hide Loincloth', material: 'Goat Hide' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Hide Strip', material: 'Leather Thong' }],
          accessories: [{ name: 'Bead Necklace', material: 'Glass Beads' }, { name: 'None', material: 'None' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Hide Skirt', material: 'Goat Hide' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Cord', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Necklace', material: 'Glass Beads' }],
          palette: RENAISSANCE_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Kaross', material: 'Antelope Skin', adjectives: ['Sewn'] },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Hide Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Beaded Armband', material: 'Glass Beads' }],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [
            { name: 'Leather Skirt', material: 'Tanned Hide', adjectives: ['Beaded'] },
          ],
          headgear: [{ name: 'Beaded Headband', material: 'Glass Beads' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] }],
          palette: RENAISSANCE_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [{ name: 'Leopard Skin Kaross', material: 'Leopard Hide', adjectives: ['Status'] }],
          headgear: [{ name: 'Feather Headdress', material: 'Ostrich Feathers' }],
          footwear: [{ name: 'Hide Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads and Leather' }],
          accessories: [
            { name: 'Copper Armlet', material: 'Beaten Copper' },
            { name: 'Ivory Ornament', material: 'Carved Ivory' },
          ],
          palette: RENAISSANCE_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Leather Skirt', material: 'Tanned Hide', adjectives: ['Heavily Beaded'] }],
          headgear: [{ name: 'Beaded Headdress', material: 'Glass Beads' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [
            { name: 'Copper Anklets', material: 'Cast Copper' },
            { name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] },
          ],
          palette: RENAISSANCE_COLORS,
        },
      },
    },
    // Dated to the Zulu kingdom and the Mfecane (from the 1810s): the
    // isidwaba and the ochre-dyed Xhosa blanket, and the wool trade
    // blanket that arrives through Boer and British trade in the 1860s and
    // becomes fixed Basotho dress within a generation.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [
            { name: 'Trade Blanket Wrap', material: 'Wool Blanket' },
            { name: 'Hide Loincloth', material: 'Goat Hide' },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Hide Strip', material: 'Leather Thong' }],
          accessories: [{ name: 'Bead Necklace', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Ochre-Dyed Blanket Wrap', material: 'Cotton Blanket' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Cord', material: 'Glass Beads' }],
          accessories: [{ name: 'Beaded Necklace', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [
            { name: 'Basotho Trade Blanket', material: 'Patterned Wool', adjectives: ['Wrapped'] },
          ],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Hide Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Leather Belt', material: 'Tanned Hide' }],
          accessories: [{ name: 'Beaded Armband', material: 'Glass Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [
            { name: 'Isidwaba', material: 'Softened Leather', adjectives: ['Pleated', 'Ochre-Dyed'] },
          ],
          headgear: [{ name: 'Beaded Headband', material: 'Glass Beads' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [{ name: 'Ndebele Beaded Neck Rings', material: 'Copper and Beads' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [{ name: 'Fine Basotho Blanket', material: 'Wool', adjectives: ['Patterned'] }],
          headgear: [{ name: 'Feather Headdress', material: 'Ostrich Feathers' }],
          footwear: [{ name: 'Hide Sandals', material: 'Cattle Hide' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads and Leather' }],
          accessories: [
            { name: 'Copper Armlet', material: 'Beaten Copper' },
            { name: 'Ivory Ornament', material: 'Carved Ivory' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Isidwaba', material: 'Softened Leather', adjectives: ['Pleated', 'Heavily Beaded'] }],
          headgear: [{ name: 'Beaded Headdress', material: 'Glass Beads' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Beaded Belt', material: 'Glass Beads' }],
          accessories: [
            { name: 'Copper Anklets', material: 'Cast Copper' },
            { name: 'Beaded Collar', material: 'Glass Beads', adjectives: ['Layered'] },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },

  // ---------------------------------------------------------------------
  // Madagascar and Islands — 11 personas, the smallest count here, but
  // worth the entry because the dress history is not African at all: the
  // lamba, a single length of cloth draped rather than tailored, descends
  // from the Austronesian settlement of the island, not the mainland.
  // ---------------------------------------------------------------------
  'Madagascar and Islands': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: {
          garments: [{ name: 'Plain Lamba', material: 'Woven Raffia' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Shell Pendant', material: 'Shell' }, { name: 'None', material: 'None' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Plain Lamba', material: 'Woven Raffia' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Raffia Cord', material: 'Raffia Fiber' }],
          accessories: [{ name: 'Shell Beads', material: 'Shell' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [{ name: 'Lamba', material: 'Woven Cotton', adjectives: ['Striped'] }],
          headgear: [{ name: 'Woven Hat', material: 'Raffia' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Silver Ring', material: 'Silver' }],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Lamba', material: 'Woven Cotton', adjectives: ['Striped'] }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Silver Beads', material: 'Silver' }],
          palette: MEDIEVAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [{ name: 'Fine Lamba', material: 'Wild Silk', adjectives: ['Figured Weave'] }],
          headgear: [{ name: 'Woven Silk Hat', material: 'Wild Silk' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry', material: 'Silver' },
            { name: 'Rock Crystal Beads', material: 'Rock Crystal' },
          ],
          palette: MEDIEVAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Fine Lamba', material: 'Wild Silk', adjectives: ['Figured Weave'] }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry', material: 'Silver' },
            { name: 'Rock Crystal Beads', material: 'Rock Crystal' },
          ],
          palette: MEDIEVAL_COLORS,
        },
      },
    },
    // The lamba akotifahana — silk and cotton in a figured weave, the wild
    // silk drawn from the Borocera caterpillar — is Merina highland court
    // dress at its height in the nineteenth century; French colonization
    // from 1896 adds imported cloth without displacing the everyday lamba.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: {
          garments: [{ name: 'Plain Lamba', material: 'Cotton' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Cord', material: 'Cotton' }],
          accessories: [{ name: 'Shell Pendant', material: 'Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Plain Lamba', material: 'Cotton' }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Cord', material: 'Cotton' }],
          accessories: [{ name: 'Shell Beads', material: 'Shell' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      common: {
        Male: {
          garments: [{ name: 'Lamba', material: 'Woven Cotton', adjectives: ['Striped'] }],
          headgear: [{ name: 'Straw Hat', material: 'Woven Straw' }],
          footwear: [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Silver Ring', material: 'Silver' }],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Lamba', material: 'Woven Cotton', adjectives: ['Striped'] }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Barefoot', material: 'None' }],
          belts: [{ name: 'Woven Belt', material: 'Cotton' }],
          accessories: [{ name: 'Silver Beads', material: 'Silver' }],
          palette: INDUSTRIAL_COLORS,
        },
      },
      wealthy: {
        Male: {
          garments: [{ name: 'Lamba Akotifahana', material: 'Silk and Cotton', adjectives: ['Figured Weave'] }],
          headgear: [{ name: 'Woven Silk Hat', material: 'Wild Silk' }],
          footwear: [{ name: 'Imported Leather Shoes', material: 'Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry', material: 'Silver' },
            { name: 'Rock Crystal Beads', material: 'Rock Crystal' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
        Female: {
          garments: [{ name: 'Lamba Akotifahana', material: 'Silk and Cotton', adjectives: ['Figured Weave'] }],
          headgear: [{ name: 'None', material: 'None' }],
          footwear: [{ name: 'Imported Leather Shoes', material: 'Leather' }],
          belts: [{ name: 'Silver Belt', material: 'Silver' }],
          accessories: [
            { name: 'Silver Jewelry', material: 'Silver' },
            { name: 'Rock Crystal Beads', material: 'Rock Crystal' },
          ],
          palette: INDUSTRIAL_COLORS,
        },
      },
    },
  },
};
