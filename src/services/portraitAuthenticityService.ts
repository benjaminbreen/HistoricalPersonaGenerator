import type { PlayerCharacter } from '../types/playerCharacter';
import type {
  ClothingPalette,
  ClothingPiece,
  PortraitVisualOverrides,
} from '../types/characterData';

export type PortraitContextPackId =
  | 'old_bailey_london_1674_1800'
  | 'mediterranean_antiquity_500bce_500ce'
  | 'sahel_early_0_700'
  | 'sahel_medieval_700_1600'
  | 'china_early_imperial_200bce_600ce'
  | 'china_tang_song_yuan_600_1368'
  | 'china_ming_1368_1650'
  | 'central_asia_soviet_1917_1991'
  | 'south_asia_mughal_1526_1800'
  | 'mainland_southeast_asia_1000_1930'
  | 'maritime_southeast_asia_1750_1930'
  | 'philippines_1500_1930'
  | 'australia_indigenous_4000bce_1788'
  | 'australia_contact_1788_1930'
  | 'melanesia_indigenous_0_1870'
  | 'melanesia_early_contact_1870_1930';

export interface PortraitAuthenticityContext {
  year: number;
  region?: string;
  location?: string;
}

export interface ResolvedPortraitLook {
  contextPackId: PortraitContextPackId;
  garment: ClothingPiece;
  headgear: ClothingPiece;
  footwear: ClothingPiece;
  garmentKind: NonNullable<PortraitVisualOverrides['garmentKind']>;
  headgearKind: NonNullable<PortraitVisualOverrides['headgearKind']>;
  palette: ClothingPalette;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  references: string[];
}

export interface PortraitIdentity {
  contextPackId: PortraitContextPackId;
  placeTrack: string;
  periodTrack: string;
  culturalTrack: string;
  occupationTrack: string;
  statusTrack: string;
  garmentFamily: string;
  paletteFamily: string;
  confidence: 'high' | 'medium' | 'low';
  forbiddenTerms: string[];
  visual: ResolvedPortraitLook;
}

export interface PortraitCoherenceAudit {
  identity: PortraitIdentity | null;
  issues: string[];
}

const REFERENCES = {
  londonCoif: 'https://www.vam.ac.uk/articles/health-and-wellness-tips-from-the-vampa-collections/',
  londonMenswear: 'https://www.vam.ac.uk/shop/books/fashion-and-textiles/17th-century-mens-dress-patterns-146468.html',
  greekDress: 'https://www.metmuseum.org/essays/ancient-greek-dress',
  lateAntiqueDress: 'https://www.metmuseum.org/exhibitions/listings/2012/byzantium-and-islam/blog/topical-essays/posts/costume-styles',
  sahelTextiles: 'https://www.metmuseum.org/perspectives/sahel-research-fellows',
  songFigure: 'https://www.britishmuseum.org/collection/object/A_2022-3034-277',
  mingRobe: 'https://www.metmuseum.org/art/collection/search/70320',
  mingPortrait: 'https://www.metmuseum.org/art/collection/search/48939',
  kazakhPortrait: 'https://www.loc.gov/pictures/item/99615630/',
  kazakhCoat: 'https://www.britishmuseum.org/collection/object/W_As1956-07-41',
  mughalJama: 'https://www.metmuseum.org/art/collection/search/448247',
  maritimeJacket: 'https://www.britishmuseum.org/collection/object/A_As-1917',
  australianBelt: 'https://www.britishmuseum.org/collection/object/E_Oc-6014',
  melanesianBarkcloth: 'https://www.britishmuseum.org/collection/object/E_Oc1954-06-146',
  pacificBarkclothResearch: 'https://www.britishmuseum.org/sites/default/files/2022-12/Scientific_Research_newsletter_Issue_5_2019.pdf',
} as const;

const SAFE_MARKING_TYPES = new Set(['scar', 'freckles', 'mole', 'birthmark', 'beauty_mark']);

const stringHash = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const choose = <T,>(values: readonly T[], seed: number, salt: string): T =>
  values[stringHash(`${seed}|${salt}`) % values.length];

const piece = (name: string, material: string, color?: string): ClothingPiece => ({
  name,
  material,
  ...(color ? { color } : {}),
});

const isWealthy = (character: PlayerCharacter): boolean =>
  character.wealthLevel === 'wealthy' || character.wealthLevel === 'noble';

const isWorkingOccupation = (profession: string): boolean =>
  /(labor|labour|servant|porter|washer|seller|vendor|potter|farmer|midwi|birth|sailor|cook|caretaker|weaver|smith)/i.test(profession);

const isScholarOccupation = (profession: string): boolean =>
  /(scholar|clerk|scribe|official|teacher|priest|monk|administrator|magistrate)/i.test(profession);

const contextText = (context: PortraitAuthenticityContext): string =>
  `${context.region || ''} ${context.location || ''}`.toLowerCase();

