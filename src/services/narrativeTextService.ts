import type { EnhancedLifeEvent } from '../constants/characterData/lifeHistoryService';
import type { Ideology } from '../types/knowledge';

export interface NarrativePronouns {
  subject: 'he' | 'she' | 'they';
  object: 'him' | 'her' | 'them';
  possessive: 'his' | 'her' | 'their';
  possessiveCap: 'His' | 'Her' | 'Their';
  be: 'is' | 'are';
}

export function getNarrativePronouns(gender: string): NarrativePronouns {
  if (gender === 'Male') {
    return { subject: 'he', object: 'him', possessive: 'his', possessiveCap: 'His', be: 'is' };
  }
  if (gender === 'Female') {
    return { subject: 'she', object: 'her', possessive: 'her', possessiveCap: 'Her', be: 'is' };
  }
  return { subject: 'they', object: 'them', possessive: 'their', possessiveCap: 'Their', be: 'are' };
}

const stripTerminalPunctuation = (text: string): string => text.trim().replace(/[.!?;:,]+$/g, '');
const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * Conjugate a bare verb for the narrative subject. Replaces the scattered
 * `pronounBe === 'are' ? '' : 's'` ternaries, which had to be repeated at every
 * verb and got the irregulars wrong.
 */
const IRREGULAR_VERBS: Record<string, [singular: string, plural: string]> = {
  be: ['is', 'are'],
  is: ['is', 'are'],
  are: ['is', 'are'],
  have: ['has', 'have'],
  has: ['has', 'have'],
  do: ['does', 'do'],
  does: ['does', 'do'],
  go: ['goes', 'go'],
  goes: ['goes', 'go'],
  was: ['was', 'were'],
  were: ['was', 'were'],
};

