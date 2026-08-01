/**
 * services/polityService.ts
 *
 * Which state claimed a person, and since when.
 *
 * The annotation record has always had a `place.polity` field, and it has
 * always been filled from an eight-row table with no year in it — a persona
 * born in Kyoto in 1200 could be handed "Dutch Republic", and one born in
 * Bengal in 900 was handed "Mughal Empire" six centuries early. The field goes
 * into the model prompt verbatim, so a wrong polity is worse than none.
 *
 * This resolves the polity from the region and the year instead. Two rules
 * govern the data:
 *
 * 1. Only states that actually existed under a name contemporaries or
 *    historians use. Where a region had no state — most of human history, in
 *    most places — this returns `undefined` and the caller omits the field.
 *    "Tribal confederation" is not a polity, it is a way of writing something
 *    down when you know nothing.
 * 2. Gaps are honest. An era list may leave centuries uncovered between two
 *    entries; that means the region was contested, stateless, or outside what
 *    this table is willing to claim.
 *
 * `since` is what makes this worth having over a static label. A persona born
 * eleven years into Mughal rule and one born four hundred years into Chinese
 * imperial continuity are differently placed, and only the start year says so.
 */

import type { CulturalZone } from '../types/characterData';

/** A single regime, `from` inclusive and `until` exclusive. Years are CE; BCE is negative. */
interface PolityEra {
  from: number;
  until?: number;
  name: string;
}

export interface PolityContext {
  year: number;
  region?: string;
  location?: string;
  culturalZone?: CulturalZone;
}

/**
 * The zone as the table spells it.
 *
 * Personas carry their zone flattened for display — "NORTH AMERICAN COLONIAL",
 * "SOUTHEAST ASIAN" — and several callers hand that straight back with a cast.
 * Since the zone test below is now fail-closed, an unrecognised spelling would
 * quietly cost a persona their state, so the spacing is repaired here rather
 * than at each call site.
 */
const canonicalZone = (zone?: string): string | undefined =>
  zone ? zone.toUpperCase().replace(/[\s-]+/g, '_') : undefined;

/**
 * A device the state actually used, and what kind of thing it was.
 *
 * The distinction is the point. Most states in this table never had a flag —
 * flags as state identity are largely post-1700 — and several had heraldic or
 * dynastic devices, which are a different sort of object. `from` matters as
 * much as the image: the Ottoman star and crescent standardised in the 1840s,
 * so an Ottoman persona in 1650 must not be shown one.
 */
export interface PolityEmblem {
  kind: 'flag' | 'banner' | 'arms';
  /** The earliest year this device is attested. Below it, nothing is shown. */
  from: number;
  /** Key into the drawn emblem set in `components/polityEmblems`. */
  id: string;
}

export interface ResolvedPolity {
  /** The state's name, as it would be given in a reference work. */
  name: string;
  /** The year this regime began here. */
  since: number;
  /** The year it ended here, if the table knows of an end. */
  until?: number;
  /** Wikipedia article title, for the badge's hover card. */
  wikipedia: string;
  /** Present only where a device is attested and the year is late enough. */
  emblem?: PolityEmblem;
  /** A Commons flag image, where one is held for this polity and this year. */
  flagUrl?: string;
}

/**
 * Devices, keyed by polity name so one entry covers every region the state
 * appears in — "United Kingdom" is reached from the British Isles, Scotland and
 * Ireland entries alike.
 *
 * Nothing is here that I could not point at a source for, which is why the list
 * is shorter than the polity table by a wide margin. Two deliberate omissions
 * rather than oversights: Nazi Germany, whose flag I will not draw, and the
 * Confederate States, which is a live enough symbol that it should be your call
 * and not a side effect of a data commit. Both fall back to a name-only chip,
 * which is the same treatment the Inca Empire and Srivijaya get for the simpler
 * reason that they had no such thing.
 */
const EMBLEMS: Record<string, PolityEmblem> = {
  'Kingdom of England': { kind: 'banner', from: 1270, id: 'st-george' },
  'Kingdom of Scotland': { kind: 'banner', from: 1385, id: 'saltire' },
  'Kingdom of Great Britain': { kind: 'flag', from: 1707, id: 'union-1707' },
  'United Kingdom': { kind: 'flag', from: 1801, id: 'union-1801' },
  'Kingdom of France': { kind: 'banner', from: 1376, id: 'france-ancien' },
  'French First Republic': { kind: 'flag', from: 1794, id: 'tricolore' },
  'First French Empire': { kind: 'flag', from: 1804, id: 'tricolore' },
  'French Second Republic': { kind: 'flag', from: 1848, id: 'tricolore' },
  'Second French Empire': { kind: 'flag', from: 1852, id: 'tricolore' },
  'French Third Republic': { kind: 'flag', from: 1870, id: 'tricolore' },
  'French Republic': { kind: 'flag', from: 1946, id: 'tricolore' },
  'Dutch Republic': { kind: 'flag', from: 1596, id: 'netherlands' },
  'Kingdom of the Netherlands': { kind: 'flag', from: 1815, id: 'netherlands' },
  'Russian Empire': { kind: 'flag', from: 1705, id: 'russia' },
  'Russian Federation': { kind: 'flag', from: 1991, id: 'russia' },
  'Soviet Union': { kind: 'flag', from: 1923, id: 'ussr' },
  'German Empire': { kind: 'flag', from: 1871, id: 'german-empire' },
  'Weimar Republic': { kind: 'flag', from: 1919, id: 'germany' },
  'Germany': { kind: 'flag', from: 1949, id: 'germany' },
  'Ottoman Empire': { kind: 'flag', from: 1844, id: 'ottoman' },
  'Republic of Turkey': { kind: 'flag', from: 1923, id: 'turkey' },
  'Kingdom of Greece': { kind: 'flag', from: 1822, id: 'greece' },
  'Empire of Japan': { kind: 'flag', from: 1870, id: 'hinomaru' },
  'Japan': { kind: 'flag', from: 1947, id: 'hinomaru' },
  'United States': { kind: 'flag', from: 1777, id: 'stars-and-stripes' },
  "People's Republic of China": { kind: 'flag', from: 1949, id: 'prc' },
  'Spanish monarchy': { kind: 'flag', from: 1785, id: 'spain' },
  'Kingdom of Spain': { kind: 'flag', from: 1785, id: 'spain' },
};

/**
 * Wikimedia Commons files, for polities whose Wikipedia lead image is a map.
 *
 * The badge's automatic path takes the article's lead image and keeps it only
 * when the filename says "flag", "banner" or "standard" — a good filter, since
 * measured across the table the lead image is a map more often than a flag, and
 * a map at 20px is a smear. But it means the Achaemenid Empire got nothing
 * despite the Standard of Cyrus sitting on its page, and the same for Rome,
 * Byzantium and the Mughals.
 *
 * These fill that gap. Every filename here was verified to exist against the
 * Commons API rather than guessed — an earlier pass of hand-written guesses
 * resolved 15 of 60, and the difference was mostly a missing User-Agent, so the
 * check is worth redoing if this list is ever extended.
 *
 * Several are reconstructions rather than contemporary artefacts, which is a
 * deliberate loosening: the standard here is what Wikipedia shows, not what a
 * vexillologist would defend. Where a filename carries a date range it is
 * parsed below and the flag is withheld outside it, so a Qing subject in 1700
 * still gets no 1889 dragon flag.
 */
const FLAG_FILES: Record<string, string> = {
  'Achaemenid Empire': 'Standard of Cyrus the Great (Achaemenid Empire).svg',
  'Roman Empire': 'Vexilloid of the Roman Empire.svg',
  'Roman Republic': 'Vexilloid of the Roman Empire.svg',
  'Byzantine Empire': 'Byzantine imperial flag, 14th century, square.svg',
  'Ottoman Empire': 'Flag of the Ottoman Empire (1844–1922).svg',
  'Mughal Empire': 'Alam of the Mughal Empire.svg',
  'Safavid Empire': 'Safavid Flag.svg',
  'Qajar Persia': 'Flag of Persia (1907-1933).svg',
  'Pahlavi Iran': 'Flag of Iran (1964-1980).svg',
  'Islamic Republic of Iran': 'Flag of Iran.svg',
  'Republic of Venice': 'Flag of Most Serene Republic of Venice.svg',
  'Kingdom of Italy': 'Flag of Italy (1861-1946).svg',
  'Austrian Empire': 'Flag of the Habsburg Monarchy.svg',
  'Habsburg monarchy': 'Flag of the Habsburg Monarchy.svg',
  'Austria-Hungary': 'Flag of Austria-Hungary (1869-1918).svg',
  'German Empire': 'Flag of the German Empire.svg',
  'Weimar Republic': 'Flag of Germany (3-2).svg',
  'German Confederation': 'Flag of the German Confederation (war).svg',
  'Russian Empire': 'Flag of Russia.svg',
  'Russian Federation': 'Flag of Russia.svg',
  'Tsardom of Russia': 'Flag of Russia.svg',
  'Soviet Union': 'Flag of the Soviet Union.svg',
  'Kingdom of Poland': 'Flag of Poland.svg',
  'Poland': 'Flag of Poland.svg',
  'Dutch Republic': 'Statenvlag.svg',
  'Kingdom of Greece': 'Flag of Greece (1822-1978).svg',
  'Empire of Japan': 'Flag of Japan.svg',
  'Tokugawa shogunate': 'Flag of the Tokugawa Shogunate.svg',
  'Joseon': 'Flag of Korea (1882–1910).svg',
  "People's Republic of China": 'Flag of China.svg',
  'Republic of China': 'Flag of the Republic of China.svg',
  'the Ashanti Empire': 'Flag of Ashanti.svg',
  'Ethiopian Empire': 'Flag of Ethiopia (1897-1974).svg',
  'Kingdom of Portugal': 'Flag Portugal (1707).svg',
  'Kingdom of Spain': 'Flag of Spain.svg',
  'Kingdom of Hungary': 'Flag of Hungary (1867-1918).svg',
  'the Dutch East Indies': 'Flag of the Netherlands.svg',
  'Kingdom of Iraq': 'Flag of Iraq (1924–1959).svg',
  'Kingdom of Saudi Arabia': 'Flag of Saudi Arabia.svg',
  'Kingdom of Egypt': 'Flag of Egypt (1922–1958).svg',
  'Republic of Egypt': 'Flag of Egypt.svg',
  'Commonwealth of Australia': 'Flag of Australia.svg',
  'New Zealand': 'Flag of New Zealand.svg',
  'Indonesia': 'Flag of Indonesia.svg',
  'the Republic of the Philippines': 'Flag of the Philippines.svg',
  'Sri Lanka': 'Flag of Sri Lanka.svg',
  'the Ryukyu Kingdom': 'Flag of Ryukyu.svg',
  'the Tibetan Empire': 'Flag of Tibet.svg',
  'Republic of Turkey': 'Flag of Turkey.svg',
  'the Mongol Empire': 'Flag of the Mongol Empire.svg',
  'the Timurid Empire': 'Timurid.svg',
};

/**
 * Labels that stand for "whichever of these countries it is now".
 *
 * Only the ones that describe the present. "The Italian states", "the Balkan
 * kingdoms" and "the partitioning empires" are period answers and must never be
 * swapped for a modern country.
 */
const MODERN_PLURALS = new Set([
  'the Sahelian republics', 'the West African republics', 'the Congo Basin republics',
  'the East African republics', 'the Levantine states', 'the Maghreb states',
  'the Caucasus republics', 'the Central Asian republics', 'the mainland Southeast Asian states',
  'the two Korean states', 'the Central European republics', 'the Balkan states',
  'the Central American republics', 'the Caribbean republics and colonies',
  'the Pacific island territories', 'the Micronesian republics', 'Argentina and Chile',
  'the Nordic kingdoms',
]);

/**
 * The present-day state a local area lies in, where it lies in exactly one.
 *
 * This refines the plural labels above and nothing else: a persona in the Niger
 * Delta in 1990 is in Nigeria, not "the West African republics". The era table
 * stays the historical spine — this only ever replaces the label for years the
 * plural already covered, so nothing before independence is touched.
 *
 * Areas absent from this map keep their plural label, and that is the intended
 * answer for two kinds of place: those genuinely spanning several states (Lake
 * Chad touches four, the Lesser Antilles are fifteen, Tierra del Fuego is split)
 * and those under disputed sovereignty, which this file will not adjudicate —
 * Jerusalem Hills, Golan Heights and the Dead Sea Shore are all deliberately
 * absent rather than assigned.
 *
 * Local-area names are this map's own coinages and several collide with real
 * places elsewhere: the Galilee Basin here is in Israel, but there is another in
 * Queensland, and "Benin Lowlands" is the Kingdom of Benin's country, which is
 * Nigeria, not the Republic of Benin next door.
 */
const MODERN_STATE_BY_AREA: Record<string, string> = {
  // Europe
  'Danube Bend': 'Hungary',
  'Bohemian Plateau': 'Czechia',
  'Vienna Basin': 'Austria',
  'Moravian Gate': 'Czechia',
  'Bosporus': 'Turkey',
  'Thracian Plain': 'Bulgaria',
  'Dalmatian Coast': 'Croatia',
  'Vardar Valley': 'North Macedonia',
  'Stockholm Archipelago': 'Sweden',
  'Norwegian Fjords': 'Norway',
  'Jutland Peninsula': 'Denmark',
  'Gotland': 'Sweden',

  // The Americas
  'Panama Isthmus': 'Panama',
  'Cuba': 'Cuba',
  'Jamaica': 'Jamaica',
  'Valdés Peninsula': 'Argentina',
  'Strait of Magellan': 'Chile',

  // MENA
  'Bekaa Valley': 'Lebanon',
  'Mount Lebanon Range': 'Lebanon',
  'Galilee Basin': 'Israel',
  'Fez Plateau': 'Morocco',
  'Rif Coast': 'Morocco',
  'Draa Valley': 'Morocco',
  'Tunisian Sahel': 'Tunisia',
  'Tripolitania': 'Libya',
  'Cyrenaica Coast': 'Libya',
  'Tbilisi Valley': 'Georgia',
  'Mount Ararat': 'Turkey',
  'Chechen Highlands': 'Russia',

  // Sub-Saharan Africa
  'Timbuktu Basin': 'Mali',
  'Niger Bend': 'Mali',
  'Gao Region': 'Mali',
  'Dogon Plateau': 'Mali',
  'Hoggar Mountains': 'Algeria',
  'Tibesti Mountains': 'Chad',
  'Fouta Djallon Highlands': 'Guinea',
  'Sierra Leone Coast': 'Sierra Leone',
  'Ashanti Forest': 'Ghana',
  'Gold Coast Savanna': 'Ghana',
  'Bissagos Islands': 'Guinea-Bissau',
  'Lagos Coastal Belt': 'Nigeria',
  'Ivory Coast': 'Ivory Coast',
  'Cross River Delta': 'Nigeria',
  'Kinshasa Hinterland': 'the Democratic Republic of the Congo',
  'Ituri Rainforest': 'the Democratic Republic of the Congo',
  'Congo River Bend': 'the Democratic Republic of the Congo',
  'Lualaba Headwaters': 'the Democratic Republic of the Congo',
  'Serengeti Plain': 'Tanzania',
  'Mount Kilimanjaro Foothills': 'Tanzania',
  'Olduvai Gorge': 'Tanzania',
  'Bangui Highlands': 'the Central African Republic',
  // Two states, and neither of them in the Congo basin: the plural label the
  // era table supplies for this area reads "the Congo Basin republics".
  'Rwanda Burundi Highlands': 'Rwanda and Burundi',
  'Okavango Delta': 'Botswana',
  'Ibo Plateau': 'Nigeria',
  'Niger Delta': 'Nigeria',
  'Benin Lowlands': 'Nigeria',
  'Oyo Hinterland': 'Nigeria',
  'Jos Plateau': 'Nigeria',
  'Ogun River Basin': 'Nigeria',

  // Asia
  'Irrawaddy Valley': 'Myanmar',
  'Tenasserim Coast': 'Myanmar',
  'Shan Plateau': 'Myanmar',
  'Mekong Delta': 'Vietnam',
  'Red River Delta': 'Vietnam',
  'Chao Phraya Basin': 'Thailand',
  'Tonle Sap Basin': 'Cambodia',
  'Annam Highlands': 'Vietnam',
  'Mekong River Basin': 'Laos',
  'Malay Peninsula': 'Malaysia',
  'Sumatra Highlands': 'Indonesia',
  'Central Java': 'Indonesia',
  'West Java Coast': 'Indonesia',
  'East Java Coast': 'Indonesia',
  'Bali': 'Indonesia',
  'Spice Islands': 'Indonesia',
  'Luzon Highlands': 'the Philippines',
  'Mindanao': 'the Philippines',
  'Palawan': 'the Philippines',
  'Samarkand Region': 'Uzbekistan',
  'Balkh Plains': 'Afghanistan',
  'Han River Valley': 'South Korea',
  'Gyeongju Basin': 'South Korea',
  'Jeolla Highlands': 'South Korea',
  'Busan Coast': 'South Korea',
  'Kaesong Foothills': 'North Korea',
  'Baekdu Mountain Zone': 'North Korea',

  // Oceania
  'Society Islands': 'French Polynesia',
  'Marquesas': 'French Polynesia',
  'Tuamotu Atolls': 'French Polynesia',
  'Tonga Ridge': 'Tonga',
  'Rapa Nui': 'Chile',
  'Marshall Islands': 'the Marshall Islands',
  'Palau': 'Palau',
  'Yap Plateau': 'the Federated States of Micronesia',
  'Northern Mariana Chain': 'the Northern Mariana Islands',
  'Guam and Surroundings': 'Guam',
};

