/**
 * services/wealthCoherenceService.ts
 *
 * Wealth as a consequence of what someone does, not a third independent die.
 *
 * The generator rolls wealth, status and profession on separate tracks, and the
 * wardrobe reads wealth alone. Six per cent of industrial-era personas draw a
 * `wealthy` or `noble` tier whatever their trade, so the app produced a
 * dairymaid on the Thracian Plain in a black opera gown, ivory evening boots
 * and a feathered headdress. She was not a bad roll — she was three good rolls
 * that never spoke to each other.
 *
 * The fix is a clamp rather than a rewrite. Wealth is still sampled the way it
 * was, and then bounded by the trade the persona actually ended up in:
 *
 *   ceiling — a dairymaid, a field hand or a laundress cannot reach the tier
 *             that owns an opera gown, however the dice fell
 *   floor   — a bishop, a general or an industrialist cannot come out dressed
 *             as a labourer, which is the other half of why elite clothing was
 *             almost never seen
 *
 * Two things it deliberately does **not** do. It does not raise the poor
 * nobility: the penniless hidalgo is the modal case of his estate, and the
 * elite table carries its own wealth distribution precisely to say so, so the
 * floor is taken from *office* and never from standing. And it does not cap
 * anything it has no opinion about — an unrecognised profession is left exactly
 * where the roll put it, so this can only remove absurdities, never invent them.
 */

import type { WealthLevel } from '../types';

/** Poorest to richest. The clamp is an index operation on this. */
const WEALTH_ORDER: WealthLevel[] = ['poor', 'modest', 'comfortable', 'wealthy', 'noble'];

/**
 * Work done for someone else's household, field or wage.
 *
 * These are the trades where a `wealthy` draw is not a rich person doing humble
 * work — it is a category error. A prosperous farmer exists; a prosperous
 * scullion does not, because the word describes a position in someone else's
 * kitchen.
 */
const LABOURING = /\b(?:laborer|labourer|field hand|farm hand|farm worker|farm labourer|field labourer|servant|housemaid|maid|laundress|laundry worker|washerwoman|charwoman|scullion|sweeper|water carrier|wood gatherer|porter|carrier|dairymaid|milkmaid|shepherd|swineherd|cowherd|goatherd|herder|drover|beggar|sharecropper|cottager|crofter|picker|cane cutter|digger|hawker|pedlar|chapman|costermonger|street vendor|street hawker|night soil|errand boy|chimney sweep|navvy|mill worker|factory hand|match worker|thresher|reaper|ploughman|forager|gatherer|root digger|shellfish gatherer|scavenger|ostler|kitchen porter|cleaner|refuse collector|domestic|miner|rubber|tapper|romusha|mitayo|coolie|stevedore|dock worker|dock labourer|rickshaw|cyclo)\b/i;

/**
 * Trades a household could live on and sometimes prosper in, without ever
 * reaching the tier that dresses for the opera.
 */
const INDEPENDENT_TRADE = /\b(?:smith|blacksmith|carpenter|mason|potter|weaver|spinner|dyer|tanner|leatherworker|cooper|cobbler|tailor|seamstress|baker|miller|brewer|butcher|fisherman|fisher|boatman|ferryman|carter|muleteer|wheelwright|saddler|thatcher|glazier|sawyer|farmer|cultivator|innkeeper|publican|barber|midwife|nurse|herbalist|healer|scribe|teacher|schoolteacher|clerk|shop assistant|mechanic|plumber|electrician|welder|bricklayer|driver|sailor|soldier|guard|hunter|trapper|toolmaker|basket|rope maker|net maker|candle|soap|salt worker|charcoal burner|quarryman|woodcutter|beekeeper)\b/i;

/**
 * Offices that put a floor under a life.
 *
 * Kept in step with the tiers in `art/distinctionMark.ts`, which marks the same
 * three bands on the portrait. If a title is rare enough to earn a badge there
 * it is substantial enough to set a floor here.
 */
const SINGULAR_OFFICE = /\b(?:emperor|empress|king|queen|tsar|czar|sultan|caliph|shah|pharaoh|pope|patriarch|doge|shogun|daimyo|viceroy|governor.general|grand vizier|maharaja|nawab|duke|duchess|prince|princess|grandee|oil baron|robber baron|bank president|chaebol chairman|tech ceo|sapa inca|tlatoani|mansa|oba)\b/i;

const GREAT_OFFICE = /\b(?:bishop|archbishop|metropolitan|abbot|abbess|cardinal|high priest|chief priest|ayatollah|mufti|general|admiral|marshal|satrap|pasha|bey|wali|emir|vizier|diwan|subahdar|zamindar|jagirdar|mansabdar|grand secretary|mandarin|boyar|voivode|margrave|landgrave|chancellor|corregidor|adelantado|encomendero|consul|praetor|industrialist|factory owner|magnate|tycoon|mogul|hacienda owner|plantation owner|university professor)\b/i;

const HIGH_OFFICE = /\b(?:magistrate|judge|senator|councillor|guild master|ship owner|banker|merchant|court physician|physician|surgeon|lawyer|advocate|notary|apothecary|alcalde|prefect|local governor|aristocrat|knight|chief|sheikh|datu|curaca|kuraka|cacique|scholar|astronomer|official)\b/i;

const index = (level: WealthLevel): number => Math.max(0, WEALTH_ORDER.indexOf(level));

/** The highest tier this trade can plausibly reach. `noble` means no opinion. */
export function professionWealthCeiling(profession: string | undefined): WealthLevel {
  if (!profession) return 'noble';
  if (LABOURING.test(profession)) return 'modest';
  if (INDEPENDENT_TRADE.test(profession)) return 'comfortable';
  return 'noble';
}

/** The lowest tier this office can plausibly sit at. `poor` means no opinion. */
export function professionWealthFloor(profession: string | undefined): WealthLevel {
  if (!profession) return 'poor';
  if (SINGULAR_OFFICE.test(profession)) return 'wealthy';
  if (GREAT_OFFICE.test(profession)) return 'wealthy';
  if (HIGH_OFFICE.test(profession)) return 'comfortable';
  return 'poor';
}

/**
 * The sampled wealth, bounded by the trade.
 *
 * Ceiling wins over floor where a profession somehow matches both, because the
 * ceiling is the one preventing an absurdity and the floor is only preventing
 * an understatement.
 */
export function coherentWealth(
  sampled: WealthLevel,
  profession: string | undefined,
): WealthLevel {
  const ceiling = index(professionWealthCeiling(profession));
  const floor = index(professionWealthFloor(profession));
  const bounded = Math.min(ceiling, Math.max(floor, index(sampled)));
  return WEALTH_ORDER[bounded];
}
