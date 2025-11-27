/**
 * generation/common/npcUtils.ts - Enhanced NPC utility functions with portrait generation.
 */
import { NpcEntity, NpcStats, NpcPersonality, NpcSocialContext, HistoricalEra, CharacterStats, CharacterPersonality, CharacterSocialContext, WealthLevel, Gender, TerrainStructure, PlayerCharacter, Ideology, Appearance, ClothingPiece, ClothingPalette, MapAreaDefinition, FactionData, TerrainStructureType, PersonalGoal } from '../../types';
import { PROFESSIONS, CulturalZone, SocialClassMap, ProfessionDefinition, CHARACTER_NAMES, REGION_NAME_MAPPING, RELIGION_DATA, IDEOLOGIES, PERSONAL_BELIEFS, getEraSpecificFallback } from '../../constants/index';
// Heavy data files - import directly to avoid loading on app startup
import { GEOGRAPHICAL_DATA } from '../../constants/gameData/geography';
import { ADJACENCIES } from '../../constants/gameData/adjacencies';
import { CITIES_DATA } from '../../constants/gameData/cities';
// FACTION_DATA removed - not actually used in this file

// Import clothing data synchronously
import * as clothingModule from '../../constants/characterData/clothing';
import { ValueNoise } from '../../utils/noise';
import { generatePersonalGoal } from '../../services/goalService';
import { getProfessionContext, getFallbackContext, ProfessionContext } from '../../services/professionContextService';
import { getMarkingsForCharacter, selectRandomMarking, getRandomPattern, convertToAppearanceMarking, getMarkingProbability } from '../../constants/characterData/culturalMarkings';

/**
 * Create safe NPC memory to avoid proxy revocation issues
 */
function createSafeNpcMemory(): any {
    return {
        opinionOfPlayer: 0,
        knownFactsAboutPlayer: new Set<string>(),
        relationships: new Map<string, { opinion: number; type: 'family' | 'friend' | 'rival' }>(),
        conversationSummaries: []
    };
}

/**
 * Get maximum allowed wealth level for a given religion in a specific cultural zone and era.
 * Prevents historically implausible combinations like Jewish nobles in medieval Christian Europe.
 */
function getMaxWealthLevelForReligion(
    religion: string,
    culturalZone: CulturalZone,
    era: HistoricalEra
): WealthLevel {
    // Jews in Christian-dominated Europe (before 19th century)
    if (religion === 'Judaism' && culturalZone === 'EUROPEAN') {
        if (era === HistoricalEra.MEDIEVAL ||
            era === HistoricalEra.RENAISSANCE_EARLY_MODERN ||
            era === HistoricalEra.INDUSTRIAL_ERA) {
            return 'comfortable'; // Merchants/moneylenders, but not nobles
        }
    }

    // Muslims in Christian Europe (Medieval/Renaissance)
    if (religion === 'Islam' && culturalZone === 'EUROPEAN') {
        if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
            return 'modest'; // Very restricted
        }
    }

    // Protestants in Catholic-dominated areas (early periods)
    if (religion === 'Protestantism' && culturalZone === 'EUROPEAN') {
        if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
            // Could be wealthy merchants but often not noble in Catholic regions
            return 'wealthy';
        }
    }

    // Christians in Islamic Middle East/North Africa (most eras)
    if (religion === 'Christianity' && culturalZone === 'MENA') {
        if (era === HistoricalEra.MEDIEVAL ||
            era === HistoricalEra.RENAISSANCE_EARLY_MODERN ||
            era === HistoricalEra.INDUSTRIAL_ERA) {
            return 'comfortable'; // Dhimmi status - restricted
        }
    }

    // Buddhists in Islamic regions
    if (religion === 'Buddhism' && culturalZone === 'MENA') {
        return 'modest';
    }

    // Default: no restriction
    return 'noble';
}

/**
 * Constrain a wealth level to not exceed the maximum allowed for historical plausibility.
 */
function constrainWealthByReligion(
    currentWealth: WealthLevel,
    maxAllowedWealth: WealthLevel
): WealthLevel {
    const wealthOrder: WealthLevel[] = ['poor', 'modest', 'comfortable', 'wealthy', 'noble'];
    const currentIndex = wealthOrder.indexOf(currentWealth);
    const maxIndex = wealthOrder.indexOf(maxAllowedWealth);

    if (currentIndex > maxIndex) {
        return maxAllowedWealth;
    }

    return currentWealth;
}

export function determineReligion(
    culturalZone: CulturalZone,
    region: string,
    era: HistoricalEra,
    noise: ValueNoise
): string {
    console.log('[Religion] Looking up religion:', { culturalZone, region, era });
    let eraData = RELIGION_DATA[culturalZone]?.[region]?.[era];
    console.log('[Religion] First lookup result:', eraData ? `Found ${eraData.length} options` : 'Not found');

    if (!eraData || eraData.length === 0) {
        // Fallback to a broader era definition if specific one not found
        const fallbackEra = era.includes('s') ? HistoricalEra.MODERN_ERA : era > HistoricalEra.RENAISSANCE_EARLY_MODERN ? HistoricalEra.INDUSTRIAL_ERA : HistoricalEra.MEDIEVAL;
        console.log('[Religion] Trying fallback era:', fallbackEra);
        eraData = RELIGION_DATA[culturalZone]?.[region]?.[fallbackEra];
        console.log('[Religion] Fallback era result:', eraData ? `Found ${eraData.length} options` : 'Not found');
    }

    if (!eraData || eraData.length === 0) {
        // Fallback to a major region within the cultural zone if specific one not found
        console.log('[Religion] Checking available regions in RELIGION_DATA for zone:', culturalZone);
        console.log('[Religion] Available regions:', Object.keys(RELIGION_DATA[culturalZone] || {}));
        const fallbackRegionKey = Object.keys(RELIGION_DATA[culturalZone] || {})[0] || 'British Isles';
        console.log('[Religion] Using fallback region:', fallbackRegionKey);
        eraData = RELIGION_DATA[culturalZone]?.[fallbackRegionKey]?.[era];
        console.log('[Religion] Fallback region result:', eraData ? `Found ${eraData.length} options` : 'Not found');
    }

    if (!eraData || eraData.length === 0) {
        console.log('[Religion] All lookups failed, returning "Local Beliefs"');
        return 'Local Beliefs';
    }
    
    const totalPrevalence = eraData.reduce((sum, religion) => sum + religion.weight, 0);
    if(totalPrevalence === 0) return 'Animist';

    let roll = noise.random() * totalPrevalence;

    for (const entry of eraData) {
        roll -= entry.weight;
        if (roll <= 0) {
            return entry.religion;
        }
    }

    return eraData[eraData.length - 1]?.religion || 'Local Beliefs'; // Final fallback
}


