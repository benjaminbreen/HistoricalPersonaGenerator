import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoMoonSharp,
  IoSunny,
  IoShareSocial,
  IoSave,
  IoInformationCircle,
  IoHeart,
  IoClose,
  IoShuffle,
  IoOptions,
  IoTrophy,
  IoSkull,
  IoMedkit,
  IoRocket,
  IoPeople,
  IoEllipseOutline,
  IoSchool,
  IoRibbon,
  IoCompass,
  IoWarning,
  IoFlame,
  IoAirplane,
  IoStar,
  IoFlag,
  IoCart,
  IoHammer,
  IoBoat,
  IoCheckmarkCircle,
  IoEyeOff,
  IoGlasses,
  IoLeaf,
  IoWater,
  IoCash,
  IoScale,
  IoFlask,
  IoRefresh,
  IoHelpCircle,
  IoLibrary,
  IoHandRight,
  IoMale,
  IoFemale,
  IoMan,
  IoWoman,
  IoHome,
  IoChevronForward,
  IoLogoGithub
} from 'react-icons/io5';
import {
  FaDumbbell,
  FaFeather,
  FaScroll,
  FaPray,
  FaCross,
  FaStar as FaStarOfDavid,
  FaBolt,
  FaHeart as FaHeartbeat,
  FaEyeSlash,
  FaDeaf,
  FaRunning,
  FaBookOpen,
  FaBrain
} from 'react-icons/fa';
import {
  GiCrossedSwords,
  GiCrown,
  GiShield,
  GiSwordWound,
  GiBattleGear
} from 'react-icons/gi';
import { generateHistoricalPersona, GenerationParams, HistoricalPersona } from '../services/personaGenerator';
import { HistoricalEra, CulturalZone, Gender } from '../types';
import { EventImportance, EventKind } from '../constants/characterData/lifeHistoryService';
import { getRegionalHistory } from '../constants/gameData/regionalHistory';
import { getWikipediaImageForContext } from '../services/wikipediaService';
import { CachedWikipediaData } from '../types/wikipedia';
import ProceduralPortrait from './portraits/ProceduralPortrait';
import { generateStatDescription } from '../utils/statToText';
import MiniLocationMap from './MiniLocationMap';
// LANGUAGES import removed - using persona.languageData directly
import { RARITY_COLORS } from '../types/attributeTypes';
import { PERSONAL_BELIEFS, IDEOLOGIES, getProfessionEmoji } from '../constants';
import { WikipediaPanel } from './WikipediaPanel';
import './PersonaGenerator.css';

const ERAS: { value: HistoricalEra; label: string }[] = [
  { value: 'PREHISTORY' as HistoricalEra, label: 'Neolithic period (Before 3000 BCE)' },
  { value: 'ANTIQUITY' as HistoricalEra, label: 'Ancient world (3000 BCE - 500 CE)' },
  { value: 'MEDIEVAL' as HistoricalEra, label: 'Medieval (500 - 1450)' },
  { value: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra, label: 'Renaissance & Early Modern (1450 - 1750)' },
  { value: 'INDUSTRIAL_ERA' as HistoricalEra, label: 'Industrial Era (1750 - 1900)' },
  { value: 'MODERN_ERA' as HistoricalEra, label: 'Modern Era (1900 - 2000)' },
];

const CULTURAL_ZONES: { value: CulturalZone; label: string }[] = [
  { value: 'EUROPEAN', label: 'European' },
  { value: 'EAST_ASIAN', label: 'East Asian' },
  { value: 'SOUTH_ASIAN', label: 'South Asian' },
  { value: 'MENA', label: 'Middle East & North Africa' },
  { value: 'SUB_SAHARAN_AFRICAN', label: 'Sub-Saharan African' },
  { value: 'OCEANIA', label: 'Oceania' },
  { value: 'NORTH_AMERICAN_PRE_COLUMBIAN', label: 'North American (Pre-Columbian)' },
  { value: 'NORTH_AMERICAN_COLONIAL', label: 'North American (Colonial)' },
  { value: 'SOUTH_AMERICAN', label: 'South American' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
];

// Icon mapping for attribute badges
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Font Awesome
  FaDumbbell,
  FaEyeSlash,
  FaDeaf,
  FaRunning,
  FaBookOpen,
  FaBrain,
  FaFeather,
  FaScroll,
  FaPray,
  FaCross,
  FaStarOfDavid,
  FaBolt,
  FaHeartbeat,
  // Game Icons
  GiCrossedSwords,
  GiCrown,
  GiShield,
  GiSwordWound,
  GiBattleGear,
  // Ionicons
  IoStar,
  IoTrophy,
  IoSkull,
  IoMedkit,
  IoFlame,
  IoHeart,
  IoWarning,
  IoCompass,
  IoRocket,
  IoSchool,
  IoEyeOff,
  IoGlasses,
  // Aliases for compatibility
  FaGlasses: IoGlasses,
  // Generic fallbacks for missing icons
  GiFragile: FaFeather,
  GiLeg: IoWarning,
  GiScars: GiSwordWound,
  GiGiant: IoStar,
  GiAnt: IoStar,
  GiScrollUnfurled: FaScroll,
  GiVirusSpread: IoWarning,
  GiMedicalPack: IoMedkit,
  GiCoughing: IoWarning,
  GiHeartBeats: FaHeartbeat,
};

// Helper function to get appropriate icon for belief based on tags
const getBeliefIcon = (tags: string[]): React.ComponentType<any> => {
  if (!tags || tags.length === 0) return IoStar;

  const primaryTag = tags[0];
  const tagIconMap: Record<string, React.ComponentType<any>> = {
    'political': GiCrown,
    'spiritual': FaPray,
    'nature': IoLeaf,
    'traditional': FaScroll,
    'religious': FaCross,
    'philosophical': FaBrain,
    'epistemological': FaBookOpen,
    'scientific': IoFlask,
    'rational': IoSchool,
    'social': IoPeople,
    'economic': IoCash,
    'individualist': IoHandRight,
    'collectivist': IoPeople,
    'authoritarian': GiCrown,
    'libertarian': IoCompass,
    'martial': GiCrossedSwords,
    'justice': IoScale,
    'familial': IoHeart,
    'temporal': IoRefresh,
    'mystical': IoStar,
    'pragmatic': IoHammer,
  };

  return tagIconMap[primaryTag] || IoStar;
};

// Helper function to resolve icon string to React component
const getIconComponent = (iconName: string): React.ComponentType<any> | null => {
  return ICON_MAP[iconName] || null;
};

// Helper function to convert hex color codes to natural language color names
const hexToColorName = (hexColor: string | undefined): string | undefined => {
  if (!hexColor) return undefined;
  if (!hexColor.startsWith('#')) return hexColor; // Already a name, return as-is

  const hex = hexColor.toLowerCase();

  // Comprehensive color mapping from hex to natural language
  const colorMap: Record<string, string> = {
    // Reds
    '#8b0000': 'dark red',
    '#a52a2a': 'brown',
    '#b22222': 'deep red',
    '#cd5c5c': 'coral red',
    '#dc143c': 'crimson',
    '#ff0000': 'bright red',
    '#ff4500': 'orange-red',
    '#ff6347': 'red-orange',

    // Browns/Earth tones
    '#8b4513': 'saddle brown',
    '#a0522d': 'sienna',
    '#8b7355': 'tan brown',
    '#d2691e': 'ochre',
    '#cd853f': 'golden brown',
    '#deb887': 'beige',
    '#f4a460': 'sandy brown',

    // Blacks/Grays
    '#000000': 'black',
    '#2f4f4f': 'dark gray',
    '#696969': 'gray',
    '#808080': 'medium gray',
    '#a9a9a9': 'light gray',
    '#d3d3d3': 'pale gray',

    // Blues
    '#000080': 'navy blue',
    '#00008b': 'dark blue',
    '#0000cd': 'deep blue',
    '#0000ff': 'bright blue',
    '#4169e1': 'royal blue',
    '#6495ed': 'cornflower blue',
    '#87ceeb': 'sky blue',
    '#add8e6': 'light blue',

    // Greens
    '#006400': 'dark green',
    '#008000': 'green',
    '#228b22': 'forest green',
    '#2e8b57': 'sea green',
    '#3cb371': 'medium sea green',
    '#90ee90': 'light green',

    // Whites/Creams
    '#ffffff': 'white',
    '#fffaf0': 'cream',
    '#faebd7': 'off-white',
    '#f5f5dc': 'beige',

    // Yellows/Golds
    '#ffd700': 'gold',
    '#ffff00': 'yellow',
    '#f0e68c': 'pale yellow',

    // Purples
    '#4b0082': 'indigo',
    '#483d8b': 'dark purple',
    '#9370db': 'purple',
    '#8a2be2': 'violet',
    '#ba55d3': 'orchid',
  };

  // Try exact match first
  if (colorMap[hex]) {
    return colorMap[hex];
  }

  // Fallback: extract RGB and describe generally
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Grayscale check
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
    const brightness = (r + g + b) / 3;
    if (brightness < 50) return 'dark gray';
    if (brightness < 100) return 'charcoal';
    if (brightness < 150) return 'gray';
    if (brightness < 200) return 'light gray';
    return 'pale gray';
  }

  // Find dominant color
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (r === max) {
    if (g > b) return 'reddish-brown';
    return 'red-brown';
  } else if (g === max) {
    return 'greenish-brown';
  } else {
    return 'blue-gray';
  }
};

// Helper function to convert marking type to display label
const getMarkingTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'paint': 'Body Paint',
    'tattoo': 'Tattoo',
    'scar': 'Scar',
    'structural': 'Body Modification',
    'piercing': 'Piercing',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Helper function to format marking descriptions grammatically
const formatMarkingDescription = (marking: any): string => {
  const { type, size, location, pattern, color } = marking;

  // Convert hex colors to natural language
  const colorName = hexToColorName(color);

  // Capitalize first letter of size
  const sizeText = size ? size.charAt(0).toUpperCase() + size.slice(1) + ' ' : '';

  // Special handling for structural modifications
  if (type === 'structural') {
    if (pattern === 'teeth_filed') return 'Filed teeth';
    if (pattern === 'teeth_inlay') return `Tooth inlay${colorName ? ` (${colorName})` : ''}`;
    if (pattern === 'plate') return `${sizeText}${location} plate`;
    if (pattern === 'plug') return `${sizeText}${location} plug`;
    if (pattern === 'coils') return `${sizeText}neck coils`;
    if (pattern === 'cheek_plug') return `${sizeText}cheek plug`;
    return `${sizeText}${location} modification${pattern ? ` (${pattern.replace(/_/g, ' ')})` : ''}`;
  }

  // For piercings
  if (type === 'piercing') {
    const patternText = pattern && pattern !== 'stud' ? ` (${pattern})` : '';
    if (pattern === 'stud') return `${sizeText}${location} stud`;
    if (pattern === 'ring') return `${sizeText}${location} ring`;
    if (pattern === 'septum') return `${sizeText}septum piercing`;
    return `${sizeText}${location} piercing${patternText}`;
  }

  // For paint
  if (type === 'paint') {
    const patternText = pattern && pattern !== 'solid' ? ` (${pattern.replace(/_/g, ' ')})` : '';
    if (pattern === 'solid') {
      return colorName
        ? `${sizeText}${colorName} ${location} marking`
        : `${sizeText}${location} marking`;
    }
    return colorName
      ? `${sizeText}${colorName} ${location} paint${patternText}`
      : `${sizeText}${location} paint${patternText}`;
  }

  // For tattoos
  if (type === 'tattoo') {
    const colorText = colorName ? ` in ${colorName}` : '';
    const patternText = pattern ? ` (${pattern.replace(/_/g, ' ')})` : '';
    return `${sizeText}${location} tattoo${colorText}${patternText}`;
  }

  // For scars
  if (type === 'scar') {
    return `${sizeText}${location} scar${pattern ? ` (${pattern.replace(/_/g, ' ')})` : ''}`;
  }

  // Default fallback
  const colorText = colorName ? ` (${colorName})` : '';
  const patternText = pattern ? ` [${pattern.replace(/_/g, ' ')}]` : '';
  return `${sizeText}${type} on ${location}${colorText}${patternText}`;
};

const SOCIAL_CLASSES = [
  { value: 'poor', label: 'Poor' },
  { value: 'modest', label: 'Modest' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'wealthy', label: 'Wealthy' },
  { value: 'noble', label: 'Noble' },
];

type BiographyTab = 'biography' | 'family' | 'lifeEvents' | 'innerLife';

