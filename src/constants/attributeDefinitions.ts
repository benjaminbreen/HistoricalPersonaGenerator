/**
 * constants/attributeDefinitions.ts - All character attribute definitions
 */

import { AttributeBadge } from '../types/attributeTypes';

// Extended AttributeBadge with foundational flag
interface EnhancedAttributeBadge extends AttributeBadge {
  foundational?: boolean; // Should be mentioned in biography
}

// Universal Attributes (can appear in any era/culture)
export const UNIVERSAL_ATTRIBUTES: EnhancedAttributeBadge[] = [
  // FOUNDATIONAL PHYSICAL ATTRIBUTES (life-defining)
  {
    id: 'blind',
    name: 'Blind',
    icon: 'FaEyeSlash',
    rarity: 'rare',
    category: 'physical',
    description: 'Cannot see; navigates the world through touch, sound, and memory',
    foundational: true,
    dialogueHint: 'Uses touch and hearing to navigate'
  },
  {
    id: 'deaf',
    name: 'Deaf',
    icon: 'FaDeaf',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Cannot hear; communicates through gestures and reading lips when possible',
    foundational: true,
    dialogueHint: 'Communicates through gestures'
  },
  {
    id: 'mute',
    name: 'Mute',
    icon: 'IoStar',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Cannot speak; expresses themselves through gestures and written word',
    foundational: true,
    dialogueHint: 'Cannot speak, uses gestures'
  },
  {
    id: 'lame',
    name: 'Lame',
    icon: 'IoWarning',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Walks with a pronounced limp from an old injury or congenital condition',
    foundational: true,
    dialogueHint: 'Walks with difficulty'
  },
  {
    id: 'one_armed',
    name: 'One-Armed',
    icon: 'IoWarning',
    rarity: 'rare',
    category: 'physical',
    description: 'Lost an arm to injury or disease; has adapted to life with one hand',
    foundational: true,
    dialogueHint: 'Missing an arm'
  },

  // PHYSICAL CHARACTERISTICS
  {
    id: 'strong',
    name: 'Strong',
    icon: 'FaDumbbell',
    rarity: 'common',
    category: 'physical',
    description: 'Possesses exceptional physical strength; muscles hardened by labor',
    condition: (char) => (char.stats?.strength || 0) > 15,
    dialogueHint: 'Mentions physical prowess'
  },
  {
    id: 'frail',
    name: 'Frail',
    icon: 'FaFeather',
    rarity: 'common',
    category: 'physical',
    description: 'Weak constitution and delicate health; tires easily',
    condition: (char) => char.health < 30,
    dialogueHint: 'Shows signs of weakness'
  },
  {
    id: 'nearsighted',
    name: 'Nearsighted',
    icon: 'FaGlasses',
    rarity: 'common',
    category: 'physical',
    description: 'Poor distance vision; squints to see things far away',
    dialogueHint: 'Squints at distant objects'
  },
  {
    id: 'athletic',
    name: 'Athletic',
    icon: 'FaRunning',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Natural grace and agility; moves with practiced ease',
    condition: (char) => (char.stats?.dexterity || 0) > 14,
    dialogueHint: 'Moves with grace and confidence'
  },
  {
    id: 'scarred',
    name: 'Battle-Scarred',
    icon: 'GiSwordWound',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Bears prominent scars from past violence; marks of survival',
    dialogueHint: 'Bears visible marks of violence'
  },
  {
    id: 'towering',
    name: 'Towering',
    icon: 'IoStar',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Exceptionally tall; stands head and shoulders above most people',
    dialogueHint: 'Towers over others'
  },
  {
    id: 'diminutive',
    name: 'Diminutive',
    icon: 'IoStar',
    rarity: 'common',
    category: 'physical',
    description: 'Unusually short in stature; often underestimated',
    dialogueHint: 'Surprisingly small'
  },
  {
    id: 'beautiful',
    name: 'Beautiful',
    icon: 'IoHeart',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Striking physical beauty that draws attention and admiration',
    condition: (char) => (char.stats?.charisma || 0) > 16,
    dialogueHint: 'Draws admiring glances'
  },
  {
    id: 'disfigured',
    name: 'Disfigured',
    icon: 'IoWarning',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Facial scarring or deformity that makes others uncomfortable',
    foundational: true,
    dialogueHint: 'Face bears marks of trauma'
  },

  // MENTAL/INTELLECTUAL ATTRIBUTES
  {
    id: 'genius',
    name: 'Brilliant Mind',
    icon: 'FaBrain',
    rarity: 'rare',
    category: 'mental',
    description: 'Exceptional intellect; grasps complex ideas with ease',
    condition: (char) => (char.stats?.wisdom || 0) > 18,
    dialogueHint: 'Speaks with remarkable insight'
  },
  {
    id: 'slow_witted',
    name: 'Slow-Witted',
    icon: 'FaFeather',
    rarity: 'common',
    category: 'mental',
    description: 'Takes time to understand new concepts; prefers simple explanations',
    condition: (char) => (char.stats?.wisdom || 0) < 8,
    dialogueHint: 'Struggles with complex ideas'
  },
  {
    id: 'educated',
    name: 'Educated',
    icon: 'FaBookOpen',
    rarity: 'uncommon',
    category: 'mental',
    description: 'Learned in letters and scholarship; can read and write fluently',
    condition: (char) => (char.stats?.wisdom || 0) > 14,
    foundational: true,
    dialogueHint: 'Quotes texts and authorities'
  },

  {
    id: 'polyglot',
    name: 'Polyglot',
    icon: 'FaScroll',
    rarity: 'rare',
    category: 'mental',
    description: 'Speaks multiple languages fluently; picks up new tongues easily',
    dialogueHint: 'Switches between languages easily'
  },
  {
    id: 'sharp_memory',
    name: 'Prodigious Memory',
    icon: 'FaBrain',
    rarity: 'uncommon',
    category: 'mental',
    description: 'Remembers names, faces, and events with exceptional clarity',
    dialogueHint: 'Recalls minute details from years past'
  },
  {
    id: 'forgetful',
    name: 'Forgetful',
    icon: 'FaFeather',
    rarity: 'common',
    category: 'mental',
    description: 'Often misplaces things and forgets recent conversations',
    dialogueHint: 'Often repeats questions'
  },
  {
    id: 'keen_eyed',
    name: 'Keen-Eyed',
    icon: 'IoStar',
    rarity: 'uncommon',
    category: 'mental',
    description: 'Notices details others miss; exceptional observational skills',
    condition: (char) => (char.stats?.perception || 0) > 14,
    dialogueHint: 'Notices small details'
  },

  // PERSONALITY/TEMPERAMENT
  {
    id: 'charming',
    name: 'Charming',
    icon: 'IoHeart',
    rarity: 'uncommon',
    category: 'social',
    description: 'Natural charisma and grace in social situations',
    condition: (char) => (char.stats?.charisma || 0) > 15,
    dialogueHint: 'Speaks with natural charm'
  },
  {
    id: 'shy',
    name: 'Shy',
    icon: 'FaFeather',
    rarity: 'common',
    category: 'social',
    description: 'Uncomfortable in crowds; prefers solitude or small gatherings',
    condition: (char) => (char.stats?.charisma || 0) < 10,
    dialogueHint: 'Avoids eye contact'
  },
  {
    id: 'honest',
    name: 'Honest',
    icon: 'FaHeart',
    rarity: 'common',
    category: 'social',
    description: 'Values truth above all; incapable of telling convincing lies',
    dialogueHint: 'Cannot tell lies'
  },
  {
    id: 'cunning',
    name: 'Cunning',
    icon: 'IoStar',
    rarity: 'uncommon',
    category: 'social',
    description: 'Quick-witted and skilled at deception when necessary',
    dialogueHint: 'Stories often contradict'
  },
  {
    id: 'generous',
    name: 'Generous',
    icon: 'FaHeart',
    rarity: 'uncommon',
    category: 'social',
    description: 'Gives freely to those in need, even at personal cost',
    dialogueHint: 'Offers to share resources'
  },
  {
    id: 'greedy',
    name: 'Miserly',
    icon: 'IoStar',
    rarity: 'common',
    category: 'social',
    description: 'Hoards wealth and possessions; reluctant to part with anything',
    dialogueHint: 'Always asks about payment'
  },
  {
    id: 'brave',
    name: 'Brave',
    icon: 'GiShield',
    rarity: 'uncommon',
    category: 'social',
    description: 'Faces danger without flinching; courage in the face of fear',
    condition: (char) => (char.stats?.courage || 0) > 14,
    dialogueHint: 'Shows no fear'
  },
  {
    id: 'coward',
    name: 'Cowardly',
    icon: 'IoWarning',
    rarity: 'common',
    category: 'social',
    description: 'Quick to flee from danger; values survival over honor',
    condition: (char) => (char.stats?.courage || 0) < 8,
    foundational: true,
    dialogueHint: 'Shows signs of fear'
  },
  {
    id: 'hot_tempered',
    name: 'Hot-Tempered',
    icon: 'IoFlame',
    rarity: 'common',
    category: 'social',
    description: 'Quick to anger; struggles to control violent impulses',
    dialogueHint: 'Easily provoked to rage'
  },
  {
    id: 'patient',
    name: 'Patient',
    icon: 'FaHeart',
    rarity: 'uncommon',
    category: 'social',
    description: 'Calm and measured; rarely shows frustration or anger',
    dialogueHint: 'Remains calm in tense situations'
  },
  {
    id: 'proud',
    name: 'Proud',
    icon: 'GiCrown',
    rarity: 'common',
    category: 'social',
    description: 'Strong sense of personal honor; easily offended by slights',
    dialogueHint: 'Takes offense at perceived insults'
  },
  {
    id: 'humble',
    name: 'Humble',
    icon: 'FaPray',
    rarity: 'uncommon',
    category: 'social',
    description: 'Modest and unassuming; deflects praise and recognition',
    dialogueHint: 'Downplays their accomplishments'
  },
  {
    id: 'melancholic',
    name: 'Melancholic',
    icon: 'IoWarning',
    rarity: 'common',
    category: 'social',
    description: 'Prone to sadness and dark moods; sees the tragic in life',
    dialogueHint: 'Speaks of sorrow and loss'
  },
  {
    id: 'cheerful',
    name: 'Cheerful',
    icon: 'IoHeart',
    rarity: 'uncommon',
    category: 'social',
    description: 'Optimistic and good-natured; finds joy in simple pleasures',
    dialogueHint: 'Laughs easily and often'
  },

  // SPIRITUAL/MYSTICAL
  {
    id: 'devout',
    name: 'Devout',
    icon: 'FaPray',
    rarity: 'uncommon',
    category: 'spiritual',
    description: 'Deep and unwavering religious faith; lives by sacred teachings',
    foundational: true,
    dialogueHint: 'References divine will'
  },
  {
    id: 'blessed',
    name: 'Blessed',
    icon: 'FaCross',
    rarity: 'rare',
    category: 'spiritual',
    description: 'Believed to be touched by divine favor; radiates an unusual serenity',
    dialogueHint: 'Radiates serenity'
  },
  {
    id: 'cursed',
    name: 'Cursed',
    icon: 'IoSkull',
    rarity: 'rare',
    category: 'spiritual',
    description: 'Believed to be under a supernatural curse; plagued by misfortune',
    foundational: true,
    dialogueHint: 'Speaks of their curse'
  },
  {
    id: 'visionary',
    name: 'Visionary',
    icon: 'IoStar',
    rarity: 'rare',
    category: 'spiritual',
    description: 'Experiences vivid dreams and visions; some believe them prophetic',
    dialogueHint: 'Speaks of visions and dreams'
  },
  {
    id: 'skeptic',
    name: 'Skeptical',
    icon: 'FaBrain',
    rarity: 'uncommon',
    category: 'spiritual',
    description: 'Questions religious dogma and superstition; prefers rational explanations',
    dialogueHint: 'Questions beliefs'
  },

  // BACKGROUND/LIFE CIRCUMSTANCES
  {
    id: 'twin',
    name: 'Twin',
    icon: 'IoPeople',
    rarity: 'uncommon',
    category: 'social',
    description: 'Has a twin sibling who shares their features and often their fate',
    foundational: true,
    dialogueHint: 'Mentions their twin'
  },
  {
    id: 'orphan',
    name: 'Orphan',
    icon: 'IoWarning',
    rarity: 'common',
    category: 'social',
    description: 'Lost both parents young; raised by extended family or community',
    foundational: true,
    dialogueHint: 'Never knew their parents'
  },

  {
    id: 'eldest',
    name: 'Eldest Child',
    icon: 'GiCrown',
    rarity: 'common',
    category: 'social',
    description: 'First-born of their family; bore early responsibilities',
    dialogueHint: 'Speaks of duties to younger siblings'
  },
  {
    id: 'youngest',
    name: 'Youngest Child',
    icon: 'IoHeart',
    rarity: 'common',
    category: 'social',
    description: 'Last-born of their family; often indulged or overlooked',
    dialogueHint: 'Mentions older siblings'
  },
  {
    id: 'exile',
    name: 'Exile',
    icon: 'IoCompass',
    rarity: 'uncommon',
    category: 'social',
    description: 'Driven from their homeland by conflict, crime, or persecution',
    foundational: true,
    dialogueHint: 'Speaks wistfully of distant lands'
  },
  {
    id: 'former_slave',
    name: 'Former Slave',
    icon: 'GiCrossedSwords',
    rarity: 'uncommon',
    category: 'social',
    description: 'Once enslaved but gained freedom; bears the scars of bondage',
    foundational: true,
    dialogueHint: 'Speaks of their time in bondage'
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    icon: 'IoCompass',
    rarity: 'common',
    category: 'skill',
    description: 'Has traveled far from birthplace; never settles in one place long',
    dialogueHint: 'Speaks of distant places'
  },
  {
    id: 'survivor',
    name: 'Survivor',
    icon: 'GiShield',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Endured famine, plague, or war that killed many others',
    condition: (char) => (char.stats?.endurance || 0) > 14 && char.health < 40,
    dialogueHint: 'Has seen hard times'
  },
  {
    id: 'veteran',
    name: 'War Veteran',
    icon: 'GiCrossedSwords',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Fought in past wars or conflicts; carries the memories of battle',
    foundational: true,
    dialogueHint: 'Speaks of past battles'
  },

  // SKILLS (refined for universal applicability)
  {
    id: 'skilled_hands',
    name: 'Skilled Hands',
    icon: 'IoHammer',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Exceptional manual dexterity; crafts with precision and care',
    dialogueHint: 'Works with their hands'
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    icon: 'FaScroll',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Gifted at weaving tales and keeping oral traditions alive',
    dialogueHint: 'Tells engaging stories'
  },
  {
    id: 'healer',
    name: 'Healer',
    icon: 'IoMedkit',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Knowledge of herbs, remedies, and treatment of injuries',
    dialogueHint: 'Knows healing arts'
  },
  {
    id: 'singer',
    name: 'Singer',
    icon: 'IoHeart',
    rarity: 'common',
    category: 'skill',
    description: 'Possesses a beautiful voice; often called upon to sing',
    dialogueHint: 'Has a melodious voice'
  },
  {
    id: 'navigator',
    name: 'Navigator',
    icon: 'IoCompass',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Reads stars and landmarks; rarely loses their way',
    dialogueHint: 'Never gets lost'
  },
];

