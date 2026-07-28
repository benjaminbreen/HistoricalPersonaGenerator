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

export interface ResolvedPolity {
  /** The state's name, as it would be given in a reference work. */
  name: string;
  /** The year this regime began here. */
  since: number;
  /** The year it ended here, if the table knows of an end. */
  until?: number;
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
    match: /italy|roman campagna|apennine|florence|po valley/i,
    eras: [
      { from: -509, until: -27, name: 'Roman Republic' },
      { from: -27, until: 476, name: 'Roman Empire' },
      { from: 493, until: 553, name: 'Ostrogothic Kingdom' },
      { from: 568, until: 774, name: 'Lombard Kingdom' },
      { from: 774, until: 1806, name: 'Holy Roman Empire' },
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
    ],
  },
  {
    match: /balkans|serbia|bulgar|thrace|dalmatia/i,
    eras: [
      { from: -27, until: 395, name: 'Roman Empire' },
      { from: 395, until: 1396, name: 'Byzantine Empire' },
      { from: 1396, until: 1878, name: 'Ottoman Empire' },
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
    match: /eastern europe|russia|moscow|volga|dnieper|steppe frontier/i,
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
    match: /nile valley|egypt|nile delta|thebes|luxor|cairo/i,
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
    match: /indus|punjab|sindh|lahore/i,
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
    match: /japan|kansai|yamato|kinai|kanto|kyoto|edo/i,
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
  {
    match: /central asian oases|transoxiana|samarkand|bukhara|xinjiang/i,
    eras: [
      { from: -329, until: -250, name: 'the Hellenistic successor kingdoms' },
      { from: 819, until: 999, name: 'the Samanid Empire' },
      { from: 1220, until: 1370, name: 'the Chagatai Khanate' },
      { from: 1370, until: 1507, name: 'Timurid Empire' },
      { from: 1876, until: 1917, name: 'Russian Turkestan' },
      { from: 1922, until: 1991, name: 'Soviet Union' },
    ],
  },

  {
    match: /mainland southeast asia|indochina|siam|ayutthaya|irrawaddy|mekong|burma|annam/i,
    eras: [
      { from: 802, until: 1431, name: 'the Khmer Empire' },
      { from: 1044, until: 1297, name: 'the Pagan Kingdom' },
      { from: 1351, until: 1767, name: 'the Kingdom of Ayutthaya' },
      { from: 1782, until: 1932, name: 'the Kingdom of Siam' },
      { from: 1887, until: 1954, name: 'French Indochina' },
    ],
  },
  {
    match: /maritime southeast asia|java|sumatra|malacca|malay|borneo|celebes/i,
    eras: [
      { from: 671, until: 1288, name: 'Srivijaya' },
      { from: 1293, until: 1527, name: 'the Majapahit Empire' },
      { from: 1400, until: 1511, name: 'the Malacca Sultanate' },
      { from: 1619, until: 1800, name: 'the Dutch East India Company' },
      { from: 1800, until: 1949, name: 'the Dutch East Indies' },
      { from: 1949, name: 'Indonesia' },
    ],
  },
  {
    match: /philippines|luzon|visayas|mindanao|manila/i,
    eras: [
      { from: 1565, until: 1898, name: 'the Spanish East Indies' },
      { from: 1898, until: 1946, name: 'the American colonial Philippines' },
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
  {
    match: /taiwan|ryukyu|formosa/i,
    eras: [
      { from: 1429, until: 1879, name: 'the Ryukyu Kingdom' },
      { from: 1683, until: 1895, name: 'Qing dynasty' },
      { from: 1895, until: 1945, name: 'Japanese colonial rule' },
    ],
  },
  {
    match: /tibet|west china|himalaya|nepal/i,
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
    ],
  },
  {
    match: /horn of africa|ethiopian|abyssin|aksum/i,
    eras: [
      { from: -100, until: 940, name: 'the Kingdom of Aksum' },
      { from: 1137, until: 1270, name: 'the Zagwe dynasty' },
      { from: 1270, until: 1974, name: 'Ethiopian Empire' },
    ],
  },
  {
    match: /lower guinea|congo basin|benin/i,
    eras: [
      { from: 1180, until: 1897, name: 'Kingdom of Benin' },
      { from: 1390, until: 1857, name: 'Kingdom of Kongo' },
      { from: 1885, until: 1960, name: 'the Congo Free State and Belgian Congo' },
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
    ],
  },
  {
    match: /central africa|luba|lunda|kasai/i,
    eras: [
      { from: 1585, until: 1889, name: 'the Luba Empire' },
      { from: 1665, until: 1887, name: 'the Lunda Empire' },
      { from: 1885, until: 1960, name: 'the Congo Free State and Belgian Congo' },
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
    match: /amazon/i,
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
    match: /guiana shield|guiana|surinam/i,
    eras: [{ from: 1667, until: 1975, name: 'the Guiana colonies' }],
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

  for (let i = ALLEGIANCES.length - 1; i >= 0; i -= 1) {
    const entry = ALLEGIANCES[i];
    if (entry.zones && ctx.culturalZone && !entry.zones.includes(ctx.culturalZone)) continue;
    if (!entry.match.test(place)) continue;

    const era = entry.eras.find(candidate =>
      ctx.year >= candidate.from && (candidate.until === undefined || ctx.year < candidate.until));
    if (era) return { name: era.name, since: era.from, until: era.until };
  }
  return undefined;
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

  for (let i = ALLEGIANCES.length - 1; i >= 0; i -= 1) {
    const entry = ALLEGIANCES[i];
    if (entry.zones && ctx.culturalZone && !entry.zones.includes(ctx.culturalZone)) continue;
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