/** Commons renders SVGs to PNG at whatever width is asked for. */
const commonsUrl = (file: string): string =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}?width=80`;

/** Years a flag filename claims for itself — "(1889–1912)". En dashes and hyphens both occur. */
function spanFromFilename(file: string): { from?: number; until?: number } {
  const span = file.match(/\((\d{3,4})\s*[–—-]\s*(\d{3,4})\)/);
  return span ? { from: Number(span[1]), until: Number(span[2]) } : {};
}

/**
 * Article titles that the default derivation below gets wrong. Everything else
 * is the name with a leading article stripped and spaces underscored, which is
 * already correct for "Mughal Empire", "Qing dynasty" and most of the table.
 */
const WIKIPEDIA_OVERRIDES: Record<string, string> = {
  'the Arab caliphates': 'Caliphate',
  'the partitioning empires': 'Partitions_of_Poland',
  'the British American colonies': 'Thirteen_Colonies',
  'the taifa kingdoms of al-Andalus': 'Taifa',
  'the Nordic kingdoms': 'Nordic_countries',
  'the Central American republics': 'Central_America',
  'the Caribbean republics and colonies': 'History_of_the_Caribbean',
  'the French and British sugar colonies': 'West_Indies',
  'the Spanish Caribbean': 'Spanish_West_Indies',
  'the Guiana colonies': 'Guianas',
  'the Dutch Guianas': 'Dutch_Guiana',
  'Guyana, Suriname and French Guiana': 'Guianas',
  'the Christian Nubian kingdoms': 'Nubia',
  'the British and French West African colonies': 'Colonisation_of_Africa',
  'the British and German East African colonies': 'Scramble_for_Africa',
  'the Congo Free State and Belgian Congo': 'Belgian_Congo',
  'the partitioning empires ': 'Partitions_of_Poland',
  'the Swahili city-states': 'Swahili_coast',
  'the Hellenistic successor kingdoms': 'Diadochi',
  'the French and British mandates': 'Mandatory_Palestine',
  'the Crusader states': 'Crusader_states',
  'the Turkic Khaganate': 'Turkic_Khaganate',
  'the Xiongnu confederation': 'Xiongnu',
  'the Third Dynasty of Ur': 'Third_Dynasty_of_Ur',
  'the Old Kingdom of Egypt': 'Old_Kingdom_of_Egypt',
  'the Middle Kingdom of Egypt': 'Middle_Kingdom_of_Egypt',
  'the New Kingdom of Egypt': 'New_Kingdom_of_Egypt',
  'the kingdoms of Israel and Judah': 'Kingdom_of_Israel_(Samaria)',
  'Roman and Byzantine Egypt': 'Egypt_(Roman_province)',
  'Roman and Byzantine Syria': 'Syria_(Roman_province)',
  'the Aztec Triple Alliance': 'Aztec_Empire',
  'Argentina and Chile': 'Patagonia',
  'restored French monarchy': 'Bourbon_Restoration_in_France',
  'Vichy France under German occupation': 'Vichy_France',
  'the Kingdom of Zimbabwe': 'Kingdom_of_Zimbabwe',
  'the Dutch Cape Colony': 'Dutch_Cape_Colony',
  'the British Cape Colony': 'Cape_Colony',
  'the Federal Republic of Central America': 'Federal_Republic_of_Central_America',
  'the American colonial Philippines': 'Insular_Government_of_the_Philippine_Islands',
  'the Dutch East India Company': 'Dutch_East_India_Company',
  'the Dutch East Indies': 'Dutch_East_Indies',
  'the Malacca Sultanate': 'Malacca_Sultanate',
  'the Kingdom of Kandy': 'Kingdom_of_Kandy',
  'the Anuradhapura Kingdom': 'Anuradhapura_Kingdom',
  'the Polonnaruwa Kingdom': 'Kingdom_of_Polonnaruwa',
  'the Ryukyu Kingdom': 'Ryukyu_Kingdom',
  'the Ganden Phodrang': 'Ganden_Phodrang',
  'the Kingdom of Nepal': 'Kingdom_of_Nepal',
  'the Kingdom of Armenia': 'Kingdom_of_Armenia_(antiquity)',
  'the Kingdom of Georgia': 'Kingdom_of_Georgia',
  'the Kingdom of Kush': 'Kingdom_of_Kush',
  'the Kingdom of Meroë': 'Kingdom_of_Kush',
  'the Funj Sultanate': 'Sennar_Sultanate',
  'the Ghana Empire': 'Ghana_Empire',
  'the Zagwe dynasty': 'Zagwe_dynasty',
  'the Kingdom of Aksum': 'Kingdom_of_Aksum',
  'the Oyo Empire': 'Oyo_Empire',
  'the Ashanti Empire': 'Ashanti_Empire',
  'the Kingdom of Dahomey': 'Kingdom_of_Dahomey',
  'the Luba Empire': 'Kingdom_of_Luba',
  'the Lunda Empire': 'Kingdom_of_Lunda',
  'the Inca Empire': 'Inca_Empire',
  'the Wari Empire': 'Wari_Empire',
  'the Viceroyalty of New Spain': 'Viceroyalty_of_New_Spain',
  'the Viceroyalty of Peru': 'Viceroyalty_of_Peru',
  'the Viceroyalty of New Granada': 'Viceroyalty_of_New_Granada',
  'the Viceroyalty of the Río de la Plata': 'Viceroyalty_of_the_Río_de_la_Plata',
  'the Toltec state': 'Toltec',
  'the British Australian colonies': 'History_of_Australia_(1788–1850)',
  'the British colony of New Zealand': 'Colony_of_New_Zealand',
  'the Chagatai Khanate': 'Chagatai_Khanate',
  'the Samanid Empire': 'Samanid_Empire',
  'the Ilkhanate': 'Ilkhanate',
  'the Golden Horde': 'Golden_Horde',
  'the Khmer Empire': 'Khmer_Empire',
  'the Pagan Kingdom': 'Pagan_Kingdom',
  'the Kingdom of Ayutthaya': 'Ayutthaya_Kingdom',
  'the Kingdom of Siam': 'Rattanakosin_Kingdom',
  'the Majapahit Empire': 'Majapahit',
  'the Spanish East Indies': 'Captaincy_General_of_the_Philippines',
  'the Lordship of Ireland': 'Lordship_of_Ireland',
  'the Omani Sultanate': 'Omani_Empire',
  'the Tibetan Empire': 'Tibetan_Empire',
  'the Zulu Kingdom': 'Zulu_Kingdom',
  'the Confederate States': 'Confederate_States_of_America',
  'the Nara court': 'Nara_period',
  'the Heian court': 'Heian_period',
  'East India Company rule': 'Company_rule_in_India',
  'Japanese colonial rule': 'Korea_under_Japanese_rule',
  'the Old Babylonian Kingdom': 'First_Babylonian_dynasty',
  'the Indus Valley civilization': 'Indus_Valley_Civilisation',
  'the Rashtrakuta empire': 'Rashtrakuta_dynasty',
  'the Rashidun Caliphate': 'Rashidun_Caliphate',

  // Southeast Asia. Most of these names are not the titles Wikipedia files them
  // under — "Đại Việt under the Lê" is the Lê dynasty, the post-Angkor Khmer
  // kingdom has no article of its own — so the join-with-underscores default
  // would produce a dead link for nearly every one.
  'the kingdoms of Ava and Pegu': 'Kingdom_of_Ava',
  'the Toungoo Dynasty': 'Toungoo_dynasty',
  'the Konbaung Dynasty': 'Konbaung_dynasty',
  'the Dvaravati kingdoms': 'Dvaravati',
  'the Kingdom of Sukhothai': 'Sukhothai_Kingdom',
  'the Kingdom of Thonburi': 'Thonburi_Kingdom',
  'the Post-Angkor Khmer kingdom': 'Post-Angkor_Period',
  'the French protectorate of Cambodia': 'French_protectorate_of_Cambodia',
  'the Kingdom of Cambodia': 'Kingdom_of_Cambodia_(1953–1970)',
  "the People's Republic of Kampuchea": "People's_Republic_of_Kampuchea",
  'the Kingdom of Lan Xang': 'Lan_Xang',
  'the Lao kingdoms': 'Kingdom_of_Vientiane',
  'the Lao kingdoms under Siamese suzerainty': 'Kingdom_of_Vientiane',
  'French Laos': 'French_protectorate_of_Laos',
  "the Lao People's Democratic Republic": 'Laos',
  'the Chinese commanderies of Jiaozhi': 'Jiaozhi',
  'Đại Việt': 'Đại_Việt',
  'the Ming occupation': 'Fourth_Era_of_Northern_Domination',
  'Đại Việt under the Lê': 'Lê_dynasty',
  'the Nguyễn lords': 'Nguyễn_lords',
  'the Nguyễn Empire of Đại Nam': 'Nguyễn_dynasty',
  'the Democratic Republic of Vietnam': 'North_Vietnam',
  'the Republic of Vietnam': 'South_Vietnam',
  'the Kingdom of Champa': 'Champa',
  'the Johor Sultanate and Dutch Malacca': 'Johor_Sultanate',
  'the Federation of Malaya': 'Federation_of_Malaya',
  'the Pagaruyung Kingdom': 'Pagaruyung_Kingdom',
  'the Medang Kingdom': 'Medang_Kingdom',
  'the Kingdom of Kediri': 'Kediri_Kingdom',
  'the Singhasari Kingdom': 'Singhasari',
  'the sultanates of Demak and Pajang': 'Demak_Sultanate',
  'the Sultanate of Mataram': 'Mataram_Sultanate',
  'the courts of Surakarta and Yogyakarta': 'Surakarta_Sunanate',
  'the Balinese kingdoms': 'Bali_Kingdom',
  // Gelgel has no article of its own; the Bali Kingdom article covers it.
  'the Kingdom of Gelgel': 'Bali_Kingdom',
  'the nine Balinese kingdoms': 'Bali_Kingdom',
  'the Sultanate of Brunei': 'Bruneian_Sultanate_(1368–1888)',
  'the British and Dutch Borneo territories': 'British_Borneo',
  'Indonesia, Malaysia and Brunei': 'Borneo',
  'the Sultanate of Gowa': 'Sultanate_of_Gowa',
  'the sultanates of Ternate and Tidore': 'Sultanate_of_Ternate',
  'the sultanates of Sulu and Maguindanao': 'Sultanate_of_Sulu',
  'the Sultanate of Sulu': 'Sultanate_of_Sulu',
  'the Empire of Japan': 'Empire_of_Japan',
  'the Timorese kingdoms': 'History_of_East_Timor',
  'Indonesian East Timor': 'Indonesian_occupation_of_East_Timor',
  'Timor-Leste': 'East_Timor',
};

function wikipediaTitleFor(name: string): string {
  return WIKIPEDIA_OVERRIDES[name]
    ?? name.replace(/^the\s+/i, '').replace(/\s+/g, '_');
}

/**
 * Allegiance histories, matched against the persona's location and region
 * string together.
 *
 * Ordering matters twice over. Entries are tried from the bottom up, so a
 * local-area entry placed after its region entry wins for the places it names
 * — "Edinburgh" resolves to Scotland rather than to England, and Venice to the
 * Republic rather than to whoever held the Italian mainland. Within an entry,
 * eras are scanned in order and the first covering the year wins.
 *
 * `zones` disambiguates region names the map reuses across hemispheres.
 * "Atlantic Coast" is a region of both North and South America in
 * `geography.ts`, which is the same trap `birthplaceService` documents.
 */
const ALLEGIANCES: Array<{
  match: RegExp;
  zones?: CulturalZone[];
  eras: PolityEra[];
}> = [
  // ---------------------------------------------------------------------
  // Era fill-ins (added 2026-07). These carry ONLY the years the entry of
  // the same regex further down does not cover. `getPolityAt` walks this
  // array from the end, and an entry that matches but has no era for the
  // year falls through, so placing these first makes them the last resort
  // rather than an override. See the block at the foot of the array.
  // ---------------------------------------------------------------------
  { // GANGETIC_PLAIN_ADDITIONS
    match: /gangetic|ganges|doab|uttar|varanasi|bengal/i,
    eras: [
      { from: -185, until: -73, name: 'the Shunga dynasty' },
      { from: -73, until: -28, name: 'the Kanva dynasty' },
      // UNCERTAIN: Kushan control of the middle/eastern Gangetic plain (Bengal,
      // Bihar) was looser than of Mathura/the upper plain; treat as approximate.
      { from: 30, until: 230, name: 'the Kushan Empire' },
      { from: 606, until: 647, name: "Harsha's Vardhana empire" },
      // Gap 647-750 (post-Harsha fragmentation) left deliberately open.
      { from: 750, until: 1036, name: 'the Gurjara-Pratihara dynasty' },
      // Gap 1036-1090 (Pratihara collapse to Gahadavala rise) left open.
      { from: 1090, until: 1194, name: 'the Gahadavala dynasty' },
    ],
  },
  { // INDUS_VALLEY_ADDITIONS
    match: /\bindus|punjab|sindh|lahore/i,
    eras: [
      // UNCERTAIN: Indo-Greek control was never a single continuous state; this
      // collapses several kings/decades into one label, as the file already
      // does for e.g. "the taifa kingdoms of al-Andalus".
      { from: -190, until: -55, name: 'the Indo-Greek kingdoms' },
      { from: -55, until: 30, name: 'the Indo-Scythian kingdom' },
      { from: 30, until: 375, name: 'the Kushan Empire' },
      { from: 450, until: 560, name: 'the Hephthalite Empire' },
    ],
  },
  { // DECCAN_CENTRAL_INDIA_ADDITIONS
    match: /deccan|maharashtra|central india/i,
    eras: [
      { from: 250, until: 500, name: 'the Vakataka dynasty' },
      { from: 543, until: 753, name: 'the Chalukyas of Badami' },
      { from: 973, until: 1189, name: 'the Western Chalukyas of Kalyani' },
      // UNCERTAIN: the Seuna/Yadava line was a Chalukya feudatory long before
      // this; using their run as the dominant independent Deccan power.
      { from: 1189, until: 1317, name: 'the Yadava dynasty of Devagiri' },
    ],
  },
  { // SRI_LANKA_ADDITIONS
    match: /sri lanka|ceylon|anuradhapura|kandy/i,
    eras: [
      { from: 1232, until: 1345, name: 'the Dambadeniya and Gampola kingdoms' },
      // UNCERTAIN: Kotte's reach into the central highlands overlaps with
      // Kandy's; for Kandy Plateau/Central Highlands specifically, prefer "the
      // Kingdom of Kandy" (already in the base entry, from 1469) for the
      // overlap years — the same approximation the file already accepts for
      // Bahmani/Vijayanagara in the Deccan.
      { from: 1345, until: 1597, name: 'the Kingdom of Kotte' },
    ],
  },
  { // KAZAKH_STEPPES_ADDITIONS
    match: /kazakh|altai|aral sea|tian shan|dzungarian/i,
    eras: [
      { from: 552, until: 744, name: 'the Turkic Khaganate' },
      { from: 744, until: 1050, name: 'the Kimek Khaganate' }, // UNCERTAIN
      { from: 1050, until: 1220, name: 'the Cuman-Kipchak confederation' }, // UNCERTAIN
      { from: 1206, until: 1368, name: 'Mongol Empire' },
      { from: 1428, until: 1465, name: "the Uzbek Khanate of Abu'l-Khayr" },
    ],
  },
  { // XINJIANG_ADDITIONS
    match: /xinjiang|tarim|kunlun|qaidam/i,
    eras: [
      { from: -60, until: 220, name: 'the Han Protectorate of the Western Regions' },
      { from: 999, until: 1211, name: 'the Qarakhanid Khanate' },
      // UNCERTAIN: Moghulistan's grip on the Tarim Basin oases (as opposed to
      // the steppe/Ili region) was loose and contested with local Chagatayid
      // lines; treat as approximate.
      { from: 1347, until: 1514, name: 'Moghulistan' },
      { from: 1514, until: 1680, name: 'the Yarkent Khanate' }, // must precede the existing Dzungar Khanate era in the array
    ],
  },
  { // MONGOLIA_ADDITIONS
    match: /mongolia|manchuria|gobi/i,
    eras: [
      // UNCERTAIN: the Xianbei confederation's unity was real under Tanshihuai
      // but brief and personal; treat dates as approximate.
      { from: 155, until: 234, name: 'the Xianbei confederation' },
      { from: 330, until: 555, name: 'the Rouran Khaganate' },
      { from: 744, until: 840, name: 'the Uyghur Khaganate' },
      // Gap 840-907 (post-Uyghur steppe fragmentation) left deliberately open.
      { from: 907, until: 1125, name: 'the Liao dynasty' },
      // UNCERTAIN: Jin's hold on Mongolia proper was loose frontier suzerainty
      // over Mongol tribes, not direct administration, before Genghis Khan's
      // unification in 1206.
      { from: 1125, until: 1206, name: 'the Jin dynasty' },
    ],
  },
  { // NORTH_CHINA_ADDITIONS
    match: /north china|yellow river|hebei|beijing|shandong/i,
    eras: [
      { from: 220, until: 266, name: 'Cao Wei' },
      { from: 266, until: 317, name: 'Western Jin dynasty' },
      { from: 317, until: 386, name: 'the Sixteen Kingdoms period' },
      { from: 386, until: 534, name: 'Northern Wei dynasty' },
      // UNCERTAIN: collapses Northern Qi (550-577) and Northern Zhou (557-581),
      // which split the north between them, into one collective label — the
      // same move the file already makes for e.g. "the Balkan kingdoms".
      { from: 534, until: 581, name: 'the Northern dynasties' },
    ],
  },
  { // SOUTH_CHINA_ADDITIONS
    match: /south china|yangtze|yangzi|jiangnan|pearl river|guangdong|suzhou|fujian/i,
    eras: [
      { from: 222, until: 280, name: 'Eastern Wu' },
      { from: 266, until: 317, name: 'Western Jin dynasty' },
      { from: 317, until: 420, name: 'Eastern Jin dynasty' },
      { from: 420, until: 589, name: 'the Southern dynasties' },
    ],
  },
  { // JAPAN_ADDITIONS
    match: /japan|kansai|yamato|kinai|kanto|kyoto|\bedo\b/i,
    eras: [
      { from: 300, until: 710, name: 'the Yamato court' },
    ],
  },
  { // KOREA_ADDITIONS
    match: /korea|han river|gyeonggi|seoul/i,
    eras: [
      { from: -18, until: 475, name: 'the kingdom of Baekje' },
      { from: 475, until: 553, name: 'the kingdom of Goguryeo' },
      { from: 553, until: 668, name: 'the kingdom of Silla' },
    ],
  },
  { // MENA_EGYPT_ERAS_TO_SPLICE_IN
    match: /nile valley|egypt|nile delta|thebes|luxor|cairo|eastern desert|red sea/i,
    eras: [
      // Before "the Old Kingdom of Egypt" (-2686):
      // UNCERTAIN: unification conventionally 3100 BCE (some put it c. 3150);
      // this is the run of the 1st-2nd Dynasties before the Old Kingdom.
      { from: -3100, until: -2686, name: 'Early Dynastic Egypt' },

      // Between "the New Kingdom of Egypt" (ends -1069) and "Ptolemaic Kingdom"
      // (starts -305). First and Second Intermediate Periods are deliberately
      // NOT bridged — rival dynasties contesting the throne at once is a real
      // answer, and a gap, not a state.
      { from: -1069, until: -664, name: 'the Third Intermediate Period of Egypt' },
      { from: -664, until: -525, name: 'the Saite Dynasty of Egypt' },
      { from: -525, until: -404, name: 'the first Achaemenid occupation of Egypt' },
      { from: -404, until: -343, name: 'restored Egyptian independence' },
      { from: -343, until: -332, name: 'the second Achaemenid occupation of Egypt' },
      { from: -332, until: -305, name: 'Macedonian Egypt' },
    ],
  },
  { // MENA_NUBIA_ERAS_TO_SPLICE_IN
    match: /nubian|kush|meroe|sudan/i,
    eras: [
      // UNCERTAIN: Kerma's rise from culture to kingdom was gradual; 2500 BCE is
      // the conventional textbook start.
      { from: -2500, until: -1500, name: 'the Kingdom of Kerma' },
      { from: -1500, until: -1070, name: 'the New Kingdom of Egypt' },
    ],
  },
  { // MENA_CAUCASUS_ERAS_TO_SPLICE_IN
    match: /caucasus|georgia|armenia|azerbaijan/i,
    eras: [
      { from: -860, until: -590, name: 'Urartu' },
      { from: -590, until: -331, name: 'Achaemenid Empire' },
    ],
  },
  { // SSA_ETHIOPIA_ERA_TO_SPLICE_IN
    match: /horn of africa|ethiopian|abyssin|aksum/i,
    eras: [
      // UNCERTAIN: D'mt's dates are poorly attested and disputed; 980-400 BCE is
      // a commonly cited range. -400 to -100 (before Aksum) is left as a genuine
      // gap rather than bridged, since the record thins badly there.
      { from: -980, until: -400, name: "the Kingdom of D'mt" },
    ],
  },
  { // SEA_VIETNAM_ERAS_TO_SPLICE_IN
    match: /red river|tonkin|thang long|hanoi|dai viet|đại việt/i,
    eras: [
      // Văn Lang, the legendary Hùng-king state before this, is left out: its
      // dates are traditional rather than historical, and asserting one would be
      // exactly the kind of invention this table avoids. Âu Lạc and Nam Việt are
      // on firmer ground and slot in cleanly before -111.
      { from: -257, until: -179, name: 'Âu Lạc' },
      { from: -179, until: -111, name: 'Nam Việt' },
    ],
  },
  { // CENTRAL_ASIAN_OASES_ADDITIONS
    match: /central asian oases|transoxiana|samarkand|bukhara|ferghana|kyzylkum|khorasan/i,
    eras: [
      // UNCERTAIN for Ferghana specifically (peripheral/contested by Saka
      // groups); solid for Balkh, Samarkand, Hindu Kush.
      { from: -539, until: -330, name: 'the Achaemenid Empire' },
      { from: -250, until: -125, name: 'the Greco-Bactrian Kingdom' },
      // Gap -125-30 (Yuezhi/Saka migrations, no single named state) left open.
      { from: 30, until: 375, name: 'the Kushan Empire' },
      // UNCERTAIN: Kidarite chronology is poorly fixed in the sources I have.
      { from: 380, until: 450, name: 'the Kidarite Kingdom' },
      { from: 450, until: 560, name: 'the Hephthalite Empire' },
      { from: 560, until: 659, name: 'the Western Turkic Khaganate' },
      // Gap 659-710 (contested Sogdian city-states/Tang nominal claims) open.
      { from: 710, until: 750, name: 'Umayyad Caliphate' },
      { from: 750, until: 819, name: 'Abbasid Caliphate' },
      { from: 999, until: 1141, name: 'the Qarakhanid Khanate' },
      { from: 1141, until: 1211, name: 'the Qara Khitai' },
      { from: 1211, until: 1220, name: 'the Khwarezmian Empire' },
      { from: 1500, until: 1785, name: 'the Khanate of Bukhara' },
      // UNCERTAIN: Bukhara's status 1785-1873 as a still-independent Emirate
      // vs. the existing entry's 1876 Russian Turkestan date leaves a small
      // 1873-1876 seam; not worth resolving precisely here.
      { from: 1785, until: 1873, name: 'the Emirate of Bukhara' },
    ],
  },
  { // TIBET_ADDITIONS
    match: /tibet|west china|himalaya|nepal/i,
    eras: [
      // Gap 842-1240 (the "era of fragmentation" among petty kingdoms) left
      // deliberately open.
      { from: 1244, until: 1354, name: 'the Sakya regime' },
      // UNCERTAIN: power passed from the Phagmodrupa to the Rinpungpa (1435)
      // and then Tsangpa (1565) hegemons in practice; treating the nominal
      // Phagmodrupa framework as continuous through 1618 is an approximation
      // in the same spirit as the file's other collective/successor labels.
      { from: 1354, until: 1618, name: 'the Phagmodrupa dynasty' },
      // Gap 1618-1642 (Tsangpa civil war) left deliberately open.
    ],
  },
  // --- Medieval era fill-ins (added 2026-08). Same last-resort placement as
  // the block above: these carry only years the entry of the same regex
  // further down does not cover.
  { // BRITISH_ISLES_ANGLOSAXON — same regex as the base British Isles entry.
    // Closes the Heptarchy-era gap: Roman Britain (ends 410) to Kingdom of
    // England (starts 927) was previously entirely blank. Thames Estuary
    // alone was 22 of the sampled gap-hits; Oxfordshire, York and Hadrian's
    // Wall the rest.
    match: /british isles|england|thames|london|york|oxfordshire|dover/i,
    eras: [
      // UNCERTAIN: collapses Kent, Wessex, Mercia, Northumbria, Essex, Sussex
      // and East Anglia into one collective label, the same move this file
      // already makes for "the Balkan kingdoms" and "the taifa kingdoms of
      // al-Andalus". 410-500 (sub-Roman Britain, before the Heptarchy's
      // kingdoms are individually attested) is left open deliberately.
      { from: 500, until: 927, name: 'the Anglo-Saxon kingdoms' },
    ],
  },
  { // SCOTLAND_PICTISH — same regex as the base Scotland entry.
    match: /scotland|scottish|edinburgh/i,
    eras: [
      // UNCERTAIN: collapses Pictland and Dál Riata, which were rival and
      // only sometimes allied, into one label ahead of their 843 union under
      // Kenneth MacAlpin.
      { from: 500, until: 843, name: 'the Pictish and Gaelic kingdoms' },
    ],
  },
  { // IRELAND_GAELIC — same regex as the base Ireland entry. Dublin gets its
    // own narrower override further down (DUBLIN_ENTRY, APPEND) which wins.
    match: /ireland|leinster|munster|connacht|dublin/i,
    eras: [
      // UNCERTAIN: pre-Norman Ireland was several competing provincial
      // kingdoms (Leinster, Munster, Connacht, Ulster, Meath) under a nominal
      // and often contested High King; this is the same collective move as
      // the Balkans/al-Andalus entries.
      { from: 500, until: 1177, name: 'the Gaelic Irish kingdoms' },
    ],
  },
  { // GERMANIC_LANDS_FRANKISH — same regex as the base Germanic Lands entry.
    // Mirrors the France entry's own Merovingian/Carolingian dates exactly,
    // since this was the same state.
    match: /germanic|rhine|black forest|brandenburg|hamburg|bavarian|saxon/i,
    eras: [
      { from: 486, until: 751, name: 'Frankish kingdom under the Merovingians' },
      // UNCERTAIN for Brandenburg and the Saxon marches specifically: this
      // was independent Slavic Wend territory, not conquered until the
      // 12th-century Ostsiedlung (Albert the Bear founded the Margraviate of
      // Brandenburg in 1157) — but the base entry already claims it from 843
      // (East Francia) with the same imprecision, so this is not a new
      // simplification, just an earlier instance of the existing one.
      { from: 751, until: 843, name: 'Carolingian empire' },
    ],
  },
  { // CENTRAL_EUROPE_EARLY — same regex as the base Central Europe entry.
    // Closes Vienna Basin, Carpathian Foothills, Tatra Mountains, Danube Bend.
    match: /central europe|bohemia|moravia|hungar|carpathian|danube/i,
    eras: [
      { from: 567, until: 803, name: 'the Avar Khaganate' },
      // Gap 803-833 (Frankish Ostmark/March of Pannonia, briefly) left open.
      // UNCERTAIN: neither the Avar nor the Moravian core was Vienna itself —
      // approximated at the same level of precision the base entry already
      // uses by treating Bohemia, Moravia, Hungary, the Carpathians and the
      // Danube as one region.
      { from: 833, until: 907, name: 'Great Moravia' },
      // Gap 907-1000 (Magyar conquest/settlement, before the Kingdom of
      // Hungary's 1000 founding) left open deliberately.
    ],
  },
  { // EASTERN_EUROPE_EARLY — same regex as the base Eastern Europe entry.
    // Closes most of Dnieper River Valley, Novgorod Woods, Steppe Borderlands.
    match: /eastern europe|russia|moscow|volga|dnieper|steppe frontier|ural|pechora|komi/i,
    eras: [
      // UNCERTAIN: a Byzantine/Gothic-attested Slavic tribal confederation
      // north of the Black Sea, not a state in the fuller sense; dates follow
      // the conventional span before its collapse under Avar pressure (602).
      { from: 500, until: 602, name: 'the Antae confederation' },
      // Gap 602-700 (post-Antae Slavic fragmentation) left open deliberately.
      // UNCERTAIN: Khazar tribute over the Dnieper Slavic tribes (the
      // Polianians of Kyiv among them) is textually attested in the Russian
      // Primary Chronicle and reached its firmest extent in the 8th-9th
      // centuries; this regex also reaches Novgorod and the northern forest
      // zone, which Khazar power never touched, so this is approximated at
      // the same regional-umbrella level the base entry already accepts.
      { from: 700, until: 882, name: 'the Khazar Khaganate' },
    ],
  },
  { // NORTH_CHINA_5DYN_MONGOL — same regex as the base North China Plain
    // entry. Closes the Five Dynasties interregnum and the Mongol-conquest
    // interregnum, both previously blank.
    match: /north china|yellow river|hebei|beijing|shandong/i,
    eras: [
      { from: 907, until: 960, name: 'the Five Dynasties period' },
      { from: 1234, until: 1271, name: 'Mongol Empire' },
    ],
  },
  { // SOUTH_CHINA_SUI — same regex as the base South China entry. The Sui
    // reunified all of China in 589; the existing SOUTH_CHINA_ADDITIONS
    // fill-in stops at the Southern dynasties' end (589) and the base entry
    // does not pick up again until Tang (618), leaving Sui itself unnamed
    // even though it is already used for North China.
    match: /south china|yangtze|yangzi|jiangnan|pearl river|guangdong|suzhou|fujian/i,
    eras: [
      { from: 589, until: 618, name: 'Sui dynasty' },
    ],
  },
  { // GANGETIC_PLAIN_MEDIEVAL — same regex as the existing
    // GANGETIC_PLAIN_ADDITIONS fill-in. That block explicitly left two gaps
    // "deliberately open": 647-750 and 1036-1090. Under the new maximalist
    // instruction I am closing the first of those (it was the single largest
    // gap in the whole sample — 94 of 1,238 hits, concentrated at Varanasi
    // Basin) and leaving the second, which I still could not name anything
    // defensible for (see note at the foot of this file).
    match: /gangetic|ganges|doab|uttar|varanasi|bengal/i,
    eras: [
      { from: 550, until: 606, name: 'the Maukhari dynasty' },
      // UNCERTAIN: the Later Guptas were a Magadha (Bihar)-based regional
      // power, not paramount over the whole Gangetic Plain — but they are the
      // best-attested named state of this specific interregnum (Adityasena's
      // inscriptions claim imperial titles c. 650s-670s), and the alternative
      // is the same "gap" the previous pass left, which this pass is
      // instructed to reconsider rather than default to.
      { from: 647, until: 725, name: 'the Later Gupta dynasty of Magadha' },
      { from: 725, until: 750, name: 'the kingdom of Kannauj under Yashovarman' },
      // 750 dovetails exactly with the existing Gurjara-Pratihara era below.
      // 1036-1090 remains open — see note at the foot of this file.
    ],
  },
  { // INDUS_VALLEY_MEDIEVAL — same regex as the existing
    // INDUS_VALLEY_ADDITIONS fill-in. Closes the 665-1206 span that was
    // previously blank across Salt Range Foothills, Harappa Basin, Punjab
    // Plains, and (via the general regex) most of the Indus basin broadly.
    match: /\bindus|punjab|sindh|lahore/i,
    eras: [
      // Gap 560-665 (post-Hephthalite, pre-Turk Shahi) left open deliberately.
      { from: 665, until: 843, name: 'the Turk Shahi dynasty' },
      { from: 843, until: 1026, name: 'the Hindu Shahi dynasty' },
      // Extended a little past the narrower PUNJAB_ENTRY override's 1186 so
      // the broad regex does not leave a seam before Delhi Sultanate (1206);
      // Ghaznavid Lahore was in practice the last redoubt of the dynasty
      // through this stretch anyway.
      { from: 1026, until: 1206, name: 'the Ghaznavid dynasty' },
    ],
  },
  { // SRI_LANKA_CHOLA — same regex as the base Sri Lanka entry. Closes the
    // 1017-1055 seam between the Anuradhapura Kingdom's end and the
    // Polonnaruwa Kingdom's start, which was in fact direct Chola rule.
    match: /sri lanka|ceylon|anuradhapura|kandy/i,
    eras: [
      // UNCERTAIN on the exact end date (1055 vs. 1070 both appear in
      // sources for when Vijayabahu I finished expelling the Cholas).
      { from: 1017, until: 1070, name: 'Chola dynasty' },
    ],
  },
  { // LOW_COUNTRIES_EARLY — same regex as the base Low Countries entry.
    // Closes the pre-Burgundian span (486-1384), previously entirely blank.
    match: /low countries|scheldt|holland|flanders|antwerp|amsterdam/i,
    eras: [
      { from: 486, until: 751, name: 'Frankish kingdom under the Merovingians' },
      { from: 751, until: 843, name: 'Carolingian empire' },
      // UNCERTAIN: Flanders itself was a French royal fief throughout this
      // span, not Imperial territory — see FLANDERS_ENTRY (APPEND) below,
      // which wins for Flanders specifically and corrects this.
      { from: 843, until: 1384, name: 'Holy Roman Empire' },
    ],
  },
  { // SCANDINAVIA_EARLY — same regex as the base Scandinavia entry.
    match: /scandinavia|norway|sweden|denmark|jutland|baltic shield/i,
    eras: [
      // UNCERTAIN: one collective label averaging three different
      // unification dates (Norway under Harald Fairhair c. 872, Denmark
      // under Harald Bluetooth c. 958-965, Sweden under Olof Skötkonung
      // c. 995-1022) — the same kind of simplification as "the Nordic
      // kingdoms" the base entry already uses post-1809. Before 900, this
      // was genuinely fragmented among many petty chiefdoms with nothing
      // collective to name; left open deliberately.
      { from: 900, until: 1397, name: 'the Scandinavian kingdoms' },
    ],
  },
  { // MAGHREB_VANDAL_BYZANTINE — same regex as the base Maghreb entry.
    // Closes the 439-647 seam between Roman North Africa's end and the Arab
    // caliphates' start.
    match: /maghreb|atlas|ifriqiya|tunis|carthage|cyrenaica/i,
    eras: [
      { from: 439, until: 534, name: 'Vandal Kingdom' },
      { from: 534, until: 647, name: 'Byzantine North Africa' },
    ],
  },
  { // ARABIAN_SHARIFATE — same regex as the base Arabian Peninsula entry.
    // Closes the 969-1517 span, previously blank for 548 years. Hejaz
    // Mountains was 6 of the sampled gap-hits.
    match: /arabian peninsula|hejaz|mecca|yemen|nejd/i,
    eras: [
      { from: 968, until: 1517, name: 'the Sharifate of Mecca' },
      // Pre-622 (pre-Islamic Hejaz) is left open — genuinely tribal Arabia,
      // outside Yemen's older Himyarite kingdom, which this regex does not
      // reach specifically.
    ],
  },
  { // MESOPOTAMIA_SEAMS — same regex as the base Mesopotamia entry. Closes
    // two gaps: the immediate post-Sasanian conquest years, and the long
    // 1335-1534 span between the Ilkhanate's collapse and Ottoman conquest.
    match: /mesopotamia|tigris|euphrates|babylon|baghdad|assyria/i,
    eras: [
      { from: 637, until: 661, name: 'the Rashidun Caliphate' },
      { from: 661, until: 750, name: 'Umayyad Caliphate' },
      { from: 1335, until: 1432, name: 'the Jalayirid Sultanate' },
      // UNCERTAIN: the Qara Qoyunlu ("Black Sheep") confederation's control
      // of Iraq specifically (as opposed to Azerbaijan/eastern Anatolia) was
      // contested and its internal chronology is messy; treated the same way
      // this file already treats "the Cuman-Kipchak confederation".
      { from: 1432, until: 1467, name: 'the Qara Qoyunlu confederation' },
      { from: 1467, until: 1508, name: 'the Ak Qoyunlu confederation' },
      { from: 1508, until: 1534, name: 'Safavid Empire' },
    ],
  },
  { // PERSIAN_PLATEAU_LATE — same regex as the base Persian Plateau entry.
    // Closes the 1335-1501 seam between the Ilkhanate's fall and the Safavids.
    match: /persian plateau|isfahan|khorasan|fars/i,
    eras: [
      // UNCERTAIN: Muzaffarid control was centred on Fars/Yazd/Isfahan
      // specifically, not the whole Persian Plateau this regex names.
      { from: 1314, until: 1393, name: 'the Muzaffarid dynasty' },
      { from: 1393, until: 1501, name: 'Timurid Empire' },
    ],
  },
  { // CAUCASUS_EARLY — same regex as the base Caucasus entry. Closes the
    // 428-1008 span. Tbilisi Valley gets a narrower, more accurate override
    // further down (TBILISI_ENTRY, APPEND) which wins for that location.
    match: /caucasus|georgia|armenia|azerbaijan/i,
    eras: [
      // UNCERTAIN: Sasanian control over Caucasian Iberia/Armenia was
      // suzerainty exercised through local marzbans (governors) and client
      // kings, not always direct rule.
      { from: 428, until: 628, name: 'Sasanian Empire' },
      { from: 628, until: 654, name: 'Byzantine Empire' },
      { from: 654, until: 750, name: 'Umayyad Caliphate' },
      // UNCERTAIN: nominal Abbasid suzerainty exercised mostly through
      // semi-autonomous local Arab emirates (see TBILISI_ENTRY below).
      { from: 750, until: 1008, name: 'Abbasid Caliphate' },
    ],
  },
  { // MEKONG_BASIN_KHMER — same regex as the base "middle Mekong" entry
    // (Lan Xang etc.), which previously started at 1353 with nothing before
    // it. Wat Phou at Champasak was a major Chenla/Khmer religious and
    // political centre from the 5th century, so the Khmer sequence used for
    // Cambodia proper is defensible here too.
    match: /mekong river basin|lan xang|laos|vientiane|luang prabang|champasak/i,
    eras: [
      { from: 550, until: 802, name: 'Chenla' },
      { from: 802, until: 1353, name: 'the Khmer Empire' },
    ],
  },
  // --- Europe --------------------------------------------------------------
  {
    match: /british isles|england|thames|london|york|oxfordshire|dover/i,
    eras: [
      { from: 43, until: 410, name: 'Roman Britain' },
      { from: 927, until: 1707, name: 'Kingdom of England' },
      { from: 1707, until: 1801, name: 'Kingdom of Great Britain' },
      { from: 1801, name: 'United Kingdom' },
    ],
  },
  // Scotland and Ireland sit after the British Isles entry so they win for the
  // map areas that name them. Matching on "highlands" would be the obvious way
  // to catch Scotland and the wrong one — the map also has Bavarian, Ethiopian,
  // Central and Southern Highlands on three other continents.
  {
    match: /scotland|scottish|edinburgh/i,
    eras: [
      { from: 843, until: 1707, name: 'Kingdom of Scotland' },
      { from: 1707, until: 1801, name: 'Kingdom of Great Britain' },
      { from: 1801, name: 'United Kingdom' },
    ],
  },
  {
    match: /ireland|leinster|munster|connacht|dublin/i,
    eras: [
      { from: 1177, until: 1542, name: 'the Lordship of Ireland' },
      { from: 1542, until: 1801, name: 'Kingdom of Ireland' },
      { from: 1801, until: 1922, name: 'United Kingdom' },
      { from: 1922, name: 'Ireland' },
    ],
  },
  {
    match: /france|paris|loire|marseille|normandy|languedoc|pyrenees/i,
    eras: [
      { from: -50, until: 486, name: 'Roman Gaul' },
      { from: 486, until: 751, name: 'Frankish kingdom under the Merovingians' },
      { from: 751, until: 987, name: 'Carolingian empire' },
      { from: 987, until: 1792, name: 'Kingdom of France' },
      { from: 1792, until: 1804, name: 'French First Republic' },
      { from: 1804, until: 1814, name: 'First French Empire' },
      { from: 1814, until: 1848, name: 'restored French monarchy' },
      { from: 1848, until: 1852, name: 'French Second Republic' },
      { from: 1852, until: 1870, name: 'Second French Empire' },
      { from: 1870, until: 1940, name: 'French Third Republic' },
      { from: 1940, until: 1944, name: 'Vichy France under German occupation' },
      { from: 1946, name: 'French Republic' },
    ],
  },
  {
    match: /iberian|andalusian|ebro|toledo|catalonian|gibraltar/i,
    eras: [
      { from: -218, until: 409, name: 'Roman Hispania' },
      { from: 418, until: 711, name: 'Visigothic Kingdom' },
      { from: 711, until: 1031, name: 'Umayyad al-Andalus' },
      { from: 1031, until: 1248, name: 'the taifa kingdoms of al-Andalus' },
      { from: 1248, until: 1516, name: 'Crown of Castile' },
      { from: 1516, until: 1808, name: 'Spanish monarchy' },
      { from: 1814, until: 1931, name: 'Kingdom of Spain' },
      { from: 1931, until: 1939, name: 'Second Spanish Republic' },
      { from: 1939, until: 1975, name: 'Francoist Spain' },
      { from: 1975, name: 'Kingdom of Spain' },
    ],
  },
  {
    match: /lisbon|galicia|portug/i,
    eras: [
      { from: -218, until: 409, name: 'Roman Hispania' },
      { from: 711, until: 1139, name: 'al-Andalus' },
      { from: 1139, until: 1910, name: 'Kingdom of Portugal' },
      { from: 1910, name: 'Portuguese Republic' },
    ],
  },
  {
    match: /italy|roman campagna|apennine|florence|\bpo valley/i,
    eras: [
      { from: -509, until: -27, name: 'Roman Republic' },
      { from: -27, until: 476, name: 'Roman Empire' },
      { from: 493, until: 553, name: 'Ostrogothic Kingdom' },
      { from: 568, until: 774, name: 'Lombard Kingdom' },
      { from: 774, until: 1806, name: 'Holy Roman Empire' },
      { from: 1815, until: 1861, name: 'the Italian states' },
      { from: 1861, name: 'Kingdom of Italy' },
    ],
  },
  {
    match: /venet|venice|lagoon/i,
    eras: [
      { from: -27, until: 476, name: 'Roman Empire' },
      { from: 697, until: 1797, name: 'Republic of Venice' },
      { from: 1815, until: 1866, name: 'Austrian Empire' },
      { from: 1866, name: 'Kingdom of Italy' },
    ],
  },
  {
    match: /naples|campania/i,
    eras: [
      { from: -27, until: 476, name: 'Roman Empire' },
      { from: 1130, until: 1816, name: 'Kingdom of Naples' },
      { from: 1816, until: 1861, name: 'Kingdom of the Two Sicilies' },
      { from: 1861, name: 'Kingdom of Italy' },
    ],
  },
  {
    match: /germanic|rhine|black forest|brandenburg|hamburg|bavarian|saxon/i,
    eras: [
      { from: 843, until: 962, name: 'East Francia' },
      { from: 962, until: 1806, name: 'Holy Roman Empire' },
      { from: 1806, until: 1815, name: 'Confederation of the Rhine' },
      { from: 1815, until: 1866, name: 'German Confederation' },
      { from: 1871, until: 1918, name: 'German Empire' },
      { from: 1918, until: 1933, name: 'Weimar Republic' },
      { from: 1933, until: 1945, name: 'Nazi Germany' },
      { from: 1949, name: 'Germany' },
    ],
  },
  {
    match: /central europe|bohemia|moravia|hungar|carpathian|danube/i,
    eras: [
      { from: 1000, until: 1526, name: 'Kingdom of Hungary' },
      { from: 1526, until: 1804, name: 'Habsburg monarchy' },
      { from: 1804, until: 1867, name: 'Austrian Empire' },
      { from: 1867, until: 1918, name: 'Austria-Hungary' },
      { from: 1918, name: 'the Central European republics' },
    ],
  },
  {
    match: /balkans|serbia|bulgar|thrace|dalmatia/i,
    eras: [
      { from: -27, until: 395, name: 'Roman Empire' },
      { from: 395, until: 1396, name: 'Byzantine Empire' },
      { from: 1396, until: 1878, name: 'Ottoman Empire' },
      { from: 1878, until: 1945, name: 'the Balkan kingdoms' },
      { from: 1945, name: 'the Balkan states' },
    ],
  },
  {
    match: /scandinavia|norway|sweden|denmark|jutland|baltic shield/i,
    eras: [
      { from: 1397, until: 1523, name: 'Kalmar Union' },
      { from: 1523, until: 1809, name: 'Swedish realm' },
      { from: 1809, name: 'the Nordic kingdoms' },
    ],
  },
  {
    match: /eastern europe|russia|moscow|volga|dnieper|steppe frontier|ural|pechora|komi/i,
    eras: [
      { from: 882, until: 1240, name: "Kievan Rus'" },
      { from: 1240, until: 1480, name: 'the Golden Horde' },
      { from: 1480, until: 1547, name: 'Grand Duchy of Moscow' },
      { from: 1547, until: 1721, name: 'Tsardom of Russia' },
      { from: 1721, until: 1917, name: 'Russian Empire' },
      { from: 1922, until: 1991, name: 'Soviet Union' },
      { from: 1991, name: 'Russian Federation' },
    ],
  },
  {
    match: /poland|vistula|galicia-|lithuania/i,
    eras: [
      { from: 1025, until: 1569, name: 'Kingdom of Poland' },
      { from: 1569, until: 1795, name: 'Polish-Lithuanian Commonwealth' },
      { from: 1795, until: 1918, name: 'the partitioning empires' },
      { from: 1918, name: 'Poland' },
    ],
  },
  {
    match: /low countries|scheldt|holland|flanders|antwerp|amsterdam/i,
    eras: [
      { from: 1384, until: 1482, name: 'Burgundian Netherlands' },
      { from: 1482, until: 1581, name: 'Habsburg Netherlands' },
      { from: 1581, until: 1795, name: 'Dutch Republic' },
      { from: 1795, until: 1806, name: 'Batavian Republic' },
      { from: 1815, name: 'Kingdom of the Netherlands' },
    ],
  },
  {
    match: /greece|aegean|attica|athens|ionia|peloponnese/i,
    eras: [
      { from: -338, until: -146, name: 'Kingdom of Macedon' },
      { from: -146, until: 330, name: 'Roman Empire' },
      { from: 330, until: 1453, name: 'Byzantine Empire' },
      { from: 1453, until: 1832, name: 'Ottoman Empire' },
      { from: 1832, name: 'Kingdom of Greece' },
    ],
  },

  // --- MENA ----------------------------------------------------------------
  {
    match: /nile valley|egypt|nile delta|thebes|luxor|cairo|eastern desert|red sea/i,
    eras: [
      { from: -2686, until: -2181, name: 'the Old Kingdom of Egypt' },
      { from: -2055, until: -1650, name: 'the Middle Kingdom of Egypt' },
      { from: -1550, until: -1069, name: 'the New Kingdom of Egypt' },
      { from: -305, until: -30, name: 'Ptolemaic Kingdom' },
      { from: -30, until: 641, name: 'Roman and Byzantine Egypt' },
      { from: 641, until: 969, name: 'the Arab caliphates' },
      { from: 969, until: 1171, name: 'Fatimid Caliphate' },
      { from: 1171, until: 1250, name: 'Ayyubid Sultanate' },
      { from: 1250, until: 1517, name: 'Mamluk Sultanate' },
      { from: 1517, until: 1867, name: 'Ottoman Empire' },
      { from: 1867, until: 1914, name: 'Khedivate of Egypt' },
      { from: 1914, until: 1922, name: 'British protectorate of Egypt' },
      { from: 1922, until: 1953, name: 'Kingdom of Egypt' },
      { from: 1953, name: 'Republic of Egypt' },
    ],
  },
  {
    match: /levant|judea|palestine|damascus|syria|galilee/i,
    eras: [
      { from: -1000, until: -586, name: 'the kingdoms of Israel and Judah' },
      { from: -539, until: -332, name: 'Achaemenid Empire' },
      { from: -312, until: -63, name: 'Seleucid Empire' },
      { from: -63, until: 636, name: 'Roman and Byzantine Syria' },
      { from: 636, until: 750, name: 'Umayyad Caliphate' },
      { from: 750, until: 1099, name: 'Abbasid Caliphate' },
      { from: 1099, until: 1291, name: 'the Crusader states' },
      { from: 1291, until: 1516, name: 'Mamluk Sultanate' },
      { from: 1516, until: 1918, name: 'Ottoman Empire' },
      { from: 1923, until: 1946, name: 'the French and British mandates' },
      { from: 1946, name: 'the Levantine states' },
    ],
  },
  {
    match: /anatolia|bosphorus|marmara|constantinople|istanbul|smyrna/i,
    eras: [
      { from: -1650, until: -1180, name: 'Hittite Empire' },
      { from: -546, until: -334, name: 'Achaemenid Empire' },
      { from: -133, until: 330, name: 'Roman Empire' },
      { from: 330, until: 1453, name: 'Byzantine Empire' },
      { from: 1453, until: 1922, name: 'Ottoman Empire' },
      { from: 1923, name: 'Republic of Turkey' },
    ],
  },
  {
    match: /mesopotamia|tigris|euphrates|babylon|baghdad|assyria/i,
    eras: [
      { from: -2334, until: -2154, name: 'Akkadian Empire' },
      { from: -2112, until: -2004, name: 'the Third Dynasty of Ur' },
      { from: -1894, until: -1595, name: 'Old Babylonian Kingdom' },
      { from: -911, until: -609, name: 'Neo-Assyrian Empire' },
      { from: -626, until: -539, name: 'Neo-Babylonian Empire' },
      { from: -539, until: -330, name: 'Achaemenid Empire' },
      { from: -312, until: -141, name: 'Seleucid Empire' },
      { from: -141, until: 224, name: 'Parthian Empire' },
      { from: 224, until: 637, name: 'Sasanian Empire' },
      { from: 750, until: 1258, name: 'Abbasid Caliphate' },
      { from: 1258, until: 1335, name: 'the Ilkhanate' },
      { from: 1534, until: 1918, name: 'Ottoman Empire' },
      { from: 1932, name: 'Kingdom of Iraq' },
    ],
  },
  {
    match: /maghreb|atlas|ifriqiya|tunis|carthage|cyrenaica/i,
    eras: [
      { from: -814, until: -146, name: 'Carthage' },
      { from: -146, until: 439, name: 'Roman North Africa' },
      { from: 647, until: 909, name: 'the Arab caliphates' },
      { from: 909, until: 1171, name: 'Fatimid Caliphate' },
      { from: 1121, until: 1269, name: 'Almohad Caliphate' },
      { from: 1574, until: 1830, name: 'Ottoman Empire' },
      { from: 1830, until: 1962, name: 'French North Africa' },
      { from: 1962, name: 'the Maghreb states' },
    ],
  },
  {
    match: /arabian peninsula|hejaz|mecca|yemen|nejd/i,
    eras: [
      { from: 622, until: 661, name: 'the Rashidun Caliphate' },
      { from: 661, until: 750, name: 'Umayyad Caliphate' },
      { from: 750, until: 969, name: 'Abbasid Caliphate' },
      { from: 1517, until: 1918, name: 'Ottoman Empire' },
      { from: 1932, name: 'Kingdom of Saudi Arabia' },
    ],
  },
  {
    match: /persian plateau|isfahan|khorasan|fars/i,
    eras: [
      { from: -550, until: -330, name: 'Achaemenid Empire' },
      { from: -312, until: -247, name: 'Seleucid Empire' },
      { from: -247, until: 224, name: 'Parthian Empire' },
      { from: 224, until: 651, name: 'Sasanian Empire' },
      { from: 651, until: 1258, name: 'the Arab caliphates' },
      { from: 1258, until: 1335, name: 'the Ilkhanate' },
      { from: 1501, until: 1736, name: 'Safavid Empire' },
      { from: 1736, until: 1796, name: 'Afsharid Persia' },
      { from: 1796, until: 1925, name: 'Qajar Persia' },
      { from: 1925, until: 1979, name: 'Pahlavi Iran' },
      { from: 1979, name: 'Islamic Republic of Iran' },
    ],
  },

  // --- South Asia ----------------------------------------------------------
  {
    match: /gangetic|ganges|doab|uttar|varanasi|bengal/i,
    eras: [
      { from: -322, until: -185, name: 'Mauryan Empire' },
      { from: 320, until: 550, name: 'Gupta Empire' },
      { from: 1206, until: 1526, name: 'Delhi Sultanate' },
      { from: 1526, until: 1757, name: 'Mughal Empire' },
      { from: 1757, until: 1858, name: 'East India Company rule' },
      { from: 1858, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Republic of India' },
    ],
  },
  // Delhi held out as nominally Mughal for half a century after Bengal fell to
  // the Company in 1757, so the region-level dates above are wrong for the city
  // itself by a lifetime.
  {
    match: /delhi/i,
    eras: [
      { from: 1206, until: 1526, name: 'Delhi Sultanate' },
      { from: 1526, until: 1803, name: 'Mughal Empire' },
      { from: 1803, until: 1858, name: 'East India Company rule' },
      { from: 1858, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Republic of India' },
    ],
  },
  {
    match: /\bindus|punjab|sindh|lahore/i,
    eras: [
      { from: -2600, until: -1900, name: 'the Indus Valley civilization' },
      { from: -518, until: -330, name: 'Achaemenid Empire' },
      { from: -322, until: -185, name: 'Mauryan Empire' },
      { from: 1206, until: 1526, name: 'Delhi Sultanate' },
      { from: 1526, until: 1757, name: 'Mughal Empire' },
      { from: 1799, until: 1849, name: 'Sikh Empire' },
      { from: 1849, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Pakistan' },
    ],
  },
  {
    match: /deccan|maharashtra|central india/i,
    eras: [
      { from: -230, until: 220, name: 'Satavahana dynasty' },
      { from: 753, until: 982, name: 'the Rashtrakuta empire' },
      { from: 1347, until: 1527, name: 'Bahmani Sultanate' },
      { from: 1336, until: 1646, name: 'Vijayanagara Empire' },
      { from: 1674, until: 1818, name: 'Maratha Empire' },
      { from: 1818, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Republic of India' },
    ],
  },

  // --- East Asia -----------------------------------------------------------
  {
    match: /north china|yellow river|hebei|beijing|shandong/i,
    eras: [
      { from: -1600, until: -1046, name: 'Shang dynasty' },
      { from: -1046, until: -256, name: 'Zhou dynasty' },
      { from: -221, until: -206, name: 'Qin dynasty' },
      { from: -206, until: 220, name: 'Han dynasty' },
      { from: 581, until: 618, name: 'Sui dynasty' },
      { from: 618, until: 907, name: 'Tang dynasty' },
      { from: 960, until: 1127, name: 'Northern Song dynasty' },
      { from: 1127, until: 1234, name: 'Jurchen Jin dynasty' },
      { from: 1271, until: 1368, name: 'Yuan dynasty' },
      { from: 1368, until: 1644, name: 'Ming dynasty' },
      { from: 1644, until: 1912, name: 'Qing dynasty' },
      { from: 1912, until: 1949, name: 'Republic of China' },
      { from: 1949, name: "People's Republic of China" },
    ],
  },
  {
    match: /south china|yangtze|yangzi|jiangnan|pearl river|guangdong|suzhou|fujian/i,
    eras: [
      { from: -221, until: -206, name: 'Qin dynasty' },
      { from: -206, until: 220, name: 'Han dynasty' },
      { from: 618, until: 907, name: 'Tang dynasty' },
      { from: 960, until: 1127, name: 'Northern Song dynasty' },
      { from: 1127, until: 1279, name: 'Southern Song dynasty' },
      { from: 1279, until: 1368, name: 'Yuan dynasty' },
      { from: 1368, until: 1644, name: 'Ming dynasty' },
      { from: 1644, until: 1912, name: 'Qing dynasty' },
      { from: 1912, until: 1949, name: 'Republic of China' },
      { from: 1949, name: "People's Republic of China" },
    ],
  },
  {
    match: /japan|kansai|yamato|kinai|kanto|kyoto|\bedo\b/i,
    eras: [
      { from: 710, until: 794, name: 'the Nara court' },
      { from: 794, until: 1185, name: 'the Heian court' },
      { from: 1185, until: 1333, name: 'Kamakura shogunate' },
      { from: 1336, until: 1573, name: 'Ashikaga shogunate' },
      { from: 1603, until: 1868, name: 'Tokugawa shogunate' },
      { from: 1868, until: 1947, name: 'Empire of Japan' },
      { from: 1947, name: 'Japan' },
    ],
  },
  {
    match: /korea|han river|gyeonggi|seoul/i,
    eras: [
      { from: 668, until: 935, name: 'Unified Silla' },
      { from: 918, until: 1392, name: 'Goryeo' },
      { from: 1392, until: 1897, name: 'Joseon' },
      { from: 1897, until: 1910, name: 'Korean Empire' },
      { from: 1910, until: 1945, name: 'Japanese colonial rule' },
      { from: 1948, name: 'the two Korean states' },
    ],
  },
  {
    match: /mongolia|manchuria|gobi/i,
    eras: [
      { from: -209, until: 91, name: 'the Xiongnu confederation' },
      { from: 552, until: 744, name: 'the Turkic Khaganate' },
      { from: 1206, until: 1368, name: 'Mongol Empire' },
      { from: 1691, until: 1911, name: 'Qing dynasty' },
      { from: 1924, name: "Mongolian People's Republic" },
    ],
  },
  // The steppe was nomadic, not ungoverned, and from the fifteenth century it
  // was a khanate with a name. This entry sits before the oasis one so that
  // Transoxiana and Khorasan — both filed under the Kazakh Steppes region in
  // `geography.ts`, though neither is steppe — fall through to it.
  {
    match: /kazakh|altai|aral sea|tian shan|dzungarian/i,
    eras: [
      { from: 1465, until: 1847, name: 'the Kazakh Khanate' },
      { from: 1847, until: 1917, name: 'Russian Empire' },
      { from: 1922, until: 1991, name: 'Soviet Union' },
      { from: 1991, name: 'Kazakhstan' },
    ],
  },
  // Khorasan belongs here rather than with the Persian plateau: the Samanids
  // and Timurids were centred on it together with Transoxiana, and it spent
  // more of its history looking north-east than south-west.
  {
    match: /central asian oases|transoxiana|samarkand|bukhara|ferghana|kyzylkum|khorasan/i,
    eras: [
      { from: -329, until: -250, name: 'the Hellenistic successor kingdoms' },
      { from: 819, until: 999, name: 'the Samanid Empire' },
      { from: 1220, until: 1370, name: 'the Chagatai Khanate' },
      { from: 1370, until: 1507, name: 'Timurid Empire' },
      { from: 1876, until: 1917, name: 'Russian Turkestan' },
      { from: 1922, until: 1991, name: 'Soviet Union' },
      { from: 1991, name: 'the Central Asian republics' },
    ],
  },
  // Xinjiang used to be caught by the oasis pattern above, which handed it
  // Russian Turkestan in 1900 — a polity six hundred miles west of it. The
  // Tarim Basin was Qing from 1759 and Chinese after.
  {
    match: /xinjiang|tarim|kunlun|qaidam/i,
    eras: [
      { from: 640, until: 790, name: 'the Tang protectorate of the Western Regions' },
      { from: 1220, until: 1370, name: 'the Chagatai Khanate' },
      { from: 1634, until: 1755, name: 'the Dzungar Khanate' },
      { from: 1759, until: 1912, name: 'Qing dynasty' },
      { from: 1912, until: 1949, name: 'Republic of China' },
      { from: 1949, name: "People's Republic of China" },
    ],
  },
  {
    match: /siberia|kamchatka/i,
    eras: [
      { from: 1468, until: 1598, name: 'the Khanate of Sibir' },
      { from: 1598, until: 1721, name: 'Tsardom of Russia' },
      { from: 1721, until: 1917, name: 'Russian Empire' },
      { from: 1922, until: 1991, name: 'Soviet Union' },
      { from: 1991, name: 'Russian Federation' },
    ],
  },
  // Sakhalin changed hands twice more than the mainland did, and a persona born
  // on it in 1910 was a Japanese subject while one across the strait was not.
  {
    match: /sakhalin/i,
    eras: [
      { from: 1875, until: 1905, name: 'Russian Empire' },
      { from: 1905, until: 1945, name: 'Japanese colonial rule' },
      { from: 1945, until: 1991, name: 'Soviet Union' },
      { from: 1991, name: 'Russian Federation' },
    ],
  },
  // Matched on the local area alone. "Manchuria" appears in the region name
  // "Mongolia and Manchuria", so a pattern containing it would claim the
  // Mongolian steppe and the Gobi as well.
  {
    match: /manchurian plain|liao basin|harbin|mukden/i,
    eras: [
      { from: 1636, until: 1912, name: 'Qing dynasty' },
      { from: 1912, until: 1932, name: 'Republic of China' },
      { from: 1932, until: 1945, name: 'Manchukuo' },
      { from: 1949, name: "People's Republic of China" },
    ],
  },

  // --- Southeast Asia ------------------------------------------------------
  //
  // Three entries used to cover eleven countries, and because a single regex
  // took the whole mainland, every place on it received the same sequence: a
  // persona in the Red River Delta in 1300 was a subject of the Khmer Empire,
  // one in the Irrawaddy Valley in 1900 a subject of Siam. The overlapping
  // eras made it worse — `eras.find` returns the first covering the year, so
  // Pagan sat inside the Khmer span and was unreachable, and French Indochina
  // sat inside Rattanakosin Siam and never once resolved.
  //
  // The two entries below are now only the fallback for a place none of the
  // basin entries after them names. The basins are the real answer, and they
  // are ordered river by river, because that is how mainland states were: a
  // valley each, with uplands between them that belonged to nobody in the
  // lowland sense.
  {
    match: /mainland southeast asia|indochina/i,
    eras: [
      { from: 1887, until: 1954, name: 'French Indochina' },
      { from: 1954, name: 'the mainland Southeast Asian states' },
    ],
  },
  {
    match: /maritime southeast asia/i,
    eras: [
      { from: 671, until: 1288, name: 'Srivijaya' },
      { from: 1293, until: 1527, name: 'the Majapahit Empire' },
      { from: 1619, until: 1800, name: 'the Dutch East India Company' },
      { from: 1800, until: 1942, name: 'the Dutch East Indies' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia' },
    ],
  },

  // The Irrawaddy. Tenasserim changed hands between Pegu, Ayutthaya and Ava
  // repeatedly and is given to the Burmese sequence, which is where it spent
  // most of its history; the Shan states held their own princes under Burmese
  // and later British suzerainty, which this entry flattens.
  {
    match: /irrawaddy|tenasserim|shan plateau|bagan|pegu|\bava\b|mandalay|rangoon|yangon|burma|myanmar/i,
    eras: [
      { from: 849, until: 1287, name: 'the Pagan Kingdom' },
      { from: 1287, until: 1510, name: 'the kingdoms of Ava and Pegu' },
      { from: 1510, until: 1752, name: 'the Toungoo Dynasty' },
      { from: 1752, until: 1885, name: 'the Konbaung Dynasty' },
      { from: 1885, until: 1942, name: 'British Burma' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, until: 1948, name: 'British Burma' },
      { from: 1948, until: 1989, name: 'Burma' },
      { from: 1989, name: 'Myanmar' },
    ],
  },
  // The Chao Phraya. Dvaravati was Mon, and the Tai kingdoms that followed it
  // were tributary to Angkor before they were rivals to it.
  {
    match: /chao phraya|ayutthaya|sukhothai|thonburi|siam|thailand|bangkok/i,
    eras: [
      { from: 600, until: 1050, name: 'the Dvaravati kingdoms' },
      { from: 1050, until: 1238, name: 'the Khmer Empire' },
      { from: 1238, until: 1351, name: 'the Kingdom of Sukhothai' },
      { from: 1351, until: 1767, name: 'the Kingdom of Ayutthaya' },
      { from: 1767, until: 1782, name: 'the Kingdom of Thonburi' },
      { from: 1782, until: 1939, name: 'the Kingdom of Siam' },
      { from: 1939, name: 'Thailand' },
    ],
  },
  // The Tonle Sap and the Angkorian heartland.
  {
    match: /tonle sap|angkor|khmer|cambodia|kampuchea|phnom penh/i,
    eras: [
      { from: 68, until: 550, name: 'Funan' },
      { from: 550, until: 802, name: 'Chenla' },
      { from: 802, until: 1431, name: 'the Khmer Empire' },
      { from: 1431, until: 1863, name: 'the Post-Angkor Khmer kingdom' },
      { from: 1863, until: 1953, name: 'the French protectorate of Cambodia' },
      { from: 1953, until: 1970, name: 'the Kingdom of Cambodia' },
      { from: 1970, until: 1975, name: 'the Khmer Republic' },
      { from: 1975, until: 1979, name: 'Democratic Kampuchea' },
      { from: 1979, until: 1993, name: "the People's Republic of Kampuchea" },
      { from: 1993, name: 'Cambodia' },
    ],
  },
  // The middle Mekong. Lan Xang split into three kingdoms in 1707 and all
  // three were Siamese tributaries within a century.
  {
    match: /mekong river basin|lan xang|laos|vientiane|luang prabang|champasak/i,
    eras: [
      { from: 1353, until: 1707, name: 'the Kingdom of Lan Xang' },
      { from: 1707, until: 1779, name: 'the Lao kingdoms' },
      { from: 1779, until: 1893, name: 'the Lao kingdoms under Siamese suzerainty' },
      { from: 1893, until: 1953, name: 'French Laos' },
      { from: 1953, until: 1975, name: 'the Kingdom of Laos' },
      { from: 1975, name: "the Lao People's Democratic Republic" },
    ],
  },
  // The Red River. A thousand years of Chinese rule, then a thousand of
  // independence: the two halves of Vietnamese history that the old table had
  // no room for at all. The Mạc and the Trịnh–Nguyễn division are elided into
  // the Lê span, whose emperors both sides went on claiming to serve.
  {
    match: /red river|tonkin|thang long|hanoi|dai viet|đại việt/i,
    eras: [
      { from: -111, until: 938, name: 'the Chinese commanderies of Jiaozhi' },
      { from: 938, until: 1407, name: 'Đại Việt' },
      { from: 1407, until: 1428, name: 'the Ming occupation' },
      { from: 1428, until: 1802, name: 'Đại Việt under the Lê' },
      { from: 1802, until: 1883, name: 'the Nguyễn Empire of Đại Nam' },
      { from: 1883, until: 1945, name: 'French Indochina' },
      { from: 1945, until: 1976, name: 'the Democratic Republic of Vietnam' },
      { from: 1976, name: 'Vietnam' },
    ],
  },
  // The lower Mekong, which is Khmer ground until it is Vietnamese: the Nguyễn
  // lords took Prey Nokor in 1698 and the delta was theirs by the 1750s. This
  // is the one place where the two national histories overlap on the same soil,
  // and giving it Cambodia's sequence or Vietnam's alone would be wrong.
  {
    match: /mekong delta|cochinchina|saigon|prey nokor/i,
    eras: [
      { from: 68, until: 550, name: 'Funan' },
      { from: 550, until: 802, name: 'Chenla' },
      { from: 802, until: 1431, name: 'the Khmer Empire' },
      { from: 1431, until: 1698, name: 'the Post-Angkor Khmer kingdom' },
      { from: 1698, until: 1802, name: 'the Nguyễn lords' },
      { from: 1802, until: 1862, name: 'the Nguyễn Empire of Đại Nam' },
      { from: 1862, until: 1955, name: 'French Cochinchina' },
      { from: 1955, until: 1975, name: 'the Republic of Vietnam' },
      { from: 1975, name: 'Vietnam' },
    ],
  },
  // The Cham coast and the cordillera behind it. Champa lost Vijaya in 1471
  // and survived as Panduranga until 1832, which is the date used here.
  {
    // `champa\b` rather than `champa`, so Champasak on the Laotian Mekong does
    // not come back as a Cham kingdom.
    match: /annam|annamite|champa\b|\bcham\b/i,
    eras: [
      { from: 192, until: 1832, name: 'the Kingdom of Champa' },
      { from: 1832, until: 1883, name: 'the Nguyễn Empire of Đại Nam' },
      { from: 1883, until: 1955, name: 'French Indochina' },
      { from: 1955, until: 1975, name: 'the Republic of Vietnam' },
      { from: 1975, name: 'Vietnam' },
    ],
  },
  // The peninsula and the strait, which are one polity for most of their
  // history because whoever held the strait held the trade through it.
  {
    match: /malay peninsula|malacca|melaka|\bmalaya\b|johor|penang|singapore/i,
    eras: [
      { from: 671, until: 1288, name: 'Srivijaya' },
      { from: 1400, until: 1511, name: 'the Malacca Sultanate' },
      { from: 1511, until: 1641, name: 'Portuguese Malacca' },
      { from: 1641, until: 1824, name: 'the Johor Sultanate and Dutch Malacca' },
      { from: 1824, until: 1942, name: 'British Malaya' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1946, until: 1963, name: 'the Federation of Malaya' },
      { from: 1963, name: 'Malaysia' },
    ],
  },
  {
    match: /sumatra|palembang|aceh|minangkabau/i,
    eras: [
      { from: 671, until: 1288, name: 'Srivijaya' },
      { from: 1347, until: 1833, name: 'the Pagaruyung Kingdom' },
      { from: 1833, until: 1942, name: 'the Dutch East Indies' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia' },
    ],
  },
  // Java, where the succession of kingdoms is better attested than anywhere
  // else in the region and the old table gave it three lines.
  {
    match: /java|sunda strait|majapahit|mataram|batavia|jakarta|yogyakarta|surabaya/i,
    eras: [
      { from: 732, until: 1016, name: 'the Medang Kingdom' },
      { from: 1042, until: 1222, name: 'the Kingdom of Kediri' },
      { from: 1222, until: 1293, name: 'the Singhasari Kingdom' },
      { from: 1293, until: 1527, name: 'the Majapahit Empire' },
      { from: 1527, until: 1587, name: 'the sultanates of Demak and Pajang' },
      { from: 1587, until: 1755, name: 'the Sultanate of Mataram' },
      { from: 1755, until: 1800, name: 'the courts of Surakarta and Yogyakarta' },
      { from: 1800, until: 1942, name: 'the Dutch East Indies' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia' },
    ],
  },
  // Bali took Majapahit's court culture when Java turned Muslim and kept its
  // own kingdoms until the Dutch conquests of 1906–08, which is why it is not
  // simply Java's sequence.
  {
    match: /\bbali\b|gelgel|klungkung/i,
    eras: [
      { from: 914, until: 1343, name: 'the Balinese kingdoms' },
      { from: 1343, until: 1686, name: 'the Kingdom of Gelgel' },
      { from: 1686, until: 1908, name: 'the nine Balinese kingdoms' },
      { from: 1908, until: 1942, name: 'the Dutch East Indies' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia' },
    ],
  },
  {
    match: /borneo|brunei|sarawak|kalimantan/i,
    eras: [
      { from: 1368, until: 1888, name: 'the Sultanate of Brunei' },
      { from: 1888, until: 1942, name: 'the British and Dutch Borneo territories' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia, Malaysia and Brunei' },
    ],
  },
  {
    match: /celebes|sulawesi|makassar|\bgowa\b/i,
    eras: [
      { from: 1320, until: 1669, name: 'the Sultanate of Gowa' },
      { from: 1669, until: 1800, name: 'the Dutch East India Company' },
      { from: 1800, until: 1942, name: 'the Dutch East Indies' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia' },
    ],
  },
  // The Moluccas: the clove islands the Dutch fought Portugal and each other's
  // sultans for, and the reason the Company was in the archipelago at all.
  {
    match: /spice islands|maluku|moluccas|banda|ternate|tidore/i,
    eras: [
      { from: 1257, until: 1607, name: 'the sultanates of Ternate and Tidore' },
      { from: 1607, until: 1800, name: 'the Dutch East India Company' },
      { from: 1800, until: 1942, name: 'the Dutch East Indies' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1945, name: 'Indonesia' },
    ],
  },
  {
    match: /timor/i,
    eras: [
      // Portugal traded for sandalwood from 1515 and administered nothing: the
      // island stayed a patchwork of its own kingdoms until the crown appointed
      // a governor in 1702.
      { from: 1515, until: 1702, name: 'the Timorese kingdoms' },
      { from: 1702, until: 1975, name: 'Portuguese Timor' },
      { from: 1976, until: 1999, name: 'Indonesian East Timor' },
      { from: 2002, name: 'Timor-Leste' },
    ],
  },
  {
    match: /philippines|luzon|visayas|visayan|manila/i,
    eras: [
      { from: 1565, until: 1898, name: 'the Spanish East Indies' },
      { from: 1898, until: 1942, name: 'the American colonial Philippines' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1946, name: 'the Republic of the Philippines' },
    ],
  },
  // The Muslim south, which Spain never held. Sulu was still a sovereign
  // sultanate when the Americans arrived and did not renounce sovereignty
  // until 1915, four hundred years after Manila fell.
  {
    match: /sulu|mindanao|palawan|jolo|maguindanao/i,
    eras: [
      { from: 1405, until: 1915, name: 'the sultanates of Sulu and Maguindanao' },
      { from: 1915, until: 1942, name: 'the American colonial Philippines' },
      { from: 1942, until: 1945, name: 'the Empire of Japan' },
      { from: 1946, name: 'the Republic of the Philippines' },
    ],
  },
  {
    match: /sri lanka|ceylon|anuradhapura|kandy/i,
    eras: [
      { from: -377, until: 1017, name: 'the Anuradhapura Kingdom' },
      { from: 1055, until: 1232, name: 'the Polonnaruwa Kingdom' },
      { from: 1469, until: 1815, name: 'the Kingdom of Kandy' },
      { from: 1815, until: 1948, name: 'British Ceylon' },
      { from: 1948, name: 'Sri Lanka' },
    ],
  },
  // Taiwan and the Ryukyus were one entry, and `.find()` returns the first era
  // whose range covers the year by array position — so every Taiwanese
  // location read as "the Ryukyu Kingdom" from 1683 to 1879. Taiwan was never
  // part of it. Split in two; the Ryukyu entry sits after this one so its
  // narrower regex wins for the islands themselves.
  {
    match: /taiwan|formosa/i,
    eras: [
      { from: 1624, until: 1662, name: 'Dutch Formosa' },
      { from: 1662, until: 1683, name: 'the Kingdom of Tungning' },
      { from: 1683, until: 1895, name: 'Qing dynasty' },
      { from: 1895, until: 1945, name: 'Japanese colonial rule' },
      { from: 1945, name: 'Republic of China' },
    ],
  },
  {
    // Anchored: `place` is "<location> <region>" and the region is named
    // "Taiwan and Ryukyu", so an unanchored /ryukyu/ matches every Taiwanese
    // location too. Only a location that *begins* with Ryukyu is the Ryukyus.
    match: /^(?:ryukyu|okinawa)/i,
    eras: [
      { from: 1429, until: 1879, name: 'the Ryukyu Kingdom' },
      { from: 1879, until: 1945, name: 'Japanese colonial rule' },
      { from: 1945, until: 1972, name: 'the United States administration of the Ryukyus' },
      { from: 1972, name: 'Japan' },
    ],
  },
  {
    // Zone-scoped because the bare regex also matches the South Asian region
    // "Himalayas and Northeast" — Kashmir Valley, Sikkim Highlands, Assam
    // Plains, Naga Hills and the Brahmaputra Valley all carry that region
    // name, and all of them were being handed the Tibetan Empire, the Ganden
    // Phodrang or the Qing, none of which ever ruled any of them.
    match: /tibet|west china|himalaya|nepal/i,
    zones: ['EAST_ASIAN'],
    eras: [
      { from: 618, until: 842, name: 'the Tibetan Empire' },
      { from: 1642, until: 1720, name: 'the Ganden Phodrang' },
      { from: 1720, until: 1912, name: 'Qing dynasty' },
      { from: 1768, until: 2008, name: 'the Kingdom of Nepal' },
    ],
  },
  {
    match: /caucasus|georgia|armenia|azerbaijan/i,
    eras: [
      { from: -331, until: 428, name: 'the Kingdom of Armenia' },
      { from: 1008, until: 1490, name: 'the Kingdom of Georgia' },
      { from: 1801, until: 1917, name: 'Russian Empire' },
      { from: 1922, until: 1991, name: 'Soviet Union' },
      { from: 1991, name: 'the Caucasus republics' },
    ],
  },
  {
    match: /nubian|kush|meroe|sudan/i,
    eras: [
      { from: -1070, until: -350, name: 'the Kingdom of Kush' },
      { from: -350, until: 350, name: 'the Kingdom of Meroë' },
      { from: 350, until: 1504, name: 'the Christian Nubian kingdoms' },
      { from: 1504, until: 1821, name: 'the Funj Sultanate' },
      { from: 1899, until: 1956, name: 'Anglo-Egyptian Sudan' },
      { from: 1956, name: 'Sudan' },
    ],
  },

  // --- Africa --------------------------------------------------------------
  {
    match: /sahel|niger bend|timbuktu|hausa|kano/i,
    eras: [
      { from: 700, until: 1240, name: 'the Ghana Empire' },
      { from: 1235, until: 1600, name: 'Mali Empire' },
      { from: 1464, until: 1591, name: 'Songhai Empire' },
      { from: 1804, until: 1903, name: 'Sokoto Caliphate' },
      { from: 1904, until: 1960, name: 'French West Africa' },
      { from: 1960, name: 'the Sahelian republics' },
    ],
  },
  {
    match: /horn of africa|ethiopian|abyssin|aksum/i,
    eras: [
      { from: -100, until: 940, name: 'the Kingdom of Aksum' },
      { from: 1137, until: 1270, name: 'the Zagwe dynasty' },
      { from: 1270, until: 1974, name: 'Ethiopian Empire' },
      { from: 1974, name: 'Ethiopia' },
    ],
  },
  {
    match: /lower guinea|congo basin|benin/i,
    eras: [
      { from: 1180, until: 1897, name: 'Kingdom of Benin' },
      { from: 1390, until: 1857, name: 'Kingdom of Kongo' },
      { from: 1885, until: 1960, name: 'the Congo Free State and Belgian Congo' },
      { from: 1960, name: 'the Congo Basin republics' },
    ],
  },
  {
    match: /upper guinea|west african forests|ashanti|dahomey|oyo|gold coast/i,
    eras: [
      { from: 1230, until: 1600, name: 'Mali Empire' },
      { from: 1400, until: 1896, name: 'the Oyo Empire' },
      { from: 1670, until: 1902, name: 'the Ashanti Empire' },
      { from: 1600, until: 1904, name: 'the Kingdom of Dahomey' },
      { from: 1904, until: 1960, name: 'the British and French West African colonies' },
      { from: 1960, name: 'the West African republics' },
    ],
  },
  {
    match: /central africa|luba|lunda|kasai/i,
    eras: [
      { from: 1585, until: 1889, name: 'the Luba Empire' },
      { from: 1665, until: 1887, name: 'the Lunda Empire' },
      { from: 1885, until: 1960, name: 'the Congo Free State and Belgian Congo' },
      { from: 1960, name: 'the Congo Basin republics' },
    ],
  },
  {
    match: /southern africa|zimbabwe|zulu|cape|limpopo/i,
    eras: [
      { from: 1220, until: 1450, name: 'the Kingdom of Zimbabwe' },
      { from: 1652, until: 1806, name: 'the Dutch Cape Colony' },
      { from: 1806, until: 1910, name: 'the British Cape Colony' },
      { from: 1816, until: 1897, name: 'Zulu Kingdom' },
      { from: 1910, name: 'South Africa' },
    ],
  },
  {
    match: /swahili|zanzibar|kilwa|east african rift/i,
    eras: [
      { from: 1000, until: 1505, name: 'the Swahili city-states' },
      { from: 1698, until: 1856, name: 'the Omani Sultanate' },
      { from: 1890, until: 1963, name: 'the British and German East African colonies' },
      { from: 1963, name: 'the East African republics' },
    ],
  },

  // --- The Americas --------------------------------------------------------
  {
    match: /mexico|new spain|central highlands|valley of mexico|texcoco|yucat|maya/i,
    eras: [
      { from: 100, until: 550, name: 'Teotihuacan' },
      { from: 950, until: 1150, name: 'the Toltec state' },
      { from: 1428, until: 1521, name: 'the Aztec Triple Alliance' },
      { from: 1521, until: 1821, name: 'the Viceroyalty of New Spain' },
      { from: 1821, name: 'Mexico' },
    ],
  },
  {
    match: /andes|cusco|cuzco|altiplano|titicaca|peruvian/i,
    eras: [
      { from: -200, until: 1000, name: 'Tiwanaku' },
      { from: 600, until: 1000, name: 'the Wari Empire' },
      { from: 1438, until: 1533, name: 'the Inca Empire' },
      { from: 1542, until: 1824, name: 'the Viceroyalty of Peru' },
      { from: 1824, name: 'Peru' },
    ],
  },
  {
    match: /atlantic coast|bahia|pernambuco|são paulo|sao paulo|rio de janeiro/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: 1500, until: 1815, name: 'Portuguese Brazil' },
      { from: 1815, until: 1889, name: 'Empire of Brazil' },
      { from: 1889, name: 'Brazil' },
    ],
  },
  {
    match: /northeastern seaboard|atlantic coast|chesapeake|tidewater|massachusetts|new england|hudson/i,
    zones: ['NORTH_AMERICAN_COLONIAL'],
    eras: [
      { from: 1607, until: 1776, name: 'the British American colonies' },
      { from: 1776, name: 'United States' },
    ],
  },
  {
    match: /southeast|carolina|low ?country|charleston/i,
    zones: ['NORTH_AMERICAN_COLONIAL'],
    eras: [
      { from: 1670, until: 1776, name: 'the British American colonies' },
      { from: 1776, until: 1861, name: 'United States' },
      { from: 1861, until: 1865, name: 'the Confederate States' },
      { from: 1865, name: 'United States' },
    ],
  },
  // The North American interior and Pacific slope were claimed by no state
  // until they were annexed by one, so these start at the annexation rather
  // than reaching back to invent a jurisdiction over the peoples already there.
  {
    match: /great plains|mississippi valley|northern rockies/i,
    eras: [{ from: 1803, name: 'United States' }],
  },
  {
    match: /southwest|california/i,
    eras: [
      { from: 1598, until: 1821, name: 'the Viceroyalty of New Spain' },
      { from: 1821, until: 1848, name: 'Mexico' },
      { from: 1848, name: 'United States' },
    ],
  },
  {
    match: /pacific coast|oregon|columbia river/i,
    zones: ['NORTH_AMERICAN_COLONIAL', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    eras: [{ from: 1846, name: 'United States' }],
  },
  {
    match: /canada|saint lawrence|acadia|hudson bay/i,
    eras: [
      { from: 1608, until: 1763, name: 'New France' },
      { from: 1763, until: 1867, name: 'British North America' },
      { from: 1867, name: 'Canada' },
    ],
  },
  {
    match: /arctic and subarctic|alaska|yukon/i,
    eras: [
      { from: 1799, until: 1867, name: 'Russian America' },
      { from: 1867, name: 'United States' },
    ],
  },
  {
    match: /central america|guatemala|honduras|nicaragua/i,
    eras: [
      { from: 1521, until: 1821, name: 'the Viceroyalty of New Spain' },
      { from: 1823, until: 1841, name: 'the Federal Republic of Central America' },
      { from: 1841, name: 'the Central American republics' },
    ],
  },
  {
    match: /amazon|southern highlands|mato grosso|brazilian highlands/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [{ from: 1822, name: 'Brazil' }],
  },
  {
    match: /gran chaco|pampas|plata/i,
    eras: [
      { from: 1776, until: 1810, name: 'the Viceroyalty of the Río de la Plata' },
      { from: 1816, name: 'Argentina' },
    ],
  },
  {
    match: /llanos|orinoco/i,
    eras: [
      { from: 1717, until: 1819, name: 'the Viceroyalty of New Granada' },
      { from: 1819, until: 1831, name: 'Gran Colombia' },
      { from: 1831, name: 'Venezuela' },
    ],
  },
  {
    // One band from 1667 to 1975 had two faults. It ran past decolonisation —
    // Guyana went independent in 1966, Suriname in 1975, and French Guiana
    // became a department of France in 1946 — so a persona in 1973 was told he
    // lived in "the Guiana colonies". And it stopped dead in 1975 with no
    // successor, leaving every year after that with no polity at all.
    match: /guiana shield|guiana|surinam|essequibo|demerara|maroni|rupununi|kaieteur/i,
    eras: [
      { from: 1667, until: 1814, name: 'the Dutch Guianas' },
      // Anglo-Dutch Treaty of 1814: Essequibo, Demerara and Berbice to Britain,
      // Suriname retained by the Dutch. Three rival colonies, not one polity.
      { from: 1814, until: 1966, name: 'the Guiana colonies' },
      { from: 1966, name: 'Guyana, Suriname and French Guiana' },
    ],
  },
  {
    match: /patagonia/i,
    eras: [{ from: 1881, name: 'Argentina and Chile' }],
  },
  {
    match: /caribbean|antilles|saint-domingue|hispaniola/i,
    eras: [
      { from: 1492, until: 1697, name: 'the Spanish Caribbean' },
      { from: 1697, until: 1804, name: 'the French and British sugar colonies' },
      { from: 1804, name: 'the Caribbean republics and colonies' },
    ],
  },

  // --- Oceania -------------------------------------------------------------
  {
    match: /australia/i,
    eras: [
      { from: 1788, until: 1901, name: 'the British Australian colonies' },
      { from: 1901, name: 'Commonwealth of Australia' },
    ],
  },
  {
    match: /new zealand|aotearoa/i,
    eras: [
      { from: 1840, until: 1907, name: 'the British colony of New Zealand' },
      { from: 1907, name: 'New Zealand' },
    ],
  },
  // The Pacific had no states before contact and a great many after it. These
  // entries begin at annexation for the same reason the Great Plains one begins
  // at 1803: what came before was not a state, and saying so is not a gap.
  {
    match: /hawaii|central pacific/i,
    eras: [
      { from: 1795, until: 1893, name: 'the Kingdom of Hawaii' },
      { from: 1898, name: 'United States' },
    ],
  },
  {
    match: /new guinea|melanesia/i,
    eras: [
      { from: 1884, until: 1975, name: 'the German, British and Australian New Guinea territories' },
      { from: 1975, name: 'Papua New Guinea' },
    ],
  },
  {
    match: /polynesia|samoa|tahiti|tonga/i,
    eras: [
      { from: 1845, until: 1900, name: 'the Polynesian kingdoms' },
      { from: 1900, name: 'the Pacific island territories' },
    ],
  },
  {
    match: /micronesia|caroline|marshall|mariana/i,
    eras: [
      { from: 1885, until: 1899, name: 'the Spanish East Indies' },
      { from: 1899, until: 1914, name: 'German New Guinea' },
      { from: 1914, until: 1945, name: 'the Japanese South Seas Mandate' },
      { from: 1947, until: 1986, name: 'the Trust Territory of the Pacific Islands' },
      { from: 1986, name: 'the Micronesian republics' },
    ],
  },
  // Filed under Oceania by the map, but its modern history is Indonesian. The
  // Moluccas, the Banda Sea and Timor were matched here too and, because this
  // entry is tried before the Southeast Asian ones, it took them: the Banda
  // islands got a generic colonial label in place of Ternate and Tidore, and
  // Timor never reached Portuguese Timor or Timor-Leste at all. They are named
  // in their own entries now and removed from this one.
  {
    match: /indonesian and melanesian islands/i,
    eras: [
      { from: 1512, until: 1800, name: 'the Dutch and Portuguese spice colonies' },
      { from: 1800, until: 1949, name: 'the Dutch East Indies' },
      { from: 1949, name: 'Indonesia' },
    ],
  },
  // The map files Iceland, Greenland, the Azores and Cape Verde under one
  // region, and no single answer covers them: two were Danish, two Portuguese,
  // and they were settled centuries apart. One entry each is the only honest
  // way to answer for any of them.
  {
    match: /iceland/i,
    eras: [
      { from: 930, until: 1262, name: 'the Icelandic Commonwealth' },
      { from: 1262, until: 1380, name: 'Kingdom of Norway' },
      { from: 1380, until: 1944, name: 'the Danish crown' },
      { from: 1944, name: 'Iceland' },
    ],
  },
  {
    match: /greenland/i,
    eras: [
      { from: 986, until: 1408, name: 'the Norse Greenland settlements' },
      { from: 1721, until: 1979, name: 'the Danish crown' },
      { from: 1979, name: 'Greenland under Danish sovereignty' },
    ],
  },
  {
    match: /azores|madeira/i,
    eras: [
      { from: 1439, until: 1910, name: 'Kingdom of Portugal' },
      { from: 1910, name: 'Portuguese Republic' },
    ],
  },
  {
    match: /cape verde/i,
    eras: [
      { from: 1462, until: 1975, name: 'Portuguese Cape Verde' },
      { from: 1975, name: 'Cape Verde' },
    ],
  },
  {
    match: /madagascar/i,
    eras: [
      { from: 1787, until: 1897, name: 'the Merina Kingdom' },
      { from: 1897, until: 1960, name: 'French Madagascar' },
      { from: 1960, name: 'Madagascar' },
    ],
  },
  // ---------------------------------------------------------------------
  // Location overrides (added 2026-07). Last in the array, so the backwards
  // walk in `getPolityAt` reaches them before the broader regexes above.
  // ---------------------------------------------------------------------
  // BENGAL_DELTA_ENTRY
  {
    match: /bengal delta|sundarbans/i,
    eras: [
      { from: 750, until: 1161, name: 'the Pala dynasty' },
      { from: 1161, until: 1204, name: 'the Sena dynasty' },
      // UNCERTAIN: Bakhtiyar Khalji's raid is conventionally dated 1204/1206;
      // the general entry's Delhi Sultanate era (1206-) covers the rest.
    ],
  },
  // PUNJAB_ENTRY
  {
    match: /punjab/i,
    eras: [
      { from: 843, until: 1026, name: 'the Hindu Shahi dynasty' },
      { from: 1026, until: 1186, name: 'the Ghaznavid dynasty' },
    ],
  },
  // SINDH_ENTRY
  {
    match: /sindh|thar desert|rann of kutch/i,
    eras: [
      { from: 712, until: 750, name: 'Umayyad Caliphate' },
      { from: 750, until: 861, name: 'Abbasid Caliphate' },
      { from: 861, until: 1024, name: 'the Habbari dynasty' },
      { from: 1024, until: 1351, name: 'the Soomra dynasty' },
    ],
  },
  // KARNATAKA_ENTRY
  {
    match: /karnataka/i,
    eras: [
      { from: 1026, until: 1343, name: 'the Hoysala dynasty' },
    ],
  },
  // HYDERABAD_HIGHLANDS_ENTRY
  {
    match: /hyderabad highlands/i,
    eras: [
      { from: 1163, until: 1323, name: 'the Kakatiya dynasty' },
    ],
  },
  // KASHMIR_ENTRY
  {
    match: /kashmir/i,
    zones: ['SOUTH_ASIAN'],
    eras: [
      { from: 625, until: 855, name: 'the Karkota dynasty' },
      { from: 855, until: 1003, name: 'the Utpala dynasty' },
      { from: 1003, until: 1339, name: 'the Lohara dynasty' },
      { from: 1339, until: 1586, name: 'the Kashmir Sultanate' },
      { from: 1586, until: 1752, name: 'Mughal Empire' },
      // UNCERTAIN: "Durrani rule" is the conventional label; Kashmir was a
      // contested Durrani province, not its core.
      { from: 1752, until: 1819, name: 'the Durrani Empire' },
      { from: 1819, until: 1846, name: 'Sikh Empire' },
      { from: 1846, until: 1947, name: 'the princely state of Jammu and Kashmir' },
      // UNCERTAIN: post-1947 sovereignty over Kashmir is disputed between
      // India, Pakistan, and China; "Republic of India" describes only the
      // portion India has administered since 1947, not the whole region.
      { from: 1947, name: 'Republic of India' },
    ],
  },
  // SIKKIM_ENTRY
  {
    match: /sikkim/i,
    zones: ['SOUTH_ASIAN'],
    eras: [
      { from: 1642, until: 1975, name: 'the Kingdom of Sikkim' },
      { from: 1975, name: 'Republic of India' },
    ],
  },
  // DARJEELING_ENTRY
  {
    match: /darjeeling/i,
    zones: ['SOUTH_ASIAN'],
    eras: [
      // UNCERTAIN: Darjeeling's pre-1835 status as a Sikkimese dependency vs.
      // contested with Nepal/Bhutan is not cleanly a single polity; using
      // Sikkim as the nearest defensible label.
      { from: 1642, until: 1835, name: 'the Kingdom of Sikkim' },
      { from: 1835, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Republic of India' },
    ],
  },
  // ASSAM_BRAHMAPUTRA_ENTRY
  {
    match: /assam|brahmaputra/i,
    zones: ['SOUTH_ASIAN'],
    eras: [
      { from: 350, until: 1140, name: 'the Kamarupa kingdom' },
      // Gap 1140-1228 (post-Kamarupa fragmentation) left deliberately open.
      { from: 1228, until: 1826, name: 'the Ahom kingdom' },
      { from: 1826, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Republic of India' },
    ],
  },
  // NAGA_HILLS_ENTRY
  {
    match: /naga hills/i,
    zones: ['SOUTH_ASIAN'],
    eras: [
      { from: 1881, until: 1947, name: 'British Raj' },
      { from: 1947, name: 'Republic of India' },
    ],
  },
  // JAFFNA_ENTRY
  {
    match: /jaffna/i,
    eras: [
      { from: 1215, until: 1619, name: 'the Kingdom of Jaffna' },
      { from: 1619, until: 1658, name: 'Portuguese Ceylon' },
      { from: 1658, until: 1796, name: 'Dutch Ceylon' },
      { from: 1796, until: 1948, name: 'British Ceylon' },
      { from: 1948, name: 'Sri Lanka' },
    ],
  },
  // MALDIVES_ENTRY
  {
    match: /maldives/i,
    eras: [
      { from: 1153, until: 1968, name: 'the Sultanate of the Maldives' },
      { from: 1968, name: 'Republic of Maldives' },
    ],
  },
  // FERGHANA_ENTRY
  {
    match: /ferghana/i,
    eras: [
      { from: 1709, until: 1876, name: 'the Khanate of Kokand' },
    ],
  },
  // YANGTZE_DELTA_ENTRY
  {
    match: /yangtze delta/i,
    eras: [
      { from: 907, until: 978, name: 'the Wuyue Kingdom' },
    ],
  },
  // FUJIAN_ENTRY
  {
    match: /fujian/i,
    eras: [
      { from: 909, until: 945, name: 'the Min Kingdom' },
      // Gap 945-960 (Southern Tang interlude) left open rather than adding a
      // third short-lived state for a 15-year window.
    ],
  },
  // PEARL_RIVER_GUANGXI_ENTRY
  {
    match: /pearl river delta|guangxi/i,
    eras: [
      { from: 917, until: 971, name: 'the Southern Han Kingdom' },
    ],
  },
  // YANGTZE_GORGES_ENTRY
  {
    match: /yangtze gorges/i,
    eras: [
      { from: 924, until: 963, name: 'the Kingdom of Jingnan' },
    ],
  },
  // HOKKAIDO_ENTRY
  {
    match: /hokkaido/i,
    eras: [
      // UNCERTAIN: "Matsumae Domain" describes trading-post control of the
      // coast, not the whole island; the Ainu interior remained outside any
      // state's administration for most of this span too.
      { from: 1604, until: 1869, name: 'the Matsumae Domain' },
    ],
  },
  // GYEONGJU_ENTRY
  {
    match: /gyeongju/i,
    eras: [
      { from: -57, until: 668, name: 'the kingdom of Silla' },
    ],
  },
  // JEOLLA_ENTRY
  {
    match: /jeolla/i,
    eras: [
      { from: -18, until: 660, name: 'the kingdom of Baekje' },
    ],
  },
  // BAEKDU_ENTRY
  {
    match: /baekdu/i,
    eras: [
      { from: -37, until: 668, name: 'the kingdom of Goguryeo' },
    ],
  },
  // BUSAN_ENTRY
  {
    match: /busan/i,
    eras: [
      { from: 42, until: 562, name: 'the Gaya confederacy' },
      { from: 562, until: 668, name: 'the kingdom of Silla' },
    ],
  },
  // KAESONG_ENTRY
  {
    match: /kaesong/i,
    eras: [
      { from: 901, until: 918, name: 'Taebong' }, // UNCERTAIN: brief, but well-attested and a clean fit for this specific location
    ],
  },
  // TAIWAN_ENTRY
  {
    match: /taiwan|formosa/i,
    eras: [
      // Pre-1624 left deliberately open (Austronesian aboriginal societies,
      // no state).
      { from: 1624, until: 1662, name: 'Dutch Formosa' },
      { from: 1662, until: 1683, name: 'the Kingdom of Tungning' },
      { from: 1683, until: 1895, name: 'Qing dynasty' },
      { from: 1895, until: 1945, name: 'Japanese colonial rule' },
      { from: 1945, name: 'Republic of China' },
    ],
  },
  // RYUKYU_ENTRY
  {
    match: /ryukyu/i,
    eras: [
      // Pre-1429 (the Sanzan/"Three Kingdoms of Ryukyu" period) left open —
      // three competing polities, no single name.
      { from: 1429, until: 1879, name: 'the Ryukyu Kingdom' },
      { from: 1879, until: 1945, name: 'Japan' },
      { from: 1945, until: 1972, name: 'United States administration' },
      { from: 1972, name: 'Japan' },
    ],
  },
  // SICHUAN_ENTRY
  {
    match: /sichuan/i,
    eras: [
      { from: -221, until: -206, name: 'Qin dynasty' },
      { from: -206, until: 220, name: 'Han dynasty' },
      { from: 221, until: 263, name: 'Shu Han' },
      { from: 266, until: 317, name: 'Western Jin dynasty' },
      // UNCERTAIN: Cheng-Han's exact borders/dates within the wider Sixteen
      // Kingdoms chaos are not tightly fixed.
      { from: 304, until: 347, name: 'the Cheng-Han kingdom' },
      { from: 581, until: 618, name: 'Sui dynasty' },
      { from: 618, until: 907, name: 'Tang dynasty' },
      { from: 907, until: 925, name: 'Former Shu' },
      { from: 934, until: 965, name: 'Later Shu' },
      { from: 965, until: 1279, name: 'Song dynasty' },
      { from: 1279, until: 1368, name: 'Yuan dynasty' },
      { from: 1368, until: 1644, name: 'Ming dynasty' },
      { from: 1644, until: 1912, name: 'Qing dynasty' },
      { from: 1912, until: 1949, name: 'Republic of China' },
      { from: 1949, name: "People's Republic of China" },
    ],
  },
  // YUNNAN_ENTRY
  {
    match: /yunnan/i,
    eras: [
      // UNCERTAIN: 738 is the conventional founding date (Piluoge's
      // unification of the six zhao under Tang sponsorship); some sources
      // give dates a decade or two either side.
      { from: 738, until: 902, name: 'the Nanzhao Kingdom' },
      { from: 937, until: 1253, name: 'the Dali Kingdom' },
      { from: 1253, until: 1368, name: 'Yuan dynasty' },
      { from: 1368, until: 1644, name: 'Ming dynasty' },
      { from: 1644, until: 1912, name: 'Qing dynasty' },
      { from: 1912, until: 1949, name: 'Republic of China' },
      { from: 1949, name: "People's Republic of China" },
    ],
  },
  // SSA_SOUTHERN_AFRICA_ENTRY
  {
    match: /southern africa|zimbabwe|zulu|cape|limpopo/i,
    // Zone-scoped: bare "cape" also matches "Cape Cod" (Massachusetts), which
    // has nothing to do with southern Africa. "Southern Africa" is not reused
    // as a region name by any other zone, so this scoping is safe.
    zones: ['SUB_SAHARAN_AFRICAN'],
    eras: [
      { from: 1075, until: 1220, name: 'the Kingdom of Mapungubwe' },
      { from: 1220, until: 1450, name: 'the Kingdom of Zimbabwe' },
      { from: 1652, until: 1806, name: 'the Dutch Cape Colony' },
      { from: 1806, until: 1910, name: 'the British Cape Colony' },
      { from: 1816, until: 1897, name: 'Zulu Kingdom' },
      { from: 1910, name: 'South Africa' },
    ],
  },
  // SSA_COMOROS_ENTRY
  {
    match: /comoros/i,
    zones: ['SUB_SAHARAN_AFRICAN'],
    eras: [
      { from: 1500, until: 1886, name: 'the Comorian sultanates' }, // UNCERTAIN: founding dates vary by island and dynasty
      { from: 1886, until: 1975, name: 'French Comoros' },
      { from: 1975, name: 'Comoros' },
    ],
  },
  // NA_MAYA_ENTRY
  {
    // The Maya lowlands (Yucatán and the Petén) currently fall through to
    // whichever of the Mexico or Central America entries reaches them first
    // for a given year, handing them Teotihuacan, the Toltec state and the
    // Aztec Triple Alliance — none of which ever ruled the Maya region, which
    // stayed politically independent (many rival city-states, never one
    // empire) until Spain finished conquering it in 1697, three centuries
    // after Tenochtitlan fell.
    match: /yucat|maya/i,
    eras: [
      { from: -400, until: 900, name: 'the Preclassic and Classic Maya city-states' }, // UNCERTAIN: -400 marks Late Preclassic centers like El Mirador; before that, Maya settlement was village-scale
      { from: 900, until: 1200, name: 'Chichen Itza' }, // UNCERTAIN: Chichen Itza's dominant span is debated, roughly 800-1100/1200
      { from: 1220, until: 1441, name: 'the Mayapan League' },
      { from: 1441, until: 1697, name: 'the independent Maya kingdoms' },
      { from: 1697, until: 1821, name: 'the Viceroyalty of New Spain' },
      // Honest compound: Yucatán became part of Mexico, the Petén part of
      // Guatemala. No single successor state, same idea as the Guiana entry.
      { from: 1821, name: 'Mexico and the Central American republics' },
    ],
  },
  // SA_ECUADOR_ENTRY
  {
    // Quito was an Inca provincial seat, then the Audiencia de Quito under
    // Peru's viceroyalty, transferred to New Granada in 1717, part of Gran
    // Colombia at independence, and Ecuador since the 1830 split.
    match: /quito|chimborazo/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: 1470, until: 1533, name: 'the Inca Empire' }, // UNCERTAIN: conquest under Huayna Capac, dated variously 1460s-1500s
      { from: 1563, until: 1717, name: 'the Real Audiencia de Quito' },
      { from: 1739, until: 1822, name: 'the Viceroyalty of New Granada' },
      { from: 1822, until: 1830, name: 'Gran Colombia' },
      { from: 1830, name: 'Ecuador' },
    ],
  },
  // SA_MAPUCHE_ENTRY
  {
    // Araucanía. Never held by the Inca or by Spain in any lasting way — the
    // Mapuche fought both to a standstill for three centuries — this table
    // names no polity here before Chile's Occupation of Araucanía finished it
    // in 1883. Whether the Mapuche's own long-lived war confederacy belongs in
    // a table like this one is a real design question; see the summary above.
    match: /mapuche/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [{ from: 1883, name: 'Chile' }],
  },
  // SA_CUYO_ENTRY
  {
    // Cuyo (Mendoza, Aconcagua): settled from Chile in 1561, administered from
    // Santiago until the 1776 reshuffle moved it to the new Río de la Plata
    // viceroyalty, then Argentina at independence.
    match: /mendoza|aconcagua/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: 1561, until: 1776, name: 'the Captaincy General of Chile' },
      { from: 1776, until: 1810, name: 'the Viceroyalty of the Río de la Plata' },
      { from: 1816, name: 'Argentina' },
    ],
  },
  // SA_ATACAMA_ENTRY
  {
    // The Atacama coast was Bolivia's until the War of the Pacific; the Treaty
    // of Ancón ceded it to Chile in 1884.
    match: /atacama/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: 1450, until: 1533, name: 'the Inca Empire' },
      { from: 1542, until: 1825, name: 'the Viceroyalty of Peru' },
      { from: 1825, until: 1884, name: 'Bolivia' },
      { from: 1884, name: 'Chile' },
    ],
  },
  // SA_BOLIVIA_ENTRY
  {
    // Upper Peru / Charcas: Sucre, Potosí, Tarija, Cochabamba, Santa Cruz, the
    // Yungas, and the Altiplano proper are Bolivia, not Brazil. The generic
    // "amazon|southern highlands|..." entry claims all of "Southern Highlands"
    // for Brazil because that is the literal region name it was written to
    // catch — a bug, not a judgement call, since every location ever filed
    // under "Southern Highlands" in this map is Bolivian.
    match: /sucre|potos|tarija|cochabamba|santa cruz|yungas|upper peru|charcas|altiplano/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: -200, until: 1000, name: 'Tiwanaku' },
      { from: 1438, until: 1533, name: 'the Inca Empire' },
      { from: 1542, until: 1776, name: 'the Viceroyalty of Peru' },
      { from: 1776, until: 1825, name: 'the Viceroyalty of the Río de la Plata' },
      { from: 1825, name: 'Bolivia' },
    ],
  },
  // SA_URUGUAY_ENTRY
  {
    // The Banda Oriental: fought over by Spain and Portugal, briefly Brazilian
    // as Cisplatina, and independent as the buffer state both Argentina and
    // Brazil settled for in 1828.
    match: /uruguay/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: 1680, until: 1776, name: 'the Spanish and Portuguese borderlands of the Río de la Plata' }, // UNCERTAIN: a century of contested Colônia do Sacramento claims, flattened
      { from: 1776, until: 1821, name: 'the Viceroyalty of the Río de la Plata' },
      { from: 1821, until: 1828, name: 'Cisplatina under the Empire of Brazil' },
      { from: 1828, name: 'Uruguay' },
    ],
  },
  // SA_PANTANAL_ENTRY
  {
    // The Pantanal is overwhelmingly Brazilian (Mato Grosso), not Argentine; it
    // only falls into "Gran Chaco and Pampas" because that is the region label
    // the map filed it under.
    match: /pantanal/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [{ from: 1822, name: 'Brazil' }],
  },
  // SA_COLOMBIA_LLANOS_ENTRY
  {
    // Villavicencio and the Meta river basin are the Colombian Llanos, not
    // Venezuela; the generic "llanos|orinoco" entry only ever reaches for
    // Venezuela.
    match: /villavicencio|meta river/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      { from: 1717, until: 1819, name: 'the Viceroyalty of New Granada' },
      { from: 1819, until: 1831, name: 'Gran Colombia' },
      { from: 1831, name: 'Colombia' },
    ],
  },
  // --- Medieval location overrides (added 2026-08). Last in the array, so
  // the backwards walk reaches them first. Order within the Deccan cluster
  // is load-bearing; see the source file's note.
  // --- Europe ----------------------------------------------------------------
  { // DUBLIN_ENTRY — narrower than the Ireland regex; wins for Dublin itself.
    match: /dublin/i,
    eras: [
      { from: 853, until: 1170, name: 'the Kingdom of Dublin' },
      // 1170-1177 (fall of the city to Anglo-Norman force, before the
      // Lordship of Ireland's formal 1177 date) is a 7-year seam, left as is.
    ],
  },
  { // FLANDERS_ENTRY — narrower than the Low Countries regex; wins for
    // Flanders specifically, correcting the general fill's "Holy Roman
    // Empire" label (Flanders was a French fief, not Imperial territory).
    match: /flanders/i,
    eras: [
      { from: 862, until: 1384, name: 'the County of Flanders' },
    ],
  },
  { // TBILISI_ENTRY — narrower than the Caucasus regex; wins for Tbilisi
    // itself, where a Muslim emirate held out well after the Bagrationi
    // kings' 1008 union of Georgia elsewhere.
    match: /tbilisi/i,
    eras: [
      { from: 735, until: 1122, name: 'the Emirate of Tbilisi' },
      // 1122 onward falls through to the base Caucasus entry's "Kingdom of
      // Georgia" (from 1008), which is accurate again once David IV took the
      // city.
    ],
  },

  // --- South Asia --------------------------------------------------------
  { // SINDH_EARLY_ENTRY — same regex as the existing SINDH_ENTRY. Its own
    // eras start at 712 (Arab conquest); these are the two indigenous
    // dynasties immediately before it.
    match: /sindh|thar desert|rann of kutch/i,
    eras: [
      { from: 489, until: 632, name: 'the Rai dynasty of Sindh' },
      { from: 632, until: 712, name: 'the Chach dynasty of Sindh' },
    ],
  },
  { // KARNATAKA_KADAMBA_ENTRY — same regex as the existing KARNATAKA_ENTRY
    // (Hoysala 1026-1343). This is the era immediately before it.
    match: /karnataka/i,
    eras: [
      { from: 345, until: 540, name: 'the Kadamba dynasty of Banavasi' },
    ],
  },
  { // DECCAN_TUGHLUQ_ENTRY — reuses the BROAD Deccan Plateau regex. Must be
    // spliced in BEFORE (i.e. physically above) COROMANDEL_ENTRY and
    // MALABAR_ENTRY below, so those two narrower, more accurate entries win
    // for Tamil Nadu/Kerala specifically. Closes the 1317-1336 seam between
    // the Yadava dynasty's fall and Vijayanagara's rise — this is exactly
    // when Muhammad bin Tughluq annexed the Deccan and briefly moved the
    // Delhi Sultanate's capital to Daulatabad (former Devagiri), 1327.
    match: /deccan|maharashtra|central india/i,
    eras: [
      { from: 1317, until: 1336, name: 'Delhi Sultanate' },
    ],
  },
  { // COROMANDEL_ENTRY — narrower than the Deccan Plateau regex; wins for
    // Tamil Nadu specifically, which the generic Deccan sequence
    // (Satavahana/Chalukya/Rashtrakuta/Yadava/Bahmani) never actually ruled.
    // MUST be spliced in AFTER DECCAN_TUGHLUQ_ENTRY above.
    match: /coromandel/i,
    eras: [
      { from: 275, until: 897, name: 'the Pallava dynasty' },
      { from: 848, until: 1216, name: 'Chola dynasty' },
      { from: 1216, until: 1335, name: 'the Pandyan Empire' },
      // UNCERTAIN: a short-lived independent sultanate, absorbed by
      // Vijayanagara in 1378 — the base Deccan Plateau entry's Vijayanagara
      // era (1336-1646) picks up automatically once this entry's own eras
      // run out.
      { from: 1335, until: 1378, name: 'the Madurai Sultanate' },
    ],
  },
  { // MALABAR_ENTRY — narrower than the Deccan Plateau regex; wins for
    // Kerala specifically. MUST be spliced in AFTER DECCAN_TUGHLUQ_ENTRY.
    match: /malabar/i,
    eras: [
      // 500-800 (post-Sangam Kerala, before the Chera revival) left open —
      // genuinely undocumented, no defensible name.
      { from: 800, until: 1102, name: 'the Chera dynasty' },
      // 1102-1250 (post-Chera fragmentation into small Nair principalities)
      // left open deliberately.
      // UNCERTAIN founding date: the Zamorins' predecessors (the Eradis of
      // Nediyiruppu) are attested from c. 1100 but did not become the
      // dominant Calicut power until the 13th-14th century; left open-ended
      // since the Zamorins remained Malabar's leading power well past 1500.
      { from: 1250, name: 'the Zamorin of Calicut' },
    ],
  },

  // --- East Asia -----------------------------------------------------------
  { // SICHUAN_EARLY_ENTRY — same regex as the existing SICHUAN_ENTRY. Closes
    // the 347-581 gap between the Cheng-Han kingdom's fall and the Sui.
    match: /sichuan/i,
    eras: [
      { from: 347, until: 420, name: 'Eastern Jin dynasty' },
      { from: 420, until: 553, name: 'the Southern dynasties' },
      // UNCERTAIN: specifically Western Wei then Northern Zhou control after
      // their 553 conquest of Chengdu from Liang; labelled to match this
      // file's existing "the Northern dynasties" collective for the same
      // years elsewhere in China.
      { from: 553, until: 581, name: 'the Northern dynasties' },
    ],
  },
  { // FUJIAN_SOUTHERNTANG_ENTRY — same regex as the existing FUJIAN_ENTRY.
    // The existing entry's comment explicitly left 945-960 open "rather than
    // adding a third short-lived state for a 15-year window"; under the new
    // maximalist instruction, naming it is the better call.
    match: /fujian/i,
    eras: [
      // UNCERTAIN: Southern Tang took the north of Min's former territory in
      // 945; the south (Quanzhou/Zhangzhou) was actually held by the local
      // warlord Liu Congxiao, nominally submitting to Southern Tang and then
      // Song, formally absorbed in 978.
      { from: 945, until: 978, name: 'the Southern Tang' },
    ],
  },
  { // KAILASH_GUGE_ENTRY — zone-scoped like the base Tibet entry, for the
    // same reason (the bare terms this file uses for Tibet also match South
    // Asian Himalayan regions). Mount Kailash and the surrounding Ngari
    // region were the Guge Kingdom's core, distinct from central Tibet's
    // "era of fragmentation", which this file already and correctly leaves
    // open elsewhere.
    match: /kailash/i,
    zones: ['EAST_ASIAN'],
    eras: [
      { from: 980, until: 1630, name: 'the Guge Kingdom' },
    ],
  },
  { // AMDO_TSONGKHA_ENTRY — zone-scoped for the same reason. "Eastern
    // Plateau Slopes" is this map's name for the Amdo/eastern-Tibet-plateau
    // fringe, which Tsongkha (centred near modern Xining) actually ruled.
    // UNCERTAIN: this location name is generic enough that it may not always
    // denote Amdo specifically; flagged rather than assumed.
    match: /eastern plateau slopes/i,
    zones: ['EAST_ASIAN'],
    eras: [
      { from: 997, until: 1104, name: 'the Tsongkha kingdom' },
    ],
  },

  // --- Southeast Asia --------------------------------------------------------
  { // WEST_JAVA_ENTRY — narrower than the base Java regex; wins for West
    // Java specifically, which was never part of the Medang/Kediri/
    // Singhasari/Majapahit sequence centred further east — it was Sundanese,
    // and at times (the 1357 Bubat war) at war with Majapahit.
    match: /west java/i,
    eras: [
      { from: 450, until: 669, name: 'Tarumanagara' },
      // Left open-ended: the Sunda Kingdom lasted to 1579, well past this
      // file's 500-1500 scope, and nothing later in this override list would
      // otherwise contradict that.
      { from: 669, name: 'the Sunda Kingdom' },
    ],
  },
  { // VISAYAS_CEBU_ENTRY — the pre-Spanish Visayas were never part of the
    // Sulu/Maguindanao sultanates (which were Mindanao-based) or under any
    // Luzon polity; Cebu had its own Hindu-Buddhist-influenced rajahnate,
    // attested at Spanish contact (Rajah Humabon, 1521) and traditionally
    // founded earlier.
    match: /visayan sea/i,
    eras: [
      // UNCERTAIN founding date: oral tradition traces the line to a 13th-
      // century Sri Lumay; treated as approximate.
      { from: 1200, until: 1565, name: 'the Rajahnate of Cebu' },
    ],
  },

  // --- Sub-Saharan Africa ----------------------------------------------------
  { // BENIN_OGISO_ENTRY — narrower than either regex that currently reaches
    // "Benin" text; wins outright. The Ogiso ("kings of the sky") dynasty
    // predates the current Oba dynasty (1180-) named in the base entry.
    // UNCERTAIN: dating rests on oral king-lists rather than epigraphy;
    // treated the same way this file already treats other oral-tradition
    // African dynasties (e.g. the Zagwe).
    match: /\bbenin\b/i,
    eras: [
      { from: 900, until: 1180, name: 'the Ogiso dynasty of Benin' },
    ],
  },
  { // NRI_ENTRY — the Igbo heartland (Niger Delta, Ibo Plateau) was and is
    // famously acephalous/stateless in the usual sense — but the Kingdom of
    // Nri was a real, named, non-military ritual kingship whose authority
    // (over ritual purification and titled ozo status, not territorial rule
    // in the usual sense) was recognised across a wide area of Igboland.
    // UNCERTAIN: dating is contested — Igbo-Ukwu bronzes are carbon-dated to
    // the 9th-10th century, and the first named king (Ìfikuánim) is placed
    // at 1043 by oral chronology; 900 is used here as the conservative
    // (later, better-attested) end of that range.
    match: /niger delta|ibo plateau/i,
    eras: [
      { from: 900, until: 1911, name: 'the Kingdom of Nri' },
    ],
  },
  { // SWAHILI_EARLY_ENTRY — narrower than the base Swahili regex. The base
    // entry's "Swahili city-states" era starts at 1000, which is when the
    // stone-built sultanates are attested; the Tana Tradition coastal
    // trading settlements (Shanga, Manda, Unguja Ukuu) are attested from the
    // 8th century, before they coalesced into named sultanates.
    match: /swahili coast/i,
    eras: [
      // UNCERTAIN: no single named state, just the settlements that later
      // became one — flagged as approximate the way this file already
      // flags "the Cuman-Kipchak confederation".
      { from: 750, until: 1000, name: 'the early Swahili settlements' },
    ],
  },
  { // MAGHREB_MOROCCO_ENTRY — narrower than the base Maghreb regex; wins for
    // the Morocco-specific locations. Between entries, years fall through to
    // the base Maghreb entry's Fatimid (909-1171) and Almohad (1121-1269)
    // eras, which is accurate enough for the seams (974-1062, 1147-1244).
    match: /fez plateau|rif coast|atlas mountains/i,
    eras: [
      { from: 788, until: 974, name: 'the Idrisid dynasty' },
      { from: 1062, until: 1147, name: 'the Almoravid dynasty' },
      { from: 1244, until: 1465, name: 'the Marinid dynasty' },
      { from: 1465, until: 1554, name: 'the Wattasid dynasty' },
    ],
  },
  { // MAGHREB_TUNISIA_ENTRY — narrower than the base Maghreb regex; wins for
    // Tunisia/eastern Maghreb specifically, closing the 1269-1574 gap that
    // the Marinid/Wattasid sequence above does not cover here (the Hafsids
    // ruled Ifriqiya, not Morocco).
    match: /tunisian sahel|tripolitania|cyrenaica coast/i,
    eras: [
      { from: 1229, until: 1574, name: 'the Hafsid dynasty' },
    ],
  },

  // --- The Americas ------------------------------------------------------
  { // YORUBA_IFE_ENTRY — narrower than the base West African Forests regex
    // (which contains "oyo" and would otherwise eventually hand these
    // locations the Oyo Empire from 1400, six centuries too early). Ile-Ife
    // is the traditional and archaeological cradle of Yoruba civilization,
    // both these locations sit in its immediate hinterland, and the base
    // entry's Oyo Empire (which succeeded Ife as the dominant Yoruba power)
    // still applies automatically once its own eras run out.
    match: /oyo hinterland|ogun river basin/i,
    eras: [
      // UNCERTAIN: Ife's founding is traditionally far older (Yoruba oral
      // tradition and some archaeology place initial settlement centuries
      // BCE), but 1000-1420 is the period the urban/political core and its
      // famous naturalistic bronze and terracotta portraiture are actually
      // well attested, so that is what is asserted here.
      { from: 1000, until: 1420, name: 'the Kingdom of Ife' },
    ],
  },
  { // AKAN_BONOMAN_ENTRY — narrower than the base regex (which contains
    // "ashanti" and "gold coast" and would otherwise reach for the Ashanti
    // Empire, 1670). Bonoman/Bono state was the earlier Akan gold-trading
    // kingdom these two locations' Akan populations descend from, and it
    // fed the same trans-Saharan gold trade Mali and Songhai ran on the
    // other end.
    match: /gold coast savanna|ashanti forest/i,
    eras: [
      // UNCERTAIN: founding dates given in the sources I could check range
      // from the 11th century to 1450; 1250 is a middle-of-the-road pick
      // consistent with the 12th-century gold-trade boom that is better
      // attested than the state's formal founding.
      { from: 1250, until: 1670, name: 'the Bono state' },
    ],
  },
  { // MISSISSIPPI_VALLEY_CAHOKIA_ENTRY — Cahokia was a real paramount
    // chiefdom with monumental earthworks and an estimated peak population
    // of 10,000-20,000, the largest pre-Columbian settlement north of
    // Mexico. Zone-scoped (not strictly necessary for this text, but matches
    // the file's convention for new Americas entries).
    match: /mississippi valley/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    eras: [
      { from: 1050, until: 1350, name: 'Cahokia' },
    ],
  },
  { // SOUTHEAST_MISSISSIPPIAN_ENTRY — zone-scoped, LOAD-BEARING here: without
    // it, "Piedmont Uplands" would also match Italy's Piedmont region under
    // the EUROPEAN zone. The Georgia/Tennessee Piedmont and the Smoky
    // Mountains foothills were the historical range of the Mississippian
    // paramount chiefdoms (Coosa among them, attested in detail by the 1540
    // De Soto chronicles).
    match: /smoky mountains|piedmont uplands/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    eras: [
      // UNCERTAIN: a collective label for the region's mound-building
      // paramount chiefdoms generally (Coosa specifically is attested only
      // 1400-1600); mirrors "the Swahili city-states" convention.
      { from: 1000, until: 1600, name: 'the Mississippian chiefdoms' },
    ],
  },
  { // ANDES_CUZCO_ENTRY — the pre-imperial Kingdom of Cusco, well before the
    // 1438 Inca imperial expansion the base entry already names.
    match: /cuzco valley/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      // UNCERTAIN founding date (John Rowe's conventional c. 1200, based on
      // king-list reign-counting rather than direct evidence).
      { from: 1200, until: 1438, name: 'the Kingdom of Cusco' },
    ],
  },
  { // ANDES_TITICACA_AYMARA_ENTRY — narrower than the base Andes regex;
    // wins for Lake Titicaca Basin specifically. The base entry's Tiwanaku
    // era already covers -200 to 1000; this is the Late Intermediate Period
    // that followed its collapse.
    match: /titicaca/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      // 1000-1150 (immediate post-Tiwanaku-collapse instability) left open.
      // UNCERTAIN: a collective label for the rival Lupaqa, Colla and other
      // Aymara-speaking lordships, matching "the taifa kingdoms" convention.
      { from: 1150, until: 1450, name: 'the Aymara kingdoms' },
    ],
  },
  { // ANDES_CHACHAPOYA_ENTRY — the "Warriors of the Clouds", a documented
    // confederation of related highland-forest polities in northern Peru.
    match: /chachapoyas/i,
    zones: ['SOUTH_AMERICAN'],
    eras: [
      // UNCERTAIN: a confederation of allied cacicazgos (small kingdoms)
      // rather than one centralised state — flagged the same way "the
      // Swahili city-states" is.
      { from: 800, until: 1470, name: 'the Chachapoya confederation' },
    ],
  },
];

/**
 * The state claiming this place in this year, or `undefined` where the table
 * declines to name one.
 *
 * Entries are tried most-specific-first (bottom of the table up), and an entry
 * that matches the place but has no era covering the year does not stop the
 * search — a persona in Venice in 300 CE falls through the Venice entry, which
 * starts in 697, to the Italy entry above it.
 */
export function getPolityAt(ctx: PolityContext): ResolvedPolity | undefined {
  const place = `${ctx.location ?? ''} ${ctx.region ?? ''}`;
  if (!place.trim()) return undefined;
  const zone = canonicalZone(ctx.culturalZone);

  for (let i = ALLEGIANCES.length - 1; i >= 0; i -= 1) {
    const entry = ALLEGIANCES[i];
    // A zone-scoped entry needs the zone to agree, and a caller who supplies
    // none does not get a free pass. The test used to fall open in that case,
    // which is how a persona in the Mekong Delta was handed the Stars and
    // Stripes: "Mainland Southeast Asia" contains the word "southeast", the
    // Carolinas entry matches on it, and with no zone to check there was
    // nothing between the two.
    if (entry.zones && !(zone && entry.zones.includes(zone as CulturalZone))) continue;
    if (!entry.match.test(place)) continue;

    const era = entry.eras.find(candidate =>
      ctx.year >= candidate.from && (candidate.until === undefined || ctx.year < candidate.until));
    if (!era) continue;

    // A device the state adopted later in its life is not available to someone
    // living before it did, which is most of what this test is for.
    // A plural label yields to the actual country where the local area sits in
    // exactly one. `since` stays the era's, because the question the badge
    // answers is when this settlement began, not when the country was founded.
    const name = MODERN_PLURALS.has(era.name)
      ? MODERN_STATE_BY_AREA[ctx.location ?? ''] ?? era.name
      : era.name;

    const attested = EMBLEMS[name];
    const file = FLAG_FILES[name];
    const span = file ? spanFromFilename(file) : {};
    const inSpan = (span.from === undefined || ctx.year >= span.from)
      && (span.until === undefined || ctx.year <= span.until);

    return {
      name,
      since: era.from,
      until: era.until,
      wikipedia: wikipediaTitleFor(name),
      emblem: attested && ctx.year >= attested.from ? attested : undefined,
      flagUrl: file && inSpan ? commonsUrl(file) : undefined,
    };
  }
  return undefined;
}

/**
 * A polity name as it appears mid-sentence: "the Mughal Empire", "Joseon".
 *
 * The names above are stored as a reference work would list them, which is the
 * right form for a schema field and the wrong one for running prose — "gave way
 * to Korean Empire". Whether English wants an article here follows the common
 * noun inside the name, not the name itself: an Empire, a Kingdom or a dynasty
 * takes one, and Joseon, Brazil and Nazi Germany do not.
 */
export function withPolityArticle(name: string): string {
  if (/^the\b/i.test(name)) return name;
  return /\b(empire|kingdom|republic|sultanate|caliphate|dynasty|confederation|federation|union|states|raj|commonwealth|shogunate|khanate|lordship|monarchy|colonies|colony|court|protectorate|khedivate|viceroyalty)\b/i.test(name)
    ? `the ${name}`
    : name;
}

/**
 * Whether the name takes a plural verb.
 *
 * Not every entry in this table is one state. "The Swahili city-states", "the
 * taifa kingdoms of al-Andalus" and "Argentina and Chile" are all honest
 * answers to which power held a place, and all of them read as broken with a
 * singular verb — "The Swahili city-states has held this country".
 *
 * "United States" is the exception the rule needs: plural in form, singular in
 * every English sentence written since about 1865.
 */
export function isPluralPolity(name: string): boolean {
  // Both are plural in form and singular in every sentence anyone writes.
  if (/United States|Federated States/i.test(name)) return false;
  return / and /.test(name)
    || /\b(kingdoms|colonies|republics|empires|caliphates|city-states|states|principalities|emirates|mandates)\b/i.test(name);
}

/**
 * The office a subject of this state answers to — "the Mughal emperor", "the
 * Ottoman sultan" — or nothing where the name will not carry the construction.
 *
 * Only names shaped "<Adjective> <Type>" work: "Mughal Empire" yields "Mughal",
 * "Kingdom of Scotland" does not yield anything usable and gets no title rather
 * than "the Scotland king". Republics and confederations have no such office at
 * all, which is a fact about them and not a gap.
 *
 * The office, not the person: this table knows which state held a place in a
 * year and has no idea who was on the throne, so it will not assert a monarch's
 * name or gender.
 */
export function rulerTitleFor(name: string): string | undefined {
  const shape = name.match(/^([A-Z][\w'’-]+) (Empire|dynasty|Sultanate|Caliphate|shogunate|Khanate)$/);
  if (!shape) return undefined;
  const [, adjective, type] = shape;

  const office = type === 'Sultanate' ? 'sultan'
    : type === 'Caliphate' ? 'caliph'
      : type === 'shogunate' ? 'shogun'
        : type === 'Khanate' ? 'khan'
          : 'emperor';
  return `the ${adjective} ${office}`;
}

/**
 * A year as it would be written in a note: "1526", "330 BCE".
 *
 * Lives here because the negative-year convention is this table's, and the
 * codebase has nowhere else that formats one for reading.
 */
export function describeYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year);
}

/**
 * Every regime this place is known to have had, in no particular year.
 *
 * This exists for reading rather than writing: when a source text is being
 * matched against a region, "Delhi Sultanate" and "British Raj" are as good a
 * clue that it concerns the Gangetic plain as the word "Bengal" is.
 */
export function getPolityNames(ctx: Omit<PolityContext, 'year'>): string[] {
  const place = `${ctx.location ?? ''} ${ctx.region ?? ''}`;
  if (!place.trim()) return [];
  const zone = canonicalZone(ctx.culturalZone);

  for (let i = ALLEGIANCES.length - 1; i >= 0; i -= 1) {
    const entry = ALLEGIANCES[i];
    if (entry.zones && !(zone && entry.zones.includes(zone as CulturalZone))) continue;
    if (entry.match.test(place)) return entry.eras.map(era => era.name);
  }
  return [];
}

/**
 * Every regime change this place saw between two years, in order.
 *
 * A life is placed by the transitions it lived through as much as by the state
 * it started under: someone born in Delhi in 1780 is a Mughal subject, then a
 * Company subject at 23, then a subject of the Raj at 78. Each entry's `since`
 * is the year the change took effect.
 */
export function getPolityChanges(
  ctx: Omit<PolityContext, 'year'>,
  fromYear: number,
  toYear: number,
): ResolvedPolity[] {
  const changes: ResolvedPolity[] = [];
  let previous = getPolityAt({ ...ctx, year: fromYear })?.name;

  for (let year = fromYear + 1; year <= toYear; year += 1) {
    const current = getPolityAt({ ...ctx, year });
    if (current && current.name !== previous && current.since === year) {
      changes.push(current);
    }
    previous = current?.name;
  }
  return changes;
}
