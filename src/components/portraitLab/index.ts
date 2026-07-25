/**
 * portraitLab — a second, independent pixel-portrait renderer.
 *
 * Nothing in here imports the original `components/portraits` system except
 * `PortraitSwitch`, whose whole job is to choose between the two. That means
 * the old renderer can keep evolving on its own and neither can break the
 * other.
 *
 * Entry points:
 *   PortraitSwitch          drop-in for <ProceduralPortrait>, honours the toggle
 *   PixelPortrait           the new renderer on its own
 *   PortraitEngineProvider  wraps the app; owns the Cmd+` shortcut
 *   PortraitLab             the side-by-side bench at #portrait-lab
 */

export { default as PixelPortrait } from './PixelPortrait';
export type { PixelPortraitHandle, PixelPortraitProps } from './PixelPortrait';
export { default as PortraitSwitch } from './PortraitSwitch';
export { default as PortraitLab } from './PortraitLab';
export { PortraitEngineProvider, usePortraitEngine } from './usePortraitEngine';
export type { PortraitEngine } from './usePortraitEngine';

export { buildPortraitSpec, restingExpression, normalizeExpression } from './spec/buildSpec';
export type { PortraitSource } from './spec/buildSpec';
export { compilePortrait, renderFrame } from './render/pipeline';
export { idleFrame } from './render/animation';
export { allFixtures, sheets } from './fixtures';
export type { Fixture } from './fixtures';
