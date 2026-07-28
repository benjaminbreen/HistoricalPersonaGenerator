/**
 * constants/characterData/deepTimeAmericanNames.ts
 *
 * Names for the Americas before any naming tradition is recoverable.
 *
 * Nothing survives. No personal name from the Palaeolithic or Archaic Americas
 * is recorded, and none can be reconstructed: the comparative method reaches
 * back a few thousand years at best, and the deep-time language groupings of
 * the hemisphere are themselves contested. Anything this file produces is a
 * placeholder, and the app says so on the card.
 *
 * That is not a licence to produce anything at all. The pool this replaces was
 * a flat list of English nouns — 'Raven', 'Dove', 'Star', 'Bear', and, worse,
 * 'Chief', 'Shaman' and 'Warrior', which are English words for offices rather
 * than names anyone bore. Two hundred draws returned about eighty distinct
 * names, so a class of thirty students met the same half-dozen foragers. It
 * also implied that Indigenous names are single nature words, which is a
 * nineteenth-century literary convention and not how any attested Indigenous
 * American naming system works.
 *
 * What the attested systems do share, across families as distant as Lakota,
 * Nahuatl, Zapotec and Quechua, is *structure*: a name is usually a small
 * phrase. Sitting Bull (Tȟatȟáŋka Íyotake) is a verb and a noun. Eight Deer
 * Jaguar Claw is a calendrical number, a day sign and a byname. So the
 * generator below builds phrases in a handful of attested shapes, out of
 * lexicons that differ by region, because a Beringian coastal forager and an
 * Amazonian one did not live among the same animals. That is a guess with the
 * right shape, which is the most that can honestly be offered.
 *
 * The English gloss is deliberate and consistent with the rest of the app: it
 * is a translation of a name, not a transliteration of one, and inventing
 * plausible-looking phonology would claim far more than a gloss does.
 */

export type DeepTimeAmericanRegion =
  | 'ARCTIC'
  | 'NORTHWEST_COAST'
  | 'GREAT_BASIN'
  | 'SOUTHWEST'
  | 'PLAINS'
  | 'EASTERN_WOODLANDS'
  | 'MESOAMERICA'
  | 'ANDES'
  | 'AMAZON'
  | 'SOUTHERN_CONE';

interface Lexicon {
  /** Animals a person here would be named for. */
  animals: string[];
  /** Weather, water, stone, plants — the rest of the visible world. */
  elements: string[];
}

const LEXICONS: Record<DeepTimeAmericanRegion, Lexicon> = {
  ARCTIC: {
    animals: ['Seal', 'Caribou', 'Walrus', 'Ptarmigan', 'Wolverine', 'Char', 'Snow Owl', 'Fox', 'Whale', 'Loon', 'Lemming', 'Bear'],
    elements: ['Ice', 'Drift Snow', 'Night Sky', 'Sea Fog', 'Open Water', 'Long Light', 'Wind Crust', 'Blue Ice', 'Tide Crack', 'Cold Sun'],
  },
  NORTHWEST_COAST: {
    animals: ['Salmon', 'Raven', 'Orca', 'Halibut', 'Sea Otter', 'Heron', 'Black Bear', 'Eagle', 'Seal', 'Elk', 'Cormorant', 'Frog'],
    elements: ['Cedar', 'Fog', 'High Tide', 'Rain', 'Driftwood', 'Slack Water', 'River Mouth', 'Standing Stone', 'Green Water', 'Winter Rain'],
  },
  GREAT_BASIN: {
    animals: ['Coyote', 'Jackrabbit', 'Quail', 'Antelope', 'Bighorn', 'Rattlesnake', 'Kangaroo Rat', 'Hawk', 'Badger', 'Marmot', 'Chuckwalla'],
    elements: ['Obsidian', 'Hot Spring', 'Salt Flat', 'Pinyon', 'Sagebrush', 'Dry Wash', 'Dust', 'Alkali', 'Shade Rock', 'Standing Water'],
  },
  SOUTHWEST: {
    animals: ['Roadrunner', 'Rattlesnake', 'Jackrabbit', 'Mule Deer', 'Turkey', 'Raven', 'Kit Fox', 'Horned Lizard', 'Bat', 'Peccary'],
    elements: ['Mesa', 'Juniper', 'Thunder', 'Red Rock', 'Flash Flood', 'Cliff Shade', 'Dry Wind', 'Yucca', 'Canyon Mouth', 'Hail'],
  },
  PLAINS: {
    animals: ['Bison', 'Elk', 'Pronghorn', 'Prairie Dog', 'Grey Wolf', 'Golden Eagle', 'Badger', 'Crane', 'Meadowlark', 'Bull Snake'],
    elements: ['Hail', 'Grass Fire', 'Far Thunder', 'Tall Grass', 'Cut Bank', 'Dust Cloud', 'North Wind', 'Cottonwood', 'Deep Snow', 'Red Sky'],
  },
  EASTERN_WOODLANDS: {
    animals: ['Deer', 'Turkey', 'Beaver', 'Black Bear', 'Otter', 'Wood Duck', 'Bobcat', 'Crow', 'Snapping Turtle', 'Whitefish', 'Passenger Pigeon'],
    elements: ['Sycamore', 'River Cane', 'Thunder', 'Birch Bark', 'Still Water', 'Falling Leaf', 'Marsh Light', 'White Pine', 'Ford', 'Ice Break'],
  },
  MESOAMERICA: {
    animals: ['Jaguar', 'Quetzal', 'Howler Monkey', 'Deer', 'Macaw', 'Coati', 'Crocodile', 'Hummingbird', 'Bat', 'Serpent', 'Peccary'],
    elements: ['Obsidian', 'Rain', 'Cave Mouth', 'Green Stone', 'Smoke', 'Cloud Forest', 'Standing Water', 'Ash', 'Flint', 'Morning Star'],
  },
  ANDES: {
    animals: ['Condor', 'Puma', 'Vicuña', 'Guanaco', 'Viscacha', 'Fox', 'Hummingbird', 'Toad', 'Flamingo', 'Deer', 'Chinchilla'],
    elements: ['Hail', 'Salt', 'Cloud', 'High Snow', 'Spring Water', 'Cut Stone', 'Thin Air', 'Frost', 'Red Earth', 'Rockfall'],
  },
  AMAZON: {
    animals: ['Jaguar', 'Macaw', 'Anaconda', 'Tapir', 'Capybara', 'Howler Monkey', 'Caiman', 'Harpy Eagle', 'Peccary', 'Pirarucu', 'Sloth', 'Toucan'],
    elements: ['High Water', 'Black River', 'Palm', 'Night Rain', 'Fallen Tree', 'Riverbank', 'Termite Mound', 'Forest Gap', 'Flood', 'Root Water'],
  },
  SOUTHERN_CONE: {
    animals: ['Guanaco', 'Rhea', 'Fox', 'Puma', 'Armadillo', 'Cormorant', 'Sea Lion', 'Condor', 'Mussel', 'Petrel'],
    elements: ['West Wind', 'Ice Field', 'Shell Heap', 'Grey Sea', 'Sleet', 'Low Scrub', 'Stone Shore', 'Long Beach', 'Squall', 'Cold Rain'],
  },
};

