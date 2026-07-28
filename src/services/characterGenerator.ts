/**
 * services/characterGenerator.ts - Enhanced character service with portrait integration
 */
import { PlayerCharacter, HistoricalEra, Item, CharacterStats, CharacterPersonality, CharacterSocialContext, Appearance, ClothingPiece, ClothingPalette, MapAreaDefinition, Gender, WealthLevel } from '../types';
import { PROFESSIONS, CHARACTER_NAMES, CulturalZone, STARTING_PACKAGES, ProfessionDefinition, PERSONAL_BELIEFS } from '../constants/index';
import { CHARACTER_NAMES as NAME_LISTS } from '../constants/characterData/names';
import { parseDateString } from '../utils/dateUtils';
import { createItemInstance, addItemToInventory, assembleStartingPackage } from '../utils/inventoryUtils';
import { ValueNoise } from '../utils/noise';
import { generateBaseProfile, determineSocialRole, generateNpcName, generateNpcNameDetailed, assignBeliefs, generateClothingPalette, generateCompleteOutfit, generateCulturalAppearance, adjustPersonalityForProfession, validateCharacterCoherence } from '../generation/common/npcUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { hexToColorName } from '../utils/colorUtils';
import { COLOR_WORDS, hasIntrinsicColor, nameForHex } from '../constants/gameData/colorNames';
import { CharacterSpecification } from './worldWeaverService';
import DiseaseService from './diseaseService';
import { AttributeBadgeService } from './attributeBadgeService';
import { findAttributeById } from '../constants/attributeDefinitions';
import { hasCapability } from '../constants/societyCapabilities';
import { getMarkingsForCharacter, selectRandomMarking, getRandomPattern, convertToAppearanceMarking, getMarkingProbability } from '../constants/characterData/culturalMarkings';
import { formatSocialStatusForEra, sampleSocialStatus } from './socialStatusService';
import { reconcileEpithet } from '../constants/characterData/nameConventions';
import { applyAttributeAppearance } from './attributeAppearanceService';
import { generateOrnament } from './ornamentService';
import { generateChildren, generateSiblings } from './householdService';
import { isClergyRoleCompatible } from '../constants/characterData/religionClergyRoles';
import { illnessRate, pickByPrevalence } from './diseasePrevalenceService';
import { getAreaClimate, hemisphereFor, seasonFor, thermalNeed } from './climateService';
import { describeBeliefSecondPerson, withIndefiniteArticle } from './narrativeTextService';
import { createHistoricalContext } from './historicalContextService';
import type { HistoricalContext } from '../types/historicalContext';
import { random as seededRandom } from '../utils/seededRandom';
import { devLog } from '../utils/devLog';

let characterIdCounter = 0;

function generateStartingCurrency(wealth: WealthLevel, noise: ValueNoise): number {
    const ranges: Record<WealthLevel, [number, number]> = {
        poor: [3, 12],
        modest: [10, 29],
        comfortable: [25, 59],
        wealthy: [60, 129],
        noble: [90, 199],
    };
    const [minimum, maximum] = ranges[wealth];
    return minimum + Math.floor(noise.random() * (maximum - minimum + 1));
}

function detectNameListKey(name: string): string | undefined {
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0]?.toLowerCase() || '';
    const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || '';
    let bestMatch: { key: string; score: number } | undefined;

    for (const [key, nameList] of Object.entries(NAME_LISTS)) {
        const surnameMatch = nameList.surname.some(surname => surname.toLowerCase() === lastName);
        const firstNameMatch = nameList.male.some(first => first.toLowerCase() === firstName) ||
            nameList.female.some(first => first.toLowerCase() === firstName);
        const score = surnameMatch ? 2 : firstNameMatch ? 1 : 0;
        if (score > (bestMatch?.score || 0)) {
            bestMatch = { key, score };
        }
    }

    return bestMatch?.key;
}

/**
 * Detect likely ethnicity/cultural origin from a character's name
 * Uses the existing name lists from constants to determine cultural zone
 */
