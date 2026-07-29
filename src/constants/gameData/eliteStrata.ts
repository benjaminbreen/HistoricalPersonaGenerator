/**
 * constants/gameData/eliteStrata.ts
 *
 * The privileged orders, as a share of the population that held them.
 *
 * `populationStrata.ts` models who was owned, indentured, tied to the crop or
 * deported, with per-place shares that vary by a factor of fifteen between
 * neighbouring colonies. There was no matching table for the other end, so the
 * generator carried one number for the whole of humanity — `noble: 0.005` in
 * every era, every culture, every place — and a two-thousand-persona audit
 * returned 0.45% noble by wealth and 1.9% elite by social station, everywhere,
 * always. The app modelled who was owned with great care and who owned with
 * none.
 *
 * That flat number is not a conservative estimate, it is a wrong one, and the
 * error is largest exactly where the sources are best. The Castilian census of
 * 1591 returns roughly one household in ten as hidalgo, and in the northern
 * provinces — Asturias, Cantabria, Vizcaya — hidalguía was claimed by most of
 * the population and recognised in law for all natives of Vizcaya. The
 * szlachta of Poland-Lithuania ran near a tenth; Hungary's nemesség about a
 * twentieth; Tokugawa samurai households roughly one in sixteen; Joseon
 * yangban rising past a tenth by the eighteenth century. Against them, English
 * gentry and peerage together sat near 2% and the Russian dvoryanstvo near 1%.
 * An order of magnitude of variation was being flattened to a single figure.
 *
 * Two things this table is careful about:
 *
 * **Privilege is not money.** The most famous fact about the hidalgo is that he
 * was frequently penniless — the estate was a legal condition, exemption from
 * direct taxation and the right to be addressed as *don*, not an income. So
 * each stratum carries a wealth *distribution* rather than a wealth level, and
 * several of them are weighted toward the bottom.
 *
 * **The society's own word.** A samurai is not a knight and a kuraka is not a
 * baron. The status label is the term the society used, and it is what the card
 * prints.
 *
 * Shares are order-of-magnitude claims from census figures where they exist
 * (Castile 1591, Japan's shūmon aratame chō, the Polish and Hungarian noble
 * censuses) and from the secondary literature where they do not. They are meant
 * to be argued with, which is why each one is written down separately rather
 * than being derived from a rule.
 */

import type { CulturalZone } from '../../types/characterData';
import type { WealthLevel } from '../../types';

export interface EliteStratum {
  id: string;
  /** Human-readable, for audits. */
  label: string;
  zones: CulturalZone[];
  yearRange: [number, number];
  /** Matched against "<location> <region>", lowercased. */
  places?: RegExp;
  /** Share of the local population holding this standing, 0–1. */
  share: number;
  /** The society's own word for it. This is what the badge shows. */
  statusLabel: string;
  /**
   * How the estate's own wealth was distributed. Privilege and money are
   * different axes and this table exists to keep them apart.
   */
  wealth: Array<[WealthLevel, number]>;
  /** Trades and offices, never the status itself. */
  roles: Array<{ role: string; weight: number; gender?: 'Male' | 'Female' }>;
  /** One sentence for the card, in the register of the rest of the app. */
  clause: string;
}

const ARMS: Array<{ role: string; weight: number; gender?: 'Male' | 'Female' }> = [
  { role: 'Cavalry Officer', weight: 8, gender: 'Male' },
  { role: 'Captain of Foot', weight: 5, gender: 'Male' },
];