export function conjugate(verb: string, pronouns: NarrativePronouns): string {
  const plural = pronouns.subject === 'they';
  const irregular = IRREGULAR_VERBS[verb.toLowerCase()];
  if (irregular) return irregular[plural ? 1 : 0];
  if (plural) return verb;
  if (/(?:s|sh|ch|x|z|o)$/i.test(verb)) return `${verb}es`;
  if (/[^aeiou]y$/i.test(verb)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

/**
 * Profession names are stored in Title Case for labels ("Field Hand"), which
 * reads wrong mid-sentence. Lowercase them unless the word is a genuine proper
 * noun or a title that keeps its capital.
 */
const PROPER_PROFESSION_WORDS = /^(?:Roman|Greek|Norse|Aztec|Inca|Maya|Mughal|Ottoman|Qing|Ming|Han|Tang|Song|Viking|Samurai|Shinto|Buddhist|Christian|Jewish|Muslim|Hindu|Sufi|Zen|Brahmin|Cossack|Bedouin|Tuareg|Maori|Sami|Ainu|Janissary|Templar|Jesuit|Franciscan|Dominican|Benedictine)$/;

export function lowerProfession(profession: string | undefined): string {
  if (!profession) return 'laborer';
  return profession
    .split(' ')
    .map(word => (PROPER_PROFESSION_WORDS.test(word) ? word : word.toLowerCase()))
    .join(' ');
}

export function withIndefiniteArticle(text: string): string {
  const trimmed = text.trim();
  const takesA = /^(?:uni(?:vers|form)|use|user|euro|one\b)/i.test(trimmed);
  const takesAn = /^(?:8|11|18|honest|honor|hour|heir)/i.test(trimmed);
  return `${takesAn || (!takesA && /^[aeiou]/i.test(trimmed)) ? 'an' : 'a'} ${trimmed}`;
}

/**
 * Whether a disease name takes a plural verb.
 *
 * Guessing from a trailing "s" gets both directions wrong: tetanus, typhus and
 * measles are singular, while worms and chilblains are plural. The exceptions
 * are the whole problem, so they are listed rather than inferred.
 */
const SINGULAR_DESPITE_S = /^(tetanus|typhus|measles|mumps|shingles|scabies|rabies|syphilis|tuberculosis|rickets|smallpox|pox|chickenpox|herpes|scrofulous|the stone)$/i;
const KNOWN_PLURAL = /^(intestinal worms|worms|chilblains|boils|sores|fits|lice|nits|hives|piles|cramps|convulsions|night sweats)$/i;

export function isPluralDiseaseName(name: string): boolean {
  const trimmed = (name || '').trim().toLowerCase();
  if (KNOWN_PLURAL.test(trimmed)) return true;
  if (SINGULAR_DESPITE_S.test(trimmed)) return false;
  return /(?<!s|u|i)s$/.test(trimmed);
}

export function describePhysicalAppearance(
  appearance: { height?: number; build?: string } | undefined,
  pronouns: NarrativePronouns,
  birthSex?: 'Male' | 'Female',
  /**
   * Seeded chooser. Optional so callers that only want the plainest form —
   * the persona card's appearance line — keep the first phrasing.
   *
   * Without this the sentence had exactly three shapes, and "His build is
   * short." was measured as the single most repeated sentence in the whole
   * corpus at 2.2% of all generated sentences.
   */
  pick?: <T>(values: T[]) => T,
): string {
  if (!appearance) return '';

  // The old thresholds were sex-blind, so nearly every woman in the app was
  // described as short. Only remark on height at genuine extremes for the
  // persona's own sex.
  const [shortBelow, tallAbove] = birthSex === 'Female' ? [150, 176] : [160, 186];
  const height = appearance.height && appearance.height > tallAbove
    ? 'tall'
    : appearance.height && appearance.height < shortBelow
      ? 'short'
      : '';
  const build = appearance.build && appearance.build !== 'average'
    ? appearance.build.toLowerCase()
    : '';
  const subjectCap = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);
  const choose = pick ?? (<T,>(values: T[]): T => values[0]);

  if (height && build && height !== build) {
    return choose([
      `${pronouns.possessiveCap} frame ${pronouns.be} ${height} and ${build}.`,
      `${subjectCap} ${pronouns.be} ${height}, and ${build} with it.`,
      `People remember ${pronouns.object} as ${height} and ${build}.`,
    ]);
  }
  if (height) {
    return choose([
      `${subjectCap} ${pronouns.be} ${height}.`,
      height === 'tall'
        ? `${subjectCap} ${conjugate('stand', pronouns)} a head above most of ${pronouns.possessive} neighbors.`
        : `${subjectCap} ${pronouns.be} small, and always ${pronouns.subject === 'they' ? 'were' : 'was'}.`,
      `${pronouns.possessiveCap} height ${pronouns.be} the first thing said about ${pronouns.object}.`,
    ]);
  }
  if (build) {
    return choose([
      `${pronouns.possessiveCap} build ${pronouns.be} ${build}.`,
      `${subjectCap} ${pronouns.be} ${build} in build.`,
      `${pronouns.possessiveCap} frame ${pronouns.be} ${build}.`,
    ]);
  }
  return '';
}

/**
 * Event texts come in two shapes: bare predicates that need a subject supplied
 * ("began learning the trade"), and complete clauses that already have one
 * ("Swarms of locusts descended on the fields").
 *
 * This used to list the subjects, which is an open set — every noun any
 * template might open with. "Swarms" was not on it, so a persona's biography
 * read "At age 82, you swarms of locusts descended on the fields". Listing the
 * *verbs* instead is a closed set, and it fails in the safe direction: an
 * opening we do not recognise is left as-is, which reads correctly, rather
 * than having a pronoun stapled to the front of it.
 */
const PREDICATE_OPENERS =
  /^(?:[a-z]+ed|began|broke|brought|built|bought|came|caught|chose|did|drew|drove|fell|fought|found|gave|went|grew|had|heard|held|kept|knew|laid|led|left|lost|made|met|paid|put|ran|rose|said|sang|sat|saw|sold|sent|set|shot|showed|sought|spent|spoke|stood|struck|swore|took|taught|told|took|understood|wore|won|wrote|bore|bound|dug|fed|felt|fled|flew|forgot|froze|hid|hit|hung|hurt|lay|lent|lit|meant|rode|rang|shook|shrank|slept|slid|spun|spread|stole|stuck|stung|swam|swept|swung|tore|threw|woke|wove)\b/i;

function eventAlreadyHasSubject(text: string): boolean {
  return !PREDICATE_OPENERS.test(text);
}

/**
 * An event as a bare clause, with no date marker and no terminal stop, so that
 * callers can join two of them into one sentence. Every event used to be
 * rendered straight into "At age N, …", which is why a biography read as a
 * chronology: nothing could be said about how one event followed from another.
 */
export function lifeEventClause(
  event: Pick<EnhancedLifeEvent, 'text'>,
  pronouns: NarrativePronouns,
): string {
  const text = stripTerminalPunctuation(event.text);
  if (!text) return '';

  if (/^(?:father|mother|brother|sister)\b/i.test(text)) {
    return `${pronouns.possessive} ${lowerFirst(text)}`;
  }
  if (eventAlreadyHasSubject(text)) return lowerFirst(text);
  if (/^(?:admitted|cast out|chosen|elected|forced|invited|placed|required|sent|taken|taught|trusted|allowed)\b/i.test(text)) {
    return `${pronouns.subject} ${pronouns.subject === 'they' ? 'were' : 'was'} ${lowerFirst(text)}`;
  }
  return `${pronouns.subject} ${lowerFirst(text)}`;
}

export function describeLifeEvent(
  event: Pick<EnhancedLifeEvent, 'text'>,
  ageAtEvent: number,
  pronouns: NarrativePronouns,
): string {
  const clause = lifeEventClause(event, pronouns);
  return clause ? `At age ${ageAtEvent}, ${clause}.` : '';
}

export function describeLifeEventSecondPerson(
  event: Pick<EnhancedLifeEvent, 'text'>,
  ageAtEvent: number,
): string {
  const text = stripTerminalPunctuation(event.text);
  if (!text) return '';

  let clause: string;
  if (/^(?:father|mother|brother|sister)\b/i.test(text)) {
    clause = `your ${lowerFirst(text)}`;
  } else if (eventAlreadyHasSubject(text)) {
    clause = lowerFirst(text);
  } else if (/^(?:admitted|cast out|chosen|elected|forced|invited|placed|required|sent|taken|taught|trusted|allowed)\b/i.test(text)) {
    clause = `you were ${lowerFirst(text)}`;
  } else {
    clause = `you ${lowerFirst(text)}`;
  }
  return `At age ${ageAtEvent}, ${clause}.`;
}

export function describeBeliefSecondPerson(beliefText: string): string {
  const text = stripTerminalPunctuation(beliefText);
  const transformations: Array<[RegExp, string]> = [
    [/^Believes that\s+/i, 'You believe that '],
    [/^Believes in\s+/i, 'You believe in '],
    [/^Believes\s+/i, 'You believe '],
    [/^Views\s+/i, 'You view '],
    [/^Seeks\s+/i, 'You seek '],
    [/^Practices\s+/i, 'You practice '],
    [/^Follows\s+/i, 'You follow '],
    [/^Deeply venerates\s+/i, 'You deeply venerate '],
    [/^Considers\s+/i, 'You consider '],
  ];
  for (const [pattern, replacement] of transformations) {
    if (pattern.test(text)) return `${text.replace(pattern, replacement)}.`;
  }
  return `Your guiding belief is that ${lowerFirst(text)}.`;
}

/**
 * Ideology descriptions in the table come in two shapes: a third-person verb
 * phrase ("Values tradition, hierarchy, continuity") and a noun phrase
 * ("Buddhist path emphasizing liberation"), and each needs its own frame.
 *
 * The list below is the fast path. The shape test behind it is what stops a
 * newly added entry from being silently mistaken for a noun and given an
 * article: "Holds that history moves by class struggle" rendered as "the Holds
 * that history moves by class struggle" in 6% of biographies, and nothing in
 * the audit noticed, because the list was the only thing consulted.
 */
const IDEOLOGY_VERB_HEADS = new Set([
  'values', 'seeks', 'believes', 'emphasizes', 'pursues', 'prioritizes',
  'champions', 'renounces', 'rejects', 'idealizes', 'bridges', 'sees',
  'focuses', 'holds', 'looks', 'reads', 'treats', 'denies', 'insists',
  'asserts', 'maintains', 'regards', 'teaches', 'takes', 'places',
]);

/**
 * Nouns ending in -s that must not be read as verbs. "Synthesis of religious
 * devotion with philosophical inquiry" heads a perfectly good noun phrase.
 */
const NOUN_LOOKS_PLURAL = /(?:ss|us|is|ics|ness|ology|osis)$/i;

function isVerbHead(word: string): boolean {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  if (IDEOLOGY_VERB_HEADS.has(lower)) return true;
  return /s$/.test(lower) && !NOUN_LOOKS_PLURAL.test(lower);
}

/**
 * "he holds" → "they hold". Dropping the final -s is right for every verb in
 * the table except the ones where the -es is epenthetic ("focuses" → "focus").
 */
function toPluralAgreement(verb: string): string {
  const lower = verb.toLowerCase();
  if (/(?:s|ch|sh|x)es$/.test(lower)) return lower.slice(0, -2);
  return lower.replace(/s$/, '');
}

export function describeIdeology(
  ideology: Pick<Ideology, 'description'> | undefined,
  pronouns: NarrativePronouns,
  /**
   * Seeded chooser. Each ideology carries exactly one description string, so
   * without varying the frame around it every persona holding a given outlook
   * produced a byte-identical sentence — "Values tradition, hierarchy,
   * continuity, and established social order" measured at 1.5% of the corpus.
   */
  pick?: <T>(values: T[]) => T,
): string {
  const description = stripTerminalPunctuation(ideology?.description || '');
  if (!description) return '';
  const choose = pick ?? (<T,>(values: T[]): T => values[0]);

  if (/^(?:devoted|centered)\b/i.test(description)) {
    return choose([
      `${pronouns.possessiveCap} outlook ${pronouns.be} ${lowerFirst(description)}.`,
      `What ${pronouns.subject} ${conjugate('hold', pronouns)} to ${pronouns.be} ${lowerFirst(description)}.`,
      `Asked what ${pronouns.subject} ${conjugate('believe', pronouns)}, ${pronouns.subject} would describe something ${lowerFirst(description)}.`,
    ]);
  }
  // "About finding meaning through skilled creation" is a predicate, not a noun
  // phrase, and fell through to the noun branch below as "the About finding
  // meaning through skilled creation".
  const aboutMatch = /^about\s+(.+)$/i.exec(description);
  if (aboutMatch) {
    const rest = lowerFirst(aboutMatch[1]);
    const subjectCap = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);
    return choose([
      `${pronouns.possessiveCap} outlook ${pronouns.be} about ${rest}.`,
      `For ${pronouns.object}, it comes down to ${rest}.`,
      `${subjectCap} ${conjugate('care', pronouns)} about ${rest}.`,
    ]);
  }

  const firstWord = description.split(/\s+/)[0] ?? '';
  if (isVerbHead(firstWord)) {
    const subjectCap = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);
    const phrase = pronouns.subject === 'they'
      ? `${toPluralAgreement(firstWord)}${lowerFirst(description).slice(firstWord.length)}`
      : lowerFirst(description);
    return choose([
      `${subjectCap} ${phrase}.`,
      `Pressed on the matter, ${pronouns.subject} ${phrase}.`,
      `By ${pronouns.possessive} own account ${pronouns.subject} ${phrase}.`,
      `${subjectCap} ${phrase}, and ${conjugate('have', pronouns)} said as much in company.`,
    ]);
  }

  // Noun-initial descriptions ("Buddhist path emphasizing liberation…") used to
  // fall through to `reflects ${lowerFirst(description)}`, which destroyed the
  // proper noun and left the phrase without its article.
  const isProperNoun = /^[A-Z][a-z]/.test(firstWord) && !/^(?:A|An|The)$/.test(firstWord);
  const body = isProperNoun ? description : lowerFirst(description);
  const article = /^(?:a|an|the)\b/i.test(body) ? '' : 'the ';
  return choose([
    `${pronouns.possessiveCap} outlook reflects ${article}${body}.`,
    `What ${pronouns.subject} ${conjugate('hold', pronouns)} to ${pronouns.be} ${article}${body}.`,
    `${pronouns.possessiveCap} sense of the world ${pronouns.be} ${article}${body}.`,
  ]);
}