export const resolvePortraitContextPack = (
  character: PlayerCharacter,
  context: PortraitAuthenticityContext
): PortraitContextPackId | null => {
  const place = contextText(context);
  const year = context.year;

  if (
    year >= 1674 &&
    year <= 1800 &&
    /(london|stepney|westminster|thames|british isles)/.test(place)
  ) {
    return 'old_bailey_london_1674_1800';
  }

  if (
    year >= -500 &&
    year <= 500 &&
    character.culturalZone === 'EUROPEAN' &&
    /(italy|roman|rome|campagna|naples|greece|aegean|mediterranean|balkans|pindus|thracian)/.test(place)
  ) {
    return 'mediterranean_antiquity_500bce_500ce';
  }

  if (
    year >= 0 &&
    year <= 1600 &&
    character.culturalZone === 'SUB_SAHARAN_AFRICAN' &&
    /(sahel|gao|niger bend|timbuktu|lake chad|dogon|central sahara)/.test(place)
  ) {
    return year < 700 ? 'sahel_early_0_700' : 'sahel_medieval_700_1600';
  }

  const isChineseRegion =
    character.culturalZone === 'EAST_ASIAN' &&
    /(north china|south china|yellow river|shandong|loess|beijing|hebei|yangtze|pearl river|fujian|guangxi|sichuan|china)/.test(place);
  if (isChineseRegion && year >= -200 && year <= 1650) {
    if (year < 600) return 'china_early_imperial_200bce_600ce';
    if (year < 1368) return 'china_tang_song_yuan_600_1368';
    return 'china_ming_1368_1650';
  }

  const isCentralAsianRegion =
    character.culturalZone === 'EAST_ASIAN' &&
    /(kazakh|tian shan|altai|aral sea|dzungarian|central asia)/.test(place);
  if (isCentralAsianRegion && year >= 1917 && year <= 1991) {
    return 'central_asia_soviet_1917_1991';
  }

  const isMughalSouthAsia =
    character.culturalZone === 'SOUTH_ASIAN' &&
    /(india|deccan|ganges|indus|bengal|gujarat|rajasthan|delhi|punjab|coromandel)/.test(place);
  if (isMughalSouthAsia && year >= 1526 && year <= 1800) {
    return 'south_asia_mughal_1526_1800';
  }

  const isMaritimeSoutheastAsia =
    (character.culturalZone === 'EAST_ASIAN' || character.culturalZone === 'SOUTH_ASIAN') &&
    /(borneo|sumatra|java|sulawesi|spice islands|makassar|malacca|sunda|banda|celebes|maritime southeast)/.test(place);
  if (isMaritimeSoutheastAsia && year >= 1300 && year <= 1930) {
    return 'maritime_southeast_asia_1750_1930';
  }

  const isMainlandSoutheastAsia =
    (character.culturalZone === 'EAST_ASIAN' || character.culturalZone === 'SOUTH_ASIAN') &&
    /(mainland southeast|vietnam|hanoi|annam|tonkin|cochinchina|mekong|siam|thailand|ayutthaya|angkor|khmer|cambodia|burma|myanmar|irrawaddy|bagan|rangoon|mandalay)/.test(place);
  if (isMainlandSoutheastAsia && year >= 1000 && year <= 1930) {
    return 'mainland_southeast_asia_1000_1930';
  }

  const isPhilippines =
    (character.culturalZone === 'EAST_ASIAN' || character.culturalZone === 'SOUTH_ASIAN') &&
    /(philippines|luzon|visayas|visayan|mindanao|manila|cebu)/.test(place);
  if (isPhilippines && year >= 1500 && year <= 1930) {
    return 'philippines_1500_1930';
  }

  const isIndigenousAustralianRegion =
    character.culturalZone === 'OCEANIA' &&
    /(australia|aboriginal|daintree|queensland|arnhem|kimberley|tasmania|murray|outback|cape york)/.test(place);
  if (isIndigenousAustralianRegion && year >= -4000 && year <= 1930) {
    return year < 1788 ? 'australia_indigenous_4000bce_1788' : 'australia_contact_1788_1930';
  }

  const isMelanesianRegion =
    character.culturalZone === 'OCEANIA' &&
    /(new guinea|melanesia|bismarck|admiralty|manus|solomon|vanuatu|fiji)/.test(place);
  if (isMelanesianRegion && year >= 0 && year <= 1930) {
    return year < 1870 ? 'melanesia_indigenous_0_1870' : 'melanesia_early_contact_1870_1930';
  }

  return null;
};

const oldBaileyLook = (character: PlayerCharacter, seed: number): ResolvedPortraitLook => {
  const wealthy = isWealthy(character);
  const working = isWorkingOccupation(character.profession || '');
  const female = character.gender === 'Female';

  const garment = female
    ? wealthy
      ? piece('Fitted Wool Gown', 'fine wool', '#574153')
      : piece(working ? 'Plain Wool Work Gown' : 'Wool Gown', 'wool', '#67584b')
    : wealthy
      ? piece('Broadcloth Coat and Linen Shirt', 'wool', '#3f4c55')
      : piece(working ? 'Coarse Wool Jacket and Linen Shirt' : 'Wool Coat and Linen Shirt', 'wool', '#5d5548');

  const headgear = female
    ? piece(wealthy ? 'Fine Linen Coif' : 'Plain Linen Coif', 'linen', '#ddd5c3')
    : choose(
        [
          piece('Felt Work Cap', 'felt', '#4a4540'),
          piece('Plain Wool Cap', 'wool', '#584d43'),
          piece('None', 'none'),
        ],
        seed,
        'london-head'
      );

  return {
    contextPackId: 'old_bailey_london_1674_1800',
    garment,
    headgear,
    footwear: piece('Leather Shoes', 'leather', '#4b3427'),
    garmentKind: female ? 'gown' : working ? 'work_shirt' : 'doublet',
    headgearKind: female ? 'cap' : headgear.name === 'None' ? 'none' : 'cap',
    palette: wealthy
      ? { primary: '#4d3c49', secondary: '#344650', accent: '#a48658' }
      : { primary: '#625649', secondary: '#7b6d5b', accent: '#9a7953' },
    confidence: 'high',
    rationale: 'Restrained wool and linen working dress appropriate to later seventeenth- and eighteenth-century London.',
    references: [REFERENCES.londonCoif, REFERENCES.londonMenswear],
  };
};

