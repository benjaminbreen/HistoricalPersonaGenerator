/**
 * Wikipedia article mappings for East Asian cultural zones
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';

export const EAST_ASIA_MAPPINGS: WikipediaImageMapping[] = [
  // ========== ANCIENT CHINA ==========

  // Xia dynasty (legendary/early bronze age)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-2070, -1600],
    article: 'Xia_dynasty',
    priority: 9,
  },

  // Shang dynasty
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-1600, -1046],
    article: 'Shang_dynasty',
    priority: 10,
  },

  // Western Zhou
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-1046, -771],
    article: 'Western_Zhou',
    fallbackArticle: 'Zhou_dynasty',
    priority: 10,
  },

  // Eastern Zhou - Spring and Autumn period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-770, -476],
    article: 'Spring_and_Autumn_period',
    fallbackArticle: 'Zhou_dynasty',
    priority: 10,
  },

  // Eastern Zhou - Warring States period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-475, -221],
    article: 'Warring_States_period',
    fallbackArticle: 'Zhou_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [-475, -221],
    article: 'Warring_States_period',
    priority: 10,
  },

  // Qin dynasty (first unified empire)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-221, -206],
    article: 'Qin_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [-221, -206],
    article: 'Qin_dynasty',
    priority: 10,
  },

  // Western Han
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [-206, 9],
    article: 'Han_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [-206, 9],
    article: 'Han_dynasty',
    priority: 10,
  },

  // Xin dynasty (Wang Mang's usurpation)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [9, 23],
    article: 'Xin_dynasty',
    fallbackArticle: 'Han_dynasty',
    priority: 10,
  },

  // Eastern Han
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [25, 220],
    article: 'Han_dynasty',
    priority: 10,
  },

  // ========== THREE KINGDOMS & SIX DYNASTIES (220-589) ==========

  // Three Kingdoms period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [220, 280],
    article: 'Three_Kingdoms',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [220, 280],
    article: 'Three_Kingdoms',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yangtze River',
    centuryRange: [220, 280],
    article: 'Eastern_Wu',
    fallbackArticle: 'Three_Kingdoms',
    priority: 10,
  },

  // Jin dynasty (brief reunification)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [266, 420],
    article: 'Jin_dynasty_(266–420)',
    priority: 10,
  },

  // Northern and Southern Dynasties
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [420, 589],
    article: 'Northern_and_Southern_dynasties',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [420, 589],
    article: 'Northern_and_Southern_dynasties',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yangtze River',
    centuryRange: [420, 589],
    article: 'Northern_and_Southern_dynasties',
    priority: 10,
  },

  // ========== SUI & TANG DYNASTIES (589-907) ==========

  // Sui dynasty (reunification)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [581, 618],
    article: 'Sui_dynasty',
    priority: 10,
  },

  // Tang dynasty - early period (rise and golden age)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [618, 755],
    article: 'Tang_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [618, 755],
    article: 'Tang_dynasty',
    priority: 10,
  },

  // Tang dynasty - after An Lushan Rebellion
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [755, 907],
    article: 'An_Lushan_Rebellion',
    fallbackArticle: 'Tang_dynasty',
    priority: 10,
  },

  // ========== FIVE DYNASTIES & SONG (907-1279) ==========

  // Five Dynasties and Ten Kingdoms period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [907, 960],
    article: 'Five_Dynasties_and_Ten_Kingdoms_period',
    priority: 10,
  },

  // Northern Song
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [960, 1127],
    article: 'Song_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [960, 1127],
    article: 'Song_dynasty',
    priority: 10,
  },

  // Southern Song (after Jurchen conquest of north)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1127, 1279],
    article: 'Song_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yangtze River',
    centuryRange: [1127, 1279],
    article: 'Song_dynasty',
    priority: 10,
  },

  // Jin dynasty (Jurchen - northern China)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [1115, 1234],
    article: 'Jin_dynasty_(1115–1234)',
    priority: 10,
  },

  // ========== YUAN DYNASTY (MONGOL RULE) (1271-1368) ==========

  // Yuan dynasty
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1271, 1368],
    article: 'Yuan_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yellow River Valley',
    centuryRange: [1271, 1368],
    article: 'Yuan_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yangtze River',
    centuryRange: [1271, 1368],
    article: 'Yuan_dynasty',
    priority: 10,
  },

  // ========== MING DYNASTY (1368-1644) ==========

  // Early Ming (Hongwu and Yongle emperors)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1368, 1435],
    article: 'Ming_dynasty',
    priority: 10,
  },

  // Middle Ming
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1435, 1572],
    article: 'Ming_dynasty',
    priority: 10,
  },

  // Late Ming (decline period)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1572, 1644],
    article: 'Ming_dynasty',
    priority: 10,
  },

  // ========== QING DYNASTY (MANCHU RULE) (1644-1912) ==========

  // Early Qing conquest period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1644, 1683],
    article: 'Qing_dynasty',
    priority: 10,
  },

  // High Qing - Kangxi reign
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1661, 1722],
    article: 'Kangxi_Emperor',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // High Qing - Yongzheng reign
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1722, 1735],
    article: 'Yongzheng_Emperor',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // High Qing - Qianlong reign
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1735, 1796],
    article: 'Qianlong_Emperor',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // Mid Qing decline
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1796, 1840],
    article: 'Qing_dynasty',
    priority: 10,
  },

  // Opium Wars period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1839, 1860],
    article: 'Opium_Wars',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // Taiping Rebellion era
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1850, 1864],
    article: 'Taiping_Rebellion',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Yangtze River',
    centuryRange: [1850, 1864],
    article: 'Taiping_Rebellion',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // Self-Strengthening Movement
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1861, 1895],
    article: 'Self-Strengthening_Movement',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // Late Qing reforms (after Boxer Rebellion)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'China',
    centuryRange: [1901, 1912],
    article: 'Late_Qing_reforms',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // ========== JAPAN - ANCIENT & CLASSICAL ==========

  // Jomon period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [-14000, -300],
    article: 'Jōmon_period',
    priority: 9,
  },

  // Yayoi period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [-300, 300],
    article: 'Yayoi_period',
    priority: 10,
  },

  // Kofun period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [250, 538],
    article: 'Kofun_period',
    priority: 10,
  },

  // Asuka period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [538, 710],
    article: 'Asuka_period',
    priority: 10,
  },

  // Nara period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [710, 794],
    article: 'Nara_period',
    priority: 10,
  },

  // Heian period - early
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [794, 1000],
    article: 'Heian_period',
    priority: 10,
  },

  // Heian period - late (rise of warrior class)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1000, 1185],
    article: 'Heian_period',
    priority: 10,
  },

  // ========== JAPAN - MEDIEVAL (SHOGUNATES) ==========

  // Kamakura period (first shogunate)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1185, 1333],
    article: 'Kamakura_period',
    priority: 10,
  },

  // Kamakura - Mongol invasions
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1274, 1281],
    article: 'Mongol_invasions_of_Japan',
    fallbackArticle: 'Kamakura_period',
    priority: 10,
  },

  // Muromachi period (Ashikaga shogunate)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1336, 1467],
    article: 'Muromachi_period',
    priority: 10,
  },

  // Sengoku period (Warring States)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1467, 1603],
    article: 'Sengoku_period',
    priority: 10,
  },

  // Azuchi-Momoyama period (unification under Oda/Toyotomi)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1568, 1600],
    article: 'Azuchi–Momoyama_period',
    fallbackArticle: 'Sengoku_period',
    priority: 10,
  },

  // ========== JAPAN - EDO PERIOD (TOKUGAWA SHOGUNATE) ==========

  // Early Edo (establishment and consolidation)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1603, 1651],
    article: 'Edo_period',
    priority: 10,
  },

  // Mid Edo (sakoku - national isolation)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1639, 1720],
    article: 'Sakoku',
    fallbackArticle: 'Edo_period',
    priority: 10,
  },

  // Late Edo - Genroku era (cultural flowering)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1688, 1704],
    article: 'Genroku',
    fallbackArticle: 'Edo_period',
    priority: 10,
  },

  // Late Edo - reforms period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1720, 1853],
    article: 'Edo_period',
    priority: 10,
  },

  // Bakumatsu (end of shogunate)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1853, 1868],
    article: 'Bakumatsu',
    fallbackArticle: 'Edo_period',
    priority: 10,
  },

  // ========== JAPAN - MODERN ==========

  // Meiji period (restoration and modernization)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1868, 1912],
    article: 'Meiji_period',
    priority: 10,
  },

  // Taisho period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Japan',
    centuryRange: [1912, 1926],
    article: 'Taishō_period',
    priority: 10,
  },

  // ========== KOREA - ANCIENT & THREE KINGDOMS ==========

  // Gojoseon (ancient Korea)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [-2333, -108],
    article: 'Gojoseon',
    priority: 9,
  },

  // Three Kingdoms period - Goguryeo
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [-37, 668],
    article: 'Three_Kingdoms_of_Korea',
    priority: 10,
  },

  // Unified Silla period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [668, 935],
    article: 'Unified_Silla',
    fallbackArticle: 'Silla',
    priority: 10,
  },

  // ========== KOREA - GORYEO DYNASTY ==========

  // Early Goryeo
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [918, 1170],
    article: 'Goryeo',
    priority: 10,
  },

  // Goryeo military rule period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1170, 1270],
    article: 'Goryeo',
    priority: 10,
  },

  // Goryeo under Mongol influence
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1270, 1356],
    article: 'Mongol_invasions_of_Korea',
    fallbackArticle: 'Goryeo',
    priority: 10,
  },

  // Late Goryeo
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1356, 1392],
    article: 'Goryeo',
    priority: 10,
  },

  // ========== KOREA - JOSEON DYNASTY ==========

  // Early Joseon
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1392, 1506],
    article: 'Joseon',
    priority: 10,
  },

  // Middle Joseon
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1506, 1592],
    article: 'Joseon',
    priority: 10,
  },

  // Japanese invasions (Imjin War)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1592, 1598],
    article: 'Japanese_invasions_of_Korea_(1592–1598)',
    fallbackArticle: 'Joseon',
    priority: 10,
  },

  // Late Joseon - recovery period
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1598, 1800],
    article: 'Joseon',
    priority: 10,
  },

  // Late Joseon - decline and external pressure
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1800, 1897],
    article: 'Joseon',
    priority: 10,
  },

  // Korean Empire (short-lived independence)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Korea',
    centuryRange: [1897, 1910],
    article: 'Korean_Empire',
    priority: 10,
  },

  // ========== MONGOLIA ==========

  // Mongol Empire - rise under Genghis Khan
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Mongolia',
    centuryRange: [1206, 1259],
    article: 'Mongol_Empire',
    priority: 10,
  },

  // Mongol Empire - fragmentation into khanates
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Mongolia',
    centuryRange: [1260, 1368],
    article: 'Mongol_Empire',
    fallbackArticle: 'Yuan_dynasty',
    priority: 10,
  },

  // Northern Yuan dynasty
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Mongolia',
    centuryRange: [1368, 1635],
    article: 'Northern_Yuan_dynasty',
    priority: 10,
  },

  // ========== TIBET ==========

  // Tibetan Empire
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Tibet',
    centuryRange: [618, 842],
    article: 'Tibetan_Empire',
    priority: 10,
  },

  // Era of Fragmentation
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Tibet',
    centuryRange: [842, 1240],
    article: 'Era_of_Fragmentation',
    fallbackArticle: 'History_of_Tibet',
    priority: 9,
  },

  // Tibet under Mongol/Yuan influence
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Tibet',
    centuryRange: [1240, 1354],
    article: 'Tibet_under_Yuan_rule',
    fallbackArticle: 'History_of_Tibet',
    priority: 10,
  },

  // Phagmodrupa dynasty
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Tibet',
    centuryRange: [1354, 1642],
    article: 'Phagmodrupa_dynasty',
    fallbackArticle: 'History_of_Tibet',
    priority: 10,
  },

  // Ganden Phodrang (Dalai Lama rule)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Tibet',
    centuryRange: [1642, 1720],
    article: 'Ganden_Phodrang',
    fallbackArticle: 'History_of_Tibet',
    priority: 10,
  },

  // Tibet under Qing protectorate
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Tibet',
    centuryRange: [1720, 1912],
    article: 'Tibet_under_Qing_rule',
    fallbackArticle: 'History_of_Tibet',
    priority: 10,
  },

  // ========== MANCHURIA ==========

  // Jurchen tribes (pre-Qing)
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Manchuria',
    centuryRange: [1115, 1616],
    article: 'Jin_dynasty_(1115–1234)',
    fallbackArticle: 'Jurchen_people',
    priority: 9,
  },

  // Rise of Later Jin / Early Qing
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Manchuria',
    centuryRange: [1616, 1644],
    article: 'Later_Jin_(1616–1636)',
    fallbackArticle: 'Qing_dynasty',
    priority: 10,
  },

  // Manchuria under Qing rule
  {
    culturalZone: 'EAST_ASIAN',
    region: 'Manchuria',
    centuryRange: [1644, 1912],
    article: 'Qing_dynasty',
    priority: 10,
  },
];
