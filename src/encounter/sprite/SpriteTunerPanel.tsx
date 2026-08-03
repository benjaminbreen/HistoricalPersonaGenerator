/**
 * encounter/sprite/SpriteTunerPanel.tsx
 *
 * The proportion workbench (Shift+1), in three modes.
 *
 *  · **Single** — one figure, every measurement on a slider, so a human eye can
 *    converge the proportions on the mockup faster than any amount of
 *    unsupervised iteration.
 *  · **Play** — the same figure running the real animation timeline from
 *    `anim.ts`, which is the only way to judge a joint. A pose sheet shows
 *    where a limb *is*; whether a bend reads as a bend is a question about
 *    motion and cannot be answered from a still.
 *  · **Grid** — up to twenty-five figures at once, drawn from the whole
 *    generator or filtered to one category. Almost every fault worth fixing
 *    here is a fault of *variety*: forty personas that each look fine alone
 *    and identical together. One sprite at a time cannot show that, and it was
 *    all this panel could show.
 *
 * The subject is either the persona the app is currently displaying — so a
 * figure that looks wrong on the card can be opened and taken apart directly,
 * which previously meant re-rolling random seeds until a similar one turned up
 * — or a random draw. "Copy JSON" exports the tuned numbers.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateHistoricalPersona, HistoricalPersona } from '../../services/personaGenerator';
import type { GarmentKind } from '../../components/portraitLab/spec/types';
import { Raster } from '../../components/portraitLab/core/raster';
import { buildSpriteSource, SpriteSource } from './spriteSource';
import { compileSprite, CompiledSprite, FrameId } from './drawSprite';
import { readShape } from './construction';
import {
  ALL_ANIMS, animFrame, ANIM_MS, idleClock, idlePose, idleSway, SpriteAnim,
} from './anim';
import {
  DEFAULT_TUNING, getTuning, resetTuning, setTuning, SpriteTuning, subscribeTuning,
  SPRITE_H, SPRITE_W,
} from './skeleton';
import '../encounter.css';

type NumericKey = keyof SpriteTuning;

type SliderDef = [NumericKey, string, number, number, number];

/**
 * Ranges are for the current 220×330 grid.
 *
 * They matter more than they look. Several sliders previously topped out *at*
 * their own default — `legLen` maxed at 88 with a default of 88 — so dragging
 * them did nothing in one direction and the panel appeared broken. A range
 * that cannot straddle its default is a bug, not a preference, so every one
 * here brackets its value with room on both sides.
 *
 * Face-shape sliders (eye size, brow length, nose length, jaw and cheek
 * shading) are deliberately absent: at this head size those are whole-pixel
 * decisions rather than continuous quantities, and `spriteHead.ts` derives
 * each from the persona's own spec.
 */