/**
 * Participles. A name of this shape reports something the bearer was seen
 * doing, which is the commonest attested pattern across the hemisphere.
 */
const ACTIONS = [
  'Sitting', 'Standing', 'Running', 'Walking', 'Watching', 'Calling', 'Turning',
  'Swimming', 'Circling', 'Rising', 'Waiting', 'Following', 'Crossing',
  'Digging', 'Climbing', 'Listening', 'Returning', 'Sleeping', 'Diving',
  'Chasing', 'Carrying', 'Leaping', 'Drifting', 'Gathering', 'Hiding',
];

/** Plain modifiers, for the animal-and-attribute shape. */
const QUALITIES = [
  'Grey', 'Black', 'White', 'Spotted', 'Broken', 'Lame', 'Young', 'Old',
  'Two', 'Many', 'Lone', 'Quiet', 'Loud', 'Swift', 'Slow', 'Thin', 'Heavy',
  'Bent', 'Bright', 'Dark', 'Small', 'Great', 'Half', 'Wet', 'Blind',
];

/**
 * The subset that can modify weather or stone. The rest describe a body, and
 * produce nonsense against an element: "Blind Thin Air", "Lame Obsidian".
 */
const ELEMENT_QUALITIES = [
  'Grey', 'Black', 'White', 'Broken', 'Two', 'Many', 'Lone', 'Quiet', 'Swift',
  'Slow', 'Thin', 'Bright', 'Dark', 'Small', 'Great', 'Half', 'Deep', 'First',
  'Late', 'Long', 'Red', 'Cold', 'Still',
];

/** Where something was, for the locative shape. */
const PLACES = [
  'the Ford', 'the Ridge', 'the Bend', 'the Shallows', 'the Cliff', 'the Marsh',
  'the Far Camp', 'the Burned Ground', 'the Spring', 'the Narrows',
  'the High Rocks', 'the Old Trail', 'the Cave', 'the River Mouth',
  'the Deep Wood', 'the Dry Bed', 'the Wide Water', 'the Ash Hill',
];

/** Landscape features some regions do not have. */
const ABSENT_PLACES: Partial<Record<DeepTimeAmericanRegion, RegExp>> = {
  ARCTIC: /Deep Wood|Burned Ground|Dry Bed|Ash Hill|Marsh/,
  SOUTHWEST: /Deep Wood|Marsh/,
  GREAT_BASIN: /Deep Wood/,
  AMAZON: /Dry Bed|Ash Hill|High Rocks/,
};

const placesFor = (zone: DeepTimeAmericanRegion): string[] => {
  const absent = ABSENT_PLACES[zone];
  return absent ? PLACES.filter(place => !absent.test(place)) : PLACES;
};

/** What happened when the bearer was born, or once afterwards. */
const EVENTS = [
  'Born in Snow', 'Born in Flood', 'Born on the Trail', 'Born at Dawn',
  'Born in the Hunger', 'Found at the Ford', 'Came Back Late', 'Went Alone',
  'Lost the Path', 'Slept in the Storm', 'Walked the Ice', 'Swam the Flood',
  'Spoke Late', 'Cried Little', 'Held the Fire', 'Carried the Water',
];

