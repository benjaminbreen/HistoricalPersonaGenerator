// Shared prompts for the LLM persona routes. The Vercel route, server.js, and
// the Vite dev middleware all build their prompts here, so a persona developed
// locally is written by the same instructions as one developed in production.

export const ANNOTATION_TEMPERATURE = 0.35;
export const SKETCH_TEMPERATURE = 0.55;

export const buildAnnotationPrompt = (source, options, annotationSchema) => {
  const targetInstruction = options?.target === 'named_subject'
    ? 'Generate the persona record for the named subject of the source if the source clearly has one. For a Wikipedia biography, this means the article subject. Use a historically situated moment during that person\'s life, not a posthumous summary.'
    : 'Generate a plausible ordinary person from the source world, not the famous subject unless the source itself is ordinary-person evidence.';

  return [
    'You are filling a strict JSONL annotation record for a historical persona generator.',
    'Return exactly one JSON object and no markdown.',
    targetInstruction,
    options?.preferredMoment ? `Preferred moment or angle: ${options.preferredMoment}` : '',
    'Use schema_version "1.1.0".',
    'The output must conform to this JSON Schema. Do not include properties outside the schema:',
    JSON.stringify(annotationSchema),
    '',
    'Evidence rules:',
    '- Fill every required field.',
    '- Prefer direct evidence from the source.',
    '- Use conservative historical inference for guessable fields.',
    '- Use plausible synthesis only for mundane gaps like dwelling, food security, clothing, temperament, or concerns.',
    '- Mark synthesized or inferred fields in field_evidence using support_level.',
    '- Fill persona_seed.identity_name for ordinary fictional personas or inferred source-world people. Use historically plausible names for the place, language, status, gender role, and period; mark support_level and confidence.',
    '- Fill persona_seed.social_position, persona_seed.constraint_regimes, persona_seed.public_world, persona_seed.religious_practice, persona_seed.normative_world, and persona_seed.interaction_style when evidence or conservative inference supports them.',
    '- Use the new compact fields to classify portable dimensions: social/economic security, autonomy, structural constraints, public-world scale, religious or ritual practice, normative frame, and behavior under social conditions. Put culturally specific terms in detail fields rather than inventing narrow enum values.',
    '- For literary salons, reform circles, artistic circles, or public intellectual communities, prefer public_world.scale "cultural_or_reform_network" over ritual_or_scholarly_network unless ritual institutions or formal scholarship are central.',
    '- For unpaid editorial, household, or business collaboration within a marriage or family enterprise, prefer work.labor_relation "family_enterprise_or_spousal_collaboration" over self_employed.',
    '- For work.workplace, use only schema enum values: household, field, workshop, shop, street, dock, office, kitchen, ship, barracks, court, religious_house, factory, mixed.',
    '- For persona_seed.place.residence_locale and activity_locale, use only schema enum values. If unsure, use urban_neighborhood for residence_locale and mixed_or_itinerant for activity_locale.',
    '- Ensure persona_seed.temporal.period_bucket contains persona_seed.temporal.specific_year.',
    '- Fill persona_seed.family.members when parents, spouse, children, or siblings are known or can be conservatively inferred. Use real known family for named historical subjects when available; otherwise use sparse plausible placeholders and mark support_level synthetic_fill or weak_inference.',
    '- Fill persona_seed.temperament_and_voice.personality_traits as Big Five values from 0 to 1. Ground them in the source where possible; otherwise infer conservatively from temperament, voice, work, and social position.',
    '- Keep source_snippets short.',
    '- Use evidence.bias_flags to note Wikipedia/reference source limitations, elite bias, model_synthesized_gaps, and uncertainty.',
    '- Do not give modern concepts, later hindsight, or broad omniscience to the persona.',
    '- If the named subject is elite or famous, household economy and material life should reflect their actual social position rather than ordinary defaults.',
    '- Choose a specific_year between 1400 and 1930. For biography pages, choose a meaningful living-year moment supported by the page.',
    source?.sourceBasis === 'synthetic_composite'
      ? '- This source is a synthetic procedural seed, not a documentary archive. Preserve the seed name, year, place, gender, age, religion, profession, and social position exactly when present. Fill missing schema fields only, mark all unsupported details as synthetic_fill or weak_inference, and do not write as if archival evidence or a historical record proves the persona.'
      : '',
    '',
    'Source metadata:',
    JSON.stringify({
      title: source?.title,
      url: source?.url,
      citation_label: source?.citationLabel,
      source_basis: source?.sourceBasis,
      extraction_method: source?.extractionMethod,
      reliability_notes: source?.reliabilityNotes,
    }),
    '',
    'Source text:',
    String(source?.text || '').slice(0, 30000),
  ].filter(Boolean).join('\n');
};

// A sketch written from the same instructions every time comes out in the same
// shape every time: a date or an age, the name, a present-tense verb. These
// helpers turn the record's own temperament and trait fields into register
// directives, so a terse guarded sitter and a voluble hopeful one do not get
// the same prose.

const has = (value, ...needles) => {
  const text = String(value || '').toLowerCase();
  return needles.some(needle => text.includes(needle));
};

const pick = list => list[Math.floor(Math.random() * list.length)];

const OPENING_ANGLES = [
  'a task or object in this person\'s hands',
  'an obligation to another named person in the household or trade',
  'a detail of the room, street, workshop, or field at close range',
  'a constraint they live under: a rule, tax, debt, season, or authority',
  'an exchange, payment, or bargain',
  'a habit that structures the day',
  'something recently lost, changed, or newly required of them',
];