const SLIDER_GROUPS: Array<[string, SliderDef[]]> = [
  ['Joints & motion — the animation lives here', [
    ['upperArmLen', 'Upper arm length', 0.4, 0.9, 0.01],
    ['foreArmRatio', 'Forearm : upper', 0.6, 1.3, 0.01],
    ['elbowRest', 'Resting elbow bend', 0, 25, 1],
    ['armSwing', 'Arm clearance', 0, 25, 1],
    ['wristBend', 'Wrist bend', -35, 35, 1],
    ['kneeHigh', 'Knee height', 0.35, 0.65, 0.01],
    ['kneeLead', 'Knee lead', 0, 2, 0.05],
    ['spineCarry', 'Spine carry', 0, 0.6, 0.02],
    ['headCounter', 'Head counter-turn', 0, 1, 0.05],
    ['motionScale', 'Motion amplitude', 0, 2, 0.05],
    ['stoop', 'Posture (stoop)', -6, 12, 1],
    ['lean', 'Figure lean', -6, 6, 1],
  ]],
  ['Hands', [
    ['handSize', 'Hand size', 0.15, 0.5, 0.01],
    ['handLong', 'Hand length : width', 0.8, 2, 0.05],
    ['fingerSplit', 'Finger separation', 0, 4, 1],
    ['handDrop', 'Hand drop', 0, 0.6, 0.01],
  ]],
  ['Perspective — the 3/4 turn', [
    ['shoulderAsym', 'Shoulder asym', -10, 10, 1],
    ['shoulderDrop', 'Near shldr drop', 0, 8, 1],
    ['torsoSkew', 'Torso skew', -8, 8, 1],
    ['hipSkew', 'Hip skew', -8, 8, 1],
    ['farArmTuck', 'Far arm tuck', 0, 10, 1],
    ['strideX', 'Stride lead', 0, 14, 1],
    ['footStagger', 'Foot depth', 0, 8, 1],
    ['footToe', 'Foot angle (toe)', 0, 20, 1],
    ['footSplay', 'Near foot width', 0, 6, 1],
    ['faceShift', 'Face turn', -4, 4, 1],
  ]],
  ['Structure', [
    ['figureTop', 'Crown nudge', -20, 20, 1],
    ['headW', 'Head width', 14, 34, 1],
    ['headH', 'Head height', 20, 46, 1],
    ['neckH', 'Neck height', 3, 16, 1],
    ['neckW', 'Neck width', 6, 20, 1],
    ['shoulderHalf', 'Shoulder ½', 16, 40, 1],
    ['waistHalf', 'Waist ½', 10, 30, 1],
    ['hipHalf', 'Hip ½', 12, 34, 1],
    ['torsoLen', 'Torso length', 26, 66, 1],
    ['hipDrop', 'Waist→hip', 4, 30, 1],
    ['legLen', 'Leg length', 55, 130, 1],
    ['shoulderSlope', 'Trapezius slope', 0, 16, 1],
    ['legW', 'Leg width', 7, 26, 1],
    ['legGap', 'Leg gap', 0, 10, 1],
    ['armW', 'Arm width', 5, 20, 1],
  ]],
  ['Head furniture', [
    ['hairY', 'Hair Y', -8, 8, 1],
    ['hatY', 'Hat Y', -8, 8, 1],
  ]],
  ['Face placement', [
    ['cheekLine', 'Cheekbone (-1 auto)', -1, 4, 1],
    ['eyeDy', 'Eyes Y', -5, 5, 1],
    ['eyeGap', 'Eye gap', -4, 5, 1],
    ['browDy', 'Brows Y', -4, 4, 1],
    ['mouthDy', 'Mouth Y', -4, 5, 1],
  ]],
  ['Lighting — one lamp for the figure', [
    ['lightDir', 'Light azimuth', -3, 3, 1],
    ['lightHeight', 'Light height', 0, 3, 1],
    ['lightStrength', 'Shading gain', 0, 5, 1],
    ['ambient', 'Ambient fill', 0, 3, 1],
    ['rim', 'Rim light', 0, 3, 1],
  ]],
  ['Ink & shadow', [
    ['clothContrast', 'Cloth tonal range', 1, 2, 0.05],
    ['outline', 'Outline (0-2)', 0, 2, 1],
    ['inkWeight', 'Interior shade line', 0, 5, 1],
    ['contactShade', 'Occlusion', 0, 6, 1],
    ['groundShadow', 'Ground shadow', 0, 3, 1],
  ]],
  ['Garment & feet', [
    ['tunicHem', 'Tunic hem', 0.1, 0.95, 0.01],
    ['coatHem', 'Coat hem', 0.1, 0.95, 0.01],
    ['robeLift', 'Robe lift', 0, 20, 1],
    ['robeHemHalf', 'Robe hem ½', 18, 56, 1],
    ['textureAmt', 'Fabric weave', 0, 3, 1],
    ['foldStrength', 'Fold depth', 0, 3, 1],
    ['foldCount', 'Fold count', 0, 6, 1],
    ['drapeSway', 'Drape sway', 0, 3, 1],
    ['clothWeight', 'Cloth weight', 0, 3, 1],
    ['hemBreak', 'Hem break', 0, 3, 1],
    ['hemLine', 'Hem weight', 0, 3, 1],
    ['shoeH', 'Shoe height', 4, 20, 1],
    ['shoeLen', 'Shoe length', 12, 36, 1],
    ['armGap', 'Sleeve/body gap', 0, 4, 1],
  ]],
];

const POSES: FrameId[] = [
  'stand', 'standBreathe', 'talk', 'blink', 'glance',
  'bowLight', 'bowDeep', 'reach', 'raise', 'offer',
  'stepFwd', 'stepBack', 'lunge', 'recoil', 'crouch', 'shrug', 'fallen',
];
const GARMENTS: Array<GarmentKind | 'auto'> = [
  'auto', 'tunic', 'robe', 'gown', 'doublet', 'work_shirt', 'wrapped_garment', 'jacket', 'bare',
];

/**
 * The categories the grid can be filtered to.
 *
 * Chosen for what actually goes wrong rather than for completeness: bare
 * chests and midriffs because that is where the renderer has the least cloth
 * to hide behind, the two genders because their silhouettes are built from
 * different numbers, and the extremes of build because the stature system is
 * where a crowd stops looking like one body at three sizes. Every value is
 * matched against the same haystack the pose sheet uses.
 */
const CATEGORIES: Array<[string, string]> = [
  ['any', 'Everyone'],
  ['barechest', 'Bare chest'],
  ['baremidriff', 'Bare midriff'],
  ['female', 'Women'],
  ['male', 'Men'],
  ['robe', 'Robes'],
  ['tunic', 'Tunics'],
  ['trousered', 'Trousers'],
  ['heavy', 'Heavy build'],
  ['slight', 'Slight build'],
  ['boot', 'Booted'],
  ['foot-bare', 'Barefoot'],
];

