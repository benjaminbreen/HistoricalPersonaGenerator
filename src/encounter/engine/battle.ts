/**
 * encounter/engine/battle.ts
 *
 * The turn machine. Pure and seeded: resolveTurn(state, action) returns a new
 * state plus the ordered events the screen should animate. Low rapport swaps
 * BEFRIEND→ATTACK and TRADE→STEAL, and rapport moves during play, so a fight
 * can be talked down and a friendly trade can curdle.
 */

import { makeRng, Rng } from '../../components/portraitLab/core/rng';
import { HistoricalPersona } from '../../services/personaGenerator';
import { computeRapport, RapportReport } from './rapport';
import { BattleStats, deriveBattleStats } from './stats';

export type Side = 'left' | 'right';
export type ActionId = 'talk' | 'observe' | 'trade' | 'steal' | 'befriend' | 'attack' | 'flee';

/** The rapport line above which this stays a meeting, below which it is a standoff. */
export const HOSTILE_THRESHOLD = 40;

export type SpeakIntent =
  | 'greet' | 'talk' | 'talk-warm' | 'talk-miss' | 'laugh'
  | 'observe' | 'trade-offer' | 'trade-accept' | 'trade-refuse'
  | 'steal-caught' | 'befriend' | 'befriend-not-yet'
  | 'threat' | 'attack' | 'hurt' | 'ko' | 'flee' | 'flee-blocked'
  | 'friendship' | 'snap';

export type BattleEvent =
  | { type: 'narrate'; text: string }
  | { type: 'speak'; side: Side; intent: SpeakIntent }
  | { type: 'anim'; side: Side; anim: 'lunge' | 'flinch' | 'dodge' | 'ko' | 'celebrate' | 'step' | 'reach' | 'shrug' }
  | { type: 'damage'; side: Side; amount: number; crit: boolean }
  | { type: 'rapportShift'; amount: number }
  | { type: 'tensionShift'; amount: number }
  | { type: 'item'; side: Side; name: string; how: 'traded' | 'stolen' | 'given' }
  | { type: 'reveal'; side: Side }
  | { type: 'end'; outcome: Outcome };

export type Outcome =
  | { kind: 'friendship' }
  | { kind: 'ko'; loser: Side }
  | { kind: 'fled'; who: Side }
  | { kind: 'robbed'; thief: Side; item: string };

export interface Combatant {
  persona: HistoricalPersona;
  side: Side;
  battle: BattleStats;
  hp: number;
  /** Opponent's sheet and rapport factors revealed by OBSERVE. */
  observed: boolean;
  /** One-turn edge from having just sized the opponent up. */
  insight: boolean;
}

