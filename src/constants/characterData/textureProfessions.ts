/**
 * constants/characterData/textureProfessions.ts
 *
 * The distinctive tail.
 *
 * `commonProfessions.ts` supplies the substrate — the farming, carrying,
 * washing and building that most people in most places did — and it exists
 * because the zone tables had been written by asking what was *interesting*
 * about a time and place, which produced a labour market composed entirely of
 * its own exceptions. This file is the opposite correction, and it is needed
 * for the opposite reason: once the substrate is weighted to its historical
 * share, the interesting work becomes unreachable.
 *
 * The arithmetic, before this file existed: a ploughman in Roman Italy carried
 * a selection weight of 134 and a legionary carried 1. Adding roles could not
 * fix that. Two hundred new Roman occupations would have divided the same
 * fraction of a per cent between them, and the player would have gone on
 * seeing hunters and fishers — which is what they did see, hunting being
 * nineteen per cent of the city of Rome.
 *
 * So these roles do not compete on individual weight. They share a fixed
 * budget of the draw — see `textureBudget`, a tenth in the countryside and
 * closer to a third in a city — divided among however many of them this place
 * and year can support. That decouples the two things that were fighting:
 * how *often* something unusual appears is the budget, and how *many* unusual
 * things exist is this file. Twenty texture roles and two hundred produce the
 * same peasant share; the second just repeats itself far less.
 *
 * **What belongs here.** Work that was real, specific, and a living for
 * somebody: the Roman dormouse fattener, the Cairo ice seller, the London
 * pure-finder collecting dog dung for the tanneries. Not the singular offices
 * — there was one Pharaoh and six Vestals, and an even split would make them
 * common. Those stay in the zone tables, where `getProfessionSelectionWeight`
 * damps them to near nothing.
 *
 * **What keeps it honest.** The same capability gates the substrate uses, plus
 * locale and a place pattern. A pearl diver needs a coast, a muezzin needs
 * Islam's arrival, a mudlark needs a city with a tidal river and a nineteenth
 * century to be poor in.
 */

import { HistoricalEra } from '../../types';
import { hasCapability, type CapabilityContext, type SocietyCapability } from '../societyCapabilities';
import type { CulturalZone, ProfessionDefinition, RoleMap } from './professions';

type Locale = 'rural' | 'town' | 'city' | 'mobile' | 'unknown';

export type TextureContext = CapabilityContext & { localeType?: Locale };

interface Opts {
  /** Only in these kinds of place. Omitted means anywhere. */
  where?: Locale[];
  needs?: SocietyCapability[];
  needsAny?: SocietyCapability[];
  excludes?: SocietyCapability[];
  gender?: 'Male' | 'Female';
  /** [minPrivilege, maxPrivilege]. */
  priv?: [number, number];
  /** [firstYear, lastYear], checked downstream as `decadeRange`. */
  years?: [number, number];
  /** Region and location must match. For work bound to a corner of a zone. */
  place?: RegExp;
  stats?: ProfessionDefinition['statRequirements'];
}

interface TextureRole extends Opts {
  role: string;
  emoji: string;
}

const t = (role: string, emoji: string, o: Opts = {}): TextureRole => ({ role, emoji, ...o });

/* Shorthands for the gates that recur. */
const URBAN: Locale[] = ['city', 'town'];
const CITY: Locale[] = ['city'];
const COUNTRY: Locale[] = ['rural', 'mobile'];
const COAST = /\b(?:coast|bay|sea|ocean|island|isle|gulf|delta|estuary|harbou?r|port|shore|fjord|sound|strait|lagoon|atoll|archipelago|maritime|reef)\b/i;

/* ======================================================================== */
/*  EUROPEAN                                                                */
/* ======================================================================== */

const EUROPEAN_ANTIQUITY: TextureRole[] = [
  // The city of Rome and its like: a million people, and the density that lets
  // a man live by fattening dormice.
  t('Dormouse Fattener', '🐭', { where: URBAN }),
  t('Snail Farmer', '🐌'),
  t('Goose Tender', '🪿', { where: COUNTRY }),
  t('Sausage Seller', '🌭', { where: URBAN, needs: ['market_exchange'] }),
  t('Tavern Cook', '🍲', { where: URBAN, needs: ['urban_settlement'] }),
  t('Bath Attendant', '🛁', { where: URBAN, needs: ['urban_settlement'] }),
  t('Bath Stoker', '🔥', { where: URBAN, needs: ['urban_settlement'], gender: 'Male' }),
  t('Sewer Cleaner', '🪠', { where: CITY, needs: ['urban_settlement'], gender: 'Male' }),
  t('Urine Collector', '🪣', { where: URBAN, needs: ['urban_settlement'] }),
  t('Perfumer', '🌹', { where: URBAN, needs: ['market_exchange'] }),
  t('Mosaicist', '🎨', { where: URBAN, needs: ['urban_settlement'] }),
  t('Fresco Painter', '🖌️', { where: URBAN, needs: ['urban_settlement'] }),
  t('Amphora Maker', '🏺'),
  t('Lead Pipe Maker', '🔧', { where: URBAN, needs: ['metallurgy', 'urban_settlement'] }),
  t('Vine Grafter', '🍇', { where: COUNTRY }),
  t('Garum Maker', '🐟', { place: COAST }),
  t('Salt Fish Dealer', '🧂', { needs: ['market_exchange'] }),
  t('Gladiator', '⚔️', { where: URBAN, gender: 'Male', priv: [0, 0.4], stats: { minStrength: 6, minConstitution: 6 } }),
  t('Charioteer', '🏇', { where: CITY, gender: 'Male', stats: { minDexterity: 6 } }),
  t('Beast Handler', '🦁', { where: CITY, gender: 'Male' }),
  t('Mime Actor', '🎭', { where: URBAN }),
  t('Flute Player', '🪈', { where: URBAN }),
  t('Acrobat', '🤸', { where: URBAN, stats: { minDexterity: 6 } }),
  t('Professional Mourner', '😢', { gender: 'Female' }),
  t('Undertaker', '⚰️', { where: URBAN }),
  t('Funeral Musician', '🎺', { where: URBAN }),
  t('Priestess of Juno', '🏛️', { where: URBAN, gender: 'Female', priv: [0.35, 1] }),
  t('Temple Attendant', '🛕', { where: URBAN }),
  t('Haruspex', '🐑', { priv: [0.3, 1] }),
  t('Astrologer', '🔮', { where: URBAN }),
  t('Dream Interpreter', '💤', { where: URBAN }),
  t('Pedagogue', '📚', { where: URBAN, needs: ['writing'], priv: [0, 0.5] }),
  t('Copyist', '🖋️', { where: URBAN, needs: ['writing'] }),
  t('Shorthand Writer', '✍️', { where: URBAN, needs: ['writing'] }),
  t('Mule Doctor', '🐴', { needs: ['draft_animals'] }),
  t('Huntsman', '🏹', { where: COUNTRY, gender: 'Male' }),
  t('Fowler', '🦆', { where: COUNTRY }),
  t('Dice Sharper', '🎲', { where: URBAN, stats: { minCraftiness: 6 } }),
  t('Prostitute', '🌹', { where: URBAN, priv: [0, 0.3] }),
  t('Wool Comber', '🐑'),
  t('Litter Bearer', '🛏️', { where: CITY, gender: 'Male', stats: { minStrength: 6 } }),
];

