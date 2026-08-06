/**
 * constants/characterData/regionalClothing.southAmerica.ts
 *
 * Region-level dress for South America. See regionalClothing.ts for the
 * mechanism — this file only supplies content, and a region with no entry
 * here falls through to the SOUTH_AMERICAN zone table unchanged.
 *
 * Covered, roughly by persona count and by how wrong the zone table is:
 * Andes North and Andes South (camelid fibre, then colonial pollera and
 * montera, then the bowler); Amazon Basin, Guiana Shield and Llanos and
 * Orinoco (little woven clothing before contact — bark cloth, cotton
 * string, palm fibre, feather and bead ornament, body paint); Atlantic
 * Coast (Portuguese, not the zone table's Spanish); Gran Chaco and Pampas
 * (the gaucho wardrobe); Patagonia (the guanaco-hide quillango).
 * Southern Highlands is left to the zone table — its six named places
 * split between high Andean valley and tropical lowland, with no one
 * wardrobe honest enough to write down at region grain.
 *
 * The 1533 conquest falls inside the RENAISSANCE_EARLY_MODERN bucket
 * (1450-1750) rather than at its start, so the last imperial Inca decades
 * sit beside the colonial period under the same era key. The zone table
 * already treats that whole span as colonial; entries below keep the
 * same split rather than fighting the era grid.
 */
import type { ClothingPiece, ClothingSet, EraClothingMap } from './clothing';
import { HistoricalEra } from '../../types';
import {
  TROPICAL_COLORS,
  NORTHERN_COLORS,
  INDUSTRIAL_COLORS,
  MODERN_COLORS,
  RENAISSANCE_COLORS,
} from './clothingPalettes';

const NONE: ClothingPiece = { name: 'None', material: 'None' };

const wear = (
  garments: ClothingPiece[],
  headgear: ClothingPiece[],
  footwear: ClothingPiece[],
  belts: ClothingPiece[],
  accessories: ClothingPiece[],
  palette: ClothingSet['palette'],
): ClothingSet => ({ garments, headgear, footwear, belts, accessories, palette });

