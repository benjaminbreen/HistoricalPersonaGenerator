/**
 * constants/gameData/eliteOffices.ts
 *
 * Offices, as a share of the people who held them.
 *
 * `eliteStrata.ts` models the privileged *orders* — hidalguía, szlachta,
 * samurai households, Brahmin lineages — which ran from half a per cent to
 * half the population and are the reason a card can say "Gentry" at all. What
 * had no table was the other axis: not what estate a person was born into but
 * what *office* they held. A stratum is inherited and can be numerous; an
 * office is appointed, and there are a fixed number of them.
 *
 * The absence had two effects. First, the app produced no bishops, generals,
 * magistrates or governors anywhere, ever, which is wrong in the same way that
 * producing too many would be. Second, where such titles did exist in the
 * profession tables they were unreachable: for most societies the status label
 * never matched a table class, so a noble roll drew from the commoner pool and
 * the persona came out a farmer.
 *
 * ---------------------------------------------------------------------------
 * THE FOUR RUNGS
 * ---------------------------------------------------------------------------
 *
 * Frequency here is a per-capita claim, on a population-weighted draw, and each
 * rung is anchored on a count rather than on a feeling:
 *
 *   local     ~1 in 250        Parish priest, village headman, guild master,
 *                              master craftsman with apprentices, ship's
 *                              captain. England c. 1300 had roughly 9,000
 *                              parishes for 4.5M people; a village of 200 has
 *                              one headman. These are *ordinary* — every
 *                              settlement had some — and they come from the
 *                              profession tables, not from this file.
 *
 *   district  ~1 in 2,000      Archdeacon, abbot, county magistrate, tax
 *                              farmer, colonel, head of a merchant house,
 *                              owner of a real firm. One per district rather
 *                              than one per village.
 *
 *   great     ~1 in 75,000     Bishop, general, provincial governor, high
 *                              priest of a major temple, senator, prince or
 *                              princess of a royal house, major-firm chief
 *                              executive. Latin Christendom c. 1300: ~700
 *                              bishoprics for ~70M. Qing China: ~20,000 civil
 *                              officials for 350M+, of whom about twenty were
 *                              provincial governors. Rome: ~600 senators for
 *                              50M+. The modern US: ~650 general and flag
 *                              officers for 330M.
 *
 *   sovereign ~1 in 1,000,000  King, sultan, emperor, shogun, pope. Around
 *                              1500 there were perhaps a few hundred sovereign
 *                              polities for ~450M people.
 *
 * ---------------------------------------------------------------------------
 * THE ONE DELIBERATE LIE
 * ---------------------------------------------------------------------------
 *
 * At honest rates a bishop needs ~75,000 draws and a king ~700,000, so the top
 * two rungs would be dead code that no user would ever see fire. `SPECTACLE`
 * multiplies those two rungs and only those two. It is a departure from
 * demography, made once, in one place, on purpose.
 *
 * What keeps it honest is that the card prints the *true* share, not the
 * boosted one: a king's card says "roughly 1 in a million lives", which is the
 * real number, however soon you happened to roll it. The rarity claim is never
 * false; only the draw is generous.
 *
 * The visible cost is that the boost compresses the middle of the ladder —
 * district (1 in 2,000) and great (1 in 3,000 boosted) come out nearly as
 * common as each other, so a bishop is about as likely as an archdeacon, which
 * he was emphatically not. That is the price of the top rungs existing at all,
 * and it is written down here rather than hidden in a multiplier.
 *
 * Turn `SPECTACLE` to 1 for a demographically true generator.
 *
 * ---------------------------------------------------------------------------
 * WHY THE REALISED RATE RUNS BELOW THE STATED ONE
 * ---------------------------------------------------------------------------
 *
 * A rung whose catalogue is empty for a persona's zone, year and sex yields
 * nothing rather than substituting a neighbour's office, so the rate that comes
 * out the far end of generation is lower than the rate rolled here — currently
 * by around a third. Most of that gap is correct and should stay: there were no
 * provincial governors in the Palaeolithic and no bishops in Polynesia, and
 * inventing one to hit a target share would be precisely the kind of accuracy
 * this table exists to avoid.
 *
 * The part of the gap that was *not* correct was women. Every great office in
 * the catalogue was closed to them, so half the population could reach that rung
 * only as a queen mother in one zone — which is a fact about the catalogue and
 * not about the past. Women of reigning houses were about as numerous as the men
 * of them, and the high priestess held offices no man could. Both are below.
 */

import type { CulturalZone } from '../../types/characterData';

export type EliteTier = 'local' | 'district' | 'great' | 'sovereign';

/** How the rung's personas are produced. */
export type TierSource =
  /** Drawn from the ordinary profession tables; the share is emergent. */
  | 'table'
  /** Rolled up front by `eliteOfficeService`; the share is exact. */
  | 'office-roll';

export interface TierDefinition {
  tier: EliteTier;
  label: string;
  /** True per-capita share, 0–1. Printed on the card; never scaled. */
  trueShare: number;
  /** Whether `SPECTACLE` applies. Only the top two rungs are boosted. */
  boosted: boolean;
  source: TierSource;
  /** What the audit tolerates, as a share band. */
  auditBand: [number, number];
  /** The count the share was anchored on. */
  anchor: string;
}

/**
 * The knob. One number, applied to the great and sovereign rungs only.
 * At 25 a bishop lands near 1 in 3,000 and a crowned head near 1 in 40,000.
 */
export const SPECTACLE = 25;

