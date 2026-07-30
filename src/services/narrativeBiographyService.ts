/**
 * services/narrativeBiographyService.ts
 *
 * Builds the two-paragraph third-person biography shown on the persona card.
 * Extracted from PersonaGeneratorSimple so it can be exercised and audited
 * outside React.
 *
 * Paragraph one is origins: birth, household, the belief world they were
 * raised in, the circumstances that predate them, and one event from youth.
 * Paragraph two is the present: trade and what it involves, body and
 * condition, adult events, the surrounding world, outlook and temperament.
 */

import type { HistoricalPersona } from './personaGenerator';
import type { CulturalZone } from '../types';
import { EventImportance } from '../constants/characterData/lifeHistoryService';
import { IDEOLOGIES, PERSONAL_BELIEFS } from '../constants';
import { getAreaClimate, hemisphereFor, seasonFor } from './climateService';
import { historicalPlaceLabel } from '../constants/gameData/placeLabels';
import { describeBirthplace } from './birthplaceService';
import { getPolityAt, isPluralPolity, rulerTitleFor, withPolityArticle } from './polityService';
import { disruptionClause } from './disruptionResolution';
import { standingRole } from '../constants/characterData/professions';
import {
  conjugate,
  describeIdeology,
  describeLifeEvent,
  describeParents,
  describePhysicalAppearance,
  getNarrativePronouns,
  isPluralDiseaseName,
  lowerProfession,
  withIndefiniteArticle,
} from './narrativeTextService';
import {
  describeChildhood,
  describeFoundationalAttribute,
  describeParentalLivelihood,
  describeProfessionWork,
  describeTradeAttitude,
  describeUnnamedBelief,
  describeWorldTexture,
  selectDetail,
  wealthAdjective,
  type BiographyContext,
} from './biographyDetailService';
import type { Clause } from './narrativeClauseService';

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Injuries happen somewhere. Naming the part turns "Torn muscle has made
 * ordinary labor uncertain" into a sentence about a person.
 */
const INJURY_SITES: Record<string, string[]> = {
  'torn muscle': ['shoulder', 'back', 'thigh', 'calf', 'forearm'],
  'sprained ankle': ['ankle'],
  'broken bone': ['forearm', 'collarbone', 'ribs', 'shin'],
  'fracture': ['forearm', 'collarbone', 'ribs', 'shin'],
  'dislocated joint': ['shoulder', 'elbow', 'knee', 'hip'],
  'deep cut': ['hand', 'forearm', 'thigh', 'scalp'],
  'laceration': ['hand', 'forearm', 'thigh', 'scalp'],
  'burn': ['hand', 'forearm', 'shoulder'],
  'scraped knee': ['knee'],
  'bruised ribs': ['ribs'],
  'infected wound': ['hand', 'foot', 'forearm', 'shin'],
  'crushed finger': ['hand'],
  'strained back': ['back'],
  'pulled muscle': ['shoulder', 'back', 'thigh', 'calf'],
};

/**
 * Temperament, in the vocabulary of the persona's own world.
 *
 * These are noun phrases: each one has to sit after "Those who know him speak
 * of …", so none of them may carry a capital or terminal punctuation. Each bank
 * keeps one unconditioned clause so that no combination of era, place and
 * station can leave a temperament with nothing to say.
 */
const TRAIT_OPEN_OUTGOING: Clause[] = [
  { text: 'an adventurous spirit who seeks out new experiences and companions' },
  { text: 'a restlessness that has taken ${object} further from home than most of ${possessive} neighbors have gone', maxYear: 1850 },
  { text: 'an appetite for company and for whatever is new, which the settlement finds by turns useful and tiring', register: ['band', 'village'] },
  { text: 'a sociability that fills the evenings and empties the wage packet', minYear: 1880, band: ['working', 'poor'] },
  { text: 'an ease with strangers that has been worth more to ${object} than any qualification', minYear: 1950 },
];

const TRAIT_OPEN_METHODICAL: Clause[] = [
  { text: 'a curious mind tempered by methodical discipline' },
  { text: 'a habit of taking a thing apart to see how it is made, and putting it back properly' },
  { text: 'a methodical curiosity that would have been called scholarship in someone better born', band: ['poor', 'working', 'bonded'], maxYear: 1900 },
  { text: 'a precision about detail that colleagues rely on and do not thank ${object} for', minYear: 1900 },
];

const TRAIT_OPEN: Clause[] = [
  { text: 'a thoughtful soul drawn to novel ideas and perspectives' },
  { text: 'a turn of mind that keeps returning to questions the neighbors consider settled' },
  { text: 'an interest in what lies beyond the district, which is not universally admired here', register: ['band', 'village'] },
  { text: 'opinions gathered from further afield than anyone else in the household has been', minYear: 1920 },
];