export interface EncounterState {
  seed: number;
  turn: number;
  left: Combatant;
  right: Combatant;
  rapport: number;
  tension: number;
  curiosity: number;
  report: RapportReport;
  /** Recently spoken move ids, used to avoid repetition. */
  spokenHistory: Record<Side, string[]>;
  outcome: Outcome | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function makeCombatant(persona: HistoricalPersona, side: Side): Combatant {
  const battle = deriveBattleStats(persona.character);
  return { persona, side, battle, hp: battle.maxHp, observed: false, insight: false };
}

export function createEncounter(a: HistoricalPersona, b: HistoricalPersona, seed?: number): EncounterState {
  const left = makeCombatant(a, 'left');
  const right = makeCombatant(b, 'right');
  const report = computeRapport(a, b, left.battle, right.battle);
  return {
    seed: seed ?? ((a.character.portraitSeed ?? 1) * 31 + (b.character.portraitSeed ?? 7)) >>> 0,
    turn: 0,
    left, right,
    rapport: report.rapport,
    tension: report.tension,
    curiosity: report.curiosity,
    report,
    spokenHistory: { left: [], right: [] },
    outcome: null,
  };
}

export function isHostile(state: EncounterState): boolean {
  return state.rapport < HOSTILE_THRESHOLD;
}

export function availableActions(state: EncounterState): ActionId[] {
  return isHostile(state)
    ? ['talk', 'steal', 'observe', 'attack', 'flee']
    : ['talk', 'trade', 'observe', 'befriend', 'flee'];
}

function other(side: Side): Side {
  return side === 'left' ? 'right' : 'left';
}

function get(state: EncounterState, side: Side): Combatant {
  return side === 'left' ? state.left : state.right;
}

interface TurnContext {
  state: EncounterState;
  events: BattleEvent[];
  rng: Rng;
}

function shiftRapport(ctx: TurnContext, amount: number) {
  const next = clamp(ctx.state.rapport + amount, 0, 100);
  if (next !== ctx.state.rapport) {
    ctx.state.rapport = next;
    ctx.events.push({ type: 'rapportShift', amount });
  }
}

function shiftTension(ctx: TurnContext, amount: number) {
  const next = clamp(ctx.state.tension + amount, 0, 100);
  if (next !== ctx.state.tension) {
    ctx.state.tension = next;
    ctx.events.push({ type: 'tensionShift', amount });
  }
}

function randomCarriedItem(persona: HistoricalPersona, rng: Rng): string | null {
  const items = persona.character.inventory || [];
  if (!items.length) return null;
  return items[Math.floor(rng() * items.length)].name;
}

function bestCarriedItem(persona: HistoricalPersona): string | null {
  const items = persona.character.inventory || [];
  if (!items.length) return null;
  return [...items].sort((x, y) => (y.value ?? 0) - (x.value ?? 0))[0].name;
}

function doTalk(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  const target = get(ctx.state, other(side));
  const insightBonus = actor.insight ? 0.12 : 0;
  const chance = clamp(
    0.45 + (actor.battle.charm - target.battle.nerve) / 45 + ctx.state.rapport / 500 + insightBonus,
    0.08, 0.95
  );
  actor.insight = false;
  ctx.events.push({ type: 'speak', side, intent: 'talk' });
  if (ctx.rng() < chance) {
    const crit = ctx.rng() < actor.battle.luck / 55;
    if (crit) {
      ctx.events.push({ type: 'speak', side: other(side), intent: 'laugh' });
      ctx.events.push({ type: 'narrate', text: 'Something lands — they laugh together.' });
      shiftRapport(ctx, 12 + Math.round(ctx.rng() * 6));
      shiftTension(ctx, -10);
    } else {
      ctx.events.push({ type: 'speak', side: other(side), intent: 'talk-warm' });
      shiftRapport(ctx, 5 + Math.round(ctx.rng() * 4 + actor.battle.wit / 8));
      shiftTension(ctx, -4);
    }
  } else {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'talk-miss' });
    shiftRapport(ctx, 1);
    shiftTension(ctx, 4);
  }
}

function doObserve(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  actor.observed = true;
  actor.insight = true;
  ctx.events.push({ type: 'speak', side, intent: 'observe' });
  ctx.events.push({ type: 'reveal', side });
  shiftRapport(ctx, 2);
  ctx.state.curiosity = clamp(ctx.state.curiosity + 4, 0, 100);
}

function doTrade(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  const target = get(ctx.state, other(side));
  ctx.events.push({ type: 'anim', side, anim: 'reach' });
  ctx.events.push({ type: 'speak', side, intent: 'trade-offer' });
  const chance = clamp(
    0.4 + actor.battle.charm / 70 + ctx.state.rapport / 300 - ctx.state.tension / 400,
    0.15, 0.9
  );
  const mine = randomCarriedItem(actor.persona, ctx.rng);
  const theirs = randomCarriedItem(target.persona, ctx.rng);
  if (mine && theirs && ctx.rng() < chance) {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'trade-accept' });
    ctx.events.push({ type: 'item', side, name: theirs, how: 'traded' });
    ctx.events.push({ type: 'item', side: other(side), name: mine, how: 'traded' });
    ctx.events.push({ type: 'narrate', text: `${mine} changes hands for ${theirs}.` });
    shiftRapport(ctx, 9 + Math.round(ctx.rng() * 4));
    shiftTension(ctx, -6);
  } else {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'trade-refuse' });
    shiftTension(ctx, 6);
  }
}