// Enhanced name generation with fallbacks and region/year specificity
export function generateNpcName(
    gender: Gender, 
    culturalZone: CulturalZone, 
    region: string | undefined,
    year: number,
    noise: ValueNoise,
    professionNameKey?: string
): string {
    try {
        let nameKeyToUse: string | undefined = professionNameKey;

        console.log(`[NameGen] Starting name generation:`, {
            culturalZone,
            region,
            year,
            professionNameKey
        });

        // 1. Check for a region/year specific override first
        if (!nameKeyToUse && region) {
            // For North American regions after colonization, check NORTH_AMERICAN_COLONIAL mappings
            if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' && year > 1600) {
                console.log(`[NameGen] Checking NORTH_AMERICAN_COLONIAL for post-1600`);
                const colonialRules = REGION_NAME_MAPPING['NORTH_AMERICAN_COLONIAL']?.[region];
                if (colonialRules) {
                    console.log(`[NameGen] Found colonial rules for region "${region}":`, colonialRules);
                    for (const rule of colonialRules) {
                        const beforeMatch = rule.before ? year < rule.before : true;
                        const afterMatch = rule.after ? year >= rule.after : true;
                        if (beforeMatch && afterMatch) {
                            nameKeyToUse = rule.keys[Math.floor(noise.random() * rule.keys.length)];
                            console.log(`[NameGen] Selected from colonial mapping: ${nameKeyToUse}`);
                            break;
                        }
                    }
                } else {
                    console.log(`[NameGen] No colonial rules found for region "${region}"`);
                }
            }

            // If not found in colonial mappings or not applicable, check the original cultural zone
            if (!nameKeyToUse && REGION_NAME_MAPPING[culturalZone as keyof typeof REGION_NAME_MAPPING]) {
                console.log(`[NameGen] Checking REGION_NAME_MAPPING["${culturalZone}"]["${region}"]`);
                const regionRules = REGION_NAME_MAPPING[culturalZone as keyof typeof REGION_NAME_MAPPING][region];
                if (regionRules) {
                    console.log(`[NameGen] Found regional rules:`, regionRules);
                    for (const rule of regionRules) {
                        const beforeMatch = rule.before ? year < rule.before : true;
                        const afterMatch = rule.after ? year >= rule.after : true;
                        console.log(`[NameGen] Rule check: before=${rule.before}, after=${rule.after}, year=${year}, matches=${beforeMatch && afterMatch}`);
                        if (beforeMatch && afterMatch) {
                            nameKeyToUse = rule.keys[Math.floor(noise.random() * rule.keys.length)];
                            console.log(`[NameGen] Selected from regional mapping: ${nameKeyToUse}`);
                            break;
                        }
                    }
                } else {
                    console.log(`[NameGen] No regional rules found for "${culturalZone}"/"${region}"`);
                    console.log(`[NameGen] Available regions in ${culturalZone}:`, Object.keys(REGION_NAME_MAPPING[culturalZone as keyof typeof REGION_NAME_MAPPING] || {}));
                }
            } else if (!nameKeyToUse) {
                console.log(`[NameGen] REGION_NAME_MAPPING["${culturalZone}"] does not exist`);
            }
        }
        
        // 2. Fallback - check for specific region matching before using broad cultural zone
        if (!nameKeyToUse) {
            console.log(`[NameGen] No name key found yet, entering fallback logic`);
            // For East Asian, check specific regions
            if (culturalZone === 'EAST_ASIAN' && region) {
                // Map region to specific name set based on region name
                const regionLower = region.toLowerCase();
                if (regionLower.includes('south china') || regionLower.includes('guangxi') || regionLower.includes('guangdong') || regionLower.includes('guangzhou')) {
                    nameKeyToUse = 'CHINESE_CANTONESE';
                } else if (regionLower.includes('north china') || regionLower.includes('beijing') || regionLower.includes('hebei')) {
                    nameKeyToUse = 'CHINESE_MANDARIN';
                } else if (regionLower.includes('japan')) {
                    nameKeyToUse = 'JAPANESE';
                } else if (regionLower.includes('korea')) {
                    nameKeyToUse = 'KOREAN';
                } else if (regionLower.includes('vietnam')) {
                    nameKeyToUse = 'VIETNAMESE';
                } else if (regionLower.includes('thai')) {
                    nameKeyToUse = 'THAI';
                } else {
                    // Default to generic East Asian if no specific match
                    nameKeyToUse = culturalZone;
                }
            } else {
                console.log(`[NameGen] Using cultural zone as fallback: ${culturalZone}`);
                nameKeyToUse = culturalZone;
            }
        }

        console.log(`[NameGen] Final name key to use: ${nameKeyToUse}`);

        const normalizedGender = gender === 'Male' ? 'Male' : 'Female';

        // 3. Get the name list with era-specific fallback (not generic English)
        let names = CHARACTER_NAMES[nameKeyToUse];

        // If no names found, use era-specific fallback instead of defaulting to EUROPEAN
        if (!names) {
            const fallback = getEraSpecificFallback(culturalZone, year);

            // If fallback has a generator (e.g., compound Native American names), use it directly
            if (fallback.generator) {
                const genderLower = normalizedGender === 'Male' ? 'male' : 'female';
                const generatedName = fallback.generator(genderLower as 'male' | 'female');
                console.log(`[NameGen] Used era-specific generator for ${culturalZone}/${year}: ${generatedName}`);
                return generatedName;
            }

            // Otherwise use the fallback groups
            if (fallback.groups && fallback.groups.length > 0) {
                const fallbackKey = fallback.groups[Math.floor(noise.random() * fallback.groups.length)];
                names = CHARACTER_NAMES[fallbackKey];
                console.log(`[NameGen] Used era-specific fallback group: ${fallbackKey}`);
            }

            // Last resort: use the zone's default names if still nothing
            if (!names) {
                names = CHARACTER_NAMES[culturalZone] || CHARACTER_NAMES.EUROPEAN;
                console.log(`[NameGen] Last resort fallback to: ${culturalZone}`);
            }
        }

        // For modern-era (1900+) indigenous peoples, use English first names with traditional surnames
        const isIndigenousNamePool = nameKeyToUse && (
            nameKeyToUse.includes('ALGONQUIAN') ||
            nameKeyToUse.includes('CREEK') ||
            nameKeyToUse.includes('CHEROKEE') ||
            nameKeyToUse.includes('IROQUOIS') ||
            nameKeyToUse.includes('PUEBLO') ||
            nameKeyToUse.includes('APACHE') ||
            nameKeyToUse.includes('NAVAJO') ||
            nameKeyToUse.includes('LAKOTA') ||
            nameKeyToUse.includes('SIOUX') ||
            nameKeyToUse.includes('CHEYENNE') ||
            nameKeyToUse.includes('COMANCHE') ||
            nameKeyToUse.includes('SEMINOLE')
        );
        const isModernEra = year >= 1900;
        const useModernIndigenousNaming = isIndigenousNamePool && isModernEra;

        // Use era-specific fallback for default names instead of hardcoded English
        const eraFallback = getEraSpecificFallback(culturalZone, year);
        const fallbackNames = eraFallback.groups?.[0] ? CHARACTER_NAMES[eraFallback.groups[0]] : null;

        let maleNames = names.male || fallbackNames?.male || ['Thomas', 'John', 'William'];
        let femaleNames = names.female || fallbackNames?.female || ['Mary', 'Elizabeth', 'Margaret'];
        const surnames = names.surname || fallbackNames?.surname || [];

        // Override with English first names for modern indigenous peoples
        if (useModernIndigenousNaming) {
            console.log(`[NameGen] Using modern indigenous naming: English first names with traditional surnames`);
            maleNames = ['Robert', 'James', 'John', 'William', 'Charles', 'Joseph', 'Thomas', 'Daniel', 'Michael', 'David', 'Richard', 'Paul', 'Mark', 'Steven', 'Timothy', 'Kevin', 'Brian', 'Jeffrey', 'Gary', 'Ronald'];
            femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna'];
        }

        const firstNames = normalizedGender === 'Male' ? maleNames : femaleNames;

        // FIX: Added robust check to prevent crash on malformed name data.
        if (!firstNames || firstNames.length === 0) {
            console.error(`[NPC Utils] Name list for ${nameKeyToUse}/${normalizedGender} is empty or missing. Using era-specific fallback.`);
            // Try era-specific generator as fallback
            const emergencyFallback = getEraSpecificFallback(culturalZone, year);
            if (emergencyFallback.generator) {
                return emergencyFallback.generator(normalizedGender === 'Male' ? 'male' : 'female');
            }
            // Use era-appropriate names from fallback groups
            const emergencyNames = emergencyFallback.groups?.[0] ? CHARACTER_NAMES[emergencyFallback.groups[0]] : null;
            const fallbackFirst = normalizedGender === 'Male'
                ? (emergencyNames?.male?.[0] || 'John')
                : (emergencyNames?.female?.[0] || 'Mary');
            const fallbackLast = (surnames && surnames.length > 0) ? surnames[Math.floor(noise.random() * surnames.length)] : '';
            return `${fallbackFirst} ${fallbackLast}`.trim();
        }

        const first = firstNames[Math.floor(noise.random() * firstNames.length)];
        let last = (surnames && surnames.length > 0) ? surnames[Math.floor(noise.random() * surnames.length)] : '';

        if(last === '(No Surname)') last = '';

        return `${first} ${last}`.trim();

    } catch (error) {
        console.warn('[NPC Utils] Name generation failed, using era-specific fallback:', error);
        // Even in error case, try to use era-appropriate names
        try {
            const emergencyFallback = getEraSpecificFallback(culturalZone, year);
            if (emergencyFallback.generator) {
                return emergencyFallback.generator(gender === 'Male' ? 'male' : 'female');
            }
            const emergencyNames = emergencyFallback.groups?.[0] ? CHARACTER_NAMES[emergencyFallback.groups[0]] : null;
            if (emergencyNames) {
                const first = gender === 'Male' ? emergencyNames.male[0] : emergencyNames.female[0];
                return first;
            }
        } catch {
            // Silent fail, use ultimate fallback
        }
        // Ultimate fallback - still try zone-specific
        const zoneFallback = CHARACTER_NAMES[culturalZone];
        const fallbackFirst = gender === 'Male'
            ? (zoneFallback?.male?.[0] || 'John')
            : (zoneFallback?.female?.[0] || 'Mary');
        return fallbackFirst;
    }
}

export function generateBodyMetrics(gender: Gender, stats: CharacterStats, noise: ValueNoise) {
    // Use average of two random numbers to create a distribution biased towards the center.
    const rand = () => (noise.random() + noise.random()) / 2;
    // More realistic pre-modern height range: 0.92 to 1.08 multiplier
    const heightMultiplier = 0.92 + rand() * 0.16; 
    // More realistic base heights
    const baseHeight = gender === 'Female' ? 158 : 170;
    const height = Math.round(baseHeight * heightMultiplier);

    let build: 'slight' | 'average' | 'athletic' | 'stocky' | 'imposing' | 'heavy' | 'tall' | 'short';
    let bmi: number;

    const str = stats.strength;
    const con = stats.constitution;

    if (height > 190) build = 'tall';
    else if (height < 160) build = 'short';
    else if (str < 4 && con < 4) {
        build = 'slight';
        bmi = 18 + rand() * 2;
    } else if (str > 7 && con > 7) {
        build = 'imposing';
        bmi = 27 + rand() * 3;
    } else if (str > 6 && con < 6) {
        build = 'athletic';
        bmi = 23 + rand() * 2;
    } else if (str < 6 && con > 7) {
        build = 'stocky';
        bmi = 25 + rand() * 3;
    } else if (con > 8) {
        build = 'heavy';
        bmi = 29 + rand() * 4;
    }
    else {
        build = 'average';
        bmi = 20 + rand() * 4;
    }
    
    if(!bmi) bmi = 22; // fallback

    const weight = Math.round(bmi * Math.pow(height / 100, 2));

    const facialHair = gender === 'Male' && noise.random() > 0.4;
    return { height, build, weight, facialHair };
}

function generateRealisticHairLength(gender: Gender, age: number, rand: () => number): 'bald' | 'very_short' | 'short' | 'medium' | 'long' | 'very_long' {
    if (gender === 'Female') {
        // Women are almost never bald (only medical conditions)
        const r = rand();
        if (r < 0.1) return 'short';
        if (r < 0.45) return 'medium';
        if (r < 0.9) return 'long';
        return 'very_long';
    } else {
        // Men - baldness increases with age
        const r = rand();
        
        // Age-based baldness probability
        let baldnessProbability = 0;
        if (age >= 18 && age <= 30) baldnessProbability = 0.03; // 3% for young men
        else if (age <= 45) baldnessProbability = 0.20; // 20% for middle-aged
        else if (age <= 60) baldnessProbability = 0.40; // 40% for older men
        else baldnessProbability = 0.60; // 60% for elderly men
        
        if (r < baldnessProbability) return 'bald';
        
        // Remaining hair lengths for non-bald men
        const remaining = r - baldnessProbability;
        const remainingRange = 1 - baldnessProbability;
        const adjustedR = remaining / remainingRange;
        
        if (adjustedR < 0.15) return 'very_short';
        if (adjustedR < 0.50) return 'short';
        if (adjustedR < 0.80) return 'medium';
        if (adjustedR < 0.95) return 'long';
        return 'very_long';
    }
}

export function generateFacialFeatures(noise: ValueNoise, gender: Gender, culturalZone: CulturalZone, age: number) {
    const rand = noise.random;

    const select = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
    
    // Some very basic cultural tendencies
    const faceShapes: ('oval' | 'round' | 'square' | 'long' | 'heart' | 'diamond')[] = culturalZone === 'EAST_ASIAN' ? ['round', 'oval', 'heart'] : ['oval', 'square', 'long', 'round', 'diamond'];
    const eyeShapes: ('almond' | 'round' | 'narrow' | 'wide' | 'hooded')[] = culturalZone === 'EAST_ASIAN' ? ['narrow', 'almond'] : ['almond', 'round', 'wide', 'hooded'];
    const noseShapes: ('straight' | 'aquiline' | 'broad' | 'button' | 'roman')[] = culturalZone === 'MENA' ? ['aquiline', 'roman', 'straight'] : ['straight', 'broad', 'button', 'roman'];
    const hairTextures: ('straight' | 'wavy' | 'curly' | 'coily' | 'kinky')[] = culturalZone === 'SUB_SAHARAN_AFRICAN' ? ['coily', 'kinky'] : ['straight', 'wavy', 'curly'];
    const facialHairStyles: Appearance['facialHairStyle'][] = ['full_beard', 'goatee', 'mustache', 'stubble', 'van_dyke', 'soul_patch', 'mutton_chops'];

    return {
        faceShape: select(faceShapes),
        eyeShape: select(eyeShapes),
        noseShape: select(noseShapes),
        cheekbones: select(['average', 'high', 'low'] as const),
        jawline: select(gender === 'Male' ? ['sharp', 'square', 'round'] as const : ['soft', 'round', 'oval'] as const),
        hairTexture: select(hairTextures),
        hairLength: generateRealisticHairLength(gender, age, rand),
        skinTone: select(['fair', 'light', 'medium', 'olive', 'tan', 'very_pale', 'pale', 'dark', 'very_dark'] as const),
        skinTexture: select(['smooth', 'freckled', 'weathered', 'rough', 'scarred'] as const),
        eyebrowShape: select(['straight', 'arched', 'rounded', 'angular'] as const),
        eyebrowThickness: select(['thin', 'medium', 'thick', 'bushy'] as const),
        eyelashes: select(['short', 'medium', 'long'] as const),
        lipShape: select(['thin', 'medium', 'full', 'bow', 'wide'] as const),
        facialHairStyle: select(facialHairStyles),
        facialHairThickness: select(['sparse', 'medium', 'thick'] as const),
    };
}


