/**
 * constants/characterData/workDress.ts
 *
 * What people wore FOR WORK.
 *
 * `clothing.ts` keys a wardrobe on cultural zone, era, wealth and gender —
 * four axes, none of them "what do you do all day". `generateCompleteOutfit`
 * has taken an `occupation` argument since it was written and consulted it in
 * exactly one place: a Central Asian regional override. Everything else
 * ignored it, so a carpenter and a bank clerk of the same wealth drew from an
 * identical pool, and a 1941 Californian carpenter came out in a black
 * business suit, a fedora and Oxford shoes. A 1943 railway worker came out in
 * a scarlet one.
 *
 * A per-profession table would be the wrong fix: `professions.ts` and
 * `textureProfessions.ts` already run to several hundred roles between them,
 * and the tail is designed to keep growing. Keying clothing to profession
 * name means every new profession is also a clothing change, forever, and the
 * failure mode for anything missed is silence. So: a small closed set of work
 * categories, and an ordered regex list mapping the existing profession
 * vocabulary onto them.
 *
 * This is a substitute INPUT to the existing filter pipeline, not a parallel
 * one. `generateCompleteOutfit` swaps in the work set for the garment,
 * headgear and footwear slots and then runs every region, contact, material-
 * era, thermal and culture-marker filter over it exactly as before, so no
 * correctness fix already in that function is bypassed. Belts and accessories
 * keep coming from the wealth table, which already strips jewels and gold
 * from working-class outfits.
 *
 * Wealth is not a key here. One entry per zone/era/category/gender is graded
 * at selection time through `adjustMaterialQuality` — a wealthy carpenter and
 * a poor one wear the same garment in better or worse cloth, which is what
 * actually varied.
 *
 * An occupation that matches no rule returns null and behaves exactly as it
 * did before this file existed, so nothing that renders correctly today can
 * regress through this path.
 */

import { HistoricalEra, CulturalZone, Gender } from '../../types';

interface ClothingPiece {
    name: string;
    material: string;
    adjectives?: string[];
}


export type WorkCategory =
    | 'field_labour'
    | 'heavy_outdoor_trade'
    | 'workshop_craft'
    | 'water_maritime'
    | 'extraction'
    | 'domestic_service'
    | 'retail_clerical'
    | 'professional_office'
    | 'religious'
    | 'armed';

const WORK_CATEGORY_RULES: { category: WorkCategory; test: RegExp }[] = [
    {
        // Carve-outs, first because the rules below would take them wrongly:
        // a civil servant is not domestic service, and a wet nurse is not a
        // medical professional. Both were mis-filed before this rule existed.
        category: 'professional_office',
        test: /\bcivil (servant|engineer)\b/i,
    },
    {
        category: 'domestic_service',
        test: /\b(wet nurse|nursemaid|nanny)\b/i,
    },
    {
        category: 'extraction',
        test: /\b(miner|coal miner|tin miner|quarry\w*|prospector|driller|collier|salt (worker|panner)|lime burner|peat cutter|gem digger)\b/i,
    },
    {
        category: 'water_maritime',
        test: /\b(fisher\w*|sailor|mariner|boatman|bargeman|ferryman|whaler|pearl diver|dock(er| worker)?|stevedore|longshoreman)\b/i,
    },
    {
        category: 'domestic_service',
        test: /\b(domestic (servant|worker)|servant|maid|valet|butler|dhobi|laundress|washerwoman|housekeeper|janitor|custodian|porter|care worker|stable hand|errand (boy|girl)|water carrier|night soil \w*|scullion|charwoman|sweeper|houseboy|cleaner)\b/i,
    },
    {
        category: 'heavy_outdoor_trade',
        test: /\b(carpenter|lumberjack|woodcutter|logger|construction \w*|railway \w*|railroad \w*|rickshaw puller|stonemason|bricklayer|roofer|road (builder|worker)|chimney sweep|cowboy|homesteader|sod buster|mountain man|truck driver|cab driver|taxi driver|stagecoach driver|postal worker|postman|warehouse worker|gas station attendant|charcoal burner|drayman|carter|carrier|navvy|ditcher|hedger|woodsman|well digger)\b/i,
    },
    {
        category: 'workshop_craft',
        test: /\b(blacksmith|\w*smith|weaver|potter|tailor|seamstress|cobbler|shoemaker|cooper|wheelwright|machinist|welder|mechanic|watchmaker|printer|tanner|dyer|factory worker|mill worker|textile worker|jute mill worker|assembly line worker|butcher|baker|cook|photographer|traditional crafter)\b/i,
    },
    {
        category: 'field_labour',
        test: /\b(farm(er)?|farm hand|field hand|tenant farmer|sharecropper|peasant|herder|shepherd|drover|forager|wood gatherer|picker|planter|harvest\w*|rice farmer|cotton picker|rubber tapper|abaca stripper|sugar worker|tea picker|reservation farmer|dairymaid|milkmaid|cowherd|goatherd|swineherd|ploughman|plowman|reaper|thresher|vine dresser|gardener|orchardist)\b/i,
    },
    {
        category: 'retail_clerical',
        test: /\b(clerk|shopkeeper|cashier|secretary|telephone operator|telegraph operator|salesman|street vendor|newsboy|streetcar conductor|trader)\b/i,
    },
    {
        category: 'professional_office',
        test: /\b(doctor|lawyer|engineer|teacher|schoolteacher|banker|judge|journalist|editor|translator|accountant|civil (servant|engineer)|architect|professor|surgeon|nurse|pharmacist|indian agent)\b/i,
    },
    {
        category: 'religious',
        test: /\b(priest|priestess|monk|nun|imam|rabbi|clergy|missionary|muezzin|friar)\b/i,
    },
    {
        category: 'armed',
        test: /\b(soldier|police (officer|constable)|guard|fireman|firefighter|militia|guerrilla fighter|militant|warrior|knight|samurai|ronin)\b/i,
    },
];

export function resolveWorkCategory(occupation?: string): WorkCategory | null {
    if (!occupation) return null;
    for (const rule of WORK_CATEGORY_RULES) {
        if (rule.test.test(occupation)) return rule.category;
    }
    return null;
}

type WorkGenderSet = {
    garments: ClothingPiece[];
    headgear: ClothingPiece[];
    footwear: ClothingPiece[];
};
type WorkGenderMap = Partial<Record<Gender, WorkGenderSet>>;
type WorkCategoryMap = Partial<Record<WorkCategory, WorkGenderMap>>;
type WorkEraMap = Partial<Record<HistoricalEra, WorkCategoryMap>>;
export type WorkDressData = Partial<Record<CulturalZone, WorkEraMap>>;

