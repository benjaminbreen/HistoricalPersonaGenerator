/**
 * portraitLab/devtools/png.ts
 *
 * A minimal PNG encoder, Node only. It exists so the art can be rendered and
 * *looked at* from the command line while iterating, rather than only inside a
 * browser — which is how you catch a nose that is two pixels too low.
 */

import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Nearest-neighbour upscale, so pixels stay pixels in the exported sheet. */
export function scaleRGBA(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  factor: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const w = width * factor;
  const h = height * factor;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    const sy = Math.floor(y / factor);
    for (let x = 0; x < w; x += 1) {
      const sx = Math.floor(x / factor);
      const si = (sy * width + sx) * 4;
      const ti = (y * w + x) * 4;
      out[ti] = data[si];
      out[ti + 1] = data[si + 1];
      out[ti + 2] = data[si + 2];
      out[ti + 3] = data[si + 3];
    }
  }
  return { data: out, width: w, height: h };
}

export function encodePNG(data: Uint8ClampedArray, width: number, height: number): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < width * 4; x += 1) {
      raw[y * (width * 4 + 1) + 1 + x] = data[y * width * 4 + x];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