function getRandomFromList(list: any[] | undefined, noise: ValueNoise): any {
    if (!list || list.length === 0) return null;
    return list[Math.floor(noise.random() * list.length)];
}

export function generateClothingPalette(wealthLevel: WealthLevel, era: HistoricalEra, culturalZone: CulturalZone, gender: Gender, noise: ValueNoise): ClothingPalette {
    const mapWealthToClothingTier = (wealth: WealthLevel): 'poor' | 'common' | 'wealthy' => {
        switch (wealth) {
            case 'poor': case 'modest': return 'poor';
            case 'comfortable': return 'common';
            case 'wealthy': case 'noble': return 'wealthy';
            default: return 'common';
        }
    };
    const clothingTier = mapWealthToClothingTier(wealthLevel);
    
    // Special handling for North American Colonial zones - use European clothing for modern era
    let effectiveCulturalZone = culturalZone;
    if (culturalZone === 'NORTH_AMERICAN_COLONIAL' && 
        (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA)) {
        effectiveCulturalZone = 'EUROPEAN' as CulturalZone;
    }
    
    const eraData = (clothingModule.CLOTHING_DATA || {})[effectiveCulturalZone]?.[era];
    const specificClothingSet = eraData?.[clothingTier]?.[gender];
    const palette = specificClothingSet?.palette;
    
    if (!palette || !palette.primary || palette.primary.length === 0) {
        // Use era-appropriate fallback colors instead of always brown
        if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.INDUSTRIAL_ERA) {
            return { 
                primary: getRandomFromList(['#000080', '#696969', '#000000'], noise) || '#000080',
                secondary: getRandomFromList(['#FFFFFF', '#D3D3D3', '#A0522D'], noise) || '#FFFFFF',
                accent: getRandomFromList(['#DC143C', '#1E90FF', '#32CD32'], noise) || '#1E90FF'
            };
        }
        // Default brown fallback for older eras
        return { primary: '#8B4513', secondary: '#654321', accent: '#D2691E' };
    }

    return {
        primary: getRandomFromList(palette.primary, noise) || '#8B4513',
        secondary: getRandomFromList(palette.secondary, noise) || '#654321',
        accent: getRandomFromList(palette.accent, noise) || '#D2691E'
    };
}


function getHairstyle(era: HistoricalEra, gender: Gender, noise: ValueNoise): string {
    const isFemale = gender === 'Female';
    const isYoung = noise.random() < 0.3;
    const isOld = noise.random() > 0.8;

    const maleStyles: Record<string, string[]> = {
      'PREHISTORY': isYoung ? ['medium_messy', 'tied_back'] : isOld ? ['balding', 'thin_long', 'elder_wild'] : ['long_wild', 'medium_messy', 'tied_back', 'warrior_knot', 'shaman_braids'],
      'ANTIQUITY': isYoung ? ['short_cropped', 'medium_curled', 'youth_locks'] : isOld ? ['balding', 'philosopher_beard', 'elder_crown'] : ['short_cropped', 'medium_curled', 'warrior_knot', 'philosopher_beard', 'senator_style'],
      'MEDIEVAL': isYoung ? ['bowl_cut', 'page_cut', 'squire_style'] : isOld ? ['monk_style', 'thin_long', 'elder_tonsure'] : ['bowl_cut', 'shoulder_length', 'monk_style', 'knight_cut', 'noble_waves'],
      'RENAISSANCE_EARLY_MODERN': ['shoulder_curled', 'short_styled', 'renaissance_bob', 'courtier_locks', 'artist_mane'],
      'INDUSTRIAL_ERA': isOld ? ['balding', 'thin_sides', 'gentleman_receding'] : ['side_part', 'slicked_back', 'gentleman_cut', 'victorian_waves', 'industrialist_style'],
      'MODERN_ERA': ['pompadour', 'side_part', 'short_modern', 'slick_back', 'professional_cut', 'contemporary_fade']
    };
    
    const femaleStyles: Record<string, string[]> = {
      'PREHISTORY': isYoung ? ['braided_long', 'tied_back', 'maiden_wild'] : ['long_wild', 'braided_long', 'tied_back', 'tribal_braids', 'elder_knots'],
      'ANTIQUITY': ['greek_bun', 'roman_waves', 'braided_crown', 'goddess_locks', 'priestess_style'],
      'MEDIEVAL': isYoung ? ['long_plaits', 'maiden_braids', 'novice_style'] : ['braided_buns', 'covered_hair', 'long_plaits', 'courtly_braids', 'noble_wimple'],
      'RENAISSANCE_EARLY_MODERN': ['elaborate_braids', 'side_curls', 'high_forehead', 'pearl_net', 'renaissance_rolls'],
      'INDUSTRIAL_ERA': isYoung ? ['gibson_girl', 'loose_curls', 'young_lady_style'] : ['victorian_updo', 'gibson_girl', 'elaborate_bun', 'chignon', 'matron_waves'],
      'MODERN_ERA': isYoung ? ['bob_cut', 'finger_waves', 'flapper_style'] : ['bob_cut', 'finger_waves', 'pin_curls', 'victory_rolls', 'marcel_waves', 'modern_sophisticated']
    };
    
    const styles = (isFemale ? femaleStyles[era] : maleStyles[era]) || maleStyles['MEDIEVAL'];
    return styles[Math.floor(noise.random() * styles.length)];
}

function getNeighboringMapAreas(currentRegion: string, currentZone: CulturalZone): MapAreaDefinition[] {
    const neighbors: MapAreaDefinition[] = [];
    const currentRegionDef = GEOGRAPHICAL_DATA[currentZone]?.[currentRegion];
    if (!currentRegionDef) return [];

    const currentAreaName = Object.keys(currentRegionDef)[0]; // Assuming one area per region for simplicity
    const adjacencies = ADJACENCIES[currentAreaName];
    if (!adjacencies) return [];

    for (const dir in adjacencies) {
        const neighborKey = adjacencies[dir as keyof typeof adjacencies];
        if (neighborKey) {
            for (const zone in GEOGRAPHICAL_DATA) {
                for (const region in GEOGRAPHICAL_DATA[zone as CulturalZone]) {
                     if (GEOGRAPHICAL_DATA[zone as CulturalZone]?.[region]?.[neighborKey]) {
                        neighbors.push(GEOGRAPHICAL_DATA[zone as CulturalZone][region][neighborKey]);
                    }
                }
            }
        }
    }
    return neighbors;
}

function generateBirthplace(noise: ValueNoise, context: { region: string, culturalZone: CulturalZone }): string {
    const roll = noise.random();

    // 20% chance to be from a neighboring region's city
    if (roll < 0.20) {
        const neighbors = getNeighboringMapAreas(context.region, context.culturalZone);
        if (neighbors.length > 0) {
            const neighbor = neighbors[Math.floor(noise.random() * neighbors.length)];
            // Try to get actual cities from CITIES_DATA
            const citiesInRegion = CITIES_DATA[neighbor.name];
            if (citiesInRegion && citiesInRegion.length > 0) {
                const city = citiesInRegion[Math.floor(noise.random() * citiesInRegion.length)];
                return `the city of ${city.name}`;
            }
            return `the ${neighbor.name} region`;
        }
    }

    // 30% chance to be from a neighboring region's village
    if (roll < 0.50) {
        const neighbors = getNeighboringMapAreas(context.region, context.culturalZone);
        if (neighbors.length > 0) {
            const neighbor = neighbors[Math.floor(noise.random() * neighbors.length)];
            return `a village near ${neighbor.name}`;
        }
    }

    // 50% chance to be from the local region
    return `a village in ${context.region}`;
}