export function describeParents(
  fatherName: string | undefined,
  motherName: string | undefined,
  pronouns: NarrativePronouns,
  strongTag = false,
): string {
  const mark = (name: string): string => strongTag ? `<strong>${name}</strong>` : name;
  if (fatherName && motherName) {
    return `${pronouns.possessiveCap} parents are ${mark(fatherName)} and ${mark(motherName)}.`;
  }
  if (fatherName) return `${pronouns.possessiveCap} father is ${mark(fatherName)}.`;
  if (motherName) return `${pronouns.possessiveCap} mother is ${mark(motherName)}.`;
  return '';
}

export function findNarrativeFailureModes(text: string): string[] {
  const checks: Array<[RegExp, string]> = [
    [/\b(a) impoverished\b/i, 'incorrect indefinite article before “impoverished”'],
    [/\ba (?:average|aristocrat|artist|exile|eldest|office|insomniac|ordinary)\b/i, 'incorrect indefinite article'],
    [/\ban university\b/i, 'incorrect indefinite article before “university”'],
    [/\ba 18-year-old\b/i, 'incorrect indefinite article before an age'],
    [/\b(short|tall)\b[^.!?]{0,45}\b\1\b/i, 'repeated height adjective'],
    [/\bwhen (?:he|she|they) (?:a|an|the)\b/i, 'pronoun inserted before a noun-led event'],
    [/\btend(?:s)? toward (?:seeks|values|believes|emphasizes|prioritizes|champions)\b/i, 'verb phrase inserted after “tend toward”'],
    [/\bLife went on\b/i, 'generic transition'],
    [/\bhousehold record\b.*\bstand closest to the beginning\b/i, 'oblique parent identification'],
    [/\bner knowing\b/i, 'belief text damaged by substring replacement'],
    [/\bYou believe that (?:deeply venerates|views|seeks|practices|follows|considers)\b/i, 'belief subject does not agree with its verb'],
    [/\bYou are (?:a exile|a eldest child|a skilled hands)\b/i, 'attribute rendered with the wrong noun phrase'],
    [/\bYou are a hot-tempered\b/i, 'adjective rendered as a noun phrase'],
    [/\b(?:he|she|they) first (?:journey|season)\b/i, 'life event uses a noun fragment as a verb phrase'],
    [/\byou heavy flooding\b/i, 'noun-led weather event treated as a verb phrase'],
    [/\bAt age \d+, a first child to care for\b/i, 'incomplete life-event clause'],
    [/\boutlook believes\b/i, 'an outlook is incorrectly treated as a person who believes'],
    [/\b(?:from|to) murdered\b|\bsuccumbed to murdered\b/i, 'death cause joined to the wrong preposition'],
    [/\bfamily family\b/i, 'duplicated family noun after placeholder expansion'],
    [/\bpurchase new plow\b/i, 'missing article before a purchased object'],
    [/\bpurchase (?:tractor|delivery truck|shop)\b/i, 'missing article before a purchased object'],
    [/\bwith a anxious demeanor\b/i, 'incorrect article before “anxious”'],
    [/\bwear a mutton chops\b/i, 'plural facial hair given a singular article'],
    [/\blearning trade of\b|\bfrom experienced practitioner\b/i, 'profession event omits required articles'],
    [/\b(?:hair is|eyes are a shade of) (?:peru|goldenrod|silver|royal blue|dark dark|dark nearly)\b/i, 'raw CSS color name leaked into appearance prose'],
    [/\bfrom father\b/i, 'life event omits an article or possessive before “father”'],
    [/\b(?:Success came, eventually|Recognition found you|Family can be both burden|Blood ties run deep|You(?:'ve| have) proven yourself|spiritual journey has been)\b/i, 'generic life-event aphorism'],
    [/\breflects [a-z]+ (?:path|way|tradition|school|doctrine|creed)\b/, 'proper noun lowercased in an ideology description'],
    [/\breflects (?!a\b|an\b|the\b)[a-z]+ing\b/, 'ideology description missing its article'],
    // An article in front of a capitalised word is almost always a verb-initial
    // ideology description that was mistaken for a noun phrase — "the Holds
    // that history moves by class struggle". Proper nouns reach the prose
    // through their own frames and never behind a bare "the ".
    [/\b(?:the|a|an) (?:About|Holds|Looks|Reads|Values|Seeks|Believes|Emphasizes|Treats|Denies|Insists|Asserts|Maintains|Regards|Teaches|Takes|Places)\b/, 'verb-initial ideology description given an article'],
    // No generic form of the rule above: proper nouns ending in -s are far too
    // common in this corpus ("the Ganges", "the Narrows", "Sakhmakh the
    // Fatherless") for a shape test to separate them from a verb. The
    // generalization lives in `isVerbHead`, which decides how the sentence is
    // built; this list is the regression guard for the four that shipped.
    [/\ba (?:[AEIOU][a-z]+|[Hh]our)\b/, 'indefinite article does not agree with a vowel-initial proper noun'],
    [/\b(?:as|of) (?:a|an|the) [A-Z][a-z]+ (?:Hand|Worker|Maker|Seller|Keeper|Driver|Guard|Doctor|Wallah)\b/, 'profession left in Title Case mid-sentence'],
    [/\bNow,?\s[^.]*\bat the age of \d+\b/i, 'doubled temporal marker around the profession clause'],
    // Only an actual doubled age marker, not the adverb "now" appearing later
    // in a perfectly good sentence.
    [/\bAt \d+,[^.]*\bnow \d+\b/i, 'doubled temporal marker around the profession clause'],
    // Only genuinely plural subjects. Matching any word ending in "s" flagged
    // "Tetanus has made…" and "A torn muscle in his ribs has made…", both fine.
    [/(?:^|\.\s)(?:Intestinal worms|Worms|Chilblains|Boils|Sores|Fits|Lice|Hives|Cramps|Convulsions) has\b/, 'plural disease name with a singular verb'],
    [/\.\s*\./, 'doubled punctuation'],
    // Clause banks are written with `${subject}`-style placeholders. One that
    // reaches the screen means a bank was rendered by something that does not
    // expand them, or a placeholder was misspelled.
    [/\$\{[A-Za-z:]+\}/, 'unexpanded clause placeholder'],
  ];

  return checks.filter(([pattern]) => pattern.test(text)).map(([, message]) => message);
}
