/**
 * encounter/dialogue/moves.ts
 *
 * The canonical move list: every sayable thing in an encounter, with its
 * English gloss. Translations live in lines/, one table per language, keyed
 * by MoveId. The conceit: each figure speaks their own tongue and both
 * understand, as if by magic. The gloss is what the player reads; the
 * translation is idiomatic, not word-for-word, so glosses are approximate
 * by design.
 */

import { SpeakIntent } from '../engine/battle';

export type SpeakerClass = 'laborer' | 'artisan' | 'merchant' | 'cleric' | 'soldier' | 'elite';
export type MoveTag = SpeakerClass | 'pious' | 'wary' | 'any';

export type CoreMoveId =
  | 'greet-plain' | 'greet-wary' | 'greet-peace'
  | 'ask-name'
  | 'work-laborer' | 'work-artisan' | 'work-merchant' | 'work-cleric' | 'work-soldier' | 'work-elite'
  | 'ask-food' | 'ask-gods' | 'ask-year' | 'ask-people'
  | 'small-weather' | 'saying-road'
  | 'warm-same' | 'warm-wellsaid' | 'warm-grandmother'
  | 'miss-follow' | 'miss-custom' | 'miss-nothing'
  | 'laugh-ribs' | 'laugh-more'
  | 'observe-look' | 'observe-clothes'
  | 'offer-look' | 'offer-fair'
  | 'accept-done' | 'accept-hand'
  | 'refuse-need' | 'refuse-insult'
  | 'caught-saw' | 'caught-thief'
  | 'befriend-door' | 'befriend-alike'
  | 'notyet-slow' | 'notyet-burned'
  | 'threat-once' | 'threat-buried'
  | 'attack-enough' | 'attack-forgive'
  | 'hurt-pay' | 'hurt-strong'
  | 'ko-sky' | 'ko-yield'
  | 'flee-madness' | 'flee-never'
  | 'blocked-stay'
  | 'friends-settled' | 'friends-tale'
  | 'snap-enough';

/** Answers to the question moves. Optional per language: untranslated answers
 *  fall back to the English gloss line by line, so coverage can grow later
 *  without re-running whole batches. */
export type AnswerMoveId =
  | 'answer-name-plain' | 'answer-name-father'
  | 'answer-food-humble' | 'answer-food-proud'
  | 'answer-gods-pious' | 'answer-gods-plain' | 'answer-gods-wry'
  | 'answer-year-sure' | 'answer-year-now'
  | 'answer-people-proud' | 'answer-people-far'
  | 'answer-vague';

export type MoveId = CoreMoveId | AnswerMoveId;

/** One language's lines. Core moves required; answer moves optional. */
export type LineTable = Record<CoreMoveId, string> & Partial<Record<AnswerMoveId, string>>;

export interface Move {
  id: MoveId;
  intent: SpeakIntent;
  /** What the player reads beneath the spoken line. */
  gloss: string;
  tag: MoveTag;
  /** Register guidance for translators. */
  note: string;
  /** Shapes what may answer it: warm agreement never follows a question. */
  kind?: 'question' | 'proverb';
  /** This move is a dedicated answer to these questions, never an opener. */
  answers?: CoreMoveId[];
}