export function generateCompleteOutfit(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: WealthLevel,
    gender: Gender,
    occupation?: string,
    region?: string
): {
    garment: ClothingPiece;
    headgear: ClothingPiece;
    footwear: ClothingPiece;
    belt: ClothingPiece;
    accessory: ClothingPiece;
} {
    const clothingSet = clothingModule.getClothingData(culturalZone, era, wealthLevel, gender);

    // Region-based filtering for items that are inappropriate for specific regions within a cultural zone
    const filterByRegion = (items: ClothingPiece[]): ClothingPiece[] => {
        if (!region) return items;

        const regionLower = region.toLowerCase();

        // OCEANIA: Australian regions should NOT have Polynesian items
        if (culturalZone === 'OCEANIA') {
            const isAustralia = regionLower.includes('australia') ||
                regionLower.includes('aboriginal') ||
                regionLower.includes('outback') ||
                regionLower.includes('arnhem') ||
                regionLower.includes('kimberley') ||
                regionLower.includes('tasmania') ||
                regionLower.includes('queensland') ||
                regionLower.includes('victoria') ||
                regionLower.includes('new south wales') ||
                regionLower.includes('western australia') ||
                regionLower.includes('northern territory') ||
                regionLower.includes('south australia') ||
                (regionLower.includes('desert') && !regionLower.includes('sahara') && !regionLower.includes('gobi'));

            if (isAustralia) {
                // Aboriginal Australian-appropriate clothing items to replace Polynesian ones
                const aboriginalReplacements: Record<string, ClothingPiece[]> = {
                    headgear: [
                        { name: 'Feather Band', material: 'Emu Feathers' },
                        { name: 'Ochre Headband', material: 'Dyed Bark Fiber' },
                        { name: 'None', material: 'None' }
                    ],
                    garments: [
                        { name: 'Possum Skin Cloak', material: 'Possum Fur' },
                        { name: 'Kangaroo Hide Wrap', material: 'Kangaroo Skin' },
                        { name: 'Bark Fiber Cloth', material: 'Paperbark Fiber' }
                    ],
                    accessories: [
                        { name: 'Bone Pendant', material: 'Kangaroo Bone' },
                        { name: 'Shell Necklace', material: 'Freshwater Shells' },
                        { name: 'Seed Bracelet', material: 'Wattleseed' },
                        { name: 'Ochre Body Paint', material: 'Red Ochre' }
                    ]
                };

                // Filter out Polynesian items and map to Aboriginal alternatives
                const polynesianTerms = [
                    'crown', 'tapa', 'pearl', 'jade', 'kapa', 'mahiole', 'lei', 'malu',
                    'flower crown', 'feather crown', 'chiefly', 'royal', 'chief', 'noble',
                    'whale bone', 'greenstone', 'whale tooth', 'carved ivory', 'fine tapa',
                    'sacred bird', 'sacred belt', 'pearl girdle', 'coconut'
                ];

                const filtered = items.filter(item => {
                    const nameLower = item.name.toLowerCase();
                    const materialLower = item.material.toLowerCase();
                    return !polynesianTerms.some(p => nameLower.includes(p) || materialLower.includes(p));
                });

                // If all items were filtered out, return Aboriginal-appropriate alternatives
                if (filtered.length === 0) {
                    // Try to determine category from original items
                    const firstItem = items[0];
                    if (firstItem) {
                        const nameLower = firstItem.name.toLowerCase();
                        if (nameLower.includes('crown') || nameLower.includes('headdress') || nameLower.includes('headgear') || nameLower.includes('cap') || nameLower.includes('band')) {
                            return aboriginalReplacements.headgear;
                        } else if (nameLower.includes('necklace') || nameLower.includes('pendant') || nameLower.includes('bracelet') || nameLower.includes('earring') || nameLower.includes('armband')) {
                            return aboriginalReplacements.accessories;
                        } else if (nameLower.includes('cloak') || nameLower.includes('wrap') || nameLower.includes('tunic') || nameLower.includes('dress') || nameLower.includes('skirt')) {
                            return aboriginalReplacements.garments;
                        }
                    }
                    // Default to headgear-like 'None' if can't determine
                    return [{ name: 'None', material: 'None' }];
                }

                return filtered;
            }
        }

        return items;
    };
    
    // Filter out inappropriate items based on occupation
    const filterByOccupation = (items: ClothingPiece[], category: string): ClothingPiece[] => {
        if (!occupation) return items;

        const occupationLower = occupation.toLowerCase();
        const isWorkingClass = occupationLower.includes('operator') ||
                               occupationLower.includes('worker') ||
                               occupationLower.includes('laborer') ||
                               occupationLower.includes('clerk') ||
                               occupationLower.includes('secretary');

        const isCriminalOrOutcast = occupationLower.includes('thief') ||
                                    occupationLower.includes('pickpocket') ||
                                    occupationLower.includes('bandit') ||
                                    occupationLower.includes('outlaw') ||
                                    occupationLower.includes('smuggler') ||
                                    occupationLower.includes('beggar') ||
                                    occupationLower.includes('vagrant') ||
                                    occupationLower.includes('prostitute') ||
                                    occupationLower.includes('criminal');

        if (isWorkingClass || isCriminalOrOutcast) {
            // Filter out luxury items for working class occupations
            return items.filter(item => {
                const nameLower = item.name.toLowerCase();
                const materialLower = item.material.toLowerCase();
                
                // Forbidden items for working class
                const forbidden = ['tiara', 'parure', 'crown', 'diadem', 'jeweled', 
                                 'diamond', 'emerald', 'ruby', 'sapphire', 'pearl',
                                 'cocktail dress', 'evening gown', 'ball gown',
                                 'silk', 'velvet', 'satin', 'ermine', 'gold', 'silver'];
                
                return !forbidden.some(f => nameLower.includes(f) || materialLower.includes(f));
            });
        }
        
        return items;
    };
    
    // Apply filters to each category - first by region, then by occupation
    const filteredGarments = filterByOccupation(filterByRegion(clothingSet.garments), 'garment');
    const filteredHeadgear = filterByOccupation(filterByRegion(clothingSet.headgear), 'headgear');
    const filteredFootwear = filterByOccupation(filterByRegion(clothingSet.footwear), 'footwear');
    const filteredBelts = filterByOccupation(filterByRegion(clothingSet.belts), 'belt');
    const filteredAccessories = filterByOccupation(filterByRegion(clothingSet.accessories), 'accessory');
    
    // Convert wealth level for clothing variations
    const simplifiedWealth =
        wealthLevel === 'poor' || wealthLevel === 'modest' ? 'poor' :
        wealthLevel === 'comfortable' ? 'common' : 'wealthy';

    // Ensure we have at least one item in each category
    const safeGetRandom = (filtered: ClothingPiece[], original: ClothingPiece[], category: string) => {
        if (filtered.length > 0) {
            return clothingModule.getRandomClothingPiece(filtered, simplifiedWealth);
        }
        // Fallback to appropriate basic items based on category
        // For optional items (headgear, accessories, belts), return "None"
        // For required items (garments, footwear), return basic items
        if (category === 'headgear' || category === 'accessory' || category === 'belt') {
            return { name: 'None', material: 'None' };
        }
        if (category === 'garment') {
            return { name: 'Simple Tunic', material: 'Linen' };
        }
        if (category === 'footwear') {
            return { name: 'Simple Shoes', material: 'Leather' };
        }
        return { name: 'None', material: 'None' };
    };

    return {
        garment: safeGetRandom(filteredGarments, clothingSet.garments, 'garment'),
        headgear: safeGetRandom(filteredHeadgear, clothingSet.headgear, 'headgear'),
        footwear: safeGetRandom(filteredFootwear, clothingSet.footwear, 'footwear'),
        belt: safeGetRandom(filteredBelts, clothingSet.belts, 'belt'),
        accessory: safeGetRandom(filteredAccessories, clothingSet.accessories, 'accessory'),
    };
}


/**
 * Enhanced base profile generation with improved error handling and logging
 */
export function generateBaseProfile(noise: ValueNoise, context: { era: HistoricalEra, culturalZone: CulturalZone, region: string }): Omit<NpcEntity, 'id' | 'name' | 'class' | 'role' | 'descriptions' | 'movement' | 'x' | 'y' | 'emoji' | 'activity' | 'workplaceId' | 'workplaceName'> {
    try {
        if (!noise || typeof noise.random !== 'function') {
            noise = { random: () => Math.random() } as ValueNoise;
        }
        
        const generateStat = (base: number = 5, variance: number = 5) => Math.max(1, Math.min(10, base + Math.floor((noise.random() - 0.5) * variance)));
        
        const stats: CharacterStats = {
            strength: generateStat(), dexterity: generateStat(), stamina: generateStat(), constitution: generateStat(),
            intelligence: generateStat(), wisdom: generateStat(), charisma: generateStat(), perception: generateStat(),
            craftiness: generateStat(), persuasion: generateStat(), luck: generateStat(),
            level: 1,  attack: 0, defense: 0, physicalResist: 0, dodgeBonus: 0,
        };
        
        stats.attack = Math.max(1, Math.floor(stats.strength / 2));
        stats.defense = Math.max(1, Math.floor((stats.constitution + stats.dexterity) / 3));
        stats.level = 1 + Math.floor(noise.random() * 5);

        let personality: CharacterPersonality = {
            openness: Math.max(0, Math.min(1, noise.random())),
            conscientiousness: Math.max(0, Math.min(1, noise.random())),
            extraversion: Math.max(0, Math.min(1, noise.random())),
            agreeableness: Math.max(0, Math.min(1, noise.random())),
            neuroticism: Math.max(0, Math.min(1, noise.random())),
        };

        // Correlate personality with stats for initial coherence
        personality = correlateStatsWithPersonality(stats, personality);

        const socialContext: CharacterSocialContext = {
            privilege: Math.max(0, Math.min(1, noise.random())),
            wanderlust: Math.max(0, Math.min(1, noise.random())),
            religiosity: Math.max(0, Math.min(1, noise.random())),
            ambition: Math.max(0, Math.min(1, noise.random())),
            entrepreneurial: Math.max(0, Math.min(1, noise.random())),
        };

        const gender: Gender = noise.random() > 0.5 ? 'Male' : 'Female';
        const age = Math.max(18, Math.min(80, 18 + Math.floor(noise.random() * 50)));

        const p = socialContext.privilege;
        const wealthLevel: WealthLevel = p > 0.95 ? 'noble' : p > 0.8 ? 'wealthy' : p > 0.5 ? 'comfortable' : p > 0.2 ? 'modest' : 'poor';
        
        const currency = 5 + Math.floor(noise.random() * (wealthLevel === 'poor' ? 10 : wealthLevel === 'modest' ? 30 : 100));

        const culturalAppearance = generateCulturalAppearance(context.culturalZone, noise);
        const facialFeatures = generateFacialFeatures(noise, gender, context.culturalZone, age);
        const bodyMetrics = generateBodyMetrics(gender, stats, noise);
        
        const clothingPalette = generateClothingPalette(wealthLevel, context.era, context.culturalZone, gender, noise);
        const clothingPieces = generateCompleteOutfit(context.culturalZone, context.era, wealthLevel, gender, undefined, context.region);

        
        const religion = determineReligion(context.culturalZone, context.region, context.era, noise);

        // Apply historical plausibility constraints for religion-based social class restrictions
        const maxWealthForReligion = getMaxWealthLevelForReligion(religion, context.culturalZone, context.era);
        const constrainedWealthLevel = constrainWealthByReligion(wealthLevel, maxWealthForReligion);

        // Regenerate clothing and currency based on constrained wealth if it changed
        let finalClothingPalette = clothingPalette;
        let finalClothingPieces = clothingPieces;
        let finalCurrency = currency;

        if (constrainedWealthLevel !== wealthLevel) {
            finalClothingPalette = generateClothingPalette(constrainedWealthLevel, context.era, context.culturalZone, gender, noise);
            finalClothingPieces = generateCompleteOutfit(context.culturalZone, context.era, constrainedWealthLevel, gender, undefined, context.region);
            finalCurrency = 5 + Math.floor(noise.random() * (constrainedWealthLevel === 'poor' ? 10 : constrainedWealthLevel === 'modest' ? 30 : 100));

            // Update social context privilege to match constrained wealth
            const wealthToPrivilege: Record<WealthLevel, number> = {
                'poor': 0.1,
                'modest': 0.35,
                'comfortable': 0.6,
                'wealthy': 0.85,
                'noble': 0.95
            };
            socialContext.privilege = wealthToPrivilege[constrainedWealthLevel];
        }

        const birthplace = generateBirthplace(noise, context);
        const hairstyle = getHairstyle(context.era, gender, noise);

        let affect = 'neutral';
        if (personality.extraversion > 0.75) affect = 'friendly';
        if (personality.agreeableness < 0.25) affect = 'guarded';
        if (personality.neuroticism > 0.8) affect = 'anxious';
        if (stats.strength > 8 && personality.agreeableness < 0.4) affect = 'intimidating';

        // Generate cultural markings based on context
        const markingProbability = getMarkingProbability(context.culturalZone, context.era, undefined);
        const markings: any[] = [];
        
        if (noise.random() < markingProbability) {
            const availableMarkings = getMarkingsForCharacter(
                context.culturalZone,
                context.era,
                undefined, // Will be set later when role is determined
                gender.toLowerCase() as 'male' | 'female',
                wealthLevel,
                age,
                'daily'
            );
            
            const selectedMarking = selectRandomMarking(availableMarkings, noise.random());
            if (selectedMarking) {
                const pattern = getRandomPattern(selectedMarking, noise.random());
                if (pattern) {
                    const appearanceMarking = convertToAppearanceMarking(selectedMarking, pattern);
                    markings.push(appearanceMarking);
                }
            }
        }

        const appearance: Appearance = {
            ...culturalAppearance,
            ...facialFeatures,
            ...bodyMetrics,
            ...finalClothingPieces,
            affect,
            hairstyle,
            palette: finalClothingPalette,
            markings: markings.length > 0 ? markings : undefined
        };

        const maxHealth = 80 + stats.constitution * 2;
        
        const profileInProgress: any = {
            stats, personality, socialContext, age, gender,
            wealthLevel: constrainedWealthLevel, // Use religion-constrained wealth level
            religion,
            appearance,
            health: maxHealth, maxHealth,
            targetX: 0, targetY: 0, direction: 'down' as const,
            walkFrame: 0, onRoad: false, era: context.era, culturalZone: context.culturalZone,
            statusEffects: [],
            birthplace,
            backstory: '',
            family: [],
            lifeEvents: [],
            memory: createSafeNpcMemory(),
            inventory: [],
            currency: finalCurrency,
            aiState: 'wandering'
        };

        // Now, assign beliefs to this partial profile.
        const beliefData = assignBeliefs(profileInProgress as NpcEntity, noise);
        profileInProgress.ideology = beliefData.ideology;
        profileInProgress.beliefs = beliefData.beliefs;

        // With beliefs assigned, we can now safely generate the goal.
        profileInProgress.personalGoal = generatePersonalGoal(profileInProgress as NpcEntity, noise);
        
        return profileInProgress as Omit<NpcEntity, 'id' | 'name' | 'class' | 'role' | 'descriptions' | 'movement' | 'x' | 'y' | 'emoji' | 'activity' | 'workplaceId' | 'workplaceName'>;
        
    } catch (error) {
        console.error('[NPC Utils] Profile generation failed, using minimal fallback:', error);
        // This is an absolute fallback in case of a critical error.
        return {
            stats: { strength: 5, dexterity: 5, stamina: 5, constitution: 5, intelligence: 5, wisdom: 5, charisma: 5, perception: 5, craftiness: 5, persuasion: 5, luck: 5, level: 1, attack: 3, defense: 3, physicalResist: 0, dodgeBonus: 0 },
            personality: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 },
            socialContext: { privilege: 0.3, wanderlust: 0.5, religiosity: 0.5, ambition: 0.5, entrepreneurial: 0.5 },
            age: 30, gender: 'Male', wealthLevel: 'modest', religion: 'Agnostic',
            appearance: {
                skinColor: '#f4d1ae', hairColor: '#8b4513', eyeColor: '#654321', hairstyle: 'short_cropped',
                height: 175, build: 'average', weight: 70, facialHair: false,
                affect: 'neutral',
                garment: { name: 'Tunic', material: 'Linen' },
                belt: { name: 'Leather Belt', material: 'Leather' },
                footwear: { name: 'Leather Shoes', material: 'Leather' },
                headgear: { name: 'None', material: 'None' },
                accessory: { name: 'None', material: 'None' },
                palette: { primary: '#8B4513', secondary: '#654321', accent: '#D2691E' }
            } as any,
            health: 90, maxHealth: 90,
            targetX: 0, targetY: 0, direction: 'down', walkFrame: 0, onRoad: false,
            era: context.era || HistoricalEra.MEDIEVAL, culturalZone: context.culturalZone || 'EUROPEAN',
            statusEffects: [],
            birthplace: 'an unknown village',
            backstory: 'An unknown person with a mysterious past.',
            family: [],
            lifeEvents: [],
            personalGoal: { archetype: 'PROTECT', targetType: 'CONCEPT', targetId: 'SELF', description: 'Survive.' },
            ideology: 'Pragmatism',
            beliefs: [{ beliefId: 'SURVIVAL_FIRST', conviction: 100 }],
            memory: { opinionOfPlayer: 0, knownFactsAboutPlayer: new Set(), relationships: new Map(), conversationSummaries: [] },
            inventory: [],
            currency: 10,
            aiState: 'wandering',
        };
    }
}