export const ELITE_STRATA: EliteStratum[] = [

  /* ===================================================================== */
  /*  EUROPE                                                               */
  /* ===================================================================== */

  {
    id: 'castile-hidalguia',
    label: 'the hidalguía of Castile',
    zones: ['EUROPEAN'],
    yearRange: [1450, 1830],
    // The place strings this matches are the app's own — region names like
    // "Iberian Peninsula" and locations like "Toledo Plateau" — rather than
    // the historical names, which appear nowhere in the geography tables. The
    // Cantabrian entry below takes Galicia, so it is left out here.
    places: /\b(andalusian|toledo|ebro|catalonian|lisbon|gibraltar|castile|spain|aragon)\b/,
    // The 1591 census returns about one household in ten. The figure is a
    // national average over a country where the north was nearly all hidalgo
    // and the southern latifundia almost none.
    share: 0.10,
    statusLabel: 'Hidalgo',
    // The penniless hidalgo is not a literary joke, he is the modal case: the
    // estate exempted a man from direct taxation and from the humiliation of
    // manual labour, and gave him nothing to eat.
    wealth: [['poor', 0.3], ['modest', 0.31], ['comfortable', 0.22], ['wealthy', 0.14], ['noble', 0.03]],
    roles: [
      { role: 'Estate Holder', weight: 10 },
      { role: 'Letrado', weight: 6 },
      { role: 'Notary', weight: 6 },
      { role: 'Parish Priest', weight: 5, gender: 'Male' },
      { role: 'Household Manager', weight: 6, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'The hidalguía exempts the household from direct taxation and from any work done with the hands, which is not the same as putting food on the table.',
  },
  {
    id: 'north-spain-hidalguia',
    label: 'universal hidalguía in the Cantabrian north',
    zones: ['EUROPEAN'],
    yearRange: [1450, 1830],
    // Of the Cantabrian arc the app's geography carries only Galicia, so this
    // stands in for the whole northern belt of near-universal hidalguía.
    places: /\b(galicia|asturias|cantabria|vizcaya|biscay|basque|navarre)\b/,
    // Vizcaya recognised the hidalguía of every native in law; Asturias and
    // Cantabria returned majorities in the census. This is the single largest
    // share in the table and it is the best documented.
    share: 0.55,
    statusLabel: 'Hidalgo of the Fueros',
    wealth: [['poor', 0.42], ['modest', 0.34], ['comfortable', 0.16], ['wealthy', 0.07], ['noble', 0.01]],
    roles: [
      { role: 'Smallholder', weight: 14 },
      { role: 'Ironworks Hand', weight: 8 },
      { role: 'Mariner', weight: 8, gender: 'Male' },
      { role: 'Notary', weight: 4 },
      { role: 'Household Manager', weight: 8, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'Every native of the province is noble by the fuero, which settles precedence at Mass and nothing else — the fields still have to be worked.',
  },
  {
    id: 'poland-szlachta',
    label: 'the szlachta of the Commonwealth',
    zones: ['EUROPEAN'],
    yearRange: [1450, 1795],
    // The Commonwealth's territory in the app's vocabulary: the Carpathian and
    // Tatra uplands, the Dnieper corridor and the steppe frontier.
    places: /\b(tatra|carpathian ridge|carpathian foothills|dnieper|steppe borderlands|poland|lithuania|masovia|volhynia|podolia)\b/,
    // Between 8 and 10% of the Commonwealth's population, and higher in
    // Masovia, where whole villages of gołota nobles farmed their own land.
    share: 0.085,
    statusLabel: 'Szlachcic',
    wealth: [['poor', 0.28], ['modest', 0.32], ['comfortable', 0.22], ['wealthy', 0.15], ['noble', 0.03]],
    roles: [
      { role: 'Landholder', weight: 12 },
      { role: 'Estate Steward', weight: 6 },
      { role: 'Sejmik Deputy', weight: 3, gender: 'Male' },
      { role: 'Household Manager', weight: 7, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'The vote in the sejmik belongs to the household whether or not there is a serf on the land to pay for the journey.',
  },
  {
    id: 'hungary-nemesseg',
    label: 'the Hungarian nemesség',
    zones: ['EUROPEAN'],
    yearRange: [1450, 1848],
    places: /\b(danube bend|vienna basin|moravian gate|hungary|magyar|transylvania|pannonia)\b/,
    share: 0.05,
    statusLabel: 'Nemes',
    wealth: [['poor', 0.3], ['modest', 0.33], ['comfortable', 0.21], ['wealthy', 0.13], ['noble', 0.03]],
    roles: [
      { role: 'Landholder', weight: 12 },
      { role: 'County Assessor', weight: 5 },
      { role: 'Household Manager', weight: 7, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'The sandalled nobility — noble by letter, farming their own strips, and exempt from the tax the neighbours pay.',
  },
  {
    id: 'england-gentry',
    label: 'the English gentry and peerage',
    zones: ['EUROPEAN'],
    yearRange: [1450, 1900],
    places: /\b(british isles|london|edinburgh|york|oxfordshire|thames|leinster|dover|hadrian)\b/,
    // Gregory King's 1688 scheme puts temporal lords, baronets, knights,
    // esquires and gentlemen together at something near 2% of families.
    share: 0.02,
    statusLabel: 'Gentleman',
    wealth: [['poor', 0.04], ['modest', 0.16], ['comfortable', 0.35], ['wealthy', 0.35], ['noble', 0.1]],
    roles: [
      { role: 'Landowner', weight: 12 },
      { role: 'Justice of the Peace', weight: 6, gender: 'Male' },
      { role: 'Barrister', weight: 5 },
      { role: 'Rector', weight: 5, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'The family bears arms, sits on the bench, and is addressed as gentle by everyone in the parish who wants anything.',
  },
  {
    id: 'italian-patriciate',
    label: 'the urban patriciates of Italy',
    zones: ['EUROPEAN'],
    yearRange: [1250, 1800],
    places: /\b(italy|venetian|florence|roman campagna|apennine|naples|po valley)\b/,
    // Venice's Great Council families were a closed caste of about 2% of the
    // city after the Serrata of 1297.
    share: 0.025,
    statusLabel: 'Patrician',
    wealth: [['poor', 0.05], ['modest', 0.15], ['comfortable', 0.3], ['wealthy', 0.38], ['noble', 0.12]],
    roles: [
      { role: 'Merchant Banker', weight: 10 },
      { role: 'Council Member', weight: 6, gender: 'Male' },
      { role: 'Galley Owner', weight: 5 },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The name is in the Book, which decides what may be worn, whom the children may marry, and which offices are open.',
  },
  {
    id: 'russia-dvoryanstvo',
    label: 'the Russian service nobility',
    zones: ['EUROPEAN'],
    yearRange: [1600, 1917],
    places: /\b(moscow|volga|novgorod|ural|white sea|siberia|russia|muscovy)\b/,
    share: 0.012,
    statusLabel: 'Dvoryanin',
    wealth: [['poor', 0.12], ['modest', 0.22], ['comfortable', 0.28], ['wealthy', 0.28], ['noble', 0.1]],
    roles: [
      { role: 'Serving Officer', weight: 10, gender: 'Male' },
      { role: 'Estate Holder', weight: 10 },
      { role: 'Provincial Official', weight: 6 },
      { role: 'Mistress of the Estate', weight: 8, gender: 'Female' },
    ],
    clause: 'Rank is held from the Table of Ranks and therefore from the state, which can give it and can take it back.',
  },
  {
    id: 'medieval-knightly',
    label: 'the knightly class of Latin Christendom',
    zones: ['EUROPEAN'],
    yearRange: [950, 1500],
    share: 0.02,
    statusLabel: 'Of the Knightly Class',
    wealth: [['poor', 0.08], ['modest', 0.22], ['comfortable', 0.32], ['wealthy', 0.29], ['noble', 0.09]],
    roles: [
      { role: 'Knight', weight: 10, gender: 'Male' },
      { role: 'Manor Holder', weight: 10 },
      { role: 'Squire', weight: 5, gender: 'Male' },
      { role: 'Lady of the Manor', weight: 8, gender: 'Female' },
    ],
    clause: 'The household owes mounted service for its land, and eats what the tenants of that land can be made to render.',
  },


  /* ===================================================================== */
  /*  ANTIQUITY                                                            */
  /*                                                                       */
  /*  Two fifths of everyone the app generates lived before 500 CE, and    */
  /*  the first version of this table reached almost none of them: the     */
  /*  measured elite share in antiquity was 0.58% against 4.8% in the      */
  /*  early modern period, which said less about the ancient world than    */
  /*  about which centuries have census records. Ancient states were not   */
  /*  flatter than early modern ones. They were differently documented.    */
  /* ===================================================================== */

  {
    id: 'roman-curial',
    label: 'the curial and equestrian orders of Rome',
    zones: ['EUROPEAN', 'MENA'],
    yearRange: [-200, 500],
    // Decurions — the town councillors liable for their city's taxes out of
    // their own pockets — plus the equestrian order above them. Together a
    // small but genuinely empire-wide class, which is why this entry carries
    // no place restriction where the others do.
    share: 0.02,
    statusLabel: 'Of the Curial Order',
    wealth: [['poor', 0.03], ['modest', 0.15], ['comfortable', 0.34], ['wealthy', 0.38], ['noble', 0.1]],
    roles: [
      { role: 'Decurion', weight: 9, gender: 'Male' },
      { role: 'Estate Holder', weight: 10 },
      { role: 'Tax Farmer', weight: 5 },
      { role: 'Magistrate', weight: 5, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The council seat is hereditary and so is the liability that comes with it: the town\'s taxes are owed whether or not they can be collected.',
  },
  {
    id: 'greek-citizen-body',
    label: 'the citizen body of the Greek polis',
    zones: ['EUROPEAN'],
    yearRange: [-700, -30],
    places: /\b(greece|aegean|athens|peloponnesian|thessalian|crete|sicily|cyprus|delos|olympus)\b/,
    // Citizenship is the sharpest privilege in the classical world and the one
    // most often left out of a class scheme, because it is not wealth: a thes
    // rowing in the fleet and a landed hippeus are the same legal order. Adult
    // male citizens with their households ran perhaps an eighth of the residents
    // of a classical polis, the rest being metics, freedmen and the enslaved.
    share: 0.12,
    statusLabel: 'Of the Citizen Body',
    wealth: [['poor', 0.3], ['modest', 0.34], ['comfortable', 0.2], ['wealthy', 0.13], ['noble', 0.03]],
    roles: [
      { role: 'Smallholder', weight: 12 },
      { role: 'Hoplite', weight: 8, gender: 'Male' },
      { role: 'Potter', weight: 6 },
      { role: 'Assembly Member', weight: 5, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The vote in the assembly and the right to own land both rest on descent from citizens on both sides, which most people in the city cannot claim.',
  },
  {
    id: 'han-tang-officialdom',
    label: 'the official households of early imperial China',
    zones: ['EAST_ASIAN'],
    yearRange: [-200, 1000],
    places: /\b(north china plain|yellow river|shandong|loess|beijing|taihang|hebei|south china|yangtze|pearl river|fujian|guangxi|sichuan|yunnan|wuyi)\b/,
    share: 0.015,
    statusLabel: 'Of an Official Household',
    wealth: [['poor', 0.06], ['modest', 0.2], ['comfortable', 0.32], ['wealthy', 0.32], ['noble', 0.1]],
    roles: [
      { role: 'Clerk of the Prefecture', weight: 8 },
      { role: 'Landholder', weight: 10 },
      { role: 'Court Scholar', weight: 5, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The household is registered as serving rather than as taxed, and keeps that standing exactly as long as somebody in it holds office.',
  },
  {
    id: 'persian-azadan',
    label: 'the azadan of the Iranian empires',
    zones: ['MENA'],
    yearRange: [-550, 650],
    places: /\b(persian plateau|isfahan|zagros|caspian|dasht|shiraz|alborz|khuzestan|mesopotamia|babylon|nineveh|tigris|diyala|caucasus|tbilisi|kura)\b/,
    share: 0.02,
    statusLabel: 'Azad',
    wealth: [['poor', 0.08], ['modest', 0.22], ['comfortable', 0.3], ['wealthy', 0.31], ['noble', 0.09]],
    roles: [
      { role: 'Cavalryman of the Levy', weight: 10, gender: 'Male' },
      { role: 'Estate Holder', weight: 10 },
      { role: 'Fire-Temple Patron', weight: 5 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The free-born owe the king a horse and a rider, and hold their land on that understanding and no other.',
  },
  {
    id: 'egyptian-scribal',
    label: 'the scribal class of Egypt',
    zones: ['MENA'],
    yearRange: [-3000, 400],
    places: /\b(nile delta|thebes|faiyum|aswan|alexandria|eastern desert|nubian)\b/,
    // Literacy itself is the privilege: perhaps one person in a hundred could
    // write, and the ones who could did not carry stone.
    share: 0.015,
    statusLabel: 'Of the Scribal Class',
    wealth: [['poor', 0.08], ['modest', 0.26], ['comfortable', 0.34], ['wealthy', 0.26], ['noble', 0.06]],
    roles: [
      { role: 'Scribe of the Granary', weight: 10 },
      { role: 'Temple Accountant', weight: 8 },
      { role: 'Overseer of Works', weight: 6, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 6, gender: 'Female' },
    ],
    clause: 'The reed pen is the whole of it: a man who can write does not dig, and says so in his own tomb inscription.',
  },
  {
    id: 'mesopotamian-temple',
    label: 'the temple and palace households of Mesopotamia',
    zones: ['MENA'],
    yearRange: [-3000, -300],
    places: /\b(mesopotamia|babylon|nineveh|tigris|marsh arab|diyala|zagros)\b/,
    share: 0.02,
    statusLabel: 'Of the Temple Household',
    wealth: [['poor', 0.1], ['modest', 0.26], ['comfortable', 0.32], ['wealthy', 0.26], ['noble', 0.06]],
    roles: [
      { role: 'Temple Administrator', weight: 9 },
      { role: 'Tablet Scribe', weight: 8 },
      { role: 'Priestess of the Household God', weight: 7, gender: 'Female' },
      { role: 'Land Steward', weight: 7 },
    ],
    clause: 'The household eats from the god\'s fields, which is a claim on the harvest that outlasts any particular king.',
  },
  {
    id: 'vedic-kshatriya',
    label: 'kshatriya lineages',
    zones: ['SOUTH_ASIAN'],
    yearRange: [-1200, 1200],
    share: 0.04,
    statusLabel: 'Kshatriya',
    wealth: [['poor', 0.18], ['modest', 0.3], ['comfortable', 0.26], ['wealthy', 0.2], ['noble', 0.06]],
    roles: [
      { role: 'Charioteer', weight: 6, gender: 'Male' },
      { role: 'Village Chief', weight: 8 },
      { role: 'Landholder', weight: 9 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The lineage is expected to fight and to protect, and reckons its standing in cattle and in the length of the genealogy.',
  },
  {
    id: 'maya-ajaw',
    label: 'the ajaw lineages of the Maya lowlands',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    yearRange: [250, 950],
    places: /\b(mayan lowlands|yucat|central america|mosquito|panama|darien)\b/,
    share: 0.04,
    statusLabel: 'Of the Ajaw Lineage',
    wealth: [['poor', 0.1], ['modest', 0.26], ['comfortable', 0.32], ['wealthy', 0.26], ['noble', 0.06]],
    roles: [
      { role: 'Scribe of the Court', weight: 8 },
      { role: 'War Captain', weight: 6, gender: 'Male' },
      { role: 'Keeper of the Long Count', weight: 6 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The lineage is carved into the stelae with its accession dates, which is both the record and the point of it.',
  },
  {
    id: 'steppe-ruling-clan',
    label: 'the ruling clans of the steppe',
    zones: ['EAST_ASIAN'],
    yearRange: [-300, 1500],
    places: /\b(mongolian|manchurian|gobi|kazakh|altai|aral|tian shan|dzungarian|xinjiang|tarim|kunlun|qaidam|siberia)\b/,
    // Steppe polities were shallow but not flat: the ruling clans and their
    // retinues were a real order, and a larger fraction of a small population
    // than any settled aristocracy.
    share: 0.04,
    statusLabel: 'Of the Ruling Clan',
    wealth: [['poor', 0.16], ['modest', 0.3], ['comfortable', 0.28], ['wealthy', 0.21], ['noble', 0.05]],
    roles: [
      { role: 'Retainer of the Khan', weight: 9, gender: 'Male' },
      { role: 'Herd Master', weight: 10 },
      { role: 'Keeper of the Standard', weight: 5 },
      { role: 'Mistress of the Camp', weight: 8, gender: 'Female' },
    ],
    clause: 'The clan takes its share of the tribute and the pasture first, and is expected to be first into the field for it.',
  },

  /* ===================================================================== */
  /*  THE MIDDLE EAST AND NORTH AFRICA                                     */
  /* ===================================================================== */

  {
    id: 'ottoman-askeri',
    label: 'the Ottoman askerî',
    zones: ['MENA'],
    yearRange: [1400, 1840],
    places: /\b(anatolia|cappadocian|pontic|cilician|tarsus|bosporus|levant|jerusalem|bekaa|galilee|mount lebanon|golan|dead sea|nile delta|alexandria|thebes|mesopotamia|nineveh|babylon|tigris|diyala|maghreb|tunisian|tripolitania|rif|fez|atlas)\b/,
    // The askerî — the military and administrative estate, tax-exempt by
    // definition — was a large privileged order, not a thin aristocracy.
    share: 0.06,
    statusLabel: 'Askerî',
    wealth: [['poor', 0.12], ['modest', 0.3], ['comfortable', 0.3], ['wealthy', 0.23], ['noble', 0.05]],
    roles: [
      { role: 'Timar Holder', weight: 9, gender: 'Male' },
      { role: 'Janissary', weight: 8, gender: 'Male' },
      { role: 'Kadi', weight: 5, gender: 'Male' },
      { role: 'Scribe of the Divan', weight: 6 },
      { role: 'Household Manager', weight: 7, gender: 'Female' },
    ],
    clause: 'The askerî pay no tax; they are the ones the tax is collected for, which is the whole distinction in Ottoman law.',
  },
  {
    id: 'sayyid-lineage',
    label: 'the lineages of the Prophet',
    // Split from the South Asian entry below rather than sharing one share:
    // the same claim of descent covers a much smaller fraction of a mostly
    // non-Muslim population, and the earlier single entry was handing sayyid
    // standing to Hindu households in twelfth-century Kashmir.
    zones: ['MENA'],
    yearRange: [800, 1900],
    share: 0.03,
    statusLabel: 'Sayyid',
    wealth: [['poor', 0.24], ['modest', 0.32], ['comfortable', 0.24], ['wealthy', 0.16], ['noble', 0.04]],
    roles: [
      { role: 'Keeper of the Shrine', weight: 8 },
      { role: 'Teacher of the Law', weight: 7 },
      { role: 'Landholder', weight: 8 },
      { role: 'Household Manager', weight: 7, gender: 'Female' },
    ],
    clause: 'The descent is from the Prophet, which is a claim about honour rather than about property, and the registers of it are contested.',
  },
  {
    id: 'mamluk-egypt',
    label: 'the Mamluk household of Egypt and Syria',
    zones: ['MENA'],
    yearRange: [1250, 1811],
    places: /\b(nile delta|thebes|faiyum|aswan|alexandria|eastern desert|levant|jerusalem|bekaa|galilee|mount lebanon|dead sea|golan)\b/,
    share: 0.008,
    statusLabel: 'Mamluk',
    wealth: [['poor', 0.05], ['modest', 0.2], ['comfortable', 0.3], ['wealthy', 0.35], ['noble', 0.1]],
    roles: [
      { role: 'Cavalryman of the Household', weight: 12, gender: 'Male' },
      { role: 'Amir of Ten', weight: 4, gender: 'Male' },
      { role: 'Household Manager', weight: 5, gender: 'Female' },
    ],
    clause: 'Bought as a boy, trained in the barracks, freed into the household that bought him — a ruling class that cannot inherit itself.',
  },

  /* ===================================================================== */
  /*  SOUTH ASIA                                                           */
  /* ===================================================================== */

  {
    id: 'brahmin',
    label: 'Brahmin lineages',
    zones: ['SOUTH_ASIAN'],
    yearRange: [-500, 1900],
    // Brahmins ran near 5-6% of the subcontinent's population, with wide
    // regional variation, and were very far from uniformly prosperous.
    share: 0.055,
    statusLabel: 'Brahmin',
    wealth: [['poor', 0.28], ['modest', 0.32], ['comfortable', 0.22], ['wealthy', 0.15], ['noble', 0.03]],
    roles: [
      { role: 'Temple Priest', weight: 9, gender: 'Male' },
      { role: 'Village Accountant', weight: 7 },
      { role: 'Sanskrit Teacher', weight: 6 },
      { role: 'Astrologer', weight: 5 },
      { role: 'Keeper of the Household Rites', weight: 7, gender: 'Female' },
    ],
    clause: 'The rank is ritual and it is inherited; whether it comes with land is a separate question and the answer is often no.',
  },
  {
    id: 'rajput-lineage',
    label: 'Rajput clans',
    zones: ['SOUTH_ASIAN'],
    yearRange: [900, 1900],
    places: /\b(thar desert|rann of kutch|malwa|vindhya|punjab plains|delhi region|salt range|rajasthan|marwar|mewar)\b/,
    share: 0.08,
    statusLabel: 'Rajput',
    wealth: [['poor', 0.25], ['modest', 0.3], ['comfortable', 0.24], ['wealthy', 0.17], ['noble', 0.04]],
    roles: [
      { role: 'Thakur of the Village', weight: 8, gender: 'Male' },
      { role: 'Retainer', weight: 9, gender: 'Male' },
      { role: 'Landholder', weight: 8 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The clan holds land by the sword and remembers the genealogy that says so, in more detail than it remembers the harvest.',
  },
  {
    id: 'mughal-mansabdar',
    label: 'the Mughal mansabdars',
    zones: ['SOUTH_ASIAN'],
    yearRange: [1560, 1760],
    share: 0.004,
    statusLabel: 'Mansabdar',
    wealth: [['modest', 0.08], ['comfortable', 0.22], ['wealthy', 0.5], ['noble', 0.2]],
    roles: [
      { role: 'Holder of Rank', weight: 10, gender: 'Male' },
      { role: 'Revenue Official', weight: 7 },
      { role: 'Mistress of the Household', weight: 6, gender: 'Female' },
    ],
    clause: 'The rank is numbered, the pay is drawn on an assignment of revenue, and both revert to the emperor at death.',
  },

  {
    id: 'sayyid-south-asia',
    label: 'sayyid and ashraf lineages in South Asia',
    zones: ['SOUTH_ASIAN'],
    // From the establishment of the Delhi Sultanate rather than from the first
    // Arab presence in Sindh: the claim only becomes a social order where there
    // is a Muslim political class for it to sit inside.
    yearRange: [1200, 1900],
    share: 0.012,
    statusLabel: 'Sayyid',
    wealth: [['poor', 0.22], ['modest', 0.32], ['comfortable', 0.26], ['wealthy', 0.16], ['noble', 0.04]],
    roles: [
      { role: 'Keeper of the Shrine', weight: 8 },
      { role: 'Teacher of the Law', weight: 7 },
      { role: 'Landholder', weight: 8 },
      { role: 'Household Manager', weight: 7, gender: 'Female' },
    ],
    clause: 'The descent is from the Prophet, written into the household genealogy and worth a marriage alliance in any town along the road.',
  },

  /* ===================================================================== */
  /*  EAST ASIA                                                            */
  /* ===================================================================== */

  {
    id: 'tokugawa-samurai',
    label: 'the samurai estate of Tokugawa Japan',
    zones: ['EAST_ASIAN'],
    yearRange: [1600, 1876],
    places: /\b(japan|kyoto basin|edo plain|inland sea|mount fuji|tohoku|nara uplands|hokkaido)\b/,
    // Something near 6% of the population, and the great majority of them
    // stipendiary rather than landed — the poor samurai is a stock figure of
    // the period's own literature for good reason.
    share: 0.06,
    statusLabel: 'Samurai',
    wealth: [['poor', 0.22], ['modest', 0.34], ['comfortable', 0.24], ['wealthy', 0.16], ['noble', 0.04]],
    roles: [
      { role: 'Stipended Retainer', weight: 12, gender: 'Male' },
      { role: 'Castle Clerk', weight: 8 },
      { role: 'Fencing Instructor', weight: 4, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The stipend is measured in rice and has not risen in a century; the two swords are still worn every day.',
  },
  {
    id: 'joseon-yangban',
    label: 'the yangban of Joseon Korea',
    zones: ['EAST_ASIAN'],
    yearRange: [1400, 1894],
    places: /\b(korea|han river|kaesong|gyeongju|jeolla|baekdu|busan)\b/,
    // The household registers show the yangban share climbing steeply across
    // the eighteenth century as status was purchased and claimed; this is a
    // mid-period figure and the late-period one would be far higher.
    share: 0.09,
    statusLabel: 'Yangban',
    wealth: [['poor', 0.2], ['modest', 0.32], ['comfortable', 0.26], ['wealthy', 0.18], ['noble', 0.04]],
    roles: [
      { role: 'Examination Candidate', weight: 9, gender: 'Male' },
      { role: 'Landholder', weight: 10 },
      { role: 'Village Elder', weight: 6 },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The household keeps a genealogy and a claim to office, and studies for an examination most of its sons will not pass.',
  },
  {
    id: 'china-degree-gentry',
    label: 'the degree-holding gentry of China',
    zones: ['EAST_ASIAN'],
    yearRange: [1000, 1905],
    places: /\b(north china plain|yellow river|shandong|loess|beijing|taihang|hebei|south china|yangtze|pearl river|fujian|guangxi|hainan|wuyi|sichuan|yunnan)\b/,
    // Holders of the shengyuan degree and above, with their households — on
    // the order of 1-2% of the population.
    share: 0.018,
    statusLabel: 'Gentry',
    wealth: [['poor', 0.08], ['modest', 0.2], ['comfortable', 0.32], ['wealthy', 0.31], ['noble', 0.09]],
    roles: [
      { role: 'Licentiate', weight: 10, gender: 'Male' },
      { role: 'Magistrate', weight: 5, gender: 'Male' },
      { role: 'Landholder', weight: 9 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The degree exempts the household from corvée and from corporal punishment, and makes its opinion worth hearing at the magistrate\'s gate.',
  },
  {
    id: 'qing-bannerman',
    label: 'the Eight Banners',
    zones: ['EAST_ASIAN'],
    yearRange: [1644, 1911],
    places: /\b(manchurian|mongolian steppes|gobi|beijing|xinjiang|tarim|kunlun|qaidam)\b/,
    share: 0.02,
    statusLabel: 'Bannerman',
    wealth: [['poor', 0.2], ['modest', 0.34], ['comfortable', 0.26], ['wealthy', 0.16], ['noble', 0.04]],
    roles: [
      { role: 'Banner Soldier', weight: 12, gender: 'Male' },
      { role: 'Garrison Clerk', weight: 7 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'Registered in the banner rather than in the county, drawing a stipend, and forbidden to take up a trade.',
  },

  /* ===================================================================== */
  /*  AFRICA                                                               */
  /* ===================================================================== */

  {
    id: 'sahel-ruling-lineage',
    label: 'the ruling lineages of the Sahel',
    zones: ['SUB_SAHARAN_AFRICAN'],
    yearRange: [800, 1900],
    places: /\b(timbuktu|lake chad|niger bend|gao region|sahelian|dogon|hoggar|tibesti|central sahara|fouta djallon|gambia river|gold coast savanna|sierra leone)\b/,
    share: 0.04,
    statusLabel: 'Of the Ruling Lineage',
    wealth: [['poor', 0.16], ['modest', 0.3], ['comfortable', 0.28], ['wealthy', 0.21], ['noble', 0.05]],
    roles: [
      { role: 'Cavalry Retainer', weight: 8, gender: 'Male' },
      { role: 'Tribute Collector', weight: 6 },
      { role: 'Landholder', weight: 8 },
      { role: 'Mistress of the Compound', weight: 8, gender: 'Female' },
    ],
    clause: 'The lineage collects the tribute rather than paying it, and is expected to feed whoever arrives at the compound.',
  },
  {
    id: 'ethiopia-mekwanent',
    label: 'the Ethiopian nobility, Aksumite and Solomonic',
    zones: ['SUB_SAHARAN_AFRICAN'],
    yearRange: [100, 1935],
    places: /\b(ethiopian highlands|harar|danakil|rift valley lakes|red sea shore|somali steppe|ethiopia|abyssinia)\b/,
    share: 0.03,
    statusLabel: 'Of the Mekwanent',
    wealth: [['poor', 0.14], ['modest', 0.3], ['comfortable', 0.28], ['wealthy', 0.22], ['noble', 0.06]],
    roles: [
      { role: 'Holder of Gult', weight: 9 },
      { role: 'Church Scholar', weight: 6, gender: 'Male' },
      { role: 'Mounted Retainer', weight: 7, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The grant is of the right to collect from a district, not of the district itself, and it lasts as long as the court says it does.',
  },
  {
    id: 'west-african-chiefly',
    label: 'the chiefly lineages of the forest kingdoms',
    zones: ['SUB_SAHARAN_AFRICAN'],
    yearRange: [1200, 1900],
    places: /\b(west african forests|ibo plateau|niger delta|benin lowlands|oyo hinterland|jos plateau|ogun|ashanti|lagos coastal|ivory coast|kongo|cross river|bantu uplands)\b/,
    share: 0.035,
    statusLabel: 'Of the Chiefly Lineage',
    wealth: [['poor', 0.15], ['modest', 0.3], ['comfortable', 0.28], ['wealthy', 0.22], ['noble', 0.05]],
    roles: [
      { role: 'Titled Elder', weight: 8 },
      { role: 'Court Official', weight: 7 },
      { role: 'Trader on the Coast', weight: 6 },
      { role: 'Head of the Compound', weight: 8, gender: 'Female' },
    ],
    clause: 'The title is held from the town rather than from the family, and the town can take it away again.',
  },

  /* ===================================================================== */
  /*  THE AMERICAS AND OCEANIA                                             */
  /* ===================================================================== */

  {
    id: 'inca-privilege',
    label: 'the Inca of privilege',
    zones: ['SOUTH_AMERICAN'],
    yearRange: [1300, 1572],
    places: /\b(cuzco|altiplano|titicaca|cajamarca|quito|cordillera blanca|chachapoyas|chimborazo)\b/,
    share: 0.02,
    statusLabel: 'Inca of Privilege',
    wealth: [['poor', 0.06], ['modest', 0.22], ['comfortable', 0.34], ['wealthy', 0.3], ['noble', 0.08]],
    roles: [
      { role: 'Provincial Administrator', weight: 9 },
      { role: 'Keeper of the Khipu', weight: 7 },
      { role: 'Officer of the Levy', weight: 6, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 6, gender: 'Female' },
    ],
    clause: 'The ears are pierced and spooled to show it, and the household eats from the state stores rather than from the terrace it works.',
  },
  {
    id: 'andean-kuraka',
    label: 'the kuraka lineages of the Andes',
    zones: ['SOUTH_AMERICAN'],
    // Reaches back well before the Inca: Moche, Wari and Tiwanaku all had
    // hereditary lords over the same ayllus, and the Inca inherited the
    // arrangement rather than inventing it.
    yearRange: [-200, 1825],
    places: /\b(cuzco|altiplano|titicaca|cajamarca|quito|potosí|potosi|cochabamba|sucre|yungas|tarija|chimborazo|cordillera blanca)\b/,
    share: 0.03,
    statusLabel: 'Kuraka Lineage',
    wealth: [['poor', 0.18], ['modest', 0.32], ['comfortable', 0.27], ['wealthy', 0.19], ['noble', 0.04]],
    roles: [
      { role: 'Head of the Ayllu', weight: 10 },
      { role: 'Labour Organiser', weight: 7 },
      { role: 'Keeper of the Household Stores', weight: 7, gender: 'Female' },
    ],
    clause: 'The lineage arranges the labour the community owes and answers for it, first to Cusco and later to a Spanish magistrate.',
  },
  {
    id: 'mesoamerican-pipiltin',
    label: 'the pipiltin of the Mexican highlands',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    yearRange: [1200, 1550],
    places: /\b(valley of mexico|lake texcoco|oaxaca|yucat|sierra madre|tehuantepec|mayan lowlands)\b/,
    share: 0.05,
    statusLabel: 'Pilli',
    wealth: [['poor', 0.08], ['modest', 0.24], ['comfortable', 0.32], ['wealthy', 0.28], ['noble', 0.08]],
    roles: [
      { role: 'Calpixqui', weight: 8, gender: 'Male' },
      { role: 'Judge', weight: 5, gender: 'Male' },
      { role: 'Officer of the Levy', weight: 7, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'Schooled at the calmecac, entitled to cotton and to a second storey on the house, and expected to bring back captives.',
  },
  {
    id: 'mississippian-elite',
    label: 'the elite lineages of the mound centres',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    yearRange: [900, 1600],
    places: /\b(cahokia|natchez|mississippi|ozark|illinois river|driftless|smoky|piedmont uplands|blue ridge|okefenokee)\b/,
    share: 0.03,
    statusLabel: 'Of the Elite Lineage',
    wealth: [['poor', 0.14], ['modest', 0.3], ['comfortable', 0.3], ['wealthy', 0.22], ['noble', 0.04]],
    roles: [
      { role: 'Keeper of the Mound', weight: 8 },
      { role: 'Ritual Specialist', weight: 7 },
      { role: 'Head of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The house stands on the platform and the lineage is buried in it, with shell and copper that came a thousand miles.',
  },
  {
    id: 'polynesian-arii',
    label: 'the chiefly ranks of Polynesia',
    zones: ['OCEANIA'],
    yearRange: [800, 1900],
    share: 0.05,
    statusLabel: 'Of Chiefly Rank',
    wealth: [['poor', 0.12], ['modest', 0.3], ['comfortable', 0.32], ['wealthy', 0.21], ['noble', 0.05]],
    roles: [
      { role: 'Keeper of the Genealogy', weight: 8 },
      { role: 'Navigator', weight: 7, gender: 'Male' },
      { role: 'Holder of the Marae', weight: 6 },
      { role: 'Head of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The genealogy is recited back to the founding canoe, and the tapu that comes with it governs who may eat where.',
  },
  {
    id: 'colonial-gentry',
    label: 'the colonial gentry',
    zones: ['NORTH_AMERICAN_COLONIAL'],
    yearRange: [1620, 1830],
    share: 0.025,
    statusLabel: 'Of the Gentry',
    wealth: [['poor', 0.04], ['modest', 0.16], ['comfortable', 0.34], ['wealthy', 0.36], ['noble', 0.1]],
    roles: [
      { role: 'Planter', weight: 10 },
      { role: 'Merchant', weight: 8 },
      { role: 'Justice of the Peace', weight: 5, gender: 'Male' },
      { role: 'Mistress of the Household', weight: 8, gender: 'Female' },
    ],
    clause: 'The pew is at the front, the militia commission is in the family, and the labour that pays for both is owned outright.',
  },

  /* ===================================================================== */
  /*  THE INDUSTRIAL AND MODERN ERAS                                       */
  /*                                                                       */
  /*  The modern era measured 0.00% elite, which is the one figure in the  */
  /*  audit that is obviously wrong rather than merely arguable: legal      */
  /*  estates were abolished, and the orders that replaced them were not.   */
  /* ===================================================================== */

  {
    id: 'japan-shizoku',
    label: 'the shizoku of Meiji Japan',
    zones: ['EAST_ASIAN'],
    yearRange: [1869, 1947],
    places: /\b(japan|kyoto basin|edo plain|inland sea|mount fuji|tohoku|nara uplands|hokkaido)\b/,
    // The samurai estate was abolished and its members registered as shizoku —
    // about 5% of the population, stripped of the stipend and heavily
    // over-represented in the new army, police and schools.
    share: 0.05,
    statusLabel: 'Shizoku',
    wealth: [['poor', 0.24], ['modest', 0.32], ['comfortable', 0.24], ['wealthy', 0.16], ['noble', 0.04]],
    roles: [
      { role: 'Police Officer', weight: 8, gender: 'Male' },
      { role: 'Schoolteacher', weight: 8 },
      { role: 'Army Officer', weight: 6, gender: 'Male' },
      { role: 'Clerk', weight: 7 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The register still records the family as former samurai, which buys precedence at a funeral and no longer buys rice.',
  },
  {
    id: 'south-asia-zamindar',
    label: 'the zamindari of British India',
    zones: ['SOUTH_ASIAN'],
    yearRange: [1793, 1951],
    share: 0.02,
    statusLabel: 'Zamindar',
    wealth: [['poor', 0.06], ['modest', 0.18], ['comfortable', 0.3], ['wealthy', 0.36], ['noble', 0.1]],
    roles: [
      { role: 'Landholder', weight: 12 },
      { role: 'Revenue Collector', weight: 7 },
      { role: 'Mistress of the Household', weight: 7, gender: 'Female' },
    ],
    clause: 'The Permanent Settlement made the revenue a fixed sum and the land a property, and the household on the right side of that transaction has been there ever since.',
  },
  {
    id: 'latin-hacendado',
    label: 'the hacendado families of Latin America',
    zones: ['SOUTH_AMERICAN'],
    yearRange: [1560, 1960],
    share: 0.02,
    statusLabel: 'Hacendado',
    wealth: [['poor', 0.04], ['modest', 0.16], ['comfortable', 0.3], ['wealthy', 0.38], ['noble', 0.12]],
    roles: [
      { role: 'Estate Owner', weight: 12 },
      { role: 'Mine Owner', weight: 6 },
      { role: 'Provincial Deputy', weight: 5, gender: 'Male' },
      { role: 'Mistress of the Estate', weight: 8, gender: 'Female' },
    ],
    clause: 'The estate runs on debt owed by the people who work it, which is a different arrangement from slavery and not a very different life.',
  },
  {
    id: 'soviet-nomenklatura',
    label: 'the nomenklatura',
    zones: ['EUROPEAN'],
    yearRange: [1930, 1991],
    places: /\b(moscow|volga|novgorod|ural|white sea|siberia|dnieper|steppe borderlands|carpathian ridge)\b/,
    share: 0.015,
    statusLabel: 'Of the Nomenklatura',
    wealth: [['poor', 0.04], ['modest', 0.2], ['comfortable', 0.42], ['wealthy', 0.3], ['noble', 0.04]],
    roles: [
      { role: 'Party Secretary', weight: 8 },
      { role: 'Factory Director', weight: 8 },
      { role: 'Ministry Official', weight: 7 },
      { role: 'Institute Researcher', weight: 6 },
    ],
    clause: 'The appointment is on a list held by the Party, and it comes with the flat, the clinic and the shop that ordinary wages cannot reach.',
  },


  /* ===================================================================== */
  /*  SOUTHEAST ASIA                                                       */
  /* ===================================================================== */
  //
  // The zone had no entry at all, in any century — so every persona drawn in
  // maritime or mainland Southeast Asia came back with no standing available to
  // them, which is a claim that these were societies without an aristocracy.
  // They were among the most elaborately ranked in the world.

  {
    id: 'sea-datu-lineages',
    label: 'the datu lineages of the archipelago',
    zones: ['SOUTHEAST_ASIAN', 'OCEANIA'],
    yearRange: [-200, 1600],
    places: /\b(philippin|luzon|visayas|mindanao|borneo|sulawesi|maritime|java|sumatra|malay|malacca|cebu|manila)\b/,
    // Rank in these polities ran in named lineages rather than in a titled
    // estate, and the datu stratum with its dependants was a substantial slice
    // of any settlement rather than a thin crust on top of it.
    share: 0.06,
    statusLabel: 'Of the Datu Line',
    wealth: [['poor', 0.06], ['modest', 0.24], ['comfortable', 0.38], ['wealthy', 0.26], ['noble', 0.06]],
    roles: [
      { role: 'Datu', weight: 6, gender: 'Male' },
      { role: 'Lineage Elder', weight: 8 },
      { role: 'War Leader', weight: 5, gender: 'Male' },
      { role: 'Trade Broker', weight: 8 },
      { role: 'Keeper of Heirlooms', weight: 6 },
      { role: 'Household Manager', weight: 8, gender: 'Female' },
    ],
    clause: 'Rank here is a matter of remembered descent and of the debts and dependants that come with it, not of a title anyone could grant.',
  },
  {
    id: 'sea-court-nobility',
    label: 'the court nobility of the mainland kingdoms',
    zones: ['SOUTHEAST_ASIAN', 'SOUTH_ASIAN'],
    yearRange: [800, 1900],
    places: /\b(siam|thailand|ayutthaya|bangkok|burma|myanmar|irrawaddy|cambodia|khmer|angkor|laos|vietnam|annam|tonkin|hue|indochina|mainland southeast)\b/,
    // Service nobilities: rank was held from the crown, carried an allotment of
    // manpower rather than of land, and could be taken back.
    share: 0.025,
    statusLabel: 'Of the Royal Service',
    wealth: [['poor', 0.05], ['modest', 0.2], ['comfortable', 0.35], ['wealthy', 0.31], ['noble', 0.09]],
    roles: [
      { role: 'Court Official', weight: 9 },
      { role: 'Provincial Governor', weight: 4, gender: 'Male' },
      { role: 'Royal Scribe', weight: 7 },
      { role: 'Master of Elephants', weight: 3, gender: 'Male' },
      { role: 'Court Brahmin', weight: 5, gender: 'Male' },
      { role: 'Palace Attendant', weight: 9, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'The rank is held from the throne along with an allotment of men, and both can be withdrawn in an afternoon.',
  },
  {
    id: 'sea-colonial-and-after',
    label: 'the colonial and national elites of Southeast Asia',
    zones: ['SOUTHEAST_ASIAN'],
    yearRange: [1900, 2020],
    share: 0.02,
    statusLabel: 'Of the Governing Class',
    wealth: [['poor', 0.02], ['modest', 0.14], ['comfortable', 0.4], ['wealthy', 0.36], ['noble', 0.08]],
    roles: [
      { role: 'Civil Servant', weight: 10 },
      { role: 'Plantation Manager', weight: 5, gender: 'Male' },
      { role: 'Party Official', weight: 6 },
      { role: 'Newspaper Editor', weight: 4 },
      { role: 'Lawyer', weight: 6 },
      { role: 'Schoolteacher', weight: 8 },
    ],
    clause: 'The families that learned the coloniser\'s language early are the families still holding the offices.',
  },

  /* ===================================================================== */
  /*  FILLING THE OTHER SILENT CELLS                                       */
  /* ===================================================================== */

  {
    id: 'oceania-ariki',
    label: 'the chiefly lines of Oceania',
    zones: ['OCEANIA'],
    // Runs to the present on purpose. Chiefly rank did not lapse with
    // annexation: Tonga still has a titled nobility, and Fijian and Samoan
    // ranks remained the thing that decided who spoke for a village long after
    // a colonial administration was nominally in charge.
    yearRange: [-1000, 2020],
    places: /\b(polynesi|hawai|tahiti|samoa|tonga|fiji|aotearoa|new zealand|marquesas|rapa nui|cook|society|micronesi)\b/,
    // Senior descent from a founding ancestor, reckoned exactly and argued over
    // constantly. A wide stratum, because in a ranked lineage system almost
    // everyone can place themselves somewhere on it.
    share: 0.07,
    statusLabel: 'Of the Senior Line',
    wealth: [['poor', 0.08], ['modest', 0.3], ['comfortable', 0.36], ['wealthy', 0.22], ['noble', 0.04]],
    roles: [
      { role: 'Ariki', weight: 4, gender: 'Male' },
      { role: 'Lineage Elder', weight: 9 },
      { role: 'Keeper of Genealogies', weight: 7 },
      { role: 'Navigator', weight: 5, gender: 'Male' },
      { role: 'Master Carver', weight: 5, gender: 'Male' },
      { role: 'Tapa Maker of Rank', weight: 7, gender: 'Female' },
    ],
    clause: 'Seniority is counted back through named ancestors to the canoe, and everyone present can recite where they fall on it.',
  },
  {
    id: 'mena-modern-notables',
    label: 'the notable families of the modern Middle East',
    zones: ['MENA'],
    yearRange: [1900, 2020],
    share: 0.02,
    statusLabel: 'Of the Notable Families',
    wealth: [['poor', 0.03], ['modest', 0.15], ['comfortable', 0.37], ['wealthy', 0.36], ['noble', 0.09]],
    roles: [
      { role: 'Landowner', weight: 8 },
      { role: 'Civil Servant', weight: 9 },
      { role: 'Army Officer', weight: 6, gender: 'Male' },
      { role: 'Lawyer', weight: 6 },
      { role: 'Merchant', weight: 8 },
      { role: 'Oil Minister', weight: 1, gender: 'Male' },
      { role: 'Schoolteacher', weight: 7 },
    ],
    clause: 'The families that held the tax farms under the empire hold the ministries under the republic, which surprised nobody.',
  },
  {
    id: 'north-america-gilded',
    label: 'the propertied classes of modern North America',
    zones: ['NORTH_AMERICAN_COLONIAL'],
    yearRange: [1900, 2020],
    share: 0.025,
    statusLabel: 'Of the Propertied Class',
    wealth: [['poor', 0.01], ['modest', 0.1], ['comfortable', 0.39], ['wealthy', 0.41], ['noble', 0.09]],
    roles: [
      { role: 'Company Director', weight: 6 },
      { role: 'Lawyer', weight: 8 },
      { role: 'Physician', weight: 7 },
      { role: 'Banker', weight: 5 },
      { role: 'Newspaper Editor', weight: 4 },
      { role: 'University Professor', weight: 5 },
      { role: 'Society Hostess', weight: 6, gender: 'Female' },
    ],
    clause: 'There is no title to hold, so the standing is held in a school, a street and a list of names instead.',
  },
  {
    id: 'north-america-reservation-leadership',
    label: 'Indigenous leadership under the reservation system',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    yearRange: [1850, 2020],
    places: /\b(reservation|agency|indian territory|plains|southwest|great lakes|northwest|oklahoma|dakota|arizona|new mexico|montana)\b/,
    // Deliberately modest in wealth. Standing in this period is authority
    // exercised on behalf of a community with very little, and conflating it
    // with money would be the wrong claim entirely.
    share: 0.03,
    statusLabel: 'Of the Council',
    wealth: [['poor', 0.34], ['modest', 0.38], ['comfortable', 0.2], ['wealthy', 0.07], ['noble', 0.01]],
    roles: [
      { role: 'Council Member', weight: 9 },
      { role: 'Tribal Chairman', weight: 2 },
      { role: 'Interpreter', weight: 7 },
      { role: 'Keeper of Ceremonies', weight: 6 },
      { role: 'Delegate to Washington', weight: 3, gender: 'Male' },
      { role: 'Schoolteacher', weight: 6 },
    ],
    clause: 'The authority is real and the treaty behind it is enforced by the party that wrote it, which is the whole difficulty.',
  },
  {
    id: 'mississippian-elite',
    label: 'the mound-centre elites',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    yearRange: [-1500, 200],
    places: /\b(mississippi|ohio|southeast|illinois|tennessee|arkansas|great lakes|woodland|adena|hopewell)\b/,
    // Earthwork building on the Adena and Hopewell scale implies people who
    // could direct the labour of others, and the burials say plainly who they
    // were: a small stratum with exotic goods nobody else was buried with.
    share: 0.02,
    statusLabel: 'Of the Mound Builders',
    wealth: [['poor', 0.1], ['modest', 0.3], ['comfortable', 0.37], ['wealthy', 0.2], ['noble', 0.03]],
    roles: [
      { role: 'Ceremonial Leader', weight: 8 },
      { role: 'Keeper of the Mound', weight: 6 },
      { role: 'Long-Distance Trader', weight: 7 },
      { role: 'Copper Worker', weight: 5 },
      { role: 'Mica Carver', weight: 5 },
      { role: 'Lineage Elder', weight: 8 },
    ],
    clause: 'Somebody directed the moving of that much earth, and the graves with copper and mica in them say who.',
  },
  {
    id: 'africa-early-lineage-heads',
    label: 'the senior lineages of early Africa',
    zones: ['SUB_SAHARAN_AFRICAN'],
    yearRange: [-2000, 400],
    share: 0.05,
    statusLabel: 'Of the Senior Lineage',
    wealth: [['poor', 0.12], ['modest', 0.34], ['comfortable', 0.34], ['wealthy', 0.17], ['noble', 0.03]],
    roles: [
      { role: 'Lineage Head', weight: 10 },
      { role: 'Rain Maker', weight: 4 },
      { role: 'Master Smith', weight: 6, gender: 'Male' },
      { role: 'Cattle Owner', weight: 8 },
      { role: 'Keeper of Traditions', weight: 7 },
      { role: 'Senior Wife', weight: 8, gender: 'Female' },
    ],
    clause: 'Standing is counted in cattle, in dependants and in how far back the household can name its dead.',
  },
  {
    id: 'europe-late-antique-curiales',
    label: 'the curial class of the late empire',
    zones: ['EUROPEAN', 'MENA'],
    yearRange: [1, 550],
    // The town councillors who were personally liable for their city's tax
    // assessment — a privileged order that spent three centuries trying to
    // escape itself, which is why the wealth spread runs so wide.
    share: 0.02,
    statusLabel: 'Curialis',
    wealth: [['poor', 0.08], ['modest', 0.24], ['comfortable', 0.36], ['wealthy', 0.26], ['noble', 0.06]],
    roles: [
      { role: 'Town Councillor', weight: 9, gender: 'Male' },
      { role: 'Tax Assessor', weight: 6, gender: 'Male' },
      { role: 'Estate Holder', weight: 8 },
      { role: 'Rhetor', weight: 4, gender: 'Male' },
      { role: 'Household Manager', weight: 8, gender: 'Female' },
      ...ARMS,
    ],
    clause: 'The council seat is hereditary, carries the honour of the city, and makes the holder personally liable for its taxes.',
  },
  {
    id: 'south-america-republican',
    label: 'the republican elites of South America',
    zones: ['SOUTH_AMERICAN'],
    yearRange: [1900, 2020],
    share: 0.02,
    statusLabel: 'Of the Good Families',
    wealth: [['poor', 0.02], ['modest', 0.13], ['comfortable', 0.38], ['wealthy', 0.38], ['noble', 0.09]],
    roles: [
      { role: 'Estate Owner', weight: 8 },
      { role: 'Lawyer', weight: 7 },
      { role: 'Army Officer', weight: 6, gender: 'Male' },
      { role: 'Newspaper Editor', weight: 4 },
      { role: 'Physician', weight: 6 },
      { role: 'Society Hostess', weight: 6, gender: 'Female' },
    ],
    clause: 'The surnames on the ministry doors are the surnames on the land titles, and have been since independence.',
  },
];