export const MOVES: Move[] = [
  { id: 'greet-plain', intent: 'greet', tag: 'any',
    gloss: 'Well met, stranger.',
    note: 'Neutral greeting to an unknown person.' },
  { id: 'greet-wary', intent: 'greet', tag: 'wary',
    gloss: 'Who walks here? Show your hands.',
    note: 'Suspicious challenge.' },
  { id: 'greet-peace', intent: 'greet', tag: 'pious',
    gloss: 'Peace be upon you. I mean no harm.',
    note: 'Religious-register greeting of peace; use the language’s own formula where one exists.' },

  { id: 'ask-name', intent: 'talk', tag: 'any', kind: 'question',
    gloss: 'Tell me the name your people call you.',
    note: 'A plain "what is your name" is fine where more natural.' },
  { id: 'work-laborer', intent: 'talk', tag: 'laborer', kind: 'question',
    gloss: 'I work with my hands from first light to dark. And you — what fills your days?',
    note: 'Plain speech, a little tired.' },
  { id: 'work-artisan', intent: 'talk', tag: 'artisan', kind: 'question',
    gloss: 'I make things with my hands, and people pay what they can. What work do yours do?',
    note: 'Quiet pride of craft.' },
  { id: 'work-merchant', intent: 'talk', tag: 'merchant', kind: 'question',
    gloss: 'I buy, I sell, I carry goods from town to town. And you?',
    note: 'Brisk, unashamed.' },
  { id: 'work-cleric', intent: 'talk', tag: 'cleric', kind: 'question',
    gloss: 'My work is prayer, and the keeping of holy words.',
    note: 'Adapt "prayer" and "holy words" to the language’s religious world.' },
  { id: 'work-soldier', intent: 'talk', tag: 'soldier', kind: 'question',
    gloss: 'I have carried weapons for my bread. And you?',
    note: 'Flat, unboastful.' },
  { id: 'work-elite', intent: 'talk', tag: 'elite', kind: 'question',
    gloss: 'Other hands work my land. Mine is the work of commanding. And yours?',
    note: 'Assured, courteous, unembarrassed.' },
  { id: 'ask-food', intent: 'talk', tag: 'any', kind: 'question',
    gloss: 'What do people eat, where you come from?',
    note: 'Genuine curiosity.' },
  { id: 'ask-gods', intent: 'talk', tag: 'any', kind: 'question',
    gloss: 'Which gods do your people serve?',
    note: 'Adapt to the language’s world: a monotheist era may ask "how do you pray".' },
  { id: 'ask-year', intent: 'talk', tag: 'any', kind: 'question',
    gloss: 'What year is it, by your counting?',
    note: 'The question that betrays the whole situation.' },
  { id: 'ask-people', intent: 'talk', tag: 'any', kind: 'question',
    gloss: 'Tell me of your people.',
    note: 'Open, unhurried.' },
  { id: 'small-weather', intent: 'talk', tag: 'any',
    gloss: 'Strange weather for the season, is it not?',
    note: 'Small talk; every culture has a version.' },
  { id: 'saying-road', intent: 'talk', tag: 'any', kind: 'proverb',
    gloss: 'Where I come from we say: a road shared is half as long.',
    note: 'Render as a plausible local proverb with this meaning, not a word-for-word calque.' },

  { id: 'warm-same', intent: 'talk-warm', tag: 'any',
    gloss: 'Ha — yes! It is the same with us.',
    note: 'Delighted recognition.' },
  { id: 'warm-wellsaid', intent: 'talk-warm', tag: 'any',
    gloss: 'That is well said.',
    note: 'Measured approval.' },
  { id: 'warm-grandmother', intent: 'talk-warm', tag: 'any',
    gloss: 'My grandmother used to say the same.',
    note: 'Fond, a little surprised.' },

  { id: 'miss-follow', intent: 'talk-miss', tag: 'any',
    gloss: 'I do not follow you.',
    note: 'Honest confusion, no hostility.' },
  { id: 'miss-custom', intent: 'talk-miss', tag: 'any',
    gloss: 'We do things otherwise, where I am from.',
    note: 'Polite disagreement.' },
  { id: 'miss-nothing', intent: 'talk-miss', tag: 'any',
    gloss: 'Your words mean nothing to me. Say it another way.',
    note: 'Blunt but not aggressive.' },

  { id: 'laugh-ribs', intent: 'laugh', tag: 'any',
    gloss: 'Stop — stop! My ribs!',
    note: 'Helpless laughter; idiom for it varies (ribs, belly, sides).' },
  { id: 'laugh-more', intent: 'laugh', tag: 'any',
    gloss: 'You are a terrible person. Tell me another.',
    note: 'Mock reproach, delighted.' },

  { id: 'observe-look', intent: 'observe', tag: 'any',
    gloss: 'Hold still a moment. Let me look at you.',
    note: 'Frank examination of a stranger.' },
  { id: 'observe-clothes', intent: 'observe', tag: 'any',
    gloss: 'I have never seen cloth like that in my life.',
    note: 'Wonder, not mockery.' },

  { id: 'offer-look', intent: 'trade-offer', tag: 'any',
    gloss: 'Look at this. What will you give me for it?',
    note: 'Market register.' },
  { id: 'offer-fair', intent: 'trade-offer', tag: 'merchant',
    gloss: 'A fair trade makes two friends.',
    note: 'Merchant’s proverb; adapt idiomatically.' },

  { id: 'accept-done', intent: 'trade-accept', tag: 'any',
    gloss: 'Done — and gladly.',
    note: 'Sealing a bargain.' },
  { id: 'accept-hand', intent: 'trade-accept', tag: 'any',
    gloss: 'My hand on it.',
    note: 'Use the culture’s own gesture of agreement if hands were not it.' },

  { id: 'refuse-need', intent: 'trade-refuse', tag: 'any',
    gloss: 'No. I have no need of it.',
    note: 'Flat refusal.' },
  { id: 'refuse-insult', intent: 'trade-refuse', tag: 'any',
    gloss: 'You offer me that? You insult us both.',
    note: 'Offended pride.' },

  { id: 'caught-saw', intent: 'steal-caught', tag: 'any',
    gloss: 'Your hand! I saw your hand!',
    note: 'Shouted.' },
  { id: 'caught-thief', intent: 'steal-caught', tag: 'any',
    gloss: 'Thief! Thief!',
    note: 'The cry that raises a market.' },

  { id: 'befriend-door', intent: 'befriend', tag: 'any',
    gloss: 'If you ever come to my country, my door stands open to you.',
    note: 'Formal hospitality; most cultures have a formula.' },
  { id: 'befriend-alike', intent: 'befriend', tag: 'any',
    gloss: 'We are not so different, you and I.',
    note: 'Quiet, direct.' },

  { id: 'notyet-slow', intent: 'befriend-not-yet', tag: 'any',
    gloss: 'Slowly, friend. Trust is built, not declared.',
    note: 'Gentle rebuff; proverb register welcome.' },
  { id: 'notyet-burned', intent: 'befriend-not-yet', tag: 'wary',
    gloss: 'You are kind. But I have been deceived before.',
    note: 'Guarded.' },

  { id: 'threat-once', intent: 'threat', tag: 'any',
    gloss: 'Stay back. I warn you only once.',
    note: 'Cold, controlled.' },
  { id: 'threat-buried', intent: 'threat', tag: 'soldier',
    gloss: 'I have buried better men than you.',
    note: 'Veteran’s menace.' },

  { id: 'attack-enough', intent: 'attack', tag: 'any',
    gloss: 'Enough of this!',
    note: 'The moment words end.' },
  { id: 'attack-forgive', intent: 'attack', tag: 'pious',
    gloss: 'May God forgive me for what I do now.',
    note: 'Adapt the divine reference to the language’s era and world.' },

  { id: 'hurt-pay', intent: 'hurt', tag: 'any',
    gloss: 'You will pay for that!',
    note: 'Pain and fury.' },
  { id: 'hurt-strong', intent: 'hurt', tag: 'any',
    gloss: 'You strike harder than you look.',
    note: 'Grudging respect through gritted teeth.' },

  { id: 'ko-sky', intent: 'ko', tag: 'any',
    gloss: 'The sky is very wide today...',
    note: 'Fading; delirious calm.' },
  { id: 'ko-yield', intent: 'ko', tag: 'any',
    gloss: 'Enough... you have won.',
    note: 'Surrender.' },

  { id: 'flee-madness', intent: 'flee', tag: 'any',
    gloss: 'This is madness. I am going.',
    note: 'Disgust more than fear.' },
  { id: 'flee-never', intent: 'flee', tag: 'any',
    gloss: 'May we never meet again!',
    note: 'A parting curse, or nearly one.' },

  { id: 'blocked-stay', intent: 'flee-blocked', tag: 'any',
    gloss: 'Not so fast. You stay.',
    note: 'Quiet command.' },

  { id: 'friends-settled', intent: 'friendship', tag: 'any',
    gloss: 'Then it is settled: friends, whatever the years may say.',
    note: 'Warm, final.' },
  { id: 'friends-tale', intent: 'friendship', tag: 'any',
    gloss: 'No one at home will believe a word of this. Friend!',
    note: 'Laughing disbelief.' },

  { id: 'snap-enough', intent: 'snap', tag: 'any',
    gloss: 'ENOUGH! I cannot bear this any longer!',
    note: 'The breaking point; render the shout.' },

  // --- Answers. Selected only when the other side just asked the matching
  // question; {name} is the speaker's own name, inserted untranslated.
  { id: 'answer-name-plain', intent: 'talk-warm', tag: 'any', answers: ['ask-name'],
    gloss: 'I am called {name}.',
    note: 'Keep {name} as a literal placeholder.' },
  { id: 'answer-name-father', intent: 'talk-warm', tag: 'any', answers: ['ask-name'],
    gloss: '{name} — as my father was called before me.',
    note: 'Keep {name} as a literal placeholder.' },
  { id: 'answer-food-humble', intent: 'talk-warm', tag: 'any', answers: ['ask-food'],
    gloss: 'What there is. Grain when the harvest is good; less when it is not.',
    note: 'Adapt the staple to the language’s world if grain is wrong.' },
  { id: 'answer-food-proud', intent: 'talk-warm', tag: 'any', answers: ['ask-food'],
    gloss: 'Better than anything you have ever tasted, stranger.',
    note: 'Grinning, not hostile.' },
  { id: 'answer-gods-pious', intent: 'talk-warm', tag: 'pious', answers: ['ask-gods'],
    gloss: 'The gods of my mothers and fathers. Who else?',
    note: 'Adapt number and register to the language’s religious world.' },
  { id: 'answer-gods-plain', intent: 'talk-warm', tag: 'any', answers: ['ask-gods'],
    gloss: 'I keep the rites and do not ask questions.',
    note: 'Practical piety.' },
  { id: 'answer-gods-wry', intent: 'talk-warm', tag: 'wary', answers: ['ask-gods'],
    gloss: 'Whichever one is listening. Lately it is hard to tell.',
    note: 'Dry, a little weary; not blasphemous.' },
  { id: 'answer-year-sure', intent: 'talk-warm', tag: 'any', answers: ['ask-year'],
    gloss: 'I can tell you our count, but I doubt it matches yours.',
    note: 'Half-suspecting the truth of the situation.' },
  { id: 'answer-year-now', intent: 'talk-warm', tag: 'laborer', answers: ['ask-year'],
    gloss: 'The year? It is now. The harvest tells me all I need of years.',
    note: 'Unbothered.' },
  { id: 'answer-people-proud', intent: 'talk-warm', tag: 'any', answers: ['ask-people'],
    gloss: 'Good people. Hard in a bargain, soft with their children.',
    note: 'Fond and plain.' },
  { id: 'answer-people-far', intent: 'talk-warm', tag: 'wary', answers: ['ask-people'],
    gloss: 'Far from here. And better for being far.',
    note: 'Closed door; the subject is over.' },
  { id: 'answer-vague', intent: 'talk-warm', tag: 'any',
    answers: ['ask-name', 'ask-gods', 'ask-year', 'ask-people'],
    gloss: 'That is a long story, and the road is short.',
    note: 'A polite deflection; proverb register welcome.' },
];

