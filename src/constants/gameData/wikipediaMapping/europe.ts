/**
 * Wikipedia article mappings for European cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const EUROPE_MAPPINGS: WikipediaImageMapping[] = [
  // ========== ANCIENT ROME ==========

  // Roman Republic
  {
    culturalZone: 'EUROPEAN',
    region: 'Italian Peninsula',
    centuryRange: [-509, -27],
    article: 'Roman_Republic',
    priority: 10,
  },

  // Roman Empire - Western
  {
    culturalZone: 'EUROPEAN',
    region: 'Italian Peninsula',
    centuryRange: [-27, 476],
    article: 'Roman_Empire',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'Iberian Peninsula',
    centuryRange: [-200, 476],
    article: 'Roman_Empire',
    fallbackArticle: 'Hispania',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [-50, 476],
    article: 'Roman_Gaul',
    fallbackArticle: 'Roman_Empire',
    priority: 10,
  },

  // Prehistoric British Isles
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [-10000, 43],
    article: 'Prehistoric_Britain',
    fallbackArticle: 'Neolithic_Europe',
    priority: 10,
  },

  // Roman Britain
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [43, 410],
    article: 'Roman_Britain',
    priority: 10,
  },

  // Byzantine Empire (Eastern Roman)
  {
    culturalZone: 'EUROPEAN',
    region: 'Balkans',
    centuryRange: [330, 1453],
    article: 'Byzantine_Empire',
    priority: 10,
  },

  // ========== EARLY MEDIEVAL (500-1000) ==========

  // Anglo-Saxon England
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [410, 1066],
    article: 'Anglo-Saxon_England',
    priority: 10,
  },

  // Viking Age Scandinavia
  {
    culturalZone: 'EUROPEAN',
    region: 'Scandinavia',
    centuryRange: [793, 1066],
    article: 'Vikings',
    priority: 10,
  },

  // Frankish kingdoms
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [481, 843],
    article: 'Merovingian_dynasty',
    fallbackArticle: 'Francia',
    priority: 10,
  },

  // Carolingian Empire
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [751, 987],
    article: 'Carolingian_Empire',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'Holy Roman Empire',
    centuryRange: [800, 1000],
    article: 'Carolingian_Empire',
    priority: 10,
  },

  // Visigothic Spain
  {
    culturalZone: 'EUROPEAN',
    region: 'Iberian Peninsula',
    centuryRange: [476, 711],
    article: 'Visigothic_Kingdom',
    priority: 10,
  },

  // Al-Andalus (Islamic Spain)
  {
    culturalZone: 'EUROPEAN',
    region: 'Iberian Peninsula',
    centuryRange: [711, 1031],
    article: 'Al-Andalus',
    fallbackArticle: 'Umayyad_Caliphate_of_Córdoba',
    priority: 10,
  },

  // ========== HIGH MEDIEVAL (1000-1300) ==========

  // Norman Conquest and Norman England
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1066, 1154],
    article: 'Norman_Conquest',
    fallbackArticle: 'England_in_the_Middle_Ages',
    priority: 10,
  },

  // Plantagenet England
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1154, 1399],
    article: 'House_of_Plantagenet',
    fallbackArticle: 'England_in_the_Middle_Ages',
    priority: 10,
  },

  // Capetian France
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [987, 1328],
    article: 'Capetian_dynasty',
    fallbackArticle: 'Kingdom_of_France',
    priority: 10,
  },

  // Holy Roman Empire
  {
    culturalZone: 'EUROPEAN',
    region: 'Holy Roman Empire',
    centuryRange: [1000, 1250],
    article: 'Holy_Roman_Empire',
    priority: 10,
  },

  // Reconquista Spain
  {
    culturalZone: 'EUROPEAN',
    region: 'Iberian Peninsula',
    centuryRange: [1031, 1492],
    article: 'Reconquista',
    fallbackArticle: 'Kingdom_of_Castile',
    priority: 10,
  },

  // Italian city-states emerge
  {
    culturalZone: 'EUROPEAN',
    region: 'Italian Peninsula',
    centuryRange: [1000, 1300],
    article: 'Italian_city-states',
    fallbackArticle: 'Republic_of_Venice',
    priority: 9,
  },

  // ========== LATE MEDIEVAL (1300-1500) ==========

  // Hundred Years' War period
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1337, 1453],
    article: 'Hundred_Years%27_War',
    fallbackArticle: 'Kingdom_of_France',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1337, 1453],
    article: 'Hundred_Years%27_War',
    fallbackArticle: 'England_in_the_Middle_Ages',
    priority: 10,
  },

  // Wars of the Roses
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1455, 1487],
    article: 'Wars_of_the_Roses',
    priority: 10,
  },

  // Italian Renaissance
  {
    culturalZone: 'EUROPEAN',
    region: 'Italian Peninsula',
    centuryRange: [1300, 1600],
    article: 'Italian_Renaissance',
    priority: 10,
  },

  // ========== EARLY MODERN (1500-1700) ==========

  // Tudor England
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1485, 1603],
    article: 'Tudor_period',
    priority: 10,
  },

  // Stuart England / English Civil War
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1603, 1649],
    article: 'Stuart_period',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1642, 1651],
    article: 'English_Civil_War',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1649, 1660],
    article: 'Commonwealth_of_England',
    priority: 10,
  },

  // Restoration and Glorious Revolution
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1660, 1688],
    article: 'Restoration_(England)',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1688, 1707],
    article: 'Glorious_Revolution',
    priority: 10,
  },

  // Spanish Golden Age
  {
    culturalZone: 'EUROPEAN',
    region: 'Iberian Peninsula',
    centuryRange: [1492, 1659],
    article: 'Spanish_Empire',
    fallbackArticle: 'Spanish_Golden_Age',
    priority: 10,
  },

  // Spanish decline
  {
    culturalZone: 'EUROPEAN',
    region: 'Iberian Peninsula',
    centuryRange: [1659, 1700],
    article: 'Spanish_Empire',
    priority: 9,
  },

  // Valois France
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1328, 1589],
    article: 'House_of_Valois',
    fallbackArticle: 'Kingdom_of_France',
    priority: 10,
  },

  // Bourbon France (ancien régime)
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1589, 1789],
    article: 'Ancien_Régime',
    fallbackArticle: 'House_of_Bourbon',
    priority: 10,
  },

  // Thirty Years' War
  {
    culturalZone: 'EUROPEAN',
    region: 'Holy Roman Empire',
    centuryRange: [1618, 1648],
    article: 'Thirty_Years%27_War',
    priority: 10,
  },

  // ========== 18TH CENTURY ==========

  // Georgian Britain
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1714, 1800],
    article: 'Georgian_era',
    fallbackArticle: 'Kingdom_of_Great_Britain',
    priority: 10,
  },

  // Enlightenment France (pre-Revolution)
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1715, 1789],
    article: 'Age_of_Enlightenment',
    fallbackArticle: 'Ancien_Régime',
    priority: 10,
  },

  // French Revolution
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1789, 1799],
    article: 'French_Revolution',
    priority: 10,
  },

  // Napoleonic era
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1799, 1815],
    article: 'Napoleon',
    fallbackArticle: 'First_French_Empire',
    priority: 10,
  },

  // ========== 19TH CENTURY ==========

  // Regency and early Victorian Britain
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1811, 1837],
    article: 'Regency_era',
    priority: 10,
  },

  // Victorian era
  {
    culturalZone: 'EUROPEAN',
    region: 'British Isles',
    centuryRange: [1837, 1901],
    article: 'Victorian_era',
    priority: 10,
  },

  // Bourbon Restoration France
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1815, 1830],
    article: 'Bourbon_Restoration_in_France',
    priority: 10,
  },

  // July Monarchy
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1830, 1848],
    article: 'July_Monarchy',
    priority: 10,
  },

  // Second French Republic and Empire
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1848, 1852],
    article: 'French_Second_Republic',
    priority: 10,
  },
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1852, 1870],
    article: 'Second_French_Empire',
    priority: 10,
  },

  // Third Republic
  {
    culturalZone: 'EUROPEAN',
    region: 'France',
    centuryRange: [1870, 1900],
    article: 'French_Third_Republic',
    priority: 10,
  },

  // German unification
  {
    culturalZone: 'EUROPEAN',
    region: 'Holy Roman Empire',
    centuryRange: [1815, 1871],
    article: 'German_Confederation',
    fallbackArticle: 'Unification_of_Germany',
    priority: 10,
  },

  // Scandinavian kingdoms
  {
    culturalZone: 'EUROPEAN',
    region: 'Scandinavia',
    centuryRange: [1100, 1900],
    article: 'History_of_Scandinavia',
    priority: 7,
  },
];
