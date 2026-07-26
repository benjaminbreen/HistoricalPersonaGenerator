/**
 * constants/gameData/scholarlySources.ts
 *
 * A general citation registry. Anywhere this app makes a dated historical claim
 * — what language was spoken here, when metal was worked, when Europeans
 * arrived — it should be able to say what that claim rests on.
 *
 * Language attribution is the first consumer. `societyCapabilities.ts` and the
 * demographic model are the intended next ones, which is why entries carry a
 * `topic` rather than being language-specific.
 *
 * Editorial rules:
 *   - Real works only. Author, year, title and venue must be verifiable.
 *   - No URLs or DOIs unless certain. A correct citation is findable without
 *     one; a fabricated link is worse than none.
 *   - `supports` says what the work is being cited *for*, not what it is about.
 *   - `contested` names the disagreement where the claim is genuinely live.
 */

export type SourceTopic =
  | 'historical-linguistics'
  | 'archaeology'
  | 'population-genetics'
  | 'method'
  | 'demography'
  | 'material-culture';

export interface ScholarlySource {
  id: string;
  authors: string;
  year: number;
  title: string;
  venue?: string;
  kind: 'book' | 'article' | 'chapter' | 'database';
  topic: SourceTopic;
  /** What this work is cited for in this app, in one line. */
  supports: string;
  /** Where the claim is disputed, and by whom. */
  contested?: string;
}

