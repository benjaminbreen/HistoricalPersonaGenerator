/**
 * encounter/EncounterMode.tsx
 *
 * The battle screen, laid out after the mockup: persona cards at the sides,
 * the two figures meeting on dark ground, a serif caption between them, action
 * cards along the bottom left and the mood meters bottom right. The engine
 * resolves a turn into events; this plays them back with SNES pacing.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HistoricalPersona } from '../services/personaGenerator';
import {
  ActionId, availableActions, BattleEvent, createEncounter, EncounterState,
  isHostile, Outcome, resolveTurn, Side,
} from './engine/battle';
import { displayStats } from './engine/stats';
import { speakLine, SpokenLine } from './dialogue/speak';
import SpriteCanvas, { SpriteAnim, SpriteCommand } from './sprite/SpriteCanvas';
import './encounter.css';

interface Props {
  a: HistoricalPersona;
  b: HistoricalPersona;
  onClose: () => void;
}

interface Floater {
  id: number;
  text: string;
  tone: 'damage' | 'crit' | 'good' | 'bad' | 'item';
  side: Side | 'center';
}

const ACTION_META: Record<ActionId, { label: string; icon: string; blurb: string }> = {
  talk: { label: 'Talk', icon: '💬', blurb: 'Engage in conversation and build rapport.' },
  trade: { label: 'Trade', icon: '⚖', blurb: 'Propose an exchange of goods or services.' },
  observe: { label: 'Observe', icon: '👁', blurb: 'Carefully observe to learn about your counterpart.' },
  befriend: { label: 'Befriend', icon: '🤝', blurb: 'Attempt to build trust and goodwill.' },
  steal: { label: 'Steal', icon: '🕳', blurb: 'Light fingers, while their eyes are elsewhere.' },
  attack: { label: 'Attack', icon: '⚔', blurb: 'Settle this the old way.' },
  flee: { label: 'Flee', icon: '🏃', blurb: 'Leave, fast, while leaving is possible.' },
};

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function sceneTitle(state: EncounterState, outcome: Outcome | null): { title: string; sub: string } {
  if (outcome) {
    switch (outcome.kind) {
      case 'friendship': return { title: 'Friendship', sub: 'Whatever the years and miles say.' };
      case 'ko': return { title: 'The fight is over', sub: 'Someone is not getting up.' };
      case 'fled': return { title: 'Parted', sub: 'The road has taken one of them.' };
      case 'robbed': return { title: 'Robbed', sub: 'A sleight of hand, and history moves on.' };
    }
  }
  if (state.turn === 0) return { title: 'Initial encounter', sub: 'They assess one another.' };
  if (state.tension >= 70) return { title: 'On a knife’s edge', sub: 'Neither dares look away.' };
  if (isHostile(state)) return { title: 'A standoff', sub: 'Hands hover where weapons might be.' };
  if (state.rapport >= 70) return { title: 'A meeting of minds', sub: 'The strangeness is wearing off.' };
  return { title: 'The meeting continues', sub: 'Each is still deciding what the other is.' };
}

function outcomeBody(outcome: Outcome, state: EncounterState): string {
  const nameL = state.left.persona.character.name.split(' ')[0];
  const nameR = state.right.persona.character.name.split(' ')[0];
  switch (outcome.kind) {
    case 'friendship':
      return `Across ${Math.abs(state.left.persona.year - state.right.persona.year)} years and every difference between their worlds, ${nameL} and ${nameR} part as friends.`;
    case 'ko':
      return `${outcome.loser === 'left' ? nameL : nameR} is down. The other stands over them, breathing hard, already wondering what it was for.`;
    case 'fled':
      return `${outcome.who === 'left' ? nameL : nameR} is gone down the road. Neither will ever quite forget the meeting.`;
    case 'robbed':
      return `${outcome.thief === 'left' ? nameL : nameR} slips away with the ${outcome.item.toLowerCase()}. History does not record the owner's words.`;
  }
}

/** Typewriter. Reports on-going typing so the sprite can flap its mouth. */
function TypeText({ text, onTyping }: { text: string; onTyping?: (typing: boolean) => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text) return;
    onTyping?.(true);
    const timer = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(timer);
          onTyping?.(false);
          return c;
        }
        return c + 1;
      });
    }, 24);
    return () => { window.clearInterval(timer); onTyping?.(false); };
  }, [text]);
  return <>{text.slice(0, count)}</>;
}