const mediterraneanLook = (character: PlayerCharacter, seed: number): ResolvedPortraitLook => {
  const wealthy = isWealthy(character);
  const working = isWorkingOccupation(character.profession || '');
  const garment = wealthy
    ? choose(
        [
          piece('Fine Belted Tunic and Mantle', 'fine wool', '#8d4d43'),
          piece('Linen Tunic with Woven Mantle', 'linen and wool', '#c5ad82'),
        ],
        seed,
        'med-garment'
      )
    : piece(working ? 'Short Belted Wool Tunic' : 'Plain Belted Tunic', 'wool', '#9b805e');
  const headgear = working && stringHash(`${seed}|med-hat`) % 4 === 0
    ? piece('Broad-Brimmed Felt Hat', 'felt', '#8b7355')
    : piece('None', 'none');

  return {
    contextPackId: 'mediterranean_antiquity_500bce_500ce',
    garment,
    headgear,
    footwear: working ? piece('Simple Sandals', 'leather', '#704a32') : piece('Leather Sandals', 'leather', '#6c422d'),
    garmentKind: 'tunic',
    headgearKind: headgear.name === 'None' ? 'none' : 'brimmed_hat',
    palette: wealthy
      ? { primary: '#9a5548', secondary: '#c7b187', accent: '#59696a' }
      : { primary: '#9a805f', secondary: '#c0aa82', accent: '#744c3d' },
    confidence: 'high',
    rationale: 'Tunic, mantle, wool, linen, and occasional brimmed hats follow surviving Mediterranean visual and textile evidence.',
    references: [REFERENCES.greekDress, REFERENCES.lateAntiqueDress],
  };
};

const sahelLook = (
  character: PlayerCharacter,
  seed: number,
  medieval: boolean
): ResolvedPortraitLook => {
  const wealthy = isWealthy(character);
  const female = character.gender === 'Female';
  const garment = medieval
    ? wealthy
      ? piece('Fine Narrow-Strip Woven Robe', 'cotton and wool', '#40516a')
      : piece(female ? 'Wrapped Woven Garment' : 'Loose Woven Tunic', 'cotton', '#9b704c')
    : piece(female ? 'Plain Wrapped Woven Garment' : 'Simple Woven Tunic', 'wool or plant fibre', '#9b7653');

  const headgear = medieval
    ? choose(
        female
          ? [piece('Simple Wrapped Headcloth', 'cotton', '#b49368'), piece('None', 'none')]
          : [piece('Woven Cap', 'cotton', '#665340'), piece('Wrapped Headcloth', 'cotton', '#a98258'), piece('None', 'none')],
        seed,
        'sahel-head'
      )
    : piece('None', 'none');

  return {
    contextPackId: medieval ? 'sahel_medieval_700_1600' : 'sahel_early_0_700',
    garment,
    headgear,
    footwear: piece('Leather Sandals', 'leather', '#68442f'),
    garmentKind: medieval && wealthy ? 'robe' : female ? 'wrapped_garment' : 'tunic',
    headgearKind: headgear.name === 'None' ? 'none' : headgear.name.includes('Cap') ? 'cap' : 'wrapped_cloth',
    palette: medieval
      ? { primary: wealthy ? '#40516a' : '#8d6548', secondary: '#b79868', accent: '#596052' }
      : { primary: '#8f6b4d', secondary: '#b69a70', accent: '#5b5043' },
    confidence: medieval ? 'high' : 'medium',
    rationale: medieval
      ? 'Uses restrained woven tunics, narrow-strip construction, and wrapped cloth without projecting modern regional names backward.'
      : 'Early Sahel clothing evidence is sparse; the profile deliberately uses generic woven forms and avoids later named fashions.',
    references: [REFERENCES.sahelTextiles],
  };
};

const chinaLook = (
  character: PlayerCharacter,
  seed: number,
  period: 'early' | 'middle' | 'ming'
): ResolvedPortraitLook => {
  const wealthy = isWealthy(character);
  const scholar = isScholarOccupation(character.profession || '');
  const female = character.gender === 'Female';

  const garment =
    period === 'early'
      ? piece(wealthy ? 'Fine Cross-Collared Silk Robe' : 'Cross-Collared Hemp Robe', wealthy ? 'silk' : 'hemp', wealthy ? '#79504a' : '#81735d')
      : period === 'middle'
        ? piece(wealthy ? 'Long Silk Robe with Wide Sleeves' : 'Long Belted Woven Robe', wealthy ? 'silk' : 'hemp and cotton', wealthy ? '#536d66' : '#716754')
        : piece(wealthy ? 'Fine Long-Sleeved Silk Robe' : 'Long-Sleeved Cotton Robe', wealthy ? 'silk' : 'cotton', wealthy ? '#5a4b63' : '#59645d');

  const headgear = scholar
    ? piece(period === 'ming' ? 'Black Scholar Cap' : 'Soft Official Cap', 'cloth', '#252522')
    : female
      ? piece('None', 'none')
      : choose([piece('Plain Cloth Cap', 'cloth', '#4b463d'), piece('None', 'none')], seed, 'china-head');

  return {
    contextPackId:
      period === 'early'
        ? 'china_early_imperial_200bce_600ce'
        : period === 'middle'
          ? 'china_tang_song_yuan_600_1368'
          : 'china_ming_1368_1650',
    garment,
    headgear,
    footwear: piece('Cloth Shoes', 'cloth', '#383631'),
    garmentKind: 'robe',
    headgearKind: headgear.name === 'None' ? 'none' : 'cap',
    palette:
      period === 'early'
        ? { primary: '#796654', secondary: '#9b8060', accent: '#704d45' }
        : period === 'middle'
          ? { primary: '#53675d', secondary: '#87765e', accent: '#8b5545' }
          : { primary: '#4f5f59', secondary: '#66566b', accent: '#8a5548' },
    confidence: 'high',
    rationale: 'Uses conservative cross-collared or long-sleeved robes, cloth footwear, and status-specific caps rather than generic pan-Asian costume.',
    references: [REFERENCES.songFigure, REFERENCES.mingRobe, REFERENCES.mingPortrait],
  };
};

