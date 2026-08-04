import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertPersonaAnnotationRecord,
  normalizePersonaAnnotationRecord,
} from '../src/services/personaMaterialValidationService';
import { generateRandomPersonaAnnotationRecord } from '../src/services/personaAnnotationService';
import {
  createPersonaOrientationRecord,
  personaOrientationToAnnotationRecord,
  validatePersonaOrientationRecord,
} from '../src/services/personaOrientationService';

const normalized = normalizePersonaAnnotationRecord({
  schema_version: '1.1.0',
  invented_root_property: 'drop me',
  source: { url: '' },
  annotation: { reviewed_at: '' },
  persona_seed: {
    social_position: { economic_security: 'seasonally_precarious' },
    constraint_regimes: [{ type: 'environmental_stress' }],
    household_economy: { property_relation: 'uncertain' },
    temperament_and_voice: { dominant_temperament: 'pragmatic' },
  },
}) as any;

assert.equal(normalized.persona_seed.social_position.economic_security, 'precarious');
assert.equal(normalized.persona_seed.constraint_regimes[0].type, 'other');
assert.equal(normalized.persona_seed.household_economy.property_relation, 'mixed');
assert.equal(normalized.persona_seed.temperament_and_voice.dominant_temperament, 'mixed');
assert.equal('invented_root_property' in normalized, false);
assert.equal('url' in normalized.source, false);
assert.equal('reviewed_at' in normalized.annotation, false);

const ancientTemporal = normalizePersonaAnnotationRecord({
  schema_version: '1.1.0',
  persona_seed: {
    temporal: {
      period_bucket: '1400_1499',
      decade: 761,
      within_decade_position: 'unspecified',
      specific_year: 761,
    },
  },
}) as any;

assert.equal(ancientTemporal.persona_seed.temporal.specific_year, 761);
assert.equal(ancientTemporal.persona_seed.temporal.decade, 760);
assert.equal(ancientTemporal.persona_seed.temporal.period_bucket, '500_999');

const bceTemporal = normalizePersonaAnnotationRecord({
  schema_version: '1.1.0',
  persona_seed: {
    temporal: {
      period_bucket: '1400_1499',
      decade: -2645,
      within_decade_position: 'unspecified',
      specific_year: -2645,
    },
  },
}) as any;

assert.equal(bceTemporal.persona_seed.temporal.decade, -2650);
assert.equal(bceTemporal.persona_seed.temporal.period_bucket, '3000_bce_1_bce');

const completeAncientRecord = generateRandomPersonaAnnotationRecord();
completeAncientRecord.persona_seed.temporal = {
  period_bucket: '1400_1499',
  decade: 761,
  within_decade_position: 'unspecified',
  specific_year: 761,
  date_basis: 'synthetic_within_period',
};
const validatedAncientRecord = assertPersonaAnnotationRecord(completeAncientRecord);
assert.equal(validatedAncientRecord.persona_seed.temporal.decade, 760);
assert.equal(validatedAncientRecord.persona_seed.temporal.period_bucket, '500_999');

const orientationSource = {
  title: 'Procedural seed: Wagga the Frigatebird',
  text: 'Wagga the Frigatebird, 761, coastal settlement, fisher.',
  sourceBasis: 'synthetic_composite' as const,
  extractionMethod: 'mixed' as const,
  citationLabel: 'Procedural seed: Wagga the Frigatebird',
};
const orientation = createPersonaOrientationRecord({
  persona: {
    name_and_address: { full_name: 'Wagga the Frigatebird' },
    age_and_life_stage: { age: 28, life_stage: 'adult household member' },
    gender_role: 'adult man',
    social_status: 'free fisher of modest standing',
    legal_condition: 'free subject',
    year: 761,
    place_context: {
      locality: 'coastal settlement',
      region: 'island coast',
      locale_type: 'fishing village',
    },
    language_and_literacy: { languages: ['local vernacular'], literacy: 'nonliterate' },
    occupation: 'fisher',
    daily_routine: ['checks lines before dawn', 'mends nets after landing'],
    horizons: { knowledge: 'household, coast, weather, and nearby markets', mobility: 'moves along the local coast by boat' },
    voice: { register: 'plain and concrete', cadence: 'short clauses shaped by work' },
    anachronism_guards: ['modern nation-states', 'engines and industrial fishing'],
  },
}, orientationSource);