const EUROPEAN_MEDIEVAL: TextureRole[] = [
  t('Illuminator', '🖌️', { needs: ['writing'], where: URBAN }),
  t('Parchment Maker', '📜', { needs: ['writing'] }),
  t('Scrivener', '✍️', { needs: ['writing'], where: URBAN }),
  t('Pardoner', '📜', { where: URBAN }),
  t('Pilgrim Badge Maker', '🐚', { where: URBAN, needs: ['market_exchange'] }),
  t('Relic Pedlar', '⛪', { needs: ['market_exchange'] }),
  t('Bell Founder', '🔔', { needs: ['metallurgy'], where: URBAN }),
  t('Stained Glass Maker', '🪟', { where: URBAN }),
  t('Wax Chandler', '🕯️', { where: URBAN }),
  t('Bowyer', '🏹'),
  t('Fletcher', '🪶'),
  t('Armourer', '🛡️', { needs: ['metallurgy'], where: URBAN, gender: 'Male' }),
  t('Falconer', '🦅', { where: COUNTRY, priv: [0.3, 1] }),
  t('Warrener', '🐇', { where: COUNTRY }),
  t('Huntsman', '🏹', { where: COUNTRY, gender: 'Male' }),
  t('Swanherd', '🦢', { where: COUNTRY }),
  t('Dovecote Keeper', '🕊️', { where: COUNTRY }),
  t('Hayward', '🌾', { where: COUNTRY, gender: 'Male' }),
  t('Ale Conner', '🍺', { where: URBAN, needs: ['market_exchange'] }),
  t('Bathhouse Keeper', '🛁', { where: URBAN, needs: ['urban_settlement'] }),
  t('Barber-Surgeon', '💈', { where: URBAN }),
  t('Apothecary', '⚗️', { where: URBAN, needs: ['market_exchange'] }),
  t('Bonesetter', '🦴'),
  t('Leech Gatherer', '🪱', { where: COUNTRY }),
  t('Ratcatcher', '🐀', { where: URBAN }),
  t('Gong Farmer', '💩', { where: CITY, gender: 'Male' }),
  t('Town Crier', '📢', { where: URBAN, gender: 'Male' }),
  t('Jester', '🃏', { where: URBAN }),
  t('Minstrel', '🎻'),
  t('Bear Ward', '🐻', { where: URBAN, gender: 'Male' }),
  t('Woad Grower', '🌿', { where: COUNTRY }),
  t('Saffron Grower', '🌸', { where: COUNTRY }),
  t('Salt Panner', '🧂', { place: COAST }),
  t('Shipwright', '⚓', { place: COAST, gender: 'Male' }),
  t('Beguine', '🙏', { where: URBAN, gender: 'Female' }),
  t('Anchoress', '⛪', { gender: 'Female', priv: [0.2, 1] }),
  t('Lay Brother', '🙏', { gender: 'Male' }),
  t('Limner', '🎨', { where: URBAN }),
  t('Girdler', '👝', { where: URBAN }),
  t('Horner', '🐮', { where: URBAN }),
];

const EUROPEAN_EARLY_MODERN: TextureRole[] = [
  t("Printer's Devil", '🖨️', { where: URBAN, years: [1460, 1900] }),
  t('Typefounder', '🔡', { where: URBAN, years: [1460, 1900] }),
  t('Bookbinder', '📚', { where: URBAN, needs: ['writing'] }),
  t('Engraver', '🖇️', { where: URBAN }),
  t('Broadside Hawker', '📰', { where: URBAN, years: [1500, 1900] }),
  t('Ballad Singer', '🎶', { where: URBAN }),
  t('Mountebank', '🎪', { where: URBAN }),
  t('Rope Dancer', '🤸', { where: URBAN, stats: { minDexterity: 6 } }),
  t('Fencing Master', '🤺', { where: URBAN, gender: 'Male', priv: [0.3, 1] }),
  t('Dancing Master', '💃', { where: URBAN, priv: [0.3, 1] }),
  t('Lacemaker', '🪡', { gender: 'Female' }),
  t('Ribbon Weaver', '🎀', { where: URBAN }),
  t('Stay Maker', '👗', { where: URBAN }),
  t('Milliner', '👒', { where: URBAN, gender: 'Female' }),
  t('Wig Maker', '💇', { where: URBAN, years: [1620, 1820] }),
  t('Pin Maker', '📌', { where: URBAN }),
  t('Button Maker', '🔘', { where: URBAN }),
  t('Glass Blower', '🫧', { where: URBAN }),
  t('Clockmaker', '⏱️', { where: URBAN, years: [1500, 2029] }),
  t('Instrument Maker', '🎻', { where: URBAN }),
  t('Powder Miller', '💥', { years: [1400, 1900], gender: 'Male' }),
  t('Cannon Founder', '💣', { needs: ['metallurgy'], where: URBAN, years: [1400, 1850], gender: 'Male' }),
  t('Coffee House Keeper', '☕', { where: CITY, years: [1650, 1900] }),
  t('Tobacco Twister', '🚬', { where: URBAN, years: [1590, 1900] }),
  t('Sugar Baker', '🍬', { where: URBAN, years: [1550, 1900] }),
  t('Snuff Grinder', '🤧', { where: URBAN, years: [1650, 1900] }),
  t('Plague Searcher', '🔍', { where: URBAN, gender: 'Female', years: [1500, 1720] }),
  t('Bellman', '🔔', { where: URBAN, gender: 'Male' }),
  t('Link Boy', '🕯️', { where: CITY, gender: 'Male', priv: [0, 0.25] }),
  t('Sedan Chairman', '🪑', { where: CITY, gender: 'Male', years: [1620, 1830] }),
  t('Waterman', '⛵', { where: CITY, gender: 'Male' }),
  t('Privateer', '🏴‍☠️', { place: COAST, gender: 'Male', years: [1550, 1815] }),
  t('Whalebone Cutter', '🐋', { place: COAST, years: [1600, 1900] }),
  t('Almanac Compiler', '📅', { where: URBAN, needs: ['writing'], years: [1500, 1900] }),
  t('Astrologer', '🔮', { where: URBAN }),
  t('Ratcatcher', '🐀', { where: URBAN }),
  t('Chimney Sweep', '🧹', { where: URBAN, gender: 'Male' }),
  t('Undertaker', '⚰️', { where: URBAN }),
  t('Tulip Dealer', '🌷', { where: URBAN, years: [1600, 1650], place: /\b(?:holland|netherlands|amsterdam|haarlem|low countries|flanders)\b/i }),
];

const EUROPEAN_INDUSTRIAL: TextureRole[] = [
  // Mayhew's London, mostly, and its equivalents. Nearly all of these are
  // occupations he found people actually living by in the 1850s.
  t('Pure Finder', '💩', { where: CITY, priv: [0, 0.2] }),
  t('Tosher', '🪣', { where: CITY, gender: 'Male', priv: [0, 0.2] }),
  t('Mudlark', '🥾', { where: CITY, priv: [0, 0.15] }),
  t('Bone Grubber', '🦴', { where: CITY, priv: [0, 0.2] }),
  t('Rag and Bone Man', '♻️', { where: URBAN, gender: 'Male' }),
  t("Cats' Meat Man", '🐈', { where: CITY }),
  t('Crossing Sweeper', '🧹', { where: CITY, priv: [0, 0.25] }),
  t('Ratcatcher', '🐀', { where: URBAN }),
  t('Knocker-Up', '⏰', { where: URBAN, years: [1800, 1940] }),
  t('Lamplighter', '🪔', { where: URBAN, years: [1800, 1930], gender: 'Male' }),
  t('Sweet Shop Keeper', '🍬', { where: URBAN, needs: ['market_exchange'] }),
  t('Muffin Man', '🧁', { where: CITY, gender: 'Male' }),
  t('Pieman', '🥧', { where: URBAN }),
  t('Watercress Seller', '🥬', { where: CITY, gender: 'Female', priv: [0, 0.25] }),
  t('Oyster Seller', '🦪', { where: URBAN }),
  t('Eel Seller', '🐟', { where: CITY }),
  t('Flower Girl', '💐', { where: CITY, gender: 'Female', priv: [0, 0.3] }),
  t('Match Girl', '🔥', { where: CITY, gender: 'Female', priv: [0, 0.2], years: [1830, 1910] }),
  t('Bird Catcher', '🐦', { where: URBAN }),
  t('Organ Grinder', '🎹', { where: CITY, years: [1800, 1930] }),
  t('Punch and Judy Man', '🎭', { where: URBAN, gender: 'Male' }),
  t('Street Acrobat', '🤸', { where: CITY, stats: { minDexterity: 6 } }),
  t('Music Hall Singer', '🎤', { where: CITY, years: [1850, 1930] }),
  t("Undertaker's Mute", '⚰️', { where: URBAN, gender: 'Male', years: [1800, 1900] }),
  t('Pawnbroker', '💰', { where: URBAN, needs: ['market_exchange'] }),
  t('Bookmaker', '🎲', { where: URBAN, gender: 'Male' }),
  t('Beadle', '🎩', { where: URBAN, gender: 'Male' }),
  t('Workhouse Nurse', '🏥', { where: URBAN, gender: 'Female', years: [1830, 1930] }),
  t('Gasworks Stoker', '🔥', { where: URBAN, gender: 'Male', years: [1815, 1960] }),
  t('Telegraph Boy', '📩', { where: URBAN, gender: 'Male', years: [1845, 1930] }),
  t('Compositor', '🖨️', { where: URBAN }),
  t("Photographer's Assistant", '📷', { where: URBAN, years: [1845, 1929] }),
  t('Sandwich Board Man', '🪧', { where: CITY, gender: 'Male', priv: [0, 0.25] }),
  t('Bootblack', '👞', { where: CITY, priv: [0, 0.3] }),
  t('Newsboy', '📰', { where: CITY, gender: 'Male', priv: [0, 0.3], years: [1820, 1950] }),
  t('Shipbreaker', '⚓', { place: COAST, gender: 'Male' }),
  t('Lighthouse Keeper', '🗼', { place: COAST, years: [1750, 2029] }),
  t('Ice Cutter', '🧊', { where: COUNTRY, years: [1800, 1920] }),
  t('Osier Cutter', '🧺', { where: COUNTRY }),
  t('Peat Cutter', '🟫', { where: COUNTRY }),
];