/**
 * Register directives derived from temperament_and_voice and the Big Five.
 * These govern sentence length, rhythm, and what the prose notices; they are
 * never to be stated outright.
 */
const voiceDirectives = record => {
  const voice = record?.persona_seed?.temperament_and_voice || {};
  const traits = voice.personality_traits || {};
  const stress = record?.persona_seed?.interaction_style?.under_stress;
  const directives = [];

  const terse = has(voice.speech_style, 'terse', 'concrete', 'direct', 'earthy')
    || has(voice.abstraction_level, 'very_concrete')
    || (typeof traits.extraversion === 'number' && traits.extraversion < 0.4);
  const voluble = has(voice.speech_style, 'elaborate', 'formal', 'ornate', 'discursive')
    || (typeof traits.extraversion === 'number' && traits.extraversion > 0.65)
    || (typeof traits.openness === 'number' && traits.openness > 0.7);

  if (terse && !voluble) {
    directives.push('Sentences run short and declarative — most under fourteen words, never over twenty, rarely more than one subordinate clause. Plain nouns. No accumulating lyrical lists.');
  } else if (voluble) {
    directives.push('Sentences run longer and accumulate clauses, the way a person who likes talking builds an account, with asides folded in. Average around twenty-five words and never exceed forty; still end some sentences early. Because these sentences are long, write no more than six or seven in total across both paragraphs.');
  } else {
    directives.push('Vary sentence length deliberately: a sentence of twenty-five or thirty words, then a short one that lands. Nothing over forty; eight to eleven sentences in total.');
  }

  if (has(voice.dominant_temperament, 'anxious') || (typeof traits.neuroticism === 'number' && traits.neuroticism > 0.65)) {
    directives.push('The prose keeps checking for what could go wrong: costs, weather, the next demand. Unease sits in what gets noticed, never in the word "anxious".');
  }
  if (has(voice.dominant_temperament, 'hopeful')) {
    directives.push('The prose leans forward — toward what is being built or waited for — without becoming sentimental.');
  }
  if (has(voice.dominant_temperament, 'guarded', 'suspicious') || has(voice.how_they_react_to_strangers, 'cautious', 'strategic')) {
    directives.push('The prose withholds. It states what is done, not what is felt, and treats outsiders as facts to be managed.');
  }
  if (has(voice.dominant_temperament, 'dutiful') || (typeof traits.conscientiousness === 'number' && traits.conscientiousness > 0.7)) {
    directives.push('The prose keeps accounts: what is owed, what is finished, what is due next.');
  }
  if (has(voice.dominant_temperament, 'patient') || has(stress, 'enduring')) {
    directives.push('The rhythm is unhurried. Time is measured in seasons and repetitions rather than events.');
  }
  if (typeof traits.agreeableness === 'number' && traits.agreeableness > 0.7) {
    directives.push('Other people are present in nearly every sentence, named and attended to.');
  }
  if (typeof traits.openness === 'number' && traits.openness < 0.35) {
    directives.push('Stay with the concrete and the local. No speculation about wider worlds or abstract ideas.');
  }

  if (has(voice.self_narration_style, 'relational')) {
    directives.push('This person understands their life through who they are to others; let the prose foreground those ties.');
  } else if (has(voice.self_narration_style, 'fatalistic')) {
    directives.push('Outcomes arrive from outside — weather, authority, God, luck. The prose does not credit them to planning.');
  } else if (has(voice.self_narration_style, 'duty_focused')) {
    directives.push('Obligation, not preference, is the organizing logic of the sketch.');
  } else if (has(voice.self_narration_style, 'practical')) {
    directives.push('Method and means come first: how the work is actually done.');
  }

  return directives;
};

export const buildSketchPrompt = record => [
  'Write a historically grounded persona sketch from this annotation record.',
  'Write exactly two compact paragraphs, totaling 120-180 words.',
  'Each paragraph should earn its place: prioritize source-specific circumstances, work, stakes, and voice over general historical atmosphere.',
  'Do not write a generic encyclopedia biography. Write a vivid but sober character sheet sketch anchored to the selected year, social position, work, household economy, material life, concerns, and worldview.',
  'Distinguish direct evidence from plausible inference in natural prose without footnotes.',
  'Avoid modern hindsight and anachronistic vocabulary.',
  [
    'Register — write in close third person, past or present tense, staying inside this person\'s frame of reference: their words for things, their sense of what matters. Never switch to first person ("I", "my") and never address the reader.',
    'The sketch should read as this particular person, not as a historical narrator describing them. Apply the following as sentence rhythm and choice of detail; never name a trait, temperament, or personality term outright:',
    'The 120-180 word budget still governs. Where the register calls for long sentences, write fewer of them rather than a longer sketch.',
    ...voiceDirectives(record).map(directive => `- ${directive}`),
  ].join('\n'),
  [
    'Opening — do not begin with the year, a date, a season, or the person\'s age. Do not begin with a phrase of the form "In 1788," or "At twenty-four,".',
    `Begin instead from ${pick(OPENING_ANGLES)}, and let the year and age arrive later, where they matter.`,
    'Avoid the words "navigates", "precarious", "weathered", and "a testament to".',
  ].join('\n'),
  record?.source?.source_basis === 'synthetic_composite'
    ? 'This is a synthetic procedural seed, not a real archival source. Do not use phrases like "the historical record", "the archive", "evidence shows", or "thin trace". Present it as a plausible generated persona, with uncertainty kept modest and unobtrusive.'
    : '',
  'Return plain text only.',
  JSON.stringify(record),
].filter(Boolean).join('\n\n');
