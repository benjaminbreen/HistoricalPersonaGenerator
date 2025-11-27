/**
 * Wikipedia article mappings for North American cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const NORTH_AMERICA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== MESOAMERICA - FORMATIVE PERIOD ==========

  // Olmec civilization
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [-1500, -400],
    article: 'Olmecs',
    priority: 10,
  },

  // Zapotec civilization
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [-700, 1521],
    article: 'Zapotec_civilization',
    priority: 9,
  },

  // ========== MESOAMERICA - CLASSIC PERIOD ==========

  // Teotihuacan
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [100, 750],
    article: 'Teotihuacan',
    priority: 10,
  },

  // Classic Maya
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [250, 900],
    article: 'Maya_civilization',
    priority: 10,
  },

  // ========== MESOAMERICA - POSTCLASSIC PERIOD ==========

  // Toltec civilization
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [900, 1168],
    article: 'Toltec',
    priority: 10,
  },

  // Postclassic Maya
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [900, 1521],
    article: 'Maya_civilization',
    priority: 10,
  },

  // Mixtec civilization
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [900, 1521],
    article: 'Mixtec',
    priority: 9,
  },

  // Aztec Triple Alliance
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [1428, 1521],
    article: 'Aztec_Empire',
    fallbackArticle: 'Aztecs',
    priority: 10,
  },

  // Tarascan/Purépecha Empire
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mesoamerica',
    centuryRange: [1300, 1530],
    article: 'Tarascan_state',
    priority: 9,
  },

  // ========== NORTH AMERICAN INDIGENOUS - ANCIENT ==========

  // Poverty Point culture
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mississippi Valley',
    centuryRange: [-1700, -1100],
    article: 'Poverty_Point_culture',
    priority: 9,
  },

  // Hopewell culture
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mississippi Valley',
    centuryRange: [100, 500],
    article: 'Hopewell_tradition',
    priority: 10,
  },

  // Mississippian culture
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mississippi Valley',
    centuryRange: [800, 1600],
    article: 'Mississippian_culture',
    priority: 10,
  },

  // Cahokia (Mississippian urban center)
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Mississippi Valley',
    centuryRange: [1050, 1350],
    article: 'Cahokia',
    fallbackArticle: 'Mississippian_culture',
    priority: 10,
  },

  // Ancestral Puebloans (Anasazi)
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southwest',
    centuryRange: [100, 1300],
    article: 'Ancestral_Puebloans',
    priority: 10,
  },

  // Mogollon culture
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southwest',
    centuryRange: [200, 1450],
    article: 'Mogollon_culture',
    priority: 9,
  },

  // Hohokam culture
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southwest',
    centuryRange: [300, 1450],
    article: 'Hohokam',
    priority: 9,
  },

  // ========== NORTH AMERICAN INDIGENOUS - CONFEDERACIES ==========

  // Iroquois Confederacy
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Atlantic Coast',
    centuryRange: [1450, 1779],
    article: 'Iroquois',
    priority: 10,
  },
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1607, 1779],
    article: 'Iroquois',
    priority: 9,
  },

  // Powhatan Confederacy
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Atlantic Coast',
    centuryRange: [1200, 1646],
    article: 'Powhatan',
    priority: 9,
  },

  // ========== SOUTHEASTERN WOODLANDS ==========

  // Creek Confederacy (pre-contact)
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southeast',
    centuryRange: [-1000, 1540],
    article: 'Muscogee',
    priority: 10,
  },

  // Creek Confederacy (colonial era)
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southeast',
    centuryRange: [1540, 1830],
    article: 'Muscogee',
    priority: 10,
  },
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Southeast',
    centuryRange: [1650, 1830],
    article: 'Muscogee',
    priority: 10,
  },

  // Cherokee (pre-contact and contact era)
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southeast',
    centuryRange: [-1000, 1838],
    article: 'Cherokee',
    priority: 9,
  },
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Southeast',
    centuryRange: [1700, 1838],
    article: 'Cherokee',
    priority: 9,
  },

  // Seminole (post-contact)
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Southeast',
    centuryRange: [1700, 2100],
    article: 'Seminole',
    priority: 10,
  },

  // Mississippian culture
  {
    culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN',
    region: 'Southeast',
    centuryRange: [800, 1600],
    article: 'Mississippian_culture',
    priority: 8,
  },

  // ========== SPANISH COLONIZATION ==========

  // Spanish conquest of Aztec Empire
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1519, 1521],
    article: 'Spanish_conquest_of_the_Aztec_Empire',
    priority: 10,
  },

  // Early New Spain (Viceroyalty)
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1521, 1700],
    article: 'New_Spain',
    priority: 10,
  },

  // Bourbon New Spain
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1700, 1821],
    article: 'New_Spain',
    priority: 10,
  },

  // Spanish Florida
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1513, 1763],
    article: 'Spanish_Florida',
    priority: 9,
  },

  // Spanish Louisiana
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mississippi Valley',
    centuryRange: [1762, 1803],
    article: 'Louisiana_(New_Spain)',
    priority: 9,
  },

  // ========== FRENCH COLONIZATION ==========

  // New France - early period
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1534, 1663],
    article: 'New_France',
    priority: 10,
  },

  // New France - royal government
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1663, 1763],
    article: 'New_France',
    priority: 10,
  },

  // French Louisiana
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mississippi Valley',
    centuryRange: [1682, 1762],
    article: 'Louisiana_(New_France)',
    priority: 10,
  },

  // ========== BRITISH COLONIZATION ==========

  // Early Virginia Colony
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1607, 1700],
    article: 'Colony_of_Virginia',
    fallbackArticle: 'Jamestown,_Virginia',
    priority: 10,
  },

  // Plymouth Colony
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1620, 1691],
    article: 'Plymouth_Colony',
    priority: 10,
  },

  // Massachusetts Bay Colony
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1630, 1691],
    article: 'Massachusetts_Bay_Colony',
    priority: 10,
  },

  // Dutch New Netherland
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1614, 1674],
    article: 'New_Netherland',
    priority: 10,
  },

  // Thirteen Colonies - early 18th century
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1700, 1763],
    article: 'Thirteen_Colonies',
    priority: 10,
  },
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1700, 1763],
    article: 'Thirteen_Colonies',
    priority: 10,
  },

  // Thirteen Colonies - pre-Revolutionary period
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1763, 1776],
    article: 'Thirteen_Colonies',
    priority: 10,
  },
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1763, 1776],
    article: 'Thirteen_Colonies',
    priority: 10,
  },

  // ========== AMERICAN REVOLUTION & EARLY REPUBLIC ==========

  // American Revolution
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Atlantic Coast',
    centuryRange: [1765, 1783],
    article: 'American_Revolution',
    priority: 10,
  },
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1765, 1783],
    article: 'American_Revolution',
    priority: 10,
  },

  // Early American Republic
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1776, 1801],
    article: 'History_of_the_United_States_(1776–1789)',
    fallbackArticle: 'American_Revolution',
    priority: 10,
  },

  // Jeffersonian era
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1801, 1817],
    article: 'History_of_the_United_States_(1789–1849)',
    fallbackArticle: 'Thomas_Jefferson',
    priority: 9,
  },

  // Jacksonian era
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1829, 1849],
    article: 'Jacksonian_democracy',
    fallbackArticle: 'Andrew_Jackson',
    priority: 9,
  },

  // Antebellum period
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1820, 1861],
    article: 'Antebellum_period',
    priority: 10,
  },

  // American Civil War
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1861, 1865],
    article: 'American_Civil_War',
    priority: 10,
  },

  // Reconstruction Era
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1865, 1877],
    article: 'Reconstruction_era',
    priority: 10,
  },

  // Gilded Age
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1877, 1900],
    article: 'Gilded_Age',
    priority: 10,
  },

  // ========== MEXICAN INDEPENDENCE & HISTORY ==========

  // Mexican War of Independence
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1810, 1821],
    article: 'Mexican_War_of_Independence',
    priority: 10,
  },

  // First Mexican Empire
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1821, 1823],
    article: 'First_Mexican_Empire',
    priority: 10,
  },

  // Early Mexican Republic
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1824, 1846],
    article: 'First_Mexican_Republic',
    fallbackArticle: 'History_of_Mexico',
    priority: 10,
  },

  // Mexican-American War period
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1846, 1848],
    article: 'Mexican–American_War',
    fallbackArticle: 'History_of_Mexico',
    priority: 10,
  },

  // La Reforma (Mexican Reform)
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1858, 1861],
    article: 'La_Reforma',
    fallbackArticle: 'History_of_Mexico',
    priority: 10,
  },

  // Second Mexican Empire
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1864, 1867],
    article: 'Second_Mexican_Empire',
    priority: 10,
  },

  // Porfiriato
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1876, 1911],
    article: 'Porfiriato',
    fallbackArticle: 'Porfirio_Díaz',
    priority: 10,
  },

  // ========== CANADIAN HISTORY ==========

  // British North America
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1763, 1867],
    article: 'British_North_America',
    priority: 9,
  },

  // Confederation of Canada
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1867, 1900],
    article: 'Canadian_Confederation',
    fallbackArticle: 'History_of_Canada',
    priority: 9,
  },

  // ========== 20TH CENTURY UNITED STATES ==========

  // Progressive Era
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1896, 1917],
    article: 'Progressive_Era',
    priority: 10,
  },

  // Roaring Twenties
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1920, 1929],
    article: 'Roaring_Twenties',
    priority: 10,
  },

  // Great Depression
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1929, 1939],
    article: 'Great_Depression',
    fallbackArticle: 'Great_Depression_in_the_United_States',
    priority: 10,
  },

  // World War II era
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1939, 1945],
    article: 'Military_history_of_the_United_States_during_World_War_II',
    fallbackArticle: 'United_States_in_World_War_II',
    priority: 10,
  },

  // Post-war America / Baby Boom
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1945, 1964],
    article: 'Post–World_War_II_economic_expansion',
    fallbackArticle: 'History_of_the_United_States_(1945–1964)',
    priority: 10,
  },

  // Civil Rights / Vietnam era
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1964, 1980],
    article: 'History_of_the_United_States_(1964–1980)',
    fallbackArticle: 'Civil_rights_movement',
    priority: 10,
  },

  // Reagan era / Late Cold War
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1980, 1991],
    article: 'History_of_the_United_States_(1980–1991)',
    fallbackArticle: 'Reaganomics',
    priority: 10,
  },

  // Post-Cold War
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'United States',
    centuryRange: [1991, 2001],
    article: 'History_of_the_United_States_(1991–2008)',
    priority: 10,
  },

  // ========== 20TH CENTURY CALIFORNIA SPECIFIC ==========

  // California 20th century
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Southern California',
    centuryRange: [1900, 2001],
    article: 'History_of_California',
    fallbackArticle: 'California',
    priority: 9,
  },

  // ========== 20TH CENTURY MEXICO ==========

  // Mexican Revolution
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1910, 1920],
    article: 'Mexican_Revolution',
    priority: 10,
  },

  // Post-Revolution Mexico
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'Mesoamerica',
    centuryRange: [1920, 2001],
    article: 'History_of_Mexico',
    priority: 9,
  },

  // ========== 20TH CENTURY CANADA ==========

  // 20th century Canada
  {
    culturalZone: 'NORTH_AMERICAN_COLONIAL',
    region: 'New England',
    centuryRange: [1900, 2001],
    article: 'History_of_Canada',
    priority: 9,
  },
];