export const WORK_DRESS_DATA: WorkDressData = {

    /* ===================================================================== *
     *  EUROPEAN                                                            *
     * ===================================================================== */
    EUROPEAN: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Round Smock Frock', material: 'Heavy Linen', adjectives: ['Smocked'] },
                        { name: 'Fustian Trousers', material: 'Fustian (Cotton and Linen)' },
                    ],
                    headgear: [
                        { name: 'Straw Sunhat', material: 'Plaited Wheat Straw' },
                        { name: 'Neckerchief', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Hobnailed Field Boots', material: 'Thick Leather', adjectives: ['Hobnailed'] },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Linsey-Woolsey Gown', material: 'Linsey-Woolsey' },
                        { name: 'Bib Apron', material: 'Coarse Linen' },
                    ],
                    headgear: [
                        { name: 'Sunbonnet', material: 'Cotton', adjectives: ['Wide-brimmed'] },
                    ],
                    footwear: [
                        { name: 'Wooden Clogs', material: 'Alder Wood and Leather' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Moleskin Trousers', material: 'Moleskin Cotton' },
                        { name: 'Canvas Jacket', material: 'Duck Canvas' },
                        { name: "Navvy's Waistcoat", material: 'Corduroy' },
                    ],
                    headgear: [
                        { name: 'Flat Cap', material: 'Tweed', adjectives: ['Eight-panel'] },
                        { name: 'Wideawake Hat', material: 'Felt' },
                    ],
                    footwear: [
                        { name: 'Hobnailed Work Boots', material: 'Thick Leather', adjectives: ['Hobnailed'] },
                    ],
                },
                Female: {
                    // Brickfield and canal labour employed women too; the
                    // wardrobe is a bedgown/petticoat combination, not the
                    // trouser dress that would come later.
                    garments: [
                        { name: 'Bedgown and Petticoat', material: 'Wool and Linen' },
                        { name: 'Canvas Work Apron', material: 'Duck Canvas' },
                    ],
                    headgear: [
                        { name: 'Kerchief', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Wooden Clogs', material: 'Wood and Leather' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Leather Apron', material: 'Thick Hide', adjectives: ['Scorched'] },
                        { name: 'Collarless Shirt', material: 'Coarse Linen' },
                        { name: 'Serge Waistcoat', material: 'Wool Serge' },
                    ],
                    headgear: [
                        { name: 'Flat Cap', material: 'Wool Tweed' },
                    ],
                    footwear: [
                        { name: 'Leather Ankle Boots', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Work Dress', material: 'Cotton Print' },
                        { name: 'Canvas Apron', material: 'Canvas' },
                    ],
                    headgear: [
                        { name: 'Cotton Cap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Cloth Boots', material: 'Heavy Cotton and Leather' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Guernsey Sweater', material: 'Oiled Wool', adjectives: ['Tightly Knit'] },
                        { name: 'Oilskin Coat', material: 'Tarred Canvas' },
                        { name: 'Canvas Trousers', material: 'Sailcloth' },
                    ],
                    headgear: [
                        { name: "Sou'wester", material: 'Oiled Canvas' },
                        { name: 'Knit Watch Cap', material: 'Wool' },
                    ],
                    footwear: [
                        { name: 'Sea Boots', material: 'Tarred Leather' },
                    ],
                },
                Female: {
                    // Fishwives / net-menders, not deckhands.
                    garments: [
                        { name: 'Wool Gansey', material: 'Oiled Wool' },
                        { name: 'Canvas Apron', material: 'Tarred Canvas' },
                    ],
                    headgear: [
                        { name: 'Headscarf', material: 'Wool' },
                    ],
                    footwear: [
                        { name: 'Leather Clogs', material: 'Wood and Leather' },
                    ],
                },
            },
            extraction: {
                Male: {
                    // UNCERTAIN: pit dress varied enormously by coalfield and
                    // decade; British colliers at the face frequently worked
                    // stripped to the waist for heat, in flannel drawers only
                    // — this entry keeps a modest above-ground/going-to-the-
                    // pit depiction (shirt + trousers) rather than the bare-
                    // chested at-the-face reality, which is a defensible
                    // simplification but should be called out rather than
                    // presented as the only truth.
                    garments: [
                        { name: 'Flannel Shirt', material: 'Undyed Flannel' },
                        { name: 'Moleskin Trousers', material: 'Moleskin' },
                    ],
                    headgear: [
                        { name: 'Pit Cap', material: 'Cotton', adjectives: ['Candle-holder'] },
                    ],
                    footwear: [
                        { name: 'Hobnailed Pit Boots', material: 'Thick Leather', adjectives: ['Hobnailed'] },
                    ],
                },
            },
            domestic_service: {
                Male: {
                    garments: [
                        { name: 'Livery Coat', material: 'Wool', adjectives: ['Buttoned'] },
                        { name: 'Striped Waistcoat', material: 'Striped Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Black Leather Shoes', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: "Maid's Uniform Dress", material: 'Black Stuff Wool' },
                        { name: 'White Apron and Cap', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'White Cotton Cap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Black Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'Black Alpaca Jacket', material: 'Alpaca Wool' },
                        { name: 'Detachable-Collar Shirt', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Bowler Hat', material: 'Felt' },
                    ],
                    footwear: [
                        { name: 'Oxford Shoes', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Shirtwaist Blouse and Skirt', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Button Boots', material: 'Leather' },
                    ],
                },
            },
            // professional_office: deliberately no entry. The existing
            // common/wealthy INDUSTRIAL_ERA EUROPEAN table (Frock Coat,
            // Morning Coat, Day Dress, Oxford/Dress Boots — clothing.ts:890-
            // 939) is already the correct wardrobe for this category.
            religious: {
                // UNCERTAIN: Anglican/Catholic/Nonconformist clergy dress
                // diverges sharply, and this is only the plainest common
                // denominator (a parish priest's everyday dress, not
                // vestments for a service). Treat as a placeholder pending a
                // denomination-aware pass.
                Male: {
                    garments: [
                        { name: 'Black Cassock', material: 'Wool' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Black Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            armed: {
                // UNCERTAIN: uniform dress is properly keyed to institution,
                // rank and decade, not to "occupation category" — this is
                // one generic constable-on-the-beat entry, not a uniform
                // system.
                Male: {
                    garments: [
                        { name: 'Blue Serge Tunic', material: 'Wool Serge', adjectives: ['Brass-buttoned'] },
                    ],
                    headgear: [
                        { name: 'Custodian Helmet', material: 'Cork and Felt' },
                    ],
                    footwear: [
                        { name: 'Black Leather Boots', material: 'Leather' },
                    ],
                },
            },
        },

        [HistoricalEra.MODERN_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Bib-and-Brace Overalls', material: 'Cotton Drill' },
                        { name: 'Collarless Work Shirt', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Flat Cap', material: 'Tweed' },
                    ],
                    footwear: [
                        // Rubber vulcanised c.1839, moulded Wellington boots
                        // in production by the 1850s — safely modern-era.
                        { name: 'Rubber Wellington Boots', material: 'Vulcanised Rubber' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Housedress', material: 'Cotton' },
                        { name: 'Canvas Apron', material: 'Canvas' },
                    ],
                    headgear: [
                        { name: 'Headscarf', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Rubber Galoshes', material: 'Rubber' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Denim Bib Overalls', material: 'Blue Denim', adjectives: ['Riveted'] },
                        { name: 'Flannel Work Shirt', material: 'Wool Flannel' },
                        { name: 'Cotton Twill Work Jacket', material: 'Cotton Twill' },
                    ],
                    headgear: [
                        { name: 'Flat Cap', material: 'Wool Tweed' },
                        { name: 'Canvas Work Cap', material: 'Cotton Duck' },
                    ],
                    footwear: [
                        { name: 'Leather Work Boots', material: 'Thick Leather', adjectives: ['Lace-up'] },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Denim Coveralls', material: 'Denim' },
                        { name: 'Cotton Headscarf', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Bandana', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Leather Work Boots', material: 'Leather' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Canvas Shop Coat', material: 'Cotton Duck' },
                        { name: 'Cotton Coveralls', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Work Shoes', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Overall Smock', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Hairnet', material: 'Cotton Mesh' },
                    ],
                    footwear: [
                        { name: 'Flat Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Oilskin Jacket', material: 'Oiled Cotton' },
                        { name: 'Guernsey Sweater', material: 'Wool' },
                    ],
                    headgear: [
                        { name: 'Wool Watch Cap', material: 'Wool' },
                    ],
                    footwear: [
                        { name: 'Rubber Sea Boots', material: 'Rubber' },
                    ],
                },
            },
            extraction: {
                Male: {
                    garments: [
                        { name: 'Cotton Boiler Suit', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        // "Hard Boiled Hat" (E.D. Bullard Co.) from 1919 —
                        // valid for modern-era, not industrial-era.
                        { name: 'Miner’s Safety Helmet', material: 'Hardened Fibre', adjectives: ['Lamp-bracket'] },
                    ],
                    footwear: [
                        { name: 'Rubber Work Boots', material: 'Rubber' },
                    ],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: "Maid's Print Dress", material: 'Cotton Print' },
                        { name: 'Apron and Cap', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'White Cotton Cap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Flat Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'White Cotton Shop Coat', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Shoes', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        // Viscose rayon ("artificial silk") commercial from
                        // the 1900s-10s, a genuinely period-correct cheap
                        // fabric for interwar and postwar clerical wear.
                        { name: 'Rayon Blouse and Skirt', material: 'Rayon' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Pumps', material: 'Leather' },
                    ],
                },
            },
            // professional_office: no entry — see INDUSTRIAL_ERA note above;
            // the same reasoning holds for the modern-era Business Suit /
            // Day Dress tier.
            armed: {
                // UNCERTAIN: spans 1900-2019, during which uniform dress
                // changed completely several times over (WWI, WWII, postwar
                // policing). One deliberately generic mid-century entry.
                Male: {
                    garments: [
                        { name: 'Khaki Service Uniform', material: 'Cotton Twill' },
                    ],
                    headgear: [
                        { name: 'Peaked Service Cap', material: 'Wool and Leather' },
                    ],
                    footwear: [
                        { name: 'Leather Combat Boots', material: 'Leather' },
                    ],
                },
            },
        },
    },

    /* ===================================================================== *
     *  NORTH AMERICAN COLONIAL                                             *
     *  Today this zone has NO clothing table of its own for these eras —   *
     *  `generateClothingPalette` (npcUtils.ts:748-752) explicitly remaps   *
     *  it onto EUROPEAN for INDUSTRIAL_ERA/MODERN_ERA. That is exactly     *
     *  backwards for work dress specifically: American work clothing       *
     *  diverged hard from British in this period (riveted denim from      *
     *  1873 San Francisco; chambray; cowboy gear), and the evidence file's *
     *  own example — 1941 California — is precisely this zone. These      *
     *  entries are written to stand on their own rather than inherit      *
     *  EUROPEAN's.                                                        *
     * ===================================================================== */
    NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Homespun Shirt', material: 'Linsey-Woolsey' },
                        { name: 'Broadfall Trousers', material: 'Osnaburg Cotton' },
                    ],
                    headgear: [
                        { name: 'Straw Field Hat', material: 'Plaited Straw' },
                    ],
                    footwear: [
                        { name: 'Brogans', material: 'Rough-out Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Calico Work Dress', material: 'Printed Calico' },
                        { name: 'Bib Apron', material: 'Osnaburg Cotton' },
                    ],
                    headgear: [
                        { name: 'Poke Bonnet', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Simple Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Duck Canvas Jumper', material: 'Cotton Duck' },
                        { name: "Carpenter's Overalls", material: 'Brown Duck Canvas', adjectives: ['Hammer-loop'] },
                        { name: 'Flannel Shirt', material: 'Wool Flannel' },
                    ],
                    headgear: [
                        { name: 'Slouch Hat', material: 'Felt' },
                    ],
                    footwear: [
                        { name: 'Lace-up Work Boots', material: 'Oil-tanned Leather' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Leather Apron', material: 'Cowhide' },
                        { name: 'Collarless Work Shirt', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Boots', material: 'Leather' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Oilskin Slicker', material: 'Oiled Canvas' },
                        { name: 'Wool Guernsey', material: 'Wool' },
                    ],
                    headgear: [
                        { name: 'Sou’wester', material: 'Oiled Canvas' },
                    ],
                    footwear: [
                        { name: 'Sea Boots', material: 'Tarred Leather' },
                    ],
                },
            },
            extraction: {
                Male: {
                    garments: [
                        { name: "Miner's Canvas Coat", material: 'Duck Canvas' },
                        { name: 'Wool Union Suit', material: 'Wool Knit' },
                    ],
                    headgear: [
                        { name: 'Carbide Lamp Cap', material: 'Leather and Brass' },
                    ],
                    footwear: [
                        { name: 'Lace-up Boots', material: 'Leather' },
                    ],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: "Servant's Calico Dress", material: 'Calico' },
                        { name: 'White Apron', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Mob Cap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Simple Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'Sack Coat', material: 'Wool' },
                        { name: 'Shirt with Sleeve Garters', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Bowler Hat', material: 'Felt' },
                    ],
                    footwear: [
                        { name: 'Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            // professional_office: no entry, as EUROPEAN above.
        },
        [HistoricalEra.MODERN_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Bib Overalls', material: 'Blue Denim' },
                        { name: 'Chambray Work Shirt', material: 'Cotton Chambray' },
                    ],
                    headgear: [
                        { name: 'Straw Field Hat', material: 'Straw' },
                    ],
                    footwear: [
                        { name: 'Leather Work Boots', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Housedress', material: 'Cotton' },
                        { name: 'Feed-sack Apron', material: 'Printed Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Sunbonnet', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Canvas Shoes', material: 'Canvas' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                // This is the entry the evidence file's "1941 California,
                // Carpenter" case belongs in. The user's own suggested fix
                // — "plaid nylon work shirt, blue jeans, brown leather
                // boots" — is right in silhouette and one word off in
                // material: nylon existed by 1941 (DuPont, 1938) but nearly
                // all of it was diverted to military use (parachutes, rope,
                // tents) from before Pearl Harbor onward, and nylon SHIRTING
                // fabric specifically is a late-1940s/1950s product, not a
                // 1941 one. Corrected here to cotton-wool flannel, which is
                // what a plaid work shirt was actually made of in 1941.
                // Everything else in the example is exactly right — and the
                // California/denim pairing is apt: Levi Strauss & Co. had
                // been making riveted denim in San Francisco since 1873.
                Male: {
                    garments: [
                        { name: 'Plaid Flannel Work Shirt', material: 'Cotton-Wool Flannel' },
                        { name: 'Blue Denim Jeans', material: 'Blue Denim', adjectives: ['Riveted'] },
                        { name: 'Duck Canvas Work Jacket', material: 'Cotton Duck' },
                    ],
                    headgear: [
                        { name: 'Denim Engineer Cap', material: 'Denim' },
                        { name: 'Felt Slouch Hat', material: 'Felt' },
                    ],
                    footwear: [
                        { name: 'Brown Leather Work Boots', material: 'Leather', adjectives: ['Lace-up'] },
                    ],
                },
                Female: {
                    // 1941-45 also covers the "Rosie the Riveter" homefront
                    // years, when women entered heavy trades in numbers —
                    // worth keeping distinct from the field_labour housedress.
                    garments: [
                        { name: 'Denim Coveralls', material: 'Denim' },
                        { name: 'Cotton Bandana Headwrap', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Bandana', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Leather Work Boots', material: 'Leather' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Coveralls', material: 'Cotton Twill' },
                        { name: 'Canvas Shop Apron', material: 'Canvas' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Work Shoes', material: 'Leather' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Oilskin Jacket', material: 'Oiled Cotton' },
                    ],
                    headgear: [
                        { name: 'Wool Watch Cap', material: 'Wool' },
                    ],
                    footwear: [
                        { name: 'Rubber Boots', material: 'Rubber' },
                    ],
                },
            },
            extraction: {
                Male: {
                    garments: [
                        { name: 'Canvas Boiler Suit', material: 'Cotton Duck' },
                    ],
                    headgear: [
                        { name: 'Hard Hat', material: 'Vulcanised Fibre', adjectives: ['Carbide Lamp'] },
                    ],
                    footwear: [
                        { name: 'Steel-toe Work Boots', material: 'Leather and Steel' },
                    ],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Cotton Housedress and Apron', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Flat Leather Shoes', material: 'Leather' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'Cotton Shop Coat', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Shoes', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Rayon Shirtwaist Dress', material: 'Rayon' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Pumps', material: 'Leather' },
                    ],
                },
            },
            // professional_office: no entry.
        },
    },

    /* ===================================================================== *
     *  EAST ASIAN                                                          *
     *  Note: the existing table has no dedicated INDUSTRIAL_ERA block for  *
     *  this zone (clothing.ts jumps RENAISSANCE_EARLY_MODERN -> MODERN_ERA *
     *  directly, ERA_PROGRESSION falls INDUSTRIAL_ERA back onto           *
     *  RENAISSANCE_EARLY_MODERN). That silk-court-dress fallback is        *
     *  exactly how a woodcutter or tenant farmer ends up in a "Silk Robe"  *
     *  at "comfortable" wealth (see the 1895 Korea and 1899 South China    *
     *  cases in the evidence file) — the fallback chain hands a manual    *
     *  labourer a gentry wardrobe because nothing else exists for the era. *
     *  This proposal writes an explicit INDUSTRIAL_ERA entry so           *
     *  labour-category personas stop inheriting it.                       *
     * ===================================================================== */
    EAST_ASIAN: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Short Hemp Jacket', material: 'Rough Hemp' },
                        { name: 'Cropped Trousers', material: 'Undyed Cotton' },
                    ],
                    headgear: [
                        { name: 'Conical Bamboo Hat', material: 'Woven Bamboo and Palm Leaf' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Rice Straw' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Short Cotton Jacket', material: 'Homespun Cotton' },
                        { name: 'Wrap Skirt', material: 'Homespun Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Headscarf', material: 'Plain Cotton' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Rice Straw' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Work Jacket', material: 'Indigo-dyed Cotton' },
                        { name: 'Loose Cotton Trousers', material: 'Undyed Cotton' },
                    ],
                    headgear: [
                        { name: 'Straw Rain Cape and Hat', material: 'Rice Straw' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Woven Straw' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Work Jacket', material: 'Hemp' },
                        { name: 'Cotton Apron', material: 'Coarse Cotton' },
                    ],
                    headgear: [
                        { name: 'Cloth Headband', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Straw' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Jacket', material: 'Indigo-dyed Cotton' },
                        { name: 'Work Apron', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cloth Headband', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Cloth Shoes', material: 'Cotton' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    // UNCERTAIN: persimmon-tannin waterproofing (kakishibu)
                    // for fishermen's cotton is well attested for Japan; less
                    // certain how far this generalises to Chinese/Korean
                    // fishing dress in the same period, which may have relied
                    // more on plain oiled cotton or hide. Kept as the primary
                    // entry with the caveat here rather than presenting it as
                    // pan-East-Asian fact.
                    garments: [
                        { name: 'Persimmon-dyed Cotton Jacket', material: 'Kakishibu-treated Cotton' },
                        { name: 'Cotton Fisherman’s Trousers', material: 'Undyed Cotton' },
                    ],
                    headgear: [
                        { name: 'Conical Straw Hat', material: 'Woven Straw' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            extraction: {
                // UNCERTAIN: industrial-scale coal mining in this period
                // (e.g. Kaiping in China from 1878, Miike/Yubari in Japan
                // from the 1870s-80s) is real but its everyday dress is not
                // something this pass can specify with confidence beyond
                // "plain undyed cotton work clothes" — kept deliberately
                // minimal rather than invented in detail.
                Male: {
                    garments: [
                        { name: 'Rough Cotton Jacket', material: 'Undyed Cotton' },
                    ],
                    headgear: [
                        { name: 'Cloth Head Wrap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Straw' },
                    ],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: "Servant's Plain Cotton Dress", material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cloth Headband', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Cloth Shoes', material: 'Cotton' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    // A plain, everyday changshan-style robe — deliberately
                    // distinct from the silk merchant/gentry version already
                    // in the wealth-keyed tables.
                    garments: [
                        { name: 'Plain Cotton Changshan', material: 'Cotton', adjectives: ['Everyday'] },
                    ],
                    headgear: [
                        { name: 'Cloth Cap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Cloth Shoes', material: 'Cotton' },
                    ],
                },
            },
            // professional_office: no entry — the existing "Western Suit /
            // Changshan" common-and-wealthy tier already fits scholars,
            // officials and merchants.
        },
        [HistoricalEra.MODERN_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Indigo Cotton' },
                        { name: 'Loose Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Straw Rain Hat', material: 'Straw' },
                    ],
                    footwear: [
                        { name: 'Rubber-soled Cloth Shoes', material: 'Canvas and Rubber' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Tunic and Trousers', material: 'Indigo Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Headscarf', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Cloth Shoes', material: 'Cotton' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Cotton Twill' },
                        { name: 'Canvas Trousers', material: 'Canvas' },
                    ],
                    headgear: [
                        { name: 'Cotton Work Cap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Rubber Work Shoes', material: 'Rubber and Canvas' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Coveralls', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Canvas Shoes', material: 'Canvas' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Factory Smock', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Headscarf', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Canvas Shoes', material: 'Canvas' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Oiled Canvas Jacket', material: 'Oiled Canvas' },
                        { name: 'Rubber Apron', material: 'Rubber' },
                    ],
                    headgear: [
                        { name: 'Straw Hat', material: 'Straw' },
                    ],
                    footwear: [
                        { name: 'Rubber Boots', material: 'Rubber' },
                    ],
                },
            },
            extraction: {
                Male: {
                    garments: [
                        { name: 'Cotton Boiler Suit', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        { name: 'Hard Hat', material: 'Hardened Fibre' },
                    ],
                    footwear: [
                        { name: 'Rubber Work Boots', material: 'Rubber' },
                    ],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Cotton Work Dress', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Cloth Shoes', material: 'Cotton' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'White Cotton Shirt', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Cloth Shoes', material: 'Cotton' },
                    ],
                },
            },
            // professional_office: no entry.
        },
    },

    /* ===================================================================== *
     *  SOUTH ASIAN                                                         *
     * ===================================================================== */
    SOUTH_ASIAN: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            field_labour: {
                Male: {
                    // UNCERTAIN: agricultural field labour very often went
                    // bare-chested with just a dhoti/lungi and a gamcha
                    // (thin cotton towel) over the shoulder, especially in
                    // hot lowland regions — that is probably the more
                    // common reality. Kept to a modestly-dressed default
                    // (dhoti + vest) rather than assume how much bare-chest
                    // depiction the generator wants; flagging the choice
                    // rather than making it silently.
                    garments: [
                        { name: 'Cotton Dhoti', material: 'Coarse Cotton' },
                        { name: 'Cotton Vest', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Gamcha (worn as headwrap)', material: 'Cotton Towelling' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Sari, Field-tucked', material: 'Coarse Cotton', adjectives: ['Kaccha-style'] },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Checked Cotton Lungi', material: 'Checked Cotton' },
                        { name: 'Cotton Banian Vest', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Head Cloth', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Dhoti', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Cotton Lungi', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Palm-leaf Hat', material: 'Woven Palm Leaf' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            extraction: {
                // UNCERTAIN: colonial-era Indian coal (e.g. Raniganj,
                // Jharia) and mica mining are real but I don't have
                // confident specifics on everyday dress beyond "minimal
                // plain cotton" — kept intentionally thin.
                Male: {
                    garments: [
                        { name: 'Cotton Loincloth', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cloth Head Wrap', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            domestic_service: {
                Male: {
                    // Dhobi (washerman) specifically.
                    garments: [
                        { name: 'Cotton Dhoti, Tucked Up', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Plain Cotton Sari', material: 'Coarse Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'Cotton Kurta', material: 'Cotton' },
                        { name: 'Cotton Dhoti', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Topi', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Leather Sandals', material: 'Leather' },
                    ],
                },
            },
            // professional_office: no entry — the existing three-piece-suit
            // / silk-kurta wealthy tier is already correct here.
        },
        [HistoricalEra.MODERN_ERA]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Checked Cotton Lungi', material: 'Checked Cotton' },
                        { name: 'Cotton Banian Vest', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Rubber Chappals', material: 'Rubber' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Sari, Everyday', material: 'Cotton', adjectives: ['Field-tucked'] },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Rubber Chappals', material: 'Rubber' },
                    ],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Cotton Drill Trousers', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Rubber Sandals', material: 'Rubber' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Coveralls', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Rubber Sandals', material: 'Rubber' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Cotton Lungi', material: 'Cotton' },
                        { name: 'Cotton Vest', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
            },
            extraction: {
                Male: {
                    garments: [
                        { name: 'Cotton Boiler Suit', material: 'Cotton Drill' },
                    ],
                    headgear: [
                        // Plastic (polycarbonate/ABS) hard hats standard
                        // from roughly the 1960s onward; earlier decades of
                        // the modern era should draw the fibre version.
                        { name: 'Hard Hat', material: 'Plastic' },
                    ],
                    footwear: [
                        { name: 'Rubber Work Boots', material: 'Rubber' },
                    ],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Plain Cotton Sari, Everyday', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Rubber Chappals', material: 'Rubber' },
                    ],
                },
            },
            retail_clerical: {
                Male: {
                    garments: [
                        { name: 'Cotton Shirt', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'None', material: 'None' },
                    ],
                    footwear: [
                        { name: 'Leather Sandals', material: 'Leather' },
                    ],
                },
            },
            // professional_office: no entry.
        },
    },
};

export const WORK_DRESS_DATA_PREINDUSTRIAL: WorkDressData = {
    EUROPEAN: {
        [HistoricalEra.MEDIEVAL]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Undyed Wool' },
                        { name: 'Braies', material: 'Coarse Linen' },
                    ],
                    headgear: [
                        { name: 'Coif', material: 'Linen' },
                        { name: 'Straw Hat', material: 'Plaited Straw' },
                    ],
                    footwear: [
                        { name: 'Turnshoes', material: 'Rough Leather' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Wool Kirtle', material: 'Undyed Wool' },
                        { name: 'Linen Apron', material: 'Coarse Linen' },
                    ],
                    headgear: [
                        { name: 'Linen Veil', material: 'Linen' },
                    ],
                    footwear: [
                        { name: 'Turnshoes', material: 'Rough Leather' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Leather Apron', material: 'Thick Hide' },
                        { name: 'Wool Tunic', material: 'Wool' },
                    ],
                    headgear: [
                        { name: 'Coif', material: 'Linen' },
                    ],
                    footwear: [
                        { name: 'Leather Boots', material: 'Leather' },
                    ],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Oiled Wool Cloak', material: 'Oiled Wool' },
                        { name: 'Wool Tunic', material: 'Wool' },
                    ],
                    headgear: [
                        { name: 'Wool Cap', material: 'Wool' },
                    ],
                    footwear: [
                        { name: 'Leather Boots, Greased', material: 'Greased Leather' },
                    ],
                },
            },
            // professional_office / retail_clerical / domestic_service /
            // extraction / religious / armed intentionally omitted here —
            // outside this sample's depth budget.
        },
    },
    EAST_ASIAN: {
        [HistoricalEra.MEDIEVAL]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Short Hemp Jacket', material: 'Hemp' },
                        { name: 'Cropped Trousers', material: 'Undyed Cotton' },
                    ],
                    headgear: [
                        { name: 'Conical Straw Hat', material: 'Woven Straw' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Rice Straw' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Short Cotton Jacket and Wrap Skirt', material: 'Homespun Cotton' },
                    ],
                    headgear: [
                        { name: 'Cotton Headscarf', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Rice Straw' },
                    ],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Hemp Work Jacket', material: 'Hemp' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Cloth Headband', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Straw' },
                    ],
                },
            },
            // UNCERTAIN: water_maritime for medieval East Asia is left out
            // rather than guessed — the industrial-era Japan-specific
            // kakishibu detail above does not obviously generalise five
            // centuries earlier, and I'd rather leave a gap than backdate it
            // without evidence.
        },
    },
};