function doSteal(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  const target = get(ctx.state, other(side));
  const insightBonus = actor.insight ? 0.15 : 0;
  actor.insight = false;
  const chance = clamp(0.35 + (actor.battle.guile - target.battle.wit) / 50 + insightBonus, 0.1, 0.85);
  const prize = bestCarriedItem(target.persona);
  ctx.events.push({ type: 'anim', side, anim: 'step' });
  if (!prize) {
    ctx.events.push({ type: 'narrate', text: 'Nothing worth taking.' });
    return;
  }
  if (ctx.rng() < chance) {
    const unnoticed = ctx.rng() < 0.5;
    ctx.events.push({ type: 'item', side, name: prize, how: 'stolen' });
    if (unnoticed) {
      ctx.events.push({ type: 'narrate', text: `The ${prize.toLowerCase()} vanishes into a sleeve, unseen.` });
      ctx.state.outcome = { kind: 'robbed', thief: side, item: prize };
      ctx.events.push({ type: 'anim', side, anim: 'step' });
      ctx.events.push({ type: 'end', outcome: ctx.state.outcome });
    } else {
      ctx.events.push({ type: 'speak', side: other(side), intent: 'steal-caught' });
      ctx.events.push({ type: 'narrate', text: `Taken — and seen! The ${prize.toLowerCase()} is in the wrong hands.` });
      shiftRapport(ctx, -14);
      shiftTension(ctx, 22);
    }
  } else {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'steal-caught' });
    ctx.events.push({ type: 'anim', side, anim: 'shrug' });
    shiftRapport(ctx, -10);
    shiftTension(ctx, 16);
  }
}

function doBefriend(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  ctx.events.push({ type: 'speak', side, intent: 'befriend' });
  const threshold = 68 - actor.battle.charm / 2;
  if (ctx.state.rapport >= threshold && ctx.rng() < 0.75) {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'friendship' });
    ctx.events.push({ type: 'anim', side: 'left', anim: 'celebrate' });
    ctx.events.push({ type: 'anim', side: 'right', anim: 'celebrate' });
    ctx.state.outcome = { kind: 'friendship' };
    ctx.events.push({ type: 'end', outcome: ctx.state.outcome });
  } else {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'befriend-not-yet' });
    shiftRapport(ctx, 3);
  }
}

function doAttack(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  const target = get(ctx.state, other(side));
  ctx.events.push({ type: 'speak', side, intent: 'attack' });
  ctx.events.push({ type: 'anim', side, anim: 'lunge' });
  const hitChance = clamp(0.85 - (target.battle.speed - actor.battle.speed) / 90, 0.35, 0.95);
  if (ctx.rng() < hitChance) {
    const crit = ctx.rng() < actor.battle.luck / 50;
    const raw = actor.battle.attack * (0.8 + ctx.rng() * 0.5) - target.battle.defense * 0.6;
    const amount = Math.max(4, Math.round(raw * (crit ? 1.7 : 1)));
    target.hp = Math.max(0, target.hp - amount);
    ctx.events.push({ type: 'anim', side: other(side), anim: 'flinch' });
    ctx.events.push({ type: 'damage', side: other(side), amount, crit });
    shiftRapport(ctx, -8);
    shiftTension(ctx, 12);
    if (target.hp <= 0) {
      ctx.events.push({ type: 'speak', side: other(side), intent: 'ko' });
      ctx.events.push({ type: 'anim', side: other(side), anim: 'ko' });
      ctx.state.outcome = { kind: 'ko', loser: other(side) };
      ctx.events.push({ type: 'end', outcome: ctx.state.outcome });
    } else {
      ctx.events.push({ type: 'speak', side: other(side), intent: 'hurt' });
    }
  } else {
    ctx.events.push({ type: 'anim', side: other(side), anim: 'dodge' });
    ctx.events.push({ type: 'narrate', text: 'The blow finds only air.' });
    shiftTension(ctx, 8);
  }
}

