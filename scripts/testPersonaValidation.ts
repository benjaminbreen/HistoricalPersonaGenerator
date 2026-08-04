import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertPersonaAnnotationRecord,
  normalizePersonaAnnotationRecord,
} from '../src/services/personaMaterialValidationService';
import { generateRandomPersonaAnnotationRecord } from '../src/services/personaAnnotationService';

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

const responsePath = process.argv[2];
if (responsePath) {
  const response = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
  const record = assertPersonaAnnotationRecord(response.record ?? response);
  assert.ok(record.schema_version);
}

console.log('Persona validation normalization tests passed.');
