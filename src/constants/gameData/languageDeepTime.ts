/**
 * constants/gameData/languageDeepTime.ts
 *
 * What was probably spoken in a given place at a given year, where the attested
 * language tables cannot say.
 *
 * This is deliberately not hedged into uselessness. Every window commits to a
 * best guess and a set of runners-up with real weights behind them. The point
 * is to push what is known as far as it will honestly go, and to record what
 * the guess rests on — not to refuse to answer. Where a proposal is genuinely
 * disputed it is marked `conjectural` and the dispute is cited; where the field
 * has converged, the window says so and moves on.
 *
 * Naming: unrecorded languages get short descriptive labels — "Pre-Indo-European
 * Aegean (hypothetical)" — never invented glossonyms. A reader should be able to
 * tell at a glance whether a name is a real one.
 *
 * Windows are matched most specific first: place-scoped before zone-scoped,
 * narrower year ranges before broader ones.
 */

import type { CulturalZone } from '../../types/characterData';

export type LanguageConfidence =
  /** Written records of this language, in this region, in this period. */
  | 'attested'
  /** No records here, but the comparative method recovers it. */
  | 'reconstructed'
  /** The family is known; which descendant was spoken here is an inference. */
  | 'inferred'
  /** Family membership itself is a live scholarly question. */
  | 'conjectural';

export interface LanguageHypothesis {
  label: string;
  family: string;
  /** Share of this window. Weights within a window sum to 1. */
  probability: number;
  confidence: LanguageConfidence;
  sourceIds: string[];
  /** One line on why this weight. Shown in the sources panel. */
  note?: string;
}

export interface AttributionWindow {
  id: string;
  yearRange: [number, number];
  zones?: CulturalZone[];
  /** Sub-zone precision: Rapa Nui inside Oceania, Mesoamerica inside N America. */
  places?: RegExp;
  hypotheses: LanguageHypothesis[];
}

const h = (
  label: string,
  family: string,
  probability: number,
  confidence: LanguageConfidence,
  sourceIds: string[],
  note?: string,
): LanguageHypothesis => ({ label, family, probability, confidence, sourceIds, note });

/**
 * Ordered: place-scoped windows first, then zone-wide ones, then the final
 * catch-alls. The resolver takes the first match, so specificity must come
 * before generality within each zone.
 */