const EUROPEAN_MODERN: TextureRole[] = [
  t('Cinema Projectionist', '🎞️', { where: URBAN, years: [1905, 1999] }),
  t('Milkman', '🥛', { years: [1900, 2000], gender: 'Male' }),
  t('Ice Cream Vendor', '🍦', { where: URBAN }),
  t('Chip Shop Owner', '🍟', { where: URBAN, years: [1900, 2029] }),
  t('Pub Landlord', '🍺', { where: URBAN }),
  t('Bingo Caller', '🎱', { where: URBAN, years: [1960, 2029] }),
  t('Bouncer', '🚪', { where: CITY, gender: 'Male', years: [1950, 2029], stats: { minStrength: 6 } }),
  t('Busker', '🎸', { where: CITY }),
  t('Tattooist', '🖋️', { where: CITY, years: [1900, 2029] }),
  t('Piano Tuner', '🎹', { where: URBAN }),
  t('Locksmith', '🔑', { where: URBAN }),
  t('Watch Repairer', '⌚', { where: URBAN }),
  t('Sign Painter', '🪧', { where: URBAN }),
  t('Window Cleaner', '🪟', { where: URBAN, gender: 'Male' }),
  t('Scaffolder', '🏗️', { where: URBAN, gender: 'Male', stats: { minStrength: 5 } }),
  t('Fishmonger', '🐟', { where: URBAN }),
  t('Greengrocer', '🥕', { where: URBAN }),
  t('Undertaker', '⚰️'),
  t('Zookeeper', '🦓', { where: CITY, years: [1900, 2029] }),
  t('Lighthouse Keeper', '🗼', { place: COAST, years: [1900, 1990] }),
  t('Coastguard', '⚓', { place: COAST, years: [1900, 2029] }),
  t('Postman', '📮', { years: [1900, 2029] }),
  t('Lollipop Lady', '🚸', { where: URBAN, gender: 'Female', years: [1953, 2029] }),
  t('Football Coach', '⚽', { where: URBAN, years: [1900, 2029] }),
  t('Roadie', '🎤', { where: CITY, years: [1965, 2029] }),
  t('Ski Instructor', '⛷️', { years: [1930, 2029], place: /\b(?:alp|alps|tyrol|dolomite|pyrenee|mountain|highland)\w*\b/i }),
];

/* ======================================================================== */
/*  MENA                                                                    */
/* ======================================================================== */

const MENA_ANTIQUITY: TextureRole[] = [
  t('Embalmer', '⚱️', { gender: 'Male' }),
  t('Natron Gatherer', '🧂'),
  t('Necropolis Guard', '🗿', { gender: 'Male' }),
  t('Tomb Painter', '🖌️', { needs: ['writing'] }),
  t('Papyrus Maker', '📜', { needs: ['writing'] }),
  t('Faience Maker', '🔵', { where: URBAN }),
  t('Bead Driller', '📿'),
  t('Kohl Grinder', '👁️', { where: URBAN }),
  t('Perfume Maker', '🌹', { where: URBAN, needs: ['market_exchange'] }),
  t('Temple Singer', '🎶', { gender: 'Female', priv: [0.25, 1] }),
  t('Sistrum Player', '🎵', { gender: 'Female' }),
  t('Professional Mourner', '😢', { gender: 'Female' }),
  t('Dream Interpreter', '💤', { where: URBAN }),
  t('Cattle Counter', '🐄', { needs: ['writing'] }),
  t('Granary Scribe', '🌾', { needs: ['writing'] }),
  t('Water Clock Keeper', '⏳', { where: URBAN, needs: ['writing'] }),
  t('Date Palm Climber', '🌴', { gender: 'Male' }),
  t('Reed Cutter', '🌾'),
  t('Cataract Pilot', '🛶', { gender: 'Male', place: /\b(?:nile|cataract|aswan|nubia|egypt)\b/i }),
  t('Chariot Maker', '🛞', { needs: ['draft_animals'] }),
  t('Bow Maker', '🏹'),
  t('Ivory Carver', '🐘', { where: URBAN }),
  t('Snake Charmer', '🐍', { where: URBAN }),
  t('Ostrich Feather Trader', '🪶', { needs: ['market_exchange'] }),
  t('Quarry Overseer', '⛏️', { gender: 'Male', priv: [0.3, 1] }),
];

const MENA_MEDIEVAL: TextureRole[] = [
  t('Muezzin', '🕌', { gender: 'Male', years: [630, 2029] }),
  t('Quran Reciter', '📖', { years: [630, 2029] }),
  t('Mosque Sweeper', '🧹', { where: URBAN, years: [630, 2029] }),
  t('Qadi\'s Clerk', '⚖️', { where: URBAN, needs: ['writing'] }),
  t('Muhtasib', '⚖️', { where: URBAN, gender: 'Male', priv: [0.3, 1], years: [700, 1900] }),
  t('Paper Maker', '📄', { where: URBAN, needs: ['writing'], years: [750, 2029] }),
  t('Calligrapher', '🖋️', { where: URBAN, needs: ['writing'] }),
  t('Bookbinder', '📚', { where: URBAN, needs: ['writing'] }),
  t('Astrolabe Maker', '🔭', { where: CITY, needs: ['metallurgy', 'writing'] }),
  t('Hammam Attendant', '🛁', { where: URBAN, needs: ['urban_settlement'] }),
  t('Hammam Stoker', '🔥', { where: URBAN, gender: 'Male' }),
  t('Ice Seller', '🧊', { where: CITY, needs: ['market_exchange'] }),
  t('Sherbet Seller', '🥤', { where: URBAN, needs: ['market_exchange'] }),
  t('Rosewater Distiller', '🌹', { where: URBAN }),
  t('Soap Boiler', '🧼', { where: URBAN }),
  t('Carpet Knotter', '🧶', { gender: 'Female' }),
  t('Silk Winder', '🧵', { gender: 'Female' }),
  t('Camel Driver', '🐫', { gender: 'Male', needs: ['draft_animals'] }),
  t('Caravan Guide', '🧭', { gender: 'Male', where: ['mobile', 'town', 'rural'] }),
  t('Pigeon Post Keeper', '🕊️', { where: URBAN }),
  t('Storyteller', '📖', { where: URBAN }),
  t('Shadow Puppeteer', '🎭', { where: URBAN }),
  t('Dervish', '🌀', { gender: 'Male', years: [1100, 2029] }),
  t('Falconer', '🦅', { priv: [0.3, 1] }),
  t('Horse Doctor', '🐴', { needs: ['draft_animals'] }),
  t('Henna Artist', '🌿', { gender: 'Female' }),
  t('Amulet Writer', '🧿', { needs: ['writing'] }),
  t('Pearl Diver', '🦪', { gender: 'Male', place: /\b(?:gulf|bahrain|qatar|oman|hormuz|red sea|persian gulf|arabia)\b/i }),
  t('Dhow Builder', '⛵', { place: COAST, gender: 'Male' }),
  t('Date Packer', '🌴'),
  t('Qanat Digger', '🕳️', { gender: 'Male', stats: { minStrength: 5 } }),
  t('Wailing Woman', '😢', { gender: 'Female' }),
];

/* ======================================================================== */
/*  EAST ASIAN                                                              */
/* ======================================================================== */

