import Ajv2020, { ErrorObject } from 'ajv/dist/2020';
import orientationSchema from '../schemas/personaOrientation.schema.json';
import type { HistoricalPersonaAnnotationRecord, IngestedPersonaSource } from '../types/personaAnnotation';
import type {
  PersonaOrientationCore,
  PersonaOrientationModelOutput,
  PersonaOrientationProvenance,
  PersonaOrientationRecord,
} from '../types/personaOrientation';
import { createAnnotationRecordFromSource } from './personaAnnotationService';
import { assertPersonaAnnotationRecord } from './personaMaterialValidationService';
import { periodBucketForYear } from '../constants/personaAnnotationTemporal';

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat('uri', {
  type: 'string',
  validate: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
});
const validateOrientationSchema = ajv.compile(orientationSchema);
const orientationSchemaRoot = orientationSchema as any;

const resolveSchemaNode = (node: any): any => {
  if (!node?.$ref || !String(node.$ref).startsWith('#/')) return node;
  return String(node.$ref)
    .slice(2)
    .split('/')
    .reduce((value: any, key: string) => value?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], orientationSchemaRoot);
};

/**
 * Provider structured output is best-effort because the schema has optional
 * fields and therefore cannot use OpenAI strict mode. Normalize limits already
 * declared by the canonical schema and repair the common scalar-for-array
 * mistake. Substantive missing values and bad enum/type values still go to AJV.
 */
const normalizeModelValue = (value: unknown, schemaNode: any): any => {
  const node = resolveSchemaNode(schemaNode);
  if (value === undefined || value === null) return undefined;

  if (node?.type === 'string' && typeof value === 'string') {
    const trimmed = value.trim();
    return node.minLength && trimmed.length < node.minLength ? undefined : trimmed;
  }

  if (node?.type === 'array') {
    const values = Array.isArray(value)
      ? value
      : typeof value === 'string' && Number(node.minItems || 0) > 1
        ? value.split(/\n+|;\s*/).filter(Boolean)
        : [value];
    const capped = typeof node.maxItems === 'number' ? values.slice(0, node.maxItems) : values;
    return capped
      .map(item => normalizeModelValue(item, node.items))
      .filter(item => item !== undefined);
  }

  if (node?.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, childSchema] of Object.entries(node.properties || {})) {
      const normalized = normalizeModelValue((value as Record<string, unknown>)[key], childSchema);
      if (normalized !== undefined) result[key] = normalized;
    }
    return result;
  }

  return value;
};

const slug = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56) || 'persona';

const formatPath = (error: ErrorObject): string => {
  if (error.instancePath) return error.instancePath;
  const missing = (error.params as { missingProperty?: string }).missingProperty;
  return missing ? `/${missing}` : '/';
};

export function validatePersonaOrientationRecord(record: unknown): string[] {
  if (validateOrientationSchema(record)) return [];
  return (validateOrientationSchema.errors || []).map(error => `${formatPath(error)} ${error.message || 'is invalid'}`);
}

export function assertPersonaOrientationRecord(record: unknown): PersonaOrientationRecord {
  const errors = validatePersonaOrientationRecord(record);
  if (errors.length > 0) {
    throw new Error(`Persona orientation failed validation: ${errors.slice(0, 6).join('; ')}`);
  }
  return record as PersonaOrientationRecord;
}