export const SCHOLARLY_SOURCES: Record<string, ScholarlySource> = {
  // -------------------------------------------------------------------------
  // Method and general
  // -------------------------------------------------------------------------
  nichols1992: {
    id: 'nichols1992',
    authors: 'Johanna Nichols',
    year: 1992,
    title: 'Linguistic Diversity in Space and Time',
    venue: 'University of Chicago Press',
    kind: 'book',
    topic: 'method',
    supports: 'Expected linguistic diversity of regions without a dominant expansion, and the depth at which relatedness stops being recoverable.',
  },
  bergslandVogt1962: {
    id: 'bergslandVogt1962',
    authors: 'Knut Bergsland & Hans Vogt',
    year: 1962,
    title: 'On the Validity of Glottochronology',
    venue: 'Current Anthropology 3(2)',
    kind: 'article',
    topic: 'method',
    supports: 'Why dates derived from rates of lexical replacement carry wide error bars, and should be treated as ranges rather than points.',
  },
  campbell1998nostratic: {
    id: 'campbell1998nostratic',
    authors: 'Lyle Campbell',
    year: 1998,
    title: 'Nostratic: A Personal Assessment',
    venue: 'in Nostratic: Sifting the Evidence, John Benjamins',
    kind: 'chapter',
    topic: 'method',
    supports: 'The case against macro-family proposals that reach beyond roughly ten thousand years; the basis for this app\'s deep-time floor.',
  },
  bomhard2008: {
    id: 'bomhard2008',
    authors: 'Allan R. Bomhard',
    year: 2008,
    title: 'Reconstructing Proto-Nostratic',
    venue: 'Brill',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The most developed statement of the Nostratic hypothesis, cited where an app window brushes against it.',
    contested: 'Rejected by most historical linguists; see Campbell (1998).',
  },
  diamondBellwood2003: {
    id: 'diamondBellwood2003',
    authors: 'Jared Diamond & Peter Bellwood',
    year: 2003,
    title: 'Farmers and Their Languages: The First Expansions',
    venue: 'Science 300(5619)',
    kind: 'article',
    topic: 'archaeology',
    supports: 'The general model in which farming populations carry their languages outward, which underlies most expansion windows here.',
  },
  bellwood2005: {
    id: 'bellwood2005',
    authors: 'Peter Bellwood',
    year: 2005,
    title: 'First Farmers: The Origins of Agricultural Societies',
    venue: 'Blackwell',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Dates and directions for Neolithic dispersals in Eurasia, Africa and the Pacific.',
  },
  glottolog: {
    id: 'glottolog',
    authors: 'Harald Hammarström, Robert Forkel, Martin Haspelmath & Sebastian Bank',
    year: 2024,
    title: 'Glottolog',
    venue: 'Max Planck Institute for Evolutionary Anthropology',
    kind: 'database',
    topic: 'historical-linguistics',
    supports: 'Family membership and classification for named languages throughout.',
  },

  // -------------------------------------------------------------------------
  // Indo-European and Europe
  // -------------------------------------------------------------------------
  renfrew1987: {
    id: 'renfrew1987',
    authors: 'Colin Renfrew',
    year: 1987,
    title: 'Archaeology and Language: The Puzzle of Indo-European Origins',
    venue: 'Cambridge University Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'The Anatolian farming hypothesis for Indo-European origins, and the presence of Neolithic farming languages in Europe before any steppe arrival.',
    contested: 'The steppe model (Anthony 2007; Haak et al. 2015) is now better supported by ancient DNA.',
  },
  mallory2006: {
    id: 'mallory2006',
    authors: 'J. P. Mallory & D. Q. Adams',
    year: 2006,
    title: 'The Oxford Introduction to Proto-Indo-European and the Proto-Indo-European World',
    venue: 'Oxford University Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The reconstructed vocabulary and probable date range of Proto-Indo-European, and the sequence of branch separations.',
  },
  anthony2007: {
    id: 'anthony2007',
    authors: 'David W. Anthony',
    year: 2007,
    title: 'The Horse, the Wheel, and Language',
    venue: 'Princeton University Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'The Pontic-Caspian steppe homeland and a late Proto-Indo-European dispersal in the fourth and third millennia BCE.',
  },
  haak2015: {
    id: 'haak2015',
    authors: 'Wolfgang Haak et al.',
    year: 2015,
    title: 'Massive Migration from the Steppe Was a Source for Indo-European Languages in Europe',
    venue: 'Nature 522',
    kind: 'article',
    topic: 'population-genetics',
    supports: 'Ancient DNA evidence for a large steppe-derived population movement into Europe around 3000 BCE.',
  },
  grayAtkinson2003: {
    id: 'grayAtkinson2003',
    authors: 'Russell D. Gray & Quentin D. Atkinson',
    year: 2003,
    title: 'Language-Tree Divergence Times Support the Anatolian Theory of Indo-European Origin',
    venue: 'Nature 426',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'A phylogenetic date for the Indo-European root substantially older than the steppe model allows.',
    contested: 'Method and calibration disputed; compare Anthony (2007) and Heggarty et al. (2023).',
  },
  bouckaert2012: {
    id: 'bouckaert2012',
    authors: 'Remco Bouckaert et al.',
    year: 2012,
    title: 'Mapping the Origins and Expansion of the Indo-European Language Family',
    venue: 'Science 337(6097)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Phylogeographic reconstruction of where Indo-European branches were at given dates.',
  },
  heggarty2023: {
    id: 'heggarty2023',
    authors: 'Paul Heggarty et al.',
    year: 2023,
    title: 'Language Trees with Sampled Ancestors Support a Hybrid Model for the Origin of Indo-European Languages',
    venue: 'Science 381(6656)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'A hybrid chronology in which Indo-European is older than the steppe model but spread through it — the position this app follows for the fifth to third millennia.',
  },
  trask1997: {
    id: 'trask1997',
    authors: 'R. L. Trask',
    year: 1997,
    title: 'The History of Basque',
    venue: 'Routledge',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Basque as the sole survivor of a pre-Indo-European language population in western Europe, and the limits of the Vasconic hypothesis.',
    contested: 'Vennemann\'s wider Vasconic substrate claims are not generally accepted.',
  },
  janhunen2009: {
    id: 'janhunen2009',
    authors: 'Juha Janhunen',
    year: 2009,
    title: 'Proto-Uralic — What, Where, and When?',
    venue: 'Suomalais-Ugrilaisen Seuran Toimituksia 258',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'Date and probable homeland of Proto-Uralic, and its spread into northern Fennoscandia.',
  },

  // -------------------------------------------------------------------------
  // Africa and the Near East
  // -------------------------------------------------------------------------
  ehret1995: {
    id: 'ehret1995',
    authors: 'Christopher Ehret',
    year: 1995,
    title: 'Reconstructing Proto-Afroasiatic',
    venue: 'University of California Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'A deep date and a likely African homeland for Afroasiatic, placing its early stages within the app\'s reach.',
    contested: 'A Levantine homeland is argued by others; the internal chronology is not settled.',
  },
  ehret2001: {
    id: 'ehret2001',
    authors: 'Christopher Ehret',
    year: 2001,
    title: 'A Historical-Comparative Reconstruction of Nilo-Saharan',
    venue: 'Rüdiger Köppe',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Nilo-Saharan as a very old grouping across the Sahara and Sahel during the African Humid Period.',
    contested: 'The unity of Nilo-Saharan is questioned; several branches may not belong.',
  },
  ehret2002: {
    id: 'ehret2002',
    authors: 'Christopher Ehret',
    year: 2002,
    title: 'The Civilizations of Africa: A History to 1800',
    venue: 'University Press of Virginia',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Correlation of African language families with subsistence economies and their movement.',
  },
  blench2006: {
    id: 'blench2006',
    authors: 'Roger Blench',
    year: 2006,
    title: 'Archaeology, Language, and the African Past',
    venue: 'AltaMira Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Where the major African families were before the Bantu expansion, and how far the archaeology constrains that.',
  },
  guldemann2008: {
    id: 'guldemann2008',
    authors: 'Tom Güldemann',
    year: 2008,
    title: 'A Linguist\'s View: Khoe-Kwadi Speakers as the Earliest Food-Producers of Southern Africa',
    venue: 'Southern African Humanities 20',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Click-language populations of southern and eastern Africa as distinct and very old, and against treating "Khoisan" as a single family.',
  },
  vansina1990: {
    id: 'vansina1990',
    authors: 'Jan Vansina',
    year: 1990,
    title: 'Paths in the Rainforests',
    venue: 'University of Wisconsin Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'The social history of the Bantu-speaking expansion through equatorial Africa.',
  },
  grollemund2015: {
    id: 'grollemund2015',
    authors: 'Rebecca Grollemund et al.',
    year: 2015,
    title: 'Bantu Expansion Shows That Habitat Alters the Route and Pace of Human Dispersals',
    venue: 'PNAS 112(43)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Dated route and pace of the Bantu dispersal, used for the timing of Bantu windows here.',
  },
  bostoen2018: {
    id: 'bostoen2018',
    authors: 'Koen Bostoen',
    year: 2018,
    title: 'The Bantu Expansion',
    venue: 'Oxford Research Encyclopedia of African History',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'Current synthesis of Bantu origins in the Cameroonian grassfields and subsequent spread.',
  },

  // -------------------------------------------------------------------------
  // Asia
  // -------------------------------------------------------------------------
  sagart2019: {
    id: 'sagart2019',
    authors: 'Laurent Sagart et al.',
    year: 2019,
    title: 'Dated Language Phylogenies Shed Light on the Ancestry of Sino-Tibetan',
    venue: 'PNAS 116(21)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'A date of roughly 7,200 years before present for Sino-Tibetan, in northern China.',
    contested: 'A Himalayan homeland with a deeper date is argued by van Driem.',
  },
  vanDriem2001: {
    id: 'vanDriem2001',
    authors: 'George van Driem',
    year: 2001,
    title: 'Languages of the Himalayas',
    venue: 'Brill',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The alternative Himalayan account of Sino-Tibetan origins and the diversity of the eastern Himalaya.',
  },
  blust2013: {
    id: 'blust2013',
    authors: 'Robert Blust',
    year: 2013,
    title: 'The Austronesian Languages (revised edition)',
    venue: 'Asia-Pacific Linguistics',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Austronesian origins in Taiwan, the primary subgrouping, and the sequence of the Pacific dispersal.',
  },
  robbeets2021: {
    id: 'robbeets2021',
    authors: 'Martine Robbeets et al.',
    year: 2021,
    title: 'Triangulation Supports Agricultural Spread of the Transeurasian Languages',
    venue: 'Nature 599',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'A common origin for Turkic, Mongolic, Tungusic, Koreanic and Japonic in Neolithic millet farming of the West Liao river.',
    contested: 'The Transeurasian (Altaic) grouping is rejected by many specialists, who explain the similarities as contact.',
  },
  vovin2010: {
    id: 'vovin2010',
    authors: 'Alexander Vovin',
    year: 2010,
    title: 'Koreo-Japonica: A Re-Evaluation of a Common Genetic Origin',
    venue: 'University of Hawai\'i Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'A sceptical account of Koreanic–Japonic relatedness, and the shallow time depth of both families.',
  },
  whitman2011: {
    id: 'whitman2011',
    authors: 'John Whitman',
    year: 2011,
    title: 'Northeast Asian Linguistic Ecology and the Advent of Rice Agriculture in Korea and Japan',
    venue: 'Rice 4',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Japonic arriving in the archipelago with Yayoi rice agriculture around 900 BCE, over a pre-existing Jōmon population.',
  },
  hudson1999: {
    id: 'hudson1999',
    authors: 'Mark J. Hudson',
    year: 1999,
    title: 'Ruins of Identity: Ethnogenesis in the Japanese Islands',
    venue: 'University of Hawai\'i Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'The Jōmon-to-Yayoi transition as population replacement and admixture rather than simple cultural change.',
  },
  southworth2005: {
    id: 'southworth2005',
    authors: 'Franklin C. Southworth',
    year: 2005,
    title: 'Linguistic Archaeology of South Asia',
    venue: 'Routledge',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Dravidian, Indo-Aryan and Munda distributions in prehistoric South Asia, and the agricultural vocabulary each carries.',
  },
  witzel1999: {
    id: 'witzel1999',
    authors: 'Michael Witzel',
    year: 1999,
    title: 'Substrate Languages in Old Indo-Aryan',
    venue: 'Electronic Journal of Vedic Studies 5(1)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Evidence in the Rigveda for at least one non-Dravidian, non-Indo-Aryan language in the northwest.',
  },
  fuller2007: {
    id: 'fuller2007',
    authors: 'Dorian Q. Fuller',
    year: 2007,
    title: 'Non-Human Genetics, Agricultural Origins and Historical Linguistics in South Asia',
    venue: 'in The Evolution and History of Human Populations in South Asia, Springer',
    kind: 'chapter',
    topic: 'archaeology',
    supports: 'Independent agricultural origins in peninsular India and their correlation with Dravidian.',
  },

  // -------------------------------------------------------------------------
  // The Pacific and Australia
  // -------------------------------------------------------------------------
  gray2009: {
    id: 'gray2009',
    authors: 'Russell D. Gray, Alexei J. Drummond & Simon J. Greenhill',
    year: 2009,
    title: 'Language Phylogenies Reveal Expansion Pulses and Pauses in Pacific Settlement',
    venue: 'Science 323(5913)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Dated pulses of the Austronesian settlement of the Pacific, including the pause before Remote Oceania.',
  },
  kirch2000: {
    id: 'kirch2000',
    authors: 'Patrick V. Kirch',
    year: 2000,
    title: 'On the Road of the Winds: An Archaeological History of the Pacific Islands',
    venue: 'University of California Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Settlement dates for the Pacific island groups, including the late colonisation of the eastern Polynesian margins.',
  },
  pawley2018: {
    id: 'pawley2018',
    authors: 'Andrew Pawley & Harald Hammarström',
    year: 2018,
    title: 'The Trans New Guinea Family',
    venue: 'in The Languages and Linguistics of the New Guinea Area, De Gruyter Mouton',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'The extent and probable age of Trans-New Guinea, and the depth of Papuan diversity outside it.',
  },
  ross2005: {
    id: 'ross2005',
    authors: 'Malcolm Ross',
    year: 2005,
    title: 'Pronouns as a Preliminary Diagnostic for Grouping Papuan Languages',
    venue: 'in Papuan Pasts, Pacific Linguistics',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'That New Guinea holds many unrelated families rather than one, constraining how confidently any window can name a language there.',
  },
  dixon1980: {
    id: 'dixon1980',
    authors: 'R. M. W. Dixon',
    year: 1980,
    title: 'The Languages of Australia',
    venue: 'Cambridge University Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The Pama-Nyungan / non-Pama-Nyungan division and the distinctive character of Australian linguistic prehistory.',
  },
  evans2010: {
    id: 'evans2010',
    authors: 'Nicholas Evans',
    year: 2010,
    title: 'Dying Words: Endangered Languages and What They Have to Tell Us',
    venue: 'Wiley-Blackwell',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The scale of linguistic diversity in Aboriginal Australia and northern Australia in particular.',
  },
  bouckaert2018: {
    id: 'bouckaert2018',
    authors: 'Remco Bouckaert, Claire Bowern & Quentin Atkinson',
    year: 2018,
    title: 'The Origin and Expansion of Pama-Nyungan Languages Across Australia',
    venue: 'Nature Ecology & Evolution 2',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'A mid-Holocene expansion of Pama-Nyungan from the Gulf of Carpentaria, dated to roughly 4,000 years before present.',
  },
  bowernAtkinson2012: {
    id: 'bowernAtkinson2012',
    authors: 'Claire Bowern & Quentin Atkinson',
    year: 2012,
    title: 'Computational Phylogenetics and the Internal Structure of Pama-Nyungan',
    venue: 'Language 88(4)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Internal subgrouping of Pama-Nyungan, used for regional assignment within Australia.',
  },

  // -------------------------------------------------------------------------
  // The Americas
  // -------------------------------------------------------------------------
  campbell1997: {
    id: 'campbell1997',
    authors: 'Lyle Campbell',
    year: 1997,
    title: 'American Indian Languages: The Historical Linguistics of Native America',
    venue: 'Oxford University Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The accepted family-level classification of the Americas, and the rejection of continent-wide groupings.',
    contested: 'Greenberg\'s "Amerind" proposal is treated here as not accepted, following Campbell.',
  },
  goddard1996: {
    id: 'goddard1996',
    authors: 'Ives Goddard (ed.)',
    year: 1996,
    title: 'Handbook of North American Indians, Volume 17: Languages',
    venue: 'Smithsonian Institution',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Historical distribution of North American families at and before contact.',
  },
  golla2011: {
    id: 'golla2011',
    authors: 'Victor Golla',
    year: 2011,
    title: 'California Indian Languages',
    venue: 'University of California Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'The exceptional density of unrelated families in California, and estimated depths for each.',
  },
  vajda2010: {
    id: 'vajda2010',
    authors: 'Edward Vajda',
    year: 2010,
    title: 'A Siberian Link with Na-Dene Languages',
    venue: 'in The Dene–Yeniseian Connection, Anthropological Papers of the University of Alaska',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'The Dene–Yeniseian proposal linking Na-Dene to Yeniseian in central Siberia.',
    contested: 'Better received than most long-range proposals, but not universally accepted.',
  },
  fortescue1998: {
    id: 'fortescue1998',
    authors: 'Michael Fortescue',
    year: 1998,
    title: 'Language Relations Across Bering Strait',
    venue: 'Cassell',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Eskimo-Aleut and Chukotko-Kamchatkan prehistory around the Bering Strait.',
  },
  kaufmanJusteson2007: {
    id: 'kaufmanJusteson2007',
    authors: 'Terrence Kaufman & John Justeson',
    year: 2007,
    title: 'The History of the Word for Cacao in Ancient Mesoamerica',
    venue: 'Ancient Mesoamerica 18',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'Dated contact and borrowing between Mesoamerican families, used to place Mixe-Zoquean and Mayan in time.',
  },
  campbellKaufman1976: {
    id: 'campbellKaufman1976',
    authors: 'Lyle Campbell & Terrence Kaufman',
    year: 1976,
    title: 'A Linguistic Look at the Olmecs',
    venue: 'American Antiquity 41(1)',
    kind: 'article',
    topic: 'historical-linguistics',
    supports: 'The identification of the Olmec with Mixe-Zoquean speech.',
    contested: 'Disputed; the Olmec language is not securely known.',
  },
  dillehay1997: {
    id: 'dillehay1997',
    authors: 'Tom D. Dillehay',
    year: 1997,
    title: 'Monte Verde: A Late Pleistocene Settlement in Chile, Volume 2',
    venue: 'Smithsonian Institution Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Occupation of the southern cone by at least 12,500 BCE, and the depth of continuity the southern Andean windows assume.',
  },
  meltzer2009: {
    id: 'meltzer2009',
    authors: 'David J. Meltzer',
    year: 2009,
    title: 'First Peoples in a New World: Colonizing Ice Age America',
    venue: 'University of California Press',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Early Holocene archaeological traditions of North America, used to name languages by the culture that spoke them where no family can be reconstructed.',
  },
  aikhenvald2012: {
    id: 'aikhenvald2012',
    authors: 'Alexandra Y. Aikhenvald',
    year: 2012,
    title: 'Languages of the Amazon',
    venue: 'Oxford University Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Distribution and relative depth of Amazonian families, and the small relic families of the northwest Amazon.',
  },
  adelaarIsolates: {
    id: 'adelaarIsolates',
    authors: 'Willem F. H. Adelaar',
    year: 2008,
    title: 'Relações externas do Macro-Jê: o caso do Chiquitano',
    venue: 'in Topicalizando Macro-Jê, Nectar',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'Deep relationships proposed for Macro-Jê and the difficulty of dating them.',
    contested: 'The external relations of Macro-Jê remain unresolved.',
  },
  adelaar2004: {
    id: 'adelaar2004',
    authors: 'Willem F. H. Adelaar with Pieter C. Muysken',
    year: 2004,
    title: 'The Languages of the Andes',
    venue: 'Cambridge University Press',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Andean and southern South American families, including Chonan in Patagonia and Tierra del Fuego.',
  },
  heggartyBeresfordJones2012: {
    id: 'heggartyBeresfordJones2012',
    authors: 'Paul Heggarty & David Beresford-Jones (eds.)',
    year: 2012,
    title: 'Archaeology and Language in the Andes',
    venue: 'Oxford University Press / British Academy',
    kind: 'book',
    topic: 'archaeology',
    supports: 'Chronology for the Quechuan and Aymaran dispersals relative to Andean states.',
  },
  kaufman1990: {
    id: 'kaufman1990',
    authors: 'Terrence Kaufman',
    year: 1990,
    title: 'Language History in South America: What We Know and How to Know More',
    venue: 'in Amazonian Linguistics, University of Texas Press',
    kind: 'chapter',
    topic: 'historical-linguistics',
    supports: 'Family-level classification of lowland South America and the limits of what can be dated there.',
  },
  eppsMichael2023: {
    id: 'eppsMichael2023',
    authors: 'Patience Epps & Lev Michael (eds.)',
    year: 2023,
    title: 'Amazonian Languages: An International Handbook',
    venue: 'De Gruyter Mouton',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Current synthesis of Amazonian family distributions and their probable movements.',
  },
  urban2019: {
    id: 'urban2019',
    authors: 'Matthias Urban',
    year: 2019,
    title: 'Lost Languages of the Peruvian North Coast',
    venue: 'Ibero-Amerikanisches Institut',
    kind: 'book',
    topic: 'historical-linguistics',
    supports: 'Non-Quechuan, non-Aymaran languages of the Peruvian coast such as Mochica and Quingnam.',
  },
};

/** Look up a set of sources by id, skipping any that are unknown. */
export function getSources(ids: string[]): ScholarlySource[] {
  return ids.map(id => SCHOLARLY_SOURCES[id]).filter(Boolean);
}

/** Formatted for display: "Anthony (2007), The Horse, the Wheel, and Language". */
export function formatSource(source: ScholarlySource): string {
  const lead = source.authors.split(' ').slice(-1)[0];
  return `${lead} (${source.year}), ${source.title}`;
}