// Cultural-specific attributes (kept minimal, historically accurate)
export const CULTURAL_ATTRIBUTES: EnhancedAttributeBadge[] = [
  // These would be filtered by era and culture during generation
  // Keeping this minimal per user request
];

// Helper function to get all applicable attributes for a character
export function getApplicableAttributes(
  character: any,
  year: number,
  geography: string
): EnhancedAttributeBadge[] {
  const applicable: EnhancedAttributeBadge[] = [];

  // Check universal attributes
  for (const attr of UNIVERSAL_ATTRIBUTES) {
    // If attribute has a condition, check it
    if (attr.condition) {
      try {
        if (attr.condition(character)) {
          applicable.push(attr);
        }
      } catch (e) {
        // Skip if condition fails
        continue;
      }
    } else {
      // No condition means always applicable
      applicable.push(attr);
    }
  }

  // Cultural attributes filtering would go here if needed
  for (const attr of CULTURAL_ATTRIBUTES) {
    // Check year range
    if (attr.yearRange) {
      if (year < attr.yearRange[0] || year > attr.yearRange[1]) {
        continue;
      }
    }

    // Check culture/geography requirements
    if (attr.requiredGeography && !attr.requiredGeography.includes(geography)) {
      continue;
    }

    // Check condition
    if (!attr.condition || attr.condition(character)) {
      applicable.push(attr);
    }
  }

  return applicable;
}