const melanesiaLook = (
  character: PlayerCharacter,
  seed: number,
  earlyContact: boolean
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const christian = /christian/i.test(character.religion || '');
  const importedCloth = earlyContact && christian && stringHash(`${seed}|mission-cloth`) % 3 !== 0;
  const garment = importedCloth
    ? piece(
        female ? 'Plain Cotton Mission Garment' : 'Plain Cotton Work Shirt and Fibre Wrap',
        'imported cotton and plant fibre',
        '#8a765e'
      )
    : piece(
        female ? 'Barkcloth and Plant-Fibre Wrap' : 'Plant-Fibre or Barkcloth Wrap',
        'barkcloth and plant fibre',
        '#9a744e'
      );

  return {
    contextPackId: earlyContact ? 'melanesia_early_contact_1870_1930' : 'melanesia_indigenous_0_1870',
    garment,
    headgear: piece('None', 'none'),
    footwear: piece('Barefoot', 'none'),
    garmentKind: importedCloth ? 'work_shirt' : 'wrapped_garment',
    headgearKind: 'none',
    palette: importedCloth
      ? { primary: '#81705c', secondary: '#a18968', accent: '#6d5540' }
      : { primary: '#8d6949', secondary: '#ac8c61', accent: '#655342' },
    confidence: 'medium',
    rationale: earlyContact
      ? 'Uses local barkcloth or fibre dress with limited plain imported cloth; later tourist, military, and pan-Pacific fashions are excluded unless sourced.'
      : 'Uses deliberately broad barkcloth and plant-fibre forms because Melanesian dress was highly local and the app lacks community-level evidence.',
    references: [REFERENCES.melanesianBarkcloth, REFERENCES.pacificBarkclothResearch],
  };
};

const centralAsiaSovietLook = (
  character: PlayerCharacter,
  seed: number
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const officeWork = /(office|manager|clerk|administrator|teacher|engineer|account|secretar)/i.test(
    character.profession || ''
  );
  const working = isWorkingOccupation(character.profession || '');

  const garment = officeWork
    ? piece(
        female ? 'Wool Jacket with Plain Blouse' : 'Wool Suit Jacket and Collared Shirt',
        'wool and cotton',
        '#4c5660'
      )
    : piece(
        female ? 'Plain Wool Dress or Work Blouse' : working ? 'Wool Work Jacket and Shirt' : 'Wool Jacket and Shirt',
        'wool and cotton',
        '#625d53'
      );

  const headgear = officeWork
    ? piece('None', 'none')
    : choose(
        [
          piece('Plain Wool Cap', 'wool', '#4b4944'),
          piece('Fur Winter Hat', 'fur', '#4a4037'),
          piece('None', 'none'),
        ],
        seed,
        'central-asia-soviet-head'
      );

  return {
    contextPackId: 'central_asia_soviet_1917_1991',
    garment,
    headgear,
    footwear: piece(officeWork ? 'Leather Shoes' : 'Leather Boots', 'leather', '#3b302a'),
    garmentKind: female && !officeWork ? 'gown' : 'jacket',
    headgearKind: headgear.name === 'None' ? 'none' : 'cap',
    palette: {
      primary: officeWork ? '#46515b' : '#5d5a52',
      secondary: '#777165',
      accent: '#72604d',
    },
    confidence: 'medium',
    rationale: 'Uses restrained Soviet-era civilian work or office clothing while avoiding generic Chinese court dress and luxury headwear.',
    references: [REFERENCES.kazakhPortrait, REFERENCES.kazakhCoat],
  };
};