const EAST_ASIAN_ANTIQUITY: TextureRole[] = [
  t('Bronze Caster', '🥉', { needs: ['metallurgy'], where: URBAN }),
  t('Jade Carver', '💚', { where: URBAN }),
  t('Lacquer Painter', '🎨', { where: URBAN }),
  t('Silk Reeler', '🧵', { gender: 'Female' }),
  t('Mulberry Grower', '🌳', { where: COUNTRY }),
  t('Oracle Bone Diviner', '🦴', { priv: [0.3, 1], years: [-1200, 200] }),
  t('Bamboo Slip Scribe', '🎋', { needs: ['writing'] }),
  t('Salt Well Driller', '🧂', { gender: 'Male' }),
  t('Tomb Figurine Maker', '🗿', { where: URBAN }),
  t('Court Musician', '🎶', { where: URBAN, priv: [0.3, 1] }),
  t('Zither Player', '🎼', { where: URBAN }),
  t('Needle Physician', '💉', { where: URBAN }),
  t('Herb Gatherer', '🌿', { where: COUNTRY }),
  t('Post Station Runner', '🏃', { gender: 'Male', stats: { minStamina: 6 } }),
  t('Crossbow Maker', '🏹', { needs: ['metallurgy'] }),
  t('Millet Winnower', '🌾', { where: COUNTRY }),
  t('Wine Fermenter', '🍶'),
  t('Sky Watcher', '🔭', { where: CITY, needs: ['writing'], priv: [0.4, 1] }),
];

const EAST_ASIAN_MEDIEVAL: TextureRole[] = [
  t('Woodblock Carver', '🪵', { where: URBAN, needs: ['writing'] }),
  t('Ink Stick Maker', '🖋️', { where: URBAN, needs: ['writing'] }),
  t('Brush Maker', '🖌️', { where: URBAN, needs: ['writing'] }),
  t('Papermaker', '📄', { needs: ['writing'] }),
  t('Porcelain Painter', '🏺', { where: URBAN }),
  t('Kiln Stoker', '🔥', { gender: 'Male' }),
  t('Silk Dyer', '🎨', { where: URBAN }),
  t('Canal Hauler', '🚢', { gender: 'Male', stats: { minStrength: 6 } }),
  t('Sedan Chair Bearer', '🪑', { where: URBAN, gender: 'Male', stats: { minStrength: 6 } }),
  t('Incense Maker', '🕯️', { where: URBAN }),
  t('Firework Maker', '🎆', { where: URBAN, years: [900, 2029] }),
  t('Bell Caster', '🔔', { needs: ['metallurgy'], where: URBAN }),
  t('Geomancer', '🧭', { needs: ['writing'] }),
  t('Village Schoolmaster', '📚', { needs: ['writing'], gender: 'Male' }),
  t('Examination Candidate', '📜', { where: URBAN, needs: ['writing'], gender: 'Male', priv: [0.35, 1] }),
  t('Buddhist Nun', '🙏', { gender: 'Female' }),
  t('Taoist Priest', '☯️', { gender: 'Male' }),
  t('Storyteller', '📖', { where: URBAN }),
  t('Opera Performer', '🎭', { where: URBAN }),
  t('Puppet Player', '🎎', { where: URBAN }),
  t('Pawnshop Clerk', '💰', { where: URBAN, needs: ['market_exchange'] }),
  t('Tea Roaster', '🍵'),
  t('Seaweed Gatherer', '🌿', { place: COAST }),
];

const EAST_ASIAN_EARLY_MODERN: TextureRole[] = [
  t('Woodblock Printer', '🖼️', { where: URBAN, needs: ['writing'] }),
  t('Sword Polisher', '⚔️', { where: URBAN, needs: ['metallurgy'], gender: 'Male' }),
  t('Swordsmith', '🗡️', { needs: ['metallurgy'], gender: 'Male' }),
  t('Tatami Maker', '🟩', { where: URBAN }),
  t('Sake Brewer', '🍶'),
  t('Miso Maker', '🍲'),
  t('Tofu Maker', '⬜', { where: URBAN }),
  t('Eel Griller', '🐟', { where: URBAN }),
  t('Tea Master', '🍵', { where: URBAN, priv: [0.35, 1] }),
  t('Kabuki Actor', '🎭', { where: CITY, gender: 'Male' }),
  t('Puppet Chanter', '🎎', { where: URBAN }),
  t('Sumo Wrestler', '🤼', { where: CITY, gender: 'Male', stats: { minStrength: 7 } }),
  t('Netsuke Carver', '🪆', { where: URBAN }),
  t('Umbrella Maker', '☂️', { where: URBAN }),
  t('Lantern Maker', '🏮', { where: URBAN }),
  t('Palanquin Bearer', '🪑', { gender: 'Male', stats: { minStrength: 6 } }),
  t('Post Road Innkeeper', '🏨', { where: ['town', 'rural'] }),
  t('Fire Tower Watchman', '🔔', { where: CITY, gender: 'Male' }),
  t('Ama Diver', '🤿', { gender: 'Female', place: COAST }),
  t('Whale Hunter', '🐋', { gender: 'Male', place: COAST }),
  t('Charcoal Burner', '🪵', { where: COUNTRY, gender: 'Male' }),
  t('Ronin', '⚔️', { gender: 'Male', priv: [0.2, 0.6], place: /\b(?:japan|honshu|kyushu|shikoku|edo|kyoto|osaka|nagasaki)\b/i }),
  t('Compradore', '💼', { where: CITY, needs: ['market_exchange'], years: [1700, 1900] }),
];

const EAST_ASIAN_INDUSTRIAL: TextureRole[] = [
  t('Rickshaw Puller', '🛺', { where: CITY, gender: 'Male', years: [1870, 1960], stats: { minStamina: 6 } }),
  t('Silk Filature Hand', '🧵', { gender: 'Female', years: [1860, 1950] }),
  t('Match Factory Hand', '🔥', { gender: 'Female', years: [1870, 1960] }),
  t('Tea Taster', '🍵', { where: URBAN, needs: ['market_exchange'] }),
  t('Telegraph Clerk', '📩', { where: URBAN, years: [1870, 1970] }),
  t('Newspaper Boy', '📰', { where: CITY, gender: 'Male', years: [1870, 1970] }),
  t('Mission School Teacher', '📚', { years: [1840, 1950] }),
  t('Railway Guard', '🚂', { gender: 'Male', years: [1875, 1980] }),
  t('Coal Trimmer', '⚫', { place: COAST, gender: 'Male', years: [1870, 1960] }),
  t('Photographer', '📷', { where: CITY, years: [1860, 2029] }),
  t('Woodblock Printer', '🖼️', { where: URBAN }),
  t('Street Storyteller', '📖', { where: CITY }),
  t('Noodle Stall Keeper', '🍜', { where: URBAN }),
  t('Seaweed Gatherer', '🌿', { place: COAST }),
];

/* ======================================================================== */
/*  SOUTH ASIAN                                                             */
/* ======================================================================== */

const SOUTH_ASIAN_CLASSICAL: TextureRole[] = [
  t('Mahout', '🐘', { gender: 'Male' }),
  t('Snake Catcher', '🐍'),
  t('Temple Dancer', '💃', { gender: 'Female', where: URBAN }),
  t('Garland Maker', '🌺', { where: URBAN }),
  t('Betel Leaf Seller', '🍃', { needs: ['market_exchange'] }),
  t('Toddy Tapper', '🥥', { gender: 'Male' }),
  t('Conch Shell Cutter', '🐚', { place: COAST }),
  t('Indigo Dyer', '🔵'),
  t('Cotton Carder', '☁️'),
  t('Block Printer', '🎨', { where: URBAN }),
  t('Bangle Maker', '💍', { where: URBAN }),
  t('Palm Leaf Scribe', '📜', { needs: ['writing'] }),
  t('Ayurvedic Physician', '⚕️', { needs: ['writing'], priv: [0.3, 1] }),
  t('Bonesetter', '🦴'),
  t('Washerman', '🧺', { gender: 'Male' }),
  t('Bullock Cart Driver', '🐂', { gender: 'Male', needs: ['draft_animals'] }),
  t('Stepwell Mason', '🪜', { gender: 'Male', stats: { minStrength: 5 } }),
  t('Temple Sculptor', '🗿', { where: URBAN }),
  t('Bronze Caster', '🥉', { needs: ['metallurgy'], where: URBAN }),
  t('Drummer', '🥁'),
  t('Wandering Bard', '🎶'),
  t('Sadhu', '🕉️', { gender: 'Male' }),
  t('Jain Monk', '🙏', { gender: 'Male' }),
  t('Sugarcane Presser', '🎋'),
  t('Pepper Grower', '🌶️', { place: /\b(?:malabar|kerala|cochin|calicut|travancore|ceylon|sri lanka)\b/i }),
  t('Pearl Diver', '🦪', { gender: 'Male', place: /\b(?:mannar|tuticorin|coromandel|ceylon|sri lanka|gulf)\b/i }),
  t('Astrologer', '🔮', { needs: ['writing'] }),
];