export function generateCulturalAppearance(culturalZone: CulturalZone, noise: ValueNoise) {
    const appearances: Record<string, {skinTones: string[], hairColors: string[], eyeColors: string[]}> = {
        'EAST_ASIAN': { skinTones: ['#fdbcb4', '#f4d1ae', '#e8c5a0', '#deb887', '#f0dcc4'], hairColors: ['#000000', '#1a0a05', '#2c1810', '#0f0f0f'], eyeColors: ['#2c1810', '#000000', '#1a1a1a', '#342c24'] },
        'EUROPEAN': { skinTones: ['#fde2d1', '#f4d1ae', '#e8c5a0', '#deb887', '#d2b48c', '#f5e6d3'], hairColors: ['#8b4513', '#654321', '#d4af37', '#dc7633', '#000000', '#696969', '#2c1810', '#f4d03f', '#b22222', '#daa520'], eyeColors: ['#4169e1', '#006400', '#8b4513', '#2c1810', '#654321', '#708090', '#87ceeb', '#228b22'] },
        'SUB_SAHARAN_AFRICAN': { skinTones: ['#8d5524', '#654321', '#4a3018', '#3c241a', '#2d1b0f', '#a0835a'], hairColors: ['#000000', '#1a0a05', '#0a0a0a'], eyeColors: ['#2c1810', '#000000', '#1a1a1a'] },
        'MENA': { skinTones: ['#deb887', '#d2b48c', '#bc9a6a', '#a0835a', '#e6d2b0'], hairColors: ['#000000', '#2c1810', '#654321', '#1a1a1a'], eyeColors: ['#2c1810', '#654321', '#000000', '#8b4513', '#2f4f4f'] },
        'SOUTH_ASIAN': { skinTones: ['#bc9a6a', '#a0835a', '#8d5524', '#deb887', '#cd853f'], hairColors: ['#000000', '#2c1810', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321', '#1a1a1a'] },
        'SOUTH_AMERICAN': { skinTones: ['#bc9a6a', '#a0835a', '#d2b48c', '#8d5524', '#deb887'], hairColors: ['#000000', '#2c1810', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321', '#1a1a1a'] },
        'NORTH_AMERICAN_PRE_COLUMBIAN': { skinTones: ['#bc9a6a', '#a0835a', '#d2b48c', '#8d5524'], hairColors: ['#000000', '#2c1810', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321'] },
        'OCEANIA': { skinTones: ['#8d5524', '#a0835a', '#bc9a6a', '#654321', '#4a3018'], hairColors: ['#000000', '#2c1810', '#654321', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321'] }
    };
    const appearance = appearances[culturalZone] || appearances['EUROPEAN'];
    return {
        skinColor: appearance.skinTones[Math.floor(noise.random() * appearance.skinTones.length)],
        hairColor: appearance.hairColors[Math.floor(noise.random() * appearance.hairColors.length)],
        eyeColor: appearance.eyeColors[Math.floor(noise.random() * appearance.eyeColors.length)]
    };
}


/**
 * Region-specific profession exclusions
 * Certain professions are inappropriate for specific regions within a cultural zone
 * e.g., Kava is not found in Australia, breadfruit is not native there either
 */
function isProfessionValidForRegion(professionName: string, region: string | undefined, culturalZone: CulturalZone): boolean {
    if (!region) return true;

    const regionLower = region.toLowerCase();

    // OCEANIA region-specific exclusions
    if (culturalZone === 'OCEANIA') {
        // Australian regions - no kava, breadfruit, or Polynesian-specific items
        const isAustralia = regionLower.includes('australia') ||
            regionLower.includes('aboriginal') ||
            regionLower.includes('outback') ||
            regionLower.includes('desert') && !regionLower.includes('sahara');

        if (isAustralia) {
            const australiaExcluded = [
                'Kava Preparer', 'Kava Grower',
                'Breadfruit Cultivator', 'Breadfruit Farmer',
                'Coconut Harvester', 'Coconut Gatherer',
                'Taro Farmer', 'Taro Cultivator',
                'Pearl Diver', // Not traditional Australian Aboriginal
                'Master Navigator', // Ocean voyaging not Aboriginal tradition
                'Canoe Paddler', // Different watercraft traditions
                'Stone Carver', // Moai-style not Aboriginal
                'Maori Warrior', 'Tohunga', 'Taulasea',
                'Kahuna Lapaʻau', // Hawaiian specific
                'Tapa Maker', 'Tapa Cloth Maker', // Polynesian barkcloth
                'Mat Weaver', // Different traditions
                'Pig Keeper', // Pigs not native to pre-contact Australia
            ];
            if (australiaExcluded.includes(professionName)) return false;
        }

        // Melanesia - some Polynesian items shouldn't appear
        const isMelanesia = regionLower.includes('melanesia') ||
            regionLower.includes('papua') ||
            regionLower.includes('new guinea') ||
            regionLower.includes('solomon') ||
            regionLower.includes('vanuatu') ||
            regionLower.includes('fiji');

        if (isMelanesia) {
            const melanesiaExcluded = [
                'Maori Warrior', 'Tohunga', // New Zealand specific
                'Kahuna Lapaʻau', // Hawaiian specific
            ];
            if (melanesiaExcluded.includes(professionName)) return false;
        }

        // New Zealand / Maori - exclude tropical Pacific items
        const isNewZealand = regionLower.includes('new zealand') ||
            regionLower.includes('aotearoa') ||
            regionLower.includes('maori');

        if (isNewZealand) {
            const nzExcluded = [
                'Kava Preparer', 'Kava Grower', // Kava doesn't grow in NZ climate
                'Breadfruit Cultivator', // Too cold
                'Coconut Harvester', 'Coconut Gatherer', // Too cold
                'Kahuna Lapaʻau', // Hawaiian specific
                'Taulasea', // Samoan specific
            ];
            if (nzExcluded.includes(professionName)) return false;
        }

        // Hawaii specific
        const isHawaii = regionLower.includes('hawaii') || regionLower.includes('hawaiian');
        if (isHawaii) {
            const hawaiiExcluded = [
                'Maori Warrior', 'Tohunga', // NZ specific
                'Taulasea', // Samoan specific
            ];
            if (hawaiiExcluded.includes(professionName)) return false;
        }
    }

    // NORTH AMERICAN PRE-COLUMBIAN region-specific
    if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
        // Arctic regions
        const isArctic = regionLower.includes('arctic') ||
            regionLower.includes('inuit') ||
            regionLower.includes('alaska') ||
            regionLower.includes('greenland');

        if (isArctic) {
            const arcticExcluded = [
                'Corn Farmer', 'Maize Farmer', // Too cold
                'Cotton Weaver', // No cotton
                'Pueblo Builder', // Southwest specific
            ];
            if (arcticExcluded.includes(professionName)) return false;
        }
    }

    return true;
}

/**
 * Check if a social class category is valid for a given region
 * This filters entire profession categories, not individual professions
 * For example, Australian regions should ONLY use ABORIGINAL_AUSTRALIAN, not ISLAND_SETTLERS
 */
function isSocialClassValidForRegion(socialClass: string, region: string | undefined, culturalZone: CulturalZone): boolean {
    if (!region) return true;

    const regionLower = region.toLowerCase();

    // OCEANIA region-specific social class filtering
    if (culturalZone === 'OCEANIA') {
        // Check if region is Australian
        const isAustralia = regionLower.includes('australia') ||
            regionLower.includes('aboriginal') ||
            regionLower.includes('outback') ||
            regionLower.includes('arnhem') ||
            regionLower.includes('kimberley') ||
            regionLower.includes('tasmania') ||
            regionLower.includes('queensland') ||
            regionLower.includes('victoria') ||
            regionLower.includes('new south wales') ||
            regionLower.includes('western australia') ||
            regionLower.includes('northern territory') ||
            regionLower.includes('south australia') ||
            (regionLower.includes('desert') && !regionLower.includes('sahara') && !regionLower.includes('gobi'));

        if (isAustralia) {
            // Australian regions should ONLY use ABORIGINAL_AUSTRALIAN professions
            if (socialClass === 'ABORIGINAL_AUSTRALIAN') return true;
            // Reject Pacific Island profession categories for Australia
            if (['ISLAND_SETTLERS', 'POLYNESIAN', 'HAWAIIAN', 'MELANESIAN', 'MAORI'].includes(socialClass)) {
                return false;
            }
        } else {
            // Non-Australian Pacific regions should NOT use ABORIGINAL_AUSTRALIAN
            if (socialClass === 'ABORIGINAL_AUSTRALIAN') {
                return false;
            }
        }
    }

    return true;
}

function getFallbackRole(wealth: WealthLevel, gender: Gender): { socialClass: string, role: string, emoji: string, nameKey?: string } {
    const commonerRoles = [
        { role: 'Laborer', emoji: '🧑‍🔧', gender: 'any' },
        { role: 'Wanderer', emoji: '🚶', gender: 'any' },
        { role: 'Farmer', emoji: '🧑‍🌾', gender: 'any' },
        { role: 'Shepherd', emoji: '🐑', gender: 'any' },
        { role: 'Potter', emoji: '🏺', gender: 'Male' },
        { role: 'Weaver', emoji: '🧶', gender: 'Female' },
        { role: 'Caretaker', emoji: '🧑‍⚕️', gender: 'Female' },
        { role: 'Child Watcher', emoji: '👶', gender: 'Female' },
        { role: 'Mother', emoji: '🤱', gender: 'Female' },
    ];

    const suitableRoles = commonerRoles.filter(r => r.gender === 'any' || r.gender === gender);

    if (suitableRoles.length > 0) {
        const chosen = suitableRoles[Math.floor(Math.random() * suitableRoles.length)];
        return { socialClass: 'COMMONER', role: chosen.role, emoji: chosen.emoji };
    }
    
    // Ultimate fallback if no suitable role found (e.g. for Non-binary gender)
    if (wealth === 'poor' || wealth === 'modest') {
        return { socialClass: 'COMMONER', role: 'Laborer', emoji: '🧑‍🔧' };
    }
    return { socialClass: 'COMMONER', role: 'Wanderer', emoji: '🚶' };
}

export function determineSocialRole(
    profile: Omit<NpcEntity, 'id' | 'name' | 'class' | 'role' | 'descriptions' | 'movement' | 'x' | 'y' | 'emoji' | 'activity' | 'birthplace' | 'workplaceId' | 'workplaceName' | 'ideology' | 'beliefs'>,
    context: { era: HistoricalEra, culturalZone: CulturalZone, factionData?: FactionData, region?: string, citySize?: number },
    preferredRole?: string,
    structureType?: TerrainStructureType
): { socialClass: string, role: string, emoji: string, nameKey?: string } {
    try {
        // If a specific role is requested (e.g., from a court or anchor), use it directly.
        if (preferredRole && context.factionData?.courtRoles && structureType && context.factionData.courtRoles[structureType]) {
            const courtRoles = context.factionData.courtRoles[structureType]!;
            const role = courtRoles.includes(preferredRole) ? preferredRole : courtRoles[0];
            return { socialClass: 'NOBILITY', role: role, emoji: '👑', nameKey: undefined };
        }

        let eraForProfessions: HistoricalEra;

        if (context.era.endsWith('s')) { // This is a decade string like "1940s"
            const year = parseInt(context.era.slice(0, 4), 10);
            if (year >= 1900) {
                eraForProfessions = HistoricalEra.MODERN_ERA;
            } else {
                eraForProfessions = HistoricalEra.INDUSTRIAL_ERA; // fallback
            }
        } else {
            eraForProfessions = context.era as HistoricalEra;
        }

        const eraRoles: SocialClassMap | undefined = PROFESSIONS[context.culturalZone]?.[eraForProfessions];

        if (!eraRoles) return getFallbackRole(profile.wealthLevel, profile.gender);

        // Get the appropriate profession context based on location
        let professionContext: ProfessionContext | null = null;
        if (eraForProfessions === HistoricalEra.INDUSTRIAL_ERA) {
            professionContext = getProfessionContext(
                context.region,
                structureType,
                context.citySize,
                context.culturalZone,
                eraForProfessions
            );
        }

        if (preferredRole) {
            for (const socialClass in eraRoles) {
                // Skip social classes that don't match our context
                if (professionContext && socialClass !== professionContext) {
                    // Check if this socialClass matches our fallback context
                    const fallback = getFallbackContext(professionContext, eraForProfessions);
                    if (socialClass !== fallback && socialClass !== 'GENERAL') {
                        continue;
                    }
                }

                // Filter social class categories by region
                if (!isSocialClassValidForRegion(socialClass, context.region, context.culturalZone)) {
                    continue;
                }

                if (eraRoles[socialClass]?.[preferredRole]) {
                    const roleDef = eraRoles[socialClass][preferredRole];
                     if (roleDef.genderBias && profile.gender !== 'Non-binary' && roleDef.genderBias !== profile.gender) {
                        continue; 
                    }
                    return { socialClass, role: preferredRole, emoji: roleDef.emoji || '🧑', nameKey: roleDef.nameKey };
                }
            }
        }
        
        const possibleRoles: { socialClass: string, role: string, roleDef: ProfessionDefinition }[] = [];

        for (const socialClass in eraRoles) {
            // Apply context filtering for Industrial Era
            if (professionContext && socialClass !== professionContext) {
                // Allow fallback contexts
                const fallback = getFallbackContext(professionContext, eraForProfessions);
                if (socialClass !== fallback && socialClass !== 'GENERAL' && socialClass !== 'COMMONER') {
                    continue;
                }
            }

            // Filter social class categories by region (e.g., ABORIGINAL_AUSTRALIAN only for Australia)
            if (!isSocialClassValidForRegion(socialClass, context.region, context.culturalZone)) {
                continue;
            }

            const rolesInClass = eraRoles[socialClass];
            for (const roleName in rolesInClass) {
                const roleDef = rolesInClass[roleName];

                // Check if this profession is valid for the specific region
                if (!isProfessionValidForRegion(roleName, context.region, context.culturalZone)) {
                    continue;
                }

                if (roleDef.genderBias && profile.gender !== 'Non-binary' && roleDef.genderBias !== profile.gender) {
                    continue;
                }

                let score = 100;
                
                const checkStat = (value: number, min?: number, max?: number): number => {
                    if (min !== undefined && value < min) return -1000;
                    if (max !== undefined && value > max) return -1000;
                    let closeness = 0;
                    if (min !== undefined) closeness += 10 - (value - min);
                    if (max !== undefined) closeness += 10 - (max - value);
                    return closeness;
                };

                for (const statKey in roleDef.statRequirements) {
                    const key = statKey as keyof typeof roleDef.statRequirements;
                    const req = roleDef.statRequirements[key];
                    let statName: keyof CharacterStats | null = null;
                    if (key.startsWith('min')) statName = key.replace('min', '').toLowerCase() as keyof CharacterStats;
                    if (key.startsWith('max')) statName = key.replace('max', '').toLowerCase() as keyof CharacterStats;
                    
                    if (statName && profile.stats) {
                        score += checkStat(profile.stats[statName], req, undefined);
                    }
                }

                if (score > 0 && roleDef.socialRequirements) {
                     for (const socialKey in roleDef.socialRequirements) {
                        const key = socialKey as keyof typeof roleDef.socialRequirements;
                        const req = roleDef.socialRequirements[key];
                        let statName: keyof CharacterSocialContext | null = null;
                         if (key.startsWith('min')) statName = key.replace('min', '').toLowerCase() as keyof CharacterSocialContext;
                        if (key.startsWith('max')) statName = key.replace('max', '').toLowerCase() as keyof CharacterSocialContext;

                        if (statName && profile.socialContext) {
                            score += checkStat(profile.socialContext[statName], req, undefined);
                        }
                     }
                }

                if (score > 0) {
                     possibleRoles.push({ socialClass, role: roleName, roleDef });
                }
            }
        }
        
        if (possibleRoles.length > 0) {
            const chosen = possibleRoles[Math.floor(Math.random() * possibleRoles.length)];
            return { socialClass: chosen.socialClass, role: chosen.role, emoji: chosen.roleDef.emoji || '🧑', nameKey: chosen.roleDef.nameKey };
        }

        return getFallbackRole(profile.wealthLevel, profile.gender);
    } catch (error) {
        console.error("Error determining social role:", error);
        return getFallbackRole(profile.wealthLevel, profile.gender);
    }
}

export function generateNpcPortraitData(npc: NpcEntity) {
    const seed = parseInt(npc.id.replace(/\D/g, '').slice(-9)) || (npc.id.charCodeAt(0) + npc.x * 13 + npc.y * 31 + npc.age);

    return {
        era: npc.era,
        culturalZone: npc.culturalZone,
        gender: npc.gender,
        wealth: npc.wealthLevel,
        socialClass: npc.class,
        profession: npc.role,
        seed: seed,
        appearance: npc.appearance
    };
}


/**
 * Score how well an ideology matches a character's personality and social context
 * Higher scores = better match
 */
function scoreIdeologyPersonalityFit(
    ideology: Ideology,
    personality: CharacterPersonality,
    socialContext: CharacterSocialContext,
    profession?: string
): number {
    let score = 0;
    const ideoName = ideology.name.toLowerCase();
    const ideoId = ideology.id.toLowerCase();

    // Revolutionary/radical ideologies require high openness, low agreeableness
    if (ideoId.includes('revolutionary') || ideoId.includes('radical') || ideoId.includes('anarchist')) {
        score += (personality.openness - 0.5) * 40;      // High openness helps
        score -= (personality.agreeableness - 0.5) * 30; // Low agreeableness helps (willing to disrupt)
        score += (personality.neuroticism - 0.5) * 20;   // Some neuroticism (discontent)
        score -= socialContext.privilege * 20;           // Lower privilege more likely to revolt
    }

    // Conservative/traditional ideologies require low openness, high conscientiousness
    if (ideoId.includes('conservative') || ideoId.includes('traditional') || ideoId.includes('feudal')) {
        score -= (personality.openness - 0.5) * 40;           // Low openness helps
        score += (personality.conscientiousness - 0.5) * 30;  // High conscientiousness
        score += socialContext.privilege * 15;                // Higher privilege likes status quo
        score -= (personality.neuroticism - 0.5) * 15;        // Stable temperament
    }

    // Militarist ideologies require low agreeableness, some extraversion
    if (ideoId.includes('militarist') || ideoId.includes('warrior') || ideoId.includes('martial')) {
        score -= (personality.agreeableness - 0.5) * 35;    // Willingness to use force
        score += (personality.extraversion - 0.5) * 20;     // Boldness
        score += socialContext.ambition * 15;               // Ambitious
    }

    // Scholarly/intellectual ideologies require high openness and intelligence-related traits
    if (ideoId.includes('humanist') || ideoId.includes('enlightenment') || ideoId.includes('rationalist') || ideoId.includes('scholar')) {
        score += (personality.openness - 0.5) * 40;
        score += (personality.conscientiousness - 0.5) * 20;
        score -= (personality.neuroticism - 0.5) * 15;  // Calm, methodical
    }

    // Mystical/spiritual ideologies
    if (ideoId.includes('mystic') || ideoId.includes('sufi') || ideoId.includes('spiritual') || ideoId.includes('animism')) {
        score += (personality.openness - 0.5) * 35;
        score += socialContext.religiosity * 25;
        score += (personality.neuroticism - 0.5) * 15;  // Sensitivity to the unseen
    }

    // Religious orthodox ideologies
    if (ideoId.includes('orthodox') || ideoId.includes('catholic') || ideoId.includes('devout') || ideoId.includes('pious')) {
        score += socialContext.religiosity * 40;
        score += (personality.conscientiousness - 0.5) * 25;
        score -= (personality.openness - 0.5) * 20;  // Less questioning
    }

    // Mercantile/commercial ideologies
    if (ideoId.includes('mercant') || ideoId.includes('commercial') || ideoId.includes('capitalist') || ideoId.includes('entrepren')) {
        score += socialContext.entrepreneurial * 35;
        score += socialContext.ambition * 25;
        score -= (personality.agreeableness - 0.5) * 15;  // Competitive
    }

    // Egalitarian/democratic ideologies
    if (ideoId.includes('egalitarian') || ideoId.includes('democratic') || ideoId.includes('secular')) {
        score += (personality.agreeableness - 0.5) * 25;
        score += (personality.openness - 0.5) * 30;
        score -= socialContext.privilege * 15;  // Less privileged more drawn to equality
    }

    // Profession-ideology alignment
    if (profession) {
        const profLower = profession.toLowerCase();

        // Warriors/soldiers → militarist
        if ((profLower.includes('warrior') || profLower.includes('soldier') || profLower.includes('guard') || profLower.includes('knight')) &&
            (ideoId.includes('militarist') || ideoId.includes('warrior') || ideoId.includes('honor'))) {
            score += 30;
        }

        // Priests/monks → religious ideologies
        if ((profLower.includes('priest') || profLower.includes('monk') || profLower.includes('cleric') || profLower.includes('imam') || profLower.includes('rabbi')) &&
            (ideoId.includes('orthodox') || ideoId.includes('catholic') || ideoId.includes('devout') || ideoId.includes('pious') || ideoId.includes('mystic'))) {
            score += 35;
        }

        // Merchants → commercial ideologies
        if ((profLower.includes('merchant') || profLower.includes('trader') || profLower.includes('banker') || profLower.includes('shopkeeper')) &&
            (ideoId.includes('mercant') || ideoId.includes('commercial') || ideoId.includes('capitalist'))) {
            score += 30;
        }

        // Scholars → intellectual ideologies
        if ((profLower.includes('scholar') || profLower.includes('scribe') || profLower.includes('professor') || profLower.includes('philosopher')) &&
            (ideoId.includes('humanist') || ideoId.includes('enlightenment') || ideoId.includes('rationalist'))) {
            score += 30;
        }

        // Peasants/laborers → folk beliefs or egalitarian
        if ((profLower.includes('peasant') || profLower.includes('laborer') || profLower.includes('farmer') || profLower.includes('serf')) &&
            (ideoId.includes('folk') || ideoId.includes('egalitarian') || ideoId.includes('animism'))) {
            score += 20;
        }

        // Red Guard / Revolutionary professions → revolutionary ideologies
        if ((profLower.includes('red guard') || profLower.includes('revolutionary') || profLower.includes('agitator') || profLower.includes('partisan')) &&
            !ideoId.includes('conservative') && !ideoId.includes('traditional') && !ideoId.includes('feudal')) {
            score += 40;  // Strong bonus for non-traditional ideologies
        }
        if ((profLower.includes('red guard') || profLower.includes('revolutionary')) &&
            (ideoId.includes('conservative') || ideoId.includes('traditional'))) {
            score -= 100;  // Strong penalty - revolutionaries shouldn't be conservative!
        }
    }

    return score;
}

/**
 * Adjust personality traits to better fit the assigned profession.
 * This creates more coherent characters by nudging personality toward profession expectations.
 * The adjustment is subtle (up to 0.2 in either direction) to preserve some individual variation.
 */
export function adjustPersonalityForProfession(
    personality: CharacterPersonality,
    profession: string,
    stats: CharacterStats
): CharacterPersonality {
    const profLower = profession.toLowerCase();
    const adjusted = { ...personality };

    // Helper to nudge a trait toward a target value
    const nudge = (current: number, target: number, strength: number = 0.15): number => {
        const diff = target - current;
        return Math.max(0, Math.min(1, current + diff * strength));
    };

    // Scholars, philosophers, scientists - high openness, moderate conscientiousness
    if (profLower.includes('scholar') || profLower.includes('philosopher') || profLower.includes('scientist') ||
        profLower.includes('scribe') || profLower.includes('professor') || profLower.includes('librarian') ||
        profLower.includes('astronomer') || profLower.includes('alchemist')) {
        adjusted.openness = nudge(adjusted.openness, 0.8);
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.7);
        adjusted.extraversion = nudge(adjusted.extraversion, 0.35);  // Tend toward introversion
    }

    // Warriors, soldiers, guards - low agreeableness, moderate extraversion
    if (profLower.includes('warrior') || profLower.includes('soldier') || profLower.includes('guard') ||
        profLower.includes('knight') || profLower.includes('samurai') || profLower.includes('gladiator') ||
        profLower.includes('mercenary') || profLower.includes('legionnaire')) {
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.35);
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.65);
        adjusted.extraversion = nudge(adjusted.extraversion, 0.55);
        adjusted.neuroticism = nudge(adjusted.neuroticism, 0.35);  // Emotionally resilient
    }

    // Religious figures - high conscientiousness, moderate agreeableness, varies on openness
    if (profLower.includes('priest') || profLower.includes('monk') || profLower.includes('nun') ||
        profLower.includes('imam') || profLower.includes('rabbi') || profLower.includes('shaman') ||
        profLower.includes('cleric') || profLower.includes('bishop')) {
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.75);
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.6);
        adjusted.neuroticism = nudge(adjusted.neuroticism, 0.35);
    }

    // Merchants, traders, entrepreneurs - moderate extraversion, lower agreeableness (competitive)
    if (profLower.includes('merchant') || profLower.includes('trader') || profLower.includes('banker') ||
        profLower.includes('shopkeeper') || profLower.includes('vendor') || profLower.includes('peddler')) {
        adjusted.extraversion = nudge(adjusted.extraversion, 0.65);
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.45);
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.6);
    }

    // Artists, performers, entertainers - high openness, high extraversion
    if (profLower.includes('artist') || profLower.includes('painter') || profLower.includes('musician') ||
        profLower.includes('actor') || profLower.includes('bard') || profLower.includes('poet') ||
        profLower.includes('dancer') || profLower.includes('entertainer')) {
        adjusted.openness = nudge(adjusted.openness, 0.85);
        adjusted.extraversion = nudge(adjusted.extraversion, 0.7);
        adjusted.neuroticism = nudge(adjusted.neuroticism, 0.55);  // Artistic temperament
    }

    // Revolutionaries, agitators, radicals - high openness, low agreeableness, high neuroticism
    if (profLower.includes('revolutionary') || profLower.includes('red guard') || profLower.includes('agitator') ||
        profLower.includes('partisan') || profLower.includes('rebel') || profLower.includes('anarchist')) {
        adjusted.openness = nudge(adjusted.openness, 0.75);
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.3);
        adjusted.neuroticism = nudge(adjusted.neuroticism, 0.6);  // Driven by discontent
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.55);  // Committed to cause
    }

    // Servants, laborers - moderate conscientiousness, higher agreeableness
    if (profLower.includes('servant') || profLower.includes('maid') || profLower.includes('butler') ||
        profLower.includes('laborer') || profLower.includes('serf') || profLower.includes('slave')) {
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.6);
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.55);
        adjusted.extraversion = nudge(adjusted.extraversion, 0.4);
    }

    // Healers, doctors, apothecaries - high conscientiousness, high agreeableness
    if (profLower.includes('doctor') || profLower.includes('healer') || profLower.includes('physician') ||
        profLower.includes('apothecary') || profLower.includes('midwife') || profLower.includes('nurse')) {
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.75);
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.7);
        adjusted.openness = nudge(adjusted.openness, 0.6);
    }

    // Craftspeople - high conscientiousness, moderate introversion
    if (profLower.includes('blacksmith') || profLower.includes('carpenter') || profLower.includes('mason') ||
        profLower.includes('potter') || profLower.includes('weaver') || profLower.includes('tailor') ||
        profLower.includes('cobbler') || profLower.includes('jeweler') || profLower.includes('artisan')) {
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.7);
        adjusted.extraversion = nudge(adjusted.extraversion, 0.4);
    }

    // Politicians, diplomats, courtiers - high extraversion, varies on agreeableness
    if (profLower.includes('diplomat') || profLower.includes('courtier') || profLower.includes('politician') ||
        profLower.includes('ambassador') || profLower.includes('advisor') || profLower.includes('chancellor')) {
        adjusted.extraversion = nudge(adjusted.extraversion, 0.75);
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.65);
        // Political figures can be agreeable (consensus builders) or disagreeable (power seekers)
    }

    // Criminals, thieves - low agreeableness, low conscientiousness
    if (profLower.includes('thief') || profLower.includes('criminal') || profLower.includes('bandit') ||
        profLower.includes('pirate') || profLower.includes('smuggler') || profLower.includes('assassin')) {
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.25);
        adjusted.conscientiousness = nudge(adjusted.conscientiousness, 0.35);
        adjusted.neuroticism = nudge(adjusted.neuroticism, 0.5);
    }

    // Nobility, aristocrats - varies widely, but typically some arrogance (lower agreeableness)
    if (profLower.includes('noble') || profLower.includes('lord') || profLower.includes('lady') ||
        profLower.includes('duke') || profLower.includes('count') || profLower.includes('baron') ||
        profLower.includes('prince') || profLower.includes('princess')) {
        adjusted.agreeableness = nudge(adjusted.agreeableness, 0.4);
        adjusted.extraversion = nudge(adjusted.extraversion, 0.6);
    }

    return adjusted;
}

