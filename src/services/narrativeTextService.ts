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

export function withIndefiniteArticle(text: string): string {
  const trimmed = text.trim();
  const takesA = /^(?:uni(?:vers|form)|use|user|euro|one\b)/i.test(trimmed);
  const takesAn = /^(?:8|11|18|honest|honor|hour|heir)/i.test(trimmed);
  return `${takesAn || (!takesA && /^[aeiou]/i.test(trimmed)) ? 'an' : 'a'} ${trimmed}`;
}

export function describePhysicalAppearance(
  appearance: { height?: number; build?: string } | undefined,
  pronouns: NarrativePronouns,
): string {
  if (!appearance) return '';

  const height = appearance.height && appearance.height > 180
    ? 'tall'
    : appearance.height && appearance.height < 165
      ? 'short'
      : '';
  const build = appearance.build && appearance.build !== 'average'
    ? appearance.build.toLowerCase()
    : '';
  const subjectCap = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);

  if (height && build && height !== build) return `${pronouns.possessiveCap} frame ${pronouns.be} ${height} and ${build}.`;
  if (height) return `${subjectCap} ${pronouns.be} ${height}.`;
  if (build) return `${pronouns.possessiveCap} build ${pronouns.be} ${build}.`;
  return '';
}

function eventAlreadyHasSubject(text: string): boolean {
  return /^(?:a|an|the|his|her|their|one|two|three|father|mother|brother|sister|family|guild|heavy|illness|tragedy|war|fire|flood|famine|plague)\b/i.test(text);
}

export function describeLifeEvent(
  event: Pick<EnhancedLifeEvent, 'text'>,
  ageAtEvent: number,
  pronouns: NarrativePronouns,
): string {
  const text = stripTerminalPunctuation(event.text);
  if (!text) return '';

  let clause: string;
  if (/^(?:father|mother|brother|sister)\b/i.test(text)) {
    clause = `${pronouns.possessive} ${lowerFirst(text)}`;
  } else if (eventAlreadyHasSubject(text)) {
    clause = lowerFirst(text);
  } else if (/^(?:admitted|cast out|chosen|elected|forced|invited|placed|required|sent|taken|taught|trusted|allowed)\b/i.test(text)) {
    clause = `${pronouns.subject} ${pronouns.subject === 'they' ? 'were' : 'was'} ${lowerFirst(text)}`;
  } else {
    clause = `${pronouns.subject} ${lowerFirst(text)}`;
  }
  return `At age ${ageAtEvent}, ${clause}.`;
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

export function describeIdeology(
  ideology: Pick<Ideology, 'description'> | undefined,
  pronouns: NarrativePronouns,
): string {
  const description = stripTerminalPunctuation(ideology?.description || '');
  if (!description) return '';

  if (/^(?:devoted|centered)\b/i.test(description)) {
    return `${pronouns.possessiveCap} outlook ${pronouns.be} ${lowerFirst(description)}.`;
  }
  if (/^(?:values|seeks|believes|emphasizes|pursues|prioritizes|champions|renounces|rejects|idealizes|bridges|sees|focuses)\b/i.test(description)) {
    const subjectCap = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);
    if (pronouns.subject === 'they') {
      const pluralized = lowerFirst(description)
        .replace(/^values\b/i, 'value')
        .replace(/^seeks\b/i, 'seek')
        .replace(/^believes\b/i, 'believe')
        .replace(/^emphasizes\b/i, 'emphasize')
        .replace(/^pursues\b/i, 'pursue')
        .replace(/^prioritizes\b/i, 'prioritize')
        .replace(/^champions\b/i, 'champion')
        .replace(/^renounces\b/i, 'renounce')
        .replace(/^rejects\b/i, 'reject')
        .replace(/^idealizes\b/i, 'idealize')
        .replace(/^bridges\b/i, 'bridge')
        .replace(/^sees\b/i, 'see')
        .replace(/^focuses\b/i, 'focus');
      return `${subjectCap} ${pluralized}.`;
    }
    return `${subjectCap} ${lowerFirst(description)}.`;
  }

  return `${pronouns.possessiveCap} outlook reflects ${lowerFirst(description)}.`;
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
    [/\ba (?:average|aristocrat|artist|exile|eldest|office|insomniac)\b/i, 'incorrect indefinite article'],
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
    [/\.\s*\./, 'doubled punctuation'],
  ];

  return checks.filter(([pattern]) => pattern.test(text)).map(([, message]) => message);
}