const SOUTH_ASIAN_EARLY_MODERN: TextureRole[] = [
  ...SOUTH_ASIAN_CLASSICAL.slice(0, 14),
  t('Miniature Painter', '🖼️', { where: URBAN, priv: [0.3, 1] }),
  t('Carpet Weaver', '🧶'),
  t('Muslin Weaver', '🧵', { place: /\b(?:bengal|dacca|dhaka|murshidabad)\b/i }),
  t('Shawl Weaver', '🧣', { place: /\b(?:kashmir|srinagar|punjab|himalaya)\w*\b/i }),
  t('Gem Cutter', '💎', { where: URBAN }),
  t('Elephant Keeper', '🐘', { gender: 'Male', priv: [0.2, 1] }),
  t('Falconer', '🦅', { priv: [0.35, 1] }),
  t('Court Poet', '📜', { where: URBAN, needs: ['writing'], priv: [0.4, 1] }),
  t('Munshi', '✍️', { where: URBAN, needs: ['writing'], priv: [0.3, 1] }),
  t('Nautch Dancer', '💃', { where: URBAN, gender: 'Female' }),
  t('Palanquin Bearer', '🪑', { gender: 'Male', stats: { minStrength: 6 } }),
  t('Ice Pit Keeper', '🧊', { where: URBAN }),
  t('Saltpetre Digger', '💥', { gender: 'Male', years: [1550, 1900] }),
  t('Firework Maker', '🎆', { where: URBAN }),
];

const SOUTH_ASIAN_INDUSTRIAL: TextureRole[] = [
  t('Railway Porter', '🚂', { where: URBAN, gender: 'Male', years: [1855, 2029] }),
  t('Punkah Puller', '🌬️', { gender: 'Male', years: [1780, 1930], priv: [0, 0.2] }),
  t('Ayah', '👶', { gender: 'Female', years: [1780, 1950] }),
  t('Dak Runner', '📩', { gender: 'Male', years: [1780, 1900], stats: { minStamina: 6 } }),
  t('Sepoy', '🪖', { gender: 'Male', years: [1750, 1947], stats: { minConstitution: 5 } }),
  t('Jute Mill Hand', '🧵', { where: URBAN, years: [1855, 1980] }),
  t('Mill Hand', '🏭', { where: CITY, years: [1855, 1990] }),
  t('Opium Weigher', '⚖️', { where: URBAN, years: [1780, 1913] }),
  t('Telegraph Signaller', '📩', { where: URBAN, years: [1855, 1970] }),
  t('Boxwallah', '🎒', { needs: ['market_exchange'], gender: 'Male' }),
  t('Bioscope Operator', '🎞️', { where: CITY, years: [1900, 1960] }),
  t('Snake Charmer', '🐍'),
  t('Toddy Tapper', '🥥', { gender: 'Male' }),
  t('Washerman', '🧺', { gender: 'Male' }),
  t('Mahout', '🐘', { gender: 'Male' }),
  t('Garland Maker', '🌺', { where: URBAN }),
  t('Bangle Maker', '💍', { where: URBAN }),
];

/* ======================================================================== */
/*  SOUTHEAST ASIAN                                                         */
/* ======================================================================== */

const SOUTHEAST_ASIAN_WORK: TextureRole[] = [
  t('Kris Smith', '🗡️', { needs: ['metallurgy'], gender: 'Male' }),
  t('Batik Waxer', '🎨', { gender: 'Female' }),
  t('Gamelan Player', '🎶', { where: URBAN }),
  t('Shadow Puppet Master', '🎭', { gender: 'Male' }),
  t('Court Dancer', '💃', { where: URBAN, gender: 'Female', priv: [0.3, 1] }),
  t("Bird's Nest Collector", '🪺', { gender: 'Male', place: COAST }),
  t('Trepang Diver', '🥒', { gender: 'Male', place: COAST }),
  t('Rattan Cutter', '🎋'),
  t('Sago Pounder', '🌴', { gender: 'Female' }),
  t('Palm Sugar Boiler', '🍯'),
  t('Buffalo Herder', '🐃', { where: COUNTRY }),
  t('Elephant Handler', '🐘', { gender: 'Male' }),
  t('Clove Picker', '🌸', { place: /\b(?:maluku|moluccas|ternate|tidore|ambon|banda|spice)\b/i }),
  t('Nutmeg Grower', '🥥', { place: /\b(?:banda|maluku|moluccas|spice)\b/i }),
  t('Pepper Planter', '🌶️'),
  t('Tin Panner', '⛏️', { needs: ['metallurgy'], gender: 'Male' }),
  t('Gold Panner', '✨', { gender: 'Male' }),
  t('Prahu Builder', '⛵', { place: COAST, gender: 'Male' }),
  t('Junk Sailor', '🚢', { place: COAST, gender: 'Male' }),
  t('Buddhist Novice', '🙏', { gender: 'Male' }),
  t('Spirit Medium', '🕯️', { gender: 'Female' }),
  t('Kite Maker', '🪁'),
  t('Fighting Fish Breeder', '🐠', { where: URBAN }),
  t('Cockfight Handler', '🐓', { gender: 'Male' }),
  t('Lacquerware Maker', '🏺', { where: URBAN }),
  t('Umbrella Painter', '☂️', { where: URBAN }),
  t('Salt Boiler', '🧂', { place: COAST }),
  t('Rice Barn Keeper', '🌾', { where: COUNTRY }),
  t('Betel Seller', '🍃', { needs: ['market_exchange'] }),
  t('Royal Tattooist', '🖋️', { gender: 'Male', priv: [0.25, 1] }),
];

/* ======================================================================== */
/*  SUB-SAHARAN AFRICAN                                                     */
/* ======================================================================== */

const AFRICAN_WORK: TextureRole[] = [
  t('Griot', '🪕', { gender: 'Male' }),
  t('Praise Singer', '🎶'),
  t('Iron Smelter', '⚒️', { needs: ['metallurgy'], gender: 'Male' }),
  t('Brass Caster', '🥉', { needs: ['metallurgy'], where: URBAN }),
  t('Gold Weigher', '⚖️', { needs: ['market_exchange'], gender: 'Male', place: /\b(?:akan|ashanti|asante|gold coast|ghana|volta|kumasi)\b/i }),
  t('Strip Cloth Weaver', '🧶', { gender: 'Male' }),
  t('Kente Weaver', '🧵', { gender: 'Male', place: /\b(?:akan|ashanti|asante|gold coast|ghana|ewe|kumasi)\b/i }),
  t('Bark Cloth Maker', '🪵', { place: /\b(?:buganda|uganda|great lakes|rwanda|burundi|congo)\b/i }),
  t('Mask Carver', '🎭', { gender: 'Male' }),
  t('Drum Maker', '🥁', { gender: 'Male' }),
  t('Salt Caravan Guide', '🧂', { gender: 'Male', place: /\b(?:sahara|sahel|taghaza|timbuktu|niger|mali|songhai|air|tuareg|bilma)\b/i }),
  t('Camel Driver', '🐫', { gender: 'Male', place: /\b(?:sahara|sahel|somali|horn|sudan|niger|chad)\b/i }),
  t('Kola Nut Trader', '🌰', { needs: ['market_exchange'] }),
  t('Palm Wine Tapper', '🌴', { gender: 'Male' }),
  t('Honey Hunter', '🍯', { gender: 'Male' }),
  t('Shea Butter Maker', '🧈', { gender: 'Female' }),
  t('Indigo Dyer', '🔵', { gender: 'Female' }),
  t('Rainmaker', '🌧️', { priv: [0.2, 1] }),
  t('Diviner', '🦴'),
  t('Herbalist Healer', '🌿'),
  t('Canoe Carver', '🛶', { gender: 'Male' }),
  t('Fish Smoker', '🐟', { gender: 'Female', place: COAST }),
  t('Ivory Carver', '🐘', { where: URBAN }),
  t('Ostrich Egg Bead Maker', '📿'),
  t('Rock Salt Miner', '🧂', { gender: 'Male' }),
  t('Copper Cross Caster', '✝️', { needs: ['metallurgy'], place: /\b(?:katanga|congo|zambia|copperbelt|luba|lunda)\b/i }),
  t('Dhow Sailor', '⛵', { gender: 'Male', place: /\b(?:swahili|zanzibar|kilwa|mombasa|lamu|comoro|mozambique|indian ocean|coast)\b/i }),
  t('Quran Teacher', '📖', { needs: ['writing'], gender: 'Male', years: [1000, 2029] }),
  t('Cattle Praise Poet', '🐄', { where: COUNTRY }),
  t('Gum Arabic Collector', '🌳', { place: /\b(?:sahel|sudan|senegal|kordofan|niger|chad)\b/i }),
  t('Beeswax Trader', '🕯️', { needs: ['market_exchange'] }),
  t('Hausa Leatherworker', '👝', { place: /\b(?:hausa|kano|sokoto|nigeria|katsina|zaria)\b/i }),
];

