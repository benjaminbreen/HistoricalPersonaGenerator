export const PERSONA_ANNOTATION_MIN_YEAR = -10000;
export const PERSONA_ANNOTATION_MAX_YEAR = 2030;

/**
 * Buckets used by the evidence-aware annotation record. They cover the same
 * dates as the procedural generator, including BCE personas and the present.
 */
export const PERSONA_PERIOD_BUCKET_RANGES = {
  '10000_bce_3001_bce': [-10000, -3001],
  '3000_bce_1_bce': [-3000, -1],
  '0_499': [0, 499],
  '500_999': [500, 999],
  '1000_1399': [1000, 1399],
  '1400_1499': [1400, 1499],
  '1500_1599': [1500, 1599],
  '1600_1699': [1600, 1699],
  '1700_1749': [1700, 1749],
  '1750_1849': [1750, 1849],
  '1850_1914': [1850, 1914],
  '1915_1930': [1915, 1930],
  '1931_2030': [1931, 2030],
} as const;

export type PersonaPeriodBucket = keyof typeof PERSONA_PERIOD_BUCKET_RANGES;

export const periodBucketForYear = (year: number): PersonaPeriodBucket => {
  for (const [bucket, [minimum, maximum]] of Object.entries(PERSONA_PERIOD_BUCKET_RANGES)) {
    if (year >= minimum && year <= maximum) return bucket as PersonaPeriodBucket;
  }

  // Validation reports out-of-contract years. Returning the nearest bucket
  // here keeps this derivation total without silently making the year valid.
  return year < PERSONA_ANNOTATION_MIN_YEAR ? '10000_bce_3001_bce' : '1931_2030';
};
