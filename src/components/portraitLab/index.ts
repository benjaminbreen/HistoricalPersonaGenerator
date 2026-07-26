/**
 * portraitLab/index.ts
 *
 * The pixel portrait engine. This was originally a second renderer living
 * beside the app's SVG-based `components/portraits` system so the two could be
 * compared; that system has since been removed and this is the only one.
 *
 *   PixelPortrait           the portrait component used throughout the app
 *   PortraitLab             a contact sheet of fixtures, at #portrait-lab
 *   buildPortraitSpec       the adapter from the app's character model
 */

export { default as PixelPortrait } from './PixelPortrait';
export { default as PortraitLab } from './PortraitLab';
export { buildPortraitSpec } from './spec/buildSpec';
export type { PortraitSource } from './spec/buildSpec';