export function createPersonaOrientationRecord(
  output: PersonaOrientationModelOutput,
  source: IngestedPersonaSource,
  lockNamedSubject = true
): PersonaOrientationRecord {
  const raw = structuredClone(output || {}) as PersonaOrientationModelOutput & Record<string, unknown>;
  const rawPersona = raw.persona as PersonaOrientationCore & Record<string, unknown>;
  if (rawPersona && typeof rawPersona === 'object') {
    // OpenAI structured output must run non-strict because this compact schema
    // has optional fields. Luna occasionally emits the last persona fields one
    // level too high. Repair only keys that the canonical schema already knows;
    // AJV remains authoritative for their values and every other property.
    for (const key of ['conversation_frame', 'anachronism_guards']) {
      if (rawPersona[key] === undefined && raw[key] !== undefined) rawPersona[key] = raw[key];
    }
    if (!raw.provenance && Array.isArray(rawPersona.provenance)) raw.provenance = rawPersona.provenance as PersonaOrientationProvenance[];
  }
  const normalizedPersona = normalizeModelValue(rawPersona, orientationSchemaRoot.properties.persona) as PersonaOrientationCore;
  const normalizedProvenance = normalizeModelValue(raw.provenance || [], orientationSchemaRoot.properties.provenance) as PersonaOrientationProvenance[];
  if (!normalizedPersona?.name_and_address?.full_name || !Number.isInteger(normalizedPersona?.year)) {
    throw new Error('Luna returned an incomplete persona orientation record. No schema record was saved.');
  }
  const persona = normalizedPersona;
  const subject = lockNamedSubject ? source.subject : undefined;
  if (subject?.name) persona.name_and_address.full_name = subject.name;
  if (subject?.genderRole) persona.gender_role = subject.genderRole;
  if (subject?.birthYear !== undefined) {
    const finalLivingYear = subject.deathYear !== undefined && (persona.year < subject.birthYear || persona.year > subject.deathYear)
      ? subject.birthYear + Math.floor((subject.deathYear - subject.birthYear) * 0.75)
      : Math.max(subject.birthYear, persona.year);
    persona.year = finalLivingYear;
    persona.age_and_life_stage.age = Math.max(0, finalLivingYear - subject.birthYear);
  }
  // Anachronism guards are conditioning instructions rather than historical
  // claims, so a conservative fallback is safer than discarding an otherwise
  // valid source persona when Luna omits this required tail field.
  const guardDefaults = [
    "Knowledge of events after the persona's stated year",
    'Modern political, scientific, and social vocabulary',
  ];
  const guards = [...new Set(Array.isArray(persona.anachronism_guards) ? persona.anachronism_guards : [])];
  for (const fallback of guardDefaults) {
    if (guards.length >= 2) break;
    if (!guards.includes(fallback)) guards.push(fallback);
  }
  persona.anachronism_guards = guards.slice(0, 8);
  const idStem = `${slug(persona.name_and_address.full_name)}-${persona.year}-${Date.now()}`;
  const sourceId = `source-${idStem}`;
  const record: PersonaOrientationRecord = {
    schema_version: '2.0.0',
    persona_id: `persona-${idStem}`,
    persona,
    sources: [{
      source_id: sourceId,
      source_basis: source.sourceBasis,
      title: source.title,
      citation_label: source.citationLabel,
      url: source.url,
      extraction_method: source.extractionMethod,
    }],
    provenance: normalizedProvenance.map(item => ({
      ...item,
      source_id: sourceId,
    })),
  };
  return assertPersonaOrientationRecord(record);
}

export const personaOrientationRecordToJsonl = (record: PersonaOrientationRecord): string =>
  JSON.stringify(record);

const includes = (value: string | undefined, pattern: RegExp): boolean => pattern.test(value || '');

const ageBand = (age: number): HistoricalPersonaAnnotationRecord['persona_seed']['social_identity']['age_band'] => {
  if (age < 13) return 'child';
  if (age < 18) return 'adolescent';
  if (age < 30) return 'young_adult';
  if (age < 45) return 'adult';
  if (age < 60) return 'middle_aged';
  return 'elder';
};

const statusGroup = (value: string): HistoricalPersonaAnnotationRecord['persona_seed']['social_identity']['status_group'] => {
  if (includes(value, /enslav/)) return 'enslaved';
  if (includes(value, /servant|domestic/)) return 'domestic_service';
  if (includes(value, /soldier|military|warrior/)) return 'military';
  if (includes(value, /priest|cleric|monk|nun|religious/)) return 'clerical_or_religious_elite';
  if (includes(value, /scholar|learned|teacher|scribe/)) return 'scholarly_or_learned';
  if (includes(value, /merchant|trader|commercial|shop/)) return 'merchant_or_commercial';
  if (includes(value, /artisan|craft|skilled|guild/)) return 'artisanal_or_craft';
  if (includes(value, /peasant|farmer|smallholder/)) return 'peasant_or_smallholder';
  if (includes(value, /wage|labor|labour|worker/)) return 'wage_laboring';
  if (includes(value, /elite|noble|gentry|chief|ruler|aristocrat/)) return 'local_elite_or_gentry';
  return 'mixed_or_unclear';
};

