/**
 * services/genderedLaborService.ts
 *
 * Who was allowed to do which work, and when.
 *
 * The profession tables carry a `genderBias` flag, which is a hard filter with
 * no date on it: a role marked 'Male' is closed to women in 1930 and in 2015
 * alike, and a role without the flag is wide open in every year there has ever
 * been. Both halves are wrong in the same way — they treat the sexual division
 * of labour as a fixed property of a job rather than as something that changed,
 * unevenly, in particular places at particular times.
 *
 * What the students saw was the second half: female construction workers,
 * welders, taxi drivers and police officers turning up in 1930s Peru and 1920s
 * California at a few percent each, because none of those roles happened to
 * carry the flag. Wage construction in interwar Peru was not a trade women were
 * a small minority of; it was one they were essentially absent from, because
 * the *cuadrilla* was recruited through male labour contractors and women's paid
 * work outside the household went into textiles, markets, domestic service and
 * the chicherías. A generator that hands out a woman bricklayer at two percent
 * is not being inclusive, it is quietly telling a student that interwar Andean
 * labour markets were mildly sexist rather than sharply segregated.
 *
 * So the model here is a curve rather than a switch. Each rule names an
 * occupation, the sex that overwhelmingly held it, and the year the other sex
 * begins to appear in it in numbers worth representing. Before that year the
 * weight is near zero; after it the weight climbs toward parity over a stated
 * span. The dates are approximate, deliberately conservative, and set by the
 * broad North Atlantic and Latin American pattern unless a region rule says
 * otherwise — they are a better guess than "always" or "never", which are the
 * two options the code had before.
 *
 * Two things this file deliberately does not do. It does not encode a claim
 * that women did no heavy work: subsistence agriculture, water and fuel
 * carrying, ore sorting, market portering and field labour were women's work
 * across most of the world and are weighted *up* below, not down. And it does
 * not touch non-binary personas, who fall outside a model built from the
 * records of societies that recorded two sexes.
 */

export type LaborSex = 'Male' | 'Female';

interface GenderedRule {
  pattern: RegExp;
  /** The sex that held this work almost exclusively before it opened. */
  held: LaborSex;
  /**
   * When the other sex begins to appear in numbers. Before this, the weight is
   * `closedWeight`; afterwards it climbs to parity across `openingSpan` years.
   */
  opensIn: number;
  /** Years from `opensIn` to rough parity. Defaults to 60. */
  openingSpan?: number;
  /**
   * The residual chance before opening. Not zero for most trades — there are
   * always exceptions and the app should be able to show one — but low enough
   * that a class of thirty does not routinely meet one. Set to 0 only where the
   * exclusion was formal and enforced.
   */
  closedWeight?: number;
  /** Places this rule does not describe. */
  exceptRegion?: RegExp;
}

