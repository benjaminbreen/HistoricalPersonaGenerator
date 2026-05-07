import { HistoricalPersona } from './personaGenerator';
import { HistoricalPersonaAnnotationRecord } from '../types/personaAnnotation';

export type ConsistencyIssueSeverity = 'info' | 'warning' | 'error';

export interface ConsistencyIssue {
  id: string;
  severity: ConsistencyIssueSeverity;
  fieldPath?: string;
  message: string;
  suggestedFix?: string;
  autofixable?: boolean;
}

const normalize = (value?: string): string =>
  (value || '')
    .replace(/_/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const isPopulated = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(isPopulated);
  return true;
};

const hasEvidenceFor = (
  record: HistoricalPersonaAnnotationRecord,
  fieldPath: string,
  supportLevels: string[] = ['explicit', 'strong_inference']
): boolean =>
  Boolean(record.field_evidence?.some(item =>
    item.field_path === fieldPath && supportLevels.includes(item.support_level)
  ));

const displayishValue = (value: string): string => normalize(value);

const leakedEnumValues = [
  'household local',
  'full practical',
  'plain working',
  'none apparent',
  'young adult',
  'middle aged',
  'synthetic fill',
  'weak inference',
  'strong inference',
];

const periodBucketRanges: Record<string, [number, number]> = {
  '1400_1499': [1400, 1499],
  '1500_1599': [1500, 1599],
  '1600_1699': [1600, 1699],
  '1700_1749': [1700, 1749],
  '1750_1849': [1750, 1849],
  '1850_1914': [1850, 1914],
  '1915_1930': [1915, 1930],
};