export const MOVE_IDS: MoveId[] = MOVES.map((m) => m.id);

const CLASS_PATTERNS: Array<[RegExp, SpeakerClass]> = [
  [/priest|monk|nun|imam|rabbi|shaman|lama|cleric|preacher|missionar|theolog|diviner|oracle|mullah|friar|abbot|bishop|temple/i, 'cleric'],
  [/soldier|warrior|guard|knight|samurai|archer|mercenar|raider|general|captain|admiral|cavalr|infantry|gladiator/i, 'soldier'],
  [/merchant|trader|peddler|shopkeep|dealer|vendor|banker|moneylender|broker|caravan/i, 'merchant'],
  [/noble|lord|lady|king|queen|prince|princess|chief|emperor|empress|official|magistrate|landowner|aristocrat|courtier|governor|sultan|khan|duke/i, 'elite'],
  [/smith|weaver|potter|carpenter|mason|tailor|cobbler|jewel|scribe|painter|sculptor|baker|brewer|calligrapher|printer|engraver|artist|craft|dyer|glassblower|cooper|tanner/i, 'artisan'],
];

export function speakerClass(profession: string | undefined): SpeakerClass {
  for (const [pattern, cls] of CLASS_PATTERNS) {
    if (pattern.test(profession || '')) return cls;
  }
  return 'laborer';
}