/**
 * Correlate D&D-style stats with Big 5 personality traits.
 * High intelligence should correlate with higher openness.
 * High charisma should correlate with higher extraversion.
 * High wisdom should correlate with lower neuroticism and higher conscientiousness.
 */
export function correlateStatsWithPersonality(
    stats: CharacterStats,
    personality: CharacterPersonality
): CharacterPersonality {
    const adjusted = { ...personality };

    // Normalize stats from 1-10 scale to influence factor (-0.15 to +0.15)
    const statInfluence = (stat: number): number => ((stat - 5.5) / 4.5) * 0.12;

    // Intelligence correlates with openness (intellectual curiosity)
    adjusted.openness = Math.max(0, Math.min(1, adjusted.openness + statInfluence(stats.intelligence)));

    // Charisma correlates with extraversion
    adjusted.extraversion = Math.max(0, Math.min(1, adjusted.extraversion + statInfluence(stats.charisma)));

    // Wisdom correlates negatively with neuroticism (emotional stability)
    adjusted.neuroticism = Math.max(0, Math.min(1, adjusted.neuroticism - statInfluence(stats.wisdom)));

    // Wisdom also correlates with conscientiousness (thoughtful, disciplined)
    adjusted.conscientiousness = Math.max(0, Math.min(1, adjusted.conscientiousness + statInfluence(stats.wisdom) * 0.5));

    // High strength + low charisma can lead to lower agreeableness (intimidating)
    if (stats.strength > 7 && stats.charisma < 5) {
        adjusted.agreeableness = Math.max(0, adjusted.agreeableness - 0.08);
    }

    // High perception correlates with openness (observant, detail-oriented)
    adjusted.openness = Math.max(0, Math.min(1, adjusted.openness + statInfluence(stats.perception) * 0.5));

    // Craftiness (cunning) slightly lowers agreeableness and raises openness
    if (stats.craftiness > 7) {
        adjusted.agreeableness = Math.max(0, adjusted.agreeableness - 0.05);
        adjusted.openness = Math.min(1, adjusted.openness + 0.05);
    }

    return adjusted;
}

