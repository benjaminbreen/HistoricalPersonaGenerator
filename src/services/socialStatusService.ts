import { HistoricalEra, WealthLevel } from '../types';
import {
  hasCapability,
  subsistenceMode,
  type CapabilityContext,
} from '../constants/societyCapabilities';

export type ProceduralSocialStatus = 'peasant' | 'commoner' | 'merchant' | 'noble';

type StatusWeights = Record<ProceduralSocialStatus, number>;

/**
 * The kind of order a life is placed within.
 *
 * The four statuses below are a structural axis — roughly, whether labor is
 * owed, sold, directed or bought — and that axis travels reasonably well. The
 * *words* for it do not. Rendering them through one table keyed on era alone
 * gave every society between the Palaeolithic and 1900 the vocabulary of
 * medieval European feudalism, which is how a bison hunter on the Plains in
 * 157 BCE came to be labelled a Peasant.
 *
 * A peasant is a cultivator who owes rent, tax or labor to a landlord or a
 * state. Poor and rural is not the same thing. On the open Plains there was no
 * land tenure, no tribute and no landlord, so the word has nothing to attach
 * to — and the honest rendering of a band society's rank order is that it does
 * not have one.
 */
export type PolityForm =
  | 'band'
  | 'tribal'
  | 'chiefdom'
  | 'agrarian_state'
  | 'commercial'
  | 'industrial';

export function polityFormFor(
  ctx: CapabilityContext,
  professionLower?: string,
): PolityForm {
  switch (subsistenceMode(ctx, professionLower)) {
    case 'foraging':
    case 'pastoral':
      return 'band';
    case 'horticultural':
      return hasCapability('urban_settlement', ctx) ? 'chiefdom' : 'tribal';
    case 'agrarian':
      // Land is heritable, so rank is transmissible; whether that rank is
      // administered by a state is the difference between the two.
      return hasCapability('writing', ctx) || hasCapability('urban_settlement', ctx)
        ? 'agrarian_state'
        : 'chiefdom';
    case 'commercial':
      return 'commercial';
    case 'industrial':
      return 'industrial';
  }
}

/**
 * What each station is called, in the vocabulary of its own kind of society.
 *
 * Band societies get one word on purpose. Forcing a rank onto an egalitarian
 * society is a category error that no amount of better wording fixes, and the
 * absence is itself informative — see `socialStatusFieldLabel`, which relabels
 * the field so the flatness reads as a fact rather than as missing data.
 */
const STATUS_LABELS: Record<PolityForm, Record<ProceduralSocialStatus, string>> = {
  band: {
    peasant: 'Band Member', commoner: 'Band Member',
    merchant: 'Band Member', noble: 'Band Member',
  },
  tribal: {
    peasant: 'Householder', commoner: 'Householder',
    merchant: 'Trade Partner', noble: 'Lineage Head',
  },
  chiefdom: {
    peasant: 'Commoner', commoner: 'Commoner',
    merchant: 'Trade Specialist', noble: 'Chiefly Lineage',
  },
  agrarian_state: {
    peasant: 'Peasant', commoner: 'Commoner',
    merchant: 'Merchant', noble: 'Noble',
  },
  commercial: {
    peasant: 'Laboring Poor', commoner: 'Middling Sort',
    merchant: 'Merchant', noble: 'Gentry',
  },
  industrial: {
    // Merchant and noble both used to render as "Upper Class", which made a
    // 1950s shopkeeper upper class.
    peasant: 'Working Class', commoner: 'Middle Class',
    merchant: 'Merchant', noble: 'Upper Class',
  },
};

/** Every label the tables above can produce, for tests and audits. */
export function allStatusLabels(): string[] {
  return [...new Set(Object.values(STATUS_LABELS).flatMap(row => Object.values(row)))];
}

/**
 * What to call the field on the card. A band has standing, not social status,
 * and printing "Social Status: Band Member" under a heading that promises a
 * rank order overstates what is there.
 */
export function socialStatusFieldLabel(polity: PolityForm): string {
  return polity === 'band' || polity === 'tribal' ? 'Standing' : 'Social Status';
}

/**
 * Multipliers on the sampled status, by the kind of society doing the placing.
 * A society with nobody to sell to should not be producing merchants, and one
 * with no hereditary rank should not be producing nobles. Whatever these
 * suppress is released to the two stations that always exist.
 */
const STATUS_LIMITS: Record<PolityForm, Partial<StatusWeights>> = {
  band: { merchant: 0, noble: 0 },
  tribal: { merchant: 0.2, noble: 0.25 },
  chiefdom: { merchant: 0.5, noble: 0.6 },
  agrarian_state: {},
  commercial: {},
  industrial: {},
};

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
  /** Where and when, so a society without merchants does not produce one. */
  polity?: PolityForm,
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

  if (polity) {
    const limits = STATUS_LIMITS[polity];
    let released = 0;
    for (const status of STATUS_ORDER) {
      const limit = limits[status];
      if (limit === undefined) continue;
      released += table[status] * (1 - limit);
      table[status] *= limit;
    }
    table.peasant += released * 0.6;
    table.commoner += released * 0.4;
  }

  const total = STATUS_ORDER.reduce((sum, status) => sum + table[status], 0);
  let roll = Math.max(0, Math.min(0.999999, random())) * total;

  for (const status of STATUS_ORDER) {
    roll -= table[status];
    if (roll < 0) return status;
  }

  return 'commoner';
}

const normalizeStatus = (status: string): ProceduralSocialStatus => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'peasant' || normalized === 'working class') return 'peasant';
  if (normalized === 'merchant') return 'merchant';
  if (normalized === 'noble' || normalized === 'upper class') return 'noble';
  return 'commoner';
};

/**
 * The display label for a status, in the vocabulary of the society that holds
 * it. Replaces the previous era-only rendering, which had two vocabularies —
 * medieval European for everything before 1900, and class-society English
 * after — and applied the first of them to every band, tribe and chiefdom in
 * the record.
 */
export function formatSocialStatus(
  status: string,
  ctx: CapabilityContext,
  professionLower?: string,
): string {
  return STATUS_LABELS[polityFormFor(ctx, professionLower)][normalizeStatus(status)];
}