const TRAIT_SETTLED: Clause[] = [
  { text: 'a steadfast character who finds strength in tradition and routine' },
  { text: 'a preference for the way a thing has always been done, held firmly and without apology' },
  { text: 'a conviction that the old arrangements worked, and that whatever replaced them did not', minYear: 1900 },
];

const TRAIT_PRACTICAL: Clause[] = [
  { text: 'a practical nature that values the proven over the experimental' },
  { text: 'a suspicion of anything that has not already been shown to work' },
  { text: 'a preference for what can be seen, weighed and mended', register: ['band', 'village'] },
];

const TRAIT_WARM: Clause[] = [
  { text: 'a warm and generous presence that draws people near' },
  { text: 'an openhandedness the household can less afford than ${subject} ${verb:admit}' },
  { text: 'a name known at every door in ${location}, generally for the right reasons', register: ['village', 'district'] },
];

const TRAIT_GENTLE: Clause[] = [
  { text: 'a gentle disposition that seeks harmony above conflict' },
  { text: 'a reluctance to give offense that is sometimes mistaken for having no opinion' },
  { text: 'a steadiness in other people\'s quarrels that gets ${object} sent for when there is one' },
];

const TRAIT_COMMITTED: Clause[] = [
  { text: 'a compassionate heart that drives commitment to justice' },
  { text: 'a tenderness toward the badly used that has hardened into something like a politics', minYear: 1750 },
  { text: 'an anger on other people\'s behalf that ${subject} ${verb:have} never learned to keep quiet' },
];

const TRAIT_BLUNT: Clause[] = [
  { text: 'a bold, uncompromising manner that some find refreshing and others find abrasive' },
  { text: 'a bluntness ${subject} ${verb:call} honesty and others call something else' },
  { text: 'a way of saying the thing everyone present had agreed not to say' },
];

const TRAIT_INDEPENDENT: Clause[] = [
  { text: 'an independent streak that prizes personal freedom above social convention' },
  { text: 'a habit of doing as ${subject} ${verb:please}, which costs ${object} more than ${subject} ${verb:reckon}' },
  { text: 'a refusal to be placed, which in a settlement this size is a considerable undertaking', register: ['band', 'village'] },
];

const TRAIT_SCRUPULOUS: Clause[] = [
  { text: 'a scrupulousness about obligations that neighbors rely on more than they acknowledge' },
  { text: 'an exactness about what is owed and to whom, running in both directions' },
  { text: 'a record-keeping habit that has settled more than one dispute in ${possessive} favor', needs: ['writing'] },
];

const TRAIT_WARY: Clause[] = [
  { text: 'a wariness that reads trouble into quiet weeks' },
  { text: 'a habit of expecting the worst, which has occasionally been vindicated' },
  { text: 'a watchfulness that ${possessive} childhood taught ${object} and nothing since has undone' },
];

/** Display name for the persona's place in their own period. */
const placeName = (persona: HistoricalPersona): string =>
  historicalPlaceLabel(persona.location, persona.year).label || persona.location;

const formatYear = (year: number): string =>
  year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;