const legalCondition = (value: string): HistoricalPersonaAnnotationRecord['persona_seed']['social_identity']['legal_condition'] => {
  if (includes(value, /enslav|owned/)) return 'enslaved';
  if (includes(value, /serf|bound to land/)) return 'serf_or_bound_to_land';
  if (includes(value, /indentur|contract bound|apprentice/)) return 'indentured_or_contract_bound';
  if (includes(value, /debt|bonded/)) return 'bonded_or_debt_bound';
  if (includes(value, /citizen|guild member|corporate member/)) return 'citizen_or_corporate_member';
  if (includes(value, /free/)) return 'free';
  if (includes(value, /subject/)) return 'subject_without_full_rights';
  return 'unclear';
};

const laborRelation = (value: string | undefined): HistoricalPersonaAnnotationRecord['persona_seed']['work']['labor_relation'] => {
  if (includes(value, /enslav/)) return 'enslaved_labor';
  if (includes(value, /bond|indentur/)) return 'bonded_labor';
  if (includes(value, /wage|paid/)) return 'wage_labor';
  if (includes(value, /tenant|sharecrop/)) return 'tenant_labor';
  if (includes(value, /guild/)) return 'guild_or_corporate_craft';
  if (includes(value, /domestic|servant/)) return 'domestic_service';
  if (includes(value, /military/)) return 'military_service';
  if (includes(value, /religious|cleric/)) return 'religious_office';
  if (includes(value, /self|independent/)) return 'self_employed';
  if (includes(value, /family|household/)) return 'household_subsistence_labor';
  return 'mixed';
};

const residenceLocale = (value: string): HistoricalPersonaAnnotationRecord['persona_seed']['place']['residence_locale'] => {
  if (includes(value, /port city/)) return 'port_city';
  if (includes(value, /port/)) return 'port_town';
  if (includes(value, /capital|court/)) return 'court_capital';
  if (includes(value, /metropol|large city/)) return 'metropolitan_center';
  if (includes(value, /city|urban/)) return 'urban_neighborhood';
  if (includes(value, /market town/)) return 'market_town';
  if (includes(value, /town/)) return 'provincial_town';
  if (includes(value, /hamlet/)) return 'hamlet';
  if (includes(value, /nomad|camp|pastoral/)) return 'pastoral_or_nomadic_camp';
  if (includes(value, /mobile|itinerant|no fixed/)) return 'mobile_or_no_fixed_residence';
  return 'village';
};

const literacyLevel = (value: string): HistoricalPersonaAnnotationRecord['persona_seed']['social_identity']['literacy'] => {
  if (includes(value, /non[- ]?liter|cannot read|illiterate/)) return 'nonliterate';
  if (includes(value, /signature|name only/)) return 'name_or_signature_only';
  if (includes(value, /scholar|multilingual|learned/)) return 'scholarly_multilingual';
  if (includes(value, /advanced|literary/)) return 'advanced_literary';
  if (includes(value, /full|fluent|reads and writes/)) return 'full_practical';
  if (includes(value, /religious/)) return 'religious_text_literate';
  return 'basic_practical';
};

const economicSecurity = (value: string | undefined): NonNullable<HistoricalPersonaAnnotationRecord['persona_seed']['social_position']>['economic_security'] => {
  if (includes(value, /elite|great wealth/)) return 'elite';
  if (includes(value, /wealth|rich/)) return 'wealthy';
  if (includes(value, /comfortable|secure|surplus/)) return 'comfortable';
  if (includes(value, /modest|adequate/)) return 'modest';
  if (includes(value, /subsistence/)) return 'subsistence';
  if (includes(value, /destitut|starv/)) return 'destitute';
  if (includes(value, /precar|irregular|debt|vulnerab|scarce/)) return 'precarious';
  return 'uncertain';
};

