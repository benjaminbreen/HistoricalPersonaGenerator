// Shared prompts for the LLM persona routes. The Vercel route, server.js, and
// the Vite dev middleware all build their prompts here, so a persona developed
// locally is written by the same instructions as one developed in production.

// Temperatures used to live here, beside the prompts they belong to. They now
// sit in `llm.js` alongside the output ceiling and the reasoning effort for the
// same task, so that every knob governing what a call costs and how it reads is
// on one screen rather than split across two files.

export const buildOrientationModelSchema = schema => ({
  $schema: schema.$schema,
  type: 'object',
  additionalProperties: false,
  required: ['persona'],
  properties: {
    persona: schema.properties.persona,
    provenance: schema.properties.provenance,
  },
  $defs: schema.$defs,
});

/** One inexpensive source call returns both the visible character facts and prose. */
export const buildSourcePersonaModelSchema = schema => ({
  $schema: schema.$schema,
  type: 'object',
  additionalProperties: false,
  required: ['persona', 'day_in_life'],
  properties: {
    persona: schema.properties.persona,
    provenance: schema.properties.provenance,
    day_in_life: {
      type: 'string',
      minLength: 500,
      maxLength: 1800,
    },
  },
  $defs: schema.$defs,
});

export const buildAnnotationPrompt = (source, options) => {
  const targetInstruction = options?.target === 'named_subject'
    ? 'Generate the persona record for the named subject of the source if the source clearly has one. For a Wikipedia biography, this means the article subject. Use a historically situated moment during that person\'s life, not a posthumous summary.'
    : 'Generate a plausible ordinary person from the source world, not the famous subject unless the source itself is ordinary-person evidence.';

  return [
    'Create a compact historical persona-orientation record for conditioning a vintage language model.',
    'Return exactly one JSON object and no markdown.',
    targetInstruction,
    options?.preferredMoment ? `Preferred moment or angle: ${options.preferredMoment}` : '',
    'Return only persona and provenance. The application adds IDs, source metadata, and export metadata.',
    'The output must conform to the supplied compact JSON Schema. Do not include properties outside it.',
    '',
    'Persona rules:',
    '- Treat supplied identity, year, place, age, gender, work, status, and religion as fixed.',
    '- Prefer direct source facts, then conservative inference, then mundane synthesis. Omit optional fields that would require distinctive invented facts.',
    '- Write short natural-language values, not abstract sociological labels. Concrete routines, tools, food, bodily conditions, obligations, and limits are most useful.',
    '- Make knowledge and mobility horizons narrow and period-specific. The persona does not know later history.',
    '- Moral assumptions must be the person’s situated categories, not modern political or psychological analysis.',
    '- Voice describes register, cadence, vocabulary, and avoidance cues. Keep any sample to one short sentence so it does not become a repeated catchphrase.',
    '- Conversation frame states where and why the person is speaking and what relation they assume with the interlocutor.',
    '- Add 2-6 concrete anachronism guards naming unavailable events, concepts, technologies, or vocabulary.',
    '- Use provenance only for important claims. Paths begin /persona/. Mark support explicit, inferred, synthetic, or uncertain; quote at most a short source phrase.',
    '- Choose year between -10000 and 2030; negative integers represent BCE dates. For biography pages choose a meaningful living-year moment.',
    source?.sourceBasis === 'synthetic_composite'
      ? '- This is a synthetic procedural seed, not documentary evidence. Preserve every supplied core fact exactly. Use provenance support synthetic for elaborations and never imply archival proof.'
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
      locked_subject: options?.target === 'named_subject' ? source?.subject : undefined,
    }),
    '',
    'Source text:',
    String(source?.text || '').slice(0, 16000),
  ].filter(Boolean).join('\n');
};

export const buildSourcePersonaPrompt = (source, options) => [
  buildAnnotationPrompt({ ...source, text: String(source?.text || '').slice(0, 9000) }, options)
    .replace('Return only persona and provenance.', 'Return persona, concise provenance, and day_in_life.'),
  '',
  'This is the ordinary Source Studio path, not a Talkie JSONL export.',
  'Keep persona fields concise and prioritize what the reader sees: identity, date, place, occupation, religion, status, language, household, tools, clothing, possessions, food, bodily state, pressures, and ordinary routine.',
  'day_in_life must be exactly two paragraphs and 150-180 words total.',
  'Begin mid-action at the chosen living-year moment. Use close-third historical fiction with at least three precise sensory details. Show rank, dependence, belief, work, and danger through physical action and choices.',
  'Treat article facts and locked_subject as fixed. Educated guesses must be mundane, compatible with the source, and never contradict the person’s dates, country, occupation, religion, family, or known events.',
  'Never mention Wikipedia, evidence, schemas, uncertainty, sources, or the model. Never use encyclopedia-summary prose, modern analysis, a raw negative year, or generic filler such as “navigates”, “precarious”, “weathered”, or “a testament to”.',
].join('\n');

