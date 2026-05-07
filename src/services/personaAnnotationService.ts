import { CulturalZone, Gender, HistoricalEra, WealthLevel } from '../types';
import { GenerationParams } from './personaGenerator';
import { HistoricalPersonaAnnotationRecord, IngestedPersonaSource } from '../types/personaAnnotation';
import { adaptPersonaMaterialRecord } from './personaMaterialAdapter';

const pick = <T,>(values: T[]): T => values[Math.floor(Math.random() * values.length)];

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const slug = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'source';

const periodRanges: Record<HistoricalPersonaAnnotationRecord['persona_seed']['temporal']['period_bucket'], [number, number]> = {
  '1400_1499': [1400, 1499],
  '1500_1599': [1500, 1599],
  '1600_1699': [1600, 1699],
  '1700_1749': [1700, 1749],
  '1750_1849': [1750, 1849],
  '1850_1914': [1850, 1914],
  '1915_1930': [1915, 1930],
};

const regions = [
  { region: 'British Isles', polity: 'Kingdom of England', zone: 'EUROPEAN' as CulturalZone },
  { region: 'Low Countries', polity: 'Dutch Republic', zone: 'EUROPEAN' as CulturalZone },
  { region: 'Bengal', polity: 'Mughal Empire', zone: 'SOUTH_ASIAN' as CulturalZone },
  { region: 'Lower Yangzi', polity: 'Ming or Qing China', zone: 'EAST_ASIAN' as CulturalZone },
  { region: 'Ottoman Syria', polity: 'Ottoman Empire', zone: 'MENA' as CulturalZone },
  { region: 'Gold Coast', polity: 'Akan states and Atlantic trading forts', zone: 'SUB_SAHARAN_AFRICAN' as CulturalZone },
  { region: 'New Spain', polity: 'Spanish Empire', zone: 'SOUTH_AMERICAN' as CulturalZone },
  { region: 'Saint-Domingue', polity: 'French colonial empire', zone: 'NORTH_AMERICAN_COLONIAL' as CulturalZone },
];

const occupations = [
  'weaver',
  'market seller',
  'dock laborer',
  'tenant farmer',
  'domestic servant',
  'apprentice carpenter',
  'washerwoman',
  'copyist',
  'soldier',
  'boatman',
  'midwife',
  'shopkeeper',
];

const possessionKeywords = [
  'book',
  'letter',
  'coat',
  'boots',
  'horse',
  'watch',
  'ring',
  'knife',
  'tools',
  'ledger',
  'chest',
  'blanket',
  'icon',
  'cross',
  'bread',
  'grain',
  'cart',
  'boat',
  'manuscript',
  'pen',
];

const statusByOccupation: Record<string, string> = {
  weaver: 'artisanal_or_craft',
  'market seller': 'merchant_or_commercial',
  'dock laborer': 'wage_laboring',
  'tenant farmer': 'peasant_or_smallholder',
  'domestic servant': 'domestic_service',
  'apprentice carpenter': 'artisanal_or_craft',
  washerwoman: 'wage_laboring',
  copyist: 'administrative_or_bureaucratic',
  soldier: 'military',
  boatman: 'wage_laboring',
  midwife: 'artisanal_or_craft',
  shopkeeper: 'merchant_or_commercial',
};

const periodFromYear = (year: number): HistoricalEra => {
  if (year < 1450) return 'MEDIEVAL' as HistoricalEra;
  if (year < 1750) return 'RENAISSANCE_EARLY_MODERN' as HistoricalEra;
  if (year < 1900) return 'INDUSTRIAL_ERA' as HistoricalEra;
  return 'MODERN_ERA' as HistoricalEra;
};

const wealthFromSeed = (record: HistoricalPersonaAnnotationRecord): WealthLevel => {
  const cash = record.persona_seed.household_economy.cash_position;
  const clothing = record.persona_seed.material_life.clothing_level;
  if (cash === 'wealthy' || clothing === 'luxurious') return 'wealthy' as WealthLevel;
  if (cash === 'comfortable' || clothing === 'fine') return 'comfortable' as WealthLevel;
  if (cash === 'none' || cash === 'minimal' || clothing === 'ragged') return 'poor' as WealthLevel;
  return 'modest' as WealthLevel;
};

const genderFromRole = (genderRole: string): Gender | undefined => {
  const lower = genderRole.toLowerCase();
  if (lower.includes('woman') || lower.includes('female') || lower.includes('wife') || lower.includes('widow')) return 'Female' as Gender;
  if (lower.includes('man') || lower.includes('male') || lower.includes('husband') || lower.includes('widower')) return 'Male' as Gender;
  return undefined;
};