/* ======================================================================== */
/*  SOUTH AMERICAN                                                          */
/* ======================================================================== */

const ANDEAN_WORK: TextureRole[] = [
  t('Khipu Keeper', '🧵', { priv: [0.3, 1], place: /\b(?:andes|peru|inca|cuzco|cusco|bolivia|titicaca|ecuador|quito|altiplano)\b/i }),
  t('Chasqui Runner', '🏃', { gender: 'Male', stats: { minStamina: 7 }, place: /\b(?:andes|peru|inca|cuzco|cusco|bolivia|ecuador|altiplano)\b/i }),
  t('Chicha Brewer', '🍺', { gender: 'Female' }),
  t('Llama Caravanner', '🦙', { gender: 'Male', where: ['mobile', 'rural'] }),
  t('Vicuña Shearer', '🦙', { where: COUNTRY }),
  t('Feather Worker', '🪶', { where: URBAN }),
  t('Goldsmith', '✨', { needs: ['metallurgy'], where: URBAN }),
  t('Bridge Weaver', '🌉', { gender: 'Male', place: /\b(?:andes|peru|inca|cuzco|cusco|apurimac|bolivia)\b/i }),
  t('Terrace Builder', '⛰️', { gender: 'Male', stats: { minStrength: 5 } }),
  t('Guano Gatherer', '🪶', { gender: 'Male', place: COAST }),
  t('Salt Pan Worker', '🧂'),
  t('Mummy Attendant', '⚱️', { priv: [0.25, 1] }),
  t('Sun Priest', '☀️', { gender: 'Male', priv: [0.4, 1] }),
  t('Chosen Woman', '🏛️', { gender: 'Female', priv: [0.3, 1] }),
  t('Coca Chewer\'s Supplier', '🌿', { needs: ['market_exchange'] }),
  t('Blowgun Maker', '🎯', { place: /\b(?:amazon|orinoco|rainforest|jungle|guiana|acre|xingu)\b/i }),
  t('Turtle Egg Gatherer', '🥚', { place: /\b(?:amazon|orinoco|rainforest|river)\b/i }),
  t('Manioc Grater', '🥔', { gender: 'Female', place: /\b(?:amazon|orinoco|rainforest|jungle|guiana)\b/i }),
];

const SOUTH_AMERICAN_COLONIAL: TextureRole[] = [
  ...ANDEAN_WORK.slice(0, 12),
  t('Silver Miner', '⛏️', { gender: 'Male', years: [1545, 1900], place: /\b(?:potosi|potosí|bolivia|peru|andes|zacatecas|huancavelica)\b/i }),
  t('Mercury Amalgamator', '⚗️', { gender: 'Male', years: [1570, 1900] }),
  t('Mule Train Driver', '🐴', { gender: 'Male', needs: ['draft_animals'] }),
  t('Cacao Grower', '🍫', { place: /\b(?:guayaquil|ecuador|venezuela|caracas|maracaibo|amazon|bahia)\b/i }),
  t('Yerba Mate Picker', '🧉', { place: /\b(?:paraguay|parana|paraná|misiones|corrientes|rio grande)\b/i }),
  t('Gaucho', '🐎', { gender: 'Male', place: /\b(?:pampas|plata|argentin|uruguay|banda oriental|rio grande|patagonia)\w*\b/i }),
  t('Payador', '🎸', { gender: 'Male', place: /\b(?:pampas|plata|argentin|uruguay|banda oriental)\w*\b/i }),
  t('Rubber Tapper', '🌳', { gender: 'Male', years: [1850, 1930], place: /\b(?:amazon|acre|manaus|para|pará|belem|belém|rainforest)\b/i }),
  t('Nitrate Miner', '💥', { gender: 'Male', years: [1830, 1930], place: /\b(?:atacama|antofagasta|tarapaca|tarapacá|iquique|chile)\b/i }),
  t('Guano Loader', '🪶', { gender: 'Male', years: [1840, 1890], place: COAST }),
];

/* ======================================================================== */
/*  NORTH AMERICA — PRE-COLUMBIAN                                           */
/* ======================================================================== */

const MESOAMERICA = /\b(?:mexico|maya|yucatan|yucatán|oaxaca|guatemala|tenochtitlan|teotihuacan|aztec|olmec|zapotec|mixtec|chiapas|honduras|belize|central highlands|veracruz|peten|petén)\b/i;
const NORTHWEST_COAST = /\b(?:northwest|puget|salish|haida|tlingit|kwakiutl|nootka|vancouver|columbia river|olympic|alaska panhandle|queen charlotte)\b/i;
const PLAINS = /\b(?:plains|prairie|dakota|nebraska|kansas|missouri river|platte|badlands|black hills|llano)\b/i;

const NORTH_AMERICAN_PRE_COLUMBIAN_WORK: TextureRole[] = [
  t('Obsidian Knapper', '🪨', { excludes: ['metallurgy'] }),
  t('Turquoise Driller', '💎', { place: /\b(?:southwest|pueblo|chaco|mesa verde|arizona|new mexico|sonora|mogollon|hohokam)\b/i }),
  t('Shell Bead Maker', '🐚', { place: COAST }),
  t('Copper Beater', '🟠', { place: /\b(?:great lakes|superior|michigan|woodland|mississippi|cahokia|ohio)\b/i }),
  t('Codex Painter', '📜', { needs: ['writing'], place: MESOAMERICA }),
  t('Day Keeper', '📅', { place: MESOAMERICA, priv: [0.3, 1] }),
  t('Ballplayer', '🏐', { place: MESOAMERICA, gender: 'Male', stats: { minDexterity: 6 } }),
  t('Cacao Frother', '🍫', { place: MESOAMERICA, gender: 'Female' }),
  t('Pulque Tapper', '🌵', { place: MESOAMERICA, gender: 'Male' }),
  t('Amaranth Grower', '🌾', { place: MESOAMERICA, needs: ['settled_agriculture'] }),
  t('Feather Worker', '🪶', { place: MESOAMERICA, where: URBAN }),
  t('Chinampa Gardener', '🌱', { place: MESOAMERICA, needs: ['settled_agriculture'] }),
  t('Totem Carver', '🪵', { place: NORTHWEST_COAST, gender: 'Male' }),
  t('Cedar Bark Weaver', '🧺', { place: NORTHWEST_COAST, gender: 'Female' }),
  t('Salmon Smoker', '🐟', { place: NORTHWEST_COAST }),
  t('Eulachon Renderer', '🪔', { place: NORTHWEST_COAST }),
  t('Whaler', '🐋', { place: NORTHWEST_COAST, gender: 'Male', stats: { minStrength: 6 } }),
  t('Fish Weir Keeper', '🪤', { place: /\b(?:river|coast|sound|falls|rapids|lake|estuary)\b/i }),
  t('Buffalo Caller', '🦬', { place: PLAINS, gender: 'Male' }),
  t('Pemmican Maker', '🥩', { place: PLAINS, gender: 'Female' }),
  t('Travois Maker', '🛷', { place: PLAINS }),
  t('Camas Digger', '🌱', { excludes: ['settled_agriculture'], gender: 'Female' }),
  t('Acorn Leacher', '🌰', { excludes: ['settled_agriculture'], gender: 'Female' }),
  t('Sweat Lodge Keeper', '♨️'),
  t('Pipestone Carver', '🪨', { place: /\b(?:plains|dakota|minnesota|pipestone|prairie)\b/i }),
  t('Dogsled Driver', '🛷', { place: /\b(?:arctic|subarctic|baffin|inuit|yukon|hudson|labrador|greenland|tundra)\b/i, gender: 'Male' }),
  t('Kayak Builder', '🛶', { place: /\b(?:arctic|baffin|inuit|aleut|greenland|labrador|bering)\b/i, gender: 'Male' }),
  t('Sealskin Sewer', '🧵', { place: /\b(?:arctic|baffin|inuit|aleut|greenland|labrador|bering|tundra)\b/i, gender: 'Female' }),
];