/**
 * Validate character coherence and make final adjustments.
 * This catches remaining contradictions after all other generation steps.
 */
export function validateCharacterCoherence(
    character: {
        personality: CharacterPersonality,
        socialContext: CharacterSocialContext,
        stats: CharacterStats,
        ideology?: string,
        role?: string
    }
): { personality: CharacterPersonality, warnings: string[] } {
    const warnings: string[] = [];
    const adjusted = { ...character.personality };
    const role = character.role?.toLowerCase() || '';
    const ideology = character.ideology?.toLowerCase() || '';

    // Check for revolutionary with conservative ideology - strong contradiction
    if ((role.includes('revolutionary') || role.includes('red guard') || role.includes('agitator')) &&
        (ideology.includes('conservative') || ideology.includes('traditional'))) {
        warnings.push(`Revolutionary profession with conservative ideology - adjusting personality`);
        adjusted.openness = Math.max(adjusted.openness, 0.6);
        adjusted.agreeableness = Math.min(adjusted.agreeableness, 0.4);
    }

    // Check for withdrawn/introverted description potential with high extraversion
    // "Withdrawn" usually comes from low extraversion, so ensure consistency
    if (adjusted.extraversion > 0.75) {
        // High extraversion should not produce withdrawn descriptions
        // Personality is fine, just note for description generation
    }

    // High openness + very low intelligence is unusual - curious but unable to explore ideas
    if (adjusted.openness > 0.8 && character.stats.intelligence < 4) {
        adjusted.openness = Math.min(adjusted.openness, 0.65);
        warnings.push(`High openness with very low intelligence - moderating openness`);
    }

    // High conscientiousness + thief/criminal profession
    if ((role.includes('thief') || role.includes('criminal') || role.includes('bandit')) &&
        adjusted.conscientiousness > 0.7) {
        adjusted.conscientiousness = Math.min(adjusted.conscientiousness, 0.5);
        warnings.push(`Criminal profession with high conscientiousness - adjusting`);
    }

    // Noble with very low privilege in social context - unusual
    if ((role.includes('noble') || role.includes('lord') || role.includes('duke')) &&
        character.socialContext.privilege < 0.5) {
        warnings.push(`Noble role with low privilege - possible fallen aristocrat`);
        // Don't adjust - this could be an interesting character (impoverished noble)
    }

    // Religious figure with very low religiosity
    if ((role.includes('priest') || role.includes('monk') || role.includes('imam') || role.includes('rabbi')) &&
        character.socialContext.religiosity < 0.3) {
        warnings.push(`Religious profession with low religiosity - cynical cleric archetype`);
        // Keep it - this is a valid character type
    }

    // Scholar with very low openness
    if ((role.includes('scholar') || role.includes('professor') || role.includes('scientist')) &&
        adjusted.openness < 0.35) {
        adjusted.openness = Math.max(adjusted.openness, 0.5);
        warnings.push(`Scholar with very low openness - adjusting`);
    }

    return { personality: adjusted, warnings };
}

