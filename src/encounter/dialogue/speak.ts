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
import { attestedPhrase, degrade, gestureFor, utterance } from './voice';

export interface SpokenLine {
  side: Side;
  /** What the box prints. Empty when the whole line is pantomime. */
  text: string;
  /** Stage direction, shown in italics: gesture, pantomime. */
  action: string | null;
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
    return {
      side, text: '', action: gestureFor(intent, seedText), real: null,
      translation: null, speakerName,
    };
  }

  if (!realMode) {
    const text = degrade(english, level, seedText);
    const action = level === 'fragments' ? gestureFor(intent, seedText) : null;
    return { side, text, action, real: null, translation: null, speakerName };
  }

  if (!lang) {
    return { side, text: english, action: null, real: null, translation: null, speakerName };
  }

  const attested = attestedPhrase(lang, intent);
  const wordCount = Math.max(2, Math.min(9, Math.round(english.split(' ').length * 0.6)));
  const realText = attested ?? utterance(lang, seedText, wordCount);
  const understood = state.comm.score >= 0.3;

  return {
    side,
    text: '',
    action: level === 'fragments' ? gestureFor(intent, seedText) : null,
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
