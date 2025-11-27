/**
 * Wikipedia article mappings for Sub-Saharan African cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const SUB_SAHARAN_AFRICA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== WEST AFRICA - ANCIENT ==========

  // Nok culture (ancient Nigeria)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [-1000, 300],
    article: 'Nok_culture',
    priority: 10,
  },

  // ========== WEST AFRICA - SAHEL EMPIRES ==========

  // Ghana Empire
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [300, 1200],
    article: 'Ghana_Empire',
    priority: 10,
  },

  // Mali Empire - early period
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1235, 1337],
    article: 'Mali_Empire',
    priority: 10,
  },

  // Mali Empire - Mansa Musa era (golden age)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1312, 1337],
    article: 'Mansa_Musa',
    fallbackArticle: 'Mali_Empire',
    priority: 10,
  },

  // Mali Empire - late period
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1337, 1670],
    article: 'Mali_Empire',
    priority: 10,
  },

  // Songhai Empire - rise
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1464, 1492],
    article: 'Songhai_Empire',
    priority: 10,
  },

  // Songhai Empire - Askia period (golden age)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1493, 1591],
    article: 'Askia_Muhammad_I',
    fallbackArticle: 'Songhai_Empire',
    priority: 10,
  },

  // Kanem-Bornu Empire (Chad/Nigeria region)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [700, 1380],
    article: 'Kanem_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1380, 1893],
    article: 'Bornu_Empire',
    fallbackArticle: 'Kanem–Bornu_Empire',
    priority: 10,
  },

  // ========== WEST AFRICA - FOREST KINGDOMS ==========

  // Ife Kingdom (Yoruba)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [500, 1600],
    article: 'Ifẹ̀',
    fallbackArticle: 'Yoruba_people',
    priority: 9,
  },

  // Oyo Empire (Yoruba)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1400, 1835],
    article: 'Oyo_Empire',
    priority: 10,
  },

  // Benin Empire
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1180, 1897],
    article: 'Kingdom_of_Benin',
    priority: 10,
  },

  // Ashanti Empire
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1670, 1902],
    article: 'Ashanti_Empire',
    priority: 10,
  },

  // Dahomey Kingdom
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1600, 1904],
    article: 'Kingdom_of_Dahomey',
    priority: 10,
  },

  // Hausa Kingdoms (city-states)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1000, 1804],
    article: 'Hausa_Kingdoms',
    priority: 9,
  },

  // Sokoto Caliphate (after Fulani Jihad)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1804, 1903],
    article: 'Sokoto_Caliphate',
    priority: 10,
  },

  // Wassoulou Empire (Samori Ture)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1878, 1898],
    article: 'Wassoulou_Empire',
    priority: 9,
  },

  // ========== EAST AFRICA - HORN OF AFRICA ==========

  // Kingdom of Aksum (Ethiopia/Eritrea)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [100, 940],
    article: 'Kingdom_of_Aksum',
    priority: 10,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Ethiopia',
    centuryRange: [100, 940],
    article: 'Kingdom_of_Aksum',
    priority: 10,
  },

  // Zagwe dynasty (Ethiopia)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [900, 1270],
    article: 'Zagwe_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Ethiopia',
    centuryRange: [900, 1270],
    article: 'Zagwe_dynasty',
    priority: 10,
  },

  // Ethiopian Empire - Solomonic dynasty (early period)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1270, 1529],
    article: 'Ethiopian_Empire',
    fallbackArticle: 'Solomonic_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Ethiopia',
    centuryRange: [1270, 1529],
    article: 'Ethiopian_Empire',
    priority: 10,
  },

  // Ethiopian-Adal War
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1529, 1543],
    article: 'Ethiopian–Adal_War',
    fallbackArticle: 'Ethiopian_Empire',
    priority: 10,
  },

  // Ethiopian Empire - Gondarine period
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1632, 1769],
    article: 'Ethiopian_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Ethiopia',
    centuryRange: [1543, 1769],
    article: 'Ethiopian_Empire',
    priority: 10,
  },

  // Zemene Mesafint (Era of the Princes - Ethiopian fragmentation)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1769, 1855],
    article: 'Zemene_Mesafint',
    fallbackArticle: 'Ethiopian_Empire',
    priority: 9,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Ethiopia',
    centuryRange: [1769, 1855],
    article: 'Zemene_Mesafint',
    fallbackArticle: 'Ethiopian_Empire',
    priority: 9,
  },

  // Ethiopian Empire - Modern period (Tewodros to Menelik)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1855, 1913],
    article: 'Ethiopian_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Ethiopia',
    centuryRange: [1855, 1974],
    article: 'Ethiopian_Empire',
    priority: 10,
  },

  // Adal Sultanate
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1415, 1577],
    article: 'Adal_Sultanate',
    priority: 10,
  },

  // Ajuran Sultanate (Somalia)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Horn of Africa',
    centuryRange: [1300, 1700],
    article: 'Ajuran_Sultanate',
    priority: 10,
  },

  // ========== EAST AFRICA - SWAHILI COAST ==========

  // Early Swahili city-states
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [800, 1500],
    article: 'Swahili_coast',
    priority: 9,
  },

  // Kilwa Sultanate
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [957, 1513],
    article: 'Kilwa_Sultanate',
    priority: 10,
  },

  // Portuguese period (coastal trading posts)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1498, 1698],
    article: 'Portuguese_East_Africa',
    fallbackArticle: 'Swahili_coast',
    priority: 9,
  },

  // Omani/Zanzibar period
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1698, 1890],
    article: 'Sultanate_of_Zanzibar',
    priority: 10,
  },

  // ========== EAST AFRICA - GREAT LAKES ==========

  // Buganda Kingdom (Uganda)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1300, 1894],
    article: 'Buganda',
    priority: 10,
  },

  // Bunyoro Kingdom (Uganda)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1300, 1899],
    article: 'Bunyoro',
    priority: 9,
  },

  // Kingdom of Rwanda
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1081, 1962],
    article: 'Kingdom_of_Rwanda',
    priority: 10,
  },

  // Kingdom of Burundi
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1680, 1966],
    article: 'Kingdom_of_Burundi',
    priority: 10,
  },

  // ========== CENTRAL AFRICA ==========

  // Kingdom of Kongo - early period
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1390, 1568],
    article: 'Kingdom_of_Kongo',
    priority: 10,
  },

  // Kingdom of Kongo - post-Portuguese contact
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1483, 1665],
    article: 'Kingdom_of_Kongo',
    priority: 10,
  },

  // Kingdom of Kongo - decline
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1665, 1914],
    article: 'Kingdom_of_Kongo',
    priority: 9,
  },

  // Luba Empire
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1585, 1889],
    article: 'Kingdom_of_Luba',
    priority: 10,
  },

  // Lunda Empire
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1665, 1887],
    article: 'Lunda_Empire',
    priority: 10,
  },

  // Kuba Kingdom
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1625, 1900],
    article: 'Kuba_Kingdom',
    priority: 9,
  },

  // ========== SOUTHERN AFRICA - ZIMBABWE PLATEAU ==========

  // Mapungubwe Kingdom
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1075, 1220],
    article: 'Mapungubwe',
    priority: 10,
  },

  // Great Zimbabwe
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1100, 1450],
    article: 'Great_Zimbabwe',
    priority: 10,
  },

  // Kingdom of Mutapa
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1430, 1760],
    article: 'Kingdom_of_Mutapa',
    priority: 10,
  },

  // Rozwi Empire
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1660, 1866],
    article: 'Rozwi_Empire',
    priority: 10,
  },

  // ========== SOUTHERN AFRICA - ZULU & MFECANE ==========

  // Zulu Kingdom - Shaka period
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1816, 1828],
    article: 'Shaka',
    fallbackArticle: 'Zulu_Kingdom',
    priority: 10,
  },

  // Zulu Kingdom
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1816, 1897],
    article: 'Zulu_Kingdom',
    priority: 10,
  },

  // Mfecane period (great migration/upheaval)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1815, 1840],
    article: 'Mfecane',
    priority: 10,
  },

  // Ndebele Kingdom (Zimbabwe)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1823, 1894],
    article: 'Northern_Ndebele_people',
    fallbackArticle: 'Mzilikazi',
    priority: 9,
  },

  // Basotho Kingdom (Lesotho)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1822, 1966],
    article: 'Basutoland',
    fallbackArticle: 'Moshoeshoe_I',
    priority: 9,
  },

  // Swazi Kingdom
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1745, 1968],
    article: 'Eswatini',
    fallbackArticle: 'History_of_Eswatini',
    priority: 9,
  },

  // ========== MADAGASCAR ==========

  // Merina Kingdom (early period)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Madagascar',
    centuryRange: [1540, 1787],
    article: 'Merina_Kingdom',
    priority: 10,
  },

  // Merina Kingdom (expansion under Andrianampoinimerina)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Madagascar',
    centuryRange: [1787, 1810],
    article: 'Andrianampoinimerina',
    fallbackArticle: 'Merina_Kingdom',
    priority: 10,
  },

  // Kingdom of Madagascar (unified)
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Madagascar',
    centuryRange: [1810, 1897],
    article: 'Kingdom_of_Madagascar',
    priority: 10,
  },

  // ========== COLONIAL PERIOD - WEST AFRICA ==========

  // Colonial West Africa
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'West Africa',
    centuryRange: [1885, 1960],
    article: 'Scramble_for_Africa',
    fallbackArticle: 'Colonial_Africa',
    priority: 8,
  },

  // ========== COLONIAL PERIOD - EAST AFRICA ==========

  // Colonial East Africa
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'East Africa',
    centuryRange: [1885, 1963],
    article: 'Scramble_for_Africa',
    fallbackArticle: 'Colonial_Africa',
    priority: 8,
  },

  // ========== COLONIAL PERIOD - CENTRAL AFRICA ==========

  // Colonial Central Africa
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Central Africa',
    centuryRange: [1885, 1960],
    article: 'Scramble_for_Africa',
    fallbackArticle: 'Colonial_Africa',
    priority: 8,
  },

  // ========== COLONIAL PERIOD - SOUTHERN AFRICA ==========

  // Colonial Southern Africa
  {
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    region: 'Southern Africa',
    centuryRange: [1885, 1994],
    article: 'Scramble_for_Africa',
    fallbackArticle: 'History_of_South_Africa',
    priority: 8,
  },
];
