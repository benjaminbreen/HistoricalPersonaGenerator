/**
 * Wikipedia article mappings for South American cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const SOUTH_AMERICA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== PRE-INCA CIVILIZATIONS ==========

  // Moche culture (100-700 CE)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [100, 700],
    article: 'Moche_culture',
    priority: 10,
  },

  // Tiwanaku (500-1000 CE)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [500, 1000],
    article: 'Tiwanaku',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Lake Titicaca',
    centuryRange: [500, 1000],
    article: 'Tiwanaku',
    priority: 10,
  },

  // Chimú (900-1470)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [900, 1470],
    article: 'Chimor',
    priority: 10,
  },

  // ========== INCA EMPIRE (1438-1533) ==========

  // Early Inca expansion (1400-1470)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1200, 1470],
    article: 'Inca_Empire',
    priority: 10,
  },

  // Height of Inca Empire (1470-1533)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Aconcagua Range',
    centuryRange: [1470, 1533],
    article: 'Inca_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1438, 1533],
    article: 'Inca_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [1438, 1533],
    article: 'Inca_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Lake Titicaca',
    centuryRange: [1438, 1533],
    article: 'Inca_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1470, 1533],
    article: 'Inca_Empire',
    priority: 10,
  },

  // ========== CONQUEST PERIOD (1530s-1540s) ==========

  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1530, 1550],
    article: 'Spanish_conquest_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1530, 1550],
    article: 'Spanish_conquest_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [1530, 1550],
    article: 'Spanish_conquest_of_Peru',
    priority: 10,
  },

  // ========== VICEROYALTY OF PERU (1542-1824) ==========

  // Early Viceroyalty (1542-1643)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1542, 1643],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1550, 1643],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [1550, 1643],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Lake Titicaca',
    centuryRange: [1542, 1643],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },

  // Habsburg period (1643-1713)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1643, 1713],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1643, 1713],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Central Andes',
    centuryRange: [1643, 1713],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Aconcagua Range',
    centuryRange: [1542, 1776],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },

  // Bourbon reforms period (1713-1780)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1713, 1780],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1713, 1780],
    article: 'Viceroyalty_of_Peru',
    priority: 10,
  },

  // Late colonial - Túpac Amaru rebellion era (1780-1824)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1780, 1824],
    article: 'Rebellion_of_Túpac_Amaru_II',
    fallbackArticle: 'Viceroyalty_of_Peru',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1780, 1824],
    article: 'Viceroyalty_of_Peru',
    priority: 9,
  },

  // ========== SOUTHERN REGIONS - CHILE ==========

  // Colonial Chile (Captaincy General)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Aconcagua Range',
    centuryRange: [1776, 1818],
    article: 'Captaincy_General_of_Chile',
    fallbackArticle: 'Spanish_Empire',
    priority: 10,
  },

  // ========== BRAZIL - COLONIAL & POST-COLONIAL ==========

  // Colonial Brazil (1500-1815)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Atlantic Coast',
    centuryRange: [1500, 1815],
    article: 'Colonial_Brazil',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'São Paulo Plateau',
    centuryRange: [1500, 1815],
    article: 'Colonial_Brazil',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Paraná Delta',
    centuryRange: [1500, 1815],
    article: 'Colonial_Brazil',
    fallbackArticle: 'Viceroyalty_of_the_Río_de_la_Plata',
    priority: 8,
  },

  // United Kingdom of Portugal, Brazil and the Algarves (1815-1822)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Atlantic Coast',
    centuryRange: [1815, 1822],
    article: 'United_Kingdom_of_Portugal,_Brazil_and_the_Algarves',
    fallbackArticle: 'History_of_Brazil',
    priority: 10,
  },

  // Empire of Brazil (1822-1889)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Atlantic Coast',
    centuryRange: [1822, 1889],
    article: 'Empire_of_Brazil',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'São Paulo Plateau',
    centuryRange: [1822, 1889],
    article: 'Empire_of_Brazil',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Paraná Delta',
    centuryRange: [1822, 1889],
    article: 'Empire_of_Brazil',
    fallbackArticle: 'History_of_Argentina',
    priority: 9,
  },

  // First Brazilian Republic (1889-1930)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Atlantic Coast',
    centuryRange: [1889, 1930],
    article: 'First_Brazilian_Republic',
    fallbackArticle: 'History_of_Brazil',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'São Paulo Plateau',
    centuryRange: [1889, 1930],
    article: 'First_Brazilian_Republic',
    priority: 10,
  },

  // ========== AMAZON BASIN ==========

  // Pre-colonial Amazon
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Amazon Basin',
    centuryRange: [-1000, 1500],
    article: 'Amazon_rainforest',
    fallbackArticle: 'Indigenous_peoples_of_South_America',
    priority: 8,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Upper Amazon',
    centuryRange: [-1000, 1500],
    article: 'Amazon_rainforest',
    fallbackArticle: 'Indigenous_peoples_of_South_America',
    priority: 8,
  },

  // Colonial Amazon - Portuguese/Spanish
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Amazon Basin',
    centuryRange: [1500, 1650],
    article: 'Bandeirantes',
    fallbackArticle: 'Spanish_colonization_of_the_Americas',
    priority: 8,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Amazon Basin',
    centuryRange: [1650, 1800],
    article: 'Colonial_Brazil',
    fallbackArticle: 'Amazon_rainforest',
    priority: 8,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Amazon Basin',
    centuryRange: [1800, 1900],
    article: 'Amazon_rubber_boom',
    fallbackArticle: 'History_of_Brazil',
    priority: 9,
  },

  // ========== SOUTHERN CONE ==========

  // Pre-colonial Pampas
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [-1000, 1536],
    article: 'Pampas',
    fallbackArticle: 'Indigenous_peoples_of_South_America',
    priority: 7,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [-1000, 1536],
    article: 'Pampas',
    fallbackArticle: 'Indigenous_peoples_of_South_America',
    priority: 7,
  },

  // Colonial Pampas
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1536, 1776],
    article: 'Spanish_colonization_of_the_Americas',
    priority: 8,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1536, 1776],
    article: 'Spanish_colonization_of_the_Americas',
    priority: 8,
  },

  // Viceroyalty of Río de la Plata (1776-1810)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1776, 1810],
    article: 'Viceroyalty_of_the_Río_de_la_Plata',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1776, 1810],
    article: 'Viceroyalty_of_the_Río_de_la_Plata',
    priority: 10,
  },

  // Argentine War of Independence (1810-1820)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1810, 1820],
    article: 'Argentine_War_of_Independence',
    fallbackArticle: 'United_Provinces_of_the_Río_de_la_Plata',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1810, 1820],
    article: 'Argentine_War_of_Independence',
    fallbackArticle: 'United_Provinces_of_the_Río_de_la_Plata',
    priority: 10,
  },

  // Post-independence civil wars (1820-1853)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1820, 1853],
    article: 'Argentine_Civil_Wars',
    fallbackArticle: 'History_of_Argentina',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1820, 1853],
    article: 'Argentine_Civil_Wars',
    fallbackArticle: 'History_of_Argentina',
    priority: 10,
  },

  // Argentine Confederation (1853-1861)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1853, 1861],
    article: 'Argentine_Confederation',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1853, 1861],
    article: 'Argentine_Confederation',
    priority: 10,
  },

  // Post-unification Argentina (1861-1878)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1861, 1878],
    article: 'History_of_Argentina',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1861, 1878],
    article: 'History_of_Argentina',
    priority: 9,
  },

  // Conquest of the Desert era (1878-1895)
  // Covers the main campaign and its aftermath, including continued conflicts with indigenous groups
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1878, 1895],
    article: 'Conquest_of_the_Desert',
    fallbackArticle: 'History_of_Argentina',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1878, 1895],
    article: 'Conquest_of_the_Desert',
    fallbackArticle: 'History_of_Argentina',
    priority: 10,
  },

  // Belle Époque Argentina (1895-1916)
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Pampas',
    centuryRange: [1895, 1916],
    article: 'History_of_Argentina',
    fallbackArticle: 'Argentina',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Gran Chaco and Pampas',
    centuryRange: [1895, 1916],
    article: 'History_of_Argentina',
    fallbackArticle: 'Argentina',
    priority: 9,
  },

  // Patagonia
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Patagonia',
    centuryRange: [-1000, 1700],
    article: 'Patagonia',
    fallbackArticle: 'Indigenous_peoples_of_South_America',
    priority: 7,
  },

  // ========== INDEPENDENCE ERA (1810-1830) ==========

  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1810, 1830],
    article: 'Wars_of_independence_in_South_America',
    fallbackArticle: 'Simón_Bolívar',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Cusco',
    centuryRange: [1824, 1850],
    article: 'History_of_Peru',
    priority: 9,
  },

  // ========== REPUBLICAN ERA (1830-1900) ==========

  {
    culturalZone: 'SOUTH_AMERICAN',
    region: 'Andes',
    centuryRange: [1830, 1900],
    article: 'History_of_South_America',
    priority: 8,
  },
];
