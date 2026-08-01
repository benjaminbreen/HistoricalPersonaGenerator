/**
 * Contextual nonverbal communication for encounters with little or no shared
 * language. Cues are assembled from the character sheet and encounter state,
 * not generated prose. Each cue has a stable id so an encounter can avoid
 * repeating itself.
 */

import { hashString, makeRng } from '../../components/portraitLab/core/rng';
import { EncounterState, Side, SpeakIntent } from '../engine/battle';

export type NonverbalAnimation = 'gesture' | 'bow' | 'shrug' | 'reach' | 'step';

export interface NonverbalCue {
  id: string;
  text: string;
  animation?: NonverbalAnimation;
}

interface CueCandidate {
  id: string;
  act: string;
  animation?: NonverbalAnimation;
  /** Appended when the cue is an attempt to communicate a proposition. */
  ambiguous?: string;
  clear?: string;
}

const SPRITE_ONLY_INTENTS = new Set<SpeakIntent>([
  'attack', 'hurt', 'ko', 'flee', 'flee-blocked', 'snap',
]);

export function isSpriteOnlyIntent(intent: SpeakIntent): boolean {
  return SPRITE_ONLY_INTENTS.has(intent);
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function carriedItem(state: EncounterState, side: Side): string | null {
  const persona = side === 'left' ? state.left.persona : state.right.persona;
  const inventory = persona.character.inventory ?? [];
  if (!inventory.length) return null;
  const seed = hashString(`${state.seed}|${state.turn}|${side}|item`);
  return inventory[Math.abs(seed) % inventory.length]?.name ?? null;
}

function workDemonstration(profession: string, actor: string): CueCandidate {
  const job = profession.toLowerCase();
  if (/barber|hair|shav/.test(job)) {
    return {
      id: 'work-barber',
      act: `${actor} draws two fingers carefully along the jaw, then indicates the other person’s hair.`,
      animation: 'gesture',
    };
  }
  if (/farm|field|herd|shepherd|crop|millet|grain/.test(job)) {
    return {
      id: 'work-field',
      act: `${actor} crumbles a pinch of earth between finger and thumb, then traces rows across the ground.`,
      animation: 'gesture',
    };
  }
  if (/weav|spinn|cloth|textile|tailor/.test(job)) {
    return {
      id: 'work-thread',
      act: `${actor} draws an imaginary thread taut and works it rhythmically between both hands.`,
      animation: 'gesture',
    };
  }
  if (/writ|scribe|book|calligraph|clerk/.test(job)) {
    return {
      id: 'work-writing',
      act: `${actor} smooths an empty palm like a page and writes several careful signs across it.`,
      animation: 'gesture',
    };
  }
  if (/fish|sail|boat|dock/.test(job)) {
    return {
      id: 'work-water',
      act: `${actor} mimes drawing a weighted line from water, then spreads both hands to show the catch.`,
      animation: 'gesture',
    };
  }
  if (/soldier|guard|warrior|archer/.test(job)) {
    return {
      id: 'work-guard',
      act: `${actor} indicates the carried weapon, then points outward as though marking a watch.`,
      animation: 'gesture',
    };
  }
  return {
    id: 'work-hands',
    act: `${actor} shows the wear on both hands and repeats the practiced motion of their daily work.`,
    animation: 'gesture',
  };
}

function candidatesFor(
  state: EncounterState,
  side: Side,
  intent: SpeakIntent,
): CueCandidate[] {
  const actorCombatant = side === 'left' ? state.left : state.right;
  const targetCombatant = side === 'left' ? state.right : state.left;
  const actor = firstName(actorCombatant.persona.character.name);
  const target = firstName(targetCombatant.persona.character.name);
  const profession = actorCombatant.persona.character.profession || 'worker';
  const region = actorCombatant.persona.region || actorCombatant.persona.location || 'home';
  const item = carriedItem(state, side);
  const work = workDemonstration(profession, actor);

  switch (intent) {
    case 'greet':
      return [
        {
          id: 'greet-name-distance',
          act: `${actor} says their own name slowly, touches their chest, and leaves a deliberate space between them.`,
          animation: 'gesture',
        },
        {
          id: 'greet-set-down',
          act: `${actor} lowers what they are carrying and waits without approaching.`,
          animation: 'reach',
        },
      ];
    case 'talk':
      return [
        {
          ...work,
          ambiguous: `${target} recognizes that it is work, but not what is being asked.`,
          clear: `${target} follows the demonstration and answers in kind.`,
        },
        {
          id: 'talk-origin-route',
          act: `${actor} names ${region}, taps their chest, and traces a long route across the ground.`,
          animation: 'gesture',
          ambiguous: `${target} understands distance and travel, but little else.`,
          clear: `${target} follows the route and points toward their own homeland.`,
        },
        ...(item ? [{
          id: 'talk-carried-object',
          act: `${actor} shows the ${item.toLowerCase()}, names it twice, then looks to ${target} for a name in return.`,
          animation: 'reach' as const,
          ambiguous: `${target} watches the object, unsure whether it is an offer or a question.`,
          clear: `${target} supplies a word of their own and repeats the exchange.`,
        }] : []),
        {
          id: 'talk-counting',
          act: `${actor} places three small markers in a row, counts them aloud, and invites ${target} to continue.`,
          animation: 'reach',
          ambiguous: `${target} sees a pattern but cannot yet tell what it measures.`,
          clear: `${target} adds another marker and repeats the count.`,
        },
      ];
    case 'talk-warm':
    case 'laugh':
      return [
        {
          id: 'response-mirror',
          act: `${actor} repeats the last demonstrated motion and breaks into an unmistakable laugh.`,
          animation: 'gesture',
        },
        {
          id: 'response-recognition',
          act: `${actor} points between them, then repeats the one word both appear to recognize.`,
          animation: 'gesture',
        },
      ];
    case 'talk-miss':
      return [
        {
          id: 'response-reset',
          act: `${actor} pauses, shakes their head, and returns the objects to their starting places.`,
          animation: 'shrug',
        },
        {
          id: 'response-no-meaning',
          act: `${actor} repeats one sound uncertainly, then waits for a simpler explanation.`,
          animation: 'shrug',
        },
      ];
    case 'observe':
      return [
        {
          id: 'observe-hands',
          act: `${actor} studies ${target}’s hands, then the wear and repairs on their clothing.`,
        },
        {
          id: 'observe-tools',
          act: `${actor} takes stock of every visible tool, fastening, pocket, and carried object.`,
        },
        {
          id: 'observe-bearing',
          act: `${actor} watches how ${target} distributes their weight and guards the space around them.`,
        },
      ];
    case 'trade-offer':
      return item ? [
        {
          id: 'trade-item-ground',
          act: `${actor} places the ${item.toLowerCase()} on the ground between them and steps back.`,
          ambiguous: `${target} studies it without reaching, uncertain whether it is payment, gift, or bait.`,
          clear: `${target} understands the invitation and begins considering an exchange.`,
        },
        {
          id: 'trade-item-balance',
          act: `${actor} shows the ${item.toLowerCase()}, points to ${target}’s goods, and balances both hands like scales.`,
          ambiguous: `${target} understands that the object matters, but not the proposed terms.`,
          clear: `${target} begins selecting something of comparable value.`,
        },
      ] : [
        {
          id: 'trade-service',
          act: `${actor} demonstrates the work of a ${profession.toLowerCase()}, then indicates ${target}’s possessions.`,
          animation: 'gesture',
          ambiguous: `${target} sees a request but cannot tell whether labor or goods are being offered.`,
          clear: `${target} recognizes an offer of work in exchange for goods.`,
        },
      ];
    case 'trade-accept':
      return [{
        id: 'trade-accept-exchange',
        act: `${actor} draws the offered item close, then places their own payment in exactly the same spot.`,
        animation: 'reach',
      }];
    case 'trade-refuse':
      return [{
        id: 'trade-refuse-cover',
        act: `${actor} covers their goods, leaves the offer untouched, and takes one measured step back.`,
        animation: 'step',
      }];
    case 'steal-caught':
      return [{
        id: 'steal-caught-guard',
        act: `${actor} clamps a hand over the disturbed possession and fixes ${target} with a hard stare.`,
        animation: 'step',
      }];
    case 'befriend':
      return [{
        id: 'befriend-disarm',
        act: `${actor} sets their most useful carried object out of reach and sits beside it rather than advancing.`,
        animation: 'reach',
        ambiguous: `${target} sees the vulnerability but remains unsure what is expected.`,
        clear: `${target} recognizes the deliberate surrender of advantage.`,
      }];
    case 'befriend-not-yet':
      return [{
        id: 'befriend-not-yet-distance',
        act: `${actor} acknowledges the offer but preserves the careful distance between them.`,
        animation: 'step',
      }];
    case 'threat':
      return [{
        id: 'threat-boundary',
        act: `${actor} marks a boundary at their feet and keeps one hand close to their tools.`,
        animation: 'step',
      }];
    case 'friendship':
      return [{
        id: 'friendship-share',
        act: `${actor} divides a small possession into two portions and pushes one across the ground.`,
        animation: 'reach',
      }];
    default:
      return [];
  }
}

function cueWasClear(state: EncounterState, side: Side, cueId: string): boolean {
  const target = side === 'left' ? state.right : state.left;
  const interpretation = target.battle.wit / 70 + state.comm.score * 0.45 - state.tension / 250;
  const rng = makeRng(hashString(`${state.seed}|${state.turn}|${side}|${cueId}|interpret`));
  return rng() < Math.max(0.12, Math.min(0.82, interpretation));
}

export function nonverbalCue(
  state: EncounterState,
  side: Side,
  intent: SpeakIntent,
): NonverbalCue | null {
  if (isSpriteOnlyIntent(intent)) return null;

  const candidates = candidatesFor(state, side, intent);
  if (!candidates.length) return null;

  const used = new Set(state.nonverbalHistory?.[side] ?? []);
  const fresh = candidates.filter((cue) => !used.has(cue.id));
  const pool = fresh.length ? fresh : candidates;
  const rng = makeRng(hashString(`${state.seed}|${state.turn}|${side}|${intent}|cue`));
  const selected = pool[Math.floor(rng() * pool.length)];
  const interpretation = cueWasClear(state, side, selected.id)
    ? selected.clear
    : selected.ambiguous;

  return {
    id: selected.id,
    text: interpretation ? `${selected.act} ${interpretation}` : selected.act,
    animation: selected.animation,
  };
}