const compactText = (value, maxLength = 180) => {
  if (value === undefined || value === null) return '';
  const text = String(value).replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

const compactList = (value, limit = 5) => Array.isArray(value)
  ? value.slice(0, limit).map(item => compactText(item, 100)).filter(Boolean)
  : [];

const joinDetails = (...values) => {
  const details = values
    .flatMap(value => Array.isArray(value) ? value : [value])
    .map(value => compactText(value))
    .filter(Boolean);
  return [...new Set(details)].join('; ');
};

export const formatHistoricalYear = value => {
  const year = Number(value);
  if (!Number.isFinite(year)) return '';
  if (year < 0) return `${Math.abs(Math.trunc(year))} BCE`;
  if (year === 0) return 'the turn of the common era';
  return String(Math.trunc(year));
};

/** A small human-readable dossier for the prose model, not a schema dump. */
export const buildSketchDossier = record => {
  if (!record || typeof record !== 'object') return '';
  const seed = record.persona_seed || {};
  const source = record.source || {};
  const identity = seed.identity_name || {};
  const social = seed.social_identity || {};
  const position = seed.social_position || {};
  const place = seed.place || {};
  const work = seed.work || {};
  const household = seed.household_economy || {};
  const material = seed.material_life || {};
  const horizon = seed.mobility_and_horizon || {};
  const voice = seed.temperament_and_voice || {};
  const lines = [];
  const add = (label, ...values) => {
    const detail = joinDetails(...values);
    if (detail) lines.push(`${label}: ${detail}`);
  };

  add(
    'Person',
    identity.full_name,
    social.estimated_age !== undefined && social.estimated_age !== null
      && Number.isFinite(Number(social.estimated_age))
      ? `${social.estimated_age} years old`
      : '',
    social.gender_role,
    formatHistoricalYear(seed.temporal?.specific_year)
  );
  add(
    'Place',
    place.settlement_or_locality,
    place.region,
    place.polity,
    place.residence_locale,
    compactList(place.environment, 3)
  );
  add(
    'Position',
    position.local_status_detail || social.status_detail || social.status_group,
    social.legal_condition,
    social.household_role,
    position.autonomy,
    position.economic_security
  );
  add(
    'Work',
    work.primary_occupation,
    work.work_rhythm,
    compactList(work.tools_materials_techniques, 6),
    work.work_notes
  );
  add(
    'Household and exchange',
    household.household_composition,
    household.dependents,
    compactList(household.income_sources, 4),
    compactList(household.debts_dues_taxes_or_rents, 4),
    household.property_relation,
    household.cash_position,
    household.economic_notes
  );
  add(
    'Material life',
    material.dwelling_detail || material.dwelling_type,
    compactList(material.possessions, 6),
    material.clothing_detail || material.clothing_level,
    compactList(material.foods_or_consumables, 5),
    material.food_security,
    compactList(material.body_conditions, 4),
    material.material_notes
  );
  add(
    'Pressures',
    compactList(place.historical_pressures, 4),
    (seed.constraint_regimes || []).slice(0, 3).map(item => compactText(item?.detail, 120))
  );
  add(
    'Known world',
    horizon.knowledge_horizon,
    horizon.mobility_notes || horizon.mobility,
    seed.public_world?.detail || seed.public_world?.scale
  );
  add(
    'Belief and obligation',
    seed.religious_practice?.specific_label,
    seed.religious_practice?.practice_context,
    horizon.religious_or_moral_world,
    seed.normative_world?.detail || seed.normative_world?.primary_frame
  );
  add(
    'Immediate stakes',
    compactList(voice.public_concerns, 3),
    compactList(voice.private_concerns, 3),
    compactList(voice.hopes, 3),
    compactList(voice.small_pleasures, 3),
    seed.interaction_style?.detail
  );
  add('Do not introduce', compactList(voice.anachronism_guards, 6));

  if (source.source_basis === 'synthetic_composite') {
    add('Grounding', 'synthetic seed; keep identity, date, place, work, household, and status fixed; add only conservative mundane connective detail');
  } else {
    add('Source', source.title, source.document_genre, record.evidence?.basis_summary);
    add(
      'Direct traces',
      (record.evidence?.source_snippets || [])
        .slice(0, 2)
        .map(item => compactText(item?.snippet, 180))
    );
  }

  return lines.join('\n');
};

export const buildSketchPrompt = record => {
  const synthetic = record?.source?.source_basis === 'synthetic_composite';
  return [
    'Write exactly two paragraphs, 150-180 words total, of vivid close-third historical fiction grounded in the dossier.',
    'Begin mid-action in ordinary work or household life. Make the physical world perceptible through at least three concrete details of tools, materials, food, clothing, shelter, weather, sound, smell, touch, heat, cold, fatigue, or hunger. Show status, dependence, belief, and danger through choices and gestures rather than naming categories.',
    'Use flowing, varied sentence lengths, precise concrete verbs, and unsentimental psychological intimacy. Stay inside this person\'s period knowledge. Never use modern analysis, schema language, a raw negative year, or an encyclopedia-summary voice. Do not begin with a date or age.',
    synthetic
      ? 'This is a synthetic seed. Sensory connective detail may elaborate only what the dossier already implies. Do not add household members, possessions, events, prices, technologies, or beliefs.'
      : 'Treat source facts as fixed. Where evidence is silent, omit specificity rather than inventing names, events, prices, possessions, technologies, or beliefs.',
    'Do not mention sources, evidence, uncertainty, personality labels, or the dossier. Avoid “navigates”, “precarious”, “weathered”, and “a testament to”. Return plain text only.',
    'DOSSIER',
    buildSketchDossier(record),
  ].filter(Boolean).join('\n\n');
};
