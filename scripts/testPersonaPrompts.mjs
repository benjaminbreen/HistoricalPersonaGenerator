import assert from 'node:assert/strict';
import {
  buildSketchDossier,
  buildSketchPrompt,
  formatHistoricalYear,
} from '../api/_lib/personaPrompts.js';

const record = {
  source: {
    source_basis: 'synthetic_composite',
    title: 'Procedural seed: Tan, Delhi Region, -2650',
  },
  annotation: {
    annotator_id: 'must-not-reach-prose',
    created_at: '2026-08-04T00:00:00.000Z',
  },
  persona_seed: {
    identity_name: { full_name: 'Tan' },
    temporal: { specific_year: -2650 },
    place: {
      region: 'Delhi Region',
      polity: 'early settlement authority',
      residence_locale: 'rural_settlement',
      environment: ['riverine', 'agrarian_lowland'],
      historical_pressures: ['environmental_stress', 'market_integration'],
    },
    social_identity: {
      estimated_age: 32,
      gender_role: 'man',
      status_group: 'free_commoner',
      legal_condition: 'free',
      household_role: 'spouse',
    },
    social_position: {
      economic_security: 'subsistence',
      autonomy: 'household_dependent',
    },
    constraint_regimes: [
      { detail: 'service obligations bind his labor to a household' },
    ],
    work: {
      primary_occupation: 'brick maker',
      work_rhythm: 'seasonal_and_task_based',
      tools_materials_techniques: ['clay', 'wooden mould', 'kiln'],
      work_notes: 'He shapes bricks by hand and tends their firing.',
    },
    household_economy: {
      household_composition: 'Tan and his wife',
      income_sources: ['brick sales'],
      property_relation: 'limited_household_property',
      cash_position: 'uneven',
    },
    material_life: {
      dwelling_type: 'simple_earth_dwelling',
      possessions: ['cooking vessel', 'woven basket'],
      clothing_level: 'plain_working',
      foods_or_consumables: ['grain'],
      food_security: 'seasonally_adequate',
      body_conditions: ['exposure_to_cold_or_heat', 'fatigue'],
    },
    mobility_and_horizon: {
      mobility: 'local',
      knowledge_horizon: 'household, nearby fields, kilns, roads, and market sellers',
    },
    normative_world: {
      primary_frame: 'household_obligation',
    },
    temperament_and_voice: {
      dominant_temperament: 'dutiful',
      speech_style: 'concrete_and_direct',
      personality_traits: {
        openness: 0.2,
        conscientiousness: 0.8,
        extraversion: 0.2,
        agreeableness: 0.6,
        neuroticism: 0.4,
        notes: 'must-not-reach-prose',
      },
      public_concerns: ['steady orders'],
      private_concerns: ['protecting his wife from a failed firing'],
      hopes: ['enough grain after a bad batch'],
      small_pleasures: ['cool air after labor'],
      anachronism_guards: ['modern nation-states', 'industrial machinery'],
    },
  },
  field_evidence: Array.from({ length: 80 }, (_, index) => ({
    field_path: `/oversized/${index}`,
    notes: `must-not-reach-prose-${index}-${'x'.repeat(200)}`,
  })),
  evidence: {
    confidence: 'speculative',
    basis_summary: 'must-not-reach-prose',
  },
};

assert.equal(formatHistoricalYear(-2650), '2650 BCE');
assert.equal(formatHistoricalYear(1780), '1780');

const dossier = buildSketchDossier(record);
const prompt = buildSketchPrompt(record);

assert.match(dossier, /Person: Tan; 32 years old; man; 2650 BCE/);
assert.match(dossier, /Work: brick maker/);
assert.match(dossier, /Material life:/);
assert.doesNotMatch(dossier, /personality traits|must-not-reach-prose|field path/i);
assert.doesNotMatch(prompt, /-2650/);
assert.doesNotMatch(prompt, /most under fourteen|Big Five|annotator_id/);
assert.match(prompt, /at least three concrete details/i);
assert.match(prompt, /160-210 words/);
assert.ok(prompt.length < 3600, `compact sketch prompt grew to ${prompt.length} characters`);

const sourcedRecord = structuredClone(record);
sourcedRecord.source = {
  source_basis: 'historical_document',
  title: 'A short probate inventory',
  document_genre: 'probate inventory',
};
sourcedRecord.evidence = {
  basis_summary: 'Household goods recorded by a court clerk.',
  source_snippets: [
    { snippet: 'one iron pot and two wool blankets' },
    { snippet: 'three shillings owing for rent' },
    { snippet: 'must-not-reach-prose-third-snippet' },
  ],
};
const sourcedDossier = buildSketchDossier(sourcedRecord);
const sourcedPrompt = buildSketchPrompt(sourcedRecord);

assert.match(sourcedDossier, /Source: A short probate inventory/);
assert.match(sourcedDossier, /one iron pot and two wool blankets/);
assert.match(sourcedDossier, /three shillings owing for rent/);
assert.doesNotMatch(sourcedDossier, /third-snippet/);
assert.match(sourcedPrompt, /Treat source facts as fixed/);
assert.doesNotMatch(sourcedPrompt, /synthetic seed/i);

console.log(`Persona prompt tests passed (${prompt.length} characters).`);