const ageFromBand = (band: string): number => {
  const ranges: Record<string, [number, number]> = {
    child: [8, 12],
    adolescent: [13, 17],
    young_adult: [18, 29],
    adult: [30, 44],
    middle_aged: [45, 59],
    elder: [60, 76],
  };
  const range = ranges[band] || [18, 65];
  return randomInt(range[0], range[1]);
};

const extractPossessions = (lowerText: string): string[] => {
  const found = possessionKeywords.filter(keyword => lowerText.includes(keyword));
  return found.length > 0 ? found.slice(0, 6) : ['work clothes', 'cooking vessel', 'small stored keepsakes'];
};

export function generateRandomPersonaAnnotationRecord(): HistoricalPersonaAnnotationRecord {
  const period_bucket = pick(Object.keys(periodRanges) as Array<HistoricalPersonaAnnotationRecord['persona_seed']['temporal']['period_bucket']>);
  const [minYear, maxYear] = periodRanges[period_bucket];
  const specificYear = randomInt(minYear, maxYear);
  const decade = Math.floor(specificYear / 10) * 10;
  const place = pick(regions);
  const primaryOccupation = pick(occupations);
  const genderRole = pick(['adult man', 'adult woman', 'widow', 'married woman', 'household man', 'young unmarried man']);
  const ageBand = pick(['young_adult', 'adult', 'middle_aged', 'elder']);
  const recordId = `synthetic-${specificYear}-${slug(place.region)}-${slug(primaryOccupation)}-${randomInt(1000, 9999)}`;

  return {
    schema_version: '1.1.0',
    record_id: recordId,
    source: {
      source_id: `${recordId}-source`,
      source_basis: 'synthetic_composite',
      title: `Synthetic ${specificYear} ${place.region} ${primaryOccupation} seed`,
      citation_label: `Synthetic composite, ${place.region}, ${specificYear}`,
      source_date: String(specificYear),
      language: 'English',
      translation_status: 'original_language',
      document_genre: 'synthetic composite',
      extraction_method: 'llm_extraction',
      source_reliability_notes: 'Randomly generated local seed for testing the annotation schema workflow.',
    },
    annotation: {
      annotator_type: 'model',
      created_at: new Date().toISOString(),
      overall_confidence: 'speculative',
      completion_status: 'draft',
      annotation_notes: 'Generated locally without a real source; use for interface testing only.',
    },
    persona_seed: {
      summary: `A plausible ${primaryOccupation} in ${place.region} around ${specificYear}, generated as a schema-shaped seed for testing.`,
      temporal: {
        period_bucket,
        decade,
        within_decade_position: pick(['early', 'mid', 'late']),
        specific_year: specificYear,
        date_basis: 'synthetic_within_period',
      },
      place: {
        region: place.region,
        polity: place.polity,
        residence_locale: pick(['village', 'market_town', 'urban_neighborhood', 'port_town', 'port_city', 'estate_or_manor']),
        activity_locale: pick(['household_compound', 'fields_or_pasture', 'workshop_or_small_shop', 'market_or_bazaar', 'dock_or_waterside', 'office_or_countinghouse']),
        historical_pressures: [pick(['market_integration', 'war_or_militarization', 'state_expansion', 'economic_crisis', 'religious_conflict'])],
      },
      social_identity: {
        age_band: ageBand,
        estimated_age: ageFromBand(ageBand),
        gender_role: genderRole,
        status_group: statusByOccupation[primaryOccupation] || 'mixed_or_unclear',
        status_detail: primaryOccupation,
        legal_condition: pick(['free', 'subject_without_full_rights', 'dependent_without_clear_status']),
        household_role: pick(['household_head', 'spouse', 'servant', 'apprentice', 'lodger_or_boarder']),
        marital_status: pick(['single', 'married', 'widowed', 'uncertain']),
        children_status: pick(['none', 'young_children', 'older_children', 'mixed', 'unknown']),
        literacy: pick(['nonliterate', 'name_or_signature_only', 'basic_practical', 'full_practical']),
        numeracy: pick(['none', 'basic', 'practical', 'commercial']),
        languages: ['local vernacular'],
      },
      social_position: {
        economic_security: pick(['precarious', 'subsistence', 'modest', 'comfortable']),
        autonomy: primaryOccupation === 'domestic servant'
          ? 'household_dependent'
          : primaryOccupation === 'tenant farmer'
            ? 'tenant_sharecropper_or_rent_bound'
            : primaryOccupation.includes('laborer')
              ? 'wage_dependent'
              : 'uncertain',
        local_status_detail: primaryOccupation,
      },
      constraint_regimes: [
        {
          type: primaryOccupation === 'tenant farmer' ? 'debt_rent_or_tax' : primaryOccupation === 'domestic servant' ? 'household_authority' : 'other',
          detail: `Daily life is constrained by ${primaryOccupation} work, household obligations, and local authority.`,
          support_level: 'synthetic_fill',
          confidence: 'speculative',
        },
      ],
      work: {
        primary_occupation: primaryOccupation,
        secondary_occupations: pick([[], ['seasonal labor'], ['petty trade'], ['household production']]),
        labor_relation: pick(['wage_labor', 'self_employed', 'tenant_labor', 'unpaid_family_labor', 'guild_or_corporate_craft', 'mixed']),
        skill_level: pick(['semi_skilled', 'skilled', 'clerical', 'unskilled']),
        workplace: pick(['household', 'field', 'workshop', 'shop', 'street', 'dock', 'office', 'mixed']),
        work_rhythm: pick(['seasonal', 'daily_wage', 'task_based', 'market_regulated', 'irregular']),
        tools_materials_techniques: ['hand tools', 'local measures', 'reused materials'],
      },
      household_economy: {
        household_composition: pick(['small nuclear household', 'multi-generational household', 'shared lodging', 'service household']),
        income_sources: [primaryOccupation, pick(['seasonal work', 'petty sale', 'kin support', 'garden produce'])],
        property_relation: pick(['landless', 'tenant', 'renter', 'owner', 'tied_housing', 'mixed']),
        cash_position: pick(['minimal', 'irregular', 'modest', 'comfortable']),
      },
      material_life: {
        dwelling_type: pick(['cottage', 'farmhouse', 'rented_room', 'courtyard_house', 'rowhouse', 'ship_quarters']),
        possessions: ['work clothes', 'cooking pot', pick(['knife', 'ledger scrap', 'wooden chest', 'wool blanket'])],
        clothing_level: pick(['plain_working', 'decent', 'respectable', 'ragged']),
        food_security: pick(['seasonally_precarious', 'uneven_but_adequate', 'adequate']),
        body_conditions: [pick(['fatigue', 'chronic_pain', 'occupational_injury', 'none_apparent'])],
      },
      mobility_and_horizon: {
        mobility: pick(['sedentary', 'locally_mobile', 'seasonally_mobile', 'regionally_mobile']),
        political_horizon: pick(['household_local', 'village_or_community', 'dynastic_or_monarchical', 'confessional', 'imperial', 'mixed']),
        knowledge_horizon: 'Mostly local knowledge, with wider events understood through markets, sermons, officials, travelers, or employers.',
        religious_or_moral_world: 'Moral expectations are framed through household duty, reputation, customary obligation, and local religious practice.',
      },
      public_world: {
        scale: pick(['household', 'local_community', 'occupational_network', 'market_or_trade_network', 'state_or_legal_authority']),
        detail: 'Public life is framed by household, work, local institutions, and market or official encounters.',
      },
      religious_practice: {
        tradition: 'uncertain',
        practice_context: 'Religious or ritual practice is not directly evidenced in this synthetic seed.',
      },
      normative_world: {
        primary_frame: pick(['household_obligation', 'honor_reputation_or_shame', 'reciprocity_patronage_or_debt', 'pragmatic_survival']),
        detail: 'Norms are inferred through household duty, reputation, practical survival, and local expectations.',
      },
      temperament_and_voice: {
        dominant_temperament: pick(['patient', 'anxious', 'dutiful', 'suspicious', 'hopeful', 'guarded', 'mixed']),
        how_they_react_to_strangers: pick(['cautious', 'deferential', 'curious', 'strategic', 'variable']),
        how_they_handle_conflict: pick(['avoidant', 'stubborn', 'conciliatory', 'appeals_to_authority', 'variable']),
        speech_style: pick(['terse', 'concrete', 'deferential', 'earthy', 'direct', 'mixed']),
        abstraction_level: pick(['very_concrete', 'mostly_concrete', 'mixed']),
        self_narration_style: pick(['relational', 'duty_focused', 'fatalistic', 'practical', 'mixed']),
        public_concerns: ['prices', 'local authority', 'work availability'],
        private_concerns: ['household security', 'health', 'reputation'],
        hopes: ['steady work', 'enough food', 'protection for kin'],
        small_pleasures: ['warm food', 'market talk', 'a quiet evening'],
        anachronism_guards: ['Do not use modern rights language unless the period and source support it.', 'Keep geographic knowledge bounded by local experience.'],
      },
      interaction_style: {
        with_authorities: pick(['deferential', 'strategic', 'avoidant', 'uncertain']),
        with_peers: pick(['guarded', 'cooperative', 'gregarious', 'uncertain']),
        under_stress: pick(['enduring', 'pragmatic', 'withdrawn', 'uncertain']),
        detail: 'Interaction style is a model-facing behavioral estimate, not a directly evidenced psychological fact.',
      },
    },
    evidence: {
      confidence: 'speculative',
      basis_summary: 'A synthetic composite generated from broad historical categories, not a real document.',
      bias_flags: ['model_synthesized_gaps'],
      synthetic_gap_notes: 'All details are synthetic and intended to exercise the schema pipeline.',
    },
    export_targets: {
      compatible_with_compact_material_schema: true,
      generation_priority: 'use_as_soft_constraints',
      suggested_persona_count: 1,
    },
  };
}

