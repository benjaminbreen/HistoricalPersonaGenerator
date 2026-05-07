import Ajv2020, { ErrorObject } from 'ajv/dist/2020';
import annotationSchema from '../schemas/historicalPersonaAnnotation.schema.json';
import { HistoricalPersonaAnnotationRecord } from '../types/personaAnnotation';

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
});

const validateAnnotationSchema = ajv.compile(annotationSchema);

const WORKPLACE_VALUES = new Set([
  'household',
  'field',
  'workshop',
  'shop',
  'street',
  'dock',
  'office',
  'kitchen',
  'ship',
  'barracks',
  'court',
  'religious_house',
  'factory',
  'mixed',
]);

const WORKPLACE_SYNONYMS: Array<[RegExp, string]> = [
  [/\b(home|house|household|domestic|family|parlor|parlour|sickroom|bedroom|nursery|estate|residence|drawing room)\b/i, 'household'],
  [/\b(study|desk|bureau|office|correspondence|schoolroom|classroom|academy|seminary)\b/i, 'office'],
  [/\b(kitchen|cookhouse|scullery|hearth)\b/i, 'kitchen'],
  [/\b(field|farm|plantation|pasture|orchard|vineyard|harvest|garden)\b/i, 'field'],
  [/\b(workshop|atelier|studio|forge|smithy|millinery|weaving room|loom)\b/i, 'workshop'],
  [/\b(shop|store|market stall|stall|counter)\b/i, 'shop'],
  [/\b(street|road|marketplace|square|alley|itinerant|route)\b/i, 'street'],
  [/\b(dock|wharf|harbor|harbour|quay|port)\b/i, 'dock'],
  [/\b(ship|boat|vessel|galley)\b/i, 'ship'],
  [/\b(barracks|camp|fort|garrison)\b/i, 'barracks'],
  [/\b(court|palace|legal|tribunal|chancery)\b/i, 'court'],
  [/\b(monastery|convent|temple|mosque|church|synagogue|shrine|religious house|mission)\b/i, 'religious_house'],
  [/\b(factory|mill|manufactory|plant|textile works)\b/i, 'factory'],
];

const normalizeWorkplace = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const compact = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (WORKPLACE_VALUES.has(compact)) return compact;

  const readable = value.trim().toLowerCase().replace(/_/g, ' ');
  const matched = WORKPLACE_SYNONYMS.find(([pattern]) => pattern.test(readable));
  return matched?.[1] || 'mixed';
};

export function normalizePersonaAnnotationRecord(record: unknown): unknown {
  if (!record || typeof record !== 'object') return record;
  const clone = structuredClone(record) as any;
  const workplace = clone?.persona_seed?.work?.workplace;
  if (workplace !== undefined) {
    clone.persona_seed.work.workplace = normalizeWorkplace(workplace);
  }
  return clone;
}

const formatPath = (error: ErrorObject): string => {
  if (error.instancePath) return error.instancePath;
  const missingProperty = (error.params as { missingProperty?: string }).missingProperty;
  return missingProperty ? `/${missingProperty}` : '/';
};

export function validatePersonaAnnotationRecord(record: unknown): string[] {
  const valid = validateAnnotationSchema(record);
  if (valid) return [];

  return (validateAnnotationSchema.errors || []).map(error => {
    const path = formatPath(error);
    if (error.keyword === 'additionalProperties') {
      const additionalProperty = (error.params as { additionalProperty?: string }).additionalProperty;
      return `${path} must not include extra property "${additionalProperty}"`;
    }
    if (error.keyword === 'required') {
      const missingProperty = (error.params as { missingProperty?: string }).missingProperty;
      return `${path} is missing required property "${missingProperty}"`;
    }
    return `${path} ${error.message || 'is invalid'}`;
  });
}

export function assertPersonaAnnotationRecord(record: unknown): HistoricalPersonaAnnotationRecord {
  const normalized = normalizePersonaAnnotationRecord(record);
  const errors = validatePersonaAnnotationRecord(normalized);
  if (errors.length > 0) {
    throw new Error(`Annotation record failed validation: ${errors.slice(0, 6).join('; ')}`);
  }
  return normalized as HistoricalPersonaAnnotationRecord;
}
