/**
 * encounter/sprite/SpriteTunerPanel.tsx
 *
 * The proportion workbench (Shift+1). Renders a live sprite from the app's
 * real generator and exposes every skeleton measurement as a slider, so a
 * human eye can converge the figure on the mockup faster than any amount of
 * unsupervised iteration. "Copy JSON" exports the tuned numbers.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateHistoricalPersona } from '../../services/personaGenerator';
import type { GarmentKind } from '../../components/portraitLab/spec/types';
import { buildSpriteSource } from './spriteSource';
import { compileSprite, FrameId } from './drawSprite';
import {
  DEFAULT_TUNING, getTuning, resetTuning, setTuning, SpriteTuning, subscribeTuning,
  SPRITE_H, SPRITE_W,
} from './skeleton';
import '../encounter.css';

type NumericKey = keyof SpriteTuning;

type SliderDef = [NumericKey, string, number, number, number];

// Ranges are for the 128×160 grid. Face-shape sliders (eye size, brow length,
// nose length, jaw and cheek shading) are gone: at an 18px head those are not
// continuous quantities but whole-pixel decisions, and spriteHead.ts derives
// every one of them from the persona's own spec instead.
const SLIDER_GROUPS: Array<[string, SliderDef[]]> = [
  ['Perspective — the 3/4 turn', [
    ['shoulderAsym', 'Shoulder asym', -6, 8, 1],
    ['shoulderDrop', 'Near shldr drop', 0, 5, 1],
    ['torsoSkew', 'Torso skew', -6, 8, 1],
    ['hipSkew', 'Hip skew', -6, 8, 1],
    ['farArmTuck', 'Far arm tuck', 0, 8, 1],
    ['strideX', 'Stride lead', 0, 8, 1],
    ['footStagger', 'Foot depth', 0, 6, 1],
    ['footToe', 'Foot angle (toe)', 0, 12, 1],
    ['footSplay', 'Near foot width', 0, 5, 1],
    ['faceShift', 'Face turn', -3, 3, 1],
    ['lean', 'Figure lean', -3, 6, 1],
    ['stoop', 'Posture (stoop)', -5, 10, 1],
  ]],
  ['Structure', [
    ['figureTop', 'Crown Y', 0, 30, 1],
    ['headW', 'Head width', 9, 22, 1],
    ['headH', 'Head height', 12, 30, 1],
    ['neckH', 'Neck height', 2, 10, 1],
    ['neckW', 'Neck width', 4, 12, 1],
    ['shoulderHalf', 'Shoulder ½', 10, 28, 1],
    ['waistHalf', 'Waist ½', 7, 22, 1],
    ['hipHalf', 'Hip ½', 8, 24, 1],
    ['torsoLen', 'Torso length', 20, 46, 1],
    ['hipDrop', 'Waist→hip', 4, 20, 1],
    ['legLen', 'Leg length', 40, 88, 1],
    ['shoulderSlope', 'Trapezius slope', 0, 8, 1],
    ['legW', 'Leg width', 4, 14, 1],
    ['legGap', 'Leg gap', 0, 8, 1],
    ['armW', 'Arm width', 4, 12, 1],
    ['handDrop', 'Hand drop', 0, 0.6, 0.01],
  ]],
  ['Head furniture', [
    ['hairY', 'Hair Y', -6, 6, 1],
    ['hatY', 'Hat Y', -6, 6, 1],
  ]],
  ['Face placement', [
    ['eyeDy', 'Eyes Y', -4, 4, 1],
    ['eyeGap', 'Eye gap', -3, 4, 1],
    ['browDy', 'Brows Y', -3, 3, 1],
    ['mouthDy', 'Mouth Y', -3, 4, 1],
  ]],
  ['Lighting — one lamp for the figure', [
    ['lightDir', 'Light azimuth', -3, 3, 1],
    ['lightHeight', 'Light height', 0, 3, 1],
    ['lightStrength', 'Shading gain', 0, 3, 1],
    ['ambient', 'Ambient fill', 0, 3, 1],
    ['rim', 'Rim light', 0, 3, 1],
  ]],
  ['Ink & shadow', [
    ['outline', 'Outline (0-2)', 0, 2, 1],
    ['inkWeight', 'Shadow-side weight', 0, 2, 1],
    ['contactShade', 'Occlusion', 0, 6, 1],
    ['groundShadow', 'Ground shadow', 0, 3, 1],
  ]],
  ['Garment & feet', [
    ['tunicHem', 'Tunic hem', 0.1, 0.9, 0.01],
    ['coatHem', 'Coat hem', 0.1, 0.9, 0.01],
    ['robeLift', 'Robe lift', 0, 14, 1],
    ['robeHemHalf', 'Robe hem ½', 14, 40, 1],
    ['textureAmt', 'Fabric weave', 0, 3, 1],
    ['foldStrength', 'Fold depth', 0, 3, 1],
    ['foldCount', 'Fold count', 1, 5, 1],
    ['drapeSway', 'Drape sway', 0, 3, 1],
    ['clothWeight', 'Cloth weight', 0, 3, 1],
    ['hemBreak', 'Hem break', 0, 3, 1],
    ['hemLine', 'Hem weight', 0, 2, 1],
    ['shoeH', 'Shoe height', 3, 14, 1],
    ['shoeLen', 'Shoe length', 8, 24, 1],
  ]],
];

const POSES: FrameId[] = [
  'stand', 'standBreathe', 'talk', 'blink', 'glance',
  'bowLight', 'bowDeep', 'reach', 'raise', 'offer',
];
const GARMENTS: Array<GarmentKind | 'auto'> = [
  'auto', 'tunic', 'robe', 'gown', 'doublet', 'work_shirt', 'wrapped_garment', 'jacket', 'bare',
];

export default function SpriteTunerPanel({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [pose, setPose] = useState<FrameId>('stand');
  const [garment, setGarment] = useState<GarmentKind | 'auto'>('auto');
  const [flip, setFlip] = useState(false);
  const [, bump] = useState(0);

  useEffect(() => subscribeTuning(() => bump((v) => v + 1)), []);

  const persona = useMemo(() => generateHistoricalPersona({ seed }), [seed]);

  const compiled = useMemo(() => {
    const source = buildSpriteSource(persona.character);
    if (garment !== 'auto') source.spec.garment.kind = garment;
    return compileSprite(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, garment, getTuning()]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const raster = compiled.frame(pose);
    const image = new ImageData(new Uint8ClampedArray(raster.data), raster.width, raster.height);
    const off = document.createElement('canvas');
    off.width = raster.width;
    off.height = raster.height;
    off.getContext('2d')!.putImageData(image, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (flip) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, [compiled, pose, flip]);

  const copyJson = useCallback(() => {
    const current = getTuning();
    const diff: Record<string, number> = {};
    (Object.keys(current) as NumericKey[]).forEach((key) => {
      if (current[key] !== DEFAULT_TUNING[key]) diff[key] = current[key];
    });
    const payload = JSON.stringify({ tuning: current, changedFromDefault: diff }, null, 2);
    navigator.clipboard?.writeText(payload).catch(() => {});
  }, []);

  const t = getTuning();

  return (
    <aside className="sprite-tuner" role="dialog" aria-label="Sprite tuner">
      <header className="sprite-tuner-head">
        <strong>Sprite Tuner</strong>
        <span className="sprite-tuner-hint">Shift+1 to close</span>
        <button onClick={onClose} aria-label="Close tuner">✕</button>
      </header>

      <div className="sprite-tuner-stage">
        <canvas
          ref={canvasRef}
          width={SPRITE_W * 1.25}
          height={SPRITE_H * 1.25}
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="sprite-tuner-meta">
          <div><strong>{persona.character.name}</strong></div>
          <div>{persona.character.profession} · {persona.location}</div>
          <div>{persona.character.gender} · {persona.character.age} · {persona.character.wealthLevel}</div>
          <div className="sprite-tuner-garment">{persona.character.equippedItems?.torso?.name ?? 'no torso item'}</div>
        </div>
      </div>

      <div className="sprite-tuner-controls">
        <button onClick={() => setSeed(Math.floor(Math.random() * 1e6))}>⟳ New persona</button>
        <select value={pose} onChange={(e) => setPose(e.target.value as FrameId)}>
          {POSES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={garment} onChange={(e) => setGarment(e.target.value as GarmentKind | 'auto')}>
          {GARMENTS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="sprite-tuner-flip">
          <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} /> flip
        </label>
      </div>

      <div className="sprite-tuner-sliders">
        {SLIDER_GROUPS.map(([groupLabel, sliders]) => (
          <React.Fragment key={groupLabel}>
            <div className="sprite-tuner-group">{groupLabel}</div>
            {sliders.map(([key, label, min, max, step]) => (
              <label key={key} className="sprite-tuner-slider">
                <span className="slider-label">{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={t[key]}
                  onChange={(e) => setTuning({ [key]: Number(e.target.value) })}
                />
                <span className="slider-value">{step < 1 ? t[key].toFixed(2) : t[key]}</span>
              </label>
            ))}
          </React.Fragment>
        ))}
      </div>

      <footer className="sprite-tuner-foot">
        <button onClick={() => resetTuning()}>Reset defaults</button>
        <button onClick={copyJson}>Copy JSON</button>
      </footer>
    </aside>
  );
}
