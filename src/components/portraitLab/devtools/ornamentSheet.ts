/**
 * portraitLab/devtools/ornamentSheet.ts
 *
 * Every ornament primitive against every material it can be made of.
 *
 * The cast is real item names lifted out of `clothing.ts`, not invented ones,
 * so this sheet tests the classifier and the drawing together: if a Kingfisher-
 * Feather Hair Ornament comes back as a plain gilt pin, the keyword table is
 * what is wrong, and the sheet says so without anyone having to read the regex.
 *
 *   npm run ornament-sheet -- out.png
 *   npm run ornament-sheet -- feather.png feather   # one primitive, zoomed
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { CANVAS } from '../spec/anatomy';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = CANVAS;

interface Piece { label: string; name: string; material: string; wealth?: string }

/**
 * Real entries, chosen to cover every primitive and every interesting material.
 * The first is the one that started all this.
 */
const PIECES: Piece[] = [
  { label: 'kingfisher', name: 'Kingfisher-Feather Hair Ornament', material: 'Gilt Silver and Feather', wealth: 'noble' },
  { label: 'gilt-hairpin', name: 'Gilt Hairpin Set', material: 'Gilt Silver', wealth: 'wealthy' },
  { label: 'jade-comb', name: 'Jade Hair Comb', material: 'Nephrite Jade', wealth: 'wealthy' },
  { label: 'pearl-strand', name: 'Pearl Hair Strands', material: 'Pearl and Silver', wealth: 'noble' },
  { label: 'ostrich-plume', name: 'Ostrich Plume Headdress', material: 'Ostrich Feathers', wealth: 'noble' },

  { label: 'peacock', name: 'Peacock Feather Headdress', material: 'Peacock Feathers', wealth: 'wealthy' },
  { label: 'coral-pin', name: 'Coral Stickpin', material: 'Coral and Gold', wealth: 'comfortable' },
  { label: 'amber-brooch', name: 'Amber Brooch', material: 'Amber and Bronze', wealth: 'comfortable' },
  { label: 'turquoise', name: 'Turquoise Inlaid Ornament', material: 'Turquoise and Silver', wealth: 'wealthy' },
  { label: 'lapis-medallion', name: 'Lapis Medallion', material: 'Lapis Lazuli and Gold', wealth: 'noble' },

  { label: 'flower', name: 'Fresh Jasmine Flowers', material: 'Flowers', wealth: 'poor' },
  { label: 'cowrie', name: 'Cowrie Shell Headband', material: 'Cowrie Shell', wealth: 'modest' },
  { label: 'bone-comb', name: 'Bone Comb', material: 'Bone', wealth: 'poor' },
  { label: 'ruby-diadem', name: 'Ruby-Set Diadem', material: 'Gold and Ruby', wealth: 'noble' },
  { label: 'plain-fillet', name: 'Plain Linen Fillet', material: 'Linen', wealth: 'poor' },

  // The same primitive under a cap and a turban, to prove ornaments sit on top
  // of whatever covering they land on rather than under it.
  { label: 'plumed-cap', name: 'Felt Cap with Feather', material: 'Felt and Feather', wealth: 'comfortable' },
  { label: 'jewelled-turban', name: 'Turban with Gold Ornament', material: 'Silk and Gold', wealth: 'noble' },
  { label: 'gem-crown', name: 'Jewelled Crown', material: 'Gold and Gems', wealth: 'noble' },
  { label: 'silver-pin', name: 'Silver Bodkin', material: 'Silver', wealth: 'modest' },
  { label: 'no-ornament', name: 'Wool Cap', material: 'Wool', wealth: 'poor' },
];

function renderOne(piece: Piece, index: number): Raster {
  const spec = buildPortraitSpec({
    name: piece.label,
    age: 30,
    gender: 'Female',
    wealthLevel: piece.wealth || 'comfortable',
    portraitSeed: 5150 + index * 13,
    appearance: {
      skinColor: '#caa07c',
      hairColor: '#2b2118',
      hairLength: 'long',
      hairstyle: 'gathered_bun',
      facialHairStyle: 'none',
    },
    equippedItems: {
      head: { name: piece.name, material: piece.material },
      torso: { name: 'Silk Gown', material: 'Silk' },
    },
  } as any);
  spec.facialHair = null;
  const compiled = compilePortrait(spec);
  const target = new Raster(CELL, CELL);
  renderFrame(compiled, idleFrame(0, {
    seed: spec.seed,
    resting: restingExpression(spec.mood, spec.condition),
    mood: spec.mood,
    hairMoves: false,
    reducedMotion: true,
  }), target);
  return target;
}

function main() {
  const outfile = process.argv[2] || 'ornament-sheet.png';
  const filter = process.argv[3];
  const cases = filter
    ? PIECES.filter(p => p.label.includes(filter) || p.name.toLowerCase().includes(filter.toLowerCase()))
    : PIECES;
  if (!cases.length) {
    console.log(`no ornament case matches "${filter}"`);
    return;
  }

  const cols = Math.min(5, cases.length);
  const rows = Math.ceil(cases.length / cols);
  const gap = 4;
  const width = cols * CELL + (cols + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26; out[i * 4 + 1] = 26; out[i * 4 + 2] = 30; out[i * 4 + 3] = 255;
  }

  cases.forEach((piece, index) => {
    const raster = renderOne(piece, index);
    const cx = gap + (index % cols) * (CELL + gap);
    const cy = gap + Math.floor(index / cols) * (CELL + gap);
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const s = (y * CELL + x) * 4;
        const d = ((cy + y) * width + (cx + x)) * 4;
        out[d] = raster.data[s]; out[d + 1] = raster.data[s + 1];
        out[d + 2] = raster.data[s + 2]; out[d + 3] = 255;
      }
    }
  });

  const scale = Number(process.argv[4]) || (filter ? 9 : 5);
  const scaled = scaleRGBA(out, width, height, scale);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(`wrote ${outfile} — ${cases.map(c => c.label).join(', ')}`);
}

main();
