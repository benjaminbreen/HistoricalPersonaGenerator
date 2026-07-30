/**
 * portraitLab/devtools/hatSheet.ts
 *
 * Renders one portrait per head covering so a single hat can be worked on
 * without hunting for a persona that happens to be wearing it.
 *
 *   npm run hat-sheet -- out.png
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { CANVAS } from '../spec/anatomy';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = CANVAS;
const SCALE = 4;

interface HatCase {
  label: string;
  name: string;
  material: string;
  color?: string;
  gender?: 'Male' | 'Female';
  hairstyle?: string;
  /** A woven hat's shape is a question about place, so these two are inputs. */
  zone?: string;
  era?: string;
  seedOffset?: number;
}

const HATS: HatCase[] = [
  // The same three words — "Straw Hat", woven from straw — in five places and
  // two centuries. One item is 15% of everything the app puts on a head, so
  // this row is the one that decides how repetitive the whole set looks.
  { label: 'straw-east-asian', name: 'Straw Hat', material: 'Straw', zone: 'EAST_ASIAN', era: 'MEDIEVAL' },
  { label: 'straw-south-asian', name: 'Straw Hat', material: 'Straw', zone: 'SOUTH_ASIAN', era: 'MEDIEVAL' },
  { label: 'straw-european', name: 'Straw Hat', material: 'Straw', zone: 'EUROPEAN', era: 'MEDIEVAL' },
  { label: 'straw-south-american', name: 'Straw Hat', material: 'Straw', zone: 'SOUTH_AMERICAN', era: 'INDUSTRIAL_ERA' },
  { label: 'straw-african', name: 'Straw Hat', material: 'Straw', zone: 'SUB_SAHARAN_AFRICAN', era: 'ANTIQUITY' },
  // Four European field hats on four seeds: the axis that used to not exist.
  { label: 'straw-seed-a', name: 'Straw Hat', material: 'Straw', zone: 'EUROPEAN', era: 'MEDIEVAL', seedOffset: 7 },
  { label: 'straw-seed-b', name: 'Straw Hat', material: 'Straw', zone: 'EUROPEAN', era: 'MEDIEVAL', seedOffset: 991 },
  { label: 'straw-seed-c', name: 'Sun Hat', material: 'Plaited Reed', zone: 'MENA', era: 'ANTIQUITY', seedOffset: 55 },
  { label: 'straw-seed-d', name: 'Palm Hat', material: 'Palm Leaf', zone: 'OCEANIA', era: 'PREHISTORY', seedOffset: 3111 },

  { label: 'bamboo-hat', name: 'Bamboo Hat', material: 'Woven Bamboo', zone: 'EAST_ASIAN' },
  { label: 'douli', name: 'Douli', material: 'Bamboo Strips', zone: 'EAST_ASIAN' },
  { label: 'bamboo-douli', name: 'Bamboo Dou Li', material: 'Split Bamboo', zone: 'EAST_ASIAN' },
  { label: 'salakot', name: 'Salakot', material: 'Rattan and Fibre', zone: 'SOUTH_ASIAN' },
  { label: 'fur-cap', name: 'Fur Cap', material: 'Fur' },
  { label: 'fur-hat', name: 'Fur Hat', material: 'Sable Fur' },
  { label: 'wolf-pelt', name: 'Wolf Pelt', material: 'Wolf Fur' },
  { label: 'felt-cap', name: 'Felt Cap', material: 'Felt' },
  { label: 'wide-brim', name: 'Wide Brimmed Hat', material: 'Felt' },
  { label: 'coif', name: 'Linen Coif', material: 'Linen' },

  // Knitwear. Every one of these used to come out of the same smooth felt
  // dome as the cap above, which is the whole reason for the knit branch.
  { label: 'knit-cap', name: 'Knit Cap', material: 'Llama Wool', color: '#8c3b2e' },
  { label: 'wool-cap', name: 'Wool Cap', material: 'Knitted Wool', color: '#3f5c6b' },
  { label: 'chullo', name: 'Chullo Hat', material: 'Knitted Wool', color: '#7a3f6b' },
  { label: 'beanie', name: 'Beanie', material: 'Knitted Cotton', color: '#4b6b3f' },

  // Wrapped cloth, which is the single commonest covering in the app and used
  // to have exactly one shape for all of it.
  { gender: 'Female', label: 'kerchief', name: 'Kerchief', material: 'Linen', color: '#b8443a' },
  { gender: 'Female', label: 'head-scarf', name: 'Head Scarf', material: 'Cotton', color: '#4a6f8a' },
  { gender: 'Female', label: 'printed-wrap', name: 'Head Wrap', material: 'Printed Cotton', color: '#8a5ea8' },
  { label: 'keffiyeh', name: 'Keffiyeh', material: 'Cotton', color: '#e2ddd0' },
  { gender: 'Female', label: 'gele', name: 'Gele', material: 'Aso Oke', color: '#c08a2c' },
  { label: 'head-cloth', name: 'Head Cloth', material: 'Cotton', color: '#cfc7b4' },
  { label: 'turban', name: 'Turban', material: 'Muslin', color: '#e0dbcc' },
  { label: 'safa', name: 'Rajasthani Safa', material: 'Silk with Kalgi', color: '#c4472e' },

  // Veils. One drawing was serving all of these, which is how a dupatta — a
  // scarf laid loosely over the back of the head with the hairline showing —
  // came out as a wimple.
  { gender: 'Female', label: 'veil-dupatta', name: 'Dupatta', material: 'Chiffon with Border', color: '#a8493a', zone: 'SOUTH_ASIAN' },
  { gender: 'Female', label: 'veil-odhani', name: 'Odhani', material: 'Cotton', color: '#c47a2c', zone: 'SOUTH_ASIAN' },
  { gender: 'Female', label: 'veil-hijab', name: 'Hijab', material: 'Cotton', color: '#3f5c6b', zone: 'MENA' },
  { gender: 'Female', label: 'veil-mantilla', name: 'Lace Mantilla', material: 'Black Lace', color: '#2a2430', zone: 'EUROPEAN' },
  { gender: 'Female', label: 'veil-wimple', name: 'Wimple and Veil', material: 'Linen', color: '#ded6c4', zone: 'EUROPEAN', era: 'MEDIEVAL' },
  { gender: 'Female', label: 'veil-chador', name: 'Chador', material: 'Wool', color: '#3a3038', zone: 'MENA' },

  // The twentieth century. Nine tenths of the app's modern personas wear one
  // of these ten, and until recently five of them shared a single felt bowl.
  { label: 'modern-newsboy', name: 'Newsboy Cap', material: 'Wool Tweed', color: '#8a7a5c', era: 'MODERN_ERA' },
  { label: 'modern-newsboy-seed', name: 'Newsboy Cap', material: 'Wool Tweed', color: '#6b6055', era: 'MODERN_ERA', seedOffset: 881 },
  { label: 'modern-flat-cap', name: 'Flat Cap', material: 'Cotton', color: '#4e5a4a', era: 'MODERN_ERA' },
  { label: 'modern-baseball-cap', name: 'Baseball Cap', material: 'Cotton Twill', color: '#2f4f7a', era: 'MODERN_ERA' },
  { label: 'modern-snapback', name: 'Snapback', material: 'Polyester', color: '#3a3a42', era: 'MODERN_ERA' },
  { label: 'modern-mao-cap', name: 'Mao Cap', material: 'Cotton Drill', color: '#4a5b46', zone: 'EAST_ASIAN', era: 'MODERN_ERA' },
  { label: 'modern-official-cap', name: 'Official Cap', material: 'Wool Serge', color: '#39404f', era: 'MODERN_ERA' },
  { label: 'modern-sun-visor', name: 'Sun Visor', material: 'Plastic', color: '#d8c65a', era: 'MODERN_ERA' },
  { label: 'modern-ushanka', name: 'Ushanka', material: 'Rabbit Fur', color: '#5b4a3a', era: 'MODERN_ERA' },
  { gender: 'Female', label: 'modern-cloche', name: 'Cloche Hat', material: 'Felt', color: '#7a4a55', era: 'MODERN_ERA' },
  { label: 'modern-fedora', name: 'Fedora', material: 'Felt', color: '#5a4a3c', era: 'MODERN_ERA' },
  { label: 'modern-homburg', name: 'Homburg', material: 'Quality Felt', color: '#3b3540', era: 'MODERN_ERA' },

  // Things worn in the hair rather than over it.
  { gender: 'Female', label: 'flower-garland', name: 'Flower Garland', material: 'Fresh Flowers', color: '#c2456b' },
  { gender: 'Female', label: 'jasmine', name: 'Flower Garland', material: 'Fresh Jasmine', color: '#f0ead8' },
  { label: 'laurel', name: 'Laurel Wreath', material: 'Bronze Leaves' },
  { label: 'leaf-band', name: 'Leaf Band', material: 'Woven Leaves' },
  { gender: 'Female', label: 'flower-crown', name: 'Flower Crown', material: 'Fresh Flowers', color: '#d8b23a' },
  { gender: 'Female', label: 'beaded-band', name: 'Beaded Headband', material: 'Turquoise Beads' },
];

