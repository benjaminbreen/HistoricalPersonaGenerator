import { HistoricalEra, WealthLevel } from '../types';

export type ProceduralSocialStatus = 'peasant' | 'commoner' | 'merchant' | 'noble';

type StatusWeights = Record<ProceduralSocialStatus, number>;

const PREMODERN_STATUS_BY_WEALTH: Record<WealthLevel, StatusWeights> = {
  poor:        { peasant: 72, commoner: 25, merchant: 2,  noble: 1 },
  modest:      { peasant: 50, commoner: 43, merchant: 5,  noble: 2 },
  comfortable: { peasant: 20, commoner: 58, merchant: 18, noble: 4 },
  wealthy:     { peasant: 5,  commoner: 35, merchant: 45, noble: 15 },
  noble:       { peasant: 2,  commoner: 18, merchant: 25, noble: 55 },
};

const MODERN_STATUS_BY_WEALTH: Record<WealthLevel, StatusWeights> = {
  poor:        { peasant: 70, commoner: 28, merchant: 1,  noble: 1 },
  modest:      { peasant: 50, commoner: 45, merchant: 4,  noble: 1 },
  comfortable: { peasant: 15, commoner: 70, merchant: 12, noble: 3 },
  wealthy:     { peasant: 3,  commoner: 35, merchant: 45, noble: 17 },
  noble:       { peasant: 1,  commoner: 15, merchant: 30, noble: 54 },
};

const STATUS_ORDER: ProceduralSocialStatus[] = ['peasant', 'commoner', 'merchant', 'noble'];

const isModernStatusSystem = (era: HistoricalEra): boolean =>
  era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA;

/**
 * Wealth influences status without defining it. This intentionally permits
 * combinations such as a poor noble, prosperous commoner, or comfortable
 * peasant while keeping the common cases common.
 */
export function sampleSocialStatus(
  era: HistoricalEra,
  wealth: WealthLevel,
  random: () => number = Math.random,
  localeType?: 'rural' | 'town' | 'city' | 'mobile' | 'unknown',
): ProceduralSocialStatus {
  const baseTable = isModernStatusSystem(era)
    ? MODERN_STATUS_BY_WEALTH[wealth]
    : PREMODERN_STATUS_BY_WEALTH[wealth];
  const table = { ...baseTable };
  if (localeType === 'rural' || localeType === 'mobile') {
    const reducedMerchant = table.merchant * 0.5;
    const reducedNoble = table.noble * 0.15;
    const released = (table.merchant - reducedMerchant) + (table.noble - reducedNoble);
    table.merchant = reducedMerchant;
    table.noble = reducedNoble;
    table.peasant += released * 0.7;
    table.commoner += released * 0.3;
    if (isModernStatusSystem(era)) {
      const shiftedCommoner = table.commoner * 0.5;
      table.commoner -= shiftedCommoner;
      table.peasant += shiftedCommoner;
    }
  }
  const total = STATUS_ORDER.reduce((sum, status) => sum + table[status], 0);
  let roll = Math.max(0, Math.min(0.999999, random())) * total;

  for (const status of STATUS_ORDER) {
    roll -= table[status];
    if (roll < 0) return status;
  }

  return 'commoner';
}

export function formatSocialStatusForEra(
  status: string,
  era: HistoricalEra
): string {
  const normalized = status.trim().toLowerCase();
  if (!isModernStatusSystem(era)) {
    if (normalized === 'peasant') return 'Peasant';
    if (normalized === 'merchant') return 'Merchant';
    if (normalized === 'noble') return 'Noble';
    return 'Commoner';
  }

  if (normalized === 'peasant' || normalized === 'working class') return 'Working Class';
  if (normalized === 'merchant' || normalized === 'noble' || normalized === 'upper class') return 'Upper Class';
  return 'Middle Class';
}
