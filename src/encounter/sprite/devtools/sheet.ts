/**
 * encounter/sprite/devtools/sheet.ts
 *
 * Composing rasters onto a labelled grid, which every sprite devtool was
 * doing for itself with a slightly different copy of the same loop.
 *
 * The ground here is a **flag, not a constant**, and that is the point of
 * pulling it out. Every sheet was baked onto the encounter's warm dark brown,
 * which is the right ground for judging colour in context and the wrong one
 * for judging a silhouette: a dark figure on a dark field hides exactly the
 * edge errors a contact sheet exists to expose. White is the honest ground for
 * shape, dark for colour, and the answer is that both are needed — so it is an
 * argument.
 */

import { Raster } from '../../../components/portraitLab/core/raster';

export type Ground = 'white' | 'dark' | 'grey';

const GROUNDS: Record<Ground, [number, number, number]> = {
  // Not pure white: a figure with a white collar needs *something* to read
  // against, and 246 is still unambiguously paper.
  white: [246, 246, 244],
  dark: [34, 26, 20],
  grey: [128, 128, 128],
};

/** A 5×7 stroke font, enough for labels. Devtools only; nothing ships it. */
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '11110', '10001', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '11110', '10000', '10000', '10000', '11111'],
  F: ['11111', '10000', '11110', '10000', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '11111', '10001', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '11100', '10010', '10010', '10001', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '01110', '00001', '00001', '10001', '01110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '01010', '00100', '00100', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00010', '00100', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['001', '011', '001', '001', '001', '001', '111'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '01110', '10001', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  ':': ['0', '0', '1', '0', '0', '1', '0'],
  '-': ['000', '000', '000', '111', '000', '000', '000'],
  '+': ['000', '010', '010', '111', '010', '010', '000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['01', '10', '10', '10', '10', '10', '01'],
  ')': ['10', '01', '01', '01', '01', '01', '10'],
  '·': ['00', '00', '00', '11', '11', '00', '00'],
};

export class Canvas {
  readonly data: Uint8ClampedArray;

  constructor(readonly width: number, readonly height: number, ground: Ground) {
    this.data = new Uint8ClampedArray(width * height * 4);
    const [r, g, b] = GROUNDS[ground];
    for (let i = 0; i < width * height; i += 1) {
      this.data[i * 4] = r;
      this.data[i * 4 + 1] = g;
      this.data[i * 4 + 2] = b;
      this.data[i * 4 + 3] = 255;
    }
  }

  pixel(x: number, y: number, r: number, g: number, b: number, alpha = 1): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = this.data[i] * (1 - alpha) + r * alpha;
    this.data[i + 1] = this.data[i + 1] * (1 - alpha) + g * alpha;
    this.data[i + 2] = this.data[i + 2] * (1 - alpha) + b * alpha;
    this.data[i + 3] = 255;
  }

  /** Blits a raster's non-transparent pixels at (x0, y0). */
  blit(raster: Raster, x0: number, y0: number): void {
    for (let y = 0; y < raster.height; y += 1) {
      for (let x = 0; x < raster.width; x += 1) {
        const si = (y * raster.width + x) * 4;
        if (raster.data[si + 3] === 0) continue;
        this.pixel(x0 + x, y0 + y, raster.data[si], raster.data[si + 1], raster.data[si + 2]);
      }
    }
  }

  hLine(y: number, x0: number, x1: number, rgb: [number, number, number], alpha = 1, dash = 0): void {
    for (let x = x0; x <= x1; x += 1) {
      if (dash && Math.floor(x / dash) % 2 === 1) continue;
      this.pixel(x, y, rgb[0], rgb[1], rgb[2], alpha);
    }
  }

  vLine(x: number, y0: number, y1: number, rgb: [number, number, number], alpha = 1, dash = 0): void {
    for (let y = y0; y <= y1; y += 1) {
      if (dash && Math.floor(y / dash) % 2 === 1) continue;
      this.pixel(x, y, rgb[0], rgb[1], rgb[2], alpha);
    }
  }

  /** Returns the width the text occupied, so callers can right-align. */
  text(s: string, x0: number, y0: number, rgb: [number, number, number] = [90, 90, 96]): number {
    let x = x0;
    for (const raw of s.toUpperCase()) {
      const glyph = GLYPHS[raw] ?? GLYPHS['·'];
      glyph.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx += 1) {
          if (row[dx] === '1') this.pixel(x + dx, y0 + dy, rgb[0], rgb[1], rgb[2]);
        }
      });
      x += (glyph[0]?.length ?? 3) + 1;
    }
    return x - x0;
  }
}
