/**
 * encounter/EncounterMode.tsx
 *
 * The battle screen, laid out after the mockup: persona cards at the sides,
 * the two figures meeting on dark ground, a serif caption between them, action
 * cards along the bottom left and the mood meters bottom right. The engine
 * resolves a turn into events; this plays them back with SNES pacing.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconType } from 'react-icons';
import {
  LuEye, LuFootprints, LuHandshake, LuHourglass, LuInfo,
  LuMessageCircle, LuScale, LuStar, LuSwords, LuX,
} from 'react-icons/lu';
import { HistoricalPersona } from '../services/personaGenerator';
import {
  ActionId, availableActions, BattleEvent, createEncounter, EncounterState,
  isHostile, Outcome, resolveTurn, Side,
} from './engine/battle';
import { displayStats } from './engine/stats';
import { displayLanguageName, speakLine, SpokenLine } from './dialogue/speak';
import SpriteCanvas, { SpriteAnim, SpriteCommand } from './sprite/SpriteCanvas';
import { SPRITE_SCALE } from './sprite/skeleton';
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

const ACTION_META: Record<ActionId, { label: string; icon: IconType; blurb: string; prompt: string }> = {
  talk: {
    label: 'Talk', icon: LuMessageCircle,
    blurb: 'Engage in conversation and build rapport.', prompt: 'A cautious opening.',
  },
  trade: {
    label: 'Trade', icon: LuScale,
    blurb: 'Propose an exchange of goods or services.', prompt: 'Offer something of recognizable value.',
  },
  observe: {
    label: 'Observe', icon: LuEye,
    blurb: 'Carefully observe to learn about your counterpart.', prompt: 'Watch first; risk little.',
  },
  befriend: {
    label: 'Befriend', icon: LuHandshake,
    blurb: 'Attempt to build trust and goodwill.', prompt: 'Make a deliberate gesture of trust.',
  },
  steal: {
    label: 'Steal', icon: LuFootprints,
    blurb: 'Take something while their attention is elsewhere.', prompt: 'A dangerous opportunity.',
  },
  attack: {
    label: 'Attack', icon: LuSwords,
    blurb: 'Settle this by force.', prompt: 'Violence will define the encounter.',
  },
  flee: {
    label: 'Flee', icon: LuHourglass,
    blurb: 'Leave while leaving is possible.', prompt: 'Put distance between you.',
  },
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
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Partial<Record<Side, SpokenLine>>>({});
  const [stale, setStale] = useState(false);
  const [activeSide, setActiveSide] = useState<Side | null>(null);
  const [typing, setTyping] = useState<Partial<Record<Side, boolean>>>({});
  const [narration, setNarration] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [commands, setCommands] = useState<Partial<Record<Side, SpriteCommand>>>({});
  const [shake, setShake] = useState(0);
  const [showFactors, setShowFactors] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [koSides, setKoSides] = useState<Side[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionId>('talk');
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
          const line = speakLine(eventState, event.side, event.intent);
          setActiveSide(event.side);
          setLines((current) => ({ ...current, [event.side]: line }));

          // Always push: reply routing reads the tail to know what was asked.
          const history = eventState.spokenHistory[event.side];
          history.push(line.moveId);
          if (history.length > 12) history.splice(0, history.length - 12);

          const contentLength = line.text.length + line.gloss.length * 0.5;
          const readMs = Math.min(3800, 650 + contentLength * 18);
          await wait(readMs);
          break;
        }
        case 'narrate':
          setNarration(event.text);
          await wait(Math.min(2400, 600 + event.text.length * 16));
          break;
        case 'anim':
          setActiveSide(event.side);
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
          addFloater(`${event.amount > 0 ? '+' : ''}${event.amount} rapport`, event.amount > 0 ? 'good' : 'bad', 'center');
          await wait(240);
          break;
        case 'tensionShift':
          if (event.amount >= 8) {
            addFloater(`tension ${event.amount > 0 ? 'rises' : 'falls'}`, event.amount > 0 ? 'bad' : 'good', 'center');
          }
          await wait(160);
          break;
        case 'item':
          addFloater(`${event.how === 'stolen' ? 'taken' : 'traded'} · ${event.name}`, 'item', event.side);
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

  const act = useCallback(async (action: ActionId) => {
    if (busy || outcome) return;
    setBusy(true);
    setStale(false);
    setNarration(null);
    const result = resolveTurn(state, action);
    setState(result.state);
    await playEvents(result.events, result.state);
    // The last exchange lingers, dimmed, as its own transcript.
    setStale(true);
    setActiveSide(null);
    setBusy(false);
  }, [busy, outcome, state, playEvents]);

  const actions = useMemo<ActionId[]>(
    () => availableActions(state).filter((id) => id !== 'flee'),
    [state]
  );
  const hostile = isHostile(state);
  const scene = sceneTitle(state, outcome);
  const langL = a.languageData?.name;
  const langR = b.languageData?.name;
  const tongueNote = langL && langR
    ? langL === langR
      ? `Both speak ${langL}.`
      : `${langL} meets ${langR} — and each understands the other, as if by magic.`
    : 'They understand one another, as if by magic.';
  const activeAction = actions.includes(selectedAction) ? selectedAction : actions[0];
  const activeMeta = ACTION_META[activeAction];

  const renderBubble = (side: Side) => {
    const line = lines[side];
    if (!line) return null;
    return (
      <div
        className={`encounter-bubble is-${side} ${stale ? 'is-stale' : ''}`}
        key={`${side}-${line.moveId}-${line.text}`}
      >
        <span className="encounter-bubble-name">{line.speakerName}</span>
        {line.language ? (
          <>
            <p className="encounter-bubble-real">
              <TypeText text={line.text} onTyping={(t) => setTyping((v) => ({ ...v, [side]: t }))} />
            </p>
            <span className="encounter-bubble-lang">{line.language}</span>
            <p className="encounter-bubble-translation">“{line.gloss}”</p>
          </>
        ) : (
          // No table for this tongue yet: English dressed as the gloss it is,
          // never as the speaker's own words.
          <p className="encounter-bubble-translation">
            “<TypeText text={line.text} onTyping={(t) => setTyping((v) => ({ ...v, [side]: t }))} />”
          </p>
        )}
      </div>
    );
  };

  const renderCard = (side: Side) => {
    const combatant = side === 'left' ? state.left : state.right;
    const persona = combatant.persona;
    const c = persona.character;
    const stats = displayStats(c, combatant.battle);
    const hpPct = Math.round((combatant.hp / combatant.battle.maxHp) * 100);
    const isHurt = combatant.hp < combatant.battle.maxHp;
    return (
      <aside className={`encounter-card is-${side} ${activeSide && activeSide !== side ? 'is-dim' : ''}`}>
        <div className="encounter-card-head">
          <h3>{c.name}</h3>
          <LuStar className="encounter-card-star" aria-hidden="true" />
        </div>
        <div className="encounter-card-place">
          <span>{formatYear(persona.year)}</span>
          <span>{persona.region}</span>
        </div>
        <div className="encounter-card-line">{c.gender} · {c.age} years old</div>
        <div className="encounter-card-profession">{c.profession}</div>
        {persona.languageData && (
          <div className="encounter-card-tongue">
            Speaks {displayLanguageName(persona.languageData.name)}
            {persona.languageData.isReconstructed ? ' · reconstructed' : ''}
          </div>
        )}
        {isHurt && (
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
              <span className="stat-label">{s.label}</span>
              <span className={`stat-track is-${s.label.toLowerCase()}`} aria-hidden="true">
                <span style={{ width: `${s.value}%` }} />
              </span>
              <span className="stat-value">{s.value}</span>
            </li>
          ))}
        </ul>
      </aside>
    );
  };

  return (
    <div className={`encounter-overlay ${shake === 2 ? 'shake-hard' : shake === 1 ? 'shake' : ''}`} role="dialog" aria-label="Encounter">
      <button className="encounter-close" onClick={onClose} aria-label="End encounter"><LuX /></button>

      <div className={`encounter-main ${hostile ? 'is-hostile' : ''}`}>
        {renderCard('left')}

        <div className="encounter-stage">
          <div className="encounter-figure is-left">
            {renderBubble('left')}
            <SpriteCanvas
              persona={a} facing="right" talking={!!typing.left}
              ko={koSides.includes('left')} command={commands.left ?? null} scale={SPRITE_SCALE}
            />
            <div className="encounter-ground-shadow" />
          </div>

          <div className="encounter-caption-block">
            <h2 className="encounter-scene-title">{scene.title}</h2>
            <p className="encounter-scene-sub">{narration ?? scene.sub}</p>
            <div className="encounter-scene-ornament"><span>◇</span></div>
            <div className="encounter-mood" aria-hidden="true">
              <span className="encounter-mood-row">
                <em>rapport</em>
                <span className="encounter-mood-track is-rapport"><span style={{ width: `${state.rapport}%` }} /></span>
              </span>
              <span className="encounter-mood-row">
                <em>tension</em>
                <span className="encounter-mood-track is-tension"><span style={{ width: `${state.tension}%` }} /></span>
              </span>
            </div>
          </div>

          <div className="encounter-figure is-right">
            {renderBubble('right')}
            <SpriteCanvas
              persona={b} facing="left" talking={!!typing.right}
              ko={koSides.includes('right')} command={commands.right ?? null} scale={SPRITE_SCALE}
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
            <button onClick={() => setShowFactors(false)} aria-label="Close breakdown"><LuX /></button>
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
          <p className="encounter-factors-note">{tongueNote}</p>
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
            <div className="encounter-actions">
              {actions.map((id) => {
                const Icon = ACTION_META[id].icon;
                return (
                  <button
                    key={id}
                    className={`encounter-action is-${id} ${id === activeAction ? 'is-active' : ''}`}
                    disabled={busy}
                    onMouseEnter={() => setSelectedAction(id)}
                    onFocus={() => setSelectedAction(id)}
                    onClick={() => act(id)}
                  >
                    <Icon className="encounter-action-icon" aria-hidden="true" />
                    <span className="encounter-action-label">{ACTION_META[id].label}</span>
                  </button>
                );
              })}
            </div>
            <div className="encounter-action-detail" aria-live="polite">
              <p className="encounter-action-blurb">
                {busy ? 'The encounter unfolds…' : activeMeta.blurb}
              </p>
              <div className="encounter-action-detail-tools">
                <button className="encounter-factors-toggle" onClick={() => setShowFactors((v) => !v)}>
                  <LuInfo aria-hidden="true" /> Encounter factors
                </button>
                <button className="encounter-flee" disabled={busy} onClick={() => act('flee')}>
                  <LuFootprints aria-hidden="true" /> Leave encounter
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