export function checkPersonaConsistency(input: {
  record: HistoricalPersonaAnnotationRecord;
  persona: HistoricalPersona;
  target: 'named_subject' | 'ordinary_person_from_source_world';
}): ConsistencyIssue[] {
  const { record, persona, target } = input;
  const seed = record.persona_seed;
  const issues: ConsistencyIssue[] = [];
  const regionContext = normalize([
    seed.place.region,
    seed.place.settlement_or_locality,
    seed.place.polity,
    persona.region,
    persona.location,
  ].filter(Boolean).join(' '));
  const year = seed.temporal.specific_year || seed.temporal.decade;
  const bucketRange = periodBucketRanges[seed.temporal.period_bucket];

  if (year && bucketRange && (year < bucketRange[0] || year > bucketRange[1])) {
    issues.push({
      id: 'period-bucket-year-mismatch',
      severity: 'error',
      fieldPath: '/persona_seed/temporal/period_bucket',
      message: `Period bucket ${seed.temporal.period_bucket} does not contain selected year ${year}.`,
      suggestedFix: 'Update period_bucket to the range that contains specific_year, or revise specific_year.',
      autofixable: true,
    });
  }

  if (/(central valley|fresno|san joaquin|california)/.test(regionContext) && !/california|central valley|fresno|san joaquin/.test(normalize(persona.region))) {
    issues.push({
      id: 'location-region-drift',
      severity: 'warning',
      fieldPath: '/persona_seed/place/region',
      message: `Source place looks California-specific, but the generated persona region is "${persona.region}".`,
      suggestedFix: 'Preserve the source region/locality through the adapter and map resolver.',
    });
  }

  if (persona.character.age < 14 && /labor|worker|servant|apprentice|farm|factory|domestic/i.test(persona.character.profession || '')) {
    issues.push({
      id: 'child-adult-work-label',
      severity: 'warning',
      fieldPath: '/persona_seed/work/primary_occupation',
      message: `Age ${persona.character.age} is being displayed with an adult-style work label: "${persona.character.profession}".`,
      suggestedFix: 'Display as child-contextual labor, such as seasonal field help or household work, unless the source explicitly states an adult role.',
      autofixable: true,
    });
  }

  const hasProceduralDisease = Boolean(persona.character.diseaseHealth?.currentDiseases?.length);
  const sourceSupportsInfectiousDisease = (seed.material_life.body_conditions || []).some(condition =>
    /infectious_disease|epidemic|plague|typhus|cholera|smallpox|tuberculosis|malaria/i.test(condition)
  );
  if (hasProceduralDisease && !sourceSupportsInfectiousDisease) {
    issues.push({
      id: 'unsupported-procedural-disease',
      severity: 'warning',
      fieldPath: '/persona_seed/material_life/body_conditions',
      message: 'Generated character has a procedural infectious disease that is not supported by the source body-condition fields.',
      suggestedFix: 'Suppress procedural diseases for source-backed personas unless body_conditions or field evidence supports an infectious disease.',
      autofixable: true,
    });
  }

  const summaryClaimsSourceCertainty = /\b(record confirms|source confirms|source states|document states|explicitly records)\b/i.test(seed.summary || '');
  if (summaryClaimsSourceCertainty) {
    const hasAnyExplicitIdentityEvidence = [
      '/persona_seed/identity_name',
      '/persona_seed/social_identity',
      '/persona_seed/place',
      '/persona_seed/work',
    ].some(path => hasEvidenceFor(record, path, ['explicit']));
    if (!hasAnyExplicitIdentityEvidence) {
      issues.push({
        id: 'overstated-source-certainty',
        severity: 'warning',
        fieldPath: '/persona_seed/summary',
        message: 'Summary uses source-certainty language, but field evidence does not show matching explicit support.',
        suggestedFix: 'Use “the model infers” or add explicit field evidence with a source snippet.',
      });
    }
  }

  const displayValues = [
    ['identity', seed.social_identity.religious_or_communal_identity],
    ['literacy', seed.social_identity.literacy],
    ['clothing', seed.material_life.clothing_detail || seed.material_life.clothing_level],
    ['worldview', seed.public_world?.detail || seed.public_world?.scale || seed.mobility_and_horizon.political_horizon],
    ['moral world', seed.normative_world?.detail || seed.normative_world?.primary_frame || seed.mobility_and_horizon.religious_or_moral_world],
    ['religious practice', seed.religious_practice?.specific_label || seed.religious_practice?.tradition],
    ['interaction style', seed.interaction_style?.detail || seed.interaction_style?.under_stress || seed.temperament_and_voice.dominant_temperament],
  ];
  for (const [label, value] of displayValues) {
    if (typeof value !== 'string') continue;
    const normalizedValue = displayishValue(value);
    if (leakedEnumValues.includes(normalizedValue)) {
      issues.push({
        id: `enum-display-${label}`,
        severity: 'info',
        message: `Display label "${value}" looks like schema shorthand rather than reader-facing text.`,
        suggestedFix: 'Route this field through a display formatter before rendering.',
        autofixable: true,
      });
    }
  }

  const family = persona.character.family || [];
  for (const member of family) {
    if ((member as any).birthYear && persona.character.birthYear) {
      const parentAge = Number(persona.character.birthYear) - Number((member as any).birthYear);
      if (['father', 'mother'].includes(member.relation) && (parentAge < 12 || parentAge > 70)) {
        issues.push({
          id: `family-age-${member.relation}`,
          severity: 'warning',
          fieldPath: '/persona_seed/family/members',
          message: `${member.relation} age at birth looks implausible for ${member.name}.`,
          suggestedFix: 'Use source-provided dates or regenerate plausible family years.',
        });
      }
    }
    if (/^plausible (father|mother) of /i.test(member.name) && isPopulated(seed.family?.members)) {
      issues.push({
        id: `family-placeholder-${member.relation}`,
        severity: 'warning',
        fieldPath: '/persona_seed/family/members',
        message: `Placeholder family member "${member.name}" is shown even though schema family members are populated.`,
        suggestedFix: 'Prefer persona_seed.family.members over procedural placeholders.',
      });
    }
  }

  if (target === 'ordinary_person_from_source_world') {
    const sourceTitle = normalize(record.source.title.replace(/\s*\([^)]*\)\s*$/, ''));
    if (sourceTitle && normalize(persona.character.name) === sourceTitle) {
      issues.push({
        id: 'ordinary-person-uses-source-title',
        severity: 'warning',
        fieldPath: '/persona_seed/identity_name',
        message: 'Ordinary-person mode generated the source title as the persona name.',
        suggestedFix: 'Fill persona_seed.identity_name with a plausible ordinary name and mark its support level.',
      });
    }
  }

  if (target === 'named_subject') {
    const recordName = normalize(seed.identity_name?.full_name || [seed.identity_name?.given_name, seed.identity_name?.family_name].filter(Boolean).join(' '));
    if (recordName && normalize(persona.character.name) !== recordName) {
      issues.push({
        id: 'named-subject-name-drift',
        severity: 'warning',
        fieldPath: '/persona_seed/identity_name',
        message: `Named-subject record supplies "${recordName}", but generated character is "${persona.character.name}".`,
        suggestedFix: 'Apply persona_seed.identity_name after procedural generation.',
      });
    }
  }

  if (record.field_evidence?.length) {
    const explicitFields = record.field_evidence.filter(item => item.support_level === 'explicit');
    const missingSnippets = explicitFields.filter(item => !item.snippet && !item.notes);
    if (missingSnippets.length > 0) {
      issues.push({
        id: 'explicit-evidence-without-snippet',
        severity: 'info',
        message: `${missingSnippets.length} explicit field evidence entr${missingSnippets.length === 1 ? 'y' : 'ies'} lack snippet or notes.`,
        suggestedFix: 'Include a short source snippet or note for explicit evidence.',
      });
    }
  }

  return issues;
}
