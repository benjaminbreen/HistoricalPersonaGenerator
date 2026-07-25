/**
 * portraitLab/render/context.ts
 *
 * The bundle every art module receives. Keeping this one shape means an art
 * file never reaches back into the app, and a new feature can be added without
 * changing a single function signature elsewhere.
 */

import { Raster, RampBook } from '../core/raster';
import { PaintTable } from '../core/stamp';
import { Anatomy } from '../spec/anatomy';
import { PortraitSpec } from '../spec/types';
import { PortraitRamps } from '../art/palette';

export interface RenderContext {
  raster: Raster;
  spec: PortraitSpec;
  anatomy: Anatomy;
  ramps: PortraitRamps;
  book: RampBook;
  /** The shared relative-shading table: `-`, `=`, `+`, `^`, `~`, `#`. */
  skin: PaintTable;
  seed: number;
}

/** Swap the target raster while keeping everything else — used per layer pass. */
export function withRaster(context: RenderContext, raster: Raster): RenderContext {
  return { ...context, raster };
}
