/**
 * Wikipedia article mappings for Oceania cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const OCEANIA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== AUSTRALIA - ABORIGINAL ==========

  // Aboriginal Australians (ancient to contact)
  {
    culturalZone: 'OCEANIA',
    region: 'Australia',
    centuryRange: [-60000, 1788],
    article: 'Aboriginal_Australians',
    priority: 10,
  },

  // ========== AUSTRALIA - COLONIAL ==========

  // Early convict settlement
  {
    culturalZone: 'OCEANIA',
    region: 'Australia',
    centuryRange: [1788, 1823],
    article: 'History_of_Australia_(1788–1850)',
    fallbackArticle: 'Convicts_in_Australia',
    priority: 10,
  },

  // Colonial expansion period
  {
    culturalZone: 'OCEANIA',
    region: 'Australia',
    centuryRange: [1823, 1851],
    article: 'History_of_Australia_(1788–1850)',
    priority: 10,
  },

  // Gold rush era
  {
    culturalZone: 'OCEANIA',
    region: 'Australia',
    centuryRange: [1851, 1890],
    article: 'Australian_gold_rushes',
    fallbackArticle: 'History_of_Australia_(1851–1900)',
    priority: 10,
  },

  // Pre-Federation period
  {
    culturalZone: 'OCEANIA',
    region: 'Australia',
    centuryRange: [1890, 1901],
    article: 'History_of_Australia_(1851–1900)',
    priority: 10,
  },

  // ========== POLYNESIA - ANCIENT SETTLEMENT ==========

  // Lapita culture (early Polynesian ancestors)
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [-1600, -500],
    article: 'Lapita_culture',
    priority: 10,
  },
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [-1600, -500],
    article: 'Lapita_culture',
    priority: 10,
  },

  // Polynesian expansion period
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [-500, 1000],
    article: 'Polynesian_navigation',
    fallbackArticle: 'Polynesians',
    priority: 9,
  },

  // ========== POLYNESIA - TONGA ==========

  // Tu'i Tonga Empire
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [950, 1865],
    article: 'Tu%CA%BBi_Tonga_Empire',
    fallbackArticle: 'History_of_Tonga',
    priority: 10,
  },

  // Kingdom of Tonga (modern)
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [1845, 1900],
    article: 'Kingdom_of_Tonga',
    priority: 10,
  },

  // ========== POLYNESIA - SAMOA ==========

  // Ancient Samoa
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [-1000, 1722],
    article: 'History_of_Samoa',
    fallbackArticle: 'Samoa',
    priority: 9,
  },

  // Samoan civil wars period
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [1722, 1900],
    article: 'History_of_Samoa',
    priority: 9,
  },

  // ========== POLYNESIA - TAHITI ==========

  // Ancient Tahiti
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [300, 1767],
    article: 'Tahiti',
    fallbackArticle: 'History_of_the_Society_Islands',
    priority: 9,
  },

  // Kingdom of Tahiti
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [1788, 1880],
    article: 'Kingdom_of_Tahiti',
    priority: 10,
  },

  // ========== POLYNESIA - HAWAII ==========

  // Ancient Hawaii (pre-unification)
  {
    culturalZone: 'OCEANIA',
    region: 'Hawaii',
    centuryRange: [300, 1795],
    article: 'Ancient_Hawaii',
    priority: 10,
  },

  // Hawaiian Kingdom (unified under Kamehameha)
  {
    culturalZone: 'OCEANIA',
    region: 'Hawaii',
    centuryRange: [1795, 1893],
    article: 'Hawaiian_Kingdom',
    priority: 10,
  },

  // Republic of Hawaii
  {
    culturalZone: 'OCEANIA',
    region: 'Hawaii',
    centuryRange: [1894, 1898],
    article: 'Republic_of_Hawaii',
    priority: 10,
  },

  // ========== POLYNESIA - EASTER ISLAND ==========

  // Rapa Nui civilization
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [300, 1888],
    article: 'Easter_Island',
    fallbackArticle: 'Rapa_Nui_people',
    priority: 10,
  },

  // ========== POLYNESIA - COOK ISLANDS ==========

  // Ancient Cook Islands
  {
    culturalZone: 'OCEANIA',
    region: 'Polynesia',
    centuryRange: [900, 1888],
    article: 'Cook_Islands',
    fallbackArticle: 'History_of_the_Cook_Islands',
    priority: 9,
  },

  // ========== NEW ZEALAND - MĀORI ==========

  // Māori settlement (Archaic period)
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1250, 1500],
    article: 'Māori_people',
    fallbackArticle: 'History_of_New_Zealand',
    priority: 10,
  },

  // Classic Māori period
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1500, 1642],
    article: 'Māori_people',
    priority: 10,
  },

  // Post-contact Māori (before Musket Wars)
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1642, 1807],
    article: 'Māori_people',
    priority: 10,
  },

  // Musket Wars
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1807, 1842],
    article: 'Musket_Wars',
    fallbackArticle: 'Māori_people',
    priority: 10,
  },

  // Treaty of Waitangi period
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1840, 1845],
    article: 'Treaty_of_Waitangi',
    fallbackArticle: 'History_of_New_Zealand',
    priority: 10,
  },

  // New Zealand Wars
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1845, 1872],
    article: 'New_Zealand_Wars',
    priority: 10,
  },

  // Colonial New Zealand
  {
    culturalZone: 'OCEANIA',
    region: 'New Zealand',
    centuryRange: [1872, 1900],
    article: 'History_of_New_Zealand',
    priority: 9,
  },

  // ========== MELANESIA - FIJI ==========

  // Ancient Fiji
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [-1500, 1000],
    article: 'Fiji',
    fallbackArticle: 'History_of_Fiji',
    priority: 9,
  },

  // Fijian chiefdoms
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [1000, 1871],
    article: 'History_of_Fiji',
    priority: 9,
  },

  // Kingdom of Fiji (Cakobau)
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [1871, 1874],
    article: 'Kingdom_of_Fiji',
    priority: 10,
  },

  // Colonial Fiji
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [1874, 1900],
    article: 'History_of_Fiji',
    priority: 9,
  },

  // ========== MELANESIA - PAPUA NEW GUINEA ==========

  // Ancient Papua cultures
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [-50000, 1884],
    article: 'Papua_New_Guinea',
    fallbackArticle: 'History_of_Papua_New_Guinea',
    priority: 9,
  },

  // Colonial Papua New Guinea
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [1884, 1900],
    article: 'History_of_Papua_New_Guinea',
    priority: 9,
  },

  // ========== MELANESIA - SOLOMON ISLANDS ==========

  // Ancient Solomon Islands
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [-30000, 1893],
    article: 'Solomon_Islands',
    fallbackArticle: 'History_of_the_Solomon_Islands',
    priority: 8,
  },

  // ========== MELANESIA - VANUATU ==========

  // Ancient Vanuatu (formerly New Hebrides)
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [-3000, 1887],
    article: 'Vanuatu',
    fallbackArticle: 'History_of_Vanuatu',
    priority: 8,
  },

  // ========== MELANESIA - NEW CALEDONIA ==========

  // Ancient New Caledonia (Kanak people)
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [-3000, 1853],
    article: 'Kanak_people',
    fallbackArticle: 'New_Caledonia',
    priority: 9,
  },

  // French New Caledonia
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [1853, 1900],
    article: 'History_of_New_Caledonia',
    fallbackArticle: 'New_Caledonia',
    priority: 9,
  },

  // ========== MICRONESIA - NAN MADOL ==========

  // Saudeleur dynasty (Nan Madol)
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [500, 1628],
    article: 'Nan_Madol',
    fallbackArticle: 'Pohnpei',
    priority: 10,
  },

  // ========== MICRONESIA - YAP ==========

  // Ancient Yap (stone money culture)
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [500, 1885],
    article: 'Yap',
    fallbackArticle: 'Rai_stones',
    priority: 9,
  },

  // ========== MICRONESIA - MARSHALL ISLANDS ==========

  // Ancient Marshall Islands
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [-2000, 1885],
    article: 'Marshall_Islands',
    fallbackArticle: 'History_of_the_Marshall_Islands',
    priority: 8,
  },

  // ========== MICRONESIA - GUAM & MARIANAS ==========

  // Ancient Chamorro (Marianas)
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [-2000, 1668],
    article: 'Chamorro_people',
    fallbackArticle: 'Guam',
    priority: 9,
  },

  // Spanish Marianas
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [1668, 1898],
    article: 'Spanish_Marianas',
    fallbackArticle: 'History_of_Guam',
    priority: 9,
  },

  // ========== MICRONESIA - PALAU ==========

  // Ancient Palau
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [-3000, 1885],
    article: 'Palau',
    fallbackArticle: 'History_of_Palau',
    priority: 8,
  },

  // ========== COLONIAL PERIOD - GENERAL ==========

  // German colonial Pacific
  {
    culturalZone: 'OCEANIA',
    region: 'Micronesia',
    centuryRange: [1885, 1914],
    article: 'German_colonial_empire',
    fallbackArticle: 'German_New_Guinea',
    priority: 8,
  },
  {
    culturalZone: 'OCEANIA',
    region: 'Melanesia',
    centuryRange: [1885, 1914],
    article: 'German_New_Guinea',
    priority: 8,
  },
];