type Mode = 'single' | 'grid';
type Subject = 'featured' | 'random';

/** Everything the grid filter may match on, as one lower-case string. */
function haystack(source: SpriteSource): string {
  const g = source.spec.garment;
  const shape = readShape(source.spec, source.extras.worn?.name ?? '');
  return [
    g.kind, g.name, g.material, source.spec.gender, source.spec.build,
    `foot-${source.extras.footwear}`, shape.construction,
    shape.bareChest ? 'barechest' : '', shape.bareMidriff ? 'baremidriff' : '',
  ].join(' ').toLowerCase();
}

/** Paints one raster into a 2D context at (x, y), via an offscreen canvas. */
function blit(ctx: CanvasRenderingContext2D, raster: Raster, x: number, y: number): void {
  const off = document.createElement('canvas');
  off.width = raster.width;
  off.height = raster.height;
  off.getContext('2d')!.putImageData(
    new ImageData(new Uint8ClampedArray(raster.data), raster.width, raster.height), 0, 0,
  );
  ctx.drawImage(off, x, y);
}

export default function SpriteTunerPanel(
  { onClose, featured }: { onClose: () => void; featured?: HistoricalPersona | null }
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<HTMLCanvasElement | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [subject, setSubject] = useState<Subject>(featured ? 'featured' : 'random');
  const [mode, setMode] = useState<Mode>('single');
  const [pose, setPose] = useState<FrameId>('stand');
  const [garment, setGarment] = useState<GarmentKind | 'auto'>('auto');
  const [flip, setFlip] = useState(false);
  const [playing, setPlaying] = useState<SpriteAnim | 'idle' | null>(null);
  const [gridSide, setGridSide] = useState(4);
  const [category, setCategory] = useState('any');
  const [gridSeed, setGridSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [, bump] = useState(0);

  useEffect(() => subscribeTuning(() => bump((v) => v + 1)), []);

  // The featured persona is only available when the app is showing one; the
  // selector falls back rather than rendering an empty stage.
  const usingFeatured = subject === 'featured' && !!featured;
  const persona = useMemo(
    () => (usingFeatured ? featured! : generateHistoricalPersona({ seed })),
    [usingFeatured, featured, seed],
  );

  const compiled = useMemo(() => {
    const source = buildSpriteSource(persona.character);
    if (garment !== 'auto') source.spec.garment.kind = garment;
    return compileSprite(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, garment, getTuning()]);

  // --- The grid. -----------------------------------------------------------
  //
  // Compiled eagerly on a filter change, which costs a beat at 5×5 and is
  // still the cheapest way to see twenty-five figures. The seed walk is
  // bounded: a category with no members returns what it found rather than
  // spinning.
  const gridCells = useMemo(() => {
    if (mode !== 'grid') return [];
    const want = gridSide * gridSide;
    // The *generator* seed is carried alongside, not the spec's: clicking a
    // cell has to be able to reproduce that exact persona, and only the seed
    // it was generated from will do that.
    const out: Array<{ persona: HistoricalPersona; compiled: CompiledSprite; seed: number }> = [];
    for (let i = 0; i < want * 60 && out.length < want; i += 1) {
      const cellSeed = gridSeed + i * 7919;
      const p = generateHistoricalPersona({ seed: cellSeed });
      const source = buildSpriteSource(p.character);
      if (category !== 'any' && !haystack(source).includes(category)) continue;
      out.push({ persona: p, compiled: compileSprite(source), seed: cellSeed });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, gridSide, category, gridSeed, getTuning()]);

  /**
   * One crop for the whole grid, taken from the tallest figure in it.
   *
   * Per-figure crops would let each cell shrink to its own contents, and that
   * is the wrong trade: cropping each separately puts them on *different*
   * ground lines, and a grid whose whole purpose is comparing builds must
   * stand them all on the same floor. So the shortest common sky is trimmed
   * and the rest is left, which is also what keeps the click-to-open maths a
   * single division.
   */
  const gridTop = gridCells.length
    ? Math.min(...gridCells.map((c) => c.compiled.contentTop))
    : 0;
  const gridCellH = SPRITE_H - gridTop;

  useEffect(() => {
    const canvas = gridRef.current;
    if (!canvas || mode !== 'grid') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gridCells.forEach((cell, i) => {
      const col = i % gridSide;
      const row = Math.floor(i / gridSide);
      blit(ctx, cell.compiled.frame('stand'), col * SPRITE_W, row * gridCellH - gridTop);
    });
  }, [gridCells, gridSide, mode, gridTop, gridCellH]);

  /** Clicking a grid cell opens that persona in the single view. */
  const pickFromGrid = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gridRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const col = Math.floor(((e.clientX - box.left) / box.width) * gridSide);
    const row = Math.floor(((e.clientY - box.top) / box.height) * gridSide);
    const cell = gridCells[row * gridSide + col];
    if (!cell) return;
    setSeed(cell.seed);
    setSubject('random');
    setMode('single');
  }, [gridCells, gridSide]);

  // --- The single stage, still or playing. ---------------------------------
  useEffect(() => {
    if (mode !== 'single') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const paint = (raster: Raster, dx: number, dy: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (flip) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.scale(canvas.width / SPRITE_W, canvas.height / SPRITE_H);
      blit(ctx, raster, dx, dy);
      ctx.restore();
    };

    if (!playing) {
      paint(compiled.frame(pose), 0, 0);
      return;
    }

    // Playback runs the *same* envelope the encounter plays — importing the
    // timeline rather than approximating it is the only way this stage is
    // evidence about anything.
    const clock = idleClock(compiled.seed);
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = now - started;
      if (playing === 'idle') {
        const p = idlePose(clock, t, false);
        paint(compiled.frame(p), idleSway(clock, t, p), 0);
      } else {
        const cycle = t % (ANIM_MS[playing] + 500);
        const f = animFrame(playing, cycle);
        paint(compiled.frame(f?.pose ?? 'stand'), f?.dx ?? 0, f?.dy ?? 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [compiled, pose, flip, playing, mode]);

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
    <aside
      className={`sprite-tuner${mode === 'grid' ? ' sprite-tuner--wide' : ''}`}
      role="dialog"
      aria-label="Sprite tuner"
    >
      <header className="sprite-tuner-head">
        <strong>Sprite Tuner</strong>
        <span className="sprite-tuner-hint">Shift+1 to close</span>
        <button onClick={onClose} aria-label="Close tuner">✕</button>
      </header>

      <div className="sprite-tuner-modes">
        <button
          className={mode === 'single' ? 'is-on' : ''}
          onClick={() => setMode('single')}
        >Single</button>
        <button
          className={mode === 'grid' ? 'is-on' : ''}
          onClick={() => { setMode('grid'); setPlaying(null); }}
        >Grid</button>
        {mode === 'single' && (
          <>
            <button
              className={subject === 'featured' ? 'is-on' : ''}
              disabled={!featured}
              title={featured ? 'The persona the app is showing' : 'No persona on screen'}
              onClick={() => setSubject('featured')}
            >Featured</button>
            <button
              className={subject === 'random' ? 'is-on' : ''}
              onClick={() => setSubject('random')}
            >Random</button>
          </>
        )}
      </div>

      {mode === 'single' ? (
        <>
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
              <div className="sprite-tuner-garment">
                {persona.character.equippedItems?.torso?.name ?? 'no torso item'}
              </div>
              {usingFeatured && <div className="sprite-tuner-garment">shown on the card</div>}
            </div>
          </div>

          <div className="sprite-tuner-controls">
            <button onClick={() => { setSubject('random'); setSeed(Math.floor(Math.random() * 1e6)); }}>
              ⟳ New persona
            </button>
            <select
              value={pose}
              disabled={!!playing}
              onChange={(e) => setPose(e.target.value as FrameId)}
            >
              {POSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={garment} onChange={(e) => setGarment(e.target.value as GarmentKind | 'auto')}>
              {GARMENTS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <label className="sprite-tuner-flip">
              <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} /> flip
            </label>
          </div>

          <div className="sprite-tuner-controls">
            <button onClick={() => setPlaying(playing ? null : 'idle')}>
              {playing ? '■ Stop' : '▶ Play'}
            </button>
            <select
              value={playing ?? 'idle'}
              disabled={!playing}
              onChange={(e) => setPlaying(e.target.value as SpriteAnim | 'idle')}
            >
              <option value="idle">idle</option>
              {ALL_ANIMS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="sprite-tuner-hint">loops with a half-second rest</span>
          </div>
        </>
      ) : (
        <>
          <div className="sprite-tuner-controls">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select value={gridSide} onChange={(e) => setGridSide(Number(e.target.value))}>
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}×{n}</option>)}
            </select>
            <button onClick={() => setGridSeed(Math.floor(Math.random() * 1e6))}>⟳ Re-draw</button>
            <span className="sprite-tuner-hint">{gridCells.length} shown · click one to open it</span>
          </div>
          <div className="sprite-tuner-grid">
            <canvas
              ref={gridRef}
              width={gridSide * SPRITE_W}
              height={gridSide * gridCellH}
              onClick={pickFromGrid}
              style={{ imageRendering: 'pixelated', width: '100%', height: 'auto', cursor: 'pointer' }}
            />
          </div>
        </>
      )}

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