export function createAnnotationRecordFromSource(source: IngestedPersonaSource): HistoricalPersonaAnnotationRecord {
  const text = source.text;
  const yearMatch = text.match(/\b(14\d{2}|15\d{2}|16\d{2}|17\d{2}|18\d{2}|19[012]\d|1930)\b/);
  const year = yearMatch ? Number(yearMatch[1]) : randomInt(1750, 1849);
  const decade = Math.floor(year / 10) * 10;
  const period_bucket = (Object.entries(periodRanges).find(([, [min, max]]) => year >= min && year <= max)?.[0] || '1750_1849') as HistoricalPersonaAnnotationRecord['persona_seed']['temporal']['period_bucket'];
  const lower = text.toLowerCase();
  const occupation = occupations.find(job => lower.includes(job)) || pick(occupations);
  const place = regions.find(candidate => lower.includes(candidate.region.toLowerCase()) || lower.includes(candidate.polity.toLowerCase())) || pick(regions);
  const isFemale = /\b(woman|wife|widow|mother|daughter|female|girl|she|her)\b/i.test(text);
  const genderRole = isFemale ? pick(['adult woman', 'widow', 'married woman']) : pick(['adult man', 'household man', 'young unmarried man']);
  const recordId = `source-${slug(source.title)}-${Date.now()}`;
  const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 420);

  return {
    ...generateRandomPersonaAnnotationRecord(),
    record_id: recordId,
    source: {
      source_id: `${recordId}-source`,
      source_basis: source.sourceBasis,
      title: source.title,
      citation_label: source.citationLabel,
      url: source.url,
      source_date: yearMatch?.[0],
      language: 'unknown',
      translation_status: 'unknown',
      document_genre: source.sourceBasis === 'wikipedia_or_reference' ? 'reference article' : 'submitted text',
      extraction_method: source.extractionMethod,
      source_reliability_notes: source.reliabilityNotes,
    },
    annotation: {
      annotator_type: 'model',
      created_at: new Date().toISOString(),
      overall_confidence: yearMatch ? 'medium' : 'low',
      completion_status: 'needs_review',
      annotation_notes: 'Automatically populated from source text using local heuristics. Human review recommended.',
    },
    persona_seed: {
      ...generateRandomPersonaAnnotationRecord().persona_seed,
      summary: `A plausible ${occupation} connected to "${source.title}", using extracted dates, places, and context where available.`,
      temporal: {
        period_bucket,
        decade,
        within_decade_position: 'unspecified',
        specific_year: year,
        date_basis: yearMatch ? 'explicit_source_date' : 'inferred_from_context',
      },
      place: {
        region: place.region,
        polity: place.polity,
        residence_locale: lower.includes('city') ? 'urban_neighborhood' : lower.includes('port') ? 'port_city' : 'market_town',
        activity_locale: lower.includes('ship') ? 'ship_or_boat' : lower.includes('court') ? 'court_or_law_site' : lower.includes('market') ? 'market_or_bazaar' : 'mixed_or_itinerant',
        historical_pressures: [
          lower.includes('war') ? 'war_or_militarization' : lower.includes('slave') || lower.includes('enslaved') ? 'slavery_or_forced_labor' : lower.includes('disease') || lower.includes('plague') ? 'epidemic_disease' : 'market_integration',
        ],
        place_notes: 'Place was detected heuristically or filled from regional defaults.',
      },
      social_identity: {
        age_band: pick(['young_adult', 'adult', 'middle_aged']),
        estimated_age: randomInt(19, 55),
        gender_role: genderRole,
        status_group: statusByOccupation[occupation] || 'mixed_or_unclear',
        status_detail: occupation,
        legal_condition: lower.includes('enslaved') || lower.includes('slave') ? 'enslaved' : 'free',
        household_role: isFemale && lower.includes('widow') ? 'widow_or_widower' : pick(['household_head', 'spouse', 'servant', 'lodger_or_boarder']),
        marital_status: isFemale && lower.includes('widow') ? 'widowed' : pick(['single', 'married', 'uncertain']),
        children_status: lower.includes('child') || lower.includes('children') ? 'mixed' : 'unknown',
        literacy: lower.includes('letter') || lower.includes('signed') || lower.includes('wrote') ? 'basic_practical' : 'nonliterate',
        numeracy: lower.includes('account') || lower.includes('tax') || lower.includes('inventory') ? 'practical' : 'basic',
        languages: ['local vernacular'],
      },
      social_position: {
        economic_security: lower.includes('wealth') || lower.includes('estate') ? 'comfortable' : lower.includes('poor') || lower.includes('hunger') ? 'precarious' : 'modest',
        autonomy: lower.includes('enslaved') || lower.includes('slave')
          ? 'enslaved_or_owned'
          : lower.includes('tenant')
            ? 'tenant_sharecropper_or_rent_bound'
            : lower.includes('wage')
              ? 'wage_dependent'
              : 'uncertain',
        local_status_detail: occupation,
      },
      constraint_regimes: [
        ...(lower.includes('enslaved') || lower.includes('slave') ? [{
          type: 'enslavement' as const,
          detail: 'The source text indicates enslavement or slavery as a direct constraint.',
          support_level: 'strong_inference' as const,
          confidence: 'medium' as const,
        }] : []),
        ...(lower.includes('tenant') || lower.includes('rent') ? [{
          type: 'debt_rent_or_tax' as const,
          detail: 'Tenant, rent, or property obligations are inferred from source vocabulary.',
          support_level: 'weak_inference' as const,
          confidence: 'low' as const,
        }] : []),
      ],
      work: {
        primary_occupation: occupation,
        secondary_occupations: [],
        labor_relation: lower.includes('wage') ? 'wage_labor' : lower.includes('tenant') ? 'tenant_labor' : lower.includes('enslaved') ? 'enslaved_labor' : 'mixed',
        skill_level: pick(['semi_skilled', 'skilled', 'unskilled']),
        workplace: lower.includes('ship') ? 'ship' : lower.includes('field') ? 'field' : lower.includes('shop') ? 'shop' : 'mixed',
        work_rhythm: pick(['seasonal', 'task_based', 'market_regulated', 'irregular']),
        tools_materials_techniques: [],
        work_notes: 'Occupation is inferred from source vocabulary when possible.',
      },
      household_economy: {
        household_composition: 'unclear household, completed as plausible context',
        income_sources: [occupation],
        property_relation: lower.includes('rent') ? 'renter' : lower.includes('tenant') ? 'tenant' : 'mixed',
        cash_position: lower.includes('wealth') || lower.includes('estate') ? 'comfortable' : 'irregular',
      },
      material_life: {
        dwelling_type: lower.includes('ship') ? 'ship_quarters' : lower.includes('room') ? 'rented_room' : 'other',
        possessions: extractPossessions(lower),
        clothing_level: pick(['plain_working', 'decent', 'respectable']),
        food_security: lower.includes('famine') || lower.includes('hunger') ? 'chronically_precarious' : 'uneven_but_adequate',
        body_conditions: lower.includes('disease') || lower.includes('sick') ? ['infectious_disease'] : ['none_apparent'],
      },
      mobility_and_horizon: {
        mobility: lower.includes('ship') || lower.includes('voyage') ? 'maritime_mobile' : lower.includes('travel') ? 'regionally_mobile' : 'locally_mobile',
        political_horizon: lower.includes('empire') || lower.includes('colon') ? 'imperial' : lower.includes('king') || lower.includes('queen') ? 'dynastic_or_monarchical' : 'household_local',
        knowledge_horizon: 'Bounded by the source setting, local institutions, work, kin, and public events mentioned in the document.',
        religious_or_moral_world: 'Filled conservatively from local custom and source context.',
      },
      public_world: {
        scale: lower.includes('empire') || lower.includes('colon')
          ? 'imperial_or_colonial_system'
          : lower.includes('ship') || lower.includes('voyage')
            ? 'maritime_or_long_distance_network'
            : lower.includes('court') || lower.includes('law')
              ? 'state_or_legal_authority'
              : 'local_community',
        detail: 'Filled from source keywords and broad context; human review recommended.',
      },
      religious_practice: {
        tradition: lower.includes('catholic') || lower.includes('protestant') || lower.includes('christian')
          ? 'christian'
          : lower.includes('muslim') || lower.includes('islam')
            ? 'islamic'
            : lower.includes('hindu')
              ? 'hindu'
              : lower.includes('buddhist')
                ? 'buddhist'
                : 'uncertain',
        specific_label: lower.includes('catholic') ? 'Catholic' : lower.includes('protestant') ? 'Protestant' : undefined,
        practice_context: 'Heuristic religious practice field; use source evidence or model review for specificity.',
      },
      normative_world: {
        primary_frame: lower.includes('honor') || lower.includes('shame')
          ? 'honor_reputation_or_shame'
          : lower.includes('debt') || lower.includes('rent')
            ? 'reciprocity_patronage_or_debt'
            : lower.includes('law') || lower.includes('court')
              ? 'law_custom_or_official_order'
              : 'household_obligation',
        detail: 'Normative world is inferred conservatively from source vocabulary and social context.',
      },
      temperament_and_voice: {
        dominant_temperament: pick(['anxious', 'dutiful', 'guarded', 'hopeful', 'mixed']),
        how_they_react_to_strangers: pick(['cautious', 'deferential', 'curious', 'strategic']),
        how_they_handle_conflict: pick(['avoidant', 'stubborn', 'conciliatory', 'appeals_to_authority']),
        speech_style: pick(['concrete', 'deferential', 'direct', 'mixed']),
        abstraction_level: pick(['very_concrete', 'mostly_concrete', 'mixed']),
        self_narration_style: pick(['relational', 'duty_focused', 'practical', 'mixed']),
        public_concerns: ['events and institutions named in the source'],
        private_concerns: ['work', 'household security', 'reputation'],
        hopes: ['stability', 'enough income', 'protection for kin'],
        small_pleasures: ['familiar food', 'local talk', 'rest after work'],
        anachronism_guards: ['Use only concepts available in the source period.', 'Do not make the persona omniscient about later historical outcomes.'],
      },
      interaction_style: {
        with_authorities: lower.includes('court') || lower.includes('law') ? 'strategic' : 'deferential',
        with_peers: 'guarded',
        under_stress: lower.includes('war') || lower.includes('disease') || lower.includes('hunger') ? 'enduring' : 'pragmatic',
        detail: 'Behavioral style is inferred for persona behavior and should not be treated as direct evidence.',
      },
    },
    field_evidence: [
      {
        field_path: '/persona_seed/temporal/specific_year',
        support_level: yearMatch ? 'explicit' : 'weak_inference',
        confidence: yearMatch ? 'medium' : 'low',
        snippet: yearMatch?.[0],
      },
      {
        field_path: '/persona_seed/place/region',
        support_level: 'weak_inference',
        confidence: 'low',
        notes: 'Detected from source text when possible, otherwise defaulted.',
      },
    ],
    evidence: {
      confidence: yearMatch ? 'medium' : 'low',
      basis_summary: `Generated from ${source.extractionMethod.replace(/_/g, ' ')} text. Explicit extraction is limited to obvious dates, places, and keywords.`,
      bias_flags: ['model_synthesized_gaps', source.extractionMethod === 'ocr' ? 'ocr_uncertain' : 'ordinary_people_indirectly_observed'],
      source_snippets: snippet ? [{ snippet, relevance: 'Opening source text used for heuristic context.' }] : [],
      inference_notes: 'This first-pass ingestion uses local heuristics. A Gemini extraction pass should replace or review these fields.',
      synthetic_gap_notes: 'Household, temperament, material life, and voice fields are mostly plausible completions.',
    },
  };
}

export function annotationRecordToGenerationParams(
  record: HistoricalPersonaAnnotationRecord,
  options: { useSourceTitleAsName?: boolean } = {}
): Partial<GenerationParams> {
  return adaptPersonaMaterialRecord(record, options).generationParams;
}

export function annotationRecordToJsonl(record: HistoricalPersonaAnnotationRecord): string {
  return JSON.stringify(record);
}
