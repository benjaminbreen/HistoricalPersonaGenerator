/**
 * encounter/dialogue/speak.ts
 *
 * Turns a SpeakIntent into what the dialogue box shows. Default mode is the
 * RPG translation convention, degraded by how much the pair can actually
 * understand; real-language mode shows the attested phrase or impressionistic
 * speech, with a translation caption when comprehension allows one.
 */

import { makeRng, hashString } from '../../components/portraitLab/core/rng';
import { EncounterState, Side, SpeakIntent } from '../engine/battle';
import { LINE_BANK, REGISTER_PREFIX } from './lines';
import { isSpriteOnlyIntent, nonverbalCue, NonverbalAnimation } from './nonverbal';
import { attestedPhrase, degrade, utterance } from './voice';

export interface SpokenLine {
  side: Side;
  /** Spoken words only. Empty when the exchange is entirely nonverbal. */
  text: string;
  /** Physical communication rendered as central narration, never as speech. */
  action: string | null;
  /** Stable cue id for per-encounter repetition control. */
  cueId: string | null;
  /** Optional sprite motion accompanying a nonverbal cue. */
  physicalAnimation: NonverbalAnimation | null;
  /** Real-language rendering, when the toggle is on. */
  real: { text: string; language: string; reconstructed: boolean; attested: boolean } | null;
  /** Caption under a real-language line, when the listener would understand. */
  translation: string | null;
  speakerName: string;
}

function fillSlots(line: string, state: EncounterState, side: Side): string {
  const me = side === 'left' ? state.left.persona : state.right.persona;
  const them = side === 'left' ? state.right.persona : state.left.persona;
  return line
    .replace('{name}', them.character.name.split(' ')[0])
    .replace('{trade}', (me.character.profession || 'worker').toLowerCase())
    .replace('{place}', me.location || me.region || 'my country');
}

export function speakLine(
  state: EncounterState,
  side: Side,
  intent: SpeakIntent,
  realMode: boolean
): SpokenLine {
  const me = side === 'left' ? state.left.persona : state.right.persona;
  const seedText = `${state.seed}|${state.turn}|${side}|${intent}`;
  const rng = makeRng(hashString(seedText));
  const bank = LINE_BANK[intent] ?? LINE_BANK.talk;
  let english = fillSlots(bank[Math.floor(rng() * bank.length)], state, side);

  const extraversion = me.character.personality?.extraversion ?? 50;
  if (extraversion > 70 && rng() < 0.4 && !/^[A-Z]{2}/.test(english)) {
    const prefixes = REGISTER_PREFIX.effusive;
    english = prefixes[Math.floor(rng() * prefixes.length)] + english.charAt(0).toLowerCase() + english.slice(1);
  }

  const level = state.comm.level;
  const speakerName = me.character.name.split(' ')[0];
  const lang = me.languageData;

  if (level === 'gesture') {
    const cue = nonverbalCue(state, side, intent);
    if (cue) {
      return {
        side, text: '', action: cue.text, cueId: cue.id,
        physicalAnimation: cue.animation ?? null, real: null,
        translation: null, speakerName,
      };
    }

    // Kinetic actions are already expressed by sprite animation and combat
    // narration; do not restate them in a dialogue box.
    if (isSpriteOnlyIntent(intent)) {
      return {
        side, text: '', action: null, cueId: null, physicalAnimation: null,
        real: null, translation: null, speakerName,
      };
    }

    // If this is a genuinely vocal intent without a physical cue, preserve
    // the sound of the speaker's language rather than inventing hand-waving.
    if (lang) {
      const attested = attestedPhrase(lang, intent);
      return {
        side, text: '', action: null, cueId: null, physicalAnimation: null,
        real: {
          text: attested ?? utterance(lang, seedText, Math.max(2, Math.min(5, english.split(' ').length))),
          language: lang.name,
          reconstructed: !!lang.isReconstructed,
          attested: attested !== null,
        },
        translation: null, speakerName,
      };
    }

    return {
      side, text: '', action: null, cueId: null, physicalAnimation: null,
      real: null, translation: null, speakerName,
    };
  }

  if (!realMode) {
    const text = degrade(english, level, seedText);
    const cue = level === 'fragments' ? nonverbalCue(state, side, intent) : null;
    return {
      side, text, action: cue?.text ?? null, cueId: cue?.id ?? null,
      physicalAnimation: cue?.animation ?? null, real: null,
      translation: null, speakerName,
    };
  }

  if (!lang) {
    return {
      side, text: english, action: null, cueId: null, physicalAnimation: null,
      real: null, translation: null, speakerName,
    };
  }

  const attested = attestedPhrase(lang, intent);
  const wordCount = Math.max(2, Math.min(9, Math.round(english.split(' ').length * 0.6)));
  const realText = attested ?? utterance(lang, seedText, wordCount);
  const understood = state.comm.score >= 0.3;
  const cue = level === 'fragments' ? nonverbalCue(state, side, intent) : null;

  return {
    side,
    text: '',
    action: cue?.text ?? null,
    cueId: cue?.id ?? null,
    physicalAnimation: cue?.animation ?? null,
    real: {
      text: realText,
      language: lang.name,
      reconstructed: !!lang.isReconstructed,
      attested: attested !== null,
    },
    translation: understood ? degrade(english, level, seedText) : null,
    speakerName,
  };
}