export function detectEthnicityFromName(name: string): CulturalZone | null {
    // Split name into parts
    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0]?.toLowerCase() || '';
    const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || '';

    // Check each name list for matches
    for (const [listKey, nameList] of Object.entries(NAME_LISTS)) {
        // Check if first name exists in male or female lists
        const firstNameMatch = nameList.male.some(n =>
            n.toLowerCase() === firstName ||
            n.toLowerCase().replace(/[áéíóúàèìòùäëïöüâêîôûñç]/g, '') === firstName
        ) || nameList.female.some(n =>
            n.toLowerCase() === firstName ||
            n.toLowerCase().replace(/[áéíóúàèìòùäëïöüâêîôûñç]/g, '') === firstName
        );

        // Check if surname matches
        const surnameMatch = nameList.surname.some(s => {
            const cleanSurname = s.toLowerCase()
                .replace(/^(o'|mc|mac|de |von |van |le |la |del |della |di |da |al-|ibn |bin )/i, '');
            return cleanSurname === lastName || s.toLowerCase() === lastName;
        });

        if (firstNameMatch || surnameMatch) {
            // Map name list keys to cultural zones
            if (listKey.includes('CELTIC_IRISH') || listKey.includes('SCOTTISH') || listKey.includes('WELSH')) {
                return 'EUROPEAN'; // Celtic peoples
            }
            if (listKey.includes('ENGLISH') || listKey.includes('FRENCH') || listKey.includes('GERMAN') || listKey.includes('SAXON') ||
                listKey.includes('ITALIAN') || listKey.includes('SPANISH') || listKey.includes('PORTUGUESE') ||
                listKey.includes('DUTCH') || listKey.includes('SCANDINAVIAN') || listKey.includes('RUSSIAN') ||
                listKey.includes('POLISH') || listKey.includes('GREEK') || listKey.includes('FRANKISH') ||
                listKey.includes('NORMAN') || listKey.includes('BYZANTINE') || listKey.includes('SLAVIC') ||
                listKey.includes('HUNGARIAN') || listKey.includes('CZECH') || listKey.includes('ROMANIAN')) {
                return 'EUROPEAN';
            }
            if (listKey.includes('CHINESE') || listKey.includes('JAPANESE') || listKey.includes('KOREAN') ||
                listKey.includes('VIETNAMESE') || listKey.includes('MONGOLIAN') || listKey.includes('THAI') ||
                listKey.includes('KHMER') || listKey.includes('BURMESE')) {
                return 'EAST_ASIAN';
            }
            if (listKey.includes('ARABIC') || listKey.includes('PERSIAN') || listKey.includes('TURKISH') ||
                listKey.includes('HEBREW') || listKey.includes('BERBER') || listKey.includes('COPTIC') ||
                listKey.includes('NUBIAN')) {
                return 'MENA';
            }
            if (listKey.includes('INDIAN') || listKey.includes('BENGALI') || listKey.includes('PUNJABI') ||
                listKey.includes('TAMIL') || listKey.includes('GUJARATI') || listKey.includes('MARATHI') ||
                listKey.includes('TELUGU') || listKey.includes('KANNADA') || listKey.includes('MALAYALAM') ||
                listKey.includes('NEPALI') || listKey.includes('SINHALA')) {
                return 'SOUTH_ASIAN';
            }
            if (listKey.includes('AFRICAN') || listKey.includes('SWAHILI') || listKey.includes('YORUBA') ||
                listKey.includes('HAUSA') || listKey.includes('ZULU') || listKey.includes('ETHIOPIAN') ||
                listKey.includes('SOMALI') || listKey.includes('MAASAI') || listKey.includes('BANTU')) {
                return 'SUB_SAHARAN_AFRICAN';
            }
            if (listKey.includes('POLYNESIAN') || listKey.includes('MELANESIAN') || listKey.includes('MALAY') ||
                listKey.includes('INDONESIAN') || listKey.includes('ABORIGINAL') || listKey.includes('MAORI') ||
                listKey.includes('HAWAIIAN') || listKey.includes('SAMOAN') || listKey.includes('TAHITIAN')) {
                return 'OCEANIA';
            }
            if (listKey.includes('INCA') || listKey.includes('MAYA') || listKey.includes('AZTEC') ||
                listKey.includes('GUARANI') || listKey.includes('QUECHUA') || listKey.includes('TUPI') ||
                listKey.includes('MAPUCHE') || listKey.includes('AYMARA')) {
                return 'SOUTH_AMERICAN';
            }
            if (listKey.includes('IROQUOIS') || listKey.includes('ALGONQUIAN') || listKey.includes('SIOUX') ||
                listKey.includes('APACHE') || listKey.includes('NAVAJO') || listKey.includes('CHEROKEE') ||
                listKey.includes('PUEBLO') || listKey.includes('INUIT') || listKey.includes('CREEK') ||
                listKey.includes('CHOCTAW') || listKey.includes('PLAINS_NATIVE')) {
                return 'NORTH_AMERICAN_PRE_COLUMBIAN';
            }
            if (listKey.includes('NORTH_AMERICAN_COLONIAL') || listKey.includes('AMERICAN')) {
                return 'NORTH_AMERICAN_COLONIAL';
            }
        }
    }

    return null;
}

interface GenerationContext {
    date: string;
    location: string;
    region: string;
    era?: HistoricalEra; // Optional: if provided, overrides era from date parsing
    culturalZone?: CulturalZone; // Optional: if provided, overrides zone from location mapping
    historicalContext?: HistoricalContext;
    seed?: number;
}

const isSoutheastAsianContext = (context: Pick<GenerationContext, 'region' | 'location'>): boolean =>
    /(southeast asia|indochina|maritime|malay|java|sumatra|borneo|sulawesi|spice islands|malacca|philippines|vietnam|tonkin|annam|cochinchina|mekong|siam|thailand|ayutthaya|cambodia|khmer|angkor|burma|myanmar|irrawaddy|bagan|rangoon)/i.test(
        `${context.region || ''} ${context.location || ''}`
    );

const isEarlyMedievalGermanicContext = (
    context: Pick<GenerationContext, 'region' | 'location'>,
    year: number
): boolean =>
    year >= 480 &&
    year < 900 &&
    /(hamburg coast|saxon|brandenburg|jutland|north sea|lower elbe)/i.test(
        `${context.region || ''} ${context.location || ''}`
    );

/**
 * Broad cultural zones are routing keys, not identity. For the archipelago,
 * choose a local name track from the actual place and the already-resolved
 * religion instead of allowing an uncoordinated colonial name to repaint the
 * character after generation.
 */
const resolveContextualNameKey = (
    context: GenerationContext,
    year: number,
    religion: string | undefined,
    noise: ValueNoise
): string | undefined => {
    // Hamburg and the lower Elbe were Saxon-speaking in this period. Resolve
    // this before profession or broad-zone fallbacks can introduce modern
    // surnames from an unrelated naming pool.
    if (isEarlyMedievalGermanicContext(context, year)) {
        return 'SAXON_EARLY_MEDIEVAL';
    }

    if (!isSoutheastAsianContext(context)) return undefined;

    const place = `${context.region || ''} ${context.location || ''}`.toLowerCase();
    if (/(vietnam|tonkin|annam|cochinchina|mekong delta|hanoi|saigon)/.test(place)) {
        return 'VIETNAMESE';
    }
    if (/(siam|thailand|ayutthaya|bangkok|sukhothai)/.test(place)) {
        return year >= 1350 && year < 1767 ? 'THAI_AYUTTHAYA' : 'THAI';
    }
    if (/(cambodia|khmer|angkor|phnom penh)/.test(place)) {
        return year >= 800 && year < 1431 ? 'KHMER_ANGKOR' : 'KHMER';
    }
    if (/(burma|myanmar|irrawaddy|bagan|rangoon|yangon|mandalay)/.test(place)) {
        return 'BURMESE';
    }
    if (/(philippines|luzon|visayas|mindanao|manila|cebu)/.test(place)) {
        return 'FILIPINO';
    }
    if (place.includes('java')) return 'JAVANESE';
    if (/(malacca|malay peninsula)/.test(place)) {
        return year >= 1300 && /islam|muslim|sunni|shia/i.test(religion || '')
            ? 'MALAY_ISLAMIC_HISTORICAL'
            : 'MALAY';
    }
    if (
        year >= 1300 &&
        /(spice islands|maluku|molucca|ternate|tidore)/.test(place) &&
        /islam|muslim|sunni|shia/i.test(religion || '')
    ) {
        return 'MALAY_ISLAMIC_HISTORICAL';
    }
    if (/(spice islands|maluku|molucca|sumatra|borneo|sulawesi|maritime)/.test(place)) {
        if (year >= 1300 && /islam|muslim|sunni|shia/i.test(religion || '')) {
            return 'MALAY_ISLAMIC_HISTORICAL';
        }
        return noise.random() < 0.5 ? 'MALAY' : 'INDONESIAN';
    }
    return undefined;
};

function cmToFeetAndInches(cm: number): string {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
}

// Religion descriptions for procedural backstory generation
const RELIGION_DESCRIPTIONS: Record<string, string> = {
    // Traditional European
    'Roman Catholicism': 'finding solace in ancient rituals and the guidance of Church tradition',
    'Protestantism': 'emphasizing personal faith and the authority of scripture',
    'Eastern Orthodoxy': 'honoring mystical traditions and the veneration of holy icons',
    'Celtic Christianity': 'blending ancient Celtic wisdom with Christian teachings',
    'Celtic Druidism': 'following the old ways of sacred groves and seasonal cycles',
    'Norse Paganism': 'honoring the gods of Asgard and the warrior\'s path to Valhalla',
    'Greek Polytheism': 'making offerings to the Olympian gods for their favor',
    'Roman Polytheism': 'observing the rites that maintain the pax deorum',
    'Germanic Paganism': 'venerating the forest gods and ancestral spirits',
    'Slavic Paganism': 'honoring the spirits of household, field, and forest',

    // Abrahamic
    'Judaism': 'maintaining the ancient covenant through study and observance',
    'Islam': 'submitting to divine will through daily prayer and devotion',
    'Sunni Islam': 'following the example of the Prophet and his companions',
    'Shia Islam': 'revering the family of the Prophet as rightful guides',
    'Sufi Islam': 'seeking divine union through mystical practice and dhikr',
    'Early Christianity': 'following the new covenant in small, devoted communities',

    // Asian Traditions
    'Buddhism': 'seeking liberation from suffering through the Noble Eightfold Path',
    'Hinduism': 'honoring the eternal dharma and countless manifestations of the divine',
    'Vedic Religion': 'maintaining sacrificial rites and hymns to the Vedic gods',
    'Confucianism': 'cultivating virtue through ritual propriety and filial devotion',
    'Taoism': 'following the natural way and seeking harmony with the Dao',
    'Shinto': 'maintaining purity and honoring the kami of land and ancestors',
    'Zen Buddhism': 'pursuing enlightenment through meditation and direct insight',

    // Indigenous & Shamanic
    'Shamanism': 'walking between worlds to commune with spirits and ancestors',
    'Animism': 'recognizing the living spirit within all things',
    'Totemism': 'drawing strength from your clan\'s sacred animal guardian',
    'Ancestor Worship': 'maintaining the vital connection with those who came before',

    // Regional/Cultural Specific
    'Vodou': 'serving the lwa and honoring both African and Catholic traditions',
    'Santería': 'working with the orishas through ritual and sacrifice',
    'Tengrism': 'revering the Eternal Blue Sky and the spirits of the steppe',
    'Zoroastrianism': 'supporting the cosmic battle of light against darkness',
    'Arabian Polytheism': 'honoring the local gods, sacred places, and ancestral customs of Arabia',

    // Modern/Secular
    'Atheism': 'trusting in reason and human capability rather than divine intervention',
    'Agnosticism': 'acknowledging the limits of knowledge about divine matters',
    'Deism': 'believing in a creator who set the universe in motion',
    'Secularism': 'focusing on worldly concerns rather than spiritual matters',

    // Native American (respectful generalizations)
    'Great Spirit Worship': 'honoring the Great Spirit that flows through all creation',
    'Sun Dance Religion': 'participating in sacred ceremonies of renewal and sacrifice',
    'Pueblo Religion': 'maintaining the sacred balance through kiva ceremonies',
    'Iroquois Longhouse Religion': 'following the ways taught by the Peacemaker',

    // Default fallback
    'Unknown': 'following your own spiritual path'
};

/**
 * Fallback phrases for attribute ids, keyed by id. Current definitions carry
 * their own `phrase` field, which is what generateAttributeSentence prefers;
 * this map only catches ids from older saved personas. Do not add to it — put
 * the phrase on the attribute definition instead, so the two cannot drift.
 */
const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
    // Physical
    'strong': 'exceptionally strong',
    'frail': 'physically frail',
    'blind': 'completely blind',
    'deaf': 'deaf',
    'mute': 'unable to speak',
    'lame': 'walking with a limp',
    'one_armed': 'one-armed',
    'nearsighted': 'nearsighted',
    'athletic': 'naturally athletic',
    'limping': 'walking with a limp',
    'scarred': 'covered in scars',
    'giant': 'unusually tall',
    'tiny': 'remarkably small',
    'towering': 'unusually tall',
    'diminutive': 'remarkably small',
    'beautiful': 'strikingly attractive',
    'disfigured': 'visibly disfigured',

    // Mental
    'genius': 'brilliant',
    'simple': 'simple-minded',
    'slow_witted': 'slow-witted',
    'scholar': 'well-educated',
    'educated': 'educated',
    'polyglot': 'fluent in many languages',
    'sharp_memory': 'gifted with a prodigious memory',
    'forgetful': 'terribly forgetful',
    'sharp_eyed': 'have keen eyesight',
    'keen_eyed': 'keen-eyed',
    'dreamer': 'prone to daydreaming',

    // Personality
    'charming': 'naturally charming',
    'shy': 'painfully shy',
    'lucky': 'remarkably lucky',
    'unlucky': 'plagued by bad luck',
    'honest': 'compulsively honest',
    'liar': 'a habitual liar',
    'generous': 'exceptionally generous',
    'greedy': 'consumed by greed',
    'brave': 'fearless',
    'coward': 'cowardly',
    'hot_tempered': 'hot-tempered',

    // Spiritual
    'spiritual': 'deeply spiritual',
    'prophet': 'gifted with divine visions',
    'blessed': 'blessed by fortune',
    'cursed': 'believed to be cursed',
    'mystic': 'blessed with mystical insights',
    'skeptic': 'doubtful of all religions',

    // Skills/Background
    'survivor': 'a hardened survivor',
    'hunter': 'an experienced hunter',
    'healer': 'a skilled healer',
    'merchant': 'good with money',
    'sailor': 'experienced at sea',
    'farmer': 'an experienced farmer',
    'knight_errant': 'a former soldier',

    // Conditions
    'alcoholic': 'dependent on drink',
    'hard_of_hearing': 'hard of hearing',
    'quarrelsome': 'quick to anger',
    'paranoid': 'deeply paranoid',
    'devout': 'devoutly religious',
    'gambler': 'addicted to gambling',
    'melancholic': 'chronically sad',
    'glutton': 'constantly eating',
    'ascetic': 'disaindful of worldly pleasures',
    'curious': 'insatiably curious',
    'cautious': 'extremely cautious',
    'reckless': 'dangerously reckless',
    'patient': 'endlessly patient',
    'impatient': 'terribly impatient',
    'stubborn': 'incredibly stubborn',
    'adaptable': 'highly adaptable',

    // Social
    'animal_lover': 'an animal lover',
    'loner': 'one who prefers solitude',
    'leader': 'a natural leader',
    'follower': 'prefer to follow',
    'romantic': 'hopelessly romantic',
    'orphan': 'an orphan',
    'twin': 'a twin',
    'noble_blood': 'of ancient but fallen family',
    'nightowl': 'most active at night',
    'weather_sense': 'able to predict weather',

    // Cultural/Professional
    'calligrapher': 'a skilled calligrapher',
    'artist': 'an artist',
    'poet': 'a poet',
    'musician': 'a musician',
    'craftsman': 'a craftsman',

    // New universal ones
    'veteran': 'a veteran of war',
    'street_smart': 'street smart',
    'pessimist': 'deeply pessimistic',
    'optimist': 'eternally optimistic',
    'insomniac': 'an insomniac',
    'foreigner': 'a foreigner here',
    'local': 'a local',
    'wanderer': 'a wanderer',
    'eldest_child': 'the eldest child',
    'youngest_child': 'the youngest child',
    'eldest': 'the eldest child',
    'youngest': 'the youngest child',
    'exile': 'an exile',
    'former_slave': 'formerly enslaved',
    'skilled_hands': 'skilled with your hands',
    'storyteller': 'a storyteller'
};