export const ATTRIBUTION_WINDOWS: AttributionWindow[] = [
  // =========================================================================
  // EUROPE
  // =========================================================================
  {
    id: 'eu-basque-refuge',
    // Ended at 1500, and a place-scoped window outranks the attested table, so
    // a Basque speaker in 1480 — a century after the language is first written
    // down — was told they spoke a hypothetical Vasconic. Once Basque is
    // attested, the table should answer.
    yearRange: [-10000, 1000],
    zones: ['EUROPEAN'],
    places: /\b(basque|pyren|navarre|vasconia|gascony|aquitain)\b/,
    hypotheses: [
      h('Vasconic (hypothetical)', 'Vasconic', 0.65, 'conjectural', ['trask1997', 'nichols1992'],
        'Basque is the one western European language with no Indo-European relatives; its ancestor is assumed to have been here throughout.'),
      h('Pre-Indo-European Iberia (hypothetical)', 'unclassified', 0.2, 'conjectural', ['trask1997'],
        'Iberia held several non-Indo-European languages into the Roman period; not all of them were related to Basque.'),
      h('Proto-Celtic (reconstructed)', 'Indo-European', 0.15, 'reconstructed', ['mallory2006', 'anthony2007'],
        'Celtic reached the western Pyrenees late and unevenly.'),
    ],
  },
  {
    id: 'eu-north-uralic',
    yearRange: [-2000, 1600],
    zones: ['EUROPEAN'],
    places: /\b(finland|karelia|lapland|sapmi|sami|arctic europe|ural|white sea|bothnia|estonia)\b/,
    hypotheses: [
      h('Proto-Uralic (reconstructed)', 'Uralic', 0.5, 'reconstructed', ['janhunen2009'],
        'Uralic spread west and north across Fennoscandia through the second and first millennia BCE.'),
      h('Palaeo-Laplandic (hypothetical)', 'unclassified', 0.3, 'conjectural', ['janhunen2009', 'nichols1992'],
        'Substrate vocabulary in Sámi points to earlier languages of the far north that left no other trace.'),
      h('Proto-Germanic (reconstructed)', 'Indo-European', 0.2, 'reconstructed', ['mallory2006'],
        'Germanic reached the Baltic coast well before it reached the interior.'),
    ],
  },
  {
    id: 'eu-aegean-pre-greek',
    yearRange: [-10000, -1450],
    zones: ['EUROPEAN'],
    places: /\b(greece|aegean|crete|cyclad|pelopon|thessal|macedon|thrac)\b/,
    hypotheses: [
      h('Pre-Greek Aegean (hypothetical)', 'unclassified', 0.55, 'conjectural', ['renfrew1987', 'nichols1992'],
        'Greek place-names and vocabulary in -nth- and -ss- are borrowed from a language that was here first.'),
      h('Minoan (unread)', 'unclassified', 0.25, 'attested', ['renfrew1987'],
        'Written in Linear A from about 1800 BCE and still undeciphered — recorded, but not readable.'),
      h('Early Greek (reconstructed)', 'Indo-European', 0.2, 'reconstructed', ['mallory2006', 'heggarty2023'],
        'Greek speakers were present in the peninsula for some centuries before Linear B records them.'),
    ],
  },
  {
    id: 'eu-forager',
    yearRange: [-10000, -6000],
    zones: ['EUROPEAN'],
    hypotheses: [
      h('Pre-Neolithic European (hypothetical)', 'unclassified', 0.7, 'conjectural', ['nichols1992', 'bellwood2005'],
        'Europe before farming held languages that left no descendants and no records; nothing can be named, only located.'),
      h('Vasconic (hypothetical)', 'Vasconic', 0.2, 'conjectural', ['trask1997'],
        'The one candidate for continuity from this period into the historical record.'),
      h('Pre-Uralic Northeast (hypothetical)', 'unclassified', 0.1, 'conjectural', ['janhunen2009'],
        'The northeastern plain was probably already linguistically distinct from the west.'),
    ],
  },
  {
    id: 'eu-neolithic',
    yearRange: [-6000, -4500],
    zones: ['EUROPEAN'],
    hypotheses: [
      h('Anatolian Farmer (hypothetical)', 'unclassified', 0.5, 'inferred', ['renfrew1987', 'bellwood2005', 'diamondBellwood2003'],
        'Farming entered Europe with people from Anatolia, who brought their languages with them.'),
      h('Pre-Neolithic European (hypothetical)', 'unclassified', 0.3, 'conjectural', ['nichols1992'],
        'Forager languages persisted alongside farming for centuries, especially north and west.'),
      h('Vasconic (hypothetical)', 'Vasconic', 0.2, 'conjectural', ['trask1997']),
    ],
  },
  {
    id: 'eu-pie-dispersal',
    yearRange: [-4500, -2500],
    zones: ['EUROPEAN'],
    hypotheses: [
      h('Late Proto-Indo-European (reconstructed)', 'Indo-European', 0.4, 'reconstructed',
        ['anthony2007', 'mallory2006', 'haak2015', 'heggarty2023'],
        'The steppe population reaching central Europe around 3000 BCE carried late Proto-Indo-European; ancient DNA puts the movement beyond doubt even where the linguistic chronology is argued.'),
      h('Pre-Indo-European Europe (hypothetical)', 'unclassified', 0.35, 'conjectural', ['renfrew1987', 'nichols1992'],
        'Most of Europe was still speaking something else for much of this window.'),
      h('Anatolian Farmer (hypothetical)', 'unclassified', 0.15, 'inferred', ['renfrew1987', 'bellwood2005']),
      h('Proto-Uralic (reconstructed)', 'Uralic', 0.1, 'reconstructed', ['janhunen2009']),
    ],
  },
  {
    id: 'eu-bronze-branches',
    yearRange: [-2500, -800],
    zones: ['EUROPEAN'],
    hypotheses: [
      h('Proto-Celtic (reconstructed)', 'Indo-European', 0.25, 'reconstructed', ['mallory2006', 'bouckaert2012'],
        'West-central Europe, spreading toward the Atlantic through this period.'),
      h('Proto-Germanic (reconstructed)', 'Indo-European', 0.2, 'reconstructed', ['mallory2006'],
        'Southern Scandinavia and the North European plain.'),
      h('Proto-Italic (reconstructed)', 'Indo-European', 0.15, 'reconstructed', ['mallory2006']),
      h('Proto-Balto-Slavic (reconstructed)', 'Indo-European', 0.15, 'reconstructed', ['mallory2006', 'bouckaert2012']),
      h('Pre-Indo-European Europe (hypothetical)', 'unclassified', 0.15, 'conjectural', ['nichols1992'],
        'Non-Indo-European languages survived in pockets — Etruscan, Iberian, Rhaetic — into the classical period.'),
      h('Proto-Uralic (reconstructed)', 'Uralic', 0.1, 'reconstructed', ['janhunen2009']),
    ],
  },

  // =========================================================================
  // MIDDLE EAST AND NORTH AFRICA
  // =========================================================================
  {
    id: 'mena-egypt',
    yearRange: [-10000, -3200],
    zones: ['MENA'],
    places: /\b(egypt|nile|nubia|thebes|memphis|fayum|delta)\b/,
    hypotheses: [
      h('Pre-Dynastic Nile (hypothetical)', 'Afro-Asiatic', 0.55, 'inferred', ['ehret1995', 'ehret2002'],
        'The ancestor of Egyptian was in the valley well before writing; its earlier stages are recoverable only in outline.'),
      h('Proto-Afroasiatic (reconstructed)', 'Afro-Asiatic', 0.25, 'reconstructed', ['ehret1995'],
        'Ehret places the family\'s origin in northeastern Africa at a depth that reaches into this window.'),
      h('Nilo-Saharan ancestor (hypothetical)', 'Nilo-Saharan', 0.2, 'conjectural', ['ehret2001'],
        'Upriver and to the west, the early Nile was probably not Afroasiatic at all.'),
    ],
  },
  {
    id: 'mena-ppn',
    yearRange: [-10000, -6000],
    zones: ['MENA'],
    hypotheses: [
      h('Pre-Pottery Neolithic Levantine (hypothetical)', 'unclassified', 0.45, 'conjectural', ['bellwood2005', 'nichols1992'],
        'The first farming villages in the world are also linguistically silent; nothing survives of what was spoken at Jericho or Çatalhöyük.'),
      h('Proto-Afroasiatic (reconstructed)', 'Afro-Asiatic', 0.3, 'reconstructed', ['ehret1995'],
        'Deep enough as a family to be plausibly present, though its homeland is disputed between the Levant and northeast Africa.'),
      h('Pre-Sumerian Mesopotamian (hypothetical)', 'unclassified', 0.25, 'conjectural', ['nichols1992'],
        'Sumerian has no known relatives; whatever it descends from was in the region by this point.'),
    ],
  },
  {
    id: 'mena-chalcolithic',
    yearRange: [-6000, -3200],
    zones: ['MENA'],
    hypotheses: [
      h('Proto-Semitic (reconstructed)', 'Afro-Asiatic', 0.35, 'reconstructed', ['ehret1995'],
        'Semitic is separating from the rest of Afroasiatic across this window.'),
      h('Sumerian (attested from 3100 BCE)', 'isolate', 0.25, 'inferred', ['nichols1992'],
        'Spoken in southern Mesopotamia before it was written; an isolate with no established relatives.'),
      h('Proto-Afroasiatic (reconstructed)', 'Afro-Asiatic', 0.2, 'reconstructed', ['ehret1995']),
      h('Hattic or Hurrian ancestor (hypothetical)', 'unclassified', 0.2, 'conjectural', ['nichols1992'],
        'Anatolia and the northern hills held languages unrelated to either Semitic or Indo-European.'),
    ],
  },
  {
    id: 'mena-bronze',
    yearRange: [-3200, -1200],
    zones: ['MENA'],
    hypotheses: [
      h('Akkadian (attested)', 'Afro-Asiatic', 0.3, 'attested', ['glottolog']),
      h('Sumerian (attested)', 'isolate', 0.2, 'attested', ['glottolog'],
        'Still spoken in the south early in this window, and a learned language long after it stopped being a spoken one.'),
      h('Egyptian (attested)', 'Afro-Asiatic', 0.2, 'attested', ['glottolog']),
      h('West Semitic (attested)', 'Afro-Asiatic', 0.15, 'attested', ['glottolog'],
        'Amorite, Ugaritic and Canaanite across the Levant.'),
      h('Hurrian or Elamite (attested)', 'unclassified', 0.15, 'attested', ['glottolog'],
        'The northern and eastern edges spoke languages unrelated to any of the above.'),
    ],
  },

  // =========================================================================
  // SOUTH ASIA
  // =========================================================================
  {
    id: 'sa-early',
    yearRange: [-10000, -4000],
    zones: ['SOUTH_ASIAN'],
    hypotheses: [
      h('Pre-Harappan Indus (hypothetical)', 'unclassified', 0.4, 'conjectural', ['southworth2005', 'witzel1999'],
        'The northwest held at least one language that is neither Dravidian nor Indo-Aryan, detectable only as loanwords in later Sanskrit.'),
      h('Proto-Dravidian (reconstructed)', 'Dravidian', 0.3, 'reconstructed', ['southworth2005', 'fuller2007'],
        'Dravidian agricultural vocabulary aligns with the independent domestication of millets in peninsular India.'),
      h('Proto-Munda (reconstructed)', 'Austroasiatic', 0.2, 'reconstructed', ['southworth2005'],
        'Austroasiatic speech reached eastern India early, probably with rice.'),
      h('Himalayan isolate (hypothetical)', 'unclassified', 0.1, 'conjectural', ['vanDriem2001'],
        'Burushaski and the Kusunda language show that isolates survived in the mountains.'),
    ],
  },
  {
    id: 'sa-harappan',
    yearRange: [-4000, -1900],
    zones: ['SOUTH_ASIAN'],
    hypotheses: [
      h('Harappan (unread)', 'unclassified', 0.4, 'attested', ['southworth2005', 'witzel1999'],
        'The Indus script exists in thousands of inscriptions and has never been read; the language behind it is unknown.'),
      h('Proto-Dravidian (reconstructed)', 'Dravidian', 0.3, 'reconstructed', ['southworth2005', 'fuller2007'],
        'The leading candidate for Harappan speech, though the case rests on circumstantial evidence.'),
      h('Proto-Munda (reconstructed)', 'Austroasiatic', 0.2, 'reconstructed', ['southworth2005']),
      h('Pre-Harappan Indus (hypothetical)', 'unclassified', 0.1, 'conjectural', ['witzel1999']),
    ],
  },
  {
    id: 'sa-vedic',
    yearRange: [-1900, -300],
    zones: ['SOUTH_ASIAN'],
    hypotheses: [
      h('Old Indo-Aryan (attested)', 'Indo-European', 0.4, 'attested', ['southworth2005', 'witzel1999'],
        'Composed and transmitted orally for centuries before it was written, but recorded with unusual precision.'),
      h('Dravidian (reconstructed)', 'Dravidian', 0.35, 'reconstructed', ['southworth2005', 'fuller2007'],
        'Still the language of most of the peninsula throughout this window.'),
      h('Munda (reconstructed)', 'Austroasiatic', 0.15, 'reconstructed', ['southworth2005']),
      h('Pre-Indo-Aryan substrate (hypothetical)', 'unclassified', 0.1, 'conjectural', ['witzel1999']),
    ],
  },

  // =========================================================================
  // EAST ASIA
  // =========================================================================
  {
    id: 'ea-taiwan',
    yearRange: [-3500, 1600],
    zones: ['EAST_ASIAN'],
    places: /\b(taiwan|formosa|ryukyu|east coast rift|penghu)\b/,
    hypotheses: [
      h('Formosan Austronesian (reconstructed)', 'Austronesian', 0.75, 'reconstructed', ['blust2013', 'gray2009'],
        'Taiwan holds the deepest branches of Austronesian and is where the family originated; the island was Austronesian-speaking long before it was Chinese-speaking.'),
      h('Pre-Austronesian Taiwan (hypothetical)', 'unclassified', 0.15, 'conjectural', ['blust2013'],
        'A pre-Neolithic population was present and left no linguistic trace.'),
      h('Ryukyuan (reconstructed)', 'Japonic', 0.1, 'reconstructed', ['vovin2010'],
        'For the Ryukyus specifically, from about the first millennium CE.'),
    ],
  },
  {
    id: 'ea-japan-jomon',
    yearRange: [-10000, -900],
    zones: ['EAST_ASIAN'],
    places: /\b(japan|honshu|kyushu|hokkaido|shikoku|kanto|kansai|jomon)\b/,
    hypotheses: [
      h('Jōmon (hypothetical)', 'unclassified', 0.7, 'conjectural', ['whitman2011', 'hudson1999'],
        'Ten thousand years of continuous occupation with no records; Ainu may descend from it, but the connection cannot be demonstrated.'),
      h('Ainu ancestor (hypothetical)', 'Ainu', 0.3, 'conjectural', ['hudson1999', 'vovin2010'],
        'The northern archipelago most plausibly continues Jōmon speech into the historical Ainu languages.'),
    ],
  },
  {
    id: 'ea-japan-yayoi',
    yearRange: [-900, 700],
    zones: ['EAST_ASIAN'],
    places: /\b(japan|honshu|kyushu|shikoku|kanto|kansai|yamato)\b/,
    hypotheses: [
      h('Proto-Japonic (reconstructed)', 'Japonic', 0.6, 'reconstructed', ['whitman2011', 'vovin2010'],
        'Arrived with Yayoi wet-rice agriculture from the Korean peninsula around 900 BCE and spread northeast over centuries.'),
      h('Jōmon (hypothetical)', 'unclassified', 0.25, 'conjectural', ['hudson1999'],
        'The pre-Yayoi population did not vanish; its languages persisted in the north and east for a long time.'),
      h('Ainu ancestor (hypothetical)', 'Ainu', 0.15, 'conjectural', ['hudson1999']),
    ],
  },
  {
    id: 'ea-korea',
    yearRange: [-1500, 700],
    zones: ['EAST_ASIAN'],
    places: /\b(korea|silla|baekje|goguryeo|joseon|han river|jeolla|gyeongju)\b/,
    hypotheses: [
      h('Proto-Koreanic (reconstructed)', 'Koreanic', 0.55, 'reconstructed', ['vovin2010', 'whitman2011'],
        'Koreanic is shallow as families go; its ancestor spread across the peninsula in the last millennium BCE.'),
      h('Peninsular Japonic (reconstructed)', 'Japonic', 0.25, 'reconstructed', ['whitman2011'],
        'Place-names suggest Japonic was spoken in the southern peninsula before Koreanic displaced it.'),
      h('Pre-Koreanic peninsular (hypothetical)', 'unclassified', 0.2, 'conjectural', ['vovin2010']),
    ],
  },
  // -------------------------------------------------------------------------
  // CENTRAL ASIA AND SIBERIA
  //
  // Filed under EAST_ASIAN because `geography.ts` folds Central Asia into the
  // East Asia macro-zone. Without these windows the zone-wide catch-alls below
  // answered for Transoxiana too, so a Bronze Age persona from Samarkand was
  // issued Proto-Sino-Tibetan or Proto-Tibeto-Burman — languages of the
  // Himalayan massif, two thousand miles east. The attested tables in
  // `languages.ts` do cover this region, but only from Sogdian at 500 BCE
  // onward; everything older fell through to East Asia.
  // -------------------------------------------------------------------------
  {
    id: 'ca-oxus-bronze',
    yearRange: [-2800, -1500],
    zones: ['EAST_ASIAN'],
    places: /\b(samarkand|ferghana|kyzylkum|balkh|bactria|transoxiana|sogdia|khorasan|pamir|hindu kush|oases|oxus|amu darya|syr darya|merv|khwarezm|kazakh|aral|tian shan|dzungar)\b/,
    hypotheses: [
      h('Oxus civilisation language (unrecorded)', 'unclassified', 0.45, 'conjectural', ['witzel1999', 'anthony2007'],
        'The BMAC oasis towns were large and organised but left no decipherable writing. The language survives only as a substrate — a layer of farming, irrigation and ritual vocabulary with no Indo-European etymology that was borrowed into Indo-Iranian as it moved through.'),
      h('Proto-Indo-Iranian (reconstructed)', 'Indo-European', 0.4, 'reconstructed', ['anthony2007', 'mallory2006'],
        'Sintashta and Andronovo herders were pushing south into the region across this window. Nothing was written here, but the language is among the best reconstructed in the world.'),
      h('Unrecorded steppe language', 'unclassified', 0.15, 'conjectural', ['nichols1992'],
        'Central Asia before the Iron Age was almost certainly more crowded than the two named candidates alone suggest.'),
    ],
  },
  {
    id: 'ca-old-iranian',
    yearRange: [-1500, -500],
    zones: ['EAST_ASIAN'],
    places: /\b(samarkand|ferghana|kyzylkum|balkh|bactria|transoxiana|sogdia|khorasan|pamir|hindu kush|oases|oxus|amu darya|syr darya|merv|khwarezm|kazakh|aral|tian shan|dzungar)\b/,
    hypotheses: [
      h('Old Iranian dialects (reconstructed)', 'Indo-European', 0.55, 'reconstructed', ['mallory2006', 'witzel1999'],
        'The ancestors of Sogdian, Bactrian and Khwarezmian, spoken here for centuries before any of them were written down.'),
      h('Avestan (attested)', 'Indo-European', 0.3, 'attested', ['witzel1999'],
        'Old Avestan was composed somewhere in this region early in the window, though it was transmitted orally for a very long time before it was written.'),
      h('Oxus substrate survival (hypothetical)', 'unclassified', 0.15, 'conjectural', ['witzel1999'],
        'Pockets of the pre-Iranian oasis population are likely to have persisted alongside the incomers.'),
    ],
  },
  {
    id: 'ca-siberia-pacific',
    yearRange: [-10000, -500],
    zones: ['EAST_ASIAN'],
    places: /\b(kamchatka|sakhalin|chukot|okhotsk|amur)\b/,
    hypotheses: [
      h('Chukotko-Kamchatkan ancestor (reconstructed)', 'Chukotko-Kamchatkan', 0.4, 'conjectural', ['fortescue1998'],
        'The northeastern Pacific margin is Chukotko-Kamchatkan country; Fortescue reconstructs the family but its time depth here is not securely dated.'),
      h('Nivkh ancestor (hypothetical)', 'isolate', 0.25, 'conjectural', ['janhunen2009'],
        'Nivkh on the lower Amur and Sakhalin is an isolate with no demonstrated relatives, which usually indicates long residence.'),
      h('Ainu ancestor (hypothetical)', 'Ainu', 0.2, 'conjectural', ['hudson1999', 'vovin2010'],
        'Ainu occupied Sakhalin and the Kurils as well as Hokkaido.'),
      h('Unrecorded Pacific-margin languages', 'unclassified', 0.15, 'conjectural', ['nichols1992'],
        'The coast supported far more communities than the three named survivors.'),
    ],
  },

  {
    id: 'ca-siberia-early',
    yearRange: [-10000, -500],
    zones: ['EAST_ASIAN'],
    // Deliberately excludes Kamchatka and Sakhalin: the Uralic and Yeniseian
    // weights below belong to western and central Siberia, and the Pacific
    // margin has its own window underneath.
    places: /\b(siberia|yenisei|irtysh|baikal|tunguska|altai|taiga|lena)\b/,
    hypotheses: [
      h('Proto-Uralic (reconstructed)', 'Uralic', 0.3, 'reconstructed', ['janhunen2009'],
        'The Uralic homeland is usually placed in the forest belt around the Urals and the Ob, spreading both west and east.'),
      h('Yeniseian (reconstructed)', 'Yeniseian', 0.28, 'conjectural', ['vajda2010'],
        'Yeniseian was once far more widespread across central Siberia than the single surviving Ket; Vajda argues for a link to Na-Dene across the Bering land bridge.'),
      h('Proto-Tungusic (reconstructed)', 'Tungusic', 0.22, 'reconstructed', ['janhunen2009', 'robbeets2021'],
        'Along the Amur and the eastern taiga.'),
      h('Unrecorded Siberian languages', 'unclassified', 0.2, 'conjectural', ['nichols1992'],
        'Siberia has lost more language families than it kept; most of what was spoken here has left no trace at all.'),
    ],
  },
  {
    id: 'ea-early',
    yearRange: [-10000, -5000],
    zones: ['EAST_ASIAN'],
    hypotheses: [
      h('Pre-Sino-Tibetan Yellow River (hypothetical)', 'unclassified', 0.3, 'conjectural', ['sagart2019', 'vanDriem2001'],
        'Millet farming was under way in the north long before Sino-Tibetan can be reconstructed; what its farmers spoke is out of reach.'),
      h('Pre-Austroasiatic Yangtze (hypothetical)', 'unclassified', 0.3, 'conjectural', ['bellwood2005', 'diamondBellwood2003'],
        'Rice was domesticated in the middle and lower Yangtze; Austroasiatic and Hmong-Mien are the descendants most often proposed.'),
      h('Amur forager (hypothetical)', 'unclassified', 0.2, 'conjectural', ['robbeets2021'],
        'The northeast was occupied by populations ancestral to the later Tungusic world.'),
      h('Pre-Hmong-Mien (hypothetical)', 'unclassified', 0.2, 'conjectural', ['bellwood2005']),
    ],
  },
  {
    id: 'ea-neolithic',
    yearRange: [-5000, -1200],
    zones: ['EAST_ASIAN'],
    hypotheses: [
      h('Proto-Sino-Tibetan (reconstructed)', 'Sino-Tibetan', 0.35, 'reconstructed', ['sagart2019', 'vanDriem2001'],
        'Dated to roughly 5200 BCE in northern China by Sagart and colleagues; van Driem argues for a deeper Himalayan origin.'),
      h('Proto-Austroasiatic (reconstructed)', 'Austroasiatic', 0.2, 'reconstructed', ['bellwood2005', 'diamondBellwood2003'],
        'Spreading south and west from the Yangtze with rice.'),
      h('Proto-Tai-Kadai (reconstructed)', 'Tai-Kadai', 0.15, 'reconstructed', ['bellwood2005']),
      h('Proto-Hmong-Mien (reconstructed)', 'Hmong-Mien', 0.15, 'reconstructed', ['bellwood2005']),
      h('Proto-Tungusic (reconstructed)', 'Tungusic', 0.15, 'conjectural', ['robbeets2021'],
        'Robbeets derives Tungusic, Koreanic and Japonic from a single Neolithic source; many specialists reject the grouping.'),
    ],
  },

  // =========================================================================
  // SUB-SAHARAN AFRICA
  // =========================================================================
  {
    id: 'ssa-horn',
    yearRange: [-10000, 1000],
    zones: ['SUB_SAHARAN_AFRICAN'],
    places: /\b(ethiop|abyssin|somal|horn|eritrea|afar|oromo|tigray|harar|danakil)\b/,
    hypotheses: [
      h('Cushitic (reconstructed)', 'Afro-Asiatic', 0.55, 'reconstructed', ['ehret1995', 'ehret2002'],
        'Cushitic has held the Horn for a very long time, with cattle-keeping vocabulary that reaches deep.'),
      h('Omotic (reconstructed)', 'Afro-Asiatic', 0.25, 'reconstructed', ['ehret1995'],
        'The southwestern Ethiopian highlands; possibly the earliest branch to separate.'),
      h('Nilo-Saharan (reconstructed)', 'Nilo-Saharan', 0.2, 'conjectural', ['ehret2001'],
        'Along the western lowlands and the Nile approaches.'),
    ],
  },
  // The western bulge is not Bantu and never was. The Bantu expansion left the
  // Cameroon grassfields going south and east, so the Guinea forest, the Volta
  // basin and the western Sahel kept Kwa, Mande, Gur and Atlantic languages
  // throughout. Without this rule the zone-wide window gave a persona in the
  // eighth-century Ivory Coast a fifty per cent chance of speaking Bantu, which
  // is a language family that never reached them.
  {
    id: 'ssa-west-forest',
    yearRange: [-3000, 1600],
    zones: ['SUB_SAHARAN_AFRICAN'],
    places: /\b(ivory coast|west african forest|lower guinea|upper guinea|gold coast|guinea|volta|niger delta|benin|dahomey|yoruba|igbo|akan|asante|ashanti|liberia|sierra leone|senegambia|casamance|gambia)\b/,
    hypotheses: [
      h('Kwa (reconstructed)', 'Niger-Congo', 0.4, 'reconstructed', ['blench2006'],
        'The forest belt from the Bandama to the Niger: the ancestors of Akan, Ewe, Yoruba and Igbo.'),
      h('Mande (reconstructed)', 'Niger-Congo', 0.28, 'reconstructed', ['blench2006'],
        'The upper Niger and the woodland north of the forest; an early and divergent branch.'),
      h('Atlantic (reconstructed)', 'Niger-Congo', 0.17, 'reconstructed', ['blench2006'],
        'The coast from the Senegal to Sierra Leone.'),
      h('Gur (reconstructed)', 'Niger-Congo', 0.15, 'reconstructed', ['blench2006'],
        'The Volta basin and the savanna behind the forest.'),
    ],
  },
  {
    id: 'ssa-west-sahel',
    yearRange: [-3000, 1600],
    zones: ['SUB_SAHARAN_AFRICAN'],
    places: /\b(sahel|western sudan|niger bend|timbuktu|gao|jenne|djenne|wagadu|ghana empire|mali|songhai|hausa|kanem|bornu|chad basin|sokoto|air massif)\b/,
    hypotheses: [
      h('Mande (reconstructed)', 'Niger-Congo', 0.34, 'reconstructed', ['blench2006'],
        'Soninke, Malinke and their relatives along the upper Niger.'),
      h('Songhay (reconstructed)', 'Nilo-Saharan', 0.22, 'conjectural', ['ehret2001'],
        'The Niger bend; its wider affiliation is unsettled.'),
      h('Chadic (reconstructed)', 'Afro-Asiatic', 0.2, 'reconstructed', ['ehret1995'],
        'Around Lake Chad and westward: the ancestors of Hausa.'),
      h('Atlantic (reconstructed)', 'Niger-Congo', 0.13, 'reconstructed', ['blench2006'],
        'Fulfulde and its relatives, spreading east with cattle.'),
      h('Berber (attested)', 'Afro-Asiatic', 0.11, 'attested', ['glottolog'],
        'The Saharan trade routes and their southern termini.'),
    ],
  },
  {
    id: 'ssa-early',
    yearRange: [-10000, -3000],
    zones: ['SUB_SAHARAN_AFRICAN'],
    hypotheses: [
      h('Nilo-Saharan ancestor (hypothetical)', 'Nilo-Saharan', 0.3, 'conjectural', ['ehret2001', 'ehret2002'],
        'During the African Humid Period the Sahara was habitable and held fishing and herding populations; Ehret places early Nilo-Saharan among them.'),
      h('Niger-Congo ancestor (hypothetical)', 'Niger-Congo', 0.3, 'inferred', ['blench2006', 'ehret2002'],
        'West Africa from the Senegal to the Cameroon grassfields.'),
      h('Click language of the south (hypothetical)', 'unclassified', 0.25, 'conjectural', ['guldemann2008'],
        'Southern and eastern Africa held click-using populations of great antiquity; they do not form a single family.'),
      h('Proto-Afroasiatic (reconstructed)', 'Afro-Asiatic', 0.15, 'reconstructed', ['ehret1995']),
    ],
  },
  {
    id: 'ssa-pre-bantu',
    yearRange: [-3000, -1000],
    zones: ['SUB_SAHARAN_AFRICAN'],
    hypotheses: [
      h('Niger-Congo (reconstructed)', 'Niger-Congo', 0.4, 'reconstructed', ['blench2006', 'ehret2002']),
      h('Nilo-Saharan (reconstructed)', 'Nilo-Saharan', 0.25, 'conjectural', ['ehret2001']),
      h('Click language of the south (hypothetical)', 'unclassified', 0.2, 'conjectural', ['guldemann2008'],
        'Still the languages of nearly all of southern and much of eastern Africa at this date.'),
      h('Cushitic (reconstructed)', 'Afro-Asiatic', 0.15, 'reconstructed', ['ehret1995'],
        'Moving south along the Rift with cattle.'),
    ],
  },
  {
    id: 'ssa-bantu',
    yearRange: [-1000, 1500],
    zones: ['SUB_SAHARAN_AFRICAN'],
    hypotheses: [
      h('Bantu (reconstructed)', 'Niger-Congo', 0.5, 'reconstructed', ['grollemund2015', 'bostoen2018', 'vansina1990'],
        'From the Cameroon grassfields around 3000 BCE, through the rainforest and then rapidly across the savanna; by 500 CE it reaches the southeast coast.'),
      h('West African Niger-Congo (reconstructed)', 'Niger-Congo', 0.2, 'reconstructed', ['blench2006'],
        'Mande, Atlantic, Gur and Kwa across the western bulge, none of them Bantu.'),
      h('Nilo-Saharan (reconstructed)', 'Nilo-Saharan', 0.15, 'conjectural', ['ehret2001']),
      h('Click language of the south (hypothetical)', 'unclassified', 0.15, 'conjectural', ['guldemann2008'],
        'Pushed back but not extinguished; still spoken across the Kalahari and its margins.'),
    ],
  },

  // =========================================================================
  // OCEANIA
  // =========================================================================
  {
    id: 'oc-rapa-nui',
    yearRange: [1150, 2100],
    zones: ['OCEANIA'],
    places: /\b(rapa nui|easter island|te pito)\b/,
    hypotheses: [
      h('Rapa Nui (attested)', 'Austronesian', 0.95, 'attested', ['kirch2000', 'gray2009', 'blust2013'],
        'Eastern Polynesian, settled from the west around 1200 CE. The island has spoken one language throughout its human history.'),
      h('Eastern Polynesian (reconstructed)', 'Austronesian', 0.05, 'reconstructed', ['blust2013'],
        'For the earliest generations, before Rapa Nui diverged from its parent.'),
    ],
  },
  {
    id: 'oc-east-polynesia',
    yearRange: [900, 2100],
    zones: ['OCEANIA'],
    places: /\b(hawai|tahiti|marquesas|tuamotu|cook island|aotearoa|new zealand|society island|austral|rapa nui|easter island|pitcairn|mangareva)\b/,
    hypotheses: [
      h('Eastern Polynesian (reconstructed)', 'Austronesian', 0.85, 'reconstructed', ['kirch2000', 'gray2009', 'blust2013'],
        'The last major human settlement of anywhere on earth: central East Polynesia around 1000 CE, Hawai\'i and Aotearoa by about 1300.'),
      h('Proto-Polynesian (reconstructed)', 'Austronesian', 0.15, 'reconstructed', ['blust2013']),
    ],
  },
  {
    id: 'oc-west-polynesia',
    yearRange: [-900, 2100],
    zones: ['OCEANIA'],
    places: /\b(tonga|samoa|fiji|futuna|wallis|niue|tokelau|tuvalu)\b/,
    hypotheses: [
      h('Proto-Polynesian (reconstructed)', 'Austronesian', 0.6, 'reconstructed', ['blust2013', 'gray2009', 'kirch2000'],
        'Tonga and Samoa were settled around 900 BCE and then sat still for a thousand years — the pause before the eastern voyages.'),
      h('Central Pacific Austronesian (reconstructed)', 'Austronesian', 0.4, 'reconstructed', ['blust2013'],
        'Fijian and its relatives, which separated early from the Polynesian line.'),
    ],
  },
  {
    id: 'oc-new-guinea',
    yearRange: [-10000, 2100],
    zones: ['OCEANIA'],
    places: /\b(new guinea|papua|sepik|highlands|kokoda|torres|bismarck|solomon)\b/,
    hypotheses: [
      h('Papuan highland language (hypothetical)', 'unclassified', 0.45, 'inferred', ['ross2005', 'pawley2018'],
        'New Guinea holds several dozen unrelated families and around a fifth of the world\'s languages; no single name can be given honestly.'),
      h('Trans-New Guinea (reconstructed)', 'Trans-New Guinea', 0.35, 'reconstructed', ['pawley2018'],
        'The largest Papuan grouping, probably spreading with highland agriculture from about 4000 BCE.'),
      h('Oceanic Austronesian (reconstructed)', 'Austronesian', 0.2, 'reconstructed', ['blust2013', 'kirch2000'],
        'Coastal and island fringes only, from about 1500 BCE; the interior stayed Papuan.'),
    ],
  },
  {
    id: 'oc-australia-pre-pn',
    yearRange: [-10000, -2000],
    zones: ['OCEANIA'],
    places: /\b(australia|arnhem|kimberley|outback|nullarbor|tasmania|murray|carpentaria|desert)\b/,
    hypotheses: [
      h('Non-Pama-Nyungan Australian (hypothetical)', 'Australian', 0.6, 'inferred', ['dixon1980', 'evans2010'],
        'Before the Pama-Nyungan expansion the continent held far greater family-level diversity, of which the north retains the remnant.'),
      h('Tasmanian (hypothetical)', 'unclassified', 0.2, 'conjectural', ['evans2010'],
        'Isolated by rising sea level around 10,000 BCE and unrelated to anything on the mainland as far as the fragmentary records show.'),
      h('Pre-Pama-Nyungan (hypothetical)', 'Australian', 0.2, 'conjectural', ['bouckaert2018']),
    ],
  },
  {
    id: 'oc-australia-pn',
    yearRange: [-2000, 1788],
    zones: ['OCEANIA'],
    places: /\b(australia|arnhem|kimberley|outback|nullarbor|tasmania|murray|carpentaria|desert)\b/,
    hypotheses: [
      h('Pama-Nyungan (reconstructed)', 'Australian', 0.7, 'reconstructed', ['bouckaert2018', 'bowernAtkinson2012'],
        'Expanded from the Gulf of Carpentaria about 4,000 years ago to cover nearly nine-tenths of the continent.'),
      h('Non-Pama-Nyungan Australian (hypothetical)', 'Australian', 0.25, 'inferred', ['dixon1980', 'evans2010'],
        'The north and northwest were never absorbed and remain the most diverse part of the continent.'),
      h('Tasmanian (hypothetical)', 'unclassified', 0.05, 'conjectural', ['evans2010']),
    ],
  },
  {
    // After contact these are living, recorded languages, not reconstructions,
    // and the label should say so. Which one depends on where in the continent.
    id: 'oc-australia-post-contact',
    yearRange: [1788, 2100],
    zones: ['OCEANIA'],
    places: /\b(australia|arnhem|kimberley|outback|nullarbor|murray|carpentaria|desert|uluru|centre|center)\b/,
    hypotheses: [
      h('Western Desert language (attested)', 'Australian', 0.3, 'attested', ['dixon1980', 'evans2010', 'glottolog'],
        'Pitjantjatjara, Yankunytjatjara and their neighbours across the central deserts, still spoken by thousands.'),
      h('Arrernte (attested)', 'Australian', 0.2, 'attested', ['dixon1980', 'glottolog'],
        'The languages of the central ranges around Alice Springs.'),
      h('Warlpiri (attested)', 'Australian', 0.15, 'attested', ['dixon1980', 'glottolog'],
        'The Tanami and the country north-west of the centre.'),
      h('Yolngu Matha (attested)', 'Australian', 0.1, 'attested', ['evans2010', 'glottolog'],
        'Northeast Arnhem Land, one of the strongest surviving language communities.'),
      h('Australian English (attested)', 'Indo-European', 0.15, 'attested', ['glottolog'],
        'Settler and station populations, and increasingly the second language of everyone else.'),
      h('Kriol (attested)', 'Creole', 0.1, 'attested', ['evans2010', 'glottolog'],
        'The English-lexified creole of the northern cattle country, a first language for many since the twentieth century.'),
    ],
  },
  {
    id: 'oc-lapita',
    yearRange: [-1500, 900],
    zones: ['OCEANIA'],
    hypotheses: [
      h('Proto-Oceanic (reconstructed)', 'Austronesian', 0.6, 'reconstructed', ['blust2013', 'kirch2000', 'gray2009'],
        'The Lapita expansion carried Oceanic Austronesian from the Bismarcks into Remote Oceania within a few generations.'),
      h('Papuan language of the islands (hypothetical)', 'unclassified', 0.25, 'inferred', ['ross2005'],
        'Near Oceania was already occupied and stayed partly Papuan-speaking.'),
      h('Central Pacific Austronesian (reconstructed)', 'Austronesian', 0.15, 'reconstructed', ['blust2013']),
    ],
  },
  {
    id: 'oc-early',
    yearRange: [-10000, -1500],
    zones: ['OCEANIA'],
    hypotheses: [
      h('Papuan language of the islands (hypothetical)', 'unclassified', 0.7, 'conjectural', ['ross2005', 'pawley2018'],
        'Near Oceania had been occupied for forty thousand years by this point, and none of it was Austronesian yet.'),
      h('Non-Pama-Nyungan Australian (hypothetical)', 'Australian', 0.3, 'conjectural', ['dixon1980', 'evans2010']),
    ],
  },

  // =========================================================================
  // NORTH AMERICA BEFORE CONTACT
  // =========================================================================
  {
    id: 'na-mesoamerica-early',
    yearRange: [-10000, -1500],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(mexico|maya|yucatan|oaxaca|guatemala|chiapas|central highlands|belize|honduras)\b/,
    hypotheses: [
      h('Proto-Oto-Manguean (reconstructed)', 'Oto-Manguean', 0.4, 'reconstructed', ['campbell1997', 'kaufmanJusteson2007'],
        'One of the deepest reconstructable families in the Americas, in the Mexican highlands from around 4000 BCE.'),
      h('Proto-Mayan (reconstructed)', 'Mayan', 0.3, 'reconstructed', ['campbell1997', 'kaufmanJusteson2007']),
      h('Proto-Mixe-Zoquean (reconstructed)', 'Mixe-Zoquean', 0.3, 'reconstructed', ['campbellKaufman1976'],
        'Associated with the Olmec by Campbell and Kaufman, on evidence that remains disputed.'),
    ],
  },
  {
    id: 'na-mesoamerica-late',
    yearRange: [-1500, 1520],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(mexico|maya|yucatan|oaxaca|guatemala|chiapas|central highlands|belize|honduras|tenochtitlan|teotihuacan)\b/,
    hypotheses: [
      h('Mayan (attested)', 'Mayan', 0.35, 'attested', ['kaufmanJusteson2007', 'campbell1997'],
        'Written in a fully readable script from about 250 CE — the only pre-contact writing in the Americas that can be read.'),
      h('Nahuatl (attested)', 'Uto-Aztecan', 0.25, 'attested', ['campbell1997'],
        'From the late first millennium CE in central Mexico.'),
      h('Oto-Manguean (reconstructed)', 'Oto-Manguean', 0.25, 'reconstructed', ['campbell1997'],
        'Zapotec, Mixtec and Otomí; Zapotec writing is older than Mayan but only partly readable.'),
      h('Mixe-Zoquean (reconstructed)', 'Mixe-Zoquean', 0.15, 'reconstructed', ['campbellKaufman1976']),
    ],
  },
  {
    id: 'na-arctic',
    yearRange: [-3000, 2100],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    places: /\b(arctic|subarctic|inuit|thule|greenland|aleut|yupik|alaska|baffin|labrador)\b/,
    hypotheses: [
      h('Eskimo-Aleut (reconstructed)', 'Eskimo-Aleut', 0.7, 'reconstructed', ['fortescue1998', 'campbell1997'],
        'A shallow, tightly related family spread right across the American Arctic — unusual for the continent.'),
      h('Na-Dene (reconstructed)', 'Na-Dene', 0.3, 'reconstructed', ['vajda2010', 'campbell1997'],
        'The Alaskan and Yukon interior; Vajda links it to Yeniseian in Siberia, the best-received long-range proposal in the Americas.'),
    ],
  },
  {
    id: 'na-southwest',
    yearRange: [-2000, 1600],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(southwest|puebloan|ancestral puebloan|sonora|arizona|new mexico|colorado plateau|rio grande)\b/,
    hypotheses: [
      h('Uto-Aztecan (reconstructed)', 'Uto-Aztecan', 0.45, 'reconstructed', ['campbell1997', 'goddard1996'],
        'Spread north from Mesoamerica, or south from the Great Basin — the direction is argued, the presence is not.'),
      h('Tanoan or Keresan (reconstructed)', 'Kiowa-Tanoan', 0.3, 'reconstructed', ['goddard1996'],
        'The Rio Grande pueblos; Keresan has no established relatives at all.'),
      h('Na-Dene (reconstructed)', 'Na-Dene', 0.25, 'reconstructed', ['campbell1997'],
        'Apachean arrived late, probably within a few centuries of Spanish contact.'),
    ],
  },
  {
    id: 'na-california',
    yearRange: [-3000, 1769],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(california|central valley|sierra nevada|pacific coast|northern california|southern california|fresno)\b/,
    hypotheses: [
      h('Penutian language (reconstructed)', 'Penutian', 0.3, 'inferred', ['golla2011', 'campbell1997'],
        'California held more unrelated families in a small area than almost anywhere on earth; Penutian is the largest grouping and is itself debated.'),
      h('Hokan language (reconstructed)', 'Hokan', 0.3, 'conjectural', ['golla2011', 'campbell1997'],
        'A proposed grouping of very divergent languages; many specialists treat its members as separate families.'),
      h('Uto-Aztecan (reconstructed)', 'Uto-Aztecan', 0.2, 'reconstructed', ['golla2011']),
      h('Californian isolate (hypothetical)', 'isolate', 0.2, 'inferred', ['golla2011'],
        'Several California languages — Yuki, Esselen, Chumash — have no demonstrable relatives.'),
    ],
  },
  {
    id: 'na-early-northwest',
    yearRange: [-10000, -3000],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(pacific coast|northwest|columbia|puget|salish|cascad|fraser|haida|olympic)\b/,
    hypotheses: [
      h('Ancestral Salishan (hypothetical)', 'Salishan', 0.3, 'conjectural', ['goddard1996', 'campbell1997'],
        'Salishan has held the inner coast and plateau for as long as anything can be traced there.'),
      h('Ancestral Wakashan (hypothetical)', 'Wakashan', 0.25, 'conjectural', ['goddard1996'],
        'The outer coast, unrelated to Salishan despite two thousand years of contact.'),
      h('Language of the Old Cordilleran tradition (hypothetical)', 'unclassified', 0.25, 'conjectural', ['meltzer2009'],
        'Named for the early Holocene culture of the Northwest rather than for a family, because no family reaches this deep here.'),
      h('Ancestral Na-Dene (hypothetical)', 'Na-Dene', 0.2, 'conjectural', ['vajda2010', 'fortescue1998'],
        'If Dene-Yeniseian holds, a later movement from Siberia falls somewhere near this window.'),
    ],
  },
  {
    id: 'na-early-arctic',
    yearRange: [-10000, -3000],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(arctic|subarctic|alaska|yukon|baffin|labrador|greenland|aleut|beringia)\b/,
    hypotheses: [
      h('Ancestral Eskimo-Aleut (hypothetical)', 'Eskimo-Aleut', 0.4, 'conjectural', ['fortescue1998'],
        'The family that would occupy the whole American Arctic descends from speech already around the Bering Strait.'),
      h('Ancestral Na-Dene (hypothetical)', 'Na-Dene', 0.35, 'conjectural', ['vajda2010'],
        'The Alaskan and Yukon interior; Vajda\'s link to Yeniseian in Siberia is the best-received long-range proposal in the Americas.'),
      h('Language of the Palaeo-Arctic tradition (hypothetical)', 'unclassified', 0.25, 'conjectural', ['meltzer2009', 'fortescue1998'],
        'Named for the microblade cultures of the early Holocene north, whose speech left no identifiable descendant.'),
    ],
  },
  {
    id: 'na-early-west',
    yearRange: [-10000, -3000],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /\b(california|great basin|sierra nevada|mojave|colorado plateau|southwest|puebloan|sonora|arizona|new mexico|nevada|utah)\b/,
    hypotheses: [
      h('Ancestral Hokan (hypothetical)', 'Hokan', 0.3, 'conjectural', ['golla2011', 'campbell1997'],
        'A proposed grouping of very divergent Californian languages. If it is a family at all it is an old one; many specialists treat its members as separate.'),
      h('Language of the Western Stemmed tradition (hypothetical)', 'unclassified', 0.3, 'conjectural', ['meltzer2009'],
        'Named for the early Holocene culture of the Great Basin, which is as far as evidence reaches here.'),
      h('Ancestral Uto-Aztecan (hypothetical)', 'Uto-Aztecan', 0.25, 'conjectural', ['campbell1997', 'golla2011'],
        'Uto-Aztecan would come to run from the Great Basin to central Mexico; its ancestor was somewhere in this range.'),
      h('Ancestral Penutian (hypothetical)', 'Penutian', 0.15, 'conjectural', ['golla2011'],
        'The largest Californian grouping, and itself debated.'),
    ],
  },
  {
    id: 'na-early',
    yearRange: [-10000, -3000],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    hypotheses: [
      h('Language of the Dalton tradition (hypothetical)', 'unclassified', 0.3, 'conjectural', ['meltzer2009', 'campbell1997'],
        'Named for the early Holocene culture of the eastern woodlands and mid-continent, because no eastern family can be reconstructed this deep.'),
      h('Ancestral Algic (hypothetical)', 'Algic', 0.25, 'conjectural', ['goddard1996', 'campbell1997'],
        'Algic would later stretch from the Atlantic to California; Proto-Algonquian itself is far younger than this window.'),
      h('Ancestral Siouan-Catawban (hypothetical)', 'Siouan', 0.25, 'conjectural', ['goddard1996'],
        'The mid-continent and the Ohio valley, ancestral to the Siouan languages of the plains and the southeast.'),
      h('Ancestral Iroquoian (hypothetical)', 'Iroquoian', 0.2, 'conjectural', ['goddard1996'],
        'The eastern woodlands, separate from Algic for as far back as either can be traced.'),
    ],
  },
  {
    id: 'na-later',
    yearRange: [-3000, 1600],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    hypotheses: [
      h('Algonquian (reconstructed)', 'Algic', 0.25, 'reconstructed', ['goddard1996', 'campbell1997'],
        'The northeast and the Great Lakes; Proto-Algonquian is one of the better-reconstructed families in the Americas.'),
      h('Siouan (reconstructed)', 'Siouan', 0.2, 'reconstructed', ['goddard1996']),
      h('Iroquoian (reconstructed)', 'Iroquoian', 0.15, 'reconstructed', ['goddard1996']),
      h('Salishan (reconstructed)', 'Salishan', 0.15, 'reconstructed', ['goddard1996'],
        'The Pacific Northwest, alongside Wakashan and several isolates.'),
      h('Muskogean (reconstructed)', 'Muskogean', 0.15, 'reconstructed', ['goddard1996'],
        'The southeast, including the Mississippian centres.'),
      h('Caddoan or Yuchi (attested)', 'Caddoan', 0.1, 'inferred', ['goddard1996', 'campbell1997'],
        'The southern plains and the Mississippi valley, including Yuchi, which has no relatives at all.'),
    ],
  },

  // =========================================================================
  // SOUTH AMERICA
  // =========================================================================
  {
    id: 'sam-patagonia',
    yearRange: [-3000, 2100],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(patagonia|tierra del fuego|fuegian|magellan|pampas|gran chaco|southern ice fields|uruguay river)\b/,
    hypotheses: [
      h('Chonan (attested from 1600s)', 'Chonan', 0.55, 'inferred', ['adelaar2004'],
        'Tehuelche and Selk\'nam, recorded only after European arrival but spoken in Patagonia long before it.'),
      h('Yaghan or Kawésqar (attested from 1600s)', 'isolate', 0.25, 'inferred', ['adelaar2004'],
        'The canoe peoples of the Fuegian channels spoke isolates unrelated to Chonan or to each other.'),
      h('Ancestral Mapudungun (hypothetical)', 'Araucanian', 0.2, 'conjectural', ['adelaar2004', 'dillehay1997'],
        'Araucanian speech reached well south of its historical range, and has no relatives anywhere — an isolate long in place.'),
    ],
  },
  {
    id: 'sam-andes',
    yearRange: [-3000, 2100],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(andes|peru|bolivia|cusco|cuzco|titicaca|altiplano|quito|ecuador|potosi|sierra|highland)\b/,
    hypotheses: [
      h('Quechuan (reconstructed)', 'Quechuan', 0.35, 'reconstructed', ['adelaar2004', 'heggartyBeresfordJones2012'],
        'Spread along the central Andes from the coast, well before the Inca adopted it as an administrative language.'),
      h('Aymaran (reconstructed)', 'Aymaran', 0.3, 'reconstructed', ['adelaar2004', 'heggartyBeresfordJones2012'],
        'The southern highlands and the Titicaca basin; older in the south than Quechua.'),
      h('Puquina or Mochica (attested)', 'unclassified', 0.2, 'inferred', ['urban2019', 'adelaar2004'],
        'The coast and the lake held languages that vanished in the colonial period leaving only fragments.'),
      h('Uru-Chipaya (attested)', 'Uru-Chipaya', 0.15, 'inferred', ['adelaar2004'],
        'The lake margins of the altiplano, a small family usually read as older in place than Aymara.'),
    ],
  },
  {
    id: 'sam-amazon',
    yearRange: [-3000, 2100],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(amazon|orinoco|xingu|rio negro|ucayali|mato grosso|guiana|rainforest|basin)\b/,
    hypotheses: [
      h('Arawakan (reconstructed)', 'Arawakan', 0.25, 'reconstructed', ['eppsMichael2023', 'kaufman1990'],
        'The most widely spread family in lowland South America, from the Caribbean to Bolivia.'),
      h('Tupían (reconstructed)', 'Tupían', 0.25, 'reconstructed', ['eppsMichael2023', 'kaufman1990']),
      h('Cariban (reconstructed)', 'Cariban', 0.2, 'reconstructed', ['eppsMichael2023']),
      h('Macro-Jê (reconstructed)', 'Macro-Jê', 0.15, 'reconstructed', ['eppsMichael2023'],
        'The central Brazilian uplands rather than the forest itself.'),
      h('Nadahup or Tucanoan (attested)', 'Nadahup', 0.15, 'inferred', ['aikhenvald2012', 'eppsMichael2023'],
        'The northwest Amazon, where small forager families and the Tucanoan river peoples live side by side.'),
    ],
  },
  {
    // The southern cone. Mapudungun and the Chonan languages are isolates or
    // small families with no outside relatives, which is what long local
    // continuity looks like — so the best guess here is their own ancestors.
    id: 'sam-early-southern-cone',
    yearRange: [-10000, -3000],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(patagonia|tierra del fuego|fuegian|magellan|araucan|mapuche|chile|southern ice fields|valdivia)\b/,
    hypotheses: [
      h('Ancestral Mapudungun (hypothetical)', 'Araucanian', 0.3, 'conjectural', ['adelaar2004', 'dillehay1997'],
        'Mapudungun has no demonstrated relatives anywhere. An isolate in place is the signature of a population that has been there a very long time.'),
      h('Ancestral Chonan (hypothetical)', 'Chonan', 0.3, 'conjectural', ['adelaar2004'],
        'Tehuelche and Selk\'nam descend from a family that was already in the far south; how far back it reaches cannot be measured, only inferred.'),
      h('Language of the Monte Verde people (hypothetical)', 'unclassified', 0.25, 'conjectural', ['dillehay1997', 'nichols1992'],
        'Named for the site rather than a family: southern Chile was occupied by at least 12,500 BCE, and whatever was spoken there left no recoverable descendant.'),
      h('Ancestral Kawésqar or Yaghan (hypothetical)', 'isolate', 0.15, 'conjectural', ['adelaar2004'],
        'The canoe peoples of the Fuegian channels spoke isolates unrelated to Chonan or to each other, suggesting equally deep separate histories.'),
    ],
  },
  {
    id: 'sam-early-chaco',
    yearRange: [-10000, -3000],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(gran chaco|chaco|pampas|uruguay river|parana|paraguay|rio de la plata)\b/,
    hypotheses: [
      h('Ancestral Guaycuruan (hypothetical)', 'Guaycuruan', 0.3, 'conjectural', ['adelaar2004'],
        'Toba and Mocoví descend from a family long established in the Chaco lowlands.'),
      h('Ancestral Mataguayan (hypothetical)', 'Mataguayan', 0.25, 'conjectural', ['adelaar2004'],
        'A second Chaco family, unrelated to Guaycuruan despite sharing the same country.'),
      h('Ancestral Zamucoan or Lule-Vilela (hypothetical)', 'Zamucoan', 0.2, 'conjectural', ['adelaar2004', 'adelaarIsolates'],
        'The smaller Chaco families, several of which have no demonstrated relatives at all.'),
      h('Ancestral Macro-Jê (hypothetical)', 'Macro-Jê', 0.25, 'conjectural', ['eppsMichael2023', 'adelaarIsolates'],
        'The uplands east of the Paraguay, where Macro-Jê is usually taken as the oldest layer.'),
    ],
  },
  {
    id: 'sam-early-andes',
    yearRange: [-10000, -3000],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(andes|altiplano|titicaca|peru|bolivia|cusco|cuzco|quito|ecuador|sierra|highland|atacama|potosi)\b/,
    hypotheses: [
      h('Ancestral Puquina (hypothetical)', 'isolate', 0.3, 'conjectural', ['adelaar2004', 'urban2019'],
        'Puquina was spoken around Titicaca into the colonial period and has no relatives; the best candidate for a language already old in the highlands.'),
      h('Language of the Paiján tradition (hypothetical)', 'unclassified', 0.25, 'conjectural', ['dillehay1997', 'kaufman1990'],
        'Named for the early Holocene coastal culture of northern Peru, whose speech is beyond any reconstruction.'),
      h('Ancestral Quechuan-Aymaran (hypothetical)', 'Quechuan', 0.25, 'conjectural', ['heggartyBeresfordJones2012', 'adelaar2004'],
        'Both families were in the central Andes long before they spread; whether they share an ancestor is disputed, and this window sits far below either reconstruction.'),
      h('Ancestral Uru-Chipaya (hypothetical)', 'Uru-Chipaya', 0.2, 'conjectural', ['adelaar2004'],
        'A small surviving family of the altiplano lake margins, often read as a relic of the population that preceded Aymara there.'),
    ],
  },
  {
    id: 'sam-early-amazon',
    yearRange: [-10000, -3000],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(amazon|orinoco|xingu|rio negro|ucayali|mato grosso|guiana|rainforest|llanos|basin|tapajos|madeira)\b/,
    hypotheses: [
      h('Ancestral Macro-Jê (hypothetical)', 'Macro-Jê', 0.3, 'conjectural', ['eppsMichael2023', 'adelaarIsolates'],
        'Macro-Jê occupies the central Brazilian uplands and is usually taken as the oldest layer in eastern South America.'),
      h('Ancestral Nadahup or Puinave (hypothetical)', 'Nadahup', 0.25, 'conjectural', ['aikhenvald2012', 'eppsMichael2023'],
        'The small forager families of the northwest Amazon look like remnants of a population that predates the great riverine expansions.'),
      h('Ancestral Arawakan (hypothetical)', 'Arawakan', 0.25, 'conjectural', ['eppsMichael2023', 'kaufman1990'],
        'Arawakan later spread further than any other lowland family; its homeland was somewhere in this window\'s territory.'),
      h('Ancestral Tupían (hypothetical)', 'Tupían', 0.2, 'conjectural', ['eppsMichael2023', 'aikhenvald2012'],
        'Proto-Tupían is usually placed in south-western Amazonia, well after this date but descending from speech already there.'),
    ],
  },
  {
    id: 'sam-early-north',
    yearRange: [-10000, -3000],
    zones: ['SOUTH_AMERICAN'],
    hypotheses: [
      h('Ancestral Chibchan (hypothetical)', 'Chibchan', 0.4, 'conjectural', ['kaufman1990', 'adelaar2004'],
        'Chibchan holds the northern isthmus and the Colombian highlands, and is among the older reconstructable families of the region.'),
      h('Ancestral Cariban (hypothetical)', 'Cariban', 0.3, 'conjectural', ['eppsMichael2023'],
        'Cariban later dominated the Guiana shield and the Orinoco; its ancestor was in the north by this date.'),
      h('Ancestral Arawakan (hypothetical)', 'Arawakan', 0.3, 'conjectural', ['eppsMichael2023', 'kaufman1990']),
    ],
  },

  // =========================================================================
  // NORTH AMERICA AFTER CONTACT
  // =========================================================================
  // One window used to cover 1500 to 2100 with a single set of proportions, so
  // Los Angeles in 1925 was twenty per cent Algonquian-speaking and fifteen per
  // cent French. The linguistic history of post-contact North America is mostly
  // the story of those proportions collapsing, which is exactly what a window
  // with fixed weights cannot show. Three bands instead.
  {
    id: 'nac-early-colonial',
    yearRange: [1500, 1700],
    zones: ['NORTH_AMERICAN_COLONIAL'],
    hypotheses: [
      h('Algonquian (reconstructed)', 'Algic', 0.42, 'reconstructed', ['goddard1996'],
        'Still the majority speech of the eastern seaboard through the seventeenth century.'),
      h('Iroquoian (reconstructed)', 'Iroquoian', 0.18, 'reconstructed', ['goddard1996']),
      h('English (attested)', 'Indo-European', 0.18, 'attested', ['glottolog'],
        'Confined to a narrow coastal strip before 1700.'),
      h('Spanish (attested)', 'Indo-European', 0.12, 'attested', ['glottolog'],
        'Florida, New Mexico and the Californian missions.'),
      h('French (attested)', 'Indo-European', 0.1, 'attested', ['glottolog'],
        'The St Lawrence, the Great Lakes and the Mississippi.'),
    ],
  },
  {
    id: 'nac-late-colonial',
    yearRange: [1700, 1850],
    zones: ['NORTH_AMERICAN_COLONIAL'],
    hypotheses: [
      h('English (attested)', 'Indo-European', 0.52, 'attested', ['glottolog']),
      h('Algonquian (reconstructed)', 'Algic', 0.14, 'reconstructed', ['goddard1996']),
      h('Spanish (attested)', 'Indo-European', 0.12, 'attested', ['glottolog']),
      h('French (attested)', 'Indo-European', 0.1, 'attested', ['glottolog']),
      h('West African languages of the enslaved (inferred)', 'Niger-Congo', 0.07, 'inferred', ['glottolog'],
        'A fifth of the population of the mainland colonies in 1770 was African-born or one generation from it.'),
      h('Iroquoian (reconstructed)', 'Iroquoian', 0.05, 'reconstructed', ['goddard1996']),
    ],
  },
  {
    id: 'nac-modern',
    yearRange: [1850, 2100],
    zones: ['NORTH_AMERICAN_COLONIAL'],
    hypotheses: [
      h('English (attested)', 'Indo-European', 0.74, 'attested', ['glottolog']),
      h('Spanish (attested)', 'Indo-European', 0.12, 'attested', ['glottolog'],
        'The Southwest, and everywhere after the mid-twentieth century.'),
      h('German (attested)', 'Indo-European', 0.04, 'attested', ['glottolog'],
        'The second language of the United States until the First World War.'),
      h('French (attested)', 'Indo-European', 0.04, 'attested', ['glottolog'],
        'Quebec, Acadia and the Louisiana parishes.'),
      h('Italian, Yiddish or Polish (attested)', 'Indo-European', 0.04, 'attested', ['glottolog'],
        'The languages of the 1880-1920 migration, spoken at home for a generation or two.'),
      h('Indigenous language of the region (inferred)', 'unclassified', 0.02, 'inferred', ['goddard1996'],
        'Under a per cent of the continental population by 1900, and falling under active suppression.'),
    ],
  },

  // =========================================================================
  // SOUTHEAST ASIA
  //
  // These regions used to be filed under South Asia, so the resolver reached
  // for the Indo-Aryan and Dravidian backstop and a persona on the Sulu Sea in
  // 1926 BCE was given Proto-Indo-Iranian. The Austronesian expansion out of
  // Taiwan is one of the best-attested language dispersals there is, and it has
  // nothing to do with the Indian subcontinent.
  // =========================================================================
  {
    id: 'sea-island-early',
    yearRange: [-10000, -2500],
    zones: ['SOUTHEAST_ASIAN'],
    places: /\b(philippin|luzon|visayan|mindanao|palawan|sulu|borneo|java|sumatra|celebes|sulawesi|moluc|bali|timor|maritime southeast|malay archipelago)\b/,
    hypotheses: [
      h('Pre-Austronesian language of the islands (hypothetical)', 'unclassified', 0.75, 'conjectural', ['blust2013'],
        'The islands were peopled tens of thousands of years before the Austronesian expansion; nothing of what those people spoke survives.'),
      h('Papuan-related language (hypothetical)', 'unclassified', 0.25, 'conjectural', ['glottolog'],
        'Eastern Indonesia keeps non-Austronesian languages to this day.'),
    ],
  },
  {
    // Closes at 600 rather than running to the present. A place-scoped window
    // beats the attested table outright (see `attributeLanguage`), so these two
    // windows ending at 2100 meant every Southeast Asian persona in every
    // century got a family label: "Austroasiatic language of the region" for a
    // man in 1920 Rangoon whose language the table knows is Burmese. Every
    // comparable window elsewhere closes where the record opens — ea-taiwan at
    // 1600, na-california at 1769 — and here that is the seventh century, when
    // Old Malay appears at Srivijaya and Mon and Khmer inscriptions begin.
    id: 'sea-island-austronesian',
    yearRange: [-2500, 600],
    zones: ['SOUTHEAST_ASIAN'],
    places: /\b(philippin|luzon|visayan|mindanao|palawan|sulu|borneo|java|sumatra|celebes|sulawesi|moluc|bali|timor|maritime southeast|malay archipelago|malaya|malacca|sunda)\b/,
    hypotheses: [
      h('Malayo-Polynesian language of the region', 'Austronesian', 0.7, 'reconstructed', ['blust2013', 'glottolog'],
        'Out of Taiwan by about 2500 BCE, through the Philippines and into island Southeast Asia.'),
      h('Pre-Austronesian survival (hypothetical)', 'unclassified', 0.18, 'conjectural', ['blust2013'],
        'Older languages persisted in the interiors and in the east long after the coasts had shifted.'),
      h('Papuan-related language (hypothetical)', 'unclassified', 0.12, 'conjectural', ['glottolog']),
    ],
  },
  {
    id: 'sea-mainland',
    yearRange: [-10000, 600],
    zones: ['SOUTHEAST_ASIAN'],
    places: /\b(indochina|mainland southeast|mekong|annam|tonkin|siam|thai|burma|irrawaddy|salween|khmer|angkor|champa|laos|malay peninsula|isthmus of kra)\b/,
    hypotheses: [
      h('Austroasiatic language of the region', 'Austroasiatic', 0.55, 'reconstructed', ['sidwell2015', 'glottolog'],
        'Mon-Khmer: the oldest widely spread family on the mainland.'),
      h('Tai-Kadai language of the region', 'Tai-Kadai', 0.2, 'inferred', ['glottolog'],
        'A later arrival from the north, dominant in the Chao Phraya only in the last millennium.'),
      h('Tibeto-Burman language of the region', 'Sino-Tibetan', 0.15, 'inferred', ['glottolog']),
      h('Austronesian language of the coast', 'Austronesian', 0.1, 'inferred', ['blust2013'],
        'Cham and its relatives held the central Vietnamese coast.'),
    ],
  },

  // =========================================================================
  // ZONE-LEVEL BACKSTOPS
  // Every zone must have unbroken coverage so the resolver can never return
  // nothing. These are deliberately broad and low-confidence.
  // =========================================================================
  {
    id: 'backstop-european',
    yearRange: [-10000, 2100],
    zones: ['EUROPEAN'],
    hypotheses: [
      h('Indo-European language of the region', 'Indo-European', 0.8, 'inferred', ['mallory2006', 'glottolog']),
      h('Non-Indo-European survival (hypothetical)', 'unclassified', 0.2, 'conjectural', ['trask1997', 'nichols1992']),
    ],
  },
  {
    id: 'backstop-mena',
    yearRange: [-10000, 2100],
    zones: ['MENA'],
    hypotheses: [
      h('Afroasiatic language of the region', 'Afro-Asiatic', 0.8, 'inferred', ['ehret1995', 'glottolog']),
      h('Non-Afroasiatic survival (hypothetical)', 'unclassified', 0.2, 'conjectural', ['nichols1992']),
    ],
  },
  {
    id: 'backstop-south-asian',
    yearRange: [-10000, 2100],
    zones: ['SOUTH_ASIAN'],
    hypotheses: [
      h('Indo-Aryan language of the region', 'Indo-European', 0.5, 'inferred', ['southworth2005', 'glottolog']),
      h('Dravidian language of the region', 'Dravidian', 0.35, 'inferred', ['southworth2005']),
      h('Munda language of the region', 'Austroasiatic', 0.15, 'inferred', ['southworth2005']),
    ],
  },
  {
    id: 'backstop-southeast-asian',
    yearRange: [-10000, 2100],
    zones: ['SOUTHEAST_ASIAN'],
    hypotheses: [
      h('Austronesian language of the region', 'Austronesian', 0.45, 'inferred', ['blust2013', 'glottolog'],
        'The islands, from Luzon to Timor, and the Malay peninsula.'),
      h('Austroasiatic language of the region', 'Austroasiatic', 0.3, 'inferred', ['sidwell2015', 'glottolog'],
        'The mainland: the ancestors of Mon, Khmer and Vietnamese.'),
      h('Tai-Kadai language of the region', 'Tai-Kadai', 0.15, 'inferred', ['glottolog'],
        'Spreading south out of what is now Guangxi and Guizhou.'),
      h('Tibeto-Burman language of the region', 'Sino-Tibetan', 0.1, 'inferred', ['glottolog'],
        'The Irrawaddy and the hills behind it.'),
    ],
  },
  {
    id: 'backstop-east-asian',
    yearRange: [-10000, 2100],
    zones: ['EAST_ASIAN'],
    hypotheses: [
      h('Sinitic language of the region', 'Sino-Tibetan', 0.5, 'inferred', ['sagart2019', 'glottolog']),
      h('Non-Sinitic language of the region', 'unclassified', 0.5, 'inferred', ['vanDriem2001', 'bellwood2005'],
        'Tibeto-Burman, Tai-Kadai, Hmong-Mien, Tungusic and Mongolic all occupy large parts of the zone.'),
    ],
  },
  {
    id: 'backstop-african',
    yearRange: [-10000, 2100],
    zones: ['SUB_SAHARAN_AFRICAN'],
    hypotheses: [
      h('Niger-Congo language of the region', 'Niger-Congo', 0.6, 'inferred', ['blench2006', 'glottolog']),
      h('Nilo-Saharan language of the region', 'Nilo-Saharan', 0.2, 'conjectural', ['ehret2001']),
      h('Afroasiatic language of the region', 'Afro-Asiatic', 0.2, 'inferred', ['ehret1995']),
    ],
  },
  {
    id: 'backstop-oceania',
    yearRange: [-10000, 2100],
    zones: ['OCEANIA'],
    hypotheses: [
      h('Oceanic Austronesian (reconstructed)', 'Austronesian', 0.6, 'inferred', ['blust2013', 'kirch2000']),
      h('Papuan language of the islands (hypothetical)', 'unclassified', 0.4, 'inferred', ['ross2005', 'pawley2018']),
    ],
  },
  {
    id: 'backstop-na-pre',
    yearRange: [-10000, 2100],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    hypotheses: [
      h('Algic language of the region', 'Algic', 0.35, 'inferred', ['goddard1996', 'campbell1997']),
      h('Siouan language of the region', 'Siouan', 0.25, 'inferred', ['goddard1996']),
      h('Uto-Aztecan language of the region', 'Uto-Aztecan', 0.2, 'inferred', ['campbell1997']),
      h('Algonquian language of the region', 'Algic', 0.2, 'inferred', ['goddard1996']),
    ],
  },
  {
    id: 'backstop-south-american',
    yearRange: [-10000, 2100],
    zones: ['SOUTH_AMERICAN'],
    hypotheses: [
      h('Macro-Jê language of the region', 'Macro-Jê', 0.3, 'inferred', ['eppsMichael2023', 'kaufman1990']),
      h('Chibchan language of the region', 'Chibchan', 0.2, 'inferred', ['kaufman1990']),
      h('Quechuan or Aymaran', 'Quechuan', 0.25, 'inferred', ['adelaar2004']),
      h('Tupían or Arawakan', 'Tupían', 0.25, 'inferred', ['eppsMichael2023']),
    ],
  },
  {
    id: 'backstop-na-colonial',
    yearRange: [-10000, 2100],
    zones: ['NORTH_AMERICAN_COLONIAL'],
    hypotheses: [
      h('English (attested)', 'Indo-European', 0.7, 'attested', ['glottolog']),
      h('Indigenous language of the region', 'unclassified', 0.3, 'inferred', ['goddard1996']),
    ],
  },
];

/** Windows carrying a `places` pattern are more specific and are tried first. */
export const ORDERED_WINDOWS: AttributionWindow[] = [
  ...ATTRIBUTION_WINDOWS.filter(w => w.places),
  ...ATTRIBUTION_WINDOWS.filter(w => !w.places && !w.id.startsWith('backstop-')),
  ...ATTRIBUTION_WINDOWS.filter(w => w.id.startsWith('backstop-')),
];