export function generateNarrativeBiography(persona: HistoricalPersona): string {
  const character = persona.character;
  const events = persona.enhancedLifeEvents || [];
  const pronoun = character.gender === 'Male' ? 'he' : character.gender === 'Female' ? 'she' : 'they';
  const pronounObj = character.gender === 'Male' ? 'him' : character.gender === 'Female' ? 'her' : 'them';
  const pronounPoss = character.gender === 'Male' ? 'his' : character.gender === 'Female' ? 'her' : 'their';
  const pronounPossCap = character.gender === 'Male' ? 'His' : character.gender === 'Female' ? 'Her' : 'Their';
  const pronounVerb = character.gender === 'Non-binary' ? 'have' : 'has';
  const pronounBe = character.gender === 'Non-binary' ? 'are' : 'is';
  let biographyChoiceIndex = 0;
  const biographySeed = [
    character.name,
    persona.year,
    persona.location,
    persona.region,
    character.profession,
    character.age,
    character.portraitSeed,
  ].join('|');
  const seededIndex = (length: number): number => {
    let hash = 2166136261 + biographyChoiceIndex;
    biographyChoiceIndex += 1;
    for (let i = 0; i < biographySeed.length; i += 1) {
      hash ^= biographySeed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash) % Math.max(1, length);
  };
  const pickBiography = <T,>(values: T[]): T => values[seededIndex(values.length)];

  // Get proper wealth description
  // Opening - birth and background
  const birthYear = persona.year - character.age;

  // Styled character name for visual emphasis
  const styledName = `<span class="character-name">${character.name}</span>`;

  const narrativePronouns = getNarrativePronouns(character.gender);
  const subjectCap = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);

  // Shared context for the detail service. Everything here is already
  // computed elsewhere in the app and was previously unused by the prose.
  const bioContext: BiographyContext = {
    name: character.name,
    age: character.age,
    year: persona.year,
    location: placeName(persona),
    region: persona.region,
    profession: character.profession || 'laborer',
    socialClass: character.socialClass,
    wealthLevel: character.wealthLevel,
    religion: character.religion,
    language: persona.languageData?.name,
    season: (() => {
      try {
        // persona.culturalZone is a display label ("SOUTH ASIAN"); the climate
        // and hemisphere tables are keyed by the enum, so passing the label
        // silently returned undefined for every persona and flattened the
        // southern hemisphere and the tropics into a northern four-season year.
        const zone = persona.historicalContext?.culturalZone ?? persona.character.culturalZone;
        const climate = getAreaClimate(zone, persona.region, persona.location);
        return seasonFor(persona.month, hemisphereFor(zone, persona.region), climate);
      } catch {
        return undefined;
      }
    })(),
    historical: persona.historicalContext,
    pronouns: narrativePronouns,
    // Bondage places a life more decisively than any wealth label does, and it
    // is recorded as an attribute rather than as a social class.
    attributeIds: (character.attributes ?? []).map((attr: any) => attr?.id).filter(Boolean),
  };

  // "A respectable family" presupposes a society with respectability in it.
  const wealthDesc = wealthAdjective(
    typeof character.wealthLevel === 'string' ? character.wealthLevel : undefined,
    bioContext,
  );
  // The band-register vocabulary introduced vowel-initial adjectives
  // ("ordinary"), which the hardcoded "a" could not handle.
  const aWealthHousehold = withIndefiniteArticle(`${wealthDesc} household`);
  const aWealthFamily = withIndefiniteArticle(`${wealthDesc} family`);

  // Sentences are collected under named beats rather than pushed into a fixed
  // pair of arrays. A seeded plan then decides the order and which optional
  // beats survive.
  //
  // The fixed order was the loudest template signal in the output: measured
  // across six eras, every biography ran the same twelve beats in the same
  // sequence, so varying the wording of any one of them changed very little.
  const beats = new Map<string, string[]>();
  const addBeat = (id: string, text: string | string[]): void => {
    const lines = (Array.isArray(text) ? text : [text]).map(t => t.trim()).filter(Boolean);
    if (lines.length === 0) return;
    beats.set(id, [...(beats.get(id) ?? []), ...lines]);
  };
  /** A roll in 0–99, for deciding whether an optional beat is kept. */
  const chance = (percent: number): boolean => seededIndex(100) < percent;

  // Vary opening phrases
  // "Born in Moscow Basin" names a map region rather than a place anyone lived
  // in. This composes the kind of dwelling from register, wealth and era, and
  // names the city where there was one.
  const birthplace = describeBirthplace(
    {
      year: birthYear,
      culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
      region: persona.region,
      location: persona.location,
      wealthLevel: typeof character.wealthLevel === 'string' ? character.wealthLevel : undefined,
      localeType: persona.historicalContext?.localeType,
    },
    placeName(persona),
    pickBiography,
  );

  const openingTemplates = [
    `Born in ${formatYear(birthYear)} in ${birthplace}, ${styledName} `,
    `It was in ${birthplace}, in the year ${formatYear(birthYear)}, that ${styledName} came into the world, and ${pronounPoss} `,
    `In ${formatYear(birthYear)}, ${styledName} began life in ${birthplace}. ${pronounPossCap} `,
    `The year ${formatYear(birthYear)} saw the birth of ${styledName} in ${birthplace}. ${pronounPossCap} `,
    `${styledName} first drew breath in ${formatYear(birthYear)}, in ${birthplace}, where ${pronoun} `,
    `In ${formatYear(birthYear)}, ${styledName} entered the world in ${birthplace}. ${pronounPossCap} `
  ];

  const selectedOpening = seededIndex(openingTemplates.length);
  let opening = openingTemplates[selectedOpening];

  // Family context
  const siblings = character.family?.filter(f =>
    f.relation === 'sibling' || f.relation === 'brother' || f.relation === 'sister'
  ) || [];
  const parents = character.family?.filter(f =>
    f.relation === 'father' || f.relation === 'mother'
  ) || [];

  // Adjust verb based on which opening template was used
  // These openings end with a possessive pronoun ("his/her/their"), so they need noun-led phrasing.
  const needsPossessiveForm = [1, 2, 3, 5].includes(selectedOpening);

  if (siblings.length > 0) {
    opening += needsPossessiveForm
      ? `upbringing was as one of ${siblings.length + 1} children in ${aWealthHousehold}`
      : `grew up as one of ${siblings.length + 1} children in ${aWealthHousehold}`;
  } else if (parents.length > 0) {
    opening += needsPossessiveForm
      ? `parents raised ${pronounObj} in ${aWealthFamily}`
      : `was raised by ${pronounPoss} parents in ${aWealthFamily}`;
  } else {
    opening += needsPossessiveForm
      ? `upbringing was in ${aWealthHousehold}`
      : `came of age in ${aWealthHousehold}`;
  }

  // Religion and cultural context with varied religiosity
  const hasNamedReligion = character.religion
    && character.religion !== 'Local Beliefs'
    && character.religion !== 'Agnostic';

  if (hasNamedReligion) {
    // Use character's religiosity score if available, otherwise random
    const religiosity = character.socialContext?.religiosity ?? (seededIndex(100) / 100);

    let religionPhrase = '';
    if (religiosity > 0.8) {
      // Very religious upbringing
      const veryReligiousTemplates = [
        `was deeply immersed in the traditions of ${character.religion}`,
        `was brought up in deep devotion to ${character.religion}`,
        `grew up surrounded by the fervent practice of ${character.religion}`,
        `was immersed in the teachings of ${character.religion} from an early age`
      ];
      religionPhrase = pickBiography(veryReligiousTemplates);
    } else if (religiosity > 0.5) {
      // Moderately religious
      const moderateTemplates = [
        `was steeped in the practices of ${character.religion}`,
        `grew up observing the practices of ${character.religion}`,
        `took ${pronounPoss} bearings from the ${character.religion} tradition`,
        `learned the customs of ${character.religion} from ${pronounPoss} family`
      ];
      religionPhrase = pickBiography(moderateTemplates);
    } else if (religiosity > 0.25) {
      // Nominally religious
      const nominalTemplates = [
        `was exposed to the practices of ${character.religion}`,
        `had a modest upbringing in ${character.religion}`,
        `grew up with some knowledge of ${character.religion}`,
        `was familiar with ${character.religion}, though not particularly devout`
      ];
      religionPhrase = pickBiography(nominalTemplates);
    } else {
      // Barely religious/cultural only
      const culturalTemplates = [
        `was nominally of the ${character.religion} faith, though it played little role in ${pronounPoss} upbringing`,
        `came from a ${character.religion} household, though ${pronoun} practiced little`,
        `was counted among the ${character.religion} households without being much observed`,
        `knew of ${character.religion} mainly as a cultural background, not a daily practice`
      ];
      religionPhrase = pickBiography(culturalTemplates);
    }

    opening += `, where ${pronoun} ${religionPhrase}`;
  } else {
    // "Local Beliefs" used to skip this clause entirely, which silenced every
    // prehistoric persona at the exact point the biography establishes them.
    opening += `, where ${pronoun} ${describeUnnamedBelief(bioContext, pickBiography)}`;
  }
  addBeat('opening', `${opening}.`);

  // Foundational attributes, split between the two paragraphs by whether they
  // describe where the persona came from or what they are now.
  const foundationalAttributes = character.attributes?.filter((attr: any) => attr.foundational === true) || [];

  for (const attr of foundationalAttributes) {
    const rendered = describeFoundationalAttribute(attr.id, bioContext);
    if (!rendered) continue;
    addBeat(rendered.slot === 'origin' ? 'origin-attr' : 'present-attr', rendered.text);
  }

  // Life events: previously only the single most important one was used, out
  // of as many as ten the life-history service generates.
  const datedEvents = events
    .filter(e => e.kind !== 'birth')
    .map(e => ({ event: e, ageAtEvent: character.age - (persona.year - e.year) }))
    .filter(({ ageAtEvent }) => ageAtEvent >= 0 && ageAtEvent <= character.age);

  const importanceOrder: Record<string, number> = {
    [EventImportance.TRAGEDY]: 0,
    [EventImportance.MILESTONE]: 1,
    [EventImportance.OPPORTUNITY]: 2,
    [EventImportance.INJURY]: 3,
    [EventImportance.RELATIONSHIP]: 4,
    [EventImportance.MUNDANE]: 5
  };
  const byImportance = (
    a: { event: { importance: EventImportance } },
    b: { event: { importance: EventImportance } }
  ) => importanceOrder[a.event.importance] - importanceOrder[b.event.importance];

  // Apprenticeship events are near-universal and phrased almost identically,
  // so they are the last resort for the childhood slot rather than the first.
  const youthEvents = datedEvents
    .filter(e => e.ageAtEvent <= 17)
    .sort((a, b) => {
      const aRoutine = a.event.kind === 'apprenticeship' ? 1 : 0;
      const bRoutine = b.event.kind === 'apprenticeship' ? 1 : 0;
      return aRoutine - bRoutine || byImportance(a, b);
    });
  const adultEvents = datedEvents.filter(e => e.ageAtEvent > 17).sort(byImportance);

  const chosenYouth = youthEvents.slice(0, 1);
  // Fall back to a third adult event when there was no childhood event to tell.
  const adultQuota = chosenYouth.length > 0 ? 2 : 3;
  // Two events of the same kind in one paragraph read as a template repeating.
  const usedKinds = new Set(chosenYouth.map(e => e.event.kind));
  const chosenAdult: typeof adultEvents = [];
  for (const candidate of adultEvents) {
    if (chosenAdult.length >= adultQuota) break;
    if (usedKinds.has(candidate.event.kind)) continue;
    usedKinds.add(candidate.event.kind);
    chosenAdult.push(candidate);
  }
  // Told in the order they happened, not in order of importance.
  chosenAdult.sort((a, b) => a.ageAtEvent - b.ageAtEvent);

  const father = character.family?.find(m => m.relation === 'father');
  const mother = character.family?.find(m => m.relation === 'mother');

  // Naming the parents where their trades are described lets the biography end
  // on something other than "His parents are X and Y", which every one of them
  // used to do.
  const canFoldParentNames = Boolean(
    father?.name && mother?.name && father?.profession && mother?.profession
  );
  const foldParentNames = canFoldParentNames && chance(45);

  const livelihood = describeParentalLivelihood(
    father, mother, bioContext, pickBiography, foldParentNames,
  );
  addBeat('livelihood', livelihood);

  // The optional beats are what make one life's biography a different length
  // from another's, rather than every life getting the same twelve sentences.
  if (chance(85)) addBeat('childhood', describeChildhood(bioContext, pickBiography));

  if (chance(65)) {
    addBeat('appearance', describePhysicalAppearance(
      character.appearance,
      narrativePronouns,
      character.birthSex ?? (character.gender === 'Female' ? 'Female' : character.gender === 'Male' ? 'Male' : undefined),
      pickBiography,
    ));
  }

  for (const { event, ageAtEvent } of chosenYouth) {
    addBeat('youth-event', describeLifeEvent(event, ageAtEvent, narrativePronouns));
  }

  // ---- The present ----

  const professionName = lowerProfession(character.profession);
  const professionArticle = withIndefiniteArticle(professionName).split(' ')[0];

  // A standing is not a trade, and the openers below all assume a trade. See
  // STANDING_ROLES: without this, a patronage politician "makes his living as a
  // big man" and a prince "works as a maharaja".
  const roleStanding = standingRole(character.profession);
  const professionOpeners = roleStanding
    ? [
      `Now ${character.age}, ${pronoun} ${roleStanding.livelihood}`,
      `${subjectCap} ${roleStanding.livelihood}`,
    ]
    : [
      `Now ${character.age}, ${pronoun} ${conjugate('make', narrativePronouns)} ${pronounPoss} living as ${professionArticle} ${professionName}`,
      `At ${character.age}, ${pronoun} ${conjugate('work', narrativePronouns)} as ${professionArticle} ${professionName}`,
      `${subjectCap} ${conjugate('earn', narrativePronouns)} ${pronounPoss} bread as ${professionArticle} ${professionName}, and ${conjugate('have', narrativePronouns)} done for years`,
      // A trade is a thing followed where trades exist. "She follows the
      // cleaner's trade" is a sentence about 1750 wearing 2015's job title.
      persona.year >= 1900
        ? `${subjectCap} ${narrativePronouns.be} ${professionArticle} ${professionName}, and ${conjugate('have', narrativePronouns)} been for a while now`
        : `${subjectCap} ${conjugate('follow', narrativePronouns)} the ${professionName}'s trade`
    ];
  let professionSentence = pickBiography(professionOpeners);

  // Work context for the trades where the stats say something specific.
  if (character.stats) {
    if (character.stats.strength > 14 && /smith|forge|mason|labor/.test(professionName)) {
      professionSentence += `, ${pronounPoss} arms hardened to it`;
    } else if (character.stats.intelligence > 14 && /scholar|scribe|clerk|teacher|physician/.test(professionName)) {
      professionSentence += `, and ${conjugate('have', narrativePronouns)} a reputation for a careful mind`;
    } else if (character.stats.charisma > 14 && /merchant|trader|seller|innkeep/.test(professionName)) {
      professionSentence += `, a gift for persuasion serving ${pronounObj} well in the market`;
    }
  }
  // How the trade is told. The texture sentence is one register — a frame over
  // a compressed noun phrase — and using it every time made every biography
  // describe work in the same voice at the same length. The attitude sentence
  // is short and plain, and exists to break that rhythm.
  const trade = describeProfessionWork(bioContext, pickBiography);
  const attitude = describeTradeAttitude(bioContext, pickBiography);
  const fold = (text: string): string => {
    const stripped = text.replace(/^(?:The work means|That means|It comes down to|The trade is|The job is)\s+/, '');
    return `${professionSentence} — ${stripped.charAt(0).toLowerCase()}${stripped.slice(1)}`;
  };

  // `trade` is empty when there is nothing specific to say about the work, in
  // which case the shapes that fold or append it collapse to the bare opener.
  // Saying nothing beats the generality it replaced.
  const professionShape = seededIndex(10);
  switch (trade ? professionShape : (professionShape < 5 ? 5 : 9)) {
    case 0: case 1: case 2:
      addBeat('profession', fold(trade));
      break;
    case 3: case 4:
      addBeat('profession', `${professionSentence}.`);
      addBeat('trade', trade);
      break;
    case 5: case 6:
      addBeat('profession', [`${professionSentence}.`, attitude]);
      break;
    case 7:
      addBeat('profession', [`${professionSentence}.`, attitude]);
      addBeat('trade', trade);
      break;
    case 8:
      addBeat('profession', [fold(trade), attitude]);
      break;
    default:
      addBeat('profession', `${professionSentence}.`);
  }

  for (const { event, ageAtEvent } of chosenAdult) {
    addBeat('adult-events', describeLifeEvent(event, ageAtEvent, narrativePronouns));
  }

  // Health status
  // A mild scraped knee does not belong in a biography, and certainly not
  // phrased as having made ordinary labor uncertain.
  const activeDisease = character.diseaseHealth?.currentDiseases?.find(d =>
    d.disease?.severity === 'severe'
    || d.disease?.severity === 'critical'
    || (typeof d.severity === 'number' && d.severity > 0.45)
  );
  if (activeDisease) {
    const diseaseName = activeDisease.disease.name.toLowerCase();
    const grave = activeDisease.disease.severity === 'critical';
    // Disease names are sometimes plural ("intestinal worms"), so the verb has
    // to agree with the name rather than with the persona.
    const hasVerb = isPluralDiseaseName(diseaseName) ? 'have' : 'has';
    // An injury is a thing that happened to a part of a body, not a condition
    // with a proper name: "a torn muscle in his shoulder", not "Torn muscle".
    const injury = INJURY_SITES[diseaseName];
    // Some injury names already carry their own site — "sprained ankle",
    // "scraped knee", "bruised ribs" — and naming it again produces "a sprained
    // ankle in his ankle". Only add the site when the name does not have one.
    const site = injury
      ? pickBiography(injury.filter(part => !diseaseName.toLowerCase().includes(part)))
      : undefined;
    const subject = site
      ? `${withIndefiniteArticle(diseaseName)} in ${pronounPoss} ${site}`
      : injury
        ? withIndefiniteArticle(diseaseName)
        : capitalize(diseaseName);
    addBeat('health', grave
      ? `${capitalize(subject)} ${hasVerb} ${pronounObj} now, and the household is preparing for what that usually means.`
      : `${capitalize(subject)} ${hasVerb} made ordinary labor uncertain, but ${pronoun} ${conjugate('continue', narrativePronouns)} as circumstances allow.`);
  }

  if (chance(80)) addBeat('world', describeWorldTexture(bioContext, pickBiography));

  // Who the persona answers to, where there is anyone. Most of the table's
  // states are not a going concern in a subject's daily life, so this is one
  // short sentence and it is skipped a fifth of the time.
  //
  // Which sentence is chosen by how long the regime has held the place rather
  // than at random. That is the difference between a detail and filler: a state
  // four hundred years old and one eleven years old are different things to
  // live under, and the shapes stay distinct under `auditNarrative`'s
  // skeletonizer, which erases the proper nouns before it counts.
  const standing = getPolityAt({
    year: persona.year,
    region: persona.region,
    location: persona.location,
    culturalZone: persona.culturalZone as CulturalZone,
  });
  if (standing && chance(80)) {
    const held = persona.year - standing.since;
    const title = rulerTitleFor(standing.name);
    const state = withPolityArticle(standing.name);

    // "The Swahili city-states has held this country" — several entries in the
    // table are a set of powers rather than one, and they need the plural verb.
    const plural = isPluralPolity(standing.name);

    addBeat('polity', title && chance(55)
      ? `${capitalize(pronoun)} ${pronounBe} a subject of ${title}.`
      : held <= 25
        ? `${capitalize(state)} ${plural ? 'are' : 'is'} new here, ${held} years in and not yet settled into the habits of rule.`
        : held >= 150
          ? `${capitalize(state)} ${plural ? 'have' : 'has'} held this country since ${formatYear(standing.since)}, beyond anyone's memory.`
          : `Authority here runs up to ${state}, and has since ${formatYear(standing.since)}.`);
  }

  // What was happening here that the steady-state tables know nothing about.
  //
  // This sits next to `polity` on purpose: both answer "what kind of year is
  // this to be alive in", and both are dated from a table rather than drawn
  // from a pool, so neither can drift across eras the way the template banks
  // do. The clause is rolled against the episode's severity inside
  // `disruptionClause`, so a low-severity window mentions itself rarely and a
  // catastrophic one almost always — which is the honest distribution.
  const catastrophe = disruptionClause(
    persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
    persona.year,
    persona.region,
    persona.location,
    () => seededIndex(1000) / 1000,
  );
  if (catastrophe) addBeat('disruption', catastrophe);

  // The standing condition the work is done under, where there is one.
  //
  // Unrolled, unlike the disruption clause: an episode may or may not have
  // reached a given life, but a legal condition reached all of it, every day,
  // and a biography that mentions the cooperage without mentioning who owns
  // the cooper is not describing the same life.
  if (persona.socialCondition) addBeat('condition', persona.socialCondition.clause);

  // Helper function to get belief description
  const getBeliefDescription = (beliefs: any[]): string | null => {
    if (!beliefs || beliefs.length === 0) return null;

    // Sort by conviction to get the strongest belief
    const sortedBeliefs = [...beliefs].sort((a, b) => b.conviction - a.conviction);
    const primaryBelief = sortedBeliefs[0];

    if (!primaryBelief || !primaryBelief.beliefId) return null;

    // Look up the belief text from PERSONAL_BELIEFS constant
    const beliefData = PERSONAL_BELIEFS.find((b: any) => b.id === primaryBelief.beliefId);

    if (beliefData && beliefData.text) {
      // Strip common prefixes and lowercase the first letter to integrate into sentence
      let cleanText = beliefData.text
        .replace(/^[Bb]elieves that /i, '')
        .replace(/^[Bb]elieves in /i, '')
        .replace(/^[Bb]elieves /i, '')
        .replace(/^[Dd]eeply /i, '');
      return cleanText.charAt(0).toLowerCase() + cleanText.slice(1);
    }

    return null;
  };

  // Social standing and beliefs - more sophisticated integration
  const beliefText = getBeliefDescription(character.beliefs);

  const professionText = professionName;
  const canCarryAbstractIdeology = /merchant|banker|lawyer|clerk|scribe|scholar|teacher|operator|official|administrator|printer|journalist|student|activist|politician|priest|monk|imam|rabbi|minister|reformer|writer|artist|entrepreneur|shopkeeper|trader/.test(professionText);
  const ideologyLooksModern = /CAPITALIST|SOCIALIST|LIBERAL|NATIONALIST/i.test(character.ideology || '');

  if (character.ideology && character.ideology !== 'Pragmatism' && (!ideologyLooksModern || canCarryAbstractIdeology)) {
    const ideology = IDEOLOGIES.find((i: any) => i.id === character.ideology);
    addBeat('outlook', describeIdeology(ideology, narrativePronouns, pickBiography));
  } else if (beliefText) {
    // If no ideology but has beliefs, mention them
    addBeat('outlook', `${pronounPossCap} worldview ${pronounBe} shaped by the conviction that ${beliefText}.`);
  }

  // Personality - sophisticated and varied
  const personality = character.personality;
  if (personality) {
    const traits: string[] = [];

    // Check for ideologies that conflict with certain personality traits
    const isRevolutionary = character.ideology &&
      (character.ideology.toLowerCase().includes('revolutionary') ||
       character.ideology.toLowerCase().includes('radical') ||
       character.ideology.toLowerCase().includes('anarchist'));

    // The temperament thresholds are unchanged; what each one can say is not.
    // A single fixed string per threshold put "a practical nature that values
    // the proven over the experimental" into every era at the same rate.
    const trait = (bank: Parameters<typeof selectDetail>[0]): void => {
      const text = selectDetail(bank, bioContext, pickBiography);
      if (text) traits.push(text);
    };

    if (personality.openness > 0.7 && personality.extraversion > 0.6) {
      trait(TRAIT_OPEN_OUTGOING);
    } else if (personality.openness > 0.7 && personality.conscientiousness > 0.6) {
      trait(TRAIT_OPEN_METHODICAL);
    } else if (personality.openness > 0.7) {
      trait(TRAIT_OPEN);
    } else if (personality.openness < 0.3 && personality.conscientiousness > 0.7 && !isRevolutionary) {
      // Skip "tradition and routine" if revolutionary
      trait(TRAIT_SETTLED);
    } else if (personality.openness < 0.3) {
      trait(TRAIT_PRACTICAL);
    }

    if (personality.agreeableness > 0.7 && personality.extraversion > 0.6 && !isRevolutionary) {
      // Skip "warm and generous" if revolutionary (conflicts with radical change)
      trait(TRAIT_WARM);
    } else if (personality.agreeableness > 0.7 && !isRevolutionary) {
      // Skip "gentle disposition seeks harmony" if revolutionary (direct contradiction)
      trait(TRAIT_GENTLE);
    } else if (personality.agreeableness > 0.7 && isRevolutionary) {
      // Alternative trait for high agreeableness revolutionaries
      trait(TRAIT_COMMITTED);
    } else if (personality.agreeableness < 0.3 && personality.neuroticism < 0.4) {
      trait(TRAIT_BLUNT);
    } else if (personality.agreeableness < 0.3) {
      trait(TRAIT_INDEPENDENT);
    }

    if (personality.conscientiousness > 0.75) {
      trait(TRAIT_SCRUPULOUS);
    } else if (personality.neuroticism > 0.7) {
      trait(TRAIT_WARY);
    }

    if (traits.length > 0) {
      const personalityIntros = [
        `Those who know ${pronounObj} speak of ${traits[0]}`,
        `Acquaintances describe ${pronounObj} as possessing ${traits[0]}`,
        `${pronounPossCap} reputation rests on ${traits[0]}`,
        `${subjectCap} ${pronounBe} known for ${traits[0]}`
      ];

      // Every trait that qualified used to be listed, so most personas ended on
      // a three-clause sentence of the same shape. One trait is often the more
      // characterful choice.
      const traitCount = Math.min(traits.length, pickBiography([1, 1, 2, 2, 3]));
      let personalitySentence = pickBiography(personalityIntros);
      if (traitCount > 1) personalitySentence += `, as well as ${traits[1]}`;
      if (traitCount > 2) personalitySentence += `, and ${traits[2]}`;
      addBeat('personality', `${personalitySentence}.`);
    }
  }

  // The closing roll-call of parents is dropped whenever the names have already
  // been folded into the livelihood sentence, and often when they have not.
  if (!foldParentNames && character.family && character.family.length > 0 && chance(55)) {
    addBeat('parents', describeParents(father?.name, mother?.name, narrativePronouns, true));
  }

  // ---- Arrangement -------------------------------------------------------

  /**
   * Orderings of the origins beats. The opening is anchored first because it
   * carries the birth, and everything else reads as a subordinate clause of it.
   */
  const ORIGIN_PLANS: string[][] = [
    ['opening', 'livelihood', 'childhood', 'appearance', 'origin-attr', 'youth-event'],
    ['opening', 'childhood', 'livelihood', 'origin-attr', 'youth-event', 'appearance'],
    ['opening', 'origin-attr', 'livelihood', 'childhood', 'youth-event', 'appearance'],
    ['opening', 'livelihood', 'youth-event', 'childhood', 'origin-attr', 'appearance'],
    ['opening', 'appearance', 'livelihood', 'childhood', 'origin-attr', 'youth-event'],
    ['opening', 'childhood', 'origin-attr', 'appearance', 'livelihood', 'youth-event'],
  ];

  /**
   * Orderings of the present beats. Every plan ends on the closing three, and
   * `trade` must immediately follow `profession` in all of them: the texture
   * sentence is a continuation of the profession sentence, and separating them
   * produced "At 49, she works as a farm worker. At age 31, her mother died…
   * The trade is piece rates, a contractor, and a season that ends without
   * notice."
   */
  const PRESENT_PLANS: string[][] = [
    ['profession', 'trade', 'condition', 'present-attr', 'adult-events', 'health', 'world', 'polity', 'disruption', 'outlook', 'personality', 'parents'],
    ['profession', 'trade', 'condition', 'world', 'disruption', 'polity', 'adult-events', 'present-attr', 'health', 'personality', 'outlook', 'parents'],
    ['adult-events', 'profession', 'trade', 'condition', 'present-attr', 'polity', 'disruption', 'health', 'world', 'personality', 'outlook', 'parents'],
    ['disruption', 'polity', 'world', 'profession', 'trade', 'condition', 'adult-events', 'present-attr', 'health', 'outlook', 'personality', 'parents'],
    ['profession', 'trade', 'condition', 'health', 'disruption', 'present-attr', 'adult-events', 'world', 'polity', 'outlook', 'personality', 'parents'],
    ['present-attr', 'profession', 'trade', 'condition', 'polity', 'disruption', 'adult-events', 'world', 'health', 'personality', 'outlook', 'parents'],
  ];

  /** Beats that describe the person rather than the life, for the last break. */
  const CLOSING_BEATS = new Set(['outlook', 'personality', 'parents']);

  const render = (plan: string[]): string[] => plan.flatMap(id => beats.get(id) ?? []);

  const originPlan = pickBiography(ORIGIN_PLANS);
  const presentPlan = pickBiography(PRESENT_PLANS);

  // A long life with a lot to report earns a third paragraph; a short one does
  // not. Previously every biography was two paragraphs regardless.
  const presentLength = render(presentPlan).length;
  const closingIndex = presentPlan.findIndex(id => CLOSING_BEATS.has(id));
  const splitPresent = presentLength >= 8
    && character.age >= 40
    && closingIndex > 0
    && chance(45);

  const paragraphSentences = splitPresent
    ? [
      render(originPlan),
      render(presentPlan.slice(0, closingIndex)),
      render(presentPlan.slice(closingIndex)),
    ]
    : [render(originPlan), render(presentPlan)];

  const cleanParagraph = (sentences: string[]): string => sentences
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return paragraphSentences.map(cleanParagraph).filter(Boolean).join('\n\n');
}