const mughalSouthAsiaLook = (
  character: PlayerCharacter,
  seed: number
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const wealthy = isWealthy(character);
  const working = isWorkingOccupation(character.profession || '');
  const garment = female
    ? piece(
        wealthy ? 'Fine Cotton Wrapped Garment and Blouse' : 'Plain Cotton Wrapped Garment and Blouse',
        'cotton',
        wealthy ? '#76545f' : '#8a7157'
      )
    : piece(
        wealthy ? 'Fine Cotton Jama with Sash' : working ? 'Plain Cotton Jama' : 'Cotton Jama with Sash',
        'cotton',
        wealthy ? '#596976' : '#83705a'
      );
  const headgear = female
    ? piece('Light Cotton Headcloth', 'cotton', '#b49a78')
    : choose(
        [
          piece(wealthy ? 'Wrapped Cotton Turban' : 'Plain Cotton Turban', 'cotton', '#a68a68'),
          piece('None', 'none'),
        ],
        seed,
        'mughal-head'
      );

  return {
    contextPackId: 'south_asia_mughal_1526_1800',
    garment,
    headgear,
    footwear: piece(working ? 'Simple Leather Sandals' : 'Leather Shoes', 'leather', '#5d4030'),
    garmentKind: female ? 'wrapped_garment' : 'robe',
    headgearKind: headgear.name === 'None' ? 'none' : 'wrapped_cloth',
    palette: wealthy
      ? { primary: '#6b5562', secondary: '#9b8064', accent: '#80614e' }
      : { primary: '#81705a', secondary: '#a28d70', accent: '#67584b' },
    confidence: female ? 'medium' : 'high',
    rationale: 'Uses cotton jama and wrapped-garment silhouettes with restrained status variation instead of turning every South Asian portrait into court dress.',
    references: [REFERENCES.mughalJama],
  };
};

const maritimeSoutheastAsiaLook = (
  character: PlayerCharacter,
  seed: number
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const working = isWorkingOccupation(character.profession || '');
  const jacket = stringHash(`${seed}|maritime-jacket`) % 3 !== 0;
  const garment = jacket
    ? piece(
        female ? 'Short Woven Cotton Jacket and Wrapped Cloth' : 'Woven Cotton Jacket and Wrapped Cloth',
        'cotton',
        '#6f6659'
      )
    : piece(
        female ? 'Wrapped Cotton Garment' : 'Plain Cotton Shirt and Wrapped Cloth',
        'cotton',
        '#877257'
      );

  return {
    contextPackId: 'maritime_southeast_asia_1750_1930',
    garment,
    headgear: piece('None', 'none'),
    footwear: piece(working ? 'Barefoot' : 'Simple Sandals', working ? 'none' : 'leather', '#5f4534'),
    garmentKind: jacket ? 'jacket' : 'wrapped_garment',
    headgearKind: 'none',
    palette: { primary: '#6d6558', secondary: '#8b775d', accent: '#715146' },
    confidence: 'medium',
    rationale: 'Uses woven cotton jackets, shirts, and wrapped cloth as a conservative maritime Southeast Asian profile; ceremonial regalia is excluded.',
    references: [REFERENCES.maritimeJacket],
  };
};

const mainlandSoutheastAsiaLook = (
  character: PlayerCharacter,
  seed: number
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const working = isWorkingOccupation(character.profession || '');
  const jacket = stringHash(`${seed}|mainland-jacket`) % 3 === 0;
  const garment = female
    ? piece(
        jacket ? 'Short Cotton Jacket and Wrapped Long Cloth' : 'Plain Cotton Blouse and Wrapped Long Cloth',
        'woven cotton',
        jacket ? '#68665d' : '#81715f'
      )
    : piece(
        jacket ? 'Cotton Jacket and Wrapped Lower Garment' : 'Plain Cotton Shirt and Wrapped Lower Garment',
        'woven cotton',
        jacket ? '#5e6762' : '#776b59'
      );

  return {
    contextPackId: 'mainland_southeast_asia_1000_1930',
    garment,
    headgear: piece('None', 'none'),
    footwear: piece(working ? 'Barefoot' : 'Simple Sandals', working ? 'none' : 'woven fibre', '#5d4635'),
    garmentKind: jacket ? 'jacket' : 'wrapped_garment',
    headgearKind: 'none',
    palette: { primary: '#706b5d', secondary: '#8b7962', accent: '#596b68' },
    confidence: 'medium',
    rationale: 'Uses conservative woven-cotton upper garments and wrapped lower cloth shared across many mainland Southeast Asian ordinary-person contexts; Indian court accessories and fantasy regalia are excluded.',
    references: [REFERENCES.maritimeJacket],
  };
};

const philippinesLook = (
  character: PlayerCharacter
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const working = isWorkingOccupation(character.profession || '');
  const garment = female
    ? piece('Plain Cotton Blouse and Woven Long Skirt', 'woven cotton', '#75695e')
    : piece('Collarless Cotton Shirt and Plain Lower Garment', 'woven cotton', '#6c7068');

  return {
    contextPackId: 'philippines_1500_1930',
    garment,
    headgear: piece('None', 'none'),
    footwear: piece(working ? 'Barefoot' : 'Simple Sandals', working ? 'none' : 'woven fibre', '#5f4938'),
    garmentKind: female ? 'gown' : 'work_shirt',
    headgearKind: 'none',
    palette: { primary: '#746b5e', secondary: '#8d7a63', accent: '#66746e' },
    confidence: 'medium',
    rationale: 'Uses a restrained ordinary-person cotton blouse or collarless shirt with a plain woven lower garment; elite colonial dress and generic South Asian accessories are excluded.',
    references: [REFERENCES.maritimeJacket],
  };
};