function renderOne(hat: HatCase): Raster {
  const character: any = {
    name: `Test ${hat.label}`,
    age: 40,
    gender: hat.gender || 'Male',
    profession: 'Farmer',
    portraitSeed: hat.seedOffset ?? 12345,
    culturalZone: hat.zone,
    era: hat.era,
    appearance: {
      skinColor: '#c98d63',
      hairColor: '#3b2a1d',
      hairstyle: hat.hairstyle,
      hairLength: hat.gender === 'Female' ? 'long' : undefined,
    },
    equippedItems: {
      head: { name: hat.name, material: hat.material, color: hat.color },
      torso: { name: 'Simple Robe', material: 'Wool' },
    },
  };
  const spec = buildPortraitSpec(character);
  const compiled = compilePortrait(spec);
  const target = new Raster(CELL, CELL);
  const state = idleFrame(0, {
    seed: spec.seed,
    resting: restingExpression(spec.mood, spec.condition),
    mood: spec.mood,
    hairMoves: false,
    reducedMotion: true,
  });
  renderFrame(compiled, state, target);
  return target;
}

function main() {
  const outfile = process.argv[2] || 'hat-sheet.png';
  const filter = process.argv[3];
  const cases = filter ? HATS.filter(h => h.label.includes(filter)) : HATS;
  const columns = Math.min(5, cases.length);
  const rows = Math.ceil(cases.length / columns);
  const gap = 4;
  const width = columns * CELL + (columns + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26; out[i * 4 + 1] = 26; out[i * 4 + 2] = 30; out[i * 4 + 3] = 255;
  }

  cases.forEach((hat, index) => {
    const raster = renderOne(hat);
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x0 = gap + col * (CELL + gap);
    const y0 = gap + row * (CELL + gap);
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const src = (y * CELL + x) * 4;
        const dst = ((y0 + y) * width + (x0 + x)) * 4;
        out[dst] = raster.data[src]; out[dst + 1] = raster.data[src + 1];
        out[dst + 2] = raster.data[src + 2]; out[dst + 3] = 255;
      }
    }
  });

  const scale = filter ? 10 : SCALE;
  const scaled = scaleRGBA(out, width, height, scale);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(`wrote ${outfile}  (${cases.map(h => h.label).join(', ')})`);
}

main();