/**
 * Mesoamerican calendar names: a number from one to thirteen and a day sign.
 * This is a real and well-documented naming system — Zapotec, Mixtec and Maya
 * people were routinely named for their day of birth in the 260-day count, and
 * Eight Deer and Six Monkey are the names history actually knows them by. The
 * 260-day count is attested from around 600 BCE, so it is not extended back
 * into the deep Palaeolithic here.
 */
const NUMERALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen'];
const DAY_SIGNS = [
  'Crocodile', 'Wind', 'House', 'Lizard', 'Serpent', 'Death', 'Deer', 'Rabbit',
  'Water', 'Dog', 'Monkey', 'Grass', 'Reed', 'Jaguar', 'Eagle', 'Vulture',
  'Movement', 'Flint', 'Rain', 'Flower',
];

const CALENDAR_FROM = -600;

/** Which lexicon a place belongs to. */
export function deepTimeAmericanRegion(region: string, location = ''): DeepTimeAmericanRegion {
  const place = `${region} ${location}`.toLowerCase();
  if (/arctic|subarctic|alaska|yukon|baffin|labrador|greenland|aleut|beringia|inuit|thule|tundra/.test(place)) return 'ARCTIC';
  if (/pacific coast|northwest|columbia|puget|salish|cascad|fraser|haida|olympic|vancouver/.test(place)) return 'NORTHWEST_COAST';
  if (/great basin|nevada|utah|sierra nevada|mojave|california|central valley/.test(place)) return 'GREAT_BASIN';
  if (/southwest|puebloan|sonora|arizona|new mexico|colorado plateau|rio grande|chihuahua/.test(place)) return 'SOUTHWEST';
  if (/plains|prairie|dakota|nebraska|missouri river|platte|llano/.test(place)) return 'PLAINS';
  if (/woodland|mississippi|ohio|great lakes|northeast|atlantic coast|seaboard|southeast|appalach|florida/.test(place)) return 'EASTERN_WOODLANDS';
  if (/mexico|maya|yucatan|oaxaca|guatemala|chiapas|central highlands|belize|honduras|mesoameric|isthmus/.test(place)) return 'MESOAMERICA';
  if (/andes|altiplano|titicaca|peru|bolivia|cusco|cuzco|quito|ecuador|atacama|potosi|sierra|highland/.test(place)) return 'ANDES';
  if (/amazon|orinoco|xingu|rio negro|ucayali|mato grosso|guiana|rainforest|llanos|tapajos|madeira|basin/.test(place)) return 'AMAZON';
  if (/patagonia|tierra del fuego|fuegian|magellan|pampas|chaco|parana|plata|chile|araucan|mapuche|valdivia|southern cone/.test(place)) return 'SOUTHERN_CONE';
  // Unplaced North American ground is more often woodland or plain than not.
  return 'EASTERN_WOODLANDS';
}

const pick = <T,>(list: T[], random: () => number): T => list[Math.floor(random() * list.length)];

export interface DeepTimeAmericanNameInput {
  region: string;
  location?: string;
  year: number;
  random: () => number;
}

/**
 * One name, as a phrase. Roughly a third of draws are the verb-and-noun shape,
 * the rest spread across attribute, locative, event and — where and when the
 * count existed — calendrical names, so a class of thirty students meets thirty
 * different people.
 */
export function generateDeepTimeAmericanName(input: DeepTimeAmericanNameInput): string {
  const { year, random } = input;
  const zone = deepTimeAmericanRegion(input.region, input.location);
  const lex = LEXICONS[zone];

  // Animals take the verb and the locative slots, because those describe a
  // creature doing something somewhere: "Calling Hot Spring" and "Dust of the
  // Cliff" are not names. Elements belong with a plain modifier — "Grey Rain",
  // "Deep Snow" — and are drawn only there.
  const animal = () => pick(lex.animals, random);
  const modified = () => (random() < 0.55
    ? `${pick(QUALITIES, random)} ${animal()}`
    : `${pick(ELEMENT_QUALITIES, random)} ${pick(lex.elements, random)}`);

  const calendrical = zone === 'MESOAMERICA' && year >= CALENDAR_FROM;
  const roll = random();

  if (calendrical && roll < 0.35) {
    const day = `${pick(NUMERALS, random)} ${pick(DAY_SIGNS, random)}`;
    // A day name and a byname together, as Eight Deer Jaguar Claw carried both.
    return random() < 0.3 ? `${day} ${pick(QUALITIES, random)} ${animal()}` : day;
  }

  if (roll < 0.35) return `${pick(ACTIONS, random)} ${animal()}`;
  if (roll < 0.60) return modified();
  if (roll < 0.75) return `${pick(ACTIONS, random)} at ${pick(placesFor(zone), random)}`;
  if (roll < 0.88) return pick(EVENTS, random);
  // Two-element names: a person named for one thing in relation to another.
  return `${animal()} of ${pick(placesFor(zone), random)}`;
}