const indigenousAustraliaLook = (
  character: PlayerCharacter,
  earlyContact: boolean
): ResolvedPortraitLook => {
  const female = character.gender === 'Female';
  const importedCloth = earlyContact && /christian|mission|station|labor|labour|domestic/i.test(
    `${character.religion || ''} ${character.profession || ''}`
  );
  const garment = importedCloth
    ? piece(
        female ? 'Plain Cotton Work Dress' : 'Plain Cotton Work Shirt',
        'cotton',
        '#887762'
      )
    : piece(
        'Plant-Fibre Belt and Minimal Wrap',
        'plant fibre',
        '#927454'
      );

  return {
    contextPackId: earlyContact ? 'australia_contact_1788_1930' : 'australia_indigenous_4000bce_1788',
    garment,
    headgear: piece('None', 'none'),
    footwear: piece('Barefoot', 'none'),
    garmentKind: importedCloth ? (female ? 'gown' : 'work_shirt') : 'wrapped_garment',
    headgearKind: 'none',
    palette: importedCloth
      ? { primary: '#81715e', secondary: '#9a866b', accent: '#6c5a49' }
      : { primary: '#896b4e', secondary: '#a58660', accent: '#5f5143' },
    confidence: 'low',
    rationale: earlyContact
      ? 'Uses plain imported work clothing only where occupation or mission context supports it; otherwise it retains a conservative fibre-belt profile.'
      : 'Australian clothing practices varied greatly by community and climate; this intentionally low-specificity profile avoids pan-Pacific regalia and invented uniforms.',
    references: [REFERENCES.australianBelt],
  };
};

const resolveLook = (
  packId: PortraitContextPackId,
  character: PlayerCharacter
): ResolvedPortraitLook => {
  const seed = character.portraitSeed ?? stringHash(`${character.name}|${character.age}`);
  switch (packId) {
    case 'old_bailey_london_1674_1800':
      return oldBaileyLook(character, seed);
    case 'mediterranean_antiquity_500bce_500ce':
      return mediterraneanLook(character, seed);
    case 'sahel_early_0_700':
      return sahelLook(character, seed, false);
    case 'sahel_medieval_700_1600':
      return sahelLook(character, seed, true);
    case 'china_early_imperial_200bce_600ce':
      return chinaLook(character, seed, 'early');
    case 'china_tang_song_yuan_600_1368':
      return chinaLook(character, seed, 'middle');
    case 'china_ming_1368_1650':
      return chinaLook(character, seed, 'ming');
    case 'central_asia_soviet_1917_1991':
      return centralAsiaSovietLook(character, seed);
    case 'south_asia_mughal_1526_1800':
      return mughalSouthAsiaLook(character, seed);
    case 'mainland_southeast_asia_1000_1930':
      return mainlandSoutheastAsiaLook(character, seed);
    case 'maritime_southeast_asia_1750_1930':
      return maritimeSoutheastAsiaLook(character, seed);
    case 'philippines_1500_1930':
      return philippinesLook(character);
    case 'australia_indigenous_4000bce_1788':
      return indigenousAustraliaLook(character, false);
    case 'australia_contact_1788_1930':
      return indigenousAustraliaLook(character, true);
    case 'melanesia_indigenous_0_1870':
      return melanesiaLook(character, seed, false);
    case 'melanesia_early_contact_1870_1930':
      return melanesiaLook(character, seed, true);
  }
};

const PACK_IDENTITY: Record<
  PortraitContextPackId,
  Pick<PortraitIdentity, 'placeTrack' | 'periodTrack' | 'culturalTrack' | 'paletteFamily' | 'forbiddenTerms'>
