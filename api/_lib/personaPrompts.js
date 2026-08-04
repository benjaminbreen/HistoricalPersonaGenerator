// Shared prompts for the LLM persona routes. The Vercel route, server.js, and
// the Vite dev middleware all build their prompts here, so a persona developed
// locally is written by the same instructions as one developed in production.

// Temperatures used to live here, beside the prompts they belong to. They now
// sit in `llm.js` alongside the output ceiling and the reasoning effort for the
// same task, so that every knob governing what a call costs and how it reads is
// on one screen rather than split across two files.

export const buildAnnotationPrompt = (source, options) => {
  const targetInstruction = options?.target === 'named_subject'
    ? 'Generate the persona record for the named subject of the source if the source clearly has one. For a Wikipedia biography, this means the article subject. Use a historically situated moment during that person\'s life, not a posthumous summary.'
    : 'Generate a plausible ordinary person from the source world, not the famous subject unless the source itself is ordinary-person evidence.';

  return [
    'You are filling a strict JSONL annotation record for a historical persona generator.',
    'Return exactly one JSON object and no markdown.',
    targetInstruction,
    options?.preferredMoment ? `Preferred moment or angle: ${options.preferredMoment}` : '',
    'Use schema_version "1.1.0".',
    'The output must conform to the supplied JSON Schema. Do not include properties outside it, and use enum values exactly as written.',
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
    '- Choose a specific_year between -10000 and 2030; negative integers represent BCE dates. Set decade to the multiple of 10 containing that year. For biography pages, choose a meaningful living-year moment supported by the page.',
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