/**
 * `professional_office`.
 *
 * The original proposal left this category deliberately empty on the grounds
 * that the wealth table already dresses a doctor or a banker correctly. It
 * does not. Measured over 900 generated personas: a 1985 judge in a White
 * Polo Shirt, a 1291 judge in Fringed Leggings, a 2007 university professor
 * in a Cochineal Designer Sherwani. The wealth table dresses someone of that
 * *income* correctly; it has no idea they hold an office that has its own
 * dress. Filled here for the eras where a professional uniform genuinely
 * existed — before roughly 1800 "professional dress" is robe-of-office and
 * varies by institution rather than by trade, so those eras are left to the
 * wealth table on purpose.
 */
export const WORK_DRESS_OFFICE: WorkDressData = {
    EUROPEAN: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Frock Coat and Waistcoat', material: 'Broadcloth' },
                        { name: 'Morning Coat and Striped Trousers', material: 'Worsted Wool' },
                        { name: 'Black Tailcoat and High Collar', material: 'Superfine Wool' },
                    ],
                    headgear: [
                        { name: 'Silk Top Hat', material: 'Silk Plush' },
                        { name: 'Bowler Hat', material: 'Felted Wool' },
                    ],
                    footwear: [{ name: 'Buttoned Leather Boots', material: 'Calfskin' }],
                },
                Female: {
                    garments: [
                        { name: 'Tailored Walking Suit', material: 'Worsted Wool' },
                        { name: 'High-Necked Blouse and Skirt', material: 'Cotton Lawn and Serge' },
                    ],
                    headgear: [{ name: 'Trimmed Straw Hat', material: 'Straw and Ribbon' }],
                    footwear: [{ name: 'Buttoned Leather Boots', material: 'Kid Leather' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Two-Piece Lounge Suit', material: 'Worsted Wool' },
                        { name: 'Sports Jacket and Flannel Trousers', material: 'Tweed and Flannel' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Oxfords', material: 'Polished Calfskin' }],
                },
                Female: {
                    garments: [
                        { name: 'Skirt Suit and Blouse', material: 'Worsted Wool' },
                        { name: 'Day Dress and Cardigan', material: 'Wool Jersey' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Low-Heeled Court Shoes', material: 'Leather' }],
                },
            },
        },
    },
    NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Sack Coat and Waistcoat', material: 'Broadcloth' },
                        { name: 'Frock Coat and Trousers', material: 'Worsted Wool' },
                    ],
                    headgear: [{ name: 'Derby Hat', material: 'Felted Wool' }],
                    footwear: [{ name: 'Buttoned Leather Shoes', material: 'Calfskin' }],
                },
                Female: {
                    garments: [{ name: 'Shirtwaist and Gored Skirt', material: 'Cotton Lawn and Serge' }],
                    headgear: [{ name: 'Trimmed Straw Hat', material: 'Straw and Ribbon' }],
                    footwear: [{ name: 'Buttoned Leather Boots', material: 'Kid Leather' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Single-Breasted Business Suit', material: 'Worsted Wool' },
                        { name: 'Blazer and Chino Trousers', material: 'Wool and Cotton Twill' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Oxfords', material: 'Polished Calfskin' }],
                },
                Female: {
                    garments: [
                        { name: 'Skirt Suit and Blouse', material: 'Worsted Wool' },
                        { name: 'Shift Dress and Jacket', material: 'Wool Crepe' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Low-Heeled Court Shoes', material: 'Leather' }],
                },
            },
        },
    },
    EAST_ASIAN: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Changshan Scholar Gown', material: 'Plain Silk' },
                        { name: 'Western Suit and Collared Shirt', material: 'Worsted Wool' },
                    ],
                    headgear: [{ name: 'Skullcap', material: 'Silk' }],
                    footwear: [{ name: 'Cloth Court Shoes', material: 'Silk and Felt' }],
                },
                Female: {
                    garments: [{ name: 'Aoqun Jacket and Skirt', material: 'Plain Silk' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Embroidered Cloth Shoes', material: 'Silk' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Business Suit and Tie', material: 'Worsted Wool' },
                        { name: 'Zhongshan Tunic Suit', material: 'Wool Gabardine' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Oxfords', material: 'Polished Leather' }],
                },
                Female: {
                    garments: [
                        { name: 'Skirt Suit and Blouse', material: 'Worsted Wool' },
                        { name: 'Qipao and Tailored Jacket', material: 'Patterned Silk' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Low-Heeled Court Shoes', material: 'Leather' }],
                },
            },
        },
    },
    SOUTH_ASIAN: {
        [HistoricalEra.INDUSTRIAL_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Achkan and Churidar', material: 'Fine Cotton' },
                        { name: 'Western Coat over Dhoti', material: 'Wool and Fine Cotton' },
                    ],
                    headgear: [{ name: 'Gandhi Cap', material: 'Khadi Cotton' }],
                    footwear: [{ name: 'Leather Jutti', material: 'Tooled Leather' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Sari and Blouse', material: 'Fine Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Tooled Leather' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            professional_office: {
                Male: {
                    garments: [
                        { name: 'Bush Shirt and Trousers', material: 'Cotton Drill' },
                        { name: 'Business Suit and Tie', material: 'Tropical Worsted' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Oxfords', material: 'Polished Leather' }],
                },
                Female: {
                    garments: [
                        { name: 'Silk Sari and Blouse', material: 'Printed Silk' },
                        { name: 'Salwar Kameez', material: 'Fine Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Tooled Leather' }],
                },
            },
        },
    },
};


export const WORK_DRESS_PREINDUSTRIAL_EXTENDED: WorkDressData = {

    /* ===================================================================== *
     *  MENA                                                                *
     *  Egypt (linen-centric) and Mesopotamia (wool-centric) are collapsed  *
     *  into one zone here, as the live table already does elsewhere. Where *
     *  the two traditions diverge sharply this picks the better-documented *
     *  option (usually Egyptian linen) and notes the Mesopotamian wool     *
     *  alternative in a comment rather than trying to carry both.         *
     * ===================================================================== */
    MENA: {
        [HistoricalEra.PREHISTORY]: {
            // UNCERTAIN: Levantine Neolithic (Natufian/PPNA-PPNB, roughly
            // 9000-3000 BCE). Flax is the earliest attested domesticated
            // fibre here (woven linen fragments at Nahal Hemar, ~6500 BCE);
            // wool-bearing sheep breeds are a later (~3000 BCE) development,
            // so hide fills the role wool takes on later.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Woven Flax Wrap', material: 'Coarse Flax Fibre' },
                        { name: 'Hide Loincloth', material: 'Tanned Goat Hide' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Flax Wrap Dress', material: 'Coarse Flax Fibre' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // The 34-gap zone/era. Farmer, Herder, Weaver, Carpenter, Porter
            // (unfixable — see header) all sampled here.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Linen Kilt (Schenti)', material: 'Plain Linen' },
                        { name: 'Coarse Wool Cloak', material: 'Undyed Wool', adjectives: ['Shoulder-wrapped'] },
                    ],
                    headgear: [{ name: 'Linen Head-cloth', material: 'Linen' }],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                        { name: 'Woven Reed Sandals', material: 'Papyrus Reed' },
                    ],
                },
                Female: {
                    garments: [{ name: 'Linen Sheath Dress (Kalasiris)', material: 'Plain Linen' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                // Weaver, potter, smith.
                Male: {
                    garments: [
                        { name: 'Linen Kilt', material: 'Plain Linen' },
                        { name: 'Leather Apron', material: 'Tanned Hide', adjectives: ['Scorched'] },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    // Textile production was heavily women's work in
                    // household workshops.
                    garments: [
                        { name: 'Linen Wrap Dress', material: 'Plain Linen' },
                        { name: 'Linen Apron', material: 'Coarse Linen' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            heavy_outdoor_trade: {
                // Carpenter, mason.
                Male: {
                    garments: [
                        { name: 'Linen Kilt', material: 'Plain Linen' },
                        { name: 'Leather Tool Belt', material: 'Tanned Hide' },
                    ],
                    headgear: [{ name: 'Linen Head-cloth', material: 'Linen' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Fisher, Nile/Tigris-Euphrates boatman.
                Male: {
                    garments: [{ name: 'Linen Loincloth', material: 'Plain Linen' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            extraction: {
                // UNCERTAIN: quarrymen (Aswan granite) and Sinai copper/
                // turquoise miners were frequently corvee or forced labour;
                // this entry describes the clothing, not the conditions.
                Male: {
                    garments: [{ name: 'Linen Loincloth', material: 'Coarse Linen' }],
                    headgear: [{ name: 'Linen Head-cloth', material: 'Linen' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                // Laundress/washerwoman match the category regex; bare
                // "servant" does not.
                Female: {
                    garments: [
                        { name: 'Linen Wrap Dress', material: 'Coarse Linen' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Headscarf', material: 'Linen' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // Islamic Caliphates through Mamluk Egypt, ~650-1500. Cotton is
            // legitimate from here on (the Arab Agricultural Revolution
            // spread cotton cultivation across the Islamic world, 8th-9th c.)
            // — a real change from the ANTIQUITY block above, not an
            // inconsistency.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Cotton Qamis Tunic', material: 'Plain Cotton' },
                        { name: 'Loose Cotton Trousers (Sarawil)', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Turban', material: 'Cotton' }],
                    footwear: [
                        { name: 'Leather Sandals', material: 'Leather' },
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Wrap Dress', material: 'Cotton' },
                        { name: 'Linen Veil', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Tanned Hide' },
                    ],
                    headgear: [{ name: 'Cotton Skullcap', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Coarse Cotton' },
                        { name: 'Loose Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Turban', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
            water_maritime: {
                // Indian Ocean / Persian Gulf / Mediterranean dhow trade.
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Cotton' },
                        { name: 'Loose Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Skullcap', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [{ name: 'Plain Cotton Dress', material: 'Cotton' }],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // Ottoman/Safavid/Ottoman Egypt, ~1500-1800.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Cotton Entari Robe', material: 'Cotton' },
                        { name: 'Loose Cotton Shalwar Trousers', material: 'Cotton' },
                    ],
                    headgear: [
                        { name: 'Felt Cap', material: 'Felted Wool' },
                        { name: 'Cotton Turban', material: 'Cotton' },
                    ],
                    footwear: [
                        { name: 'Leather Sandals', material: 'Leather' },
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Entari Dress', material: 'Cotton' },
                        { name: 'Cotton Salvar Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Tanned Hide' },
                    ],
                    headgear: [{ name: 'Felt Cap', material: 'Felted Wool' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Coarse Cotton' },
                        { name: 'Cotton Shalwar Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Felt Cap', material: 'Felted Wool' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Cotton' },
                        { name: 'Wool Cloak', material: 'Undyed Wool' },
                    ],
                    headgear: [{ name: 'Felt Cap', material: 'Felted Wool' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [{ name: 'Plain Cotton Dress', material: 'Cotton' }],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  EAST ASIAN                                                          *
     *  MEDIEVAL already has field_labour (M/F) and workshop_craft (M) live *
     *  — those are NOT restated except where noted below to add a gender  *
     *  to an existing category (see the merge-order note in the header).  *
     * ===================================================================== */
    EAST_ASIAN: {
        [HistoricalEra.PREHISTORY]: {
            // Neolithic China (Yangshao/Longshan) and Jomon Japan. Hemp is
            // the earliest attested fibre; sericulture begins in this window
            // (Liangzhu, ~3000 BCE) but never for common wear.
            field_labour: {
                Male: {
                    garments: [{ name: 'Hemp Wrap Tunic', material: 'Coarse Hemp' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Hemp Wrap Dress', material: 'Coarse Hemp' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Hemp Wrap Tunic', material: 'Coarse Hemp' },
                        { name: 'Woven Grass Rain Cape', material: 'Plaited Grass' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // The 27-gap zone/era: Shang-Han China, Yayoi Japan, Gojoseon
            // Korea, ~1600 BCE-500 CE. Hemp/ramie only — cotton does not
            // reach mainstream China until much later (see file header) —
            // and the SILHOUETTE is a short work jacket and trousers
            // (duanhe, the attested term for a commoner's/labourer's dress
            // in Han-era texts), not the ankle-length cross-collared robe
            // that is right for gentry but wrong for someone bent over a
            // rice paddy. The irony that the people weaving silk brocade for
            // tribute wore plain hemp themselves is deliberate, not an
            // oversight — silk was taxed/requisitioned away from producers
            // and commoners were repeatedly barred from wearing it by
            // sumptuary law.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Short Hemp Work Jacket (Duanhe)', material: 'Coarse Hemp' },
                        { name: 'Cropped Hemp Trousers', material: 'Hemp' },
                    ],
                    headgear: [{ name: 'Conical Bamboo Hat', material: 'Woven Bamboo' }],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Rice Straw' },
                        { name: 'Barefoot', material: 'None' },
                    ],
                },
                Female: {
                    garments: [
                        { name: 'Short Hemp Jacket', material: 'Hemp' },
                        { name: 'Wrap Skirt', material: 'Ramie' },
                    ],
                    headgear: [{ name: 'Cloth Headscarf', material: 'Hemp' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Rice Straw' }],
                },
            },
            workshop_craft: {
                // Weaver, potter, smith.
                Male: {
                    garments: [
                        { name: 'Short Hemp Jacket', material: 'Hemp' },
                        { name: 'Leather Apron', material: 'Tanned Hide', adjectives: ['Scorched'] },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Hemp' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
                Female: {
                    garments: [
                        { name: 'Short Ramie Jacket', material: 'Ramie' },
                        { name: 'Wrap Skirt', material: 'Ramie' },
                    ],
                    headgear: [{ name: 'Cloth Headscarf', material: 'Hemp' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
            },
            heavy_outdoor_trade: {
                // Carpenter.
                Male: {
                    garments: [
                        { name: 'Short Hemp Jacket', material: 'Coarse Hemp' },
                        { name: 'Cropped Trousers', material: 'Hemp' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Hemp' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
            },
            water_maritime: {
                // Fisher, Duck Herder's riverine cousin.
                Male: {
                    garments: [
                        { name: 'Short Hemp Jacket', material: 'Hemp' },
                        { name: 'Woven Straw Rain Cape', material: 'Plaited Straw' },
                    ],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [{ name: "Plain Hemp Servant's Dress", material: 'Hemp' }],
                    headgear: [{ name: 'Cloth Headband', material: 'Hemp' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // ADDING to a zone/era that already has field_labour (M/F) and
            // workshop_craft (Male) live in workDress.ts. workshop_craft's
            // existing Male entry is restated here verbatim alongside the
            // new Female entry — see the merge-order note in the file
            // header for why that's required, not redundant. The other four
            // categories below (heavy_outdoor_trade, water_maritime,
            // extraction, domestic_service) are brand new for this zone/era
            // and don't need restating anything.
            workshop_craft: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'Hemp Work Jacket', material: 'Hemp' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
                Female: {
                    garments: [
                        { name: 'Ramie Work Jacket', material: 'Ramie' },
                        { name: 'Work Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
            },
            heavy_outdoor_trade: {
                // Carpenter.
                Male: {
                    garments: [
                        { name: 'Hemp Work Jacket', material: 'Hemp' },
                        { name: 'Cropped Trousers', material: 'Ramie' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
            },
            water_maritime: {
                // Fisher — the largest single profession in the MEDIEVAL
                // EAST_ASIAN gap sample. UNCERTAIN: female divers/fisherfolk
                // (e.g. Jeju haenyeo) are well documented, but as an
                // organised, large-scale institution mostly from ~17th c.
                // onward — too late to assert confidently for this whole
                // era, so no Female entry here (added at RENAISSANCE_EARLY_
                // MODERN instead, in the shore-based net-mender sense).
                Male: {
                    garments: [
                        { name: 'Ramie Work Jacket', material: 'Ramie' },
                        { name: 'Woven Straw Rain Cape', material: 'Plaited Straw' },
                    ],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            extraction: {
                Male: {
                    garments: [{ name: 'Rough Hemp Jacket', material: 'Undyed Hemp' }],
                    headgear: [{ name: 'Cloth Head Wrap', material: 'Cotton' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
            },
            domestic_service: {
                Male: {
                    garments: [{ name: "Plain Hemp Servant's Robe", material: 'Hemp' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
                Female: {
                    garments: [{ name: "Plain Ramie Servant's Dress", material: 'Ramie' }],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // Ming/Qing China, Joseon Korea, Edo Japan, ~1500-1800. Cotton
            // is now correct and dominant for commoners (Ming cotton
            // mandate); indigo-dyed cotton work jackets are the well-
            // documented, iconic labourer's garment across the region.
            field_labour: {
                // Rice Farmer, Tea Picker.
                Male: {
                    garments: [
                        { name: 'Short Work Jacket', material: 'Indigo-dyed Cotton' },
                        { name: 'Loose Cotton Trousers', material: 'Undyed Cotton' },
                    ],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Rice Straw' }],
                },
                Female: {
                    garments: [
                        { name: 'Short Cotton Jacket', material: 'Homespun Cotton' },
                        { name: 'Tucked Wrap Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Rice Straw' }],
                },
            },
            workshop_craft: {
                // Weaver.
                Male: {
                    garments: [
                        { name: 'Work Jacket', material: 'Indigo-dyed Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
            },
            heavy_outdoor_trade: {
                // Carpenter.
                Male: {
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Straw Sandals', material: 'Straw' }],
                },
            },
            water_maritime: {
                // Fisher — persimmon-tannin (kakishibu) waterproofing on
                // cotton is well attested for Japan and extended here per
                // the same UNCERTAIN caveat the live INDUSTRIAL_ERA entry
                // already carries about how far it generalises to China/
                // Korea. Female entry is the shore-based net-mender/
                // fish-seller reading, not a deep-sea/diving reading.
                Male: {
                    garments: [
                        { name: 'Persimmon-dyed Cotton Jacket', material: 'Kakishibu-treated Cotton' },
                        { name: 'Cotton Trousers', material: 'Undyed Cotton' },
                    ],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [{ name: "Servant's Cotton Dress", material: 'Cotton' }],
                    headgear: [{ name: 'Cloth Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            // The live MODERN_ERA block already covers field_labour (M/F)
            // and workshop_craft (M/F) in full. These five additions fill
            // the missing GENDER on categories that already exist with only
            // one gender live — each restates the existing gender verbatim
            // per the merge-order note in the header. "Kitchen Porter" and
            // "Care Worker" (the other professions in the sampled gap) match
            // no WORK_CATEGORY_RULES regex at all and can't be fixed from
            // data; see the file header.
            heavy_outdoor_trade: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Cotton Twill' },
                        { name: 'Canvas Trousers', material: 'Canvas' },
                    ],
                    headgear: [{ name: 'Cotton Work Cap', material: 'Cotton' }],
                    footwear: [{ name: 'Rubber Work Shoes', material: 'Rubber and Canvas' }],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Work Jacket', material: 'Cotton Twill' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Rubber Work Shoes', material: 'Rubber and Canvas' }],
                },
            },
            water_maritime: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'Oiled Canvas Jacket', material: 'Oiled Canvas' },
                        { name: 'Rubber Apron', material: 'Rubber' },
                    ],
                    headgear: [{ name: 'Straw Hat', material: 'Straw' }],
                    footwear: [{ name: 'Rubber Boots', material: 'Rubber' }],
                },
                Female: {
                    garments: [
                        { name: 'Oiled Canvas Jacket', material: 'Oiled Canvas' },
                        { name: 'Cotton Headscarf', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Straw Hat', material: 'Straw' }],
                    footwear: [{ name: 'Rubber Boots', material: 'Rubber' }],
                },
            },
            extraction: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [{ name: 'Cotton Boiler Suit', material: 'Cotton Drill' }],
                    headgear: [{ name: 'Hard Hat', material: 'Hardened Fibre' }],
                    footwear: [{ name: 'Rubber Work Boots', material: 'Rubber' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Boiler Suit', material: 'Cotton Drill' }],
                    headgear: [{ name: 'Cotton Headscarf', material: 'Cotton' }],
                    footwear: [{ name: 'Rubber Work Boots', material: 'Rubber' }],
                },
            },
            domestic_service: {
                Male: {
                    garments: [
                        { name: 'Cotton Servant Jacket', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
                Female: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'Cotton Work Dress', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
            },
            retail_clerical: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'White Cotton Shirt', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Blouse and Skirt', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Cloth Shoes', material: 'Cotton' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  EUROPEAN                                                            *
     *  MEDIEVAL already has field_labour (M/F), workshop_craft (M) and     *
     *  water_maritime (M) live. New categories added clean; the two        *
     *  gender-additions restate the existing Male entry (merge-order note  *
     *  in the header).                                                     *
     * ===================================================================== */
    EUROPEAN: {
        [HistoricalEra.PREHISTORY]: {
            // UNCERTAIN: Neolithic/Bronze Age Europe, ~6000-800 BCE. Wool
            // sheep husbandry is established by the Bronze Age; earlier than
            // that, hide/leather is the safer default.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Hide Wrap Tunic', material: 'Tanned Hide' },
                        { name: 'Wool Cloak', material: 'Undyed Wool' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Rawhide Foot Wraps', material: 'Rawhide' }],
                },
                Female: {
                    garments: [{ name: 'Wool Wrap Dress', material: 'Undyed Wool' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Rawhide Foot Wraps', material: 'Rawhide' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // Greco-Roman world, ~800 BCE-500 CE. Wool dominant; linen for
            // undertunics; no cotton (essentially absent from the Roman/
            // Greek everyday wardrobe); silk luxury-only and never for
            // labour. The live default table's "Slave Tunic" naming is a
            // register issue in the wealth table, not this file's problem —
            // these entries use plain, working-register names instead.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Undyed Wool' },
                        { name: 'Leather Belt', material: 'Leather' },
                    ],
                    headgear: [{ name: 'Straw Sunhat', material: 'Plaited Straw' }],
                    footwear: [
                        { name: 'Barefoot', material: 'None' },
                        { name: 'Leather Sandals', material: 'Leather' },
                    ],
                },
                Female: {
                    garments: [{ name: 'Wool Tunic (Peplos)', material: 'Undyed Wool' }],
                    headgear: [{ name: 'Linen Headscarf', material: 'Linen' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                // Weaver, potter, smith.
                Male: {
                    garments: [
                        { name: 'Short Wool Tunic (Exomis)', material: 'Undyed Wool', adjectives: ['One-shouldered'] },
                        { name: 'Leather Apron', material: 'Thick Hide', adjectives: ['Scorched'] },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Leather' }],
                },
                Female: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Wool' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Headscarf', material: 'Linen' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            heavy_outdoor_trade: {
                // Carpenter, mason.
                Male: {
                    garments: [
                        { name: 'Short Wool Tunic (Exomis)', material: 'Wool', adjectives: ['Belted'] },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals (Caligae)', material: 'Leather' }],
                },
            },
            water_maritime: {
                // Fisher, sailor.
                Male: {
                    garments: [{ name: 'Short Wool Tunic (Exomis)', material: 'Undyed Wool' }],
                    headgear: [{ name: 'Felt Cap (Pileus)', material: 'Felted Wool' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            extraction: {
                // UNCERTAIN: Roman/Greek mining (Laurion silver, Iberian
                // gold) relied heavily on enslaved labour; clothing
                // described here, not conditions.
                Male: {
                    garments: [{ name: 'Loincloth', material: 'Coarse Wool' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Coarse Wool' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Headscarf', material: 'Linen' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // New categories (heavy_outdoor_trade, extraction,
            // domestic_service) added clean. workshop_craft and
            // water_maritime restate the existing Male entry verbatim
            // alongside the new Female one — see merge-order note, header.
            heavy_outdoor_trade: {
                // Carpenter, mason, roofer.
                Male: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Wool' },
                        { name: 'Wool Hose', material: 'Wool' },
                        { name: 'Leather Apron', material: 'Thick Hide' },
                    ],
                    headgear: [{ name: 'Coif', material: 'Linen' }],
                    footwear: [{ name: 'Leather Boots', material: 'Leather' }],
                },
            },
            extraction: {
                // Miner (e.g. Harz silver, Cornish tin).
                Male: {
                    garments: [{ name: 'Wool Tunic', material: 'Undyed Wool' }],
                    headgear: [{ name: 'Leather Skull Cap', material: 'Leather' }],
                    footwear: [{ name: 'Hobnailed Leather Boots', material: 'Thick Leather', adjectives: ['Hobnailed'] }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Wool Kirtle', material: 'Undyed Wool' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Veil', material: 'Linen' }],
                    footwear: [{ name: 'Turnshoes', material: 'Rough Leather' }],
                },
            },
            workshop_craft: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'Leather Apron', material: 'Thick Hide' },
                        { name: 'Wool Tunic', material: 'Wool' },
                    ],
                    headgear: [{ name: 'Coif', material: 'Linen' }],
                    footwear: [{ name: 'Leather Boots', material: 'Leather' }],
                },
                Female: {
                    // Weaving/spinning: overwhelmingly women's work.
                    garments: [
                        { name: 'Wool Kirtle', material: 'Wool' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Coif', material: 'Linen' }],
                    footwear: [{ name: 'Turnshoes', material: 'Rough Leather' }],
                },
            },
            water_maritime: {
                Male: {
                    // Restated verbatim from workDress.ts's live entry.
                    garments: [
                        { name: 'Oiled Wool Cloak', material: 'Oiled Wool' },
                        { name: 'Wool Tunic', material: 'Wool' },
                    ],
                    headgear: [{ name: 'Wool Cap', material: 'Wool' }],
                    footwear: [{ name: 'Leather Boots, Greased', material: 'Greased Leather' }],
                },
                Female: {
                    // Fishwife/net-mender, not deckhand.
                    garments: [
                        { name: 'Wool Kirtle', material: 'Wool' },
                        { name: 'Wool Shawl', material: 'Wool' },
                    ],
                    headgear: [{ name: 'Linen Headscarf', material: 'Linen' }],
                    footwear: [{ name: 'Turnshoes', material: 'Leather' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // ~1500-1800. Wool/linen still dominant for common work dress;
            // cotton is only just entering via colonial trade (fustian,
            // a wool-cotton blend, is the safe way to gesture at it).
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Wool Jerkin', material: 'Wool' },
                        { name: 'Linen Shirt', material: 'Linen' },
                        { name: 'Wool Breeches', material: 'Wool' },
                    ],
                    headgear: [
                        { name: 'Straw Hat', material: 'Plaited Straw' },
                        { name: 'Wool Cap', material: 'Wool' },
                    ],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
                Female: {
                    garments: [
                        { name: 'Wool Bodice and Petticoat', material: 'Wool' },
                        { name: 'Linen Shift', material: 'Linen' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Cap', material: 'Linen' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Linen Shirt', material: 'Linen' },
                        { name: 'Leather Apron', material: 'Thick Hide' },
                    ],
                    headgear: [{ name: 'Wool Cap', material: 'Wool' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
                Female: {
                    garments: [
                        { name: 'Wool Bodice and Skirt', material: 'Wool' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Cap', material: 'Linen' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Canvas Smock', material: 'Hemp Canvas' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'Felt Hat', material: 'Felted Wool' }],
                    footwear: [{ name: 'Leather Boots', material: 'Leather' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Oiled Wool Jacket (Fearnought)', material: 'Oiled Wool' },
                        { name: 'Canvas Trousers', material: 'Hemp Canvas' },
                    ],
                    headgear: [{ name: 'Wool Cap', material: 'Wool' }],
                    footwear: [{ name: 'Leather Sea Boots', material: 'Tarred Leather' }],
                },
            },
            extraction: {
                Male: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Undyed Wool' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'Leather Cap', material: 'Leather' }],
                    footwear: [{ name: 'Hobnailed Boots', material: 'Thick Leather', adjectives: ['Hobnailed'] }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Linen Shift and Wool Bodice', material: 'Linen and Wool' },
                        { name: 'Linen Apron and Cap', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Cap', material: 'Linen' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  SOUTH AMERICAN                                                      *
     *  Indigenous Andean/coastal traditions, continuous through this      *
     *  zone (there is no separate "South American Colonial" zone).        *
     *  Cotton is genuinely ancient here (Norte Chico/Caral, ~3000 BCE) —   *
     *  unlike MENA/EAST_ASIA/EUROPE, it is NOT an anachronism even at      *
     *  PREHISTORY.                                                        *
     * ===================================================================== */
    SOUTH_AMERICAN: {
        [HistoricalEra.PREHISTORY]: {
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Wrap Loincloth', material: 'Undyed Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Skirt', material: 'Undyed Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Coastal Peru reed-boat (caballito de totora) fishing.
                Male: {
                    garments: [{ name: 'Cotton Wrap Loincloth', material: 'Cotton' }],
                    headgear: [{ name: 'Woven Reed Hat', material: 'Totora Reed' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // Chavin/Paracas/Nazca/Moche, ~1200 BCE-600 CE. UNCERTAIN:
            // highland communities of this period likely worked camelid
            // (llama/alpaca) wool rather than cotton; this defaults to the
            // better-documented coastal-cotton tradition, not a claim that
            // wool was absent.
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Tunic', material: 'Plain Cotton' }],
                    headgear: [{ name: 'Woven Cotton Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Plant-fibre Sandals', material: 'Woven Rush' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Plain Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                // Weaver, potter.
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            heavy_outdoor_trade: {
                // Stonemason (monumental construction).
                Male: {
                    garments: [{ name: 'Cotton Tunic', material: 'Coarse Cotton' }],
                    headgear: [{ name: 'Woven Cotton Headband', material: 'Cotton' }],
                    footwear: [{ name: 'Plant-fibre Sandals', material: 'Woven Rush' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Tunic', material: 'Plain Cotton' }],
                    headgear: [{ name: 'Woven Reed Hat', material: 'Totora Reed' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // Wari/Tiwanaku through Inca, ~600-1533. Camelid wool becomes
            // prominent, especially under Inca state textile tribute; plain
            // undyed wool/cotton for commoners, patterned cloth reserved
            // for nobility by sumptuary law.
            field_labour: {
                Male: {
                    garments: [{ name: 'Llama Wool Tunic (Uncu)', material: 'Plain Llama Wool' }],
                    headgear: [{ name: 'Woven Wool Cap', material: 'Alpaca Wool' }],
                    footwear: [{ name: 'Leather Sandals (Llanque)', material: 'Untanned Hide' }],
                },
                Female: {
                    garments: [{ name: 'Wool Wrap Dress (Anaku)', material: 'Plain Alpaca Wool' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Untanned Hide' }],
                },
            },
            workshop_craft: {
                // Weaving was a central Inca state craft; potter.
                Male: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Llama Wool' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Untanned Hide' }],
                },
                Female: {
                    garments: [{ name: 'Wool Wrap Dress', material: 'Alpaca Wool' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Untanned Hide' }],
                },
            },
            water_maritime: {
                // Coastal cotton fishing tradition persists alongside
                // highland wool.
                Male: {
                    garments: [{ name: 'Cotton Tunic', material: 'Plain Cotton' }],
                    headgear: [{ name: 'Woven Reed Hat', material: 'Totora Reed' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // Late Inca and early-contact indigenous persistence, ~1500-
            // 1700; the same wool/cotton material culture continuing.
            field_labour: {
                Male: {
                    garments: [{ name: 'Wool Tunic (Uncu)', material: 'Plain Llama Wool' }],
                    headgear: [{ name: 'Woven Wool Cap', material: 'Alpaca Wool' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Untanned Hide' }],
                },
                Female: {
                    garments: [{ name: 'Wool Wrap Dress', material: 'Alpaca Wool' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Untanned Hide' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Wool Tunic', material: 'Llama Wool' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Sandals', material: 'Untanned Hide' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Tunic', material: 'Cotton' }],
                    headgear: [{ name: 'Woven Reed Hat', material: 'Totora Reed' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  SUB-SAHARAN AFRICAN                                                 *
     *  An enormous, internally diverse zone (Sahel, Horn, Great Lakes,     *
     *  Central African forest, Southern Africa, Swahili coast) collapsed   *
     *  into one label here, as the live table's zone list already forces. *
     *  Entries default to the best-documented pattern per era rather than  *
     *  a single ethnography; regional exceptions are called out.          *
     * ===================================================================== */
    SUB_SAHARAN_AFRICAN: {
        [HistoricalEra.PREHISTORY]: {
            // UNCERTAIN on precise dating throughout the continent. Hide/
            // leather is the safe default; bark cloth (well attested in the
            // Great Lakes region for millennia) is the likely alternative.
            field_labour: {
                Male: {
                    garments: [{ name: 'Hide Wrap Kilt', material: 'Tanned Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Hide Wrap Skirt', material: 'Tanned Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // ~1000 BCE-500 CE: Nok culture, early Bantu expansion. UNCERTAIN:
            // Nubia/Kush (Meroe) cultivated and wove cotton in this exact
            // period — well documented — but that's a Nile-valley exception;
            // these entries default to the hide/bark-cloth pattern that fits
            // the majority of the continent at this date.
            field_labour: {
                Male: {
                    garments: [{ name: 'Hide Wrap Kilt', material: 'Tanned Goat Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Bark-cloth Wrap Skirt', material: 'Beaten Bark Cloth' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                // Smith — iron metallurgy in Sub-Saharan Africa is ancient
                // and largely independent (Nok culture ironworking, ~1000
                // BCE onward).
                Male: {
                    garments: [
                        { name: 'Hide Kilt', material: 'Tanned Hide' },
                        { name: 'Leather Apron', material: 'Thick Hide', adjectives: ['Scorched'] },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Nile/Lake Chad/coastal fishing.
                Male: {
                    garments: [{ name: 'Hide Wrap Kilt', material: 'Tanned Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // ~500-1500: Ghana/Mali/Songhai, Great Zimbabwe, Swahili coast,
            // Aksum/Ethiopia. Cotton weaving (strip-woven cloth) is well
            // established across the West African Sahel by this period via
            // trans-Saharan trade and local cultivation.
            field_labour: {
                Male: {
                    garments: [{ name: 'Handwoven Cotton Wrap Cloth', material: 'Strip-woven Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Strip-woven Cotton' }],
                    headgear: [{ name: 'Cotton Headwrap', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                // Weaver, smith.
                Male: {
                    garments: [
                        { name: 'Cotton Wrap Cloth', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Tanned Hide' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Swahili-coast dhow-trade fishers/sailors.
                Male: {
                    garments: [{ name: 'Cotton Wrap Cloth', material: 'Cotton' }],
                    headgear: [{ name: 'Cotton Skullcap', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Cotton' }],
                    headgear: [{ name: 'Cotton Headwrap', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // ~1500-1800. Cotton weaving and indigo-dyeing (Hausa/Yoruba
            // dye traditions, e.g. the Kano dye pits) are well documented
            // for West Africa in this window; UNCERTAIN how far this
            // specific detail generalises beyond that region.
            field_labour: {
                Male: {
                    garments: [{ name: 'Handwoven Cotton Wrap Cloth', material: 'Indigo-dyed Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Cotton' }],
                    headgear: [{ name: 'Cotton Headwrap', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Wrap Cloth', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Tanned Hide' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            // Entirely new zone for this era in the work-dress table (the
            // live WORK_DRESS_DATA has no SUB_SAHARAN_AFRICAN entry at
            // all). Covers Carpenter and Miner from the gap sample;
            // "Township Worker" matches no WORK_CATEGORY_RULES regex (see
            // file header) and can't be reached from data.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Cotton Wrap Cloth', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Straw Hat', material: 'Straw' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Printed Cotton' }],
                    headgear: [{ name: 'Cotton Headwrap', material: 'Cotton' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
            heavy_outdoor_trade: {
                // Carpenter.
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Cotton Drill Trousers', material: 'Cotton Drill' },
                    ],
                    headgear: [{ name: 'Cotton Cap', material: 'Cotton' }],
                    footwear: [{ name: 'Leather Work Boots', material: 'Leather' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Work Shirt', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Rubber Boots', material: 'Rubber' }],
                },
            },
            extraction: {
                // Miner — South African gold/diamond, Congolese/Zambian
                // copper.
                Male: {
                    garments: [{ name: 'Cotton Boiler Suit', material: 'Cotton Drill' }],
                    headgear: [{ name: 'Miner’s Safety Helmet', material: 'Hardened Fibre', adjectives: ['Lamp-bracket'] }],
                    footwear: [{ name: 'Rubber Work Boots', material: 'Rubber' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Cotton Wrap Dress', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Headwrap', material: 'Cotton' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  SOUTHEAST ASIAN                                                     *
     * ===================================================================== */
    SOUTHEAST_ASIAN: {
        [HistoricalEra.PREHISTORY]: {
            // Austronesian bark-cloth tradition, broadly attested across
            // the region for millennia.
            field_labour: {
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap', material: 'Beaten Bark Cloth' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Bark-cloth Wrap Skirt', material: 'Beaten Bark Cloth' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // ~500 BCE-500 CE: Dong Son culture, early Funan/Champa. Cotton
            // cultivation and weaving present via South Asian contact.
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Wrap Sarong', material: 'Plain Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Skirt', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Wrap', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Fisher — central to subsistence throughout the region.
                Male: {
                    garments: [{ name: 'Cotton Wrap', material: 'Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // ~500-1500: Khmer Empire, Srivijaya, Pagan, early Majapahit.
            // Angkor-period reliefs show commoners doing manual labour
            // bare-chested with a simple wrapped cotton lower garment
            // (sampot); that convention is followed here rather than a
            // fuller "robe" silhouette.
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Wrap Cloth (Sampot)', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [
                        { name: 'Cotton Wrap Skirt (Sampot)', material: 'Cotton' },
                        { name: 'Cotton Breast Wrap', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Wrap Cloth', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Wrap Cloth', material: 'Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // ~1500-1800: Ayutthaya, Majapahit-Mataram Java. Batik
            // dyeing is developing in Java in this window; the kebaya's
            // earliest forms date to roughly this period too.
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Sarong', material: 'Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [
                        { name: 'Batik Wrap Skirt', material: 'Batik-dyed Cotton' },
                        { name: 'Simple Cotton Blouse (Kebaya-precursor)', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Wrap Cloth', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Wrap Cloth', material: 'Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MODERN_ERA]: {
            // Entirely new zone for this era in the work-dress table.
            // Covers Miner and Rice Farmer from the gap sample; "Kitchen
            // Porter" matches no regex (see file header).
            field_labour: {
                // Rice Farmer.
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Blouse and Wrap Skirt', material: 'Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
            extraction: {
                // Miner — Malaysian/Indonesian tin, Vietnamese coal.
                Male: {
                    garments: [{ name: 'Cotton Boiler Suit', material: 'Cotton Drill' }],
                    headgear: [{ name: 'Hard Hat', material: 'Hardened Fibre' }],
                    footwear: [{ name: 'Rubber Work Boots', material: 'Rubber' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Cotton Apron', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Cotton Work Shirt', material: 'Cotton' },
                        { name: 'Cotton Trousers', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Cap', material: 'Cotton' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Work Shirt', material: 'Cotton' }],
                    headgear: [{ name: 'Conical Straw Hat', material: 'Woven Straw' }],
                    footwear: [{ name: 'Rubber Boots', material: 'Rubber' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Rubber Sandals', material: 'Rubber' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  SOUTH ASIAN                                                         *
     *  Lighter pass — no measured gap in these eras, but the "every zone"  *
     *  scope calls for it. Cotton is genuinely ancient here (Mehrgarh,     *
     *  ~6000 BCE) so, like SOUTH_AMERICAN, it is legitimate from           *
     *  PREHISTORY onward. Naming continues the dhoti/lungi/sari vocabulary *
     *  the live INDUSTRIAL_ERA/MODERN_ERA SOUTH_ASIAN entries already use, *
     *  which is also historically correct continuity, not just style      *
     *  matching — the wrapped, unstitched cotton garment is a genuinely    *
     *  multi-millennium-old tradition here.                                *
     * ===================================================================== */
    SOUTH_ASIAN: {
        [HistoricalEra.PREHISTORY]: {
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Wrap Loincloth', material: 'Undyed Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Undyed Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // Indus Valley Civilization through Maurya/Gupta.
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Dhoti', material: 'Coarse Cotton' }],
                    headgear: [{ name: 'Cotton Head Cloth', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Wrap Dress', material: 'Coarse Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Dhoti', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Lothal-era coastal/river trade.
                Male: {
                    garments: [{ name: 'Cotton Dhoti', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // Chola/Delhi Sultanate/Vijayanagara.
            field_labour: {
                Male: {
                    garments: [{ name: 'Cotton Dhoti', material: 'Cotton' }],
                    headgear: [{ name: 'Cotton Head Cloth', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Sari, Field-tucked', material: 'Coarse Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Dhoti', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Lungi', material: 'Cotton' }],
                    headgear: [{ name: 'Palm-leaf Hat', material: 'Woven Palm Leaf' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // Mughal era; fine muslin/brocade fashions at court are
            // irrelevant to labourers' dress, which stays plain cotton.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Cotton Dhoti', material: 'Cotton' },
                        { name: 'Cotton Banian Vest', material: 'Cotton' },
                    ],
                    headgear: [{ name: 'Cotton Head Cloth', material: 'Cotton' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Cotton Sari, Field-tucked', material: 'Cotton' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Cotton Dhoti', material: 'Cotton' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Cotton Lungi', material: 'Cotton' }],
                    headgear: [{ name: 'Palm-leaf Hat', material: 'Woven Palm Leaf' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  NORTH AMERICAN PRE-COLUMBIAN                                        *
     *  UNCERTAIN throughout: this label spans Arctic, Pacific Northwest,   *
     *  Plains, Eastern Woodlands, Southwest and Mississippian traditions   *
     *  that differ enormously (cedar bark on the Northwest Coast, woven    *
     *  cotton in the Southwest by the medieval period, buckskin almost     *
     *  everywhere else). Entries below default to the buckskin/hide       *
     *  pattern that fits the largest share (Eastern Woodlands/Plains/      *
     *  Mississippian), matching the material the flagged gap sample        *
     *  already used ("Painted Buckskin") — the fix there is the            *
     *  overly-decorative SILHOUETTE, not the fibre.                        *
     * ===================================================================== */
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        [HistoricalEra.PREHISTORY]: {
            // Archaic period, ~8000-1000 BCE.
            field_labour: {
                Male: {
                    garments: [{ name: 'Buckskin Breechclout', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Buckskin Wrap Skirt', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            // ~1000 BCE-500 CE: Adena/Hopewell, early Basketmaker Southwest.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Buckskin Breechclout', material: 'Tanned Deer Hide' },
                        { name: 'Woven Plant-fibre Mantle', material: 'Yucca Fibre' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Plant-fibre Sandals', material: 'Woven Yucca' }],
                },
                Female: {
                    garments: [{ name: 'Buckskin Wrap Dress', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Plant-fibre Sandals', material: 'Woven Yucca' }],
                },
            },
            workshop_craft: {
                // Potter.
                Male: {
                    garments: [{ name: 'Buckskin Wrap', material: 'Tanned Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Fisher.
                Male: {
                    garments: [{ name: 'Buckskin Breechclout', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            // ~500-1500: Mississippian culture (Cahokia), Ancestral
            // Puebloan. Turkey-feather mantles are attested in both the
            // Eastern Woodlands and the Southwest.
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Buckskin Breechclout', material: 'Tanned Deer Hide' },
                        { name: 'Woven Turkey-feather Mantle', material: 'Turkey Feather and Cordage' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Plant-fibre Sandals', material: 'Woven Yucca' }],
                },
                Female: {
                    garments: [{ name: 'Buckskin Wrap Dress', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Plant-fibre Sandals', material: 'Woven Yucca' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [{ name: 'Buckskin Wrap', material: 'Tanned Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                // Fisher — matches the flagged gap sample. Deliberately
                // plain/undyed, not "painted" or "decorated": that register
                // belongs to ceremonial dress, not everyday labour.
                Male: {
                    garments: [{ name: 'Buckskin Breechclout', material: 'Plain Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            // ~1500-1800, contact era. Kept to indigenous materials
            // (European trade cloth was real by the later part of this
            // window in some contact zones, but that's a separate, later
            // addition this pass doesn't attempt).
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Buckskin Breechclout', material: 'Tanned Deer Hide' },
                        { name: 'Buckskin Leggings', material: 'Tanned Deer Hide' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Hide Moccasins', material: 'Tanned Hide' }],
                },
                Female: {
                    garments: [{ name: 'Buckskin Wrap Dress', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Hide Moccasins', material: 'Tanned Hide' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [{ name: 'Buckskin Wrap', material: 'Tanned Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Hide Moccasins', material: 'Tanned Hide' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Buckskin Breechclout', material: 'Tanned Deer Hide' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  NORTH AMERICAN COLONIAL                                             *
     *  PREHISTORY/ANTIQUITY/MEDIEVAL deliberately absent: there were no    *
     *  European colonials in the Americas before 1492, so there is no      *
     *  gap to fill for those eras in this zone — a real absence, not an    *
     *  oversight. RENAISSANCE_EARLY_MODERN (~1607-1800) is the zone's      *
     *  actual founding period and gets a full pass, matching the house     *
     *  style the live INDUSTRIAL_ERA block for this zone already set      *
     *  (homespun/broadfall/osnaburg vocabulary, standing on its own        *
     *  rather than inheriting EUROPEAN's).                                 *
     * ===================================================================== */
    NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            field_labour: {
                Male: {
                    garments: [
                        { name: 'Linen Shirt', material: 'Homespun Linen' },
                        { name: 'Wool Breeches', material: 'Wool' },
                        { name: 'Leather Jerkin', material: 'Leather' },
                    ],
                    // Knitted caps are safely post-1200; the Monmouth cap is
                    // a genuine 16th-17th c. English knitted work cap.
                    headgear: [{ name: 'Monmouth Cap', material: 'Knitted Wool' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Rough-out Leather' }],
                },
                Female: {
                    garments: [
                        { name: 'Wool Bodice and Petticoat', material: 'Wool' },
                        { name: 'Linen Shift', material: 'Homespun Linen' },
                        { name: 'Linen Apron', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Cap', material: 'Linen' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [
                        { name: 'Linen Shirt', material: 'Homespun Linen' },
                        { name: 'Leather Apron', material: 'Leather' },
                    ],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
            },
            heavy_outdoor_trade: {
                Male: {
                    garments: [
                        { name: 'Canvas Frock', material: 'Hemp Canvas' },
                        { name: 'Leather Breeches', material: 'Leather' },
                    ],
                    headgear: [{ name: 'Felt Hat', material: 'Felted Wool' }],
                    footwear: [{ name: 'Leather Boots', material: 'Leather' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [
                        { name: 'Wool Jacket', material: 'Wool' },
                        { name: 'Canvas Trousers', material: 'Hemp Canvas' },
                    ],
                    headgear: [{ name: 'Wool Watch Cap', material: 'Knitted Wool' }],
                    footwear: [{ name: 'Leather Sea Boots', material: 'Tarred Leather' }],
                },
            },
            domestic_service: {
                Female: {
                    garments: [
                        { name: 'Linen Shift and Wool Bodice', material: 'Linen and Wool' },
                        { name: 'Linen Apron and Cap', material: 'Linen' },
                    ],
                    headgear: [{ name: 'Linen Cap', material: 'Linen' }],
                    footwear: [{ name: 'Leather Shoes', material: 'Leather' }],
                },
            },
        },
    },

    /* ===================================================================== *
     *  OCEANIA                                                             *
     *  No measured gap and, honestly, close to a placeholder: Aboriginal   *
     *  Australian, Melanesian, Micronesian and Polynesian material         *
     *  cultures differ enormously and this single CulturalZone already     *
     *  loses more than these four entries can recover. What follows is the *
     *  best-attested PAN-PACIFIC-ISLANDER pattern (bark cloth / tapa,      *
     *  plant fibre, fishing as the central subsistence activity) and does *
     *  NOT represent Aboriginal Australia, whose historical dress was      *
     *  minimal woven/plant-fibre and, in cooler regions, fur/hide cloaks — *
     *  not attempted here. The content below is nearly identical across    *
     *  eras on purpose: this technology base was genuinely stable across   *
     *  most of Oceania until European contact, not a shortcut.            *
     * ===================================================================== */
    OCEANIA: {
        [HistoricalEra.PREHISTORY]: {
            field_labour: {
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap (Tapa)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Plant-fibre Skirt', material: 'Shredded Pandanus Leaf' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Bark-cloth Waist Wrap (Maro)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.ANTIQUITY]: {
            field_labour: {
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap (Tapa)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Plant-fibre Skirt', material: 'Shredded Pandanus Leaf' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Bark-cloth Waist Wrap (Maro)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.MEDIEVAL]: {
            field_labour: {
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap (Tapa)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Plant-fibre Skirt', material: 'Shredded Pandanus Leaf' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Bark-cloth Waist Wrap (Maro)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                // Canoe-building, tapa-making.
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap', material: 'Beaten Bark Cloth' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            field_labour: {
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap (Tapa)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
                Female: {
                    garments: [{ name: 'Plant-fibre Skirt', material: 'Shredded Pandanus Leaf' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            water_maritime: {
                Male: {
                    garments: [{ name: 'Bark-cloth Waist Wrap (Maro)', material: 'Beaten Paper-mulberry Bark' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
            workshop_craft: {
                Male: {
                    garments: [{ name: 'Bark-cloth Wrap', material: 'Beaten Bark Cloth' }],
                    headgear: [{ name: 'None', material: 'None' }],
                    footwear: [{ name: 'Barefoot', material: 'None' }],
                },
            },
        },
    },
};


/**
 * One table. Later sources win on a per-(zone, era, category) basis, which is
 * how the office data above and the pre-industrial sample merge into the main
 * industrial/modern set without any of them having to be exhaustive.
 */
function mergeWorkDress(...sources: WorkDressData[]): WorkDressData {
    const merged: any = {};
    for (const source of sources) {
        for (const [zone, eras] of Object.entries(source ?? {})) {
            merged[zone] ??= {};
            for (const [era, categories] of Object.entries(eras ?? {})) {
                merged[zone][era] = { ...(merged[zone][era] ?? {}), ...(categories as object) };
            }
        }
    }
    return merged as WorkDressData;
}

export const ALL_WORK_DRESS: WorkDressData = mergeWorkDress(
    WORK_DRESS_DATA,
    WORK_DRESS_DATA_PREINDUSTRIAL,
    WORK_DRESS_PREINDUSTRIAL_EXTENDED,
    WORK_DRESS_OFFICE,
);

/**
 * Garments that carry a gender in the garment itself.
 *
 * Most work dress does not. A boiler suit is a boiler suit, a miner's overalls
 * are a miner's overalls, and a woman who went down a pit or onto a trawler
 * wore what the work required — so borrowing across the table is usually the
 * right answer when only one gender's set was written.
 *
 * These are the exceptions, and the reason this test exists: 17 of the table's
 * categories hold a `Female` entry and no `Male` one, all of them domestic
 * service, and every one of them dressed a manservant in a housedress and
 * apron. A kitchen porter in 2000 New Mexico was pictured in one.
 */
const GENDERED_WORK_GARMENT =
  /housedress|\bdress\b|gown|skirt|blouse|petticoat|apron dress|pinafore|sari\b|saree|abaya|habit\b|cassock|kimono|hanbok/i;

/**
 * The other gender's set, but only when nothing in it is gendered by cut.
 * Otherwise nothing, and the wealth table dresses them instead — which is a
 * duller answer and a true one.
 */
function crossGenderWorkDress(
  byGender: Partial<Record<Gender, { garments: ClothingPiece[]; headgear: ClothingPiece[]; footwear: ClothingPiece[] }>>,
) {
  const candidate = byGender.Male ?? byGender.Female;
  if (!candidate) return undefined;
  if (candidate.garments.some(item => GENDERED_WORK_GARMENT.test(item.name))) return undefined;
  return candidate;
}

/** The work set for a persona, or undefined to leave the wealth table alone. */
export function workDressFor(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    gender: Gender,
    occupation?: string,
): { garments: ClothingPiece[]; headgear: ClothingPiece[]; footwear: ClothingPiece[] } | undefined {
    const category = resolveWorkCategory(occupation);
    if (!category) return undefined;
    const byGender = ALL_WORK_DRESS[culturalZone]?.[era]?.[category];
    if (!byGender) return undefined;
    const set = byGender[gender] ?? crossGenderWorkDress(byGender);
    if (!set || set.garments.length === 0) return undefined;
    return set;
}

/**
 * How strongly to damp a bright signature dye for this kind of work. Applied
 * to the dye-access roll, so a field labourer rarely draws a showcase colour
 * and a judge always can. Without this the garment fix alone still yields
 * "Scarlet Denim Bib Overalls" — a smaller, stranger version of the same bug.
 */
export const WORK_DYE_DAMPING: Partial<Record<WorkCategory, number>> = {
    field_labour: 0.25,
    heavy_outdoor_trade: 0.3,
    extraction: 0.2,
    water_maritime: 0.35,
    workshop_craft: 0.55,
    domestic_service: 0.6,
    retail_clerical: 0.7,
};