export const ELITE_TIERS: TierDefinition[] = [
  {
    tier: 'local',
    label: 'local notable',
    trueShare: 1 / 250,
    boosted: false,
    source: 'table',
    auditBand: [1 / 500, 1 / 100],
    anchor: '~9,000 English parishes for ~4.5M people c. 1300; one headman per village',
  },
  {
    tier: 'district',
    label: 'district office',
    trueShare: 1 / 2000,
    boosted: false,
    source: 'office-roll',
    auditBand: [1 / 4000, 1 / 1200],
    anchor: 'one archdeaconry or county bench per several score parishes',
  },
  {
    tier: 'great',
    label: 'great office',
    trueShare: 1 / 75000,
    boosted: true,
    source: 'office-roll',
    auditBand: [1 / 6000, 1 / 1500],
    anchor: '~700 Latin bishoprics for ~70M c. 1300; ~600 Roman senators for 50M+',
  },
  {
    tier: 'sovereign',
    label: 'sovereign',
    trueShare: 1 / 1000000,
    boosted: true,
    source: 'office-roll',
    auditBand: [1 / 90000, 1 / 18000],
    anchor: 'a few hundred sovereign polities for ~450M people c. 1500',
  },
];

/** The rate the sampler actually rolls at, boost included. */
export function drawShare(tier: TierDefinition): number {
  return tier.boosted ? tier.trueShare * SPECTACLE : tier.trueShare;
}

export const tierDefinition = (tier: EliteTier): TierDefinition =>
  ELITE_TIERS.find(t => t.tier === tier)!;

export interface EliteOffice {
  role: string;
  tier: Exclude<EliteTier, 'local'>;
  zones: CulturalZone[];
  yearRange: [number, number];
  /** Matched against "<location> <region>", lowercased. */
  places?: RegExp;
  gender?: 'Male' | 'Female';
  /** Relative odds within the rung, once zone, year and place have filtered. */
  weight: number;
  emoji: string;
  /** Plain-English translation, shown beside the title on the card. */
  gloss: string;
  /**
   * A whole clause replacing "makes his living as a ___", which is nonsense for
   * an office. Must read correctly after "Now 34, he ".
   */
  livelihood: string;
}

/**
 * The catalogue.
 *
 * Titles are the society's own where the app's other tables already use them.
 * Year ranges are deliberately coarse — this is a frequency model, not a
 * constitutional history — but an office does not appear before the institution
 * that appointed it.
 *
 * Weights are within-rung only. They express which office a person who holds
 * one is likely to hold, not how many office-holders there are; that is the
 * rung's business.
 */
