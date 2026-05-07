export type Confidence = 'high' | 'medium' | 'low' | 'speculative';

export interface HistoricalPersonaAnnotationRecord {
  schema_version: '1.0.0' | '1.1.0';
  record_id: string;
  persona_id?: string;
  source: {
    source_id: string;
    source_basis:
      | 'will_or_inventory'
      | 'tax_or_census'
      | 'parish_or_temple_register'
      | 'court_testimony'
      | 'wage_data'
      | 'social_history'
      | 'material_culture'
      | 'oral_history'
      | 'diary_or_letter'
      | 'newspaper_or_periodical'
      | 'travel_account'
      | 'ship_log_or_manifest'
      | 'legal_code_or_regulation'
      | 'map_or_gazetteer'
      | 'image_or_artifact'
      | 'wikipedia_or_reference'
      | 'secondary_synthesis'
      | 'synthetic_composite'
      | 'other';
    title: string;
    citation_label: string;
    url?: string;
    filename?: string;
    creator_or_author?: string;
    source_date?: string;
    language?: string;
    translation_status?: 'original_language' | 'human_translation' | 'machine_translation' | 'mixed_or_unclear' | 'unknown';
    repository_or_collection?: string;
    document_genre?: string;
    extraction_method?: 'manual_transcription' | 'paste' | 'wikipedia_api' | 'html_readability' | 'ocr' | 'pdf_text_layer' | 'llm_extraction' | 'mixed' | 'unknown';
    source_reliability_notes?: string;
  };
  annotation: {
    annotator_id?: string;
    annotator_type: 'human' | 'model' | 'human_reviewed_model' | 'imported' | 'unknown';
    created_at: string;
    reviewed_at?: string;
    overall_confidence: Confidence;
    completion_status?: 'draft' | 'needs_review' | 'reviewed' | 'approved' | 'rejected';
    annotation_notes?: string;
  };
  persona_seed: {
    summary?: string;
    identity_name?: {
      given_name?: string;
      family_name?: string;
      full_name?: string;
      name_basis?: string;
      support_level?: 'explicit' | 'strong_inference' | 'weak_inference' | 'synthetic_fill' | 'contradicted_or_uncertain';
      confidence?: Confidence;
    };
    temporal: {
      period_bucket: '1400_1499' | '1500_1599' | '1600_1699' | '1700_1749' | '1750_1849' | '1850_1914' | '1915_1930';
      decade?: number;
      within_decade_position: 'early' | 'mid' | 'late' | 'unspecified';
      specific_year?: number;
      date_basis?: 'explicit_source_date' | 'inferred_from_event' | 'inferred_from_lifespan' | 'inferred_from_context' | 'synthetic_within_period' | 'unclear';
      temporal_notes?: string;
    };
    place: {
      region: string;
      polity?: string;
      settlement_or_locality?: string;
      residence_locale: string;
      activity_locale: string;
      environment?: string[];
      historical_pressures?: string[];
      place_notes?: string;
    };
    social_identity: {
      age_band: string;
      estimated_age?: number;
      gender_role: string;
      status_group: string;
      status_detail?: string;
      legal_condition: string;
      household_role: string;
      marital_status: string;
      children_status?: string;
      religious_or_communal_identity?: string;
      languages?: string[];
      literacy: string;
      numeracy: string;
      identity_notes?: string;
    };
    social_position?: {
      economic_security: 'destitute' | 'precarious' | 'subsistence' | 'modest' | 'comfortable' | 'wealthy' | 'elite' | 'uncertain';
      autonomy:
        | 'high_autonomy'
        | 'household_dependent'
        | 'client_retainer_or_dependent'
        | 'tenant_sharecropper_or_rent_bound'
        | 'wage_dependent'
        | 'apprenticed_indentured_or_bound'
        | 'enslaved_or_owned'
        | 'incarcerated_confined_or_institutionalized'
        | 'uncertain';
      local_status_detail?: string;
    };
    constraint_regimes?: Array<{
      type:
        | 'household_authority'
        | 'gendered_law_or_custom'
        | 'age_or_life_stage'
        | 'debt_rent_or_tax'
        | 'labor_coercion'
        | 'enslavement'
        | 'caste_descent_or_status_order'
        | 'racial_or_colonial_law'
        | 'religious_minority_restriction'
        | 'migration_pass_or_residency_control'
        | 'war_occupation_or_displacement'
        | 'health_disability_or_body_constraint'
        | 'other';
      detail: string;
      support_level: 'explicit' | 'strong_inference' | 'weak_inference' | 'synthetic_fill' | 'contradicted_or_uncertain';
      confidence: Confidence;
    }>;
    family?: {
      members?: Array<{
        relation: 'father' | 'mother' | 'spouse' | 'son' | 'daughter' | 'sibling' | 'brother' | 'sister';
        name: string;
        profession?: string;
        birth_year?: number;
        death_year?: number;
        is_deceased?: boolean;
        support_level: 'explicit' | 'strong_inference' | 'weak_inference' | 'synthetic_fill' | 'contradicted_or_uncertain';
        confidence: Confidence;
        notes?: string;
      }>;
      family_notes?: string;
    };
    work: {
      primary_occupation: string;
      secondary_occupations?: string[];
      labor_relation: string;
      skill_level: string;
      workplace: string;
      work_rhythm: string;
      tools_materials_techniques?: string[];
      work_notes?: string;
    };
    household_economy: {
      household_composition: string;
      children_status?: string;
      dependents?: string;
      income_sources?: string[];
      debts_dues_taxes_or_rents?: string[];
      property_relation: string;
      cash_position: string;
      economic_notes?: string;
    };
    material_life: {
      dwelling_type: string;
      dwelling_detail?: string;
      possessions?: string[];
      clothing_level: string;
      clothing_detail?: string;
      food_security: string;
      foods_or_consumables?: string[];
      body_conditions?: string[];
      material_notes?: string;
    };
    mobility_and_horizon: {
      mobility: string;
      political_horizon: string;
      knowledge_horizon?: string;
      religious_or_moral_world?: string;
      mobility_notes?: string;
    };
    public_world?: {
      scale:
        | 'household'
        | 'kin_or_lineage'
        | 'local_community'
        | 'occupational_network'
        | 'market_or_trade_network'
        | 'ritual_or_scholarly_network'
        | 'cultural_or_reform_network'
        | 'patronage_or_clientage'
        | 'state_or_legal_authority'
        | 'military_or_frontier'
        | 'maritime_or_long_distance_network'
        | 'imperial_or_colonial_system'
        | 'diaspora_or_migrant_network'
        | 'multiple'
        | 'uncertain';
      detail?: string;
    };
    religious_practice?: {
      tradition:
        | 'christian'
        | 'islamic'
        | 'jewish'
        | 'hindu'
        | 'buddhist'
        | 'sikh'
        | 'jain'
        | 'confucian_or_literati'
        | 'daoist'
        | 'shinto'
        | 'indigenous_or_local_ritual'
        | 'african_diasporic'
        | 'spirit_mediumship_or_shamanic'
        | 'ancestor_veneration'
        | 'syncretic_or_plural'
        | 'secular_freethinking_or_skeptical'
        | 'public_conformity_unclear_private_belief'
        | 'none_apparent'
        | 'uncertain'
        | 'other';
      specific_label?: string;
      practice_context?: string;
    };
    normative_world?: {
      primary_frame:
        | 'household_obligation'
        | 'kinship_or_lineage_duty'
        | 'honor_reputation_or_shame'
        | 'reciprocity_patronage_or_debt'
        | 'law_custom_or_official_order'
        | 'ritual_purity_or_pollution'
        | 'salvation_sin_or_moral_discipline'
        | 'karma_fate_or_cosmic_order'
        | 'ancestral_spirit_or_land_obligation'
        | 'communal_survival_or_mutual_aid'
        | 'commercial_credit_or_reputation'
        | 'scholarly_cultivation_or_learning'
        | 'reform_revolt_or_deliverance'
        | 'pragmatic_survival'
        | 'multiple'
        | 'uncertain';
      detail?: string;
    };
    temperament_and_voice: {
      dominant_temperament: string;
      how_they_react_to_strangers: string;
      how_they_handle_conflict: string;
      speech_style: string;
      abstraction_level: string;
      self_narration_style: string;
      public_concerns?: string[];
      private_concerns?: string[];
      hopes?: string[];
      small_pleasures?: string[];
      voice_sample?: string;
      personality_traits?: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
        notes?: string;
      };
      anachronism_guards?: string[];
      voice_notes?: string;
    };
    interaction_style?: {
      with_authorities?: 'deferential' | 'strategic' | 'avoidant' | 'assertive' | 'defiant' | 'uncertain';
      with_peers?: 'guarded' | 'cooperative' | 'competitive' | 'gregarious' | 'isolated' | 'uncertain';
      under_stress?: 'enduring' | 'withdrawn' | 'angry' | 'pragmatic' | 'ritualized_or_prayerful' | 'uncertain';
      detail?: string;
    };
  };
  field_evidence?: Array<{
    field_path: string;
    support_level: 'explicit' | 'strong_inference' | 'weak_inference' | 'synthetic_fill' | 'contradicted_or_uncertain';
    confidence: Confidence;
    snippet?: string;
    location?: string;
    notes?: string;
  }>;
  evidence: {
    confidence: Confidence;
    basis_summary: string;
    bias_flags: string[];
    source_snippets?: Array<{
      snippet: string;
      relevance: string;
      location?: string;
    }>;
    inference_notes?: string;
    synthetic_gap_notes?: string;
  };
  export_targets?: {
    compatible_with_compact_material_schema?: boolean;
    generation_priority?: 'use_as_strong_constraints' | 'use_as_soft_constraints' | 'use_as_inspiration_only';
    suggested_persona_count?: number;
  };
}

export interface IngestedPersonaSource {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
  imageAttribution?: string;
  sourceBasis: HistoricalPersonaAnnotationRecord['source']['source_basis'];
  extractionMethod: NonNullable<HistoricalPersonaAnnotationRecord['source']['extraction_method']>;
  citationLabel: string;
  reliabilityNotes?: string;
}