/* ======================================================================== */
/*  NORTH AMERICA — COLONIAL AND AFTER                                      */
/* ======================================================================== */

const NORTH_AMERICAN_COLONIAL_WORK: TextureRole[] = [
  t('Whaler', '🐋', { place: COAST, gender: 'Male', years: [1650, 1925] }),
  t('Ropewalk Worker', '🪢', { where: URBAN, gender: 'Male' }),
  t('Sailmaker', '⛵', { place: COAST }),
  t("Ship's Caulker", '🔨', { place: COAST, gender: 'Male' }),
  t('Rum Distiller', '🥃', { where: URBAN, years: [1650, 1920] }),
  t('Fur Trapper', '🦫', { gender: 'Male', where: COUNTRY }),
  t('Voyageur', '🛶', { gender: 'Male', years: [1650, 1850], place: /\b(?:canada|quebec|québec|great lakes|superior|montreal|hudson|rupert|saskatchewan|athabasca)\b/i }),
  t('Interpreter', '🗣️', { years: [1600, 1900] }),
  t('Circuit Preacher', '⛪', { gender: 'Male', years: [1700, 1930] }),
  t('Schoolmarm', '📚', { gender: 'Female', years: [1750, 1950] }),
  t('Tavern Keeper', '🍺', { where: ['town', 'city', 'rural'] }),
  t('Ferry Keeper', '⛴️', { gender: 'Male' }),
  t('Silversmith', '✨', { where: URBAN, needs: ['metallurgy'] }),
  t('Gunsmith', '🔫', { needs: ['metallurgy'], gender: 'Male' }),
  t('Turpentine Tapper', '🌲', { gender: 'Male', place: /\b(?:carolina|georgia|florida|pine|piedmont|appalach\w*|virginia)\b/i }),
  t('Tobacco Sorter', '🍂', { place: /\b(?:virginia|maryland|carolina|chesapeake|kentucky|tennessee)\b/i }),
  t('Ice Cutter', '🧊', { years: [1800, 1920], where: COUNTRY }),
  t('Stagecoach Driver', '🚏', { gender: 'Male', years: [1700, 1900] }),
  t('Canal Boatman', '🚤', { gender: 'Male', years: [1800, 1900] }),
  t('Lighthouse Keeper', '🗼', { place: COAST, years: [1720, 1990] }),
  t('Militia Drummer', '🥁', { gender: 'Male', years: [1650, 1870] }),
  t('Sawmill Hand', '🪚', { gender: 'Male' }),
];

const NORTH_AMERICAN_INDUSTRIAL_WORK: TextureRole[] = [
  t('Cowboy', '🤠', { gender: 'Male', years: [1850, 1929], place: /\b(?:texas|plains|prairie|kansas|wyoming|montana|dakota|new mexico|arizona|nevada|west|frontier|chisholm)\b/i }),
  t('Prospector', '⛏️', { gender: 'Male', years: [1848, 1930], place: /\b(?:california|nevada|colorado|klondike|yukon|sierra|rockies|black hills|alaska|west)\b/i }),
  t('Assayer', '⚗️', { where: ['town', 'city'], years: [1850, 1940] }),
  t('Saloon Keeper', '🥃', { where: ['town', 'city'], years: [1840, 1920] }),
  t('Faro Dealer', '🎲', { where: ['town', 'city'], years: [1840, 1915] }),
  t('Lumberjack', '🪓', { gender: 'Male', stats: { minStrength: 6 }, place: /\b(?:maine|michigan|wisconsin|minnesota|oregon|washington|cascade|pine|forest|timber|adirondack)\b/i }),
  t('River Driver', '🪵', { gender: 'Male', years: [1820, 1930] }),
  t('Cannery Worker', '🥫', { place: COAST, years: [1870, 1980] }),
  t('Oysterman', '🦪', { place: COAST, gender: 'Male' }),
  t('Sod Buster', '🏚️', { years: [1860, 1920], place: PLAINS }),
  t('Windmill Erector', '🌬️', { gender: 'Male', years: [1870, 1940] }),
  t('Telegraph Operator', '📩', { where: ['town', 'city'], years: [1845, 1960] }),
  t('Train Butcher', '🚂', { gender: 'Male', years: [1860, 1930] }),
  t('Pony Express Rider', '🐎', { gender: 'Male', years: [1860, 1862] }),
  t('Medicine Show Barker', '🎪', { gender: 'Male', years: [1840, 1930] }),
  t('Circus Roustabout', '🎪', { gender: 'Male', years: [1840, 1960] }),
  t('Bootblack', '👞', { where: CITY, priv: [0, 0.3] }),
  t('Newsboy', '📰', { where: CITY, gender: 'Male', priv: [0, 0.3], years: [1830, 1950] }),
  t('Elevator Operator', '🛗', { where: CITY, years: [1870, 1970] }),
  t('Iceman', '🧊', { where: URBAN, gender: 'Male', years: [1830, 1950] }),
  t('Bell Hop', '🛎️', { where: CITY, years: [1870, 2029] }),
  t('Undertaker', '⚰️', { where: ['town', 'city'] }),
  t('Milliner', '👒', { where: URBAN, gender: 'Female' }),
  t('Photographer', '📷', { where: ['town', 'city'], years: [1845, 2029] }),
  t('Lighthouse Keeper', '🗼', { place: COAST, years: [1800, 1990] }),
];

/* ======================================================================== */
/*  OCEANIA                                                                 */
/* ======================================================================== */

const AUSTRALIA = /\b(?:australia|arnhem|kimberley|pilbara|nullarbor|murray|darling|tasmania|queensland|victoria|new south wales|western desert|simpson|gibson|outback)\b/i;

const OCEANIA_WORK: TextureRole[] = [
  t('Wayfinder', '🧭', { gender: 'Male', place: COAST }),
  t('Canoe Carver', '🛶', { gender: 'Male' }),
  t('Adze Maker', '🪨', { excludes: ['metallurgy'] }),
  t('Fishhook Carver', '🪝'),
  t('Stone Fish Trap Builder', '🪨', { place: COAST }),
  t('Fishpond Keeper', '🐟', { place: /\b(?:hawaii|hawai|molokai|oahu|maui|kauai)\w*\b/i }),
  t('Turtle Hunter', '🐢', { gender: 'Male', place: COAST }),
  t('Pearl Shell Diver', '🦪', { gender: 'Male', place: COAST }),
  t('Tattooist', '🖋️', { gender: 'Male' }),
  t('Feather Cloak Maker', '🪶', { place: /\b(?:hawaii|hawai|molokai|oahu|maui|kauai)\w*\b/i, priv: [0.3, 1] }),
  t('Sennit Braider', '🪢'),
  t('Kava Maker', '🥥'),
  t('Breadfruit Fermenter', '🥥'),
  t('Taro Irrigator', '🌱'),
  t('Genealogy Chanter', '📜', { priv: [0.25, 1] }),
  t('Weather Chanter', '🌧️'),
  t('Marae Priest', '🛕', { gender: 'Male', priv: [0.3, 1] }),
  t('Pig Feast Provider', '🐖', { priv: [0.25, 1] }),
  t('Firestick Burner', '🔥', { place: AUSTRALIA, gender: 'Male' }),
  t('Honey Ant Digger', '🐜', { place: AUSTRALIA, gender: 'Female' }),
  t('Ochre Trader', '🎨', { place: AUSTRALIA }),
  t('Songline Keeper', '🎶', { place: AUSTRALIA, priv: [0.25, 1] }),
  t('Woomera Maker', '🪃', { place: AUSTRALIA, gender: 'Male' }),
  t('Sandalwood Cutter', '🌳', { years: [1800, 1900], gender: 'Male' }),
  t('Bêche-de-mer Collector', '🥒', { years: [1800, 1920], place: COAST }),
  t('Mission Teacher', '📚', { years: [1810, 1960], needs: ['writing'] }),
  t('Whaler\'s Provisioner', '🐋', { years: [1800, 1900], place: COAST }),
];

