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
  IoLogoGithub,
  IoDocumentText,
  IoDownload,
  IoAlertCircle,
  IoEye,
  IoEar,
  IoBed,
  IoPaw,
  IoSnow,
  IoUmbrella,
  IoThermometer,
  IoSparkles,
  IoTelescope,
  IoHandLeft,
  IoMusicalNotes
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
  GiBattleGear,
  GiMute,
  GiTalk,
  GiWalkingBoot,
  GiBrokenBone,
  GiHandBandage,
  GiSnail,
  GiWeight,
  GiTooth,
  GiSpotedFlower,
  GiHourglass,
  GiLungs,
  GiMountainRoad,
  GiWineGlass,
  GiVirus,
  GiPrayer,
  GiMilkCarton,
  GiMineWagon,
  GiChemicalDrop,
  GiSewingString,
  GiWheat,
  GiQuillInk,
  GiBrain,
  GiTiedScroll,
  GiScrollQuill,
  GiAbacus,
  GiSpellBook,
  GiCandleFlame,
  GiSunrise,
  GiOwl,
  GiBed,
  GiNightSleep,
  GiThirdEye,
  GiCookingPot,
  GiDrinking,
  GiSmokingPipe,
  GiSpiderWeb,
  GiMoneyStack,
  GiAnvil,
  GiPeaceDove,
  GiEyeOfHorus,
  GiFamilyTree,
  GiBabyFace,
  GiCrossMark,
  GiDeathSkull,
  GiRing,
  GiFootprint,
  GiTrail,
  GiShipWheel,
  GiHandcuffs,
  GiPadlock,
  GiPrisoner,
  GiHammerNails,
  GiHerbsBundle,
  GiWaterDrop,
  GiHorseHead,
  GiBowArrow,
  GiBeehive,
  GiMusicalNotes,
  GiHeartPlus,
  GiSandsOfTime,
  GiBallerinaShoes,
  GiSpiralShell,
  GiScarWound,
  GiThreeLeaves,
  GiCurledLeaf,
  GiOpenBook,
  GiRelationshipBounds
} from 'react-icons/gi';
import { generateHistoricalPersona, GenerationParams, HistoricalPersona } from '../services/personaGenerator';
import { DEFAULT_SAMPLING_MODE, type SamplingMode } from '../services/demographyService';
import { getAreaClimate, hemisphereFor, seasonFor } from '../services/climateService';
import { ClimateType } from '../types/enums';
import { HistoricalEra, CulturalZone, Gender } from '../types';
import { generateNpcNameDetailed } from '../generation/common/npcUtils';
import { isEuropeanNameSet, nameKeyOfferedByRegion } from '../constants/characterData/names';
import { ValueNoise } from '../utils/noise';
import { triggerHaptic } from '../utils/deviceUtils';
import { EventImportance, EventKind } from '../constants/characterData/lifeHistoryService';
import { standingRole } from '../constants/characterData/professions';
import { HistoricalPersonaAnnotationRecord } from '../types/personaAnnotation';
import type { LlmTransparencyRecord, PersonaOrientationRecord } from '../types/personaOrientation';
import { periodBucketForYear } from '../constants/personaAnnotationTemporal';
import {
  createAnnotationRecordFromSource,
  generateRandomPersonaAnnotationRecord,
} from '../services/personaAnnotationService';
import { describePromptSource, parsePromptSource } from '../services/promptSourceService';
import {
  generatePersonaAnnotationWithGemini,
  generatePersonaSketchWithGemini,
  generateSourcePersonaWithGemini,
  MODEL_VARIANT_LABELS,
  ModelVariant,
  normalizePersonaAnnotationRecord,
  PersonaGenerationTarget,
  readLastLlmTransparency,
  readModelVariant,
  writeModelVariant,
} from '../services/geminiPersonaMaterialService';
import {
  applyPersonaOrientationToAnnotationRecord,
  assertPersonaOrientationRecord,
  legacyAnnotationToPersonaOrientation,
  personaOrientationRecordToJsonl,
  validatePersonaOrientationRecord,
} from '../services/personaOrientationService';
import {
  AI_ACCESS_REQUIRED_EVENT,
  enableTesterAccessFromUrl,
  type AiAccessRequiredDetail,
  getAiAccessStatus,
  type AiAccessStatus,
} from '../services/aiAccessService';
import { createPastedTextSource, getRandomWikidataPerson, ingestRandomOldBaileySource, ingestUrlSource, OldBaileyRandomFilters, SourceIngestionError } from '../services/sourceIngestionService';
import PixelPortrait, { MARK_HOTSPOT } from './portraitLab/PixelPortrait';
import { portraitMarkFor } from './portraitLab/art/distinctionMark';
import TraitSeals from './TraitSeals';
import HoverPlate from './HoverPlate';
import { traitSeals } from '../utils/traitSeals';
import RosterStrip, { SavePersonaStar } from '../encounter/RosterStrip';
import { loadRoster } from '../encounter/roster';
import { generateStatDescription } from '../utils/statToText';
import { personaSummaryLine } from '../utils/personaSummaryLine';
import MiniLocationMap from './MiniLocationMap';
import { RARITY_COLORS, RARITY_LABELS, UNLABELLED_RARITIES, normalizeRarity } from '../types/attributeTypes';
import { PERSONAL_BELIEFS, IDEOLOGIES, getProfessionEmoji } from '../constants';
import { getLanguageForCharacter } from '../constants/gameData/languages';
import { confidenceBlurb } from '../services/languageAttributionService';
import { describeOrnament } from '../services/ornamentService';
import { principalCity, cityAllegiance } from '../services/birthplaceService';
import { WikipediaPanel } from './WikipediaPanel';
import { getWikipediaArticle } from '../constants/gameData/wikipediaTitles';
import {
  adaptPersonaMaterialRecord,
  MaterialSupportTag,
  normalizeMaterialText,
} from '../services/personaMaterialAdapter';
import { checkPersonaConsistency, ConsistencyIssue } from '../services/personaConsistencyService';
import {
  describeIdeology,
  describeLifeEvent,
  describeParents,
  describePhysicalAppearance,
  getNarrativePronouns,
} from '../services/narrativeTextService';
import { generateNarrativeBiography } from '../services/narrativeBiographyService';
import { polityFormFor, socialStatusFieldLabel } from '../services/socialStatusService';
import { describeYear, getPolityAt, withPolityArticle } from '../services/polityService';
import { PolityBadge } from './PolityBadge';
import { historicalPlaceLabel } from '../constants/gameData/placeLabels';
import { zoneAccent } from '../constants/gameData/zonePalette';
import { devLog } from '../utils/devLog';
import {
  copyTextToClipboard,
  createSharedPersona,
  currentShareId,
  loadSharedPersona,
  removeShareFromCurrentUrl,
  replaceCurrentUrlWithShare,
  sharedPersonaUrl,
} from '../services/sharedPersonaService';
import {
  SHARED_PERSONA_SCHEMA_VERSION,
  SharedPersonaSnapshot,
  StoredSharedPersona,
} from '../types/sharedPersona';
import { getDisplayZone } from '../utils/zoneDisplayUtils';
import type { SpriteAnim, SpriteCommand } from '../encounter/sprite/SpriteCanvas';
import './PersonaGenerator.css';

/**
 * What to call the social-position field for this persona's kind of society.
 * A band has standing, not social status, and printing "Social Status: Band
 * Member" under a heading that promises a rank order overstates what is there.
 */
const EncounterMode = React.lazy(() => import('../encounter/EncounterMode'));
const SpriteTunerPanel = React.lazy(() => import('../encounter/sprite/SpriteTunerPanel'));
const SpriteFigure = React.lazy(() => import('../encounter/sprite/SpriteCanvas'));
// The About header draws its own crowd, which means pulling in the whole sprite
// renderer — worth deferring, since nobody opens About before the first persona.
let aboutSpriteBannerModule: Promise<typeof import('./AboutSpriteBanner')> | null = null;
const loadAboutSpriteBanner = () => {
  aboutSpriteBannerModule ??= import('./AboutSpriteBanner');
  return aboutSpriteBannerModule;
};
const AboutSpriteBanner = React.lazy(loadAboutSpriteBanner);

/**
 * The figure breathes, blinks and glances on its own, but outside a fight
 * nothing ever asks it to shift its weight. Every so often, while the reader
 * is looking at it, hand it a small idle posture — a shrug, a half step, an
 * open hand. Nothing with a target: no lunges, no bows at empty air.
 */
const IDLE_POSTURES: SpriteAnim[] = ['shrug', 'step', 'gesture', 'reach'];

/** The attribute scores, in the order the printed card lists them. */
const ATTRIBUTE_SCORES = [
  { key: 'strength', abbr: 'STR', label: 'Strength' },
  { key: 'dexterity', abbr: 'DEX', label: 'Dexterity' },
  { key: 'constitution', abbr: 'CON', label: 'Constitution' },
  { key: 'intelligence', abbr: 'INT', label: 'Intelligence' },
  { key: 'wisdom', abbr: 'WIS', label: 'Wisdom' },
  { key: 'charisma', abbr: 'CHA', label: 'Charisma' },
  // Next to charisma because it is the other half of the same pair: both are
  // read off the persona's temperament, and the encounter engine adds them
  // together into one charm score.
  { key: 'persuasion', abbr: 'PRS', label: 'Persuasion' },
  { key: 'perception', abbr: 'PER', label: 'Perception' },
  { key: 'luck', abbr: 'LCK', label: 'Luck' },
  { key: 'craftiness', abbr: 'CRF', label: 'Craftiness' },
] as const;

function useIdlePosture(active: boolean): SpriteCommand | null {
  const [command, setCommand] = useState<SpriteCommand | null>(null);

  useEffect(() => {
    if (!active) {
      setCommand(null);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setCommand((prev) => ({
          anim: IDLE_POSTURES[Math.floor(Math.random() * IDLE_POSTURES.length)],
          key: (prev?.key ?? 0) + 1,
        }));
        schedule();
      }, 9000 + Math.random() * 11000);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [active]);

  return command;
}

const statusFieldLabel = (persona: HistoricalPersona): string =>
  socialStatusFieldLabel(polityFormFor({
    year: persona.year,
    culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
    placeLower: `${persona.location ?? ''} ${persona.region ?? ''}`.toLowerCase(),
  }));

type SourceStudioView = 'full' | 'wikipedia' | 'web' | 'text' | 'old_bailey';

const ERAS: { value: HistoricalEra; label: string }[] = [
  { value: 'PREHISTORY' as HistoricalEra, label: 'Neolithic period (Before 3000 BCE)' },
  { value: 'ANTIQUITY' as HistoricalEra, label: 'Ancient world (3000 BCE - 500 CE)' },
  { value: 'MEDIEVAL' as HistoricalEra, label: 'Medieval (500 - 1450)' },
  { value: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra, label: 'Renaissance & Early Modern (1450 - 1750)' },
  { value: 'INDUSTRIAL_ERA' as HistoricalEra, label: 'Industrial Era (1750 - 1900)' },
  { value: 'MODERN_ERA' as HistoricalEra, label: 'Modern Era (1900 - 2030)' },
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

/**
 * Names generated from reconstructed languages carry the linguistic convention
 * of a leading asterisk (*Temür) for an unattested form. Shown bare it reads as
 * a typo, so it gets an explanation on hover.
 */
const RECONSTRUCTED_NAME_TOOLTIP =
  'The asterisk is the linguistic convention for a reconstructed form: this name is built from a language recovered by comparison rather than recorded, so no attested spelling of it exists.';

const renderName = (name: string): React.ReactNode => {
  if (!name || !name.startsWith('*')) return name;
  return (
    <>
      <abbr className="reconstructed-marker" title={RECONSTRUCTED_NAME_TOOLTIP}>*</abbr>
      {name.slice(1)}
    </>
  );
};

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
  IoEye,
  IoEar,
  IoPaw,
  IoSnow,
  IoUmbrella,
  IoThermometer,
  IoSparkles,
  IoTelescope,
  IoHandLeft,
  IoMusicalNotes,
  IoBed,
  IoHammer,
  IoPeople,
  IoWater,
  IoAirplane,
  IoMoonSharp,
  // Game Icons used by the attribute pool
  GiMute,
  GiTalk,
  GiWalkingBoot,
  GiBrokenBone,
  GiHandBandage,
  GiSnail,
  GiWeight,
  GiTooth,
  GiSpotedFlower,
  GiHourglass,
  GiLungs,
  GiMountainRoad,
  GiWineGlass,
  GiVirus,
  GiPrayer,
  GiMilkCarton,
  GiMineWagon,
  GiChemicalDrop,
  GiSewingString,
  GiWheat,
  GiQuillInk,
  GiBrain,
  GiTiedScroll,
  GiScrollQuill,
  GiAbacus,
  GiSpellBook,
  GiCandleFlame,
  GiSunrise,
  GiOwl,
  GiBed,
  GiNightSleep,
  GiThirdEye,
  GiCookingPot,
  GiDrinking,
  GiSmokingPipe,
  GiSpiderWeb,
  GiMoneyStack,
  GiAnvil,
  GiPeaceDove,
  GiEyeOfHorus,
  GiFamilyTree,
  GiBabyFace,
  GiCrossMark,
  GiDeathSkull,
  GiRing,
  GiFootprint,
  GiTrail,
  GiShipWheel,
  GiHandcuffs,
  GiPadlock,
  GiPrisoner,
  GiHammerNails,
  GiHerbsBundle,
  GiWaterDrop,
  GiHorseHead,
  GiBowArrow,
  GiBeehive,
  GiMusicalNotes,
  GiHeartPlus,
  GiSandsOfTime,
  GiBallerinaShoes,
  GiSpiralShell,
  GiScarWound,
  GiThreeLeaves,
  GiCurledLeaf,
  GiOpenBook,
  GiRelationshipBounds,
  // Aliases for compatibility
  FaGlasses: IoGlasses,
  FaHeart: FaHeartbeat, // imported as FaHeartbeat; without this alias Honest and Generous fell back to a star
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

  // Named practices describe themselves better than any generated phrase:
  // "Kohl", "Ta Moko", "Bindi" rather than "Small black face paint (eye band)".
  if (marking.name && typeof marking.name === 'string') return marking.name;

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

/** Which AI action the cost confirmation is standing in front of. */
type AiCostKind = 'schema';
type AiGateState = {
  action: 'biography' | 'schema';
  run?: () => Promise<void>;
};
type RandomDonationMilestone = 10 | 20 | 50;

/**
 * Intentionally remains enabled in production while the supporter flow is
 * being exercised. It records state transitions and quota decisions only—no
 * source text, API keys, persona data, or visitor identifiers.
 */
const logAiFlow = (event: string, details: Record<string, unknown> = {}) => {
  console.info(`[HPG AI flow] ${event} ${JSON.stringify(details)}`);
};

const AI_COST_COPY: Record<AiCostKind, { title: string; lead: string; detail: string; confirm: string }> = {
  schema: {
    title: 'Build the Talkie persona record?',
    lead: 'This asks the model for a compact, evidence-tagged set of fields that can orient a vintage language model toward this persona.',
    detail: 'Your first three persona records are free. After that, each uses three supporter credits.',
    confirm: 'Build persona record',
  },
};

/** Height of the phone toolbar, matching `--topbar-h` in PersonaGenerator.css.
 *  Anything scrolled above this line is behind the toolbar, not merely near
 *  the top of the viewport. */
const MOBILE_TOP_BAR_PX = 53;

const RANDOM_PERSONA_COUNT_KEY = 'hpg_random_persona_clicks_v1';
const RANDOM_DONATION_COPY: Record<RandomDonationMilestone, {
  kicker: string;
  title: string;
  body: string;
  donate: string;
  continue: string;
}> = {
  10: {
    kicker: '10 lives explored',
    title: 'Enjoying the time machine?',
    body: 'You’ve explored 10 historical lives. If the journey has sparked your curiosity, a small donation helps keep it free.',
    donate: 'Donate',
    continue: 'Keep exploring',
  },
  20: {
    kicker: '20 lives explored',
    title: 'Okay, you’re officially a regular.',
    body: 'Twenty personas means you’re getting some mileage from this little history machine. Care to help with its upkeep?',
    donate: 'Chip in',
    continue: 'Maybe later',
  },
  50: {
    kicker: '50 lives explored',
    title: 'Okay but seriously, you should donate',
    body: 'Fifty trips through history is a lot of time travel—and a little real server cost. If this has become your historical rabbit hole, please help fund it.',
    donate: 'Support the project',
    continue: 'Continue exploring',
  },
};

const storedRandomPersonaCount = (): number => {
  try {
    const stored = Number(window.localStorage.getItem(RANDOM_PERSONA_COUNT_KEY));
    return Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
  } catch {
    return 0;
  }
};

/** A stage that fell back to offline generation, and why it did. */
type GenerationFallback = {
  stage: 'record' | 'prose';
  reason: string;
};

type SourceFailureContext = 'wikipedia' | 'url' | 'text' | 'old_bailey';
type SourceFailure = {
  context: SourceFailureContext;
  title: string;
  message: string;
  technicalDetail: string;
  retryable: boolean;
  modelCalled: boolean;
};

const sourceFailureFromError = (error: unknown, context: SourceFailureContext): SourceFailure => {
  const raw = error instanceof Error ? error.message : String(error || 'Unknown source-generation failure.');
  if (error instanceof SourceIngestionError) {
    const title = error.stage === 'discovery'
      ? 'Wikipedia could not choose a person'
      : error.stage === 'extract'
        ? 'The source did not contain readable text'
        : 'The source could not be reached';
    return {
      context,
      title,
      message: error.message,
      technicalDetail: `${error.code}: ${error.technicalDetail || raw}`,
      retryable: error.retryable,
      modelCalled: error.modelCalled,
    };
  }

  const lower = raw.toLowerCase();
  if (lower.includes('validation') || lower.includes('required property') || lower.includes('must be')) {
    return {
      context,
      title: 'Luna returned an unusable record',
      message: 'The source was read, but the model response did not fit the persona contract. The existing persona is unchanged; retrying often produces a valid response.',
      technicalDetail: raw,
      retryable: true,
      modelCalled: true,
    };
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      context,
      title: 'A source service is temporarily busy',
      message: 'The request was throttled before a complete persona could be made. Wait a moment and try again.',
      technicalDetail: raw,
      retryable: true,
      modelCalled: false,
    };
  }
  return {
    context,
    title: context === 'old_bailey' ? 'The Old Bailey persona could not be made' : 'The source persona could not be made',
    message: 'The operation stopped safely and did not replace the persona on screen. You can retry or inspect the technical details below.',
    technicalDetail: raw,
    retryable: true,
    modelCalled: !lower.includes('fetch') && !lower.includes('network'),
  };
};

const FALLBACK_STAGE_LABELS: Record<GenerationFallback['stage'], string> = {
  record: 'Schema record filled offline from source keywords',
  prose: 'Biography written from a local template, not by the model',
};

const SOURCE_FIELD_LABELS: Record<MaterialSupportTag, string> = {
  explicit: 'source-supported',
  'strong-inference': 'strong inference',
  'weak-inference': 'weak inference',
  'synthetic-fill': 'synthetic fill',
  uncertain: 'uncertain',
};

const sourceSupportLabel = (tag?: MaterialSupportTag | string): string =>
  tag && tag in SOURCE_FIELD_LABELS
    ? SOURCE_FIELD_LABELS[tag as MaterialSupportTag]
    : 'uncertain';

type AnnotationCategory = {
  id: string;
  label: string;
  path: Array<string | number>;
  keys?: string[];
};

const ANNOTATION_CATEGORIES: AnnotationCategory[] = [
  { id: 'identity', label: 'Identity And Position', path: ['persona'], keys: ['name_and_address', 'age_and_life_stage', 'gender_role', 'community_identity', 'social_status', 'legal_condition', 'household_and_relations'] },
  { id: 'setting', label: 'Setting', path: ['persona'], keys: ['year', 'place_context', 'current_pressures', 'language_and_literacy'] },
  { id: 'livelihood', label: 'Work And Subsistence', path: ['persona'], keys: ['occupation', 'labor_relation', 'skills_and_tools', 'daily_routine', 'economic_position'] },
  { id: 'material', label: 'Material And Bodily Life', path: ['persona'], keys: ['dwelling', 'food', 'clothing_and_possessions', 'health_and_body'] },
  { id: 'worldview', label: 'Mental And Moral World', path: ['persona'], keys: ['religion_and_ritual', 'horizons', 'moral_assumptions', 'self_conception', 'loyalties_and_obligations', 'concerns_and_desires'] },
  { id: 'conversation', label: 'Conversation', path: ['persona'], keys: ['social_manner', 'voice', 'conversation_frame', 'anachronism_guards'] },
  { id: 'sources', label: 'Sources', path: ['sources'] },
  { id: 'provenance', label: 'Provenance', path: ['provenance'] },
];

const orientationCategoryValue = (record: PersonaOrientationRecord, category: AnnotationCategory): unknown => {
  if (!category.keys) return getPathValue(record, category.path);
  return Object.fromEntries(
    category.keys
      .map(key => [key, (record.persona as unknown as Record<string, unknown>)[key]])
      .filter(([, value]) => value !== undefined)
  );
};

const isPopulatedValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(isPopulatedValue);
  return true;
};

const getPathValue = (source: unknown, path: Array<string | number>): unknown =>
  path.reduce((current: any, key) => current?.[key], source as any);

const transparencyText = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2);

const setPathValue = (source: any, path: Array<string | number>, value: unknown): any => {
  const clone = Array.isArray(source) ? [...source] : { ...source };
  let cursor = clone;
  path.forEach((key, index) => {
    if (index === path.length - 1) {
      cursor[key] = value;
      return;
    }
    const next = cursor[key];
    cursor[key] = Array.isArray(next) ? [...next] : { ...(next || {}) };
    cursor = cursor[key];
  });
  return clone;
};

const supportLevelLabel = (supportLevel: string): string =>
  supportLevel.replace(/_/g, ' ');

