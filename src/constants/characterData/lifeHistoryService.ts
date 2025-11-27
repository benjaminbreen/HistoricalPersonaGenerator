/**
 * services/lifeHistoryService.ts
 *
 * Sophisticated, historically-grounded life event generation system that creates
 * deeply contextual personal narratives based on culture, era, profession, social class,
 * gender, and family connections. Events are weighted by historical probability
 * and interconnected to form coherent life stories.
 */

import {
  CulturalZone,
  HistoricalEra,
  PlayerCharacter,
  NpcEntity,
  FamilyMember
} from '../../types';

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

export enum EventImportance {
  MILESTONE = 'milestone',      // Birth, marriage, major achievements - GOLD
  TRAGEDY = 'tragedy',          // Deaths, disasters, losses - RED
  INJURY = 'injury',            // Physical harm, illness - ORANGE
  OPPORTUNITY = 'opportunity',   // New jobs, travels, discoveries - GREEN
  RELATIONSHIP = 'relationship', // Romance, friendships, rivalries - PURPLE
  MUNDANE = 'mundane'           // Daily life events - GRAY
}

export type EventKind =
  | 'birth' | 'apprenticeship' | 'education' | 'romance' | 'marriage'
  | 'childbirth' | 'battle' | 'discovery' | 'journey' | 'tragedy'
  | 'plague' | 'achievement' | 'study' | 'guild' | 'rival' | 'injury'
  | 'fire' | 'travel' | 'religious' | 'political' | 'trade' | 'family'
  | 'legal' | 'artistic' | 'agricultural' | 'maritime' | 'death';

export interface EnhancedLifeEvent {
  year: number;
  kind: EventKind;
  importance: EventImportance;
  title: string;
  text: string;
  impacts?: {
    wealth?: number;
    reputation?: number;
    health?: number;
    relationships?: string[];
  };
  culturalContext?: string;
  linkedCharacters?: string[];
}

interface EventTemplate {
  kind: EventKind;
  importance: EventImportance;
  titles: string[];
  templates: string[];
  minAge?: number;
  maxAge?: number;
  requiredGender?: 'male' | 'female';
  requiresLiteracy?: boolean; // Event requires character to be educated/literate
  excludedClasses?: string[]; // Social classes that cannot have this event
  maxOccurrences?: number; // How many times this event type can occur (default 1)
  weight: number;
  culturalWeights?: Partial<Record<CulturalZone, number>>;
  eraWeights?: Partial<Record<HistoricalEra, number>>;
  socialClassWeights?: Record<string, number>;
  professionKeywords?: string[];
  incompatibleWith?: EventKind[];
  prerequisite?: EventKind;
}

// ============================================================================
// HISTORICAL CONTEXT DATA
// ============================================================================