export default function EncounterMode({ a, b, onClose }: Props) {
  const [state, setState] = useState<EncounterState>(() => createEncounter(a, b));
  const [busy, setBusy] = useState(true);
  const [realMode, setRealMode] = useState(false);
  const [lines, setLines] = useState<Partial<Record<Side, SpokenLine>>>({});
  const [typing, setTyping] = useState<Partial<Record<Side, boolean>>>({});
  const [narration, setNarration] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [commands, setCommands] = useState<Partial<Record<Side, SpriteCommand>>>({});
  const [shake, setShake] = useState(0);
  const [showFactors, setShowFactors] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [koSides, setKoSides] = useState<Side[]>([]);
  const realModeRef = useRef(realMode);
  realModeRef.current = realMode;
  const floaterId = useRef(1);
  const animKey = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => { timers.current.forEach(window.clearTimeout); }, []);

  const wait = useCallback((ms: number) => new Promise<void>((resolve) => {
    timers.current.push(window.setTimeout(resolve, ms));
  }), []);

  const addFloater = useCallback((text: string, tone: Floater['tone'], side: Floater['side']) => {
    const id = floaterId.current++;
    setFloaters((f) => [...f, { id, text, tone, side }]);
    timers.current.push(window.setTimeout(
      () => setFloaters((f) => f.filter((x) => x.id !== id)), 1400
    ));
  }, []);

  const playAnim = useCallback((side: Side, anim: SpriteAnim) => {
    setCommands((c) => ({ ...c, [side]: { anim, key: animKey.current++ } }));
  }, []);

  const playEvents = useCallback(async (events: BattleEvent[], eventState: EncounterState) => {
    for (const event of events) {
      switch (event.type) {
        case 'speak': {
          const line = speakLine(eventState, event.side, event.intent, realModeRef.current);
          setLines((l) => ({ ...l, [event.side]: line }));
          const spoken = line.real?.text ?? line.text;
          const readMs = Math.min(3200, 600 + spoken.length * 26 + (line.action ? 800 : 0));
          await wait(readMs);
          break;
        }
        case 'narrate':
          setNarration(event.text);
          await wait(Math.min(2400, 600 + event.text.length * 16));
          break;
        case 'anim':
          playAnim(event.side, event.anim);
          if (event.anim === 'ko') setKoSides((k) => [...k, event.side]);
          await wait(event.anim === 'ko' ? 900 : event.anim === 'celebrate' ? 950 : 520);
          break;
        case 'damage': {
          addFloater(`${event.crit ? '✦ ' : ''}-${event.amount}`, event.crit ? 'crit' : 'damage', event.side);
          setShake(event.crit ? 2 : 1);
          timers.current.push(window.setTimeout(() => setShake(0), 420));
          await wait(560);
          break;
        }
        case 'rapportShift':
          addFloater(`${event.amount > 0 ? '+' : ''}${event.amount} ♥`, event.amount > 0 ? 'good' : 'bad', 'center');
          await wait(240);
          break;
        case 'tensionShift':
          if (event.amount >= 8) {
            addFloater(`tension ${event.amount > 0 ? 'rises' : 'falls'}`, event.amount > 0 ? 'bad' : 'good', 'center');
          }
          await wait(160);
          break;
        case 'item':
          addFloater(`${event.how === 'stolen' ? '🕳' : '⚖'} ${event.name}`, 'item', event.side);
          await wait(700);
          break;
        case 'reveal':
          setShowFactors(true);
          await wait(400);
          break;
        case 'end':
          await wait(500);
          setOutcome(event.outcome);
          break;
      }
    }
  }, [addFloater, playAnim, wait]);

  // The opening beat: a greeting from each side.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await wait(900);
      if (cancelled) return;
      await playEvents(
        [{ type: 'speak', side: 'left', intent: 'greet' }, { type: 'speak', side: 'right', intent: 'greet' }],
        state
      );
      setBusy(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = useCallback(async (action: ActionId) => {
    if (busy || outcome) return;
    setBusy(true);
    setLines({});
    setNarration(null);
    const result = resolveTurn(state, action);
    setState(result.state);
    await playEvents(result.events, result.state);
    setBusy(false);
  }, [busy, outcome, state, playEvents]);

  const actions = useMemo(
    () => availableActions(state).filter((id) => id !== 'flee'),
    [state]
  );
  const hostile = isHostile(state);
  const scene = sceneTitle(state, outcome);

  const renderBubble = (side: Side) => {
    const line = lines[side];
    if (!line) return null;
    return (
      <div className={`encounter-bubble is-${side}`} key={`${side}-${line.text}-${line.real?.text ?? ''}`}>
        <span className="encounter-bubble-name">{line.speakerName}</span>
        {line.real ? (
          <>
            <p className="encounter-bubble-real">
              <TypeText text={line.real.text} onTyping={(t) => setTyping((v) => ({ ...v, [side]: t }))} />
            </p>
            <span className="encounter-bubble-lang">
              {line.real.language}
              {line.real.attested ? ' · attested' : line.real.reconstructed ? ' · reconstructed*' : ' · impression'}
            </span>
            {line.translation && <p className="encounter-bubble-translation">“{line.translation}”</p>}
          </>
        ) : line.text ? (
          <p><TypeText text={line.text} onTyping={(t) => setTyping((v) => ({ ...v, [side]: t }))} /></p>
        ) : null}
        {line.action && <p className="encounter-bubble-action">✳ {line.action}</p>}
      </div>
    );
  };

  const renderCard = (side: Side) => {
    const combatant = side === 'left' ? state.left : state.right;
    const persona = combatant.persona;
    const c = persona.character;
    const stats = displayStats(c, combatant.battle);
    const hpPct = Math.round((combatant.hp / combatant.battle.maxHp) * 100);
    const hurtOrHostile = hostile || combatant.hp < combatant.battle.maxHp;
    return (
      <aside className={`encounter-card is-${side}`}>
        <div className="encounter-card-head">
          <h3>{c.name}</h3>
          <span className="encounter-card-star">★</span>
        </div>
        <div className="encounter-card-pills">
          <span className="encounter-pill is-zone">{persona.region}</span>
          <span className="encounter-pill">{persona.location}</span>
        </div>
        <div className="encounter-card-year">{formatYear(persona.year)}</div>
        <div className="encounter-card-line">{c.gender} · {c.age} years old</div>
        <div className="encounter-card-profession">{c.profession}</div>
        {hurtOrHostile && (
          <div className="encounter-hpbar" role="meter" aria-label="Health" aria-valuenow={hpPct}>
            <div
              className={`encounter-hpbar-fill ${hpPct < 30 ? 'is-low' : hpPct < 60 ? 'is-mid' : ''}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        )}
        <hr className="encounter-card-rule" />
        <ul className="encounter-card-stats">
          {stats.map((s) => (
            <li key={s.label}>
              <span className="stat-icon" aria-hidden="true">{s.icon}</span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </li>
          ))}
        </ul>
      </aside>
    );
  };

  return (
    <div className={`encounter-overlay ${shake === 2 ? 'shake-hard' : shake === 1 ? 'shake' : ''}`} role="dialog" aria-label="Encounter">
      <button className="encounter-close" onClick={onClose} aria-label="End encounter">✕</button>

      <div className={`encounter-main ${hostile ? 'is-hostile' : ''}`}>
        {renderCard('left')}

        <div className="encounter-stage">
          <div className="encounter-figure is-left">
            {renderBubble('left')}
            <SpriteCanvas
              persona={a} facing="right" talking={!!typing.left}
              ko={koSides.includes('left')} command={commands.left ?? null}
            />
            <div className="encounter-ground-shadow" />
          </div>

          <div className="encounter-caption-block">
            <h2 className="encounter-scene-title">{scene.title}</h2>
            <p className="encounter-scene-sub">{narration ?? scene.sub}</p>
            <div className="encounter-scene-ornament">❧</div>
          </div>

          <div className="encounter-figure is-right">
            {renderBubble('right')}
            <SpriteCanvas
              persona={b} facing="left" talking={!!typing.right}
              ko={koSides.includes('right')} command={commands.right ?? null}
            />
            <div className="encounter-ground-shadow" />
          </div>

          {floaters.map((f) => (
            <span key={f.id} className={`encounter-floater tone-${f.tone} at-${f.side}`}>{f.text}</span>
          ))}
        </div>

        {renderCard('right')}
      </div>

      {showFactors && (
        <aside className="encounter-factors">
          <header>
            <strong>Why {state.rapport >= 60 ? 'they get along' : state.rapport >= 40 ? 'it could go either way' : 'this is going badly'}</strong>
            <button onClick={() => setShowFactors(false)} aria-label="Close breakdown">✕</button>
          </header>
          <ul>
            {state.report.factors.map((f) => (
              <li key={f.id} className={f.value >= 0 ? 'is-plus' : 'is-minus'}>
                <span className="factor-value">{f.value > 0 ? `+${f.value}` : f.value}</span>
                <span className="factor-label">{f.label}</span>
                <span className="factor-detail">{f.detail}</span>
              </li>
            ))}
          </ul>
          <p className="encounter-factors-note">{state.comm.note}</p>
        </aside>
      )}

      {outcome ? (
        <div className="encounter-bottom">
          <div className="encounter-ending">
            <h2>{scene.title}</h2>
            <p>{outcomeBody(outcome, state)}</p>
            <button onClick={onClose}>Return</button>
          </div>
        </div>
      ) : (
        <div className="encounter-bottom">
          <section className="encounter-menu" aria-label="Actions">
            <div className="encounter-menu-title">
              {busy ? '· · ·' : 'Choose an action.'}
            </div>
            <div className="encounter-actions">
              {actions.map((id) => (
                <button
                  key={id}
                  className={`encounter-action is-${id}`}
                  disabled={busy}
                  onClick={() => act(id)}
                >
                  <span className="encounter-action-icon">{ACTION_META[id].icon}</span>
                  <span className="encounter-action-label">{ACTION_META[id].label}</span>
                  <span className="encounter-action-blurb">{ACTION_META[id].blurb}</span>
                </button>
              ))}
            </div>
            <div className="encounter-menu-foot">
              <label className="encounter-realmode">
                <input type="checkbox" checked={realMode} onChange={(e) => setRealMode(e.target.checked)} />
                <span>Real language</span>
              </label>
              <button className="encounter-flee" disabled={busy} onClick={() => act('flee')}>
                🏃 Flee
              </button>
            </div>
          </section>

          <section className="encounter-meters" aria-label="Mood">
            <div className="encounter-meter">
              <span>Rapport{state.turn === 0 ? ' Potential' : ''}</span>
              <div className="encounter-meter-track">
                <div className="encounter-meter-fill is-rapport" style={{ width: `${state.rapport}%` }} />
              </div>
              <strong>{state.rapport}</strong>
            </div>
            <div className="encounter-meter">
              <span>Tension</span>
              <div className="encounter-meter-track">
                <div className="encounter-meter-fill is-tension" style={{ width: `${state.tension}%` }} />
              </div>
              <strong>{state.tension}</strong>
            </div>
            <div className="encounter-meter">
              <span>Curiosity (Both)</span>
              <div className="encounter-meter-track">
                <div className="encounter-meter-fill is-curiosity" style={{ width: `${state.curiosity}%` }} />
              </div>
              <strong>{state.curiosity}</strong>
            </div>
            <p className="encounter-meters-note">
              <button className="encounter-factors-toggle" onClick={() => setShowFactors((v) => !v)}>ⓘ</button>
              {' '}Values are estimated from era, culture, language, and personal traits.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