const titleCaseDisplay = (value?: string): string =>
  normalizeMaterialText(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && ['and', 'or', 'of', 'in', 'to', 'for', 'with', 'from', 'the', 'a', 'an'].includes(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');

const sourceBasisLabel = (basis?: string): string => {
  const labels: Record<string, string> = {
    synthetic_composite: 'Synthetic Seed',
    wikipedia_or_reference: 'Wikipedia / Reference',
    court_testimony: 'Court Testimony',
    will_or_inventory: 'Will or Inventory',
    tax_or_census: 'Tax or Census',
    parish_or_temple_register: 'Register',
    social_history: 'Social History',
    material_culture: 'Material Culture',
    oral_history: 'Oral History',
    diary_or_letter: 'Diary or Letter',
    newspaper_or_periodical: 'Newspaper',
    travel_account: 'Travel Account',
    ship_log_or_manifest: 'Ship Log',
    legal_code_or_regulation: 'Legal Source',
    map_or_gazetteer: 'Map or Gazetteer',
    image_or_artifact: 'Image or Artifact',
    secondary_synthesis: 'Secondary Synthesis',
    other: 'Source',
  };
  return labels[basis || ''] || titleCaseDisplay(basis);
};

const formatSchemaScalar = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.replace(/_/g, ' ');
  return JSON.stringify(value);
};

const flattenSchemaRows = (value: unknown, prefix: string[] = []): Array<{ path: string; value: string; empty: boolean }> => {
  if (value === undefined || value === null || value === '') {
    return [{ path: prefix.join('.') || 'value', value: '—', empty: true }];
  }
  if (typeof value !== 'object') {
    return [{ path: prefix.join('.') || 'value', value: formatSchemaScalar(value), empty: false }];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [{ path: prefix.join('.') || 'items', value: '—', empty: true }];
    return value.flatMap((item, index) => flattenSchemaRows(item, [...prefix, String(index)]));
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return [{ path: prefix.join('.') || 'object', value: '—', empty: true }];
  return entries.flatMap(([key, child]) => flattenSchemaRows(child, [...prefix, key]));
};

const sourceFromProceduralPersona = (generatedPersona: HistoricalPersona): ReturnType<typeof createPastedTextSource> => {
  const character = generatedPersona.character;
  const sourceText = [
    `Procedural persona seed for ${character.name}.`,
    `Year: ${generatedPersona.year}.`,
    `Era: ${generatedPersona.era}.`,
    `Region: ${generatedPersona.region}.`,
    `Location: ${generatedPersona.location}.`,
    `Cultural zone: ${generatedPersona.culturalZone}.`,
    `Age: ${character.age}.`,
    `Gender: ${character.gender}.`,
    `Profession: ${character.profession}.`,
    `Social class: ${character.socialClass}.`,
    `Religion: ${character.religion}.`,
    `Traits: ${((character as any).traits || character.attributes || []).map((trait: any) => trait.name || trait.id || String(trait)).join(', ') || 'none listed'}.`,
    `Beliefs: ${(character.beliefs || []).map((belief: any) => belief.beliefId || String(belief)).join(', ') || 'none listed'}.`,
    `Life events: ${(character.lifeEvents || []).map(event => `${event.year}: ${event.event}`).join(' | ') || 'none listed'}.`,
    `Health: ${character.diseaseHealth?.currentDiseases?.map(disease => disease.disease.name).join(', ') || 'none listed'}.`,
    `This is a synthetic procedural seed generated by the application, not an external historical document. Preserve its core facts and elaborate it as a compact persona-orientation record, marking unsupported details as synthetic.`,
  ].join('\n');

  return {
    title: `Procedural seed: ${character.name}, ${generatedPersona.region}, ${generatedPersona.year}`,
    text: sourceText,
    sourceBasis: 'synthetic_composite',
    extractionMethod: 'mixed',
    citationLabel: `Procedural seed: ${character.name}`,
    reliabilityNotes: 'Synthetic procedural seed generated inside the application. Use as structured input for schema completion, not as documentary evidence.',
  };
};

/**
 * The sampled social status, where it names a privileged order.
 *
 * `socialStatusService` already renders status in the vocabulary of the society
 * that held it — Gentry in a commercial economy, Chiefly Lineage in a chiefdom,
 * Lineage Head in a tribal one — so this only has to decide which of those
 * words describe standing above the common run. Merchant deliberately does not:
 * a merchant is a trade, and a card that badges every shopkeeper has stopped
 * saying anything.
 */
const ELITE_STATUS_LABELS = new Set([
  'Noble', 'Gentry', 'Upper Class', 'Chiefly Lineage', 'Lineage Head', 'Patrician',
]);

const eliteStatusStanding = (socialClass?: string): { label: string; note: string } | null => {
  const label = (socialClass || '').trim();
  if (!ELITE_STATUS_LABELS.has(label)) return null;
  return {
    label,
    note: 'Born into the order that held land, office or rank in this society — the local word for it, not a translated title.',
  };
};

const capitalizeFirst = (text: string): string =>
  (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/** "1 in 10" for a share, in the same voice as the draw odds above the card. */
const formatShareAsOdds = (share: number): string => {
  if (share <= 0) return 'almost nobody';
  if (share >= 0.4) return `${Math.round(share * 100)}%`;
  const oneIn = Math.round(1 / share);
  return `1 in ${oneIn}`;
};

const splitFullName = (fullName: string): { givenName?: string; familyName?: string } => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { givenName: parts[0] };
  return {
    givenName: parts.slice(0, -1).join(' '),
    familyName: parts[parts.length - 1],
  };
};

const ageBandForAge = (age: number): string => {
  if (age < 13) return 'child';
  if (age < 18) return 'adolescent';
  if (age < 30) return 'young_adult';
  if (age < 45) return 'adult';
  if (age < 60) return 'middle_aged';
  return 'elder';
};

const genderRoleForCharacter = (gender: string, age: number): string => {
  const ageLabel = age < 18 ? 'adolescent' : 'adult';
  if (gender === 'Female') return `${ageLabel} woman`;
  if (gender === 'Male') return `${ageLabel} man`;
  return `${ageLabel} person`;
};

const normalizeDisplayZone = (zone: string): CulturalZone | undefined => {
  const normalized = zone.toUpperCase().replace(/[\s-]+/g, '_') as CulturalZone;
  const allowed: CulturalZone[] = [
    'EUROPEAN',
    'EAST_ASIAN',
    'MENA',
    'NORTH_AMERICAN_PRE_COLUMBIAN',
    'NORTH_AMERICAN_COLONIAL',
    'OCEANIA',
    'SOUTH_ASIAN',
    'SOUTHEAST_ASIAN',
    'SOUTH_AMERICAN',
    'SUB_SAHARAN_AFRICAN',
  ];
  return allowed.includes(normalized) ? normalized : undefined;
};

/**
 * Did this persona's name come out of a set the region never offered?
 *
 * This used to be a hand-written list of about forty-five English given names
 * and a dozen surnames, tested against the finished string. It could only ever
 * catch the spellings somebody had thought of, and it did not catch the one
 * that prompted this: an Egyptian dock worker in 1950 called Nicholas Mason,
 * whose given name, surname, father, mother and wife were all missed, because
 * none of the six were on the list.
 *
 * The generator records which tradition it drew from, and the region table says
 * which traditions that region offers, so the question can be answered exactly
 * instead of guessed. This also stops the check destroying the cases it should
 * leave alone — a French name in colonial Algiers or a Greek one in Alexandria
 * is offered by those rules on purpose, at the low weight those communities
 * actually had, and the old spelling test would have thrown both away.
 */
const cameFromUnofferedNameSet = (persona: HistoricalPersona, zone: CulturalZone): boolean => {
  const nameKey = (persona.character as { nameKey?: string }).nameKey;
  if (!nameKey || !isEuropeanNameSet(nameKey)) return false;
  return !nameKeyOfferedByRegion(zone, persona.region, persona.year, nameKey, persona.location);
};

const seedFromPersonaContext = (persona: HistoricalPersona): number => {
  const seedText = [
    persona.year,
    persona.region,
    persona.location,
    persona.character.gender,
    persona.character.profession,
  ].join('|');
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const repairSyntheticSeedName = (persona: HistoricalPersona): HistoricalPersona => {
  const culturalZone = normalizeDisplayZone(persona.culturalZone);
  if (!culturalZone || culturalZone === 'EUROPEAN') return persona;
  if (!cameFromUnofferedNameSet(persona, culturalZone)) return persona;

  const repaired = structuredClone(persona) as HistoricalPersona;
  const gender = repaired.character.gender === 'Female' ? 'Female' : 'Male';
  const baseSeed = seedFromPersonaContext(repaired);

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateNpcNameDetailed(
      gender,
      culturalZone,
      repaired.region,
      repaired.year,
      new ValueNoise(baseSeed + attempt * 7919),
      undefined,
      { location: repaired.location }
    );
    // Judged by where the redraw came from, not by how it reads — the same
    // test that got us here, so a redraw cannot be accepted for a reason the
    // original was rejected for.
    if (candidate.full && nameKeyOfferedByRegion(culturalZone, repaired.region, repaired.year, candidate.nameKey, repaired.location)) {
      repaired.character.name = candidate.full;
      (repaired.character as { nameKey?: string }).nameKey = candidate.nameKey;
      return repaired;
    }
  }

  return repaired;
};

const appendSyntheticEvidence = (
  record: HistoricalPersonaAnnotationRecord,
  fieldPath: string,
  notes: string
) => {
  record.field_evidence = [
    ...(record.field_evidence || []).filter(item => item.field_path !== fieldPath),
    {
      field_path: fieldPath,
      support_level: 'synthetic_fill',
      confidence: 'speculative',
      notes,
    },
  ];
};

const lockProceduralSeedRecord = (
  record: HistoricalPersonaAnnotationRecord,
  proceduralPersona: HistoricalPersona
): HistoricalPersonaAnnotationRecord => {
  const locked = structuredClone(record) as HistoricalPersonaAnnotationRecord;
  const character = proceduralPersona.character;
  const { givenName, familyName } = splitFullName(character.name);
  const culturalZone = normalizeDisplayZone(proceduralPersona.culturalZone);
  const languageData = culturalZone
    ? getLanguageForCharacter(
      culturalZone,
      proceduralPersona.year,
      proceduralPersona.region,
      proceduralPersona.location,
      character.name,
      character.profession
    )
    : undefined;

  locked.source.title = `Procedural seed: ${character.name}, ${proceduralPersona.region}, ${proceduralPersona.year}`;
  locked.source.citation_label = `Procedural seed: ${character.name}`;
  locked.source.source_basis = 'synthetic_composite';
  locked.source.source_date = String(proceduralPersona.year);
  locked.source.source_reliability_notes = 'Synthetic procedural seed generated inside the application; not an external historical document.';
  locked.annotation.overall_confidence = 'speculative';
  locked.annotation.completion_status = 'draft';
  locked.annotation.annotation_notes = 'AI filled schema gaps from a locked procedural seed. Seed identity, date, place, profession, religion, and demographic fields were preserved by the application.';

  locked.persona_seed.identity_name = {
    ...locked.persona_seed.identity_name,
    given_name: givenName,
    family_name: familyName,
    full_name: character.name,
    name_basis: 'locked_procedural_seed',
    support_level: 'synthetic_fill',
    confidence: 'speculative',
  };
  locked.persona_seed.temporal = {
    ...locked.persona_seed.temporal,
    period_bucket: periodBucketForYear(proceduralPersona.year),
    decade: Math.floor(proceduralPersona.year / 10) * 10,
    specific_year: proceduralPersona.year,
    date_basis: 'synthetic_within_period',
  };
  // The polity has to be resolved here rather than inherited. The record this
  // locks was built for a randomly chosen region, so without this a persona
  // born in Kyoto could carry that region's state into the prompt.
  const polity = getPolityAt({
    year: proceduralPersona.year,
    region: proceduralPersona.region,
    location: proceduralPersona.location,
    culturalZone,
  });
  locked.persona_seed.place = {
    ...locked.persona_seed.place,
    region: proceduralPersona.region,
    polity: polity?.name,
    settlement_or_locality: proceduralPersona.location,
    place_notes: [
      `Locked to procedural seed location ${proceduralPersona.location}, ${proceduralPersona.region}.`,
      polity && `Under ${withPolityArticle(polity.name)} here since ${describeYear(polity.since)}.`,
      locked.persona_seed.place.place_notes,
    ].filter(Boolean).join(' ').trim(),
  };
  appendSyntheticEvidence(
    locked,
    '/persona_seed/place/polity',
    polity
      ? `Resolved from the seed region and year ${proceduralPersona.year}, not from a source document.`
      : 'No state is recorded for this region and year; the field is left empty rather than guessed.'
  );
  locked.persona_seed.social_identity = {
    ...locked.persona_seed.social_identity,
    age_band: ageBandForAge(character.age),
    estimated_age: character.age,
    gender_role: genderRoleForCharacter(character.gender, character.age),
    religious_or_communal_identity: character.religion,
    languages: languageData?.name ? [languageData.name] : locked.persona_seed.social_identity.languages,
  };
  locked.persona_seed.work = {
    ...locked.persona_seed.work,
    primary_occupation: character.profession,
  };
  locked.persona_seed.social_position = {
    economic_security: locked.persona_seed.social_position?.economic_security || 'uncertain',
    autonomy: locked.persona_seed.social_position?.autonomy || 'uncertain',
    local_status_detail: character.socialClass || character.class || locked.persona_seed.social_position?.local_status_detail,
  };
  locked.persona_seed.summary = `${character.name} is a synthetic procedural persona seed: a ${character.age}-year-old ${character.gender.toLowerCase()} ${character.profession} in ${proceduralPersona.location}, ${proceduralPersona.region}, in ${proceduralPersona.year}.`;
  locked.evidence = {
    ...locked.evidence,
    confidence: 'speculative',
    basis_summary: 'Synthetic procedural seed converted into a schema record; identity and core constraints were locked to the original generated persona.',
    bias_flags: Array.from(new Set([...(locked.evidence.bias_flags || []), 'synthetic_composite', 'model_synthesized_gaps', 'not_documentary_evidence'])),
    inference_notes: 'Use as a schema-complete procedural persona, not as archival evidence.',
  };

  [
    '/persona_seed/identity_name',
    '/persona_seed/temporal',
    '/persona_seed/place',
    '/persona_seed/social_identity',
    '/persona_seed/work/primary_occupation',
    '/source/title',
  ].forEach(path => appendSyntheticEvidence(locked, path, 'Locked from the original procedural random persona seed.'));

  return normalizePersonaAnnotationRecord(locked) as HistoricalPersonaAnnotationRecord;
};

const lockProceduralOrientationRecord = (
  record: PersonaOrientationRecord,
  proceduralPersona: HistoricalPersona
): PersonaOrientationRecord => {
  const locked = structuredClone(record) as PersonaOrientationRecord;
  const character = proceduralPersona.character;
  const culturalZone = normalizeDisplayZone(proceduralPersona.culturalZone);
  const languageData = culturalZone
    ? getLanguageForCharacter(
      culturalZone,
      proceduralPersona.year,
      proceduralPersona.region,
      proceduralPersona.location,
      character.name,
      character.profession
    )
    : undefined;
  const polity = getPolityAt({
    year: proceduralPersona.year,
    region: proceduralPersona.region,
    location: proceduralPersona.location,
    culturalZone,
  });

  locked.persona.name_and_address.full_name = character.name;
  locked.persona.age_and_life_stage = {
    age: character.age,
    life_stage: ageBandForAge(character.age).replace(/_/g, ' '),
  };
  locked.persona.gender_role = genderRoleForCharacter(character.gender, character.age);
  locked.persona.year = proceduralPersona.year;
  locked.persona.place_context = {
    ...locked.persona.place_context,
    locality: proceduralPersona.location,
    region: proceduralPersona.region,
    polity: polity?.name,
  };
  locked.persona.social_status = character.socialClass || character.class || locked.persona.social_status;
  locked.persona.occupation = character.profession;
  locked.persona.religion_and_ritual = character.religion;
  if (languageData?.name) {
    locked.persona.language_and_literacy.languages = [languageData.name];
  }

  const lockedPaths = [
    '/persona/name_and_address',
    '/persona/age_and_life_stage',
    '/persona/gender_role',
    '/persona/year',
    '/persona/place_context',
    '/persona/social_status',
    '/persona/occupation',
    '/persona/religion_and_ritual',
    '/persona/language_and_literacy',
  ];
  locked.provenance = [
    ...locked.provenance.filter(item => !lockedPaths.includes(item.field_path)),
    ...lockedPaths.map(field_path => ({
      field_path,
      support: 'synthetic' as const,
      confidence: 'speculative' as const,
      source_id: locked.sources[0]?.source_id,
      note: 'Locked from the original procedural persona seed.',
    })),
  ].slice(0, 20);
  return assertPersonaOrientationRecord(locked);
};

export default function PersonaGenerator() {
  const [persona, setPersona] = useState<HistoricalPersona | null>(null);
  const [encounterPair, setEncounterPair] = useState<[HistoricalPersona, HistoricalPersona] | null>(null);
  const [encounterHint, setEncounterHint] = useState(false);
  const [showSpriteTuner, setShowSpriteTuner] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'Digit1' && !/input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? '')) {
        e.preventDefault();
        setShowSpriteTuner((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [params, setParams] = useState<Partial<GenerationParams>>({});
  const [samplingMode, setSamplingMode] = useState<SamplingMode>(DEFAULT_SAMPLING_MODE);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Light mode by default
  const [showAbout, setShowAbout] = useState(false);
  const openAbout = () => {
    // Do not start the modal transition while its lazy hero is still swapping
    // out of Suspense. Pointer/focus handlers normally preload it; awaiting the
    // same memoized promise also covers a fast tap on a cold cache.
    void loadAboutSpriteBanner().then(() => setShowAbout(true));
  };
  const [showDonate, setShowDonate] = useState(() => window.location.pathname === '/donate');
  const [showSecrets, setShowSecrets] = useState(false);
  const [hourglassRotation, setHourglassRotation] = useState(0);
  const [sandAnimationKey, setSandAnimationKey] = useState(0); // Key to restart animation on flip
  const [portraitExpressionIndex, setPortraitExpressionIndex] = useState(0);
  const [mainPortraitHoverExpression, setMainPortraitHoverExpression] = useState<string | undefined>(undefined);
  const [portraitBackdropColor, setPortraitBackdropColor] = useState('#5c6272');
  const [showGreetingBubble, setShowGreetingBubble] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const [annotationRecord, setAnnotationRecord] = useState<HistoricalPersonaAnnotationRecord | null>(null);
  const [orientationRecord, setOrientationRecord] = useState<PersonaOrientationRecord | null>(null);
  const [llmTransparency, setLlmTransparency] = useState<LlmTransparencyRecord | null>(null);
  const [showLlmTransparency, setShowLlmTransparency] = useState(false);
  const [llmCopyStatus, setLlmCopyStatus] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceIngestionStatus, setSourceIngestionStatus] = useState<string | null>(null);
  const [sourceFailure, setSourceFailure] = useState<SourceFailure | null>(null);
  const [showMaterialJson, setShowMaterialJson] = useState(false);
  const [sourceTarget, setSourceTarget] = useState<PersonaGenerationTarget>('named_subject');
  const [oldBaileyFilters, setOldBaileyFilters] = useState<OldBaileyRandomFilters>({
    gender: 'any',
    decade: '',
    crime: 'any',
    personaAngle: 'ordinary_person_from_source_world',
  });
  const [oldBaileySelectionActive, setOldBaileySelectionActive] = useState(false);
  const [preferredMoment, setPreferredMoment] = useState('');
  const [useGeminiExtraction, setUseGeminiExtraction] = useState(true);
  const [sourcePortraitUrl, setSourcePortraitUrl] = useState<string | null>(null);
  const [sourcePortraitAttribution, setSourcePortraitAttribution] = useState<string | null>(null);
  const [personaSketch, setPersonaSketch] = useState<string | null>(null);
  // Which parts of this persona came from the offline fallback rather than the
  // model. Kept next to the biography so a failed call cannot masquerade as a
  // successful one.
  const [generationFallbacks, setGenerationFallbacks] = useState<GenerationFallback[]>([]);
  const [modelVariant, setModelVariant] = useState<ModelVariant>(() => readModelVariant());
  const selectedModelLabel = MODEL_VARIANT_LABELS[modelVariant];
  const [costConfirm, setCostConfirm] = useState<{ kind: AiCostKind; run: () => Promise<void> } | null>(null);
  const [aiAccess, setAiAccess] = useState<AiAccessStatus | null>(null);
  const [aiGate, setAiGate] = useState<AiGateState | null>(null);
  const aiGateBeforeDonateRef = useRef<AiGateState | null>(null);
  const [randomDonationMilestone, setRandomDonationMilestone] = useState<RandomDonationMilestone | null>(null);
  const randomPersonaCountRef = useRef<number | null>(null);
  if (randomPersonaCountRef.current === null) {
    randomPersonaCountRef.current = storedRandomPersonaCount();
  }
  const [editableJsonl, setEditableJsonl] = useState('');
  const [fieldEditStatus, setFieldEditStatus] = useState<string | null>(null);
  const [isSourceGenerating, setIsSourceGenerating] = useState(false);
  const [categoryEditDrafts, setCategoryEditDrafts] = useState<Record<string, string>>({});
  const [sourcePanelCollapsed, setSourcePanelCollapsed] = useState(true);
  const [sourceStudioView, setSourceStudioView] = useState<SourceStudioView>('full');
  const sourcePanelRef = useRef<HTMLDivElement>(null);
  const [sharedPersonaId, setSharedPersonaId] = useState<string | null>(() => currentShareId());
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isLoadingSharedPersona, setIsLoadingSharedPersona] = useState(
    () => new URLSearchParams(window.location.search).has('p')
  );
  const [sharedPersonaError, setSharedPersonaError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const initialPersonaLoadStarted = useRef(false);

  /* Phone chrome. `showMobileActions` drives the bottom bar, which stands in
     for the generation controls once they have scrolled out of the document;
     `showMobileOdds` reveals the draw-odds line, which phones hide until the
     date is tapped. Both render at every width — the stylesheet takes them
     out of the layout above 600px — so there is no width state to keep in
     sync with the media query. */
  const controlsRef = useRef<HTMLDivElement>(null);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showMobileOdds, setShowMobileOdds] = useState(false);

  useEffect(() => {
    logAiFlow('dialog state changed', {
      donationOpen: showDonate,
      gateAction: aiGate?.action || null,
      costConfirmationOpen: Boolean(costConfirm),
      generating: isSourceGenerating,
    });
  }, [showDonate, aiGate?.action, costConfirm, isSourceGenerating]);

  useEffect(() => {
    if (!aiGate && !showDonate) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const selector = showDonate ? '.donate-support-overlay' : '.ai-support-overlay';
      const overlay = document.querySelector<HTMLElement>(selector);
      const card = overlay?.querySelector<HTMLElement>('.modal') || null;
      const style = card ? window.getComputedStyle(card) : null;
      const rect = card?.getBoundingClientRect();
      logAiFlow('dialog DOM check', {
        selector,
        overlayFound: Boolean(overlay),
        cardFound: Boolean(card),
        display: style?.display || null,
        visibility: style?.visibility || null,
        opacity: style?.opacity || null,
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [aiGate, showDonate]);

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    /* The listener reads a rect per scroll event but only touches state when
       the answer flips, so a full-page flick costs one render rather than one
       per frame. `.controls` encloses the Source Studio panel and so changes
       height when it opens, which is why the boundary is measured each time
       rather than cached against `scrollY`. */
    let showing = false;
    const update = () => {
      // Gone once its last pixel has passed under the toolbar, not once it has
      // left the viewport — the toolbar covers the top 53px.
      const gone = el.getBoundingClientRect().bottom < MOBILE_TOP_BAR_PX;
      if (gone === showing) return;
      showing = gone;
      setShowMobileActions(gone);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const openMobileSourceStudio = () => {
    setSourceStudioView('full');
    setSourcePanelCollapsed(false);
    // Wait for the expanded workspace to enter the layout before bringing it
    // below the sticky toolbar.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        sourcePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const materialAdapter = annotationRecord ? adaptPersonaMaterialRecord(annotationRecord, {
    useSourceTitleAsName: sourceTarget === 'named_subject',
  }) : null;
  const materialOverrides = materialAdapter?.displayOverrides;

  const sourceFieldTag = (fieldPath: string): MaterialSupportTag | null =>
    materialAdapter?.provenanceForField(fieldPath) || null;

  const renderSourceFieldTag = (fieldPath: string, options: { suppressSynthetic?: boolean } = {}) => {
    const tag = sourceFieldTag(fieldPath);
    if (!tag) return null;
    if (options.suppressSynthetic && tag === 'synthetic-fill') return null;
    return <span className={`source-field-tag source-field-tag-${tag}`}>{sourceSupportLabel(tag)}</span>;
  };

  const sourceLanguageLabel = materialOverrides?.languageLabel;
  const sourceLanguageData = materialOverrides?.languageData;
  const sourcePossessions = materialOverrides?.possessions || [];
  const sourceClothingDetail = materialOverrides?.clothingDetail || '';
  const sourceAttributes = materialOverrides?.attributes || [];
  const sourceIdeology = materialOverrides?.worldviewDescription || '';
  const isSyntheticAnnotation = annotationRecord?.source.source_basis === 'synthetic_composite';

  /**
   * The equipment column runs down the whole page, so what it shows has to
   * earn its place. Clothing already fills the top panel; below it we show the
   * two most telling things the persona is carrying and no more than four
   * inventory lines. A slinger's full kit is eleven items, and printing all of
   * them says less about them than the first two do.
   */
  const ACCESSORY_PRIORITY = ['main_hand', 'belt', 'off_hand', 'necklace', 'accessory', 'ring1', 'back'];
  const MAX_ACCESSORIES = 2;
  const MAX_INVENTORY = 4;

  const visibleAccessories = useMemo(() => {
    const entries = Object.entries(persona?.character?.equippedItems || {})
      .filter(([slot]) => !['head', 'torso', 'legs', 'feet', 'cloak'].includes(slot.toLowerCase()))
      .filter((entry): entry is [string, { name: string }] => Boolean(entry[1] && (entry[1] as any).name))
      .filter(([, item]) => item.name.toLowerCase() !== 'none');
    const rank = (slot: string) => {
      const index = ACCESSORY_PRIORITY.indexOf(slot.toLowerCase());
      return index === -1 ? ACCESSORY_PRIORITY.length : index;
    };
    return entries.sort((a, b) => rank(a[0]) - rank(b[0])).slice(0, MAX_ACCESSORIES);
  }, [persona]);

  const visibleInventory = useMemo(
    () => (persona?.character?.inventory || []).slice(0, MAX_INVENTORY),
    [persona]
  );
  const hiddenInventoryCount = Math.max(
    0,
    (persona?.character?.inventory?.length || 0) - MAX_INVENTORY
  );

  /**
   * The state claiming this place in this year. Undefined for most of
   * prehistory and for the regions that had no state, in which case the header
   * simply does not carry a badge.
   */
  const headerPolity = useMemo(() => (persona
    ? getPolityAt({
      year: persona.year,
      region: persona.region,
      location: persona.location,
      culturalZone: normalizeDisplayZone(persona.culturalZone),
    })
    : undefined), [persona]);

  const updateOldBaileyFilters = (updater: (filters: OldBaileyRandomFilters) => OldBaileyRandomFilters) => {
    setOldBaileySelectionActive(true);
    setOldBaileyFilters(updater);
  };
  const consistencyIssues = useMemo<ConsistencyIssue[]>(() => (
    persona && annotationRecord
      ? checkPersonaConsistency({ record: annotationRecord, persona, target: sourceTarget })
      : []
  ), [annotationRecord, persona, sourceTarget]);
  const annotationCategories = useMemo(() => {
    if (!orientationRecord) return [];
    return ANNOTATION_CATEGORIES
      .map(category => ({
        ...category,
        value: orientationCategoryValue(orientationRecord, category),
        populated: isPopulatedValue(orientationCategoryValue(orientationRecord, category)),
      }));
  }, [orientationRecord]);

  // Ref for portrait container to calculate bubble position
  const portraitContainerRef = useRef<HTMLDivElement>(null);
  const personaCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCategoryEditDrafts({});
  }, [orientationRecord]);

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

  const detailsIdlePosture = useIdlePosture(showSecrets && !!persona);

  // The one or two scores this person is genuinely off the scale on. Usually
  // none, which is the point — see `traitSeals`.
  const portraitSeals = useMemo(
    () => traitSeals(persona?.character as any),
    [persona?.character]
  );

  /**
   * What the mark in the portrait's corner is claiming, if there is one.
   *
   * Two different things put a mark there and they say different sentences:
   * a rare *standing* — the gold star or the diamond — is a fact about the
   * society, and the persona's own rarity is a fact about the person. Asking
   * `portraitMarkFor` with the same three inputs the portrait itself uses is
   * what keeps the plate from describing a mark that is not on screen.
   */
  const portraitMark = useMemo(() => {
    if (!persona) return null;
    const character = persona.character as any;
    const tier = portraitMarkFor(character?.distinctionShare, character?.profession, character?.rarityTier);
    if (!tier) return null;

    if (tier === 'star' || tier === 'diamond') {
      if (persona.office) {
        return {
          title: persona.office.role,
          lines: [
            `${capitalizeFirst(persona.office.gloss)}.`,
            `Roughly ${formatShareAsOdds(persona.office.trueShare)} human lives were lived in such a place.`,
          ],
        };
      }
      const standing = persona.distinction;
      return {
        title: standing?.label || 'A rare standing',
        lines: standing
          ? [standing.clause, `Roughly ${formatShareAsOdds(standing.share)} of people here held this standing.`]
          : ['Held by a very small share of people here.'],
      };
    }

    const rarity = persona.rarity;
    return {
      title: `1 in ${rarity?.oneIn.toLocaleString() ?? '—'} people`,
      lines: rarity?.reasons?.length ? rarity.reasons : ['Unusual across the whole run of scores.'],
    };
  }, [persona]);

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

  const [activeTab, setActiveTab] = useState<BiographyTab>('biography');
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

  const restoreSharedPersona = (stored: StoredSharedPersona) => {
    const snapshot = stored.snapshot;
    const restoredPersona = snapshot.persona;
    const restoredRecord = snapshot.annotationRecord || null;
    const restoredOrientation = snapshot.personaOrientationRecord
      || (restoredRecord ? legacyAnnotationToPersonaOrientation(restoredRecord) : null);

    setPersona(restoredPersona);
    setParams({});
    setAnnotationRecord(restoredRecord);
    setOrientationRecord(restoredOrientation);
    setEditableJsonl(restoredOrientation ? personaOrientationRecordToJsonl(restoredOrientation) : '');
    setPersonaSketch(snapshot.personaSketch || null);
    setSourcePortraitUrl(snapshot.sourcePortraitUrl || null);
    setSourcePortraitAttribution(snapshot.sourcePortraitAttribution || null);
    setSourceTarget(snapshot.sourceTarget || 'named_subject');
    setSourceTitle(restoredRecord?.source.title || '');
    setSourceUrl(restoredRecord?.source.url || '');
    // Raw pasted or extracted source text is deliberately never part of a share.
    setSourceText('');
    setOldBaileySelectionActive(false);
    setSourcePanelCollapsed(true);
    setSourceStudioView('full');
    setFieldEditStatus(restoredRecord ? 'Loaded from a public persona share.' : null);
    setSourceIngestionStatus(
      restoredRecord
        ? `Loaded shared persona and evidence record for ${restoredPersona.character.name}.`
        : `Loaded shared procedural persona ${restoredPersona.character.name}.`
    );
    setPersonaStack([restoredPersona]);
    setCurrentPersonaIndex(0);
    setBreadcrumbPath([{ name: restoredPersona.character.name, index: 0 }]);
    setActiveTab('biography');
    setWikipediaArticle(null);
    setDeathRevealState('prompt');
    setDeathInfo(null);
    setSamplingMode(snapshot.samplingMode || DEFAULT_SAMPLING_MODE);
    setSharedPersonaId(stored.id);
    setSharedPersonaError(null);
  };

  const resetSharedPersonaState = () => {
    setSharedPersonaId(null);
    setSharedPersonaError(null);
    setShareStatus(null);
    removeShareFromCurrentUrl();
  };

  // Restore exact shared state when ?p= is present; otherwise generate the
  // usual fast procedural landing persona. The ref prevents React Strict Mode
  // from issuing the load twice; the request intentionally survives Strict
  // Mode's simulated effect cleanup so its result is not discarded.
  useEffect(() => {
    if (initialPersonaLoadStarted.current) return;
    initialPersonaLoadStarted.current = true;
    const requestedId = new URLSearchParams(window.location.search).get('p');

    if (!requestedId) {
      setIsLoadingSharedPersona(false);
      generateProceduralOnly();
      return;
    }

    const validId = currentShareId();
    if (!validId) {
      setIsLoadingSharedPersona(false);
      setSharedPersonaError('This persona link is malformed.');
      return;
    }

    setIsLoadingSharedPersona(true);
    loadSharedPersona(validId)
      .then(stored => {
        restoreSharedPersona(stored);
      })
      .catch(error => {
        setPersona(null);
        setSharedPersonaId(null);
        setSharedPersonaError(
          error instanceof Error ? error.message : 'This shared persona could not be loaded.'
        );
      })
      .finally(() => {
        setIsLoadingSharedPersona(false);
      });
  }, []);

  useEffect(() => {
    if (!shareStatus) return undefined;
    const timer = window.setTimeout(() => setShareStatus(null), 4200);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  useEffect(() => {
    let active = true;
    const testerRequested = new URLSearchParams(window.location.hash.replace(/^#/, '')).has('tester');
    enableTesterAccessFromUrl()
      .then(async unlocked => ({
        access: unlocked || await getAiAccessStatus(),
        newlyUnlocked: Boolean(unlocked),
      }))
      .then(({ access, newlyUnlocked }) => {
        if (active) setAiAccess(access);
        if (active && newlyUnlocked) {
          setSourceIngestionStatus('Deployed tester access enabled for this browser. AI usage will not consume free runs or supporter credits.');
        }
      })
      .catch(error => {
        if (active && testerRequested) {
          setSourceIngestionStatus(error instanceof Error ? error.message : 'Could not enable deployed tester access.');
        }
        // The generation endpoint remains authoritative if this advisory read
        // is unavailable.
      });

    const handleRequired = (event: Event) => {
      const { access, action } = (event as CustomEvent<AiAccessRequiredDetail>).detail;
      logAiFlow('generation route required supporter access', {
        action,
        canUseBiography: access?.canUseBiography ?? null,
        canUseSchema: access?.canUseSchema ?? null,
      });
      if (access) setAiAccess(access);
      setAiGate({ action });
    };
    window.addEventListener(AI_ACCESS_REQUIRED_EVENT, handleRequired);
    return () => {
      active = false;
      window.removeEventListener(AI_ACCESS_REQUIRED_EVENT, handleRequired);
    };
  }, []);

  /**
   * A newly generated persona is the root of a new family lineage, so the
   * navigation stack has to start over with them.
   *
   * Leaving the old stack in place was the cause of a nasty class of bug: the
   * family tab renders `persona`, but `handleViewFamilyMember` read the origin
   * out of `personaStack[currentPersonaIndex]`. Once the two diverged, clicking
   * a parent took the *name and birth year* from the person on screen and the
   * *birth year, place and cultural zone* from whoever was last on the stack —
   * so every parent came back from the same stale location, at a year drawn
   * from a different life, often with a negative age.
   */
  const beginPersonaLineage = (rootPersona: HistoricalPersona) => {
    setPersonaStack([rootPersona]);
    setCurrentPersonaIndex(0);
    setBreadcrumbPath([{ name: rootPersona.character.name, index: 0 }]);
  };

  const generateRandom = () => {
    resetSharedPersonaState();
    const newPersona = generateHistoricalPersona(params);
    devLog('[PersonaGenerator] Generated character data:', {
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
    beginPersonaLineage(newPersona);
    setAnnotationRecord(null);
    setOrientationRecord(null);
    setSourceIngestionStatus(null);
    setSourcePortraitUrl(null);
    setSourcePortraitAttribution(null);
    setPersonaSketch(null);
    setGenerationFallbacks([]);
    setEditableJsonl('');
    setDeathRevealState('prompt'); // Reset death reveal for new persona
    setDeathInfo(null);
  };

  const refreshAiAccess = () => {
    void getAiAccessStatus().then(setAiAccess).catch(() => undefined);
  };

  const runAiAction = (run: () => Promise<void>) => {
    logAiFlow('starting AI action');
    void run()
      .catch(error => {
        console.error('[HPG AI flow] AI action rejected', error);
      })
      .finally(() => {
        logAiFlow('AI action settled');
        refreshAiAccess();
      });
  };

  /**
   * Schema filling is the specialist path. It retains its explanatory
   * confirmation, uses three free runs, then requires three active
   * supporter credits.
   */
  const requestAiRun = async (kind: AiCostKind, run: () => Promise<void>) => {
    if (isSourceGenerating) return;
    if (kind === 'schema' && !useGeminiExtraction) {
      // Nothing is sent to the model with extraction switched off, so there is
      // no cost to warn about.
      runAiAction(run);
      return;
    }
    try {
      const access = await getAiAccessStatus();
      setAiAccess(access);
      if (!access.canUseSchema) {
        setAiGate({ action: 'schema', run });
        return;
      }
    } catch {
      // The generation route performs the definitive check.
    }
    setCostConfirm({ kind, run });
  };

  /**
   * Five biographies are free without an interruption; the sixth request is
   * stopped until Stripe confirms support.
   */
  const requestAiBiographyRun = async (run: () => Promise<void>) => {
    logAiFlow('biography access check requested', {
      generating: isSourceGenerating,
      modelEnabled: useGeminiExtraction,
    });
    if (isSourceGenerating) {
      logAiFlow('biography request ignored because another generation is active');
      return;
    }
    if (!useGeminiExtraction) {
      logAiFlow('model filling is disabled; running local biography path');
      runAiAction(run);
      return;
    }
    try {
      const access = await getAiAccessStatus();
      setAiAccess(access);
      logAiFlow('biography access response', {
        allowed: access.canUseBiography,
        freeRunsRemaining: access.freeBiographyRunsRemaining,
        supporterActive: access.supporterActive,
        supporterCredits: access.supporterCredits,
      });
      if (!access.canUseBiography) {
        logAiFlow('opening biography supporter gate');
        setAiGate({ action: 'biography', run });
        return;
      }
    } catch (error) {
      console.error('[HPG AI flow] biography access lookup failed; trying authoritative generation route', error);
      // The generation route performs the definitive check.
    }
    runAiAction(run);
  };

  const confirmAiRun = () => {
    const pending = costConfirm;
    setCostConfirm(null);
    if (!pending) return;
    runAiAction(pending.run);
  };

  const checkSupporterAccess = async () => {
    try {
      const access = await getAiAccessStatus();
      setAiAccess(access);
      const unlocked = aiGate?.action === 'schema'
        ? access.canUseSchema
        : access.canUseBiography;
      if (!unlocked) return;
      const pending = aiGate;
      setAiGate(null);
      if (pending?.run) {
        if (pending.action === 'schema') {
          setCostConfirm({ kind: 'schema', run: pending.run });
        } else {
          runAiAction(pending.run);
        }
      }
    } catch {
      // Keep the gate open so the user can try again after the webhook lands.
    }
  };

  const noteGenerationFallback = (stage: GenerationFallback['stage'], reason: string) => {
    setGenerationFallbacks(previous => (
      previous.some(entry => entry.stage === stage) ? previous : [...previous, { stage, reason }]
    ));
  };

  const localPersonaSketch = (record: HistoricalPersonaAnnotationRecord): string => {
    const seed = record.persona_seed;
    return [
      `${record.source.title} is rendered here as ${seed.summary || `a persona in ${seed.place.region} around ${seed.temporal.specific_year || seed.temporal.decade}`}.`,
      `${seed.social_position?.local_status_detail || seed.social_identity.status_detail || seed.social_identity.status_group} status, ${seed.work.primary_occupation} work, and ${seed.household_economy.household_composition} shape the daily frame of this life. The material setting includes ${seed.material_life.dwelling_detail || seed.material_life.dwelling_type}, ${seed.material_life.clothing_detail || seed.material_life.clothing_level} clothing, and ${seed.material_life.food_security.replace(/_/g, ' ')} food security.`,
      `${seed.public_world?.detail || seed.mobility_and_horizon.knowledge_horizon || 'Their knowledge horizon remains bounded by the institutions, routes, and obligations named in the source.'} ${seed.normative_world?.detail || seed.temperament_and_voice.voice_notes || ''}`.trim(),
      `Evidence confidence is ${record.evidence.confidence}. ${record.evidence.basis_summary}`,
    ].join('\n\n');
  };

  const generateFromAnnotationRecord = async (
    record: HistoricalPersonaAnnotationRecord,
    options: {
      useSourceTitleAsName?: boolean;
      portraitUrl?: string;
      portraitAttribution?: string;
      generateSketch?: boolean;
      fieldEditStatus?: string | null;
      publishAnnotationRecord?: boolean;
      orientationRecord?: PersonaOrientationRecord | null;
      providedSketch?: string;
    } = {}
  ) => {
    resetSharedPersonaState();
    const adaptedMaterial = adaptPersonaMaterialRecord(record, options);
    const generationParams = adaptedMaterial.generationParams;
    const newPersona = generateHistoricalPersona(generationParams);
    const summary = record.persona_seed.summary;
    newPersona.character = adaptedMaterial.applyToCharacter(newPersona.character);
    newPersona.enhancedLifeEvents = adaptedMaterial.lifeEvents;
    if (generationParams.year) newPersona.year = generationParams.year;
    const sourceDateMatch = record.source.source_date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (sourceDateMatch && Number(sourceDateMatch[1]) === newPersona.year) {
      newPersona.month = Number(sourceDateMatch[2]);
      newPersona.day = Number(sourceDateMatch[3]);
    }
    if (generationParams.era) newPersona.era = String(generationParams.era).replace(/_/g, ' ');
    if (generationParams.culturalZone) newPersona.culturalZone = String(generationParams.culturalZone).replace(/_/g, ' ');
    if (generationParams.region) newPersona.region = generationParams.region;
    if (generationParams.location) newPersona.location = generationParams.location;
    if (generationParams.name) newPersona.character.name = generationParams.name;
    if (generationParams.gender) newPersona.character.gender = generationParams.gender;
    if (generationParams.age !== undefined) newPersona.character.age = generationParams.age;
    if (generationParams.profession) {
      newPersona.character.profession = generationParams.profession;
      newPersona.character.occupation = generationParams.profession;
    }
    if (generationParams.religion) newPersona.character.religion = generationParams.religion;
    if (generationParams.socialClass) {
      newPersona.character.socialClass = generationParams.socialClass;
      newPersona.character.class = generationParams.socialClass;
    }
    if (generationParams.culturalZone) {
      newPersona.character.culturalZone = generationParams.culturalZone;
    }

    if (summary) {
      const summaryLabel = record.source.source_basis === 'synthetic_composite'
        ? 'Synthetic schema seed'
        : 'Source-grounded seed';
      newPersona.character.backstory = `${newPersona.character.backstory} ${summaryLabel}: ${summary}`;
    }

    if (adaptedMaterial.displayOverrides.languageData) {
      newPersona.languageData = adaptedMaterial.displayOverrides.languageData;
      // The attribution describes the language the generator chose. Once source
      // material replaces that language, the attribution no longer describes
      // what is on screen, so it is dropped rather than left to contradict it.
      newPersona.languageAttribution = undefined;
    }

    setParams(generationParams);
    if (options.publishAnnotationRecord !== false) {
      const publishedOrientation = options.orientationRecord || legacyAnnotationToPersonaOrientation(record);
      setAnnotationRecord(record);
      setOrientationRecord(publishedOrientation);
      setEditableJsonl(personaOrientationRecordToJsonl(publishedOrientation));
    } else {
      // The ordinary AI-biography path still uses a compact local record as
      // prompt scaffolding, but that record is not a Luna-filled annotation.
      // Keeping it private prevents heuristic placeholders from masquerading
      // as model output in the schema editor.
      setAnnotationRecord(null);
      setOrientationRecord(null);
      setEditableJsonl('');
      setShowMaterialJson(false);
    }
    setSourcePortraitUrl(options.portraitUrl || null);
    setSourcePortraitAttribution(options.portraitAttribution || null);
    setFieldEditStatus(options.fieldEditStatus ?? null);
    setPersona(newPersona);
    setPersonaStack([newPersona]);
    setCurrentPersonaIndex(0);
    setBreadcrumbPath([{ name: newPersona.character.name, index: 0 }]);
    setActiveTab('biography');
    setDeathRevealState('prompt');
    setDeathInfo(null);
    window.setTimeout(() => {
      personaCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    if (options.providedSketch?.trim()) {
      setPersonaSketch(options.providedSketch.trim());
    } else if (options.generateSketch && useGeminiExtraction) {
      setPersonaSketch('Writing source-grounded sketch...');
      try {
        const sketch = await generatePersonaSketchWithGemini(record);
        setLlmTransparency(readLastLlmTransparency());
        if (sketch) {
          setPersonaSketch(sketch);
        } else {
          setPersonaSketch(localPersonaSketch(record));
          noteGenerationFallback('prose', 'The model returned an empty sketch.');
        }
      } catch (error) {
        setLlmTransparency(readLastLlmTransparency());
        setPersonaSketch(localPersonaSketch(record));
        noteGenerationFallback('prose', error instanceof Error ? error.message : 'Sketch generation failed.');
        setSourceIngestionStatus(error instanceof Error ? `${error.message} Showing local sketch fallback.` : 'Sketch generation failed. Showing local sketch fallback.');
      }
    } else {
      setPersonaSketch(localPersonaSketch(record));
      noteGenerationFallback('prose', options.generateSketch
        ? 'Model-written prose is switched off.'
        : 'Rebuilt from the record without asking the model for new prose.');
    }
  };

  const generateRandomAnnotationPersona = async () => {
    if (isSourceGenerating) return;
    setSourceFailure(null);
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceTarget('named_subject');
    setSourceIngestionStatus('Finding a surprise historical figure from Wikipedia/Wikidata...');
    try {
      const person = await getRandomWikidataPerson();
      const backupNote = person.selectionMode === 'curated_fallback' ? ' The live random index is busy, so a real biography was chosen from the backup Wikipedia pool.' : '';
      setSourceIngestionStatus(`Selected ${person.label}${person.birthYear ? ` (${person.birthYear}${person.deathYear ? `-${person.deathYear}` : ''})` : ''}.${backupNote} Fetching Wikipedia source text...`);
      const source = await ingestUrlSource(person.wikipediaUrl);
      source.subject = {
        name: person.label || source.subject?.name,
        description: person.description || source.subject?.description,
        birthYear: person.birthYear ?? source.subject?.birthYear,
        deathYear: person.deathYear ?? source.subject?.deathYear,
        externalId: person.qid || source.subject?.externalId,
      };
      setSourceTitle(source.title);
      setSourceUrl(source.url || person.wikipediaUrl);
      setSourceText(source.text);
      setOldBaileySelectionActive(false);
      setSourceIngestionStatus(useGeminiExtraction ? `Fetched ${source.citationLabel}. Asking ${selectedModelLabel} for a grounded moment and day in the life...` : `Fetched ${source.citationLabel}. Generating a heuristic persona...`);
      const result = await recordFromSource(source, { target: 'named_subject' });
      setSourceIngestionStatus(result.modelFilled
        ? `${selectedModelLabel} created a source-grounded day in the life from ${source.citationLabel}.${person.selectionMode === 'curated_fallback' ? ' Wikimedia throttled live random discovery, so the backup Wikipedia pool supplied the subject.' : ''} The optional Talkie record has not been built.`
        : `Generated a local persona from ${source.citationLabel}; no Talkie record was created.`);
      await generateFromAnnotationRecord(result.record, {
        orientationRecord: result.orientationRecord,
        useSourceTitleAsName: true,
        portraitUrl: source.imageUrl,
        portraitAttribution: source.imageAttribution,
        generateSketch: true,
        providedSketch: result.sketch,
        publishAnnotationRecord: false,
      });
    } catch (error) {
      const failure = sourceFailureFromError(error, 'wikipedia');
      setSourceFailure(failure);
      setSourcePanelCollapsed(false);
      setSourceStudioView('wikipedia');
      setSourceIngestionStatus(failure.message);
    } finally {
      setIsSourceGenerating(false);
    }
  };

  const recordFromSource = async (
    source: ReturnType<typeof createPastedTextSource>,
    options?: { target?: PersonaGenerationTarget }
  ) => {
    setGenerationFallbacks([]);
    if (!useGeminiExtraction) {
      noteGenerationFallback('record', 'Model schema filling is switched off.');
      return { record: createAnnotationRecordFromSource(source), orientationRecord: null, sketch: undefined, modelFilled: false };
    }

    try {
      const generated = await generateSourcePersonaWithGemini(source, {
        target: options?.target || sourceTarget,
        preferredMoment: preferredMoment.trim() || undefined,
      });
      setLlmTransparency(generated.transparency || readLastLlmTransparency());
      return { record: generated.annotationRecord, orientationRecord: generated.orientationRecord, sketch: generated.sketch, modelFilled: true };
    } catch (error) {
      setLlmTransparency(readLastLlmTransparency());
      setSourceIngestionStatus(error instanceof Error ? error.message : 'AI source generation failed.');
      throw error;
    }
  };

  const ingestPastedSource = async () => {
    if (isSourceGenerating) return;
    if (!sourceText.trim()) {
      if (sourceUrl.trim()) {
        await ingestUrl();
        return;
      }
      setSourceIngestionStatus('Paste source text or enter a Wikipedia/readable URL before generating.');
      return;
    }

    // "a person in 1896 New York city" is a request, not evidence. The tables
    // can answer it without a model call, and without a failure path.
    const promptParams = parsePromptSource(sourceText);
    if (promptParams) {
      setSourceFailure(null);
      setSourcePanelCollapsed(true);
      const { matchedPlace, ...params } = promptParams;
      applyProceduralPersona(generateHistoricalPersona({ ...params, samplingMode }));
      setSourceIngestionStatus(`Read the text as a request for ${describePromptSource(promptParams)} and generated a persona locally. No model was called.`);
      return;
    }

    setSourceFailure(null);
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceIngestionStatus(useGeminiExtraction ? `Asking ${selectedModelLabel} for a source-grounded persona and day in the life...` : 'Generating a heuristic persona...');
    try {
      const source = createPastedTextSource(sourceText, sourceTitle.trim() || 'Pasted source text');
      const result = await recordFromSource(source);
      setSourceIngestionStatus(result.modelFilled
        ? `${selectedModelLabel} created a source-grounded day in the life from the pasted text. The optional Talkie record has not been built.`
        : 'Generated a local persona from pasted text; no Talkie record was created.');
      await generateFromAnnotationRecord(result.record, {
        orientationRecord: result.orientationRecord,
        useSourceTitleAsName: sourceTarget === 'named_subject',
        generateSketch: true,
        providedSketch: result.sketch,
        publishAnnotationRecord: false,
      });
    } catch (error) {
      const failure = sourceFailureFromError(error, 'text');
      setSourceFailure(failure);
      setSourcePanelCollapsed(false);
      setSourceIngestionStatus(failure.message);
    } finally {
      setIsSourceGenerating(false);
    }
  };

  const ingestUrl = async () => {
    if (isSourceGenerating) return;
    if (!sourceUrl.trim()) {
      setSourceIngestionStatus('Enter a Wikipedia or readable URL first.');
      return;
    }

    setSourceFailure(null);
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceIngestionStatus('Fetching source text...');
    try {
      const source = await ingestUrlSource(sourceUrl.trim());
      setSourceIngestionStatus(useGeminiExtraction ? `Fetched ${source.citationLabel}. Asking ${selectedModelLabel} for a grounded moment and day in the life...` : `Fetched ${source.citationLabel}. Generating a heuristic persona...`);
      const result = await recordFromSource(source);
      setSourceTitle(source.title);
      setSourceText(source.text);
      setSourceIngestionStatus(result.modelFilled
        ? `${selectedModelLabel} created a source-grounded day in the life from ${source.citationLabel}. The optional Talkie record has not been built.`
        : `Generated a local persona from ${source.citationLabel}; no Talkie record was created.`);
      await generateFromAnnotationRecord(result.record, {
        orientationRecord: result.orientationRecord,
        useSourceTitleAsName: sourceTarget === 'named_subject',
        portraitUrl: source.imageUrl,
        portraitAttribution: source.imageAttribution,
        generateSketch: true,
        providedSketch: result.sketch,
        publishAnnotationRecord: false,
      });
    } catch (error) {
      const failure = sourceFailureFromError(error, 'url');
      setSourceFailure(failure);
      setSourcePanelCollapsed(false);
      setSourceIngestionStatus(failure.message);
    } finally {
      setIsSourceGenerating(false);
    }
  };

  const ingestRandomOldBailey = async () => {
    if (isSourceGenerating) return;
    setSourceFailure(null);
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceIngestionStatus('Searching the Old Bailey Proceedings...');
    try {
      const filters: OldBaileyRandomFilters = {
        ...oldBaileyFilters,
        personaAngle: oldBaileyFilters.personaAngle || sourceTarget,
      };
      const source = await ingestRandomOldBaileySource(filters);
      setSourceTitle(source.title);
      setSourceUrl(source.url || '');
      setSourceText(source.text);
      setOldBaileySelectionActive(false);
      setSourceTarget(filters.personaAngle === 'named_subject' ? 'named_subject' : 'ordinary_person_from_source_world');
      setSourceIngestionStatus(useGeminiExtraction ? `Fetched ${source.citationLabel}. Asking ${selectedModelLabel} for a grounded moment and day in the life...` : `Fetched ${source.citationLabel}. Generating a heuristic persona...`);
      const result = await recordFromSource(source, {
        target: filters.personaAngle === 'named_subject' ? 'named_subject' : 'ordinary_person_from_source_world',
      });
      setSourceIngestionStatus(result.modelFilled
        ? `${selectedModelLabel} created a source-grounded day in the life from ${source.citationLabel}. The optional Talkie record has not been built.`
        : `Generated a local persona from ${source.citationLabel}; no Talkie record was created.`);
      await generateFromAnnotationRecord(result.record, {
        orientationRecord: result.orientationRecord,
        useSourceTitleAsName: filters.personaAngle === 'named_subject',
        portraitUrl: source.imageUrl,
        portraitAttribution: source.imageAttribution,
        generateSketch: true,
        providedSketch: result.sketch,
        publishAnnotationRecord: false,
      });
    } catch (error) {
      const failure = sourceFailureFromError(error, 'old_bailey');
      setSourceFailure(failure);
      setSourcePanelCollapsed(false);
      setSourceIngestionStatus(failure.message);
    } finally {
      setIsSourceGenerating(false);
    }
  };

  const generateFromAvailableSource = async () => {
    // The Pasted text tab is its own thing: whatever is in the box is the
    // request, and Old Bailey is a button of its own. Falling back to a random
    // trial here sent typed prompts to the wrong generator and overwrote the
    // box with the trial text.
    if (sourceStudioView === 'text') {
      await ingestPastedSource();
      return;
    }
    if (oldBaileySelectionActive || (!sourceText.trim() && !sourceUrl.trim())) {
      await ingestRandomOldBailey();
      return;
    }
    if (sourceUrl.trim()) {
      await ingestUrl();
      return;
    }
    if (sourceText.trim()) {
      await ingestPastedSource();
      return;
    }
  };

  const retrySourceFailure = () => {
    const context = sourceFailure?.context;
    setSourceFailure(null);
    if (context === 'wikipedia') {
      requestAiBiographyRun(generateRandomAnnotationPersona);
    } else if (context === 'old_bailey') {
      requestAiBiographyRun(ingestRandomOldBailey);
    } else if (context === 'url') {
      requestAiBiographyRun(ingestUrl);
    } else if (context === 'text') {
      requestAiBiographyRun(ingestPastedSource);
    }
  };

  const applyEditedJsonl = async () => {
    try {
      if (!annotationRecord) throw new Error('No compatibility record is available for this persona.');
      const parsed = JSON.parse(editableJsonl);
      const validationErrors = validatePersonaOrientationRecord(parsed);
      if (validationErrors.length > 0) {
        setFieldEditStatus(`Schema validation failed: ${validationErrors.slice(0, 4).join('; ')}`);
        return;
      }
      const nextOrientation = assertPersonaOrientationRecord(parsed);
      const nextAnnotation = applyPersonaOrientationToAnnotationRecord(nextOrientation, annotationRecord);
      setEditableJsonl(personaOrientationRecordToJsonl(nextOrientation));
      // The edited record supersedes whatever the previous run fell back on.
      setGenerationFallbacks([]);
      await generateFromAnnotationRecord(nextAnnotation, {
        orientationRecord: nextOrientation,
        useSourceTitleAsName: sourceTarget === 'named_subject',
        portraitUrl: sourcePortraitUrl || undefined,
        portraitAttribution: sourcePortraitAttribution || undefined,
        fieldEditStatus: 'Applied edited schema fields.',
      });
    } catch (error) {
      setFieldEditStatus(error instanceof Error ? error.message : 'Edited JSONL is not valid JSON.');
    }
  };

  const exportCharacterSheet = () => {
    if (!persona) return;

    const sheet = {
      exported_at: new Date().toISOString(),
      persona: {
        name: persona.character.name,
        year: persona.year,
        location: persona.location,
        region: persona.region,
        era: persona.era,
        cultural_zone: persona.culturalZone,
        age: persona.character.age,
        gender: persona.character.gender,
        profession: persona.character.profession,
        religion: persona.character.religion,
        portrait_url: sourcePortraitUrl,
      },
      sketch: personaSketch,
      persona_orientation: orientationRecord || undefined,
      annotation_record: annotationRecord || undefined,
      adapter_overrides: materialAdapter ? {
        ...materialAdapter.adapterOverrides,
        display_overrides: materialAdapter.displayOverrides,
        life_events: materialAdapter.lifeEvents.map(event => ({
          year: event.year,
          kind: event.kind,
          importance: event.importance,
          title: event.title,
          text: event.text,
          cultural_context: event.culturalContext,
          source_support: (event as any).sourceSupport,
          source_note: (event as any).sourceNote,
        })),
      } : undefined,
      field_provenance: orientationRecord?.provenance || [],
      generated_character: persona.character,
    };

    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${persona.character.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-character-sheet.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportAnnotationJsonl = () => {
    if (!orientationRecord) return;
    const blob = new Blob([personaOrientationRecordToJsonl(orientationRecord)], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${orientationRecord.persona_id || 'persona-orientation'}.jsonl`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const applyCategoryEdit = (category: AnnotationCategory, rawValue: string) => {
    try {
      if (!orientationRecord) return;
      const current = JSON.parse(editableJsonl || personaOrientationRecordToJsonl(orientationRecord));
      const parsedValue = JSON.parse(rawValue);
      const nextRecord = category.keys
        ? {
          ...current,
          persona: {
            ...current.persona,
            ...parsedValue,
          },
        }
        : setPathValue(current, category.path, parsedValue);
      const validationErrors = validatePersonaOrientationRecord(nextRecord);
      if (validationErrors.length > 0) {
        setFieldEditStatus(`${category.label} edit did not validate: ${validationErrors.slice(0, 3).join('; ')}`);
        return;
      }
      setEditableJsonl(personaOrientationRecordToJsonl(nextRecord as PersonaOrientationRecord));
      setCategoryEditDrafts(prev => ({ ...prev, [category.id]: JSON.stringify(parsedValue, null, 2) }));
      setFieldEditStatus(`Updated ${category.label}. Apply edited fields to regenerate the persona.`);
    } catch (error) {
      setFieldEditStatus(error instanceof Error ? `${category.label} edit is invalid JSON: ${error.message}` : `${category.label} edit is invalid JSON.`);
    }
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
    devLog('[FamilyMember] Generating persona for:', familyMember.name, {
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

      // The origin is whoever is on screen. The stack is only a history of how
      // we got here, and if it has fallen out of step with the rendered persona
      // it must not be the thing the parent's year and place are derived from.
      const stackPersona = personaStack[currentPersonaIndex];
      const currentPersona = persona && stackPersona !== persona ? persona : stackPersona;
      if (!currentPersona) return;
      const stackIsStale = currentPersona !== stackPersona;

      // Calculate generation depth (how many generations back from root)
      // If moving to parent, increment depth; for others (spouse, children, siblings), keep same depth
      const currentDepth = stackIsStale ? 0 : (breadcrumbPath[currentPersonaIndex]?.generationDepth || 0);
      const isMovingToParent = familyMember.relation === 'father' || familyMember.relation === 'mother';
      const newGenerationDepth = isMovingToParent ? currentDepth + 1 : currentDepth;

      // Generate new persona with generation depth
      const newPersona = await generatePersonaFromFamilyMember(
        currentPersona,
        familyMember,
        newGenerationDepth
      );
      resetSharedPersonaState();

      // Add to stack (remove any personas after current if we navigated back).
      // A stale stack is discarded rather than appended to, so the breadcrumbs
      // describe the lineage actually on screen.
      const newStack = stackIsStale
        ? [currentPersona]
        : personaStack.slice(0, currentPersonaIndex + 1);
      newStack.push(newPersona);

      // Update breadcrumb with generation depth
      const relationLabel = getRelationLabel(familyMember.relation, currentPersona.character.name);
      const newPath = stackIsStale
        ? [{ name: currentPersona.character.name, index: 0 }]
        : breadcrumbPath.slice(0, currentPersonaIndex + 1);
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

  const applyProceduralPersona = (newPersona: HistoricalPersona) => {
    resetSharedPersonaState();
    setParams({});
    devLog('[PersonaGenerator] Generated character data:', {
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
    beginPersonaLineage(newPersona);
    setAnnotationRecord(null);
    setOrientationRecord(null);
    setSourceIngestionStatus(null);
    setSourcePortraitUrl(null);
    setSourcePortraitAttribution(null);
    setPersonaSketch(null);
    setGenerationFallbacks([]);
    setEditableJsonl('');
    setActiveTab('biography'); // Reset to biography tab on new generation
    setDeathRevealState('prompt'); // Reset death reveal for new persona
    setDeathInfo(null);
  };

  const generateProceduralOnly = () => {
    applyProceduralPersona(generateHistoricalPersona({ samplingMode }));
  };

  /**
   * Shared setup for both AI paths: a procedural seed, loaded into the Source
   * Studio, with the persona view cleared and ready to receive the result.
   */
  const beginAiRunFromProceduralSeed = () => {
    resetSharedPersonaState();
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceTarget('named_subject');
    setPersona(null);
    setAnnotationRecord(null);
    setOrientationRecord(null);
    setPersonaSketch(null);
    setGenerationFallbacks([]);
    setEditableJsonl('');
    setDeathRevealState('prompt');
    setDeathInfo(null);
    const proceduralYear = 1400 + Math.floor(Math.random() * 531);
    const proceduralPersona = repairSyntheticSeedName(generateHistoricalPersona({ year: proceduralYear, samplingMode }));
    const source = sourceFromProceduralPersona(proceduralPersona);
    setSourceTitle(source.title);
    setSourceText(source.text);
    setSourceUrl('');
    setOldBaileySelectionActive(false);
    return { proceduralPersona, source };
  };

  /**
   * The default AI path: prose only.
   *
   * The schema record is built locally from the seed we already generated, so
   * this makes a single model call for the biography instead of two. The
   * expensive call was spending most of its tokens restating a persona this app
   * had just invented, only for lockProceduralSeedRecord to overwrite the
   * identity fields again.
   */
  const developPersonaProse = async () => {
    if (isSourceGenerating) return;
    const { proceduralPersona, source } = beginAiRunFromProceduralSeed();
    setSourceIngestionStatus(useGeminiExtraction
      ? `Generated ${proceduralPersona.character.name} as a procedural seed. Asking the model for the biography...`
      : `Generated ${proceduralPersona.character.name} as a procedural seed. Writing a local biography...`);
    try {
      const record = lockProceduralSeedRecord(createAnnotationRecordFromSource(source), proceduralPersona);
      await generateFromAnnotationRecord(record, {
        useSourceTitleAsName: true,
        generateSketch: true,
        publishAnnotationRecord: false,
      });
      setSourceIngestionStatus(useGeminiExtraction
        ? `AI developed ${proceduralPersona.character.name}'s biography. No AI schema record has been created yet.`
        : `Developed ${proceduralPersona.character.name} locally. No AI schema record has been created yet.`);
    } catch (error) {
      setSourceIngestionStatus(error instanceof Error ? error.message : 'Persona development failed.');
    } finally {
      setIsSourceGenerating(false);
    }
  };

  /**
   * Ask the model to interpret the persona already on screen without rebuilding
   * their character sheet. Source-backed personas keep their evidence record;
   * ordinary procedural personas receive a local synthetic record that locks
   * the displayed identity and historical constraints.
   */
  const elaborateExistingPersona = async () => {
    if (isSourceGenerating || !persona) return;
    const existingPersona = persona;
    const existingRecord = annotationRecord
      ? structuredClone(annotationRecord) as HistoricalPersonaAnnotationRecord
      : null;
    const syntheticSource = sourceFromProceduralPersona(existingPersona);
    const record = existingRecord || lockProceduralSeedRecord(
      createAnnotationRecordFromSource(syntheticSource),
      existingPersona
    );

    resetSharedPersonaState();
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceTarget('named_subject');
    setGenerationFallbacks([]);
    if (!existingRecord) {
      setAnnotationRecord(null);
      setOrientationRecord(null);
      setEditableJsonl('');
      setShowMaterialJson(false);
    }
    setFieldEditStatus(null);
    setActiveTab('biography');

    if (!existingRecord) {
      setSourceTitle(syntheticSource.title);
      setSourceText(syntheticSource.text);
      setSourceUrl('');
      setOldBaileySelectionActive(false);
    }

    setSourceIngestionStatus(useGeminiExtraction
      ? `Keeping ${existingPersona.character.name}'s character sheet fixed. Asking the model to elaborate the biography...`
      : `Keeping ${existingPersona.character.name}'s character sheet fixed. Writing a local elaboration...`);

    try {
      if (useGeminiExtraction) {
        setPersonaSketch(`Writing an AI interpretation of ${existingPersona.character.name}...`);
        const sketch = await generatePersonaSketchWithGemini(record);
        setLlmTransparency(readLastLlmTransparency());
        if (sketch) {
          setPersonaSketch(sketch);
          setSourceIngestionStatus(`AI elaborated ${existingPersona.character.name} without replacing the existing persona.`);
        } else {
          setPersonaSketch(localPersonaSketch(record));
          noteGenerationFallback('prose', 'The model returned an empty sketch.');
          setSourceIngestionStatus(`The model returned no prose. Showing a local elaboration of ${existingPersona.character.name}.`);
        }
      } else {
        setPersonaSketch(localPersonaSketch(record));
        noteGenerationFallback('prose', 'Model-written prose is switched off.');
        setSourceIngestionStatus(`Wrote a local elaboration of ${existingPersona.character.name}.`);
      }
      window.setTimeout(() => {
        personaCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (error) {
      setLlmTransparency(readLastLlmTransparency());
      setPersonaSketch(localPersonaSketch(record));
      noteGenerationFallback('prose', error instanceof Error ? error.message : 'Sketch generation failed.');
      setSourceIngestionStatus(error instanceof Error
        ? `${error.message} Showing a local elaboration instead.`
        : 'AI elaboration failed. Showing a local elaboration instead.');
    } finally {
      setIsSourceGenerating(false);
    }
  };

  const handleAiDevelopmentClick = () => {
    const mode = persona ? 'existing' : 'new';
    logAiFlow('AI development button clicked', {
      mode,
      generating: isSourceGenerating,
      hasExistingPersona: Boolean(persona),
      hadDonationDialog: showDonate,
      hadGate: Boolean(aiGate),
    });
    // Clear stale dialog flags before the authoritative access check. If this
    // visitor is out of free runs, requestAiBiographyRun immediately restores
    // the supporter gate with the pending action attached.
    setShowDonate(false);
    aiGateBeforeDonateRef.current = null;
    setAiGate(null);
    setCostConfirm(null);
    setRandomDonationMilestone(null);
    setShowAbout(false);
    void requestAiBiographyRun(
      persona ? elaborateExistingPersona : developPersonaProse
    );
  };

  /**
   * Add a genuine model-filled schema to the persona already on screen. This
   * deliberately does not call generateFromAnnotationRecord: schema creation
   * enriches the current persona instead of silently replacing it.
   */
  const generateSchemaForExistingPersona = async () => {
    if (isSourceGenerating || !persona) return;
    if (!useGeminiExtraction) {
      setSourceIngestionStatus('Turn on AI schema filling in Source Studio to make an AI schema record.');
      return;
    }

    const existingPersona = persona;
    const hasLoadedSource = Boolean(sourceText.trim() && sourceTitle.trim() && !/^Procedural seed:/i.test(sourceTitle));
    const source = hasLoadedSource
      ? {
          ...createPastedTextSource(sourceText, sourceTitle),
          url: sourceUrl || undefined,
          sourceBasis: sourceUrl.includes('wikipedia.org') ? 'wikipedia_or_reference' as const : 'other' as const,
          extractionMethod: sourceUrl.includes('wikipedia.org') ? 'wikipedia_api' as const : 'paste' as const,
          citationLabel: sourceUrl.includes('wikipedia.org') ? `Wikipedia: ${sourceTitle}` : sourceTitle,
          subject: {
            name: existingPersona.character.name,
            birthYear: existingPersona.year - existingPersona.character.age,
          },
        }
      : sourceFromProceduralPersona(existingPersona);
    resetSharedPersonaState();
    setIsSourceGenerating(true);
    setSourcePanelCollapsed(true);
    setSourceTarget('named_subject');
    setGenerationFallbacks(previous => previous.filter(entry => entry.stage !== 'record'));
    setFieldEditStatus(null);
    setSourceTitle(source.title);
    setSourceText(source.text);
    setSourceUrl(source.url || '');
    setOldBaileySelectionActive(false);
    setSourceIngestionStatus(`Keeping ${existingPersona.character.name} fixed. Asking ${selectedModelLabel} to fill the compact persona record...`);

    try {
      const generated = await generatePersonaAnnotationWithGemini(source, {
        target: 'named_subject',
        preferredMoment: preferredMoment.trim() || undefined,
      });
      setLlmTransparency(generated.transparency || readLastLlmTransparency());
      const compactRecord = lockProceduralOrientationRecord(generated.orientationRecord, existingPersona);
      const record = applyPersonaOrientationToAnnotationRecord(compactRecord, generated.annotationRecord);
      setAnnotationRecord(record);
      setOrientationRecord(compactRecord);
      setEditableJsonl(personaOrientationRecordToJsonl(compactRecord));
      setShowMaterialJson(false);
      setFieldEditStatus(`Generated by ${selectedModelLabel} for ${existingPersona.character.name}.`);
      setSourceIngestionStatus(`Generated a ${selectedModelLabel}-filled Talkie persona record for ${existingPersona.character.name} without replacing the persona.`);
    } catch (error) {
      setLlmTransparency(readLastLlmTransparency());
      setSourceIngestionStatus(error instanceof Error
        ? `${error.message} No placeholder schema was saved; the existing persona is unchanged.`
        : 'Schema generation failed. No placeholder schema was saved; the existing persona is unchanged.');
      noteGenerationFallback('record', error instanceof Error ? error.message : 'Schema generation failed.');
    } finally {
      setIsSourceGenerating(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleHourglassClick = () => {
    setHourglassRotation(prev => prev + 180);
    setSandAnimationKey(prev => prev + 1); // Restart sand animation
  };

  const handleRandomPersonaClick = () => {
    handleHourglassClick();
    // A persona arrives instantly and silently, and from the bottom bar the
    // button is often under the thumb that pressed it. The tick confirms the
    // press on the devices that can produce one; elsewhere it is a no-op.
    triggerHaptic('light');
    generateProceduralOnly();
    const next = (randomPersonaCountRef.current || 0) + 1;
    randomPersonaCountRef.current = next;
    try {
      window.localStorage.setItem(RANDOM_PERSONA_COUNT_KEY, String(next));
    } catch {
      // The milestone still works for this page view when storage is blocked.
    }
    if (next === 10 || next === 20 || next === 50) {
      setRandomDonationMilestone(next);
    }
  };

  const handleShare = () => {
    if (!persona || isCreatingShare) return;
    setShowShareDialog(true);
  };

  const buildSharedPersonaSnapshot = (): SharedPersonaSnapshot => {
    if (!persona) throw new Error('Generate a persona before creating a share link.');
    const completedSketch = personaSketch && !personaSketch.startsWith('Writing ')
      ? personaSketch
      : undefined;
    return {
      schemaVersion: SHARED_PERSONA_SCHEMA_VERSION,
      persona,
      annotationRecord: annotationRecord || undefined,
      personaOrientationRecord: orientationRecord || undefined,
      personaSketch: completedSketch,
      sourcePortraitUrl: sourcePortraitUrl || undefined,
      sourcePortraitAttribution: sourcePortraitAttribution || undefined,
      sourceTarget,
      portraitEngine: 'lab',
      samplingMode,
      generatorVersion: '1.0.0',
    };
  };

  const createPersonaShareLink = async () => {
    if (!persona || isCreatingShare) return;
    setIsCreatingShare(true);
    setShareStatus(null);
    try {
      const id = await createSharedPersona(buildSharedPersonaSnapshot());
      const url = replaceCurrentUrlWithShare(id);
      setSharedPersonaId(id);
      setShareStatus('Public persona link created. It will keep this exact character.');
      // Keep the ready-state dialog open so copying remains a fresh user gesture
      // even in browsers that revoke clipboard permission after a network wait.
      return url;
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : 'Could not create a share link.');
      return null;
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyPersonaShareLink = async () => {
    if (!sharedPersonaId) return;
    try {
      await copyTextToClipboard(sharedPersonaUrl(sharedPersonaId));
      setShareStatus('Persona link copied to the clipboard.');
      setShowShareDialog(false);
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : 'Could not copy the persona link.');
    }
  };

  const copyLlmTransparency = async () => {
    if (!llmTransparency) return;
    try {
      await copyTextToClipboard(JSON.stringify(llmTransparency, null, 2));
      setLlmCopyStatus('Complete sanitized LLM transcript copied.');
    } catch (error) {
      setLlmCopyStatus(error instanceof Error ? error.message : 'Could not copy the LLM transcript.');
    }
  };

  const openNativePersonaShare = async () => {
    if (!sharedPersonaId || !persona) return;
    const url = sharedPersonaUrl(sharedPersonaId);
    if (!navigator.share) {
      await copyPersonaShareLink();
      return;
    }
    try {
      await navigator.share({
        title: `Historical Persona: ${persona.character.name}`,
        text: `${persona.character.name} — ${persona.character.profession} from ${persona.location} (${persona.year})`,
        url,
      });
      setShareStatus('Persona link shared.');
      setShowShareDialog(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus('The share sheet could not open. You can copy the link instead.');
    }
  };

  const handleSavePDF = () => {
    if (!persona) return;

    // Capture whichever portrait engine is on screen: the classic renderer
    // emits an SVG, the pixel lab a canvas.
    let portraitSvgString = '';
    const portraitSvg = document.querySelector('.portrait-wrapper svg, .portrait-container svg');
    if (portraitSvg) {
      const svgClone = portraitSvg.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', '180');
      svgClone.setAttribute('height', '180');
      portraitSvgString = new XMLSerializer().serializeToString(svgClone);
    } else {
      const portraitCanvas = document.querySelector(
        '.portrait-wrapper canvas, .portrait-container canvas'
      ) as HTMLCanvasElement | null;
      if (portraitCanvas) {
        // Upscale with smoothing off so the print keeps hard pixel edges.
        const scaled = document.createElement('canvas');
        scaled.width = portraitCanvas.width * 4;
        scaled.height = portraitCanvas.height * 4;
        const ctx = scaled.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(portraitCanvas, 0, 0, scaled.width, scaled.height);
          portraitSvgString =
            `<img src="${scaled.toDataURL('image/png')}" width="180" height="180" ` +
            `style="image-rendering: pixelated; display: block;" alt="Portrait" />`;
        }
      }
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
    const cultureDisplay = formatCulturalZone(persona.culturalZone, persona.region, persona.location);

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
          const rarity = normalizeRarity(attr.rarity) || 'common';
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
          .attr-seldom_seen { background: #d2e6f0; color: #23566b; }
          .attr-rare { background: #d4d4e8; color: #3a3a6a; }
          .attr-very_rare { background: #ded4e8; color: #4a3a6a; }
          .attr-exceedingly_rare { background: #e8d4d4; color: #6a3a3a; }

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
                <div class="stat"><div class="stat-label">PRS</div><div class="stat-value">${char.stats?.persuasion || '-'}</div></div>
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
                Associate Professor of History at UC Santa Cruz. It is an experimental source-first
                studio for turning historical documents, reference pages, and archival fragments into
                plausible personas rooted in a specific time and place.
              </p>

              <h3>Educational Purpose</h3>
              <p>
                This tool helps students, writers, game designers, and history enthusiasts
                explore the diversity of human experience across time and place while paying attention
                to evidence, uncertainty, and source bias. Each persona is a historically informed
                draft, not a factual reconstruction of a real person unless the source clearly supports it.
              </p>

              <h3>How It Works</h3>
              <p>
                The app can ingest pasted text, readable URLs, Wikipedia material, and selected trial
                records, then convert that source into compact persona material with confidence and
                support labels. The procedural generator uses that material as constraints for names,
                social position, work, household life, possessions, concerns, worldview, backstory, and
                portrait cues.
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

  const openDonate = () => {
    // Donation is a modal transition, not a second modal layered over the
    // supporter gate. Retain the pending AI action off-screen so closing the
    // donation dialog can return the visitor to the gate without losing it.
    if (aiGate) aiGateBeforeDonateRef.current = aiGate;
    setAiGate(null);
    setCostConfirm(null);
    setRandomDonationMilestone(null);
    setShowAbout(false);
    setShowDonate(true);
    logAiFlow('opening donation dialog', { suspendedGate: aiGate?.action || null });
  };

  const closeDonate = () => {
    setShowDonate(false);
    const suspendedGate = aiGateBeforeDonateRef.current;
    aiGateBeforeDonateRef.current = null;
    if (suspendedGate) {
      window.requestAnimationFrame(() => setAiGate(suspendedGate));
    }
  };

  const handleDonate = () => {
    openDonate();
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

  /**
   * The era as it reads inside a sentence, article included.
   *
   * The label above is a standalone heading ("Antiquity"), and the season line
   * used to paste it after a hardcoded "the" — giving "in the Antiquity" and
   * "in the Prehistory". Which article a period takes is part of its name, so
   * it belongs here rather than in the sentence.
   */
  const formatEraInPhrase = (era: string): string => {
    const phrases: Record<string, string> = {
      'PREHISTORY': 'prehistory',
      'ANTIQUITY': 'antiquity',
      'MEDIEVAL': 'the medieval period',
      'RENAISSANCE_EARLY_MODERN': 'the early modern period',
      'INDUSTRIAL_ERA': 'the industrial era',
      'MODERN_ERA': 'the modern era',
      'FUTURE_ERA': 'the near future',
    };
    return phrases[era.toUpperCase().replace(/ /g, '_')]
      || `the ${formatEraLabel(era).toLowerCase()}`;
  };

  const formatCulturalZone = (zone: string, region?: string, location?: string): string => {
    const zoneMap: Record<string, string> = {
      'EUROPEAN': 'Europe',
      'EAST_ASIAN': 'East Asia',
      'EAST ASIAN': 'East Asia',
      'SOUTH_ASIAN': 'South Asia',
      'SOUTH ASIAN': 'South Asia',
      'SOUTHEAST_ASIAN': 'Southeast Asia',
      'SOUTHEAST ASIAN': 'Southeast Asia',
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
    const baseZone = zoneMap[zone.toUpperCase()] || zone.replace(/_/g, ' ').toLowerCase();
    return getDisplayZone(baseZone, `${region || ''} ${location || ''}`);
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

  /**
   * The lower half as a single equipment line: "Denim Jeans", "Moleskin
   * Trousers", "Skirt".
   *
   * The material is dropped when the garment's name already says it — the
   * tables carry both "Trousers"/"Cotton Drill" and "Cotton Drill Trousers",
   * and "Cotton Drill Cotton Drill Trousers" is what naive concatenation gives.
   */
  const describeLegwear = (piece?: { name?: string; material?: string }): string | null => {
    const name = (piece?.name || '').trim();
    if (!name || /^(none|bare)$/i.test(name)) return null;
    const material = (piece?.material || '').trim();
    const shown = formatItemName(name);
    if (!material || /^(none|n\/a)$/i.test(material)) return shown;
    const already = material
      .toLowerCase()
      .split(/\s+and\s+|\s+/)
      .some(word => word.length > 2 && shown.toLowerCase().includes(word));
    return already ? shown : `${material} ${shown}`;
  };

  /**
   * What to call the row a garment sits in.
   *
   * The clothing tables have one `garments` list per culture and era, and it is
   * written into the `torso` slot whatever the garment is — so a Plains persona
   * whose garment was "Hide Leggings" got a row reading "TORSO: Hide Leggings",
   * and breechcloths and skirts landed there too. The schema has no leg slot to
   * move them to, so the label follows the garment instead of the slot key.
   */
  const slotLabelFor = (slot: string, itemName: string): string => {
    // The legs slot goes through the same naming test as the torso: what sits
    // there is as often a wrapped cloth as a pair of trousers, and "Legs:
    // Wrapper" is the wrong word for a garment tied at the waist.
    if (slot !== 'torso' && slot !== 'legs') return formatItemName(slot);
    const name = itemName.toLowerCase();
    if (/legging|trouser|breeches|pants|chaps|jeans|shorts|hose/.test(name)) return 'Legs';
    if (/breechcloth|breechclout|loincloth|apron string|malo|sarong|lungi|dhoti|sash skirt/.test(name)) return 'Waist';
    if (/skirt|kilt|wrapper|pareo|lavalava/.test(name)) return 'Waist';
    if (/cloak|mantle|cape|robe over/.test(name)) return 'Cloak';
    return slot === 'legs' ? 'Legs' : 'Torso';
  };

  const getSeasonInfo = (
    month: number,
    day: number,
    culturalZone?: string,
    region?: string
  ): { season: string; color: string; description: string } => {
    let season = '';
    let color = '';
    let description = '';

    // The display zone has spaces where the data has underscores.
    const zone = (culturalZone || '').replace(/ /g, '_');
    const climate = zone && region ? getAreaClimate(zone, region) : undefined;
    const hemisphere = zone ? hemisphereFor(zone, region || '') : 'north';

    // Near the equator the year divides into wet and dry, not into four
    // temperate seasons; "the depths of winter" in equatorial Africa is simply
    // the wrong frame.
    if (climate === ClimateType.TROPICAL) {
      const wet = seasonFor(month, hemisphere, climate) === 'wet';
      return wet
        ? { season: 'wet', color: '#3f6b6b', description: 'the height of the rains' }
        : { season: 'dry', color: '#a5703a', description: 'the dry season' };
    }

    // Shift the calendar six months for the southern hemisphere, so a persona
    // in Patagonia or Aotearoa is not described as freezing in January.
    if (hemisphere === 'south') {
      month = ((month + 5) % 12) + 1;
    }

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
      'death': <IoSkull />,
      'mundane': <IoHammer />
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

  // generateNarrativeBiography now lives in services/narrativeBiographyService.ts



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
  const makeTermsClickable = (html: string, religion: string, location: string, disease?: string, city?: string): string => {
    if (!html) return html;

    let result = html;

    // The city the birth clause names — "a hamlet outside Ankara". It is the
    // most specific place the biography knows, so it should be as reachable as
    // the region. Done before the location pass: a city whose name contains
    // the area name would otherwise be half-wrapped by it. Skipped when the
    // two are the same word, which would wrap the same text twice.
    if (city && city !== location) {
      const cityArticle = getWikipediaArticle(city);
      const cityRegex = new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(cityRegex, match =>
        `<span class="wiki-link" data-article="${cityArticle}">${match}</span>`);
    }

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
      diseaseName,
      principalCity({
        year: persona.year - persona.character.age,
        culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
        region: persona.region,
        location: persona.location,
      })?.name
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
    // The biography is now two paragraphs, separated by a blank line.
    // Trim before filtering: `.filter(Boolean)` drops '' but keeps a chunk of
    // pure whitespace, and a whitespace-only paragraph renders a full
    // line-height of empty space that reads as a doubled paragraph break.
    return rawBio.split(/\n{2,}/).map(part => part.trim()).filter(Boolean).map((paragraph, index) => {
      const withWikiLinks = makeTermsClickable(
        paragraph,
        persona.character.religion,
        persona.location,
        diseaseName,
        // At the BIRTH year, not the present one: the birth clause is where
        // the city is named, and a persona born in Saigon may be living in Ho
        // Chi Minh City by the year on the card.
        principalCity({
          year: persona.year - persona.character.age,
          culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
          region: persona.region,
          location: persona.location,
        })?.name
      );
      return (
        <p key={index}>
          {makeNamesClickableInHTML(withWikiLinks, persona.character.family)}
        </p>
      );
    });
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
            onClick={openDonate}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openDonate()}
          >
            Historical Persona Generator
          </h1>
        </div>
        <div className="top-bar-buttons" role="toolbar" aria-label="Page actions">
          <button onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <IoSunny aria-hidden="true" /> : <IoMoonSharp aria-hidden="true" />}
            <span className="top-bar-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            className="source-studio-toolbar-button"
            onClick={openMobileSourceStudio}
            aria-label="Open Source Studio"
            aria-controls="source-studio-panel"
            aria-expanded={!sourcePanelCollapsed}
          >
            <IoLibrary aria-hidden="true" />
            <span className="top-bar-label">Source Studio</span>
          </button>
          <button
            onClick={handleShare}
            aria-label={sharedPersonaId ? 'Open this persona share link' : 'Create a share link for this persona'}
            disabled={!persona || isLoadingSharedPersona || isCreatingShare}
          >
            <IoShareSocial aria-hidden="true" />
            <span className="top-bar-label">{isCreatingShare ? 'Saving…' : 'Share'}</span>
          </button>
          <button
            onClick={handleSavePDF}
            aria-label="Save persona as PDF"
          >
            <IoSave aria-hidden="true" />
            <span className="top-bar-label">Save as PDF</span>
          </button>
          <button
            onClick={openAbout}
            onPointerEnter={() => { void loadAboutSpriteBanner(); }}
            onPointerDown={() => { void loadAboutSpriteBanner(); }}
            onFocus={() => { void loadAboutSpriteBanner(); }}
            aria-label="About this application"
          >
            <IoInformationCircle aria-hidden="true" />
            <span className="top-bar-label">About</span>
          </button>
          <button
            className="top-bar-donate"
            onClick={openDonate}
            aria-label="Support this project"
          >
            <IoHeart aria-hidden="true" />
            <span className="top-bar-label">Donate</span>
          </button>
        </div>
      </div>

      {/* The generation controls live at the top of a 2,885px document, so on a
          phone the app's own loop cost a full-page scroll each time round. The
          bar carries the loop and the step that most often follows it, and it
          is only up while the real controls are off-screen. */}
      <div className={`mobile-action-bar ${showMobileActions ? 'is-visible' : ''}`}>
        <button
          className="btn btn-primary mobile-action-primary"
          onClick={handleRandomPersonaClick}
          disabled={isSourceGenerating}
          tabIndex={showMobileActions ? 0 : -1}
          aria-hidden={!showMobileActions}
          aria-label="Generate a random historical persona"
        >
          <IoShuffle aria-hidden="true" />
          Generate Persona
        </button>
        <button
          className="mobile-action-icon"
          onClick={handleAiDevelopmentClick}
          disabled={isSourceGenerating}
          tabIndex={showMobileActions ? 0 : -1}
          aria-hidden={!showMobileActions}
          aria-label="Develop the current persona with AI"
        >
          <IoSparkles aria-hidden="true" />
        </button>
      </div>

      <div className="persona-generator">

      <div className="controls" ref={controlsRef} role="region" aria-label="Persona generation controls">
        <div className="control-buttons">
          {/* The primary action is the fast, local, procedural persona — the same
              one the landing page shows. Sending every click to the language
              model made the default path slow, non-deterministic and dependent
              on an API key, and gave a first-time visitor no way back to the
              procedural text they had just been looking at. Enrichment is now
              its own deliberate choice. */}
          <button
            className="btn btn-primary generation-random-button"
            onClick={handleRandomPersonaClick}
            disabled={isSourceGenerating}
            aria-label="Generate a random historical persona"
          >
            <IoShuffle aria-hidden="true" />
            Generate Random Persona
          </button>
          {/* AI prose is a modifier on the primary action. The more expensive
              schema action lives beside the exports it creates, after a
              persona exists. */}
          <div className="generation-mode-row">
          <button
            className="btn btn-secondary generation-ai-button"
            onClick={handleAiDevelopmentClick}
            disabled={isSourceGenerating}
            title="Ask AI to elaborate the persona on screen. If none exists, create and develop one."
            aria-label="Develop the current persona with AI"
          >
            <IoSparkles aria-hidden="true" />
            <span className="generation-ai-label">
              {isSourceGenerating ? 'Developing…' : 'Use AI to Develop Persona'}
            </span>
          </button>
          <div className="sampling-mode" role="group" aria-label="How personas are sampled">
            <button
              type="button"
              className={samplingMode === 'explore' ? 'is-active' : ''}
              onClick={() => setSamplingMode('explore')}
              title="Flattened across eras and regions so the whole world is reachable. Not representative."
            >
              Explore
            </button>
            <button
              type="button"
              className={samplingMode === 'true-frequency' ? 'is-active' : ''}
              onClick={() => setSamplingMode('true-frequency')}
              title="Weighted by how many people actually lived in each era and region."
            >
              True frequency
            </button>
          </div>
          </div>
          {sharedPersonaId && (
            <span className="shared-persona-badge">
              <IoShareSocial aria-hidden="true" />
              Shared persona
            </span>
          )}
          {aiAccess?.testerAccess && (
            <span className="tester-access-badge">Tester access</span>
          )}
        </div>

        <div
          id="source-studio-panel"
          ref={sourcePanelRef}
          className={`source-ingestion-panel ${sourcePanelCollapsed ? 'source-ingestion-panel-collapsed' : ''}`}
          role="region"
          aria-label="Source-based persona generation"
        >
          <div className="source-ingestion-header">
            <button
              type="button"
              className="source-studio-title"
              onClick={() => {
                setSourceStudioView('full');
                setSourcePanelCollapsed(false);
              }}
              aria-label="Open the full Source Studio"
            >
              <h2>Source Studio</h2>
              {/* Collapsed, the four source options below already say what this
                  does, and the subtitle wrapped to four lines in a narrow
                  column — the largest single block above the persona card. */}
              {(!sourcePanelCollapsed || isSourceGenerating || annotationRecord || sourceTitle) && (
                <p>
                  {isSourceGenerating
                    ? (sourceIngestionStatus || 'Generating source-backed persona...')
                      : sourcePanelCollapsed && (annotationRecord || sourceTitle)
                      ? `${annotationRecord ? sourceBasisLabel(annotationRecord.source.source_basis) : 'Source'} loaded.`
                      : 'Build a persona from a real historical source.'}
                </p>
              )}
            </button>
            <div className="source-mode-showcase" aria-label="Available historical source modes">
              <button
                type="button"
                className={`source-mode-button ${!sourcePanelCollapsed && sourceStudioView === 'wikipedia' ? 'source-mode-button-active' : ''}`}
                onClick={() => {
                  setSourceStudioView('wikipedia');
                  setSourceTarget('named_subject');
                  setSourcePanelCollapsed(false);
                }}
              >
                <span>Wikipedia</span>
                <small>Article or surprise</small>
              </button>
              <button
                type="button"
                className={`source-mode-button ${!sourcePanelCollapsed && sourceStudioView === 'web' ? 'source-mode-button-active' : ''}`}
                onClick={() => {
                  setSourceStudioView('web');
                  setSourcePanelCollapsed(false);
                }}
              >
                <span>Web page</span>
                <small>Readable URL</small>
              </button>
              <button
                type="button"
                className={`source-mode-button ${!sourcePanelCollapsed && sourceStudioView === 'text' ? 'source-mode-button-active' : ''}`}
                onClick={() => {
                  setSourceStudioView('text');
                  setSourcePanelCollapsed(false);
                }}
              >
                <span>Pasted text</span>
                <small>Document excerpt</small>
              </button>
              <button
                type="button"
                className={`source-mode-button ${!sourcePanelCollapsed && sourceStudioView === 'old_bailey' ? 'source-mode-button-active' : ''}`}
                onClick={() => {
                  setSourceStudioView('old_bailey');
                  setSourcePanelCollapsed(false);
                }}
              >
                <span>Old Bailey</span>
                <small>Real trial record</small>
              </button>
            </div>
            <button
              className="source-panel-toggle"
              onClick={() => {
                if (sourcePanelCollapsed) {
                  setSourceStudioView('full');
                  setSourcePanelCollapsed(false);
                } else {
                  setSourcePanelCollapsed(true);
                }
              }}
              aria-expanded={!sourcePanelCollapsed}
              aria-label={sourcePanelCollapsed ? 'Expand source material inputs' : 'Collapse source material inputs'}
            >
              <IoChevronForward aria-hidden="true" />
            </button>
          </div>
          {sourceFailure && !isSourceGenerating && (
            <div className="source-failure" role="alert" aria-live="assertive">
              <IoAlertCircle aria-hidden="true" />
              <div className="source-failure-copy">
                <strong>{sourceFailure.title}</strong>
                <p>{sourceFailure.message}</p>
                <p className="source-failure-stage">
                  {sourceFailure.modelCalled
                    ? 'The source was loaded and Luna was called, but its response could not be used.'
                    : 'This stopped before Luna was called; no AI generation was attempted.'}
                </p>
                <details>
                  <summary>Technical details</summary>
                  <code>{sourceFailure.technicalDetail}</code>
                </details>
              </div>
              <div className="source-failure-actions">
                {sourceFailure.retryable && (
                  <button className="btn btn-primary" type="button" onClick={retrySourceFailure}>
                    <IoRefresh aria-hidden="true" /> Try again
                  </button>
                )}
                <button className="btn btn-secondary" type="button" onClick={() => setSourceFailure(null)}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <AnimatePresence initial={false} mode="wait">
            {sourcePanelCollapsed ? (
              (annotationRecord || sourceTitle || isSourceGenerating) && (
              <motion.div
                key="source-summary"
                className="source-collapsed-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="source-collapsed-summary">
                  {annotationRecord && (
                    <span className="source-type-badge">{sourceBasisLabel(annotationRecord.source.source_basis)}</span>
                  )}
                  <span>{sourceTitle || annotationRecord?.source.title || 'Generating source record'}</span>
                  {sourceUrl && <code>{sourceUrl}</code>}
                </div>
                {!isSourceGenerating && sourceIngestionStatus && (
                  <div className="source-status" aria-live="polite">{sourceIngestionStatus}</div>
                )}
                {isSourceGenerating && (
                <div className="source-loading-state" aria-live="polite">
                  <div className="source-loading-bar" />
                  <span>{sourceIngestionStatus || 'Generating persona record...'}</span>
                </div>
                )}
                {!isSourceGenerating && (
                  <div className="source-collapsed-actions">
                    {llmTransparency && (
                      <button className="btn btn-secondary" onClick={() => { setLlmCopyStatus(null); setShowLlmTransparency(true); }}>
                        LLM transparency
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setSourcePanelCollapsed(false)}>
                      Edit Source
                    </button>
                  </div>
                )}
              </motion.div>
              )
            ) : (
            <motion.div
              key="source-workspace"
              className="source-expanded-content"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.2, 0.75, 0.2, 1] }}
            >
              <div className="source-workspace-quick-actions">
                <span>
                  {sourceStudioView === 'wikipedia'
                    ? 'Wikipedia supplies a named person and documented life. Luna chooses one living-year moment, keeps article facts fixed, and writes a two-paragraph day in that life.'
                    : sourceStudioView === 'web'
                      ? 'Load a readable archive, museum, or history page. Luna uses its text to build the visible person and a grounded day-in-the-life scene.'
                      : sourceStudioView === 'text'
                        ? 'Paste an excerpt from a letter, inventory, testimony, register, or other source. Luna treats the words as evidence and fills only plausible everyday gaps.'
                        : sourceStudioView === 'old_bailey'
                          ? 'The Old Bailey Proceedings are published records of London criminal trials from 1674–1913. Choose a real trial; Luna turns its partial, mediated testimony into a cautious day-in-the-life persona.'
                          : 'Use any supported source type, or let the app find a subject.'}
                </span>
                <div className="source-workspace-action-buttons">
                  {(sourceStudioView === 'wikipedia' || sourceStudioView === 'full') && (
                    <button className="btn btn-secondary" onClick={() => requestAiBiographyRun(generateRandomAnnotationPersona)} disabled={isSourceGenerating} aria-label="Create a day-in-the-life persona from a surprise Wikipedia biography">
                      <IoDocumentText aria-hidden="true" />
                      {isSourceGenerating ? 'Finding Source...' : 'Surprise Wikipedia persona'}
                    </button>
                  )}
                  {sourceStudioView !== 'full' && (
                    <button className="source-show-all-button" onClick={() => setSourceStudioView('full')}>
                      Show all options
                    </button>
                  )}
                </div>
              </div>
              {sourceStudioView !== 'old_bailey' && (
                <div className={`source-input-grid source-input-grid-${sourceStudioView}`}>
                  <label>
                    Source title
                    <input
                      type="text"
                      value={sourceTitle}
                      onChange={(event) => setSourceTitle(event.target.value)}
                      placeholder={sourceStudioView === 'text' ? 'Probate inventory, court testimony, parish record...' : 'Optional working title'}
                    />
                  </label>
                  {(sourceStudioView === 'wikipedia' || sourceStudioView === 'web' || sourceStudioView === 'full') && (
                    <label>
                      {sourceStudioView === 'wikipedia' ? 'Wikipedia URL' : sourceStudioView === 'web' ? 'Readable URL' : 'Wikipedia or readable URL'}
                      <div className="source-url-row">
                        <input
                          type="url"
                          value={sourceUrl}
                          onChange={(event) => {
                            setOldBaileySelectionActive(false);
                            setSourceUrl(event.target.value);
                            setSourceText('');
                          }}
                          placeholder={sourceStudioView === 'web' ? 'https://archive.org/...' : 'https://en.wikipedia.org/wiki/...'}
                        />
                        <button className="btn btn-secondary" onClick={() => requestAiBiographyRun(ingestUrl)} disabled={isSourceGenerating}>
                          {isSourceGenerating ? 'Working...' : sourceStudioView === 'wikipedia' ? 'Create Wikipedia Persona' : 'Create from URL'}
                        </button>
                      </div>
                    </label>
                  )}
                  <label>
                    Persona target
                    <select
                      value={sourceTarget}
                      onChange={(event) => setSourceTarget(event.target.value as PersonaGenerationTarget)}
                    >
                      <option value="named_subject">Named subject</option>
                      <option value="ordinary_person_from_source_world">Ordinary person from source world</option>
                    </select>
                  </label>
                  <label>
                    Preferred moment
                    <input
                      type="text"
                      value={preferredMoment}
                      onChange={(event) => setPreferredMoment(event.target.value)}
                      placeholder="e.g. Tolstoy in the 1870s, before Anna Karenina"
                    />
                  </label>
                </div>
              )}
              {(sourceStudioView === 'old_bailey' || sourceStudioView === 'full') && (
                <div className="old-bailey-source-box">
                  <div className="old-bailey-source-heading">
                    <span>Old Bailey Proceedings</span>
                    <button className="btn btn-secondary" onClick={() => requestAiBiographyRun(ingestRandomOldBailey)} disabled={isSourceGenerating}>
                      {isSourceGenerating ? 'Searching...' : 'Create from a Random Trial'}
                    </button>
                  </div>
                  <div className="old-bailey-filter-grid">
                    <label>
                      Person signal
                      <select
                        value={oldBaileyFilters.gender || 'any'}
                        onChange={(event) => updateOldBaileyFilters(filters => ({ ...filters, gender: event.target.value as OldBaileyRandomFilters['gender'] }))}
                      >
                        <option value="any">Any</option>
                        <option value="female">Woman</option>
                        <option value="male">Man</option>
                      </select>
                    </label>
                    <label>
                      Decade
                      <select
                        value={oldBaileyFilters.decade || ''}
                        onChange={(event) => updateOldBaileyFilters(filters => ({ ...filters, decade: event.target.value }))}
                      >
                        <option value="">Any early indexed trials</option>
                        {Array.from({ length: 17 }, (_, index) => 1670 + index * 10).map(decade => (
                          <option key={decade} value={String(decade)}>{decade}s</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Offence
                      <select
                        value={oldBaileyFilters.crime || 'any'}
                        onChange={(event) => updateOldBaileyFilters(filters => ({ ...filters, crime: event.target.value as OldBaileyRandomFilters['crime'] }))}
                      >
                        <option value="any">Any</option>
                        <option value="theft">Theft</option>
                        <option value="violent_theft">Violent theft</option>
                        <option value="deception">Deception</option>
                        <option value="killing">Killing</option>
                        <option value="sexual">Sexual offence</option>
                        <option value="royal">Royal offences</option>
                        <option value="damage">Property damage</option>
                        <option value="miscellaneous">Miscellaneous</option>
                      </select>
                    </label>
                    <label>
                      Generate as
                      <select
                        value={oldBaileyFilters.personaAngle || 'ordinary_person_from_source_world'}
                        onChange={(event) => updateOldBaileyFilters(filters => ({ ...filters, personaAngle: event.target.value as OldBaileyRandomFilters['personaAngle'] }))}
                      >
                        <option value="ordinary_person_from_source_world">Ordinary person from trial world</option>
                        <option value="named_subject">Named person in record</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
              <label className="source-toggle-row">
                <input
                  type="checkbox"
                  checked={useGeminiExtraction}
                  onChange={(event) => setUseGeminiExtraction(event.target.checked)}
                />
                Use Luna for source-grounded facts and a two-paragraph day in the life
              </label>
              {(sourceStudioView === 'text' || sourceStudioView === 'full') && (
                <label className="source-text-label">
                  Source text
                  <textarea
                    value={sourceText}
                    onChange={(event) => {
                      setOldBaileySelectionActive(false);
                      setSourceUrl('');
                      setSourceText(event.target.value);
                    }}
                    placeholder="Paste a document excerpt here, then generate a compact persona record from it."
                    rows={5}
                  />
                </label>
              )}
              <div className="source-actions">
                {(sourceStudioView === 'text' || sourceStudioView === 'full') && (
                  <button className="btn btn-primary" onClick={() => requestAiBiographyRun(generateFromAvailableSource)} disabled={isSourceGenerating}>
                    {isSourceGenerating
                      ? 'Generating...'
                      : sourceStudioView === 'text'
                        ? 'Create Day in the Life from Text'
                        : oldBaileySelectionActive || (!sourceText.trim() && !sourceUrl.trim())
                          ? 'Create Old Bailey Day in the Life'
                          : sourceUrl.trim()
                            ? 'Create Day in the Life from URL'
                            : sourceText.trim()
                              ? 'Create Day in the Life from Text'
                              : 'Create Source-Grounded Persona'}
                  </button>
                )}
                {annotationRecord && (
                  <button className="btn btn-secondary" onClick={() => setShowMaterialJson(!showMaterialJson)}>
                    {showMaterialJson ? 'Hide JSONL' : 'Show JSONL'}
                  </button>
                )}
                {llmTransparency && (
                  <button className="btn btn-secondary" onClick={() => { setLlmCopyStatus(null); setShowLlmTransparency(true); }}>
                    LLM transparency
                  </button>
                )}
                {sourceIngestionStatus && !sourceFailure && <span className="source-status">{sourceIngestionStatus}</span>}
              </div>
              {orientationRecord && showMaterialJson && (
                <pre className="annotation-jsonl">{personaOrientationRecordToJsonl(orientationRecord)}</pre>
              )}
            </motion.div>
            )}
          </AnimatePresence>
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
                max="2030"
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
              ref={personaCardRef}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="card-header">
              <div className="header-left">
                <div className="name-with-pills">
                  <h2>{renderName(persona.character.name)}</h2>
                  <SavePersonaStar persona={persona} />
                  {/* Both pills key off one colour so they read as a pair —
                      the zone, and a place inside it. */}
                  <div
                    className="location-pills"
                    style={{ '--zone-accent': zoneAccent(persona.culturalZone) } as React.CSSProperties}
                  >
                    <span
                      className="location-pill region-pill wiki-link"
                      onClick={() => setWikipediaArticle(getWikipediaArticle(persona.region))}
                    >
                      {persona.region}
                    </span>
                    {/* Standing, in the society's own word. It sits with the
                        place pills rather than with the stats because that is
                        what it was: a fact about where you were born, not an
                        achievement.

                        Two sources feed it. The elite-strata table is the
                        precise one — it knows what an hidalgo was and how many
                        there were — and the social-status sampler is the
                        fallback, which covers the societies and centuries the
                        table has not reached yet. Without the fallback the
                        badge appeared on one persona in forty-four, which is
                        not "rare", it is "absent". */}
                    {(() => {
                      // An office outranks a stratum on the pill: "Bishop" is
                      // the more specific fact than "Gentry", and it is much the
                      // rarer of the two. The share quoted is the true one — see
                      // `eliteOffices.ts` on why the draw rate and the printed
                      // rate are deliberately different numbers.
                      const standing = persona.office
                        ? {
                          label: persona.office.role,
                          note: `${capitalizeFirst(persona.office.gloss)}. `
                            + `Roughly ${formatShareAsOdds(persona.office.trueShare)} human lives were lived in such a place.`,
                        }
                        : persona.distinction
                        ? {
                          label: persona.distinction.label,
                          note: `${persona.distinction.clause} Roughly ${formatShareAsOdds(persona.distinction.share)} of people here held this standing.`,
                        }
                        : eliteStatusStanding(persona.character.socialClass);
                      if (!standing) return null;
                      return (
                        <span className="location-pill distinction-pill" title={standing.note}>
                          {standing.label}
                        </span>
                      );
                    })()}
                    {persona.location !== persona.region && (() => {
                      const placeLabel = historicalPlaceLabel(persona.location, persona.year);
                      return (
                        <span
                          className={`location-pill area-pill wiki-link${placeLabel.note ? ' place-anachronism' : ''}`}
                          title={placeLabel.note}
                          onClick={() => setWikipediaArticle(getWikipediaArticle(persona.location))}
                        >
                          {placeLabel.label}
                        </span>
                      );
                    })()}
                    {/* The city standing in this map area in this year, from
                        the same lookup the biography uses — so the badge and
                        the prose never name two different places. A small
                        settlement is labelled as one: "Konya" implies a city,
                        and for most of history most of these were market
                        towns. The tooltip carries the description already
                        written in cities.ts, plus who governed it that year,
                        which is the fact that changes inside a lifetime. */}
                    {(() => {
                      const city = principalCity({
                        year: persona.year,
                        culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
                        region: persona.region,
                        location: persona.location,
                        localeType: persona.historicalContext?.localeType,
                      });
                      if (!city) return null;
                      const era = persona.year >= 1900 ? city.eraSpecificDensity?.modern : undefined;
                      const density = era ?? city.urbanDensity;
                      const polity = cityAllegiance(city, persona.year);
                      return (
                        <span
                          className="location-pill city-pill wiki-link"
                          title={[city.description, polity && `Under ${polity} in ${formatYear(persona.year)}.`]
                            .filter(Boolean).join(' ')}
                          onClick={() => setWikipediaArticle(getWikipediaArticle(city.name))}
                        >
                          {city.name}
                          {density === 'small' && <span className="city-pill-note"> · town</span>}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="season-narrative">
                  It is <span className="season-text" style={{ color: getSeasonInfo(persona.month, persona.day, persona.culturalZone, persona.region).color }}>
                    {getSeasonInfo(persona.month, persona.day, persona.culturalZone, persona.region).description}
                  </span> in {formatEraInPhrase(persona.era)} in {formatCulturalZone(persona.culturalZone, persona.region, persona.location)}
                </div>
                {persona.odds && (
                  <div
                    className="draw-odds"
                    title={
                      persona.samplingMode === 'true-frequency'
                        ? 'Sampled in proportion to how many people actually lived in each era and region.'
                        : 'Explore mode deliberately flattens eras and regions so the whole world is reachable — this is how rare the draw would really have been.'
                    }
                  >
                    {/* Built from the same formatters as the line above, so the
                        card cannot say "Southeast Asia" in one sentence and
                        "South Asia" in the next. `odds.scope` carries the same
                        claim for non-UI consumers. */}
                    Roughly <strong>{persona.odds.phrase}</strong> were lived in{' '}
                    {formatEraInPhrase(persona.era)} in{' '}
                    {formatCulturalZone(persona.culturalZone, persona.region, persona.location)}
                    {persona.samplingMode === 'explore' && <span className="draw-odds-mode"> · explore mode</span>}
                  </div>
                )}
                {/* How unusual the person is, as against how unusual their world
                    is. It belongs directly under the draw odds because it is the
                    same kind of claim — a share of a population — but it is
                    about this individual, so it is the one line here that is
                    allowed full contrast. */}
                {persona.rarity && persona.rarity.tier !== 'ordinary' && (
                  <HoverPlate
                    title={`1 in ${persona.rarity.oneIn.toLocaleString()} people`}
                    lines={persona.rarity.reasons}
                    placement="below"
                    className={`persona-rarity rarity-${persona.rarity.tier}`}
                  >
                    <span className="rarity-mark" aria-hidden="true">
                      {persona.rarity.tier === 'legendary' ? '◆' : persona.rarity.tier === 'rare' ? '◈' : '◇'}
                    </span>
                    About <strong>1 in {persona.rarity.oneIn.toLocaleString()}</strong> people are this unusual
                  </HoverPlate>
                )}

                {annotationRecord && (
                  <div className="schema-evidence-strip">
                    <div>
                      <strong>{sourceBasisLabel(annotationRecord.source.source_basis)}</strong>
                      <span>{annotationRecord.evidence.confidence} confidence · {annotationRecord.source.citation_label}</span>
                    </div>
                    <p>{annotationRecord.evidence.basis_summary}</p>
                  </div>
                )}
              </div>
              <div className="header-center">
                <div className="map-pill">
                  <MiniLocationMap
                    continent={persona.culturalZone}
                    region={persona.region}
                    cityLabel={principalCity({
                      year: persona.year,
                      culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
                      region: persona.region,
                      location: persona.location,
                    })?.name}
                  />
                </div>
              </div>
              <div className="header-right">
                {/* Phones hide the draw-odds line to save a header row; the
                    date is the tap target that brings it back. Inert on
                    desktop, where the line is always visible. */}
                <div
                  className="header-date-tap"
                  onClick={() => setShowMobileOdds(v => !v)}
                  aria-expanded={showMobileOdds}
                >
                  <div className="header-date">{formatYear(persona.year)}</div>
                  <div className="exact-date">{getMonthName(persona.month)} {persona.day}</div>
                </div>
                {headerPolity && <PolityBadge polity={headerPolity} year={persona.year} />}
                {showMobileOdds && persona.odds && (
                  <div className="mobile-odds-popover" role="note">
                    Roughly <strong>{persona.odds.phrase}</strong> were lived in{' '}
                    {formatEraInPhrase(persona.era)} in{' '}
                    {formatCulturalZone(persona.culturalZone, persona.region, persona.location)}
                    {persona.samplingMode === 'explore' && <span className="draw-odds-mode"> · explore mode</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="left-column">
                <div className="appearance-section-compact">
                  <h3>Portrait</h3>
                  <div className="appearance-content">
                    <div
                      className="portrait-stage"
                      style={sourcePortraitUrl
                        ? undefined
                        : { '--portrait-backdrop': portraitBackdropColor } as React.CSSProperties}
                    >
                      {/* On phones the age and gender sit in the backdrop
                          gutters either side of the figure, replacing the
                          stat bar that sat under the portrait. Desktop hides
                          these and shows `.appearance-text` instead. */}
                      <div className="portrait-flank portrait-flank-left">
                        <span className="flank-age">{persona.character.age}</span>
                        <span className="flank-caption">years</span>
                      </div>
                      <div
                        ref={portraitContainerRef}
                        className="portrait-container clickable-portrait"
                        onClick={() => setShowSecrets(true)}
                        onMouseEnter={handleMainPortraitHover}
                        onMouseLeave={handleMainPortraitLeave}
                      >
                        {sourcePortraitUrl ? (
                          <img
                            className="source-portrait-image"
                            src={sourcePortraitUrl}
                            alt={`Portrait of ${persona.character.name}`}
                          />
                        ) : (
                          <PixelPortrait
                            character={persona.character}
                            size={248}
                            temporaryExpression={mainPortraitHoverExpression}
                            onBackdropColor={setPortraitBackdropColor}
                          />
                        )}
                        {/* Sits over whichever portrait is showing: the seal is a
                            fact about the person, not about the renderer. */}
                        <TraitSeals seals={portraitSeals} />
                        {/* The mark in the opposite corner is painted into the
                            canvas, so it cannot be hovered on its own. This is
                            an invisible target laid exactly over it, carrying
                            the same plate the rarity line carries — the two are
                            the same claim and a reader should not have to find
                            out that they are by comparing them. */}
                        {!sourcePortraitUrl && portraitMark && (
                          <HoverPlate
                            title={portraitMark.title}
                            lines={portraitMark.lines}
                            placement="left"
                            className="portrait-mark-hotspot"
                            style={{
                              right: `${MARK_HOTSPOT.rightPct}%`,
                              top: `${MARK_HOTSPOT.topPct}%`,
                              width: `${MARK_HOTSPOT.widthPct}%`,
                              height: `${MARK_HOTSPOT.heightPct}%`,
                            }}
                          >
                            <span className="portrait-mark-target" aria-hidden="true" />
                          </HoverPlate>
                        )}
                      </div>
                      <div className="portrait-flank portrait-flank-right">
                        <span className="flank-gender">{persona.character.gender}</span>
                        <span className="flank-caption">{persona.character.appearance.build}</span>
                      </div>
                      <button
                        type="button"
                        className="portrait-details-button"
                        onClick={() => setShowSecrets(true)}
                        aria-label={`View details for ${persona.character.name}`}
                      >
                        <IoEye aria-hidden="true" />
                        Character details
                      </button>
                    </div>
                    {sourcePortraitAttribution && (
                      <div className="source-portrait-credit">{sourcePortraitAttribution}</div>
                    )}
                    <div className="appearance-text">
                      <div className="age-gender-display">
                        <div className="age-block">
                          <span className="age-number">{persona.character.age}</span>
                          <span className="age-label">years old</span>
                        </div>
                        <div className="gender-block">
                          <span className="gender-label">{persona.character.gender}</span>
                          {/* Build sat on its own full-width line for one word;
                              it belongs with the gender it describes. */}
                          <span className="gender-build">{persona.character.appearance.build}</span>
                        </div>
                      </div>
                      {persona.character.appearance.facialHair && persona.character.gender !== 'Female' && (
                        <div className="build-details">
                          <p>
                            <strong>Facial Hair:</strong> {persona.character.appearance.facialHairStyle && persona.character.appearance.facialHairStyle.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="info-section-compact">
                  <h3>Background</h3>
                  <div className="info-list-compact">
                    <div className="info-item">
                      <span className="label">Profession</span>
                      <span className="value">
                        {persona.character.profession}
                        {/* A standing rather than a trade — "Big Man", "Maharaja" —
                            reads as a joke without the plain-English gloss beside it. */}
                        {standingRole(persona.character.profession) && (
                          <span className="profession-gloss">
                            {standingRole(persona.character.profession)!.gloss}
                          </span>
                        )}
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
                          {sourceLanguageData?.name || sourceLanguageLabel || persona.languageData.name}
                          {(sourceLanguageData?.nativeName || persona.languageData.nativeName) && (
                            <span style={{ fontSize: '0.85em', marginLeft: '4px', opacity: 0.7 }}>
                              ({sourceLanguageData?.nativeName || persona.languageData.nativeName})
                            </span>
                          )}
                          {annotationRecord && renderSourceFieldTag('/persona_seed/social_identity/languages')}
                          <span className="language-sources-marker" title="How this language was arrived at, and the scholarship behind it">†</span>
                        </span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="label">{statusFieldLabel(persona)}</span>
                      <span className="value">{persona.character.class || 'Unknown'}</span>
                    </div>
                    {/* Legal condition is a separate axis from social class and
                        from wealth, and it is the one that places a life most
                        decisively. Shown only where there is one to show: for
                        most personas the honest answer is nothing at all. */}
                    {persona.character.legalStatusLabel && (
                      <div className="info-item">
                        <span className="label">Legal Standing</span>
                        <span className="value">{persona.character.legalStatusLabel}</span>
                      </div>
                    )}
                    {persona.character.ancestry && (
                      <div className="info-item">
                        <span className="label">Ancestry</span>
                        <span className="value">
                          {persona.character.ancestry.originLabel}
                          <span style={{ fontSize: '0.85em', marginLeft: '4px', opacity: 0.7 }}>
                            ({persona.character.ancestry.generation === 0
                              ? 'born overseas'
                              : persona.character.ancestry.generation === 1
                                ? 'first generation here'
                                : `${persona.character.ancestry.generation} generations here`})
                          </span>
                        </span>
                      </div>
                    )}
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
                        {generationFallbacks.length > 0 && (
                          <div className="generation-fallback-notice" role="status">
                            <strong>Offline fallback in use</strong>
                            <ul>
                              {generationFallbacks.map(fallback => (
                                <li key={fallback.stage}>
                                  {FALLBACK_STAGE_LABELS[fallback.stage]} — {fallback.reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {personaSketch ? (
                          <div className="source-sketch">
                            {personaSketch.split(/\n{2,}/).map((paragraph, index) => (
                              <p key={index}>{paragraph}</p>
                            ))}
                          </div>
                        ) : (
                          memoizedBiographyWithFamilyLinks
                        )}
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
                                        {(father as any).sourceSupport && (
                                          <span className={`source-field-tag source-field-tag-${(father as any).sourceSupport}`}>
                                            {sourceSupportLabel((father as any).sourceSupport)}
                                          </span>
                                        )}
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
                                        {(mother as any).sourceSupport && (
                                          <span className={`source-field-tag source-field-tag-${(mother as any).sourceSupport}`}>
                                            {sourceSupportLabel((mother as any).sourceSupport)}
                                          </span>
                                        )}
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
                                        {(spouse as any).sourceSupport && (
                                          <span className={`source-field-tag source-field-tag-${(spouse as any).sourceSupport}`}>
                                            {sourceSupportLabel((spouse as any).sourceSupport)}
                                          </span>
                                        )}
                                        {spouse.profession && <div className="parent-profession">{getProfessionEmoji(spouse.profession)} {spouse.profession}</div>}
                                        {spouse.age && <div className="parent-dates">Age {spouse.age}</div>}
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Children. The panel above names only the three
                                  relations it was written for, so a persona with
                                  six children showed none of them here. Those who
                                  did not survive are stated as a lifespan rather
                                  than marked — it is a fact about the household,
                                  not a decoration. */}
                              {(() => {
                                const children = persona.character.family.filter(
                                  m => m.relation === 'son' || m.relation === 'daughter');
                                if (children.length === 0) return null;
                                const living = children.filter(c => !c.isDeceased);
                                const ordered = [...children].sort(
                                  (a, b) => (a.birthYear ?? 0) - (b.birthYear ?? 0));

                                return (
                                  <div className="children-block">
                                    <div className="children-heading">
                                      {children.length === living.length
                                        ? `${children.length} ${children.length === 1 ? 'child' : 'children'}`
                                        : `${children.length} born, ${living.length} living`}
                                    </div>
                                    <div className="parents-grid">
                                      {ordered.map((child, idx) => (
                                        <motion.div
                                          key={`child-${idx}`}
                                          className={`parent-card clickable-family-card${child.isDeceased ? ' family-card-deceased' : ''}`}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.25 + idx * 0.03 }}
                                          onClick={() => !child.isDeceased && handleViewFamilyMember(child)}
                                          whileHover={child.isDeceased ? undefined : { scale: 1.02, boxShadow: '0 4px 12px rgba(107, 142, 127, 0.2)' }}
                                          whileTap={child.isDeceased ? undefined : { scale: 0.98 }}
                                          title={child.isDeceased ? undefined : 'Click to generate their life history'}
                                        >
                                          <div className="parent-header">
                                            {child.relation === 'son'
                                              ? <IoMan className="parent-icon" />
                                              : <IoWoman className="parent-icon" />}
                                            <div className="parent-label">
                                              {child.relation === 'son' ? 'Son' : 'Daughter'}
                                            </div>
                                          </div>
                                          <div className="parent-name">{child.name}</div>
                                          {child.profession && (
                                            <div className="parent-profession">
                                              {getProfessionEmoji(child.profession)} {child.profession}
                                            </div>
                                          )}
                                          <div className="parent-dates">
                                            {child.isDeceased && child.birthYear !== undefined
                                              ? `${formatYear(child.birthYear)} - ${formatYear(child.deathYear ?? child.birthYear)}`
                                              : `Age ${child.age}`}
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
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
                                  {(event as any).sourceSupport && (
                                    <span
                                      className={`source-field-tag source-field-tag-${(event as any).sourceSupport}`}
                                      title={(event as any).sourceNote || undefined}
                                    >
                                      {sourceSupportLabel((event as any).sourceSupport)}
                                    </span>
                                  )}
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
                    {annotationRecord ? (
                      <>
                        {isSyntheticAnnotation && (
                          <div className="source-section-note">Synthetic Fill</div>
                        )}
                        {sourceClothingDetail && (
                          <div className="equipment-item source-equipment-item">
                            <span className="equipment-slot">Clothing</span>
                            <span className="equipment-name">
                              {titleCaseDisplay(sourceClothingDetail)}
                              {renderSourceFieldTag('/persona_seed/material_life/clothing_detail', { suppressSynthetic: isSyntheticAnnotation }) || renderSourceFieldTag('/persona_seed/material_life/clothing_level', { suppressSynthetic: isSyntheticAnnotation })}
                            </span>
                          </div>
                        )}
                        {sourcePossessions.slice(0, 5).map((possession, idx) => (
                          <div key={`source-possession-${idx}`} className="equipment-item source-equipment-item">
                            <span className="equipment-slot">{idx === 0 ? 'Possessions' : 'Item'}</span>
                            <span className="equipment-name">
                              {titleCaseDisplay(possession)}
                              {renderSourceFieldTag('/persona_seed/material_life/possessions', { suppressSynthetic: isSyntheticAnnotation })}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      (['head', 'torso', 'legs', 'feet'] as const).map((slot) => {
                        const item =
                          persona.character.portraitVisualOverrides?.displayEquipment?.[slot] ||
                          persona.character.equippedItems?.[slot];
                        // The lower half is generated as part of the outfit but
                        // almost never becomes an equipped *item*, because
                        // `createItemInstance` only knows the base ids in the
                        // item tables and most trousers are not in them. The
                        // slot was simply left out of this list, so a persona
                        // wearing a shirt and trousers was listed as wearing a
                        // shirt — which read, in the twentieth century, as a
                        // world where nobody owned a pair of trousers.
                        const name = item && item.name.toLowerCase() !== 'none'
                          ? formatItemName(item.name)
                          : slot === 'legs'
                            ? describeLegwear(persona.character.appearance.legwear)
                            : null;
                        if (!name) return null;
                        return (
                          <div key={slot} className="equipment-item">
                            <span className="equipment-slot">{slotLabelFor(slot, name)}</span>
                            <span className="equipment-name">{name}</span>
                          </div>
                        );
                      })
                    )}

                    {/* Add jewelry items if present */}
                    {!annotationRecord && persona.character.appearance.jewelry && persona.character.appearance.jewelry.length > 0 && (
                      persona.character.appearance.jewelry.map((piece, idx) => (
                        <div key={`jewelry-${idx}`} className="equipment-item jewelry-equipment">
                          <span className="equipment-slot">{piece.type}</span>
                          <span className="equipment-name">
                            {describeOrnament(piece as any)}
                          </span>
                        </div>
                      ))
                    )}

                    {/* Add markings/scars if present */}
                    {!annotationRecord && persona.character.appearance.markings && persona.character.appearance.markings.length > 0 && (
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
                {!annotationRecord && visibleAccessories.length > 0 && (
                  <motion.div
                    className="equipment-section accessories-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.32 }}
                  >
                    <h3>Carried</h3>
                    <div className="equipment-grid">
                      {visibleAccessories.map(([slot, item]) => (
                        <div key={slot} className="equipment-item">
                          <span className="equipment-slot">{formatItemName(slot)}</span>
                          <span className="equipment-name">{formatItemName(item.name)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {!annotationRecord && visibleInventory.length > 0 && (
                  <motion.div
                    className="inventory-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <h3>Inventory</h3>
                    <div className="inventory-list">
                      {visibleInventory.map((item, idx) => (
                        <div key={idx} className="inventory-item">
                          <span className="item-name">{formatItemName(item.name)}</span>
                          {item.quantity > 1 && (
                            <span className="item-quantity">×{item.quantity}</span>
                          )}
                        </div>
                      ))}
                      {hiddenInventoryCount > 0 && (
                        <div className="inventory-item inventory-overflow">
                          <span className="item-name">and {hiddenInventoryCount} more</span>
                        </div>
                      )}
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

                {(sourceAttributes.length > 0 || (persona.character.attributes && persona.character.attributes.length > 0)) && (
                  <motion.div
                    className="attributes-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <h3>Attributes</h3>
                    <div className="attribute-list">
                      {isSyntheticAnnotation && sourceAttributes.length > 0 && (
                        <div className="source-section-note">Synthetic Fill</div>
                      )}
                      {sourceAttributes.map((attr, idx) => {
                        const IconComponent = attr.icon;
                        return (
                          <motion.div
                            key={`source-attribute-${idx}`}
                            className="attribute-item source-derived-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + idx * 0.08 }}
                          >
                            <div className="attribute-icon-wrapper">
                              <IconComponent className="attribute-icon" />
                            </div>
                            <div className="attribute-text">
                              <div className="attribute-name">
                                {titleCaseDisplay(attr.name)}
                                {renderSourceFieldTag(attr.fieldPath, { suppressSynthetic: isSyntheticAnnotation })}
                              </div>
                              <div className="attribute-description">{attr.description}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                      {(annotationRecord ? [] : (persona.character.attributes || [])).map((attr, idx) => {
                        const IconComponent = getIconComponent(attr.icon);
                        return (
                          <motion.div
                            key={idx}
                            className="attribute-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + idx * 0.08 }}
                          >
                            {/* Personas saved under the old five-tier ladder
                                carry `epic` and `legendary`; normalizeRarity
                                maps them onto the bands covering the same
                                prevalence. */}
                            {(() => {
                              const rarity = normalizeRarity(attr.rarity);
                              const labelled = rarity && !UNLABELLED_RARITIES.has(rarity);
                              return (
                                <>
                                  <div
                                    className="attribute-icon-wrapper"
                                    style={labelled
                                      ? {
                                        color: RARITY_COLORS[rarity!],
                                        background: `color-mix(in srgb, ${RARITY_COLORS[rarity!]} 16%, var(--color-surface))`,
                                      }
                                      : undefined}
                                  >
                                    {IconComponent ? (
                                      <IconComponent className="attribute-icon" />
                                    ) : (
                                      <IoStar className="attribute-icon" />
                                    )}
                                  </div>
                                  <div className="attribute-text">
                                    <div className="attribute-name">
                                      {attr.name}
                                      {labelled && (
                                        <span
                                          className="attribute-rarity"
                                          style={{ color: RARITY_COLORS[rarity!] }}
                                          title={`${RARITY_LABELS[rarity!]} — how many people of this age, sex, trade and place carried it`}
                                        >
                                          {RARITY_LABELS[rarity!]}
                                        </span>
                                      )}
                                    </div>
                                    <div className="attribute-description">{attr.description}</div>
                                  </div>
                                </>
                              );
                            })()}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {(sourceIdeology || (persona.character.ideology && persona.character.ideology !== 'Pragmatism')) && (
                  <motion.div
                    className="attributes-section"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3>Worldview</h3>
                    <div className="attribute-list">
                      {sourceIdeology && isSyntheticAnnotation && (
                        <div className="source-section-note">Synthetic Fill</div>
                      )}
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
                            {sourceIdeology ? titleCaseDisplay(materialOverrides?.worldviewLabel || 'Worldview') : (IDEOLOGIES.find((i: any) => i.id === persona.character.ideology)?.name || persona.character.ideology)}
                            {sourceIdeology && (renderSourceFieldTag('/persona_seed/normative_world', { suppressSynthetic: isSyntheticAnnotation }) || renderSourceFieldTag('/persona_seed/religious_practice', { suppressSynthetic: isSyntheticAnnotation }) || renderSourceFieldTag('/persona_seed/mobility_and_horizon/religious_or_moral_world', { suppressSynthetic: isSyntheticAnnotation }))}
                          </div>
                          <div className="attribute-description">
                            {sourceIdeology ? sourceIdeology : (IDEOLOGIES.find((i: any) => i.id === persona.character.ideology)?.description || '')}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            {persona && (
              <div className="character-sheet-editor">
                <div className="character-sheet-editor-header">
                  <div>
                    <h3>{orientationRecord ? 'Talkie Persona Record' : 'AI Schema Record'}</h3>
                    <p>{orientationRecord
                      ? 'A compact 30-field persona orientation with source provenance, ready to export as JSONL.'
                      : `Make a Luna-filled JSONL record that elaborates ${persona.character.name} without replacing the persona.`}</p>
                  </div>
                  <div className="export-action-panel" aria-label="Export persona">
                    {orientationRecord ? (
                      <button className="btn btn-primary" onClick={exportAnnotationJsonl}>
                        <IoDownload aria-hidden="true" />
                        Export JSONL
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => requestAiRun('schema', generateSchemaForExistingPersona)}
                        disabled={isSourceGenerating}
                        title="Ask Luna to fill a compact Talkie persona record for this existing persona."
                      >
                        <IoSparkles aria-hidden="true" />
                        {isSourceGenerating ? 'Making AI Schema…' : 'Make AI Schema Record'}
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={handleSavePDF}>
                      <IoSave aria-hidden="true" />
                      Export PDF
                    </button>
                    <button className="btn btn-secondary" onClick={exportCharacterSheet}>
                      <IoDocumentText aria-hidden="true" />
                      Full JSON
                    </button>
                  </div>
                </div>
                {!annotationRecord && sourceIngestionStatus && (
                  <div className="source-actions" role="status" aria-live="polite">
                    <span className="source-status">{sourceIngestionStatus}</span>
                  </div>
                )}
                {orientationRecord && annotationRecord && (
                <>
                {consistencyIssues.length > 0 && (
                  <div className="consistency-panel">
                    <div className="consistency-panel-header">
                      <IoAlertCircle aria-hidden="true" />
                      <strong>{consistencyIssues.length} consistency {consistencyIssues.length === 1 ? 'check' : 'checks'}</strong>
                    </div>
                    <div className="consistency-list">
                      {consistencyIssues.map(issue => (
                        <div key={issue.id} className={`consistency-item consistency-item-${issue.severity}`}>
                          <div>
                            <span>{issue.severity}</span>
                            {issue.fieldPath && <code>{issue.fieldPath}</code>}
                          </div>
                          <p>{issue.message}</p>
                          {issue.suggestedFix && <small>{issue.suggestedFix}</small>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="source-field-summary">
                  <div><span>Schema</span><strong>{orientationRecord.schema_version}</strong></div>
                  <div><span>Year</span><strong>{orientationRecord.persona.year}</strong></div>
                  <div><span>Region</span><strong>{orientationRecord.persona.place_context.region}</strong></div>
                  <div><span>Status</span><strong>{orientationRecord.persona.social_status}</strong></div>
                  <div><span>Work</span><strong>{orientationRecord.persona.occupation}</strong></div>
                  <div><span>Evidence</span><strong>{orientationRecord.provenance.length} claims</strong></div>
                </div>
                <div className="jsonl-category-grid">
                  {annotationCategories.map(category => {
                    const categoryFields = new Set(category.keys || []);
                    const fieldEvidenceCount = orientationRecord.provenance.filter(item => {
                      const field = item.field_path.replace(/^\/persona\//, '').split('/')[0];
                      return category.id === 'provenance' || categoryFields.has(field);
                    }).length;
                    const draftValue = categoryEditDrafts[category.id] ?? (category.value === undefined ? '' : JSON.stringify(category.value, null, 2));
                    const schemaRows = flattenSchemaRows(category.value);
                    return (
                      <section key={category.id} className={`jsonl-category-card ${category.populated ? '' : 'jsonl-category-card-empty'}`}>
                        <div className="jsonl-category-header">
                          <div>
                            <h4>{category.label}</h4>
                            <code>{category.keys ? `/persona/{${category.keys.join(', ')}}` : `/${category.path.join('/')}`}</code>
                          </div>
                          <div className="jsonl-category-badges">
                            <span>{category.populated ? 'populated' : 'empty'}</span>
                            {fieldEvidenceCount > 0 && <span>{fieldEvidenceCount} evidence</span>}
                          </div>
                        </div>
                        <div className="schema-field-table">
                          {schemaRows.map((row, index) => (
                            <div key={`${row.path}-${index}`} className={row.empty ? 'schema-field-row schema-field-row-empty' : 'schema-field-row'}>
                              <code>{row.path}</code>
                              <span>{row.value}</span>
                            </div>
                          ))}
                        </div>
                        <details className="jsonl-category-edit">
                          <summary>Edit section JSON</summary>
                          <textarea
                            value={draftValue}
                            onChange={(event) => setCategoryEditDrafts(prev => ({ ...prev, [category.id]: event.target.value }))}
                            onBlur={(event) => applyCategoryEdit(category, event.target.value)}
                            rows={Math.min(14, Math.max(4, draftValue.split('\n').length + 1))}
                            spellCheck={false}
                          />
                        </details>
                        {category.id === 'provenance' && Array.isArray(category.value) && (
                          <div className="field-evidence-chip-row">
                            {category.value.slice(0, 10).map((item: any, index: number) => (
                              <span key={`${item.field_path || 'field'}-${index}`}>
                                {supportLevelLabel(item.support || 'unknown')}
                              </span>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
                <details className="raw-jsonl-editor">
                  <summary>Raw JSONL</summary>
                <textarea
                  value={editableJsonl}
                  onChange={(event) => setEditableJsonl(event.target.value)}
                  rows={14}
                  spellCheck={false}
                />
                </details>
                <div className="source-actions">
                  <button className="btn btn-primary" onClick={applyEditedJsonl}>
                    Apply Edited Fields
                  </button>
                  {fieldEditStatus && <span className="source-status">{fieldEditStatus}</span>}
                </div>
                </>
                )}
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoadingSharedPersona && (
        <div className="empty-state shared-persona-loading" role="status" aria-live="polite">
          <p>Opening shared persona…</p>
          <p className="empty-subtitle">Restoring the exact saved character and evidence record.</p>
        </div>
      )}

      {!isLoadingSharedPersona && sharedPersonaError && !persona && (
        <div className="empty-state shared-persona-error" role="alert">
          <p>Unable to open this persona</p>
          <p className="empty-subtitle">{sharedPersonaError}</p>
          <button className="btn btn-primary" onClick={generateProceduralOnly}>
            Generate a new persona
          </button>
        </div>
      )}

      {!isLoadingSharedPersona && !sharedPersonaError && !persona && (
        <div className="empty-state">
          <p>No persona record is currently loaded.</p>
          <p className="empty-subtitle">Generate a procedural seed or load a historical source to begin.</p>
        </div>
      )}
    </div>

    <RosterStrip onEncounter={(first, second) => setEncounterPair([first, second])} />

    <footer className="footer">
      © {new Date().getFullYear()} Benjamin Breen. All rights reserved. |{' '}
      <a href="https://ucsc.edu" target="_blank" rel="noopener noreferrer">UC Santa Cruz</a> |{' '}
      Created as a free educational resource |{' '}
      <button
        type="button"
        className="encounter-egg"
        onClick={() => {
          const entries = loadRoster();
          if (entries.length >= 2) {
            setEncounterPair([entries[entries.length - 2].persona, entries[entries.length - 1].persona]);
          } else {
            setEncounterHint(true);
            window.setTimeout(() => setEncounterHint(false), 5000);
          }
        }}
      >
        ⚔
      </button>
      {encounterHint && (
        <span className="encounter-egg-hint"> Save two personae with the ☆ to stage an encounter…</span>
      )}
      <span className="footer-mobile-details">
        {' '}| Prototype – may contain errors |{' '}
        <a href="https://github.com/benjaminbreen/HistoricalPersonaGenerator" target="_blank" rel="noopener noreferrer">GitHub</a>
      </span>
    </footer>

    {encounterPair && (
      <React.Suspense fallback={null}>
        <EncounterMode
          a={encounterPair[0]}
          b={encounterPair[1]}
          onClose={() => setEncounterPair(null)}
        />
      </React.Suspense>
    )}

    {showSpriteTuner && (
      <React.Suspense fallback={null}>
        <SpriteTunerPanel onClose={() => setShowSpriteTuner(false)} featured={persona} />
      </React.Suspense>
    )}

    <AnimatePresence>
      {shareStatus && (
        <motion.div
          className="persona-share-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
        >
          {shareStatus}
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showShareDialog && persona && (
        <motion.div
          className="modal-overlay"
          onClick={() => !isCreatingShare && setShowShareDialog(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-persona-modal-title"
        >
          <motion.div
            className="modal share-persona-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="modal-header">
              <h2 id="share-persona-modal-title">
                {sharedPersonaId ? 'Share this persona' : 'Create a public persona link'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowShareDialog(false)}
                disabled={isCreatingShare}
                aria-label="Close share dialog"
              >
                <IoClose aria-hidden="true" />
                Close
              </button>
            </div>
            <div className="modal-body share-persona-body">
              <div className="share-persona-identity">
                <span>{formatYear(persona.year)}</span>
                <strong>{persona.character.name}</strong>
                <p>{persona.character.profession} · {persona.location}, {persona.region}</p>
              </div>

              {!sharedPersonaId ? (
                <>
                  <p>
                    This creates an immutable snapshot of the character as you see it now,
                    including the selected portrait system.
                  </p>
                  <div className="share-privacy-note">
                    <IoInformationCircle aria-hidden="true" />
                    <div>
                      <strong>Anyone with the link can view it.</strong>
                      <p>
                        {annotationRecord
                          ? 'The displayed annotation, evidence labels, and short evidence snippets will be included. '
                          : 'The generated character record will be included. '}
                        Raw pasted text, uploaded document contents, input fields, and API credentials are never included.
                      </p>
                    </div>
                  </div>
                  <div className="share-persona-actions">
                    <button
                      className="btn"
                      onClick={() => setShowShareDialog(false)}
                      disabled={isCreatingShare}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={createPersonaShareLink}
                      disabled={isCreatingShare}
                    >
                      <IoShareSocial aria-hidden="true" />
                      {isCreatingShare ? 'Creating link…' : 'Create public link'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    This URL restores the exact saved persona rather than generating a new one.
                  </p>
                  <label className="share-url-field">
                    <span>Public link</span>
                    <input
                      type="text"
                      readOnly
                      value={sharedPersonaUrl(sharedPersonaId)}
                      onFocus={event => event.currentTarget.select()}
                    />
                  </label>
                  <div className="share-persona-actions">
                    <button className="btn btn-primary" onClick={copyPersonaShareLink}>
                      Copy link
                    </button>
                    {typeof navigator !== 'undefined' && navigator.share && (
                      <button className="btn" onClick={openNativePersonaShare}>
                        <IoShareSocial aria-hidden="true" />
                        Share…
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {showLlmTransparency && llmTransparency && (
        <div
          className="modal-overlay llm-transparency-overlay"
          onClick={() => setShowLlmTransparency(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="llm-transparency-title"
        >
          <div className="modal llm-transparency-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="llm-transparency-title">LLM transparency</h2>
                <p>Exact sanitized application request, raw model response, and app-side normalization.</p>
              </div>
              <button className="modal-close" onClick={() => setShowLlmTransparency(false)} aria-label="Close LLM transparency dialog">
                <IoClose aria-hidden="true" />
              </button>
            </div>
            <div className="modal-body llm-transparency-body">
              <p className="llm-transparency-note">
                API credentials and authorization headers are never included. The prompt, schema, settings, and model text below are otherwise the complete transcript available to the application.
              </p>
              <div className="llm-transparency-summary">
                <div><span>Provider</span><strong>{llmTransparency.request.provider}</strong></div>
                <div><span>Model</span><strong>{llmTransparency.request.model}</strong></div>
                <div><span>Action</span><strong>{llmTransparency.request.action}</strong></div>
                <div><span>Target</span><strong>{llmTransparency.request.application_options?.target || 'n/a'}</strong></div>
                <div><span>Input tokens</span><strong>{String(llmTransparency.response.usage.input ?? '—')}</strong></div>
                <div><span>Output tokens</span><strong>{String(llmTransparency.response.usage.output ?? '—')}</strong></div>
              </div>
              <details open>
                <summary>Normalization and source locks</summary>
                <ul>
                  {(llmTransparency.normalization_notes || ['No normalization notes were recorded.']).map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              </details>
              <details>
                <summary>Model settings</summary>
                <pre>{transparencyText({
                  provider: llmTransparency.request.provider,
                  variant: llmTransparency.request.variant,
                  model: llmTransparency.request.model,
                  action: llmTransparency.request.action,
                  prompt_version: llmTransparency.request.prompt_version,
                  output_format: llmTransparency.request.output_format,
                  settings: llmTransparency.request.settings,
                  application_options: llmTransparency.request.application_options,
                  source_subject: llmTransparency.request.source_subject,
                  usage: llmTransparency.response.usage,
                })}</pre>
              </details>
              <details open>
                <summary>Complete prompt</summary>
                <pre>{llmTransparency.request.prompt}</pre>
              </details>
              {llmTransparency.request.schema !== null && (
                <details>
                  <summary>Complete JSON schema</summary>
                  <pre>{transparencyText(llmTransparency.request.schema)}</pre>
                </details>
              )}
              <details open>
                <summary>Raw model output</summary>
                <pre>{llmTransparency.response.raw_output}</pre>
              </details>
              {llmTransparency.normalized_output !== undefined && (
                <details>
                  <summary>Normalized application record</summary>
                  <pre>{transparencyText(llmTransparency.normalized_output)}</pre>
                </details>
              )}
            </div>
            <div className="llm-transparency-actions">
              {llmCopyStatus && <span aria-live="polite">{llmCopyStatus}</span>}
              <button className="btn btn-secondary" onClick={() => setShowLlmTransparency(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => void copyLlmTransparency()}>
                Copy complete transcript
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="about-hero">
            <React.Suspense fallback={<div className="about-crowd about-crowd-idle" />}>
              <AboutSpriteBanner />
            </React.Suspense>
            <button className="modal-close modal-close-overlay" onClick={() => setShowAbout(false)} aria-label="Close dialog">
              <IoClose aria-hidden="true" />
            </button>
          </div>

          <div className="about-titlebar">
            <div className="about-titlebar-text">
              <h2 id="about-modal-title">Historical Persona Generator</h2>
              <p className="about-tagline">
                Everyone above was generated a moment ago. Point at one to see who they are.
              </p>
            </div>
            <span className="about-version">v0.1</span>
          </div>

          <div className="modal-body about-body">
            <p className="about-lede">
              Press <strong>Generate Random Persona</strong> and the app invents an ordinary person —
              a name, a household, a trade, a body, a language, a set of beliefs, a face — starting
              from a year and a place it draws first. Everything after aims to be historically
              authentic as possible in capturing life in a specific time and place (although true
              accuracy is impossible!). There is no pre-written list of people, no stock art, and no
              image model: the whole persona is procedurally generated from a set of data files, in
              your browser, with nothing sent anywhere.
            </p>

            <p className="about-byline">
              Made by{' '}
              <a href="https://benjaminpbreen.com" target="_blank" rel="noopener noreferrer">
                Benjamin Breen
              </a>
              , who teaches history at UC Santa Cruz, for a classroom exercise: generate a persona,
              then reconstruct a day in that life while fact-checking everything on the card. Most of
              the work happens in the fact-checking.
            </p>

            <ul className="about-facts">
              <li><b>10,000 BCE</b><span>earliest year it will draw</span></li>
              <li><b>~780</b><span>dated states and empires</span></li>
              <li><b>100+</b><span>dated language windows</span></li>
              <li><b>117 bn</b><span>lives in the sampling weights</span></li>
            </ul>

            <section className="about-section">
              <h3>How a persona gets built</h3>
              <ul className="about-list">
                <li>
                  <strong>A year and a place, first</strong> — then which state actually held that
                  place that year. A life that begins under Roman Britain and ends under something
                  else says so.
                </li>
                <li>
                  <strong>Work, status, household</strong> — a trade and a social position filtered by
                  what existed in that region and that century, with the household economy behind them.
                </li>
                <li>
                  <strong>Body and material life</strong> — age, health, disease exposure, possessions,
                  crops, clothing and tools, weighted by period demography and by what was actually
                  available locally.
                </li>
                <li>
                  <strong>Language and belief</strong> — a native language with its family, script and
                  period, plus how it was arrived at: attested from records, inferred, or an honest
                  guess with the scholarship cited.
                </li>
                <li>
                  <strong>Procedurally generated pixel art images</strong> — a portrait and a full-body
                  figure, drawn from the same facts as the rest. The same seed always draws the same
                  person.
                </li>
                <li>
                  <strong>A written life</strong> — a procedural biography with dated events, a family,
                  and an inner life, all from that one constraint set.
                </li>
              </ul>
            </section>

            <section className="about-section">
              <h3>Random out of what?</h3>
              <p className="about-para">
                <strong>True Frequency</strong> weights every era and region by how many people were
                really born there — pick a random human life and this is roughly what you get, which is
                most often a farmer in ancient or medieval South or East Asia.{' '}
                <strong>Explore</strong> flattens those weights just enough that the whole world is
                reachable in one sitting. Either way the card prints the real odds of the draw it made,
                so the flattening is never silent.
              </p>
            </section>

            <section className="about-section about-section-optional">
              <h3>The rest of it</h3>
              <ul className="about-list">
                <li>
                  <strong>Source Studio</strong> — hand it a Wikipedia article, a readable web page,
                  pasted text, or a real Old Bailey trial record, and it generates someone who could
                  have been in that room.
                </li>
                <li>
                  <strong>An AI biography</strong> — an optional model (GPT 5.4 nano) pass that writes
                  a longer life from a persona the generator has already built. It is the only part
                  that leaves your machine, and everything else works without it.
                </li>
                <li>
                  <strong>Take it away</strong> — a two-page PDF for handouts, a share link that freezes
                  one persona at a URL, or the full JSON record with its confidence labels intact.
                </li>
              </ul>
            </section>

            <section className="about-section">
              <h3>Who it&rsquo;s for</h3>
              <p className="about-para">
                Writers and game designers who need a character grounded in a period rather than in
                generic period flavour, tabletop players, teachers assembling a lesson, students,
                historians, and anyone curious about how differently a life could have gone.
              </p>
            </section>

            <section className="about-section">
              <h3>Related work</h3>
              <p className="about-para">
                Two other projects that put a reader inside an ordinary past life, both worth your
                time:{' '}
                <a href="https://veil-of-history.netlify.app" target="_blank" rel="noopener noreferrer">
                  Veil of History
                </a>{' '}
                by Ethan Mollick, and{' '}
                <a href="https://random-lives.github.io/random-lives/" target="_blank" rel="noopener noreferrer">
                  Random Lives
                </a>{' '}
                by Damon Binder.
              </p>
            </section>

            <p className="about-caveat">
              <IoWarning aria-hidden="true" />
              <span>
                A generated persona is a historically informed draft, not a reconstruction of a real
                person. This is a prototype and it will contain errors — dates, cultural details,
                social categories and visual cues can all be wrong or anachronistic. If you spot one,{' '}
                <a href="mailto:bebreen@ucsc.edu">tell me</a>.
              </span>
            </p>
          </div>

          <div className="about-footer">
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
              onClick={openDonate}
            >
              <IoHeart /> Support this project
            </button>
          </div>
          </motion.div>
        </motion.div>
      )}

      {randomDonationMilestone && !showDonate && (
        <motion.div
          className="modal-overlay random-support-overlay"
          onClick={() => setRandomDonationMilestone(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="random-support-modal-title"
          aria-describedby="random-support-modal-description"
        >
          <motion.div
            className={`modal random-support-modal random-support-modal-${randomDonationMilestone}`}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: [0.2, 0.75, 0.2, 1] }}
          >
            <div className="random-support-hero">
              <button
                type="button"
                className="modal-close random-support-close"
                onClick={() => setRandomDonationMilestone(null)}
                aria-label="Close donation appeal"
              >
                <IoClose aria-hidden="true" />
              </button>
              <span className="random-support-icon" aria-hidden="true">
                <GiSandsOfTime />
              </span>
              <span className="random-support-kicker">
                {RANDOM_DONATION_COPY[randomDonationMilestone].kicker}
              </span>
              <h2 id="random-support-modal-title">
                {RANDOM_DONATION_COPY[randomDonationMilestone].title}
              </h2>
            </div>
            <div className="modal-body random-support-body">
              <p id="random-support-modal-description">
                {RANDOM_DONATION_COPY[randomDonationMilestone].body}
              </p>
              <div className="random-support-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openDonate}
                  autoFocus
                >
                  <IoHeart aria-hidden="true" />
                  {RANDOM_DONATION_COPY[randomDonationMilestone].donate}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRandomDonationMilestone(null)}
                >
                  {RANDOM_DONATION_COPY[randomDonationMilestone].continue}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {aiGate && !showDonate && (
        <div
          className="modal-overlay ai-support-overlay"
          onClick={() => setAiGate(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-support-modal-title"
          aria-describedby="ai-support-modal-description"
        >
          <div
            className="modal ai-support-modal ai-support-modal-required"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ai-support-hero">
              <button
                type="button"
                className="modal-close ai-support-close"
                onClick={() => setAiGate(null)}
                aria-label="Close supporter access dialog"
              >
                <IoClose aria-hidden="true" />
              </button>
              <span className="ai-support-heart" aria-hidden="true"><IoHeart /></span>
              <span className="ai-support-kicker">Supporter access</span>
              <h2 id="ai-support-modal-title">
                {aiGate.action === 'schema'
                  ? 'You have used your three free persona records'
                  : 'You have used your five free AI biographies'}
              </h2>
            </div>
            <div className="modal-body ai-support-body">
              <p id="ai-support-modal-description">
                {aiGate.action === 'schema'
                  ? 'The evidence-aware call creates a compact Talkie persona record. Additional records use three credits; a verified donation unlocks enough credit for this and many more biographies.'
                  : 'Procedural personas remain free and unlimited. To keep model-generated biographies sustainable, additional AI requests unlock after a verified donation.'}
              </p>
              <div className="ai-support-credit-card">
                <strong>Donate once, receive 50 AI credits</strong>
                <span>Valid for 30 days · biographies use 1 credit · persona records use 3</span>
              </div>
              <div className="ai-support-actions">
                <button
                  type="button"
                  className="btn btn-primary ai-support-donate-button"
                  onClick={openDonate}
                  autoFocus
                >
                  <IoHeart aria-hidden="true" />
                  Donate & unlock 50 credits
                </button>
              </div>
              <button
                type="button"
                className="ai-support-check"
                onClick={() => void checkSupporterAccess()}
              >
                Already donated? Check supporter access
              </button>
            </div>
          </div>
        </div>
      )}

      {costConfirm && !showDonate && (
        <motion.div
          className="modal-overlay"
          onClick={() => setCostConfirm(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-cost-modal-title"
        >
          <motion.div
            className="modal ai-cost-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="modal-header">
              <h2 id="ai-cost-modal-title">{AI_COST_COPY[costConfirm.kind].title}</h2>
              <button className="modal-close" onClick={() => setCostConfirm(null)} aria-label="Close dialog">
                <IoClose aria-hidden="true" />
              </button>
            </div>
            <div className="modal-body ai-cost-body">
              <p>{AI_COST_COPY[costConfirm.kind].lead}</p>
              <p>{AI_COST_COPY[costConfirm.kind].detail}</p>
              <p className="ai-cost-ask">
                This tool is free and carries no ads; the API bill is paid out of pocket.
                If you get use out of it, please consider chipping in.
              </p>
              <div className="ai-cost-actions">
                <button
                  className="btn btn-secondary"
                  onClick={openDonate}
                >
                  <IoHeart aria-hidden="true" />
                  Donate
                </button>
                <button className="btn btn-primary" onClick={confirmAiRun}>
                  {AI_COST_COPY[costConfirm.kind].confirm}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AnimatePresence only retains valid React elements as direct children.
          A raw React portal is filtered out, which previously left
          showDonate=true with no .donate-support-overlay in the DOM. */}
      {showDonate && (
        <React.Fragment key="donate-dialog-portal">
        {createPortal(
        <div
          className="modal-overlay donate-support-overlay"
          onClick={closeDonate}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-modal-title"
        >
          <div
            className="modal donate-modal"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="donate-banner">
            <img
              src="/banners/smallbanner1.jpg"
              alt="Support Historical Persona Generator"
              className="donate-banner-image"
            />
            <button className="modal-close modal-close-overlay" onClick={closeDonate} aria-label="Close dialog">
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
                  of this tool and future educational projects. A verified donation also
                  unlocks 50 AI credits for 30 days in this browser.
                </p>
                <a
                  href={aiAccess?.donateUrl || '/api/ai-access?checkout=1'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary donate-btn"
                >
                  Donate via Stripe
                </a>
              </div>
            </div>

            <p className="donate-research-note">
              If you’re a researcher and want to experiment with this yourself, you can{' '}
              <a
                href="https://github.com/benjaminbreen/HistoricalPersonaGenerator"
                target="_blank"
                rel="noopener noreferrer"
              >
                clone the project on GitHub
              </a>{' '}
              or <a href="mailto:breen85@gmail.com">contact me</a> to discuss collaborations.
            </p>

            <p className="donate-footer">
              Thank you for your support! Every contribution helps make historical education more accessible.
            </p>
          </div>
          </div>
        </div>,
        document.body
        )}
        </React.Fragment>
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
            {/* The name, not "Character Details" — the reader knows what they
                opened. The line beneath places them before the columns start. */}
            <div className="modal-header secrets-modal-header">
              <div className="secrets-modal-title">
                <h2>{persona.character.name}</h2>
                <p className="secrets-modal-subtitle">{personaSummaryLine(persona)}</p>
              </div>
              <button className="modal-close" onClick={() => setShowSecrets(false)}>
                <IoClose />
                Close
              </button>
            </div>
            <div className="modal-body two-column-layout">
              {/* The face and the standing body hold their own rail, out of the
                  scroll: the reader keeps looking at the person while the
                  descriptions move past them. */}
              <div className="character-rail">
                <div
                  className="portrait-section-large clickable-portrait"
                  onClick={handlePortraitClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handlePortraitClick()}
                  title="Click to cycle through expressions"
                >
                  <PixelPortrait
                    character={persona.character}
                    size={210}
                    temporaryExpression={expressionCycle[portraitExpressionIndex].expression}
                  />
                  <div className="expression-label">
                    <span className="expression-indicator">
                      {expressionCycle[portraitExpressionIndex].label}
                    </span>
                    <span className="expression-hint">Click to change expression</span>
                  </div>
                </div>
                <div className="sprite-figure-panel" title="Full figure">
                  {/* The stage carries the shadow and the ground line; without
                      them the figure hangs in the white and the weight shift
                      reads as jitter rather than standing. */}
                  <div className="sprite-figure-stage">
                    <React.Suspense fallback={null}>
                      <SpriteFigure
                        persona={persona}
                        facing="right"
                        scale={1}
                        command={detailsIdlePosture}
                      />
                    </React.Suspense>
                  </div>
                  <div className="sprite-figure-caption">
                    {persona.character.equippedItems?.torso?.name ?? 'Full figure'}
                  </div>
                </div>
              </div>

              {/* Middle column: appearance */}
              <div className="left-column-appearance">
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
                            {describeOrnament(piece as any)}
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
                    {persona.character.appearance.legwear
                      && !/^(none|bare)$/i.test(persona.character.appearance.legwear.name) && (
                      <div className="appearance-item">
                        <span className="label">Legwear</span>
                        <span className="value">
                          {persona.character.appearance.legwear.adjectives?.join(', ')} {persona.character.appearance.legwear.material} {persona.character.appearance.legwear.name}
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

                {/* The same numbers the printed card carries. They were only
                    ever visible in the PDF, which is a strange place to hide
                    the one part of the sheet that is a game statistic. */}
                <div className="secrets-section">
                  <h3>Attributes</h3>
                  <div className="attribute-score-grid">
                    {ATTRIBUTE_SCORES.map(({ key, abbr, label }) => (
                      <div className="attribute-score" key={key} title={label}>
                        <span className="attribute-abbr">{abbr}</span>
                        <span className="attribute-value">
                          {persona.character.stats?.[key] ?? '—'}
                        </span>
                      </div>
                    ))}
                    <div className="attribute-score attribute-score-health" title="Health">
                      <span className="attribute-abbr">HP</span>
                      <span className="attribute-value">
                        {persona.character.health ?? '—'}/{persona.character.maxHealth ?? '—'}
                      </span>
                    </div>
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
                        {persona.character.profession}
                        {/* A standing rather than a trade — "Big Man", "Maharaja" —
                            reads as a joke without the plain-English gloss beside it. */}
                        {standingRole(persona.character.profession) && (
                          <span className="profession-gloss">
                            {standingRole(persona.character.profession)!.gloss}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Religion</span>
                      <span className="value">
                        {createWikiLink(persona.character.religion, persona.character.religion)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">{statusFieldLabel(persona)}</span>
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
              <h2>{sourceLanguageData?.name || sourceLanguageLabel || persona.languageData.name}</h2>
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
                    <span className="language-detail-value">
                      {persona.languageAttribution?.confidence === 'conjectural' ? 'Hypothetical Language'
                        : persona.languageAttribution?.confidence === 'inferred' ? 'Inferred from Region'
                        : 'Reconstructed Language'}
                    </span>
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

              {persona.languageAttribution
                && !sourceLanguageData
                && !sourceLanguageLabel
                && persona.languageAttribution.label === persona.languageData.name && (
                <div className="language-section language-attribution">
                  <h3>How this was arrived at</h3>
                  <p className="language-confidence">
                    {confidenceBlurb(persona.languageAttribution.confidence)}
                  </p>
                  {persona.languageAttribution.note
                    && persona.languageAttribution.note !== persona.languageData.historicalContext && (
                    <p className="language-context">{persona.languageAttribution.note}</p>
                  )}

                  {persona.languageAttribution.hypotheses.length > 1 && (
                    <>
                      <h4 className="language-subhead">What was weighed</h4>
                      <ul className="language-hypotheses">
                        {persona.languageAttribution.hypotheses.map((hyp, idx) => (
                          <li key={hyp.label} className={idx === 0 ? 'hypothesis chosen' : 'hypothesis'}>
                            <span className="hypothesis-weight">{Math.round(hyp.probability * 100)}%</span>
                            <span className="hypothesis-label">{hyp.label}</span>
                            {hyp.note && <span className="hypothesis-note">{hyp.note}</span>}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {persona.languageAttribution.sources.length > 0 && (
                    <>
                      <h4 className="language-subhead">Sources</h4>
                      <ul className="language-sources">
                        {persona.languageAttribution.sources.map(source => (
                          <li key={source.id} className="language-source">
                            <span className="source-citation">
                              {source.authors} ({source.year}). <em>{source.title}</em>
                              {source.venue ? `. ${source.venue}` : ''}.
                            </span>
                            <span className="source-supports">{source.supports}</span>
                            {source.contested && (
                              <span className="source-contested">Contested: {source.contested}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <p className="language-method-note">
                    Where no records survive, this app names a language rather than leaving a
                    blank, and shows the reasoning here. The comparative method reaches roughly
                    eight thousand years; beyond that nothing can be named honestly, which is why
                    the generator stops at 10,000 BCE.
                  </p>
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