assert.deepEqual(validatePersonaOrientationRecord(orientation), []);
assert.equal(orientation.schema_version, '2.0.0');
const orientationCompatibilityRecord = personaOrientationToAnnotationRecord(orientation, orientationSource);
assert.equal(orientationCompatibilityRecord.persona_seed.temporal.specific_year, 761);
assert.equal(orientationCompatibilityRecord.persona_seed.temporal.decade, 760);
assert.equal(orientationCompatibilityRecord.persona_seed.identity_name?.full_name, 'Wagga the Frigatebird');

const wikipediaSource = {
  title: 'Eulalia Ramos',
  text: 'Eulalia Ramos was a Venezuelan independence heroine born in 1795 and killed in 1817.',
  url: 'https://en.wikipedia.org/wiki/Eulalia_Ramos',
  sourceBasis: 'wikipedia_or_reference' as const,
  extractionMethod: 'wikipedia_api' as const,
  citationLabel: 'Wikipedia: Eulalia Ramos',
  subject: {
    name: 'Eulalia Ramos',
    description: 'Venezuelan independence heroine',
    birthYear: 1795,
    deathYear: 1817,
    externalId: 'Q-test',
  },
};
const wikipediaOrientation = createPersonaOrientationRecord({
  persona: {
    ...orientation.persona,
    name_and_address: { full_name: 'Wrong model name' },
    age_and_life_stage: { age: 38, life_stage: 'young adult' },
    gender_role: 'adult woman',
    community_identity: 'Venezuelan Catholic community',
    year: 1757,
    place_context: {
      locality: 'Barcelona',
      region: 'Venezuela',
      polity: 'Captaincy General of Venezuela',
      locale_type: 'colonial town',
    },
    occupation: 'independence patriot and household organizer',
    religion_and_ritual: 'Roman Catholic practice',
  },
}, wikipediaSource);
assert.equal(wikipediaOrientation.persona.name_and_address.full_name, 'Eulalia Ramos');
assert.equal(wikipediaOrientation.persona.year, 1811);
assert.equal(wikipediaOrientation.persona.age_and_life_stage.age, 16);
const wikipediaCompatibilityRecord = personaOrientationToAnnotationRecord(wikipediaOrientation, wikipediaSource);
assert.equal(wikipediaCompatibilityRecord.schema_version, '1.1.0');
assert.equal(wikipediaCompatibilityRecord.persona_seed.place.region, 'Venezuela');
assert.equal(wikipediaCompatibilityRecord.persona_seed.religious_practice?.specific_label, 'Roman Catholic practice');
assert.equal(wikipediaCompatibilityRecord.persona_seed.social_identity.religious_or_communal_identity, 'Roman Catholic practice');

const providerMisnested = structuredClone({
  persona: {
    ...wikipediaOrientation.persona,
    conversation_frame: undefined,
    anachronism_guards: undefined,
  },
  conversation_frame: {
    situation: 'Barcelona during the 1817 crisis.',
    interlocutor_relation: 'A trusted neighbor.',
  },
  anachronism_guards: ['later Venezuelan politics', 'telegraph and radio'],
  provenance: [{
    field_path: '/persona/clothing_and_possessions',
    support: 'inferred',
    confidence: 'medium',
    snippet: '',
  }],
}) as any;
delete providerMisnested.persona.conversation_frame;
delete providerMisnested.persona.anachronism_guards;
providerMisnested.persona.clothing_and_possessions = ['dress', 'shawl', 'cap', 'shoes', 'apron', 'pouch', 'seventh excess item'];
const repairedProviderRecord = createPersonaOrientationRecord(providerMisnested, wikipediaSource);
assert.deepEqual(repairedProviderRecord.persona.anachronism_guards, ['later Venezuelan politics', 'telegraph and radio']);
assert.equal(repairedProviderRecord.persona.conversation_frame?.situation, 'Barcelona during the 1817 crisis.');
assert.equal(repairedProviderRecord.persona.clothing_and_possessions?.length, 6);
assert.equal(repairedProviderRecord.provenance[0].snippet, undefined);

const responsePath = process.argv[2];
if (responsePath) {
  const response = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
  const record = assertPersonaAnnotationRecord(response.record ?? response);
  assert.ok(record.schema_version);
}

console.log('Persona validation normalization tests passed.');
