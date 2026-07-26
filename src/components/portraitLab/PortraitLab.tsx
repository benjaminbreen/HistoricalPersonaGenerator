/**
 * portraitLab/PortraitLab.tsx
 *
 * The A/B bench, at #portrait-lab.
 *
 * Both renderers draw the *same* persona side by side. Comparing two randomly
 * generated faces tells you nothing — half of what you would be judging is the
 * luck of the draw. Holding the character fixed and changing only the renderer
 * is the comparison that answers the question.
 */

import React, { useMemo, useState } from 'react';
import PixelPortrait from './PixelPortrait';
import { Fixture, sheets } from './fixtures';
import { buildPortraitSpec, restingExpression } from './spec/buildSpec';
import './PortraitLab.css';


const SIZES = [96, 144, 192, 288];

const PortraitLab: React.FC = () => {
  const [sheetId, setSheetId] = useState(sheets[0].id);
  const [size, setSize] = useState(192);
  const [animated, setAnimated] = useState(true);
  const [reseed, setReseed] = useState(0);

  const sheet = useMemo(
    () => sheets.find(s => s.id === sheetId) ?? sheets[0],
    [sheetId]
  );

  // Re-seeding keeps the fixture's meaning but shuffles every seeded decision,
  // which is how you tell a deliberate design from a lucky seed.
  const fixtures: Fixture[] = useMemo(
    () =>
      sheet.fixtures.map(fixture => ({
        ...fixture,
        character: {
          ...fixture.character,
          portraitSeed: (fixture.character.portraitSeed ?? 1) + reseed * 7919,
        },
      })),
    [sheet, reseed]
  );

  return (
    <main className="portrait-lab">
      <header className="portrait-lab__header">
        <div>
          <p className="portrait-lab__eyebrow">Contact sheet</p>
          <h1>Portraits</h1>
          <p className="portrait-lab__intro">
            Fixture personas rendered by the pixel engine, with the spec the
            adapter produced for each one — when a portrait looks wrong it is
            usually the spec rather than the drawing.
          </p>
        </div>
        <a className="portrait-lab__back" href="/">Back to generator</a>
      </header>

      <nav className="portrait-lab__controls" aria-label="Comparison controls">
        <div className="portrait-lab__group" role="group" aria-label="Fixture sheet">
          {sheets.map(s => (
            <button
              key={s.id}
              type="button"
              className={s.id === sheetId ? 'is-active' : ''}
              onClick={() => setSheetId(s.id)}
            >
              {s.label}
              <small>{s.fixtures.length}</small>
            </button>
          ))}
        </div>


        <div className="portrait-lab__group" role="group" aria-label="Size">
          {SIZES.map(option => (
            <button
              key={option}
              type="button"
              className={option === size ? 'is-active' : ''}
              onClick={() => setSize(option)}
            >
              {option}px
            </button>
          ))}
        </div>

        <div className="portrait-lab__group">
          <button
            type="button"
            className={animated ? 'is-active' : ''}
            onClick={() => setAnimated(value => !value)}
          >
            {animated ? 'Animation on' : 'Animation off'}
          </button>
          <button type="button" onClick={() => setReseed(value => value + 1)}>
            Reseed
          </button>
        </div>
      </nav>

      <section className="portrait-lab__grid">
        {fixtures.map(fixture => (
          <LabCard
            key={`${fixture.name}-${fixture.character.portraitSeed}`}
            fixture={fixture}
            size={size}
            animated={animated}
          />
        ))}
      </section>
    </main>
  );
};

const LabCard: React.FC<{
  fixture: Fixture;
  size: number;
  animated: boolean;
}> = ({ fixture, size, animated }) => {
  // Surfacing what the spec adapter decided is most of the debugging value:
  // when a portrait looks wrong it is usually the spec, not the drawing.
  const spec = useMemo(() => buildPortraitSpec(fixture.character), [fixture]);
  const resting = restingExpression(spec.mood, spec.condition);

  return (
    <article className="portrait-lab__card">
      <div className="portrait-lab__frames">
        <figure>
          <PixelPortrait character={fixture.character} size={size} animated={animated} />
        </figure>
      </div>

      <div className="portrait-lab__body">
        <h3>{fixture.name}</h3>
        <p>{fixture.note}</p>
        <dl>
          <div><dt>Seed</dt><dd>{spec.seed}</dd></div>
          <div><dt>Garment</dt><dd>{spec.garment.kind} · {spec.garment.material}</dd></div>
          <div><dt>Headwear</dt><dd>{spec.headwear ? `${spec.headwear.kind} · ${spec.headwear.name}` : 'none'}</dd></div>
          <div><dt>Resting face</dt><dd>{resting}</dd></div>
          <div>
            <dt>Mood</dt>
            <dd>
              valence {spec.mood.valence.toFixed(2)} · energy {spec.mood.energy.toFixed(2)}
            </dd>
          </div>
          {spec.contextPackId && (
            <div><dt>Context</dt><dd>{spec.contextPackId.replace(/_/g, ' ')}</dd></div>
          )}
        </dl>
      </div>
    </article>
  );
};

export default PortraitLab;