export function assignBeliefs(
    character: NpcEntity | PlayerCharacter,
    noise: ValueNoise
): { ideology: string, beliefs: { beliefId: string; conviction: number }[] } {
    const { culturalZone, era, religion, personality, socialContext } = character;
    const profession = (character as any).profession || (character as any).class;

    // 1. Find suitable ideologies by sanitizing IDEOLOGIES array first
    const suitableIdeologies = IDEOLOGIES.filter(Boolean).filter(ideo =>
        ideo.culturalZones.includes(culturalZone) &&
        ideo.eras.includes(era) &&
        ideo.religions.includes(religion)
    );

    // 2. Score each ideology by personality/social context fit
    let chosenIdeology: Ideology | undefined;

    if (suitableIdeologies.length > 0 && personality && socialContext) {
        // Score all ideologies
        const scoredIdeologies = suitableIdeologies.map(ideo => ({
            ideology: ideo,
            score: scoreIdeologyPersonalityFit(ideo, personality, socialContext, profession)
        }));

        // Sort by score (highest first)
        scoredIdeologies.sort((a, b) => b.score - a.score);

        // Use weighted random selection favoring higher scores
        // Top ideology has much higher chance, but not guaranteed (allows some variation)
        const totalWeight = scoredIdeologies.reduce((sum, item, index) => {
            // Exponential weighting: top items much more likely
            return sum + Math.max(1, 100 - index * 15 + item.score);
        }, 0);

        let randomValue = noise.random() * totalWeight;
        for (let i = 0; i < scoredIdeologies.length; i++) {
            const weight = Math.max(1, 100 - i * 15 + scoredIdeologies[i].score);
            randomValue -= weight;
            if (randomValue <= 0) {
                chosenIdeology = scoredIdeologies[i].ideology;
                break;
            }
        }

        // Fallback to top scorer if loop didn't select
        if (!chosenIdeology) {
            chosenIdeology = scoredIdeologies[0]?.ideology;
        }
    } else {
        // No personality data - random selection (legacy behavior)
        chosenIdeology = suitableIdeologies[Math.floor(noise.random() * suitableIdeologies.length)];
    }

    // 2. Graceful Fallback System
    if (!chosenIdeology) {
        let fallbackId = 'FOLK_BELIEFS_GENERIC';
        if (era === HistoricalEra.PREHISTORY) {
            fallbackId = 'PREHISTORIC_ANIMISM';
        } else if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
            fallbackId = 'MODERN_SECULARISM';
        }
        chosenIdeology = IDEOLOGIES.filter(Boolean).find(ideo => ideo.id === fallbackId);
    }
    
    // 3. Absolute Fallback to prevent crashes
    if (!chosenIdeology) {
        console.warn(`[NPC Utils] Beliefs Fallback Failed: Could not find any suitable ideology for era '${era}'. Returning default empty belief set.`);
        return { ideology: 'Pragmatism', beliefs: [{ beliefId: 'SURVIVAL_FIRST', conviction: 100 }] };
    }

    // 4. Assign personal beliefs
    const personalBeliefs: { beliefId: string; conviction: number }[] = [];
    const beliefIds = Object.keys(chosenIdeology.associatedBeliefs);

    let attempts = 0;
    const numBeliefsToAssign = 3 + Math.floor(noise.random() * 3); // 3-5 beliefs

    while (personalBeliefs.length < numBeliefsToAssign && attempts < 50) {
        attempts++;
        const randomBeliefId = beliefIds[Math.floor(noise.random() * beliefIds.length)];
        
        if (!randomBeliefId || personalBeliefs.some(b => b.beliefId === randomBeliefId)) {
            continue; // Skip if already assigned or invalid
        }
        
        const baseChance = chosenIdeology.associatedBeliefs[randomBeliefId];
        let modifier = 0;

        // Modify chance based on personality
        const beliefDef = PERSONAL_BELIEFS.find(b => b.id === randomBeliefId);
        if (beliefDef && personality && socialContext) {
            if (beliefDef.tags.includes('religious')) modifier += (socialContext.religiosity - 0.5) * 0.3;
            if (beliefDef.tags.includes('progressive')) modifier += (personality.openness - 0.5) * 0.3;
            if (beliefDef.tags.includes('traditional')) modifier -= (personality.openness - 0.5) * 0.3;
            if (beliefDef.tags.includes('ethical') && beliefDef.tags.includes('community')) modifier += (personality.agreeableness - 0.5) * 0.2;
        }

        if (noise.random() < baseChance + modifier) {
            // Conviction ranges from 20-100, with personality affecting the distribution
            // More conscientious and less open people tend to have stronger convictions
            let baseConviction = 20 + Math.floor(noise.random() * 81); // 20-100 range

            // Personality modifiers for conviction strength
            if (personality) {
                // High conscientiousness = stronger convictions
                baseConviction += Math.floor((personality.conscientiousness - 0.5) * 20);
                // High openness = more questioning, slightly lower conviction
                baseConviction -= Math.floor((personality.openness - 0.5) * 15);
                // High neuroticism = more doubt, lower conviction
                baseConviction -= Math.floor((personality.neuroticism - 0.5) * 15);
            }

            // Clamp to valid range
            const conviction = Math.max(20, Math.min(100, baseConviction));
            personalBeliefs.push({ beliefId: randomBeliefId, conviction });
        }
    }
    
    return {
        ideology: chosenIdeology.id,
        beliefs: personalBeliefs,
    };
}