export const ELITE_OFFICES: EliteOffice[] = [

  /* ===================================================================== */
  /*  EUROPE                                                               */
  /* ===================================================================== */

  // --- Antiquity
  {
    role: 'Town Councillor', tier: 'district', zones: ['EUROPEAN'], yearRange: [-400, 500],
    gender: 'Male', weight: 10, emoji: '🏛️',
    gloss: 'a decurion of the town council',
    livelihood: 'sits on the council that collects the town\'s taxes and is personally answerable for the shortfall',
  },
  {
    role: 'Centurion', tier: 'district', zones: ['EUROPEAN'], yearRange: [-300, 450],
    gender: 'Male', weight: 8, emoji: '⚔️',
    gloss: 'the officer over eighty men',
    livelihood: 'commands eighty men, and has done in three provinces',
  },
  {
    role: 'Chief Priest', tier: 'great', zones: ['EUROPEAN'], yearRange: [-500, 380],
    weight: 5, emoji: '🏛️',
    gloss: 'the presiding priest of a state cult',
    livelihood: 'presides over the rites the city\'s fortune is held to depend on',
  },
  {
    role: 'Senator', tier: 'great', zones: ['EUROPEAN'], yearRange: [-300, 500],
    gender: 'Male', weight: 8, emoji: '🏛️',
    gloss: 'a member of the Senate',
    livelihood: 'sits in the Senate, and lives on estates worked by hundreds he has never counted',
  },
  {
    role: 'Provincial Governor', tier: 'great', zones: ['EUROPEAN'], yearRange: [-150, 550],
    gender: 'Male', weight: 6, emoji: '📜',
    gloss: 'the emperor\'s deputy in a province',
    livelihood: 'governs a province on the emperor\'s behalf, with a free hand and a short term',
  },
  {
    role: 'Emperor', tier: 'sovereign', zones: ['EUROPEAN'], yearRange: [-27, 1450],
    weight: 4, emoji: '👑',
    gloss: 'the sovereign of the empire',
    livelihood: 'rules an empire, and will most likely be killed by someone in this room',
  },

  // --- Medieval
  {
    role: 'Archdeacon', tier: 'district', zones: ['EUROPEAN'], yearRange: [700, 1900],
    gender: 'Male', weight: 9, emoji: '✝️',
    gloss: 'the bishop\'s officer over a district of parishes',
    livelihood: 'holds the bishop\'s court for a district of parishes, and is disliked by every priest in it',
  },
  {
    role: 'Abbot', tier: 'district', zones: ['EUROPEAN'], yearRange: [550, 1800],
    gender: 'Male', weight: 9, emoji: '⛪',
    gloss: 'the head of a monastery',
    livelihood: 'rules a house of monks and the estates that feed them',
  },
  {
    role: 'Abbess', tier: 'district', zones: ['EUROPEAN'], yearRange: [600, 1800],
    gender: 'Female', weight: 9, emoji: '⛪',
    gloss: 'the head of a convent',
    livelihood: 'rules a house of nuns and its lands, and answers to a bishop who visits rarely',
  },
  {
    role: 'Castellan', tier: 'district', zones: ['EUROPEAN'], yearRange: [850, 1500],
    gender: 'Male', weight: 7, emoji: '🏰',
    gloss: 'the keeper of a castle',
    livelihood: 'holds a castle for a lord who is usually elsewhere',
  },
  {
    role: 'Sheriff', tier: 'district', zones: ['EUROPEAN'], yearRange: [900, 1800],
    gender: 'Male', weight: 7, emoji: '📜',
    gloss: 'the crown\'s officer in a shire',
    livelihood: 'answers to the crown for a whole shire\'s taxes, courts and hue and cry',
  },
  {
    role: 'Bishop', tier: 'great', zones: ['EUROPEAN'], yearRange: [200, 1900],
    gender: 'Male', weight: 12, emoji: '✝️',
    gloss: 'the head of a diocese',
    livelihood: 'holds a diocese, its courts and its revenues, and is a great lord whether or not he wished to be',
  },
  {
    role: 'Count', tier: 'great', zones: ['EUROPEAN'], yearRange: [600, 1800],
    gender: 'Male', weight: 8, emoji: '🛡️',
    gloss: 'a lord of a county',
    livelihood: 'holds a county of the king, and the men in it hold of him',
  },
  {
    role: 'Duke', tier: 'great', zones: ['EUROPEAN'], yearRange: [600, 1900],
    gender: 'Male', weight: 5, emoji: '🛡️',
    gloss: 'a lord of a duchy',
    livelihood: 'holds a duchy, and is a good deal more powerful than the king finds comfortable',
  },
  {
    role: 'Royal Chancellor', tier: 'great', zones: ['EUROPEAN'], yearRange: [800, 1900],
    gender: 'Male', weight: 5, emoji: '📜',
    gloss: 'the keeper of the king\'s seal',
    livelihood: 'keeps the king\'s seal, which means nothing is granted in this realm that he has not read',
  },
  {
    role: 'King', tier: 'sovereign', zones: ['EUROPEAN'], yearRange: [-800, 1950],
    gender: 'Male', weight: 14, emoji: '👑',
    gloss: 'the sovereign of the realm',
    livelihood: 'rules, and lives on what the realm renders up to him',
  },
  {
    role: 'Queen Regnant', tier: 'sovereign', zones: ['EUROPEAN'], yearRange: [1100, 1980],
    gender: 'Female', weight: 8, emoji: '👑',
    gloss: 'the sovereign in her own right',
    livelihood: 'rules in her own right, which half the court has not finished objecting to',
  },
  {
    role: 'Pope', tier: 'sovereign', zones: ['EUROPEAN'], yearRange: [400, 1950],
    gender: 'Male', places: /\b(rome|latium|tiber|italian|italy)\b/, weight: 3, emoji: '✝️',
    gloss: 'the bishop of Rome',
    livelihood: 'sits in the chair of Peter, and disposes of kingdoms from it',
  },

  // --- Early modern and after
  {
    role: 'City Alderman', tier: 'district', zones: ['EUROPEAN'], yearRange: [1300, 1900],
    gender: 'Male', weight: 8, emoji: '🏛️',
    gloss: 'a governing member of the city corporation',
    livelihood: 'sits on the corporation that governs the city, and trades on what that is worth',
  },
  {
    role: 'Cathedral Canon', tier: 'district', zones: ['EUROPEAN'], yearRange: [1000, 1900],
    gender: 'Male', weight: 7, emoji: '✝️',
    gloss: 'a member of a cathedral chapter',
    livelihood: 'holds a stall in the cathedral chapter and the income attached to it',
  },
  {
    role: 'Colonel', tier: 'district', zones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'], yearRange: [1550, 2030],
    gender: 'Male', weight: 8, emoji: '🎖️',
    gloss: 'the officer commanding a regiment',
    livelihood: 'commands a regiment, and is answerable for every man in it',
  },
  {
    role: 'Ambassador', tier: 'great', zones: ['EUROPEAN'], yearRange: [1450, 2030],
    gender: 'Male', weight: 5, emoji: '📜',
    gloss: 'a sovereign\'s representative at a foreign court',
    livelihood: 'represents one sovereign at the court of another, at ruinous personal expense',
  },
  {
    role: 'Admiral', tier: 'great', zones: ['EUROPEAN'], yearRange: [1500, 2030],
    gender: 'Male', weight: 5, emoji: '⚓',
    gloss: 'the officer commanding a fleet',
    livelihood: 'commands a fleet, which is the largest and most expensive thing this kingdom knows how to build',
  },
  {
    role: 'General', tier: 'great', zones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'], yearRange: [1600, 2030],
    gender: 'Male', weight: 9, emoji: '🎖️',
    gloss: 'the officer commanding an army',
    livelihood: 'commands an army, and is spoken of in the newspapers by people who have never met him',
  },
  {
    role: 'Cabinet Minister', tier: 'great', zones: ['EUROPEAN'], yearRange: [1700, 2030],
    gender: 'Male', weight: 8, emoji: '🏛️',
    gloss: 'a minister of the government',
    livelihood: 'holds a ministry, and will hold it for about two years',
  },
  {
    role: 'Archbishop', tier: 'great', zones: ['EUROPEAN'], yearRange: [600, 2030],
    gender: 'Male', weight: 5, emoji: '✝️',
    gloss: 'the bishop over a province of dioceses',
    livelihood: 'sits over a province of dioceses, and crowns whoever is to be crowned',
  },

  /* ===================================================================== */
  /*  EAST ASIA                                                            */
  /* ===================================================================== */

  {
    role: 'County Magistrate', tier: 'district', zones: ['EAST_ASIAN'], yearRange: [-200, 1911],
    gender: 'Male', weight: 12, emoji: '📜',
    gloss: 'the emperor\'s official over a county',
    livelihood: 'is the emperor in one county — judge, tax collector and censor at once — and is posted far from where he was born',
  },
  {
    role: 'Prefect', tier: 'district', zones: ['EAST_ASIAN'], yearRange: [-200, 1911],
    gender: 'Male', weight: 8, emoji: '📜',
    gloss: 'the official over a prefecture',
    livelihood: 'governs a prefecture, and answers upward for every grain of its tax rice',
  },
  {
    role: 'Temple Abbot', tier: 'district', zones: ['EAST_ASIAN'], yearRange: [400, 1950],
    weight: 7, emoji: '🛕',
    gloss: 'the head of a monastery',
    livelihood: 'heads a monastery and the lands endowed to it',
  },
  {
    role: 'Castle Retainer', tier: 'district', zones: ['EAST_ASIAN'], yearRange: [1200, 1868],
    gender: 'Male', weight: 7, emoji: '🏯',
    gloss: 'a senior retainer of a domain lord',
    livelihood: 'holds a senior place in a lord\'s household, on a stipend that has not risen in a century',
  },
  {
    role: 'Provincial Governor', tier: 'great', zones: ['EAST_ASIAN'], yearRange: [-200, 1911],
    gender: 'Male', weight: 8, emoji: '📜',
    gloss: 'the official over a whole province',
    livelihood: 'governs a province of millions on the throne\'s behalf, and memorialises the throne directly',
  },
  {
    role: 'Grand Secretary', tier: 'great', zones: ['EAST_ASIAN'], yearRange: [600, 1911],
    gender: 'Male', weight: 6, emoji: '📜',
    gloss: 'a minister of the central government',
    livelihood: 'drafts what the throne will decide before the throne decides it',
  },
  {
    role: 'Domain Lord', tier: 'great', zones: ['EAST_ASIAN'], yearRange: [1200, 1871],
    gender: 'Male', weight: 7, emoji: '🏯',
    gloss: 'the lord of a domain',
    livelihood: 'holds a domain and the rice it yields, and spends every second year attending on the capital',
  },
  {
    role: 'Emperor', tier: 'sovereign', zones: ['EAST_ASIAN'], yearRange: [-220, 1912],
    weight: 10, emoji: '👑',
    gloss: 'the sovereign of the empire',
    livelihood: 'reigns, and is written about in a language he is not permitted to use about himself',
  },
  {
    role: 'Shogun', tier: 'sovereign', zones: ['EAST_ASIAN'], yearRange: [1192, 1868],
    gender: 'Male', places: /\b(japan|honshu|kansai|kanto|kyushu|shikoku|edo|kyoto|yamato)\b/, weight: 6, emoji: '👑',
    gloss: 'the military ruler of the realm',
    livelihood: 'rules in the emperor\'s name, which is the arrangement everyone has agreed not to examine',
  },

  /* ===================================================================== */
  /*  SOUTH ASIA                                                           */
  /* ===================================================================== */

  {
    role: 'Temple Trustee', tier: 'district', zones: ['SOUTH_ASIAN'], yearRange: [-200, 1950],
    weight: 8, emoji: '🛕',
    gloss: 'a manager of a great temple\'s endowments',
    livelihood: 'administers the lands, jewels and grain of a temple older than any dynasty now standing',
  },
  {
    role: 'Revenue Officer', tier: 'district', zones: ['SOUTH_ASIAN'], yearRange: [300, 1947],
    gender: 'Male', weight: 10, emoji: '📜',
    gloss: 'the official who assesses a district\'s land tax',
    livelihood: 'assesses what a district owes on its land, which makes him the most closely watched man in it',
  },
  {
    role: 'Mansabdar', tier: 'district', zones: ['SOUTH_ASIAN'], yearRange: [1560, 1800],
    gender: 'Male', weight: 8, emoji: '🎖️',
    gloss: 'a ranked officer of the imperial service',
    livelihood: 'holds a rank in the imperial service, reckoned in the horsemen he must bring when called',
  },
  {
    role: 'Subahdar', tier: 'great', zones: ['SOUTH_ASIAN'], yearRange: [1580, 1800],
    gender: 'Male', weight: 7, emoji: '📜',
    gloss: 'the governor of an imperial province',
    livelihood: 'governs an imperial province, with an army of his own and a wary eye toward the capital',
  },
  {
    role: 'Chief Minister', tier: 'great', zones: ['SOUTH_ASIAN'], yearRange: [-300, 1950],
    gender: 'Male', weight: 7, emoji: '📜',
    gloss: 'the ruler\'s principal minister',
    livelihood: 'advises a ruler who cannot govern without him and would rather not admit it',
  },
  {
    role: 'Chief Priest', tier: 'great', zones: ['SOUTH_ASIAN'], yearRange: [-800, 1950],
    gender: 'Male', weight: 6, emoji: '🛕',
    gloss: 'the presiding priest of a great temple',
    livelihood: 'presides over a temple whose rites the kingdom\'s fortune is held to rest on',
  },
  {
    role: 'Maharaja', tier: 'sovereign', zones: ['SOUTH_ASIAN'], yearRange: [-300, 1948],
    gender: 'Male', weight: 12, emoji: '👑',
    gloss: 'a ruling prince',
    livelihood: 'rules, and lives on what the land and its cultivators render up to him',
  },
  {
    role: 'Rani', tier: 'sovereign', zones: ['SOUTH_ASIAN'], yearRange: [-300, 1948],
    gender: 'Female', weight: 6, emoji: '👑',
    gloss: 'a ruling queen',
    livelihood: 'rules a kingdom in her own name, generally because a regency became permanent',
  },

  /* ===================================================================== */
  /*  MENA                                                                 */
  /* ===================================================================== */

  {
    role: 'Qadi', tier: 'district', zones: ['MENA'], yearRange: [650, 1950],
    gender: 'Male', weight: 11, emoji: '⚖️',
    gloss: 'the judge of a town or district',
    livelihood: 'judges by the law of God in a district where everyone knows him and half are related to him',
  },
  {
    role: 'Tax Farmer', tier: 'district', zones: ['MENA'], yearRange: [900, 1900],
    gender: 'Male', weight: 8, emoji: '💰',
    gloss: 'a holder of the right to collect a district\'s taxes',
    livelihood: 'has bought the right to collect a district\'s taxes, and means to collect rather more',
  },
  {
    role: 'Keeper of the Great Mosque', tier: 'district', zones: ['MENA'], yearRange: [700, 1950],
    gender: 'Male', weight: 7, emoji: '🕌',
    gloss: 'the administrator of a congregational mosque',
    livelihood: 'administers a congregational mosque and the endowments that keep it standing',
  },
  {
    role: 'Temple Administrator', tier: 'district', zones: ['MENA'], yearRange: [-3000, 400],
    weight: 8, emoji: '🏛️',
    gloss: 'the manager of a temple\'s estates',
    livelihood: 'keeps the accounts of a temple that owns half the grain in the district',
  },
  {
    role: 'Provincial Governor', tier: 'great', zones: ['MENA'], yearRange: [-2000, 1950],
    gender: 'Male', weight: 10, emoji: '📜',
    gloss: 'the ruler\'s deputy over a province',
    livelihood: 'governs a province in the ruler\'s name, and is recalled about as often as he is replaced',
  },
  {
    role: 'Grand Vizier', tier: 'great', zones: ['MENA'], yearRange: [750, 1922],
    gender: 'Male', weight: 6, emoji: '📜',
    gloss: 'the sovereign\'s chief minister',
    livelihood: 'runs the empire on the sovereign\'s behalf, in a post whose holders are rarely allowed to retire',
  },
  {
    role: 'Chief Judge', tier: 'great', zones: ['MENA'], yearRange: [750, 1950],
    gender: 'Male', weight: 6, emoji: '⚖️',
    gloss: 'the senior judge of the realm',
    livelihood: 'stands at the head of the realm\'s judges, and appoints most of them',
  },
  {
    role: 'High Priest', tier: 'great', zones: ['MENA'], yearRange: [-3000, 400],
    weight: 6, emoji: '🏛️',
    gloss: 'the presiding priest of a great temple',
    livelihood: 'stands between the city and its god, which is a political office as much as a sacred one',
  },
  {
    role: 'Sultan', tier: 'sovereign', zones: ['MENA'], yearRange: [1000, 1924],
    gender: 'Male', weight: 10, emoji: '👑',
    gloss: 'the sovereign of the realm',
    livelihood: 'rules, and is prayed for by name in every mosque in the realm each Friday',
  },
  {
    role: 'Caliph', tier: 'sovereign', zones: ['MENA'], yearRange: [632, 1258],
    gender: 'Male', weight: 5, emoji: '👑',
    gloss: 'the successor to the Prophet',
    livelihood: 'holds an office that claims the whole community of the faithful and rules rather less of it each year',
  },
  {
    role: 'King', tier: 'sovereign', zones: ['MENA'], yearRange: [-3000, 700],
    weight: 8, emoji: '👑',
    gloss: 'the sovereign of the kingdom',
    livelihood: 'rules, and has the fact carved where it will outlast him',
  },

  /* ===================================================================== */
  /*  SOUTHEAST ASIA                                                       */
  /* ===================================================================== */

  {
    role: 'District Chief', tier: 'district', zones: ['SOUTHEAST_ASIAN'], yearRange: [-200, 1950],
    weight: 10, emoji: '📜',
    gloss: 'the head of a district under a ruler',
    livelihood: 'holds a district for a ruler, and forwards its labour and produce upward',
  },
  {
    role: 'Temple Abbot', tier: 'district', zones: ['SOUTHEAST_ASIAN'], yearRange: [400, 1950],
    gender: 'Male', weight: 9, emoji: '🛕',
    gloss: 'the head of a monastery',
    livelihood: 'heads a monastery to which the whole district sends its sons for a season',
  },
  {
    role: 'Harbourmaster', tier: 'district', zones: ['SOUTHEAST_ASIAN'], yearRange: [800, 1900],
    gender: 'Male', weight: 8, emoji: '⚓',
    gloss: 'the officer over a trading port',
    livelihood: 'takes the ruler\'s share of everything that enters the harbour, and knows the price of all of it',
  },
  {
    role: 'Provincial Governor', tier: 'great', zones: ['SOUTHEAST_ASIAN'], yearRange: [-100, 1950],
    weight: 8, emoji: '📜',
    gloss: 'the ruler\'s deputy over a province',
    livelihood: 'governs a province at a distance from the capital that makes his loyalty a live question',
  },
  {
    role: 'Chief Minister', tier: 'great', zones: ['SOUTHEAST_ASIAN'], yearRange: [-100, 1950],
    weight: 6, emoji: '📜',
    gloss: 'the ruler\'s principal minister',
    livelihood: 'stands at the ruler\'s elbow, and is the reason most of what is decided is decided',
  },
  {
    role: 'King', tier: 'sovereign', zones: ['SOUTHEAST_ASIAN'], yearRange: [-200, 1950],
    weight: 10, emoji: '👑',
    gloss: 'the sovereign of the realm',
    livelihood: 'rules a realm whose edges are wherever his officers are still obeyed',
  },

  /* ===================================================================== */
  /*  SUB-SAHARAN AFRICA                                                   */
  /* ===================================================================== */

  {
    role: 'Village Head', tier: 'district', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [-2000, 1950],
    weight: 10, emoji: '📜',
    gloss: 'the head of a group of settlements',
    livelihood: 'answers for a cluster of settlements, and settles what can be settled before it reaches the chief',
  },
  {
    role: 'Caravan Master', tier: 'district', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [700, 1900],
    gender: 'Male', weight: 8, emoji: '🐫',
    gloss: 'the owner and leader of a trading caravan',
    livelihood: 'takes a caravan across the desert twice a year, on credit that would ruin three families if it failed',
  },
  {
    role: 'Chief Jurist of the Town', tier: 'district', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [1000, 1950],
    gender: 'Male', weight: 8, emoji: '📖',
    gloss: 'the senior jurist of a town',
    livelihood: 'teaches the law, writes what the court cannot, and is consulted before anything is decided',
  },
  {
    role: 'War Leader', tier: 'district', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [-1000, 1900],
    gender: 'Male', weight: 8, emoji: '⚔️',
    gloss: 'the commander of a war band',
    livelihood: 'leads the men of the district when they go out, and answers for how many come back',
  },
  {
    role: 'Paramount Chief', tier: 'great', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [-500, 1960],
    weight: 10, emoji: '👑',
    gloss: 'the chief over many chiefs',
    livelihood: 'holds authority over chiefs who each hold authority over districts',
  },
  {
    role: 'Queen Mother', tier: 'great', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [-500, 1960],
    gender: 'Female', weight: 7, emoji: '👑',
    gloss: 'the queen mother, who names the king',
    livelihood: 'holds the office that names the king and can unname him, which is not a ceremonial power',
  },
  {
    role: 'Chief Priest', tier: 'great', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [-1000, 1950],
    weight: 6, emoji: '🔮',
    gloss: 'the presiding priest of a shrine of the whole people',
    livelihood: 'keeps a shrine the whole people depend on, and is consulted before any war',
  },
  {
    role: 'King', tier: 'sovereign', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [-500, 1950],
    weight: 10, emoji: '👑',
    gloss: 'the sovereign of the kingdom',
    livelihood: 'rules, and is separated from ordinary people by rules about who may see him eat',
  },
  {
    role: 'Oba', tier: 'sovereign', zones: ['SUB_SAHARAN_AFRICAN'], yearRange: [1100, 1900],
    gender: 'Male', places: /\b(niger|benin|yoruba|guinea|gulf of guinea|west africa|volta)\b/, weight: 6, emoji: '👑',
    gloss: 'the sacred king of the city',
    livelihood: 'rules a city and its tributaries, in a person held to be more than ordinarily a person',
  },

  /* ===================================================================== */
  /*  SOUTH AMERICA                                                        */
  /* ===================================================================== */

  {
    role: 'Curaca', tier: 'district', zones: ['SOUTH_AMERICAN'], yearRange: [-500, 1800],
    weight: 10, emoji: '📜',
    gloss: 'the lord of a local kin group',
    livelihood: 'heads a kin group that owes labour upward, and is answerable for every day of it',
  },
  {
    role: 'Quipu Keeper', tier: 'district', zones: ['SOUTH_AMERICAN'], yearRange: [-200, 1600],
    gender: 'Male', weight: 8, emoji: '🧶',
    gloss: 'the official who keeps the knotted records',
    livelihood: 'keeps the knotted cords in which the province\'s stores, debts and people are recorded',
  },
  {
    role: 'Temple Steward', tier: 'district', zones: ['SOUTH_AMERICAN'], yearRange: [-1000, 1600],
    weight: 7, emoji: '🛕',
    gloss: 'the manager of a temple\'s stores and lands',
    livelihood: 'keeps the stores of a temple that eats before the district does',
  },
  {
    role: 'Provincial Governor', tier: 'great', zones: ['SOUTH_AMERICAN'], yearRange: [-200, 1900],
    gender: 'Male', weight: 8, emoji: '📜',
    gloss: 'the ruler\'s deputy over a province',
    livelihood: 'governs a province and the roads and storehouses that hold it to the capital',
  },
  {
    role: 'High Priest', tier: 'great', zones: ['SOUTH_AMERICAN'], yearRange: [-1000, 1600],
    weight: 8, emoji: '🛕',
    gloss: 'the presiding priest of the state cult',
    livelihood: 'presides over the cult of the sun, and reads the year in it',
  },
  {
    role: 'Bishop', tier: 'great', zones: ['SOUTH_AMERICAN'], yearRange: [1530, 1950],
    gender: 'Male', weight: 7, emoji: '✝️',
    gloss: 'the head of a colonial diocese',
    livelihood: 'holds a diocese the size of a European kingdom, most of which he will never see',
  },
  {
    role: 'Viceroy', tier: 'great', zones: ['SOUTH_AMERICAN'], yearRange: [1535, 1825],
    gender: 'Male', weight: 6, emoji: '📜',
    gloss: 'the king\'s deputy in the Americas',
    livelihood: 'governs in the king\'s place, eight months\' sailing from anyone who could correct him',
  },
  {
    role: 'Sapa Inca', tier: 'sovereign', zones: ['SOUTH_AMERICAN'], yearRange: [1200, 1572],
    gender: 'Male', places: /\b(andes|cusco|cuzco|titicaca|peru|altiplano|urubamba|quito)\b/, weight: 8, emoji: '👑',
    gloss: 'the sole sovereign',
    livelihood: 'rules, and is held to be the son of the sun, which is the constitutional arrangement rather than a compliment',
  },
  {
    role: 'Priest-King', tier: 'sovereign', zones: ['SOUTH_AMERICAN'], yearRange: [-2000, 900],
    weight: 6, emoji: '👑',
    gloss: 'the ruler who is also the chief priest',
    livelihood: 'rules and sacrifices, the two being one office here',
  },

  /* ===================================================================== */
  /*  NORTH AMERICA                                                        */
  /* ===================================================================== */

  {
    role: 'Village Headman', tier: 'district', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'], yearRange: [-8000, 1700],
    weight: 10, emoji: '📜',
    gloss: 'the leading man of a town',
    livelihood: 'speaks for a town that is not obliged to listen, which is the whole difficulty of the office',
  },
  {
    role: 'Clan Mother', tier: 'district', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'], yearRange: [-1000, 1800],
    gender: 'Female', weight: 9, emoji: '🪶',
    gloss: 'the woman who names and unnames the clan\'s chief',
    livelihood: 'holds the office that appoints the clan\'s chief and may remove him',
  },
  {
    role: 'Keeper of the Rites', tier: 'district', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'], yearRange: [-2000, 1800],
    weight: 8, emoji: '🔮',
    gloss: 'the holder of a ceremony on behalf of the people',
    livelihood: 'holds a ceremony in trust for the whole people, and is the only one who may perform it',
  },
  {
    role: 'Paramount Chief', tier: 'great', zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'], yearRange: [-500, 1700],
    weight: 9, emoji: '👑',
    gloss: 'the chief over many towns',
    livelihood: 'holds authority over towns that each have a chief of their own',
  },
  {
    role: 'Colonial Magistrate', tier: 'district', zones: ['NORTH_AMERICAN_COLONIAL'], yearRange: [1600, 1900],
    gender: 'Male', weight: 10, emoji: '⚖️',
    gloss: 'a justice of the county bench',
    livelihood: 'sits on the county bench, and owns a good deal of the county he sits over',
  },
  {
    role: 'Mission Superior', tier: 'district', zones: ['NORTH_AMERICAN_COLONIAL'], yearRange: [1550, 1850],
    gender: 'Male', weight: 7, emoji: '⛪',
    gloss: 'the head of a mission',
    livelihood: 'runs a mission, its fields and the people the crown has assigned to it',
  },
  {
    role: 'Colonial Governor', tier: 'great', zones: ['NORTH_AMERICAN_COLONIAL', 'SUB_SAHARAN_AFRICAN', 'SOUTHEAST_ASIAN', 'OCEANIA'],
    yearRange: [1550, 1975], gender: 'Male', weight: 9, emoji: '📜',
    gloss: 'the crown\'s governor of a colony',
    livelihood: 'governs a colony for a crown that is months away and will not hear of the difficulties',
  },
  {
    role: 'Bishop', tier: 'great', zones: ['NORTH_AMERICAN_COLONIAL'], yearRange: [1600, 1950],
    gender: 'Male', weight: 6, emoji: '✝️',
    gloss: 'the head of a diocese',
    livelihood: 'holds a diocese scattered across more country than a man can ride in a season',
  },

  /* ===================================================================== */
  /*  OCEANIA                                                              */
  /* ===================================================================== */

  {
    role: 'District Chief', tier: 'district', zones: ['OCEANIA'], yearRange: [-1000, 1950],
    weight: 10, emoji: '📜',
    gloss: 'the chief of a district',
    livelihood: 'holds a district of the island, and renders up to the chief above him',
  },
  {
    role: 'Master Navigator', tier: 'district', zones: ['OCEANIA'], yearRange: [-1500, 1900],
    gender: 'Male', weight: 9, emoji: '🌊',
    gloss: 'a holder of the sailing knowledge',
    livelihood: 'holds the sailing knowledge — stars, swell and bird flight — that perhaps three men in the islands hold',
  },
  {
    role: 'High Priest', tier: 'district', zones: ['OCEANIA'], yearRange: [-1000, 1900],
    weight: 8, emoji: '🔮',
    gloss: 'the priest of the chiefly line\'s rites',
    livelihood: 'keeps the rites the chiefly line depends on, and declares what is forbidden',
  },
  {
    role: 'Paramount Chief', tier: 'great', zones: ['OCEANIA'], yearRange: [-1000, 1950],
    weight: 9, emoji: '👑',
    gloss: 'the chief over a whole island or group',
    livelihood: 'holds a whole island, or several, and a genealogy that explains why',
  },
  {
    role: 'King', tier: 'sovereign', zones: ['OCEANIA'], yearRange: [1750, 1950],
    weight: 6, emoji: '👑',
    gloss: 'the sovereign of the island kingdom',
    livelihood: 'rules an island kingdom that has lately acquired a flag, a treasury and foreign advisers',
  },

  /* ===================================================================== */
  /*  EVERYWHERE THERE WAS PROPERTY                                        */
  /*                                                                       */
  /*  Two offices with no crown attached, held across most of the settled  */
  /*  world for most of its history, and — unlike almost everything above  */
  /*  — open to women. Without them the district rung was reachable for a  */
  /*  European woman only as an abbess, and for a woman almost anywhere    */
  /*  after 1800 not at all, so the realised rate came out at half the     */
  /*  stated one for reasons that were an artefact of the catalogue rather */
  /*  than a fact about the past.                                          */
  /* ===================================================================== */

  {
    role: 'Kinswoman of the Ruler', tier: 'great',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA'],
    yearRange: [-2000, 1950], gender: 'Female', weight: 11, emoji: '👑',
    gloss: 'a woman of the reigning house',
    livelihood: 'belongs to the reigning house, and is married, betrothed or kept unmarried according to what it needs',
  },
  {
    role: 'Kinsman of the Ruler', tier: 'great',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA'],
    yearRange: [-2000, 1950], gender: 'Male', weight: 9, emoji: '👑',
    gloss: 'a man of the reigning house',
    livelihood: 'belongs to the reigning house, which has made him rich, idle and a standing danger to whoever holds the throne',
  },
  {
    role: 'High Priestess', tier: 'great',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA'],
    yearRange: [-3000, 1700], gender: 'Female', weight: 8, emoji: '🔮',
    gloss: 'the presiding priestess of a great shrine',
    livelihood: 'presides over a shrine the whole country depends on, and holds an office no man may hold',
  },
  {
    role: 'Head of a Merchant House', tier: 'district',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL'],
    yearRange: [-500, 2030], weight: 12, emoji: '💰',
    gloss: 'the head of a trading house',
    livelihood: 'stands at the head of a trading house, its ships, its debts and the families that depend on both',
  },
  {
    role: 'Landholder of the District', tier: 'district',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL'],
    yearRange: [-1000, 1980], weight: 12, emoji: '🌾',
    gloss: 'a holder of land worked by others',
    livelihood: 'holds land that a hundred other households work, and settles most of what happens on it',
  },

  /* ===================================================================== */
  /*  THE MODERN WORLD                                                     */
  /*  Titles that are not zone-specific once there are states, firms and   */
  /*  general staffs everywhere.                                           */
  /* ===================================================================== */

  {
    role: 'District Judge', tier: 'district',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    yearRange: [1900, 2030], weight: 9, emoji: '⚖️',
    gloss: 'a judge of the district court',
    livelihood: 'sits on a district bench, and has heard every kind of case this district produces',
  },
  {
    role: 'Company Director', tier: 'district',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    yearRange: [1900, 2030], weight: 10, emoji: '💼',
    gloss: 'a director of a firm',
    livelihood: 'sits on the board of a firm employing a few hundred people, most of whom could not name him',
  },
  {
    role: 'Mayor', tier: 'district',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    yearRange: [1850, 2030], weight: 8, emoji: '🏛️',
    gloss: 'the elected head of a town',
    livelihood: 'runs a town, which is mostly drains, permits and a budget that does not stretch',
  },
  {
    role: 'Chief Executive', tier: 'great',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    yearRange: [1920, 2030], weight: 9, emoji: '💼',
    gloss: 'the head of a major firm',
    livelihood: 'runs a firm large enough that its share price is read as news about the country',
  },
  {
    role: 'General', tier: 'great',
    zones: ['EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA'],
    yearRange: [1850, 2030], gender: 'Male', weight: 8, emoji: '🎖️',
    gloss: 'the officer commanding an army',
    livelihood: 'commands an army in a country where that is never only a military position',
  },
  {
    role: 'Cabinet Minister', tier: 'great',
    zones: ['EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    yearRange: [1900, 2030], weight: 8, emoji: '🏛️',
    gloss: 'a minister of the government',
    livelihood: 'holds a ministry, and is photographed getting out of cars',
  },
  {
    role: 'Head of State', tier: 'sovereign',
    zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    yearRange: [1900, 2030], weight: 10, emoji: '👑',
    gloss: 'the head of state',
    livelihood: 'is the head of a state, and is recognised on sight by people who have never met anyone else in this account',
  },
];

/**
 * The local rung, which is not in the catalogue.
 *
 * These come from the ordinary profession tables — every settlement had a
 * headman, a priest and a master of some craft, so they are common enough that
 * an up-front roll would be the wrong mechanism. The pattern exists so the
 * audit can measure a share the tables produce emergently, and it is
 * deliberately narrow: authority over other people in one settlement, not any
 * respectable trade.
 */
export const LOCAL_NOTABLE = /\b(?:headman|village head|village chief|chief|elder|priest|imam|rabbi|abbot|abbess|guild master|master mason|reeve|bailiff|constable|magistrate|griot|diviner|kahuna|tohunga|shaman|oracle)\b/i;

/** Every office title the catalogue can produce, for audits and for the tables. */
export function allEliteOfficeRoles(): string[] {
  return [...new Set(ELITE_OFFICES.map(o => o.role))];
}

/**
 * The card grammar for office titles: "he makes his living as a bishop" is
 * wrong in the same way "as a maharaja" is. Keyed by role, so it merges with
 * `STANDING_ROLES` in professions.ts.
 */
export const ELITE_OFFICE_STANDINGS: Record<string, { gloss: string; livelihood: string }> =
  Object.fromEntries(ELITE_OFFICES.map(o => [o.role, { gloss: o.gloss, livelihood: o.livelihood }]));