export default function PersonaGenerator() {
  const [persona, setPersona] = useState<HistoricalPersona | null>(null);
  const [params, setParams] = useState<Partial<GenerationParams>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Light mode by default
  const [showAbout, setShowAbout] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [hourglassRotation, setHourglassRotation] = useState(0);
  const [sandAnimationKey, setSandAnimationKey] = useState(0); // Key to restart animation on flip
  const [portraitExpressionIndex, setPortraitExpressionIndex] = useState(0);
  const [mainPortraitHoverExpression, setMainPortraitHoverExpression] = useState<string | undefined>(undefined);
  const [showGreetingBubble, setShowGreetingBubble] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });

  // Ref for portrait container to calculate bubble position
  const portraitContainerRef = useRef<HTMLDivElement>(null);

  // Expression options for portrait cycling in character details modal
  const expressionCycle = [
    { expression: undefined, label: 'Neutral' },
    { expression: 'smile' as const, label: 'Smiling' },
    { expression: 'thinking' as const, label: 'Thinking' },
    { expression: 'concern' as const, label: 'Concerned' },
    { expression: 'surprise' as const, label: 'Surprised' },
    { expression: 'skeptical' as const, label: 'Skeptical' },
    { expression: 'sad' as const, label: 'Sad' },
    { expression: 'scowl' as const, label: 'Scowling' },
    { expression: 'smirk' as const, label: 'Smirking' },
    { expression: 'tired' as const, label: 'Tired' },
    { expression: 'determined' as const, label: 'Determined' },
    { expression: 'confused' as const, label: 'Confused' },
    { expression: 'annoyed' as const, label: 'Annoyed' },
    { expression: 'excited' as const, label: 'Excited' },
  ];

  const handlePortraitClick = () => {
    setPortraitExpressionIndex((prev) => (prev + 1) % expressionCycle.length);
  };

  // Handler for main portrait hover - randomly selects an expression and shows greeting bubble
  const handleMainPortraitHover = () => {
    // Exclude the first one (undefined/neutral) to always show a different expression on hover
    const expressionsWithoutNeutral = expressionCycle.slice(1);
    const randomIndex = Math.floor(Math.random() * expressionsWithoutNeutral.length);
    setMainPortraitHoverExpression(expressionsWithoutNeutral[randomIndex].expression);

    // Calculate bubble position
    if (portraitContainerRef.current) {
      const rect = portraitContainerRef.current.getBoundingClientRect();
      setBubblePosition({
        top: rect.top + 10, // 10px from top of portrait
        left: rect.right + 20 // 20px to the right of portrait
      });
    }

    setShowGreetingBubble(true);
  };

  const handleMainPortraitLeave = () => {
    setMainPortraitHoverExpression(undefined);
    setShowGreetingBubble(false);
  };

  // Get the greeting for the current character's language
  const getCharacterGreeting = () => {
    // Use persona.languageData which contains the resolved language info
    if (!persona?.languageData?.greetings?.hello) return null;

    return {
      greeting: persona.languageData.greetings.hello,
      languageName: persona.languageData.name
    };
  };

  // Random banner for About modal (1-3)
  const [aboutBannerIndex] = useState(() => Math.floor(Math.random() * 3) + 1);
  const [activeTab, setActiveTab] = useState<BiographyTab>('biography');
  const [wikipediaData, setWikipediaData] = useState<CachedWikipediaData | null>(null);
  const [wikipediaLoading, setWikipediaLoading] = useState(false);
  const [wikipediaArticle, setWikipediaArticle] = useState<string | null>(null);

  // Family navigation state
  const [personaStack, setPersonaStack] = useState<HistoricalPersona[]>([]);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState<number>(0);
  const [breadcrumbPath, setBreadcrumbPath] = useState<Array<{
    name: string;
    relation?: string;
    index: number;
    generationDepth?: number; // Track how many generations back from root
  }>>([]);
  const [isGeneratingFamilyMember, setIsGeneratingFamilyMember] = useState(false);
  const [expandedHealthIndex, setExpandedHealthIndex] = useState<number | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [deathRevealState, setDeathRevealState] = useState<'prompt' | 'revealed' | 'hidden'>('prompt');
  const [deathInfo, setDeathInfo] = useState<{ year: number; age: number; cause: string; description: string; lastWords: string } | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Auto-generate persona on mount
  useEffect(() => {
    generateCompletelyRandom();
  }, []);

  // Fetch Wikipedia image data when persona changes
  useEffect(() => {
    if (!persona) {
      setWikipediaData(null);
      return;
    }

    const fetchWikipediaImage = async () => {
      setWikipediaLoading(true);
      try {
        const data = await getWikipediaImageForContext({
          culturalZone: persona.culturalZone,
          region: persona.region,
          year: persona.year,
        });
        setWikipediaData(data);
      } catch (error) {
        console.error('Error fetching Wikipedia image:', error);
        setWikipediaData(null);
      } finally {
        setWikipediaLoading(false);
      }
    };

    fetchWikipediaImage();
  }, [persona]);

  const generateRandom = () => {
    const newPersona = generateHistoricalPersona(params);
    console.log('[PersonaGenerator] Generated character data:', {
      hasAttributes: !!newPersona.character.attributes,
      attributeCount: newPersona.character.attributes?.length || 0,
      attributes: newPersona.character.attributes,
      hasIdeology: !!newPersona.character.ideology,
      ideology: newPersona.character.ideology,
      hasBeliefs: !!newPersona.character.beliefs,
      beliefCount: newPersona.character.beliefs?.length || 0,
      beliefs: newPersona.character.beliefs,
      hasDiseases: !!newPersona.character.diseaseHealth?.currentDiseases,
      diseaseCount: newPersona.character.diseaseHealth?.currentDiseases?.length || 0,
      diseases: newPersona.character.diseaseHealth?.currentDiseases,
    });
    setPersona(newPersona);
    setDeathRevealState('prompt'); // Reset death reveal for new persona
    setDeathInfo(null);
  };

  // ===========================================================================
  // FAMILY NAVIGATION FUNCTIONS
  // ===========================================================================

  // Initialize persona stack when persona is first set (from random generation)
  useEffect(() => {
    if (persona && personaStack.length === 0) {
      setPersonaStack([persona]);
      setCurrentPersonaIndex(0);
      setBreadcrumbPath([{ name: persona.character.name, index: 0 }]);
    }
  }, [persona, personaStack.length]);

  // Helper: Calculate birth year from family relation
  // Helper: Calculate parent's age when child was born (realistic range)
  const calculateParentalAgeAtBirth = (relation: string): number => {
    if (relation === 'mother') {
      // Mothers: 15-45 years old at birth
      return 15 + Math.floor(Math.random() * 31);
    } else if (relation === 'father') {
      // Fathers: 15-60 years old at birth
      return 15 + Math.floor(Math.random() * 46);
    }
    return 25; // default
  };

  const calculateBirthYear = (originChar: any, familyMember: any): number => {
    // CRITICAL: originChar.birthYear can be string | number, must convert to number
    const originBirthYear = typeof originChar.birthYear === 'string'
      ? parseInt(originChar.birthYear, 10)
      : (originChar.birthYear || 0);
    const relation = familyMember.relation;

    if (relation === 'father' || relation === 'mother') {
      // Calculate parent's age at child's birth, then subtract from child's birth year
      const parentalAgeAtBirth = calculateParentalAgeAtBirth(relation);
      return originBirthYear - parentalAgeAtBirth;
    } else if (relation === 'son' || relation === 'daughter') {
      return originBirthYear + (20 + Math.floor(Math.random() * 20)); // 20-40 years younger
    } else if (relation === 'spouse') {
      return originBirthYear + Math.floor(Math.random() * 21) - 10; // within 10 years
    } else { // siblings
      return originBirthYear + Math.floor(Math.random() * 21) - 10; // within 10 years
    }
  };

  // Helper: Get gender from relation
  const getGenderFromRelation = (relation: string): Gender => {
    if (relation === 'father' || relation === 'son' || relation === 'brother') return 'Male';
    if (relation === 'mother' || relation === 'daughter' || relation === 'sister') return 'Female';
    return Math.random() > 0.5 ? 'Male' : 'Female';
  };

  // Helper: Get relation label for breadcrumb
  const getRelationLabel = (relation: string, originName: string): string => {
    const labels: Record<string, string> = {
      'father': `Father of ${originName}`,
      'mother': `Mother of ${originName}`,
      'son': `Son of ${originName}`,
      'daughter': `Daughter of ${originName}`,
      'brother': `Brother of ${originName}`,
      'sister': `Sister of ${originName}`,
      'sibling': `Sibling of ${originName}`,
      'spouse': `Spouse of ${originName}`,
    };
    return labels[relation] || relation;
  };

  // Helper: Get inverse relation (for bidirectional consistency)
  const getInverseRelation = (relation: string, originGender: Gender): string => {
    if (relation === 'father' || relation === 'mother') {
      return originGender === 'Male' ? 'son' : 'daughter';
    } else if (relation === 'son' || relation === 'daughter') {
      return originGender === 'Male' ? 'father' : 'mother';
    } else if (relation === 'spouse') {
      return 'spouse';
    } else {
      // For sibling/brother/sister, return specific gender-based relation
      return originGender === 'Male' ? 'brother' : 'sister';
    }
  };

  // Helper: Determine the correct historical era based on birth year
  const getEraFromBirthYear = (birthYear: number): HistoricalEra => {
    if (birthYear < -3000) return 'PREHISTORY' as HistoricalEra;
    if (birthYear < 500) return 'ANTIQUITY' as HistoricalEra;
    if (birthYear < 1450) return 'MEDIEVAL' as HistoricalEra;
    if (birthYear < 1750) return 'RENAISSANCE_EARLY_MODERN' as HistoricalEra;
    if (birthYear < 1900) return 'INDUSTRIAL_ERA' as HistoricalEra;
    return 'MODERN_ERA' as HistoricalEra;
  };

  // Helper: Detect name origin and ancestral cultural zone
  const getAncestralOrigin = (name: string, currentCulturalZone: CulturalZone): { culturalZone: CulturalZone; confidence: number } => {
    // European name patterns
    const germanicNames = /^(Wilhelm|Friedrich|Karl|Hans|Otto|Heinrich|Ludwig|Gustav|Rudolf|Wolfgang|Walter|Hermann|Albert|Ernst|Paul|Georg|Klaus|Dieter|Helmut|Fritz)/i;
    const frenchNames = /^(Jean|Pierre|Louis|Charles|Henri|François|André|Jacques|Michel|Philippe|Guillaume|Bernard|Robert|Georges|Marcel|René|Antoine|Claude|Luc|Étienne)/i;
    const italianNames = /^(Giovanni|Giuseppe|Antonio|Francesco|Luigi|Carlo|Marco|Paolo|Mario|Luca|Alessandro|Andrea|Pietro|Matteo|Stefano|Giorgio|Lorenzo|Roberto|Vincenzo|Salvatore)/i;
    const spanishNames = /^(José|Juan|Antonio|Manuel|Francisco|Luis|Pedro|Miguel|Jesús|Fernando|Carlos|Rafael|Javier|Alejandro|Diego|Sergio|Andrés|Pablo|Daniel|Jorge)/i;
    const englishNames = /^(John|William|James|Robert|Thomas|Edward|Henry|Charles|George|Richard|Joseph|David|Michael|Daniel|Matthew|Christopher|Andrew|Joshua|Samuel|Benjamin)/i;
    const slavicNames = /^(Ivan|Vladimir|Dmitri|Sergei|Aleksandr|Nikolai|Pavel|Mikhail|Andrei|Boris|Yuri|Viktor|Anton|Oleg|Konstantin|Roman|Maxim|Igor|Vasily|Alexei)/i;
    const greekNames = /^(Alexandros|Nikolaos|Georgios|Dimitrios|Konstantinos|Ioannis|Andreas|Panagiotis|Christos|Stefanos|Vasileios|Theodoros|Athanasios|Michail|Antonios)/i;

    // Asian name patterns
    const chineseNames = /^(Li|Wang|Zhang|Liu|Chen|Yang|Huang|Zhao|Wu|Zhou|Xu|Sun|Ma|Zhu|Hu|Guo|He|Lin|Gao|Luo)/i;
    const japaneseNames = /^(Tanaka|Suzuki|Yamamoto|Watanabe|Nakamura|Kobayashi|Sato|Kato|Yoshida|Takahashi|Matsumoto|Ito|Kimura|Hayashi|Shimizu)/i;
    const koreanNames = /^(Kim|Lee|Park|Choi|Jung|Kang|Cho|Yoon|Jang|Lim|Han|Oh|Seo|Shin|Kwon|Hwang|Ahn|Song|Hong|Yoo)/i;

    // MENA name patterns
    const arabicNames = /^(Muhammad|Ahmad|Ali|Hassan|Hussein|Omar|Ibrahim|Khalid|Abdullah|Yusuf|Ahmed|Mahmoud|Abdul|Rashid|Tariq|Hamza|Samir|Karim|Nasser|Salah)/i;
    const persianNames = /^(Reza|Ali|Mohammad|Hassan|Hossein|Mehdi|Amir|Saeed|Majid|Ahmad|Hamid|Javad|Morteza|Abbas|Akbar|Ebrahim|Gholamreza|Masoud|Mojtaba|Ramin)/i;

    // Check for matches
    if (germanicNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (frenchNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (italianNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (spanishNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (englishNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (slavicNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (greekNames.test(name)) return { culturalZone: 'EUROPEAN', confidence: 0.9 };
    if (chineseNames.test(name)) return { culturalZone: 'EAST_ASIAN', confidence: 0.9 };
    if (japaneseNames.test(name)) return { culturalZone: 'EAST_ASIAN', confidence: 0.9 };
    if (koreanNames.test(name)) return { culturalZone: 'EAST_ASIAN', confidence: 0.9 };
    if (arabicNames.test(name)) return { culturalZone: 'MENA', confidence: 0.9 };
    if (persianNames.test(name)) return { culturalZone: 'MENA', confidence: 0.9 };

    // Default: same as current
    return { culturalZone: currentCulturalZone, confidence: 0.5 };
  };

  // Helper: Determine if we should trace back to ancestral homeland
  const shouldTraceToAncestralHomeland = (
    culturalZone: CulturalZone,
    birthYear: number,
    generationsBack: number
  ): boolean => {
    // Colonial/immigrant regions that should trace back
    const colonialRegions = ['NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN', 'OCEANIA'];

    if (colonialRegions.includes(culturalZone)) {
      // North American Colonial: trace back to Europe after 2-4 generations (depending on era)
      if (culturalZone === 'NORTH_AMERICAN_COLONIAL') {
        if (birthYear > 1850 && generationsBack >= 3) return true; // Late 1800s families came ~1820-1850
        if (birthYear > 1800 && generationsBack >= 4) return true; // Early 1800s families came ~1750-1800
        if (birthYear > 1750 && generationsBack >= 2) return true; // Mid 1700s, go back to Europe quickly
        if (birthYear <= 1750 && generationsBack >= 1) return true; // Before 1750, likely immigrant
      }

      // South American: similar pattern with Spanish/Portuguese origins
      if (culturalZone === 'SOUTH_AMERICAN') {
        if (birthYear > 1800 && generationsBack >= 3) return true;
        if (birthYear > 1600 && generationsBack >= 2) return true;
        if (birthYear <= 1600 && generationsBack >= 1) return true;
      }

      // Oceania: trace back to European/Asian origins
      if (culturalZone === 'OCEANIA') {
        if (birthYear > 1850 && generationsBack >= 2) return true; // Recent settlers
        if (birthYear > 1800 && generationsBack >= 1) return true; // Very recent
      }
    }

    return false;
  };

  // Helper: Get location variation within same cultural zone
  const getLocationVariation = (originLocation: string, originRegion: string, culturalZone: CulturalZone): { location: string; region: string } => {
    // 80% chance stay in same location, 20% chance move within region/cultural zone
    if (Math.random() < 0.8) {
      return { location: originLocation, region: originRegion };
    }

    // Move to nearby area (would need region adjacency data for full implementation)
    // For now, just return same with small variation message
    return { location: originLocation, region: originRegion };
  };

  // Main: Generate persona from family member
  const generatePersonaFromFamilyMember = async (
    originPersona: HistoricalPersona,
    familyMember: any,
    generationDepth: number = 0
  ): Promise<HistoricalPersona> => {
    const originChar = originPersona.character;

    // CRITICAL: Convert culturalZone from display format (spaces) back to enum format (underscores)
    // originPersona.culturalZone is stored as "EAST ASIAN" but CulturalZone enum uses "EAST_ASIAN"
    const originCulturalZone = originPersona.culturalZone.replace(/ /g, '_') as CulturalZone;

    // Get the origin character's birth year as a number (it can be string | number in the type)
    const originBirthYear = typeof originChar.birthYear === 'string'
      ? parseInt(originChar.birthYear, 10)
      : (originChar.birthYear || originPersona.year - originChar.age);

    // Calculate birth year based on relation
    const birthYear = familyMember.birthYear || calculateBirthYear(originChar, familyMember);

    // CRITICAL: Set the "current year" for the new persona
    // For parents: show them at the child's birth year (when child was born)
    // For spouses/siblings: show them at the same year as the origin character
    // Use originPersona.year as the authoritative "current year" for the origin character
    const isParentRelation = familyMember.relation === 'father' || familyMember.relation === 'mother';
    const currentYear = isParentRelation
      ? originBirthYear  // Parents: show at child's birth year
      : originPersona.year; // Spouses/siblings/children: same year as origin

    // Calculate age based on current year
    // For parents: this will be their age when child was born
    // For others: this will be their current age or age at death
    const calculatedAge = familyMember.isDeceased && familyMember.deathYear
      ? familyMember.deathYear - birthYear
      : currentYear - birthYear;

    // Determine gender from relation
    const gender = getGenderFromRelation(familyMember.relation);

    // Determine the correct era based on the calculated birth year
    const correctEra = getEraFromBirthYear(birthYear);

    // ===== GEOGRAPHICAL ANCESTRY LOGIC =====
    // CRITICAL: Use originPersona's location/region (guaranteed to exist on HistoricalPersona),
    // not originChar's (optional on PlayerCharacter and may be undefined)
    // Use originCulturalZone (with underscores) for all lookups
    let targetCulturalZone = originCulturalZone;
    let targetLocation: string | undefined = originPersona.location;
    let targetRegion: string | undefined = originPersona.region;

    // Handle different relations with appropriate location logic
    const isParent = familyMember.relation === 'father' || familyMember.relation === 'mother';
    const isChild = familyMember.relation === 'son' || familyMember.relation === 'daughter';
    const isSibling = familyMember.relation === 'sibling' || familyMember.relation === 'brother' || familyMember.relation === 'sister';
    const isSpouse = familyMember.relation === 'spouse';

    if (isSpouse) {
      // Spouses: 90% from exact same location, 10% from nearby within cultural zone
      if (Math.random() < 0.9) {
        targetCulturalZone = originCulturalZone;
        targetLocation = originPersona.location;
        targetRegion = originPersona.region;
      } else {
        const locationVariation = getLocationVariation(
          originPersona.location,
          originPersona.region,
          originCulturalZone
        );
        targetLocation = locationVariation.location;
        targetRegion = locationVariation.region;
      }
    } else if (isChild || isSibling) {
      // Children and siblings: same location (grew up together)
      // 95% same location, 5% moved within cultural zone
      if (Math.random() < 0.95) {
        targetCulturalZone = originCulturalZone;
        targetLocation = originPersona.location;
        targetRegion = originPersona.region;
      } else {
        const locationVariation = getLocationVariation(
          originPersona.location,
          originPersona.region,
          originCulturalZone
        );
        targetLocation = locationVariation.location;
        targetRegion = locationVariation.region;
      }
    } else if (isParent) {
      // Parents: stay in same location/region as child
      // The ancestral homeland tracing feature has been disabled as it was causing
      // unexpected jumps to different continents. Parents should generally be from
      // the same area as their children.
      // 90% same exact location, 10% nearby within region
      if (Math.random() < 0.9) {
        targetCulturalZone = originCulturalZone;
        targetLocation = originPersona.location;
        targetRegion = originPersona.region;
      } else {
        const locationVariation = getLocationVariation(
          originPersona.location,
          originPersona.region,
          originCulturalZone
        );
        targetLocation = locationVariation.location;
        targetRegion = locationVariation.region;
      }
    }

    // DEBUG: Log all calculated values
    console.log('[FamilyMember] Generating persona for:', familyMember.name, {
      relation: familyMember.relation,
      familyMemberBirthYear: familyMember.birthYear,
      calculatedBirthYear: birthYear,
      originPersonaYear: originPersona.year,
      originBirthYear: originBirthYear,
      currentYear: currentYear,
      calculatedAge: calculatedAge,
      isParentRelation: isParentRelation,
    });

    // Generate new persona with constraints
    const newPersona = generateHistoricalPersona({
      name: familyMember.name,
      year: currentYear, // CRITICAL: Use currentYear for correct time context (parent at child's birth, spouse/sibling at current time)
      era: correctEra, // Use era based on birth year, not origin character's era
      culturalZone: targetCulturalZone, // Use determined cultural zone
      gender: gender,
      socialClass: originChar.socialClass, // Keep same social class as family
      religion: originChar.religion, // Same religion
      birthYear: birthYear,
      age: calculatedAge,
      profession: familyMember.profession,
      location: targetLocation,
      region: targetRegion,
    });

    // Add origin character to the new persona's family (bidirectional link)
    const inverseRelation = getInverseRelation(familyMember.relation, originChar.gender);
    const originAsFamilyMember = {
      name: originChar.name,
      relation: inverseRelation,
      age: originChar.age,
      profession: originChar.profession,
      birthYear: originChar.birthYear,
    };

    // Ensure the new persona has the origin character in their family
    if (!newPersona.character.family.some(m => m.name === originChar.name)) {
      newPersona.character.family.push(originAsFamilyMember);
    }

    return newPersona;
  };

  // Handler: View family member (generate their persona)
  const handleViewFamilyMember = async (familyMember: any) => {
    if (isGeneratingFamilyMember) return; // Prevent double-click

    try {
      setIsGeneratingFamilyMember(true);

      const currentPersona = personaStack[currentPersonaIndex];

      // Calculate generation depth (how many generations back from root)
      // If moving to parent, increment depth; for others (spouse, children, siblings), keep same depth
      const currentDepth = breadcrumbPath[currentPersonaIndex]?.generationDepth || 0;
      const isMovingToParent = familyMember.relation === 'father' || familyMember.relation === 'mother';
      const newGenerationDepth = isMovingToParent ? currentDepth + 1 : currentDepth;

      // Generate new persona with generation depth
      const newPersona = await generatePersonaFromFamilyMember(
        currentPersona,
        familyMember,
        newGenerationDepth
      );

      // Add to stack (remove any personas after current if we navigated back)
      const newStack = personaStack.slice(0, currentPersonaIndex + 1);
      newStack.push(newPersona);

      // Update breadcrumb with generation depth
      const relationLabel = getRelationLabel(familyMember.relation, currentPersona.character.name);
      const newPath = breadcrumbPath.slice(0, currentPersonaIndex + 1);
      newPath.push({
        name: familyMember.name,
        relation: relationLabel,
        index: newStack.length - 1,
        generationDepth: newGenerationDepth
      });

      setPersonaStack(newStack);
      setCurrentPersonaIndex(newStack.length - 1);
      setBreadcrumbPath(newPath);
      setPersona(newPersona);

    } catch (error) {
      console.error('Failed to generate family member persona:', error);
      alert('Failed to generate family member. Please try again.');
    } finally {
      setIsGeneratingFamilyMember(false);
    }
  };

  // Handler: Navigate via breadcrumb
  const handleBreadcrumbNavigation = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= personaStack.length) return;
    if (targetIndex === currentPersonaIndex) return; // Already there

    setCurrentPersonaIndex(targetIndex);
    setPersona(personaStack[targetIndex]);
    setBreadcrumbPath(prev => prev.slice(0, targetIndex + 1));
  };

  // Helper: Make names in text clickable
  const makeNamesClickable = (text: string, familyMembers: any[]): React.ReactNode => {
    if (!familyMembers || familyMembers.length === 0) return text;

    // Create regex pattern from all family member names
    const namePattern = familyMembers
      .map(m => m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
      .join('|');

    if (!namePattern) return text;

    const regex = new RegExp(`\\b(${namePattern})(\'s)?\\b`, 'gi');

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let matchCount = 0;

    regex.lastIndex = 0; // Reset regex state

    while ((match = regex.exec(text)) !== null && matchCount < 100) { // Safety limit
      matchCount++;
      const matchedName = match[1];
      const member = familyMembers.find(m =>
        m.name.toLowerCase() === matchedName.toLowerCase()
      );

      if (!member) continue;

      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add clickable name
      parts.push(
        <span
          key={`${member.name}-${match.index}`}
          className="family-name-link"
          onClick={(e) => {
            e.stopPropagation();
            handleViewFamilyMember(member);
          }}
          title="Click to generate their life history"
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const generateCompletelyRandom = () => {
    setParams({});
    const newPersona = generateHistoricalPersona({});
    console.log('[PersonaGenerator] Generated character data:', {
      hasAttributes: !!newPersona.character.attributes,
      attributeCount: newPersona.character.attributes?.length || 0,
      attributes: newPersona.character.attributes,
      hasIdeology: !!newPersona.character.ideology,
      ideology: newPersona.character.ideology,
      hasBeliefs: !!newPersona.character.beliefs,
      beliefCount: newPersona.character.beliefs?.length || 0,
      beliefs: newPersona.character.beliefs,
      hasDiseases: !!newPersona.character.diseaseHealth?.currentDiseases,
      diseaseCount: newPersona.character.diseaseHealth?.currentDiseases?.length || 0,
      diseases: newPersona.character.diseaseHealth?.currentDiseases,
    });
    setPersona(newPersona);
    setActiveTab('biography'); // Reset to biography tab on new generation
    setDeathRevealState('prompt'); // Reset death reveal for new persona
    setDeathInfo(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleHourglassClick = () => {
    setHourglassRotation(prev => prev + 180);
    setSandAnimationKey(prev => prev + 1); // Restart sand animation
  };

  const handleShare = async () => {
    if (navigator.share && persona) {
      try {
        await navigator.share({
          title: `Historical Persona: ${persona.character.name}`,
          text: `${persona.character.name} - ${persona.character.profession} from ${persona.location} (${persona.year})`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert('Sharing is not supported in this browser. Copy the URL to share!');
    }
  };

  const handleSavePDF = () => {
    if (!persona) return;

    // Capture the portrait SVG
    const portraitContainer = document.querySelector('.portrait-wrapper svg, .portrait-container svg');
    let portraitSvgString = '';
    if (portraitContainer) {
      const svgClone = portraitContainer.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', '180');
      svgClone.setAttribute('height', '180');
      portraitSvgString = new XMLSerializer().serializeToString(svgClone);
    }

    // Use browser's print functionality for PDF export
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const char = persona.character;
    const yearDisplay = persona.year < 0 ? `${Math.abs(persona.year)} BCE` : `${persona.year} CE`;
    const birthYearDisplay = char.birthYear
      ? (typeof char.birthYear === 'number' && char.birthYear < 0
        ? `${Math.abs(char.birthYear)} BCE`
        : `${char.birthYear} CE`)
      : 'Unknown';
    const eraDisplay = formatEraLabel(persona.era);
    const cultureDisplay = formatCulturalZone(persona.culturalZone);

    // Build life events HTML (all events, grouped by decade)
    const lifeEvents = persona.enhancedLifeEvents || persona.character.lifeEvents || [];
    const lifeEventsHtml = lifeEvents.length > 0
      ? lifeEvents.map((event: any) => {
          const yearStr = event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`;
          const desc = event.description || event.text || '';
          const ageAtEvent = event.age || (event.year && char.birthYear ? event.year - (typeof char.birthYear === 'number' ? char.birthYear : parseInt(char.birthYear as string)) : null);
          return `<div class="life-event">
            <span class="event-year">${yearStr}</span>
            <span class="event-age">${ageAtEvent ? `(age ${ageAtEvent})` : ''}</span>
            <span class="event-text">${desc}</span>
          </div>`;
        }).join('')
      : '<p class="no-data">No recorded life events.</p>';

    // Build equipment HTML with details
    const equipmentHtml = Object.entries(char.equippedItems || {})
      .filter(([_, item]) => item)
      .map(([slot, item]: [string, any]) => {
        const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
        const material = item.material ? ` (${item.material})` : '';
        return `<div class="equip-item"><span class="equip-slot">${slotLabel}:</span> ${item.name}${material}</div>`;
      }).join('') || '<div class="no-data">No equipment recorded</div>';

    // Build inventory HTML (compact grid)
    const inventoryItems = char.inventory || [];
    const inventoryHtml = inventoryItems.length > 0
      ? inventoryItems.map(item =>
          `<span class="inv-item">${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>`
        ).join('')
      : '<span class="no-data">Empty</span>';

    // Build family HTML
    const familyMembers = char.family || [];
    const familyHtml = familyMembers.length > 0
      ? familyMembers.map(member => {
          const relation = member.relation.charAt(0).toUpperCase() + member.relation.slice(1);
          const status = member.isDeceased ? ' (deceased)' : '';
          return `<div class="family-member">
            <span class="family-relation">${relation}:</span>
            <span class="family-name">${member.name}${status}</span>
            ${member.profession ? `<span class="family-prof">${member.profession}</span>` : ''}
          </div>`;
        }).join('')
      : '<p class="no-data">No known family members.</p>';

    // Build personality traits HTML
    const personality = char.personality || {};
    const personalityHtml = `
      <div class="personality-grid">
        <div class="trait"><span class="trait-label">Openness</span><div class="trait-bar"><div class="trait-fill" style="width: ${(personality.openness || 0.5) * 100}%"></div></div><span class="trait-val">${Math.round((personality.openness || 0.5) * 100)}%</span></div>
        <div class="trait"><span class="trait-label">Conscientiousness</span><div class="trait-bar"><div class="trait-fill" style="width: ${(personality.conscientiousness || 0.5) * 100}%"></div></div><span class="trait-val">${Math.round((personality.conscientiousness || 0.5) * 100)}%</span></div>
        <div class="trait"><span class="trait-label">Extraversion</span><div class="trait-bar"><div class="trait-fill" style="width: ${(personality.extraversion || 0.5) * 100}%"></div></div><span class="trait-val">${Math.round((personality.extraversion || 0.5) * 100)}%</span></div>
        <div class="trait"><span class="trait-label">Agreeableness</span><div class="trait-bar"><div class="trait-fill" style="width: ${(personality.agreeableness || 0.5) * 100}%"></div></div><span class="trait-val">${Math.round((personality.agreeableness || 0.5) * 100)}%</span></div>
        <div class="trait"><span class="trait-label">Neuroticism</span><div class="trait-bar"><div class="trait-fill" style="width: ${(personality.neuroticism || 0.5) * 100}%"></div></div><span class="trait-val">${Math.round((personality.neuroticism || 0.5) * 100)}%</span></div>
      </div>
    `;

    // Build social context HTML
    const social = char.socialContext || {};
    const socialHtml = `
      <div class="social-grid">
        <div class="social-item"><span class="social-label">Privilege</span><span class="social-val">${Math.round((social.privilege || 0.5) * 100)}%</span></div>
        <div class="social-item"><span class="social-label">Wanderlust</span><span class="social-val">${Math.round((social.wanderlust || 0.5) * 100)}%</span></div>
        <div class="social-item"><span class="social-label">Religiosity</span><span class="social-val">${Math.round((social.religiosity || 0.5) * 100)}%</span></div>
        <div class="social-item"><span class="social-label">Ambition</span><span class="social-val">${Math.round((social.ambition || 0.5) * 100)}%</span></div>
      </div>
    `;

    // Build attributes/badges HTML
    const attributes = char.attributes || [];
    const attributesHtml = attributes.length > 0
      ? attributes.map((attr: any) => {
          const rarity = attr.rarity || 'common';
          return `<span class="attr-badge attr-${rarity}">${attr.name}</span>`;
        }).join('')
      : '<span class="no-data">None</span>';

    // Build health status HTML
    const diseases = char.diseaseHealth?.currentDiseases || [];
    const healthHtml = diseases.length > 0
      ? diseases.map((d: any) => `<span class="disease">${d.disease?.name || d.name}</span>`).join(', ')
      : '<span class="healthy">Good health</span>';

    // Build appearance HTML
    const appearance = char.appearance || {};
    const appearanceHtml = `
      <div class="appearance-grid">
        <div class="appear-item"><span class="appear-label">Build:</span> ${appearance.build || 'Average'}</div>
        <div class="appear-item"><span class="appear-label">Hair:</span> ${appearance.hairColor || 'Unknown'}, ${appearance.hairLength || 'medium'}</div>
        <div class="appear-item"><span class="appear-label">Eyes:</span> ${appearance.eyeColor || 'Unknown'}</div>
        ${appearance.facialHair && char.gender !== 'Female' ? `<div class="appear-item"><span class="appear-label">Facial Hair:</span> ${(appearance.facialHairStyle || 'beard').replace(/_/g, ' ')}</div>` : ''}
      </div>
    `;

    // Build language HTML
    const langData = persona.languageData;
    const languageHtml = langData
      ? `<div class="language-info">
          <strong>${langData.name}</strong>${langData.nativeName ? ` (${langData.nativeName})` : ''}
          ${langData.family ? `<br><span class="lang-family">Family: ${langData.family}</span>` : ''}
        </div>`
      : '<span class="no-data">Unknown</span>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${char.name} - Historical Persona</title>
        <style>
          @page { size: letter; margin: 0.5in; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            max-width: 7.5in;
            margin: 0 auto;
            line-height: 1.4;
            color: #1a1a1a;
            font-size: 9pt;
          }

          .page { page-break-after: always; }
          .page:last-child { page-break-after: avoid; }

          /* Header with portrait */
          .header {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #333;
          }
          .portrait {
            flex-shrink: 0;
            border: 1px solid #333;
            background: #f9f7f4;
            padding: 3px;
          }
          .portrait svg { display: block; }
          .title-block { flex: 1; }
          .title-block h1 {
            font-size: 1.5rem;
            margin-bottom: 0.15rem;
            font-weight: normal;
            font-variant: small-caps;
            letter-spacing: 0.05em;
          }
          .title-block h2 {
            font-size: 1rem;
            color: #555;
            margin-bottom: 0.4rem;
            font-weight: normal;
            font-style: italic;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.15rem 1rem;
            font-size: 0.85rem;
            color: #444;
          }
          .meta-grid .label { color: #666; }

          /* Section styling */
          .section { margin-bottom: 0.6rem; }
          .section-title {
            font-size: 0.7rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #555;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.15rem;
            margin-bottom: 0.3rem;
          }

          /* Grid layouts */
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }

          /* Stats grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0.25rem;
          }
          .stat {
            background: #f5f3f0;
            padding: 0.25rem;
            border-radius: 2px;
            text-align: center;
            border: 1px solid #e0ddd8;
          }
          .stat-label { font-size: 0.55rem; color: #666; text-transform: uppercase; letter-spacing: 0.03em; }
          .stat-value { font-size: 0.95rem; font-weight: bold; color: #333; }

          /* Personality bars */
          .personality-grid { display: flex; flex-direction: column; gap: 0.2rem; }
          .trait { display: flex; align-items: center; gap: 0.3rem; }
          .trait-label { font-size: 0.7rem; width: 85px; color: #555; }
          .trait-bar { flex: 1; height: 8px; background: #e8e6e2; border-radius: 4px; overflow: hidden; }
          .trait-fill { height: 100%; background: linear-gradient(90deg, #8b7355, #a08060); }
          .trait-val { font-size: 0.65rem; width: 28px; text-align: right; color: #666; }

          /* Social grid */
          .social-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; }
          .social-item { text-align: center; background: #f8f7f5; padding: 0.25rem; border-radius: 2px; }
          .social-label { font-size: 0.6rem; color: #666; display: block; }
          .social-val { font-size: 0.85rem; font-weight: bold; color: #444; }

          /* Family members */
          .family-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.2rem 0.5rem; }
          .family-member { display: flex; gap: 0.3rem; font-size: 0.8rem; align-items: baseline; }
          .family-relation { color: #666; min-width: 50px; }
          .family-name { font-weight: 500; }
          .family-prof { font-size: 0.7rem; color: #888; font-style: italic; }

          /* Attributes badges */
          .attributes-list { display: flex; flex-wrap: wrap; gap: 0.25rem; }
          .attr-badge {
            padding: 0.15rem 0.4rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 500;
          }
          .attr-common { background: #e8e6e2; color: #555; }
          .attr-uncommon { background: #d4e8d4; color: #2a5a2a; }
          .attr-rare { background: #d4d4e8; color: #3a3a6a; }
          .attr-legendary { background: #e8d4d4; color: #6a3a3a; }

          /* Equipment and inventory */
          .equip-item { font-size: 0.8rem; padding: 0.1rem 0; }
          .equip-slot { color: #666; }
          .inventory-grid { display: flex; flex-wrap: wrap; gap: 0.2rem; }
          .inv-item {
            background: #f0ede8;
            padding: 0.1rem 0.3rem;
            border-radius: 2px;
            font-size: 0.7rem;
          }

          /* Biography */
          .biography {
            font-style: italic;
            background: #faf9f7;
            padding: 0.6rem;
            border-left: 2px solid #8b7355;
            font-size: 0.85rem;
            line-height: 1.5;
          }

          /* Life events */
          .life-events { font-size: 0.8rem; }
          .life-event {
            display: flex;
            gap: 0.4rem;
            padding: 0.15rem 0;
            border-bottom: 1px dotted #e8e6e2;
          }
          .life-event:last-child { border-bottom: none; }
          .event-year {
            font-weight: bold;
            color: #666;
            min-width: 55px;
            font-family: 'Courier New', monospace;
            font-size: 0.75rem;
          }
          .event-age { color: #888; min-width: 45px; font-size: 0.7rem; }
          .event-text { flex: 1; }

          /* Appearance */
          .appearance-grid { font-size: 0.8rem; }
          .appear-item { padding: 0.1rem 0; }
          .appear-label { color: #666; }

          /* Language */
          .language-info { font-size: 0.85rem; }
          .lang-family { font-size: 0.75rem; color: #666; }

          /* Health */
          .disease { color: #8b4444; font-weight: 500; }
          .healthy { color: #448b44; }

          /* Helper classes */
          .no-data { color: #999; font-style: italic; font-size: 0.8rem; }

          /* Page 2: About */
          .about-header {
            text-align: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #333;
          }
          .about-header h1 {
            font-size: 1.3rem;
            font-variant: small-caps;
            letter-spacing: 0.1em;
            margin-bottom: 0.25rem;
          }
          .about-header .url {
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            color: #666;
          }

          .about-content {
            columns: 2;
            column-gap: 1.5rem;
            text-align: justify;
            font-size: 0.85rem;
          }
          .about-content p { margin-bottom: 0.6rem; }
          .about-content h3 {
            font-size: 0.9rem;
            margin: 0.8rem 0 0.3rem 0;
            font-variant: small-caps;
            break-after: avoid;
          }
          .about-content h3:first-child { margin-top: 0; }

          .footer {
            margin-top: 1rem;
            padding-top: 0.5rem;
            border-top: 1px solid #ccc;
            font-size: 0.7rem;
            color: #888;
            text-align: center;
          }
          .footer a { color: #666; }

          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <!-- PAGE 1: Character Sheet -->
        <div class="page">
          <div class="header">
            <div class="portrait">
              ${portraitSvgString || '<div style="width:180px;height:180px;background:#ddd;display:flex;align-items:center;justify-content:center;color:#999;font-size:10px;">No Portrait</div>'}
            </div>
            <div class="title-block">
              <h1>${char.name}</h1>
              <h2>${char.profession}</h2>
              <div class="meta-grid">
                <div><span class="label">Location:</span> ${persona.location}, ${persona.region}</div>
                <div><span class="label">Date:</span> ${yearDisplay} (${eraDisplay})</div>
                <div><span class="label">Born:</span> ${birthYearDisplay}</div>
                <div><span class="label">Age:</span> ${char.age} years old</div>
                <div><span class="label">Culture:</span> ${cultureDisplay}</div>
                <div><span class="label">Gender:</span> ${char.gender}</div>
                <div><span class="label">Religion:</span> ${char.religion || 'Unknown'}</div>
                <div><span class="label">Class:</span> ${char.wealthLevel || 'Common'}</div>
              </div>
            </div>
          </div>

          <div class="two-col">
            <div class="section">
              <div class="section-title">Attributes</div>
              <div class="stats-grid">
                <div class="stat"><div class="stat-label">STR</div><div class="stat-value">${char.stats?.strength || '-'}</div></div>
                <div class="stat"><div class="stat-label">DEX</div><div class="stat-value">${char.stats?.dexterity || '-'}</div></div>
                <div class="stat"><div class="stat-label">CON</div><div class="stat-value">${char.stats?.constitution || '-'}</div></div>
                <div class="stat"><div class="stat-label">INT</div><div class="stat-value">${char.stats?.intelligence || '-'}</div></div>
                <div class="stat"><div class="stat-label">WIS</div><div class="stat-value">${char.stats?.wisdom || '-'}</div></div>
                <div class="stat"><div class="stat-label">CHA</div><div class="stat-value">${char.stats?.charisma || '-'}</div></div>
                <div class="stat"><div class="stat-label">PER</div><div class="stat-value">${char.stats?.perception || '-'}</div></div>
                <div class="stat"><div class="stat-label">LCK</div><div class="stat-value">${char.stats?.luck || '-'}</div></div>
                <div class="stat"><div class="stat-label">CRF</div><div class="stat-value">${char.stats?.craftiness || '-'}</div></div>
                <div class="stat"><div class="stat-label">HP</div><div class="stat-value">${char.health || '-'}/${char.maxHealth || '-'}</div></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Personality (Big 5)</div>
              ${personalityHtml}
            </div>
          </div>

          <div class="two-col">
            <div class="section">
              <div class="section-title">Social Context</div>
              ${socialHtml}
            </div>
            <div class="section">
              <div class="section-title">Special Traits</div>
              <div class="attributes-list">${attributesHtml}</div>
              <div style="margin-top: 0.3rem; font-size: 0.8rem;"><span class="label">Health:</span> ${healthHtml}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Biography</div>
            <div class="biography">${char.backstory || 'No biography available.'}</div>
          </div>

          <div class="three-col">
            <div class="section">
              <div class="section-title">Family</div>
              <div class="family-grid">${familyHtml}</div>
            </div>
            <div class="section">
              <div class="section-title">Appearance</div>
              ${appearanceHtml}
              <div style="margin-top: 0.3rem;">
                <div class="section-title" style="margin-top: 0.4rem;">Language</div>
                ${languageHtml}
              </div>
            </div>
            <div class="section">
              <div class="section-title">Equipment</div>
              ${equipmentHtml}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Inventory (${inventoryItems.length} items, ${char.currency || 0} currency)</div>
            <div class="inventory-grid">${inventoryHtml}</div>
          </div>
        </div>

        <!-- PAGE 2: Life History -->
        <div class="page">
          <div style="text-align: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #333;">
            <h1 style="font-size: 1.3rem; font-variant: small-caps; margin-bottom: 0.15rem;">${char.name}</h1>
            <div style="font-size: 0.9rem; color: #555; font-style: italic;">Life Chronicle • ${birthYearDisplay} - ${yearDisplay}</div>
          </div>

          <div class="section">
            <div class="section-title">Life Events (${lifeEvents.length} recorded)</div>
            <div class="life-events">${lifeEventsHtml}</div>
          </div>

          <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd;">
            <div class="about-header">
              <h1>Historical Persona Generator</h1>
              <div class="url">https://resobscura.substack.com</div>
            </div>

            <div class="about-content">
              <h3>About This Project</h3>
              <p>
                The Historical Persona Generator is a free educational tool created by Benjamin Breen,
                Associate Professor of History at UC Santa Cruz. It generates randomized historical
                personas from various eras and cultures, complete with procedurally generated portraits,
                life histories, and contextual details.
              </p>

              <h3>Educational Purpose</h3>
              <p>
                This tool helps students, writers, game designers, and history enthusiasts
                explore the diversity of human experience across time and place. Each persona
                represents a plausible individual who might have lived in their historical context.
              </p>

              <h3>How It Works</h3>
              <p>
                The generator draws from extensive databases of historical names, professions, cultural
                practices, and social structures spanning from prehistory to the modern era. Portraits
                are procedurally generated using algorithms that account for regional appearance
                variations, historical clothing styles, and cultural accessories.
              </p>

              <h3>Support the Project</h3>
              <p>
                This project is offered free of charge. If you find it valuable, please consider
                supporting the creator by subscribing to Res Obscura at resobscura.substack.com.
              </p>
            </div>

            <div class="footer">
              © ${new Date().getFullYear()} Benjamin Breen. Generated: ${new Date().toLocaleDateString()}<br>
              <a href="https://resobscura.substack.com">resobscura.substack.com</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Trigger print dialog after content loads
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDonate = () => {
    // Open donate modal
    setShowDonate(true);
  };

  const generateDeathInfo = () => {
    if (!persona) return;

    const currentAge = persona.character.age;
    const currentYear = persona.year;
    const wealthLevel = persona.character.wealthLevel?.toLowerCase() || 'common';
    const era = persona.era;

    // Life expectancy varies by era and wealth
    const baseLifeExpectancy: Record<string, number> = {
      'PREHISTORY': 35,
      'ANTIQUITY': 40,
      'MEDIEVAL': 45,
      'RENAISSANCE_EARLY_MODERN': 50,
      'INDUSTRIAL_ERA': 55,
      'MODERN_ERA': 72,
    };

    const wealthModifier: Record<string, number> = {
      'destitute': -10,
      'poor': -5,
      'common': 0,
      'comfortable': 5,
      'wealthy': 10,
      'rich': 12,
      'noble': 15,
    };

    const baseExp = baseLifeExpectancy[era] || 50;
    const wealthMod = wealthModifier[wealthLevel] || 0;

    // Add randomness (±15 years)
    const variance = Math.floor(Math.random() * 30) - 15;
    let deathAge = Math.max(currentAge + 1, baseExp + wealthMod + variance);

    // Cap death age reasonably
    deathAge = Math.min(deathAge, era === 'MODERN_ERA' ? 100 : 85);

    const deathYear = currentYear + (deathAge - currentAge);

    // Causes of death by era
    const causesByEra: Record<string, string[]> = {
      'PREHISTORY': [
        'injuries sustained during a hunt',
        'a fever that swept through the tribe',
        'wounds from a territorial conflict',
        'complications from a broken bone',
        'starvation during a harsh winter',
        'an infection from an animal bite',
      ],
      'ANTIQUITY': [
        'a plague that swept through the city',
        'dysentery',
        'wounds sustained in battle',
        'malaria',
        'typhoid fever',
        'complications from childbirth',
        'a wasting illness',
        'food poisoning',
      ],
      'MEDIEVAL': [
        'the plague',
        'consumption (tuberculosis)',
        'a fever',
        'dysentery',
        'complications from influenza',
        'wounds that festered',
        'smallpox',
        'ergotism (St. Anthony\'s Fire)',
        'sweating sickness',
        'childbirth complications',
      ],
      'RENAISSANCE_EARLY_MODERN': [
        'consumption (tuberculosis)',
        'typhus',
        'smallpox',
        'dysentery',
        'plague',
        'syphilis',
        'complications from surgery',
        'apoplexy (stroke)',
        'dropsy (edema)',
        'a fever',
      ],
      'INDUSTRIAL_ERA': [
        'tuberculosis',
        'cholera',
        'typhoid fever',
        'pneumonia',
        'scarlet fever',
        'diphtheria',
        'a factory accident',
        'heart failure',
        'cancer',
        'complications from influenza',
      ],
      'MODERN_ERA': [
        'heart disease',
        'cancer',
        'stroke',
        'complications from pneumonia',
        'kidney failure',
        'complications from diabetes',
        'Alzheimer\'s disease',
        'respiratory failure',
        'a traffic accident',
        'natural causes',
      ],
    };

    // Build a weighted list of potential causes based on character circumstances
    let potentialCauses: { cause: string; weight: number }[] = [];
    const baseCauses = causesByEra[era] || causesByEra['MEDIEVAL'];

    // Filter out gender-inappropriate causes
    const filteredBaseCauses = baseCauses.filter(cause => {
      // Only females of childbearing age can die in childbirth
      if (cause.includes('childbirth')) {
        return persona.character.gender === 'Female' && deathAge >= 15 && deathAge <= 50;
      }
      return true;
    });

    // Add base causes with default weight
    filteredBaseCauses.forEach(cause => {
      potentialCauses.push({ cause, weight: 1 });
    });

    // Check for current diseases - high priority cause
    const currentDiseases = persona.character.diseaseHealth?.currentDiseases;
    if (currentDiseases && currentDiseases.length > 0) {
      currentDiseases.forEach((d: any) => {
        const diseaseName = d.disease?.name || d.name;
        if (diseaseName) {
          // Add disease as a very likely cause of death
          potentialCauses.push({ cause: `complications from ${diseaseName.toLowerCase()}`, weight: 5 });
        }
      });
    }

    // Check profession for occupational hazards
    const profession = persona.character.profession?.toLowerCase() || '';
    if (profession.includes('soldier') || profession.includes('warrior') || profession.includes('knight') || profession.includes('mercenary') || profession.includes('gladiator')) {
      potentialCauses.push({ cause: 'wounds sustained in battle', weight: 3 });
      potentialCauses.push({ cause: 'injuries from combat', weight: 2 });
    }
    if (profession.includes('sailor') || profession.includes('fisherman') || profession.includes('navigator')) {
      potentialCauses.push({ cause: 'drowning at sea', weight: 3 });
      potentialCauses.push({ cause: 'a storm at sea', weight: 2 });
    }
    if (profession.includes('miner') || profession.includes('quarry')) {
      potentialCauses.push({ cause: 'a mining accident', weight: 3 });
      potentialCauses.push({ cause: 'lung disease from the mines', weight: 2 });
    }
    if (profession.includes('smith') || profession.includes('forge') || profession.includes('iron')) {
      potentialCauses.push({ cause: 'an accident at the forge', weight: 2 });
    }
    if (profession.includes('executioner') || profession.includes('hangman')) {
      potentialCauses.push({ cause: 'murdered by vengeful kin of a victim', weight: 2 });
    }
    if (profession.includes('physician') || profession.includes('doctor') || profession.includes('healer') || profession.includes('nurse')) {
      potentialCauses.push({ cause: 'a disease contracted from a patient', weight: 3 });
    }
    if (profession.includes('prostitute') || profession.includes('courtesan')) {
      potentialCauses.push({ cause: 'syphilis', weight: 2 });
      potentialCauses.push({ cause: 'violence from a client', weight: 2 });
    }
    if (profession.includes('alchemist') || profession.includes('apothecary')) {
      potentialCauses.push({ cause: 'accidental poisoning', weight: 2 });
      potentialCauses.push({ cause: 'mercury poisoning', weight: 2 });
    }

    // Check attributes for relevant conditions
    const attributes = persona.character.attributes || [];
    attributes.forEach((attr: any) => {
      const attrName = (attr.name || attr).toLowerCase();
      if (attrName.includes('sickly') || attrName.includes('frail') || attrName.includes('weak')) {
        potentialCauses.push({ cause: 'a wasting illness', weight: 3 });
        potentialCauses.push({ cause: 'general weakness and decline', weight: 2 });
      }
      if (attrName.includes('drunk') || attrName.includes('alcoholic')) {
        potentialCauses.push({ cause: 'liver failure', weight: 3 });
        potentialCauses.push({ cause: 'alcohol poisoning', weight: 2 });
      }
      if (attrName.includes('reckless') || attrName.includes('brave') || attrName.includes('foolhardy')) {
        potentialCauses.push({ cause: 'a foolish accident', weight: 2 });
      }
      if (attrName.includes('gluttonous') || attrName.includes('obese')) {
        potentialCauses.push({ cause: 'apoplexy', weight: 2 });
        potentialCauses.push({ cause: 'heart failure', weight: 2 });
      }
    });

    // Age-based adjustments
    if (deathAge >= 70) {
      potentialCauses.push({ cause: 'natural causes', weight: 4 });
      potentialCauses.push({ cause: 'old age', weight: 3 });
      potentialCauses.push({ cause: 'peacefully in sleep', weight: 2 });
    }
    if (deathAge < 30 && persona.character.gender === 'Female') {
      // Young women more likely to die in childbirth in pre-modern eras
      if (['ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN'].includes(era)) {
        potentialCauses.push({ cause: 'complications from childbirth', weight: 3 });
      }
    }

    // Constitution stat affects death causes
    const constitution = persona.character.stats?.constitution || 10;
    if (constitution < 8) {
      potentialCauses.push({ cause: 'a fever', weight: 2 });
      potentialCauses.push({ cause: 'a persistent illness', weight: 2 });
    }

    // Select cause using weighted random
    const totalWeight = potentialCauses.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;
    let cause = potentialCauses[0].cause;
    for (const c of potentialCauses) {
      random -= c.weight;
      if (random <= 0) {
        cause = c.cause;
        break;
      }
    }

    // Generate month and day
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[Math.floor(Math.random() * 12)];
    const day = Math.floor(Math.random() * 28) + 1;

    // Generate description
    const pronoun = persona.character.gender === 'Female' ? 'she' : persona.character.gender === 'Male' ? 'he' : 'they';
    const possessive = persona.character.gender === 'Female' ? 'her' : persona.character.gender === 'Male' ? 'his' : 'their';
    const verb = persona.character.gender === 'Non-binary' ? 'pass' : 'passes';

    // Context-appropriate death circumstances based on cause
    let location: string;
    if (cause.includes('battle') || cause.includes('combat') || cause.includes('war')) {
      const battleLocations = ['on the battlefield', 'during a siege', 'in a skirmish', 'defending the walls'];
      location = battleLocations[Math.floor(Math.random() * battleLocations.length)];
    } else if (cause.includes('sea') || cause.includes('drowning')) {
      const seaLocations = ['at sea', 'during a voyage', 'in a shipwreck', 'far from home waters'];
      location = seaLocations[Math.floor(Math.random() * seaLocations.length)];
    } else if (cause.includes('mining') || cause.includes('mines')) {
      location = 'in the mines';
    } else if (cause.includes('accident') && profession.includes('forge')) {
      location = 'at the forge';
    } else if (cause.includes('natural causes') || cause.includes('old age') || cause.includes('peacefully')) {
      const peacefulLocations = ['peacefully in sleep', 'surrounded by family', `in ${possessive} home`];
      location = peacefulLocations[Math.floor(Math.random() * peacefulLocations.length)];
    } else if (cause.includes('childbirth')) {
      location = 'during labor';
    } else if (cause.includes('murder') || cause.includes('violence')) {
      const violentLocations = ['in a dark alley', 'on the street', `near ${possessive} home`, 'in an ambush'];
      location = violentLocations[Math.floor(Math.random() * violentLocations.length)];
    } else {
      const generalLocations = [
        `in ${possessive} home`,
        'surrounded by family',
        `in the care of ${possessive} loved ones`,
        'after a brief illness',
        'after a prolonged illness',
      ];
      location = generalLocations[Math.floor(Math.random() * generalLocations.length)];
    }

    // 50 realistic last words
    const lastWordsOptions = [
      "More water...",
      "Is it morning yet?",
      "I see them waiting for me...",
      "Tell them I tried my best.",
      "It's so beautiful...",
      "Don't cry for me.",
      "I'm not afraid.",
      "Stay with me...",
      "I love you all.",
      "Forgive me...",
      "I have no regrets.",
      "It was a good life.",
      "Open the window, please.",
      "I'm tired now.",
      "Is everyone here?",
      "Take care of the children.",
      "The light... I see it.",
      "Mother?",
      "I'm going home.",
      "Don't forget me.",
      "Thank you for everything.",
      "It doesn't hurt anymore.",
      "Hold my hand.",
      "I did what I could.",
      "Peace at last...",
      "Tell them the truth.",
      "Where is...?",
      "I'm ready now.",
      "Such strange dreams...",
      "The garden... so beautiful.",
      "I hear music.",
      "Don't leave me.",
      "I always loved you.",
      "Is it done?",
      "My work... is it finished?",
      "More light!",
      "What time is it?",
      "I'm so cold...",
      "Let me sleep.",
      "God is good.",
      "Remember what I taught you.",
      "The pain is gone.",
      "I saw my father.",
      "It's getting dark.",
      "Stay close...",
      "I tried to be good.",
      "Tell them I'm sorry.",
      "The birds are singing.",
      "Almost there...",
      "Bring me my book.",
    ];
    const lastWords = lastWordsOptions[Math.floor(Math.random() * lastWordsOptions.length)];

    const yearDisplay = deathYear < 0 ? `${Math.abs(deathYear)} BCE` : `${deathYear} CE`;

    const description = `${persona.character.name} ${verb} away on ${month} ${day}, ${yearDisplay}, at the age of ${deathAge}, ${location}. The cause of death: ${cause}.`;

    setDeathInfo({
      year: deathYear,
      age: deathAge,
      cause,
      description,
      lastWords,
    });
    setDeathRevealState('revealed');
  };

  const formatEraLabel = (era: string): string => {
    const eraMap: Record<string, string> = {
      'PREHISTORY': 'Prehistory',
      'ANTIQUITY': 'Antiquity',
      'MEDIEVAL': 'Medieval period',
      'RENAISSANCE EARLY MODERN': 'Early modern period',
      'RENAISSANCE_EARLY_MODERN': 'Early modern period',
      'INDUSTRIAL ERA': 'Industrial era',
      'INDUSTRIAL_ERA': 'Industrial era',
      'MODERN ERA': 'Modern era',
      'MODERN_ERA': 'Modern era',
    };
    return eraMap[era.toUpperCase()] || era.replace(/_/g, ' ').toLowerCase();
  };

  const formatCulturalZone = (zone: string): string => {
    const zoneMap: Record<string, string> = {
      'EUROPEAN': 'Europe',
      'EAST_ASIAN': 'East Asia',
      'EAST ASIAN': 'East Asia',
      'SOUTH_ASIAN': 'South Asia',
      'SOUTH ASIAN': 'South Asia',
      'MENA': 'the Middle East and North Africa',
      'SUB_SAHARAN_AFRICAN': 'Sub-Saharan Africa',
      'SUB SAHARAN AFRICAN': 'Sub-Saharan Africa',
      'OCEANIA': 'Oceania',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America',
      'NORTH AMERICAN PRE COLUMBIAN': 'North America',
      'NORTH_AMERICAN_COLONIAL': 'North America',
      'NORTH AMERICAN COLONIAL': 'North America',
      'SOUTH_AMERICAN': 'South America',
      'SOUTH AMERICAN': 'South America',
    };
    return zoneMap[zone.toUpperCase()] || zone.replace(/_/g, ' ').toLowerCase();
  };

  const formatYear = (year: number): string => {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
  };

  const formatHairstyle = (hairstyle: string): string => {
    // Remove culture-specific prefixes and make more universal
    return hairstyle
      .replace(/greek_|roman_|african_|asian_|celtic_|norse_|viking_|chinese_|japanese_|indian_|arabic_|maya_|aztec_|inca_/gi, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatItemName = (name: string): string => {
    const formatted = name.replace(/_/g, ' ').toLowerCase();

    // Special case: if it contains "barefoot", just return "Barefoot"
    if (formatted.includes('barefoot')) {
      return 'Barefoot';
    }

    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSeasonInfo = (month: number, day: number): { season: string; color: string; description: string } => {
    // Northern hemisphere seasons - darker colors for better contrast
    let season = '';
    let color = '';
    let description = '';

    if (month === 12 || month === 1 || month === 2) {
      season = 'winter';
      color = '#4a6d8a'; // Darker blue
      if (month === 12 && day < 15) description = 'early winter';
      else if (month === 2 && day > 15) description = 'late winter';
      else description = 'the depths of winter';
    } else if (month === 3 || month === 4 || month === 5) {
      season = 'spring';
      color = '#4a6d5f'; // Darker green
      if (month === 3 && day < 15) description = 'the beginning of spring';
      else if (month === 5 && day > 15) description = 'late spring';
      else description = 'spring';
    } else if (month === 6 || month === 7 || month === 8) {
      season = 'summer';
      color = '#b8834a'; // Darker gold
      if (month === 6 && day < 15) description = 'early summer';
      else if (month === 8 && day > 15) description = 'late summer';
      else description = 'the height of summer';
    } else {
      season = 'autumn';
      color = '#a5703a'; // Darker brown/orange
      if (month === 9 && day < 15) description = 'early fall';
      else if (month === 11 && day > 15) description = 'late fall';
      else description = 'autumn';
    }

    return { season, color, description };
  };

  const getMonthName = (month: number): string => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  };

  const getEventIcon = (kind: EventKind) => {
    const iconMap: Record<EventKind, React.ReactElement> = {
      'birth': <IoCheckmarkCircle />,
      'apprenticeship': <IoSchool />,
      'education': <IoSchool />,
      'romance': <IoHeart />,
      'marriage': <IoRibbon />,
      'childbirth': <IoCheckmarkCircle />,
      'battle': <IoFlag />,
      'discovery': <IoRocket />,
      'journey': <IoCompass />,
      'tragedy': <IoSkull />,
      'plague': <IoMedkit />,
      'achievement': <IoTrophy />,
      'study': <IoSchool />,
      'guild': <IoHammer />,
      'rival': <IoWarning />,
      'injury': <IoMedkit />,
      'fire': <IoFlame />,
      'travel': <IoAirplane />,
      'religious': <IoStar />,
      'political': <IoFlag />,
      'trade': <IoCart />,
      'family': <IoPeople />,
      'legal': <IoRibbon />,
      'artistic': <IoTrophy />,
      'agricultural': <IoHammer />,
      'maritime': <IoBoat />,
      'death': <IoSkull />
    };
    return iconMap[kind] || <IoEllipseOutline />;
  };

  const getEventColor = (importance: EventImportance): string => {
    const colorMap: Record<EventImportance, string> = {
      [EventImportance.MILESTONE]: '#d4af37', // Gold
      [EventImportance.TRAGEDY]: '#c0392b',   // Red
      [EventImportance.INJURY]: '#e67e22',    // Orange
      [EventImportance.OPPORTUNITY]: '#27ae60', // Green
      [EventImportance.RELATIONSHIP]: '#8e44ad', // Purple
      [EventImportance.MUNDANE]: '#7f8c8d'   // Gray
    };
    return colorMap[importance] || '#7f8c8d';
  };

  const generateNarrativeBiography = (persona: HistoricalPersona): string => {
    const character = persona.character;
    const events = persona.enhancedLifeEvents || [];
    const pronoun = character.gender === 'Male' ? 'he' : character.gender === 'Female' ? 'she' : 'they';
    const pronounObj = character.gender === 'Male' ? 'him' : character.gender === 'Female' ? 'her' : 'them';
    const pronounPoss = character.gender === 'Male' ? 'his' : character.gender === 'Female' ? 'her' : 'their';
    const pronounPossCap = character.gender === 'Male' ? 'His' : character.gender === 'Female' ? 'Her' : 'Their';
    const pronounVerb = character.gender === 'Non-binary' ? 'have' : 'has';
    const pronounBe = character.gender === 'Non-binary' ? 'are' : 'is';

    // Get proper wealth description
    const wealthDescriptions: Record<string, string> = {
      'poor': 'impoverished',
      'modest': 'humble',
      'comfortable': 'respectable',
      'wealthy': 'prosperous',
      'noble': 'noble'
    };
    const wealthDesc = typeof character.wealthLevel === 'string' && wealthDescriptions[character.wealthLevel]
      ? wealthDescriptions[character.wealthLevel]
      : 'modest';

    // Opening - birth and background
    const birthYear = persona.year - character.age;

    // Styled character name for visual emphasis
    const styledName = `<span class="character-name">${character.name}</span>`;

    // Vary opening phrases
    const openingTemplates = [
      `Born in ${formatYear(birthYear)} in ${persona.location}, ${styledName} `,
      `It was in ${persona.location}, in the year ${formatYear(birthYear)}, that ${styledName} came into the world, and ${pronounPoss} `,
      `In ${formatYear(birthYear)}, ${styledName} entered existence in ${persona.location}; ${pronoun} `,
      `In ${formatYear(birthYear)}, ${styledName} began life in ${persona.location}. ${pronounPossCap} `,
      `In ${formatYear(birthYear)}, when little was yet expected of ${styledName}, the child first came into the world in ${persona.location}. ${pronounPossCap} `,
      `The year ${formatYear(birthYear)} saw the birth of ${styledName} in ${persona.location}. ${pronounPossCap} `,
      `It was in ${persona.location}, in ${formatYear(birthYear)}, that ${styledName} made a modest debut upon the stage of life; ${pronoun} `,
      `${styledName} first drew breath in ${formatYear(birthYear)}, in ${persona.location}, where ${pronoun} `,
      `In ${formatYear(birthYear)}, ${styledName} entered the world in ${persona.location}. ${pronounPossCap} `
    ];

    const selectedOpening = Math.floor(Math.random() * openingTemplates.length);
    let narrative = openingTemplates[selectedOpening];

    // Family context
    const siblings = character.family?.filter(f =>
      f.relation === 'sibling' || f.relation === 'brother' || f.relation === 'sister'
    ) || [];
    const parents = character.family?.filter(f =>
      f.relation === 'father' || f.relation === 'mother'
    ) || [];

    // Adjust verb based on which opening template was used
    // Templates 1 and 3 end with possessive pronoun (His/Her), so need different verb structure
    const needsPossessiveForm = selectedOpening === 1 || selectedOpening === 3;

    if (siblings.length > 0) {
      if (needsPossessiveForm) {
        narrative += `upbringing was as one of ${siblings.length + 1} children in a ${wealthDesc} household`;
      } else {
        narrative += `grew up as one of ${siblings.length + 1} children in a ${wealthDesc} household`;
      }
    } else if (parents.length > 0) {
      if (needsPossessiveForm) {
        narrative += `parents raised ${pronounObj} in a ${wealthDesc} family`;
      } else {
        narrative += `was raised by ${pronounPoss} parents in a ${wealthDesc} family`;
      }
    } else {
      if (needsPossessiveForm) {
        narrative += `upbringing was in a ${wealthDesc} household`;
      } else {
        narrative += `came of age in a ${wealthDesc} household`;
      }
    }

    // Religion and cultural context with varied religiosity
    if (character.religion && character.religion !== 'Local Beliefs' && character.religion !== 'Agnostic') {
      // Use character's religiosity score if available, otherwise random
      const religiosity = character.socialContext?.religiosity ?? Math.random();

      let religionPhrase = '';
      if (religiosity > 0.8) {
        // Very religious upbringing
        const veryReligiousTemplates = [
          `was deeply immersed in the traditions of ${character.religion}`,
          `was raised with deep devotion to ${character.religion}`,
          `grew up surrounded by the fervent practice of ${character.religion}`,
          `was immersed in the teachings of ${character.religion} from an early age`
        ];
        religionPhrase = veryReligiousTemplates[Math.floor(Math.random() * veryReligiousTemplates.length)];
      } else if (religiosity > 0.5) {
        // Moderately religious
        const moderateTemplates = [
          `was steeped in the practices of ${character.religion}`,
          `grew up observing the practices of ${character.religion}`,
          `was brought up within the ${character.religion} tradition`,
          `learned the customs of ${character.religion} from ${pronounPoss} family`
        ];
        religionPhrase = moderateTemplates[Math.floor(Math.random() * moderateTemplates.length)];
      } else if (religiosity > 0.25) {
        // Nominally religious
        const nominalTemplates = [
          `was exposed to the practices of ${character.religion}`,
          `had a modest upbringing in ${character.religion}`,
          `grew up with some knowledge of ${character.religion}`,
          `was familiar with ${character.religion}, though not particularly devout`
        ];
        religionPhrase = nominalTemplates[Math.floor(Math.random() * nominalTemplates.length)];
      } else {
        // Barely religious/cultural only
        const culturalTemplates = [
          `was nominally ${character.religion}, though faith played little role in ${pronounPoss} upbringing`,
          `came from a ${character.religion} household, though ${pronoun} practiced little`,
          `was culturally ${character.religion}, though not particularly observant`,
          `knew of ${character.religion} mainly as a cultural background, not a daily practice`
        ];
        religionPhrase = culturalTemplates[Math.floor(Math.random() * culturalTemplates.length)];
      }

      narrative += `, where ${pronoun} ${religionPhrase}`;
    }
    narrative += '. ';

    // Physical description with varied phrasing
    if (character.appearance) {
      const app = character.appearance;
      const heightDesc = app.height && app.height > 180 ? 'tall' :
                        app.height && app.height < 165 ? 'short' : '';
      const buildDesc = app.build ? app.build : '';

      if (heightDesc || buildDesc) {
        const physicalTemplates = [
          `${pronounPossCap} ${buildDesc}${heightDesc && buildDesc ? ', ' : ''}${heightDesc} frame ${pronounVerb} become well-suited to the rigors of ${pronounPoss} profession. `,
          `${pronounPossCap} ${buildDesc} build serves ${pronounObj} well in ${pronounPoss} line of work. `,
          `Standing ${heightDesc ? heightDesc : 'at average height'}, ${pronoun} cut${pronounBe === 'are' ? '' : 's'} ${buildDesc ? `a ${buildDesc} figure` : 'a distinctive figure'} among ${pronounPoss} peers. `,
          `${heightDesc ? pronounPossCap + ' ' + heightDesc + ' stature' : pronounPossCap + ' appearance'} ${buildDesc ? 'and ' + buildDesc + ' build' : ''} ${pronounVerb} shaped ${pronounPoss} life in subtle ways. `
        ];

        const selectedPhysical = Math.floor(Math.random() * physicalTemplates.length);
        narrative += physicalTemplates[selectedPhysical];
      }
    }

    // Add transitional phrase before foundational attributes (if needed)
    const foundationalAttributes = character.attributes?.filter((attr: any) => attr.foundational === true) || [];

    if (foundationalAttributes.length > 0) {
      const attributeNarratives: Record<string, string> = {
        'blind': `${pronounPossCap} world ${pronounBe} one of touch, sound, and memory—${pronoun} ${pronounBe === 'are' ? 'have' : 'has'} been blind since ${character.age > 10 ? 'childhood' : 'birth'}, navigating life through senses others take for granted. `,
        'deaf': `${character.name} was born without hearing and ${pronounVerb} learned to read the world through gesture and expression, ${pronounPoss} silence a constant companion. `,
        'mute': `Unable to speak, ${pronoun} communicate${pronounBe === 'are' ? '' : 's'} through gestures and, when possible, the written word. `,
        'lame': `${pronounPossCap} gait ${pronounBe} marked by a pronounced limp, the legacy of an injury sustained in ${character.age > 20 ? 'youth' : 'childhood'}. `,
        'one_armed': `${pronounPossCap} left arm was lost to ${character.age > 25 ? 'injury' : 'disease'} years ago, yet ${pronoun} ${pronounVerb} adapted with remarkable resilience. `,
        'disfigured': `${pronounPossCap} face bears the marks of ${character.age > 15 ? 'a terrible accident' : 'childhood illness'}, scars that draw stares but do not define ${pronounObj}. `,
        'educated': `Unusually for someone of ${pronounPoss} station, ${pronoun} ${pronounVerb} received an education, able to read and write with facility. `,

        'cowardly': `${pronounPossCap} courage ${pronounVerb} often failed ${pronounObj} in moments of danger, a fact ${pronoun} ${pronounBe === 'are' ? 'are' : 'is'} not proud of. `,
        'devout': `${pronounPossCap} faith ${pronounBe} the bedrock of ${pronounPoss} existence, guiding every decision and action. `,
        'cursed': `Whispers follow ${pronounObj} wherever ${pronoun} ${character.gender === 'Non-binary' ? 'go' : 'goes'}—some say ${pronoun} ${pronounBe} cursed, marked by ill fortune. `,
        'twin': `${pronounPossCap} twin sibling ${pronounBe} never far from ${pronounPoss} thoughts, their lives intertwined by birth and fate. `,
        'orphan': `Having lost both parents in ${character.age > 15 ? 'youth' : 'childhood'}, ${pronoun} ${pronounVerb} learned self-reliance early. `,
        'bastard_born': `Born outside of marriage, ${pronoun} ${pronounVerb} always felt the sting of social stigma, ${pronounPoss} parentage a constant shadow. `,
        'exile': `Cast out from ${pronounPoss} homeland, ${pronoun} now live${pronounBe === 'are' ? '' : 's'} in exile, forever longing for what was lost. `,
        'former_slave': `${pronounPossCap} freedom ${pronounBe} hard-won—${pronoun} spent years in bondage before escaping or earning ${pronounPoss} liberation. `,
        'war_veteran': `${pronounPossCap} body and mind still carry the scars of war, memories of battle that refuse to fade. `
      };

      // Add narrative for each foundational attribute
      for (const attr of foundationalAttributes) {
        const attrNarrative = attributeNarratives[attr.id];
        if (attrNarrative) {
          narrative += attrNarrative;
        }
      }
    }

    // Find THE most important life event
    const keyEvent = events
      .filter(e => e.kind !== 'birth' && e.kind !== 'apprenticeship')
      .filter(e =>
        e.importance === EventImportance.MILESTONE ||
        e.importance === EventImportance.TRAGEDY ||
        e.importance === EventImportance.OPPORTUNITY
      )
      .sort((a, b) => {
        const importanceOrder = {
          [EventImportance.TRAGEDY]: 0,
          [EventImportance.MILESTONE]: 1,
          [EventImportance.OPPORTUNITY]: 2,
          [EventImportance.INJURY]: 3,
          [EventImportance.RELATIONSHIP]: 4,
          [EventImportance.MUNDANE]: 5
        };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      })[0];

    // Integrate the defining moment with better context
    if (keyEvent) {
      const yearsAgo = persona.year - keyEvent.year;
      const ageAtEvent = character.age - yearsAgo;

      // Skip events with invalid ages (can happen with BCE dates when event year precedes birth)
      if (ageAtEvent < 0 || ageAtEvent > character.age) {
        console.warn(`Skipping event with invalid age ${ageAtEvent} (event year: ${keyEvent.year}, birth year: ${persona.year - character.age})`);
      } else {
        // Only add event narrative if the age is valid
        if (keyEvent.importance === EventImportance.TRAGEDY) {
          const tragedyIntros = [
            `Life's harsh realities struck early when, at just ${ageAtEvent}, `,
            `Tragedy marked ${pronounObj} early. At age ${ageAtEvent}, `,
            `Hardship came calling when, at ${ageAtEvent}, `,
            `Fate dealt a cruel blow at age ${ageAtEvent}: `
          ];
          const tragedyOutros = [
            `—a loss that would cast a long shadow over the years to come`,
            `. The wound would never fully heal`,
            `. This was when ${pronoun} realized life is not fair`,
            `, forever altering ${pronounPoss} path through life`,
            `. It was a sorrow ${pronoun} would carry always`
          ];

          if (yearsAgo > character.age * 0.7) {
            const selectedIntro = Math.floor(Math.random() * tragedyIntros.length);
            narrative += tragedyIntros[selectedIntro];
          } else {
            narrative += `${pronounPossCap} path was profoundly altered when `;
          }
          narrative += keyEvent.text.charAt(0).toLowerCase() + keyEvent.text.slice(1);
          const selectedOutro = Math.floor(Math.random() * tragedyOutros.length);
          narrative += tragedyOutros[selectedOutro];
        } else if (keyEvent.importance === EventImportance.MILESTONE) {
          const milestoneIntros = [
            `A turning point arrived at age ${ageAtEvent}, when ${pronoun} `,
            `At ${ageAtEvent}, a new chapter began: `,
            `Everything changed at age ${ageAtEvent}, when ${pronoun} had `,
            `By ${ageAtEvent}, ${pronoun} ${pronounVerb === 'have' ? 'had' : 'had'} `
          ];
          const milestoneOutros = [
            `, opening new paths that ${pronoun} ${pronounVerb} walked ever since`,
            `. ${pronounPossCap} life would never be the same`,
            `. ${pronounPossCap} experience of the world and of life was strongly shaped by this`,
            `. For ${pronounPossCap}, this was a significant turning point`,
            `—a change that redefined everything that followed`,
            `, and ${pronoun} seized the moment with both hands`
          ];

          const selectedIntro = Math.floor(Math.random() * milestoneIntros.length);
          narrative += milestoneIntros[selectedIntro];
          narrative += keyEvent.text.charAt(0).toLowerCase() + keyEvent.text.slice(1);
          const selectedOutro = Math.floor(Math.random() * milestoneOutros.length);
          narrative += milestoneOutros[selectedOutro];
        } else {
          const opportunityIntros = [
            `Fortune smiled upon ${pronounObj} when `,
            `Good luck arrived unexpectedly: `,
            `Opportunity knocked at age ${ageAtEvent}, when `,
            `Providence intervened when `
          ];
          const opportunityOutros = [
            `, an opportunity ${pronoun} seized with both hands`,
            `—a stroke of fortune ${pronoun} would not squander`,
            `, and ${pronoun} ${pronounVerb === 'have' ? 'made' : 'made'} the most of it`,
            `. ${pronounPossCap} future brightened considerably`
          ];

          const selectedIntro = Math.floor(Math.random() * opportunityIntros.length);
          narrative += opportunityIntros[selectedIntro];
          narrative += keyEvent.text.charAt(0).toLowerCase() + keyEvent.text.slice(1);
          const selectedOutro = Math.floor(Math.random() * opportunityOutros.length);
          narrative += opportunityOutros[selectedOutro];
        }
        narrative += '. ';
      }
    }

    // Current life - profession and daily existence with varied phrasing
    const professionArticle = character.profession?.match(/^[aeiou]/i) ? 'an' : 'a';

    // Profession phrasings WITH temporal markers (for use without transition)
    const professionPhrasingsWithTime = [
      `Now ${character.age} years old, ${pronoun} make${pronounBe === 'are' ? '' : 's'} ${pronounPoss} living as ${professionArticle} ${character.profession || 'laborer'}`,
      `At ${character.age}, ${pronoun} work${pronounBe === 'are' ? '' : 's'} as ${professionArticle} ${character.profession || 'laborer'}`,
      `Now ${character.age}, ${pronoun} earn${pronounBe === 'are' ? '' : 's'} bread as ${professionArticle} ${character.profession || 'laborer'}`
    ];

    // Profession phrasings WITHOUT temporal markers (for use with transitions)
    const professionPhrasingsNoTime = [
      `${pronoun} make${pronounBe === 'are' ? '' : 's'} ${pronounPoss} living as ${professionArticle} ${character.profession || 'laborer'} at the age of ${character.age}`,
      `${pronoun} work${pronounBe === 'are' ? '' : 's'} as ${professionArticle} ${character.profession || 'laborer'}`,
      `${pronoun} earn${pronounBe === 'are' ? '' : 's'} bread as ${professionArticle} ${character.profession || 'laborer'}`,
      `${pronoun} earn${pronounBe === 'are' ? '' : 's'} a living as ${professionArticle} ${character.profession || 'laborer'}`,
      `${pronoun} earn${pronounBe === 'are' ? '' : 's'} toils ${professionArticle} ${character.profession || 'laborer'}`,
           `${pronoun} earn${pronounBe === 'are' ? '' : 's'} labors ${professionArticle} ${character.profession || 'laborer'}`,
                `${pronoun} earn${pronounBe === 'are' ? '' : 's'} works ${professionArticle} ${character.profession || 'laborer'}`,
      `${pronoun === 'they' ? 'they practice' : pronoun === 'she' ? 'she practices' : 'he practices'} the trade of ${character.profession || 'laborer'}`
    ];

    // Add transitional phrase to profession section
    const professionTransitions = [
      'Life went on. Today, ',
      'Life continued, as it always must. Today, ',
      'The years rolled on. Now, ',
       'Sand through the hourglass. At present, ',
       'Such is life, is it not? At present, ',
       'Today, ',
      'Now, ',
       'Currently, ',
      'Time passed. Now, '
    ];

    const useTransition = Math.random() < 0.4; // 40% chance of using a transition
    if (useTransition) {
      const selectedTransition = professionTransitions[Math.floor(Math.random() * professionTransitions.length)];
      narrative += selectedTransition;
      const selectedPhrasing = professionPhrasingsNoTime[Math.floor(Math.random() * professionPhrasingsNoTime.length)];
      narrative += selectedPhrasing;
    } else {
      const selectedPhrasing = professionPhrasingsWithTime[Math.floor(Math.random() * professionPhrasingsWithTime.length)];
      narrative += selectedPhrasing;
    }

    // Add work context based on stats
    if (character.stats) {
      if (character.stats.strength > 7 && character.profession?.toLowerCase().includes('smith')) {
        narrative += `, ${pronounPoss} powerful arms wielding hammer and tongs with practiced skill`;
      } else if (character.stats.intelligence > 7 && (character.profession?.toLowerCase().includes('scholar') || character.profession?.toLowerCase().includes('scribe'))) {
        narrative += `, ${pronounPoss} keen mind devoted to the pursuit of knowledge`;
      } else if (character.stats.charisma > 7 && character.profession?.toLowerCase().includes('merchant')) {
        narrative += `, ${pronounPoss} gift for persuasion serving ${pronounObj} well in the marketplace`;
      }
    }

    // Health status
    if (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0) {
      const diseaseName = character.diseaseHealth.currentDiseases[0].disease.name;
      narrative += `. Though ${pronoun} ${pronounBe} afflicted with ${diseaseName}, ${pronoun} ${character.gender === 'Non-binary' ? 'continue' : 'continues'} to work each day`;
    }

    narrative += '. ';

    // Helper function to get ideology description
    const getIdeologyDescription = (ideologyId: string): string => {
      const ideology = IDEOLOGIES.find((i: any) => i.id === ideologyId);
      if (!ideology?.description) return '';

      // Strip common verb prefixes to make description grammatically integrate
      let cleanDesc = ideology.description
        .replace(/^Emphasizes /i, '')
        .replace(/^Seeks to /i, '')
        .replace(/^Focuses on /i, '')
        .replace(/^Values /i, '')
        .replace(/^Prioritizes /i, '')
        .replace(/^Champions /i, '')
        .replace(/^Devoted to /i, '')
        .replace(/^Believes in /i, '')
        .replace(/^Renounces /i, '')
        .replace(/^Centered on /i, '');

      // Lowercase first letter to integrate into sentence
      return cleanDesc.charAt(0).toLowerCase() + cleanDesc.slice(1);
    };

    // Helper function to get belief description
    const getBeliefDescription = (beliefs: any[]): string | null => {
      if (!beliefs || beliefs.length === 0) return null;

      // Sort by conviction to get the strongest belief
      const sortedBeliefs = [...beliefs].sort((a, b) => b.conviction - a.conviction);
      const primaryBelief = sortedBeliefs[0];

      if (!primaryBelief || !primaryBelief.beliefId) return null;

      // Look up the belief text from PERSONAL_BELIEFS constant
      const beliefData = PERSONAL_BELIEFS.find((b: any) => b.id === primaryBelief.beliefId);

      if (beliefData && beliefData.text) {
        // Strip common prefixes and lowercase the first letter to integrate into sentence
        let cleanText = beliefData.text
          .replace(/^[Bb]elieves that /i, '')
          .replace(/^[Bb]elieves in /i, '')
          .replace(/^[Bb]elieves /i, '')
          .replace(/^[Dd]eeply /i, '');
        return cleanText.charAt(0).toLowerCase() + cleanText.slice(1);
      }

      return null;
    };

    // Social standing and beliefs - more sophisticated integration
    const beliefText = getBeliefDescription(character.beliefs);

    if (character.ideology && character.ideology !== 'Pragmatism') {
      const ideologyDesc = getIdeologyDescription(character.ideology);
      narrative += `${pronounPossCap} core ideology is ${ideologyDesc}. `;
    } else if (beliefText) {
      // If no ideology but has beliefs, mention them
      narrative += `${pronounPossCap} worldview ${pronounBe} shaped by the conviction that ${beliefText}. `;
    }

    // Personality - sophisticated and varied
    const personality = character.personality;
    if (personality) {
      const traits: string[] = [];

      // Check for ideologies that conflict with certain personality traits
      const isRevolutionary = character.ideology &&
        (character.ideology.toLowerCase().includes('revolutionary') ||
         character.ideology.toLowerCase().includes('radical') ||
         character.ideology.toLowerCase().includes('anarchist'));

      const isConservative = character.ideology &&
        (character.ideology.toLowerCase().includes('traditional') ||
         character.ideology.toLowerCase().includes('conservative'));

      // More nuanced personality combinations
      if (personality.openness > 0.7 && personality.extraversion > 0.6) {
        traits.push('an adventurous spirit who seeks out new experiences and companions');
      } else if (personality.openness > 0.7 && personality.conscientiousness > 0.6) {
        traits.push('a curious mind tempered by methodical discipline');
      } else if (personality.openness > 0.7) {
        traits.push('a thoughtful soul drawn to novel ideas and perspectives');
      } else if (personality.openness < 0.3 && personality.conscientiousness > 0.7 && !isRevolutionary) {
        // Skip "tradition and routine" if revolutionary
        traits.push('a steadfast character who finds strength in tradition and routine');
      } else if (personality.openness < 0.3) {
        traits.push('a practical nature that values the proven over the experimental');
      }

      if (personality.agreeableness > 0.7 && personality.extraversion > 0.6 && !isRevolutionary) {
        // Skip "warm and generous" if revolutionary (conflicts with radical change)
        traits.push('a warm and generous presence that draws people near');
      } else if (personality.agreeableness > 0.7 && !isRevolutionary) {
        // Skip "gentle disposition seeks harmony" if revolutionary (direct contradiction)
        traits.push('a gentle disposition that seeks harmony above conflict');
      } else if (personality.agreeableness > 0.7 && isRevolutionary) {
        // Alternative trait for high agreeableness revolutionaries
        traits.push('a compassionate heart that drives commitment to justice');
      } else if (personality.agreeableness < 0.3 && personality.neuroticism < 0.4) {
        traits.push('a bold, uncompromising manner that some find refreshing and others find abrasive');
      } else if (personality.agreeableness < 0.3) {
        traits.push('an independent streak that prizes personal freedom above social convention');
      }

      if (traits.length > 0) {
        const personalityIntros = [
          `Those who know ${pronounObj} speak of ${traits[0]}`,
          `Acquaintances describe ${pronounObj} as possessing ${traits[0]}`,
          `${pronounPossCap} reputation rests on ${traits[0]}`,
          `${pronoun === 'they' ? 'They are' : pronoun === 'she' ? 'She is' : 'He is'} known for ${traits[0]}`
        ];

        const selectedIntro = Math.floor(Math.random() * personalityIntros.length);
        narrative += personalityIntros[selectedIntro];

        if (traits.length > 1) {
          narrative += `, as well as ${traits[1]}`;
        }
        narrative += '.';
      }
    }

    // Add parent names at the end
    if (character.family && character.family.length > 0) {
      const father = character.family.find(m => m.relation === 'father');
      const mother = character.family.find(m => m.relation === 'mother');

      if (father && mother) {
        narrative += ` ${pronounPossCap} parents are <strong>${father.name}</strong> and <strong>${mother.name}</strong>.`;
      } else if (father) {
        narrative += ` ${pronounPossCap} father is <strong>${father.name}</strong>.`;
      } else if (mother) {
        narrative += ` ${pronounPossCap} mother is <strong>${mother.name}</strong>.`;
      }
    }

    // Clean up any double periods or extra spaces
    narrative = narrative.replace(/\.{2,}/g, '.').replace(/\s{2,}/g, ' ').trim();

    return narrative;
  };

  // Mapping for religion/region names to Wikipedia article titles
  const getWikipediaArticle = (displayName: string): string => {
    const mappings: Record<string, string> = {
      // Religion mappings
      'Aboriginal Dreamtime': 'Dreamtime',
      'Local Beliefs': 'Folk_religion',
      'Tengriism': 'Tengrism',
      'Tengrism': 'Tengrism',
      'Neo-Confucianism': 'Neo-Confucianism',
      'Shinto': 'Shinto',
      'Buddhism': 'Buddhism',
      'Hinduism': 'Hinduism',
      'Christianity': 'Christianity',
      'Islam': 'Islam',
      'Judaism': 'Judaism',
      'Zoroastrianism': 'Zoroastrianism',
      'Animism': 'Animism',
      'Bon': 'Bon',
      'Bon Religion': 'Bon',
      'Jainism': 'Jainism',
      'Sikhism': 'Sikhism',
      'Taoism': 'Taoism',
      'Confucianism': 'Confucianism',
      'Mahayana Buddhism': 'Mahayana',
      'Theravada Buddhism': 'Theravada',
      'Vajrayana Buddhism': 'Vajrayana',
      'Tibetan Buddhism': 'Tibetan_Buddhism',
      'Sunni Islam': 'Sunni_Islam',
      'Shia Islam': 'Shia_Islam',
      'Alevi Islam': 'Alevism',
      'Orthodox Christianity': 'Eastern_Orthodox_Church',
      'Eastern Orthodox Christianity': 'Eastern_Orthodox_Church',
      'Eastern Orthodoxy': 'Eastern_Orthodox_Church',
      'Russian Orthodoxy': 'Russian_Orthodox_Church',
      'Ethiopian Orthodox Christianity': 'Ethiopian_Orthodox_Tewahedo_Church',
      'Coptic Christianity': 'Coptic_Orthodox_Church',
      'Armenian Apostolic Christianity': 'Armenian_Apostolic_Church',
      'Catholic Christianity': 'Catholic_Church',
      'Roman Catholicism': 'Catholic_Church',
      'Protestant Christianity': 'Protestantism',
      'Protestantism': 'Protestantism',
      'Pentecostalism': 'Pentecostalism',
      'Puritanism': 'Puritanism',
      'Quakerism': 'Quakers',
      'Mormonism': 'The_Church_of_Jesus_Christ_of_Latter-day_Saints',
      'Syncretic Christianity': 'Religious_syncretism',
      'Syncretic Islam': 'Religious_syncretism',
      'Aztec Polytheism': 'Aztec_religion',
      'Maya Polytheism': 'Maya_religion',
      'Inca Sun Worship': 'Inca_religion',
      'West African Traditional Religion': 'Traditional_African_religions',
      'East African Traditional Religion': 'Traditional_African_religions',
      'Central African Traditional Religion': 'Traditional_African_religions',
      'Southern African Traditional Religion': 'Traditional_African_religions',
      'African Traditional Religion': 'Traditional_African_religions',
      'Norse Paganism': 'Norse_paganism',
      'Celtic Druidism': 'Druidry',
      'Roman Polytheism': 'Religion_in_ancient_Rome',
      'Greek Polytheism': 'Ancient_Greek_religion',
      'Egyptian Polytheism': 'Ancient_Egyptian_religion',
      'Atheism': 'Atheism',
      'Selknam Religion': 'Selk%CA%BCnam_mythology',
      'Carib Shamanism': 'Kalinago',

      // North American indigenous religions
      'Pacific Coast Shamanism': 'Indigenous_peoples_of_the_Pacific_Northwest_Coast',
      'Pueblo Religion': 'Puebloans',
      'Great Spirit Worship': 'Great_Spirit',
      'Buffalo Shamanism': 'Plains_Indians',
      'Vision Quest Traditions': 'Vision_quest',
      'Sun Dance Religion': 'Sun_Dance',
      'Mississippian Religion': 'Mississippian_culture',
      'Mound Builder Shamanism': 'Mound_Builders',
      'Cahokia Solar Worship': 'Cahokia',
      'Iroquois Longhouse Religion': 'Iroquois',
      'Algonquian Shamanism': 'Algonquian_peoples',
      'Forest Spirit Worship': 'Algonquian_peoples',
      'Creek Ceremonialism': 'Muscogee',
      'Cherokee Shamanism': 'Cherokee',
      'Green Corn Ceremony': 'Green_Corn_Ceremony',
      'Inuit Shamanism': 'Inuit_religion',
      'Arctic Animism': 'Inuit',
      'Kachina Worship': 'Kachina',
      'Totemism': 'Totem',
      'Potlatch Religion': 'Potlatch',
      'Coastal Algonquian Religion': 'Algonquian_peoples',
      'Plateau Shamanism': 'Plateau_Indians',
      'Guardian Spirit Religion': 'Indigenous_peoples_of_the_Pacific_Northwest_Coast',
      'Plains Animism': 'Plains_Indians',
      'Tidewater Spiritualism': 'Powhatan',
      'Native American Spirituality': 'Native_American_religion',

      // Mesoamerican religions
      'Teotihuacan Religion': 'Teotihuacan',
      'Mesoamerican Shamanism': 'Mesoamerica',
      'Mesoamerican Traditional Religion': 'Mesoamerican_religion',
      'Olmec Jaguar Worship': 'Olmec',
      'Mayan Traditional Religion': 'Maya_religion',

      // South American indigenous religions
      'Amazonian Shamanism': 'Amazon_basin',
      'Guarani Shamanism': 'Guarani_people',
      'Tupi Shamanism': 'Tupi_people',
      'Andean Shamanism': 'Andes',
      'Tehuelche Shamanism': 'Tehuelche_people',
      'Patagonian Shamanism': 'Patagonia',
      'Charrua Religion': 'Charrúa',
      'Chavin Jaguar Cult': 'Chavín_culture',
      'Aymara Religion': 'Aymara_people',
      'Lake Titicaca Spiritualism': 'Lake_Titicaca',
      'Tiwanaku Sun Worship': 'Tiwanaku',
      'Llanos Shamanism': 'Llanos',
      'Atlantic Shamanism': 'Indigenous_peoples_in_Brazil',
      'Pampas Shamanism': 'Pampas',
      'River Spirit Worship': 'Animism',

      // Pacific/Oceanian religions
      'Hawaiian Traditional Religion': 'Ancient_Hawaiian_religion',
      'Maori Traditional Religion': 'Māori_religion',
      'Polynesian Traditional Religion': 'Polynesian_narrative',
      'Melanesian Traditional Religion': 'Melanesia',
      'Micronesian Traditional Religion': 'Micronesia',
      'Austronesian Traditional Religion': 'Austronesian_peoples',
      'Cargo Cults': 'Cargo_cult',

      // European pagan religions
      'Germanic Paganism': 'Germanic_paganism',
      'Slavic Paganism': 'Slavic_paganism',
      'Finno-Ugric Paganism': 'Finnic_paganism',
      'Thracian Religion': 'Ancient_Thracian_religion',
      'Armenian Paganism': 'Armenian_mythology',
      'Celtic Christianity': 'Celtic_Christianity',

      // Asian religions
      'Siberian Shamanism': 'Shamanism_in_Siberia',
      'Korean Shamanism': 'Korean_shamanism',
      'Chinese Traditional Religion': 'Chinese_folk_religion',
      'Shamanism': 'Shamanism',

      // Ancient Near East religions
      'Indus Valley Religion': 'Indus_Valley_Civilisation',
      'Persian Zoroastrianism': 'Zoroastrianism',
      'Mesopotamian Polytheism': 'Ancient_Mesopotamian_religion',
      'Arabian Polytheism': 'Arabian_mythology',
      'Canaanite Religion': 'Ancient_Canaanite_religion',
      'Mithraism': 'Mithraism',
      'Manichaeism': 'Manichaeism',

      // African religions
      'Nubian Christianity': 'Nubian_Christianity',
      'Nubian Traditional Religion': 'Nubia',
      'Ethiopian Traditional Religion': 'Ethiopia',
      'Ethiopian Judaism': 'Beta_Israel',
      'Berber Traditional Religion': 'Berbers',
      'Igbo Traditional Religion': 'Odinani',
      'Yoruba Traditional Religion': 'Yoruba_religion',
      'San Shamanism': 'San_people',
      'Malagasy Traditional Religion': 'Malagasy_people',
      'Georgian Traditional Religion': 'Georgia_(country)',
      'Georgian Orthodox Christianity': 'Georgian_Orthodox_Church',

      // Syncretic religions
      'Vodou': 'Haitian_Vodou',
      'Santería': 'Santería',
      'Candomblé': 'Candomblé',
      'Umbanda': 'Umbanda',

      // Other religions
      'Early Christianity': 'Early_Christianity',
      'Byzantine Christianity': 'Eastern_Orthodox_Church',
      'Eastern Christianity': 'Eastern_Christianity',
      'Mozarabic Christianity': 'Mozarabic_Rite',
      'Methodist': 'Methodism',
      'Bahai Faith': 'Baháʼí_Faith',
      'Druze': 'Druze',
      'Catharism': 'Catharism',
      'Conversos': 'Converso',
      'Early Hinduism': 'Historical_Vedic_religion',
      'Ancestor Worship': 'Veneration_of_the_dead',
      'Ancestral Worship': 'Veneration_of_the_dead',
      'Local Anatolian Cults': 'Anatolia',
      'Local Spirits Worship': 'Animism',
      'Coastal Animism': 'Animism',
      'Mountain Spirit Worship': 'Animism',
      'Highland Shamanism': 'Shamanism',

      // Region mappings
      // Australian regions
      'Australia – North and Queensland': 'Indigenous_Australians',
      'Australia – Southeast': 'Indigenous_Australians',
      'Australia – Outback and Center': 'Indigenous_Australians',
      'Australia – West and Desert': 'Indigenous_Australians',
      'Great Barrier Reef Coast': 'Indigenous_Australians',
      'Arnhem Land': 'Indigenous_Australians',
      'Torres Strait': 'Torres_Strait_Islanders',

      // South American regions
      'Guiana Shield': 'The_Guianas',
      'Maroni Basin': 'The_Guianas',
      'Orinoco': 'Orinoco',
      'Amazon Basin': 'Amazon_basin',
      'Andes': 'Andes',

      // Pacific Northwest / North American regions
      'Pacific Coast': 'Indigenous_peoples_of_the_Pacific_Northwest_Coast',
      'Olympic Peninsula': 'Coast_Salish',
      'Puget Sound': 'Coast_Salish',
      'Columbia River Valley': 'Chinookan_peoples',
      'Redwood Coast': 'Indigenous_peoples_of_California',
      'Northern California': 'Indigenous_peoples_of_California',
      'Central California Coast': 'Chumash',
      'Southern California': 'Indigenous_peoples_of_California',
      'Mexico and Central Highlands': 'History_of_Mexico',
      'Central America': 'History_of_Central_America',
      'The Caribbean': 'History_of_the_Caribbean',
      'Arctic and Subarctic': 'Inuit',

      // European regions
      'Atlantic Islands': 'Atlantic_Ocean#Islands',
      'Ural and Arctic Europe': 'Ural_Mountains',
      'Ural Mountains': 'Ural_Mountains',

      // Other regions
      'Antarctic Peninsula': 'Antarctic_Peninsula',
      'Iberian Peninsula': 'Iberian_Peninsula',
      'Italian Peninsula': 'Italian_Peninsula',
      'Balkan Peninsula': 'Balkans',
      'Anatolian Plateau': 'Anatolia',
      'Iranian Plateau': 'Iranian_Plateau',
      'Arabian Peninsula': 'Arabian_Peninsula',
      'Levant': 'Levant',
      'Mesopotamia': 'Mesopotamia',
      'Nile River Valley': 'Nile',
      'West African Coast': 'West_Africa',
      'East African Coast': 'East_Africa',
      'Great Lakes Region': 'African_Great_Lakes',
      'Ethiopian Highlands': 'Ethiopian_Highlands',
      'Sahel': 'Sahel',
      'Congo Basin': 'Congo_Basin',
      'Kalahari Desert': 'Kalahari_Desert',
      'Madagascar': 'Madagascar',
      'Yellow River Valley': 'Yellow_River',
      'Yangtze River Valley': 'Yangtze',
      'Korean Peninsula': 'Korean_Peninsula',
      'Japanese Archipelago': 'Japanese_archipelago',
      'Tibetan Plateau': 'Tibetan_Plateau',
      'Mongolian Steppe': 'Mongolian_Plateau',
      'Indus River Valley': 'Indus_River',
      'Ganges River Valley': 'Ganges',
      'Deccan Plateau': 'Deccan_Plateau',
      'Bengal': 'Bengal',
      'Maritime Southeast Asia': 'Maritime_Southeast_Asia',
      'Mainland Southeast Asia': 'Mainland_Southeast_Asia',
      'Australian Outback': 'Outback',
      'New Guinea Highlands': 'New_Guinea_Highlands',
      'Pacific Islands': 'Pacific_Islands',
      'Polynesia': 'Polynesia',
      'Micronesia': 'Micronesia',
      'Melanesia': 'Melanesia',
      'North American Great Plains': 'Great_Plains',
      'Eastern Woodlands': 'Eastern_Woodlands',
      'Pacific Northwest': 'Pacific_Northwest',
      'Mesoamerica': 'Mesoamerica',
      'Andes Mountains': 'Andes',
      'Gran Chaco and Pampas': 'Gran_Chaco',
      'Caribbean Islands': 'Caribbean',
      'Rio de Janeiro Bay': 'Guanabara_Bay',
      'Persian Gulf': 'Persian_Gulf',
      'Bay of Bengal': 'Bay_of_Bengal',
      'Chesapeake Bay': 'Chesapeake_Bay',
      'San Francisco Bay': 'San_Francisco_Bay',
      'Hudson Bay': 'Hudson_Bay',
      'Gulf of Mexico': 'Gulf_of_Mexico',
      'Strait of Gibraltar': 'Strait_of_Gibraltar',
      'Strait of Malacca': 'Strait_of_Malacca',
      'Strait of Magellan': 'Strait_of_Magellan',
      'Bosporus': 'Bosporus',
      'Bosporus Straits': 'Bosporus',
      'Rhine Valley': 'Rhine',
      'Danube': 'Danube',
      'Danube Bend': 'Danube',
      'Po Valley': 'Po_(river)',
      'Himalayas': 'Himalayas',
      'Atlas Mountains': 'Atlas_Mountains',
      'Rocky Mountains': 'Rocky_Mountains',
      'Ural Mountains': 'Ural_Mountains',
      'Carpathian Mountains': 'Carpathian_Mountains',
      'Pyrenees': 'Pyrenees',
      'Alps': 'Alps',
      'Caribbean Sea': 'Caribbean_Sea',
      'Black Sea': 'Black_Sea',
      'Red Sea': 'Red_Sea',
      'Caspian Sea': 'Caspian_Sea',
      'Aegean Sea': 'Aegean_Sea',
      'Adriatic Sea': 'Adriatic_Sea',
      'Mediterranean Sea': 'Mediterranean_Sea',
      'North Sea': 'North_Sea',
      'Baltic Sea': 'Baltic_Sea',
      'South China Sea': 'South_China_Sea',
      'East China Sea': 'East_China_Sea',
      'Yellow Sea': 'Yellow_Sea',
      'Sea of Japan': 'Sea_of_Japan',
      'Arabian Sea': 'Arabian_Sea',
      'Gobi Desert': 'Gobi_Desert',
      'Sahara': 'Sahara',
      'Atacama Desert': 'Atacama_Desert',
      'Sonoran Desert': 'Sonoran_Desert',
      'Mojave Desert': 'Mojave_Desert',
      'Mekong Delta': 'Mekong_Delta',
      'Orinoco Delta': 'Orinoco_Delta',
      'Nile Delta': 'Nile_Delta',
      'Niger Delta': 'Niger_Delta',

      // Disease mappings
      'tuberculosis': 'Tuberculosis',
      'malaria': 'Malaria',
      'cholera': 'Cholera',
      'typhoid fever': 'Typhoid_fever',
      'typhoid': 'Typhoid_fever',
      'dysentery': 'Dysentery',
      'pneumonia': 'Pneumonia',
      'influenza': 'Influenza',
      'Spanish flu': 'Spanish_flu',
      'plague': 'Bubonic_plague',
      'bubonic plague': 'Bubonic_plague',
      'smallpox': 'Smallpox',
      'measles': 'Measles',
      'yellow fever': 'Yellow_fever',
      'dengue fever': 'Dengue_fever',
      'scarlet fever': 'Scarlet_fever',
      'diphtheria': 'Diphtheria',
      'whooping cough': 'Whooping_cough',
      'leprosy': 'Leprosy',
      'tetanus': 'Tetanus',
      'rabies': 'Rabies',
      'anthrax': 'Anthrax',
      'sleeping sickness': 'African_trypanosomiasis',
      'scurvy': 'Scurvy',
      'rickets': 'Rickets',
      'pellagra': 'Pellagra',
      'beriberi': 'Beriberi',
      'cancer': 'Cancer',
      'heart disease': 'Cardiovascular_disease',
      'stroke': 'Stroke',
      'diabetes': 'Diabetes',
      'epilepsy': 'Epilepsy',
      'gout': 'Gout',
      'arthritis': 'Arthritis',
      'rheumatism': 'Rheumatism',
      'consumption': 'Tuberculosis',
      'dropsy': 'Edema',
      'ague': 'Malaria',
      'fever': 'Fever',
      'flux': 'Dysentery',
      'quinsy': 'Peritonsillar_abscess',
      'apoplexy': 'Stroke',
      'palsy': 'Paralysis',
      'milk sickness': 'Milk_sickness',
      'ship fever': 'Typhus',
      'jail fever': 'Typhus',
      'camp fever': 'Typhus',
      'trench fever': 'Trench_fever',
      'trachoma': 'Trachoma',
      'yaws': 'Yaws',
      'hookworm': 'Hookworm',
      'tapeworm': 'Cestoda',
      'roundworm': 'Nematode',
      'river blindness': 'Onchocerciasis',
      'elephantiasis': 'Elephantiasis',
      'schistosomiasis': 'Schistosomiasis',
      'polio': 'Poliomyelitis',
      'taro blight fever': 'Plant_disease',
    };

    return mappings[displayName] || displayName.replace(/ /g, '_');
  };

  // Helper function to create clickable Wikipedia links
  const createWikiLink = (text: string, displayName?: string) => {
    const articleTitle = getWikipediaArticle(displayName || text);
    return (
      <span
        className="wiki-link"
        onClick={(e) => {
          e.preventDefault();
          setWikipediaArticle(articleTitle);
        }}
      >
        {text}
      </span>
    );
  };

  // Helper function to make religion, location, and disease names clickable in biography HTML
  const makeTermsClickable = (html: string, religion: string, location: string, disease?: string): string => {
    if (!html) return html;

    let result = html;

    // Make religion name clickable
    if (religion && religion !== 'Local Beliefs' && religion !== 'Agnostic') {
      const religionArticle = getWikipediaArticle(religion);
      const religionRegex = new RegExp(religion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(religionRegex, (match) => {
        return `<span class="wiki-link" data-article="${religionArticle}">${match}</span>`;
      });
    }

    // Make location/region name clickable
    if (location) {
      const locationArticle = getWikipediaArticle(location);
      const locationRegex = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(locationRegex, (match) => {
        return `<span class="wiki-link" data-article="${locationArticle}">${match}</span>`;
      });
    }

    // Make disease name clickable
    if (disease) {
      const diseaseArticle = getWikipediaArticle(disease);
      const diseaseRegex = new RegExp(disease.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(diseaseRegex, (match) => {
        return `<span class="wiki-link" data-article="${diseaseArticle}">${match}</span>`;
      });
    }

    return result;
  };

  // Memoize the biography generation to prevent re-rendering when clicking Wikipedia links
  const memoizedBiography = useMemo(() => {
    if (!persona) return '';
    const diseaseName = persona.character.diseaseHealth?.currentDiseases?.[0]?.disease?.name;
    return makeTermsClickable(
      generateNarrativeBiography(persona),
      persona.character.religion,
      persona.location,
      diseaseName
    );
  }, [persona]);

  // Helper: Make names clickable in HTML string
  const makeNamesClickableInHTML = (html: string, familyMembers: any[]): React.ReactNode => {
    if (!familyMembers || familyMembers.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Split on existing HTML tags to avoid breaking them
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Process text nodes to add family name links
    const processTextNode = (node: Node): Node[] => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const namePattern = familyMembers
          .map(m => m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');

        if (!namePattern) return [node];

        const regex = new RegExp(`\\b(${namePattern})(\'s)?\\b`, 'gi');
        const parts: (Node | string)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          const matchedName = match[1];
          const member = familyMembers.find(m =>
            m.name.toLowerCase() === matchedName.toLowerCase()
          );

          if (!member) continue;

          // Add text before match
          if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
          }

          // Add marker for clickable name
          parts.push(`<span class="family-name-link" data-family-member="${member.name}" title="Click to generate their life history">${match[0]}</span>`);

          lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }

        if (parts.length > 0) {
          const span = document.createElement('span');
          span.innerHTML = parts.join('');
          return Array.from(span.childNodes);
        }
      }

      // Recursively process child nodes
      if (node.hasChildNodes()) {
        const newChildren: Node[] = [];
        node.childNodes.forEach(child => {
          const processed = processTextNode(child);
          newChildren.push(...processed);
        });
        const newNode = node.cloneNode(false);
        newChildren.forEach(child => newNode.appendChild(child));
        return [newNode];
      }

      return [node];
    };

    const processed = processTextNode(tempDiv);
    const processedElement = processed[0] as HTMLElement;
    return <span dangerouslySetInnerHTML={{ __html: processedElement?.innerHTML || html }} />;
  };

  // Generate biography with family names clickable (React elements)
  const memoizedBiographyWithFamilyLinks = useMemo(() => {
    if (!persona) return null;
    const rawBio = generateNarrativeBiography(persona);
    const diseaseName = persona.character.diseaseHealth?.currentDiseases?.[0]?.disease?.name;
    const withWikiLinks = makeTermsClickable(
      rawBio,
      persona.character.religion,
      persona.location,
      diseaseName
    );

    // For Phase 1, use simple approach: render HTML then enhance with family links
    // We'll parse the HTML and add family name spans
    return makeNamesClickableInHTML(withWikiLinks, persona.character.family);
  }, [persona]);

  // Helper: Process life event text to make family names clickable
  const makeLifeEventTextClickable = (text: string): React.ReactNode => {
    if (!persona || !persona.character.family || persona.character.family.length === 0) {
      return text;
    }

    const familyMembers = persona.character.family;
    const namePattern = familyMembers
      .map(m => m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    if (!namePattern) return text;

    const regex = new RegExp(`\\b(${namePattern})(\'s)?\\b`, 'gi');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      const matchedName = match[1];
      const member = familyMembers.find(m =>
        m.name.toLowerCase() === matchedName.toLowerCase()
      );

      if (!member) continue;

      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add clickable name
      parts.push(
        <span
          key={`name-${keyCounter++}`}
          className="family-name-link"
          onClick={(e) => {
            e.stopPropagation();
            handleViewFamilyMember(member);
          }}
          title="Click to generate their life history"
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-brand">
          <div
            className="hourglass-container"
            onClick={handleHourglassClick}
            style={{
              cursor: 'pointer',
              transform: `rotate(${hourglassRotation}deg)`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'center center',
              width: 44,
              height: 44,
            }}
            role="button"
            aria-label="Flip hourglass to restart sand"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHourglassClick()}
          >
            <svg
              key={sandAnimationKey}
              className="brand-icon animated-hourglass"
              viewBox="0 0 50 50"
              width="44"
              height="44"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="hourglassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a08060" />
                  <stop offset="50%" stopColor="#8b7355" />
                  <stop offset="100%" stopColor="#6b5344" />
                </linearGradient>
                <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8d5a8" />
                  <stop offset="100%" stopColor="#d4c090" />
                </linearGradient>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
                </linearGradient>
                <clipPath id="topBulbClip">
                  <path d="M15 7 L35 7 L35 14 Q35 20 25 25 Q15 20 15 14 Z" />
                </clipPath>
                <clipPath id="bottomBulbClip">
                  <path d="M15 43 L35 43 L35 36 Q35 30 25 25 Q15 30 15 36 Z" />
                </clipPath>
              </defs>

              {/* Outer ring */}
              <circle cx="25" cy="25" r="23" fill="none" stroke="url(#hourglassGradient)" strokeWidth="2.5" />

              {/* Hourglass glass body - filled background */}
              <path d="M16 8 L34 8 L34 13 Q34 19 25 25 Q16 19 16 13 Z"
                    fill="rgba(255,250,240,0.3)" />
              <path d="M16 42 L34 42 L34 37 Q34 31 25 25 Q16 31 16 37 Z"
                    fill="rgba(255,250,240,0.3)" />

              {/* Top sand - depletes over time */}
              <g clipPath="url(#topBulbClip)">
                <rect x="15" y="7" width="20" height="16" fill="url(#sandGradient)">
                  <animate
                    attributeName="height"
                    from="16"
                    to="0"
                    dur="60s"
                    fill="freeze"
                    calcMode="linear"
                  />
                </rect>
              </g>

              {/* Bottom sand - accumulates over time */}
              <g clipPath="url(#bottomBulbClip)">
                <rect x="15" width="20" fill="url(#sandGradient)">
                  <animate
                    attributeName="y"
                    from="43"
                    to="27"
                    dur="60s"
                    fill="freeze"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="height"
                    from="0"
                    to="16"
                    dur="60s"
                    fill="freeze"
                    calcMode="linear"
                  />
                </rect>
              </g>

              {/* Falling sand stream through the neck */}
              <line x1="25" y1="23" x2="25" y2="27" stroke="#d4c090" strokeWidth="2" strokeLinecap="round">
                <animate
                  attributeName="opacity"
                  values="0.9;0.5;0.9"
                  dur="0.25s"
                  repeatCount="indefinite"
                />
              </line>

              {/* Animated sand particles falling through neck */}
              <circle r="0.8" fill="#d4c090">
                <animate attributeName="cx" values="25;24.7;25.3;25" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="cy" values="22;24.5;27;22" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0.8;0" dur="0.4s" repeatCount="indefinite" />
              </circle>
              <circle r="0.6" fill="#e8d5a8">
                <animate attributeName="cx" values="25.2;24.9;25.1;25.2" dur="0.35s" repeatCount="indefinite" />
                <animate attributeName="cy" values="23;25;27;23" dur="0.35s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.9;0.7;0" dur="0.35s" repeatCount="indefinite" />
              </circle>
              <circle r="0.5" fill="#d4c090">
                <animate attributeName="cx" values="24.8;25.2;25;24.8" dur="0.45s" repeatCount="indefinite" />
                <animate attributeName="cy" values="22.5;25;27.5;22.5" dur="0.45s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.8;0.6;0" dur="0.45s" repeatCount="indefinite" />
              </circle>

              {/* Hourglass frame - top bulb outline */}
              <path d="M15 7 L35 7 L35 14 Q35 20 25 25 Q15 20 15 14 Z"
                    fill="none" stroke="url(#hourglassGradient)" strokeWidth="2" strokeLinecap="round" />

              {/* Hourglass frame - bottom bulb outline */}
              <path d="M15 43 L35 43 L35 36 Q35 30 25 25 Q15 30 15 36 Z"
                    fill="none" stroke="url(#hourglassGradient)" strokeWidth="2" strokeLinecap="round" />

              {/* Glass shine effects */}
              <path d="M18 10 Q19 16 25 22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <path d="M18 40 Q19 34 25 28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

              {/* Frame end caps - top and bottom */}
              <rect x="13" y="5.5" width="24" height="3" rx="1.5" fill="url(#hourglassGradient)" />
              <rect x="13" y="41.5" width="24" height="3" rx="1.5" fill="url(#hourglassGradient)" />
            </svg>
          </div>
          <h1
            className="top-bar-title"
            onClick={() => setShowDonate(true)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowDonate(true)}
          >
            Historical Persona Generator
          </h1>
        </div>
        <div className="top-bar-buttons" role="toolbar" aria-label="Page actions">
          <button onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <IoSunny aria-hidden="true" /> : <IoMoonSharp aria-hidden="true" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleShare} aria-label="Share this persona">
            <IoShareSocial aria-hidden="true" />
            Share
          </button>
          <button onClick={handleSavePDF} aria-label="Save persona as PDF">
            <IoSave aria-hidden="true" />
            Save as PDF
          </button>
          <button onClick={() => setShowAbout(true)} aria-label="About this application">
            <IoInformationCircle aria-hidden="true" />
            About
          </button>
          <button onClick={handleDonate} aria-label="Support the project via Res Obscura Substack">
            <IoHeart aria-hidden="true" />
            Support
          </button>
        </div>
      </div>

      <div className="persona-generator">

      <div className="controls" role="region" aria-label="Persona generation controls">
        <div className="control-buttons">
          <button className="btn btn-primary" onClick={generateCompletelyRandom} aria-label="Generate a random historical persona">
            <IoShuffle aria-hidden="true" />
            Generate Random Persona
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-options"
          >
            <IoOptions aria-hidden="true" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
          <span className="controls-disclaimer">
            Prototype – may contain errors
          </span>
          <span className="controls-divider" aria-hidden="true">|</span>
          <span className="controls-info">
            Created by <a href="https://benjaminpbreen.com" target="_blank" rel="noopener noreferrer">Benjamin Breen</a>, UCSC History.{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setShowDonate(true); }}>Donate</a>{' · '}
            <a href="https://github.com/benjaminbreen/HistoricalPersonaGenerator" target="_blank" rel="noopener noreferrer">GitHub</a>
          </span>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              className="advanced-controls"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
            <div className="control-group">
              <label>Historical Era</label>
              <select
                value={params.era || ''}
                onChange={(e) => setParams({ ...params, era: e.target.value as HistoricalEra })}
              >
                <option value="">Any Era</option>
                {ERAS.map(era => (
                  <option key={era.value} value={era.value}>{era.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Cultural Zone</label>
              <select
                value={params.culturalZone || ''}
                onChange={(e) => setParams({ ...params, culturalZone: e.target.value as CulturalZone })}
              >
                <option value="">Any Culture</option>
                {CULTURAL_ZONES.map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Gender</label>
              <select
                value={params.gender || ''}
                onChange={(e) => setParams({ ...params, gender: e.target.value as Gender })}
              >
                <option value="">Any Gender</option>
                {GENDERS.map(gender => (
                  <option key={gender.value} value={gender.value}>{gender.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Social Class</label>
              <select
                value={params.wealthLevel || ''}
                onChange={(e) => setParams({ ...params, wealthLevel: e.target.value as any })}
              >
                <option value="">Any Class</option>
                {SOCIAL_CLASSES.map(sc => (
                  <option key={sc.value} value={sc.value}>{sc.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Age Range</label>
              <div className="age-range">
                <input
                  type="number"
                  placeholder="Min (e.g. 18)"
                  value={params.minAge || ''}
                  onChange={(e) => setParams({ ...params, minAge: parseInt(e.target.value) || undefined })}
                  min="1"
                  max="100"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max (e.g. 65)"
                  value={params.maxAge || ''}
                  onChange={(e) => setParams({ ...params, maxAge: parseInt(e.target.value) || undefined })}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="control-group">
              <label>Specific Year (optional)</label>
              <input
                type="number"
                placeholder="e.g. 1492"
                value={params.year || ''}
                onChange={(e) => setParams({ ...params, year: parseInt(e.target.value) || undefined })}
                min="-10000"
                max="2000"
              />
            </div>

            <button className="btn btn-primary" onClick={generateRandom}>
              <IoShuffle />
              Generate with These Parameters
            </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {persona && (
          <motion.div
            key={persona.character.name}
            className="persona-display-simple"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Breadcrumb Navigation */}
            {breadcrumbPath.length > 1 && (
              <motion.div
                className="breadcrumb-trail"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {breadcrumbPath.map((crumb, index) => (
                  <div key={index} style={{ display: 'contents' }}>
                    {index === 0 ? (
                      <span
                        className={`breadcrumb-item ${index === currentPersonaIndex ? 'active' : ''}`}
                        onClick={() => index !== currentPersonaIndex && handleBreadcrumbNavigation(index)}
                        style={{ cursor: index !== currentPersonaIndex ? 'pointer' : 'default' }}
                      >
                        <IoHome style={{ fontSize: '1.1rem', marginRight: '0.25rem' }} />
                        {crumb.name}
                      </span>
                    ) : (
                      <span
                        className={`breadcrumb-item ${index === currentPersonaIndex ? 'active' : ''}`}
                        onClick={() => index !== currentPersonaIndex && handleBreadcrumbNavigation(index)}
                        style={{ cursor: index !== currentPersonaIndex ? 'pointer' : 'default' }}
                        title={crumb.relation}
                      >
                        {crumb.name}
                      </span>
                    )}
                    {index < breadcrumbPath.length - 1 && (
                      <IoChevronForward className="breadcrumb-separator" />
                    )}
                  </div>
                ))}
                <button
                  className="family-tree-btn"
                  onClick={() => setShowFamilyTree(true)}
                  title="View Family Tree"
                >
                  <IoPeople /> Family Tree
                </button>
              </motion.div>
            )}

            <motion.div
              className="persona-card"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="card-header">
              <div className="header-left">
                <div className="name-with-pills">
                  <h2>{persona.character.name}</h2>
                  <div className="location-pills">
                    <span
                      className="location-pill region-pill wiki-link"
                      onClick={() => setWikipediaArticle(getWikipediaArticle(persona.region))}
                    >
                      {persona.region}
                    </span>
                    {persona.location !== persona.region && (
                      <span
                        className="location-pill area-pill wiki-link"
                        onClick={() => setWikipediaArticle(getWikipediaArticle(persona.location))}
                      >
                        {persona.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="season-narrative">
                  It is <span className="season-text" style={{ color: getSeasonInfo(persona.month, persona.day).color }}>
                    {getSeasonInfo(persona.month, persona.day).description}
                  </span> in the {formatEraLabel(persona.era)} in {formatCulturalZone(persona.culturalZone)}
                </div>
              </div>
              <div className="header-center">
                <div className="map-pill">
                  <MiniLocationMap
                    continent={persona.culturalZone}
                    region={persona.region}
                  />
                </div>
              </div>
              <div className="header-right">
                <div className="header-date">{formatYear(persona.year)}</div>
                <div className="exact-date">{getMonthName(persona.month)} {persona.day}</div>
              </div>
            </div>

            <div className="card-body">
              <div className="left-column">
                <div className="appearance-section-compact">
                  <h3>Portrait</h3>
                  <div className="appearance-content">
                    <div
                      ref={portraitContainerRef}
                      className="portrait-container clickable-portrait"
                      onClick={() => setShowSecrets(true)}
                      onMouseEnter={handleMainPortraitHover}
                      onMouseLeave={handleMainPortraitLeave}
                      title="Click to reveal character secrets"
                    >
                      <ProceduralPortrait
                        character={persona.character}
                        size={192}
                        temporaryExpression={mainPortraitHoverExpression}
                      />
                    </div>
                    <div className="appearance-text">
                      <div className="age-gender-display">
                        <div className="age-block">
                          <span className="age-number">{persona.character.age}</span>
                          <span className="age-label">years old</span>
                        </div>
                        <div className="gender-block">
                          <span className="gender-label">{persona.character.gender}</span>
                        </div>
                      </div>
                      <div className="build-details">
                        <p>
                          <strong>Build:</strong> {persona.character.appearance.build}
                          {persona.character.appearance.facialHair && persona.character.gender !== 'Female' && (
                            <><br/><strong>Facial Hair:</strong> {persona.character.appearance.facialHairStyle && persona.character.appearance.facialHairStyle.replace(/_/g, ' ')}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="info-section-compact">
                  <h3>Background</h3>
                  <div className="info-list-compact">
                    <div className="info-item">
                      <span className="label">Profession</span>
                      <span className="value">
                        <span className="profession-emoji">{getProfessionEmoji(persona.character.profession)}</span>
                        {persona.character.profession}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Religion</span>
                      <span className="value">
                        {createWikiLink(persona.character.religion, persona.character.religion)}
                      </span>
                    </div>
                    {persona.languageData && (
                      <div className="info-item">
                        <span className="label">Native Language</span>
                        <span
                          className="value language-clickable"
                          onClick={() => setShowLanguageModal(true)}
                          title="Click for detailed language information"
                        >
                          {persona.languageData.name}
                          {persona.languageData.nativeName && (
                            <span style={{ fontSize: '0.85em', marginLeft: '4px', opacity: 0.7 }}>
                              ({persona.languageData.nativeName})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="label">Social Status</span>
                      <span className="value">{persona.character.class || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="right-column">
                <div className="backstory-section-compact">
                  <div className="biography-tabs" role="tablist" aria-label="Character information tabs">
                    <button
                      role="tab"
                      aria-selected={activeTab === 'biography'}
                      aria-controls="tab-biography"
                      className={activeTab === 'biography' ? 'tab-active' : ''}
                      onClick={() => setActiveTab('biography')}
                    >
                      Biography
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeTab === 'family'}
                      aria-controls="tab-family"
                      className={activeTab === 'family' ? 'tab-active' : ''}
                      onClick={() => setActiveTab('family')}
                    >
                      Family
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeTab === 'lifeEvents'}
                      aria-controls="tab-lifeEvents"
                      className={activeTab === 'lifeEvents' ? 'tab-active' : ''}
                      onClick={() => setActiveTab('lifeEvents')}
                    >
                      Life Events
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeTab === 'innerLife'}
                      aria-controls="tab-innerLife"
                      className={activeTab === 'innerLife' ? 'tab-active' : ''}
                      onClick={() => setActiveTab('innerLife')}
                    >
                      Inner Life
                    </button>
                  </div>

                  <div className="tab-content">
                    {activeTab === 'biography' && (
                      <div
                        className="narrative-biography"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.classList.contains('wiki-link')) {
                            const article = target.getAttribute('data-article');
                            if (article) {
                              setWikipediaArticle(article);
                            }
                          }
                          // Handle family name clicks
                          if (target.classList.contains('family-name-link')) {
                            const memberName = target.getAttribute('data-family-member');
                            if (memberName && persona) {
                              const member = persona.character.family.find(m => m.name === memberName);
                              if (member) {
                                handleViewFamilyMember(member);
                              }
                            }
                          }
                        }}
                      >
                        <p>{memoizedBiographyWithFamilyLinks}</p>
                      </div>
                    )}

                    {activeTab === 'family' && (
                      <div className="family-tab-content">
                        {persona.character.family && persona.character.family.length > 0 ? (
                          <>
                            {/* Family Summary Section */}
                            <div className="family-summary-section">
                              <h4>Immediate Family</h4>
                              {(() => {
                                const father = persona.character.family.find(m => m.relation === 'father');
                                const mother = persona.character.family.find(m => m.relation === 'mother');
                                const spouse = persona.character.family.find(m => m.relation === 'spouse');

                                return (
                                  <div className="parents-grid">
                                    {father && (
                                      <motion.div
                                        className="parent-card clickable-family-card"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        onClick={() => handleViewFamilyMember(father)}
                                        whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(107, 142, 127, 0.2)" }}
                                        whileTap={{ scale: 0.98 }}
                                        title="Click to generate their life history"
                                      >
                                        <div className="parent-header">
                                          <IoMan className="parent-icon" />
                                          <div className="parent-label">Father</div>
                                        </div>
                                        <div className="parent-name">{father.name}</div>
                                        {father.profession && <div className="parent-profession">{getProfessionEmoji(father.profession)} {father.profession}</div>}
                                        {father.birthYear && (
                                          <div className="parent-dates">
                                            {formatYear(father.birthYear)} - {father.isDeceased && father.deathYear ? formatYear(father.deathYear) : 'Present'}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                    {mother && (
                                      <motion.div
                                        className="parent-card clickable-family-card"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        onClick={() => handleViewFamilyMember(mother)}
                                        whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(107, 142, 127, 0.2)" }}
                                        whileTap={{ scale: 0.98 }}
                                        title="Click to generate their life history"
                                      >
                                        <div className="parent-header">
                                          <IoWoman className="parent-icon" />
                                          <div className="parent-label">Mother</div>
                                        </div>
                                        <div className="parent-name">{mother.name}</div>
                                        {mother.profession && <div className="parent-profession">{getProfessionEmoji(mother.profession)} {mother.profession}</div>}
                                        {mother.birthYear && (
                                          <div className="parent-dates">
                                            {formatYear(mother.birthYear)} - {mother.isDeceased && mother.deathYear ? formatYear(mother.deathYear) : 'Present'}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                    {spouse && (
                                      <motion.div
                                        className="parent-card clickable-family-card"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        onClick={() => handleViewFamilyMember(spouse)}
                                        whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(107, 142, 127, 0.2)" }}
                                        whileTap={{ scale: 0.98 }}
                                        title="Click to generate their life history"
                                      >
                                        <div className="parent-header">
                                          <IoHeart className="parent-icon" />
                                          <div className="parent-label">Spouse</div>
                                        </div>
                                        <div className="parent-name">{spouse.name}</div>
                                        {spouse.profession && <div className="parent-profession">{getProfessionEmoji(spouse.profession)} {spouse.profession}</div>}
                                        {spouse.age && <div className="parent-dates">Age {spouse.age}</div>}
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Family Tree Visualization */}
                            <motion.div
                              className="family-tree-section"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <h4>Family Tree</h4>
                              <div className="family-tree">
                                {/* Parents Generation */}
                                <div className="tree-generation parents-generation">
                                  {(() => {
                                    const father = persona.character.family.find(m => m.relation === 'father');
                                    const mother = persona.character.family.find(m => m.relation === 'mother');
                                    return (
                                      <>
                                        {father && (
                                          <div className="tree-node">
                                            <div className="tree-node-card">
                                              <IoMale className="tree-node-icon male" />
                                              <div className="tree-node-name">{father.name}</div>
                                              <div className="tree-node-relation">Father</div>
                                            </div>
                                          </div>
                                        )}
                                        {mother && (
                                          <div className="tree-node">
                                            <div className="tree-node-card">
                                              <IoFemale className="tree-node-icon female" />
                                              <div className="tree-node-name">{mother.name}</div>
                                              <div className="tree-node-relation">Mother</div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Connecting Line */}
                                <div className="tree-connector"></div>

                                {/* Subject Generation */}
                                <div className="tree-generation subject-generation">
                                  <div className="tree-node subject-node">
                                    <div className="tree-node-card subject">
                                      {persona.character.gender === 'Male' ? <IoMale className="tree-node-icon male" /> : <IoFemale className="tree-node-icon female" />}
                                      <div className="tree-node-name">{persona.character.name}</div>
                                      <div className="tree-node-relation">Subject</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Children/Siblings Generation */}
                                {(() => {
                                  const siblings = persona.character.family.filter(m =>
                                    m.relation === 'sibling' || m.relation === 'brother' || m.relation === 'sister'
                                  );
                                  const children = persona.character.family.filter(m =>
                                    m.relation === 'son' || m.relation === 'daughter'
                                  );

                                  if (siblings.length > 0 || children.length > 0) {
                                    return (
                                      <>
                                        <div className="tree-connector"></div>
                                        <div className="tree-generation children-generation">
                                          {siblings.map((sibling, idx) => (
                                            <div key={`sibling-${idx}`} className="tree-node">
                                              <div className="tree-node-card">
                                                {sibling.relation === 'brother' || (sibling.relation === 'sibling' && Math.random() > 0.5) ? (
                                                  <IoMale className="tree-node-icon male" />
                                                ) : (
                                                  <IoFemale className="tree-node-icon female" />
                                                )}
                                                <div className="tree-node-name">{sibling.name}</div>
                                                <div className="tree-node-relation">Sibling</div>
                                              </div>
                                            </div>
                                          ))}
                                          {children.map((child, idx) => (
                                            <div key={`child-${idx}`} className="tree-node">
                                              <div className="tree-node-card">
                                                {child.relation === 'son' ? (
                                                  <IoMale className="tree-node-icon male" />
                                                ) : (
                                                  <IoFemale className="tree-node-icon female" />
                                                )}
                                                <div className="tree-node-name">{child.name}</div>
                                                <div className="tree-node-relation">{child.relation === 'son' ? 'Son' : 'Daughter'}</div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </motion.div>
                          </>
                        ) : (
                          <p className="no-data">No family information available.</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'lifeEvents' && (
                      <>
                      <div className="life-events-timeline">
                        {persona.enhancedLifeEvents && persona.enhancedLifeEvents.length > 0 ? (
                          persona.enhancedLifeEvents.map((event, idx) => (
                            <motion.div
                              key={idx}
                              className="timeline-event"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <div className="timeline-marker" style={{ borderColor: getEventColor(event.importance) }}>
                                <div className="timeline-icon" style={{ color: getEventColor(event.importance) }}>
                                  {getEventIcon(event.kind)}
                                </div>
                              </div>
                              <div className="timeline-content">
                                <div className="event-header">
                                  <span className="event-year" style={{ color: getEventColor(event.importance) }}>
                                    {formatYear(event.year)}
                                  </span>
                                  <span className="event-title" style={{ borderLeftColor: getEventColor(event.importance) }}>
                                    {makeLifeEventTextClickable(event.title)}
                                  </span>
                                </div>
                                <p className="event-text">{makeLifeEventTextClickable(event.text)}</p>
                                {event.impacts && (event.impacts.wealth || event.impacts.reputation || event.impacts.health) && (
                                  <div className="event-impacts">
                                    {event.impacts.wealth && (
                                      <span className={`impact-badge ${event.impacts.wealth > 0 ? 'positive' : 'negative'}`}>
                                        <IoCart />
                                        {event.impacts.wealth > 0 ? '+' : ''}{event.impacts.wealth} Wealth
                                      </span>
                                    )}
                                    {event.impacts.reputation && (
                                      <span className={`impact-badge ${event.impacts.reputation > 0 ? 'positive' : 'negative'}`}>
                                        <IoStar />
                                        {event.impacts.reputation > 0 ? '+' : ''}{event.impacts.reputation} Reputation
                                      </span>
                                    )}
                                    {event.impacts.health && (
                                      <span className={`impact-badge ${event.impacts.health > 0 ? 'positive' : 'negative'}`}>
                                        <IoMedkit />
                                        {event.impacts.health > 0 ? '+' : ''}{event.impacts.health} Health
                                      </span>
                                    )}
                                  </div>
                                )}
                                {event.culturalContext && (
                                  <p className="event-context"><em>{event.culturalContext}</em></p>
                                )}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="no-data">No life events recorded.</p>
                        )}
                      </div>

                      {/* Death Reveal Section - Fixed at bottom, outside scrollable area */}
                      {deathRevealState !== 'hidden' && (
                        <motion.div
                          className="death-reveal-section"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {deathRevealState === 'prompt' && (
                            <div className="death-prompt">
                              <h4>
                                <IoSkull style={{ marginRight: '8px', opacity: 0.7 }} />
                                See when and how {persona.character.name.split(' ')[0]} will die?
                              </h4>
                              <div className="death-prompt-buttons">
                                <button
                                  className="btn btn-death-yes"
                                  onClick={generateDeathInfo}
                                >
                                  Yes, reveal my fate
                                </button>
                                <button
                                  className="btn btn-death-no"
                                  onClick={() => setDeathRevealState('hidden')}
                                >
                                  No thanks
                                </button>
                              </div>
                            </div>
                          )}

                          {deathRevealState === 'revealed' && deathInfo && (
                            <motion.div
                              className="death-revealed"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="death-header">
                                <IoSkull className="death-icon" />
                                <span>Final Chapter</span>
                              </div>
                              <p className="death-description">{deathInfo.description}</p>
                              {deathInfo.lastWords && (
                                <p className="death-last-words">
                                  <em>Last words: "{deathInfo.lastWords}"</em>
                                </p>
                              )}
                              <div className="death-stats">
                                <span className="death-stat">
                                  <strong>Age at death:</strong> {deathInfo.age}
                                </span>
                                <span className="death-stat">
                                  <strong>Years remaining:</strong> {deathInfo.age - persona.character.age}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                      </>
                    )}

                    {activeTab === 'innerLife' && (
                      <div className="inner-life-content">
                        {/* Personal Goal Section */}
                        {persona.character.personalGoal && (
                          <motion.div
                            className="personal-goal-section"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="goal-header">
                              <IoFlag className="goal-icon" />
                              <h4>Personal Aspiration: {persona.character.personalGoal.archetype.replace(/_/g, ' ').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h4>
                            </div>
                            <div className="goal-content">
                              <div className="goal-description">
                                <p>{(() => {
                                  const goal = persona.character.personalGoal;
                                  const pronouns = persona.character.gender === 'Female' ? { pronoun: 'she', possessive: 'her', object: 'her' } :
                                                   persona.character.gender === 'Male' ? { pronoun: 'he', possessive: 'his', object: 'him' } :
                                                   { pronoun: 'they', possessive: 'their', object: 'them' };

                                  // Generate narrative based on goal archetype
                                  const introTemplates: Record<string, string[]> = {
                                    'ACQUISITION': [
                                      `Above all else, ${pronouns.pronoun} seeks to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} greatest desire is to`,
                                      `What drives ${pronouns.object} most is the quest to`
                                    ],
                                    'MASTERY': [
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} yearns to`,
                                      `Above all, ${pronouns.pronoun} strives to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} life's work is devoted to`
                                    ],
                                    'REVENGE': [
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} heart burns with the desire to`,
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} seeks to`,
                                      `Justice, as ${pronouns.pronoun} sees it, demands that ${pronouns.pronoun}`
                                    ],
                                    'PROTECTION': [
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} has sworn to`,
                                      `Nothing matters more to ${pronouns.object} than to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} purpose is to`
                                    ],
                                    'DISCOVERY': [
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} longs to`,
                                      `The mystery ${pronouns.pronoun} seeks to unravel is to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} curiosity drives ${pronouns.object} to`
                                    ],
                                    'ESCAPE': [
                                      `More than anything, ${pronouns.pronoun} yearns to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} deepest hope is to`,
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} longs to`
                                    ],
                                    'CREATION': [
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} is determined to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} vision is to`,
                                      `What ${pronouns.pronoun} hopes to achieve is to`
                                    ],
                                    'BELONGING': [
                                      `${pronouns.pronoun.charAt(0).toUpperCase() + pronouns.pronoun.slice(1)} seeks to`,
                                      `To ${pronouns.object}, nothing matters more than to`,
                                      `${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} deepest wish is to`
                                    ]
                                  };

                                  const templates = introTemplates[goal.archetype] || introTemplates['ACQUISITION'];
                                  const intro = templates[Math.floor(Math.random() * templates.length)];

                                  return `${intro} ${goal.description.charAt(0).toLowerCase() + goal.description.slice(1)}`;
                                })()}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Beliefs Section */}
                        {persona.character.beliefs && persona.character.beliefs.length > 0 && (
                          <motion.div
                            className="beliefs-section"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="beliefs-header">
                              <IoStar className="beliefs-icon" />
                              <h4>Core Beliefs & Worldview</h4>
                            </div>
                            <div className="beliefs-intro">
                              <p>{(() => {
                                const pronouns = persona.character.gender === 'Female' ? { pronoun: 'She', possessive: 'her', object: 'her' } :
                                                 persona.character.gender === 'Male' ? { pronoun: 'He', possessive: 'his', object: 'him' } :
                                                 { pronoun: 'They', possessive: 'their', object: 'them' };

                                // Calculate average conviction across all beliefs (values are 0-100)
                                const avgConviction = persona.character.beliefs.reduce((sum, b) => sum + b.conviction, 0) / persona.character.beliefs.length;

                                if (avgConviction > 80) {
                                  // Zealous/Unwavering
                                  return `${pronouns.pronoun} holds fast to ${pronouns.possessive} convictions with unwavering certainty, seeing the world through a lens of deeply held principles that brook no compromise.`;
                                } else if (avgConviction > 65) {
                                  // Strong convictions
                                  return `${pronouns.pronoun} carries strong beliefs that form the bedrock of ${pronouns.possessive} character, guiding ${pronouns.possessive} decisions with steady purpose.`;
                                } else if (avgConviction > 50) {
                                  // Moderate convictions
                                  return `${pronouns.pronoun} holds certain principles dear while remaining thoughtful about others, balancing conviction with a willingness to listen.`;
                                } else if (avgConviction > 35) {
                                  // Flexible/questioning
                                  return `${pronouns.pronoun} approaches ${pronouns.possessive} beliefs with a questioning mind, holding views that shift and evolve as ${pronouns.pronoun.toLowerCase()} encounters new ideas.`;
                                } else {
                                  // Uncertain/fluid
                                  return `${pronouns.pronoun} moves through the world with few fixed convictions, ${pronouns.possessive} views fluid and shaped more by circumstance than ideology.`;
                                }
                              })()}</p>
                            </div>
                            <div className="beliefs-grid">
                              {(() => {
                                const sortedBeliefs = [...persona.character.beliefs].sort((a, b) => b.conviction - a.conviction);
                                return sortedBeliefs.map((belief, idx) => {
                                  const beliefData = PERSONAL_BELIEFS.find((b: any) => b.id === belief.beliefId);
                                  if (!beliefData) return null;

                                  const convictionLevel = belief.conviction > 80 ? 'strong' :
                                                         belief.conviction > 60 ? 'firm' :
                                                         belief.conviction > 40 ? 'moderate' :
                                                         'tentative';

                                  return (
                                    <motion.div
                                      key={idx}
                                      className={`belief-card conviction-${convictionLevel}`}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.3 + idx * 0.1 }}
                                    >
                                      <div className="belief-icon-container">
                                        {(() => {
                                          const BeliefIcon = getBeliefIcon(beliefData.tags);
                                          return <BeliefIcon className="belief-icon-display" />;
                                        })()}
                                      </div>
                                      <div className="belief-text">
                                        <p className="belief-statement">{beliefData.text}</p>
                                        <div className="belief-tags">
                                          {beliefData.tags.slice(0, 2).map((tag: string, tagIdx: number) => (
                                            <span key={tagIdx} className="belief-tag">{tag}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                });
                              })()}
                            </div>
                          </motion.div>
                        )}

                        {(!persona.character.personalGoal && (!persona.character.beliefs || persona.character.beliefs.length === 0)) && (
                          <p className="no-data">No inner life information available.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Historical Context - Only show on biography tab */}
                {activeTab === 'biography' && (
                  <motion.div
                    className="regional-history-section"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <h3>Historical Context</h3>

                  <div className="historical-context-columns">
                    {/* Left Column: Wikipedia Image and Extract */}
                    <div className="wikipedia-column">
                      {wikipediaData && (
                        <div className="wikipedia-image-container">
                          <a
                            href={wikipediaData.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wikipedia-image-link"
                          >
                            <img
                              src={wikipediaData.thumbnailUrl}
                              alt={wikipediaData.title}
                              className="wikipedia-image"
                            />
                          </a>
                          <div className="wikipedia-caption">
                            <a
                              href={wikipediaData.articleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wikipedia-title-link"
                            >
                              {wikipediaData.title}
                            </a>
                            {wikipediaData.extract && (
                              <p className="wikipedia-extract">{wikipediaData.extract}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {wikipediaLoading && (
                        <div className="wikipedia-loading">
                          <p>Loading historical image...</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Regional History Text */}
                    <div className="regional-history-column">
                      <div className="historical-context-header">
                        ABOUT {persona.region.toUpperCase()} IN {Math.abs(persona.year)} {persona.year < 0 ? 'BCE' : 'CE'}:
                      </div>
                      <div className="regional-history-content">
                        {(() => {
                          const regionalHistory = getRegionalHistory(
                            persona.culturalZone,
                            persona.region,
                            persona.year
                          );
                          return regionalHistory ? (
                            <p><em>{regionalHistory}</em></p>
                          ) : (
                            <p>No historical context available for this region and time period.</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}
              </div>

              <div className="inventory-column">
                <motion.div
                  className="equipment-section"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3>Equipment and Items</h3>
                  <div className="equipment-grid">
                    {Object.entries(persona.character.equippedItems || {})
                      .filter(([slot]) => ['head', 'torso', 'feet'].includes(slot.toLowerCase()))
                      .map(([slot, item]) => (
                        item && (
                          <div key={slot} className="equipment-item">
                            <span className="equipment-slot">{formatItemName(slot)}</span>
                            <span className="equipment-name">{formatItemName(item.name)}</span>
                          </div>
                        )
                      ))}

                    {/* Add jewelry items if present */}
                    {persona.character.appearance.jewelry && persona.character.appearance.jewelry.length > 0 && (
                      persona.character.appearance.jewelry.map((piece, idx) => (
                        <div key={`jewelry-${idx}`} className="equipment-item jewelry-equipment">
                          <span className="equipment-slot">{piece.type}</span>
                          <span className="equipment-name">
                            {piece.style} {piece.material}
                            {piece.gems && piece.gems.length > 0 && ` (${piece.gems.join(', ')})`}
                          </span>
                        </div>
                      ))
                    )}

                    {/* Add markings/scars if present */}
                    {persona.character.appearance.markings && persona.character.appearance.markings.length > 0 && (
                      persona.character.appearance.markings.map((marking, idx) => (
                        <div key={`marking-${idx}`} className="equipment-item marking-equipment">
                          <span className="equipment-slot">{getMarkingTypeLabel(marking.type)}</span>
                          <span className="equipment-name">
                            {formatMarkingDescription(marking)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* Accessories section for non-standard equipment slots */}
                {Object.entries(persona.character.equippedItems || {})
                  .filter(([slot]) => !['head', 'torso', 'feet'].includes(slot.toLowerCase()))
                  .filter(([_, item]) => item).length > 0 && (
                  <motion.div
                    className="equipment-section accessories-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.32 }}
                  >
                    <h3>Accessories</h3>
                    <div className="equipment-grid">
                      {Object.entries(persona.character.equippedItems || {})
                        .filter(([slot]) => !['head', 'torso', 'feet'].includes(slot.toLowerCase()))
                        .map(([slot, item]) => (
                          item && (
                            <div key={slot} className="equipment-item">
                              <span className="equipment-slot">{formatItemName(slot)}</span>
                              <span className="equipment-name">{formatItemName(item.name)}</span>
                            </div>
                          )
                        ))}
                    </div>
                  </motion.div>
                )}

                {persona.character.inventory && persona.character.inventory.length > 0 && (
                  <motion.div
                    className="inventory-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <h3>Inventory</h3>
                    <div className="inventory-list">
                      {persona.character.inventory.map((item, idx) => (
                        <div key={idx} className="inventory-item">
                          <span className="item-name">{formatItemName(item.name)}</span>
                          {item.quantity > 1 && (
                            <span className="item-quantity">×{item.quantity}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {persona.character.diseaseHealth &&
                 persona.character.diseaseHealth.currentDiseases &&
                 persona.character.diseaseHealth.currentDiseases.length > 0 && (
                  <motion.div
                    className="disease-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3>Health Status</h3>
                    <div className="disease-list">
                      {persona.character.diseaseHealth.currentDiseases.map((disease, idx) => (
                        <motion.div
                          key={idx}
                          className="disease-item"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + idx * 0.08 }}
                        >
                          <div className="disease-header">
                            <span className="disease-icon-emoji" title={disease.disease.type}>
                              {disease.disease.badgeIcon}
                            </span>
                            <div className="disease-content">
                              <div className="disease-name-row">
                                <span
                                  className="disease-name wiki-link"
                                  onClick={() => setWikipediaArticle(getWikipediaArticle(disease.disease.name))}
                                >
                                  {disease.disease.name}
                                </span>
                                <span className="disease-severity-text">
                                  {disease.disease.severity}
                                </span>
                              </div>
                              <div className="disease-stage-text">
                                Stage: {disease.stage.charAt(0).toUpperCase() + disease.stage.slice(1)}
                              </div>
                              {disease.disease.symptoms && disease.disease.symptoms.length > 0 && (
                                <>
                                  <button
                                    className="symptoms-toggle-button"
                                    onClick={() => setExpandedHealthIndex(expandedHealthIndex === idx ? null : idx)}
                                  >
                                    {expandedHealthIndex === idx ? '− Hide' : '+ Show'} Symptoms ({disease.disease.symptoms.length})
                                  </button>
                                  {expandedHealthIndex === idx && (
                                    <motion.div
                                      className="disease-symptoms-expanded"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                    >
                                      {disease.disease.symptoms.map((symptom, sIdx) => (
                                        <div key={sIdx} className="symptom-item">
                                          • {symptom.name}
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {persona.character.attributes && persona.character.attributes.length > 0 && (
                  <motion.div
                    className="attributes-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <h3>Attributes</h3>
                    <div className="attribute-list">
                      {persona.character.attributes.map((attr, idx) => {
                        const IconComponent = getIconComponent(attr.icon);
                        return (
                          <motion.div
                            key={idx}
                            className="attribute-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + idx * 0.08 }}
                          >
                            <div className="attribute-icon-wrapper">
                              {IconComponent ? (
                                <IconComponent className="attribute-icon" />
                              ) : (
                                <IoStar className="attribute-icon" />
                              )}
                            </div>
                            <div className="attribute-text">
                              <div className="attribute-name">{attr.name}</div>
                              <div className="attribute-description">{attr.description}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {persona.character.ideology && persona.character.ideology !== 'Pragmatism' && (
                  <motion.div
                    className="attributes-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3>Ideology</h3>
                    <div className="attribute-list">
                      <motion.div
                        className="attribute-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="attribute-icon-wrapper">
                          <IoCompass className="attribute-icon" />
                        </div>
                        <div className="attribute-text">
                          <div className="attribute-name">
                            {IDEOLOGIES.find((i: any) => i.id === persona.character.ideology)?.name || persona.character.ideology}
                          </div>
                          <div className="attribute-description">
                            {IDEOLOGIES.find((i: any) => i.id === persona.character.ideology)?.description || ''}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!persona && (
        <div className="empty-state">
          <p>Click "Generate Random Persona" to create your first historical character!</p>
          <p className="empty-subtitle">Choose from 9 cultural zones and 6 historical eras</p>
        </div>
      )}
    </div>

    <footer className="footer">
      © {new Date().getFullYear()} Benjamin Breen. All rights reserved. |{' '}
      <a href="https://ucsc.edu" target="_blank" rel="noopener noreferrer">UC Santa Cruz</a> |{' '}
      Created as a free educational resource
    </footer>

    <AnimatePresence>
      {showAbout && (
        <motion.div
          className="modal-overlay"
          onClick={() => setShowAbout(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-modal-title"
        >
          <motion.div
            className="modal about-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
          <div className="modal-banner">
            <img
              src={`/banners/HistoricalPersonaBanner${aboutBannerIndex}.jpg`}
              alt="Historical Persona Generator"
              className="modal-banner-image"
            />
            <button className="modal-close modal-close-overlay" onClick={() => setShowAbout(false)} aria-label="Close dialog">
              <IoClose aria-hidden="true" />
            </button>
          </div>
          <div className="modal-header">
            <h2 id="about-modal-title">Historical Persona Generator, version 0.1</h2>
           
          </div>
          <div className="modal-body about-body">
            <div className="about-intro">
              <p>
                Created by{' '}
                <a href="https://benjaminpbreen.com" target="_blank" rel="noopener noreferrer">
                  <strong>Benjamin Breen</strong>
                </a>, Associate Professor of History at UC Santa Cruz, this tool generates
                randomized historical personas from various eras and cultures.
              </p>
            </div>

            <div className="disclaimer-box">
              <strong>⚠️ Disclaimer</strong>
              <p>
                This is still a work in progress and will contain errors. Historical information, dates, cultural details,
                and other information may be inaccurate or anachronistic. Although created with human oversight and fact checking, the core data from this game is derived from LLMs like GPT-5 and Claude Sonnet 4 adapting information from Wikipedia. If you spot an error, please{' '}
                <a href="mailto:bebreen@ucsc.edu">contact me</a>.
              </p>
            </div>

            <div className="about-features">
              <h3>Features</h3>
              <ul>
                <li><strong>9 Cultural Zones</strong> — From Europe to East Asia, MENA to Oceania</li>
                <li><strong>6 Historical Eras</strong> — Prehistory through the Modern Era</li>
                <li><strong>Procedural Portraits</strong> — Unique visual representations for each character</li>
                <li><strong>Rich Backstories</strong> — Life events, beliefs, family connections</li>
              </ul>
            </div>

            <div className="about-use-cases">
              <h3>Who Is This For?</h3>
              <p>
                Writers, game designers, tabletop RPG players, historians, educators, and anyone
                interested in exploring the diversity of human experience across history. I created it as part of a larger educational history simulation project I am developing for use in classroom activities.
              </p>
            </div>

            <div className="about-links">
              <a
                href="https://github.com/benjaminbreen/HistoricalPersonaGenerator"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-btn"
              >
                <IoLogoGithub /> View on GitHub
              </a>
              <button
                className="about-link-btn primary"
                onClick={() => { setShowAbout(false); setShowDonate(true); }}
              >
                <IoHeart /> Support This Project
              </button>
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}

      {showDonate && (
        <motion.div
          className="modal-overlay"
          onClick={() => setShowDonate(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-modal-title"
        >
          <motion.div
            className="modal donate-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
          <div className="donate-banner">
            <img
              src="/banners/smallbanner1.jpg"
              alt="Support Historical Persona Generator"
              className="donate-banner-image"
            />
            <button className="modal-close modal-close-overlay" onClick={() => setShowDonate(false)} aria-label="Close dialog">
              <IoClose aria-hidden="true" />
            </button>
          </div>
          <div className="modal-header">
            <h2 id="donate-modal-title">Support This Project</h2>
          </div>
          <div className="modal-body donate-body">
            <p>
              The Historical Persona Generator is a free educational tool created by{' '}
              <a href="https://benjaminpbreen.com" target="_blank" rel="noopener noreferrer">Benjamin Breen</a>,
              a history professor at UC Santa Cruz. If you find it useful, there are two ways you can support its continued development:
            </p>

            <div className="donate-options">
              <div className="donate-option">
                <div className="donate-option-icon">📧</div>
                <h3>Subscribe to Res Obscura</h3>
                <p>
                  My newsletter about history, AI, and the forgotten byways of global culture.
                  Free posts are available to all; paid subscriptions help support projects like this one.
                </p>
                <a
                  href="https://resobscura.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn "
                >
                  <IoHeart aria-hidden="true" />
                  Subscribe to Res Obscura
                </a>
              </div>

              <div className="donate-option">
                <div className="donate-option-icon">💳</div>
                <h3>Direct Donation</h3>
                <p>
                  Make a one-time or recurring donation to directly support the development
                  of this tool and future educational projects.
                </p>
                <a
                  href="https://buy.stripe.com/eVqfZhaprgRG7ab1aV4F200"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary donate-btn"
                >
                  Donate via Stripe
                </a>
              </div>
            </div>

            <p className="donate-footer">
              Thank you for your support! Every contribution helps make historical education more accessible.
            </p>
          </div>
          </motion.div>
        </motion.div>
      )}

      {/* Family Tree Modal */}
      {showFamilyTree && personaStack.length > 0 && (
        <motion.div
          className="modal-overlay"
          onClick={() => setShowFamilyTree(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="family-tree-modal-title"
        >
          <motion.div
            className="modal family-tree-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="modal-header">
              <h2 id="family-tree-modal-title">
                <IoPeople style={{ marginRight: '8px' }} />
                Family Tree
              </h2>
              <button className="modal-close" onClick={() => setShowFamilyTree(false)} aria-label="Close dialog">
                <IoClose aria-hidden="true" />
                Close
              </button>
            </div>
            <div className="modal-body family-tree-body">
              <div className="family-tree-visualization">
                {personaStack.map((stackPersona, index) => {
                  const crumb = breadcrumbPath[index];
                  const isCurrentlyViewing = index === currentPersonaIndex;

                  return (
                    <div key={index} className="family-tree-row">
                      {index > 0 && (
                        <div className="family-tree-connector">
                          <div className="connector-line" />
                          <span className="connector-relation">
                            {crumb?.relation || 'Related to'}
                          </span>
                        </div>
                      )}
                      <div
                        className={`family-tree-node ${isCurrentlyViewing ? 'current' : ''}`}
                        onClick={() => {
                          handleBreadcrumbNavigation(index);
                          setShowFamilyTree(false);
                        }}
                      >
                        <div className="tree-node-header">
                          <span className="tree-node-name">{stackPersona.character.name}</span>
                          {isCurrentlyViewing && <span className="viewing-badge">Viewing</span>}
                        </div>
                        <div className="tree-node-details">
                          <span className="tree-node-profession">
                            <span className="profession-emoji">{getProfessionEmoji(stackPersona.character.profession)}</span>
                            {stackPersona.character.profession}
                          </span>
                          <span className="tree-node-separator">•</span>
                          <span className="tree-node-location">{stackPersona.location}, {stackPersona.region}</span>
                        </div>
                        <div className="tree-node-dates">
                          <span className="tree-node-birth">
                            Born: {formatYear(typeof stackPersona.character.birthYear === 'string'
                              ? parseInt(stackPersona.character.birthYear, 10)
                              : (stackPersona.character.birthYear || stackPersona.year - stackPersona.character.age))}
                          </span>
                          <span className="tree-node-separator">•</span>
                          <span className="tree-node-year">
                            Shown in: {formatYear(stackPersona.year)}
                          </span>
                          <span className="tree-node-separator">•</span>
                          <span className="tree-node-age">
                            Age {stackPersona.character.age}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {personaStack.length === 1 && (
                <div className="family-tree-hint">
                  <p>Click on family members (parents, spouse, siblings) in the main view to explore their life stories and build your family tree.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {showSecrets && persona && (
        <motion.div
          className="modal-overlay"
          onClick={() => setShowSecrets(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal secrets-modal two-column-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="modal-header">
              <h2>Character Details</h2>
              <button className="modal-close" onClick={() => setShowSecrets(false)}>
                <IoClose />
                Close
              </button>
            </div>
            <div className="modal-body two-column-layout">
              {/* Left Column: Portrait and Appearance */}
              <div className="left-column-appearance">
                <div
                  className="portrait-section-large clickable-portrait"
                  onClick={handlePortraitClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handlePortraitClick()}
                  title="Click to cycle through expressions"
                >
                  <ProceduralPortrait
                    character={persona.character}
                    size={400}
                    temporaryExpression={expressionCycle[portraitExpressionIndex].expression}
                  />
                  <div className="expression-label">
                    <span className="expression-indicator">
                      {expressionCycle[portraitExpressionIndex].label}
                    </span>
                    <span className="expression-hint">Click to change expression</span>
                  </div>
                </div>

                <div className="secrets-section">
                  <h3>Physical Appearance</h3>
                  <div className="appearance-details-list">
                    <div className="appearance-item">
                      <span className="label">Age</span>
                      <span className="value">{persona.character.age} years old</span>
                    </div>
                    <div className="appearance-item">
                      <span className="label">Gender</span>
                      <span className="value">{persona.character.gender}</span>
                    </div>
                    <div className="appearance-item">
                      <span className="label">Build</span>
                      <span className="value">{persona.character.appearance.build}</span>
                    </div>
                    {persona.character.appearance.height && (
                      <div className="appearance-item">
                        <span className="label">Height</span>
                        <span className="value">{Math.round(persona.character.appearance.height)} cm</span>
                      </div>
                    )}
                    {persona.character.appearance.weight && (
                      <div className="appearance-item">
                        <span className="label">Weight</span>
                        <span className="value">{Math.round(persona.character.appearance.weight)} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="secrets-section">
                  <h3>Facial Features</h3>
                  <div className="appearance-details-list">
                    <div className="appearance-item">
                      <span className="label">Face Shape</span>
                      <span className="value">{persona.character.appearance.faceShape}</span>
                    </div>
                    <div className="appearance-item">
                      <span className="label">Eye Shape</span>
                      <span className="value">{persona.character.appearance.eyeShape}</span>
                    </div>
                    <div className="appearance-item">
                      <span className="label">Eye Color</span>
                      <span className="value">{persona.character.appearance.eyeColor}</span>
                    </div>
                    <div className="appearance-item">
                      <span className="label">Nose Shape</span>
                      <span className="value">{persona.character.appearance.noseShape}</span>
                    </div>
                    {persona.character.appearance.cheekbones && (
                      <div className="appearance-item">
                        <span className="label">Cheekbones</span>
                        <span className="value">{persona.character.appearance.cheekbones}</span>
                      </div>
                    )}
                    {persona.character.appearance.jawline && (
                      <div className="appearance-item">
                        <span className="label">Jawline</span>
                        <span className="value">{persona.character.appearance.jawline}</span>
                      </div>
                    )}
                    {persona.character.appearance.lipShape && (
                      <div className="appearance-item">
                        <span className="label">Lips</span>
                        <span className="value">{persona.character.appearance.lipShape}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="secrets-section">
                  <h3>Hair & Complexion</h3>
                  <div className="appearance-details-list">
                    <div className="appearance-item">
                      <span className="label">Hair Color</span>
                      <span className="value">{persona.character.appearance.hairColor}</span>
                    </div>
                    <div className="appearance-item">
                      <span className="label">Hairstyle</span>
                      <span className="value">{persona.character.appearance.hairstyle}</span>
                    </div>
                    {persona.character.appearance.hairLength && (
                      <div className="appearance-item">
                        <span className="label">Hair Length</span>
                        <span className="value">{persona.character.appearance.hairLength.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {persona.character.appearance.hairTexture && (
                      <div className="appearance-item">
                        <span className="label">Hair Texture</span>
                        <span className="value">{persona.character.appearance.hairTexture}</span>
                      </div>
                    )}
                    {persona.character.appearance.facialHair && persona.character.gender !== 'Female' && (
                      <>
                        <div className="appearance-item">
                          <span className="label">Facial Hair</span>
                          <span className="value">{persona.character.appearance.facialHairStyle?.replace(/_/g, ' ')}</span>
                        </div>
                        {persona.character.appearance.facialHairThickness && (
                          <div className="appearance-item">
                            <span className="label">Facial Hair Thickness</span>
                            <span className="value">{persona.character.appearance.facialHairThickness}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="appearance-item">
                      <span className="label">Skin Tone</span>
                      <span className="value">{persona.character.appearance.skinTone?.replace(/_/g, ' ')}</span>
                    </div>
                    {persona.character.appearance.skinTexture && (
                      <div className="appearance-item">
                        <span className="label">Skin Texture</span>
                        <span className="value">{persona.character.appearance.skinTexture}</span>
                      </div>
                    )}
                  </div>
                </div>

                {persona.character.appearance.jewelry && persona.character.appearance.jewelry.length > 0 && (
                  <div className="secrets-section">
                    <h3>Jewelry</h3>
                    <div className="appearance-details-list">
                      {persona.character.appearance.jewelry.map((piece, idx) => (
                        <div key={idx} className="appearance-item jewelry-item">
                          <span className="label">{piece.type}</span>
                          <span className="value">
                            {piece.style} {piece.material}
                            {piece.gems && piece.gems.length > 0 && ` with ${piece.gems.join(', ')}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {persona.character.appearance.markings && persona.character.appearance.markings.length > 0 && (
                  <div className="secrets-section">
                    <h3>Markings & Scars</h3>
                    <div className="appearance-details-list">
                      {persona.character.appearance.markings.map((marking, idx) => (
                        <div key={idx} className="appearance-item marking-item">
                          <span className="label">{getMarkingTypeLabel(marking.type)}</span>
                          <span className="value">
                            {formatMarkingDescription(marking)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="secrets-section">
                  <h3>Clothing</h3>
                  <div className="appearance-details-list">
                    {persona.character.appearance.garment && (
                      <div className="appearance-item">
                        <span className="label">Garment</span>
                        <span className="value">
                          {persona.character.appearance.garment.adjectives?.join(', ')} {persona.character.appearance.garment.material} {persona.character.appearance.garment.name}
                        </span>
                      </div>
                    )}
                    {persona.character.appearance.headgear && persona.character.appearance.headgear.name !== 'none' && (
                      <div className="appearance-item">
                        <span className="label">Headgear</span>
                        <span className="value">
                          {persona.character.appearance.headgear.adjectives?.join(', ')} {persona.character.appearance.headgear.material} {persona.character.appearance.headgear.name}
                        </span>
                      </div>
                    )}
                    {persona.character.appearance.footwear && (
                      <div className="appearance-item">
                        <span className="label">Footwear</span>
                        <span className="value">
                          {persona.character.appearance.footwear.adjectives?.join(', ')} {persona.character.appearance.footwear.material} {persona.character.appearance.footwear.name}
                        </span>
                      </div>
                    )}
                    {persona.character.appearance.belt && persona.character.appearance.belt.name !== 'none' && (
                      <div className="appearance-item">
                        <span className="label">Belt</span>
                        <span className="value">
                          {persona.character.appearance.belt.adjectives?.join(', ')} {persona.character.appearance.belt.material} {persona.character.appearance.belt.name}
                        </span>
                      </div>
                    )}
                    {persona.character.appearance.accessory && persona.character.appearance.accessory.name !== 'none' && (
                      <div className="appearance-item">
                        <span className="label">Accessory</span>
                        <span className="value">
                          {persona.character.appearance.accessory.adjectives?.join(', ')} {persona.character.appearance.accessory.material} {persona.character.appearance.accessory.name}
                        </span>
                      </div>
                    )}
                    {persona.character.appearance.palette && (
                      <div className="appearance-item">
                        <span className="label">Color Scheme</span>
                        <span className="value">
                          Primary: {persona.character.appearance.palette.primary},
                          Secondary: {persona.character.appearance.palette.secondary},
                          Accent: {persona.character.appearance.palette.accent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Secrets/Background */}
              <div className="right-column-secrets">
                <div className="secrets-section">
                  <h3>Background</h3>
                  <div className="info-list-compact">
                    <div className="info-item">
                      <span className="label">Profession</span>
                      <span className="value">
                        <span className="profession-emoji">{getProfessionEmoji(persona.character.profession)}</span>
                        {persona.character.profession}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Religion</span>
                      <span className="value">
                        {createWikiLink(persona.character.religion, persona.character.religion)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Social Status</span>
                      <span className="value">{persona.character.class || 'Unknown'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Wealth Level</span>
                      <span className="value">{persona.character.wealthLevel}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Birthplace</span>
                      <span className="value">{persona.character.birthplace}</span>
                    </div>
                  </div>
                </div>

                {persona.character.family && persona.character.family.length > 0 && (
                  <div className="secrets-section">
                    <h3>Family</h3>
                    <div className="info-list-compact">
                      {persona.character.family.map((member, idx) => (
                        <div key={idx} className="info-item">
                          <span className="label">{member.relation}</span>
                          <span className="value">
                            {member.name}
                            {member.age && ` (${member.age})`}
                            {member.profession && `, ${getProfessionEmoji(member.profession)} ${member.profession}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="secrets-section">
                  <h3>Abilities & Traits</h3>
                  <p className="attributes-prose">
                    {generateStatDescription(persona.character)}
                  </p>
                </div>

                {persona.character.personality && (
                  <div className="secrets-section">
                    <h3>Personality</h3>
                    <div className="info-list-compact">
                      <div className="info-item">
                        <span className="label">Openness</span>
                        <span className="value">{Math.round(persona.character.personality.openness * 100)}%</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Conscientiousness</span>
                        <span className="value">{Math.round(persona.character.personality.conscientiousness * 100)}%</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Extraversion</span>
                        <span className="value">{Math.round(persona.character.personality.extraversion * 100)}%</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Agreeableness</span>
                        <span className="value">{Math.round(persona.character.personality.agreeableness * 100)}%</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Neuroticism</span>
                        <span className="value">{Math.round(persona.character.personality.neuroticism * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Loading Overlay for Family Member Generation */}
    <AnimatePresence>
      {isGeneratingFamilyMember && (
        <motion.div
          className="family-generation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="generation-spinner-container"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="generation-spinner">
              <IoRefresh />
            </div>
            <p className="generation-message">Generating life history...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Wikipedia Panel */}
    <WikipediaPanel
      articleTitle={wikipediaArticle}
      onClose={() => setWikipediaArticle(null)}
    />

    {/* Language Modal */}
    <AnimatePresence>
      {showLanguageModal && persona?.languageData && (
        <motion.div
          className="language-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLanguageModal(false)}
        >
          <motion.div
            className="language-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="language-modal-close"
              onClick={() => setShowLanguageModal(false)}
            >
              ×
            </button>

            <div className="language-modal-header">
              <h2>{persona.languageData.name}</h2>
              {persona.languageData.nativeName && (
                <p className="language-native-name">{persona.languageData.nativeName}</p>
              )}
            </div>

            <div className="language-modal-body">
              {persona.languageData.historicalContext && (
                <div className="language-section">
                  <h3>Historical Context</h3>
                  <p className="language-context">{persona.languageData.historicalContext}</p>
                </div>
              )}

              <div className="language-details-grid">
                <div className="language-detail-item">
                  <span className="language-detail-label">Family</span>
                  <span className="language-detail-value">{persona.languageData.family}</span>
                </div>

                {persona.languageData.script && (
                  <div className="language-detail-item">
                    <span className="language-detail-label">Script</span>
                    <span className="language-detail-value">
                      {Array.isArray(persona.languageData.script)
                        ? persona.languageData.script.join(', ')
                        : persona.languageData.script}
                    </span>
                  </div>
                )}

                <div className="language-detail-item">
                  <span className="language-detail-label">Period</span>
                  <span className="language-detail-value">
                    {persona.languageData.period[0] < 0 ? `${Math.abs(persona.languageData.period[0])} BCE` : `${persona.languageData.period[0]} CE`}
                    {' – '}
                    {persona.languageData.period[1] === 2025 ? 'Present' :
                     persona.languageData.period[1] < 0 ? `${Math.abs(persona.languageData.period[1])} BCE` : `${persona.languageData.period[1]} CE`}
                  </span>
                </div>

                {persona.languageData.isReconstructed && (
                  <div className="language-detail-item language-reconstructed">
                    <span className="language-detail-label">Status</span>
                    <span className="language-detail-value">Reconstructed Language</span>
                  </div>
                )}
              </div>

              {persona.languageData.regions && persona.languageData.regions.length > 0 && (
                <div className="language-section">
                  <h3>Regions</h3>
                  <div className="language-tags">
                    {persona.languageData.regions.map((region, idx) => (
                      <span key={idx} className="language-tag">{region}</span>
                    ))}
                  </div>
                </div>
              )}

              {persona.languageData.greetings && Object.keys(persona.languageData.greetings).length > 0 && (
                <div className="language-section">
                  <h3>Common Phrases</h3>
                  <div className="language-greetings">
                    {persona.languageData.greetings.hello && (
                      <div className="language-greeting-item">
                        <span className="greeting-label">Hello:</span>
                        <span className="greeting-value">{persona.languageData.greetings.hello}</span>
                      </div>
                    )}
                    {persona.languageData.greetings.goodbye && (
                      <div className="language-greeting-item">
                        <span className="greeting-label">Goodbye:</span>
                        <span className="greeting-value">{persona.languageData.greetings.goodbye}</span>
                      </div>
                    )}
                    {persona.languageData.greetings.yes && (
                      <div className="language-greeting-item">
                        <span className="greeting-label">Yes:</span>
                        <span className="greeting-value">{persona.languageData.greetings.yes}</span>
                      </div>
                    )}
                    {persona.languageData.greetings.no && (
                      <div className="language-greeting-item">
                        <span className="greeting-label">No:</span>
                        <span className="greeting-value">{persona.languageData.greetings.no}</span>
                      </div>
                    )}
                    {persona.languageData.greetings.thanks && (
                      <div className="language-greeting-item">
                        <span className="greeting-label">Thanks:</span>
                        <span className="greeting-value">{persona.languageData.greetings.thanks}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(persona.languageData.predecessors && persona.languageData.predecessors.length > 0) && (
                <div className="language-section">
                  <h3>Evolved From</h3>
                  <div className="language-tags">
                    {persona.languageData.predecessors.map((pred, idx) => (
                      <span key={idx} className="language-tag language-tag-predecessor">
                        {pred.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(persona.languageData.successors && persona.languageData.successors.length > 0) && (
                <div className="language-section">
                  <h3>Evolved Into</h3>
                  <div className="language-tags">
                    {persona.languageData.successors.map((succ, idx) => (
                      <span key={idx} className="language-tag language-tag-successor">
                        {succ.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {persona.languageData.llmPrompt && (
                <div className="language-section">
                  <h3>Linguistic Style</h3>
                  <p className="language-llm-prompt">{persona.languageData.llmPrompt}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Portal-based greeting speech bubble */}
    {showGreetingBubble && getCharacterGreeting() && createPortal(
      <AnimatePresence>
        <motion.div
          className="greeting-speech-bubble-portal"
          style={{
            position: 'fixed',
            top: `${bubblePosition.top}px`,
            left: `${bubblePosition.left}px`,
            zIndex: 10000
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="greeting-text">
            {getCharacterGreeting()!.greeting}
          </div>
          <div className="greeting-caption">
            This is the {getCharacterGreeting()!.languageName} word for hello.
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    )}
  </>
  );
}