// Generate attribute sentence for a character
// Helper to format hairstyle descriptions properly
function formatHairstyle(hairstyle: string): string {
    const styleMap: Record<string, string> = {
        'high_forehead': 'with a high forehead',
        'receding_hairline': 'with a receding hairline',
        'widow_peak': 'with a widow\'s peak',
        'straight_bangs': 'with straight bangs',
        'side_part': 'parted to the side',
        'center_part': 'parted in the center',
        'swept_back': 'swept back',
        'shaved_sides': 'with shaved sides',
        'long_flowing': 'long and flowing',
        'tight_curls': 'in tight curls',
        'loose_curls': 'in loose curls',
        'braided': 'in braids',
        'top_knot': 'in a top knot',
        'man_bun': 'in a bun',
        'bun': 'in a bun',
        'ponytail': 'in a ponytail',
        'shaved_head': 'shaved',
        'close_cropped': 'close-cropped',
        'shoulder_length': 'shoulder-length',
        'waist_length': 'waist-length',
        'afro': 'in an afro',
        'cornrows': 'in cornrows',
        'dreadlocks': 'in dreadlocks',
        'mohawk': 'in a mohawk',
        'pigtails': 'in pigtails',
        'twin_buns': 'in twin buns',
        'elaborate_updo': 'in an elaborate updo',
        'messy': 'worn messy',
        'tousled': 'tousled',
        'slicked_back': 'slicked back',
    };

    return styleMap[hairstyle] || hairstyle.replace(/_/g, ' ');
}

export function generateAttributeSentence(
    character: { attributes?: Array<{ id: string; name: string; phrase?: string }> }
): string | null {
    if (!character.attributes || character.attributes.length === 0) {
        return null;
    }

    const attributePhrases = character.attributes
        .slice(0, 3) // Limit to 3 attributes max
        .map(attr =>
            attr.phrase
            || ATTRIBUTE_DESCRIPTIONS[attr.id]
            || findAttributeById(attr.id)?.phrase
            || `a ${attr.name.toLowerCase()}`
        )
        .filter(phrase => phrase); // Remove any undefined

    if (attributePhrases.length === 0) {
        return null;
    }

    if (attributePhrases.length === 1) {
        return `You are ${attributePhrases[0]}.`;
    } else if (attributePhrases.length === 2) {
        return `You are ${attributePhrases[0]} and ${attributePhrases[1]}.`;
    } else {
        const lastPhrase = attributePhrases.pop();
        return `You are ${attributePhrases.join(', ')}, and ${lastPhrase}.`;
    }
}

// Enhanced backstory that incorporates personality and removes clothing descriptions
function _generateProceduralBackstory(character: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'>): string {
    const sentences = [];
    const heightStr = cmToFeetAndInches(character.appearance.height);

    // Sentence 1: Origin and basic identity (fixed grammar)
    sentences.push(`Hailing from ${character.birthplace}, you are ${character.name}, ${withIndefiniteArticle(`${character.age}-year-old ${character.gender.toLowerCase()}`)}.`);

    // Sentence 2: Profession with calculated years
    const professionYears = Math.max(1, Math.min(
        character.age - 14, // Can't work before age 14
        Math.floor((character.age - 14) * 0.7) // Not their entire adult life
    ));
    sentences.push(`You have been ${withIndefiniteArticle(character.profession.toLowerCase())} for ${professionYears} year${professionYears === 1 ? '' : 's'}.`);

    // Sentence 3: Physical Description
    const rawEyeColorName = hexToColorName(character.appearance.eyeColor).toLowerCase().replace(/\b(\w+)\s+\1\b/g, '$1');
    const rawHairColorName = hexToColorName(character.appearance.hairColor).toLowerCase().replace(/\b(\w+)\s+\1\b/g, '$1');
    const eyeColorName = /blue|navy|cobalt/.test(rawEyeColorName) ? 'blue'
        : /green|olive/.test(rawEyeColorName) ? 'green'
        : /gray|grey|silver|slate/.test(rawEyeColorName) ? 'gray'
        : /hazel|amber|gold|yellow/.test(rawEyeColorName) ? 'hazel'
        : /black/.test(rawEyeColorName) ? 'dark brown'
        : 'brown';
    const hairColorName = /gray|grey|silver/.test(rawHairColorName) ? 'gray'
        : /gold|goldenrod|yellow|blond/.test(rawHairColorName) ? 'golden blond'
        : /red|crimson|auburn|copper/.test(rawHairColorName) ? 'auburn'
        : /black|nearly black/.test(rawHairColorName) ? 'black'
        : 'brown';
    const hairstyleDesc = formatHairstyle(character.appearance.hairstyle);
    let physicalDesc = `You have ${withIndefiniteArticle(character.appearance.build)} build, standing at ${heightStr}. Your eyes are a shade of ${eyeColorName} and your hair is ${hairColorName}, worn ${hairstyleDesc}.`;
    if (character.appearance.facialHair && character.appearance.facialHairStyle) {
        const facialHair = character.appearance.facialHairStyle.replace(/_/g, ' ');
        const facialHairPhrase = /^(?:stubble|mutton chops)$/i.test(facialHair)
            ? facialHair
            : withIndefiniteArticle(facialHair);
        physicalDesc += ` You wear ${facialHairPhrase}.`;
    }
    sentences.push(physicalDesc);

    // Sentence 4: Attributes (if any)
    const attributeSentence = generateAttributeSentence(character);
    if (attributeSentence) {
        sentences.push(attributeSentence);
    }

    // Sentence 5: Religion description
    if (character.religion) {
        const religionDesc = RELIGION_DESCRIPTIONS[character.religion] || RELIGION_DESCRIPTIONS['Unknown'];
        sentences.push(`You follow ${character.religion}, ${religionDesc}.`);
    }

    // Sentence 5: Personality/Demeanor
    let demeanorSentence = `You carry yourself with ${withIndefiniteArticle(character.appearance.affect)} demeanor.`;
    if (character.personality.agreeableness < 0.3) {
        demeanorSentence = `You carry yourself with ${withIndefiniteArticle(character.appearance.affect)} demeanor. Few would call you approachable, but many respect your directness.`;
    } else if (character.personality.openness > 0.8) {
        demeanorSentence = `You carry yourself with ${withIndefiniteArticle(character.appearance.affect)} demeanor. Your curiosity about the world and its mysteries is palpable.`;
    } else if (character.personality.conscientiousness > 0.8) {
        demeanorSentence = `You are known for your meticulous and reliable nature. You carry yourself with ${withIndefiniteArticle(character.appearance.affect)} demeanor.`;
    }
    sentences.push(demeanorSentence);

    // Sentence 7: Guiding Principle/Belief (simplified without filler)
    if (character.beliefs && character.beliefs.length > 0) {
        const coreBeliefEntry = [...character.beliefs].sort((a,b) => b.conviction - a.conviction)[0];
        const coreBelief = PERSONAL_BELIEFS.find(b => b.id === coreBeliefEntry.beliefId);
        if (coreBelief) {
             sentences.push(describeBeliefSecondPerson(coreBelief.text));
        }
    } else {
        if (character.socialContext && character.socialContext.wanderlust > 0.8) {
            sentences.push(`A deep-seated wanderlust has always pulled you toward the horizon, making it difficult to ever truly settle down.`);
        } else if (character.socialContext && character.socialContext.ambition > 0.8) {
            sentences.push(`A fierce ambition drives you to seek wealth and power, leaving little room for sentiment.`);
        } else {
            sentences.push(`You are guided by the simple principle that the old ways are the best ways, a philosophy that shapes your interactions with the world.`);
        }
    }

    return sentences.join(' ');
}

/**
 * Generate a comprehensive, historically accurate family for a character
 * Includes parents, siblings, spouse, and children based on age and historical context
 */