const autonomy = (legal: string, labor: string | undefined): NonNullable<HistoricalPersonaAnnotationRecord['persona_seed']['social_position']>['autonomy'] => {
  if (includes(legal, /enslav|owned/)) return 'enslaved_or_owned';
  if (includes(legal, /prison|confined/)) return 'incarcerated_confined_or_institutionalized';
  if (includes(labor, /indentur|apprentice|bond/)) return 'apprenticed_indentured_or_bound';
  if (includes(labor, /tenant|rent/)) return 'tenant_sharecropper_or_rent_bound';
  if (includes(labor, /wage/)) return 'wage_dependent';
  if (includes(labor, /household|family|dependent/)) return 'household_dependent';
  if (includes(labor, /self|independent|owner/)) return 'high_autonomy';
  return 'uncertain';
};

const confidenceFor = (sourceBasis: string): 'speculative' | 'low' | 'medium' =>
  sourceBasis === 'synthetic_composite' ? 'speculative' : 'medium';

const conciseReligionLabel = (value?: string): string | undefined => {
  if (!value) return undefined;
  const known: Array<[RegExp, string]> = [
    [/\broman catholic\b/i, 'Roman Catholic'],
    [/\bcatholic\b/i, 'Catholic'],
    [/\banglican\b/i, 'Anglican'],
    [/\bquaker\b|\bsociety of friends\b/i, 'Quaker'],
    [/\bpuritan\b/i, 'Puritan'],
    [/\beastern orthodox\b|\borthodox christian\b/i, 'Eastern Orthodox'],
    [/\bprotestant\b/i, 'Protestant'],
    [/\bsunni\b/i, 'Sunni Muslim'],
    [/\bshia\b|\bshi['’]?i\b/i, 'Shia Muslim'],
    [/\bmuslim\b|\bislam(?:ic)?\b/i, 'Muslim'],
    [/\bjewish\b|\bjudaism\b/i, 'Jewish'],
    [/\bhindu\b/i, 'Hindu'],
    [/\bbuddhist\b/i, 'Buddhist'],
    [/\bsikh\b/i, 'Sikh'],
    [/\bjain\b/i, 'Jain'],
    [/\bshinto\b/i, 'Shinto'],
    [/\bdaoist\b|\btaoist\b/i, 'Daoist'],
    [/\bconfucian\b/i, 'Confucian'],
  ];
  const match = known.find(([pattern]) => pattern.test(value));
  if (match) return match[1];
  const leadingPhrase = value.split(/[;:.]/)[0].trim();
  return leadingPhrase.length <= 60 ? leadingPhrase : undefined;
};

const religionTradition = (label?: string): NonNullable<HistoricalPersonaAnnotationRecord['persona_seed']['religious_practice']>['tradition'] => {
  if (!label) return 'uncertain';
  if (/Catholic|Anglican|Quaker|Puritan|Orthodox|Protestant|Christian/i.test(label)) return 'christian';
  if (/Muslim|Sunni|Shia|Islam/i.test(label)) return 'islamic';
  if (/Jewish|Judaism/i.test(label)) return 'jewish';
  if (/Hindu/i.test(label)) return 'hindu';
  if (/Buddhist/i.test(label)) return 'buddhist';
  if (/Sikh/i.test(label)) return 'sikh';
  if (/Jain/i.test(label)) return 'jain';
  if (/Confucian/i.test(label)) return 'confucian_or_literati';
  if (/Daoist/i.test(label)) return 'daoist';
  if (/Shinto/i.test(label)) return 'shinto';
  return 'other';
};

const looksLikeClothing = (value: string): boolean =>
  /\b(gown|petticoat|shift|smock|apron|kerchief|cap|hat|hood|bonnet|veil|shawl|dress|shirt|blouse|coat|jacket|doublet|waistcoat|jerkin|tunic|robe|habit|cassock|sari|kimono|hanfu|kaftan|cloak|mantle|breeches|trousers|shoes|boots|sandals|stockings)\b/i.test(value);

const oldSupport = (support: PersonaOrientationProvenance['support']) => {
  if (support === 'explicit') return 'explicit' as const;
  if (support === 'inferred') return 'weak_inference' as const;
  if (support === 'synthetic') return 'synthetic_fill' as const;
  return 'contradicted_or_uncertain' as const;
};

const oldFieldPath = (path: string): string => {
  const field = path.replace(/^\/persona\//, '').split('/')[0];
  const map: Record<string, string> = {
    name_and_address: '/persona_seed/identity_name',
    age_and_life_stage: '/persona_seed/social_identity/estimated_age',
    gender_role: '/persona_seed/social_identity/gender_role',
    community_identity: '/persona_seed/social_identity/religious_or_communal_identity',
    social_status: '/persona_seed/social_position/local_status_detail',
    legal_condition: '/persona_seed/social_identity/legal_condition',
    household_and_relations: '/persona_seed/household_economy/household_composition',
    year: '/persona_seed/temporal/specific_year',
    place_context: '/persona_seed/place',
    current_pressures: '/persona_seed/place/historical_pressures',
    language_and_literacy: '/persona_seed/social_identity/languages',
    occupation: '/persona_seed/work/primary_occupation',
    labor_relation: '/persona_seed/work/labor_relation',
    skills_and_tools: '/persona_seed/work/tools_materials_techniques',
    daily_routine: '/persona_seed/work/work_notes',
    economic_position: '/persona_seed/household_economy/economic_notes',
    dwelling: '/persona_seed/material_life/dwelling_detail',
    food: '/persona_seed/material_life/foods_or_consumables',
    clothing_and_possessions: '/persona_seed/material_life/possessions',
    health_and_body: '/persona_seed/material_life/body_conditions',
    religion_and_ritual: '/persona_seed/religious_practice',
    horizons: '/persona_seed/mobility_and_horizon',
    moral_assumptions: '/persona_seed/normative_world',
    concerns_and_desires: '/persona_seed/temperament_and_voice',
    social_manner: '/persona_seed/interaction_style',
    voice: '/persona_seed/temperament_and_voice/voice_notes',
    anachronism_guards: '/persona_seed/temperament_and_voice/anachronism_guards',
  };
  return map[field] || `/persona_seed/${field}`;
};

export function applyPersonaOrientationToAnnotationRecord(
  orientation: PersonaOrientationRecord,
  base: HistoricalPersonaAnnotationRecord
): HistoricalPersonaAnnotationRecord {
  const p = orientation.persona;
  const source = orientation.sources[0];
  const age = p.age_and_life_stage.age;
  const security = economicSecurity(p.economic_position);
  const relations = p.household_and_relations || [];
  const concerns = p.concerns_and_desires?.concerns || [];
  const desires = p.concerns_and_desires?.desires || [];
  const religionLabel = conciseReligionLabel(p.religion_and_ritual || p.community_identity);
  const clothingAndPossessions = p.clothing_and_possessions || [];
  const clothing = clothingAndPossessions.filter(looksLikeClothing);
  const possessions = clothingAndPossessions.filter(value => !looksLikeClothing(value));

  const next = structuredClone(base) as HistoricalPersonaAnnotationRecord;
  next.schema_version = '1.1.0';
  next.record_id = orientation.persona_id;
  next.persona_id = orientation.persona_id;
  next.source = {
    ...next.source,
    source_id: source.source_id,
    source_basis: source.source_basis,
    title: source.title,
    citation_label: source.citation_label,
    url: source.url,
    extraction_method: source.extraction_method,
  };
  next.annotation = {
    ...next.annotation,
    annotator_type: 'model',
    overall_confidence: confidenceFor(source.source_basis),
    completion_status: 'draft',
    annotation_notes: 'Compatibility record deterministically compiled from compact Talkie persona schema 2.0.0.',
  };
  next.persona_seed.summary = `${p.name_and_address.full_name}, ${age}, is a ${p.occupation} in ${p.place_context.locality}, ${p.place_context.region}, in ${p.year}.`;
  next.persona_seed.identity_name = {
    full_name: p.name_and_address.full_name,
    name_basis: p.name_and_address.form_of_address || 'persona orientation record',
    support_level: source.source_basis === 'synthetic_composite' ? 'synthetic_fill' : 'weak_inference',
    confidence: confidenceFor(source.source_basis),
  };
  next.persona_seed.temporal = {
    period_bucket: periodBucketForYear(p.year),
    decade: Math.floor(p.year / 10) * 10,
    within_decade_position: 'unspecified',
    specific_year: p.year,
    date_basis: source.source_basis === 'synthetic_composite' ? 'synthetic_within_period' : 'inferred_from_context',
  };
  next.persona_seed.place = {
    region: p.place_context.region,
    polity: p.place_context.polity,
    settlement_or_locality: p.place_context.locality,
    residence_locale: residenceLocale(p.place_context.locale_type),
    activity_locale: 'mixed_or_itinerant',
    historical_pressures: p.current_pressures,
    place_notes: p.place_context.locale_type,
  };
  next.persona_seed.social_identity = {
    age_band: ageBand(age),
    estimated_age: age,
    gender_role: p.gender_role,
    status_group: statusGroup(p.social_status),
    status_detail: p.social_status,
    legal_condition: legalCondition(p.legal_condition),
    household_role: next.persona_seed.social_identity.household_role || 'other_dependent_kin',
    marital_status: next.persona_seed.social_identity.marital_status || 'unclear',
    religious_or_communal_identity: religionLabel || p.community_identity,
    languages: p.language_and_literacy.languages,
    literacy: literacyLevel(p.language_and_literacy.literacy),
    numeracy: 'practical',
    identity_notes: `${p.age_and_life_stage.life_stage}. ${p.legal_condition}`,
  };
  next.persona_seed.social_position = {
    economic_security: security,
    autonomy: autonomy(p.legal_condition, p.labor_relation),
    local_status_detail: p.social_status,
  };
  delete next.persona_seed.constraint_regimes;
  delete next.persona_seed.family;
  next.persona_seed.work = {
    primary_occupation: p.occupation,
    labor_relation: laborRelation(p.labor_relation),
    skill_level: p.skills_and_tools?.length ? 'skilled' : 'semi_skilled',
    workplace: 'mixed',
    work_rhythm: 'irregular',
    tools_materials_techniques: p.skills_and_tools,
    work_notes: [p.labor_relation, ...p.daily_routine].filter(Boolean).join(' '),
  };
  next.persona_seed.household_economy = {
    household_composition: relations.join('; ') || 'Household relationships are unspecified.',
    dependents: relations.join('; ') || undefined,
    property_relation: 'mixed',
    cash_position: security === 'wealthy' || security === 'elite' ? 'wealthy'
      : security === 'comfortable' ? 'comfortable'
        : security === 'modest' ? 'modest'
          : security === 'precarious' || security === 'destitute' ? 'minimal' : 'irregular',
    economic_notes: p.economic_position,
  };
  next.persona_seed.material_life = {
    dwelling_type: 'other',
    dwelling_detail: p.dwelling,
    possessions,
    clothing_level: security === 'wealthy' || security === 'elite' ? 'fine'
      : security === 'comfortable' ? 'respectable' : security === 'destitute' ? 'ragged' : 'plain_working',
    clothing_detail: clothing.join('; ') || undefined,
    food_security: security === 'wealthy' || security === 'elite' || security === 'comfortable' ? 'secure'
      : security === 'precarious' || security === 'destitute' ? 'seasonally_precarious' : 'uneven_but_adequate',
    foods_or_consumables: p.food,
    body_conditions: p.health_and_body,
    material_notes: [p.dwelling, p.food?.join('; '), clothingAndPossessions.join('; ')].filter(Boolean).join(' '),
  };
  next.persona_seed.mobility_and_horizon = {
    mobility: includes(p.horizons.mobility, /long|distant|region|travel/) ? 'regionally_mobile' : 'locally_mobile',
    political_horizon: 'mixed',
    knowledge_horizon: p.horizons.knowledge,
    religious_or_moral_world: p.moral_assumptions?.join('; '),
    mobility_notes: p.horizons.mobility,
  };
  next.persona_seed.public_world = {
    scale: 'local_community',
    detail: [p.horizons.knowledge, p.current_pressures?.join('; ')].filter(Boolean).join(' '),
  };
  next.persona_seed.religious_practice = {
    tradition: religionTradition(religionLabel),
    specific_label: religionLabel,
    practice_context: p.religion_and_ritual,
  };
  next.persona_seed.normative_world = {
    primary_frame: 'multiple',
    detail: [p.moral_assumptions?.join('; '), p.loyalties_and_obligations?.join('; '), p.self_conception].filter(Boolean).join(' '),
  };
  next.persona_seed.temperament_and_voice = {
    dominant_temperament: 'mixed',
    how_they_react_to_strangers: 'variable',
    how_they_handle_conflict: 'variable',
    speech_style: 'mixed',
    abstraction_level: 'mixed',
    self_narration_style: 'mixed',
    public_concerns: concerns,
    private_concerns: concerns,
    hopes: desires,
    small_pleasures: [],
    voice_sample: p.voice.sample,
    anachronism_guards: p.anachronism_guards,
    voice_notes: [p.voice.register, p.voice.cadence, p.voice.characteristic_vocabulary?.join(', '), p.self_conception].filter(Boolean).join(' '),
  };
  next.persona_seed.interaction_style = p.social_manner ? {
    with_authorities: 'uncertain',
    with_peers: 'uncertain',
    under_stress: 'uncertain',
    detail: `Authorities: ${p.social_manner.authorities}. Peers: ${p.social_manner.peers}. Strangers: ${p.social_manner.strangers}. Under stress: ${p.social_manner.under_stress}.`,
  } : undefined;
  next.field_evidence = orientation.provenance.map(item => ({
    field_path: oldFieldPath(item.field_path),
    support_level: oldSupport(item.support),
    confidence: item.confidence,
    snippet: item.snippet,
    notes: item.note,
  }));
  next.evidence = {
    confidence: confidenceFor(source.source_basis),
    basis_summary: source.source_basis === 'synthetic_composite'
      ? 'Compact persona orientation elaborated from a synthetic procedural seed.'
      : `Compact persona orientation grounded in ${source.citation_label}.`,
    bias_flags: source.source_basis === 'synthetic_composite'
      ? ['synthetic_composite', 'model_synthesized_gaps', 'not_documentary_evidence']
      : ['model_synthesized_gaps'],
    source_snippets: orientation.provenance.filter(item => item.snippet).slice(0, 8).map(item => ({
      snippet: item.snippet as string,
      relevance: `Supports ${oldFieldPath(item.field_path)}.`,
    })),
    inference_notes: 'Full internal record compiled from persona orientation schema 2.0.0 for compatibility with the procedural generator.',
  };
  next.export_targets = {
    compatible_with_compact_material_schema: true,
    generation_priority: 'use_as_soft_constraints',
    suggested_persona_count: 1,
  };

  return assertPersonaAnnotationRecord(next);
}

export function personaOrientationToAnnotationRecord(
  orientation: PersonaOrientationRecord,
  source: IngestedPersonaSource
): HistoricalPersonaAnnotationRecord {
  return applyPersonaOrientationToAnnotationRecord(orientation, createAnnotationRecordFromSource(source));
}

export function legacyAnnotationToPersonaOrientation(
  record: HistoricalPersonaAnnotationRecord
): PersonaOrientationRecord {
  const seed = record.persona_seed;
  const year = seed.temporal.specific_year ?? seed.temporal.decade ?? 1800;
  const name = seed.identity_name?.full_name || seed.summary || record.source.title;
  const age = seed.social_identity.estimated_age ?? 30;
  const sourceId = record.source.source_id;
  const migratedRoutine = [
    seed.work.work_notes,
    'Ordinary work follows the needs of livelihood and household.',
    'Rest, exchange, and household duties follow local custom and immediate need.',
  ].filter(Boolean).slice(0, 6) as string[];
  const migratedGuards = [
    ...(seed.temperament_and_voice.anachronism_guards || []),
    'later historical events',
    'modern political and psychological vocabulary',
  ].filter((value, index, values) => values.indexOf(value) === index).slice(0, 8);
  return assertPersonaOrientationRecord({
    schema_version: '2.0.0',
    persona_id: record.persona_id || record.record_id,
    persona: {
      name_and_address: { full_name: name },
      age_and_life_stage: { age, life_stage: seed.social_identity.age_band.replace(/_/g, ' ') },
      gender_role: seed.social_identity.gender_role,
      community_identity: seed.social_identity.religious_or_communal_identity,
      social_status: seed.social_position?.local_status_detail || seed.social_identity.status_detail || seed.social_identity.status_group,
      legal_condition: seed.social_identity.legal_condition.replace(/_/g, ' '),
      household_and_relations: seed.household_economy.household_composition ? [seed.household_economy.household_composition] : undefined,
      year,
      place_context: {
        locality: seed.place.settlement_or_locality || seed.place.region,
        region: seed.place.region,
        polity: seed.place.polity,
        locale_type: seed.place.residence_locale.replace(/_/g, ' '),
      },
      current_pressures: seed.place.historical_pressures?.slice(0, 6),
      language_and_literacy: {
        languages: seed.social_identity.languages?.length ? seed.social_identity.languages.slice(0, 4) : [record.source.language || 'unknown'],
        literacy: seed.social_identity.literacy.replace(/_/g, ' '),
      },
      occupation: seed.work.primary_occupation,
      labor_relation: seed.work.labor_relation.replace(/_/g, ' '),
      skills_and_tools: seed.work.tools_materials_techniques?.slice(0, 6),
      daily_routine: migratedRoutine,
      economic_position: seed.household_economy.economic_notes || seed.social_position?.economic_security.replace(/_/g, ' '),
      dwelling: seed.material_life.dwelling_detail || seed.material_life.dwelling_type.replace(/_/g, ' '),
      food: seed.material_life.foods_or_consumables?.slice(0, 6),
      clothing_and_possessions: [...(seed.material_life.possessions || []), seed.material_life.clothing_detail || seed.material_life.clothing_level.replace(/_/g, ' ')].filter(Boolean).slice(0, 6),
      health_and_body: seed.material_life.body_conditions?.slice(0, 6),
      religion_and_ritual: seed.religious_practice?.specific_label || seed.social_identity.religious_or_communal_identity,
      horizons: {
        knowledge: seed.mobility_and_horizon.knowledge_horizon || 'Knowledge is bounded by household, work, and local community.',
        mobility: seed.mobility_and_horizon.mobility_notes || seed.mobility_and_horizon.mobility.replace(/_/g, ' '),
      },
      moral_assumptions: seed.normative_world?.detail ? [seed.normative_world.detail] : undefined,
      self_conception: seed.temperament_and_voice.voice_notes,
      loyalties_and_obligations: seed.normative_world?.detail ? [seed.normative_world.detail] : undefined,
      concerns_and_desires: {
        concerns: [...(seed.temperament_and_voice.public_concerns || []), ...(seed.temperament_and_voice.private_concerns || [])].slice(0, 6),
        desires: seed.temperament_and_voice.hopes || [],
      },
      social_manner: {
        authorities: seed.interaction_style?.with_authorities?.replace(/_/g, ' ') || 'uncertain',
        peers: seed.interaction_style?.with_peers?.replace(/_/g, ' ') || 'uncertain',
        strangers: seed.temperament_and_voice.how_they_react_to_strangers.replace(/_/g, ' '),
        under_stress: seed.interaction_style?.under_stress?.replace(/_/g, ' ') || 'uncertain',
      },
      voice: {
        register: seed.temperament_and_voice.speech_style.replace(/_/g, ' '),
        cadence: seed.temperament_and_voice.abstraction_level.replace(/_/g, ' '),
        sample: seed.temperament_and_voice.voice_sample,
      },
      conversation_frame: {
        situation: `Speaking from ordinary life in ${seed.place.settlement_or_locality || seed.place.region} in ${year}.`,
        interlocutor_relation: 'An unfamiliar but attentive visitor.',
      },
      anachronism_guards: migratedGuards,
    } satisfies PersonaOrientationCore,
    sources: [{
      source_id: sourceId,
      source_basis: record.source.source_basis,
      title: record.source.title,
      citation_label: record.source.citation_label,
      url: record.source.url,
      extraction_method: record.source.extraction_method,
    }],
    provenance: (record.field_evidence || []).slice(0, 20).map(item => ({
      field_path: '/persona/self_conception',
      support: item.support_level === 'explicit' ? 'explicit' : item.support_level === 'synthetic_fill' ? 'synthetic' : 'inferred',
      confidence: item.confidence,
      source_id: sourceId,
      snippet: item.snippet,
      note: item.notes,
    })),
  });
}
