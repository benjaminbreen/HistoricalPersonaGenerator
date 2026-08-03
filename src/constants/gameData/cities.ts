/**
 * constants/gameData/cities.ts - A database of historical cities for procedural generation.
 */

export interface CityDefinition {
  name: string;
  isHistorical: boolean;
  foundingYear: number;
  declineYear?: number;
  description: string; // A short, one-sentence description for the UI.
  allegianceHistory: {
    [startYear: number]: string; // Maps a start year to a faction name. e.g., { 1545: 'Spanish Empire', 1825: 'Bolivia' }
  };
  urbanDensity?: 'small' | 'moderate' | 'large' | 'massive';
  eraSpecificDensity?: {
    [era: string]: 'small' | 'moderate' | 'large' | 'massive';
  };
  populationPeak?: number;
  economicFocus?: string[];
}

// Keyed by the `name` property from a MapAreaDefinition in geography.ts
export const CITIES_DATA: { [mapAreaName: string]: CityDefinition[] } = {
  // New areas
  "Long Island": [
    {
      name: "Brooklyn",
      isHistorical: true,
      foundingYear: 1634,
      description: "A Dutch colonial settlement that grew into a major urban center.",
      allegianceHistory: {
        1634: "Dutch West India Company",
        1664: "English Colony of New York",
        1776: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['trade', 'shipping', 'agriculture']
    }
  ],
  "Texas Hill Country": [
    {
      name: "San Antonio",
      isHistorical: true,
      foundingYear: 1718,
      description: "A Spanish colonial mission town that became a major frontier city.",
      allegianceHistory: {
        1718: "Spanish Empire",
        1821: "Mexican Republic",
        1836: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['missions', 'ranching', 'military']
    },
    {
      name: "Austin",
      isHistorical: true,
      foundingYear: 1839,
      description: "Capital of the Republic of Texas, named after Stephen F. Austin.",
      allegianceHistory: {
        1839: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['government', 'education', 'trade']
    }
  ],
  "Gulf Coast Texas": [
    {
      name: "Houston",
      isHistorical: true,
      foundingYear: 1836,
      description: "A port city founded after Texas independence, gateway to the interior.",
      allegianceHistory: {
        1836: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['shipping', 'cotton', 'oil']
    },
    {
      name: "Galveston",
      isHistorical: true,
      foundingYear: 1839,
      description: "A major port city and commercial center on the Gulf Coast.",
      allegianceHistory: {
        1839: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'trade', 'immigration']
    }
  ],
  "Swahili Coast": [
    {
      name: "Kilwa",
      isHistorical: true,
      foundingYear: 957,
      declineYear: 1505,
      description: "A wealthy Swahili city-state controlling the gold trade from the interior.",
      allegianceHistory: {
        957: "Kilwa Sultanate",
        1505: "Portuguese Empire"
      },
      urbanDensity: 'large',
      populationPeak: 20000,
      economicFocus: ['gold', 'ivory', 'slaves', 'trade']
    },
    {
      name: "Mogadishu",
      isHistorical: true,
      foundingYear: 900,
      description: "An ancient port city and center of Islamic learning on the Horn of Africa.",
      allegianceHistory: {
        900: "Mogadishu Sultanate",
        1892: "Italian Somaliland"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'textiles', 'islamic_scholarship']
    }
  ],
  "Hejaz Mountains": [
    {
      name: "Mecca",
      isHistorical: true,
      foundingYear: -400,
      description: "The holiest city in Islam, birthplace of the Prophet Muhammad.",
      allegianceHistory: {
        [-400]: "Quraysh Tribe",
        630: "Rashidun Caliphate",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        1517: "Ottoman Empire",
        1924: "Kingdom of Saudi Arabia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['pilgrimage', 'trade', 'religion']
    },
    {
      name: "Medina",
      isHistorical: true,
      foundingYear: -500,
      description: "The second holiest city in Islam, where Muhammad established the first Muslim community.",
      allegianceHistory: {
        [-500]: "Local Tribes",
        622: "Islamic State of Medina",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        1517: "Ottoman Empire",
        1924: "Kingdom of Saudi Arabia"
      },
      urbanDensity: 'moderate',
      economicFocus: ['pilgrimage', 'agriculture', 'religion']
    }
  ],
  "Galicia": [
    {
      name: "Santiago de Compostela",
      isHistorical: true,
      foundingYear: 820,
      description: "A major Christian pilgrimage destination, endpoint of the Camino de Santiago.",
      allegianceHistory: {
        820: "Kingdom of Asturias",
        910: "Kingdom of León",
        1230: "Crown of Castile",
        1479: "Kingdom of Spain"
      },
      urbanDensity: 'moderate',
      economicFocus: ['pilgrimage', 'religion', 'education']
    }
  ],
  "Hokkaido": [
    {
      name: "Sapporo",
      isHistorical: true,
      foundingYear: 1868,
      description: "A modern planned city established during the Meiji Restoration.",
      allegianceHistory: {
        1868: "Empire of Japan"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['agriculture', 'brewing', 'administration']
    }
  ],
  "Potosí Region": [
    {
      name: "Potosí",
      isHistorical: true,
      foundingYear: 1545,
      description: "A legendary silver mining city, once one of the largest and richest in the Americas.",
      allegianceHistory: {
        1545: "Spanish Empire",
        1825: "Republic of Bolivia",
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'small'
      },
      populationPeak: 160000,
      economicFocus: ['mining', 'silver', 'trade']
    }
  ],
  "Thames Estuary": [
  {
    name: "Londinium",
    isHistorical: true,
    foundingYear: 47,
    declineYear: 410,
    description: "A major commercial center of Roman Britain, established after the conquest of 43 AD.",
    allegianceHistory: {
      47: "Roman Empire"
    },
    urbanDensity: "moderate",
    populationPeak: 60000,
    economicFocus: ["grain_trade", "pottery", "administration", "military_supplies"]
  },
  {
    name: "London",
    isHistorical: true,
    foundingYear: 411,
    description: "A resilient metropolis that has been a center of trade, finance, and culture for centuries.",
    allegianceHistory: {
      411: "Anglo-Saxons",
      1066: "Kingdom of England",
      1707: "British Empire"
    },
    urbanDensity: "large",
    eraSpecificDensity: {
      "prehistoric": "small",
      "ancient": "small",
      "medieval": "moderate",
      "early_modern": "large",
      "modern": "massive"
    },
    populationPeak: 7900000,
    economicFocus: ["finance", "textiles", "shipping", "government"]
  }
],
  "Edinburgh": [
    {
      name: "Edinburgh",
      isHistorical: true,
      foundingYear: 1124,
      description: "The historic capital of Scotland, dominated by its ancient castle on a volcanic crag.",
      allegianceHistory: {
        1124: "Kingdom of Scotland",
        1707: "Kingdom of Great Britain",
        1900: "United Kingdom"
      }
    }
  ],
  "Leinster Plain": [
  {
    name: "Dyflin",
    isHistorical: true,
    foundingYear: 841,
    declineYear: 1171,
    description: "A major Viking longphort and center of the Norse Kingdom of Dublin.",
    allegianceHistory: {
      841: "Norse Kingdom of Dublin"
    },
    urbanDensity: "small",
    populationPeak: 10000,
    economicFocus: ["slave_trade", "furs", "fish", "timber"]
  },
  {
    // Merged with a second "Dublin" entry that used to sit under the
    // orphaned "Irish Sea" key (no such map area exists); that copy carried
    // the entry through to Irish independence, which this one lacked.
    name: "Dublin",
    isHistorical: true,
    foundingYear: 1172,
    description: "The center of English and later British power in Ireland for centuries.",
    allegianceHistory: {
      1172: "Lordship of Ireland (English rule)",
      1542: "Kingdom of Ireland",
      1801: "United Kingdom",
      1922: "Irish Free State"
    },
    urbanDensity: "moderate",
    populationPeak: 200000,
    economicFocus: ["textiles", "beer_brewing", "government", "shipping"]
  }
],
  "Oxfordshire": [
    {
      name: "Oxford",
      isHistorical: true,
      foundingYear: 912,
      description: "A Saxon town that grew into one of the world's most prestigious centers of learning.",
      allegianceHistory: {
        912: "Kingdom of Wessex",
        1066: "Kingdom of England",
        1707: "United Kingdom"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'modern': 'moderate'
      },
      economicFocus: ['education', 'religion', 'publishing', 'trade']
    }
  ],
  "Boston Harbor": [
    {
      name: "Boston",
      isHistorical: true,
      foundingYear: 1630,
      description: "The Puritan 'City upon a Hill' that became the cradle of the American Revolution.",
      allegianceHistory: {
        1630: "Massachusetts Bay Colony (English)",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: { 'modern': 'large' },
      economicFocus: ['shipping', 'trade', 'education', 'rebellion']
    }
  ],
  "Delaware River Valley": [
    {
      name: "Philadelphia",
      isHistorical: true,
      foundingYear: 1682,
      description: "The city of brotherly love, the first capital of the United States and a center of enlightenment thought.",
      allegianceHistory: {
        1682: "Colony of Pennsylvania (English)",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large'
      },
      economicFocus: ['government', 'trade', 'philosophy', 'medicine']
    }
  ],
  "Lower Mississippi Delta": [
    {
      name: "New Orleans",
      isHistorical: true,
      foundingYear: 1718,
      description: "A vibrant crescent city controlling the mouth of the Mississippi, a melting pot of cultures.",
      allegianceHistory: {
        1718: "New France",
        1763: "Spanish Empire",
        1803: "United States"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'trade', 'sugar', 'cotton']
    }
  ],
  "Great Lakes Shoreline": [
    {
      name: "Chicago",
      isHistorical: true,
      foundingYear: 1833,
      description: "A frontier fort that became the great industrial and transportation hub of the American Midwest.",
      allegianceHistory: {
        1833: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: { 'modern': 'massive' },
      economicFocus: ['railways', 'meatpacking', 'industry', 'finance']
    },
    {
      name: "Detroit",
      isHistorical: true,
      foundingYear: 1701,
      description: "A French fur trading post that became the motor city of America.",
      allegianceHistory: {
        1701: "New France",
        1760: "British Empire",
        1796: "United States"
      }
    }
  ],
  "Cajamarca Highlands": [
    {
      // The Cajamarca ceramic sequence's early-phase start date is debated
      // in the literature (estimates range from several centuries BCE to
      // roughly 200 CE); the later, more conservative date is used here.
      // No declineYear: unlike Tenochtitlan or Cuzco, Cajamarca was not
      // destroyed at conquest and remains an inhabited regional city today.
      name: "Cajamarca",
      isHistorical: true,
      foundingYear: 200,
      description: "Highland center of the Cajamarca culture, later an Inca provincial capital where Atahualpa was seized by Pizarro's expedition.",
      allegianceHistory: {
        200: "Cajamarca Culture",
        1465: "Inca Empire",
        1532: "Spanish Empire",
        1821: "Republic of Peru"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      economicFocus: ['agriculture', 'textiles', 'administration']
    },
    {
      name: "Lima",
      isHistorical: true,
      foundingYear: 1535,
      description: "The City of Kings, the proud and wealthy capital of the vast Viceroyalty of Peru.",
      allegianceHistory: {
        1535: "Spanish Empire",
        1821: "Republic of Peru"
      },
      urbanDensity: 'large',
      economicFocus: ['government', 'silver', 'trade', 'education']
    }
  ],
  "St. Lawrence River": [
    {
        name: "Quebec City",
        isHistorical: true,
        foundingYear: 1608,
        description: "The Gibraltar of North America, the fortified capital of New France.",
        allegianceHistory: {
            1608: "New France",
            1763: "British Empire",
            1867: "Canada"
        },
        urbanDensity: 'small',
        eraSpecificDensity: { 'modern': 'moderate' },
        economicFocus: ['fur_trade', 'military', 'government']
    },
    {
      name: "Montreal",
      isHistorical: true,
      foundingYear: 1642,
      description: "French colonial trading post and gateway to the North American interior.",
      allegianceHistory: {
        1642: "New France",
        1760: "British North America",
        1867: "Dominion of Canada"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['fur trade', 'shipping', 'administration', 'crafts', 'agriculture']
    }
  ],
  "Brandenburg Plain": [
    {
      name: "Berlin",
      isHistorical: true,
      foundingYear: 1237,
      description: "A trading town that became the capital of Prussia and a unified German Empire.",
      allegianceHistory: {
        1237: "Margraviate of Brandenburg",
        1415: "Electorate of Brandenburg",
        1701: "Kingdom of Prussia",
        1871: "German Empire"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: { 'modern': 'massive' },
      economicFocus: ['government', 'military', 'industry', 'science']
    },
    {
      name: "Lübeck",
      isHistorical: true,
      foundingYear: 1143,
      description: "The queen of the Hanseatic League, a free imperial city that dominated Baltic trade for centuries.",
      allegianceHistory: {
        1143: "County of Holstein",
        1226: "Free Imperial City (Hanseatic League)",
        1871: "German Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'salt', 'shipping', 'law']
    }
  ],
  "Hamburg Coast": [
    {
        name: "Hamburg",
        isHistorical: true,
        foundingYear: 808,
        description: "A powerful free city and a leading member of the Hanseatic League, dominating North Sea trade.",
        allegianceHistory: {
            808: "Carolingian Empire",
            1189: "Holy Roman Empire (Free City)",
            1510: "Hanseatic League"
        },
        urbanDensity: 'moderate',
        eraSpecificDensity: {
            'modern': 'large'
        },
        economicFocus: ['trade', 'shipping', 'brewing']
    }
  ],
  // No entry for the "3000 BCE-500 CE" band: this is a genuine gap, not an
  // oversight. There is no attested urban settlement anywhere near
  // Novgorod before the Viking-age emporium era; the earliest urbanization
  // here is Novgorod itself (859 CE, in the 500-1500 band below).
  "Novgorod Woods": [
    {
        name: "St. Petersburg",
        isHistorical: true,
        foundingYear: 1703,
        description: "Tsar Peter's window to the West, the magnificent imperial capital built on a swamp.",
        allegianceHistory: {
            1703: "Tsardom of Russia",
            1721: "Russian Empire"
        },
        urbanDensity: 'large',
        economicFocus: ['government', 'navy', 'enlightenment', 'architecture']
    },
    {
        name: "Novgorod",
        isHistorical: true,
        foundingYear: 859,
        description: "A powerful merchant republic of the Rus, and a key eastern outpost of the Hanseatic League.",
        allegianceHistory: {
            859: "Novgorod Republic",
            1478: "Grand Duchy of Moscow"
        },
        urbanDensity: 'moderate',
        economicFocus: ['trade', 'furs', 'wax', 'republicanism']
    }
  ],
  
   "Paris Basin": [
    {
      name: "Lutetia Parisiorum",
      isHistorical: true,
      foundingYear: -52, // 52 BC
      declineYear: 360,
      description: "A Gallo-Roman town on the Seine, later to become the capital of France.",
      allegianceHistory: {
        "-52": "Roman Empire"
      }
    },
    {
      name: "Paris",
      isHistorical: true,
      foundingYear: 361,
      populationPeak: 140000,
      description: "The political and cultural heart of France, a center of arts, philosophy, and revolution.",
      allegianceHistory: {
        361: "Franks",
        987: "Kingdom of France",
        1792: "French Republic"
      }
    }
  ],
  "Marseille Coast": [
    {
      name: "Massalia",
      isHistorical: true,
      foundingYear: -600,
      declineYear: 49,
      description: "An ancient Greek colony and major trading port on the Mediterranean coast of Gaul.",
      allegianceHistory: {
        [-600]: "Greek Colony of Phocaea",
        [-49]: "Roman Republic"
      }
    },
    {
      name: "Marseille",
      isHistorical: true,
      foundingYear: 50,
      description: "France's oldest city and a vital port connecting Europe to North Africa and the Levant.",
      allegianceHistory: {
        50: "Roman Empire",
        481: "Kingdom of the Franks",
        1481: "Kingdom of France"
      }
    }
  ],
  "Lisbon Coast": [
    {
      name: "Olisipo",
      isHistorical: true,
      foundingYear: -205,
      declineYear: 711,
      description: "A major Roman city in Lusitania, prized for its excellent harbor at the mouth of the Tagus.",
      allegianceHistory: {
        [-205]: "Roman Republic",
        [-27]: "Roman Empire",
        409: "Suebi Kingdom",
        585: "Visigothic Kingdom"
      }
    },
    {
      name: "Lisbon",
      isHistorical: true,
      // Olisipo above covers the Roman city through 711. The settlement continued
      // under Muslim rule as al-Ushbuna and became Lisboa after 1147, so Lisbon
      // picks up where Olisipo leaves off rather than overlapping it. The old
      // -1200 date was the legendary Phoenician founding; the archaeological
      // evidence for a Phoenician presence here is 8th century BCE at the earliest.
      foundingYear: 711,
      description: "Atlantic gateway and capital of the Portuguese maritime empire.",
      allegianceHistory: {
        "-1200": "Phoenician Colonies",
        "-205": "Roman Republic",
        711: "Umayyad Caliphate",
        1147: "Kingdom of Portugal",
        1580: "Iberian Union",
        1640: "Kingdom of Portugal"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'moderate',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'navigation', 'spices', 'gold', 'shipbuilding']
    }
  ],
  "Andalusian Plain": [
    {
      name: "Córdoba",
      isHistorical: true,
      foundingYear: 169,
      description: "The brilliant capital of the Caliphate of Córdoba, once the largest city in Europe.",
      allegianceHistory: {
        169: "Roman Empire",
        711: "Umayyad Caliphate",
        929: "Caliphate of Córdoba",
        1236: "Kingdom of Castile"
      }
    },
    {
      name: "Seville",
      isHistorical: true,
      foundingYear: -800,
      description: "Gateway to the Americas during the Spanish colonial era and major Andalusian city.",
      allegianceHistory: {
        "-800": "Phoenician Colonies",
        "-206": "Roman Republic",
        412: "Visigothic Kingdom",
        712: "Umayyad Caliphate",
        1248: "Kingdom of Castile",
        1516: "Spanish Empire"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'shipbuilding', 'colonial administration', 'textiles', 'agriculture']
    },
    {
      name: "Cordoba",
      isHistorical: true,
      foundingYear: -169,
      description: "Capital of the Umayyad Caliphate of Córdoba and jewel of medieval Europe.",
      allegianceHistory: {
        "-169": "Roman Republic",
        711: "Umayyad Caliphate",
        1031: "Taifa of Córdoba",
        1236: "Kingdom of Castile"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'massive',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 450000,
      economicFocus: ['education', 'philosophy', 'crafts', 'agriculture', 'trade']
    },
    {
      // Moved from the orphaned "Iberian Peninsula" key — that name is a
      // region, not a map area; Granada sits in the Andalusian plain.
      name: "Granada",
      isHistorical: true,
      foundingYear: -500,
      description: "The last jewel of Al-Andalus, famed for its magnificent Alhambra palace.",
      allegianceHistory: {
        756: "Emirate of Córdoba",
        1238: "Emirate of Granada (Nasrid Dynasty)",
        1492: "Kingdom of Castile"
      },
      urbanDensity: 'moderate',
      economicFocus: ['silk', 'agriculture', 'poetry', 'architecture']
    }
  ],
  "Toledo Plateau": [
    {
      name: "Toledo",
      isHistorical: true,
      foundingYear: -192,
      description: "The ancient city of three cultures, where Christian, Muslim, and Jewish traditions flourished together.",
      allegianceHistory: {
        [-192]: "Roman Republic",
        418: "Visigothic Kingdom",
        711: "Umayyad Caliphate",
        1085: "Kingdom of Castile"
      }
    }
  ],
  "Roman Campagna": [
    {
      name: "Rome",
      isHistorical: true,
      foundingYear: -753,
      description: "The Eternal City, capital of a vast empire and the heart of Western civilization.",
      allegianceHistory: {
        [-753]: "Roman Kingdom",
        [-509]: "Roman Republic",
        [-27]: "Roman Empire",
        756: "Papal States",
        1871: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'prehistoric': 'small',
        'ancient': 'massive',
        'medieval': 'moderate',
        'early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 1000000,
      economicFocus: ['government', 'trade', 'religion', 'military']
    }
  ],
  "Venetian Lagoon": [
    {
      name: "Venice",
      isHistorical: true,
      foundingYear: 421,
      description: "Maritime republic and trading empire connecting Europe with the Orient.",
      allegianceHistory: {
        421: "Byzantine Empire",
        697: "Republic of Venice",
        1797: "Austrian Empire",
        1805: "Kingdom of Italy (Napoleonic)",
        1815: "Austrian Empire",
        1866: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 180000,
      economicFocus: ['trade', 'navigation', 'glass', 'silk', 'spices']
    }
  ],
  "Florence Hills": [
    {
      name: "Florence",
      isHistorical: true,
      foundingYear: 59,
      description: "The birthplace of the Renaissance, where art and banking created a new vision of human possibility.",
      allegianceHistory: {
        59: "Roman Empire",
        1115: "Republic of Florence",
        1532: "Duchy of Florence",
        1569: "Grand Duchy of Tuscany"
      }
    }
  ],
  "Bay of Naples": [
    {
      name: "Naples",
      isHistorical: true,
      foundingYear: -600,
      description: "Major Italian kingdom capital and Mediterranean trading power.",
      allegianceHistory: {
        "-600": "Greek Colonies",
        326: "Roman Republic",
        1139: "Kingdom of Sicily",
        1282: "Kingdom of Naples",
        1503: "Spanish Empire",
        1734: "Kingdom of the Two Sicilies",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 450000,
      economicFocus: ['trade', 'silk', 'government', 'arts', 'maritime']
    },
    {
      name: "Palermo",
      isHistorical: true,
      foundingYear: -734,
      description: "Crossroads of Norman, Arab, and Byzantine cultures in the Mediterranean.",
      allegianceHistory: {
        "-734": "Phoenician Colonies",
        "-254": "Roman Republic",
        535: "Byzantine Empire",
        831: "Emirate of Sicily",
        1072: "County of Sicily",
        1130: "Kingdom of Sicily",
        1282: "Kingdom of Sicily (Aragonese)",
        1816: "Kingdom of Two Sicilies",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 250000,
      economicFocus: ['trade', 'administration', 'textiles', 'agriculture', 'crafts']
    }
  ],
  "Rhine Valley": [
     {
      name: "Colonia Claudia Ara Agrippinensium",
      isHistorical: true,
      foundingYear: 50,
      declineYear: 462,
      description: "A major Roman provincial capital on the Rhine frontier, a center of trade and military power.",
      allegianceHistory: {
        50: "Roman Empire"
      }
    },
    {
      name: "Cologne",
      isHistorical: true,
      foundingYear: 463,
      description: "A powerful medieval archbishopric and a free imperial city, a key node in the Hanseatic League.",
      allegianceHistory: {
        463: "Frankish Kingdom",
        953: "Holy Roman Empire",
        1815: "Kingdom of Prussia"
      }
    },
    {
      // Moved from the orphaned "Central Europe" key — that name is a
      // region, not a map area. Frankfurt sits on the Main near its
      // confluence with the Rhine.
      name: "Frankfurt",
      isHistorical: true,
      foundingYear: 794,
      description: "Free Imperial city and financial center where German emperors were crowned.",
      allegianceHistory: {
        794: "Frankish Empire",
        962: "Holy Roman Empire",
        1806: "Confederation of the Rhine",
        1815: "German Confederation",
        1871: "German Empire",
        1945: "Allied Occupation",
        1949: "Federal Republic of Germany"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['banking', 'trade', 'imperial_elections']
    }
  ],
  "Danube Bend": [
    {
      name: "Budapest",
      isHistorical: true,
      foundingYear: 1873,
      description: "Twin cities of Buda and Pest, capital of Hungary and Danube trade center.",
      allegianceHistory: {
        106: "Roman Empire",
        896: "Hungarian Principality",
        1000: "Kingdom of Hungary",
        1541: "Ottoman Empire",
        1686: "Habsburg Monarchy",
        1867: "Austro-Hungarian Empire",
        1918: "Hungary"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'government', 'milling', 'textiles', 'river_transport']
    }
  ],
  "Vienna Basin": [
    {
      name: "Vienna",
      isHistorical: true,
      // Roman Vindobona: a garrison from the early 1st century CE and a legionary
      // fortress from c. 97. The old 500 date began the city at the post-Roman
      // Germanic settlement and silently erased the Roman centuries.
      foundingYear: 15,
      description: "Habsburg capital and imperial seat, gateway between East and West.",
      allegianceHistory: {
        15: "Roman Empire",
        500: "Germanic Tribes",
        976: "Margraviate of Austria",
        1156: "Duchy of Austria",
        1278: "Habsburg Dynasty",
        1804: "Austrian Empire",
        1867: "Austro-Hungarian Empire",
        1918: "Austria"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['government', 'banking', 'arts', 'music', 'imperial_administration']
    }
  ],
  "Bohemian Plateau": [
    {
      // Merged with a second "Prague" entry that used to sit under the
      // orphaned "Central Europe" key (a region name, not a map area); it
      // recorded the 1939-45 Nazi occupation, which this entry lacked.
      name: "Prague",
      isHistorical: true,
      foundingYear: 885,
      description: "Capital of Bohemia and Holy Roman Empire, city of a hundred spires.",
      allegianceHistory: {
        885: "Great Moravian Empire",
        1212: "Kingdom of Bohemia",
        1526: "Habsburg Monarchy",
        1804: "Austrian Empire",
        1867: "Austro-Hungarian Empire",
        1918: "Czechoslovakia",
        1939: "Nazi Germany",
        1945: "Czechoslovakia",
        1993: "Czech Republic"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['government', 'brewing', 'crafts', 'silver_mining', 'glass', 'alchemy']
    }
  ],
   "Bosporus": [
    {
      name: "Byzantium",
      isHistorical: true,
      foundingYear: -657,
      declineYear: 329,
      description: "An ancient Greek colony strategically located on the strait separating Europe and Asia.",
      allegianceHistory: {
        [-657]: "Greek Colony of Megara"
      }
    },
    {
      name: "Constantinople",
      isHistorical: true,
      foundingYear: 330,
      declineYear: 1453,
      description: "The magnificent capital of the Eastern Roman (Byzantine) Empire for over a thousand years.",
      allegianceHistory: {
        330: "Roman Empire",
        395: "Byzantine Empire"
      }
    },
    {
        name: "Istanbul",
        isHistorical: true,
        foundingYear: 1454,
        description: "The imperial capital of the powerful Ottoman Empire, a bridge between civilizations.",
        allegianceHistory: {
            1454: "Ottoman Empire",
            1923: "Republic of Turkey"
        }
    }
  ],
  "Thracian Plain": [
    {
      name: "Adrianople",
      isHistorical: true,
      foundingYear: 125,
      description: "A strategic fortress city commanding the approaches to Constantinople.",
      allegianceHistory: {
        125: "Roman Empire",
        395: "Byzantine Empire",
        1362: "Ottoman Empire"
      }
    }
  ],
  "Athens Basin": [
    {
      name: "Athens",
      isHistorical: true,
      foundingYear: -3000,
      description: "Birthplace of democracy and center of ancient Greek civilization.",
      allegianceHistory: {
        "-3000": "Mycenaean Civilization",
        "-1200": "Dark Age Greece",
        "-800": "Archaic Athens",
        "-508": "Athenian Democracy",
        "-146": "Roman Province of Achaea",
        395: "Byzantine Empire",
        1458: "Ottoman Empire",
        1833: "Kingdom of Greece"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'large',
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 250000,
      economicFocus: ['philosophy', 'trade', 'education', 'crafts', 'democracy']
    },
    {
      name: "Thessalonica",
      isHistorical: true,
      foundingYear: -315,
      description: "Byzantine Empire's second city and gateway to the Balkans.",
      allegianceHistory: {
        [-315]: "Macedonian Kingdom",
        [-146]: "Roman Republic",
        395: "Byzantine Empire",
        1430: "Ottoman Empire",
        1912: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'silk', 'jewish_commerce', 'byzantine_culture']
    }
  ],
  "Crete": [
    {
      name: "Knossos",
      isHistorical: true,
      foundingYear: -2000,
      declineYear: -1100,
      description: "The legendary palace-city of the Minoan civilization, Europe's first great urban culture.",
      allegianceHistory: {
        [-2000]: "Minoan Civilization"
      }
    },
    {
      name: "Heraklion",
      isHistorical: true,
      foundingYear: -2000,
      description: "Capital near ancient Knossos, center of Minoan civilization.",
      allegianceHistory: {
        [-2000]: "Minoan Civilization",
        [-1100]: "Mycenaean Greeks",
        [-67]: "Roman Empire",
        395: "Byzantine Empire",
        824: "Emirate of Crete",
        961: "Byzantine Empire",
        1204: "Republic of Venice",
        1669: "Ottoman Empire",
        1898: "Cretan State",
        1913: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      populationPeak: 180000,
      economicFocus: ['tourism', 'archaeology', 'shipping', 'agriculture']
    },
    {
      name: "Chania",
      isHistorical: true,
      foundingYear: -1500,
      description: "Venetian harbor city, one of the Mediterranean's most beautiful ports.",
      allegianceHistory: {
        [-1500]: "Minoan Settlement",
        [-500]: "Greek City-State",
        [-67]: "Roman Empire",
        395: "Byzantine Empire",
        1252: "Republic of Venice",
        1645: "Ottoman Empire",
        1898: "Cretan State",
        1913: "Kingdom of Greece"
      },
      urbanDensity: 'small',
      populationPeak: 110000,
      economicFocus: ['tourism', 'olive oil', 'shipping', 'crafts']
    }
  ],
  "Moscow Basin": [
      {
        name: "Moscow",
        isHistorical: true,
        foundingYear: 1147,
        description: "A small settlement that grew into the center of the Grand Duchy of Moscow and the heart of the Russian Empire.",
        allegianceHistory: {
            1147: "Principality of Vladimir-Suzdal",
            1283: "Grand Duchy of Moscow",
            1547: "Tsardom of Russia",
            1721: "Russian Empire"
        }
      }
  ],
  "Dnieper River Valley": [
    {
      name: "Kiev",
      isHistorical: true,
      foundingYear: 482,
      description: "Mother of Russian cities and ancient capital of Kievan Rus.",
      allegianceHistory: {
        482: "Slavic Tribes",
        882: "Kievan Rus",
        1240: "Golden Horde",
        1362: "Grand Duchy of Lithuania",
        1569: "Polish-Lithuanian Commonwealth",
        1654: "Tsardom of Russia",
        1917: "Ukrainian People's Republic",
        1922: "Soviet Union",
        1991: "Ukraine"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'religion', 'crafts', 'agriculture', 'education']
    }
  ],
  "Volga Bend": [
    {
      name: "Kazan",
      isHistorical: true,
      foundingYear: 1005,
      description: "The capital of the Tatar Khanate, a powerful successor state to the Golden Horde.",
      allegianceHistory: {
        1005: "Volga Bulgaria",
        1438: "Kazan Khanate",
        1552: "Tsardom of Russia"
      }
    }
  ],
  "Rhine–Meuse Delta": [
    {
      name: "Amsterdam",
      isHistorical: true,
      foundingYear: 1275,
      description: "Capital of the Dutch Golden Age and center of global commerce.",
      allegianceHistory: {
        1275: "County of Holland",
        1506: "Habsburg Netherlands",
        1581: "Dutch Republic",
        1795: "Batavian Republic",
        1815: "Kingdom of the Netherlands"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 220000,
      economicFocus: ['trade', 'banking', 'shipbuilding', 'diamonds', 'brewing']
    }
  ],

  // MESOAMERICA AND SOUTH AMERICA
  "Valley of Mexico": [
    {
      // Cuicuilco's destruction date is disputed -- estimates for the
      // Xitle volcanic eruption that buried it range across the 1st-4th
      // centuries CE. Bounded here at the point Teotihuacan's rise begins
      // to eclipse it as the valley's dominant center, rather than at the
      // (uncertain) eruption date itself.
      name: "Cuicuilco",
      isHistorical: true,
      foundingYear: -700,
      declineYear: -100,
      description: "The valley's first major urban center, built around a great circular stepped pyramid, until eclipsed by the rising city of Teotihuacan.",
      allegianceHistory: {
        [-700]: "Cuicuilco Chiefdom"
      },
      urbanDensity: 'small',
      economicFocus: ['agriculture', 'obsidian', 'religion']
    },
    {
      name: "Teotihuacan",
      isHistorical: true,
      foundingYear: -100,
      declineYear: 550,
      description: "A vast planned metropolis of pyramids and avenues, the largest city in the pre-Columbian Americas at its height.",
      allegianceHistory: {
        [-100]: "Teotihuacan Civilization"
      },
      urbanDensity: 'massive',
      populationPeak: 125000,
      economicFocus: ['obsidian', 'trade', 'religion', 'monumental_architecture']
    },
    {
        name: "Tenochtitlan",
        isHistorical: true,
        foundingYear: 1325,
        declineYear: 1521,
        description: "The magnificent island capital of the Aztec Empire, a vast metropolis of canals and pyramids.",
        allegianceHistory: {
            1325: "Aztec Empire"
        },
        urbanDensity: 'massive',
        populationPeak: 200000,
        economicFocus: ['government', 'trade', 'religion', 'military', 'agriculture']
    },
    {
        name: "Mexico City",
        isHistorical: true,
        foundingYear: 1522,
        description: "Built on the ruins of the Aztec capital, it became the center of the vast Viceroyalty of New Spain.",
        allegianceHistory: {
            1522: "Spanish Empire",
            1821: "Mexican Empire",
            1823: "United Mexican States"
        },
        urbanDensity: 'large',
        eraSpecificDensity: {
          'RENAISSANCE_EARLY_MODERN': 'large',
          'INDUSTRIAL_ERA': 'large',
          'MODERN_ERA': 'massive',
          'FUTURE_ERA': 'massive'
        },
        populationPeak: 21500000,
        economicFocus: ['government', 'trade', 'manufacturing', 'services']
    }
  ],
  "Yucatán Peninsula": [
    {
      // Merged with a richer "Chichen Itza" entry, plus two new cities, that
      // used to sit under the orphaned "Yucatan Peninsula" key — a
      // diacritic mismatch with this, the real area name.
      name: "Chichen Itza",
      isHistorical: true,
      foundingYear: 600,
      declineYear: 1200,
      description: "Major Maya city with the famous pyramid of Kukulkan.",
      allegianceHistory: {
        600: "Maya City-State",
        900: "Toltec-Maya Fusion"
      },
      urbanDensity: 'large',
      populationPeak: 50000,
      economicFocus: ['pilgrimage', 'trade', 'astronomy', 'ball game']
    },
    {
      name: "Mérida",
      isHistorical: true,
      foundingYear: 1542,
      description: "Spanish colonial city built atop Maya T'ho, the 'White City'.",
      allegianceHistory: {
        [-600]: "Maya City of T'ho",
        1542: "Spanish Empire",
        1821: "Mexican Empire",
        1823: "Republic of Yucatan",
        1848: "Mexico"
      },
      urbanDensity: 'moderate',
      populationPeak: 1000000,
      economicFocus: ['henequen', 'tourism', 'commerce', 'culture']
    },
    {
      name: "Cancún",
      isHistorical: false,
      foundingYear: 1970,
      description: "Modern resort city built from scratch on Caribbean coast.",
      allegianceHistory: {
        1970: "Mexico"
      },
      urbanDensity: 'moderate',
      populationPeak: 900000,
      economicFocus: ['tourism', 'hospitality', 'entertainment']
    }
  ],
  "Oaxaca Highlands": [
    {
      name: "Monte Albán",
      isHistorical: true,
      foundingYear: -500,
      declineYear: 750,
      description: "The mountain capital of the Zapotec civilization, commanding the valley with its terraced temples.",
      allegianceHistory: {
        [-500]: "Zapotec Civilization"
      }
    }
  ],

  // NORTH AMERICA
  "Cahokia Mounds": [
    {
      name: "Cahokia",
      isHistorical: true,
      foundingYear: 1050,
      declineYear: 1350,
      description: "The largest pre-Columbian settlement north of Mexico, a Mississippian metropolis of earthen mounds.",
      allegianceHistory: {
        1050: "Mississippian Culture"
      }
    }
  ],
  "Hudson River Valley": [
    {
      name: "New Amsterdam",
      isHistorical: true,
      foundingYear: 1624,
      declineYear: 1664,
      description: "The Dutch trading post that would become the greatest city of the New World.",
      allegianceHistory: {
        1624: "Dutch Empire"
      }
    },
    {
      name: "New York City",
      isHistorical: true,
      foundingYear: 1665,
      description: "The bustling commercial heart of North America, gateway to the continent's riches.",
      allegianceHistory: {
        1665: "British Empire",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'RENAISSANCE_EARLY_MODERN': 'small',
        'INDUSTRIAL_ERA': 'large',
        'MODERN_ERA': 'massive',
        'FUTURE_ERA': 'massive'
      },
      populationPeak: 12336000,
      economicFocus: ['finance', 'trade', 'shipping', 'manufacturing', 'services']
    }
  ],
  "Chesapeake Bay": [
    {
      name: "Jamestown",
      isHistorical: true,
      // Bounded at 1699, when the statehouse burned and the colonial capital
      // moved to Williamsburg; Jamestown itself was practically abandoned
      // soon after. Left open-ended, a persona born here in 1967 was, per
      // this data, born in a going concern that had in fact emptied out
      // nearly three centuries earlier.
      foundingYear: 1607,
      declineYear: 1699,
      description: "The first permanent English settlement in America, birthplace of colonial Virginia.",
      allegianceHistory: {
        1607: "British Empire",
        1776: "United States"
      }
    },
    {
      name: "Williamsburg",
      isHistorical: true,
      foundingYear: 1699,
      description: "The colonial capital that succeeded Jamestown, seat of Virginia's government through the Revolution.",
      allegianceHistory: {
        1699: "British Empire",
        1776: "United States"
      },
      urbanDensity: 'small',
      economicFocus: ['government', 'education', 'crafts', 'tobacco']
    }
  ],


  "Cuzco Valley": [
    {
        name: "Cusco",
        isHistorical: true,
        foundingYear: 1100,
        description: "The sacred and political capital of the vast Inca Empire, nestled high in the Andes.",
        allegianceHistory: {
            1100: "Kingdom of Cusco",
            1438: "Inca Empire",
            1533: "Spanish Empire",
            1821: "Peru"
        }
    }
  ],
  "Lake Titicaca Basin": [
    {
      name: "Tiwanaku",
      isHistorical: true,
      foundingYear: 300,
      declineYear: 1000,
      description: "The spiritual and administrative center of a great Andean empire, master of high-altitude agriculture.",
      allegianceHistory: {
        300: "Tiwanaku Empire"
      }
    }
  ],
  "Rio de Janeiro Bay": [
    {
      name: "Rio de Janeiro",
      isHistorical: true,
      foundingYear: 1565,
      description: "The marvelous city between mountains and sea, jewel of Portuguese America.",
      allegianceHistory: {
        1565: "Portuguese Empire",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'RENAISSANCE_EARLY_MODERN': 'small',
        'INDUSTRIAL_ERA': 'large',
        'MODERN_ERA': 'massive',
        'FUTURE_ERA': 'massive'
      },
      populationPeak: 6036000,
      economicFocus: ['trade', 'shipping', 'manufacturing']
    }
  ],
  "São Paulo Plateau": [
    {
      name: "São Paulo",
      isHistorical: true,
      foundingYear: 1554,
      description: "A Jesuit mission that grew into the industrial powerhouse of South America.",
      allegianceHistory: {
        1554: "Portuguese Empire",
        1822: "Empire of Brazil"
     },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'RENAISSANCE_EARLY_MODERN': 'small',
        'INDUSTRIAL_ERA': 'large',
        'MODERN_ERA': 'massive',
        'FUTURE_ERA': 'massive'
      },
      populationPeak: 15336000,
      economicFocus: ['finance', 'trade', 'manufacturing', 'services']
    }
  ],
  "Pampas Grasslands": [
    {
      name: "Buenos Aires",
      isHistorical: true,
      foundingYear: 1536,
      description: "The port of good winds, gateway to the riches of the Río de la Plata.",
      allegianceHistory: {
        1536: "Spanish Empire",
        1810: "United Provinces of the Río de la Plata",
        1861: "Argentine Republic"
      }
    }
  ],

// AFRICA
  // No entry for the "pre-3000 BCE" band: left open deliberately. There is
  // no attested urban settlement on the Fez plateau that early -- the
  // region's first city is Volubilis below, roughly two and a half
  // thousand years later.
  "Fez Plateau": [
    {
      // Volubilis, immediately adjacent to the later Fez: Idris I based
      // his court there in 788 before his son Idris II founded Fez proper
      // in 808/9, so it is bounded here right at this file's existing Fez
      // founding year.
      name: "Volubilis",
      isHistorical: true,
      foundingYear: -300,
      declineYear: 789,
      description: "A Berber town that became the Roman-era capital of Mauretania, and Idris I's base before the founding of Fez.",
      allegianceHistory: {
        [-300]: "Mauretanian Kingdom",
        44: "Roman Empire",
        285: "Berber Kingdoms",
        788: "Idrisid Dynasty"
      },
      urbanDensity: 'small',
      economicFocus: ['agriculture', 'olive_oil', 'trade']
    },
    {
      name: "Fez",
      isHistorical: true,
      foundingYear: 789,
      description: "A spiritual and cultural capital of Morocco, home to one of the world’s oldest universities.",
      allegianceHistory: {
        789: "Idrisid Dynasty",
        1040: "Almoravid Dynasty",
        1147: "Almohad Caliphate",
        1271: "Marinid Dynasty",
        1666: "Alaouite Dynasty"
      },
      urbanDensity: 'large',
      populationPeak: 400000,
      economicFocus: ['BOOK_MANUSCRIPTS', 'LEATHERWORK', 'CERAMICS', 'CARPETS']
    }
  ],
  "Timbuktu Basin": [
    {
      name: "Timbuktu",
      isHistorical: true,
      foundingYear: 1100,
      description: "Legendary center of trans-Saharan trade and Islamic learning.",
      allegianceHistory: {
        1100: "Tuareg Tribes",
        1324: "Mali Empire",
        1468: "Songhai Empire",
        1591: "Moroccan Pashalik",
        1893: "French Sudan",
        1960: "Mali"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 100000,
      economicFocus: ['trade', 'salt', 'gold', 'education', 'manuscripts']
    }
  ],
  "Niger Bend": [
    {
      name: "Gao",
      isHistorical: true,
      foundingYear: 700,
      description: "The imperial capital of the Songhai Empire, controlling the great bend of the Niger River.",
      allegianceHistory: {
        700: "Local Kingdoms",
        1009: "Kingdom of Gao",
        1464: "Songhai Empire",
        1591: "Moroccan Sultanate"
      }
    }
  ],
  "Ashanti Forest": [
    {
      name: "Kumasi",
      isHistorical: true,
      foundingYear: 1695,
      description: "The golden stool capital of the mighty Ashanti Empire, center of West African power and wealth.",
      allegianceHistory: {
        1695: "Ashanti Empire",
        1896: "British Empire"
      }
    }
  ],
  "Ibo Plateau": [
    {
      name: "Benin City",
      isHistorical: true,
      foundingYear: 1180,
      description: "The great walled city of the Benin Empire, famed for its bronze artistry and powerful Oba.",
      allegianceHistory: {
        1180: "Kingdom of Benin",
        1897: "British Empire"
      }
    }
  ],
 "Ethiopian Highlands": [
  {
    name: "Aksum",
    isHistorical: true,
    foundingYear: 100,
    declineYear: 960,
    description: "The ancient trading empire of towering stelae, a highland hub linking Africa to the wider world.",
    allegianceHistory: {
      100: "Kingdom of Aksum"
    }
  },
  {
    name: "Gondar",
    isHistorical: true,
    foundingYear: 1635,
    description: "The fortress-capital of Ethiopia, famed for the Fasil Ghebbi palace complex and church art.",
    allegianceHistory: {
      1635: "Ethiopian Empire"
    },
    urbanDensity: "moderate",
    economicFocus: ["government", "religion", "architecture"]
  }
],

  "Lake Victoria Basin": [
    {
      name: "Buganda",
      isHistorical: true,
      foundingYear: 1300,
      description: "The powerful kingdom on the shores of the great lake, master of banana cultivation and lakeside trade.",
      allegianceHistory: {
        1300: "Kingdom of Buganda",
        1894: "British Empire"
      }
    }
  ],
  "Cape Coast": [
    {
      name: "Cape Town",
      isHistorical: true,
      foundingYear: 1652,
      description: "Dutch refreshment station and gateway to the Indian Ocean trade.",
      allegianceHistory: {
        1652: "Dutch East India Company",
        1795: "British Empire",
        1803: "Batavian Republic",
        1806: "British Empire",
        1910: "Union of South Africa",
        1994: "South Africa"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['trade', 'shipping', 'wine', 'agriculture', 'provisions']
    }
  ],

  "Yellow River Valley": [
      {
        name: "Yinxu",
        isHistorical: true,
        foundingYear: -1300,
        declineYear: -1046,
        description: "The last capital of the Shang dynasty, where the earliest known Chinese writing was discovered.",
        allegianceHistory: {
            [-1300]: "Shang Dynasty"
        }
      },
       {
        name: "Chang'an",
        isHistorical: true,
        foundingYear: -202,
        // Bounded at 1369 rather than left open-ended: the city was renamed
        // Xi'an when the Ming took it, and without this bound a persona born
        // here in 1888 or 1950 was, per this data, born in Han/Tang-era
        // Chang'an. See the Xi'an entry immediately below for the successor.
        declineYear: 1369,
        description: "The magnificent capital of several Chinese dynasties, including the Han and Tang, once the largest city in the world.",
        allegianceHistory: {
            [-202]: "Han Dynasty",
            581: "Sui Dynasty",
            618: "Tang Dynasty",
            907: "Five Dynasties Period",
            960: "Song Dynasty",
            1127: "Jin Dynasty",
            1271: "Yuan Dynasty"
        }
      },
      {
        name: "Xi'an",
        isHistorical: true,
        foundingYear: 1369,
        description: "The renamed successor to Chang'an, a provincial Ming and Qing capital that endured as a major city long after it stopped being the seat of empire.",
        allegianceHistory: {
            1369: "Ming Dynasty",
            1644: "Qing Dynasty",
            1912: "Republic of China",
            1949: "People's Republic of China"
        },
        urbanDensity: 'moderate',
        eraSpecificDensity: {
          'modern': 'large'
        },
        economicFocus: ['administration', 'crafts', 'trade', 'manufacturing']
      }
  ],
  "Beijing Basin": [
    {
      name: "Beijing",
      isHistorical: true,
      foundingYear: 1045,
      populationPeak: 21700000, // Modern Beijing metropolitan area
      description: "The northern capital, seat of the Forbidden City and center of the Middle Kingdom.",
      allegianceHistory: {
        1045: "Zhou Dynasty",
        1153: "Jin Dynasty",
        1272: "Yuan Dynasty",
        1368: "Ming Dynasty",
        1644: "Qing Dynasty"
      }
    }
  ],
  "Pearl River Delta": [
    {
      name: "Canton",
      isHistorical: true,
      foundingYear: -214,
      populationPeak: 14000000, // Modern Guangzhou
      description: "The great southern port, window to the world and gateway of Chinese trade.",
      allegianceHistory: {
        [-214]: "Qin Dynasty",
        [-206]: "Han Dynasty",
        618: "Tang Dynasty",
        960: "Song Dynasty",
        1368: "Ming Dynasty"
      }
    }
  ],
  "Kyoto Basin": [
    {
      name: "Kyoto",
      isHistorical: true,
      foundingYear: 794,
      description: "Ancient capital of Japan and center of imperial culture.",
      allegianceHistory: {
        794: "Heian Imperial Court",
        1185: "Kamakura Shogunate",
        1333: "Ashikaga Shogunate",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 350000,
      economicFocus: ['crafts', 'silk', 'religion', 'education', 'administration']
    }
  ],
  "Edo Plain": [
    {
      name: "Tokyo",
      isHistorical: true,
      foundingYear: 1457,
      populationPeak: 24000000,
      description: "The shogun's city that became the largest in the world, center of the great peace.",
      allegianceHistory: {
        1457: "Ota Clan",
        1590: "Tokugawa Clan",
        1603: "Tokugawa Shogunate",
        1868: "Meiji Restoration"
      }
    }
  ],
  "Han River Valley": [
    {
      // Merged with a second, much more complete "Seoul" entry that used to
      // sit under the orphaned "Korean Peninsula" key (a region name, not a
      // map area) — it carried the city's history back through Baekje,
      // Goguryeo and Silla rather than starting at the Joseon founding, and
      // its populationPeak and economic focus reflect the modern city. That
      // richer data replaces this entry's.
      name: "Seoul",
      isHistorical: true,
      foundingYear: -18,
      description: "Capital of Korea for over 600 years, from Joseon to modern megacity.",
      allegianceHistory: {
        [-18]: "Baekje Kingdom",
        475: "Goguryeo Kingdom",
        553: "Silla Kingdom",
        918: "Goryeo Dynasty",
        1394: "Joseon Dynasty",
        1910: "Japanese Colony",
        1945: "US Occupation",
        1948: "Republic of Korea"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10000000,
      economicFocus: ['government', 'technology', 'finance', 'entertainment', 'administration', 'education', 'crafts', 'ceramics', 'trade']
    }
  ],
  "Sydney Basin": [
    {
      name: "Sydney",
      isHistorical: true,
      foundingYear: 1788,
      description: "First British colonial settlement in Australia and major Pacific port.",
      allegianceHistory: {
        1788: "British Colony of New South Wales",
        1901: "Commonwealth of Australia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['shipping', 'wool', 'gold', 'administration', 'trade']
    }
  ],
  "Canterbury Plains": [
    {
      name: "Christchurch",
      isHistorical: true,
      foundingYear: 1850,
      description: "The English city of the South Pacific, cathedral town on the Canterbury Plains.",
      allegianceHistory: {
        1850: "British Empire",
        1907: "Dominion of New Zealand"
      }
    }
  ],
  "Society Islands": [
    {
      name: "Tahiti",
      isHistorical: true,
      foundingYear: 300,
      description: "The queen of Polynesian islands, center of Pacific navigation and spiritual power.",
      allegianceHistory: {
        300: "Polynesian Chiefdoms",
        1880: "French Empire"
      }
    }
  ],
  "Big Island Highlands": [
    {
      name: "Honolulu",
      isHistorical: true,
      foundingYear: 1795,
      description: "The sheltered harbor that became capital of the unified Hawaiian Kingdom.",
      allegianceHistory: {
        1795: "Kingdom of Hawaii",
        1898: "United States"
      }
    }
  ],
  "Gobi Desert": [
    {
      name: "Karakorum",
      isHistorical: true,
      foundingYear: 1220,
      declineYear: 1267,
      description: "The legendary capital of the Mongol Empire, where Genghis Khan's successors ruled the world.",
      allegianceHistory: {
        1220: "Mongol Empire"
      }
    }
  ],

  // === MISSING NORTH AMERICAN CITIES ===
  "Puget Sound": [
    {
      name: "Seattle",
      isHistorical: true,
      foundingYear: 1851,
      description: "A timber and fishing town that grew into the Pacific Northwest's major port.",
      allegianceHistory: {
        1851: "United States"
      }
    }
  ],
  "Colorado Plateau": [
    {
      name: "Mesa Verde",
      isHistorical: true,
      foundingYear: 600,
      declineYear: 1300,
      description: "Ancient Puebloan cliff dwellings, a marvel of indigenous architecture.",
      allegianceHistory: {
        600: "Ancestral Puebloans"
      }
    }
  ],
  "Platte River Basin": [
    {
      name: "Fort Laramie",
      isHistorical: true,
      foundingYear: 1834,
      description: "A crucial way station on the Oregon, California, and Mormon trails west.",
      allegianceHistory: {
        1834: "United States"
      }
    }
  ],

  // === MISSING CENTRAL ASIAN CITIES ===
  "Kazakh Steppes": [
    {
      name: "Almaty",
      isHistorical: true,
      foundingYear: 1854,
      description: "Founded as a Russian frontier fort, it became the major city of Kazakhstan.",
      allegianceHistory: {
        1854: "Russian Empire",
        1991: "Kazakhstan"
      }
    }
  ],
  "Altai Mountains": [
    {
      name: "Gorno-Altaysk",
      isHistorical: true,
      foundingYear: 1824,
      description: "A small mountain town serving as gateway to the Altai wilderness.",
      allegianceHistory: {
        1824: "Russian Empire",
        1991: "Russia"
      }
    }
  ],
  "Mongolian Steppes": [
    {
      name: "Ulaanbaatar",
      isHistorical: true,
      foundingYear: 1639,
      description: "The red hero city, ancient center of Mongolian Buddhism and modern capital.",
      allegianceHistory: {
        1639: "Mongol Tribes",
        1691: "Qing Dynasty",
        1921: "Mongolia"
      }
    }
  ],

  // === MISSING AFRICAN CITIES ===
  "Serengeti Plain": [
    {
      name: "Olduvai",
      isHistorical: true,
      foundingYear: -2000000,
      description: "The cradle of mankind, where early hominids first walked upright.",
      allegianceHistory: {
        [-2000000]: "Early Hominids"
      }
    }
  ],
  "Kalahari Basin": [
    {
      name: "Ghanzi",
      isHistorical: true,
      foundingYear: 1898,
      description: "A small outpost in the vast Kalahari, center of cattle ranching.",
      allegianceHistory: {
        1898: "British Empire",
        1966: "Botswana"
      }
    }
  ],
  "Congo River Bend": [
    {
      name: "Kinshasa",
      isHistorical: true,
      foundingYear: 1881,
      description: "Leopold's trading post that became the sprawling capital of the Congo.",
      allegianceHistory: {
        1881: "Congo Free State",
        1908: "Belgian Congo",
        1960: "Democratic Republic of Congo"
      }
    }
  ],

  // === MISSING OCEANIAN CITIES ===
  "Sepik River Basin": [
    {
      name: "Wewak",
      isHistorical: true,
      foundingYear: 1885,
      description: "A German colonial outpost that became Papua New Guinea's northern port.",
      allegianceHistory: {
        1885: "German Empire",
        1914: "British Empire",
        1975: "Papua New Guinea"
      }
    }
  ],

  // === MISSING SOUTH AMERICAN CITIES ===
  "Manaus Region": [
    {
      name: "Manaus",
      isHistorical: true,
      foundingYear: 1669,
      description: "The rubber boom capital deep in the Amazon rainforest.",
      allegianceHistory: {
        1669: "Portuguese Empire",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      }
    }
  ],
  "Orinoco Delta": [
    {
      name: "Ciudad Guayana",
      isHistorical: false,
      foundingYear: 1961,
      description: "Modern planned industrial city at the Orinoco-Caroni confluence.",
      allegianceHistory: {
        1961: "Venezuela"
      },
      urbanDensity: 'moderate',
      populationPeak: 900000,
      economicFocus: ['steel', 'aluminum', 'hydropower', 'mining']
    },
    {
      name: "Tucupita",
      isHistorical: true,
      foundingYear: 1848,
      description: "Capital of Delta Amacuro state, gateway to the Orinoco Delta.",
      allegianceHistory: {
        1848: "Venezuela"
      },
      urbanDensity: 'small',
      populationPeak: 100000,
      economicFocus: ['fishing', 'agriculture', 'oil', 'indigenous crafts']
    }
  ],

  // === MISSING ASIAN CITIES ===
  "Western Siberia": [
    {
      name: "Novosibirsk",
      isHistorical: true,
      foundingYear: 1893,
      description: "The Chicago of Siberia, built where the Trans-Siberian Railway crosses the Ob.",
      allegianceHistory: {
        1893: "Russian Empire",
        1991: "Russia"
      }
    }
  ],

  // === MORE MISSING REGIONS ===
  "Empty Quarter": [
    {
      name: "Rub' al Khali Oasis",
      isHistorical: false,
      foundingYear: 400,
      description: "A rare oasis in the world's largest continuous sand desert.",
      allegianceHistory: {
        400: "Bedouin Tribes",
        1932: "Saudi Arabia"
      }
    }
  ],
  "Central Sahara": [
    {
      name: "Taghaza",
      isHistorical: true,
      foundingYear: 1200,
      description: "The salt mines that made the trans-Saharan trade possible.",
      allegianceHistory: {
        1200: "Ghana Empire",
        1325: "Mali Empire",
        1591: "Moroccan Sultanate"
      }
    }
  ],
// === AFRICA ===
  "Tunisian Sahel": [
    {
      name: "Carthage",
      isHistorical: true,
      foundingYear: -814,
      description: "Phoenician trading empire and Rome's greatest rival.",
      allegianceHistory: {
        "-814": "Phoenician Carthage",
        "-146": "Roman Africa",
        439: "Vandal Kingdom",
        534: "Byzantine Empire"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['trade', 'navigation', 'silver', 'purple dye', 'military'],
      // Punic Carthage was razed in 146 BCE, but Rome refounded the city in 29 BCE
      // and it became the capital of Africa Proconsularis and one of the largest
      // cities in the empire — Augustine's Carthage. It ends with the Arab
      // conquest of 698, which is also when Tunis below takes over.
      declineYear: 698
    },
    {
      name: "Tunis",
      isHistorical: true,
      foundingYear: 698,
      description: "Major North African port and center of Islamic scholarship.",
      allegianceHistory: {
        698: "Umayyad Caliphate",
        800: "Aghlabid Emirate",
        909: "Fatimid Caliphate",
        1159: "Almohad Caliphate",
        1574: "Ottoman Empire",
        1881: "French Protectorate",
        1956: "Tunisia"
      },
      urbanDensity: 'moderate',
      populationPeak: 100000,
      economicFocus: ['trade', 'textiles', 'olive_oil', 'scholarship', 'piracy']
    }
  ],
  "Bekaa Valley": [
    {
      // Kamid al-Loz (ancient Kumidu), the Bekaa's principal Bronze Age
      // tell. Its earliest settlement phase (Early Bronze I) is dated by
      // its German excavators to roughly 3200 BCE, a modest fortified
      // village rather than a full city; it grew into a walled town by
      // the Middle Bronze Age and, as Kumidu, was an Egyptian vassal
      // city-state with its own palace and archive during the Amarna
      // period, before falling in the wider Late Bronze Age collapse.
      name: "Kamid al-Loz",
      isHistorical: true,
      foundingYear: -3200,
      declineYear: -1200,
      description: "A fortified Bekaa Valley tell that grew from an early Bronze Age village into Kumidu, an Egyptian vassal city-state with its own palace and archive.",
      allegianceHistory: {
        [-3200]: "Early Bronze Age Chiefdom",
        [-1800]: "Amorite City-State",
        [-1450]: "Egyptian New Kingdom (vassal)"
      },
      urbanDensity: 'small',
      economicFocus: ['agriculture', 'administration', 'trade']
    },
    {
      name: "Damascus",
      isHistorical: true,
      foundingYear: -3000,
      description: "One of the oldest continuously inhabited cities, capital of the Umayyad Caliphate at its height.",
      allegianceHistory: {
        [-3000]: "Ancient Semitic Peoples",
        [-64]: "Roman Empire",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        1516: "Ottoman Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['trade', 'steel', 'crafts', 'religion']
    }
  ],
  "Limpopo Valley": [
    {
      name: "Great Zimbabwe",
      isHistorical: true,
      foundingYear: 1100,
      declineYear: 1450,
      description: "The monumental stone capital of a vast southern African kingdom, built on the gold trade.",
      allegianceHistory: {
        1100: "Kingdom of Zimbabwe"
      },
      urbanDensity: 'moderate',
      populationPeak: 18000,
      economicFocus: ['gold', 'trade', 'cattle', 'monumental_architecture']
    }
    // Gondar used to be filed here too, two thousand miles from Ethiopia — a
    // copy-paste error. It belongs solely under "Ethiopian Highlands", where
    // it already exists.
  ],

  // === EUROPE ===
  "Catalonian Hills": [
    {
      name: "Barcelona",
      isHistorical: true,
      foundingYear: -15,
      description: "A Roman port that grew into the capital of the powerful Crown of Aragon.",
      allegianceHistory: {
        "-15": "Roman Empire",
        801: "Carolingian Empire",
        988: "County of Barcelona",
        1162: "Crown of Aragon",
        1714: "Kingdom of Spain"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
          'modern': 'large'
      },
      economicFocus: ['trade', 'shipping', 'textiles']
    }
  ],
  "Cilician Plain": [
    {
        // Yumuktepe (ancient Mersin), a fortified tell mound with
        // continuous occupation from the Neolithic through the Bronze
        // Age. Included despite the general rule against calling
        // Neolithic villages "cities" because by its later prehistoric
        // phases it was a walled, planned settlement, not a simple
        // farming village.
        name: "Yumuktepe",
        isHistorical: true,
        foundingYear: -6300,
        declineYear: -1200,
        description: "A fortified tell settlement on the Cilician coastal plain, continuously rebuilt from the Neolithic through the Bronze Age.",
        allegianceHistory: {
            [-6300]: "Neolithic Village",
            [-3000]: "Chalcolithic Chiefdom",
            [-1650]: "Hittite Empire"
        },
        urbanDensity: 'small',
        economicFocus: ['agriculture', 'pottery', 'trade']
    },
    {
        name: "Antioch",
        isHistorical: true,
        foundingYear: -300,
        description: "A magnificent Hellenistic city, a cradle of early Christianity and a key Crusader prize.",
        allegianceHistory: {
            [-300]: "Seleucid Empire",
            [-64]: "Roman Empire",
            395: "Byzantine Empire",
            1098: "Crusader States",
            1268: "Mamluk Sultanate"
        },
        urbanDensity: 'large',
        populationPeak: 500000,
        economicFocus: ['trade', 'philosophy', 'religion', 'silk']
    }
  ],
  "Champlain Valley": [
    {
        name: "Quebec City",
        isHistorical: true,
        foundingYear: 1608,
        description: "The Gibraltar of North America, the fortified capital of New France.",
        allegianceHistory: {
            1608: "New France",
            1763: "British Empire",
            1867: "Canada"
        },
        urbanDensity: 'small',
        eraSpecificDensity: {
            'modern': 'moderate'
        },
        economicFocus: ['fur_trade', 'military', 'government']
    }
  ],
  "Loire Valley": [
    {
        name: "Lyon",
        isHistorical: true,
        foundingYear: -43,
        description: "Lugdunum, the capital of Roman Gaul and a center of silk-weaving and banking in the Renaissance.",
        allegianceHistory: {
            "-43": "Roman Empire",
            461: "Kingdom of the Burgundians",
            1312: "Kingdom of France"
        },
        urbanDensity: 'moderate',
        eraSpecificDensity: {
            'ancient': 'large',
            'modern': 'large'
        },
        economicFocus: ['administration', 'trade', 'silk', 'banking']
    }
  ],
  "Flanders Fields": [
    {
      name: "Bruges",
      isHistorical: true,
      foundingYear: 864,
      description: "A wealthy medieval metropolis, whose canals and merchants made it a center of Northern European trade.",
      allegianceHistory: {
        864: "County of Flanders",
        1384: "Duchy of Burgundy",
        1482: "Habsburg Netherlands"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'moderate'
      },
      economicFocus: ['textiles', 'trade', 'banking', 'art']
    },
    {
      name: "Brussels",
      isHistorical: true,
      foundingYear: 979,
      description: "Capital of the Spanish Netherlands and later Belgium.",
      allegianceHistory: {
        979: "Duchy of Lower Lorraine",
        1430: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1556: "Spanish Netherlands",
        1714: "Austrian Netherlands",
        1795: "French Republic",
        1815: "United Kingdom of the Netherlands",
        1830: "Belgium"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'textiles', 'administration', 'brewing', 'crafts']
    },
    {
      name: "Antwerp",
      isHistorical: true,
      foundingYear: 1200,
      description: "Northern Europe's greatest trading port during the 16th century.",
      allegianceHistory: {
        1200: "Duchy of Brabant",
        1430: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1556: "Spanish Netherlands",
        1714: "Austrian Netherlands",
        1795: "French Republic",
        1815: "United Kingdom of the Netherlands",
        1830: "Belgium"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 125000,
      economicFocus: ['trade', 'banking', 'textiles', 'spices', 'diamonds']
    }
  ],
  "Scheldt Basin": [
    {
      name: "Antwerp",
      isHistorical: true,
      foundingYear: 900,
      description: "A bustling port that became the wealthiest city in Europe during the 16th century.",
      allegianceHistory: {
        900: "Holy Roman Empire",
        1500: "Habsburg Netherlands",
        1830: "Belgium"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'large'
      },
      economicFocus: ['trade', 'finance', 'sugar', 'diamonds']
    }
  ],
  "Po Valley": [
    {
      name: "Milan",
      isHistorical: true,
      foundingYear: -600,
      description: "Major commercial and financial center of northern Italy.",
      allegianceHistory: {
        "-600": "Celtic Tribes",
        "-222": "Roman Republic",
        286: "Western Roman Empire",
        774: "Frankish Kingdom",
        1162: "Holy Roman Empire",
        1395: "Duchy of Milan",
        1796: "Cisalpine Republic",
        1815: "Austrian Empire",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['banking', 'textiles', 'metalworking', 'trade', 'silk']
    },
    {
      // Merged with a second "Genoa" entry that used to sit under the
      // orphaned "Ligurian Coast" key (no such map area exists; Genoa
      // remains filed under "Po Valley" as it already was, even though it
      // sits on the coast rather than the plain, since re-siting it is out
      // of scope here). That copy's richer allegianceHistory and
      // populationPeak are kept.
      name: "Genoa",
      isHistorical: true,
      foundingYear: -400,
      description: "The proud maritime republic, whose powerful navy and savvy merchants rivaled Venice for control of the seas.",
      allegianceHistory: {
        [-400]: "Ligurian Tribes",
        [-209]: "Roman Republic",
        937: "Republic of Genoa",
        1396: "French Occupation",
        1421: "Duchy of Milan",
        1528: "Republic of Genoa",
        1805: "French Empire",
        1815: "Kingdom of Sardinia",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      populationPeak: 200000,
      economicFocus: ['maritime_trade', 'banking', 'trade', 'shipping', 'navy', 'silk', 'spices', 'shipbuilding']
    }
  ],
  "Norwegian Fjords": [
    {
      name: "Bergen",
      isHistorical: true,
      foundingYear: 1070,
      description: "Historic Hanseatic trading city, gateway to the fjords.",
      allegianceHistory: {
        1070: "Kingdom of Norway",
        1380: "Kalmar Union",
        1814: "Sweden-Norway Union",
        1905: "Kingdom of Norway",
        1940: "German Occupation",
        1945: "Kingdom of Norway"
      },
      urbanDensity: 'moderate',
      populationPeak: 300000,
      economicFocus: ['fish trade', 'shipping', 'oil', 'tourism']
    },
    {
      name: "Trondheim",
      isHistorical: true,
      foundingYear: 997,
      description: "Medieval capital and pilgrimage center with Nidaros Cathedral.",
      allegianceHistory: {
        997: "Kingdom of Norway",
        1380: "Kalmar Union",
        1814: "Sweden-Norway Union",
        1905: "Kingdom of Norway"
      },
      urbanDensity: 'moderate',
      populationPeak: 200000,
      economicFocus: ['pilgrimage', 'trade', 'education', 'technology']
    },
    {
      name: "Tromsø",
      isHistorical: true,
      foundingYear: 1794,
      description: "Arctic city, the 'Paris of the North' and gateway to polar exploration.",
      allegianceHistory: {
        1794: "Denmark-Norway",
        1814: "Sweden-Norway Union",
        1905: "Kingdom of Norway"
      },
      urbanDensity: 'small',
      populationPeak: 80000,
      economicFocus: ['arctic trade', 'whaling', 'fishing', 'research']
    }
  ],
  "Carpathian Foothills": [
    {
      // Merged with a second "Krakow" entry that used to sit under the
      // orphaned "Vistula River" key (no such map area exists); that copy
      // was more complete, so its detail is kept here.
      name: "Krakow",
      isHistorical: true,
      foundingYear: 965,
      description: "Ancient capital of Poland and center of Polish culture and learning.",
      allegianceHistory: {
        965: "Duchy of Poland",
        1025: "Kingdom of Poland",
        1569: "Polish-Lithuanian Commonwealth",
        1795: "Austrian Empire",
        1807: "Duchy of Warsaw",
        1815: "Free City of Kraków",
        1846: "Austrian Empire",
        1918: "Poland"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['education', 'religion', 'crafts', 'trade', 'salt']
    },
    {
      // Moved from the orphaned "Transylvania" key — that name is a region,
      // not a map area; Cluj sits in the Carpathian foothills.
      name: "Cluj",
      isHistorical: true,
      foundingYear: 1213,
      description: "A major city in Transylvania, center of trade and learning.",
      allegianceHistory: {
        1213: "Kingdom of Hungary",
        1541: "Principality of Transylvania",
        1699: "Habsburg Empire",
        1867: "Austria-Hungary",
        1918: "Kingdom of Romania"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'crafts', 'education']
    }
  ],
  "Stockholm Archipelago": [
    {
      name: "Stockholm",
      isHistorical: true,
      foundingYear: 1252,
      description: "Capital of Sweden and major Baltic trading center.",
      allegianceHistory: {
        1252: "Kingdom of Sweden",
        1397: "Kalmar Union",
        1523: "Kingdom of Sweden"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'iron', 'administration', 'shipping', 'timber']
    }
  ],
  
  // === ASIA ===
  "Mekong River Basin": [
    // Angkor and Ayutthaya used to be double-filed here as well as under
    // "Tonle Sap Basin" and "Chao Phraya Basin" respectively — their actual
    // watersheds. Angkor sat on the Tonle Sap, not the Mekong proper, and
    // Ayutthaya is a Chao Phraya river city; both entries already exist,
    // richer, under those areas, so the copies here are gone rather than
    // moved.
    {
        name: "Luang Prabang",
        isHistorical: true,
        foundingYear: 1353,
        description: "Founding capital of the Lao kingdom of Lan Xang, seat of the Khun Lo dynasty on the upper Mekong.",
        allegianceHistory: {
            1353: "Lan Xang Kingdom",
            1707: "Kingdom of Luang Prabang",
            1893: "French Indochina",
            1953: "Kingdom of Laos",
            1975: "Laos"
        },
        urbanDensity: 'small',
        economicFocus: ['religion', 'administration', 'river_trade']
    },
    {
        // King Setthathirath moved the Lan Xang court to Vientiane in 1560;
        // conservatively dated to that year rather than the city's older,
        // less securely attested Mon and Khmer settlement.
        name: "Vientiane",
        isHistorical: true,
        foundingYear: 1560,
        description: "Riverside capital to which Lan Xang's court relocated, later a vassal principality under Siam.",
        allegianceHistory: {
            1560: "Lan Xang Kingdom",
            1707: "Kingdom of Vientiane",
            1779: "Siam",
            1893: "French Indochina",
            1953: "Kingdom of Laos",
            1975: "Laos"
        },
        urbanDensity: 'small',
        economicFocus: ['administration', 'religion', 'river_trade']
    }
  ],
  // No entry for the "3000 BCE-500 CE" band: left open deliberately. Early
  // entrepots on this stretch of water (the Bujang Valley polity at Kedah)
  // are already recorded under the "Malay Peninsula" map area; no
  // distinctly located, well-attested settlement specifically on the
  // strait itself is identifiable this early without duplicating that
  // entry under a new name.
  "Strait of Malacca": [
    {
        name: "Malacca",
        isHistorical: true,
        foundingYear: 1400,
        description: "A vital strategic port controlling the strait between India and China, coveted by all empires.",
        allegianceHistory: {
            1400: "Sultanate of Malacca",
            1511: "Portuguese Empire",
            1641: "Dutch Empire",
            1824: "British Empire"
        },
        urbanDensity: 'large',
        economicFocus: ['spices', 'trade', 'shipping']
    },
    {
      name: "Singapore",
      isHistorical: true,
      foundingYear: 1819,
      description: "Strategic trading port controlling the Strait of Malacca.",
      allegianceHistory: {
        1819: "British Empire",
        1963: "Malaysia",
        1965: "Singapore"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 50000,
      economicFocus: ['trade', 'shipping', 'finance', 'entrepot', 'rubber']
    }
  ],
  "Yangtze Delta": [
    {
        name: "Shanghai",
        isHistorical: true,
        foundingYear: 960,
        populationPeak: 230000, // Modern Shanghai metropolitan area
        description: "The Pearl of the Orient, China's largest city and global financial center.",
        allegianceHistory: {
            960: "Song Dynasty",
            1368: "Ming Dynasty",
            1644: "Qing Dynasty",
            1842: "Treaty Port",
            1949: "People's Republic of China"
        },
        urbanDensity: 'massive',
        economicFocus: ['trade', 'banking', 'manufacturing', 'shipping']
    },
    {
        name: "Suzhou",
        isHistorical: true,
        foundingYear: -514,
        populationPeak: 100000,
        description: "The Venice of the East, famous for its canals, gardens, and silk production.",
        allegianceHistory: {
            [-514]: "State of Wu",
            [-222]: "Qin Dynasty",
            589: "Sui Dynasty",
            960: "Song Dynasty",
            1368: "Ming Dynasty",
            1644: "Qing Dynasty"
        },
        urbanDensity: 'large',
        economicFocus: ['silk', 'textiles', 'gardens', 'canals']
    },
    {
        name: "Hangzhou",
        isHistorical: true,
        foundingYear: -222,
        populationPeak: 98000,
        description: "Heaven on Earth, former capital of Southern Song and terminus of the Grand Canal.",
        allegianceHistory: {
            [-222]: "Qin Dynasty",
            589: "Sui Dynasty",
            907: "Wuyue Kingdom",
            1127: "Southern Song Capital",
            1368: "Ming Dynasty",
            1644: "Qing Dynasty"
        },
        urbanDensity: 'large',
        economicFocus: ['silk', 'tea', 'porcelain', 'printing']
    },
    {
      name: "Nanjing",
      isHistorical: true,
      foundingYear: -472,
      description: "Ancient Chinese capital and southern center of imperial power.",
      allegianceHistory: {
        "-472": "Wu Kingdom",
        "-333": "Chu Kingdom",
        "-221": "Qin Dynasty",
        1368: "Ming Dynasty",
        1644: "Qing Dynasty",
        1853: "Taiping Heavenly Kingdom",
        1864: "Qing Dynasty",
        1912: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 1000000,
      economicFocus: ['administration', 'textiles', 'education', 'crafts', 'porcelain']
    }
  ],
  "Yangtze Gorges": [
    {
        name: "Hangzhou",
        isHistorical: true,
        foundingYear: 221,
        description: "A city of heavenly beauty, capital of the Southern Song and southern terminus of the Grand Canal.",
        allegianceHistory: {
            589: "Sui Dynasty",
            1132: "Southern Song Dynasty",
            1276: "Yuan Dynasty"
        },
        urbanDensity: 'large',
        eraSpecificDensity: {
            'medieval': 'massive'
        },
        economicFocus: ['trade', 'silk', 'art', 'poetry']
    }
  ],
  "Gyeongju Basin": [
    {
        name: "Gyeongju",
        isHistorical: true,
        foundingYear: -57,
        declineYear: 935,
        description: "The golden capital of the Silla Kingdom, which unified the Korean peninsula.",
        allegianceHistory: {
            "-57": "Silla Kingdom",
            668: "Unified Silla"
        },
        urbanDensity: 'large',
        economicFocus: ['government', 'buddhism', 'art', 'astronomy']
    }
  ],
  // Palembang is a Musi River delta port, not a highland town, but
  // "Sumatra Highlands" is the only map area representing the Sumatra
  // landmass — the region's other areas (Strait of Malacca, Java Sea, Sunda
  // Strait) are all straits and open water. Left here for lack of a
  // better-fitting area.
  "Sumatra Highlands": [
    {
        // Kantoli is known only from Chinese Liu Song-dynasty tribute
        // records (441-563 CE); its exact site was never excavated and
        // its location in southeastern Sumatra is inferred, but most
        // historians treat it as the direct political predecessor of
        // Srivijaya at Palembang.
        name: "Kantoli",
        isHistorical: true,
        foundingYear: 450,
        declineYear: 670,
        description: "A Buddhist trading polity known only from Chinese tribute records, likely the direct predecessor of Srivijaya on the Musi River.",
        allegianceHistory: {
            450: "Kantoli"
        },
        urbanDensity: 'small',
        economicFocus: ['trade', 'buddhism', 'tribute']
    },
    {
        name: "Palembang",
        isHistorical: true,
        foundingYear: 671,
        description: "The powerful capital of the Srivijayan maritime empire, controlling the seas of Southeast Asia.",
        allegianceHistory: {
            671: "Srivijaya Empire",
            1377: "Majapahit Empire"
        },
        urbanDensity: 'large',
        economicFocus: ['trade', 'navy', 'buddhism', 'tribute']
    }
  ],
  "Karnataka Plateau": [
    {
        name: "Vijayanagara",
        isHistorical: true,
        foundingYear: 1336,
        declineYear: 1565,
        description: "The City of Victory, the sprawling capital of the last great Hindu kingdom of Southern India.",
        allegianceHistory: {
            1336: "Vijayanagara Empire"
        },
        urbanDensity: 'large',
        populationPeak: 500000,
        economicFocus: ['trade', 'diamonds', 'military', 'temples']
    }
  ],
  "Samarkand Region": [
    {
      name: "Samarkand",
      isHistorical: true,
      foundingYear: -700,
      description: "Pearl of the Silk Road and Timurid cultural capital.",
      allegianceHistory: {
        "-700": "Sogdian City-States",
        "-329": "Macedonian Empire",
        "-250": "Greco-Bactrian Kingdom",
        710: "Umayyad Caliphate",
        819: "Samanid Empire",
        1220: "Mongol Empire",
        1370: "Timurid Empire",
        1500: "Shaybanid Dynasty",
        1785: "Emirate of Bukhara",
        1868: "Russian Empire",
        1924: "Soviet Union",
        1991: "Uzbekistan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'crafts', 'education', 'silk', 'astronomy']
    }
  ],
  "Nara Uplands": [
    {
        name: "Nara",
        isHistorical: true,
        foundingYear: 710,
        declineYear: 784,
        description: "The first permanent imperial capital of Japan, a center of Buddhist art and learning.",
        allegianceHistory: {
            710: "Imperial Court (Nara Period)"
        },
        urbanDensity: 'moderate',
        economicFocus: ['government', 'buddhism', 'art']
    }
  ],
  "Irrawaddy Valley": [
    {
        // Sri Ksetra's founding is sometimes pushed earlier by legendary
        // tradition; the date used here is the conservative one commonly
        // associated with its rise as the leading Pyu city, and it is
        // bounded at the historically documented 832 CE Nanzhao raid that
        // shattered Pyu power, ahead of Pagan's rise a generation later.
        name: "Sri Ksetra",
        isHistorical: true,
        foundingYear: 180,
        declineYear: 832,
        description: "The largest of the Pyu city-states, a walled Buddhist center on the Irrawaddy that dominated the valley before the rise of Pagan.",
        allegianceHistory: {
            180: "Pyu City-States"
        },
        urbanDensity: 'moderate',
        economicFocus: ['religion', 'trade', 'agriculture']
    },
    {
        name: "Pagan",
        isHistorical: true,
        foundingYear: 849,
        declineYear: 1297,
        description: "The city of four million pagodas, capital of the first unified Burmese empire.",
        allegianceHistory: {
            849: "Pagan Kingdom"
        },
        urbanDensity: 'large',
        economicFocus: ['religion', 'architecture', 'agriculture']
    },
    {
      name: "Yangon",
      isHistorical: true,
      foundingYear: 1755,
      description: "Colonial capital of Burma and major Southeast Asian trading port.",
      allegianceHistory: {
        1755: "Konbaung Dynasty",
        1824: "British Empire",
        1948: "Burma",
        1989: "Myanmar"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'rice', 'teak', 'gems', 'shipping']
    },
    {
      // Legendary founding traditions date Pegu to the 6th century CE, but
      // the first securely attested capital-level city here is Binnya U's
      // move of the Hanthawaddy court in 1369 — the conservative choice.
      name: "Pegu",
      isHistorical: true,
      foundingYear: 1369,
      description: "Mon capital of the Hanthawaddy Kingdom and later of Bayinnaung's Toungoo empire, a major port for Indian Ocean trade.",
      allegianceHistory: {
        1369: "Hanthawaddy Kingdom",
        1539: "Toungoo Dynasty",
        1752: "Konbaung Dynasty",
        1852: "British Empire",
        1948: "Burma",
        1989: "Myanmar"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large'
      },
      economicFocus: ['trade', 'religion', 'rice', 'shipping']
    }
  ],
 "Khuzestan Plain": [
  {
    name: "Susa",
    isHistorical: true,
    foundingYear: -4200,
    declineYear: 935,
    description: "An ancient Elamite and later Achaemenid capital, famed for its palaces and administrative role.",
    allegianceHistory: {
      [-4200]: "Elamite Civilization",
      [-539]: "Achaemenid Empire",
      [-331]: "Macedonian Empire",
      638: "Rashidun Caliphate"
    },
    urbanDensity: "moderate",
    populationPeak: 50000,
    economicFocus: ["grain", "administration", "textiles", "ceramics"]
  }
],

  "Shiraz Valley": [
    {
      // Merged with a second "Persepolis" entry that used to sit under the
      // orphaned "Fars Province" key (a region name, not a map area); its
      // economic focus is folded in here.
      name: "Persepolis",
      isHistorical: true,
      foundingYear: -518,
      declineYear: -330,
      description: "The ceremonial capital of the Achaemenid Empire, built by Darius the Great.",
      allegianceHistory: {
        [-518]: "Achaemenid Empire",
        [-330]: "Macedonian Empire"
      },
      urbanDensity: "large",
      populationPeak: 40000,
      economicFocus: ["administration", "monumental_architecture", "stone_carving", "religion", "ceremonial center"]
    },
    {
      name: "Shiraz",
      isHistorical: true,
      foundingYear: 693,
      description: "City of poets, gardens, and wine, cultural heart of Persian civilization.",
      allegianceHistory: {
        693: "Umayyad Caliphate",
        819: "Saffarid Dynasty",
        1051: "Seljuk Empire",
        1501: "Safavid Empire",
        1747: "Zand Dynasty",
        1794: "Qajar Dynasty",
        1925: "Pahlavi Dynasty",
        1979: "Islamic Republic of Iran"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['wine', 'poetry', 'gardens', 'textiles', 'crafts']
    }
  ],
  
  // === THE AMERICAS ===
  "Quito Plateau": [
    {
        name: "Bogota",
        isHistorical: true,
        foundingYear: 1538,
        description: "The highland city of the Muisca, a center of goldwork and the legend of El Dorado.",
        allegianceHistory: {
            600: "Muisca Confederation",
            1538: "Spanish Empire",
            1819: "Gran Colombia",
            1831: "Republic of New Granada"
        },
        urbanDensity: 'moderate',
        economicFocus: ['gold', 'salt', 'trade', 'administration']
    }
  ],
  "Cape Cod": [
    {
      name: "Boston",
      isHistorical: true,
      foundingYear: 1630,
      description: "The Puritan 'City upon a Hill' that became the cradle of the American Revolution.",
      allegianceHistory: {
        1630: "Massachusetts Bay Colony (English)",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['shipping', 'trade', 'education', 'rebellion']
    }
  ],
// === EUROPE ===
  "Apennine Foothills": [
    {
      name: "Pisa",
      isHistorical: true,
      foundingYear: -180,
      description: "A powerful maritime republic, whose naval prowess and architectural marvels challenged its rivals.",
      allegianceHistory: {
        [-180]: "Roman Republic",
        1000: "Republic of Pisa",
        1406: "Republic of Florence"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'trade', 'architecture', 'navy']
    }
  ],
  "Dalmatian Coast": [
    {
      name: "Ragusa",
      isHistorical: true,
      foundingYear: 614,
      declineYear: 1808,
      description: "A wealthy and independent maritime republic on the Adriatic, a rival to Venice.",
      allegianceHistory: {
        614: "Byzantine Empire",
        1205: "Republic of Venice (Suzerainty)",
        1358: "Republic of Ragusa",
        1808: "Napoleonic Kingdom of Italy"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'diplomacy', 'trade']
    }
  ],
  "Thessalian Plain": [
    {
      name: "Thessaloniki",
      isHistorical: true,
      foundingYear: -315,
      description: "The second city of the Byzantine Empire and a major port and cultural melting pot under the Ottomans.",
      allegianceHistory: {
        [-315]: "Kingdom of Macedon",
        [-148]: "Roman Empire",
        395: "Byzantine Empire",
        1430: "Ottoman Empire",
        1912: "Kingdom of Greece"
      },
      urbanDensity: 'large',
      economicFocus: ['trade', 'port', 'religion', 'military']
    }
  ],
  // Moved from the orphaned "British Isles" key — that name is a region,
  // not a map area. Manchester is properly North West England, which has no
  // dedicated area of its own; "York" is the closest existing British
  // Isles area for northern England.
  // Poland's heartland. Warsaw was dropped in an earlier pass because no map
  // area covered the Vistula plain; the area exists now.
  "Vistula Plain": [
    {
      name: "Warsaw",
      isHistorical: true,
      foundingYear: 1300,
      description: "A Masovian river town that became the seat of the Polish-Lithuanian Commonwealth.",
      allegianceHistory: {
        1300: "Duchy of Masovia",
        1526: "Kingdom of Poland",
        1569: "Polish-Lithuanian Commonwealth",
        1795: "Kingdom of Prussia",
        1807: "Duchy of Warsaw",
        1815: "Congress Poland",
        1918: "Poland",
        1939: "German occupation",
        1945: "Polish People's Republic",
        1989: "Poland"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'modern': 'large'
      },
      populationPeak: 1800000,
      economicFocus: ['trade', 'administration', 'textiles', 'education', 'crafts']
    }
  ],

  // Japan's third island, and its window on the mainland for most of its
  // history. These three were dropped for want of an area.
  "Kyushu": [
    {
      name: "Fukuoka",
      isHistorical: true,
      foundingYear: -100,
      description: "The Na kingdom's harbour, and for centuries Japan's gateway to the continent.",
      allegianceHistory: {
        [-100]: "Na Kingdom",
        300: "Yamato State",
        1185: "Kamakura Shogunate",
        1333: "Ashikaga Shogunate",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan",
        1945: "Occupied Japan",
        1952: "Japan"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 1600000,
      economicFocus: ['trade', 'commerce', 'technology', 'culture']
    },
    {
      // The 1945 entry used to read "Atomic Bombing", which is an event and not
      // a polity — the field is who governed the place.
      name: "Nagasaki",
      isHistorical: true,
      foundingYear: 1571,
      description: "The Portuguese and later Dutch trading port, Japan's one opening to Europe under the seclusion edicts.",
      allegianceHistory: {
        1571: "Portuguese Trading Post",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan",
        1945: "Occupied Japan",
        1952: "Japan"
      },
      urbanDensity: 'moderate',
      populationPeak: 450000,
      economicFocus: ['international trade', 'shipbuilding', 'Christianity', 'shipping']
    },
    {
      name: "Kumamoto",
      isHistorical: true,
      foundingYear: 1607,
      description: "A castle town of the Hosokawa domain, built around one of Japan's great fortresses.",
      allegianceHistory: {
        1607: "Hosokawa Domain",
        1868: "Empire of Japan",
        1945: "Occupied Japan",
        1952: "Japan"
      },
      urbanDensity: 'moderate',
      populationPeak: 750000,
      economicFocus: ['military', 'agriculture', 'education', 'crafts']
    }
  ],

  // Fiji had no map area under any name, so these were dropped. The area
  // exists now; the pre-contact settlement of the islands is far older than
  // any of these towns, which are all colonial foundations.
  "Fiji Islands": [
    {
      name: "Levuka",
      isHistorical: true,
      foundingYear: 1820,
      declineYear: 1882,
      description: "A beachcomber and whaling settlement on Ovalau that served as Fiji's first colonial capital.",
      allegianceHistory: {
        1820: "Beachcomber Settlement",
        1871: "Kingdom of Fiji",
        1874: "British Colony"
      },
      urbanDensity: 'small',
      populationPeak: 1000,
      economicFocus: ['whaling', 'copra', 'shipping']
    },
    {
      name: "Suva",
      isHistorical: true,
      foundingYear: 1882,
      description: "The colonial capital moved here from Levuka, and it grew into the largest city in the island Pacific.",
      allegianceHistory: {
        1882: "British Colony",
        1970: "Dominion of Fiji",
        1987: "Republic of Fiji"
      },
      urbanDensity: 'moderate',
      populationPeak: 180000,
      economicFocus: ['government', 'shipping', 'education', 'regional headquarters']
    },
    {
      name: "Nadi",
      isHistorical: false,
      foundingYear: 1947,
      description: "A sugar town on the dry side of Viti Levu that grew around the wartime airstrip.",
      allegianceHistory: {
        1947: "British Colony",
        1970: "Dominion of Fiji",
        1987: "Republic of Fiji"
      },
      urbanDensity: 'moderate',
      populationPeak: 50000,
      economicFocus: ['tourism', 'sugar', 'aviation']
    }
  ],

  // Manchester was filed under "York" because the map had no north-west of
  // England. It now has one.
  "Mersey Basin": [
    {
      name: "Manchester",
      isHistorical: true,
      foundingYear: 79,
      description: "The Roman fort of Mamucium that exploded into the world's first industrial city.",
      allegianceHistory: {
        79: "Roman Empire",
        1066: "Kingdom of England",
        1707: "British Empire"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'ancient': 'small',
        'modern': 'massive'
      },
      economicFocus: ['textiles', 'industry', 'trade', 'innovation']
    }
  ],

  // === SOUTH AND CENTRAL ASIA ===
  "Ferghana Valley": [
    {
        name: "Merv",
        isHistorical: true,
        foundingYear: -500,
        declineYear: 1221,
        description: "An ancient oasis city on the Silk Road, once one of the largest and most brilliant cities in the world.",
        allegianceHistory: {
            [-500]: "Achaemenid Empire",
            700: "Umayyad Caliphate",
            1037: "Seljuk Empire",
            1221: "Mongol Empire"
        },
        urbanDensity: 'massive',
        populationPeak: 500000,
        economicFocus: ['trade', 'silk', 'science', 'libraries']
    }
  ],
  "Malabar Coast": [
    {
      name: "Calicut",
      isHistorical: true,
      foundingYear: 1042,
      description: "The city of spices, a major trading port on the Malabar Coast and the first landing site of Vasco da Gama.",
      allegianceHistory: {
        1042: "Zamorins of Calicut",
        1766: "Kingdom of Mysore",
        1792: "British Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['spices', 'pepper', 'trade', 'shipping']
    },
    {
      name: "Mumbai",
      isHistorical: true,
      foundingYear: 1507,
      description: "Major port city and commercial center, gateway to western India.",
      allegianceHistory: {
        1507: "Portuguese Empire",
        1661: "British Empire",
        1947: "India"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'textiles', 'shipping', 'cotton', 'finance']
    }
  ],
  "Western Ghats": [
    {
      name: "Goa",
      isHistorical: true,
      foundingYear: 100,
      description: "The golden capital of the Portuguese Empire in the East, a center of trade and Christian conversion.",
      allegianceHistory: {
        1370: "Vijayanagara Empire",
        1469: "Bahmani Sultanate",
        1510: "Portuguese Empire",
        1961: "India"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'spices', 'religion', 'shipping']
    }
  ],

  "Harappa Basin": [
      {
        name: "Harappa",
        isHistorical: true,
        foundingYear: -2600,
        declineYear: -1900,
        description: "A major urban center of the Indus Valley Civilization, one of the world's earliest and most advanced civilizations.",
        allegianceHistory: {
            [-2600]: "Indus Valley Civilization"
        }
      }
  ],
  "Varanasi Basin": [
    {
      name: "Varanasi",
      isHistorical: true,
      foundingYear: -1200,
      description: "One of the world's oldest cities and holiest site in Hinduism.",
      allegianceHistory: {
        "-1200": "Vedic Kingdoms",
        "-600": "Mahajanapadas",
        321: "Mauryan Empire",
        320: "Gupta Empire",
        1194: "Delhi Sultanate",
        1526: "Mughal Empire",
        1775: "British East India Company",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['religion', 'education', 'textiles', 'crafts', 'pilgrimage']
    }
  ],
  "Delhi Region": [
    {
      // Purana Qila, the traditional site of the legendary Mahabharata
      // capital Indraprastha; excavations there show continuous
      // occupation only from the Mauryan period onward, so the founding
      // year given here is the archaeological one, not the much earlier
      // legendary/epic date.
      name: "Indraprastha",
      isHistorical: true,
      foundingYear: -300,
      declineYear: 300,
      description: "A river-side settlement on the site later known as Purana Qila, traditionally identified with the legendary Mahabharata capital.",
      allegianceHistory: {
        [-300]: "Mauryan Empire",
        [-185]: "Shunga Empire",
        320: "Gupta Empire"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'agriculture', 'river_transport']
    },
    {
      name: "Delhi",
      isHistorical: true,
      foundingYear: 1052,
      description: "Capital of multiple Indian empires, seat of Mughal power.",
      allegianceHistory: {
        1052: "Tomara Dynasty",
        1180: "Chauhan Dynasty",
        1206: "Delhi Sultanate",
        1526: "Mughal Empire",
        1803: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['government', 'textiles', 'metalwork', 'ivory', 'administration']
    },
    {
      name: "Agra",
      isHistorical: true,
      foundingYear: 1504,
      description: "Mughal capital and home of the Taj Mahal, center of Indo-Islamic architecture.",
      allegianceHistory: {
        1504: "Mughal Empire",
        1803: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      populationPeak: 200000,
      economicFocus: ['architecture', 'marble', 'textiles', 'crafts', 'government']
    }
  ],
  "Kandy Plateau": [
    {
      name: "Kandy",
      isHistorical: true,
      foundingYear: 1592,
      description: "The mountain capital of the last independent Sinhalese kingdom, guardian of the sacred tooth relic.",
      allegianceHistory: {
        1592: "Kingdom of Kandy",
        1815: "British Empire"
      }
    }
  ],
  "Nile Delta": [
    {
      // Moved from the orphaned "Nile Valley" key — that name is a region,
      // not a map area. Memphis sat at the apex of the delta, near modern
      // Cairo, and continued to exist (declining) alongside Alexandria for
      // centuries after Alexandria's founding.
      name: "Memphis",
      isHistorical: true,
      foundingYear: -3100,
      declineYear: 641,
      description: "The ancient capital of the Old Kingdom of Egypt, seat of the pharaohs who built the great pyramids.",
      allegianceHistory: {
        [-3100]: "Ancient Egypt (Old Kingdom)",
        [-332]: "Ptolemaic Kingdom",
        [-30]: "Roman Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['government', 'religion', 'monumental_architecture', 'crafts']
    },
    {
        name: "Alexandria",
        isHistorical: true,
        foundingYear: -331,
        description: "Founded by Alexander the Great, a legendary center of Hellenistic learning and trade, home to the Great Library.",
        allegianceHistory: {
            [-331]: "Ptolemaic Kingdom",
            [-30]: "Roman Empire",
            641: "Rashidun Caliphate",
            1517: "Ottoman Empire"
        }
    },
    {
      name: "Cairo",
      isHistorical: true,
      foundingYear: 969,
      description: "The largest city in the Islamic world and Egypt's capital, center of Islamic learning.",
      allegianceHistory: {
        969: "Fatimid Caliphate",
        1171: "Ayyubid Sultanate",
        1250: "Mamluk Sultanate",
        1517: "Ottoman Empire",
        1805: "Ottoman Egypt",
        1914: "British Protectorate",
        1922: "Kingdom of Egypt"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'massive',
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 500000,
      economicFocus: ['trade', 'textiles', 'islamic_scholarship', 'spices', 'administration']
    }
  ],
  "Thebes Valley": [
    {
      name: "Thebes",
      isHistorical: true,
      foundingYear: -3200,
      description: "The magnificent capital of the New Kingdom, city of a hundred gates and the Valley of the Kings.",
      allegianceHistory: {
        [-3200]: "Ancient Egypt",
        [-30]: "Roman Empire",
        641: "Rashidun Caliphate"
      }
    }
  ],
  "Jerusalem Hills": [
    {
      name: "Jerusalem",
      isHistorical: true,
      foundingYear: -1000,
      description: "Holy city sacred to Judaism, Christianity, and Islam.",
      allegianceHistory: {
        "-1000": "Kingdom of Israel",
        "-586": "Babylonian Empire",
        "-539": "Achaemenid Empire",
        "-332": "Macedonian Empire",
        "-63": "Roman Republic",
        638: "Rashidun Caliphate",
        1099: "Crusader Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Jordan/Israel"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['religion', 'pilgrimage', 'trade', 'crafts', 'administration']
    },
    {
      name: "Bethlehem",
      isHistorical: true,
      foundingYear: -1350,
      description: "Birthplace of Jesus Christ, major Christian pilgrimage site.",
      allegianceHistory: {
        [-1350]: "Canaanite Settlement",
        [-1000]: "Kingdom of Judah",
        638: "Rashidun Caliphate",
        1099: "Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Jordanian Control",
        1967: "Israeli Occupation",
        1995: "Palestinian Authority"
      },
      urbanDensity: 'small',
      populationPeak: 30000,
      economicFocus: ['pilgrimage', 'tourism', 'olive wood', 'mother-of-pearl']
    },
    {
      name: "Hebron",
      isHistorical: true,
      foundingYear: -3500,
      description: "Ancient city with the Tomb of the Patriarchs, sacred to Jews and Muslims.",
      allegianceHistory: {
        [-3500]: "Canaanite City",
        [-1000]: "Kingdom of Judah",
        638: "Rashidun Caliphate",
        1099: "Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Jordanian Control",
        1967: "Israeli Occupation"
      },
      urbanDensity: 'moderate',
      populationPeak: 250000,
      economicFocus: ['glass', 'pottery', 'leather', 'grapes']
    }
  ],
  "Tigris–Euphrates Confluence": [
    {
      name: "Baghdad",
      isHistorical: true,
      foundingYear: 762,
      description: "The round city of peace, capital of the Abbasid Caliphate and center of the Islamic Golden Age.",
      allegianceHistory: {
        762: "Abbasid Caliphate",
        1258: "Mongol Empire",
        1534: "Ottoman Empire"
      }
    }
  ],

  // No entry for the "pre-3000 BCE" band: left open deliberately. Tepe
  // Sialk, the nearest well-known Chalcolithic proto-urban site, sits in
  // the Kashan basin, a different watershed and a different map area, not
  // the Isfahan basin itself; no comparably attested site exists here
  // before 3000 BCE.
  "Isfahan Basin": [
    {
      name: "Isfahan",
      isHistorical: true,
      foundingYear: -500,
      description: "Jewel of the Safavid Empire and architectural marvel of Persia.",
      allegianceHistory: {
        "-500": "Achaemenid Empire",
        642: "Rashidun Caliphate",
        1051: "Seljuk Empire",
        1501: "Safavid Empire",
        1722: "Afghan Hotaki Dynasty",
        1729: "Safavid Restoration",
        1785: "Zand Dynasty",
        1794: "Qajar Dynasty"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'massive'
      },
      populationPeak: 600000,
      economicFocus: ['crafts', 'carpets', 'textiles', 'trade', 'architecture']
    },
    {
      name: "Tehran",
      isHistorical: true,
      foundingYear: 1200,
      description: "Persian capital and major center of Iranian civilization.",
      allegianceHistory: {
        1200: "Khwarezmid Empire",
        1220: "Mongol Empire",
        1501: "Safavid Empire",
        1736: "Afsharid Dynasty",
        1785: "Zand Dynasty",
        1794: "Qajar Dynasty",
        1925: "Pahlavi Dynasty",
        1979: "Islamic Republic of Iran"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 250000,
      economicFocus: ['government', 'carpets', 'silk', 'trade', 'crafts']
    }
  ],
  "Punjab Plains": [
    {
      name: "Harappa",
      isHistorical: true,
      foundingYear: -3300,
      declineYear: -1300,
      description: "One of the two great cities of the Indus Valley Civilization, with planned streets, granaries and a standardized system of weights.",
      allegianceHistory: {
        [-3300]: "Indus Valley Civilization"
      },
      urbanDensity: 'large',
      populationPeak: 23500,
      economicFocus: ['trade', 'agriculture', 'crafts', 'urban_planning']
    },
    {
      name: "Lahore",
      isHistorical: true,
      foundingYear: 1000,
      description: "Jewel of the Mughal Empire and major center of Indo-Islamic culture.",
      allegianceHistory: {
        1000: "Ghaznavid Empire",
        1186: "Ghurid Dynasty",
        1206: "Delhi Sultanate",
        1524: "Mughal Empire",
        1747: "Durrani Empire",
        1799: "Sikh Empire",
        1849: "British Punjab",
        1947: "Pakistan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'textiles', 'administration', 'crafts', 'gardens']
    }
  ],
  "Java Sea": [
    {
      // Was open-ended (no declineYear), leaving "Batavia" as the standing
      // name into the present. Bounded at 1949, when the city was
      // officially confirmed as Jakarta on Indonesian independence — see
      // the "Jakarta" entries under West Java Coast, the more specific
      // area for the city proper.
      name: "Batavia",
      isHistorical: true,
      foundingYear: 1619,
      declineYear: 1949,
      description: "The fortified headquarters of the Dutch East India Company (VOC), commanding the spice trade of the archipelago.",
      allegianceHistory: {
        1619: "Dutch East India Company",
        1799: "Dutch East Indies"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large'
      },
      economicFocus: ['trade', 'spices', 'shipping', 'administration']
    }
  ],
  "Tibetan Plateau": [
    {
      name: "Lhasa",
      isHistorical: true,
      foundingYear: 637,
      description: "The forbidden city on the roof of the world, the holy center of Tibetan Buddhism and home of the Dalai Lamas.",
      allegianceHistory: {
        637: "Tibetan Empire",
        1642: "Ganden Phodrang Government",
        1720: "Qing Dynasty (Protectorate)"
      },
      urbanDensity: 'small',
      economicFocus: ['religion', 'government', 'monasticism']
    }
  ],


  "Inland Sea Coast": [
    {
      name: "Osaka",
      isHistorical: true,
      foundingYear: 1496,
      description: "Major commercial center of Japan and gateway to the Inland Sea.",
      allegianceHistory: {
        1496: "Sengoku Period",
        1583: "Toyotomi Clan",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['trade', 'crafts', 'textiles', 'sake', 'rice']
    }
  ],



  // === MENA & MAGHREB ===

  "Rif Coast": [
  {
    name: "Tangier",
    isHistorical: true,
    foundingYear: -500,
    description: "A strategic port at the Strait of Gibraltar, fought over by many empires.",
    allegianceHistory: {
      [-500]: "Carthaginian Empire",
      [-146]: "Roman Empire",
      711: "Umayyad Caliphate",
      1471: "Portuguese Empire",
      1661: "English Crown",
      1684: "Alaouite Dynasty"
    },
    urbanDensity: "moderate",
    populationPeak: 80000,
    economicFocus: ["shipping", "grain", "salt", "smuggling"]
  }
],


  "Diyala Valley": [
  {
    name: "Ctesiphon",
    isHistorical: true,
    foundingYear: 120,
    declineYear: 637,
    description: "Capital of the Parthian and Sassanian Empires, famous for its vaulted palace arch.",
    allegianceHistory: {
      120: "Parthian Empire",
      224: "Sassanian Empire",
      637: "Rashidun Caliphate"
    },
    urbanDensity: "large",
    populationPeak: 500000,
    economicFocus: ["administration", "luxury_trade", "stone_architecture"]
  }
],


  "Babylon Region": [
    {
      name: "Babylon",
      isHistorical: true,
      foundingYear: -2300,
      description: "Ancient capital of Mesopotamia and center of the Babylonian Empire.",
      allegianceHistory: {
        "-2300": "Akkadian Empire",
        "-1894": "First Babylonian Dynasty",
        "-1595": "Kassite Dynasty",
        "-626": "Neo-Babylonian Empire",
        "-539": "Achaemenid Empire",
        "-331": "Macedonian Empire",
        "-141": "Parthian Empire",
        224: "Sassanid Empire",
        637: "Rashidun Caliphate"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['administration', 'religion', 'trade', 'agriculture', 'astronomy'],
      declineYear: 650  // City largely abandoned by 7th century CE
    }
  ],
"Nineveh Plain": [
  {
    name: "Nineveh",
    isHistorical: true,
    foundingYear: -6000,
    declineYear: -612,
    description: "The last great capital of the Assyrian Empire, with monumental walls and palaces on the Tigris River.",
    allegianceHistory: {
      [-6000]: "Assyrian Settlements",
      [-700]: "Neo-Assyrian Empire",
      [-612]: "Medes & Babylonians"
    },
    urbanDensity: 'large',
    populationPeak: 150000,
    economicFocus: ['IRON_TOOLS', 'LINEN_TEXTILES', 'STONE_BLOCK', 'HORSES']
  }
],
"Mount Lebanon Range": [
  {
    name: "Tyre",
    isHistorical: true,
    foundingYear: -2750,
    description: "The great island-fortress of Phoenicia, a mercantile powerhouse that founded colonies across the Mediterranean.",
    allegianceHistory: {
      [-2750]: "Phoenician City-State",
      [-332]: "Macedonian Empire",
      [-64]: "Roman Empire",
      638: "Rashidun Caliphate"
    },
    urbanDensity: 'moderate',
    populationPeak: 50000,
    economicFocus: ['PURPLE_DYE', 'CEDAR_TIMBER', 'GLASSWARE', 'OLIVE_OIL']
  }
],
"Tripolitania": [
  {
    name: "Tripoli",
    isHistorical: true,
    foundingYear: -700,
    description: "A key Mediterranean port in modern Libya, contested across Phoenician, Roman, Ottoman, and Italian rule.",
    allegianceHistory: {
      [-700]: "Phoenician Colonies",
      [-146]: "Roman Empire",
      642: "Rashidun Caliphate",
      1551: "Ottoman Empire",
      1911: "Italian Empire"
    },
    urbanDensity: 'moderate',
    populationPeak: 100000,
    economicFocus: ['OLIVE_OIL', 'SPICES', 'SLAVE_TRADE', 'SHIPBUILDING']
  }
],
"Cyrenaica Coast": [
  {
    name: "Cyrene",
    isHistorical: true,
    foundingYear: -630,
    declineYear: 365,
    description: "A prosperous Greek colony in Cyrenaica, later an important Roman city until devastated by an earthquake.",
    allegianceHistory: {
      [-630]: "Greek Colonists (Thera)",
      [-323]: "Ptolemaic Kingdom",
      [-96]: "Roman Republic",
      365: "Roman Empire (destroyed by earthquake)"
    },
    urbanDensity: 'moderate',
    populationPeak: 100000,
    economicFocus: ['BARLEY', 'WINE', 'PHILOSOPHY_SCHOOLS', 'STATUARY']
  }
],
"Atlas Mountains": [
  {
    name: "Marrakesh",
    isHistorical: true,
    foundingYear: 1070,
    description: "The red city of Morocco, an imperial capital and a hub for trade, religion, and politics.",
    allegianceHistory: {
      1070: "Almoravid Dynasty",
      1147: "Almohad Caliphate",
      1269: "Marinid Dynasty",
      1549: "Saadian Dynasty",
      1666: "Alaouite Dynasty"
    },
    urbanDensity: 'large',
    populationPeak: 900000,
    economicFocus: ['CARPETS', 'SPICE_TRADE', 'ARCHITECTURE', 'METALWORK']
  }
],


  // === AFRICA (CONTINUED) ===
  "Sahelian Scrublands": [
    {
      name: "Kano",
      isHistorical: true,
      foundingYear: 999,
      description: "A major hub of the trans-Saharan trade, the walled capital of a Hausa kingdom famed for its dyed cloth.",
      allegianceHistory: {
        999: "Kingdom of Kano",
        1807: "Sokoto Caliphate",
        1903: "British Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'textiles', 'leatherwork', 'agriculture']
    }
  ],
  "Gold Coast Savanna": [
    {
        name: "Elmina",
        isHistorical: true,
        foundingYear: 1482,
        description: "The first European trading post in sub-Saharan Africa, a castle built for gold that became central to the slave trade.",
        allegianceHistory: {
            1482: "Portuguese Empire",
            1637: "Dutch Empire",
            1872: "British Empire"
        },
        urbanDensity: 'small',
        economicFocus: ['gold', 'slaves', 'trade']
    }
  ],
  "Zambezi Floodplain": [
    {
      name: "Sofala",
      isHistorical: true,
      foundingYear: 700,
      declineYear: 1890,
      description: "The ancient Swahili port that served as the primary outlet for the gold of Great Zimbabwe.",
      allegianceHistory: {
        700: "Swahili Coast City-States",
        1505: "Portuguese Empire"
      },
      urbanDensity: 'small',
      economicFocus: ['gold', 'trade', 'ivory']
    }
  ],
  "Highlands of Madagascar": [
    {
      name: "Antananarivo",
      isHistorical: true,
      foundingYear: 1610,
      description: "The high-altitude capital of the Merina Kingdom, which united Madagascar under its rule.",
      allegianceHistory: {
        1610: "Kingdom of Imerina",
        1817: "Kingdom of Madagascar",
        1897: "French Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['government', 'trade', 'crafts']
    }
  ],

  // === THE AMERICAS ===
  "Greater Antilles": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "Key to the New World and treasure fleet terminus of the Spanish Empire.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1762: "British Empire",
        1763: "Spanish Empire",
        1898: "United States",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance_early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'sugar', 'tobacco', 'shipping', 'fortification']
    }
  ],
  "Mosquito Coast": [
    {
      name: "Cartagena",
      isHistorical: true,
      foundingYear: 1533,
      description: "A heavily fortified Spanish port on the Caribbean, a key hub for trade and defense of the Main.",
      allegianceHistory: {
        1533: "Spanish Empire",
        1821: "Gran Colombia"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'slaves', 'silver', 'fortifications']
    }
  ],
  "Mayan Lowlands": [
    {
      // Merged with a second "Tikal" entry that used to sit under the
      // orphaned "Central America" key (a region name, not a map area);
      // that copy recorded a populationPeak this entry lacked.
      name: "Tikal",
      isHistorical: true,
      foundingYear: -400,
      declineYear: 900,
      description: "A dominant Maya city-state whose towering temples pierced the jungle canopy.",
      allegianceHistory: {
        [-400]: "Maya City-States",
      },
      urbanDensity: 'large',
      populationPeak: 100000,
      economicFocus: ['government', 'religion', 'monumental_architecture', 'warfare']
    },
    {
      // Moved from the orphaned "Central America" key. Guatemala City
      // itself is a highland capital, but "Mayan Lowlands" is the only
      // Central America area covering Guatemala at all — the region's
      // others are Panama Isthmus, Mosquito Coast and Darien Swamp.
      name: "Guatemala City",
      isHistorical: true,
      foundingYear: 1776,
      description: "Capital of the Captaincy General, built after earthquakes destroyed the old capital.",
      allegianceHistory: {
        1776: "Spanish Empire",
        1821: "First Mexican Empire",
        1823: "Federal Republic of Central America",
        1838: "Republic of Guatemala"
      },
      urbanDensity: 'moderate',
      economicFocus: ['government', 'trade', 'coffee', 'textiles']
    }
  ],

  // === OCEANIA ===
  "Murray River Valley": [
    {
      name: "Melbourne",
      isHistorical: true,
      foundingYear: 1835,
      description: "A boomtown that became the richest city in the world during the Victorian gold rush.",
      allegianceHistory: {
        1835: "British Empire",
        1901: "Commonwealth of Australia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['gold', 'finance', 'wool', 'trade']
    }
  ],
  
  "Zuiderzee Coast": [
    {
      name: "Amsterdam",
      isHistorical: true,
      foundingYear: 1275,
      description: "The Venice of the North, built on canals and commerce.",
      allegianceHistory: {
        1275: "County of Holland",
        1433: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1581: "Dutch Republic",
        1795: "Batavian Republic",
        1815: "Kingdom of the Netherlands"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance': 'large',
        'modern': 'large'
      },
      economicFocus: ['trade', 'banking', 'shipbuilding', 'diamonds']
    },
    {
      name: "Brussels",
      isHistorical: true,
      foundingYear: 979,
      description: "Crossroads of Europe, from medieval cloth trade to EU capital.",
      allegianceHistory: {
        979: "Lower Lorraine",
        1183: "Duchy of Brabant",
        1430: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1714: "Austrian Netherlands",
        1795: "French Republic",
        1815: "United Kingdom of the Netherlands",
        1830: "Kingdom of Belgium"
      },
      urbanDensity: 'moderate',
      economicFocus: ['textiles', 'lace', 'government', 'international_organizations']
    }
  ],
  
  
  // North America additions
  "Pacific Coast Ranges": [
    {
      name: "Eureka",
      isHistorical: true,
      foundingYear: 1850,
      description: "Redwood lumber capital founded during the California Gold Rush.",
      allegianceHistory: {
        1850: "United States"
      },
      urbanDensity: 'small',
      economicFocus: ['lumber', 'fishing', 'gold']
    }
  ],
  
  "San Francisco Bay": [
    {
      name: "San Francisco",
      isHistorical: true,
      foundingYear: 1776,
      description: "From Spanish mission to Gold Rush boomtown to tech capital.",
      allegianceHistory: {
        1776: "Spanish Empire",
        1821: "Mexican Republic",
        1846: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'large',
        'modern': 'massive'
      },
      economicFocus: ['gold', 'shipping', 'finance', 'technology']
    }
  ],

  "Monterey Bay": [

    {
      name: "Monterey",
      isHistorical: true,
      foundingYear: 1770,
      description: "Capital of Spanish and Mexican California.",
      allegianceHistory: {
        1770: "Spanish Empire",
        1821: "Mexican Republic",
        1846: "United States"
      },
      urbanDensity: 'small',
      economicFocus: ['government', 'missions', 'fishing', 'whaling']
    }
  ],
  
  "Los Angeles Basin": [
    {
      name: "Los Angeles",
      isHistorical: true,
      foundingYear: 1781,
      description: "From Spanish pueblo to sprawling metropolis of dreams.",
      allegianceHistory: {
        1781: "Spanish Empire",
        1821: "Mexican Republic",
        1848: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['ranching', 'oil', 'entertainment', 'aerospace']
    }
  ],

  "San Diego Bay": [
    {
      name: "San Diego",
      isHistorical: true,
      foundingYear: 1769,
      description: "California's first Spanish settlement and mission.",
      allegianceHistory: {
        1769: "Spanish Empire",
        1821: "Mexican Republic",
        1848: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['missions', 'military', 'naval_base', 'tourism']
    }
  ],
  
  // Panama City moved from the orphaned "Central America" key (a region
  // name, not a map area) to "Panama Isthmus", which it sits squarely on.
  "Panama Isthmus": [
    {
      name: "Panama City",
      isHistorical: true,
      foundingYear: 1519,
      description: "Pacific gateway for Spanish treasure fleets from Peru.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1821: "Gran Colombia",
        1831: "Republic of New Granada",
        1903: "Republic of Panama"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trans-isthmian_trade', 'gold_transit', 'canal']
    }
  ],

  // "The Caribbean" was an orphaned key (a region name, not a map area).
  // All three of its cities were exact duplicates of entries already filed
  // under their correct, more specific islands — Havana under "Cuba",
  // Santo Domingo under "Hispaniola", Port Royal under "Jamaica" — and each
  // of those copies was richer, so nothing here needed to move.

  // "Nubian Corridor" was an orphaned key (no such map area exists; the
  // real areas are "Nubian Desert" and "Bayuda Desert"). Meroe and Dongola
  // both sit within the great bend of the Nile that "Bayuda Desert"
  // represents, so they move there. Khartoum does not: it sits at the
  // confluence of the Blue and White Nile, well south of the Bayuda bend,
  // and no map area covers that confluence — MENA's other Sudan-adjacent
  // areas are "Nubian Desert" (true desert interior, rated zero economic
  // activity — wrong fit for a river-confluence capital) and "Sudanese Red
  // Sea" (the coast, hundreds of kilometres away). Rather than force
  // Khartoum into either, it is dropped; see the task report.
  "Bayuda Desert": [
    {
      name: "Meroe",
      isHistorical: true,
      foundingYear: -800,
      declineYear: 350,
      description: "Capital of the Kingdom of Kush, city of iron and pyramids.",
      allegianceHistory: {
        [-800]: "Kingdom of Kush"
      },
      urbanDensity: 'moderate',
      populationPeak: 25000,
      economicFocus: ['iron_working', 'gold', 'ivory', 'incense_trade']
    },
    {
      name: "Dongola",
      isHistorical: true,
      foundingYear: 500,
      description: "Capital of Christian Nubia, resisting Islam for centuries.",
      allegianceHistory: {
        500: "Kingdom of Makuria",
        1317: "Mamluk Sultanate",
        1820: "Ottoman Egypt"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'christian_pilgrimage', 'gold', 'slaves']
    },
    {
      // Restored: the confluence of the Blue and White Nile is a couple of
      // hundred kilometres from Meroe, so this area — not "no area at all" —
      // is the honest home for it.
      name: "Khartoum",
      isHistorical: true,
      foundingYear: 1821,
      description: "Founded as an Egyptian garrison at the confluence of the Blue and White Nile.",
      allegianceHistory: {
        1821: "Ottoman Egypt",
        1885: "Mahdist State",
        1898: "Anglo-Egyptian Sudan",
        1956: "Republic of Sudan"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['administration', 'trade', 'gum_arabic', 'cotton']
    }
  ],

  // Moved from the orphaned "Ural and Arctic Europe" key (a region name,
  // not a map area) to "Ural Mountains", the real area both cities sit in.
  "Ural Mountains": [
    {
      name: "Yekaterinburg",
      isHistorical: true,
      foundingYear: 1723,
      description: "Gateway to Siberia, where the Romanovs met their end.",
      allegianceHistory: {
        1723: "Russian Empire",
        1917: "Russian Republic",
        1918: "Soviet Union",
        1991: "Russian Federation"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['mining', 'metallurgy', 'gems', 'industry']
    },
    {
      name: "Perm",
      isHistorical: true,
      foundingYear: 1723,
      description: "Major industrial center on the Kama River.",
      allegianceHistory: {
        1723: "Russian Empire",
        1917: "Soviet Union",
        1991: "Russian Federation"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      economicFocus: ['salt', 'copper', 'munitions', 'chemicals']
    }
  ],

  "Sundarbans Delta": [
    {
      // Chandraketugarh, in the Bengal delta near the Sundarbans;
      // excavated occupation layers run from the pre-Mauryan/NBPW period
      // through the Gupta and Pala eras, and it is widely identified as
      // the port classical geographers associated with the kingdom of
      // "Gangaridai".
      name: "Chandraketugarh",
      isHistorical: true,
      foundingYear: -400,
      declineYear: 1200,
      description: "A fortified river-delta port whose trade goods and terracotta art place it at the heart of ancient Gangaridai and, later, Gupta and Pala Bengal.",
      allegianceHistory: {
        [-400]: "Gangaridai",
        320: "Gupta Empire",
        750: "Pala Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'shipping', 'textiles']
    },
    {
      // Merged with a "Calcutta" entry that used to sit under the orphaned
      // "Gangetic Plain" key (a region name, not a map area) — the same
      // city under its colonial name. That copy added 'education' to the
      // economic focus, which this entry lacked.
      name: "Kolkata",
      isHistorical: true,
      foundingYear: 1690,
      description: "Major colonial port city and capital of British India until 1911.",
      allegianceHistory: {
        1690: "British East India Company",
        1858: "British Raj",
        1947: "Republic of India"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'industrial': 'massive',
        'modern': 'massive'
      },
      populationPeak: 14850000,
      economicFocus: ['trade', 'jute', 'industry', 'finance', 'education']
    },
    {
      name: "Dhaka",
      isHistorical: true,
      foundingYear: 1608,
      description: "Capital of Bengal and major center of muslin textile production.",
      allegianceHistory: {
        1608: "Mughal Empire",
        1765: "British East India Company",
        1858: "British Raj",
        1947: "Pakistan",
        1971: "Bangladesh"
      },
      urbanDensity: 'large',
      populationPeak: 200000,
      economicFocus: ['textiles', 'muslin', 'trade', 'river_transport', 'administration']
    },
    {
      name: "Khulna",
      isHistorical: true,
      foundingYear: 1882,
      description: "Major industrial port city in southwestern Bangladesh.",
      allegianceHistory: {
        1882: "British Raj",
        1947: "Pakistan",
        1971: "Bangladesh"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 1500000,
      economicFocus: ['jute', 'shipbuilding', 'fishing', 'shrimp']
    }
  ],

  "Chao Phraya Basin": [
    {
      name: "Bangkok",
      isHistorical: true,
      foundingYear: 1782,
      description: "Capital of Thailand and major Southeast Asian metropolis.",
      allegianceHistory: {
        1782: "Kingdom of Siam",
        1932: "Kingdom of Thailand"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'administration', 'rice', 'shipping', 'temples']
    },
    {
      name: "Ayutthaya",
      isHistorical: true,
      foundingYear: 1350,
      declineYear: 1767,
      description: "Former capital of the Ayutthaya Kingdom, major trading hub.",
      allegianceHistory: {
        1350: "Ayutthaya Kingdom",
        1767: "Destroyed by Burma"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance': 'massive'
      },
      populationPeak: 1000000,
      economicFocus: ['trade', 'ceramics', 'rice', 'diplomacy']
    },
    {
      name: "Nakhon Pathom",
      isHistorical: true,
      foundingYear: 500,
      description: "Ancient Mon-Dvaravati city with important Buddhist sites.",
      allegianceHistory: {
        500: "Dvaravati",
        1100: "Khmer Empire",
        1238: "Sukhothai Kingdom",
        1438: "Ayutthaya Kingdom",
        1782: "Kingdom of Siam"
      },
      urbanDensity: 'small',
      economicFocus: ['religion', 'agriculture', 'crafts']
    },
    {
      name: "Sukhothai",
      isHistorical: true,
      foundingYear: 1238,
      declineYear: 1438,
      description: "First independent Thai kingdom's capital, traditionally credited with the earliest Thai script.",
      allegianceHistory: {
        1238: "Sukhothai Kingdom",
        1438: "Ayutthaya Kingdom"
      },
      urbanDensity: 'moderate',
      economicFocus: ['administration', 'religion', 'ceramics']
    }
  ],

  "Tonle Sap Basin": [
    {
      name: "Angkor",
      isHistorical: true,
      foundingYear: 802,
      declineYear: 1431,
      description: "Capital of the Khmer Empire, largest pre-industrial city in the world.",
      allegianceHistory: {
        802: "Khmer Empire",
        1431: "Abandoned"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'medieval': 'massive'
      },
      populationPeak: 1000000,
      economicFocus: ['religion', 'hydraulic engineering', 'rice', 'administration']
    },
    {
      name: "Phnom Penh",
      isHistorical: true,
      foundingYear: 1372,
      description: "Capital founded after the fall of Angkor, at the confluence of rivers.",
      allegianceHistory: {
        1372: "Khmer Kingdom",
        1863: "French Protectorate",
        1953: "Kingdom of Cambodia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 2200000,
      economicFocus: ['trade', 'administration', 'crafts', 'fishing']
    },
    {
      name: "Battambang",
      isHistorical: true,
      foundingYear: 1100,
      description: "Historic trading post and rice-growing center.",
      allegianceHistory: {
        1100: "Khmer Empire",
        1795: "Siam",
        1907: "French Protectorate",
        1953: "Kingdom of Cambodia"
      },
      urbanDensity: 'small',
      economicFocus: ['rice', 'trade', 'agriculture']
    }
  ],

  "West Java Coast": [
    {
      // Sundapura, the Tarumanagara-era port mentioned in the Tugu
      // inscription of King Purnawarman (397 CE); its exact location is
      // debated among historians but is placed broadly on this coast,
      // ancestral to the Sunda Kingdom's later port of Sunda Kelapa below.
      name: "Sundapura",
      isHistorical: true,
      foundingYear: 397,
      declineYear: 669,
      description: "River-mouth capital of the Hindu kingdom of Tarumanagara, described in an inscription of King Purnawarman.",
      allegianceHistory: {
        397: "Tarumanagara"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'agriculture', 'river_transport']
    },
    {
      name: "Sunda Kelapa",
      isHistorical: true,
      foundingYear: 669,
      declineYear: 1527,
      description: "The Sunda Kingdom's main port, captured and renamed Jayakarta by Demak-aligned forces in 1527.",
      allegianceHistory: {
        669: "Sunda Kingdom"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'pepper', 'shipping']
    },
    {
      // This entry used to be a single "Jakarta" spanning 1619 to the
      // present, and even started its allegianceHistory in 1527 — before
      // its own foundingYear. Split into the three era-correct names:
      // Jayakarta (the Demak/Banten-controlled port), Batavia (the VOC and
      // colonial city), and Jakarta (post-independence).
      name: "Jayakarta",
      isHistorical: true,
      foundingYear: 1527,
      declineYear: 1619,
      description: "A Sundanese port renamed after its capture by Demak-aligned forces, later a vassal of the Banten sultanate, until the Dutch razed it.",
      allegianceHistory: {
        1527: "Sultanate of Demak",
        1552: "Sultanate of Banten"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'pepper', 'shipping']
    },
    {
      name: "Batavia",
      isHistorical: true,
      foundingYear: 1619,
      declineYear: 1949,
      description: "Dutch colonial capital of the East Indies, built on the ruins of Jayakarta as headquarters of the VOC and later the colonial state.",
      allegianceHistory: {
        1619: "Dutch East India Company",
        1800: "Dutch East Indies",
        1942: "Japanese Empire"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'spices', 'administration', 'shipping', 'sugar']
    },
    {
      name: "Jakarta",
      isHistorical: true,
      foundingYear: 1949,
      description: "Capital of independent Indonesia, the renamed successor to colonial Batavia and the largest city in Southeast Asia.",
      allegianceHistory: {
        1949: "Indonesia"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10500000,
      economicFocus: ['trade', 'administration', 'shipping', 'finance', 'manufacturing']
    },
    {
      name: "Bandung",
      isHistorical: true,
      foundingYear: 1810,
      description: "Highland city founded as a Dutch colonial retreat and plantation center.",
      allegianceHistory: {
        1810: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 2500000,
      economicFocus: ['textiles', 'tea', 'quinine', 'education']
    },
    {
      name: "Banten",
      isHistorical: true,
      foundingYear: 1526,
      declineYear: 1832,
      description: "Major sultanate and pepper trading port before Dutch conquest.",
      allegianceHistory: {
        1526: "Sultanate of Banten",
        1682: "Dutch East Indies"
      },
      urbanDensity: 'moderate',
      economicFocus: ['pepper', 'trade', 'Islam', 'shipbuilding']
    }
  ],

  // No entry for the "3000 BCE-500 CE" band: left open deliberately.
  // Java's earliest attested kingdoms (Tarumanagara in the west,
  // Kalingga/Holing in the center) are both outside East Java, and East
  // Java's own earliest kingdom, Kanjuruhan, is not attested before 760
  // CE (see Malang below).
  "East Java Coast": [
    {
      name: "Surabaya",
      isHistorical: true,
      foundingYear: 1293,
      description: "Major port city and naval base, second largest city in Indonesia.",
      allegianceHistory: {
        1293: "Majapahit Empire",
        1500: "Demak Sultanate",
        1625: "Mataram Sultanate",
        1743: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 2900000,
      economicFocus: ['trade', 'shipbuilding', 'sugar', 'manufacturing']
    },
    {
      name: "Malang",
      isHistorical: true,
      foundingYear: 760,
      description: "Highland city with ancient Hindu-Buddhist kingdom heritage.",
      allegianceHistory: {
        760: "Kingdom of Kanjuruhan",
        1222: "Singhasari Kingdom",
        1293: "Majapahit Empire",
        1500: "Demak Sultanate",
        1767: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      populationPeak: 850000,
      economicFocus: ['agriculture', 'coffee', 'education', 'tourism']
    },
    {
      name: "Gresik",
      isHistorical: true,
      foundingYear: 1100,
      description: "Historic Islamic port and center of early Islamic propagation in Java.",
      allegianceHistory: {
        1100: "Independent port city",
        1487: "Demak Sultanate",
        1680: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'Islam', 'shipbuilding', 'fishing']
    },
    {
      // Trowulan itself sits inland from the coast, but geography.ts has
      // no separate "East Java interior" locale, so the Majapahit capital
      // is filed here alongside the other East Java port cities.
      name: "Trowulan",
      isHistorical: true,
      foundingYear: 1293,
      declineYear: 1527,
      description: "Capital of the Majapahit Empire, the largest pre-colonial state in maritime Southeast Asia.",
      allegianceHistory: {
        1293: "Majapahit Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['administration', 'religion', 'trade', 'rice']
    }
  ],

  "Lagos Coastal Belt": [
    {
      name: "Lagos",
      isHistorical: true,
      foundingYear: 1472,
      description: "Major Atlantic port founded by Portuguese, later British colonial capital.",
      allegianceHistory: {
        1472: "Kingdom of Awori",
        1730: "Kingdom of Benin",
        1861: "British Colony",
        1960: "Nigeria"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 21000000,
      economicFocus: ['trade', 'palm oil', 'finance', 'entertainment']
    },
    {
      name: "Benin City",
      isHistorical: true,
      foundingYear: 1180,
      description: "Capital of the Benin Empire, famous for bronze casting and walls.",
      allegianceHistory: {
        1180: "Benin Empire",
        1897: "British Protectorate",
        1960: "Nigeria"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance': 'large'
      },
      populationPeak: 1500000,
      economicFocus: ['bronze', 'ivory', 'administration', 'trade']
    },
    {
      name: "Porto-Novo",
      isHistorical: true,
      foundingYear: 1688,
      description: "Capital of Dahomey kingdom and later French colonial Benin.",
      allegianceHistory: {
        1688: "Kingdom of Porto-Novo",
        1883: "French Protectorate",
        1960: "Republic of Dahomey",
        1975: "Benin"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'palm oil', 'administration']
    }
  ],

  "Ivory Coast": [
    {
      name: "Abidjan",
      isHistorical: true,
      foundingYear: 1898,
      description: "Major port city developed during French colonial period.",
      allegianceHistory: {
        1898: "French West Africa",
        1960: "Ivory Coast"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 5000000,
      economicFocus: ['cocoa', 'coffee', 'timber', 'finance']
    },
    {
      name: "Grand-Bassam",
      isHistorical: true,
      foundingYear: 1842,
      declineYear: 1896,
      description: "First French colonial capital, abandoned due to yellow fever.",
      allegianceHistory: {
        1842: "French Trading Post",
        1893: "French West Africa",
        1960: "Ivory Coast"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'ivory', 'palm oil', 'rubber']
    },
    {
      name: "Kong",
      isHistorical: true,
      foundingYear: 1100,
      declineYear: 1895,
      description: "Major Islamic scholarly and trading center in West Africa.",
      allegianceHistory: {
        1100: "Kong Empire",
        1710: "Independent city-state",
        1895: "Destroyed by Samory Touré"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'Islamic scholarship', 'kola nuts', 'gold']
    }
  ],

  "Amazon Delta": [
    {
      name: "Belém",
      isHistorical: true,
      foundingYear: 1616,
      description: "Gateway to the Amazon, major rubber boom port city.",
      allegianceHistory: {
        1616: "Portuguese Brazil",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'moderate',
        'modern': 'large'
      },
      populationPeak: 2500000,
      economicFocus: ['rubber', 'brazil nuts', 'timber', 'fishing']
    },
    {
      name: "Macapá",
      isHistorical: true,
      foundingYear: 1758,
      description: "Strategic fortress city at the Amazon mouth on the equator.",
      allegianceHistory: {
        1758: "Portuguese Brazil",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'small',
      populationPeak: 500000,
      economicFocus: ['defense', 'fishing', 'minerals', 'timber']
    },
    {
      name: "Santarém",
      isHistorical: true,
      foundingYear: 1661,
      description: "River confluence city, center of pre-Columbian Tapajós culture.",
      allegianceHistory: {
        [-1000]: "Tapajós culture",
        1661: "Portuguese Brazil",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'small',
      populationPeak: 300000,
      economicFocus: ['rubber', 'agriculture', 'fishing', 'soybeans']
    }
  ],

  "Iceland": [
    {
      name: "Reykjavik",
      isHistorical: true,
      foundingYear: 874,
      description: "Nordic settlement that became Iceland's capital and largest city.",
      allegianceHistory: {
        874: "Norse Commonwealth",
        1262: "Kingdom of Norway",
        1380: "Kalmar Union",
        1814: "Kingdom of Denmark",
        1918: "Kingdom of Iceland",
        1944: "Republic of Iceland"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      populationPeak: 140000,
      economicFocus: ['fishing', 'trade', 'government']
    },
    {
      name: "Thingvellir",
      isHistorical: true,
      foundingYear: 930,
      declineYear: 1798,
      description: "Site of the Althing, one of the world's oldest parliaments.",
      allegianceHistory: {
        930: "Norse Commonwealth",
        1262: "Kingdom of Norway"
      },
      urbanDensity: 'small',
      economicFocus: ['government', 'law', 'assembly']
    },
    {
      name: "Akureyri",
      isHistorical: true,
      foundingYear: 1602,
      description: "Northern Iceland's main trading port and fishing center.",
      allegianceHistory: {
        1602: "Kingdom of Denmark",
        1918: "Kingdom of Iceland",
        1944: "Republic of Iceland"
      },
      urbanDensity: 'small',
      populationPeak: 20000,
      economicFocus: ['fishing', 'whaling', 'trade']
    }
  ],

  "Kashmir Valley": [
    {
      name: "Srinagar",
      isHistorical: true,
      foundingYear: -250,
      description: "Ancient city on Dal Lake, summer capital of Kashmir.",
      allegianceHistory: {
        [-250]: "Mauryan Empire",
        320: "Gupta Empire",
        700: "Karkota Dynasty",
        1339: "Kashmir Sultanate",
        1586: "Mughal Empire",
        1752: "Durrani Empire",
        1819: "Sikh Empire",
        1846: "Dogra Dynasty",
        1947: "Disputed Territory"
      },
      urbanDensity: 'moderate',
      populationPeak: 1500000,
      economicFocus: ['handicrafts', 'tourism', 'horticulture', 'silk']
    },
    {
      name: "Anantnag",
      isHistorical: true,
      foundingYear: -250,
      description: "Ancient pilgrimage center with sacred springs.",
      allegianceHistory: {
        [-250]: "Local Kingdom",
        700: "Kashmir Kingdom",
        1586: "Mughal Empire",
        1846: "Dogra Dynasty",
        1947: "Disputed Territory"
      },
      urbanDensity: 'small',
      economicFocus: ['pilgrimage', 'agriculture', 'handicrafts']
    }
  ],

  "Manchurian Plain": [
    {
      name: "Shenyang",
      isHistorical: true,
      foundingYear: -300,
      description: "Ancient city that became the Manchu capital before conquering China.",
      allegianceHistory: {
        [-300]: "Yan State",
        1625: "Later Jin",
        1636: "Qing Dynasty",
        1912: "Republic of China",
        1931: "Manchukuo",
        1945: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 9000000,
      economicFocus: ['industry', 'machinery', 'military']
    },
    {
      name: "Harbin",
      isHistorical: true,
      foundingYear: 1898,
      description: "Russian-built railway city, the 'Moscow of the East'.",
      allegianceHistory: {
        1898: "Russian Empire",
        1917: "Russian Civil War",
        1932: "Manchukuo",
        1945: "Soviet Occupation",
        1946: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10000000,
      economicFocus: ['railways', 'industry', 'trade']
    },
    {
      name: "Changchun",
      isHistorical: true,
      foundingYear: 1800,
      description: "Former capital of Manchukuo, major industrial center.",
      allegianceHistory: {
        1800: "Qing Dynasty",
        1932: "Manchukuo",
        1945: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 8000000,
      economicFocus: ['automobiles', 'film', 'railways']
    }
  ],



  "Guyana Highlands": [
    {
      name: "Georgetown",
      isHistorical: true,
      foundingYear: 1781,
      description: "Capital built by the Dutch below sea level, the 'Garden City of the Caribbean'.",
      allegianceHistory: {
        1781: "Dutch Colony",
        1814: "British Guiana",
        1966: "Guyana"
      },
      urbanDensity: 'moderate',
      populationPeak: 240000,
      economicFocus: ['sugar', 'rice', 'bauxite', 'gold']
    },
    {
      name: "Ciudad Bolivar",
      isHistorical: true,
      foundingYear: 1764,
      description: "Historic river port on the Orinoco, gateway to Venezuelan Guayana.",
      allegianceHistory: {
        1764: "Spanish Empire",
        1817: "Gran Colombia",
        1830: "Venezuela"
      },
      urbanDensity: 'moderate',
      populationPeak: 500000,
      economicFocus: ['river trade', 'cattle', 'gold', 'diamonds']
    }
  ],

  "Tierra del Fuego": [
    {
      name: "Ushuaia",
      isHistorical: true,
      foundingYear: 1884,
      description: "Southernmost city in the world, gateway to Antarctica.",
      allegianceHistory: {
        1884: "Argentina"
      },
      urbanDensity: 'small',
      populationPeak: 80000,
      economicFocus: ['tourism', 'fishing', 'electronics', 'prison']
    },
    {
      name: "Rio Grande",
      isHistorical: true,
      foundingYear: 1893,
      description: "Sheep ranching center on the Atlantic coast.",
      allegianceHistory: {
        1893: "Argentina"
      },
      urbanDensity: 'small',
      populationPeak: 100000,
      economicFocus: ['sheep', 'oil', 'gas', 'manufacturing']
    }
  ],


  "Azores": [
    {
      name: "Ponta Delgada",
      isHistorical: true,
      foundingYear: 1450,
      description: "Capital of the Azores, strategic Atlantic waystation.",
      allegianceHistory: {
        1450: "Kingdom of Portugal",
        1580: "Iberian Union",
        1640: "Kingdom of Portugal",
        1910: "Portuguese Republic"
      },
      urbanDensity: 'small',
      populationPeak: 70000,
      economicFocus: ['whaling', 'agriculture', 'tourism', 'shipping']
    },
    {
      name: "Angra do Heroísmo",
      isHistorical: true,
      foundingYear: 1478,
      description: "Historic port city, crucial stop for treasure fleets from the Americas.",
      allegianceHistory: {
        1478: "Kingdom of Portugal",
        1580: "Iberian Union",
        1640: "Kingdom of Portugal",
        1910: "Portuguese Republic"
      },
      urbanDensity: 'small',
      populationPeak: 35000,
      economicFocus: ['naval base', 'trade', 'agriculture']
    }
  ],

  // "Korean Peninsula" was an orphaned key (a region name — the real region
  // is "Korea" — not a map area). Seoul merged into "Han River Valley"
  // above. Busan moves to "Busan Coast" (an exact-name real area). Pyongyang
  // has no exact match — none of the Korea region's areas is specifically
  // North Korea's capital — but "Kaesong Foothills" is the nearest, both
  // former Korean capitals in the same part of the peninsula, so it's used
  // as an approximation rather than leaving Pyongyang stranded.
  "Busan Coast": [
    {
      name: "Busan",
      isHistorical: true,
      foundingYear: -100,
      description: "Major port city, Korea's gateway to the sea.",
      allegianceHistory: {
        [-100]: "Geumgwan Gaya",
        532: "Silla Kingdom",
        918: "Goryeo Dynasty",
        1394: "Joseon Dynasty",
        1910: "Japanese Colony",
        1948: "Republic of Korea"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 3500000,
      economicFocus: ['shipping', 'shipbuilding', 'fishing', 'trade']
    }
  ],

  "Taedong Basin": [
    {
      name: "Pyongyang",
      isHistorical: true,
      foundingYear: -2333,
      description: "Ancient capital of Goguryeo, now capital of North Korea.",
      allegianceHistory: {
        [-2333]: "Gojoseon",
        [-108]: "Han Commandery",
        427: "Goguryeo Capital",
        668: "Tang Dynasty",
        918: "Goryeo Dynasty",
        1394: "Joseon Dynasty",
        1910: "Japanese Colony",
        1945: "Soviet Occupation",
        1948: "Democratic People's Republic of Korea"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 3200000,
      economicFocus: ['government', 'heavy industry', 'military']
    }
  ],

  // "Kyushu Island" was an orphaned key. Unlike the other 19, none of its
  // three cities could be relocated: Japan's map areas (Kyoto Basin, Edo
  // Plain, Inland Sea Coast, Mount Fuji Region, Tohoku Hills, Nara Uplands,
  // Hokkaido) cover Honshu and Hokkaido only — there is no area for the
  // Kyushu landmass at all, and "Inland Sea Coast" (the nearest candidate)
  // faces the Genkai Sea/Korea Strait side of Kyushu, not the Inland Sea.
  // Fukuoka, Nagasaki and Kumamoto are dropped; see the task report.
  "Cyprus": [
    {
      name: "Nicosia",
      isHistorical: true,
      foundingYear: 965,
      description: "The last divided capital in Europe, seat of Lusignan crusader kings and Venetian governors.",
      allegianceHistory: {
        965: "Byzantine Empire",
        1191: "Kingdom of Cyprus (Lusignan)",
        1489: "Republic of Venice",
        1571: "Ottoman Empire",
        1878: "British Empire",
        1960: "Republic of Cyprus"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate',
        'modern': 'moderate'
      },
      populationPeak: 116000,
      economicFocus: ['copper', 'trade', 'wine', 'lace', 'government']
    },
    {
      name: "Famagusta",
      isHistorical: true,
      foundingYear: -285,
      description: "The richest city in Christendom during the Lusignan era, protected by massive Venetian walls.",
      allegianceHistory: {
        [-285]: "Ptolemaic Egypt",
        1291: "Kingdom of Cyprus (Lusignan)",
        1489: "Republic of Venice",
        1571: "Ottoman Empire"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'moderate'
      },
      economicFocus: ['trade', 'shipping', 'crusades', 'luxury goods']
    },
    {
      name: "Paphos",
      isHistorical: true,
      foundingYear: -1400,
      description: "Mythical birthplace of Aphrodite, ancient capital with Roman mosaics.",
      allegianceHistory: {
        [-1400]: "Mycenaean Settlement",
        [-800]: "Cypriot Kingdoms",
        58: "Roman Empire",
        395: "Byzantine Empire",
        1191: "Kingdom of Cyprus",
        1489: "Republic of Venice",
        1571: "Ottoman Empire",
        1878: "British Administration",
        1960: "Republic of Cyprus"
      },
      urbanDensity: 'small',
      populationPeak: 35000,
      economicFocus: ['tourism', 'archaeology', 'agriculture']
    }
  ],


  // Moved from the orphaned "Rhodes" key (no such map area exists in
  // Greece and Aegean; Rhodes and the Dodecanese have no dedicated area at
  // all). "Delos Archipelago" is the nearest fit — the region's other small-
  // Aegean-island stand-in — used here for lack of a better-fitting area.
  // Rhodes and Lindos were filed under the Cyclades, three hundred miles west.
  "Dodecanese": [
    {
      name: "Lindos",
      isHistorical: true,
      foundingYear: -1000,
      description: "Ancient acropolis town with Temple of Athena.",
      allegianceHistory: {
        [-1000]: "Dorian Settlement",
        [-408]: "Rhodes City-State",
        [-164]: "Roman Republic",
        395: "Byzantine Empire",
        1309: "Knights Hospitaller",
        1523: "Ottoman Empire",
        1947: "Kingdom of Greece"
      },
      urbanDensity: 'small',
      populationPeak: 4000,
      economicFocus: ['tourism', 'fishing', 'crafts']
    },
    {
      name: "Rhodes City",
      isHistorical: true,
      foundingYear: -408,
      description: "Medieval city of the Knights Hospitaller, site of the Colossus.",
      allegianceHistory: {
        [-408]: "Rhodes City-State",
        [-164]: "Roman Republic",
        395: "Byzantine Empire",
        1309: "Knights Hospitaller",
        1523: "Ottoman Empire",
        1912: "Kingdom of Italy",
        1947: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      populationPeak: 120000,
      economicFocus: ['tourism', 'shipping', 'sponge diving', 'wine']
    }
  ],

  "Cuba": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "The key to the New World, Spain's heavily fortified treasure fleet port and Caribbean capital.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1898: "United States (Military Occupation)",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'moderate',
        'industrial': 'large',
        'modern': 'massive'
      },
      populationPeak: 2100000,
      economicFocus: ['shipping', 'sugar', 'tobacco', 'military', 'rum']
    },
    {
      name: "Santiago de Cuba",
      isHistorical: true,
      foundingYear: 1515,
      description: "Cuba's second city and first capital, gateway to the Caribbean and coffee heartland.",
      allegianceHistory: {
        1515: "Spanish Empire",
        1898: "United States (Military Occupation)",
        1902: "Republic of Cuba"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'industrial': 'moderate',
        'modern': 'large'
      },
      economicFocus: ['copper', 'coffee', 'sugar', 'military']
    },
    {
      name: "Trinidad",
      isHistorical: true,
      foundingYear: 1514,
      description: "Perfectly preserved colonial city built on sugar wealth.",
      allegianceHistory: {
        1514: "Spanish Empire",
        1898: "US Occupation",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'small',
      populationPeak: 75000,
      economicFocus: ['sugar', 'tourism', 'crafts', 'music']
    }
  ],

  "Hispaniola": [
    {
      name: "Santo Domingo",
      isHistorical: true,
      foundingYear: 1496,
      description: "The first European city in the Americas, seat of Spain's earliest colonial government.",
      allegianceHistory: {
        1496: "Spanish Empire",
        1795: "French Republic",
        1809: "Spanish Empire",
        1821: "Republic of Spanish Haiti",
        1822: "Republic of Haiti",
        1844: "Dominican Republic"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'modern': 'large'
      },
      populationPeak: 965000,
      economicFocus: ['government', 'sugar', 'trade', 'military']
    },
    {
      name: "Port-au-Prince",
      isHistorical: true,
      foundingYear: 1749,
      description: "Capital of Haiti, birthplace of the world's first successful slave revolution.",
      allegianceHistory: {
        1749: "French Empire (Saint-Domingue)",
        1804: "Republic of Haiti"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'moderate',
        'modern': 'large'
      },
      populationPeak: 987000,
      economicFocus: ['sugar', 'coffee', 'government', 'trade']
    },
    {
      name: "Cap-Haïtien",
      isHistorical: true,
      foundingYear: 1670,
      description: "The Paris of the Antilles, wealthy capital of French Saint-Domingue before the revolution.",
      allegianceHistory: {
        1670: "French Empire (Saint-Domingue)",
        1804: "Republic of Haiti"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'renaissance_early_modern': 'moderate',
        'industrial': 'moderate'
      },
      economicFocus: ['sugar', 'coffee', 'indigo', 'trade']
    }
  ],

  "Jamaica": [
    {
      name: "Kingston",
      isHistorical: true,
      foundingYear: 1693,
      description: "Jamaica's capital, built after Port Royal's destruction to become the Caribbean's largest English city.",
      allegianceHistory: {
        1693: "Kingdom of England",
        1707: "Kingdom of Great Britain",
        1801: "United Kingdom",
        1962: "Jamaica"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'moderate',
        'modern': 'large'
      },
      populationPeak: 670000,
      economicFocus: ['sugar', 'rum', 'shipping', 'coffee', 'music']
    },
    {
      name: "Port Royal",
      isHistorical: true,
      foundingYear: 1518,
      declineYear: 1692,
      description: "The wickedest city on Earth, notorious pirate haven destroyed by earthquake and tsunami.",
      allegianceHistory: {
        1518: "Spanish Empire",
        1655: "English Commonwealth",
        1660: "Kingdom of England"
      },
      urbanDensity: 'moderate',
      economicFocus: ['piracy', 'privateering', 'trade', 'sugar', 'slavery']
    },
    {
      name: "Montego Bay",
      isHistorical: true,
      foundingYear: 1510,
      description: "Major tourist resort and cruise ship destination.",
      allegianceHistory: {
        1510: "Spanish Empire",
        1655: "British Colony",
        1962: "Jamaica"
      },
      urbanDensity: 'moderate',
      populationPeak: 120000,
      economicFocus: ['tourism', 'sugar', 'bananas', 'cruise ships']
    }
  ],

  // Moved from the orphaned "New Guinea Highlands" key to "Highlands of
  // Papua" — the real area these towns actually sit in.
  "Highlands of Papua": [
    {
      name: "Goroka",
      isHistorical: true,
      foundingYear: 1926,
      description: "Coffee capital and site of famous tribal gathering shows.",
      allegianceHistory: {
        1926: "Australian Territory",
        1975: "Papua New Guinea"
      },
      urbanDensity: 'small',
      populationPeak: 20000,
      economicFocus: ['coffee', 'cultural festivals', 'education']
    },
    {
      name: "Mount Hagen",
      isHistorical: true,
      foundingYear: 1934,
      description: "Highland town discovered by Australian gold prospectors.",
      allegianceHistory: {
        1934: "Australian Territory",
        1975: "Papua New Guinea"
      },
      urbanDensity: 'small',
      populationPeak: 50000,
      economicFocus: ['coffee', 'vegetables', 'traditional markets', 'tourism']
    },
    {
      name: "Wabag",
      isHistorical: true,
      foundingYear: 1938,
      description: "Remote highland center of Enga Province.",
      allegianceHistory: {
        1938: "Australian Territory",
        1975: "Papua New Guinea"
      },
      urbanDensity: 'small',
      populationPeak: 5000,
      economicFocus: ['gold mining', 'subsistence agriculture', 'administration']
    }
  ],

  // "Fiji Islands" was an orphaned key, and unlike the rest, genuinely
  // unplaceable: Fiji has no map area anywhere in geography.ts under any
  // name. Oceania's Melanesia entries ("New Guinea and Melanesia",
  // "Indonesian and Melanesian Islands") cover Papua, the Bismarcks, the
  // Solomons, Vanuatu and New Caledonia, but not Fiji, and Polynesia's
  // areas are all further east and culturally distinct. Suva, Levuka and
  // Nadi are dropped; see the task report.

  // === MAJOR MISSING CITIES ADDED ===




  // Manila and Baguio are both lowland/coastal by nature (Manila Bay is
  // sea-level), but "Luzon Highlands" is the only map area covering the
  // Luzon landmass at all — the Philippines region's other areas are seas
  // and straits (Visayan Sea, Sulu Sea) or other islands (Mindanao,
  // Palawan). Left here for lack of a better-fitting area.
  "Luzon Highlands": [
    {
      name: "Manila",
      isHistorical: true,
      foundingYear: 1571,
      description: "Spanish colonial capital and terminus of the Manila-Acapulco galleon trade.",
      allegianceHistory: {
        1571: "Spanish Empire",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 100000,
      economicFocus: ['trade', 'galleon_trade', 'silver', 'spices', 'administration']
    },
    {
      name: "Baguio",
      isHistorical: true,
      foundingYear: 1900,
      description: "American colonial hill station built as a cool-season retreat above the Cordillera lowlands.",
      allegianceHistory: {
        1900: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      economicFocus: ['administration', 'agriculture', 'tourism']
    }
  ],

  "Red River Delta": [
    {
      // This was a single open-ended "Hanoi" running from 1010 to the
      // present. The city was actually named Thăng Long from its founding
      // until Emperor Minh Mạng renamed it Hà Nội in 1831; split
      // accordingly.
      name: "Thang Long",
      isHistorical: true,
      foundingYear: 1010,
      declineYear: 1831,
      description: "Capital founded by Ly Thai To at the 'ascending dragon', seat of the Ly, Tran, and Le dynasties.",
      allegianceHistory: {
        1010: "Ly Dynasty",
        1225: "Tran Dynasty",
        1428: "Le Dynasty",
        1802: "Nguyen Dynasty"
      },
      urbanDensity: 'moderate',
      populationPeak: 100000,
      economicFocus: ['administration', 'rice', 'crafts', 'trade', 'education']
    },
    {
      name: "Hanoi",
      isHistorical: true,
      foundingYear: 1831,
      description: "Capital of Vietnam and center of Vietnamese civilization, renamed from Thang Long under the Nguyen Dynasty.",
      allegianceHistory: {
        1831: "Nguyen Dynasty",
        1883: "French Indochina",
        1945: "Vietnam"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 8000000,
      economicFocus: ['administration', 'rice', 'crafts', 'trade', 'education']
    }
  ],



  // === SECOND BATCH OF MAJOR MISSING CITIES ===

  // === SOUTHEAST ASIA PILOT BATCH ===
  // Southeast Asia was one of the worst-covered cultural zones (see
  // geography.ts "Southeast Asia" comment on why it must never be folded
  // back into South Asia). Entries below use conservative, attested
  // founding dates; where a date is disputed the later, more securely
  // attested option is used and noted.

  "Mekong Delta": [
    {
      // Óc Eo, the great port of Funan, known through Chinese tribute
      // records and finds of Roman, Persian and Indian trade goods. No
      // entry covers the "500-1500" band: after Funan's fall to Chenla,
      // this remained a sparsely populated frontier -- historians
      // describe the delta as largely unsettled marsh under nominal Khmer
      // control -- with no recorded successor city until Vietnamese and
      // Chinese settlement in the 17th century (see Saigon and My Tho
      // below). That gap is left open deliberately.
      name: "Óc Eo",
      isHistorical: true,
      foundingYear: 100,
      declineYear: 630,
      description: "The principal port of the kingdom of Funan, its canals and wharves linking the Mekong Delta to Roman, Persian and Indian trade.",
      allegianceHistory: {
        100: "Funan"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'shipping', 'canals']
    },
    {
      // Prey Nokor, a Khmer fishing village, had Vietnamese settlers from
      // the early 1600s, but the conservative, securely attested date is
      // 1698, when Nguyen Huu Canh formally established Vietnamese
      // administration (Gia Dinh) here on behalf of the Nguyen lords.
      name: "Saigon",
      isHistorical: true,
      foundingYear: 1698,
      declineYear: 1976,
      description: "Nguyen-administered river port on former Khmer land, later capital of Cochinchina and of South Vietnam.",
      allegianceHistory: {
        1698: "Nguyen Lords",
        1802: "Nguyen Dynasty",
        1859: "French Cochinchina",
        1954: "Republic of Vietnam"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['trade', 'rice', 'administration', 'shipping']
    },
    {
      name: "Ho Chi Minh City",
      isHistorical: true,
      foundingYear: 1976,
      description: "Renamed from Saigon after reunification, Vietnam's largest city and commercial center.",
      allegianceHistory: {
        1976: "Vietnam"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 9000000,
      economicFocus: ['trade', 'manufacturing', 'finance', 'shipping']
    },
    {
      name: "My Tho",
      isHistorical: true,
      foundingYear: 1679,
      description: "Mekong Delta river town settled by Ming loyalist refugees under Nguyen lord patronage.",
      allegianceHistory: {
        1679: "Nguyen Lords",
        1802: "Nguyen Dynasty",
        1862: "French Cochinchina",
        1954: "Republic of Vietnam",
        1976: "Vietnam"
      },
      urbanDensity: 'small',
      economicFocus: ['rice', 'trade', 'fishing']
    }
  ],

  "Annam Highlands": [
    {
      // Hue has no dedicated "central Vietnam coast" map area in
      // geography.ts, so it is filed here under Annam Highlands as the
      // nearest available Mainland Southeast Asia locale for the region.
      name: "Phu Xuan",
      isHistorical: true,
      foundingYear: 1687,
      declineYear: 1802,
      description: "Fortified seat the Nguyen lords built on the Perfume River after moving their capital from Kim Long.",
      allegianceHistory: {
        1687: "Nguyen Lords"
      },
      urbanDensity: 'small',
      economicFocus: ['administration', 'military', 'agriculture']
    },
    {
      name: "Hue",
      isHistorical: true,
      foundingYear: 1802,
      description: "Imperial capital of the unified Nguyen Dynasty, seat of Vietnam's last royal court.",
      allegianceHistory: {
        1802: "Nguyen Dynasty",
        1883: "French Indochina",
        1945: "Vietnam"
      },
      urbanDensity: 'moderate',
      economicFocus: ['administration', 'religion', 'crafts', 'education']
    }
  ],

  "Tenasserim Coast": [
    {
      // Mergui's Mon-era origins are poorly dated; the conservative choice
      // is its 17th-century prominence as an Ayutthaya-controlled port
      // used by English and French trading companies.
      name: "Mergui",
      isHistorical: true,
      foundingYear: 1600,
      description: "Ayutthaya-controlled Andaman Sea port that hosted English and French trading factories.",
      allegianceHistory: {
        1600: "Ayutthaya Kingdom",
        1760: "Konbaung Dynasty",
        1826: "British Empire",
        1948: "Burma",
        1989: "Myanmar"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'shipping', 'tin']
    }
  ],

  "Malay Peninsula": [
    {
      // The Bujang Valley polity's archaeological remains reach back
      // further, but a conservative 5th-century date is used here, marking
      // the earliest well-attested Hindu-Buddhist entrepot in the area.
      name: "Kedah",
      isHistorical: true,
      foundingYear: 400,
      description: "Ancient Hindu-Buddhist entrepot on the Bujang Valley, an early stop for Indian Ocean traders bound for China.",
      allegianceHistory: {
        400: "Kedah Kingdom",
        1136: "Kedah Sultanate",
        1821: "Siam",
        1909: "British Malaya"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'religion', 'tin']
    },
    {
      name: "Pattani",
      isHistorical: true,
      foundingYear: 1516,
      description: "Cosmopolitan Malay sultanate and trading port on the peninsula's eastern coast.",
      allegianceHistory: {
        1516: "Pattani Sultanate",
        1786: "Siam",
        1909: "Siam (Kingdom of Thailand)"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'shipping', 'Islam']
    }
  ],

  "Shan Plateau": [
    {
      name: "Kengtung",
      isHistorical: true,
      foundingYear: 1253,
      description: "Traditional capital of a Shan state amid the eastern plateau, long a tributary of both Burmese and Siamese courts.",
      allegianceHistory: {
        1253: "Kengtung Shan State",
        1557: "Toungoo Dynasty",
        1886: "British Empire",
        1948: "Burma",
        1989: "Myanmar"
      },
      urbanDensity: 'small',
      economicFocus: ['agriculture', 'trade', 'crafts']
    }
  ],

  // No entry for the "3000 BCE-500 CE" band: left open deliberately. The
  // earliest attested Central Javanese kingdom, Kalingga (Holing), is
  // known from Chinese tribute missions only from the 640s CE onward --
  // itself already past this band's cutoff -- and Medang below is later
  // still.
  "Central Java": [
    {
      name: "Medang",
      isHistorical: true,
      foundingYear: 732,
      declineYear: 929,
      description: "Central Javanese kingdom whose kings raised the Borobudur and Prambanan temple complexes before the court moved east.",
      allegianceHistory: {
        732: "Medang Kingdom"
      },
      urbanDensity: 'large',
      economicFocus: ['religion', 'rice', 'architecture']
    },
    {
      name: "Kartasura",
      isHistorical: true,
      foundingYear: 1680,
      declineYear: 1745,
      description: "Mataram Sultanate capital rebuilt inland after the Trunajaya rebellion, destroyed in turn by the Chinese War uprising.",
      allegianceHistory: {
        1680: "Mataram Sultanate"
      },
      urbanDensity: 'moderate',
      economicFocus: ['administration', 'rice', 'religion']
    },
    {
      name: "Surakarta",
      isHistorical: true,
      foundingYear: 1745,
      description: "Court city built to replace ruined Kartasura, seat of the Susuhunan after Mataram split with Yogyakarta.",
      allegianceHistory: {
        1745: "Susuhunanate of Surakarta",
        1830: "Dutch East Indies",
        1945: "Indonesia"
      },
      urbanDensity: 'moderate',
      economicFocus: ['administration', 'batik', 'religion', 'trade']
    },
    {
      name: "Yogyakarta",
      isHistorical: true,
      foundingYear: 1755,
      description: "Sultanate founded when the Treaty of Giyanti split Mataram, a center of Javanese court culture.",
      allegianceHistory: {
        1755: "Sultanate of Yogyakarta",
        1830: "Dutch East Indies",
        1945: "Indonesia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['administration', 'batik', 'education', 'crafts']
    }
  ],

  "Borneo": [
    {
      // Kutai Martadipura (East Kalimantan), attested by the Yupa
      // inscriptions of King Mulawarman -- the oldest known
      // Hindu-Buddhist polity in the Indonesian archipelago -- eventually
      // absorbed by the Islamic Kutai Kartanegara sultanate.
      name: "Kutai Martadipura",
      isHistorical: true,
      foundingYear: 350,
      declineYear: 1635,
      description: "The oldest attested Hindu kingdom in the archipelago, a Mahakam River capital known from royal Sanskrit inscriptions.",
      allegianceHistory: {
        350: "Kutai Martadipura"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'agriculture', 'river_trade']
    },
    {
      name: "Brunei",
      isHistorical: true,
      foundingYear: 1368,
      description: "Sultanate capital on the northern coast that once claimed suzerainty over much of Borneo and the Sulu archipelago.",
      allegianceHistory: {
        1368: "Sultanate of Brunei",
        1888: "British Empire",
        1984: "Brunei"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'shipping', 'camphor']
    },
    {
      name: "Banjarmasin",
      isHistorical: true,
      foundingYear: 1526,
      description: "Pepper-trading sultanate at the mouth of the Barito River in southern Borneo.",
      allegianceHistory: {
        1526: "Sultanate of Banjar",
        1860: "Dutch East Indies",
        1949: "Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['pepper', 'trade', 'river_trade']
    },
    {
      name: "Pontianak",
      isHistorical: true,
      foundingYear: 1771,
      description: "Sultanate founded by an Arab-descended trader at the confluence of the Kapuas and Landak rivers.",
      allegianceHistory: {
        1771: "Sultanate of Pontianak",
        1779: "Dutch East Indies",
        1949: "Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'gold', 'river_trade']
    }
  ],

  "Makassar Strait": [
    {
      name: "Makassar",
      isHistorical: true,
      foundingYear: 1500,
      description: "Cosmopolitan port capital of the Gowa Sultanate, a defiant holdout for spice traders after the Dutch monopoly closed the Moluccas.",
      allegianceHistory: {
        1500: "Sultanate of Gowa",
        1667: "Dutch East India Company",
        1949: "Indonesia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large'
      },
      economicFocus: ['trade', 'spices', 'shipping']
    }
  ],

  "Spice Islands": [
    {
      name: "Ternate",
      isHistorical: true,
      foundingYear: 1257,
      description: "Clove-trading sultanate whose sultans played Portuguese, Spanish, and Dutch rivals against one another.",
      allegianceHistory: {
        1257: "Sultanate of Ternate",
        1683: "Dutch East India Company",
        1949: "Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['spices', 'trade', 'shipping']
    },
    {
      // Traditional Tidore chronicles claim an earlier founding; the
      // conservative date used here is the sultanate's first securely
      // attested contact with Portuguese traders.
      name: "Tidore",
      isHistorical: true,
      foundingYear: 1512,
      description: "Ternate's rival clove sultanate and, for a time, Spain's toehold in the Moluccas.",
      allegianceHistory: {
        1512: "Sultanate of Tidore",
        1663: "Dutch East India Company",
        1949: "Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['spices', 'trade']
    }
  ],

  "Visayan Sea": [
    {
      // Pre-Hispanic Sugbu existed on this site, but as with Manila (filed
      // under its 1571 Spanish founding), the conservative date used here
      // is Legazpi's 1565 colonial settlement.
      name: "Cebu",
      isHistorical: true,
      foundingYear: 1565,
      description: "First Spanish settlement in the Philippines, built over the pre-Hispanic port town of Sugbu.",
      allegianceHistory: {
        1565: "Spanish Empire",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['trade', 'shipping', 'agriculture']
    }
  ],

  "Mindanao": [
    {
      name: "Cotabato",
      isHistorical: true,
      foundingYear: 1515,
      description: "Riverine capital of the Sultanate of Maguindanao, the dominant Muslim power of central Mindanao.",
      allegianceHistory: {
        1515: "Sultanate of Maguindanao",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'agriculture', 'Islam']
    },
    {
      name: "Zamboanga",
      isHistorical: true,
      foundingYear: 1635,
      description: "Spanish fort built to guard against Moro raids, later a garrison town at Mindanao's western tip.",
      allegianceHistory: {
        1635: "Spanish Empire",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'small',
      economicFocus: ['military', 'trade', 'fishing']
    }
  ],

  "Palawan": [
    {
      name: "Puerto Princesa",
      isHistorical: true,
      foundingYear: 1872,
      description: "Spanish colonial garrison founded on Palawan's east coast, the island's principal town.",
      allegianceHistory: {
        1872: "Spanish Empire",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'small',
      economicFocus: ['fishing', 'agriculture', 'administration']
    }
  ],

  "Sulu Sea": [
    {
      // Traditional dates for Sulu's founding go back further; the
      // conservative choice is the mid-15th-century sultanate under
      // Sharif ul-Hashim, its first securely attested ruler.
      name: "Jolo",
      isHistorical: true,
      foundingYear: 1450,
      description: "Capital of the Sulu Sultanate, a maritime power controlling trade between Borneo, Mindanao, and China.",
      allegianceHistory: {
        1450: "Sulu Sultanate",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'shipping', 'pearling']
    }
  ],







  "Sindh River Delta": [
    {
      name: "Karachi",
      isHistorical: true,
      foundingYear: 1729,
      description: "Major port city and gateway to the Indian subcontinent.",
      allegianceHistory: {
        1729: "Kalhora Dynasty",
        1843: "British Empire",
        1947: "Pakistan"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'shipping', 'cotton', 'textiles', 'salt']
    }
  ],

  "Coromandel Coast": [
    {
      name: "Arikamedu",
      isHistorical: true,
      foundingYear: -250,
      declineYear: 200,
      description: "A fortified Tamil port whose Roman amphorae and glassware attest direct trade with the Mediterranean, described by classical geographers.",
      allegianceHistory: {
        [-250]: "Tamil Chiefdoms"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'textiles', 'glassware', 'beads']
    },
    {
      name: "Mahabalipuram",
      isHistorical: true,
      foundingYear: 630,
      description: "Pallava dynasty port and rock-cut temple city, famed for its shore temple and monolithic sculpture.",
      allegianceHistory: {
        630: "Pallava Dynasty",
        897: "Chola Empire",
        1350: "Vijayanagara Empire",
        1639: "British East India Company",
        1947: "India"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'religion', 'stonework', 'fishing']
    },
    {
      name: "Madras",
      isHistorical: true,
      foundingYear: 1639,
      description: "British colonial center and major South Indian port city.",
      allegianceHistory: {
        1639: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'textiles', 'administration', 'education', 'cotton']
    }
  ],





  "Øresund Strait": [
    {
      name: "Copenhagen",
      isHistorical: true,
      foundingYear: 1167,
      description: "Capital of Denmark and major Baltic Sea trading port.",
      allegianceHistory: {
        1167: "Kingdom of Denmark",
        1397: "Kalmar Union",
        1523: "Kingdom of Denmark-Norway",
        1814: "Kingdom of Denmark"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'shipping', 'brewing', 'administration', 'fish']
    }
  ],

  // "Vistula River" was an orphaned key (no such map area exists).
  // Krakow moved to "Carpathian Foothills" (merged above, in the Central
  // Europe section). Warsaw could not be placed: it sits on the central
  // Polish plain, far from the Carpathians, and no map area in
  // geography.ts covers the middle Vistula or the Polish plain generally —
  // Central Europe's and Eastern Europe's other areas are all Bohemia,
  // Austria, Hungary, Ukraine or Russia. Dropped; see the task report.

  // No entry for the "pre-3000 BCE" band: left open deliberately. The
  // coastal strip Alexandria sits on was marshy lagoon shore in the
  // Predynastic period; the era's real Delta urbanization (Buto, Sais)
  // belongs to other, inland map areas, and Rhakotis -- the small fishing
  // village Alexandria was built over -- is only attested from the
  // Pharaonic New Kingdom at the earliest, itself well after 3000 BCE.
  "Alexandria Coast": [
    {
      name: "Alexandria",
      isHistorical: true,
      foundingYear: -331,
      description: "Ancient center of learning and major Mediterranean port city.",
      allegianceHistory: {
        "-331": "Ptolemaic Kingdom",
        "-30": "Roman Empire",
        641: "Rashidun Caliphate",
        969: "Fatimid Caliphate",
        1171: "Ayyubid Dynasty",
        1250: "Mamluk Sultanate",
        1517: "Ottoman Empire",
        1882: "British Protectorate",
        1952: "Egypt"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'massive',
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 600000,
      economicFocus: ['trade', 'education', 'shipping', 'textiles', 'grain']
    }
  ],





  "Transoxiana": [
    {
      name: "Bukhara",
      isHistorical: true,
      foundingYear: -500,
      description: "Noble Bukhara, center of Islamic learning and Silk Road oasis.",
      allegianceHistory: {
        "-500": "Sogdian City-States",
        709: "Umayyad Caliphate",
        819: "Samanid Empire",
        999: "Karakhanid Khanate",
        1220: "Mongol Empire",
        1370: "Timurid Empire",
        1500: "Shaybanid Dynasty",
        1785: "Emirate of Bukhara",
        1920: "Soviet Union",
        1991: "Uzbekistan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['education', 'trade', 'textiles', 'religion', 'manuscripts']
    }
  ],




  "Peloponnesian Hills": [
    {
      name: "Sparta",
      isHistorical: true,
      foundingYear: -900,
      description: "Military powerhouse of ancient Greece and rival to Athens.",
      allegianceHistory: {
        "-900": "Dorian Sparta",
        "-146": "Roman Province of Achaea",
        395: "Byzantine Empire",
        1460: "Ottoman Empire",
        1833: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'antiquity': 'moderate'
      },
      populationPeak: 100000,
      economicFocus: ['military', 'agriculture', 'slavery', 'training'],
      declineYear: 200  // Lost power after Roman conquest
    }
  ],

  "Bosporus Straits": [
    {
      name: "Troy",
      isHistorical: true,
      foundingYear: -3000,
      description: "Legendary city of the Trojan War and important Bronze Age center.",
      allegianceHistory: {
        "-3000": "Troy I-VI",
        "-1250": "Troy VII (Trojan War)",
        "-700": "Greek Ilion",
        "-133": "Roman Ilium"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'antiquity': 'moderate'
      },
      populationPeak: 50000,
      economicFocus: ['trade', 'crafts', 'agriculture', 'fortification'],
      declineYear: -1180  // Destroyed in Trojan War period
    }
  ],


  "Hejaz Interior": [
    {
      name: "Mecca",
      isHistorical: true,
      foundingYear: 400,
      description: "Holy city of Islam and center of pilgrimage for Muslims worldwide.",
      allegianceHistory: {
        400: "Quraysh Tribe",
        630: "Rashidun Caliphate",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        969: "Fatimid Caliphate",
        1174: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1924: "Kingdom of Saudi Arabia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['pilgrimage', 'trade', 'religion', 'textiles', 'incense']
    }
  ],















  // === NEWLY ADDED REGIONS (December 2024) ===




  "Sicily": [
    {
      name: "Palermo",
      isHistorical: true,
      foundingYear: -734,
      description: "Crossroads of civilizations, where Norman, Arab, and Greek cultures created Europe's most cosmopolitan medieval court.",
      allegianceHistory: {
        [-734]: "Phoenician Carthage",
        [-254]: "Roman Republic",
        535: "Byzantine Empire",
        831: "Aghlabid Emirate",
        1072: "Norman Kingdom of Sicily",
        1194: "Holy Roman Empire",
        1282: "Aragonese Sicily",
        1516: "Spanish Empire",
        1713: "Kingdom of Savoy",
        1720: "Austrian Empire",
        1735: "Spanish Bourbon Kingdom",
        1816: "Kingdom of the Two Sicilies",
        1860: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 677000,
      economicFocus: ['trade', 'grain', 'wine', 'citrus', 'tuna', 'sulfur']
    },
    {
      name: "Syracuse",
      isHistorical: true,
      foundingYear: -734,
      description: "Once the greatest Greek city in the world, home to Archimedes and rival to Athens.",
      allegianceHistory: {
        [-734]: "Greek Corinth",
        [-212]: "Roman Republic",
        878: "Aghlabid Emirate",
        1086: "Norman Sicily"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'massive',
        'medieval': 'moderate',
        'modern': 'moderate'
      },
      populationPeak: 120000,
      economicFocus: ['philosophy', 'mathematics', 'naval power', 'trade']
    }
  ],


  "Bali": [
    {
      name: "Denpasar",
      isHistorical: true,
      foundingYear: 1788,
      description: "Capital of Bali's last independent Hindu kingdom, preserving Javanese culture after Islam's spread.",
      allegianceHistory: {
        1788: "Kingdom of Badung",
        1906: "Dutch East Indies",
        1949: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 897000,
      economicFocus: ['rice', 'arts', 'crafts', 'tourism', 'Hindu temples']
    },
    {
      name: "Ubud",
      isHistorical: true,
      foundingYear: 1300,
      description: "Sacred cultural heart of Bali, center of traditional dance, gamelan music, and Hindu-Buddhist arts.",
      allegianceHistory: {
        1300: "Balinese Hindu Kingdoms",
        1906: "Dutch East Indies",
        1949: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['arts', 'dance', 'painting', 'woodcarving', 'rice terraces']
    }
  ],

  "Maldives": [
    {
      name: "Malé",
      isHistorical: true,
      foundingYear: 1153,
      description: "Capital of the Maldive Sultanate, pearl of the Indian Ocean and guardian of vital trade routes.",
      allegianceHistory: {
        1153: "Maldive Sultanate",
        1558: "Portuguese Empire",
        1573: "Maldive Sultanate",
        1887: "British Empire (Protectorate)",
        1965: "Republic of Maldives"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      populationPeak: 133000,
      economicFocus: ['fishing', 'trade', 'coconuts', 'cowrie shells', 'coral']
    }
  ]

};
