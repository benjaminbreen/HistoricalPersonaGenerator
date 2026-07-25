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
    yearRange: [-10000, 1500],
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
    yearRange: [-2000, 2100],
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
    yearRange: [-6000, 1769],
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
    id: 'na-early',
    yearRange: [-10000, -3000],
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    hypotheses: [
      h('Unrecorded language of the region (hypothetical)', 'unclassified', 0.55, 'conjectural', ['campbell1997', 'nichols1992'],
        'North America has no reconstructable family this deep. The comparative method reaches roughly six thousand years here, and this window is older than that.'),
      h('Na-Dene ancestor (hypothetical)', 'Na-Dene', 0.2, 'conjectural', ['vajda2010'],
        'If Dene-Yeniseian holds, a second migration from Siberia falls somewhere near this window.'),
      h('Eskimo-Aleut ancestor (hypothetical)', 'Eskimo-Aleut', 0.15, 'conjectural', ['fortescue1998']),
      h('Proto-Uto-Aztecan (reconstructed)', 'Uto-Aztecan', 0.1, 'reconstructed', ['campbell1997']),
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
      h('Unrecorded language of the region (hypothetical)', 'unclassified', 0.1, 'conjectural', ['campbell1997'],
        'Many languages of eastern North America were extinguished before anyone recorded enough to classify them.'),
    ],
  },

  // =========================================================================
  // SOUTH AMERICA
  // =========================================================================
  {
    id: 'sam-patagonia',
    yearRange: [-10000, 2100],
    zones: ['SOUTH_AMERICAN'],
    places: /\b(patagonia|tierra del fuego|fuegian|magellan|pampas|gran chaco|southern ice fields|uruguay river)\b/,
    hypotheses: [
      h('Chonan (attested from 1600s)', 'Chonan', 0.55, 'inferred', ['adelaar2004'],
        'Tehuelche and Selk\'nam, recorded only after European arrival but spoken in Patagonia long before it.'),
      h('Yaghan or Kawésqar (attested from 1600s)', 'isolate', 0.25, 'inferred', ['adelaar2004'],
        'The canoe peoples of the Fuegian channels spoke isolates unrelated to Chonan or to each other.'),
      h('Unrecorded language of the far south (hypothetical)', 'unclassified', 0.2, 'conjectural', ['adelaar2004', 'kaufman1990'],
        'Ten thousand years of occupation and a record that begins in the seventeenth century.'),
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
      h('Unrecorded Andean language (hypothetical)', 'unclassified', 0.15, 'conjectural', ['adelaar2004'],
        'The Andes had no writing; every pre-Inca language is known only from later record or not at all.'),
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
      h('Unrecorded Amazonian language (hypothetical)', 'unclassified', 0.15, 'conjectural', ['kaufman1990', 'eppsMichael2023'],
        'Amazonia holds dozens of small families and isolates, and lost many more to the epidemics that preceded any recording.'),
    ],
  },
  {
    id: 'sam-early',
    yearRange: [-10000, -3000],
    zones: ['SOUTH_AMERICAN'],
    hypotheses: [
      h('Unrecorded language of the region (hypothetical)', 'unclassified', 0.55, 'conjectural', ['kaufman1990', 'nichols1992'],
        'South America was fully occupied by this date and no family in it can be reconstructed anywhere near this deep.'),
      h('Pre-Andean highland (hypothetical)', 'unclassified', 0.2, 'conjectural', ['adelaar2004']),
      h('Proto-Chibchan (reconstructed)', 'Chibchan', 0.15, 'reconstructed', ['kaufman1990'],
        'The northern isthmus, one of the older reconstructable families of the region.'),
      h('Pre-Tupían lowland (hypothetical)', 'unclassified', 0.1, 'conjectural', ['eppsMichael2023']),
    ],
  },

  // =========================================================================
  // NORTH AMERICA AFTER CONTACT
  // =========================================================================
  {
    id: 'nac-colonial',
    yearRange: [1500, 2100],
    zones: ['NORTH_AMERICAN_COLONIAL'],
    hypotheses: [
      h('English (attested)', 'Indo-European', 0.45, 'attested', ['glottolog']),
      h('Algonquian (reconstructed)', 'Algic', 0.2, 'reconstructed', ['goddard1996'],
        'Still the majority speech of the eastern seaboard through the seventeenth century.'),
      h('French (attested)', 'Indo-European', 0.15, 'attested', ['glottolog'],
        'The St Lawrence, the Great Lakes and the Mississippi.'),
      h('Spanish (attested)', 'Indo-European', 0.1, 'attested', ['glottolog']),
      h('Iroquoian (reconstructed)', 'Iroquoian', 0.1, 'reconstructed', ['goddard1996']),
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
      h('Unrecorded language of the region (hypothetical)', 'unclassified', 0.6, 'inferred', ['campbell1997', 'goddard1996']),
      h('Uto-Aztecan language of the region', 'Uto-Aztecan', 0.2, 'inferred', ['campbell1997']),
      h('Algonquian language of the region', 'Algic', 0.2, 'inferred', ['goddard1996']),
    ],
  },
  {
    id: 'backstop-south-american',
    yearRange: [-10000, 2100],
    zones: ['SOUTH_AMERICAN'],
    hypotheses: [
      h('Unrecorded language of the region (hypothetical)', 'unclassified', 0.5, 'inferred', ['kaufman1990']),
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
