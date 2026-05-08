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

const RESIDENCE_LOCALE_VALUES = new Set([
  'isolated_rural_holding',
  'hamlet',
  'village',
  'market_town',
  'provincial_town',
  'urban_neighborhood',
  'metropolitan_center',
  'port_town',
  'port_city',
  'court_capital',
  'administrative_center',
  'religious_center',
  'frontier_settlement',
  'estate_or_manor',
  'plantation_or_forced_labor_settlement',
  'pastoral_or_nomadic_camp',
  'monastic_or_cloistered_community',
  'military_garrison_town',
  'displacement_or_refugee_settlement',
  'mobile_or_no_fixed_residence',
]);

const ACTIVITY_LOCALE_VALUES = new Set([
  'household_compound',
  'fields_or_pasture',
  'workshop_or_small_shop',
  'market_or_bazaar',
  'street_or_public_square',
  'dock_or_waterside',
  'ship_or_boat',
  'warehouse_or_storehouse',
  'office_or_countinghouse',
  'court_or_law_site',
  'religious_building_or_precinct',
  'school_or_scholarly_site',
  'estate_grounds',
  'factory_or_mill',
  'mine_or_extraction_site',
  'plantation_fields_or_processing_site',
  'military_installation',
  'road_or_travel_route',
  'domestic_service_in_others_household',
  'mixed_or_itinerant',
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

const RESIDENCE_LOCALE_SYNONYMS: Array<[RegExp, string]> = [
  [/\b(metropolis|capital|major city|large city|city center|city centre)\b/i, 'metropolitan_center'],
  [/\b(city|urban|neighborhood|neighbourhood|quarter|district|parish)\b/i, 'urban_neighborhood'],
  [/\b(port city|seaport|harbor city|harbour city)\b/i, 'port_city'],
  [/\b(port|coastal town|harbor|harbour)\b/i, 'port_town'],
  [/\b(town|market)\b/i, 'market_town'],
  [/\b(village)\b/i, 'village'],
  [/\b(hamlet)\b/i, 'hamlet'],
  [/\b(farm|holding|croft|rural)\b/i, 'isolated_rural_holding'],
  [/\b(estate|manor|plantation house)\b/i, 'estate_or_manor'],
  [/\b(plantation|forced labor|forced labour)\b/i, 'plantation_or_forced_labor_settlement'],
  [/\b(nomadic|pastoral|camp)\b/i, 'pastoral_or_nomadic_camp'],
  [/\b(monastery|convent|cloister)\b/i, 'monastic_or_cloistered_community'],
  [/\b(garrison|fort|barracks)\b/i, 'military_garrison_town'],
  [/\b(refugee|displacement)\b/i, 'displacement_or_refugee_settlement'],
  [/\b(itinerant|mobile|no fixed)\b/i, 'mobile_or_no_fixed_residence'],
  [/\b(court|palace)\b/i, 'court_capital'],
  [/\b(administrative|bureaucratic)\b/i, 'administrative_center'],
  [/\b(religious|temple|mission)\b/i, 'religious_center'],
  [/\b(frontier|borderland)\b/i, 'frontier_settlement'],
];

const ACTIVITY_LOCALE_SYNONYMS: Array<[RegExp, string]> = [
  [/\b(home|house|household|domestic|courtyard|compound|residence|family)\b/i, 'household_compound'],
  [/\b(field|farm|pasture|orchard|garden|herding|grazing)\b/i, 'fields_or_pasture'],
  [/\b(workshop|shop|atelier|studio|forge|loom|weaving|craft)\b/i, 'workshop_or_small_shop'],
  [/\b(market|bazaar|stall|trading)\b/i, 'market_or_bazaar'],
  [/\b(street|square|public|alley|roadside)\b/i, 'street_or_public_square'],
  [/\b(dock|wharf|waterside|quay|harbor|harbour)\b/i, 'dock_or_waterside'],
  [/\b(ship|boat|vessel|canoe|galley)\b/i, 'ship_or_boat'],
  [/\b(warehouse|storehouse|granary)\b/i, 'warehouse_or_storehouse'],
  [/\b(office|countinghouse|counting house|bureau|desk|correspondence)\b/i, 'office_or_countinghouse'],
  [/\b(court|law|legal|tribunal|chancery)\b/i, 'court_or_law_site'],
  [/\b(church|temple|mosque|synagogue|shrine|religious|mission)\b/i, 'religious_building_or_precinct'],
  [/\b(school|academy|university|scholarly|classroom|seminary)\b/i, 'school_or_scholarly_site'],
  [/\b(estate|manor|grounds)\b/i, 'estate_grounds'],
  [/\b(factory|mill|manufactory)\b/i, 'factory_or_mill'],
  [/\b(mine|quarry|extraction)\b/i, 'mine_or_extraction_site'],
  [/\b(plantation)\b/i, 'plantation_fields_or_processing_site'],
  [/\b(military|garrison|fort|barracks|camp)\b/i, 'military_installation'],
  [/\b(road|route|travel|itinerant|journey)\b/i, 'road_or_travel_route'],
  [/\b(service|servant|others household|another household)\b/i, 'domestic_service_in_others_household'],
];

const normalizeEnumValue = (
  value: unknown,
  allowedValues: Set<string>,
  synonyms: Array<[RegExp, string]>,
  fallback: string
): unknown => {
  if (typeof value !== 'string') return value;
  const compact = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (allowedValues.has(compact)) return compact;

  const readable = value.trim().toLowerCase().replace(/_/g, ' ');
  const matched = synonyms.find(([pattern]) => pattern.test(readable));
  return matched?.[1] || fallback;
};

const normalizeWorkplace = (value: unknown): unknown =>
  normalizeEnumValue(value, WORKPLACE_VALUES, WORKPLACE_SYNONYMS, 'mixed');

const normalizeResidenceLocale = (value: unknown): unknown =>
  normalizeEnumValue(value, RESIDENCE_LOCALE_VALUES, RESIDENCE_LOCALE_SYNONYMS, 'urban_neighborhood');

const normalizeActivityLocale = (value: unknown): unknown =>
  normalizeEnumValue(value, ACTIVITY_LOCALE_VALUES, ACTIVITY_LOCALE_SYNONYMS, 'mixed_or_itinerant');

export function normalizePersonaAnnotationRecord(record: unknown): unknown {
  if (!record || typeof record !== 'object') return record;
  const clone = structuredClone(record) as any;
  const workplace = clone?.persona_seed?.work?.workplace;
  if (workplace !== undefined) {
    clone.persona_seed.work.workplace = normalizeWorkplace(workplace);
  }
  const place = clone?.persona_seed?.place;
  if (place?.residence_locale !== undefined) {
    place.residence_locale = normalizeResidenceLocale(place.residence_locale);
  }
  if (place?.activity_locale !== undefined) {
    place.activity_locale = normalizeActivityLocale(place.activity_locale);
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