export const SOUTH_AMERICAN_REGIONS: Partial<Record<string, EraClothingMap>> = {
  /**
   * Cuzco, the Bolivian Altiplano, the Atacama and the Chilean/Argentine
   * cordillera — the Inca imperial heartland and, after 1533, its Quechua
   * and Aymara successors. Wealth here reads as cloth quality before it
   * reads as garment count: cumbi, the finest state-woven cloth, against
   * awasqa, the coarser everyday weave — the same fibre, different looms.
   * PREHISTORY is left to the zone table: camelid domestication is early
   * here, but too early for any of this to be documented well enough to
   * write down as a South-specific wardrobe.
   */
  'Andes South': {
    [HistoricalEra.ANTIQUITY]: {
      poor: {
        Male: wear(
          [{ name: 'Llama Wool Tunic (Uncu)', material: 'Coarse Llama Wool' },
           { name: 'Woven Mantle', material: 'Plain Wool' }],
          [{ name: 'Woven Wool Cap', material: 'Alpaca Wool' }, NONE],
          [{ name: 'Hide Sandals (Llanque)', material: 'Untanned Llama Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt (Chumpi)', material: 'Twisted Wool' }],
          [{ name: 'Sling (Honda)', material: 'Braided Wool' }, { name: 'Coca Pouch', material: 'Woven Cotton' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Dress (Anaku)', material: 'Plain Alpaca Wool' },
           { name: 'Carrying Cloth', material: 'Coarse Wool' }],
          [{ name: 'Cloth Headband', material: 'Woven Wool' }, NONE],
          [{ name: 'Hide Sandals (Llanque)', material: 'Untanned Llama Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Belt', material: 'Plain Wool' }],
          [{ name: 'Bone Pin', material: 'Carved Bone' }, { name: 'Shell Beads', material: 'River Shell' }],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Patterned Tunic (Uncu)', material: 'Alpaca Wool', adjectives: ['Striped'] },
           { name: 'Woven Mantle', material: 'Alpaca Wool' }],
          [{ name: 'Woven Wool Cap', material: 'Fine Wool' }],
          [{ name: 'Hide Sandals', material: 'Llama Hide' }],
          [{ name: 'Patterned Belt (Chumpi)', material: 'Dyed Wool' }],
          [{ name: 'Coca Pouch (Ch\'uspa)', material: 'Woven Wool' }, { name: 'Bronze Pin', material: 'Cast Bronze' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Dress (Anaku)', material: 'Fine Alpaca Wool', adjectives: ['Dyed'] },
           { name: 'Shoulder Cloth (Lliclla)', material: 'Alpaca Wool' }],
          [{ name: 'Folded Cloth', material: 'Woven Wool' }],
          [{ name: 'Hide Sandals', material: 'Llama Hide' }],
          [{ name: 'Woven Belt (Chumpi)', material: 'Patterned Wool' }],
          [{ name: 'Silver Tupu Pin', material: 'Silver', adjectives: ['Pins the Lliclla'] }, { name: 'Shell Necklace', material: 'Spondylus Shell' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Cumbi Tunic (Uncu)', material: 'Fine Vicuña Cumbi Cloth', adjectives: ['Tapestry-woven'] },
           { name: 'Feathered Mantle', material: 'Macaw Feathers and Vicuña Wool' }],
          [{ name: 'Four-Cornered Hat', material: 'Woven Wool and Feathers' }],
          [{ name: 'Decorated Sandals', material: 'Fine Hide and Wool' }],
          [{ name: 'Gold-plaqued Belt', material: 'Gold and Wool' }],
          [{ name: 'Gold Earspools', material: 'Hammered Gold' }, { name: 'Staff of Office', material: 'Carved Wood and Gold' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Cumbi Dress (Anaku)', material: 'Finest Vicuña Cumbi Cloth' },
           { name: 'Fine Lliclla', material: 'Tapestry Cumbi Wool' }],
          [{ name: 'Silver Headband', material: 'Beaten Silver' }],
          [{ name: 'Fine Sandals', material: 'Wool and Hide' }],
          [{ name: 'Silver Chumpi', material: 'Silver and Wool' }],
          [{ name: 'Gold Tupu Pin', material: 'Gold' }, { name: 'Turquoise Necklace', material: 'Turquoise Beads' }],
          NORTHERN_COLORS,
        ),
      },
    },
    // Wari and Tiwanaku through the Aymara kingdoms that followed their
    // collapse — most of this bucket predates the Inca state, whose classic
    // cumbi/awasqa textile system only reaches its full form in the
    // empire's last century.
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: wear(
          [{ name: 'Llama Wool Tunic', material: 'Coarse Llama Wool' },
           { name: 'Wool Poncho', material: 'Undyed Wool' }],
          [{ name: 'Knit Cap', material: 'Llama Wool' }, NONE],
          [{ name: 'Hide Sandals', material: 'Untanned Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Twisted Wool' }],
          [{ name: 'Quipu', material: 'Knotted Wool String', adjectives: ['Simple'] }, { name: 'Clay Whistle', material: 'Fired Clay' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Dress', material: 'Coarse Wool' },
           { name: 'Work Shawl', material: 'Plain Wool' }],
          [{ name: 'Head Cloth', material: 'Plain Wool' }, NONE],
          [{ name: 'Hide Sandals', material: 'Untanned Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Simple Belt', material: 'Woven Wool' }],
          [{ name: 'Bone Spindle', material: 'Wood and Bone' }, { name: 'Seed Beads', material: 'Local Seeds' }],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Patterned Tunic (Uncu)', material: 'Alpaca Wool' },
           { name: 'Wool Poncho', material: 'Dyed Wool' }],
          [{ name: 'Four-Cornered Hat', material: 'Woven Wool', adjectives: ['Small'] }],
          [{ name: 'Leather Sandals', material: 'Llama Leather' }],
          [{ name: 'Woven Chumpi', material: 'Patterned Wool' }],
          [{ name: 'Coca Pouch', material: 'Woven Wool' }, { name: 'Bronze Knife (Tumi)', material: 'Bronze' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Dress (Anaku)', material: 'Alpaca Wool' },
           { name: 'Shoulder Cloth (Lliclla)', material: 'Dyed Wool' }],
          [{ name: 'Folded Cloth', material: 'Woven Wool' }],
          [{ name: 'Woven Sandals', material: 'Wool and Hide' }],
          [{ name: 'Patterned Chumpi', material: 'Dyed Wool' }],
          [{ name: 'Silver Tupu Pin', material: 'Silver' }, { name: 'Spondylus Beads', material: 'Traded Spondylus Shell' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Cumbi Tunic (Uncu)', material: 'Fine Cumbi Cloth', adjectives: ['Geometric'] },
           { name: 'Feather-trimmed Mantle', material: 'Rare Feathers and Wool' }],
          [{ name: 'Four-Cornered Hat', material: 'Fine Wool and Feathers' }],
          [{ name: 'Decorated Sandals', material: 'Fine Leather' }],
          [{ name: 'Gold-plaqued Chumpi', material: 'Gold and Wool' }],
          [{ name: 'Gold Earspools', material: 'Heavy Gold' }, { name: 'Staff of Office', material: 'Carved Wood and Gold' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Cumbi Dress', material: 'Finest Vicuña Cumbi Cloth' },
           { name: 'Fine Lliclla', material: 'Tapestry Cumbi Wool' }],
          [{ name: 'Silver Headband', material: 'Beaten Silver' }],
          [{ name: 'Fine Sandals', material: 'Wool and Hide' }],
          [{ name: 'Silver Chumpi', material: 'Silver and Wool' }],
          [{ name: 'Gold Tupu Pin', material: 'Gold' }, { name: 'Emerald Beads', material: 'Emerald and Shell' }],
          NORTHERN_COLORS,
        ),
      },
    },
    // Colonial rule reshapes indigenous dress rather than replacing it: the
    // pollera skirt and the montera hat both begin as Spanish impositions —
    // the pollera to cover what missionaries read as an immodest wrap
    // dress, the montera copied from a soldier's cap — and are indigenised
    // within a few generations. Kurakas (indigenous lords kept in place to
    // collect tribute) were granted the right to Spanish dress as rank.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Undyed Wool' },
           { name: 'Cotton Shirt', material: 'Rough Cotton' }],
          [{ name: 'Knit Cap (Chullo)', material: 'Llama Wool' }, NONE],
          [{ name: 'Hide Sandals', material: 'Untanned Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Twisted Wool' }],
          [{ name: 'Coca Pouch', material: 'Woven Wool' }, NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Pollera Skirt', material: 'Coarse Wool' },
           { name: 'Wool Shawl', material: 'Plain Wool' }],
          [{ name: 'Head Cloth', material: 'Plain Cotton' }, NONE],
          [{ name: 'Hide Sandals', material: 'Untanned Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Chumpi', material: 'Plain Wool' }],
          [{ name: 'Bone Pin', material: 'Carved Bone' }, NONE],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Patterned Wool' },
           { name: 'Cotton Breeches', material: 'Dyed Cotton' }],
          [{ name: 'Montera Hat', material: 'Felt and Wool', adjectives: ['Regional'] }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Woven Chumpi', material: 'Patterned Wool' }],
          [{ name: 'Silver Cross', material: 'Colonial Silver' }, { name: 'Coca Pouch', material: 'Woven Wool' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Pollera Skirt', material: 'Dyed Wool', adjectives: ['Layered'] },
           { name: 'Lliclla Shawl', material: 'Patterned Wool' }],
          [{ name: 'Montera Hat', material: 'Felt', adjectives: ['Regional'] }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Woven Chumpi', material: 'Patterned Wool' }],
          [{ name: 'Silver Tupu Pin', material: 'Silver' }, { name: 'Glass Trade Beads', material: 'Trade Glass' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Spanish Doublet', material: 'Fine Wool', adjectives: ['Kuraka Rank'] },
           { name: 'Fine Wool Cloak', material: 'Vicuña Wool' }],
          [{ name: 'Plumed Hat', material: 'Felt and Feathers' }],
          [{ name: 'Buckled Shoes', material: 'Fine Leather' }],
          [{ name: 'Silver Belt', material: 'Engraved Silver' }],
          [{ name: 'Gold Chain', material: 'Colonial Gold' }, { name: 'Silver-topped Cane', material: 'Wood and Silver' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Pollera', material: 'Silk and Wool', adjectives: ['Embroidered'] },
           { name: 'Fine Lliclla', material: 'Cumbi-quality Wool' }],
          [{ name: 'Silver-trimmed Montera', material: 'Felt and Silver' }],
          [{ name: 'Embroidered Shoes', material: 'Leather and Silver Thread' }],
          [{ name: 'Silver Chumpi', material: 'Silver and Wool' }],
          [{ name: 'Gold Tupu Pin', material: 'Gold' }, { name: 'Pearl Earrings', material: 'Pearl and Silver' }],
          NORTHERN_COLORS,
        ),
      },
    },
    // By the 19th century the pollera, aguayo and montera are no longer
    // imposed dress but the ordinary everyday wear of highland Quechua and
    // Aymara women — a layered pollera and a fine aguayo signal means the
    // way cumbi cloth once did.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Undyed Wool' },
           { name: 'Cotton Trousers', material: 'Rough Cotton' }],
          [{ name: 'Chullo Cap', material: 'Knitted Wool', adjectives: ['Ear-flapped'] }],
          [{ name: 'Rawhide Sandals (Ojota)', material: 'Rawhide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Belt', material: 'Plain Wool' }],
          [{ name: 'Coca Pouch', material: 'Woven Wool' }, NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Pollera Skirt', material: 'Wool', adjectives: ['Single Layer'] },
           { name: 'Wool Shawl', material: 'Plain Wool' }],
          [{ name: 'Felt Hat', material: 'Plain Felt' }, NONE],
          [{ name: 'Rawhide Sandals', material: 'Rawhide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Chumpi', material: 'Plain Wool' }],
          [{ name: 'Carrying Cloth (Aguayo)', material: 'Woven Wool' }, NONE],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Striped Wool' },
           { name: 'Wool Trousers', material: 'Dyed Wool' }],
          [{ name: 'Chullo Cap', material: 'Knitted Alpaca Wool' }, { name: 'Felt Hat', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Llama Leather' }],
          [{ name: 'Woven Chumpi', material: 'Patterned Wool' }],
          [{ name: 'Coca Pouch', material: 'Woven Wool' }, { name: 'Wool Sling', material: 'Braided Wool' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Layered Pollera', material: 'Fine Wool', adjectives: ['Multiple Skirts'] },
           { name: 'Aguayo Shawl', material: 'Patterned Wool' }],
          [{ name: 'Montera Hat', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Soft Leather' }],
          [{ name: 'Woven Chumpi', material: 'Patterned Wool' }],
          [{ name: 'Silver Tupu Pin', material: 'Silver' }, { name: 'Bead Necklace', material: 'Glass and Silver' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Wool Suit', material: 'Fine European Wool' },
           { name: 'Alpaca Overcoat', material: 'Fine Alpaca Wool' }],
          [{ name: 'Top Hat', material: 'Silk' }, { name: 'Fine Chullo', material: 'Vicuña Wool' }],
          [{ name: 'Leather Boots', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Silver Watch', material: 'Silver' }, { name: 'Gold Ring', material: 'Gold' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Finest Pollera', material: 'Silk-trimmed Wool', adjectives: ['Many Layers'] },
           { name: 'Fine Aguayo', material: 'Vicuña Wool', adjectives: ['Densely Patterned'] }],
          [{ name: 'Silver-trimmed Hat', material: 'Felt and Silver' }],
          [{ name: 'Fine Leather Shoes', material: 'Leather' }],
          [{ name: 'Silver Chumpi', material: 'Silver and Wool' }],
          [{ name: 'Gold Tupu Pin', material: 'Gold' }, { name: 'Pearl Necklace', material: 'Pearl and Gold' }],
          NORTHERN_COLORS,
        ),
      },
    },
    // The bombín (bowler hat) reaches Bolivia in the 1920s, adopted by
    // Aymara and Quechua women rather than the British and Central
    // European men it was sold to, and becomes — with the pollera and the
    // aguayo — dress still worn today by many highland women: a living
    // tradition, not a costume. It is one option among several below, for
    // the same reason CONTEMPORARY_CLOTHING treats it that way further up
    // this file: not universal even in La Paz, let alone the wider region.
    // MODERN_COLORS, not NORTHERN_COLORS, from here — synthetic dye reaches
    // even remote highland weaving by this period, and the vivid pollera
    // and aguayo are part of what makes the look recognisable.
    [HistoricalEra.MODERN_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Machine-spun Wool' },
           { name: 'Cotton Trousers', material: 'Cotton' }],
          [{ name: 'Chullo Cap', material: 'Knitted Wool' }, { name: 'Felt Hat', material: 'Felt' }],
          [{ name: 'Rubber-soled Sandals', material: 'Tire Rubber and Leather' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Belt', material: 'Wool' }],
          [{ name: 'Coca Pouch', material: 'Woven Wool' }, NONE],
          MODERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Pollera Skirt', material: 'Wool' },
           { name: 'Cotton Blouse', material: 'Cotton' }],
          [{ name: 'Bowler Hat', material: 'Felt' }, { name: 'Cloth Headband', material: 'Cotton' }],
          [{ name: 'Rubber-soled Sandals', material: 'Tire Rubber and Leather' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Chumpi', material: 'Wool' }],
          [{ name: 'Aguayo Carrying Cloth', material: 'Woven Wool' }, NONE],
          MODERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Striped Wool' },
           { name: 'Suit Trousers', material: 'Wool Blend' }],
          [{ name: 'Felt Hat', material: 'Felt' }, { name: 'Chullo Cap', material: 'Knitted Wool' }],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Leather Belt', material: 'Leather' }],
          [{ name: 'Wristwatch', material: 'Steel' }, { name: 'Coca Pouch', material: 'Woven Wool' }],
          MODERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Layered Pollera', material: 'Fine Wool' },
           { name: 'Embroidered Blouse', material: 'Cotton' }],
          [{ name: 'Bowler Hat', material: 'Felt' }, { name: 'Borsalino-style Hat', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Woven Chumpi', material: 'Wool' }],
          [{ name: 'Gold Earrings', material: 'Gold' }, { name: 'Aguayo Carrying Cloth', material: 'Woven Wool' }],
          MODERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Wool Suit', material: 'Fine Wool' },
           { name: 'Overcoat', material: 'Alpaca Wool' }],
          [{ name: 'Felt Fedora', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Leather' }],
          [{ name: 'Gold Watch', material: 'Gold' }, { name: 'Silver Ring', material: 'Silver' }],
          MODERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Tailored Dress', material: 'Silk' },
           { name: 'Fine Alpaca Coat', material: 'Vicuña Wool' }],
          [{ name: 'Fashionable Hat', material: 'Felt and Feathers' }],
          [{ name: 'Leather Heels', material: 'Leather' }],
          [NONE],
          [{ name: 'Pearl Necklace', material: 'Pearl' }, { name: 'Gold Bracelet', material: 'Gold' }],
          MODERN_COLORS,
        ),
      },
    },
  },

  /**
   * Ecuador and northern Peru — Quito, Cajamarca (where Atahualpa was taken
   * in 1532), the Chachapoyas cloud forest. Cotton and cabuya (agave)
   * fibre matter more here than camelid wool, and pre-Inca chiefdoms —
   * Cañari, Quitu-Cara, Chachapoya — dominate most of its history: Inca
   * rule reaches this region only in its final decades (from the 1460s),
   * too briefly to root the cumbi/awasqa cloth system as deeply as it sits
   * in the south. Status marks itself in gold and shell ornament instead.
   * ANTIQUITY and PREHISTORY are left to the zone table — evidence this far
   * north and this early is thinner than the coverage below can responsibly
   * claim.
   */
  'Andes North': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Tunic', material: 'Rough Cotton' },
           { name: 'Cabuya Fibre Cloak', material: 'Agave Fibre' }],
          [{ name: 'Cotton Headband', material: 'Woven Cotton' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cabuya Cord Belt', material: 'Agave Fibre' }],
          [{ name: 'Shell Pendant', material: 'Spondylus Shell' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Wrap Skirt', material: 'Rough Cotton' },
           { name: 'Cabuya Shawl', material: 'Agave Fibre' }],
          [{ name: 'Cloth Band', material: 'Cotton' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Belt', material: 'Cabuya Fibre' }],
          [{ name: 'Shell Beads', material: 'River Shell' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Cotton Tunic', material: 'Fine Cotton', adjectives: ['Dyed'] },
           { name: 'Feather-trimmed Cloak', material: 'Cotton and Feathers' }],
          [{ name: 'Feather Headband', material: 'Parrot Feathers' }],
          [{ name: 'Fibre Sandals', material: 'Woven Cabuya' }],
          [{ name: 'Woven Belt', material: 'Patterned Cotton' }],
          [{ name: 'Gold Nose Ring', material: 'Hammered Gold' }, { name: 'Spondylus Necklace', material: 'Spondylus Shell' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Wrap Dress', material: 'Fine Cotton' },
           { name: 'Cabuya Shawl', material: 'Dyed Agave Fibre' }],
          [{ name: 'Beaded Headband', material: 'Shell and Cotton' }],
          [{ name: 'Fibre Sandals', material: 'Woven Cabuya' }],
          [{ name: 'Woven Belt', material: 'Patterned Cotton' }],
          [{ name: 'Gold Ear Ornament', material: 'Hammered Gold' }, { name: 'Shell Necklace', material: 'Spondylus Shell' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Cotton Tunic', material: 'Finest Cotton', adjectives: ['Painted'] },
           { name: 'Feather Cloak', material: 'Cloud-forest Feathers' }],
          [{ name: 'Gold Headband', material: 'Hammered Gold and Feathers' }],
          [{ name: 'Decorated Sandals', material: 'Gold and Cabuya Fibre' }],
          [{ name: 'Gold Belt', material: 'Gold Plates' }],
          [{ name: 'Gold Nose Ornament', material: 'Solid Gold' }, { name: 'Staff of Office', material: 'Carved Wood and Gold' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Cotton Dress', material: 'Finest Cotton', adjectives: ['Painted'] },
           { name: 'Feather Mantle', material: 'Cloud-forest Feathers' }],
          [{ name: 'Gold Diadem', material: 'Gold and Shell' }],
          [{ name: 'Decorated Sandals', material: 'Gold and Cabuya Fibre' }],
          [{ name: 'Gold Belt', material: 'Gold and Shell' }],
          [{ name: 'Gold Earspools', material: 'Hammered Gold' }, { name: 'Spondylus Jewelry', material: 'Spondylus Shell and Gold' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // The poncho — a rectangle with a head-slit, distinct from the pinned
    // lliclla further south — becomes the standard highland garment across
    // class and gender in this period, worn over whatever else a person
    // owned.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Undyed Wool' },
           { name: 'Cotton Shirt', material: 'Rough Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Straw' }, NONE],
          [{ name: 'Fibre Sandals', material: 'Woven Cabuya' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Cabuya Fibre' }],
          [{ name: 'Wooden Cross', material: 'Carved Wood' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Skirt (Anaco)', material: 'Wool' },
           { name: 'Cotton Blouse', material: 'Rough Cotton' }],
          [{ name: 'Head Cloth', material: 'Cotton' }, NONE],
          [{ name: 'Fibre Sandals', material: 'Woven Cabuya' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Sash', material: 'Cotton' }],
          [{ name: 'Glass Beads', material: 'Trade Glass' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Patterned Wool' },
           { name: 'Cotton Breeches', material: 'Dyed Cotton' }],
          [{ name: 'Wide-brim Hat', material: 'Felt' }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Silver Cross', material: 'Colonial Silver' }, { name: 'Tobacco Pouch', material: 'Leather' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Skirt (Anaco)', material: 'Dyed Wool' },
           { name: 'Ikat Shawl (Macana)', material: 'Dyed Cotton', adjectives: ['Resist-dyed'] }],
          [{ name: 'Felt Hat', material: 'Felt' }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Woven Sash', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Silver Pin', material: 'Silver' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Spanish Doublet', material: 'Fine Wool' },
           { name: 'Wool Cloak', material: 'Fine Wool' }],
          [{ name: 'Plumed Hat', material: 'Felt and Feathers' }],
          [{ name: 'Buckled Shoes', material: 'Fine Leather' }],
          [{ name: 'Silver Belt', material: 'Engraved Silver' }],
          [{ name: 'Gold Chain', material: 'Colonial Gold' }, { name: 'Emerald Ring', material: 'Colombian Emerald' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Wool Dress', material: 'Imported Wool', adjectives: ['Embroidered'] },
           { name: 'Silk-trimmed Shawl', material: 'Silk and Wool' }],
          [{ name: 'Lace Mantilla', material: 'Black Lace' }],
          [{ name: 'Leather Shoes', material: 'Soft Leather' }],
          [{ name: 'Silk Sash', material: 'Imported Silk' }],
          [{ name: 'Pearl Necklace', material: 'Pearl and Silver' }, { name: 'Gold Earrings', material: 'Colonial Gold' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // The toquilla straw hat — sold worldwide as the "Panama hat" but woven
    // in highland Ecuador, above all around Cuenca — becomes an export
    // trade over this century, worn locally as much as it is sold abroad.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Undyed Wool' },
           { name: 'Cotton Trousers', material: 'Rough Cotton' }],
          [{ name: 'Toquilla Straw Hat', material: 'Toquilla Palm' }, NONE],
          [{ name: 'Fibre Sandals', material: 'Woven Cabuya' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Cabuya Fibre' }],
          [NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Skirt (Anaco)', material: 'Wool' },
           { name: 'Embroidered Blouse', material: 'Cotton' }],
          [{ name: 'Felt Hat', material: 'Felt' }, NONE],
          [{ name: 'Fibre Sandals', material: 'Woven Cabuya' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Sash', material: 'Cotton' }],
          [{ name: 'Glass Bead Strands', material: 'Trade Glass' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Striped Wool' },
           { name: 'Wool Trousers', material: 'Dyed Wool' }],
          [{ name: 'Toquilla Straw Hat', material: 'Toquilla Palm' }],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Wool Sash', material: 'Woven Wool' }, { name: 'Pocket Knife', material: 'Steel and Wood' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Skirt (Anaco)', material: 'Fine Wool' },
           { name: 'Blue Shawl (Fachalina)', material: 'Wool' }],
          [{ name: 'Felt Hat', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Soft Leather' }],
          [{ name: 'Woven Sash', material: 'Cotton' }],
          [{ name: 'Gold-tone Bead Strands', material: 'Glass and Gilt' }, { name: 'Silver Earrings', material: 'Silver' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Wool Suit', material: 'Fine Wool' },
           { name: 'Wool Overcoat', material: 'Fine Wool' }],
          [{ name: 'Fine Toquilla Hat', material: 'Superfino Toquilla Palm' }],
          [{ name: 'Leather Boots', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Gold Watch', material: 'Gold' }, { name: 'Silver-topped Cane', material: 'Wood and Silver' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Silk Dress', material: 'Imported Silk' },
           { name: 'Fine Wool Shawl', material: 'Fine Wool' }],
          [{ name: 'Feathered Hat', material: 'Felt and Feathers' }],
          [{ name: 'Silk Shoes', material: 'Embroidered Silk' }],
          [{ name: 'Silk Sash', material: 'Silk' }],
          [{ name: 'Pearl Earrings', material: 'Pearl' }, { name: 'Gold Necklace', material: 'Gold' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // In many northern-highland communities — Otavalo above all — women's
    // dress by this period is a dark wrap skirt, a white embroidered
    // blouse, gold-tone bead strands and a blue shawl. It is a living
    // tradition, still worn today, not a costume, and is offered here as
    // one option among the plainer alternatives rather than the region's
    // default.
    [HistoricalEra.MODERN_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Machine-spun Wool' },
           { name: 'Cotton Trousers', material: 'Cotton' }],
          [{ name: 'Felt Hat', material: 'Felt' }, NONE],
          [{ name: 'Rubber Sandals', material: 'Tire Rubber' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Skirt (Anaco)', material: 'Wool' },
           { name: 'Embroidered Blouse', material: 'Cotton' }],
          [{ name: 'Head Scarf', material: 'Cotton' }, NONE],
          [{ name: 'Rubber Sandals', material: 'Tire Rubber' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Sash', material: 'Cotton' }],
          [{ name: 'Gold-tone Bead Strands', material: 'Glass and Gilt' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Poncho', material: 'Striped Wool' },
           { name: 'Suit Trousers', material: 'Wool Blend' }],
          [{ name: 'Felt Hat', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Leather Belt', material: 'Leather' }],
          [{ name: 'Wristwatch', material: 'Steel' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Wrap Skirt (Anaco)', material: 'Fine Wool' },
           { name: 'Blue Shawl (Fachalina)', material: 'Wool' }],
          [NONE],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Woven Sash', material: 'Cotton' }],
          [{ name: 'Gold-tone Bead Strands', material: 'Glass and Gilt' }, { name: 'Silver Earrings', material: 'Silver' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Wool Suit', material: 'Fine Wool' },
           { name: 'Overcoat', material: 'Wool' }],
          [{ name: 'Fedora', material: 'Felt' }],
          [{ name: 'Leather Shoes', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Leather' }],
          [{ name: 'Gold Watch', material: 'Gold' }, { name: 'Silver Ring', material: 'Silver' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Tailored Dress', material: 'Silk' },
           { name: 'Wool Coat', material: 'Fine Wool' }],
          [{ name: 'Fashionable Hat', material: 'Felt' }],
          [{ name: 'Leather Heels', material: 'Leather' }],
          [NONE],
          [{ name: 'Pearl Necklace', material: 'Pearl' }, { name: 'Gold Bracelet', material: 'Gold' }],
          TROPICAL_COLORS,
        ),
      },
    },
  },

  /**
   * Little woven clothing anywhere in the lowlands before contact — bark
   * cloth, cotton string and palm fibre, with feather and bead ornament and
   * body paint (genipap black, annatto red) doing most of what clothing
   * does elsewhere. Status shows in the density and rarity of ornament, not
   * in how much is worn; the "wealthy" tier below is a headman's or a
   * leading family's everyday dress, not ritual regalia.
   */
  'Amazon Basin': {
    [HistoricalEra.ANTIQUITY]: {
      poor: {
        Male: wear(
          [{ name: 'Bark-cloth Loincloth', material: 'Beaten Bark' },
           { name: 'Cotton String Wrap', material: 'Spun Cotton' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, { name: 'Seed Necklace', material: 'Local Seeds' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton String Apron', material: 'Spun Cotton' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, { name: 'Shell Bracelet', material: 'River Shell' }],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Painted Bark-cloth Wrap', material: 'Beaten Bark' },
           { name: 'Cotton String Wrap', material: 'Dyed Cotton' }],
          [{ name: 'Feather Headband', material: 'Macaw Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Toucan Feather Ornament', material: 'Toucan Feathers' }, { name: 'Jaguar Tooth Necklace', material: 'Jaguar Tooth and Cord' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton String Apron', material: 'Dyed Cotton' },
           { name: 'Painted Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Feather Ornament', material: 'Parrot Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Seed and Shell Necklace', material: 'Seeds and River Shell' }, { name: 'Feather Earrings', material: 'Small Feathers' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Bark-cloth Wrap', material: 'Beaten Bark', adjectives: ['Finely Painted'] },
           { name: 'Cotton String Wrap', material: 'Fine Dyed Cotton' }],
          [{ name: 'Macaw Feather Headband', material: 'Macaw Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Jaguar Tooth Necklace', material: 'Jaguar Teeth' }, { name: 'Shell Gorget', material: 'River Shell' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Cotton Apron', material: 'Fine Dyed Cotton' },
           { name: 'Fine Bark-cloth Wrap', material: 'Beaten Bark', adjectives: ['Finely Painted'] }],
          [{ name: 'Feather Headdress', material: 'Macaw and Parrot Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Shell and Seed Necklace', material: 'Shell and Seeds' }, { name: 'Feather Earrings', material: 'Macaw Feathers' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // By roughly 400-1400 CE the delta supports complex chiefdoms —
    // Marajoara pottery, from the Amazon Delta itself, is the best-known
    // trace — and status ornament grows more elaborate without any of
    // these societies adopting woven cloth as everyday wear.
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: wear(
          [{ name: 'Bark-cloth Loincloth', material: 'Beaten Bark' },
           { name: 'Cotton String Wrap', material: 'Spun Cotton' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, { name: 'Seed Necklace', material: 'Local Seeds' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton String Apron', material: 'Spun Cotton' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, { name: 'Ceramic Bead Necklace', material: 'Painted Ceramic' }],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Painted Bark-cloth Wrap', material: 'Beaten Bark' },
           { name: 'Cotton String Wrap', material: 'Dyed Cotton' }],
          [{ name: 'Feather Headband', material: 'Macaw Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Jaguar Tooth Necklace', material: 'Jaguar Tooth and Cord' }, { name: 'Ceramic Ear Ornament', material: 'Painted Ceramic' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton String Apron', material: 'Dyed Cotton' },
           { name: 'Painted Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Feather Ornament', material: 'Parrot Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Ceramic Bead Necklace', material: 'Painted Ceramic' }, { name: 'Feather Earrings', material: 'Small Feathers' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Bark-cloth Wrap', material: 'Beaten Bark', adjectives: ['Finely Painted'] },
           { name: 'Cotton String Wrap', material: 'Fine Dyed Cotton' }],
          [{ name: 'Feather Headdress', material: 'Macaw and Harpy Eagle Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Jaguar Tooth Necklace', material: 'Jaguar Teeth' }, { name: 'Painted Ceramic Gorget', material: 'Painted Ceramic' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Cotton Apron', material: 'Fine Dyed Cotton' },
           { name: 'Fine Bark-cloth Wrap', material: 'Beaten Bark', adjectives: ['Finely Painted'] }],
          [{ name: 'Feather Headdress', material: 'Macaw and Parrot Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Ceramic and Shell Necklace', material: 'Painted Ceramic and Shell' }, { name: 'Feather Earrings', material: 'Macaw Feathers' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // European contact along the Amazon proper begins with Orellana's 1541
    // descent and thickens slowly through Jesuit and Franciscan mission
    // settlements from the 17th century — later and far more unevenly, by
    // river, than the Andes. Mission cotton appears at the river's edge
    // while traditional dress continues inland.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Bark-cloth Loincloth', material: 'Beaten Bark' },
           { name: 'Cotton String Wrap', material: 'Spun Cotton' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton String Apron', material: 'Spun Cotton' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Mission Cotton Shirt', material: 'Coarse Cotton', adjectives: ['Mission-issued'] },
           { name: 'Cotton Trousers', material: 'Coarse Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Cotton' }],
          [{ name: 'Wooden Cross', material: 'Carved Wood' }, { name: 'Feather Ornament', material: 'Macaw Feathers' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Mission Cotton Dress', material: 'Coarse Cotton', adjectives: ['Mission-issued'] },
           { name: 'Cotton String Apron', material: 'Spun Cotton' }],
          [{ name: 'Head Cloth', material: 'Cotton' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Cotton' }],
          [{ name: 'Wooden Rosary', material: 'Carved Wood' }, { name: 'Seed Necklace', material: 'Local Seeds' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Portuguese Cotton Shirt', material: 'Fine Cotton' },
           { name: 'Cotton Breeches', material: 'Cotton' }],
          [{ name: 'Wide-brim Hat', material: 'Felt' }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Silver Cross', material: 'Colonial Silver' }, { name: 'Trade Knife', material: 'Steel and Wood' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Portuguese Cotton Dress', material: 'Fine Cotton' },
           { name: 'Embroidered Shawl', material: 'Cotton' }],
          [{ name: 'Head Scarf', material: 'Fine Cotton' }],
          [{ name: 'Leather Sandals', material: 'Soft Leather' }],
          [{ name: 'Cloth Sash', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Silver Ring', material: 'Colonial Silver' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // The rubber boom, roughly 1850-1920: tappers, many indigenous or of
    // mixed descent and working off debt to a trader under the aviamento
    // system, in plain trade cotton; unconquered groups in the deep
    // interior still in the older dress; the region's few rubber fortunes
    // in imported European fashion.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Trade Cotton Shirt', material: 'Cheap Cotton', adjectives: ['Worn'] },
           { name: 'Cotton Trousers', material: 'Cheap Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Rope Belt', material: 'Hemp Rope' }],
          [NONE],
          INDUSTRIAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Trade Cotton Dress', material: 'Cheap Cotton', adjectives: ['Worn'] },
           { name: 'Cotton String Apron', material: 'Spun Cotton' }],
          [{ name: 'Head Cloth', material: 'Cotton' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [NONE],
          INDUSTRIAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Cotton Shirt', material: 'Cotton' },
           { name: 'Canvas Trousers', material: 'Heavy Canvas' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Leather Belt', material: 'Leather' }],
          [{ name: 'Machete Sheath', material: 'Leather and Steel' }, NONE],
          INDUSTRIAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Dress', material: 'Printed Cotton' },
           { name: 'Cotton Shawl', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }, NONE],
          [{ name: 'Leather Sandals', material: 'Soft Leather' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, NONE],
          INDUSTRIAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Linen Suit', material: 'Light Linen' },
           { name: 'Cotton Shirt', material: 'Fine Cotton' }],
          [{ name: 'Panama Hat', material: 'Toquilla Straw' }],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Gold Watch', material: 'Gold' }, { name: 'Cigar Case', material: 'Leather' }],
          INDUSTRIAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Silk Dress', material: 'Imported Silk' },
           { name: 'Lace Shawl', material: 'Cotton Lace' }],
          [{ name: 'Decorated Hat', material: 'Straw and Ribbon' }],
          [{ name: 'Leather Shoes', material: 'Fine Leather' }],
          [{ name: 'Silk Sash', material: 'Silk' }],
          [{ name: 'Pearl Necklace', material: 'Pearl' }, { name: 'Gold Bracelet', material: 'Gold' }],
          INDUSTRIAL_COLORS,
        ),
      },
    },
  },

  /**
   * The beaded apron, not the bark-cloth wrap, is this region's clearest
   * marker — worn by women among Cariban- and Arawakan-speaking peoples
   * from the coast to the highlands: seed and shell beads before contact,
   * traded glass beads after. Coastal contact here is Dutch, English and
   * French, not Spanish or Portuguese, and begins earlier than in the
   * Amazon interior — but the interior highlands stayed comparatively
   * unreached for much longer. Only nine personas in the sample fall here,
   * so this stands for the whole pre-contact span rather than splitting
   * finer eras that would differ only in degree.
   */
  'Guiana Shield': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Breechcloth', material: 'Spun Cotton' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, { name: 'Seed Necklace', material: 'Local Seeds' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Beaded Apron', material: 'Seeds and Shell' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, { name: 'Shell Bracelet', material: 'River Shell' }],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Cotton Breechcloth', material: 'Dyed Cotton' },
           { name: 'Feather-trimmed Cloak', material: 'Cotton and Feathers' }],
          [{ name: 'Feather Headband', material: 'Macaw Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Jaguar Tooth Necklace', material: 'Jaguar Tooth and Cord' }, { name: 'Feather Armband', material: 'Small Feathers' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Beaded Apron', material: 'Seeds and Shell', adjectives: ['Patterned'] },
           { name: 'Cotton Wrap', material: 'Dyed Cotton' }],
          [{ name: 'Feather Ornament', material: 'Parrot Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Seed Bead Necklace', material: 'Seeds and Shell' }, { name: 'Feather Earrings', material: 'Small Feathers' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Cotton Breechcloth', material: 'Fine Dyed Cotton' },
           { name: 'Feather Cloak', material: 'Macaw and Harpy Eagle Feathers' }],
          [{ name: 'Feather Headdress', material: 'Macaw Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Jaguar Tooth Necklace', material: 'Jaguar Teeth' }, { name: 'Shell Gorget', material: 'River Shell' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Beaded Apron', material: 'Shell and Fine Beadwork', adjectives: ['Densely Beaded'] },
           { name: 'Fine Cotton Wrap', material: 'Fine Dyed Cotton' }],
          [{ name: 'Feather Ornament', material: 'Macaw Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Shell and Seed Necklace', material: 'Shell and Seeds' }, { name: 'Feather Earrings', material: 'Macaw Feathers' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // Dutch, English and French trading posts reach this coast from the
    // early 1600s, a century before Spanish and Portuguese contact makes
    // much difference in the Amazon interior — glass trade beads replace
    // seed and shell in the apron near the coast, while the interior
    // highlands change more slowly.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Breechcloth', material: 'Spun Cotton' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Beaded Apron', material: 'Glass Trade Beads' },
           { name: 'Bark-cloth Wrap', material: 'Beaten Bark' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Genipap Body Paint', material: 'Genipap and Annatto Dye' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Trade Cloth Wrap', material: 'Dutch Trade Cotton' },
           { name: 'Cotton Breechcloth', material: 'Dyed Cotton' }],
          [{ name: 'Feather Headband', material: 'Macaw Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Metal Trade Knife', material: 'Steel and Wood' }, { name: 'Glass Bead Necklace', material: 'Trade Glass' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Beaded Apron', material: 'Glass Trade Beads', adjectives: ['Patterned'] },
           { name: 'Trade Cloth Wrap', material: 'Dutch Trade Cotton' }],
          [{ name: 'Feather Ornament', material: 'Parrot Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Feather Earrings', material: 'Small Feathers' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Trade Cloth Wrap', material: 'Fine Dutch Cotton' },
           { name: 'Feather Cloak', material: 'Macaw and Harpy Eagle Feathers' }],
          [{ name: 'Feather Headdress', material: 'Macaw Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Silver-clasped Belt', material: 'Cotton and Traded Silver' }],
          [{ name: 'Jaguar Tooth Necklace', material: 'Jaguar Teeth' }, { name: 'Glass Bead Sash', material: 'Trade Glass' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Beaded Apron', material: 'Glass Trade Beads', adjectives: ['Densely Beaded'] },
           { name: 'Fine Trade Cloth Wrap', material: 'Fine Dutch Cotton' }],
          [{ name: 'Feather Ornament', material: 'Macaw Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Feather Earrings', material: 'Macaw Feathers' }],
          TROPICAL_COLORS,
        ),
      },
    },
  },

  /**
   * Savanna and river delta rather than closed forest — moriche palm fibre
   * (the Warao of the Orinoco delta are the best-documented weavers of it)
   * stands in for the Amazon's bark cloth, and herons and ibises stand in
   * for macaws in the featherwork. From the colonial period on, the open
   * grassland grows its own horse-and-cattle herding culture: the Llanero,
   * a close, independent parallel to the gaucho of the Pampas.
   */
  'Llanos and Orinoco': {
    [HistoricalEra.MEDIEVAL]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Breechcloth', material: 'Spun Cotton' },
           { name: 'Moriche Fibre Wrap', material: 'Moriche Palm Fibre' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Heron Feather Ornament', material: 'Heron Feathers' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Moriche Fibre Skirt', material: 'Moriche Palm Fibre' },
           { name: 'Cotton Wrap', material: 'Spun Cotton' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [{ name: 'Shell Bracelet', material: 'River Shell' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Woven Moriche Wrap', material: 'Moriche Palm Fibre', adjectives: ['Finely Plaited'] },
           { name: 'Cotton Breechcloth', material: 'Dyed Cotton' }],
          [{ name: 'Heron Feather Headband', material: 'Heron Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Fishbone Necklace', material: 'Fishbone and Cord' }, { name: 'Seed Bracelet', material: 'Local Seeds' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Woven Moriche Skirt', material: 'Moriche Palm Fibre', adjectives: ['Finely Plaited'] },
           { name: 'Cotton Wrap', material: 'Dyed Cotton' }],
          [{ name: 'Feather Ornament', material: 'Ibis Feathers' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Cotton' }],
          [{ name: 'Shell Necklace', material: 'River Shell' }, { name: 'Seed Bracelet', material: 'Local Seeds' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Moriche Wrap', material: 'Moriche Palm Fibre', adjectives: ['Densely Plaited'] },
           { name: 'Feather Cape', material: 'Heron and Ibis Feathers' }],
          [{ name: 'Feather Headdress', material: 'Heron Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Shell Gorget', material: 'River Shell' }, { name: 'Fishbone Necklace', material: 'Fishbone and Cord' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Moriche Skirt', material: 'Moriche Palm Fibre', adjectives: ['Densely Plaited'] },
           { name: 'Fine Cotton Wrap', material: 'Fine Dyed Cotton' }],
          [{ name: 'Feather Ornament', material: 'Ibis Feathers', adjectives: ['Status'] }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Woven Cord Belt', material: 'Patterned Cotton' }],
          [{ name: 'Shell Necklace', material: 'River Shell' }, { name: 'Feather Earrings', material: 'Heron Feathers' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // Spanish contact reaches the Llanos and the Orinoco through river
    // missions — Capuchin and Jesuit, from the 17th century — rather than
    // through the coastal trading posts that reached the Guiana Shield or
    // the inland advance that reached the Andes.
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Breechcloth', material: 'Spun Cotton' },
           { name: 'Moriche Fibre Wrap', material: 'Moriche Palm Fibre' }],
          [{ name: 'Palm-leaf Band', material: 'Woven Palm' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Moriche Fibre Skirt', material: 'Moriche Palm Fibre' },
           { name: 'Mission Cotton Wrap', material: 'Coarse Cotton' }],
          [{ name: 'Head Cloth', material: 'Cotton' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cotton Cord Belt', material: 'Spun Cotton' }],
          [NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Mission Cotton Shirt', material: 'Coarse Cotton', adjectives: ['Mission-issued'] },
           { name: 'Cotton Trousers', material: 'Coarse Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Cotton' }],
          [{ name: 'Wooden Cross', material: 'Carved Wood' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Mission Cotton Dress', material: 'Coarse Cotton', adjectives: ['Mission-issued'] },
           { name: 'Moriche Fibre Skirt', material: 'Moriche Palm Fibre' }],
          [{ name: 'Head Cloth', material: 'Cotton' }],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Cotton' }],
          [{ name: 'Wooden Rosary', material: 'Carved Wood' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Spanish Cotton Shirt', material: 'Fine Cotton' },
           { name: 'Cotton Breeches', material: 'Cotton' }],
          [{ name: 'Wide-brim Hat', material: 'Felt' }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Silver Cross', material: 'Colonial Silver' }, { name: 'Trade Knife', material: 'Steel and Wood' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Spanish Cotton Dress', material: 'Fine Cotton' },
           { name: 'Embroidered Shawl', material: 'Cotton' }],
          [{ name: 'Head Scarf', material: 'Fine Cotton' }],
          [{ name: 'Leather Sandals', material: 'Soft Leather' }],
          [{ name: 'Cloth Sash', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, { name: 'Silver Ring', material: 'Colonial Silver' }],
          TROPICAL_COLORS,
        ),
      },
    },
    // The Llanero — the plains horseman of the Llanos, the Venezuelan and
    // Colombian counterpart to the gaucho — takes shape over this century
    // out of the same mix of feral colonial cattle and open grassland,
    // independently of the Pampas.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Work Shirt', material: 'Rough Cotton' },
           { name: 'Cotton Trousers', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }],
          [{ name: 'Rope Sandals (Alpargatas)', material: 'Woven Hemp' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Leather Cord Belt', material: 'Rawhide' }],
          [NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Dress', material: 'Rough Cotton' },
           { name: 'Cotton Shawl', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Palm' }, NONE],
          [{ name: 'Rope Sandals (Alpargatas)', material: 'Woven Hemp' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Cotton Work Shirt (Liqui-liqui)', material: 'Cotton', adjectives: ['Plains-cut'] },
           { name: 'Cotton Trousers', material: 'Cotton Drill' }],
          [{ name: 'Wide-brim Sombrero Llanero', material: 'Straw' }],
          [{ name: 'Leather Boots', material: 'Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Machete Sheath', material: 'Leather and Steel' }, { name: 'Rope Lasso', material: 'Braided Hide' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Dress', material: 'Printed Cotton' },
           { name: 'Cotton Shawl', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Straw' }, NONE],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Linen Suit', material: 'Light Linen' },
           { name: 'Liqui-liqui Suit', material: 'Fine Cotton', adjectives: ['Tailored'] }],
          [{ name: 'Panama Hat', material: 'Toquilla Straw' }],
          [{ name: 'Leather Boots', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Gold Watch', material: 'Gold' }, { name: 'Silver Spurs', material: 'Silver' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Silk Dress', material: 'Imported Silk' },
           { name: 'Lace Shawl', material: 'Cotton Lace' }],
          [{ name: 'Decorated Hat', material: 'Straw and Ribbon' }],
          [{ name: 'Leather Shoes', material: 'Fine Leather' }],
          [{ name: 'Silk Sash', material: 'Silk' }],
          [{ name: 'Pearl Necklace', material: 'Pearl' }, { name: 'Gold Bracelet', material: 'Gold' }],
          TROPICAL_COLORS,
        ),
      },
    },
  },

  /**
   * The zone table's colonial entry dresses this coast as Spanish — a
   * doublet, a mantilla — when every one of this region's named places
   * (Rio, Bahia, Pernambuco, São Paulo, the Recôncavo, Espírito Santo) is
   * Brazilian and was colonised by Portugal. Cut is also lighter
   * throughout, for the heat, than the zone table's wool assumes.
   * Earlier and later periods are left to the zone table: coastal Tupi
   * dress before contact isn't badly served by the pan-continental
   * PREHISTORY/ANTIQUITY entries, and post-1900 dress converges on the
   * same modern wardrobe as the rest of urban Brazil.
   */
  'Atlantic Coast': {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Shirt', material: 'Rough Cotton' },
           { name: 'Cotton Trousers', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Straw' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cord Belt', material: 'Rope' }],
          [{ name: 'Wooden Cross', material: 'Carved Wood' }, NONE],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Dress', material: 'Rough Cotton' },
           { name: 'Cotton Headwrap', material: 'Cotton' }],
          [NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [{ name: 'Glass Beads', material: 'Trade Glass' }, NONE],
          TROPICAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Linen Shirt', material: 'Light Linen', adjectives: ['Portuguese'] },
           { name: 'Cotton Breeches', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Woven Straw' }],
          [{ name: 'Leather Sandals', material: 'Tanned Hide' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Silver Cross', material: 'Colonial Silver' }, { name: 'Tobacco Pouch', material: 'Leather' }],
          TROPICAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Dress', material: 'Fine Cotton', adjectives: ['Portuguese Cut'] },
           { name: 'Lace-trimmed Shawl', material: 'Cotton and Lace' }],
          [{ name: 'Head Scarf', material: 'Cotton' }],
          [{ name: 'Leather Shoes', material: 'Soft Leather' }],
          [{ name: 'Silk Sash', material: 'Imported Silk' }],
          [{ name: 'Pearl Rosary', material: 'Pearl and Silver' }, { name: 'Fan', material: 'Painted Wood and Silk' }],
          TROPICAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Linen Suit', material: 'Fine Linen', adjectives: ['Portuguese'] },
           { name: 'Silk Waistcoat', material: 'Imported Silk' }],
          [{ name: 'Plumed Hat', material: 'Felt and Feathers' }],
          [{ name: 'Buckled Shoes', material: 'Fine Leather' }],
          [{ name: 'Silver Belt', material: 'Engraved Silver' }],
          [{ name: 'Gold Chain', material: 'Brazilian Gold' }, { name: 'Jeweled Snuffbox', material: 'Gold and Enamel' }],
          RENAISSANCE_COLORS,
        ),
        Female: wear(
          [{ name: 'Silk Gown', material: 'Fine Silk', adjectives: ['Lightweight'] },
           { name: 'Lace Mantilla', material: 'Fine Lace' }],
          [{ name: 'Jeweled Comb', material: 'Gold and Pearls' }],
          [{ name: 'Silk Slippers', material: 'Embroidered Silk' }],
          [{ name: 'Golden Chain', material: 'Brazilian Gold' }],
          [{ name: 'Diamond Cross', material: 'Brazilian Diamonds and Gold' }, { name: 'Pearl Earrings', material: 'South Sea Pearls' }],
          RENAISSANCE_COLORS,
        ),
      },
    },
    // Coffee replaces sugar as the export crop inland from São Paulo, and
    // Bahia's Afro-Brazilian population develops its own dress — the
    // baiana's white lace, wide skirt and turban, still worn today in
    // Salvador for both everyday and festival occasions. Offered here as
    // one option, not the region's default.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Cotton Work Shirt', material: 'Rough Cotton' },
           { name: 'Cotton Trousers', material: 'Cotton' }],
          [{ name: 'Straw Hat', material: 'Straw' }, NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Rope Belt', material: 'Hemp Rope' }],
          [NONE],
          INDUSTRIAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Cotton Dress', material: 'Cheap Cotton' },
           { name: 'Cotton Headwrap', material: 'Cotton' }],
          [NONE],
          [{ name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [{ name: 'Glass Bead Necklace', material: 'Trade Glass' }, NONE],
          INDUSTRIAL_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Linen Suit', material: 'Light Linen' },
           { name: 'Cotton Shirt', material: 'White Cotton' }],
          [{ name: 'Straw Boater', material: 'Straw' }],
          [{ name: 'Leather Shoes', material: 'Brown Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Pocket Watch', material: 'Silver' }, NONE],
          INDUSTRIAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Day Dress', material: 'Printed Cotton' },
           { name: 'Baiana Dress', material: 'White Lace and Cotton', adjectives: ['Bahian'] }],
          [{ name: 'Decorated Hat', material: 'Straw and Ribbon' }, { name: 'White Turban', material: 'Cotton' }],
          [{ name: 'T-strap Shoes', material: 'Leather' }],
          [{ name: 'Ribbon Belt', material: 'Silk Ribbon' }],
          [{ name: 'Bead Necklace Strands', material: 'Glass and Coral' }, { name: 'Cameo Brooch', material: 'Carved Shell' }],
          INDUSTRIAL_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Silk Suit', material: 'Imported Silk' },
           { name: 'Coffee Planter Frock Coat', material: 'Fine Wool' }],
          [{ name: 'Top Hat', material: 'Silk' }],
          [{ name: 'Patent Shoes', material: 'Patent Leather' }],
          [{ name: 'Silk Belt', material: 'Woven Silk' }],
          [{ name: 'Gold Watch', material: 'Gold and Diamonds' }, { name: 'Diamond Stickpin', material: 'Gold and Diamonds' }],
          INDUSTRIAL_COLORS,
        ),
        Female: wear(
          [{ name: 'Paris Gown', material: 'Silk and Beads' },
           { name: 'Lace Shawl', material: 'Fine Lace' }],
          [{ name: 'Jeweled Tiara', material: 'Diamonds and Gold' }],
          [{ name: 'Silk Pumps', material: 'Beaded Silk' }],
          [{ name: 'Jeweled Belt', material: 'Gold and Gems' }],
          [{ name: 'Diamond Necklace', material: 'Brazilian Diamonds' }, { name: 'Emerald Ring', material: 'Colombian Emerald' }],
          INDUSTRIAL_COLORS,
        ),
      },
    },
  },

  /**
   * Weighted toward the Pampas grassland — Pampas Grasslands, Paraná
   * Delta, Santa Fe, Córdoba Hills — which is where most of this region's
   * population sits; the Gran Chaco proper and the Pantanal, also filed
   * here, are closer to the lowland-forest pattern above and are left to
   * the zone table. Feral Spanish cattle and horses, loose on the Pampas
   * from the 1580s, are what the gaucho lifeway is built on.
   */
  'Gran Chaco and Pampas': {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      poor: {
        Male: wear(
          [{ name: 'Leather Chiripá', material: 'Rawhide', adjectives: ['Wrapped'] },
           { name: 'Wool Poncho', material: 'Undyed Wool' }],
          [{ name: 'Wide-brim Hat', material: 'Felt' }, NONE],
          [{ name: 'Colt-hide Boots (Botas de Potro)', material: 'Raw Colt Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Leather Belt', material: 'Rawhide' }],
          [{ name: 'Facón Knife', material: 'Steel and Horn' }, NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wool Dress', material: 'Coarse Wool' },
           { name: 'Wool Shawl', material: 'Plain Wool' }],
          [{ name: 'Head Cloth', material: 'Cotton' }, NONE],
          [{ name: 'Leather Sandals', material: 'Rawhide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Wool' }],
          [NONE],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Leather Chiripá', material: 'Tanned Hide' },
           { name: 'Wool Poncho', material: 'Striped Wool' }],
          [{ name: 'Wide-brim Hat', material: 'Felt' }],
          [{ name: 'Leather Boots', material: 'Tanned Leather' }],
          [{ name: 'Tooled Leather Belt', material: 'Leather' }],
          [{ name: 'Facón Knife', material: 'Steel and Silver' }, { name: 'Boleadoras', material: 'Hide and Stone' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Criolla Dress', material: 'Wool and Cotton' },
           { name: 'Wool Shawl', material: 'Dyed Wool' }],
          [{ name: 'Cloth Bonnet', material: 'Cotton' }],
          [{ name: 'Leather Shoes', material: 'Tanned Leather' }],
          [{ name: 'Cloth Sash', material: 'Wool' }],
          [{ name: 'Silver Comb', material: 'Silver' }, { name: 'Glass Beads', material: 'Trade Glass' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Spanish Doublet', material: 'Fine Wool' },
           { name: 'Wool Cloak', material: 'Fine Wool' }],
          [{ name: 'Plumed Hat', material: 'Felt and Feathers' }],
          [{ name: 'Buckled Shoes', material: 'Fine Leather' }],
          [{ name: 'Silver Belt', material: 'Engraved Silver' }],
          [{ name: 'Gold Chain', material: 'Colonial Gold' }, { name: 'Silver Spurs', material: 'Silver' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Wool Gown', material: 'Imported Wool', adjectives: ['Embroidered'] },
           { name: 'Silk-trimmed Shawl', material: 'Silk and Wool' }],
          [{ name: 'Lace Mantilla', material: 'Black Lace' }],
          [{ name: 'Leather Shoes', material: 'Soft Leather' }],
          [{ name: 'Silk Sash', material: 'Imported Silk' }],
          [{ name: 'Pearl Necklace', material: 'Pearl and Silver' }, { name: 'Gold Earrings', material: 'Colonial Gold' }],
          NORTHERN_COLORS,
        ),
      },
    },
    // The gaucho wardrobe reaches its classic, still-recognisable form in
    // this century: the chiripá, the striped poncho, the rastra — a belt
    // studded with silver coins — and the facón knife worn at the back of
    // the sash.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Chiripá', material: 'Wool', adjectives: ['Wrapped'] },
           { name: 'Wool Poncho', material: 'Undyed Wool' }],
          [{ name: 'Wide-brim Hat', material: 'Felt' }],
          [{ name: 'Alpargatas', material: 'Canvas and Rope' }, { name: 'Colt-hide Boots (Botas de Potro)', material: 'Raw Colt Hide' }],
          [{ name: 'Leather Belt', material: 'Rawhide' }],
          [{ name: 'Facón Knife', material: 'Steel and Wood' }, NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Criolla Dress', material: 'Cotton' },
           { name: 'Wool Shawl', material: 'Plain Wool' }],
          [{ name: 'Straw Hat', material: 'Straw' }, NONE],
          [{ name: 'Alpargatas', material: 'Canvas and Rope' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Cloth Belt', material: 'Cotton' }],
          [NONE],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Chiripá', material: 'Fine Wool', adjectives: ['Striped'] },
           { name: 'Striped Poncho', material: 'Patterned Wool' }],
          [{ name: 'Wide-brim Sombrero', material: 'Felt' }],
          [{ name: 'Leather Boots', material: 'Tanned Leather' }],
          [{ name: 'Rastra Belt', material: 'Leather and Silver Coins', adjectives: ['Coin-studded'] }],
          [{ name: 'Facón Knife', material: 'Steel and Silver' }, { name: 'Boleadoras', material: 'Hide and Stone' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Criolla Dress', material: 'Printed Cotton' },
           { name: 'Wool Shawl', material: 'Dyed Wool' }],
          [{ name: 'Straw Hat', material: 'Straw' }, NONE],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Cloth Sash', material: 'Wool' }],
          [{ name: 'Silver Comb', material: 'Silver' }, { name: 'Cameo Brooch', material: 'Carved Shell' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Silk Suit', material: 'Imported Silk' },
           { name: 'Fine Wool Poncho', material: 'Vicuña-blend Wool', adjectives: ['Fine-woven'] }],
          [{ name: 'Top Hat', material: 'Silk' }],
          [{ name: 'Patent Shoes', material: 'Patent Leather' }],
          [{ name: 'Silver Rastra', material: 'Silver and Leather' }],
          [{ name: 'Gold Watch', material: 'Gold and Diamonds' }, { name: 'Silver Mate Set', material: 'Silver and Gourd' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Paris Gown', material: 'Silk and Beads' },
           { name: 'Fur Stole', material: 'Chinchilla' }],
          [{ name: 'Jeweled Tiara', material: 'Diamonds and Gold' }],
          [{ name: 'Silk Pumps', material: 'Beaded Silk' }],
          [{ name: 'Jeweled Belt', material: 'Gold and Gems' }],
          [{ name: 'Diamond Necklace', material: 'Diamonds and Platinum' }, { name: 'Gold Bracelet', material: 'Gold' }],
          NORTHERN_COLORS,
        ),
      },
    },
  },

  /**
   * Only two personas fall here across the four-thousand-run sample, so
   * this covers two eras rather than all of them: the long guanaco-hunting
   * foraging past (Tehuelche/Aonikenk on the mainland steppe, Selk'nam on
   * Tierra del Fuego) and the sheep-ranching contact period from the
   * 1880s. The eras between differ from the first only in degree, not in
   * kind, and aren't worth writing separately for so small a population.
   */
  'Patagonia': {
    [HistoricalEra.PREHISTORY]: {
      poor: {
        Male: wear(
          [{ name: 'Guanaco-hide Robe (Quillango)', material: 'Guanaco Hide', adjectives: ['Fur-lined'] },
           { name: 'Hide Loincloth', material: 'Guanaco Hide' }],
          [NONE],
          [{ name: 'Hide Boots', material: 'Guanaco Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Hide Cord Belt', material: 'Guanaco Sinew' }],
          [{ name: 'Red Ochre Body Paint', material: 'Red Ochre' }, NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Guanaco-hide Robe (Quillango)', material: 'Guanaco Hide', adjectives: ['Fur-lined'] },
           { name: 'Hide Wrap', material: 'Guanaco Hide' }],
          [NONE],
          [{ name: 'Hide Boots', material: 'Guanaco Hide' }, { name: 'Barefoot', material: 'None' }],
          [{ name: 'Hide Cord Belt', material: 'Guanaco Sinew' }],
          [{ name: 'Red Ochre Body Paint', material: 'Red Ochre' }, { name: 'Shell Necklace', material: 'Coastal Shell' }],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Guanaco-hide Quillango', material: 'Guanaco Hide', adjectives: ['Painted Underside'] },
           { name: 'Hide Leggings', material: 'Guanaco Hide' }],
          [{ name: 'Fox-fur Cap', material: 'Fox Fur' }],
          [{ name: 'Hide Boots', material: 'Guanaco Hide' }],
          [{ name: 'Hide Belt', material: 'Guanaco Hide' }],
          [{ name: 'Bone Awl Case', material: 'Bone and Sinew' }, { name: 'Feather Ornament', material: 'Rhea Feathers' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Guanaco-hide Quillango', material: 'Guanaco Hide', adjectives: ['Painted Underside'] },
           { name: 'Hide Apron', material: 'Guanaco Hide' }],
          [{ name: 'Hide Headband', material: 'Guanaco Hide' }],
          [{ name: 'Hide Boots', material: 'Guanaco Hide' }],
          [{ name: 'Hide Belt', material: 'Guanaco Hide' }],
          [{ name: 'Shell Necklace', material: 'Coastal Shell' }, { name: 'Feather Ornament', material: 'Rhea Feathers' }],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Fine Guanaco Quillango', material: 'Softest Guanaco Hide', adjectives: ['Finely Painted'] },
           { name: 'Fox-fur Mantle', material: 'Fox Fur' }],
          [{ name: 'Feather Headband', material: 'Rhea Feathers', adjectives: ['Status'] }],
          [{ name: 'Fine Hide Boots', material: 'Guanaco Hide' }],
          [{ name: 'Decorated Hide Belt', material: 'Guanaco Hide and Shell' }],
          [{ name: 'Silver-grey Fox Pelt', material: 'Fox Fur' }, { name: 'Bone and Shell Necklace', material: 'Bone and Coastal Shell' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Fine Guanaco Quillango', material: 'Softest Guanaco Hide', adjectives: ['Finely Painted'] },
           { name: 'Fox-fur Wrap', material: 'Fox Fur' }],
          [{ name: 'Shell-beaded Headband', material: 'Coastal Shell' }],
          [{ name: 'Fine Hide Boots', material: 'Guanaco Hide' }],
          [{ name: 'Decorated Hide Belt', material: 'Guanaco Hide and Shell' }],
          [{ name: 'Shell Necklace', material: 'Coastal Shell', adjectives: ['Layered'] }, { name: 'Feather Ornament', material: 'Rhea Feathers' }],
          NORTHERN_COLORS,
        ),
      },
    },
    // European sheep-ranching settlement — Welsh from 1865 in Chubut,
    // Scottish and English estancia managers from the 1880s — reaches
    // Patagonia only at the very end of this era's range; guanaco hide
    // gives way to imported wool and manufactured cloth within a
    // generation.
    [HistoricalEra.INDUSTRIAL_ERA]: {
      poor: {
        Male: wear(
          [{ name: 'Wool Work Shirt', material: 'Rough Wool' },
           { name: 'Canvas Trousers', material: 'Heavy Canvas' }],
          [{ name: 'Wool Cap', material: 'Knitted Wool' }, NONE],
          [{ name: 'Leather Boots', material: 'Tanned Leather' }],
          [{ name: 'Leather Belt', material: 'Rawhide' }],
          [NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wool Dress', material: 'Coarse Wool' },
           { name: 'Wool Shawl', material: 'Plain Wool' }],
          [{ name: 'Wool Bonnet', material: 'Wool' }, NONE],
          [{ name: 'Leather Boots', material: 'Leather' }],
          [{ name: 'Cloth Belt', material: 'Wool' }],
          [NONE],
          NORTHERN_COLORS,
        ),
      },
      common: {
        Male: wear(
          [{ name: 'Wool Jacket', material: 'Sheep Wool', adjectives: ['Estancia-issue'] },
           { name: 'Wool Trousers', material: 'Wool' }],
          [{ name: 'Felt Hat', material: 'Felt' }],
          [{ name: 'Leather Boots', material: 'Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Sheep-shears Sheath', material: 'Leather and Steel' }, NONE],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wool Dress', material: 'Fine Wool' },
           { name: 'Knitted Shawl', material: 'Sheep Wool' }],
          [{ name: 'Felt Hat', material: 'Felt' }, NONE],
          [{ name: 'Leather Shoes', material: 'Leather' }],
          [{ name: 'Cloth Sash', material: 'Wool' }],
          [{ name: 'Silver Brooch', material: 'Silver' }, NONE],
          NORTHERN_COLORS,
        ),
      },
      wealthy: {
        Male: wear(
          [{ name: 'Tweed Suit', material: 'Scottish Tweed', adjectives: ['Estancia-owner'] },
           { name: 'Wool Overcoat', material: 'Fine Wool' }],
          [{ name: 'Felt Hat', material: 'Fine Felt' }],
          [{ name: 'Leather Boots', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Tooled Leather' }],
          [{ name: 'Gold Watch', material: 'Gold' }, { name: 'Silver Flask', material: 'Silver' }],
          NORTHERN_COLORS,
        ),
        Female: wear(
          [{ name: 'Wool Traveling Dress', material: 'Fine Wool' },
           { name: 'Fur-trimmed Coat', material: 'Wool and Fox Fur' }],
          [{ name: 'Feathered Hat', material: 'Felt and Feathers' }],
          [{ name: 'Leather Boots', material: 'Fine Leather' }],
          [{ name: 'Leather Belt', material: 'Leather' }],
          [{ name: 'Pearl Brooch', material: 'Pearl and Silver' }, { name: 'Gold Locket', material: 'Gold' }],
          NORTHERN_COLORS,
        ),
      },
    },
  },
};
