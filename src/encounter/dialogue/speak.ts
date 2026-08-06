/**
 * encounter/dialogue/speak.ts
 *
 * Turns a SpeakIntent into what the dialogue box shows. Each figure speaks
 * their own language — the line comes from that language's table — and both
 * understand one another, as if by magic. The move's English gloss is the
 * caption the player reads.
 */

import { makeRng, hashString } from '../../components/portraitLab/core/rng';
import { EncounterState, Side, SpeakIntent } from '../engine/battle';
import { Move, MOVES, MoveId, speakerClass } from './moves';
import { LINE_TABLES } from './lines';

/** "Chadic (reconstructed)" → "Chadic"; the recon flag carries that fact once. */
export function displayLanguageName(name: string): string {
  return name.replace(/\s*\([^)]*(?:reconstruct|hypothetic)[^)]*\)/gi, '').trim();
}

export interface SpokenLine {
  side: Side;
  moveId: MoveId;
  /** The line in the speaker's own language. */
  text: string;
  /** The English gloss shown beneath it. */
  gloss: string;
  language: string | null;
  reconstructed: boolean;
  speakerName: string;
}

/** The talk move the other side just played — what a reply is replying to. */
function lastTalkMove(state: EncounterState, side: Side): Move | null {
  const history = state.spokenHistory[side];
  for (let i = history.length - 1; i >= 0; i--) {
    const move = MOVES.find((m) => m.id === history[i]);
    if (move?.intent === 'talk') return move;
  }
  return null;
}

export function speakLine(state: EncounterState, side: Side, intent: SpeakIntent): SpokenLine {
  const me = side === 'left' ? state.left.persona : state.right.persona;
  const other: Side = side === 'left' ? 'right' : 'left';
  const c = me.character;
  const rng = makeRng(hashString(`${state.seed}|${state.turn}|${side}|${intent}`));

  const cls = speakerClass(c.profession);
  const pious = !!c.religion && (c.personality?.conscientiousness ?? 50) > 55;
  const wary = (c.personality?.agreeableness ?? 50) < 40;
  const weight = (m: Move): number => {
    if (m.tag === 'any') return 1;
    if (m.tag === 'pious') return pious ? 4 : 0.15;
    if (m.tag === 'wary') return wary ? 4 : 0.15;
    return m.tag === cls ? 4 : 0; // a laborer never claims an elite's work
  };

  // Replies answer what was actually said: a question gets an answer or an
  // honest miss, never warm agreement; a proverb earns proverb-shaped warmth.
  let pool: Move[] | null = null;
  if (intent === 'talk-warm' || intent === 'talk-miss') {
    const asked = lastTalkMove(state, other);
    if (asked?.kind === 'question') {
      if (intent === 'talk-warm') {
        pool = asked.id.startsWith('work-')
          ? MOVES.filter((m) => m.id === `work-${cls}`)
          : MOVES.filter((m) => m.answers?.includes(asked.id as never) && weight(m) > 0);
        if (!pool.length) pool = MOVES.filter((m) => m.id === 'miss-custom');
      } else {
        pool = MOVES.filter((m) => m.id === 'miss-follow' || m.id === 'miss-nothing');
      }
    } else if (asked?.kind === 'proverb' && intent === 'talk-warm') {
      pool = MOVES.filter((m) => m.id === 'warm-grandmother' || m.id === 'warm-wellsaid');
    }
  }

  let candidates = pool ?? MOVES.filter((m) => m.intent === intent && !m.answers && weight(m) > 0);
  if (!candidates.length) candidates = MOVES.filter((m) => m.intent === 'talk' && !m.answers);
  const spoken = state.spokenHistory[side];
  const fresh = candidates.filter((m) => !spoken.includes(m.id));
  if (fresh.length) candidates = fresh;

  const total = candidates.reduce((sum, m) => sum + Math.max(weight(m), 0.05), 0);
  let roll = rng() * total;
  let move = candidates[candidates.length - 1];
  for (const m of candidates) {
    roll -= Math.max(weight(m), 0.05);
    if (roll <= 0) { move = m; break; }
  }

  const lang = me.languageData;
  const table = lang ? LINE_TABLES[lang.id] : undefined;
  const raw = table?.[move.id];
  const firstName = c.name.split(' ')[0];
  return {
    side,
    moveId: move.id,
    text: (raw ?? move.gloss).replace('{name}', firstName),
    gloss: move.gloss.replace('{name}', firstName),
    // Untranslated move in a covered language: English must not wear the
    // language's label, so fall back per line, not per language.
    language: raw ? displayLanguageName(lang!.name) : null,
    reconstructed: !!lang?.isReconstructed,
    speakerName: firstName,
  };
}