/* ======================================================================== */
/*  THE TABLE                                                               */
/* ======================================================================== */

type ZoneTexture = Partial<Record<HistoricalEra, TextureRole[]>>;

const TEXTURE: Partial<Record<CulturalZone, ZoneTexture>> = {
  EUROPEAN: {
    [HistoricalEra.ANTIQUITY]: EUROPEAN_ANTIQUITY,
    [HistoricalEra.MEDIEVAL]: EUROPEAN_MEDIEVAL,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: EUROPEAN_EARLY_MODERN,
    [HistoricalEra.INDUSTRIAL_ERA]: EUROPEAN_INDUSTRIAL,
    [HistoricalEra.MODERN_ERA]: EUROPEAN_MODERN,
  },
  MENA: {
    [HistoricalEra.ANTIQUITY]: MENA_ANTIQUITY,
    [HistoricalEra.MEDIEVAL]: MENA_MEDIEVAL,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: MENA_MEDIEVAL,
    [HistoricalEra.INDUSTRIAL_ERA]: MENA_MEDIEVAL,
  },
  EAST_ASIAN: {
    [HistoricalEra.ANTIQUITY]: EAST_ASIAN_ANTIQUITY,
    [HistoricalEra.MEDIEVAL]: EAST_ASIAN_MEDIEVAL,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: EAST_ASIAN_EARLY_MODERN,
    [HistoricalEra.INDUSTRIAL_ERA]: EAST_ASIAN_INDUSTRIAL,
  },
  SOUTH_ASIAN: {
    [HistoricalEra.ANTIQUITY]: SOUTH_ASIAN_CLASSICAL,
    [HistoricalEra.MEDIEVAL]: SOUTH_ASIAN_CLASSICAL,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: SOUTH_ASIAN_EARLY_MODERN,
    [HistoricalEra.INDUSTRIAL_ERA]: SOUTH_ASIAN_INDUSTRIAL,
  },
  SOUTHEAST_ASIAN: {
    [HistoricalEra.ANTIQUITY]: SOUTHEAST_ASIAN_WORK,
    [HistoricalEra.MEDIEVAL]: SOUTHEAST_ASIAN_WORK,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: SOUTHEAST_ASIAN_WORK,
    [HistoricalEra.INDUSTRIAL_ERA]: SOUTHEAST_ASIAN_WORK,
  },
  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.ANTIQUITY]: AFRICAN_WORK,
    [HistoricalEra.MEDIEVAL]: AFRICAN_WORK,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: AFRICAN_WORK,
    [HistoricalEra.INDUSTRIAL_ERA]: AFRICAN_WORK,
  },
  SOUTH_AMERICAN: {
    [HistoricalEra.ANTIQUITY]: ANDEAN_WORK,
    [HistoricalEra.MEDIEVAL]: ANDEAN_WORK,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: SOUTH_AMERICAN_COLONIAL,
    [HistoricalEra.INDUSTRIAL_ERA]: SOUTH_AMERICAN_COLONIAL,
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    [HistoricalEra.PREHISTORY]: NORTH_AMERICAN_PRE_COLUMBIAN_WORK,
    [HistoricalEra.ANTIQUITY]: NORTH_AMERICAN_PRE_COLUMBIAN_WORK,
    [HistoricalEra.MEDIEVAL]: NORTH_AMERICAN_PRE_COLUMBIAN_WORK,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: NORTH_AMERICAN_PRE_COLUMBIAN_WORK,
  },
  NORTH_AMERICAN_COLONIAL: {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: NORTH_AMERICAN_COLONIAL_WORK,
    [HistoricalEra.INDUSTRIAL_ERA]: [...NORTH_AMERICAN_COLONIAL_WORK, ...NORTH_AMERICAN_INDUSTRIAL_WORK],
    [HistoricalEra.MODERN_ERA]: EUROPEAN_MODERN,
  },
  OCEANIA: {
    [HistoricalEra.PREHISTORY]: OCEANIA_WORK,
    [HistoricalEra.ANTIQUITY]: OCEANIA_WORK,
    [HistoricalEra.MEDIEVAL]: OCEANIA_WORK,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: OCEANIA_WORK,
    [HistoricalEra.INDUSTRIAL_ERA]: OCEANIA_WORK,
  },
};

/**
 * Work that needed no particular civilisation, only enough people in one place
 * to support somebody doing it. The fallback for the zone-and-era pairs this
 * file does not yet reach, so no combination comes back with an empty tail.
 */
const UNIVERSAL: TextureRole[] = [
  t('Bonesetter', '🦴'),
  t('Midwife', '🤲', { gender: 'Female' }),
  t('Diviner', '🔮'),
  t('Matchmaker', '💞', { gender: 'Female' }),
  t('Storyteller', '📖'),
  t('Musician', '🎶'),
  t('Dancer', '💃'),
  t('Wrestler', '🤼', { gender: 'Male', stats: { minStrength: 6 } }),
  t('Gravedigger', '⚰️', { where: URBAN, gender: 'Male' }),
  t('Well Digger', '🕳️', { gender: 'Male', stats: { minStrength: 5 } }),
  t('Tooth Drawer', '🦷', { where: URBAN }),
  t('Charm Seller', '🧿', { where: URBAN }),
  t('Message Runner', '🏃', { gender: 'Male', stats: { minStamina: 6 } }),
  t('Dye Gatherer', '🎨'),
  t('Reed Cutter', '🌾'),
  t('Firewood Seller', '🪵', { needs: ['market_exchange'] }),
];

/* ======================================================================== */

/**
 * Before 1800 an unclassified place is countryside, not "no information" —
 * the same reasoning `effectiveLocale` uses in the weighting service, and for
 * the same reason: about half of all generated personas land on `unknown`.
 */
function localeOf(ctx: TextureContext): Locale {
  const declared = ctx.localeType ?? 'unknown';
  if (declared !== 'unknown') return declared;
  return ctx.year < 1800 ? 'rural' : 'unknown';
}

const toDefinition = (entry: TextureRole): ProfessionDefinition => ({
  statRequirements: entry.stats ?? {},
  ...(entry.priv
    ? { socialRequirements: { minPrivilege: entry.priv[0], maxPrivilege: entry.priv[1] } }
    : {}),
  ...(entry.gender ? { genderBias: entry.gender } : {}),
  ...(entry.years ? { decadeRange: entry.years } : {}),
  emoji: entry.emoji,
  texture: true,
});

/**
 * The distinctive work this place and year can support, as a role map ready to
 * merge into the commoner table. Every entry is flagged `texture`, which is
 * what puts it on the budget rather than in the weighted scramble.
 */
export function textureRolesFor(
  zone: CulturalZone,
  era: HistoricalEra,
  ctx: TextureContext,
): RoleMap {
  // Only where there is no authored list. Mixed in everywhere it put a
  // diviner and a dancer into 1850 London at three per cent each, which is the
  // generic filler this file exists to displace.
  const authored = TEXTURE[zone]?.[era];
  const entries = authored?.length ? authored : UNIVERSAL;
  const locale = localeOf(ctx);
  const place = ctx.placeLower ?? '';

  const roles: RoleMap = {};
  for (const entry of entries) {
    // An unclassified place is not evidence against a locale-bound role; a
    // classified one that disagrees is.
    if (entry.where && locale !== 'unknown' && !entry.where.includes(locale)) continue;
    if (entry.place && !entry.place.test(place)) continue;
    if (entry.needs && !entry.needs.every(c => hasCapability(c, ctx))) continue;
    if (entry.needsAny && !entry.needsAny.some(c => hasCapability(c, ctx))) continue;
    if (entry.excludes?.some(c => hasCapability(c, ctx))) continue;
    roles[entry.role] = toDefinition(entry);
  }
  return roles;
}
