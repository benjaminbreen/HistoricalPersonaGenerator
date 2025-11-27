/**
 * Wikipedia article mappings for MENA (Middle East & North Africa) cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const MENA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== ANCIENT MESOPOTAMIA ==========

  // Sumerian city-states
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-3500, -2334],
    article: 'Sumer',
    priority: 10,
  },

  // Akkadian Empire
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-2334, -2154],
    article: 'Akkadian_Empire',
    priority: 10,
  },

  // Third Dynasty of Ur
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-2112, -2004],
    article: 'Third_Dynasty_of_Ur',
    fallbackArticle: 'Sumer',
    priority: 10,
  },

  // Old Babylonian period
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-2000, -1595],
    article: 'Old_Babylonian_Empire',
    fallbackArticle: 'Babylon',
    priority: 10,
  },

  // Middle Assyrian period
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-1365, -1074],
    article: 'Middle_Assyrian_Empire',
    fallbackArticle: 'Assyria',
    priority: 10,
  },

  // Neo-Assyrian Empire
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-911, -609],
    article: 'Neo-Assyrian_Empire',
    priority: 10,
  },

  // Neo-Babylonian Empire
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [-626, -539],
    article: 'Neo-Babylonian_Empire',
    priority: 10,
  },

  // ========== ANCIENT EGYPT ==========

  // Early Dynastic Period
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-3100, -2686],
    article: 'Early_Dynastic_Period_(Egypt)',
    fallbackArticle: 'Ancient_Egypt',
    priority: 10,
  },

  // Old Kingdom (Age of Pyramids)
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-2686, -2181],
    article: 'Old_Kingdom_of_Egypt',
    priority: 10,
  },

  // First Intermediate Period
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-2181, -2055],
    article: 'First_Intermediate_Period_of_Egypt',
    fallbackArticle: 'Ancient_Egypt',
    priority: 9,
  },

  // Middle Kingdom
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-2055, -1650],
    article: 'Middle_Kingdom_of_Egypt',
    priority: 10,
  },

  // Second Intermediate Period (Hyksos)
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-1650, -1550],
    article: 'Second_Intermediate_Period_of_Egypt',
    fallbackArticle: 'Hyksos',
    priority: 9,
  },

  // New Kingdom - early (18th dynasty)
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-1550, -1292],
    article: 'New_Kingdom_of_Egypt',
    priority: 10,
  },

  // New Kingdom - Ramesses period (19th-20th dynasty)
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-1292, -1077],
    article: 'Ramesses_II',
    fallbackArticle: 'New_Kingdom_of_Egypt',
    priority: 10,
  },

  // Third Intermediate Period
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-1077, -664],
    article: 'Third_Intermediate_Period_of_Egypt',
    fallbackArticle: 'Ancient_Egypt',
    priority: 9,
  },

  // Late Period
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-664, -332],
    article: 'Late_Period_of_ancient_Egypt',
    fallbackArticle: 'Ancient_Egypt',
    priority: 10,
  },

  // Ptolemaic Kingdom
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-305, -30],
    article: 'Ptolemaic_Kingdom',
    priority: 10,
  },

  // Roman Egypt
  {
    culturalZone: 'MENA',
    region: 'Nile Valley',
    centuryRange: [-30, 641],
    article: 'Egypt_(Roman_province)',
    fallbackArticle: 'Roman_Empire',
    priority: 10,
  },

  // ========== ANCIENT PERSIA/IRAN ==========

  // Achaemenid Empire - early period (Cyrus, Darius)
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [-550, -330],
    article: 'Achaemenid_Empire',
    priority: 10,
  },

  // Seleucid Empire (Persia under Greek rule)
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [-312, -63],
    article: 'Seleucid_Empire',
    priority: 10,
  },

  // Parthian Empire
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [-247, 224],
    article: 'Parthian_Empire',
    priority: 10,
  },

  // Sasanian Empire - early period
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [224, 531],
    article: 'Sasanian_Empire',
    priority: 10,
  },

  // Sasanian Empire - late period (before Islamic conquest)
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [531, 651],
    article: 'Sasanian_Empire',
    priority: 10,
  },

  // Islamic conquest and early Islamic period in Persia
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [651, 1050],
    article: 'Muslim_conquest_of_Persia',
    fallbackArticle: 'Abbasid_Caliphate',
    priority: 10,
  },

  // Seljuk Empire
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1037, 1194],
    article: 'Seljuk_Empire',
    priority: 10,
  },

  // Khwarazmian Empire
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1077, 1231],
    article: 'Khwarazmian_Empire',
    priority: 9,
  },

  // Ilkhanate (Mongol rule)
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1256, 1335],
    article: 'Ilkhanate',
    priority: 10,
  },

  // Timurid Empire
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1370, 1507],
    article: 'Timurid_Empire',
    priority: 10,
  },

  // Safavid dynasty - early period
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1501, 1629],
    article: 'Safavid_dynasty',
    priority: 10,
  },

  // Safavid dynasty - late period
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1629, 1736],
    article: 'Safavid_dynasty',
    priority: 10,
  },

  // Afsharid dynasty
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1736, 1796],
    article: 'Afsharid_dynasty',
    priority: 10,
  },

  // Qajar dynasty - early period
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1789, 1848],
    article: 'Qajar_dynasty',
    priority: 10,
  },

  // Qajar dynasty - late period (decline and modernization attempts)
  {
    culturalZone: 'MENA',
    region: 'Persia',
    centuryRange: [1848, 1925],
    article: 'Qajar_dynasty',
    priority: 10,
  },

  // ========== LEVANT - ANCIENT PERIOD ==========

  // Phoenicia
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [-1200, -539],
    article: 'Phoenicia',
    priority: 10,
  },

  // Kingdom of Israel and Judah
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [-1000, -586],
    article: 'Kingdom_of_Israel_(united_monarchy)',
    fallbackArticle: 'Kingdom_of_Judah',
    priority: 10,
  },

  // Persian Levant
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [-539, -332],
    article: 'Achaemenid_Empire',
    priority: 9,
  },

  // Hellenistic Levant (Seleucid)
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [-323, -63],
    article: 'Seleucid_Empire',
    fallbackArticle: 'Hellenistic_period',
    priority: 10,
  },

  // Roman Levant
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [-63, 330],
    article: 'Syria_(Roman_province)',
    fallbackArticle: 'Roman_Empire',
    priority: 10,
  },

  // Byzantine Levant
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [330, 636],
    article: 'Byzantine_Empire',
    priority: 10,
  },

  // ========== LEVANT - ISLAMIC PERIOD ==========

  // Early Islamic conquest
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [636, 750],
    article: 'Rashidun_Caliphate',
    fallbackArticle: 'Early_Muslim_conquests',
    priority: 10,
  },

  // Umayyad Caliphate (Damascus capital)
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [661, 750],
    article: 'Umayyad_Caliphate',
    priority: 10,
  },

  // Abbasid period
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [750, 1099],
    article: 'Abbasid_Caliphate',
    priority: 9,
  },

  // Crusader States
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [1099, 1291],
    article: 'Crusader_states',
    fallbackArticle: 'Kingdom_of_Jerusalem',
    priority: 10,
  },

  // Ayyubid dynasty (Saladin era)
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [1171, 1260],
    article: 'Ayyubid_dynasty',
    priority: 10,
  },

  // Mamluk Sultanate
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [1250, 1517],
    article: 'Mamluk_Sultanate',
    priority: 10,
  },

  // Ottoman Levant - early period
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [1516, 1798],
    article: 'Ottoman_Syria',
    fallbackArticle: 'Ottoman_Empire',
    priority: 10,
  },

  // Ottoman Levant - 19th century reforms
  {
    culturalZone: 'MENA',
    region: 'Levant',
    centuryRange: [1798, 1918],
    article: 'Ottoman_Empire',
    priority: 10,
  },

  // ========== ARABIAN PENINSULA ==========

  // Pre-Islamic Arabia
  {
    culturalZone: 'MENA',
    region: 'Arabian Peninsula',
    centuryRange: [-500, 622],
    article: 'Pre-Islamic_Arabia',
    priority: 9,
  },

  // Early Islam and Rashidun Caliphate
  {
    culturalZone: 'MENA',
    region: 'Arabian Peninsula',
    centuryRange: [622, 661],
    article: 'Rashidun_Caliphate',
    priority: 10,
  },

  // Umayyad Caliphate period
  {
    culturalZone: 'MENA',
    region: 'Arabian Peninsula',
    centuryRange: [661, 750],
    article: 'Umayyad_Caliphate',
    priority: 10,
  },

  // Abbasid period
  {
    culturalZone: 'MENA',
    region: 'Arabian Peninsula',
    centuryRange: [750, 1258],
    article: 'Abbasid_Caliphate',
    priority: 9,
  },

  // Ottoman Arabia
  {
    culturalZone: 'MENA',
    region: 'Arabian Peninsula',
    centuryRange: [1517, 1918],
    article: 'Ottoman_Arabia',
    fallbackArticle: 'Ottoman_Empire',
    priority: 9,
  },

  // ========== MESOPOTAMIA - POST-ANCIENT ==========

  // Islamic conquest of Mesopotamia
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [633, 750],
    article: 'Muslim_conquest_of_the_Levant',
    fallbackArticle: 'Rashidun_Caliphate',
    priority: 9,
  },

  // Abbasid Caliphate (Baghdad golden age)
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [750, 1055],
    article: 'Abbasid_Caliphate',
    priority: 10,
  },

  // Seljuk period
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [1055, 1194],
    article: 'Seljuk_Empire',
    priority: 10,
  },

  // Abbasid decline and Mongol invasion
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [1194, 1258],
    article: 'Abbasid_Caliphate',
    priority: 9,
  },

  // Ilkhanate (Mongol rule)
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [1258, 1335],
    article: 'Ilkhanate',
    priority: 10,
  },

  // Jalayirid Sultanate and fragmentation
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [1335, 1432],
    article: 'Jalayirid_Sultanate',
    fallbackArticle: 'History_of_Iraq',
    priority: 8,
  },

  // Safavid-Ottoman contest period
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [1508, 1638],
    article: 'Ottoman–Safavid_relations',
    fallbackArticle: 'Ottoman_Empire',
    priority: 9,
  },

  // Ottoman Mesopotamia
  {
    culturalZone: 'MENA',
    region: 'Mesopotamia',
    centuryRange: [1638, 1918],
    article: 'Ottoman_Iraq',
    fallbackArticle: 'Ottoman_Empire',
    priority: 10,
  },

  // ========== NORTH AFRICA / MAGHREB ==========

  // Ancient Carthage
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [-814, -146],
    article: 'Ancient_Carthage',
    priority: 10,
  },

  // Roman North Africa
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [-146, 439],
    article: 'Africa_(Roman_province)',
    fallbackArticle: 'Roman_Empire',
    priority: 10,
  },

  // Vandal Kingdom
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [435, 534],
    article: 'Vandal_Kingdom',
    priority: 10,
  },

  // Byzantine North Africa
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [534, 698],
    article: 'Exarchate_of_Africa',
    fallbackArticle: 'Byzantine_Empire',
    priority: 10,
  },

  // Islamic conquest of North Africa
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [647, 750],
    article: 'Muslim_conquest_of_the_Maghreb',
    priority: 10,
  },

  // Umayyad North Africa
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [705, 750],
    article: 'Umayyad_Caliphate',
    priority: 9,
  },

  // Fatimid Caliphate
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [909, 1171],
    article: 'Fatimid_Caliphate',
    priority: 10,
  },

  // Almoravid dynasty
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [1040, 1147],
    article: 'Almoravid_dynasty',
    priority: 10,
  },

  // Almohad Caliphate
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [1121, 1269],
    article: 'Almohad_Caliphate',
    priority: 10,
  },

  // Marinid dynasty (Morocco)
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [1244, 1465],
    article: 'Marinid_Sultanate',
    priority: 9,
  },

  // Hafsid dynasty (Tunisia)
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [1229, 1574],
    article: 'Hafsid_dynasty',
    priority: 9,
  },

  // Ottoman North Africa
  {
    culturalZone: 'MENA',
    region: 'Maghreb',
    centuryRange: [1574, 1912],
    article: 'Ottoman_North_Africa',
    fallbackArticle: 'Ottoman_Empire',
    priority: 9,
  },

  // ========== ANATOLIA ==========

  // Hittite Empire
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [-1600, -1178],
    article: 'Hittites',
    priority: 10,
  },

  // Phrygian kingdom
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [-1200, -700],
    article: 'Phrygia',
    priority: 9,
  },

  // Lydian kingdom
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [-680, -547],
    article: 'Lydia',
    priority: 10,
  },

  // Persian Anatolia
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [-547, -334],
    article: 'Achaemenid_Empire',
    priority: 9,
  },

  // Hellenistic Anatolia
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [-334, -133],
    article: 'Hellenistic_period',
    fallbackArticle: 'Seleucid_Empire',
    priority: 9,
  },

  // Roman Anatolia
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [-133, 330],
    article: 'Asia_(Roman_province)',
    fallbackArticle: 'Roman_Empire',
    priority: 9,
  },

  // Byzantine Anatolia
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [330, 1071],
    article: 'Byzantine_Empire',
    priority: 10,
  },

  // Seljuk Turks (Battle of Manzikert)
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1071, 1243],
    article: 'Sultanate_of_Rum',
    fallbackArticle: 'Seljuk_Empire',
    priority: 10,
  },

  // Mongol invasion and fragmentation
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1243, 1299],
    article: 'Mongol_invasions_of_Anatolia',
    fallbackArticle: 'Sultanate_of_Rum',
    priority: 9,
  },

  // Ottoman Empire - rise (Osman to Mehmed II)
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1299, 1453],
    article: 'Rise_of_the_Ottoman_Empire',
    fallbackArticle: 'Ottoman_Empire',
    priority: 10,
  },

  // Ottoman Empire - classical age (conquest of Constantinople onward)
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1453, 1566],
    article: 'Ottoman_Empire',
    priority: 10,
  },

  // Ottoman Empire - transformation period
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1566, 1683],
    article: 'Ottoman_Empire',
    priority: 10,
  },

  // Ottoman Empire - decline and reform
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1683, 1826],
    article: 'Decline_and_modernization_of_the_Ottoman_Empire',
    fallbackArticle: 'Ottoman_Empire',
    priority: 10,
  },

  // Ottoman Empire - Tanzimat reforms
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1826, 1876],
    article: 'Tanzimat',
    fallbackArticle: 'Ottoman_Empire',
    priority: 10,
  },

  // Ottoman Empire - constitutional era
  {
    culturalZone: 'MENA',
    region: 'Anatolia',
    centuryRange: [1876, 1922],
    article: 'Dissolution_of_the_Ottoman_Empire',
    fallbackArticle: 'Ottoman_Empire',
    priority: 10,
  },
];