// Disease names by era and culture
// Causes of death - diseases, accidents, violence, starvation, etc.
const HISTORICAL_CAUSES_OF_DEATH: Record<HistoricalEra, Record<CulturalZone, string[]>> = {
  [HistoricalEra.PREHISTORY]: {
    EUROPEAN: ['pneumonia', 'infected wounds', 'childbirth complications', 'starvation', 'exposure to cold', 'animal attack', 'drowning', 'fall from cliffs', 'tribal warfare'],
    MENA: ['dysentery', 'dehydration', 'snakebite', 'scorpion sting', 'starvation', 'sandstorm burial', 'tribal conflict', 'infected wounds'],
    EAST_ASIAN: ['typhoid fever', 'malaria', 'flooding accidents', 'starvation during famine', 'wild animal attack', 'tribal warfare', 'childbirth complications'],
    SOUTH_ASIAN: ['malaria', 'dysentery', 'tiger attack', 'venomous snakebite', 'monsoon flooding', 'starvation', 'infected wounds', 'childbirth complications'],
    SUB_SAHARAN_AFRICAN: ['sleeping sickness', 'malaria', 'dysentery', 'crocodile attack', 'lion attack', 'starvation', 'infected wounds', 'childbirth complications'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['pneumonia', 'infected wounds', 'starvation during harsh winter', 'bear attack', 'drowning', 'tribal warfare', 'childbirth complications'],
    NORTH_AMERICAN_COLONIAL: ['pneumonia', 'infected wounds', 'starvation', 'exposure', 'drowning'],
    SOUTH_AMERICAN: ['yellow fever', 'malaria', 'jaguar attack', 'venomous snake bite', 'infected wounds', 'starvation', 'drowning in floods'],
    OCEANIA: ['shark attack', 'drowning', 'infected wounds', 'starvation', 'tropical fever', 'childbirth complications']
  },
  [HistoricalEra.ANTIQUITY]: {
    EUROPEAN: ['plague', 'typhoid fever', 'dysentery', 'malaria', 'murdered by bandits', 'killed in warfare', 'shipwreck', 'starvation during siege', 'childbirth complications', 'infected wounds'],
    MENA: ['plague', 'dysentery', 'typhoid fever', 'murdered by thieves', 'died in desert', 'starvation during drought', 'killed in battle', 'childbirth complications'],
    EAST_ASIAN: ['plague', 'typhoid fever', 'dysentery', 'killed in warfare', 'drowned in flood', 'murdered during banditry', 'starvation during famine', 'childbirth complications'],
    SOUTH_ASIAN: ['plague', 'malaria', 'dysentery', 'typhoid fever', 'tiger attack', 'murdered by bandits', 'starvation during famine', 'childbirth complications'],
    SUB_SAHARAN_AFRICAN: ['sleeping sickness', 'malaria', 'dysentery', 'killed in tribal warfare', 'crocodile attack', 'starvation', 'childbirth complications'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['pneumonia', 'dysentery', 'killed in warfare', 'starvation', 'infected wounds', 'childbirth complications'],
    NORTH_AMERICAN_COLONIAL: ['pneumonia', 'dysentery', 'starvation', 'killed in conflict'],
    SOUTH_AMERICAN: ['yellow fever', 'typhoid fever', 'killed in ritual sacrifice', 'murdered by enemies', 'starvation during drought', 'childbirth complications'],
    OCEANIA: ['dysentery', 'typhoid fever', 'shark attack', 'drowning', 'killed in tribal warfare', 'starvation', 'childbirth complications']
  },
  [HistoricalEra.MEDIEVAL]: {
    EUROPEAN: ['Black Death', 'pneumonia', 'dysentery', 'typhus', 'smallpox', 'murdered', 'killed in battle', 'executed for heresy', 'burned as witch', 'ergot poisoning', 'starvation during famine', 'childbirth complications', 'infected wounds'],
    MENA: ['plague', 'cholera', 'dysentery', 'typhoid fever', 'murdered', 'killed in Crusades', 'died during pilgrimage', 'starvation during siege', 'childbirth complications'],
    EAST_ASIAN: ['plague', 'smallpox', 'dysentery', 'killed by Mongol invaders', 'murdered by bandits', 'starvation during famine', 'drowned in flood', 'childbirth complications'],
    SOUTH_ASIAN: ['plague', 'malaria', 'cholera', 'dysentery', 'murdered', 'killed in warfare', 'starvation during drought', 'childbirth complications'],
    SUB_SAHARAN_AFRICAN: ['sleeping sickness', 'malaria', 'dysentery', 'killed in warfare', 'murdered', 'starvation', 'childbirth complications'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['pneumonia', 'dysentery', 'killed in tribal warfare', 'ritual sacrifice', 'starvation', 'infected wounds', 'childbirth complications'],
    NORTH_AMERICAN_COLONIAL: ['smallpox', 'measles', 'pneumonia', 'killed in conflict', 'starvation'],
    SOUTH_AMERICAN: ['smallpox', 'typhoid fever', 'killed in warfare', 'murdered', 'starvation', 'childbirth complications'],
    OCEANIA: ['dysentery', 'pneumonia', 'killed in tribal warfare', 'shark attack', 'drowning', 'starvation', 'childbirth complications']
  },
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
    EUROPEAN: ['plague', 'smallpox', 'typhus', 'syphilis', 'tuberculosis', 'murdered', 'killed in religious wars', 'executed as heretic', 'shipwreck', 'died in duel', 'starvation during siege', 'childbirth complications', 'infected wounds'],
    MENA: ['plague', 'cholera', 'smallpox', 'murdered', 'killed in Ottoman wars', 'died during hajj', 'starvation during drought', 'childbirth complications'],
    EAST_ASIAN: ['plague', 'smallpox', 'typhoid fever', 'murdered by bandits', 'killed in warfare', 'drowned in flood', 'starvation during famine', 'childbirth complications'],
    SOUTH_ASIAN: ['plague', 'malaria', 'cholera', 'smallpox', 'murdered', 'killed in Mughal wars', 'starvation during famine', 'tiger attack', 'childbirth complications'],
    SUB_SAHARAN_AFRICAN: ['yellow fever', 'malaria', 'dysentery', 'enslaved and died in Middle Passage', 'killed in slave raids', 'murdered', 'starvation', 'childbirth complications'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['smallpox epidemic', 'measles', 'typhus', 'murdered by colonists', 'starvation', 'killed in warfare'],
    NORTH_AMERICAN_COLONIAL: ['yellow fever', 'smallpox', 'typhoid fever', 'killed in colonial wars', 'shipwreck', 'murdered', 'starvation', 'childbirth complications'],
    SOUTH_AMERICAN: ['smallpox', 'typhus', 'yellow fever', 'murdered', 'worked to death in silver mines', 'starvation', 'killed in conquest', 'childbirth complications'],
    OCEANIA: ['smallpox', 'measles', 'typhoid fever', 'shark attack', 'drowning', 'killed in tribal warfare', 'murdered by sailors', 'starvation']
  },
  [HistoricalEra.INDUSTRIAL_ERA]: {
    EUROPEAN: ['cholera', 'tuberculosis', 'scarlet fever', 'typhoid', 'pneumonia', 'influenza', 'factory accident', 'mining collapse', 'murdered', 'suicide', 'childbirth complications', 'starvation during famine', 'railway accident'],
    MENA: ['cholera', 'typhoid fever', 'tuberculosis', 'dysentery', 'malaria', 'murdered', 'killed in warfare', 'starvation during drought', 'childbirth complications'],
    EAST_ASIAN: ['cholera', 'tuberculosis', 'typhoid fever', 'dysentery', 'plague', 'drowned in flood', 'murdered', 'killed in warfare', 'opium overdose', 'starvation during famine', 'childbirth complications'],
    SOUTH_ASIAN: ['cholera', 'malaria', 'tuberculosis', 'typhoid fever', 'dysentery', 'starvation during famine', 'murdered', 'railway accident', 'childbirth complications'],
    SUB_SAHARAN_AFRICAN: ['sleeping sickness', 'malaria', 'tuberculosis', 'dysentery', 'typhoid fever', 'murdered', 'killed in colonial wars', 'worked to death in mines', 'starvation', 'childbirth complications'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['tuberculosis', 'influenza', 'smallpox', 'measles', 'murdered by settlers', 'starvation during relocation', 'killed in wars'],
    NORTH_AMERICAN_COLONIAL: ['cholera', 'tuberculosis', 'typhoid fever', 'influenza', 'pneumonia', 'factory accident', 'mining accident', 'railway accident', 'murdered', 'killed in Civil War', 'suicide', 'childbirth complications'],
    SOUTH_AMERICAN: ['yellow fever', 'malaria', 'cholera', 'tuberculosis', 'typhoid fever', 'murdered', 'killed in warfare', 'mining accident', 'starvation', 'childbirth complications'],
    OCEANIA: ['tuberculosis', 'influenza', 'measles', 'dysentery', 'typhoid fever', 'murdered', 'drowned', 'shark attack', 'childbirth complications']
  },
  [HistoricalEra.MODERN_ERA]: {
    EUROPEAN: ['Spanish flu', 'tuberculosis', 'pneumonia', 'heart disease', 'cancer', 'killed in World War I', 'killed in World War II', 'murdered', 'suicide', 'automobile accident', 'childbirth complications'],
    MENA: ['tuberculosis', 'typhoid fever', 'cholera', 'malaria', 'dysentery', 'murdered', 'killed in warfare', 'automobile accident', 'suicide', 'childbirth complications'],
    EAST_ASIAN: ['tuberculosis', 'pneumonia', 'cholera', 'typhoid fever', 'influenza', 'killed in warfare', 'murdered', 'suicide', 'starvation during famine', 'drowned in flood', 'childbirth complications'],
    SOUTH_ASIAN: ['tuberculosis', 'malaria', 'cholera', 'typhoid fever', 'dysentery', 'murdered', 'killed in Partition violence', 'starvation during famine', 'railway accident', 'childbirth complications'],
    SUB_SAHARAN_AFRICAN: ['malaria', 'tuberculosis', 'cholera', 'typhoid fever', 'sleeping sickness', 'murdered', 'killed in colonial wars', 'killed in civil conflict', 'starvation', 'childbirth complications'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['tuberculosis', 'influenza', 'pneumonia', 'diabetes complications', 'automobile accident', 'murdered'],
    NORTH_AMERICAN_COLONIAL: ['polio', 'tuberculosis', 'influenza', 'pneumonia', 'heart disease', 'cancer', 'killed in World War I', 'killed in World War II', 'automobile accident', 'murdered', 'suicide', 'childbirth complications'],
    SOUTH_AMERICAN: ['yellow fever', 'malaria', 'tuberculosis', 'typhoid fever', 'cholera', 'murdered', 'killed in civil wars', 'automobile accident', 'suicide', 'starvation', 'childbirth complications'],
    OCEANIA: ['tuberculosis', 'influenza', 'typhoid fever', 'dysentery', 'heart disease', 'shark attack', 'drowned', 'automobile accident', 'murdered', 'childbirth complications']
  },
  [HistoricalEra.FUTURE_ERA]: {
    EUROPEAN: ['neural plague', 'augmentation rejection', 'data fever'],
    MENA: ['solar syndrome', 'water wars fever', 'sand lung 2.0'],
    EAST_ASIAN: ['cyber psychosis', 'pollution syndrome X', 'overcrowding fever'],
    SOUTH_ASIAN: ['monsoon plague 2.0', 'heat death syndrome', 'flood fever'],
    SUB_SAHARAN_AFRICAN: ['climate plague', 'resource curse syndrome', 'tech divide fever'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['cultural revival syndrome', 'land reclamation fever'],
    NORTH_AMERICAN_COLONIAL: ['collapse syndrome', 'bunker fever', 'militia madness'],
    SOUTH_AMERICAN: ['Amazon death', 'cartel plague', 'climate refugee syndrome'],
    OCEANIA: ['rising tide syndrome', 'isolation psychosis', 'reef death fever']
  }
};

// Trade goods and commodities by culture and era
const TRADE_GOODS: Record<CulturalZone, Record<HistoricalEra, string[]>> = {
  EUROPEAN: {
    [HistoricalEra.PREHISTORY]: ['flint tools', 'furs', 'amber', 'salt'],
    [HistoricalEra.ANTIQUITY]: ['wine', 'olive oil', 'garum', 'purple dye', 'glass'],
    [HistoricalEra.MEDIEVAL]: ['wool', 'timber', 'furs', 'honey', 'wax', 'herring'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['spices', 'sugar', 'tobacco', 'coffee', 'textiles', 'firearms'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['coal', 'steel', 'textiles', 'machinery', 'chemicals'],
    [HistoricalEra.MODERN_ERA]: ['automobiles', 'electronics', 'pharmaceuticals', 'aerospace'],
    [HistoricalEra.FUTURE_ERA]: ['quantum processors', 'fusion cells', 'biotech', 'nanotech']
  },
  MENA: {
    [HistoricalEra.PREHISTORY]: ['obsidian', 'dates', 'salt', 'copper'],
    [HistoricalEra.ANTIQUITY]: ['frankincense', 'myrrh', 'spices', 'papyrus', 'gold'],
    [HistoricalEra.MEDIEVAL]: ['damascus steel', 'carpets', 'glass', 'books', 'sugar'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['coffee', 'cotton', 'opium', 'silk', 'pearls'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['oil', 'cotton', 'dates', 'phosphates'],
    [HistoricalEra.MODERN_ERA]: ['petroleum', 'natural gas', 'petrochemicals', 'dates'],
    [HistoricalEra.FUTURE_ERA]: ['solar energy', 'desalinated water', 'helium-3', 'quantum sand']
  },
  EAST_ASIAN: {
    [HistoricalEra.PREHISTORY]: ['jade', 'silk', 'rice', 'bronze'],
    [HistoricalEra.ANTIQUITY]: ['silk', 'tea', 'porcelain', 'lacquerware', 'paper'],
    [HistoricalEra.MEDIEVAL]: ['gunpowder', 'compass', 'printing blocks', 'tea', 'ceramics'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['porcelain', 'tea', 'silk', 'silver', 'ginseng'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['silk', 'tea', 'opium', 'coal', 'tungsten'],
    [HistoricalEra.MODERN_ERA]: ['electronics', 'automobiles', 'semiconductors', 'rare earths'],
    [HistoricalEra.FUTURE_ERA]: ['quantum computers', 'AI cores', 'fusion reactors', 'metamaterials']
  },
  SOUTH_ASIAN: {
    [HistoricalEra.PREHISTORY]: ['cotton', 'indigo', 'teak', 'ivory'],
    [HistoricalEra.ANTIQUITY]: ['spices', 'cotton', 'diamonds', 'pearls', 'steel'],
    [HistoricalEra.MEDIEVAL]: ['textiles', 'spices', 'precious stones', 'indigo', 'sugar'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['muslins', 'calicos', 'spices', 'saltpeter', 'opium'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['jute', 'tea', 'cotton', 'indigo', 'opium'],
    [HistoricalEra.MODERN_ERA]: ['textiles', 'IT services', 'pharmaceuticals', 'gems'],
    [HistoricalEra.FUTURE_ERA]: ['biotech', 'neural networks', 'monsoon energy', 'gene therapy']
  },
  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.PREHISTORY]: ['ivory', 'gold', 'salt', 'iron'],
    [HistoricalEra.ANTIQUITY]: ['gold', 'ivory', 'frankincense', 'slaves', 'ebony'],
    [HistoricalEra.MEDIEVAL]: ['gold', 'salt', 'ivory', 'kola nuts', 'copper'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['slaves', 'gold', 'ivory', 'palm oil', 'gum arabic'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['rubber', 'diamonds', 'gold', 'copper', 'uranium'],
    [HistoricalEra.MODERN_ERA]: ['oil', 'diamonds', 'rare minerals', 'cocoa', 'coffee'],
    [HistoricalEra.FUTURE_ERA]: ['rare earths', 'solar power', 'biodiversity patents', 'carbon credits']
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    [HistoricalEra.PREHISTORY]: ['obsidian', 'turquoise', 'copper', 'shells'],
    [HistoricalEra.ANTIQUITY]: ['maize', 'beans', 'squash', 'tobacco', 'copper'],
    [HistoricalEra.MEDIEVAL]: ['turquoise', 'cotton', 'pottery', 'feathers', 'cacao'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['furs', 'wampum', 'corn', 'tobacco'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['buffalo hides', 'minerals', 'timber'],
    [HistoricalEra.MODERN_ERA]: ['casino revenue', 'crafts', 'tourism', 'minerals'],
    [HistoricalEra.FUTURE_ERA]: ['traditional knowledge', 'renewable energy', 'water rights']
  },
  NORTH_AMERICAN_COLONIAL: {
    [HistoricalEra.PREHISTORY]: ['flint', 'furs', 'fish', 'timber'],
    [HistoricalEra.ANTIQUITY]: ['copper', 'furs', 'fish'],
    [HistoricalEra.MEDIEVAL]: ['cod', 'furs', 'timber'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['tobacco', 'cotton', 'sugar', 'rum', 'furs', 'timber'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['cotton', 'wheat', 'steel', 'oil', 'automobiles'],
    [HistoricalEra.MODERN_ERA]: ['technology', 'entertainment', 'aerospace', 'finance'],
    [HistoricalEra.FUTURE_ERA]: ['AI', 'space tech', 'bioengineering', 'virtual reality']
  },
  SOUTH_AMERICAN: {
    [HistoricalEra.PREHISTORY]: ['obsidian', 'coca', 'potatoes', 'quinoa'],
    [HistoricalEra.ANTIQUITY]: ['gold', 'silver', 'textiles', 'potatoes', 'coca'],
    [HistoricalEra.MEDIEVAL]: ['gold', 'emeralds', 'cacao', 'rubber', 'quinine'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['silver', 'gold', 'sugar', 'cacao', 'vicuña wool'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['rubber', 'coffee', 'nitrates', 'copper', 'beef'],
    [HistoricalEra.MODERN_ERA]: ['oil', 'copper', 'lithium', 'soybeans', 'cocaine'],
    [HistoricalEra.FUTURE_ERA]: ['lithium', 'biodiversity', 'vertical farms', 'fusion materials']
  },
  OCEANIA: {
    [HistoricalEra.PREHISTORY]: ['obsidian', 'shells', 'feathers', 'tapa cloth'],
    [HistoricalEra.ANTIQUITY]: ['shells', 'jade', 'feathers', 'sandalwood'],
    [HistoricalEra.MEDIEVAL]: ['spices', 'pearls', 'trepang', 'birds of paradise'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['sandalwood', 'pearls', 'copra', 'whales'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['gold', 'wool', 'wheat', 'phosphate', 'copra'],
    [HistoricalEra.MODERN_ERA]: ['minerals', 'tourism', 'fish', 'natural gas'],
    [HistoricalEra.FUTURE_ERA]: ['ocean thermal energy', 'deep sea minerals', 'aquaculture']
  }
};

// ============================================================================
// PROFESSION-SPECIFIC EVENT TEMPLATES
// ============================================================================

const MERCHANT_EVENTS: EventTemplate[] = [
  {
    kind: 'trade',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Profitable Venture', 'Trade Success', 'Market Coup'],
    templates: [
      'Secured exclusive trading rights for [COMMODITY] from [LOCATION]',
      'First to bring [COMMODITY] to local markets, earning substantial profit',
      'Negotiated a lucrative contract with [SOCIAL_GROUP] for [COMMODITY]',
      'Cornered the market on [COMMODITY] during shortage'
    ],
    minAge: 16,
    weight: 1.2,
    professionKeywords: ['merchant', 'trader', 'vendor', 'salesman', 'peddler']
  },
  {
    kind: 'trade',
    importance: EventImportance.TRAGEDY,
    titles: ['Trade Disaster', 'Caravan Lost', 'Market Crash'],
    templates: [
      'Lost an entire [COMMODITY] shipment to [DISASTER] near [LOCATION], a devastating financial blow',
      'A caravan was robbed by brigands on the road, costing the season\'s entire investment',
      'The price of [COMMODITY] collapsed unexpectedly, forcing a sale at massive loss',
      'A ship carrying valuable [COMMODITY] cargo sank in a terrible storm'
    ],
    minAge: 18,
    weight: 0.8,
    professionKeywords: ['merchant', 'trader']
  },
  {
    kind: 'discovery',
    importance: EventImportance.MILESTONE,
    titles: ['New Trade Route', 'Market Discovery'],
    templates: [
      'Pioneered new trade route through [LOCATION], cutting travel time in half',
      'Discovered untapped demand for [COMMODITY] in [LOCATION]',
      'First to establish trade relations with [LOCATION]'
    ],
    minAge: 25,
    weight: 0.5,
    professionKeywords: ['merchant', 'trader', 'explorer']
  }
];

const SCHOLAR_EVENTS: EventTemplate[] = [
  {
    kind: 'study',
    importance: EventImportance.MILESTONE,
    titles: ['Academic Achievement', 'Scholarly Recognition'],
    templates: [
      'Completed study of rare manuscripts under renowned master',
      'Invited to debate at prestigious [INSTITUTION]',
      'Discovered error in classical text, earning recognition',
      'Developed new method for [SCHOLARLY_PRACTICE]'
    ],
    minAge: 18,
    weight: 1.0,
    requiresLiteracy: true,
    excludedClasses: ['commoner', 'peasant', 'slave', 'serf', 'laborer'],
    professionKeywords: ['scholar', 'scribe', 'philosopher', 'teacher', 'professor', 'librarian']
  },
  {
    kind: 'discovery',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Intellectual Discovery', 'Research Breakthrough'],
    templates: [
      'Uncovered lost manuscript in monastery library',
      'Solved long-standing mathematical problem',
      'Translated ancient text revealing new knowledge',
      'Corresponded with distant scholar about [SUBJECT]'
    ],
    minAge: 20,
    weight: 0.8,
    requiresLiteracy: true,
    excludedClasses: ['commoner', 'peasant', 'slave', 'serf', 'laborer'],
    professionKeywords: ['scholar', 'philosopher', 'mathematician', 'astronomer']
  }
];

const CRAFTSMAN_EVENTS: EventTemplate[] = [
  {
    kind: 'guild',
    importance: EventImportance.MILESTONE,
    titles: ['Guild Advancement', 'Master Status'],
    templates: [
      'Admitted to [CRAFT] guild after presenting masterwork',
      'Elected guild treasurer, managing communal funds',
      'Achieved master status, allowed to take apprentices',
      'Guild selected work for noble commission'
    ],
    minAge: 20,
    weight: 1.0,
    professionKeywords: ['smith', 'carpenter', 'mason', 'weaver', 'potter', 'jeweler', 'baker']
  },
  {
    kind: 'achievement',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Notable Commission', 'Crafting Success'],
    templates: [
      'Created [ITEM] that drew crowds to market square',
      'Noble household commissioned full set of [ITEMS]',
      'Developed new technique for [CRAFT_PROCESS]',
      'Work displayed at important festival'
    ],
    minAge: 18,
    weight: 1.2,
    professionKeywords: ['craftsman', 'artisan', 'smith', 'carpenter']
  }
];

const SOLDIER_EVENTS: EventTemplate[] = [
  {
    kind: 'battle',
    importance: EventImportance.MILESTONE,
    titles: ['Military Service', 'Combat Experience'],
    templates: [
      'Fought in siege of [LOCATION], surviving three assaults',
      'Served in garrison during border tensions with [GROUP]',
      'Participated in campaign against [ENEMY]',
      'Defended [LOCATION] from raiders'
    ],
    minAge: 16,
    weight: 1.5,
    professionKeywords: ['soldier', 'guard', 'warrior', 'knight', 'samurai', 'mercenary']
  },
  {
    kind: 'injury',
    importance: EventImportance.INJURY,
    titles: ['Battle Wound', 'Combat Injury'],
    templates: [
      'Took an arrow to the shoulder during a skirmish, which took months to heal properly',
      'A sword cut during combat left a permanent scar across the forearm',
      'A horse fell in battle and crushed the leg, leaving a lasting limp',
      'Survived a festering wound after rough field surgery, though it left lasting weakness'
    ],
    minAge: 17,
    weight: 1.0,
    professionKeywords: ['soldier', 'guard', 'warrior']
  },
  {
    kind: 'achievement',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Military Honor', 'Battlefield Recognition'],
    templates: [
      'Promoted after holding bridge against superior numbers',
      'Awarded [HONOR] for valor in battle',
      'Selected for elite guard unit',
      'Led successful night raid on enemy camp'
    ],
    minAge: 20,
    weight: 0.8,
    professionKeywords: ['soldier', 'knight', 'officer']
  }
];

const FARMER_EVENTS: EventTemplate[] = [
  {
    kind: 'agricultural',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Abundant Harvest', 'Agricultural Success'],
    templates: [
      'The harvest yielded double the normal grain, allowing the surplus to be sold at a healthy profit',
      'Experimenting with a new plowing method led to a marked increase in field productivity',
      'After years of careful selection, successfully bred a hardier variety of [CROP]',
      'Became the first in the village to successfully grow [NEW_CROP], earning respect from neighbors'
    ],
    minAge: 16,
    weight: 1.0,
    professionKeywords: ['farmer', 'peasant', 'planter', 'rancher', 'shepherd']
  },
  {
    kind: 'agricultural',
    importance: EventImportance.TRAGEDY,
    titles: ['Crop Failure', 'Agricultural Disaster'],
    templates: [
      'A devastating drought destroyed the entire season\'s planting, leaving the family with nothing to harvest',
      'Swarms of locusts descended on the fields and consumed the grain stores before harvest could be completed',
      'Heavy flooding washed away the precious topsoil and seed, setting back years of careful cultivation',
      'A terrible blight spread through the [CROP] crop, ruining the harvest and making for a lean winter'
    ],
    minAge: 16,
    weight: 0.9,
    professionKeywords: ['farmer', 'peasant']
  },
  {
    kind: 'family',
    importance: EventImportance.MUNDANE,
    titles: ['Land Inheritance', 'Farm Expansion'],
    templates: [
      'Inherited an additional field from a childless uncle, expanding the family holdings',
      'Purchased the neighbor\'s plot after they decided to seek fortune in the city',
      'With the help of extended family, cleared new land for cultivation',
      'Divided the land among the children, keeping the best field for old age'
    ],
    minAge: 25,
    weight: 0.7,
    professionKeywords: ['farmer', 'landowner']
  }
];

const RELIGIOUS_EVENTS: EventTemplate[] = [
  {
    kind: 'religious',
    importance: EventImportance.MILESTONE,
    titles: ['Religious Journey', 'Spiritual Achievement'],
    templates: [
      'Completed a difficult pilgrimage to [HOLY_SITE], returning spiritually renewed',
      'After years of contemplation and prayer, took holy orders',
      'Helped lead the congregation through a difficult period of doctrinal dispute',
      'Spent two years painstakingly copying an entire sacred text by hand'
    ],
    minAge: 18,
    weight: 1.2,
    professionKeywords: ['priest', 'monk', 'imam', 'rabbi', 'shaman', 'nun']
  },
  {
    kind: 'religious',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Religious Appointment', 'Spiritual Recognition'],
    templates: [
      'Appointed to manage the shrine finances, a position of great trust',
      'Selected by the elders to lead the annual festival ceremonies',
      'Entrusted with the important work of teaching novices',
      'Invited to participate in a theological debate at [INSTITUTION]'
    ],
    minAge: 25,
    weight: 0.8,
    professionKeywords: ['priest', 'monk', 'religious']
  }
];

// ============================================================================
// CULTURALLY-SPECIFIC EVENT VARIATIONS
// ============================================================================

const CULTURAL_EVENT_MODIFIERS: Record<CulturalZone, Partial<EventTemplate>[]> = {
  EUROPEAN: [
    {
      kind: 'political',
      importance: EventImportance.MUNDANE,
      titles: ['Feudal Obligation', 'Manor Court'],
      templates: [
        'Summoned to lord\'s court as witness in land dispute',
        'Required to provide labor for castle repairs',
        'Paid annual tribute to local lord'
      ],
      weight: 0.8,
      eraWeights: {
        [HistoricalEra.MEDIEVAL]: 1.5,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0.8
      }
    }
  ],
  MENA: [
    {
      kind: 'religious',
      importance: EventImportance.MILESTONE,
      titles: ['Hajj', 'Sacred Journey'],
      templates: [
        'Completed hajj to Mecca, earning title of Hajji',
        'Visited Jerusalem\'s holy sites during pilgrimage',
        'Studied at Al-Azhar for three years'
      ],
      weight: 1.0,
      minAge: 25,
      eraWeights: {
        [HistoricalEra.MEDIEVAL]: 1.2,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 1.3
      }
    },
    {
      kind: 'trade',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Caravan Success', 'Bazaar Fortune'],
      templates: [
        'Joined caravan crossing Sahara with salt and gold',
        'Established stall in Damascus bazaar',
        'Negotiated spice contract with Venetian merchants'
      ],
      weight: 1.2,
      professionKeywords: ['merchant', 'trader']
    }
  ],
  EAST_ASIAN: [
    {
      kind: 'study',
      importance: EventImportance.MILESTONE,
      titles: ['Imperial Examination', 'Scholar Success'],
      templates: [
        'Passed provincial examination, earning juren degree',
        'Failed metropolitan exam but gained reputation as poet',
        'Appointed to minor administrative post after examination'
      ],
      weight: 1.5,
      minAge: 18,
      requiredGender: 'male', // Imperial exams were male-only
      requiresLiteracy: true,
      excludedClasses: ['commoner', 'peasant', 'slave', 'serf', 'laborer'],
      socialClassWeights: {
        'merchant': 0.8,
        'MIDDLE_CLASS': 1.5,
        'UPPER_CLASS': 2.0,
        'noble': 2.5,
        'gentry': 3.0
      },
      eraWeights: {
        [HistoricalEra.MEDIEVAL]: 1.3,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 1.4
      }
    },
    {
      kind: 'family',
      importance: EventImportance.RELATIONSHIP,
      titles: ['Filial Duty', 'Ancestral Honor'],
      templates: [
        'Returned home to care for aging parents',
        'Performed ancestral rites as eldest son',
        'Arranged favorable marriage for younger sister'
      ],
      weight: 1.2,
      minAge: 20
    }
  ],
  SOUTH_ASIAN: [
    {
      kind: 'religious',
      importance: EventImportance.MILESTONE,
      titles: ['Sacred River', 'Temple Duty'],
      templates: [
        'Bathed in Ganges during Kumbh Mela',
        'Completed temple service during festival season',
        'Learned sacred texts under guru\'s guidance'
      ],
      weight: 1.0,
      minAge: 16
    },
    {
      kind: 'trade',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Monsoon Trade', 'Spice Fortune'],
      templates: [
        'Timed voyage perfectly with monsoon winds',
        'Secured pepper contract with Arab traders',
        'Established textile workshop with English backing'
      ],
      weight: 1.1,
      eraWeights: {
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 1.3,
        [HistoricalEra.INDUSTRIAL_ERA]: 1.4
      }
    }
  ],
  SUB_SAHARAN_AFRICAN: [
    {
      kind: 'family',
      importance: EventImportance.MILESTONE,
      titles: ['Age Grade Ceremony', 'Lineage Honor'],
      templates: [
        'Initiated into adult age grade with peers',
        'Inherited position as lineage head',
        'Led successful cattle raid, gaining wealth and status'
      ],
      weight: 1.2,
      minAge: 15,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 1.3,
        [HistoricalEra.ANTIQUITY]: 1.2
      }
    },
    {
      kind: 'trade',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Gold Trade', 'Salt Exchange'],
      templates: [
        'Guided merchants across Sahara to salt mines',
        'Traded gold dust for horses and weapons',
        'Joined ivory caravan to coast'
      ],
      weight: 1.0,
      professionKeywords: ['trader', 'merchant', 'guide']
    }
  ],
  NORTH_AMERICAN_PRE_COLUMBIAN: [
    {
      kind: 'religious',
      importance: EventImportance.MILESTONE,
      titles: ['Vision Quest', 'Sacred Ceremony'],
      templates: [
        'Received vision during coming-of-age ceremony',
        'Participated in sun dance, earning honor marks',
        'Selected as keeper of sacred bundle'
      ],
      weight: 1.3,
      minAge: 14,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 1.2,
        [HistoricalEra.MEDIEVAL]: 1.3
      }
    },
    {
      kind: 'achievement',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Hunting Success', 'Tribal Honor'],
      templates: [
        'Led successful buffalo hunt, feeding village through winter',
        'Counted coup on enemy warrior, gaining honor',
        'Discovered new fishing grounds during drought'
      ],
      weight: 1.1,
      minAge: 16
    }
  ],
  NORTH_AMERICAN_COLONIAL: [
    {
      kind: 'journey',
      importance: EventImportance.MILESTONE,
      titles: ['Westward Movement', 'Frontier Life'],
      templates: [
        'Joined wagon train heading west for new land',
        'Staked claim during gold rush',
        'Established homestead on prairie'
      ],
      weight: 1.2,
      minAge: 18,
      eraWeights: {
        [HistoricalEra.INDUSTRIAL_ERA]: 1.5,
        [HistoricalEra.MODERN_ERA]: 0,  // Disable for modern era
        [HistoricalEra.FUTURE_ERA]: 0    // Disable for future era
      }
    },
    {
      kind: 'political',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Democratic Participation', 'Civic Duty'],
      templates: [
        'Elected to town council',
        'Served as juror in important trial',
        'Organized petition for local improvements'
      ],
      weight: 0.9,
      minAge: 21,
      eraWeights: {
        [HistoricalEra.INDUSTRIAL_ERA]: 1.2,
        [HistoricalEra.MODERN_ERA]: 0.5,  // Reduce for modern
        [HistoricalEra.FUTURE_ERA]: 0.3   // Reduce for future
      }
    },
    // Modern Era Events (1950s-2020s)
    {
      kind: 'education',
      importance: EventImportance.MILESTONE,
      titles: ['Digital Education', 'Online Learning'],
      templates: [
        'Completed online certification in [TECH_SKILL]',
        'Graduated from coding bootcamp specializing in [TECH_STACK]',
        'Earned computer science degree through night classes',
        'Self-taught programming through YouTube and Stack Overflow'
      ],
      weight: 1.5,
      minAge: 16,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.8,
        [HistoricalEra.FUTURE_ERA]: 2.0
      },
      professionKeywords: ['programmer', 'developer', 'hacker', 'cybercriminal', 'IT', 'tech']
    },
    {
      kind: 'trade',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Crypto Trading', 'Digital Commerce'],
      templates: [
        'Made fortune trading cryptocurrency during bull run',
        'Lost savings in crypto crash but learned valuable lessons',
        'Started dropshipping business selling [E_COMMERCE_ITEM]',
        'Built successful online marketplace for [DIGITAL_GOOD]'
      ],
      weight: 1.3,
      minAge: 18,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.5,
        [HistoricalEra.FUTURE_ERA]: 2.0
      }
    },
    {
      kind: 'achievement',
      importance: EventImportance.MILESTONE,
      titles: ['Hacking Success', 'Cyber Operation'],
      templates: [
        'Successfully penetrated corporate network for bug bounty',
        'Discovered zero-day vulnerability in major software',
        'Participated in capture-the-flag competition, placed top 10',
        'Built botnet for distributed computing research'
      ],
      weight: 1.4,
      minAge: 16,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 2.0,
        [HistoricalEra.FUTURE_ERA]: 2.5
      },
      professionKeywords: ['hacker', 'cybercriminal', 'security', 'programmer']
    },
    {
      kind: 'legal',
      importance: EventImportance.TRAGEDY,
      titles: ['Legal Trouble', 'Cyber Crime'],
      templates: [
        'Arrested for unauthorized network access, served probation',
        'FBI raid seized computers, faced federal charges',
        'Indicted for cryptocurrency fraud, awaiting trial',
        'Caught in darknet marketplace sting operation'
      ],
      weight: 0.8,
      minAge: 18,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.5,
        [HistoricalEra.FUTURE_ERA]: 1.8
      },
      professionKeywords: ['cybercriminal', 'hacker', 'criminal']
    },
    {
      kind: 'journey',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Digital Nomad', 'Remote Work'],
      templates: [
        'Moved to [TECH_HUB] to join startup accelerator',
        'Worked remotely from 12 countries in one year',
        'Relocated to Silicon Valley for tech opportunity',
        'Fled country after security breach investigation'
      ],
      weight: 1.1,
      minAge: 20,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.6,
        [HistoricalEra.FUTURE_ERA]: 2.0
      }
    },
    {
      kind: 'injury',
      importance: EventImportance.INJURY,
      titles: ['Tech Burnout', 'Health Crisis'],
      templates: [
        'Developed carpal tunnel from excessive coding',
        'Suffered burnout after 80-hour work weeks',
        'Hospitalized for exhaustion during product launch',
        'Developed anxiety disorder from constant surveillance fears'
      ],
      weight: 0.7,
      minAge: 22,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.3,
        [HistoricalEra.FUTURE_ERA]: 1.5
      }
    },
    // Future Era Events (2020s-2050s)
    {
      kind: 'achievement',
      importance: EventImportance.MILESTONE,
      titles: ['AI Development', 'Tech Innovation'],
      templates: [
        'Developed AI model that achieved breakthrough in [AI_FIELD]',
        'Created viral app with 10 million downloads',
        'Founded startup focused on [FUTURE_TECH]',
        'Open-sourced tool that revolutionized [DEV_PRACTICE]'
      ],
      weight: 1.3,
      minAge: 20,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 0,
        [HistoricalEra.FUTURE_ERA]: 2.5
      },
      professionKeywords: ['developer', 'programmer', 'engineer', 'entrepreneur']
    },
    {
      kind: 'political',
      importance: EventImportance.OPPORTUNITY,
      titles: ['Digital Activism', 'Online Movement'],
      templates: [
        'Organized viral social media campaign for [CAUSE]',
        'Leaked classified documents exposing corruption',
        'Led hacktivist operation against authoritarian regime',
        'Started online movement that influenced policy change'
      ],
      weight: 1.0,
      minAge: 18,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.2,
        [HistoricalEra.FUTURE_ERA]: 1.8
      }
    },
    {
      kind: 'plague',
      importance: EventImportance.TRAGEDY,
      titles: ['Pandemic Impact', 'Global Crisis'],
      templates: [
        'Lost job during COVID-19 pandemic lockdowns',
        'Family member died from coronavirus complications',
        'Pivoted business model to survive pandemic',
        'Developed long COVID affecting work capacity'
      ],
      weight: 0.9,
      minAge: 10,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 0,
        [HistoricalEra.FUTURE_ERA]: 1.5
      }
    },
    {
      kind: 'family',
      importance: EventImportance.RELATIONSHIP,
      titles: ['Virtual Connection', 'Online Relationship'],
      templates: [
        'Met future spouse in online gaming community',
        'Maintained family bonds through video calls during lockdown',
        'Child became successful streamer/content creator',
        'Parents struggled to understand digital career'
      ],
      weight: 1.0,
      minAge: 16,
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 0,
        [HistoricalEra.ANTIQUITY]: 0,
        [HistoricalEra.MEDIEVAL]: 0,
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0,
        [HistoricalEra.INDUSTRIAL_ERA]: 0,
        [HistoricalEra.MODERN_ERA]: 1.1,
        [HistoricalEra.FUTURE_ERA]: 1.6
      }
    }
  ],
  SOUTH_AMERICAN: [
    {
      kind: 'agricultural',
      importance: EventImportance.MILESTONE,
      titles: ['Terrace Success', 'Highland Harvest'],
      templates: [
        'Constructed new terraces, doubling potato yield',
        'Successfully cultivated coca at higher altitude',
        'Bred new variety of quinoa resistant to frost'
      ],
      weight: 1.1,
      professionKeywords: ['farmer', 'peasant'],
      eraWeights: {
        [HistoricalEra.PREHISTORY]: 1.2,
        [HistoricalEra.MEDIEVAL]: 1.3
      }
    },
    {
      kind: 'religious',
      importance: EventImportance.RELATIONSHIP,
      titles: ['Mountain Spirits', 'Ancestral Ceremony'],
      templates: [
        'Made offering to mountain apu for good harvest',
        'Participated in Inti Raymi sun ceremony',
        'Learned healing songs from village shaman'
      ],
      weight: 1.0,
      minAge: 14
    }
  ],
  OCEANIA: [
    {
      kind: 'maritime',
      importance: EventImportance.MILESTONE,
      titles: ['Ocean Voyage', 'Navigation Success'],
      templates: [
        'Navigated to distant island using star knowledge',
        'Survived typhoon during trading voyage',
        'First to reach new fishing grounds beyond reef'
      ],
      weight: 1.4,
      minAge: 16,
      professionKeywords: ['sailor', 'fisherman', 'navigator']
    },
    {
      kind: 'family',
      importance: EventImportance.RELATIONSHIP,
      titles: ['Kinship Obligation', 'Tribal Unity'],
      templates: [
        'Hosted important feast, strengthening clan ties',
        'Exchanged gifts with neighboring tribe, preventing conflict',
        'Inherited responsibility for family fishing grounds'
      ],
      weight: 1.1,
      minAge: 20
    }
  ]
};

// ============================================================================
// FAMILY EVENT INTEGRATION
// ============================================================================

const FAMILY_EVENTS: EventTemplate[] = [
  // Parent death is handled by dedicated generator (lines 1437-1496) to prevent duplicates
  {
    kind: 'family',
    importance: EventImportance.MILESTONE,
    titles: ['Sibling\'s Marriage', 'Family Alliance'],
    templates: [
      'A sister married into a well-connected [SOCIAL_GROUP] family, improving the family\'s social standing',
      'A brother\'s marriage brought valuable new trade connections and opportunities',
      'Arranged a sibling\'s marriage carefully to strengthen the family\'s position in society'
    ],
    minAge: 16,
    maxOccurrences: 2, // Limit to prevent excessive repetition
    weight: 0.8
  },
  {
    kind: 'family',
    importance: EventImportance.OPPORTUNITY,
    titles: ['Family Business', 'Inheritance'],
    templates: [
      'Took over the family [BUSINESS] after a parent retired from active work',
      'Inherited valuable tools and a workshop from a childless uncle',
      'The family pooled their resources to purchase [ASSET], a significant investment'
    ],
    minAge: 18,
    weight: 0.7
  },
  {
    kind: 'childbirth',
    importance: EventImportance.MILESTONE,
    titles: ['New Child', 'Growing Family'],
    templates: [
      'Welcomed the birth of a first child, a healthy [SON/DAUGHTER]',
      'Wife gave birth to twins, which doubled both the household\'s joy and its worries',
      'A child was born during [SEASON], which the family considered to be auspicious'
    ],
    minAge: 18,
    weight: 1.0,
    prerequisite: 'marriage'
  }
];

// ============================================================================
// EARLY LIFE EVENT GENERATOR
// ============================================================================

function generateEarlyLifeEvent(
  profession: string,
  gender: string,
  socialClass: string
): { kind: EventKind; title: string; text: string } | null {
  const profLower = profession.toLowerCase();

  // Crafts & Trades - Traditional apprenticeship
  const craftProfessions = ['blacksmith', 'carpenter', 'mason', 'weaver', 'potter', 'tanner',
    'cobbler', 'tailor', 'jeweler', 'goldsmith', 'silversmith', 'cooper', 'wheelwright',
    'instrument maker', 'clockmaker', 'glassblower', 'chandler'];

  if (craftProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Began apprenticeship as a ${profession} under skilled master craftsman`,
      `Apprenticed to ${profession === 'Blacksmith' ? 'forge master' : 'guild master'}, learning trade secrets`,
      `Taken as apprentice by renowned ${profession}, bound for seven years`
    ];
    return {
      kind: 'apprenticeship',
      title: 'Apprenticeship',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Farming & Agricultural - No apprenticeship, learned from family
  const farmProfessions = ['farmer', 'peasant', 'shepherd', 'herder', 'goat herder',
    'cattle herder', 'rice farmer', 'wheat farmer', 'vegetable farmer', 'tenant farmer'];

  if (farmProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Began working family fields, learning crop rotation from elders`,
      `First season helping with harvest, proved capable despite young age`,
      `Trusted to tend livestock alone for first time`,
      `Learned to read weather signs and predict harvest yields from father`
    ];
    return {
      kind: 'agricultural',
      title: 'Coming of Age',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Merchants & Traders
  const merchantProfessions = ['merchant', 'trader', 'peddler', 'shopkeeper', 'vendor'];

  if (merchantProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Sent to apprentice with trading company, learning accounts and negotiation`,
      `First journey with merchant caravan, carrying valuable goods`,
      `Began managing family stall at market, handling coins and customers`
    ];
    return {
      kind: 'trade',
      title: 'Trade Apprenticeship',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Religious Professions
  const religiousProfessions = ['priest', 'monk', 'nun', 'imam', 'rabbi', 'shaman',
    'healer', 'wise woman', 'oracle', 'temple dancer'];

  if (religiousProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Entered religious instruction, dedicating life to divine service`,
      `Taken to monastery to begin spiritual training and education`,
      `Recognized for spiritual gifts, began studying sacred texts`,
      `Accepted into temple service, learning rituals and ceremonies`
    ];
    return {
      kind: 'religious',
      title: 'Religious Calling',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Scholars & Scribes
  const scholarProfessions = ['scribe', 'scholar', 'teacher', 'tutor', 'philosopher',
    'librarian', 'clerk'];

  if (scholarProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Began formal education, learning letters and classical texts`,
      `Apprenticed to court scribe, practicing calligraphy daily`,
      `Sent to study under noted scholar, mastering rhetoric and logic`
    ];
    return {
      kind: 'education',
      title: 'Formal Education',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Domestic & Service (often women)
  const domesticProfessions = ['servant', 'maid', 'cook', 'washerwoman', 'midwife',
    'wet nurse', 'nanny', 'mother'];

  if (domesticProfessions.some(p => profLower.includes(p))) {
    if (gender.toLowerCase() === 'female') {
      const variants = [
        `Began learning household management and domestic skills from mother`,
        `Placed in service at manor house, training in household duties`,
        `A first child to care for, learning skills that would define daily life forever afterward`,
        `Apprenticed to midwife, witnessing first birth at tender age`
      ];
      return {
        kind: 'family',
        title: 'Domestic Training',
        text: variants[Math.floor(Math.random() * variants.length)]
      };
    }
  }

  // Military & Guards
  const militaryProfessions = ['soldier', 'guard', 'warrior', 'knight', 'mercenary',
    'archer', 'spearman'];

  if (militaryProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Began martial training, learning swordplay and formation fighting`,
      `Enlisted in local militia, issued first real weapon`,
      `Sent to serve as squire, learning ways of war from veteran knight`
    ];
    return {
      kind: 'battle',
      title: 'Military Training',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Laborers - No formal training
  const laborerProfessions = ['laborer', 'porter', 'digger', 'hauler', 'bearer',
    'mine worker', 'factory worker', 'mill worker'];

  if (laborerProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Experienced hard labor for the first time, joining work crews at dawn`,
      `Began hauling loads for merchants, building strength`,
      `Started working alongside father in backbreaking toil`
    ];
    return {
      kind: 'mundane',
      title: 'Hard Labor Begins',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Artists & Performers
  const artistProfessions = ['artist', 'painter', 'musician', 'bard', 'poet', 'dancer',
    'actor', 'singer'];

  if (artistProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Natural talent recognized, began training in artistic craft`,
      `Apprenticed to master artist, learning techniques passed down generations`,
      `First public performance, discovering gift for entertaining crowds`
    ];
    return {
      kind: 'artistic',
      title: 'Artistic Training',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Wanderers & Outcasts - No formal training
  const wandererProfessions = ['wanderer', 'vagrant', 'beggar', 'outcast', 'exile', 'hermit'];

  if (wandererProfessions.some(p => profLower.includes(p))) {
    const variants = [
      `Left home young, learning to survive on roads and in forests`,
      `Cast out from community, forced to fend for self`,
      `Chose solitary path, rejecting settled life`
    ];
    return {
      kind: 'journey',
      title: 'Life on the Road',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Nobility - Different path
  if (socialClass === 'noble' || socialClass === 'aristocrat') {
    const variants = [
      `Began courtly education, learning etiquette and statecraft`,
      `First diplomatic mission as noble representative`,
      `Training in noble arts: hunting, hawking, and heraldry`
    ];
    return {
      kind: 'political',
      title: 'Noble Education',
      text: variants[Math.floor(Math.random() * variants.length)]
    };
  }

  // Default for unmatched professions
  return {
    kind: 'apprenticeship',
    title: 'Early Training',
    text: `Began learning trade of ${profession} from experienced practitioner`
  };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export function generateLifeHistory(
  character: PlayerCharacter | NpcEntity,
  currentYear: number,
  culturalZone: CulturalZone,
  era: HistoricalEra
): EnhancedLifeEvent[] {
  const events: EnhancedLifeEvent[] = [];
  const birthYear = currentYear - character.age;

  // Always start with birth
  events.push({
    year: birthYear,
    kind: 'birth',
    importance: EventImportance.MILESTONE,
    title: 'Birth',
    text: `Born in ${character.hometown || 'a small settlement'} to a ${character.socialClass || 'common'} family`
  });

  // Collect all applicable event templates
  let eventPool: EventTemplate[] = [
    ...MERCHANT_EVENTS,
    ...SCHOLAR_EVENTS,
    ...CRAFTSMAN_EVENTS,
    ...SOLDIER_EVENTS,
    ...FARMER_EVENTS,
    ...RELIGIOUS_EVENTS,
    ...FAMILY_EVENTS
  ];

  // Add cultural modifiers
  if (CULTURAL_EVENT_MODIFIERS[culturalZone]) {
    eventPool = [...eventPool, ...CULTURAL_EVENT_MODIFIERS[culturalZone]];
  }

  // Filter by profession keywords
  const profession = character.profession?.toLowerCase() || '';
  const relevantEvents = eventPool.filter(template => {
    if (template.professionKeywords && template.professionKeywords.length > 0) {
      return template.professionKeywords.some(keyword =>
        profession.includes(keyword)
      );
    }
    return true; // Include events without profession requirements
  });

  // Generate events based on age progression
  const eventYears = new Set<number>();
  const usedEventKinds: EventKind[] = [];
  const usedEventTemplates = new Set<string>(); // Track exact templates to prevent repetition
  const eventKindCounts = new Map<string, number>(); // Track occurrences for maxOccurrences
  const deceasedFamilyMembers = new Set<string>(); // Track who has died to prevent duplicates

  // Extract social class for early life event generation
  const socialClass = (character as PlayerCharacter).socialClass ||
                     (character as NpcEntity).socialClass ||
                     'commoner';

  // Add profession-specific early life event
  if (character.age >= 12 && profession) {
    const earlyAge = 12 + Math.floor(Math.random() * 4);
    const earlyYear = birthYear + earlyAge;

    // Only add if within character's lifetime
    if (earlyYear >= birthYear && earlyYear <= currentYear) {
      const earlyLifeEvent = generateEarlyLifeEvent(profession, character.gender, socialClass);

      if (earlyLifeEvent) {
        events.push({
          year: earlyYear,
          kind: earlyLifeEvent.kind,
          importance: EventImportance.MILESTONE,
          title: earlyLifeEvent.title,
          text: earlyLifeEvent.text
        });
        eventYears.add(earlyYear);
        usedEventKinds.push(earlyLifeEvent.kind);
      }
    }
  }

  // Generate 4-10 additional events based on age for quality over quantity
  const baseEvents = 4 + Math.floor(Math.random() * 2); // 4-5 base events
  const ageBonus = Math.floor(character.age / 12); // More events for older characters (slower rate)
  const numEvents = Math.min(baseEvents + ageBonus, 10); // Cap at 10 total

  for (let i = 0; i < numEvents; i++) {
    // Select event based on weighted probability
    const validEvents = relevantEvents.filter(template => {
      // Check age requirements
      const eventAge = 16 + Math.floor(Math.random() * Math.max(2, character.age - 16));
      if (template.minAge && eventAge < template.minAge) return false;
      if (template.maxAge && eventAge > template.maxAge) return false;

      // Check max occurrences limit
      if (template.maxOccurrences) {
        const templateKey = `${template.kind}-${template.titles[0]}`;
        const count = eventKindCounts.get(templateKey) || 0;
        if (count >= template.maxOccurrences) return false;
      }

      // Check if this exact template was already used
      const templateId = `${template.kind}-${template.titles[0]}`;
      if (usedEventTemplates.has(templateId)) return false;

      // Check literacy requirement
      if (template.requiresLiteracy) {
        const hasEducation = character.profession?.toLowerCase().match(
          /scholar|scribe|teacher|professor|librarian|priest|monk|cleric|official|administrator|clerk|lawyer|doctor|physician/
        );
        const isEducatedClass = ['noble', 'merchant', 'gentry', 'clergy'].some(eduClass =>
          socialClass.toLowerCase().includes(eduClass.toLowerCase())
        ) || socialClass.toUpperCase().includes('MIDDLE') || socialClass.toUpperCase().includes('UPPER');

        if (!hasEducation && !isEducatedClass) return false;
      }

      // Check excluded classes
      if (template.excludedClasses) {
        const isExcluded = template.excludedClasses.some(excluded =>
          socialClass.toLowerCase().includes(excluded.toLowerCase())
        );
        if (isExcluded) return false;
      }

      // Check gender requirements
      if (template.requiredGender && character.gender) {
        if (character.gender.toLowerCase() !== template.requiredGender.toLowerCase()) {
          return false;
        }
      }

      // Check prerequisites
      if (template.prerequisite && !usedEventKinds.includes(template.prerequisite)) {
        return false;
      }

      // Check incompatibilities
      if (template.incompatibleWith) {
        if (template.incompatibleWith.some(kind => usedEventKinds.includes(kind))) {
          return false;
        }
      }

      return true;
    });

    if (validEvents.length === 0) continue;

    // Weight selection by era and culture
    const weightedEvents = validEvents.map(template => {
      let weight = template.weight;

      // Apply era weight
      if (template.eraWeights && template.eraWeights[era] !== undefined) {
        weight *= template.eraWeights[era];
      }

      // Apply cultural weight
      if (template.culturalWeights && template.culturalWeights[culturalZone]) {
        weight *= template.culturalWeights[culturalZone];
      }

      // Apply social class weight if available
      const socialClass = (character as PlayerCharacter).socialClass ||
                         (character as NpcEntity).socialClass ||
                         'common';
      if (template.socialClassWeights && template.socialClassWeights[socialClass]) {
        weight *= template.socialClassWeights[socialClass];
      }

      return { template, weight };
    }).filter(e => e.weight > 0);  // Filter out zero-weight events

    // Skip if no valid weighted events
    if (weightedEvents.length === 0) continue;

    // Select event based on weights
    const totalWeight = weightedEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedTemplate: EventTemplate | null = null;

    for (const { template, weight } of weightedEvents) {
      random -= weight;
      if (random <= 0) {
        selectedTemplate = template;
        break;
      }
    }

    if (!selectedTemplate) continue;

    // Generate event year (avoid duplicates)
    let eventYear: number;
    let attempts = 0;
    do {
      const minAge = selectedTemplate.minAge || 14;
      const maxAge = Math.min(selectedTemplate.maxAge || character.age, character.age);
      const eventAge = minAge + Math.floor(Math.random() * Math.max(1, maxAge - minAge));
      eventYear = birthYear + eventAge;
      attempts++;
    } while (eventYears.has(eventYear) && attempts < 10);

    if (attempts >= 10) continue; // Skip if can't find unique year

    // Validate event year is within character's lifetime
    if (eventYear < birthYear || eventYear > currentYear) {
      console.warn(`Skipping invalid event: year ${eventYear} outside character lifetime (${birthYear} to ${currentYear})`);
      continue;
    }
    eventYears.add(eventYear);
    usedEventKinds.push(selectedTemplate.kind);

    // Track template usage to prevent repetition
    const templateId = `${selectedTemplate.kind}-${selectedTemplate.titles[0]}`;
    usedEventTemplates.add(templateId);

    // Track occurrence count for maxOccurrences limit
    const currentCount = eventKindCounts.get(templateId) || 0;
    eventKindCounts.set(templateId, currentCount + 1);

    // Select random title and template
    const title = selectedTemplate.titles[Math.floor(Math.random() * selectedTemplate.titles.length)];
    let text = selectedTemplate.templates[Math.floor(Math.random() * selectedTemplate.templates.length)];

    // Replace placeholders with context-appropriate values
    text = replacePlaceholders(text, culturalZone, era, character);

    // Add cultural context for certain events
    let culturalContext: string | undefined;
    if (selectedTemplate.kind === 'religious' || selectedTemplate.kind === 'marriage') {
      culturalContext = getCulturalContext(selectedTemplate.kind, culturalZone, era);
    }

    events.push({
      year: eventYear,
      kind: selectedTemplate.kind,
      importance: selectedTemplate.importance,
      title,
      text,
      culturalContext
    });
  }

  // Add family member deaths if character is old enough
  if (character.age > 30 && Math.random() > 0.5) {
    const parentDeathAge = 25 + Math.floor(Math.random() * 20);
    if (parentDeathAge < character.age) {
      const allCausesOfDeath = HISTORICAL_CAUSES_OF_DEATH[era][culturalZone] || ['illness'];

      // Determine which parent dies, prioritizing one that hasn't already died
      const isMotherDeath = Math.random() < 0.5;
      const parentType = isMotherDeath ? 'mother' : 'father';

      // Filter causes of death based on gender and historical plausibility
      let causesOfDeath = allCausesOfDeath;
      if (isMotherDeath) {
        // Mothers are less likely to die in warfare, battles, or accidents
        // Filter out explicitly male-dominated death causes
        causesOfDeath = allCausesOfDeath.filter(cause =>
          !cause.includes('killed in battle') &&
          !cause.includes('killed in warfare') &&
          !cause.includes('mining') &&
          !cause.includes('shipwreck') &&
          !cause.includes('duel')
        );
        // If all causes filtered out, use disease/illness causes
        if (causesOfDeath.length === 0) {
          causesOfDeath = allCausesOfDeath.filter(cause =>
            cause.includes('fever') ||
            cause.includes('plague') ||
            cause.includes('cholera') ||
            cause.includes('tuberculosis') ||
            cause.includes('pneumonia') ||
            cause.includes('dysentery') ||
            cause.includes('complications') ||
            cause.includes('illness')
          );
        }
        // If still empty, default to generic
        if (causesOfDeath.length === 0) {
          causesOfDeath = ['illness'];
        }
      }

      // Very rare chance (0.1%) of lightning strike
      let causeOfDeath;
      if (Math.random() < 0.001) {
        causeOfDeath = 'struck by lightning';
      } else {
        causeOfDeath = causesOfDeath[Math.floor(Math.random() * causesOfDeath.length)];
      }

      // Only proceed if this parent hasn't already died
      if (!deceasedFamilyMembers.has(parentType)) {
        // Vary sentence structures for parent death (with proper capitalization)
        const fatherTemplates = [
          `The father died of ${causeOfDeath}, leaving the family to manage affairs alone`,
          `The family lost their father to ${causeOfDeath} during a difficult winter`,
          `A father's death from ${causeOfDeath} changed everything for the household`,
          `His father passed away from ${causeOfDeath} despite seeking help from healers`,
          `Tragedy struck when his father succumbed to ${causeOfDeath}`,
        ];

        const motherTemplates = [
          `Mother died from ${causeOfDeath}, and the family struggled with grief and new responsibilities`,
          `Mother passed away from ${causeOfDeath}, leaving an emptiness never filled`,
          `The family lost their mother to ${causeOfDeath}`,
          `Her mother succumbed to ${causeOfDeath} despite all efforts to save her`,
          `The family was devastated by the mother's death from ${causeOfDeath}`
        ];

        const templates = isMotherDeath ? motherTemplates : fatherTemplates;
        const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

        const parentDeathYear = birthYear + parentDeathAge;

        // Validate the event year is within character's lifetime
        if (parentDeathYear >= birthYear && parentDeathYear <= currentYear) {
          events.push({
            year: parentDeathYear,
            kind: 'death',
            importance: EventImportance.TRAGEDY,
            title: 'Parent\'s Death',
            text: selectedTemplate,
            linkedCharacters: [parentType]
          });
          eventYears.add(parentDeathYear);
          deceasedFamilyMembers.add(parentType); // Mark this parent as deceased
        } else {
          console.warn(`Skipping parent death event: year ${parentDeathYear} outside character lifetime (${birthYear} to ${currentYear})`);
        }
      }
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.year - b.year);

  return events;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function replacePlaceholders(
  text: string,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  character: PlayerCharacter | NpcEntity
): string {
  const commodities = TRADE_GOODS[culturalZone]?.[era] || ['goods'];
  const causesOfDeath = HISTORICAL_CAUSES_OF_DEATH[era][culturalZone] || ['illness'];

  // Replace placeholders
  text = text.replace('[COMMODITY]', commodities[Math.floor(Math.random() * commodities.length)]);
  text = text.replace('[DISEASE]', causesOfDeath[Math.floor(Math.random() * causesOfDeath.length)]);
  text = text.replace('[OCCUPATION]', character.profession || 'work');
  text = text.replace('[SEASON]', ['spring', 'summer', 'harvest time', 'winter'][Math.floor(Math.random() * 4)]);
  text = text.replace('[SON/DAUGHTER]', Math.random() > 0.5 ? 'son' : 'daughter');

  // Modern tech placeholders
  text = text.replace('[TECH_SKILL]', ['web development', 'machine learning', 'cybersecurity', 'cloud computing', 'blockchain', 'data science'][Math.floor(Math.random() * 6)]);
  text = text.replace('[TECH_STACK]', ['full-stack JavaScript', 'Python/Django', 'React/Node', 'AWS/DevOps', 'Rust/WebAssembly', 'Go microservices'][Math.floor(Math.random() * 6)]);
  text = text.replace('[E_COMMERCE_ITEM]', ['electronics', 'fashion accessories', 'supplements', 'gaming peripherals', 'cryptocurrency hardware'][Math.floor(Math.random() * 5)]);
  text = text.replace('[DIGITAL_GOOD]', ['NFTs', 'digital art', 'software licenses', 'online courses', 'crypto assets'][Math.floor(Math.random() * 5)]);
  text = text.replace('[AI_FIELD]', ['natural language processing', 'computer vision', 'robotics', 'generative AI', 'reinforcement learning'][Math.floor(Math.random() * 5)]);
  text = text.replace('[FUTURE_TECH]', ['quantum computing', 'brain-computer interfaces', 'autonomous vehicles', 'AR/VR metaverse', 'gene editing'][Math.floor(Math.random() * 5)]);
  text = text.replace('[DEV_PRACTICE]', ['CI/CD pipelines', 'containerization', 'test-driven development', 'microservices architecture', 'serverless computing'][Math.floor(Math.random() * 5)]);
  text = text.replace('[CAUSE]', ['climate action', 'digital privacy', 'social justice', 'open source software', 'net neutrality'][Math.floor(Math.random() * 5)]);
  text = text.replace('[TECH_HUB]', ['San Francisco', 'Austin', 'Berlin', 'Singapore', 'Dubai', 'Shenzhen'][Math.floor(Math.random() * 6)]);

  // Location placeholders
  text = text.replace('[LOCATION]', getLocationName(culturalZone, era));
  text = text.replace('[HOLY_SITE]', getHolySite(culturalZone, era));
  text = text.replace('[INSTITUTION]', getInstitution(culturalZone, era));

  // Social placeholders
  text = text.replace('[SOCIAL_GROUP]', getSocialGroup(culturalZone, era));
  text = text.replace('[ENEMY]', getEnemyGroup(culturalZone, era));

  // Disasters
  text = text.replace('[DISASTER]', getDisaster(era));

  // Items and crafts
  text = text.replace('[ITEM]', getItem(character.profession || 'craftsman', era));
  text = text.replace('[ITEMS]', getItems(character.profession || 'craftsman', era));
  text = text.replace('[CRAFT_PROCESS]', getCraftProcess(character.profession || 'craftsman'));
  text = text.replace('[NEW_CROP]', getNewCrop(culturalZone, era));
  text = text.replace('[CROP]', getCrop(culturalZone, era));
  text = text.replace('[ASSET]', getAsset(era));
  text = text.replace('[BUSINESS]', getBusiness(character.profession || 'shop', era));
  text = text.replace('[HONOR]', getHonor(culturalZone, era));
  text = text.replace('[CRAFT]', character.profession || 'craft');
  text = text.replace('[SUBJECT]', getScholarlySubject(era));
  text = text.replace('[SCHOLARLY_PRACTICE]', getScholarlyPractice(era));
  text = text.replace('[GROUP]', getSocialGroup(culturalZone, era));

  return text;
}

function getLocationName(zone: CulturalZone, era: HistoricalEra): string {
  const locations: Record<CulturalZone, string[]> = {
    EUROPEAN: ['Paris', 'London', 'Rome', 'Vienna', 'Constantinople', 'Venice', 'Hamburg', 'Prague'],
    MENA: ['Damascus', 'Cairo', 'Baghdad', 'Jerusalem', 'Mecca', 'Isfahan', 'Tunis', 'Cordoba'],
    EAST_ASIAN: ['Beijing', 'Nanjing', 'Kyoto', 'Seoul', 'Hangzhou', 'Canton', 'Edo', 'Samarkand'],
    SOUTH_ASIAN: ['Delhi', 'Agra', 'Varanasi', 'Colombo', 'Lahore', 'Dhaka', 'Mumbai', 'Chennai'],
    SUB_SAHARAN_AFRICAN: ['Timbuktu', 'Great Zimbabwe', 'Kilwa', 'Benin City', 'Axum', 'Mombasa'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['Cahokia', 'Mesa Verde', 'Chaco Canyon', 'the Great Lakes'],
    NORTH_AMERICAN_COLONIAL: ['Boston', 'Philadelphia', 'Charleston', 'Montreal', 'St. Louis'],
    SOUTH_AMERICAN: ['Cuzco', 'Lima', 'Potosí', 'Rio de Janeiro', 'Buenos Aires', 'Quito'],
    OCEANIA: ['Tahiti', 'Hawaii', 'Fiji', 'Tonga', 'Samoa', 'Rapa Nui', 'the Marquesas']
  };

  const list = locations[zone] || ['a distant city'];
  return list[Math.floor(Math.random() * list.length)];
}

function getHolySite(zone: CulturalZone, era: HistoricalEra): string {
  const sites: Record<CulturalZone, string[]> = {
    EUROPEAN: ['Rome', 'Canterbury', 'Santiago de Compostela', 'Mont Saint-Michel'],
    MENA: ['Mecca', 'Medina', 'Jerusalem', 'Karbala', 'Najaf'],
    EAST_ASIAN: ['Mount Tai', 'Mount Fuji', 'Wutai Mountain', 'Ise Shrine'],
    SOUTH_ASIAN: ['Varanasi', 'Bodh Gaya', 'Tirupati', 'Golden Temple'],
    SUB_SAHARAN_AFRICAN: ['Lalibela', 'Ife', 'Great Zimbabwe', 'Axum'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['Serpent Mound', 'Chaco Canyon', 'Cahokia'],
    NORTH_AMERICAN_COLONIAL: ['Plymouth Rock', 'Independence Hall'],
    SOUTH_AMERICAN: ['Machu Picchu', 'Lake Titicaca', 'Nazca'],
    OCEANIA: ['Uluru', 'Mount Taranaki', 'Easter Island']
  };

  const list = sites[zone] || ['the sacred place'];
  return list[Math.floor(Math.random() * list.length)];
}

function getInstitution(zone: CulturalZone, era: HistoricalEra): string {
  if (era === HistoricalEra.MEDIEVAL) {
    const institutions: Record<CulturalZone, string[]> = {
      EUROPEAN: ['University of Paris', 'Oxford', 'Bologna', 'the cathedral school'],
      MENA: ['Al-Azhar', 'House of Wisdom', 'Nizamiyya', 'the madrasa'],
      EAST_ASIAN: ['Imperial Academy', 'Guozijian', 'Seonggyungwan'],
      SOUTH_ASIAN: ['Nalanda', 'Takshashila', 'Vikramashila'],
      SUB_SAHARAN_AFRICAN: ['Sankore Mosque', 'the royal court'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['the council lodge', 'the temple complex'],
      NORTH_AMERICAN_COLONIAL: ['Harvard College', 'the assembly'],
      SOUTH_AMERICAN: ['the acllahuasi', 'the calmecac'],
      OCEANIA: ['the navigation school', 'the chiefs\' council']
    };
    return institutions[zone]?.[Math.floor(Math.random() * institutions[zone].length)] || 'the academy';
  }

  return 'the university';
}

function getSocialGroup(zone: CulturalZone, era: HistoricalEra): string {
  const groups: Record<CulturalZone, string[]> = {
    EUROPEAN: ['merchant guild', 'noble house', 'cathedral chapter', 'town council'],
    MENA: ['merchant caravan', 'tribal confederation', 'Sufi order', 'military elite'],
    EAST_ASIAN: ['literati family', 'merchant consortium', 'Buddhist monastery', 'samurai clan'],
    SOUTH_ASIAN: ['Brahmin family', 'merchant caste', 'warrior clan', 'artisan guild'],
    SUB_SAHARAN_AFRICAN: ['royal lineage', 'age-grade society', 'trading family', 'craft guild'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['clan elders', 'warrior society', 'medicine society'],
    NORTH_AMERICAN_COLONIAL: ['merchant family', 'political party', 'religious congregation'],
    SOUTH_AMERICAN: ['ayllu', 'noble panaca', 'merchant family', 'military order'],
    OCEANIA: ['chiefly family', 'navigator guild', 'warrior band', 'trading partnership']
  };

  const list = groups[zone] || ['influential family'];
  return list[Math.floor(Math.random() * list.length)];
}

function getEnemyGroup(zone: CulturalZone, era: HistoricalEra): string {
  const enemies: Record<CulturalZone, string[]> = {
    EUROPEAN: ['Viking raiders', 'Magyar horsemen', 'Ottoman forces', 'brigands'],
    MENA: ['Crusaders', 'Mongols', 'Bedouin raiders', 'rival emirate'],
    EAST_ASIAN: ['Mongol invaders', 'Japanese pirates', 'northern barbarians', 'rebels'],
    SOUTH_ASIAN: ['Afghan raiders', 'Maratha cavalry', 'Mughal forces', 'Company soldiers'],
    SUB_SAHARAN_AFRICAN: ['slave raiders', 'rival kingdom', 'Arab traders', 'colonial forces'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['enemy tribe', 'raiders', 'rival confederation'],
    NORTH_AMERICAN_COLONIAL: ['Native raiders', 'British forces', 'Confederate army', 'bandits'],
    SOUTH_AMERICAN: ['Spanish conquistadors', 'Portuguese slavers', 'rival tribe', 'government forces'],
    OCEANIA: ['rival islanders', 'European sailors', 'blackbirders', 'enemy tribe']
  };

  const list = enemies[zone] || ['hostile forces'];
  return list[Math.floor(Math.random() * list.length)];
}

function getDisaster(era: HistoricalEra): string {
  const disasters = [
    'storms', 'flooding', 'pirates', 'bandits', 'shipwreck',
    'fire', 'earthquake', 'drought', 'war', 'plague'
  ];

  if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
    disasters.push('train accident', 'factory explosion', 'mine collapse');
  }

  return disasters[Math.floor(Math.random() * disasters.length)];
}

function getItem(profession: string, era: HistoricalEra): string {
  const items: Record<string, string[]> = {
    'smith': ['sword', 'horseshoe', 'plow blade', 'decorative gate'],
    'carpenter': ['chair', 'table', 'cabinet', 'roof beam'],
    'weaver': ['tapestry', 'cloak', 'banner', 'fine cloth'],
    'potter': ['jar', 'tile', 'vessel', 'decorative vase'],
    'baker': ['wedding cake', 'festival bread', 'honey pastry'],
    'jeweler': ['ring', 'necklace', 'brooch', 'crown']
  };

  for (const [key, values] of Object.entries(items)) {
    if (profession.includes(key)) {
      return values[Math.floor(Math.random() * values.length)];
    }
  }

  return 'masterwork';
}

function getItems(profession: string, era: HistoricalEra): string {
  const item = getItem(profession, era);
  return item.endsWith('s') ? item : item + 's';
}

function getCraftProcess(profession: string): string {
  const processes: Record<string, string[]> = {
    'smith': ['tempering steel', 'forge welding', 'pattern welding'],
    'carpenter': ['joinery', 'carving', 'inlay work'],
    'weaver': ['dyeing', 'pattern weaving', 'tapestry making'],
    'potter': ['glazing', 'wheel throwing', 'kiln firing'],
    'baker': ['sourdough cultivation', 'pastry lamination', 'sugar work']
  };

  for (const [key, values] of Object.entries(processes)) {
    if (profession.includes(key)) {
      return values[Math.floor(Math.random() * values.length)];
    }
  }

  return 'crafting';
}

function getNewCrop(zone: CulturalZone, era: HistoricalEra): string {
  const crops: Record<CulturalZone, string[]> = {
    EUROPEAN: ['potatoes', 'tomatoes', 'maize', 'sugar beets'],
    MENA: ['cotton', 'coffee', 'sugarcane', 'citrus'],
    EAST_ASIAN: ['sweet potatoes', 'maize', 'peanuts', 'tobacco'],
    SOUTH_ASIAN: ['tea', 'indigo', 'opium poppies', 'jute'],
    SUB_SAHARAN_AFRICAN: ['cassava', 'maize', 'groundnuts', 'cocoa'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['beans', 'squash', 'sunflowers'],
    NORTH_AMERICAN_COLONIAL: ['wheat', 'apples', 'tobacco', 'cotton'],
    SOUTH_AMERICAN: ['coffee', 'rubber', 'quinoa', 'coca'],
    OCEANIA: ['breadfruit', 'sugarcane', 'pineapple', 'coffee']
  };

  const list = crops[zone] || ['new variety'];
  return list[Math.floor(Math.random() * list.length)];
}

function getCrop(zone: CulturalZone, era: HistoricalEra): string {
  const crops: Record<CulturalZone, string[]> = {
    EUROPEAN: ['wheat', 'barley', 'rye', 'oats'],
    MENA: ['wheat', 'dates', 'olives', 'barley'],
    EAST_ASIAN: ['rice', 'millet', 'soybeans', 'wheat'],
    SOUTH_ASIAN: ['rice', 'wheat', 'lentils', 'cotton'],
    SUB_SAHARAN_AFRICAN: ['millet', 'sorghum', 'yams', 'plantains'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['maize', 'beans', 'squash'],
    NORTH_AMERICAN_COLONIAL: ['wheat', 'corn', 'tobacco'],
    SOUTH_AMERICAN: ['potatoes', 'maize', 'quinoa', 'coca'],
    OCEANIA: ['taro', 'yams', 'coconuts', 'breadfruit']
  };

  const list = crops[zone] || ['grain'];
  return list[Math.floor(Math.random() * list.length)];
}

function getAsset(era: HistoricalEra): string {
  const assets = ['new plow', 'draft animals', 'storage barn', 'mill share', 'market stall'];

  if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
    assets.push('tractor', 'delivery truck', 'shop', 'machinery');
  }

  return assets[Math.floor(Math.random() * assets.length)];
}

function getBusiness(profession: string, era: HistoricalEra): string {
  if (profession.includes('smith')) return 'forge';
  if (profession.includes('baker')) return 'bakery';
  if (profession.includes('merchant')) return 'trading house';
  if (profession.includes('weaver')) return 'workshop';
  if (profession.includes('carpenter')) return 'woodshop';

  return 'business';
}

function getHonor(zone: CulturalZone, era: HistoricalEra): string {
  const honors: Record<CulturalZone, string[]> = {
    EUROPEAN: ['knighthood', 'coat of arms', 'civic medal', 'guild mastership'],
    MENA: ['title of Sheikh', 'Hajji status', 'military decoration', 'scholarly ijaza'],
    EAST_ASIAN: ['imperial recognition', 'clan honor', 'scholarly degree', 'military rank'],
    SOUTH_ASIAN: ['royal title', 'temple honor', 'military decoration', 'caste elevation'],
    SUB_SAHARAN_AFRICAN: ['chieftaincy', 'age-grade leadership', 'praise name', 'royal favor'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['eagle feather', 'war honors', 'vision recognition'],
    NORTH_AMERICAN_COLONIAL: ['military commission', 'civic award', 'land grant'],
    SOUTH_AMERICAN: ['encomienda', 'military rank', 'noble title', 'land grant'],
    OCEANIA: ['chiefly title', 'navigator status', 'warrior tattoos', 'genealogical recognition']
  };

  const list = honors[zone] || ['special recognition'];
  return list[Math.floor(Math.random() * list.length)];
}

function getScholarlySubject(era: HistoricalEra): string {
  const subjects = ['mathematics', 'astronomy', 'medicine', 'philosophy', 'theology', 'history'];

  if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    subjects.push('natural philosophy', 'alchemy', 'anatomy');
  }
  if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
    subjects.push('chemistry', 'physics', 'biology', 'engineering');
  }

  return subjects[Math.floor(Math.random() * subjects.length)];
}

function getScholarlyPractice(era: HistoricalEra): string {
  const practices = ['calculating', 'translating texts', 'astronomical observation', 'manuscript copying'];

  if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    practices.push('printing', 'experimentation', 'dissection');
  }
  if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
    practices.push('laboratory work', 'field research', 'statistical analysis');
  }

  return practices[Math.floor(Math.random() * practices.length)];
}

function getCulturalContext(eventKind: EventKind, zone: CulturalZone, era: HistoricalEra): string {
  if (eventKind === 'religious') {
    const contexts: Record<CulturalZone, string[]> = {
      EUROPEAN: ['during Lent', 'on Saint\'s feast day', 'after Easter mass'],
      MENA: ['during Ramadan', 'after Friday prayers', 'during the hajj season'],
      EAST_ASIAN: ['during New Year festival', 'at autumn moon festival', 'during ancestor veneration'],
      SOUTH_ASIAN: ['during Diwali', 'at Holi festival', 'during monsoon ceremonies'],
      SUB_SAHARAN_AFRICAN: ['during harvest festival', 'at rainmaking ceremony', 'during initiation season'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['during green corn ceremony', 'at winter solstice', 'during vision quest season'],
      NORTH_AMERICAN_COLONIAL: ['at Thanksgiving', 'during revival meeting', 'at camp meeting'],
      SOUTH_AMERICAN: ['during Inti Raymi', 'at Carnival', 'during Day of the Dead'],
      OCEANIA: ['during makahiki season', 'at harvest ceremony', 'during navigation season']
    };

    const list = contexts[zone] || ['during the ceremony'];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (eventKind === 'marriage') {
    const contexts: Record<CulturalZone, string[]> = {
      EUROPEAN: ['after the banns were read', 'with dowry negotiations', 'sealed by the Church'],
      MENA: ['with mahr agreement', 'blessed by the imam', 'celebrated with week-long festivities'],
      EAST_ASIAN: ['arranged by matchmaker', 'with elaborate gift exchange', 'after consulting fortune tellers'],
      SOUTH_ASIAN: ['with astrologer\'s approval', 'after matching horoscopes', 'with traditional seven vows'],
      SUB_SAHARAN_AFRICAN: ['with bride price paid', 'joining two lineages', 'blessed by elders'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['uniting clans', 'with gift exchange', 'blessed by spirits'],
      NORTH_AMERICAN_COLONIAL: ['at the courthouse', 'in the church', 'witnessed by community'],
      SOUTH_AMERICAN: ['blessed by priest', 'with family alliance', 'celebrated with feast'],
      OCEANIA: ['with ceremonial exchange', 'uniting islands', 'blessed by ancestors']
    };

    const list = contexts[zone] || ['with traditional ceremony'];
    return list[Math.floor(Math.random() * list.length)];
  }

  return '';
}