const RULES: GenderedRule[] = [
  // ---------------------------------------------------------------------
  // Trades held by men, opening in the later twentieth century
  // ---------------------------------------------------------------------
  // Wage construction. Distinguished from the household building work women
  // did everywhere: this is the paid, contracted, urban trade.
  { pattern: /\b(?:construction worker|bricklayer|mason|builder|scaffolder|roofer|plasterer|migrant construction worker)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.01 },
  { pattern: /\b(?:welder|foundry|steel mill worker|boilermaker|riveter|machinist|millwright)\b/i, held: 'Male', opensIn: 1970, closedWeight: 0.02 },
  { pattern: /\b(?:blacksmith|farrier|ironworker|iron-worker)\b/i, held: 'Male', opensIn: 1970, closedWeight: 0.02 },
  { pattern: /\b(?:dock worker|stevedore|longshoreman|porter at the docks)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.01 },
  { pattern: /\b(?:lumberjack|logger|sawyer|timber)\b/i, held: 'Male', opensIn: 1980, closedWeight: 0.01 },
  // Underground mining specifically: barred by law in much of the world after
  // the mid-nineteenth century, and by custom before it. Surface work, ore
  // dressing and sorting were women's work in many coalfields and are not this.
  { pattern: /\b(?:coal miner|underground miner|collier|pit\b)/i, held: 'Male', opensIn: 1985, closedWeight: 0 },
  { pattern: /\b(?:miner|tin miner|diamond miner|uranium miner|opal miner|migrant mine worker)\b/i, held: 'Male', opensIn: 1980, closedWeight: 0.02 },

  // Motor transport. Women drove in wartime and in some cities earlier, but a
  // woman making her living at the wheel is a later-century figure.
  { pattern: /\b(?:truck driver|teamster|lorry driver|haulier|long.haul)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.01 },
  { pattern: /\b(?:taxi driver|cab driver|auto.rickshaw driver|rickshaw puller|uber driver|delivery driver)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.01 },
  { pattern: /\b(?:railway worker|railroad worker|engine driver|brakeman|signalman|locomotive)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.02 },
  { pattern: /\b(?:sailor|deckhand|ship's crew|whaler|sealer|merchant seaman|pearl diver)\b/i, held: 'Male', opensIn: 1980, closedWeight: 0.01 },
  { pattern: /\b(?:airline pilot|aviator|flight engineer)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.02 },
  { pattern: /\b(?:mechanic|auto mechanic|automobile worker|gas station attendant)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.02 },

  // Uniformed and armed work. Formal exclusion, so the closed weight is zero
  // rather than small — with the standing exception of societies that fielded
  // women's units, which the region guard below carves out.
  { pattern: /\b(?:police officer|constable|watchman|gendarme|sheriff)\b/i, held: 'Male', opensIn: 1970, closedWeight: 0 },
  { pattern: /\bfirefighter\b/i, held: 'Male', opensIn: 1980, closedWeight: 0 },
  { pattern: /\b(?:soldier|infantryman|legionary|hoplite|musketeer|trench soldier|marine|cavalry)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.005,
    exceptRegion: /dahomey|abomey|scythia|sarmatia|steppe/i },
  { pattern: /\b(?:knight|samurai|man-at-arms|mercenary|condottiere)\b/i, held: 'Male', opensIn: 2100, closedWeight: 0.005 },
  { pattern: /\b(?:executioner|jailer|gaoler)\b/i, held: 'Male', opensIn: 1990, closedWeight: 0 },

  // The learned professions and public office. Excluded by statute or by
  // guild and university rule for most of their history.
  { pattern: /\b(?:judge|magistrate|barrister|solicitor|lawyer|advocate|notary)\b/i, held: 'Male', opensIn: 1920, openingSpan: 80, closedWeight: 0 },
  { pattern: /\b(?:surgeon|physician|doctor)\b/i, held: 'Male', opensIn: 1900, openingSpan: 90, closedWeight: 0.01 },
  { pattern: /\b(?:civil engineer|engineer|architect|surveyor)\b/i, held: 'Male', opensIn: 1970, closedWeight: 0.01 },
  { pattern: /\b(?:politician|senator|councillor|mayor|governor|minister of|official|magistrate|bureaucrat|mandarin|scribe|clerk of)\b/i, held: 'Male', opensIn: 1920, openingSpan: 80, closedWeight: 0.01 },
  { pattern: /\b(?:university professor|scholar|philosopher|astronomer|jurist)\b/i, held: 'Male', opensIn: 1900, openingSpan: 90, closedWeight: 0.02 },
  { pattern: /\b(?:banker|bank president|wall street banker|investment banker|stockbroker|industrialist|oil baron|robber baron|ceo|tech ceo)\b/i, held: 'Male', opensIn: 1970, openingSpan: 60, closedWeight: 0.01 },
  { pattern: /\b(?:sea captain|caravan master|guild master|foreman|overseer)\b/i, held: 'Male', opensIn: 1970, closedWeight: 0.01 },
  { pattern: /\b(?:film director|hollywood producer|bollywood producer|studio executive)\b/i, held: 'Male', opensIn: 1975, closedWeight: 0.02 },
  // Estate management. Women inherited plantations and haciendas and ran them;
  // they were very rarely hired to manage someone else's.
  { pattern: /\b(?:plantation manager|estate manager|hacienda owner|station owner|mining executive|mining magnate|colonial administrator)\b/i, held: 'Male', opensIn: 1970, closedWeight: 0.02 },

  // Hereditary and appointive titles that are themselves male words. Women
  // ruled often enough, but as rani, begum, queen, empress or dowager — which
  // are separate entries and are not matched here.
  { pattern: /\b(?:maharaja|nawab|raja|sultan|emir|caliph|khan|shah|emperor|king|duke|earl|baron|pasha|effendi|vizier|caudillo|paramount chief|big man|tribal chairman|chieftain)\b/i, held: 'Male', opensIn: 2100, closedWeight: 0.01 },

  // Religious office, where the office itself is sexed. Traditions with women's
  // orders — abbesses, priestesses, nuns, shamans — are not matched here.
  { pattern: /\b(?:priest|bishop|cardinal|pope|imam|mullah|qadi|rabbi|muezzin|ayatollah|sheikh|monk|friar|abbot|deacon|brahmin)\b/i, held: 'Male', opensIn: 1970, openingSpan: 60, closedWeight: 0 },

  // ---------------------------------------------------------------------
  // Work held by women
  // ---------------------------------------------------------------------
  // The other half of the same correction: these should not be handed to men
  // at parity either, and weighting only against women would push every female
  // persona into a shrinking pool of "safe" jobs.
  { pattern: /\b(?:midwife|wet nurse|nurse|nursemaid|nanny|child watcher|governess)\b/i, held: 'Female', opensIn: 1970, closedWeight: 0.02 },
  { pattern: /\b(?:laundress|washerwoman|dhobi|charwoman|scullery maid|housemaid|maid|domestic servant)\b/i, held: 'Female', opensIn: 1970, closedWeight: 0.05 },
  { pattern: /\b(?:spinner|seamstress|embroiderer|lacemaker|textile worker|garment worker|carpet weaver)\b/i, held: 'Female', opensIn: 1900, openingSpan: 100, closedWeight: 0.15 },
  { pattern: /\b(?:market woman|market trader|higgler|fishwife|ale-?wife|alewife)\b/i, held: 'Female', opensIn: 1900, openingSpan: 100, closedWeight: 0.1 },
  { pattern: /\b(?:telephone operator|typist|secretary|stenographer|switchboard)\b/i, held: 'Female', opensIn: 1980, closedWeight: 0.05 },
  { pattern: /\b(?:courtesan|prostitute|geisha|comfort woman)\b/i, held: 'Female', opensIn: 2100, closedWeight: 0.02 },
];

/**
 * How likely this persona is to hold this occupation, relative to someone of
 * the sex that held it. 1 means no adjustment.
 *
 * `declaredBias` is the table's own `genderBias` field, which is honoured but
 * softened: it becomes a strong preference that relaxes after 1970 rather than
 * a permanent bar, so a woman can be an airline pilot in 1995.
 */
export function genderAccessWeight(
  profession: string,
  gender: string,
  year: number,
  options: { declaredBias?: LaborSex; region?: string } = {},
): number {
  // A model built from two-sex records has nothing to say here, and applying it
  // anyway would silently push every non-binary persona into one column.
  if (gender !== 'Male' && gender !== 'Female') return 1;
  const sex = gender as LaborSex;

  let weight = 1;

  const applyRule = (held: LaborSex, opensIn: number, span: number, closed: number): void => {
    if (sex === held) return;
    if (year < opensIn) {
      weight = Math.min(weight, closed);
      return;
    }
    // The climb to parity is convex, not linear.
    //
    // A straight line from the opening year is wrong at both ends, and wrong in
    // the direction that matters most. Surgery opens in 1900 across ninety
    // years, so the linear form gave a woman in 1909 eleven per cent of a
    // man's access to the trade — a rural Arizona surgeon who is a
    // sixty-year-old woman, which is roughly what the app was producing.
    // Women were about five per cent of American physicians in 1910 and a far
    // smaller fraction of surgeons; the first decade after a profession admits
    // women is not a tenth of the way to parity, it is a token.
    //
    // The real shape is a long flat tail followed by a fast rise once training
    // and licensing actually open, which an exponent of 2.5 approximates well:
    // a tenth of the way through a span is 0.3% of parity, half way is 18%,
    // four fifths is 57%.
    const progress = Math.min(1, (year - opensIn) / span);
    weight = Math.min(weight, closed + (1 - closed) * Math.pow(progress, 2.5));
  };

  for (const rule of RULES) {
    if (!rule.pattern.test(profession)) continue;
    if (rule.exceptRegion && options.region && rule.exceptRegion.test(options.region)) continue;
    applyRule(rule.held, rule.opensIn, rule.openingSpan ?? 60, rule.closedWeight ?? 0.02);
  }

  // The table's own flag, for roles no rule above names.
  if (options.declaredBias) {
    applyRule(options.declaredBias, 1970, 60, 0.02);
  }

  return weight;
}

/**
 * Whether this persona is barred outright. Used to skip a role before it is
 * scored, so that a formally closed office never appears at all rather than
 * appearing once in a large enough sample.
 */
export function genderBarsProfession(
  profession: string,
  gender: string,
  year: number,
  options: { declaredBias?: LaborSex; region?: string } = {},
): boolean {
  return genderAccessWeight(profession, gender, year, options) === 0;
}