> = {
  old_bailey_london_1674_1800: {
    placeTrack: 'London',
    periodTrack: 'later seventeenth to eighteenth century',
    culturalTrack: 'urban British',
    paletteFamily: 'smoke, wool, linen',
    forbiddenTerms: ['tiara', 'crown', 'ball gown', 'modern suit'],
  },
  mediterranean_antiquity_500bce_500ce: {
    placeTrack: 'Mediterranean',
    periodTrack: 'classical and late antiquity',
    culturalTrack: 'Mediterranean',
    paletteFamily: 'mineral earth and undyed fibre',
    forbiddenTerms: ['toga costume jewelry', 'medieval crown', 'modern shirt'],
  },
  sahel_early_0_700: {
    placeTrack: 'Sahel',
    periodTrack: 'early first millennium',
    culturalTrack: 'early Sahelian',
    paletteFamily: 'earth and woven fibre',
    forbiddenTerms: ['gele', 'modern boubou', 'European court dress'],
  },
  sahel_medieval_700_1600: {
    placeTrack: 'Sahel',
    periodTrack: 'medieval',
    culturalTrack: 'Sahelian',
    paletteFamily: 'indigo, earth, woven fibre',
    forbiddenTerms: ['modern wax print', 'European court dress'],
  },
  china_early_imperial_200bce_600ce: {
    placeTrack: 'China',
    periodTrack: 'early imperial',
    culturalTrack: 'Chinese',
    paletteFamily: 'hemp, muted silk, mineral dye',
    forbiddenTerms: ['qipao', 'Mao cap', 'modern suit'],
  },
  china_tang_song_yuan_600_1368: {
    placeTrack: 'China',
    periodTrack: 'Tang through Yuan',
    culturalTrack: 'Chinese',
    paletteFamily: 'woven robe, restrained dye',
    forbiddenTerms: ['qipao', 'Mao cap', 'modern suit'],
  },
  china_ming_1368_1650: {
    placeTrack: 'China',
    periodTrack: 'Ming',
    culturalTrack: 'Chinese',
    paletteFamily: 'cotton, silk, subdued court color',
    forbiddenTerms: ['qipao', 'Mao cap', 'modern suit'],
  },
  central_asia_soviet_1917_1991: {
    placeTrack: 'Central Asia',
    periodTrack: 'Soviet period',
    culturalTrack: 'Kazakh or Russian Central Asian',
    paletteFamily: 'wool, charcoal, navy, brown',
    forbiddenTerms: ['qipao', 'tiara', 'Chinese court robe', 'golden slippers'],
  },
  south_asia_mughal_1526_1800: {
    placeTrack: 'South Asia',
    periodTrack: 'Mughal and regional court period',
    culturalTrack: 'South Asian',
    paletteFamily: 'cotton, muted jewel and earth',
    forbiddenTerms: ['modern sari fashion', 'European ball gown', 'fantasy crown'],
  },
  mainland_southeast_asia_1000_1930: {
    placeTrack: 'Mainland Southeast Asia',
    periodTrack: 'medieval to early colonial period',
    culturalTrack: 'Vietnamese, Thai, Khmer, Burmese, or neighboring mainland tradition',
    paletteFamily: 'woven cotton, plant dye, muted earth',
    forbiddenTerms: ['tikka', 'ghoonghat', 'sari', 'jeweled hair', 'Victorian blouse', 'qipao', 'fantasy crown'],
  },
  maritime_southeast_asia_1750_1930: {
    placeTrack: 'Maritime Southeast Asia',
    periodTrack: 'late early-modern to colonial period',
    culturalTrack: 'maritime Southeast Asian',
    paletteFamily: 'woven cotton, bark and earth',
    forbiddenTerms: ['Chinese imperial robe', 'qipao', 'fantasy crown'],
  },
  philippines_1500_1930: {
    placeTrack: 'Philippines',
    periodTrack: 'early modern to colonial period',
    culturalTrack: 'lowland Philippine ordinary-person',
    paletteFamily: 'plain woven cotton and plant fibre',
    forbiddenTerms: ['tikka', 'ghoonghat', 'sari', 'qipao', 'fantasy crown'],
  },
  australia_indigenous_4000bce_1788: {
    placeTrack: 'Indigenous Australia',
    periodTrack: 'pre-contact',
    culturalTrack: 'Aboriginal Australian',
    paletteFamily: 'plant fibre, hide and earth',
    forbiddenTerms: ['Polynesian crown', 'war helmet', 'woven cape', 'modern shirt'],
  },
  australia_contact_1788_1930: {
    placeTrack: 'Indigenous Australia',
    periodTrack: 'contact and colonial period',
    culturalTrack: 'Aboriginal Australian',
    paletteFamily: 'earth and plain imported cloth',
    forbiddenTerms: ['Polynesian crown', 'war helmet', 'Aloha shirt', 'tourist dress'],
  },
  melanesia_indigenous_0_1870: {
    placeTrack: 'Melanesia',
    periodTrack: 'pre-contact and early encounter',
    culturalTrack: 'Melanesian',
    paletteFamily: 'barkcloth, plant fibre and earth',
    forbiddenTerms: ['Aloha shirt', 'pith helmet', 'pan-Pacific regalia'],
  },
  melanesia_early_contact_1870_1930: {
    placeTrack: 'Melanesia',
    periodTrack: 'early colonial contact',
    culturalTrack: 'Melanesian',
    paletteFamily: 'barkcloth and plain imported cotton',
    forbiddenTerms: ['Aloha shirt', 'tourist dress', 'generic military uniform'],
  },
};

const PACK_BACKGROUNDS: Record<
  PortraitContextPackId,
  NonNullable<PortraitVisualOverrides['background']>
> = {
  old_bailey_london_1674_1800: {
    base: '#9b9992',
    accent: '#7f827e',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'smoke, plaster, and muted urban interiors',
  },
  mediterranean_antiquity_500bce_500ce: {
    base: '#b7a37f',
    accent: '#95846d',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'warm stone and mineral earth',
  },
  sahel_early_0_700: {
    base: '#a88e6f',
    accent: '#7f765f',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'earth architecture and dry-season light',
  },
  sahel_medieval_700_1600: {
    base: '#9c8c70',
    accent: '#697166',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'earth architecture and indigo-toned cloth',
  },
  china_early_imperial_200bce_600ce: {
    base: '#9ca995',
    accent: '#7f897d',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'muted mineral and plant dyes',
  },
  china_tang_song_yuan_600_1368: {
    base: '#91a398',
    accent: '#75847b',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'soft celadon and woven cloth',
  },
  china_ming_1368_1650: {
    base: '#929b91',
    accent: '#746f78',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'restrained portrait-ground colors',
  },
  central_asia_soviet_1917_1991: {
    base: '#929b96',
    accent: '#707a78',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'cool studio gray and steppe green',
  },
  south_asia_mughal_1526_1800: {
    base: '#b39c7d',
    accent: '#817f73',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'sandstone, cotton, and muted vegetal color',
  },
  mainland_southeast_asia_1000_1930: {
    base: '#8f9f91',
    accent: '#747b6d',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'weathered timber, woven cotton, and humid vegetation',
  },
  maritime_southeast_asia_1750_1930: {
    base: '#8fa398',
    accent: '#747f70',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'humid vegetation and weathered woven cloth',
  },
  philippines_1500_1930: {
    base: '#94a298',
    accent: '#777d70',
    texture: 'subtle',
    vignette: true,
    sourceBasis: 'woven cloth, timber, and tropical shade',
  },
  australia_indigenous_4000bce_1788: {
    base: '#a79475',
    accent: '#788578',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'earth, fibre, and eucalyptus tones',
  },
  australia_contact_1788_1930: {
    base: '#9f9780',
    accent: '#79877e',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'earth and muted imported cloth',
  },
  melanesia_indigenous_0_1870: {
    base: '#8e9e8e',
    accent: '#706f61',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'plant fibre, barkcloth, and tropical shade',
  },
  melanesia_early_contact_1870_1930: {
    base: '#91998b',
    accent: '#746f66',
    texture: 'grain',
    vignette: true,
    sourceBasis: 'barkcloth, plain cotton, and tropical shade',
  },
};

