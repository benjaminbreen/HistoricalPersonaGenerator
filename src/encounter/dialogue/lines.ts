/**
 * encounter/dialogue/lines.ts
 *
 * The English "translation convention" text — what an RPG box would show.
 * Slots: {name} the other party, {trade} the speaker's own work, {place} the
 * speaker's home ground. Variants stay plain; flavor comes from the speaker's
 * register, applied in speak.ts.
 */

import { SpeakIntent } from '../engine/battle';

export const LINE_BANK: Record<SpeakIntent, string[]> = {
  greet: [
    'Well met, stranger.',
    'Peace on you. I mean no harm.',
    'You are not from {place}. Nor anywhere near it, I think.',
    'I was not expecting company.',
    'Who walks here? Show your hands.',
    'A traveler? You look far from your road.',
  ],
  talk: [
    'Where I come from, we say a road shared is half as long.',
    'What do they eat, where you are from?',
    'I work as a {trade}. And you? What fills your days?',
    'Strange weather for this season, no?',
    'You carry yourself like someone with a story.',
    'Tell me of your people.',
    'What year is it, by your counting?',
  ],
  'talk-warm': [
    'Ha! Yes. It is the same with us.',
    'Now that I understand. Go on.',
    'You speak sense, for a stranger.',
    'I have thought the same thing my whole life.',
    'My grandmother said something like that.',
    'That is well said.',
  ],
  'talk-miss': [
    'I... do not follow you.',
    'Hm. Perhaps.',
    'You lost me at the start of that.',
    'We do things differently, where I am from.',
    'That means nothing to me.',
    'Why would anyone do such a thing?',
  ],
  laugh: [
    'Ha! Hahaha! Where did you learn that one?',
    'Stop, stop — my ribs!',
    'By all that is holy, that is the truth!',
    'You are terrible. Tell me another.',
  ],
  observe: [
    'Hold still a moment. Let me look at you.',
    'Hm. Those hands have worked.',
    'Your clothes... I have never seen the like.',
    'I am trying to place you, and I cannot.',
  ],
  'trade-offer': [
    'Here — look at this. What will you give for it?',
    'I have goods, you have goods. Shall we?',
    'This is fine work. Feel the weight of it.',
    'A fair exchange makes two friends.',
  ],
  'trade-accept': [
    'Done. And done gladly.',
    'You drive a fair bargain.',
    'My hand on it.',
    'This will serve me well. Take yours.',
  ],
  'trade-refuse': [
    'For that? You insult us both.',
    'No. I have no need of it.',
    'Keep it. And keep your distance.',
    'My goods are not for you.',
  ],
  'steal-caught': [
    'Hey! HEY! Your hand — I saw that!',
    'Thief! THIEF!',
    'That is MINE, you gutter-born wretch!',
    'I knew it. I knew what you were.',
  ],
  befriend: [
    'Listen. I do not meet many I would call friend. But you...',
    'If you ever pass through {place}, my door is open.',
    'We are not so different, you and I.',
    'I would be glad to know your name, and keep it.',
  ],
  'befriend-not-yet': [
    'You are kind. But I hardly know you.',
    'Slow down, stranger. Friendship is built, not declared.',
    'Perhaps. Let us talk a while longer first.',
    'I have been burned before. Give it time.',
  ],
  threat: [
    'Stay back. I am warning you once.',
    'I have buried better than you.',
    'Take one more step and learn what a {trade} can do.',
    'You picked the wrong stranger.',
  ],
  attack: [
    'Enough of this!',
    'Have at you, then!',
    'The gods forgive me —',
    'I did not want this. But here we are.',
  ],
  hurt: [
    'Agh! You will pay for that!',
    'A scratch. A SCRATCH!',
    'So that is how it is.',
    'Oof — you hit harder than you look.',
  ],
  ko: [
    'The sky... is very wide today...',
    'Enough... enough. You have won.',
    'Mother... is that you...?',
    'Tell them... I fought a stranger from another world...',
  ],
  flee: [
    'This is madness. I am leaving.',
    'Keep your quarrel. I have a life to get back to.',
    'May we never meet again!',
    'The road called. I answer it. Farewell!',
  ],
  'flee-blocked': [
    'Running? From ME?',
    'Not so fast, stranger.',
    'The road is closed to you.',
    'You leave when I say you leave.',
  ],
  friendship: [
    'Then it is settled. Friends — whatever the years and miles say.',
    'Come. Sit. Friends do not stand around like strangers.',
    'My people will not believe a word of this. Friend.',
    'The world is stranger and kinder than I knew.',
  ],
  snap: [
    'ENOUGH! I cannot bear this any longer!',
    'No more words. WORDS ARE DONE!',
    'You think I do not see what you are?!',
  ],
};

/** Curt, blunt speakers cut lines down; effusive ones pad them out. */
export const REGISTER_PREFIX = {
  effusive: ['Ah — ', 'Truly, ', 'Listen, friend: ', 'By my life, '],
  blunt: [] as string[],
};