function doFlee(ctx: TurnContext, side: Side) {
  const actor = get(ctx.state, side);
  const target = get(ctx.state, other(side));
  const chance = clamp(0.5 + (actor.battle.speed - target.battle.speed) / 40, 0.2, 0.95);
  ctx.events.push({ type: 'speak', side, intent: 'flee' });
  if (ctx.rng() < chance) {
    ctx.events.push({ type: 'anim', side, anim: 'step' });
    ctx.state.outcome = { kind: 'fled', who: side };
    ctx.events.push({ type: 'end', outcome: ctx.state.outcome });
  } else {
    ctx.events.push({ type: 'speak', side: other(side), intent: 'flee-blocked' });
    shiftTension(ctx, 8);
  }
}

const ACTION_HANDLERS: Record<ActionId, (ctx: TurnContext, side: Side) => void> = {
  talk: doTalk, observe: doObserve, trade: doTrade, steal: doSteal,
  befriend: doBefriend, attack: doAttack, flee: doFlee,
};

/** The right-side persona plays itself: weights from its own sheet and the mood. */
function chooseFoeAction(state: EncounterState, rng: Rng): ActionId {
  const foe = state.right;
  const p = foe.persona.character.personality;
  const agree = (p?.agreeableness ?? 50) / 100;
  const open = (p?.openness ?? 50) / 100;
  const hostile = isHostile(state);
  const desperate = foe.hp < foe.battle.maxHp * 0.3;

  const weights: Array<[ActionId, number]> = hostile
    ? [
        ['talk', 1.2 * agree + 0.5],
        ['observe', 0.6 * open + (foe.observed ? 0 : 0.4)],
        ['steal', 0.5 + foe.battle.guile / 30 - agree * 0.4],
        ['attack', 0.4 + state.tension / 120 + foe.battle.attack / 60 - agree * 0.6],
        ['flee', desperate ? 2.5 : 0.15],
      ]
    : [
        ['talk', 1.4 * agree + 0.6],
        ['observe', 0.7 * open + (foe.observed ? 0 : 0.5)],
        ['trade', 0.5 + foe.battle.charm / 40],
        ['befriend', state.rapport > 62 ? 1.2 : 0.1],
        ['flee', desperate ? 1.5 : 0.05],
      ];

  const total = weights.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  let roll = rng() * total;
  for (const [action, w] of weights) {
    roll -= Math.max(0, w);
    if (roll <= 0) return action;
  }
  return 'talk';
}

export interface TurnResult {
  state: EncounterState;
  events: BattleEvent[];
  foeAction: ActionId | null;
}

export function resolveTurn(prev: EncounterState, playerAction: ActionId): TurnResult {
  const state: EncounterState = structuredClone(prev);
  state.turn += 1;
  const rng = makeRng((state.seed + state.turn * 977) >>> 0);
  const ctx: TurnContext = { state, events: [], rng };

  const playerFirst = state.left.battle.speed + rng() * 8 >= state.right.battle.speed + rng() * 8;
  const order: Array<[Side, ActionId | null]> = playerFirst
    ? [['left', playerAction], ['right', null]]
    : [['right', null], ['left', playerAction]];

  let foeAction: ActionId | null = null;
  for (const [side, chosen] of order) {
    if (state.outcome) break;
    const action = chosen ?? (foeAction = chooseFoeAction(state, rng));
    ACTION_HANDLERS[action](ctx, side);
  }

  // A room this tense does not stay peaceful on its own.
  if (!state.outcome && state.tension >= 85 && state.rapport < HOSTILE_THRESHOLD) {
    ctx.events.push({ type: 'speak', side: 'right', intent: 'snap' });
    ctx.events.push({ type: 'narrate', text: 'The air itself has turned dangerous.' });
    doAttack(ctx, 'right');
    foeAction = 'attack';
  }

  return { state, events: ctx.events, foeAction };
}
