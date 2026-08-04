import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertPersonaAnnotationRecord,
  normalizePersonaAnnotationRecord,
} from '../src/services/personaMaterialValidationService';

const normalized = normalizePersonaAnnotationRecord({
  schema_version: '1.1.0',
  invented_root_property: 'drop me',
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

const responsePath = process.argv[2];
if (responsePath) {
  const response = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
  const record = assertPersonaAnnotationRecord(response.record ?? response);
  assert.ok(record.schema_version);
}

console.log('Persona validation normalization tests passed.');
