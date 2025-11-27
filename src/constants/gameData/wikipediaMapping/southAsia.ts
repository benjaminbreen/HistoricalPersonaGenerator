/**
 * Wikipedia article mappings for South Asian cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const SOUTH_ASIA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== INDUS VALLEY CIVILIZATION ==========

  // Early Harappan
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [-3300, -2600],
    article: 'Indus_Valley_Civilisation',
    priority: 9,
  },

  // Mature Harappan
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [-2600, -1900],
    article: 'Indus_Valley_Civilisation',
    priority: 10,
  },

  // Late Harappan
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [-1900, -1300],
    article: 'Indus_Valley_Civilisation',
    priority: 9,
  },

  // ========== VEDIC PERIOD ==========

  // Early Vedic period
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-1500, -1000],
    article: 'Vedic_period',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [-1500, -1000],
    article: 'Vedic_period',
    priority: 10,
  },

  // Later Vedic period
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-1000, -600],
    article: 'Vedic_period',
    priority: 10,
  },

  // Mahajanapadas (16 great kingdoms)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-600, -320],
    article: 'Mahajanapadas',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [-600, -320],
    article: 'Mahajanapadas',
    priority: 9,
  },

  // ========== MAURYA EMPIRE ==========

  // Early Maurya (Chandragupta)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-322, -268],
    article: 'Maurya_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [-322, -268],
    article: 'Maurya_Empire',
    priority: 10,
  },

  // Maurya peak (Ashoka)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-268, -232],
    article: 'Ashoka',
    fallbackArticle: 'Maurya_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [-268, -232],
    article: 'Ashoka',
    fallbackArticle: 'Maurya_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [-268, -232],
    article: 'Ashoka',
    fallbackArticle: 'Maurya_Empire',
    priority: 10,
  },

  // Late Maurya
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-232, -185],
    article: 'Maurya_Empire',
    priority: 10,
  },

  // ========== POST-MAURYAN PERIOD ==========

  // Shunga Empire
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [-185, -73],
    article: 'Shunga_Empire',
    priority: 10,
  },

  // Indo-Greek Kingdom
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [-180, -10],
    article: 'Indo-Greek_Kingdom',
    priority: 10,
  },

  // Satavahana Empire (Deccan)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [-230, 220],
    article: 'Satavahana_dynasty',
    priority: 10,
  },

  // Indo-Scythian
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [-150, 400],
    article: 'Indo-Scythians',
    priority: 9,
  },

  // Kushan Empire
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [30, 375],
    article: 'Kushan_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [30, 375],
    article: 'Kushan_Empire',
    priority: 9,
  },

  // ========== GUPTA EMPIRE (GOLDEN AGE) ==========

  // Early Gupta
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [320, 415],
    article: 'Gupta_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [320, 415],
    article: 'Gupta_Empire',
    priority: 10,
  },

  // Classical Gupta period
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [415, 467],
    article: 'Gupta_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [415, 467],
    article: 'Gupta_Empire',
    priority: 10,
  },

  // Late Gupta (decline under Huna invasions)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [467, 550],
    article: 'Gupta_Empire',
    priority: 10,
  },

  // ========== POST-GUPTA PERIOD (500-1200) ==========

  // Vardhana Empire (Harsha)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [606, 647],
    article: 'Harsha',
    fallbackArticle: 'Vardhana_dynasty',
    priority: 10,
  },

  // Pala Empire (Bengal and Bihar)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [750, 1174],
    article: 'Pala_Empire',
    priority: 10,
  },

  // Gurjara-Pratihara Empire (northern India)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [730, 1036],
    article: 'Gurjara-Pratihara_dynasty',
    priority: 9,
  },

  // Sena dynasty (Bengal)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1070, 1230],
    article: 'Sena_dynasty',
    priority: 9,
  },

  // ========== SOUTH INDIA - CLASSICAL PERIOD ==========

  // Pandya Kingdom (ancient Tamil)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [-600, 1650],
    article: 'Pandya_dynasty',
    priority: 9,
  },

  // Chera Kingdom (ancient Tamil)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [-300, 1102],
    article: 'Chera_dynasty',
    priority: 9,
  },

  // Early Chola
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [-300, 300],
    article: 'Early_Cholas',
    fallbackArticle: 'Chola_dynasty',
    priority: 9,
  },

  // Pallava dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [275, 897],
    article: 'Pallava_dynasty',
    priority: 10,
  },

  // Chalukya dynasty (western)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [543, 753],
    article: 'Chalukya_dynasty',
    priority: 10,
  },

  // Rashtrakuta Empire
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [753, 982],
    article: 'Rashtrakuta_dynasty',
    priority: 10,
  },

  // Medieval Chola Empire (imperial period)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [848, 1070],
    article: 'Chola_dynasty',
    priority: 10,
  },

  // Chola Empire peak
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1070, 1279],
    article: 'Chola_dynasty',
    priority: 10,
  },

  // Hoysala Empire
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1026, 1343],
    article: 'Hoysala_Empire',
    priority: 10,
  },

  // Kakatiya dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1163, 1323],
    article: 'Kakatiya_dynasty',
    priority: 9,
  },

  // ========== DELHI SULTANATE ==========

  // Mamluk/Slave dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1206, 1290],
    article: 'Mamluk_dynasty_(Delhi)',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1206, 1290],
    article: 'Delhi_Sultanate',
    priority: 10,
  },

  // Khilji dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1290, 1320],
    article: 'Khalji_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1290, 1320],
    article: 'Khalji_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },

  // Tughlaq dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1320, 1414],
    article: 'Tughlaq_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1320, 1398],
    article: 'Tughlaq_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1320, 1347],
    article: 'Delhi_Sultanate',
    priority: 9,
  },

  // Sayyid dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1414, 1451],
    article: 'Sayyid_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },

  // Lodi dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1451, 1526],
    article: 'Lodi_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1451, 1526],
    article: 'Lodi_dynasty',
    fallbackArticle: 'Delhi_Sultanate',
    priority: 10,
  },

  // ========== REGIONAL SULTANATES ==========

  // Bahmani Sultanate (Deccan)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1347, 1527],
    article: 'Bahmani_Sultanate',
    priority: 10,
  },

  // Deccan Sultanates
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1490, 1686],
    article: 'Deccan_sultanates',
    priority: 10,
  },

  // Bengal Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1352, 1576],
    article: 'Bengal_Sultanate',
    priority: 9,
  },

  // Gujarat Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1407, 1573],
    article: 'Gujarat_Sultanate',
    priority: 9,
  },

  // Vijayanagara Empire (Hindu empire in south)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1336, 1646],
    article: 'Vijayanagara_Empire',
    priority: 10,
  },

  // ========== MUGHAL EMPIRE ==========

  // Early Mughal (Babur and Humayun)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1526, 1556],
    article: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1526, 1556],
    article: 'Mughal_Empire',
    priority: 10,
  },

  // Akbar's reign (expansion and consolidation)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1556, 1605],
    article: 'Akbar',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1556, 1605],
    article: 'Akbar',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1556, 1605],
    article: 'Mughal_Empire',
    priority: 9,
  },

  // Jahangir and Shah Jahan (cultural peak)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1605, 1658],
    article: 'Shah_Jahan',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1605, 1658],
    article: 'Mughal_Empire',
    priority: 10,
  },

  // Aurangzeb (maximum territorial extent)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1658, 1707],
    article: 'Aurangzeb',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1658, 1707],
    article: 'Aurangzeb',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1658, 1707],
    article: 'Aurangzeb',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },

  // Late Mughal decline
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1707, 1803],
    article: 'Mughal_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1707, 1803],
    article: 'Decline_of_the_Mughal_Empire',
    fallbackArticle: 'Mughal_Empire',
    priority: 10,
  },

  // Mughal remnant (puppet state)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1803, 1857],
    article: 'Mughal_Empire',
    priority: 9,
  },

  // ========== MARATHA EMPIRE ==========

  // Rise of Marathas (Shivaji)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1674, 1707],
    article: 'Shivaji',
    fallbackArticle: 'Maratha_Empire',
    priority: 10,
  },

  // Maratha expansion
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1707, 1761],
    article: 'Maratha_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1707, 1761],
    article: 'Maratha_Empire',
    priority: 10,
  },

  // Maratha Confederacy (after Third Battle of Panipat)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1761, 1818],
    article: 'Maratha_Empire',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1761, 1818],
    article: 'Maratha_Confederacy',
    fallbackArticle: 'Maratha_Empire',
    priority: 10,
  },

  // ========== SIKH EMPIRE ==========

  // Sikh Empire (Punjab)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [1799, 1849],
    article: 'Sikh_Empire',
    priority: 10,
  },

  // ========== BRITISH COLONIAL PERIOD ==========

  // Early East India Company rule
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1757, 1857],
    article: 'Company_rule_in_India',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1757, 1857],
    article: 'Company_rule_in_India',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1799, 1857],
    article: 'Company_rule_in_India',
    priority: 10,
  },

  // British Raj (after 1857 Rebellion)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Gangetic Plain',
    centuryRange: [1858, 1947],
    article: 'British_Raj',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'India',
    centuryRange: [1858, 1947],
    article: 'British_Raj',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Deccan',
    centuryRange: [1858, 1947],
    article: 'British_Raj',
    priority: 10,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indus Valley',
    centuryRange: [1858, 1947],
    article: 'British_Raj',
    priority: 10,
  },

  // ========== SRI LANKA ==========

  // Anuradhapura Kingdom
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [-377, 1017],
    article: 'Anuradhapura_Kingdom',
    priority: 10,
  },

  // Polonnaruwa Kingdom
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [1055, 1236],
    article: 'Kingdom_of_Polonnaruwa',
    priority: 10,
  },

  // Kingdom of Jaffna
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [1215, 1619],
    article: 'Jaffna_Kingdom',
    priority: 9,
  },

  // Kingdom of Kandy
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [1469, 1815],
    article: 'Kingdom_of_Kandy',
    priority: 10,
  },

  // Portuguese Ceylon
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [1505, 1658],
    article: 'Portuguese_Ceylon',
    priority: 10,
  },

  // Dutch Ceylon
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [1658, 1796],
    article: 'Dutch_Ceylon',
    priority: 10,
  },

  // British Ceylon
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Sri Lanka',
    centuryRange: [1796, 1948],
    article: 'British_Ceylon',
    priority: 10,
  },

  // ========== SOUTHEAST ASIA - MARITIME ==========

  // ========== PREHISTORIC & ANCIENT MARITIME SOUTHEAST ASIA ==========

  // Prehistoric period (Austronesian expansion, early settlements)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [-3000, -1500],
    article: 'Prehistoric_Indonesia',
    fallbackArticle: 'Southeast_Asia',
    priority: 8,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [-3000, -1500],
    article: 'Prehistoric_Philippines',
    fallbackArticle: 'Philippines',
    priority: 8,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [-3000, -1500],
    article: 'Prehistory_of_Southeast_Asia',
    fallbackArticle: 'Southeast_Asia',
    priority: 8,
  },

  // Late prehistoric / early metalworking
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [-1500, -500],
    article: 'Prehistory_of_Southeast_Asia',
    fallbackArticle: 'Dong_Son_culture',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [-1500, -500],
    article: 'Dong_Son_culture',
    fallbackArticle: 'Prehistory_of_Southeast_Asia',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [-1500, -500],
    article: 'Prehistoric_Philippines',
    fallbackArticle: 'Southeast_Asia',
    priority: 8,
  },

  // Iron Age Southeast Asia (Sa Huynh, early trade)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [-500, 100],
    article: 'Sa_Huỳnh_culture',
    fallbackArticle: 'History_of_Southeast_Asia',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [-500, 100],
    article: 'History_of_Southeast_Asia',
    fallbackArticle: 'Dong_Son_culture',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [-500, 100],
    article: 'History_of_the_Philippines',
    fallbackArticle: 'Southeast_Asia',
    priority: 8,
  },

  // Early Indianized period (before major kingdoms)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [100, 358],
    article: 'History_of_Indonesia',
    fallbackArticle: 'History_of_Southeast_Asia',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [100, 200],
    article: 'History_of_Southeast_Asia',
    priority: 9,
  },
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [100, 900],
    article: 'History_of_the_Philippines',
    fallbackArticle: 'Southeast_Asia',
    priority: 8,
  },

  // ========== JAVA - EARLY KINGDOMS ==========

  // Tarumanegara Kingdom (West Java)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [358, 669],
    article: 'Tarumanegara',
    priority: 9,
  },

  // Kalingga Kingdom (Central Java)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [594, 782],
    article: 'Kalingga_Kingdom',
    priority: 8,
  },

  // Sunda Kingdom (West Java)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [669, 1579],
    article: 'Sunda_Kingdom',
    priority: 9,
  },

  // ========== JAVA - MATARAM & SAILENDRA DYNASTIES ==========

  // Medang Kingdom / Ancient Mataram
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [732, 1006],
    article: 'Mataram_Kingdom',
    priority: 10,
  },

  // Sailendra Dynasty (Buddhist dynasty, builders of Borobudur)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [760, 860],
    article: 'Sailendra',
    priority: 10,
  },

  // ========== JAVA - MEDIEVAL KINGDOMS ==========

  // Kediri Kingdom
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1045, 1221],
    article: 'Kediri_Kingdom',
    priority: 9,
  },

  // Singhasari Kingdom
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1222, 1292],
    article: 'Singhasari',
    priority: 9,
  },

  // Majapahit Empire (peak of Hindu-Buddhist Java)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1293, 1527],
    article: 'Majapahit',
    priority: 10,
  },

  // ========== JAVA - ISLAMIC PERIOD ==========

  // Demak Sultanate (first Islamic kingdom in Java)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1475, 1554],
    article: 'Demak_Sultanate',
    priority: 9,
  },

  // Pajang Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1568, 1586],
    article: 'Sultanate_of_Pajang',
    priority: 8,
  },

  // Mataram Sultanate (Islamic Mataram)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1587, 1755],
    article: 'Mataram_Sultanate',
    priority: 10,
  },

  // Banten Sultanate (West Java)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1526, 1813],
    article: 'Banten_Sultanate',
    priority: 9,
  },

  // Cirebon Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1445, 1677],
    article: 'Sultanate_of_Cirebon',
    priority: 8,
  },

  // ========== SUMATRA - EARLY KINGDOMS ==========

  // Srivijaya Empire (maritime trading empire)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [650, 1025],
    article: 'Srivijaya',
    priority: 10,
  },

  // Melayu Kingdom (pre-Srivijaya)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [671, 692],
    article: 'Melayu_Kingdom',
    priority: 8,
  },

  // Malayu Kingdom (post-Srivijaya)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1025, 1347],
    article: 'Dharmasraya',
    fallbackArticle: 'Melayu_Kingdom',
    priority: 9,
  },

  // ========== SUMATRA - ISLAMIC SULTANATES ==========

  // Samudera Pasai Sultanate (first Islamic state in SE Asia)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1267, 1521],
    article: 'Samudera_Pasai_Sultanate',
    priority: 10,
  },

  // Aceh Sultanate (powerful Islamic sultanate)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1496, 1903],
    article: 'Aceh_Sultanate',
    priority: 10,
  },

  // Palembang Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1550, 1823],
    article: 'Palembang_Sultanate',
    priority: 9,
  },

  // Jambi Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1615, 1904],
    article: 'Jambi_Sultanate',
    priority: 8,
  },

  // Siak Sri Indrapura Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1723, 1945],
    article: 'Sultanate_of_Siak_Sri_Indrapura',
    priority: 8,
  },

  // ========== MALAY PENINSULA ==========

  // Langkasuka Kingdom (early Hindu-Buddhist kingdom)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [100, 1500],
    article: 'Langkasuka',
    priority: 9,
  },

  // Kedah Kingdom / Kedah Tua
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [630, 1136],
    article: 'Kedah_Kingdom',
    priority: 9,
  },

  // Malacca Sultanate (major maritime trading empire)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1400, 1511],
    article: 'Malacca_Sultanate',
    priority: 10,
  },

  // Johor Sultanate (successor to Malacca)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1528, 1824],
    article: 'Johor_Sultanate',
    priority: 10,
  },

  // Pahang Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1470, 1623],
    article: 'Old_Pahang_Kingdom',
    priority: 8,
  },

  // Perak Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1528, 1895],
    article: 'Perak_Sultanate',
    priority: 9,
  },

  // Kedah Sultanate (Islamic period)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1136, 1821],
    article: 'Kedah_Sultanate',
    priority: 9,
  },

  // Kelantan Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1411, 1909],
    article: 'Kelantan_Sultanate',
    priority: 8,
  },

  // Terengganu Sultanate
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1725, 1909],
    article: 'Terengganu_Sultanate',
    priority: 8,
  },

  // ========== BORNEO ==========

  // Brunei Sultanate (peak period)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1368, 1888],
    article: 'Bruneian_Sultanate_(1368-1888)',
    fallbackArticle: 'Brunei',
    priority: 9,
  },

  // Banjar Sultanate (South Kalimantan)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1526, 1860],
    article: 'Banjar_Sultanate',
    priority: 9,
  },

  // Kutai Kartanegara Sultanate (East Kalimantan)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1300, 1844],
    article: 'Kutai_Kartanegara_Sultanate',
    priority: 8,
  },

  // Sambas Sultanate (West Kalimantan)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1675, 1950],
    article: 'Sambas_Sultanate',
    priority: 8,
  },

  // ========== SULAWESI & EASTERN INDONESIA ==========

  // Gowa Sultanate (South Sulawesi)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1300, 1856],
    article: 'Gowa_Sultanate',
    priority: 9,
  },

  // Bone Kingdom (South Sulawesi)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1330, 1905],
    article: 'Bone_state',
    priority: 8,
  },

  // Ternate Sultanate (Maluku/Spice Islands)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1257, 1914],
    article: 'Sultanate_of_Ternate',
    priority: 9,
  },

  // Tidore Sultanate (Maluku/Spice Islands)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1081, 1950],
    article: 'Sultanate_of_Tidore',
    priority: 9,
  },

  // ========== COLONIAL MARITIME SOUTHEAST ASIA ==========

  // Portuguese Malacca
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1511, 1641],
    article: 'Portuguese_Malacca',
    priority: 10,
  },

  // Dutch East Indies (VOC period)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1602, 1800],
    article: 'Dutch_East_India_Company',
    priority: 10,
  },

  // Dutch East Indies (colonial state)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1800, 1942],
    article: 'Dutch_East_Indies',
    priority: 10,
  },

  // British Malaya
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Maritime Southeast Asia',
    centuryRange: [1826, 1946],
    article: 'British_Malaya',
    priority: 10,
  },

  // Spanish East Indies (Philippines)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1565, 1898],
    article: 'Spanish_East_Indies',
    fallbackArticle: 'History_of_the_Philippines_(1521-1898)',
    priority: 10,
  },

  // American Philippines
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1898, 1946],
    article: 'History_of_the_Philippines_(1898-1946)',
    priority: 10,
  },

  // ========== PHILIPPINES - PRE-COLONIAL ==========

  // Rajahnate of Cebu
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1200, 1565],
    article: 'Rajahnate_of_Cebu',
    priority: 9,
  },

  // Kingdom of Maynila
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1258, 1571],
    article: 'Kingdom_of_Maynila',
    priority: 9,
  },

  // Kingdom of Tondo
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [900, 1589],
    article: 'Tondo_(historical_polity)',
    priority: 9,
  },

  // Rajahnate of Butuan
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1001, 1521],
    article: 'Rajahnate_of_Butuan',
    priority: 8,
  },

  // Sultanate of Sulu
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1405, 1915],
    article: 'Sultanate_of_Sulu',
    priority: 9,
  },

  // Sultanate of Maguindanao
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1520, 1888],
    article: 'Sultanate_of_Maguindanao',
    priority: 9,
  },

  // Confederation of Madja-as (Visayas)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Philippines',
    centuryRange: [1200, 1569],
    article: 'Kedatuan_of_Madja-as',
    priority: 8,
  },

  // ========== SOUTHEAST ASIA - MAINLAND ==========

  // ========== MAINLAND - EARLY KINGDOMS ==========

  // Funan Kingdom (Cambodia/Mekong Delta)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [68, 550],
    article: 'Funan',
    priority: 10,
  },

  // Chenla Kingdom (pre-Angkor Cambodia)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [550, 802],
    article: 'Chenla',
    priority: 10,
  },

  // ========== KHMER EMPIRE ==========

  // Early Angkor period
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [802, 1050],
    article: 'Khmer_Empire',
    priority: 10,
  },

  // Classical Angkor (peak of temple building)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1050, 1220],
    article: 'Khmer_Empire',
    fallbackArticle: 'Angkor',
    priority: 10,
  },

  // Late Angkor (decline period)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1220, 1431],
    article: 'Khmer_Empire',
    priority: 10,
  },

  // Post-Angkor Cambodia
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1431, 1863],
    article: 'Dark_Ages_of_Cambodia',
    fallbackArticle: 'Cambodia',
    priority: 9,
  },

  // ========== THAILAND/SIAM ==========

  // Dvaravati Kingdom (Mon kingdom)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [600, 1100],
    article: 'Dvaravati',
    priority: 9,
  },

  // Sukhothai Kingdom (first major Thai kingdom)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1238, 1438],
    article: 'Sukhothai_Kingdom',
    priority: 10,
  },

  // Ayutthaya Kingdom (major Thai kingdom)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1351, 1767],
    article: 'Ayutthaya_Kingdom',
    priority: 10,
  },

  // Thonburi Kingdom (brief restoration)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1767, 1782],
    article: 'Thonburi_Kingdom',
    priority: 9,
  },

  // Rattanakosin Kingdom (Bangkok/modern Siam)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1782, 1932],
    article: 'Rattanakosin_Kingdom',
    fallbackArticle: 'Thailand',
    priority: 10,
  },

  // Lanna Kingdom (Northern Thailand)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1292, 1775],
    article: 'Lan_Na',
    priority: 9,
  },

  // ========== MYANMAR/BURMA ==========

  // Pyu city-states (early Burma)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [200, 1050],
    article: 'Pyu_city-states',
    priority: 9,
  },

  // Pagan Kingdom (first Burmese empire)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [849, 1297],
    article: 'Pagan_Kingdom',
    priority: 10,
  },

  // Ava Kingdom (Upper Burma)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1364, 1555],
    article: 'Kingdom_of_Ava',
    priority: 9,
  },

  // Hanthawaddy Kingdom (Lower Burma, Mon kingdom)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1287, 1539],
    article: 'Hanthawaddy_Kingdom',
    priority: 9,
  },

  // Toungoo Dynasty (reunification)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1510, 1752],
    article: 'Toungoo_dynasty',
    priority: 10,
  },

  // Konbaung Dynasty (last Burmese dynasty)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1752, 1885],
    article: 'Konbaung_dynasty',
    priority: 10,
  },

  // British Burma
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1824, 1948],
    article: 'British_rule_in_Burma',
    priority: 10,
  },

  // Arakan Kingdom
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1429, 1785],
    article: 'Kingdom_of_Mrauk_U',
    priority: 9,
  },

  // ========== VIETNAM ==========

  // Champa Kingdom (coastal Vietnam)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [192, 1832],
    article: 'Champa',
    priority: 10,
  },

  // Dai Viet (independent Vietnam)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [968, 1054],
    article: 'Đại_Việt',
    priority: 10,
  },

  // Ly Dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1009, 1225],
    article: 'Lý_dynasty',
    priority: 10,
  },

  // Tran Dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1225, 1400],
    article: 'Trần_dynasty',
    priority: 10,
  },

  // Le Dynasty (Later Le)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1428, 1789],
    article: 'Lê_dynasty',
    priority: 10,
  },

  // Tay Son Dynasty
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1778, 1802],
    article: 'Tây_Sơn_dynasty',
    priority: 9,
  },

  // Nguyen Dynasty (final Vietnamese dynasty)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1802, 1945],
    article: 'Nguyễn_dynasty',
    priority: 10,
  },

  // French Indochina
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Mainland Southeast Asia',
    centuryRange: [1887, 1954],
    article: 'French_Indochina',
    priority: 10,
  },

  // French Indochina (Cambodia and Laos)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indochina Interior',
    centuryRange: [1887, 1954],
    article: 'French_Indochina',
    priority: 10,
  },

  // ========== LAOS ==========

  // Lan Xang Kingdom (Kingdom of a Million Elephants)
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indochina Interior',
    centuryRange: [1353, 1707],
    article: 'Lan_Xang',
    priority: 10,
  },

  // Kingdom of Luang Phrabang
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indochina Interior',
    centuryRange: [1707, 1893],
    article: 'Kingdom_of_Luang_Phrabang',
    priority: 9,
  },

  // Kingdom of Vientiane
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indochina Interior',
    centuryRange: [1707, 1828],
    article: 'Kingdom_of_Vientiane',
    priority: 9,
  },

  // Kingdom of Champasak
  {
    culturalZone: 'SOUTH_ASIAN',
    region: 'Indochina Interior',
    centuryRange: [1713, 1904],
    article: 'Kingdom_of_Champasak',
    priority: 8,
  },
];
