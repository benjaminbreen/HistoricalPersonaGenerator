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
import {
  conjugate,
  describeIdeology,
  describeLifeEvent,
  describeParents,
  describePhysicalAppearance,
  getNarrativePronouns,
  lowerProfession,
  withIndefiniteArticle,
} from './narrativeTextService';
import {
  describeChildhood,
  describeFoundationalAttribute,
  describeParentalLivelihood,
  describeProfessionWork,
  describeUnnamedBelief,
  describeWorldTexture,
  wealthAdjective,
  type BiographyContext,
} from './biographyDetailService';

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

  // Two paragraphs: where they came from, and where they now stand.
  const origins: string[] = [];
  const present: string[] = [];

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
  origins.push(`${opening}.`);

  // Foundational attributes, split between the two paragraphs by whether they
  // describe where the persona came from or what they are now.
  const foundationalAttributes = character.attributes?.filter((attr: any) => attr.foundational === true) || [];
  const presentAttributeSentences: string[] = [];

  for (const attr of foundationalAttributes) {
    const rendered = describeFoundationalAttribute(attr.id, bioContext);
    if (!rendered) continue;
    if (rendered.slot === 'origin') {
      origins.push(rendered.text);
    } else {
      presentAttributeSentences.push(rendered.text);
    }
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
  const livelihood = describeParentalLivelihood(father, mother, bioContext, pickBiography);
  if (livelihood) origins.push(livelihood);

  origins.push(describeChildhood(bioContext, pickBiography));

  const physicalDescription = describePhysicalAppearance(
    character.appearance,
    narrativePronouns,
    character.birthSex ?? (character.gender === 'Female' ? 'Female' : character.gender === 'Male' ? 'Male' : undefined),
  );
  if (physicalDescription) origins.push(physicalDescription);

  for (const { event, ageAtEvent } of chosenYouth) {
    origins.push(describeLifeEvent(event, ageAtEvent, narrativePronouns));
  }

  // ---- Second paragraph: the present ----

  const professionName = lowerProfession(character.profession);
  const professionArticle = withIndefiniteArticle(professionName).split(' ')[0];

  const professionOpeners = [
    `Now ${character.age}, ${pronoun} ${conjugate('make', narrativePronouns)} ${pronounPoss} living as ${professionArticle} ${professionName}`,
    `At ${character.age}, ${pronoun} ${conjugate('work', narrativePronouns)} as ${professionArticle} ${professionName}`,
    `${subjectCap} ${conjugate('earn', narrativePronouns)} ${pronounPoss} bread as ${professionArticle} ${professionName}, and ${conjugate('have', narrativePronouns)} done for years`,
    `${subjectCap} ${conjugate('follow', narrativePronouns)} the ${professionName}'s trade`
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
  const textureRoll = seededIndex(10);
  const trade = describeProfessionWork(bioContext, pickBiography);
  if (textureRoll < 4) {
    // Folded in, so the paragraph does not always open on the same two beats.
    const folded = trade.replace(/^(?:The work means|That means|It comes down to|The trade is)\s+/, '');
    present.push(`${professionSentence} — ${folded.charAt(0).toLowerCase()}${folded.slice(1)}`);
  } else if (textureRoll < 8) {
    present.push(`${professionSentence}.`);
    present.push(trade);
  } else {
    present.push(`${professionSentence}.`);
  }

  present.push(...presentAttributeSentences);

  for (const { event, ageAtEvent } of chosenAdult) {
    present.push(describeLifeEvent(event, ageAtEvent, narrativePronouns));
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
    const plural = /(?<!s|u|i)s$/.test(diseaseName);
    const hasVerb = plural ? 'have' : 'has';
    // An injury is a thing that happened to a part of a body, not a condition
    // with a proper name: "a torn muscle in his shoulder", not "Torn muscle".
    const injury = INJURY_SITES[diseaseName];
    const subject = injury
      ? `${withIndefiniteArticle(diseaseName)} in ${pronounPoss} ${pickBiography(injury)}`
      : capitalize(diseaseName);
    present.push(grave
      ? `${capitalize(subject)} ${hasVerb} ${pronounObj} now, and the household is preparing for what that usually means.`
      : `${capitalize(subject)} ${hasVerb} made ordinary labor uncertain, but ${pronoun} ${conjugate('continue', narrativePronouns)} as circumstances allow.`);
  }

  const worldTexture = describeWorldTexture(bioContext, pickBiography);
  if (worldTexture) present.push(worldTexture);

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
    const ideologySentence = describeIdeology(ideology, narrativePronouns);
    if (ideologySentence) present.push(ideologySentence);
  } else if (beliefText) {
    // If no ideology but has beliefs, mention them
    present.push(`${pronounPossCap} worldview ${pronounBe} shaped by the conviction that ${beliefText}.`);
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

    // More nuanced personality combinations
    if (personality.openness > 0.7 && personality.extraversion > 0.6) {
      traits.push('an adventurous spirit who seeks out new experiences and companions');
    } else if (personality.openness > 0.7 && personality.conscientiousness > 0.6) {
      traits.push('a curious mind tempered by methodical discipline');
    } else if (personality.openness > 0.7) {
      traits.push('a thoughtful soul drawn to novel ideas and perspectives');
    } else if (personality.openness < 0.3 && personality.conscientiousness > 0.7 && !isRevolutionary) {
      // Skip "tradition and routine" if revolutionary
      traits.push('a steadfast character who finds strength in tradition and routine');
    } else if (personality.openness < 0.3) {
      traits.push('a practical nature that values the proven over the experimental');
    }

    if (personality.agreeableness > 0.7 && personality.extraversion > 0.6 && !isRevolutionary) {
      // Skip "warm and generous" if revolutionary (conflicts with radical change)
      traits.push('a warm and generous presence that draws people near');
    } else if (personality.agreeableness > 0.7 && !isRevolutionary) {
      // Skip "gentle disposition seeks harmony" if revolutionary (direct contradiction)
      traits.push('a gentle disposition that seeks harmony above conflict');
    } else if (personality.agreeableness > 0.7 && isRevolutionary) {
      // Alternative trait for high agreeableness revolutionaries
      traits.push('a compassionate heart that drives commitment to justice');
    } else if (personality.agreeableness < 0.3 && personality.neuroticism < 0.4) {
      traits.push('a bold, uncompromising manner that some find refreshing and others find abrasive');
    } else if (personality.agreeableness < 0.3) {
      traits.push('an independent streak that prizes personal freedom above social convention');
    }

    if (personality.conscientiousness > 0.75) {
      traits.push('a scrupulousness about obligations that neighbors rely on more than they acknowledge');
    } else if (personality.neuroticism > 0.7) {
      traits.push('a wariness that reads trouble into quiet weeks');
    }

    if (traits.length > 0) {
      const personalityIntros = [
        `Those who know ${pronounObj} speak of ${traits[0]}`,
        `Acquaintances describe ${pronounObj} as possessing ${traits[0]}`,
        `${pronounPossCap} reputation rests on ${traits[0]}`,
        `${subjectCap} ${pronounBe} known for ${traits[0]}`
      ];

      let personalitySentence = pickBiography(personalityIntros);
      if (traits.length > 1) personalitySentence += `, as well as ${traits[1]}`;
      if (traits.length > 2) personalitySentence += `, and ${traits[2]}`;
      present.push(`${personalitySentence}.`);
    }
  }

  // Add parent names at the end
  if (character.family && character.family.length > 0) {
    const parentSentence = describeParents(father?.name, mother?.name, narrativePronouns, true);
    if (parentSentence) present.push(parentSentence);
  }

  const cleanParagraph = (sentences: string[]): string => sentences
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const paragraphs = [cleanParagraph(origins), cleanParagraph(present)].filter(Boolean);
  return paragraphs.join('\n\n');
}