export const resolvePortraitIdentity = (
  character: PlayerCharacter,
  context: PortraitAuthenticityContext
): PortraitIdentity | null => {
  const contextPackId = resolvePortraitContextPack(character, context);
  if (!contextPackId) return null;

  const visual = resolveLook(contextPackId, character);
  const metadata = PACK_IDENTITY[contextPackId];
  const profession = character.profession || '';

  return {
    contextPackId,
    ...metadata,
    occupationTrack: isScholarOccupation(profession)
      ? 'scholarly or administrative'
      : isWorkingOccupation(profession)
        ? 'manual or household work'
        : 'general civilian',
    statusTrack: isWealthy(character) ? 'high status' : character.wealthLevel === 'poor' ? 'poor' : 'ordinary',
    garmentFamily: visual.garmentKind,
    confidence: visual.confidence,
    visual,
  };
};

const itemText = (pieceValue?: ClothingPiece | null): string =>
  pieceValue ? `${pieceValue.name} ${pieceValue.material}`.toLowerCase() : '';

/**
 * Reports conflicts in the generator's uncorrected clothing input. The authenticity
 * overlay can then replace the visible equipment while the contact sheet keeps a
 * record of what was caught.
 */
export const auditPortraitCoherence = (
  character: PlayerCharacter,
  context: PortraitAuthenticityContext
): PortraitCoherenceAudit => {
  const identity = resolvePortraitIdentity(character, context);
  if (!identity) return { identity: null, issues: [] };

  const candidates = [
    ['head', character.equippedItems?.head || character.appearance.headgear],
    ['torso', character.equippedItems?.torso || character.appearance.garment],
    ['feet', character.equippedItems?.feet || character.appearance.footwear],
  ] as const;
  const issues: string[] = [];

  candidates.forEach(([slot, candidate]) => {
    const text = itemText(candidate);
    identity.forbiddenTerms.forEach(term => {
      if (text.includes(term.toLowerCase())) {
        issues.push(`${slot}: “${candidate?.name}” conflicts with ${identity.placeTrack} / ${identity.periodTrack}`);
      }
    });
  });

  return { identity, issues };
};

export const applyPortraitAuthenticity = (
  character: PlayerCharacter,
  context: PortraitAuthenticityContext
): PlayerCharacter => {
  const identity = resolvePortraitIdentity(character, context);
  if (!identity) return character;

  const look = identity.visual;
  const existing = character.portraitVisualOverrides;
  const safeMarkings = character.appearance.markings?.filter(marking => SAFE_MARKING_TYPES.has(marking.type));

  const packOverrides: PortraitVisualOverrides = {
    contextPackId: look.contextPackId,
    identity: {
      placeTrack: identity.placeTrack,
      periodTrack: identity.periodTrack,
      culturalTrack: identity.culturalTrack,
      occupationTrack: identity.occupationTrack,
      statusTrack: identity.statusTrack,
      garmentFamily: identity.garmentFamily,
      paletteFamily: identity.paletteFamily,
      confidence: identity.confidence,
      forbiddenTerms: identity.forbiddenTerms,
    },
    garment: look.garment,
    headgear: look.headgear,
    footwear: look.footwear,
    garmentKind: look.garmentKind,
    headgearKind: look.headgearKind,
    displayEquipment: {
      head: look.headgear,
      torso: look.garment,
      feet: look.footwear,
    },
    palette: look.palette,
    background: PACK_BACKGROUNDS[look.contextPackId],
    authenticity: {
      confidence: look.confidence,
      rationale: look.rationale,
      references: look.references,
    },
    notes: [`Historical portrait profile: ${look.contextPackId}.`],
  };

  return {
    ...character,
    appearance: {
      ...character.appearance,
      garment: existing?.garment || look.garment,
      headgear: existing?.headgear || look.headgear,
      footwear: existing?.footwear || look.footwear,
      palette: {
        ...character.appearance.palette,
        ...look.palette,
        ...existing?.palette,
      },
      markings: existing?.appearance?.markings || safeMarkings,
    },
    portraitVisualOverrides: {
      ...packOverrides,
      ...existing,
      appearance: {
        ...packOverrides.appearance,
        ...existing?.appearance,
      },
      displayEquipment: {
        ...packOverrides.displayEquipment,
        ...(existing?.headgear && !existing.displayEquipment?.head ? { head: existing.headgear } : {}),
        ...(existing?.garment && !existing.displayEquipment?.torso ? { torso: existing.garment } : {}),
        ...(existing?.footwear && !existing.displayEquipment?.feet ? { feet: existing.footwear } : {}),
        ...existing?.displayEquipment,
      },
      palette: {
        ...packOverrides.palette,
        ...existing?.palette,
      },
      notes: [...(packOverrides.notes || []), ...(existing?.notes || [])],
    },
  };
};