function generateProceduralFamily(
    character: any,
    culturalZone: CulturalZone,
    region: string,
    era: HistoricalEra,
    currentYear: number,
    attributes: any[],
    noise: ValueNoise,
    characterBirthYear?: number,  // CRITICAL: Pass actual birthYear to avoid recalculation
    familyNameKey?: string,
    /**
     * When the character's own name is a patronymic, the given name it refers
     * to — so the father is named the person the patronymic names.
     */
    fathersGivenName?: string,
    /** When the character carries a hereditary name, the family carries it too. */
    inheritedFamilyName?: string
): void {
    const age = character.age;

    // Bynames are given by neighbours to tell people apart, so a household of
    // "Atum the Short and Khenthap the Short" defeats the purpose. Track what
    // has been used and strip a repeat rather than re-rolling into another one.
    const usedEpithets = new Set<string>();
    const dedupeEpithet = (name: string): string => {
        const match = / (the [A-Z][A-Za-z-]+)$/.exec(name);
        if (!match) return name;
        if (!usedEpithets.has(match[1])) {
            usedEpithets.add(match[1]);
            return name;
        }
        return name.slice(0, name.length - match[1].length - 1).trim();
    };
    // CRITICAL FIX: Use the passed birthYear if provided, otherwise calculate
    // This is essential for family member navigation - when we click a parent,
    // their birthYear is explicitly set and should NOT be recalculated
    const birthYear = characterBirthYear !== undefined ? characterBirthYear : (currentYear - age);

    // Debug logging to verify birthYear handling
    devLog(`[generateProceduralFamily] ${character.name}: age=${age}, currentYear=${currentYear}, birthYear=${birthYear}` +
        (characterBirthYear !== undefined ? ` (USED passed birthYear=${characterBirthYear})` : ' (calculated)'));

    const gender = character.gender;
    const normalizedGender: 'male' | 'female' =
        String(gender).toLowerCase() === 'female' ? 'female' : 'male';

    // ===== PARENTS =====
    const parentAge = 25 + Math.floor(noise.random() * 15); // Parents 25-40 years older
    const fatherBirthYear = birthYear - parentAge;
    const motherBirthYear = birthYear - parentAge + Math.floor(noise.random() * 5); // Mother might be slightly younger

    // A father with the same name as his son is a real naming practice in some
    // cultures, but an *identical* name inside one nuclear family reads as a
    // generator fault rather than a patronymic — the card just says "His
    // parents are Siu and Yoyo" under a persona called Siu. Redraw a few times
    // before accepting a collision.
    const givenOf = (full: string): string =>
        (full || '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    const selfGiven = givenOf(character.name);
    const collides = (candidate: string): boolean => {
        const given = givenOf(candidate);
        return given.length > 0 && given === selfGiven;
    };

    let fatherGenerated = generateNpcNameDetailed('Male', culturalZone, region, fatherBirthYear, noise, familyNameKey);
    for (let attempt = 0; attempt < 4 && collides(fatherGenerated.given); attempt += 1) {
        fatherGenerated = generateNpcNameDetailed('Male', culturalZone, region, fatherBirthYear, noise, familyNameKey);
    }
    // If the character is "Wulf son of Ket", the father is Ket. His own name is
    // still built by his own culture's convention on top of that given name.
    const fatherName = inheritedFamilyName
        ? `${fathersGivenName || fatherGenerated.given} ${inheritedFamilyName}`
        : fathersGivenName
            ? fatherGenerated.full.replace(fatherGenerated.given, fathersGivenName)
            : fatherGenerated.full;
    let motherName = generateNpcName('Female', culturalZone, region, motherBirthYear, noise, familyNameKey);
    for (let attempt = 0; attempt < 4 && collides(motherName); attempt += 1) {
        motherName = generateNpcName('Female', culturalZone, region, motherBirthYear, noise, familyNameKey);
    }

    // Generate father's profession
    const fatherProfession = generateParentProfession('male', culturalZone, era, noise, currentYear, region);

    // Generate mother's profession (historically accurate)
    const motherProfession = generateMotherProfession(culturalZone, era, noise);

    character.family.push({
        name: dedupeEpithet(fatherName),
        relation: 'father',
        profession: fatherProfession,
        birthYear: fatherBirthYear
    });
    character.family.push({
        name: dedupeEpithet(motherName),
        relation: 'mother',
        profession: motherProfession,
        birthYear: motherBirthYear
    });

    // ===== SIBLINGS =====
    // The persona's mother's other births, walked by the same model that
    // produces the persona's own children: spacing, a fertile span that closes,
    // and each birth tested against the survivorship curve for its own year.
    // See householdService.
    const hasTwin = attributes.some(attr => attr.id === 'twin');

    const siblingBirths = generateSiblings(
        {
            age,
            currentYear,
            parentAgeGap: parentAge,
            culturalZone,
            wealth: (character as any).wealthLevel,
        },
        () => noise.random(),
    );

    // A twin is added separately below, so one birth from the walk gives way to
    // it rather than the twin being an extra child the mother did not bear.
    const siblings = hasTwin ? siblingBirths.slice(1) : siblingBirths;

    // Parents share a household with their children, so a given name already
    // spoken for is not drawn again. The name generator only ever checked the
    // mother against the father; with sibships now averaging five, the pool
    // collided within a household about one time in eight.
    const takenGivenNames = new Set<string>([selfGiven, givenOf(fatherName), givenOf(motherName)]
        .filter(given => given.length > 0));

    for (const birth of siblings) {
        const siblingGender = birth.sex;
        let siblingGenerated = generateNpcNameDetailed(siblingGender === 'male' ? 'Male' : 'Female', culturalZone, region, birth.birthYear, noise, familyNameKey);
        for (let attempt = 0; attempt < 5 && takenGivenNames.has(givenOf(siblingGenerated.given)); attempt += 1) {
            siblingGenerated = generateNpcNameDetailed(siblingGender === 'male' ? 'Male' : 'Female', culturalZone, region, birth.birthYear, noise, familyNameKey);
        }
        takenGivenNames.add(givenOf(siblingGenerated.given));
        // Siblings share a hereditary name, and share a father in a patronymic.
        const siblingName = inheritedFamilyName
            ? `${siblingGenerated.given} ${inheritedFamilyName}`
            : fathersGivenName && siblingGenerated.patronymicFrom
                ? siblingGenerated.full.replace(siblingGenerated.patronymicFrom, fathersGivenName)
                : siblingGenerated.full;

        character.family.push({
            name: dedupeEpithet(siblingName),
            relation: siblingGender === 'male' ? 'brother' : 'sister',
            age: birth.age,
            birthYear: birth.birthYear,
            ...(birth.isDeceased ? { isDeceased: true, deathYear: birth.deathYear } : {}),
        });
    }

    // Add twin sibling if character has Twin attribute
    if (hasTwin) {
        const twinGender = noise.random() > 0.5
            ? normalizedGender
            : (normalizedGender === 'male' ? 'female' : 'male');
        const twinName = generateNpcName(twinGender === 'male' ? 'Male' : 'Female', culturalZone, region, birthYear, noise, familyNameKey);
        character.family.push({
            name: dedupeEpithet(twinName),
            relation: 'twin',
            age: age,
            birthYear: birthYear
        });
    }

    // ===== SPOUSE =====
    // Marriage age varies by era and culture
    const marriageAge = getHistoricalMarriageAge(era, normalizedGender, noise);

    if (age >= marriageAge && noise.random() > 0.3) { // 70% chance of being married if old enough
        const spouseAgeGap = Math.floor(noise.random() * 10) - 5; // Spouse -5 to +5 years
        const spouseAge = age + spouseAgeGap;
        const spouseBirthYear = currentYear - spouseAge;
        const spouseGender = normalizedGender === 'male' ? 'female' : 'male';
        const spouseName = generateNpcName(spouseGender === 'male' ? 'Male' : 'Female', culturalZone, region, spouseBirthYear, noise, familyNameKey);
        const spouseProfession = spouseGender === 'male'
            ? generateParentProfession('male', culturalZone, era, noise, currentYear, region)
            : generateMotherProfession(culturalZone, era, noise);

        character.family.push({
            name: dedupeEpithet(spouseName),
            relation: 'spouse',
            age: spouseAge,
            profession: spouseProfession,
            birthYear: spouseBirthYear
        });

        // ===== CHILDREN =====
        // Births are walked rather than counted, so spacing, birth order and
        // infant mortality all come out of one model. See householdService.
        const births = generateChildren(
            {
                age,
                sex: normalizedGender === 'male' ? 'male' : 'female',
                currentYear,
                marriageAge,
                spouseAge,
                culturalZone,
                wealth: (character as any).wealthLevel,
            },
            () => noise.random(),
        );

        for (const birth of births) {
            const childName = generateNpcName(
                birth.sex === 'male' ? 'Male' : 'Female',
                culturalZone, region, birth.birthYear, noise, familyNameKey);

            // Children worked. A twelve-year-old with no trade listed is modern
            // childhood projected backwards onto societies that had no such thing.
            const oldEnoughToWork = !birth.isDeceased && birth.age >= 12;
            const childProfession = oldEnoughToWork
                ? (birth.sex === 'male'
                    ? generateParentProfession('male', culturalZone, era, noise, currentYear, region)
                    : generateMotherProfession(culturalZone, era, noise))
                : undefined;

            character.family.push({
                name: dedupeEpithet(childName),
                relation: birth.sex === 'male' ? 'son' : 'daughter',
                age: birth.age,
                birthYear: birth.birthYear,
                ...(childProfession ? { profession: childProfession } : {}),
                ...(birth.isDeceased ? { isDeceased: true, deathYear: birth.deathYear } : {}),
            });
        }
    }
}

/**
 * Generate father's profession based on cultural zone and era
 */
function generateParentProfession(
    gender: 'male' | 'female',
    culturalZone: CulturalZone,
    era: HistoricalEra,
    noise: ValueNoise,
    year?: number,
    place?: string,
): string {
    // Common professions by era for fathers
    const professionsByEra: Record<HistoricalEra, string[]> = {
        [HistoricalEra.PREHISTORY]: ['Hunter', 'Gatherer', 'Fisher', 'Toolmaker', 'Warrior'],
        [HistoricalEra.ANTIQUITY]: ['Farmer', 'Herder', 'Craftsman', 'Merchant', 'Soldier', 'Laborer', 'Fisherman'],
        [HistoricalEra.MEDIEVAL]: ['Farmer', 'Blacksmith', 'Carpenter', 'Miller', 'Soldier', 'Merchant', 'Herder', 'Craftsman'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Farmer', 'Artisan', 'Merchant', 'Sailor', 'Soldier', 'Craftsman', 'Laborer'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['Factory Worker', 'Farmer', 'Miner', 'Artisan', 'Merchant', 'Clerk', 'Laborer', 'Sailor'],
        [HistoricalEra.MODERN_ERA]: ['Office Worker', 'Mechanic', 'Factory Worker', 'Teacher', 'Salesman', 'Driver', 'Technician', 'Farmer'],
        [HistoricalEra.FUTURE_ERA]: ['Technician', 'Engineer', 'Trader', 'Programmer', 'Pilot', 'Medic', 'Administrator']
    };

    let professions = professionsByEra[era] || professionsByEra[HistoricalEra.MEDIEVAL];

    // The cultural zone was accepted here and never read, which put blacksmiths
    // in eleventh-century Rapa Nui and millers in societies with no grain.
    if (year !== undefined) {
        const capabilityCtx = { year, culturalZone, placeLower: (place ?? '').toLowerCase() };
        const drop = (pattern: RegExp) => {
            const kept = professions.filter(p => !pattern.test(p));
            if (kept.length > 0) professions = kept;
        };
        if (!hasCapability('metallurgy', capabilityCtx)) drop(/blacksmith|smith|miner|mechanic|technician/i);
        if (!hasCapability('settled_agriculture', capabilityCtx)) drop(/farmer|miller|factory/i);
        if (!hasCapability('coinage', capabilityCtx)) drop(/merchant|trader|clerk|salesman/i);
        if (!hasCapability('urban_settlement', capabilityCtx)) drop(/factory worker|office worker|clerk/i);
    }

    return professions[Math.floor(noise.random() * professions.length)];
}

/**
 * Generate mother's profession - historically accurate by era
 * Pre-20th century: mostly domestic/subsistence work
 * 20th century+: increasing workforce participation
 */
function generateMotherProfession(culturalZone: CulturalZone, era: HistoricalEra, noise: ValueNoise): string {
    const isModern = era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA;

    if (!isModern) {
        // Pre-modern era - domestic and subsistence work
        const traditionalWork = [
            'Child-rearing',
            'Textile Work',
            'Food Preparation',
            'Household Management',
            'Foraging',
            'Farming (Household)',
            'Weaving',
            'Brewing',
            'Dairy Work',
            'Market Selling'
        ];
        return traditionalWork[Math.floor(noise.random() * traditionalWork.length)];
    } else {
        // Modern era - mix of traditional and workforce participation
        if (noise.random() > 0.4) { // 60% in workforce in modern era
            const modernProfessions = [
                'Teacher',
                'Nurse',
                'Secretary',
                'Factory Worker',
                'Shop Clerk',
                'Seamstress',
                'Waitress',
                'Office Worker',
                'Homemaker'
            ];
            return modernProfessions[Math.floor(noise.random() * modernProfessions.length)];
        } else {
            return 'Homemaker';
        }
    }
}

/**
 * Get historical marriage age by era
 */
function getHistoricalMarriageAge(era: HistoricalEra, gender: string, noise: ValueNoise): number {
    const marriageAges: Record<HistoricalEra, { male: number; female: number }> = {
        [HistoricalEra.PREHISTORY]: { male: 18, female: 16 },
        [HistoricalEra.ANTIQUITY]: { male: 20, female: 16 },
        [HistoricalEra.MEDIEVAL]: { male: 22, female: 18 },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { male: 24, female: 20 },
        [HistoricalEra.INDUSTRIAL_ERA]: { male: 25, female: 22 },
        [HistoricalEra.MODERN_ERA]: { male: 27, female: 25 },
        [HistoricalEra.FUTURE_ERA]: { male: 30, female: 28 }
    };

    const baseAge = marriageAges[era]?.[gender as 'male' | 'female'] || 20;
    return baseAge + Math.floor(noise.random() * 5); // Add 0-5 years variation
}


/**
 * Enhanced character generation with portrait clothing integration
 */
/**
 * Generate a character with custom specifications from World Weaver
 */
/**
 * Whether a name from one tradition plausibly belongs to a person who looks
 * like that tradition, in a place belonging to another.
 *
 * A European-derived name does not make a persona European. In 1812 Freetown an
 * English or Portuguese name most often belonged to a Krio or locally-born
 * person, and letting the name override geography produced blonde, pale West
 * Africans practising West African religion.
 */
function nameImpliesAppearance(detected: string, geographic: string): boolean {
    if (detected === geographic) return true;
    const pairs = [
        ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
        ['EUROPEAN', 'MENA'],
        ['MENA', 'SOUTH_ASIAN'],
        ['EAST_ASIAN', 'SOUTH_ASIAN'],
    ];
    return pairs.some(([a, b]) => (detected === a && geographic === b) || (detected === b && geographic === a));
}

export function generateCharacterWithSpec(context: GenerationContext, spec?: CharacterSpecification | null): PlayerCharacter {
    devLog('[Character Generator] Generating character with spec:', spec);
    
    // There used to be a second, near-identical generator for the no-spec case:
    // 550 lines, 114 of them verbatim copies of the ones below. Every fix had to
    // be made twice, and one of them silently referenced a `spec` variable it
    // had no parameter for. Every field below is optional, so an empty
    // specification produces exactly the fully-rolled character that path did.
    if (!spec) {
        spec = {} as CharacterSpecification;
    }
    
    // Falling back to the wall clock here made name generation irreproducible:
    // the same persona seed produced different parents on different runs,
    // because this noise source drives `generateNpcNameDetailed`. The ambient
    // seeded source is deterministic inside `withSeed` and still varied
    // outside it, which is what the clock was reaching for.
    const noise = new ValueNoise(context.seed ?? Math.floor(seededRandom() * 0x7fffffff));
    const dateInfo = parseDateString(context.date);
    // Use ethnicity from spec if provided, then context, then fall back to geographic cultural zone
    const culturalZone = (spec as any).ethnicity || context.culturalZone || mapLocationToCulture(context.location, dateInfo.year);
    // Use era from context if provided, otherwise from date parsing
    const era = context.era || (dateInfo.era as HistoricalEra);
    const historicalContext = context.historicalContext || createHistoricalContext({
        year: dateInfo.year,
        era,
        culturalZone,
        region: context.region,
        location: context.location,
    });
    const generationContext = {
        era,
        culturalZone,
        region: context.region,
        year: dateInfo.year,
        localArea: context.location,
        historicalContext,
    };

    // Log ethnicity usage for debugging
    if ((spec as any).ethnicity) {
        devLog(`[Character Generator] Using ethnicity '${(spec as any).ethnicity}' for character generation (geographic zone would be: ${mapLocationToCulture(context.location, dateInfo.year)})`);
    }
    
    // Anything that was not exactly 'male' used to fall through to 'Female',
    // which turned every non-binary request into a woman and skewed the whole
    // population 2:1. Callers now pass a birth sex; anything else is left for
    // the profile generator to roll rather than being silently rewritten.
    const requestedGender: Gender | undefined =
        spec.gender === 'male' ? 'Male'
        : spec.gender === 'female' ? 'Female'
        : undefined;
    const exactRequestedWealth = (spec as CharacterSpecification & { wealthLevel?: WealthLevel }).wealthLevel;

    // Generate appearance and clothing from the finalized inputs. Previously the
    // profile rolled a random gender and wealth tier first, then overwrote those
    // labels without rebuilding the portrait (e.g. a male office worker retaining
    // a randomly generated tiara and qipao).
    let baseProfile = generateBaseProfile(noise, generationContext, {
        gender: requestedGender,
        age: spec.age ?? undefined,
        wealthLevel: exactRequestedWealth,
        occupation: spec.profession,
    });
    
    // Apply custom specifications
    if (requestedGender) {
        baseProfile.gender = requestedGender;
    }
    
    if (spec.age !== undefined && spec.age !== null) {
        baseProfile.age = spec.age;
    }
    
    // Use custom name if provided
    if (spec.name) {
        baseProfile.name = spec.name;
    }

    if (spec.religion && typeof spec.religion === 'string') {
        baseProfile.religion = spec.religion;
    }
    
    // Handle health specification
    if (spec.health) {
        switch (spec.health) {
            case 'sickly':
                baseProfile.stats.constitution = 6 + Math.floor(noise.random() * 3); // 6-8
                baseProfile.stats.strength = 6 + Math.floor(noise.random() * 3); // 6-8
                break;
            case 'unhealthy':
                baseProfile.stats.constitution = 8 + Math.floor(noise.random() * 3); // 8-10
                baseProfile.stats.strength = 8 + Math.floor(noise.random() * 3); // 8-10
                break;
            case 'healthy':
                baseProfile.stats.constitution = 12 + Math.floor(noise.random() * 4); // 12-15
                baseProfile.stats.strength = 12 + Math.floor(noise.random() * 4); // 12-15
                break;
            case 'average':
            default:
                // Keep randomly generated stats
                break;
        }
    }
    
    // Status and wealth are separate axes. Wealth affects the probabilities but
    // no longer dictates that every wealthy person is a merchant or every poor
    // person a peasant. Explicit status also leaves an independently supplied
    // wealth level intact.
    const sampledStatus = sampleSocialStatus(
        generationContext.era,
        baseProfile.wealthLevel,
        () => noise.random(),
        historicalContext.localeType,
    );
    const socialClass = formatSocialStatusForEra(
        spec.socialClass || sampledStatus,
        generationContext.era
    );

    let role = determineSocialRole(
        baseProfile,
        {
            era: generationContext.era,
            culturalZone: generationContext.culturalZone,
            region: context.region,
            localArea: context.location,
            year: dateInfo.year,
            preferredSocialClass: socialClass,
            historicalContext,
        }
    ).role;
    
    // Handle profession specification
    if (spec.profession && typeof spec.profession === 'string') {
        const requestedProfession = spec.profession.charAt(0).toUpperCase() + spec.profession.slice(1);
        if (isClergyRoleCompatible(requestedProfession, baseProfile.religion)) {
            // The assembleStartingPackage function handles unknown non-religious
            // professions with its ordinary fallback.
            role = requestedProfession;
        } else {
            console.warn(
                `[Character Generator] Rejected religious vocation '${requestedProfession}' for religion '${baseProfile.religion}'.`
            );
        }
    }

    // generateBaseProfile assigns beliefs before specifications are overlaid.
    // Recompute after religion and profession are final so a pagan character
    // cannot retain a Catholic worldview from the discarded random profile.
    const coherentBeliefs = assignBeliefs({
        ...baseProfile,
        class: socialClass,
        role,
        profession: role,
    } as PlayerCharacter, noise, {
        year: dateInfo.year,
        region: context.region,
        location: context.location,
    });
    baseProfile.ideology = coherentBeliefs.ideology;
    baseProfile.beliefs = coherentBeliefs.beliefs;

    // Religion constraints or explicit social class handling may have adjusted
    // wealth after the base profile was built. Re-resolve the outfit once, using
    // the actual gender, wealth and occupation that will be displayed.
    // What the weather is doing where and when this persona lives. Without it a
    // hunter in a cold desert basin comes out bare-chested at midwinter.
    const outfitMonth = (() => {
        const match = /^(\d+)\//.exec(context.date || '');
        const parsed = match ? Number(match[1]) : NaN;
        return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : 6;
    })();
    const areaClimate = getAreaClimate(culturalZone, context.region, context.location);
    const outfitSeason = seasonFor(outfitMonth, hemisphereFor(culturalZone, context.region), areaClimate);

    const coherentOutfit = generateCompleteOutfit(
        culturalZone,
        generationContext.era,
        baseProfile.wealthLevel,
        baseProfile.gender,
        role,
        context.region,
        dateInfo.year,
        thermalNeed(areaClimate, outfitSeason)
    );
    baseProfile.appearance = {
        ...baseProfile.appearance,
        ...coherentOutfit,
    };

    // Adjust personality to be more coherent with the assigned profession
    baseProfile.personality = adjustPersonalityForProfession(
        baseProfile.personality,
        role,
        baseProfile.stats
    );

    // Generate name - use custom if provided, otherwise prefer a coordinated
    // place/religion track when the broad cultural-zone routing is too coarse.
    const contextualNameKey = resolveContextualNameKey(
        context,
        dateInfo.year,
        baseProfile.religion,
        noise
    );
    // Keep the structure of the name, not just the text: if it is a patronymic
    // the father has to actually be called that.
    const generatedName = generateNpcNameDetailed(
        baseProfile.gender,
        culturalZone,
        context.region,
        dateInfo.year,
        noise,
        contextualNameKey
    );
    const name = spec.name || generatedName.full;
    const fathersGivenName = spec.name ? undefined : generatedName.patronymicFrom;
    const inheritedFamilyName = spec.name ? undefined : generatedName.familyName;

    // A broad map zone is not an ethnicity. If the regional name generator selects
    // a Russian name in Soviet Kazakhstan, use the corresponding appearance palette
    // rather than always treating every EAST_ASIAN location as Han Chinese.
    const detectedEthnicity = detectEthnicityFromName(name);
    if (detectedEthnicity && detectedEthnicity !== culturalZone && !isSoutheastAsianContext(context)) {
        baseProfile.appearance = {
            ...baseProfile.appearance,
            ...generateCulturalAppearance(
                nameImpliesAppearance(detectedEthnicity, culturalZone) ? detectedEthnicity : culturalZone,
                noise,
            ),
        };
    }
    
    // Create a minimal character first for companion generation
    const tempCharacter: Partial<PlayerCharacter> = {
        name,
        profession: role,
        year: dateInfo.year,
    };
    
    // Get starting package and inventory with color support
    const privilege = baseProfile.wealthLevel === 'wealthy' ? 0.8 : 
                     baseProfile.wealthLevel === 'comfortable' ? 0.6 : 
                     baseProfile.wealthLevel === 'modest' ? 0.4 : 0.2;
                     
    const { inventory, equippedItems } = assembleStartingPackage(role, tempCharacter as PlayerCharacter, {
        culture: culturalZone,
        era: generationContext.era,
        privilege,
        year: dateInfo.year,
        region: context.region,
        location: context.location,
    });
    
    // Generate appearance with palette
    let palette = generateClothingPalette(baseProfile.wealthLevel, generationContext.era, culturalZone, baseProfile.gender, noise);
    const centralAsianModern =
        culturalZone === 'EAST_ASIAN' &&
        generationContext.era === HistoricalEra.MODERN_ERA &&
        /(kazakh|tian shan|altai|aral sea|dzungarian|central asia)/i.test(
            `${context.region || ''} ${context.location || ''}`
        );
    if (centralAsianModern) {
        palette = {
            primary: '#46515b',
            secondary: '#777165',
            accent: '#72604d',
        };
    }
    
    // Helper function to get color name from hex.
    // One shared vocabulary of dyestuffs (constants/gameData/colorNames), so
    // the name the card prints and the hex the portrait draws cannot disagree.
    const getColorName = (colorHex: string | undefined): string =>
        nameForHex(colorHex);

    // Helper function to check if material is its own color.
    // The hand-written list this replaced was missing sedge, grass, reed and
    // rattan, which is how a woven sedge sunhat was issued a dye colour and
    // came out lilac. Shared with the portrait renderer now.
    const isMaterialColor = (material: string | undefined): boolean =>
        hasIntrinsicColor(material);
    
    // Apply colors to equipped items based on palette
    const applyColorToItem = (item: Item, colorHex: string | undefined): Item => {
        if (!colorHex) return item;
        
        // A material that is its own colour is never renamed. Straw is straw.
        if (isMaterialColor(item.material)) return item;

        const colorName = getColorName(colorHex);

        // Check if color is already in the name
        for (const color of COLOR_WORDS) {
            if (item.name.toLowerCase().includes(color)) {
                // Color already in name, but still store it in the color field
                return {
                    ...item,
                    color: item.name.split(' ')[0] // Extract the color from the name
                };
            }
        }
        
        // Add color to item name and store in color field if we found one
        if (colorName) {
            return {
                ...item,
                name: `${colorName} ${item.name}`,
                color: colorName // Store the color for display in UI
            };
        }
        
        return item;
    };
    
    // For professions without starting packages, generate appropriate headgear
    let professionHeadgear = baseProfile.appearance.headgear;
    
    // Create actual items from appearance data if not provided by starting package
    // This ensures "what you see is what you get" for all equipment
    if (!equippedItems.head && baseProfile.appearance.headgear && 
        baseProfile.appearance.headgear.name !== 'None' && 
        baseProfile.appearance.headgear.name !== 'none') {
        // Create an item from the appearance headgear with color
        let headgearBaseId = baseProfile.appearance.headgear.name.toUpperCase().replace(/ /g, '_');
        
        // Add color prefix if we have a palette color for headgear
        const headColor = getColorName(palette?.secondary);
        if (headColor && !isMaterialColor(baseProfile.appearance.headgear.material)) {
            headgearBaseId = `${headColor.toUpperCase()}_${headgearBaseId}`;
        }
        
        const headItem = createItemInstance(headgearBaseId);
        if (headItem) {
            // Keep the material the clothing table actually declared.
            if (baseProfile.appearance.headgear.material) {
                headItem.material = baseProfile.appearance.headgear.material;
            }
            equippedItems.head = headItem;
            devLog('[CharGen] Created head item from appearance:', headgearBaseId, '→', headItem.name);
        }
    }
    
    if (!equippedItems.torso && !equippedItems.legs && baseProfile.appearance.garment && 
        baseProfile.appearance.garment.name !== 'None' && 
        baseProfile.appearance.garment.name !== 'none') {
        let garmentBaseId = baseProfile.appearance.garment.name.toUpperCase().replace(/ /g, '_');
        
        // Add color prefix if we have a palette color for garments
        const garmentColor = getColorName(palette?.primary);
        if (garmentColor && !isMaterialColor(baseProfile.appearance.garment.material)) {
            garmentBaseId = `${garmentColor.toUpperCase()}_${garmentBaseId}`;
        }
        
        const garmentItem = createItemInstance(garmentBaseId);
        if (garmentItem) {
            if (baseProfile.appearance.garment.material) {
                garmentItem.material = baseProfile.appearance.garment.material;
            }
            // Check if this is a leg item (pants, trousers, etc.) or torso item
            if (garmentItem.equipmentSlot === 'legs') {
                equippedItems.legs = garmentItem;
                devLog('[CharGen] Created legs item from appearance:', garmentBaseId, '→', garmentItem.name);
            } else {
                equippedItems.torso = garmentItem;
                devLog('[CharGen] Created torso item from appearance:', garmentBaseId, '→', garmentItem.name);
            }
        }
    }
    
    if (!equippedItems.feet && baseProfile.appearance.footwear && 
        baseProfile.appearance.footwear.name !== 'None' && 
        baseProfile.appearance.footwear.name !== 'none' &&
        baseProfile.appearance.footwear.name !== 'bare_feet' &&
        baseProfile.appearance.footwear.name !== 'barefoot') {
        let footwearBaseId = baseProfile.appearance.footwear.name.toUpperCase().replace(/ /g, '_');
        
        // Add color prefix if we have a palette color for footwear
        const footColor = getColorName(palette?.secondary);
        if (footColor && !isMaterialColor(baseProfile.appearance.footwear.material)) {
            footwearBaseId = `${footColor.toUpperCase()}_${footwearBaseId}`;
        }
        
        const feetItem = createItemInstance(footwearBaseId);
        if (feetItem) {
            if (baseProfile.appearance.footwear.material) {
                feetItem.material = baseProfile.appearance.footwear.material;
            }
            equippedItems.feet = feetItem;
            devLog('[CharGen] Created feet item from appearance:', footwearBaseId, '→', feetItem.name);
        }
    }
    
    // Colors are now applied via baseId when creating items, no need for post-processing
    if (!equippedItems.head && role) {
        // Generate profession-appropriate headgear
        const roleLower = role.toLowerCase();
        if (roleLower.includes('laborer') || roleLower.includes('sweep') || roleLower.includes('miner') || roleLower.includes('smith')) {
            professionHeadgear = { name: 'Leather Cap', material: 'Leather' };
        } else if (roleLower.includes('merchant') || roleLower.includes('trader')) {
            professionHeadgear = { name: 'Felt Hat', material: 'Felt' };
        } else if (roleLower.includes('farmer') || roleLower.includes('peasant')) {
            professionHeadgear = { name: 'Straw Hat', material: 'Straw' };
        } else if (roleLower.includes('scholar') || roleLower.includes('scribe')) {
            professionHeadgear = { name: 'Scholar Cap', material: 'Velvet' };
        } else if (roleLower.includes('soldier') || roleLower.includes('guard')) {
            professionHeadgear = { name: 'Leather Helmet', material: 'Leather' };
        } else if (roleLower.includes('noble') || roleLower.includes('lord')) {
            professionHeadgear = { name: 'Velvet Cap', material: 'Velvet' };
        } else {
            // For other common professions, prefer no headgear or simple headgear
            // Filter out inappropriate items like jeweled tiaras
            const headgearName = professionHeadgear?.name?.toLowerCase() || '';
            if (headgearName.includes('jewel') || headgearName.includes('diamond') || 
                headgearName.includes('tiara') || headgearName.includes('crown') || 
                headgearName.includes('diadem') || headgearName.includes('gold')) {
                // These are inappropriate for common workers
                professionHeadgear = { name: 'None', material: 'None' };
            }
        }
    }
    
    // Generate cultural markings based on culture, profession, and context
    const markingProbability = getMarkingProbability(culturalZone, generationContext.era, spec?.profession || role);
    const markings: any[] = [];
    
    // devLog(`[CharGen Spec] Marking probability for ${culturalZone}/${generationContext.era}/${spec?.profession || role}: ${markingProbability}`);
    
    // Determine how many markings to add based on culture - MORE historically accurate
    let numMarkings = 0;
    if (noise.random() < markingProbability) {
        // Higher probability cultures often have multiple markings
        if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' ||
            culturalZone === 'SUB_SAHARAN_AFRICAN' || culturalZone === 'SOUTH_AMERICAN') {
            // These cultures almost always had multiple types of body modifications
            const roll = noise.random();
            if (roll < 0.4) numMarkings = 3;       // 40% chance for 3 markings
            else if (roll < 0.8) numMarkings = 2;  // 40% chance for 2 markings
            else numMarkings = 1;                  // 20% chance for 1 marking
            
            // Minimum 2 for adults in these cultures
            if (baseProfile.age > 18) numMarkings = Math.max(2, numMarkings);
        } else if (culturalZone === 'SOUTH_ASIAN' || culturalZone === 'MENA') {
            // Often have both daily (bindi/kohl) and special (henna) markings
            numMarkings = noise.random() < 0.7 ? 2 : 1; // 70% chance for 2
            // Women often have more markings
            if (baseProfile.gender?.toLowerCase() === 'female') {
                numMarkings = Math.max(2, numMarkings);
            }
        } else {
            // Even European/East Asian cultures often had some daily markings
            numMarkings = noise.random() < 0.3 ? 2 : 1; // 30% chance for 2
        }
    }
    
    const usedTypes = new Set<string>();
    for (let i = 0; i < numMarkings; i++) {
        const availableMarkings = getMarkingsForCharacter(
            culturalZone,
            generationContext.era,
            spec?.profession || role,
            spec?.gender?.toLowerCase() as 'male' | 'female' || 'male',
            baseProfile.wealthLevel,
            spec?.age || baseProfile.age,
            i === 0 ? 'daily' : (noise.random() < 0.5 ? 'ceremony' : 'daily'),
            `${context.region ?? ''} ${context.location ?? ''}`,
            baseProfile.religion
        ).filter(m => !usedTypes.has(m.type)); // Don't repeat marking types
        
        // devLog(`[CharGen Spec] Found ${availableMarkings.length} available markings for slot ${i+1}`);
        
        const selectedMarking = selectRandomMarking(availableMarkings, noise.random());
        if (selectedMarking) {
            usedTypes.add(selectedMarking.type);
            const pattern = getRandomPattern(selectedMarking, noise.random());
            if (pattern) {
                const appearanceMarking = convertToAppearanceMarking(selectedMarking, pattern);
                markings.push(appearanceMarking);
                // devLog(`[CharGen Spec] Added cultural marking: ${pattern.localName || pattern.name} (${selectedMarking.type}`);
            }
        }
    }

    const finalAppearance: Appearance = {
        ...baseProfile.appearance,
        palette: palette,
        garment: equippedItems.torso 
            ? { name: equippedItems.torso.name, material: equippedItems.torso.material || 'cloth' } 
            : baseProfile.appearance.garment,
        headgear: equippedItems.head 
            ? { name: equippedItems.head.name, material: equippedItems.head.material || 'cloth' } 
            : professionHeadgear,
        footwear: equippedItems.feet 
            ? { name: equippedItems.feet.name, material: equippedItems.feet.material || 'leather' } 
            : baseProfile.appearance.footwear,
        belt: equippedItems.belt 
            ? { name: equippedItems.belt.name, material: equippedItems.belt.material || 'leather' } 
            : baseProfile.appearance.belt,
        accessory: equippedItems.accessory 
            ? { name: equippedItems.accessory.name, material: equippedItems.accessory.material || 'metal' } 
            : baseProfile.appearance.accessory,
        markings: markings.length > 0 ? markings : undefined
    };
    
    // Calculate health based on potentially modified stats
    const maxHealth = 80 + baseProfile.stats.constitution * 2 + baseProfile.stats.strength;
    const startingHealth = spec.health === 'sickly' ? 
        Math.floor(maxHealth * (0.5 + seededRandom() * 0.2)) : // 50-70% for sickly
        spec.health === 'unhealthy' ?
        Math.floor(maxHealth * (0.6 + seededRandom() * 0.2)) : // 60-80% for unhealthy
        Math.floor(maxHealth * (0.8 + seededRandom() * 0.2)); // 80-100% for average/healthy
    
    // Characters always start relatively well-rested (max 20% fatigue)
    const baseFatigue = seededRandom() * 20; // 0-20% fatigue
    const constitutionBonus = baseProfile.stats.constitution - 10;
    // Constitution can further reduce fatigue, but never below 0
    const startingFatigue = Math.max(0, Math.min(20, baseFatigue - constitutionBonus));
    
    const staticPortraitSeed = Math.floor(seededRandom() * 1000000);
    
    const partialCharacter: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'> = {
        ...baseProfile,
        name,
        class: socialClass,
        socialClass,
        profession: role,
        level: Math.floor(1 + seededRandom() * 5), // Random level 1-5
        experience: 0,
        maxExperience: 100,
        health: startingHealth,
        maxHealth: maxHealth,
        fatigue: Math.floor(startingFatigue),
        maxFatigue: 100,
        currency: generateStartingCurrency(baseProfile.wealthLevel, noise),
        era: generationContext.era,
        historicalEra: generationContext.era,
        culturalZone: generationContext.culturalZone,
        portraitSeed: staticPortraitSeed,
        family: [],
        lifeEvents: [],
        mapReputation: Math.floor(20 + seededRandom() * 60 + (socialClass === 'Noble' ? 20 : socialClass === 'Merchant' ? 10 : 0)), // 20-80 base, with bonus for nobles/merchants
        appearance: finalAppearance,
        equippedItems,
    };
    
    // Generate attribute badges for custom character BEFORE backstory
    const attributes = AttributeBadgeService.generateAttributes(
        partialCharacter as PlayerCharacter,
        dateInfo.year,
        context.location,
        { localeType: historicalContext.localeType, region: context.region }
    );

    // Add attributes to character before generating backstory
    // A byname is a claim about the person. Now that the attributes and the
    // appearance exist, replace any the persona has not earned.
    {
      const reconciled = reconcileEpithet(
        partialCharacter.name as string,
        {
          attributeIds: attributes.map(a => a.id),
          age: partialCharacter.age as number,
          heightCm: (partialCharacter.appearance as any)?.height,
          birthSex: (partialCharacter as any).birthSex
            ?? (partialCharacter.gender === 'Female' ? 'Female'
              : partialCharacter.gender === 'Male' ? 'Male' : undefined),
          hairColor: (partialCharacter.appearance as any)?.hairColor,
          culturalZone: context.culturalZone,
          year: dateInfo.year,
        },
        () => noise.random(),
      );
      (partialCharacter as any).name = reconciled;
    }

    // The renderer reads appearance, not attributes. Push the visible ones over
    // so the portrait agrees with the card.
    (partialCharacter as any).appearance = applyAttributeAppearance(
      (partialCharacter as any).appearance,
      attributes,
      partialCharacter.name as string,
    );

    // Ornament. `appearance.jewelry` is read by the equipment list, the
    // appearance panel and the portrait renderer, and until now nothing wrote
    // to it, so every persona rendered bare.
    {
      const ornament = generateOrnament(
        {
          year: dateInfo.year,
          culturalZone,
          placeLower: `${context.location ?? ''} ${context.region ?? ''}`.toLowerCase(),
          gender: partialCharacter.gender as string,
          wealth: baseProfile.wealthLevel,
          socialClass,
          profession: partialCharacter.profession as string,
          attributeIds: attributes.map(a => a.id),
        },
        () => noise.random(),
      );
      if (ornament.length > 0) {
        (partialCharacter as any).appearance = {
          ...(partialCharacter as any).appearance,
          jewelry: ornament,
        };
      }
    }

    const characterWithAttributes = { ...partialCharacter, attributes };

    // Use custom backstory if provided, otherwise generate procedural one with attributes
    const backstory = spec.customBackstory || _generateProceduralBackstory(characterWithAttributes as PlayerCharacter);

    // Add custom items to inventory if provided
    if (spec.customItems && spec.customItems.length > 0) {
        devLog(`[Character Generator] Adding ${spec.customItems.length} custom items from WorldWeaver`);
        for (const customItem of spec.customItems) {
            const item: Item = {
                id: `custom-${Date.now()}-${seededRandom().toString(36).substr(2, 9)}`,
                baseId: customItem.name.toUpperCase().replace(/\s+/g, '_'),
                name: customItem.name,
                description: customItem.description,
                value: customItem.value,
                weight: customItem.weight,
                category: customItem.category as any,
                stackable: customItem.stackable || false,
                wearable: customItem.wearable || false,
                quantity: 1,
                emoji: '📦', // Default emoji for custom items
                rarity: 'Special',
                attack: 0,
                sustenance: 0,
                wieldable: false,
                throwable: false,
                craftingValue: 1
            };
            inventory.push(item);
        }
    }
    
    // Add life events
    const currentYear = dateInfo.year;
    // CRITICAL FIX: Use spec.birthYear if provided, otherwise calculate from currentYear - age
    // This is essential for family member generation to maintain correct temporal relationships
    const birthYear = (spec as any)?.birthYear !== undefined
        ? (typeof (spec as any).birthYear === 'string'
            ? parseInt((spec as any).birthYear, 10)
            : (spec as any).birthYear)
        : currentYear - partialCharacter.age;
    (partialCharacter as any).birthYear = birthYear;
    partialCharacter.lifeEvents.push({ year: birthYear, event: `Born in the region of ${context.region}.`});
    if (partialCharacter.age > 16) {
        partialCharacter.lifeEvents.push({ year: birthYear + 16, event: `Came of age and began training as a ${role}.`});
    }
    if (partialCharacter.age > 25 && noise.random() > 0.5) {
        partialCharacter.lifeEvents.push({ year: birthYear + 22, event: `Left home to seek fortune.`});
    }

    // Generate comprehensive family
    // CRITICAL: Pass birthYear explicitly to maintain temporal consistency for family navigation
    generateProceduralFamily(
        partialCharacter,
        culturalZone,
        context.region,
        generationContext.era,
        currentYear,
        attributes,
        noise,
        birthYear,  // Pass the actual birthYear to avoid recalculation
        // The set the persona's own name came from. Re-detecting it from the
        // finished string picked the wrong list often enough to give an
        // Aboriginal persona French or Scottish parents.
        generatedName.nameKey || contextualNameKey || detectNameListKey(name),
        fathersGivenName,
        inheritedFamilyName
    );

    // Initialize disease health with potential disease based on stats and setting
    const diseaseService = DiseaseService.getInstance();
    
    let diseaseHealth = undefined;
    
    // Check if a specific disease was requested via WorldWeaver
    if (spec.disease) {
        devLog(`[Character Generator] Specific disease requested: ${spec.disease}`);

        // Try exact match first
        diseaseHealth = diseaseService.assignSpecificDisease(
            { health: undefined } as any,
            spec.disease,
            generationContext.era,
            culturalZone,
            dateInfo.year
        );

        // If exact match failed, try fuzzy matching
        if (!diseaseHealth || diseaseHealth.currentDiseases.length === 0) {
            devLog(`[Character Generator] Exact match failed for '${spec.disease}', trying fuzzy match...`);

            // Normalize: uppercase, replace spaces with underscores, remove punctuation
            const normalizedId = spec.disease
                .toUpperCase()
                .replace(/\s+/g, '_')
                .replace(/[^A-Z0-9_]/g, '');

            devLog(`[Character Generator] Normalized disease ID: ${normalizedId}`);

            diseaseHealth = diseaseService.assignSpecificDisease(
                { health: undefined } as any,
                normalizedId,
                generationContext.era,
                culturalZone,
                dateInfo.year
            );
        }

        // Check if we successfully assigned the disease
        if (diseaseHealth && diseaseHealth.currentDiseases.length > 0) {
            devLog(`[Character Generator] ✓ Custom character given requested disease: ${diseaseHealth.currentDiseases[0].disease.name}`);
        } else {
            // Disease not available for this era/region - force a contextually appropriate disease
            console.warn(`[Character Generator] ⚠ Disease '${spec.disease}' not available for ${generationContext.era}/${culturalZone}/${dateInfo.year}`);
            devLog(`[Character Generator] Forcing contextually appropriate disease instead...`);

            // Override health spec to force disease selection below
            if (!spec.health || spec.health === 'average' || spec.health === 'healthy') {
                spec.health = 'sick'; // Force 100% disease chance
            }
        }
    }
    
    // If no specific disease requested or assignment failed, use random chance
    if (!diseaseHealth) {
        // Weighted by period rather than a flat third: sanitation, antibiotics
        // and dentistry moved this a long way. See diseasePrevalenceService.
        let diseaseChance = illnessRate(dateInfo.year);

        if (spec.health === 'sick') {
            diseaseChance = 1.0; // 100% chance for sick characters
            devLog(`[Character Generator] Health spec is 'sick', guaranteeing disease`);
        } else if (spec.health === 'sickly') {
            diseaseChance = 0.6; // 60% chance for sickly characters
        } else if (spec.health === 'unhealthy') {
            diseaseChance = 0.45; // 45% chance for unhealthy characters
        } else if (spec.health === 'healthy') {
            diseaseChance = 0.2; // 20% chance for healthy characters
        }
        
        const shouldHaveDisease = seededRandom() < diseaseChance;
        
        if (shouldHaveDisease) {
            // Directly create disease health for player character
            const availableDiseases = diseaseService.getAvailableDiseasesForContext(
                generationContext.era,
                culturalZone,
                dateInfo.year
            );
            
            if (availableDiseases.length > 0) {
                // Is there an outbreak running in this time and place?
                const epidemicDisease = diseaseService.getEpidemicDisease(
                    availableDiseases,
                    generationContext.era,
                    culturalZone,
                    dateInfo.year
                );

                // Drawn by how often a condition would actually be encountered
                // rather than uniformly from the table — uniform sampling made
                // anthrax the second most common human ailment and buried
                // intestinal worms beneath it.
                let selectedDisease =
                    pickByPrevalence(availableDiseases, seededRandom, { inEpidemic: Boolean(epidemicDisease) })
                    || availableDiseases[0];

                if (epidemicDisease && seededRandom() < 0.8) {
                    selectedDisease = epidemicDisease;
                    devLog(`[Character Generator] Custom character spawning during ${epidemicDisease.name} epidemic in ${dateInfo.year}`);
                }
                
                diseaseHealth = {
                    currentDiseases: [{
                        disease: selectedDisease,
                        contractedDate: Date.now(),
                        stage: 'symptomatic' as const,
                        daysRemaining: selectedDisease.durationDays,
                        severity: 0.5
                    }],
                    immunities: [],
                    exposureHistory: [],
                    overallHealthStatus: 'sick' as const,
                    lastHealthUpdate: { year: dateInfo.year, month: 1, day: 1 }
                };
                
                devLog(`[Character Generator] Custom character starts with disease: ${selectedDisease.name} (chance was ${(diseaseChance * 100).toFixed(1)}%)`);
            } else {
                devLog(`[Character Generator] No diseases available for custom character in era ${generationContext.era}`);
            }
        } else {
            // devLog(`[Character Generator] Custom character spawned healthy (disease chance was ${(diseaseChance * 100).toFixed(1)}%`);
        }
    }
    
    // Attributes already generated above before backstory
    
    if (attributes.length > 0) {
        devLog(`[Character Generator] Generated ${attributes.length} attribute badge(s) for custom character:`, 
            attributes.map(a => `${a.name} (${a.rarity})`).join(', '));
    }
    
    const character: PlayerCharacter = {
        ...(partialCharacter as any),
        id: `pc-${characterIdCounter++}`,
        backstory,
        inventory,
        party: [],
        eventLog: [],
        profileImage: 'placeholder.png',
        isLlmEnhanced: false,
        diseaseHealth, // Add disease health with potential disease
        attributes, // Add generated attribute badges
    };

    // Add ethnicCulturalZone if ethnicity is different from geographic zone
    const specEthnicity = (spec as any).ethnicity;
    const geographicZone = mapLocationToCulture(context.location, dateInfo.year);
    if (specEthnicity && specEthnicity !== geographicZone) {
        (character as any).ethnicCulturalZone = specEthnicity;
        devLog(`[Character Generator] Set ethnicCulturalZone '${specEthnicity}' for ${name} (geographic zone: ${geographicZone})`);
    }

    // Final coherence validation - catch any remaining contradictions
    const { personality: validatedPersonality, warnings } = validateCharacterCoherence({
        personality: character.personality,
        socialContext: character.socialContext,
        stats: character.stats,
        ideology: character.ideology,
        role: character.profession
    });
    character.personality = validatedPersonality;
    if (warnings.length > 0) {
        devLog(`[Character Generator] Coherence adjustments for ${name}:`, warnings);
    }

    devLog(`[Character Generator] Generated custom character ${name}, a ${role} with specifications`);

    return character;
}

