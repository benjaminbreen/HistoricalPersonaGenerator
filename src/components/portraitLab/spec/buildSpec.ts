/**
 * portraitLab/spec/buildSpec.ts
 *
 * The adapter. This is the *only* file in portraitLab that knows anything about
 * the app's character model, and it deliberately accepts the same loose shape
 * the existing ProceduralPortrait accepts so the two renderers are drop-in
 * interchangeable.
 *
 * It preserves the app's existing precedence rules:
 *   portraitVisualOverrides  (evidence-aware, from portraitAuthenticityService)
 *     > equippedItems        (what the persona is actually wearing)
 *       > appearance         (the procedural fallback)
 */

import { choose, hashString, unit } from '../core/rng';
import { hexToRgb, hslToRgb, luminance, mixRgb, rgbToHex, rgbToHsl } from '../core/color';
import { hasIntrinsicColor, hexForName } from '../../../constants/gameData/colorNames';
import { impliesMatchingLegs, legwearFormFor } from './garmentLayers';
import { contextMarksFor, garmentFeatureFor, necklineFor } from './garmentConstruction';
import { stoneMaterialForHex } from '../../../services/ornamentService';
import {
  BackgroundSpec,
  BodiceSource,
  Build,
  ConditionSpec,
  DentalWork,
  Expression,
  GarmentKind,
  GarmentSpec,
  GarmentSurfaceSpec,
  GarmentWearSpec,
  HairLength,
  HairSilhouette,
  HairTexture,
  HeadwearKind,
  HeadwearSpec,
  JewelrySpec,
  LegwearSpec,
  FaceTraits,
  MarkingSpec,
  MoodSpec,
  NoseForm,
  OrnamentMaterial,
  OrnamentSpec,
  PendantForm,
  PortraitSpec,
  PoseSpec,
  SkullShape,
  SpecColorSet,
} from './types';

export interface PortraitSource {
  age?: number;
  gender?: string;
  health?: number;
  maxHealth?: number;
  fatigue?: number;
  maxFatigue?: number;
  wealthLevel?: string;
  era?: string;
  culturalZone?: string;
  ethnicCulturalZone?: string;
  portraitSeed?: number;
  profession?: string;
  name?: string;
  /**
   * Only three traits are read, so they are named rather than taken as a
   * `Record<string, number>`. The app's `CharacterPersonality` is an interface
   * and so carries no index signature, which made it structurally incompatible
   * with a record type even though every value in it is a number — the old
   * `character: any` prop on the removed PortraitSwitch was quietly hiding
   * that at every call site.
   */
  personality?: {
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
  };
  /** Accepted from callers and ignored — nothing here is drawn from stats. */
  stats?: object;
  /**
   * How unusual this persona is, and whether they were born into a privileged
   * order. Both reach the portrait only as a light touch on the backdrop — see
   * `backgroundFor`. Nothing about the figure itself changes: a rare persona is
   * not drawn better-looking, which would be a different and much worse claim.
   */
  rarityTier?: 'ordinary' | 'notable' | 'rare' | 'legendary';
  hasDistinction?: boolean;
  /**
   * The share of the local population that held this persona's standing, where
   * they had one. Smaller is rarer. Read only by the corner mark in
   * `art/distinctionMark.ts`, which is drawn over the finished bust rather than
   * compiled into it, so it does not enter the spec.
   */
  distinctionShare?: number;
  /**
   * The app's trait list. Only the handful that are about a face are read;
   * `left_handed` and `can_swim` are not going to show at 96px.
   */
  attributes?: Array<{ id?: string } | null | undefined>;
  diseaseHealth?: { currentDiseases?: Array<{ disease?: { name?: string } }> };
  equippedItems?: Record<string, Piece | undefined>;
  appearance?: Record<string, any>;
  portraitVisualOverrides?: Record<string, any>;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const WEALTH_ORNAMENT: Record<string, number> = {
  poor: 0,
  modest: 0.15,
  comfortable: 0.35,
  wealthy: 0.7,
  noble: 1,
};

// ---------------------------------------------------------------------------
// Garment / headwear classification
// ---------------------------------------------------------------------------

/**
 * Order matters: the first match wins. Extended from an audit over the app's
 * real output, where roughly one garment name in seven was matching nothing and
 * silently falling back to a tunic — skirts, cloaks, loincloths and most of the
 * South Asian vocabulary among them.
 */
/**
 * How much weather a trade puts on a face.
 *
 * Read off the profession's *name*, the same way garments, hairstyles and
 * coverings already are. The profession tables run to hundreds of entries keyed
 * by name and there is no field on them saying whether the work is outdoors, so
 * matching the words is the only route that does not mean editing every entry —
 * and the words are consistent, because the tables were written by somebody
 * describing real occupations.
 *
 * Three tiers rather than a flag. A fisherman at sea and a market trader under
 * an awning have genuinely different faces, and the difference between them is
 * about as large as the difference between the trader and a clerk.
 *
 * Order matters, first match wins, so the exceptions come first: a *miner* works
 * harder than a farmer and sees less sun than a scribe, and matching him on
 * "min" against a generic labouring pattern would have given him a fisherman's
 * tan. The same care is why `gardener` precedes nothing and `guard` is absent —
 * a household guard stands in a hall.
 */
const WEATHERING_KEYWORDS: Array<[RegExp, number]> = [
  // Underground and indoor trades that are nonetheless heavy labour. Listed
  // first so the labouring words below cannot claim them.
  [/miner|collier|pit\b|underground|tunnel|weaver|spinner|dyer|tanner|fuller|brewer|baker|smith|forge|founder|glassblower|potter/i, 0.1],
  [/scribe|clerk|notary|scholar|monk|nun|priest|abbot|bishop|physician|apothecary|midwife|tailor|seamstress|embroider|cook|servant|maid|butler|steward|banker|usurer|jeweller|goldsmith|illuminator|copyist|librarian|astronomer|teacher|tutor|lawyer|judge|official|magistrate|eunuch|courtier|concubine|weaver/i, 0],

  // Full exposure: the work happens in the open, all day, in all weather.
  [/fisher|fisherman|sailor|mariner|seaman|whaler|boatman|ferry|pilot\b|navigator/i, 0.9],
  [/shepherd|herder|herdsman|drover|cowherd|goatherd|swineherd|pastoralist|nomad|camel|caravan|muleteer|carter|waggoner|teamster/i, 0.85],
  [/farmer|peasant|ploughman|plowman|husbandman|harvest|reaper|field|agricultur|vineyard|vine.?dresser|orchard|olive|rice|paddy|planter|sharecropper|serf|cultivator|gardener|forester|woodcutter|woodsman|logger|charcoal|sawyer|thatcher|roofer|quarr|salt|lime.?burner/i, 0.8],
  [/hunter|trapper|fowler|forager|gatherer|whaling|scout|ranger|guide/i, 0.8],
  [/soldier|warrior|archer|cavalry|horseman|legionary|infantry|mercenary|sentry|watchman|sailor|marine|raider|pirate/i, 0.7],
  [/mason|builder|bricklayer|navvy|labourer|laborer|porter|stevedore|docker|drayman|digger|dyke|canal|road|well.?digger/i, 0.65],

  // Partly out: a stall, a doorway, a yard, a round.
  [/pedlar|peddler|hawker|costermonger|market|stall|carrier|courier|messenger|postman|crier|beggar|vagrant|itinerant|pilgrim|washerwoman|laundress|water.?carrier|dung|scavenger|rag/i, 0.5],
];

const GARMENT_KEYWORDS: Array<[RegExp, GarmentKind]> = [
  [/(bare|naked|nude|loincloth|breechcloth|breechclout)/i, 'bare'],
  [/(robe|kaftan|caftan|jama|hanfu|cassock|habit|abaya|thobe|dishdasha|boubou|agbada|achkan|sherwani|toga|houppelande|senator wear)/i, 'robe'],
  [/(gown|dress|kirtle|frock|sari|saree|lehenga|anarkali|farthingale|cotehardie|kimono|ghagra|stola|peplos|peshwaz|haute couture)/i, 'gown'],
  [/(doublet|jerkin|waistcoat|bodice|breastplate|surcoat|tabard|vest|choli|corset)/i, 'doublet'],
  [/(coat|jacket|suit|blazer|overcoat|parka|anorak|chapan|cape|cloak|poncho|cardigan)/i, 'jacket'],
  [/(wrap|wrapper|sarong|pagne|barkcloth|bark cloth|tapa|drape|himation|shawl|mantle|blanket|lavalava|kain|lungi|dhoti|skirt|breast band|hide|skin garment|fur|pelt|odhani|dupatta|traditional cloth|leaf covering|slit|upper cloth|woven cloth)/i, 'wrapped_garment'],
  [/(shirt|blouse|smock|chemise|shift|tee|kurti|kameez|pants|trousers|breeches|leggings|apron|top|guayabera|chinos|shorts|overalls|churidar|jumper|sweater|jeans|kaba|denim|resort wear)/i, 'work_shirt'],
  [/(tunic|kurta|chiton|dashiki|kaross|salwar)/i, 'tunic'],
  [/(none|nothing)/i, 'bare'],
];

/**
 * Same story as the garments: the audit turned up fezzes, hijabs, feathered
 * headdresses, beaded bands and a laurel wreath all being drawn as skullcaps.
 * A plain band across the brow is common enough to deserve its own form.
 */
const HEADWEAR_KEYWORDS: Array<[RegExp, HeadwearKind]> = [
  // Eyewear filed under the head slot is not a head covering at all.
  [/(sunglasses|spectacles|eyeglasses)/i, 'none'],
  // `odhani`, `orna` and `chunni` are the same object as the dupatta under
  // other regional names, and matched nothing at all: they fell past every
  // rule here to the `cap` fallback, so a length of draped cloth came out as a
  // felt skullcap. `khimar` and `shayla` were doing the same.
  // `orna` needs its word boundaries or it eats every "Gold Ornament" in the
  // table and turns a decorated turban into a veil.
  [/(veil|wimple|mantilla|dupatta|odhani|\borna\b|chunni|chunari|niqab|chador|hijab|khimar|shayla|barbette)/i, 'veil'],
  [/(hood|cowl|capuche|zukin|chaperon)/i, 'hood'],
  // Most helmets never use the word. `galea` fell to the `cap` fallback and a
  // legionary's bronze helmet came out a bronze skullcap; `kettle hat` was
  // worse, reaching the felt-hat rule below on the strength of "hat" and being
  // drawn as a bowler in iron.
  [/(helmet|helm\b|casque|morion|cabasset|sallet|kabuto|jingasa|galea|barbute|bascinet|armet|spangen|kettle ?hat|war ?hat|corinthian)/i, 'helmet'],
  // A war bonnet is a feathered headdress and nothing like a linen bonnet, so
  // it has to be caught before the `bonnet` in the cap rule takes it — which
  // is what used to happen, drawing an eagle-feather headdress as a coif.
  [/(war bonnet|warbonnet)/i, 'coronet'],
  [/(crown|diadem|coronet|tiara|headdress|headpiece|sacred feather)/i, 'coronet'],
  // `ornament` used to live in this rule and had to come out: it is a word
  // that attaches to other nouns. "Turban with Gold Ornament" matched here,
  // before the `wrapped_cloth` rule below ever saw it, and the persona lost
  // their turban to keep a hairpin. The late ornament rule at the bottom picks
  // up the genuinely ornament-only names once every covering has had its turn.
  [/(circlet|band|fillet|wreath|garland|passa|jadai|chaplet|hairpin|hair pin|comb|hair flower|laurel|tikka|patti|rakhdi|fascinator|hairpiece|bindi)/i, 'band'],
  // `safa`, `peta` and `dastar` are turbans that never say so: the Rajasthani
  // safa and the Mysore peta were matching nothing at all and taking the `cap`
  // fallback, so nine metres of tied silk came out as a plain skullcap.
  // The separators are written three ways in the tables and the rule only knew
  // two of them, so "Linen Head-Cloth" — the commonest unmatched head item in
  // the app — fell past every rule here to the `cap` fallback and a length of
  // draped linen came out a felt skullcap.
  [/(turban|head[- ]?cloth|head[- ]?wrap|head[- ]?tie|gele|keffiyeh|shemagh|ghutra|pagri|safa|peta|dastar|scarf|kerchief|tignon|wrap|duku)/i, 'wrapped_cloth'],
  // Fur headgear is soft and brimless. This has to precede the generic `hat`
  // rule below, or a "Fur Hat" picks up a stiff felt brim.
  [/(fur|pelt|shearling|astrakhan|ushanka|papakha|sheepskin|fox tail)/i, 'cap'],
  // Knitwear is brimless and soft. `chullo` in particular used to fall through
  // to the `hat` at the end of the brimmed rule below and come back a felt
  // bowler, which is a long way from an Andean ear-flapped cap.
  // `visor` has to be caught here rather than in the brimmed rule below: a sun
  // visor is a strap and a bill with no crown at all, and sent to the felt hat
  // it came back a bowler with the brim on backwards.
  [/(cap|coif|bonnet|kufi|taqiyah|biretta|skullcap|futou|beret|toque|fez|tarboosh|hennin|topi|snapback|beanie|biggins|kofia|mitre|songkok|chullo|toboggan|stocking cap|watch cap|knit|visor)/i, 'cap'],
  // `dou li` is written with a space in the item data, so the old `douli`
  // spelling never matched and those hats fell through to the `cap` fallback.
  // `trilby`, `derby`, `stetson` and the rest name a brimmed felt hat without
  // ever using the word "hat", so every one of them fell past this rule to the
  // `cap` fallback and came back a skullcap — a trilby drawn as a coif, with no
  // brim at all, on a card that says trilby.
  [/(brim|tricorn|bicorne|sombrero|straw|petasos|boater|bowler|fedora|homburg|trilby|panama|derby\b|stetson|slouch|pork ?pie|visor|top hat|wide[- ]?hat|conical|dou ?li|bamboo|sedge|sugegasa|kasa|salakot|non la|cheese-cutter|hat)/i, 'brimmed_hat'],
  /**
   * Things that are decoration and nothing else, caught last so that anything
   * which is genuinely a covering has already won. Order is the whole point
   * here: a "Felt Cap with Feather" is a cap and must be matched by the cap
   * rule above, while a "Coral Stickpin" is not a hat of any kind.
   *
   * Before this existed those fell through to the `cap` fallback and were
   * drawn as skullcaps — which is how a stickpin ended up rendering as a solid
   * gold bowl over someone's head, the pin itself a rounding error beside it.
   * They route to `band`, whose own drawing steps aside when the ornament
   * layer has found what the item actually is.
   */
  [/(pin|bodkin|kanzashi|skewer|plume|feather|quill|strand|brooch|medallion|boss|plaque|roundel|flower|blossom|bead|pearl|jewel|gem|stone|coral|amber|jade|shell|ornament)/i, 'band'],
];

/**
 * Hairstyle names, mapped onto silhouettes the renderer can draw.
 *
 * The app has been generating these all along — `getHairstyle` in
 * `npcUtils.ts` picks from era- and gender-specific lists, so a medieval man
 * gets a `bowl_cut` or a `shaved_crown` and an antique woman gets a
 * `braided_crown` or a `gathered_bun` — and the renderer simply never read the
 * field. Every persona was drawn with hair falling free. Wiring this up costs
 * nothing at generation time and buys back an axis of variation that is
 * already period-correct, because the era gating happened upstream.
 *
 * Order matters: the first match wins, so the specific forms have to precede
 * the generic words they contain. `braided_buns` must be tested before
 * `braided`, or every plait in the app resolves to a loose braid.
 */
const HAIRSTYLE_KEYWORDS: Array<[RegExp, HairSilhouette]> = [
  // Shaved and part-shaved forms first — `shaved_crown` contains no other
  // keyword, but `thin_shaved_crown` would otherwise match `thin`.
  [/(tonsure|shaved[_ ]?crown|monk|friar)/i, 'tonsure'],
  [/(mohawk|shaved[_ ]?sides|fade|undercut|sidecut)/i, 'shaved_sides'],

  // Bound and gathered forms.
  [/(twin[_ ]?buns|braided[_ ]?buns|pigtails|bunches|odango)/i, 'twin_buns'],
  [/(top[_ ]?knot|topknot|warrior[_ ]?knot|man[_ ]?bun|elder[_ ]?crown|elder[_ ]?knots)/i, 'top_knot'],
  [/(updo|piled[_ ]?high|high[_ ]?pinned|elaborate[_ ]?bun|pearl[_ ]?net|rolled[_ ]?and[_ ]?set|courtly)/i, 'updo'],
  [/(bun|chignon|gathered|knot|waved[_ ]?and[_ ]?pinned|veiled[_ ]?and[_ ]?bound)/i, 'bun'],
  [/(ponytail|tail|queue)/i, 'ponytail'],
  [/(tied[_ ]?back|swept[_ ]?back|slick(ed)?[_ ]?back|pulled[_ ]?back|high[_ ]?forehead|pompadour)/i, 'tied_back'],

  // Braided forms, most specific first.
  [/(braided[_ ]?crown|crown[_ ]?braid|braided[_ ]?halo)/i, 'braid_crown'],
  [/(cornrow|canerow)/i, 'cornrows'],
  [/(dreadlock|dreads|locs|locks[_ ]?rope|twists)/i, 'locs'],
  [/(plaits|twin[_ ]?braid|maiden[_ ]?braids|tribal[_ ]?braids|shaman[_ ]?braids|side[_ ]?braids)/i, 'braid_twin'],
  [/(braid|plait|elaborate[_ ]?braids)/i, 'braid_single'],

  // Cut forms.
  [/(bowl[_ ]?cut|short[_ ]?bowl|page[_ ]?cut|pageboy)/i, 'bowl'],
  [/(bob[_ ]?cut|shingled|blunt|cropped[_ ]?at[_ ]?the[_ ]?jaw|jaw[_ ]?length)/i, 'bob'],
  [/(bangs|fringe|combed[_ ]?forward|youth[_ ]?locks)/i, 'bangs'],
  [/(afro|halo)/i, 'afro'],
  [/(side[_ ]?part|center[_ ]?part|centre[_ ]?part|parted|side[_ ]?curls|side[_ ]?waves|rolled[_ ]?at[_ ]?the[_ ]?temples|oiled|back[_ ]?and[_ ]?sides)/i, 'swept'],

  // Hair kept under a cloth is bound underneath it, and the sliver that shows
  // at the temples should be flat rather than falling free.
  [/(covered|veiled|wrapped)/i, 'tied_back'],

  // Names that legitimately mean loose hair, listed so they count as *matched*.
  // Without this the audit reports a third of the corpus as an unrecognised
  // style, and a report that cries wolf on its commonest case is a report the
  // next person to read it will skip. A genuine gap should be rare and loud.
  [
    /(loose|wild|messy|tousled|flowing|waves?|curled|curls|locks|shoulder[_ ]?length|waist[_ ]?length|cropped|short[_ ]?styled|short[_ ]?modern|professional|contemporary|youth|maiden|novice|young[_ ]?lady|matron|elder|balding|thin[_ ]?long|thin[_ ]?sides|receding|full[_ ]?beard)/i,
    'loose',
  ],
];

export function classifyHairstyleName(name: string): { silhouette: HairSilhouette; matched: boolean } {
  for (const [pattern, silhouette] of HAIRSTYLE_KEYWORDS) {
    if (pattern.test(name)) return { silhouette, matched: true };
  }
  return { silhouette: 'loose', matched: false };
}

/**
 * What hair does when nobody has named a style for it.
 *
 * Two facts drive this and both are already on the spec.
 *
 * **An afro is not a style, it is what coily hair does.** Worn out and
 * unstraightened at any real length, tightly coiled hair stands away from the
 * skull in a halo — that is the default state, not an arrangement someone
 * chose, and it needs no name because for most of history nobody thought of it
 * as one. Making it wait for the word "afro" to appear in a table meant 8% of
 * the population had the texture and 0% had the silhouette. Locs and cornrows
 * *are* arrangements, and ancient ones — cornrows appear in African rock art
 * millennia before any of the periods this generator covers — so they take a
 * share of the same group rather than needing their own vocabulary.
 *
 * **Long hair gets tied back by anyone with work to do.** Gathering it into a
 * hanging tail is close to a human universal and it was entirely missing;
 * `weathering` already measures how much of this life was spent outdoors in
 * the weather, which is as good a proxy for "needs it out of the way" as the
 * spec has.
 *
 * Seeded on its own labels, so adding this cannot shift any other decision.
 */
function looseHairFallback(
  length: HairLength,
  texture: HairTexture,
  zone: string | undefined,
  weathering: number,
  seed: number
): HairSilhouette {
  const longEnough = length === 'medium' || length === 'long' || length === 'very_long';

  if (texture === 'coily' || texture === 'kinky') {
    // Below shoulder length coiled hair is nearly always worked into
    // something; at shorter lengths it is simply worn out.
    const roll = unit(seed, 'coiled-arrangement');
    const african = zone === 'SUB_SAHARAN_AFRICAN';
    if (length === 'very_short') return roll < 0.25 ? 'cornrows' : 'afro';
    if (!longEnough) return roll < 0.18 && african ? 'cornrows' : 'afro';
    // Medium and above: worked as often as worn out.
    if (roll < (african ? 0.26 : 0.16)) return 'cornrows';
    if (roll < (african ? 0.46 : 0.30)) return 'locs';
    if (roll < 0.58) return 'braid_twin';
    return 'afro';
  }

  if (longEnough) {
    // Hands-on outdoor work is what actually decides this. A tail is the
    // simplest answer and the commonest; a plain knot is next.
    const roll = unit(seed, 'gather-for-work');
    const needsItBack = 0.30 + weathering * 0.42;
    if (roll < needsItBack) {
      return roll < needsItBack * 0.62 ? 'ponytail' : 'tied_back';
    }
  }

  return 'loose';
}

// ---------------------------------------------------------------------------
// Ornaments
// ---------------------------------------------------------------------------

/**
 * What an item is made of, read out of its own name and material.
 *
 * Order matters twice over. The *material* table is consulted first and the
 * first hit wins, so the specific stones precede the generic metals — a "Gilt
 * Silver and Feather" ornament should take its bead colour from the gilt, not
 * from the word silver buried in the middle. And within the shape table, the
 * compound forms precede their parts: `hairpin` must beat `pin`, and
 * `kingfisher` must be tested before `feather` or the signature material of the
 * whole set resolves to a generic dark plume.
 */
const ORNAMENT_MATERIAL_KEYWORDS: Array<[RegExp, OrnamentMaterial]> = [
  [/kingfisher|tian.?tsui/i, 'kingfisher'],
  [/jade|nephrite|jadeite/i, 'jade'],
  [/turquoise/i, 'turquoise'],
  [/lapis|azurite/i, 'lapis'],
  [/coral/i, 'coral'],
  [/amber/i, 'amber'],
  [/ruby|garnet|carnelian/i, 'ruby'],
  [/emerald|malachite/i, 'emerald'],
  [/pearl|nacre|mother.of.pearl/i, 'pearl'],
  [/lacquer|cinnabar/i, 'lacquer'],
  [/shell|cowrie|cowry|conch/i, 'shell'],
  [/gilt|gilded|vermeil/i, 'gilt'],
  [/gold|golden/i, 'gold'],
  [/silver/i, 'silver'],
  [/bronze|brass/i, 'bronze'],
  [/copper/i, 'copper'],
  [/bone|ivory|tusk|antler/i, 'bone'],
  [/wood|ebony|sandalwood|bamboo/i, 'wood'],
  // Feathers by value band. Species is not legible at 96px; brightness is.
  // Birds only. `scarlet` and `crimson` used to live in the second of these and
  // had to come out: they are colour words, and the generator prefixes colours
  // onto item names freely, so a "Crimson Jeweled Veil" was having the *stone*
  // in it classified as a bright feather.
  [/ostrich|egret|swan|heron/i, 'plumeWhite'],
  [/peacock|macaw|parrot|quetzal|pheasant/i, 'plumeBright'],
  [/feather|plume|quill/i, 'plumeDark'],
  [/diamond|crystal|glass|gem|jewel/i, 'silver'],
];

interface OrnamentRule {
  pattern: RegExp;
  kind: OrnamentSpec['kind'];
  placement: OrnamentSpec['placement'];
  paired?: boolean;
  count?: number;
  /**
   * Rules sharing a group are alternatives, not additions. A "Feathered
   * Headdress" matches both the plume rule and the feather rule beneath it, and
   * without this it came out wearing a spray of feathers *and* a single feather
   * next to it — two answers to the same question stuck in one head.
   */
  group?: string;
}

const ORNAMENT_SHAPE_KEYWORDS: OrnamentRule[] = [
  // Feathered forms. A headdress of them is a spray; one named feather is one.
  { pattern: /plume|panache|aigrette|kalgi|feathered head|feather head/i, kind: 'plume', placement: 'crown', count: 3, group: 'feathery' },
  { pattern: /feathers/i, kind: 'plume', placement: 'crown', count: 3, group: 'feathery' },
  { pattern: /feather|quill/i, kind: 'feather', placement: 'crown', group: 'feathery' },

  // Worn *in* the hair rather than around the head.
  { pattern: /hairpin|hair pin|kanzashi|stickpin|skewer|bodkin/i, kind: 'pin', placement: 'temple' },
  { pattern: /comb|peineta/i, kind: 'comb', placement: 'crown' },

  // Hanging and set forms.
  { pattern: /strand|string|dangle|pendant|drop|tassel|fringe/i, kind: 'beadStrand', placement: 'side', paired: true },
  { pattern: /flower|blossom|rose|lotus|jasmine|marigold|bloom/i, kind: 'flower', placement: 'temple' },
  { pattern: /medallion|boss|plaque|disc|roundel|badge|brooch/i, kind: 'medallion', placement: 'brow' },
  { pattern: /bead|pearl|shell|cowrie/i, kind: 'beadStrand', placement: 'side', paired: true },
  { pattern: /jewel|gem|stone|jade|turquoise|coral|amber|ruby|emerald|diamond/i, kind: 'gem', placement: 'brow' },
  // A fitting, where the name says there is one. This deliberately does *not*
  // fire on a bare metal word: "Gold-Threaded Silk Turban" is a turban woven
  // with gold, not a turban with a gold pin in it, and an earlier version that
  // matched any precious metal stuck a hairpin into one head in twelve.
  { pattern: /ornament|filigree|inlaid|set with|studded|mounted|worked/i, kind: 'pin', placement: 'temple' },
];

function ornamentMaterialFor(text: string, fallback: OrnamentMaterial): OrnamentMaterial {
  for (const [pattern, material] of ORNAMENT_MATERIAL_KEYWORDS) {
    if (pattern.test(text)) return material;
  }
  return fallback;
}

/**
 * Read the decorative parts out of a head item.
 *
 * Returns at most two, and the drawing layer trims further. Restraint is the
 * whole difficulty here: the names are florid — "Gilt Silver and Kingfisher-
 * Feather Hair Ornament with Pearl Drops" is a real shape of thing in this data
 * — and honouring every noun in one produces a head that looks like a tackle
 * box. Two parts is enough to say what an object is.
 */
export function ornamentsFor(
  name: string,
  material: string,
  wealth: number
): { ornaments: OrnamentSpec[]; matched: boolean } {
  const text = `${name} ${material}`;
  const ornaments: OrnamentSpec[] = [];
  const used = new Set<string>();

  for (const rule of ORNAMENT_SHAPE_KEYWORDS) {
    if (ornaments.length >= 2) break;
    if (!rule.pattern.test(text)) continue;
    // A rule is spent once its kind is taken, and once anything in its group is.
    if (used.has(rule.kind) || (rule.group && used.has(rule.group))) continue;
    used.add(rule.kind);
    if (rule.group) used.add(rule.group);

    // Feathered forms take a feather colour; everything else takes the stone or
    // metal it is named for, falling back to something plausible for the shape.
    const feathery = rule.kind === 'feather' || rule.kind === 'plume';
    const material_ = feathery
      ? ornamentMaterialFor(text, 'plumeDark')
      : ornamentMaterialFor(text, rule.kind === 'comb' ? 'bone' : 'gilt');

    ornaments.push({
      kind: rule.kind,
      material: material_,
      placement: rule.placement,
      count: rule.count ?? 1,
      // Wealth buys size and stones, which is the one place it should show on a
      // head: a rich woman's hairpin is the same pin with a bigger jewel on it.
      scale: clamp01(0.3 + wealth * 0.7),
      paired: Boolean(rule.paired),
    });
  }

  return { ornaments, matched: ornaments.length > 0 };
}

/**
 * The one thing the persona is *actually wearing*, as opposed to the pieces
 * their tradition says they would.
 *
 * `appearance.jewelry` comes from `ornamentService`, which answers "what does
 * someone of this place and period wear" — a good question, and the reason
 * two thirds of personas have something at the throat. `appearance.accessory`
 * answers a different one: it is the item in the equipped accessory slot, the
 * object this specific person owns. Every persona has one, and the renderer
 * had never read the field, so the wooden pendant a Han farmer is carrying and
 * the copper taweez on an Ottoman weaver both stopped at the equipment list.
 *
 * The file's own precedence rule says `equippedItems > appearance`, and this is
 * the last place it was not being honoured.
 *
 * Most accessories are not visible in a bust, and the discipline here is
 * refusing them: bangles, rings, watches, purses, pouches and pipes are worn
 * and carried below the crop. Returning null for those is the correct answer,
 * not a gap — the item is still on the card, where a thing you own but cannot
 * see belongs.
 */
/**
 * What shape is hanging on the cord.
 *
 * Read before the shape table below, because these words decide the *object*
 * while that table only decides how it is hung. Ordered specific to general:
 * "Bone Claw Amulet" is a tooth and not a case, and a "Silver Cross Pendant" is
 * a cross rather than the generic drop that `pendant` alone would give it.
 */
const PENDANT_FORMS: Array<[RegExp, PendantForm]> = [
  [/crucifix|\bcross\b|\bankh\b|chi.?rho|\btau\b/i, 'cross'],
  [/crescent|hilal|lunula|moon\b/i, 'crescent'],
  // The written-charm containers, which are one object across half the world:
  // a small sealed box or tube on a cord.
  [/taweez|ta.?wiz|\bgau\b|mezuzah|hirz|reliquar|phylacter|scroll case|amulet case|prayer box/i, 'case'],
  [/claw|talon|\btooth\b|teeth|tusk|fang|canine/i, 'tooth'],
  [/medallion|locket|plaque|disc\b|disk\b|mirror|medal\b|coin\b|gorget/i, 'disc'],
];

function pendantFormFor(text: string): PendantForm {
  const found = PENDANT_FORMS.find(([pattern]) => pattern.test(text));
  return found ? found[1] : 'drop';
}

/**
 * Which nose ornament. Ordered by how specific the word is: a nath is a hoop
 * and would answer to `ring` as well, so it has to be seen first.
 */
function noseFormFor(text: string): NoseForm {
  if (/\bnath\b|nathni|nathiya|bulaq/i.test(text)) return 'nath';
  if (/septum/i.test(text)) return 'septum';
  if (/stud|\bphul\b|\blaung\b|\bpin\b/i.test(text)) return 'stud';
  return 'ring';
}

const ACCESSORY_SHAPES: Array<[RegExp, JewelrySpec['type']]> = [
  // Over the shoulder rather than round the throat, so it has to be seen before
  // the strand words below claim it: a sacred thread is cotton cord and the
  // word "thread" would otherwise never reach a rule at all.
  [/sacred thread|janeu|janai|yajnopavita|poonal|upanayana|shoulder cord|baldric/i, 'thread'],
  // Ear ornaments before the generic strand words: "Ear Plugs" and "Shell
  // Earrings" both contain a material that would otherwise route them to a
  // necklace.
  [/ear.?plug|ear.?spool|earring|ear.?stud|ear.?ring/i, 'earrings'],
  // Before the brooch rule, which owns the word "pin": a Nose Pin routed there
  // was pinned to the wearer's chest, and a Nose Ring matched nothing at all
  // and was dropped.
  [/nose ?(?:ring|stud|pin|jewel|piece)|\bnath\b|nathni|nathiya|bulaq|septum|nostril|\bphul\b|\blaung\b/i, 'nose'],
  [/brooch|fibula|clasp|\bpin\b|seal\b|badge/i, 'brooch'],
  // Hung on a cord: the pendant is the part that reads, so these are drawn as a
  // chain rather than as a beaded strand.
  [/pendant|amulet|talisman|charm|taweez|cross|crucifix|medallion|locket|gorget/i, 'chain'],
  [/necklace|bead|strand|rosary|mala|rudraksha|torc|collar/i, 'necklace'],
  [/circlet|diadem|fillet|headband|browband/i, 'circlet'],
];

/**
 * The few substances the ornament vocabulary does not already name.
 *
 * This used to be a table of its own — seven slots, one of them a bucket called
 * `gems` that swallowed jade, turquoise, lapis, amber, coral, garnet and
 * carnelian alike. `ORNAMENT_MATERIAL_KEYWORDS` above has named every one of
 * those separately since the headwear ornaments were written, so what is left
 * here is only the words that table has no reason to know: the base metals a
 * lay description reaches for, and the humble stuff — clay, seed, gourd — that
 * is not a gemstone and not a metal and had to go somewhere.
 */
const ACCESSORY_FALLBACK_MATERIALS: Array<[RegExp, OrnamentMaterial]> = [
  [/pewter|tin\b/i, 'silver'],
  [/iron|steel|metal|alloy/i, 'bronze'],
  [/faience|glazed|frit/i, 'faience'],
  [/jet\b|lignite/i, 'jet'],
  // The ornament vocabulary files feathers by brightness rather than by bird,
  // and a feather worn as jewellery is a display feather by definition.
  [/feather|plume|quill|down/i, 'plumeBright'],
  [/crystal|glass|obsidian|bead/i, 'glass'],
  [/tooth|horn|claw|shell/i, 'bone'],
  [/stone|gem|jewel/i, 'carnelian'],
  [/seed|clay|terracotta|fired|baked|nut|gourd|cord|fibre|fiber/i, 'wood'],
];

function accessoryMaterialFor(text: string): OrnamentMaterial {
  const named = ORNAMENT_MATERIAL_KEYWORDS.find(([pattern]) => pattern.test(text));
  // A feather is a real answer for a headdress and a wrong one for a pendant,
  // so the plume bands are declined here and the piece falls through to its
  // humbler reading.
  if (named && !String(named[1]).startsWith('plume')) return named[1];
  const fallback = ACCESSORY_FALLBACK_MATERIALS.find(([pattern]) => pattern.test(text));
  // Clay and seed are the commonest accessory materials in the app. Wood is the
  // right default for both: matte, mid-value, and it takes the same modelling.
  return fallback ? fallback[1] : 'wood';
}

/**
 * The stone a set of gem hexes stands for.
 *
 * `ornamentService` chose the stone, recorded it as colours, and names it on
 * the card; `stoneMaterialForHex` is that same identification, so the portrait
 * and the card cannot disagree. The hue fallback below only runs for colours
 * that did not come from those sets — a hand-authored fixture, an imported
 * persona — and is deliberately coarse, because guessing a stone from a colour
 * is a guess and should not look like anything better.
 */
const STONE_HUES: Array<[number, OrnamentMaterial]> = [
  [18, 'carnelian'], [352, 'ruby'], [140, 'jade'],
  [174, 'turquoise'], [222, 'lapis'], [8, 'coral'], [42, 'amber'],
];

function stoneForHexes(hexes: string[] | undefined): OrnamentMaterial | undefined {
  if (!hexes?.length) return undefined;
  const known = stoneMaterialForHex(hexes[0]);
  if (known) return known;

  const hsl = rgbToHsl(hexToRgb(hexes[0]));
  // A near-neutral bead is shell or glass, not a washed-out ruby: below this
  // chroma the hue carries no information and matching on it invents a stone.
  if (hsl.s < 0.14) return hsl.l > 0.62 ? 'shell' : 'glass';
  return STONE_HUES.reduce((best, entry) =>
    hueGap(hsl.h, entry[0]) < hueGap(hsl.h, best[0]) ? entry : best)[1];
}

/**
 * Jewellery as it arrives from `ornamentService`, in the vocabulary the
 * renderer draws in.
 *
 * The service still speaks the old seven-slot union — it is shared with the
 * card, the equipment panel and the saved-persona format, and those have no
 * reason to learn about kingfisher feather. So the translation happens here,
 * once, at the boundary: `gems` becomes whichever stone the piece actually
 * carries, and a metal piece keeps its metal and gains the stone set into it.
 */
function normalizeJewelry(
  pieces: Array<{ type?: string; material?: string; style?: string; scale?: string; gems?: string[] }>
): JewelrySpec[] {
  return pieces.flatMap(piece => {
    if (!piece?.type) return [];
    const stone = stoneForHexes(piece.gems);
    const raw = String(piece.material || 'bronze');
    // `gems` was never a material — it was the absence of one. A piece filed
    // under it *is* its stone, and if the stones went missing on the way here
    // the safest reading is the commonest bead in the record.
    const material: OrnamentMaterial =
      raw === 'gems' ? (stone || 'carnelian') : accessoryMaterialFor(raw);
    const style = (piece.style || 'simple') as JewelrySpec['style'];
    return [{
      type: piece.type as JewelrySpec['type'],
      material,
      // A piece drawn *in* its stone does not also have one set into it.
      stone: stone && stone !== material ? stone : undefined,
      style,
      // Older saved personas predate the field. Reading it off the style is the
      // best available guess and is the relationship the two used to have to
      // each other implicitly, so nothing that already exists changes size.
      scale: (piece.scale as JewelrySpec['scale'])
        || (style === 'chunky' ? 'large' : style === 'delicate' ? 'small' : 'medium'),
    }];
  });
}

export function accessoryJewelryFor(
  accessory: { name?: string; material?: string } | null | undefined,
  wealth: number
): JewelrySpec | null {
  if (!accessory?.name) return null;
  const text = `${accessory.name} ${accessory.material || ''}`;
  if (/^\s*none\s*$/i.test(accessory.name)) return null;

  const shape = ACCESSORY_SHAPES.find(([pattern]) => pattern.test(text));
  if (!shape) return null;

  const material = accessoryMaterialFor(text);

  const pendant = pendantFormFor(text);
  return {
    type: shape[1],
    material,
    pendant,
    nose: shape[1] === 'nose' ? noseFormFor(text) : undefined,
    // A metal amulet on a wealthy neck has something set in it; a clay one does
    // not, and the stone is only offered where the piece is not already stone.
    stone: wealth > 0.66 && METALS.has(material) ? 'carnelian' : undefined,
    // Style is workmanship and wealth buys it: a destitute persona's amulet is
    // a bead on a cord.
    style: wealth > 0.66 ? 'ornate' : wealth > 0.3 ? 'simple' : 'delicate',
    // Scale is *not* wealth, and tying it to wealth would be the same mistake
    // the clothing palette made. An amulet, a talisman, a charm is a small
    // object on anybody; a plate, a gorget or a collar is a large one on a
    // pauper. So it comes from what the thing is.
    scale: /gorget|collar|plate|torc|breastplate|disc/i.test(text) ? 'large'
      : /amulet|charm|talisman|token|stud|band/i.test(text) ? 'small'
      : 'medium',
  };
}

/** Substances that behave as the body of a piece rather than as its stone. */
const METALS = new Set<OrnamentMaterial>(['gold', 'gilt', 'silver', 'bronze', 'copper']);

/**
 * Add the worn accessory to the traditional pieces, unless it would double up.
 *
 * Added rather than substituted: the tradition list and the equipped slot are
 * two different claims about the same person and both are true. But a persona
 * whose tradition already gives them a strand and who is also carrying a string
 * of clay beads should not be drawn wearing two necklaces — at 96px the second
 * one lands on the first and reads as a thick smear rather than as two objects.
 * One piece per place on the body.
 */
function withAccessory(pieces: JewelrySpec[], accessory: JewelrySpec | null): JewelrySpec[] {
  if (!accessory) return pieces;
  // `necklace` and `chain` occupy the same rows of throat, so they collide with
  // each other as well as with themselves.
  const atThroat = (type: JewelrySpec['type']) => type === 'necklace' || type === 'chain';
  const taken = pieces.some(piece =>
    piece.type === accessory.type || (atThroat(piece.type) && atThroat(accessory.type)));
  return taken ? pieces : [...pieces, accessory];
}

/**
 * How a garment is decorated, read out of its name and material.
 *
 * Ordered by how much of the cloth the treatment claims. A robe can be brocade
 * *and* fur-trimmed, and those coexist happily — one is the field and one is
 * the edge — but it cannot be brocade and printed, so the field treatments are
 * mutually exclusive by group and the edge treatments by another.
 */
const GARMENT_SURFACE_KEYWORDS: Array<{
  pattern: RegExp;
  kind: GarmentSurfaceSpec['kind'];
  group: 'field' | 'edge';
}> = [
  { pattern: /brocade|damask|figured|jacquard|tissue|cloth of gold|cloth of silver/i, kind: 'brocade', group: 'field' },
  { pattern: /print|painted|block.?print|batik|resist|stamped|patterned/i, kind: 'print', group: 'field' },
  { pattern: /striped?|check|plaid|tartan|banded|narrow.strip|kente|ikat/i, kind: 'stripe', group: 'field' },

  { pattern: /embroider|needlework|couched|gold thread|silver thread|zari|gilded|gilt\b/i, kind: 'embroidery', group: 'edge' },
  { pattern: /lace|openwork|filet/i, kind: 'lace', group: 'edge' },
  { pattern: /\bfur\b|ermine|sable|miniver|shearling/i, kind: 'furTrim', group: 'edge' },
  { pattern: /bead|spangle|sequin|cowrie|shells?\b|jewel|gem.?set/i, kind: 'beading', group: 'edge' },
  // Last, so any word that says *what* the decoration is beats one that only
  // says there is some. These are the vague ones, and they have to be here
  // because the data leans on them: `Jeweled` is the single most common
  // adjective in `clothing.ts` — seventeen uses, more than `Simple` — and
  // between them these words account for more decorated garments than every
  // specific term above combined. They matched nothing at all, so the entire
  // surface layer sat at four per cent of portraits while the tables that feed
  // it described a much better dressed population than that.
  { pattern: /ornate|decorated|finely.worked|worked\b/i, kind: 'embroidery', group: 'edge' },
];

export function garmentSurfacesFor(
  name: string,
  material: string,
  wealth: number,
  adjectives: string[] = []
): { surfaces: GarmentSurfaceSpec[]; matched: boolean } {
  // The adjectives come last but are read the same way, and they are where most
  // of the matches actually are. The app names clothing as colour + material +
  // form — "Green Cotton Cap" — so a treatment almost never appears in the name
  // it is looking at; it appears in the adjective list beside it, where the
  // words are Embroidered, Beaded, Painted, Patterned and Gilded.
  const text = `${name} ${material} ${adjectives.join(' ')}`;
  const surfaces: GarmentSurfaceSpec[] = [];
  const usedGroups = new Set<string>();

  for (const rule of GARMENT_SURFACE_KEYWORDS) {
    if (usedGroups.has(rule.group)) continue;
    if (!rule.pattern.test(text)) continue;
    usedGroups.add(rule.group);

    // Metal thread is named often enough to be worth honouring; otherwise the
    // treatment takes a plausible default for what it is. Fur is not painted
    // in the ornament palette at all — it takes the garment's own accent.
    const material_ = ornamentMaterialFor(
      text,
      rule.kind === 'furTrim' ? 'bone'
        : rule.kind === 'beading' ? 'pearl'
        : rule.kind === 'lace' ? 'pearl'
        : 'gold'
    );

    surfaces.push({
      kind: rule.kind,
      material: material_,
      // Cloth of gold on a noble is not the same object as a printed cotton on
      // a farmer, and the difference at this size is mostly density.
      //
      // Beading is the exception and has to be, because it is the one treatment
      // the poor own more of than the rich: cowrie, shell and seed work is a
      // dense mass sewn over a whole edge. Scaled down by wealth it fell to
      // every third pixel of a two-pixel band, which is nothing — a shell dance
      // skirt rendered as bare cloth.
      intensity: rule.kind === 'beading'
        ? clamp01(0.55 + wealth * 0.45)
        : clamp01(0.35 + wealth * 0.65),
    });
  }

  return { surfaces, matched: surfaces.length > 0 };
}

/**
 * Cloth that was patterned on the loom or in the dye vat, where the item's own
 * name never says so.
 *
 * The keyword table above only fires when a word in the item says a treatment,
 * and measured over 500 personas that is 4.4% of them: the other 95.6% wear
 * undecorated cloth. That is not what the tables are describing. The app names
 * clothing as colour + material + form — "Indigo Cotton Dhoti" — and a fibre in
 * a place and a century is *already* a claim about how the cloth looked. Block-
 * printed and resist-dyed cotton is what cotton was across the Indian Ocean;
 * warp-faced stripes are what a camelid-wool bolt was in the Andes; strip-woven
 * cloth is banded because of how it is made; figured silk is what silk was for
 * anyone who could afford silk at all.
 *
 * So this is the second pass, and it only runs where the first found nothing.
 * Deliberately conservative: one field treatment at most, gated on a seeded
 * roll so a village does not come out uniformly patterned, and drawn quieter
 * than a named treatment — an item that says "Silk Brocade" should still beat
 * an inferred figured silk.
 */
type Fibre = 'silk' | 'cotton' | 'wool' | 'linen' | 'other';

function fibreOf(material: string): Fibre {
  const m = material.toLowerCase();
  if (/silk|satin|damask|brocade|tussar|muga|shantung|taffeta/.test(m)) return 'silk';
  // `twill` is deliberately absent: it is a weave, not a fibre, and having it
  // here classified "Wool Twill" as cotton before the wool rule below ever saw
  // it. Anything genuinely cotton says cotton somewhere in the name.
  if (/cotton|calico|muslin|chintz|khadi|denim|drill|poplin|gingham/.test(m)) return 'cotton';
  if (/wool|worsted|tweed|serge|flannel|alpaca|llama|vicu|camelid|cashmere|pashmina/.test(m)) return 'wool';
  if (/linen|flax|hemp|ramie|jute|nettle/.test(m)) return 'linen';
  return 'other';
}

/**
 * Read in order, first match wins. `chance` is the share of personas meeting
 * the rule who actually get the treatment — none of these is universal, and a
 * rule at 1.0 would put the same cloth on every farmer in the province.
 */
const WEAVE_RULES: Array<{
  fibre: Fibre[];
  zones?: string[];
  eras?: string[];
  /** Minimum wealth, 0..1, on the ornament scale. */
  floor?: number;
  /** Maximum wealth, exclusive. */
  ceiling?: number;
  kind: GarmentSurfaceSpec['kind'];
  material: OrnamentMaterial;
  chance: number;
}> = [
  // Figured silk — brocade, damask, tissue. The point of owning silk.
  { fibre: ['silk'], floor: 0.35, kind: 'brocade', material: 'gold', chance: 0.75 },
  // Plain silk sometimes came off the loom striped instead.
  { fibre: ['silk'], ceiling: 0.35, kind: 'stripe', material: 'cloth', chance: 0.25 },
  // Block printing, batik, ikat, ajrakh: the signature of Indian Ocean cotton,
  // reaching every wealth level and every century this app covers.
  {
    fibre: ['cotton'], zones: ['SOUTH_ASIAN', 'SOUTHEAST_ASIAN'],
    kind: 'print', material: 'cloth', chance: 0.55,
  },
  // Striped weaves run from the Maghreb to the Levant on both fibres.
  { fibre: ['cotton', 'wool'], zones: ['MENA'], kind: 'stripe', material: 'cloth', chance: 0.5 },
  // Andean warp-faced stripe, which is a property of the weaving, not of rank.
  // Cotton belongs here beside the camelid wool: the coastal valleys wove it
  // and banded it the same way the highlands banded alpaca.
  {
    fibre: ['wool', 'cotton'], zones: ['SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    kind: 'stripe', material: 'cloth', chance: 0.6,
  },
  // Narrow strip-weave is banded because it is sewn up from four-inch lengths.
  // `strip_weave` already draws the named kente and aso oke; this is the rest.
  {
    fibre: ['cotton', 'wool'], zones: ['SUB_SAHARAN_AFRICAN'],
    kind: 'stripe', material: 'cloth', chance: 0.55,
  },
  // Check, plaid and tweed are cheap only once a power loom exists, so these
  // two are the one pair of rules that genuinely needs an era gate.
  {
    fibre: ['wool'], zones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
    eras: ['INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'],
    kind: 'stripe', material: 'cloth', chance: 0.4,
  },
  {
    fibre: ['cotton'], zones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
    eras: ['INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'],
    kind: 'print', material: 'cloth', chance: 0.4,
  },
  // Shima: striped cotton, the ordinary town dress of late Edo and after.
  { fibre: ['cotton'], zones: ['EAST_ASIAN'], kind: 'stripe', material: 'cloth', chance: 0.3 },
];

/** Words that say the cloth is plain, and are to be believed. */
const SAYS_PLAIN = /plain|simple|rough|coarse|undyed|homespun|sackcloth|unbleached|humble|cheap/i;

/**
 * Treatments that a coarse grade of cloth argues against, as opposed to ones it
 * says nothing about.
 *
 * The generator writes quality into the *material* — "rough cotton", "coarse
 * wool", "cheap silk" — and applied flatly that would veto everything, which is
 * wrong in a specific way: a stripe in the Andes or the Sahel comes off the loom
 * with the cloth, so rough alpaca is striped rough alpaca. Printing, figuring
 * and needlework are extra work done to finished cloth, and nobody does extra
 * work to sackcloth.
 */
const SPARED_BY_COARSE = new Set<GarmentSurfaceSpec['kind']>(['stripe']);

export function inferGarmentSurfaces(
  name: string,
  material: string,
  zone: string,
  era: string,
  wealth: number,
  seed: number,
  adjectives: string[] = []
): GarmentSurfaceSpec[] {
  const fibre = fibreOf(material);
  const surfaces: GarmentSurfaceSpec[] = [];
  if (fibre === 'other') return surfaces;
  // Quieter than the named path: this is a guess about a bolt of cloth, not a
  // description of one.
  const intensity = clamp01(0.26 + wealth * 0.5);
  // An item *named* plain is plain, whatever it is woven from.
  if (SAYS_PLAIN.test(`${name} ${adjectives.join(' ')}`)) return surfaces;
  const coarse = SAYS_PLAIN.test(material);

  for (const rule of WEAVE_RULES) {
    if (!rule.fibre.includes(fibre)) continue;
    if (rule.zones && !rule.zones.includes(zone)) continue;
    if (rule.eras && !rule.eras.includes(era)) continue;
    if (rule.floor !== undefined && wealth < rule.floor) continue;
    if (rule.ceiling !== undefined && wealth >= rule.ceiling) continue;
    if (coarse && !SPARED_BY_COARSE.has(rule.kind)) break;
    if (unit(seed, `weave-${rule.kind}`) < rule.chance) {
      surfaces.push({ kind: rule.kind, material: rule.material, intensity });
    }
    break;
  }

  // A worked band at the neckline, which is what the wealthy did to a garment
  // whose field was left plain. Independent of the field rule above: an edge
  // and a field coexist happily, which is the split the keyword table already
  // makes.
  if (wealth >= 0.7 && !coarse && unit(seed, 'weave-edge') < 0.5) {
    surfaces.push({ kind: 'embroidery', material: 'gold', intensity });
  }

  return surfaces;
}

/**
 * What the item's own adjectives say has happened to it.
 *
 * Matched against the adjectives and the name together, because the data puts
 * the same fact in either place — "Patched Cloak" and `adjectives: ['Patched']`
 * both occur. Material is deliberately *not* in the text: "Rough Wool" is a
 * statement about the yarn, not about the garment's condition, and reading it
 * as wear would put a mend on every coarse cloth in the app.
 */
const GARMENT_WEAR_KEYWORDS: Array<[RegExp, GarmentWearSpec['kind']]> = [
  [/patch|mended|repaired/i, 'patched'],
  [/darn/i, 'darned'],
  [/torn|ragged|tattered|frayed|threadbare/i, 'torn'],
  [/faded|bleached|sun.?bleached|washed.?out/i, 'faded'],
  [/worn|old|shabby|battered|weathered|second.?hand|hand.?me.?down/i, 'worn'],
  [/stained|soiled|dirty|grimy|sooty|greasy|filthy|blood/i, 'stained'],
];

/**
 * Wear the item claims, plus wear its owner's circumstances imply.
 *
 * Two sources, because the adjectives are sparse: about a fifth of the entries
 * in `clothing.ts` carry one, so relying on them alone would leave four poor
 * personas in five in clothes that look newly cut. Poverty is the other source,
 * and it is the honest one — a garment worn by someone with no second garment
 * is worn, whether or not the table happened to say so. Named wear is drawn
 * harder than implied wear, so an item that *says* patched gets a patch and an
 * item that is merely poor gets rubbed crests and a little soil.
 */
export function garmentWearFor(
  name: string,
  adjectives: string[],
  wealth: string,
  age: number,
  seed: number
): GarmentWearSpec[] {
  const text = `${name} ${adjectives.join(' ')}`;
  const wear: GarmentWearSpec[] = [];
  const seen = new Set<GarmentWearSpec['kind']>();

  for (const [pattern, kind] of GARMENT_WEAR_KEYWORDS) {
    if (seen.has(kind) || !pattern.test(text)) continue;
    seen.add(kind);
    wear.push({ kind, intensity: 0.7 });
  }

  // Implied wear. Only the two bottom tiers: "comfortable" is precisely the
  // level at which a person owns something to change into, and drawing every
  // portrait in the app as threadbare would say something about the past that
  // is no truer than drawing them all in new cloth.
  const poor = wealth === 'poor' ? 1 : wealth === 'modest' ? 0.45 : 0;
  if (poor > 0) {
    // Cloth outlasts fashion and is handed on, so an older wearer is more
    // likely to be in something that has already had a life.
    const carried = poor * (0.6 + Math.min(0.4, Math.max(0, age - 25) / 100));
    const roll = unit(seed, 'wear');
    if (!seen.has('worn') && roll < carried) {
      wear.push({ kind: 'worn', intensity: 0.35 + carried * 0.3 });
      seen.add('worn');
    }
    if (!seen.has('patched') && wealth === 'poor' && unit(seed, 'wear-patch') < 0.45) {
      wear.push({ kind: 'patched', intensity: 0.5 });
      seen.add('patched');
    }
    if (!seen.has('stained') && unit(seed, 'wear-soil') < poor * 0.4) {
      wear.push({ kind: 'stained', intensity: 0.4 });
    }
  }

  return wear;
}

/**
 * How weathered this face is, from the trade and from the years in it.
 *
 * Age multiplies rather than adds. Sun damage accumulates — it is the total
 * exposure that shows, so a lifetime at sea reads on a sixty-year-old and barely
 * at all on a nineteen-year-old who started last spring. Without the age term a
 * fishing village came out with weather-beaten children in it.
 *
 * The appearance table still gets its say: where it explicitly calls a
 * complexion weathered, that is taken as a floor rather than being averaged
 * away, because it is a statement about this individual and the profession is
 * only a statement about the average person doing that job.
 */
function weatheringFor(
  profession: string | undefined,
  skinTexture: string | undefined,
  age: number
): number {
  const fromTrade = profession
    ? classify(profession, WEATHERING_KEYWORDS, 0.25)
    : 0.25;
  // Ramped over a working life and levelling off: most of the damage is done by
  // the forties, and a seventy-year-old is not three times the fifty-year-old.
  const exposure = clamp01((age - 12) / 34);
  const stated = /weathered|rough|leathery|sun|tanned|ruddy/i.test(String(skinTexture || ''))
    ? 0.7
    : 0;
  return clamp01(Math.max(fromTrade * exposure, stated));
}

function classify<T>(name: string, table: Array<[RegExp, T]>, fallback: T): T {
  for (const [pattern, value] of table) {
    if (pattern.test(name)) return value;
  }
  return fallback;
}

/**
 * Same classification, but reporting whether anything actually matched.
 *
 * The adapter's keyword tables are the part of this system most likely to be
 * wrong, because the app's clothing data is far larger than any list I can
 * write by hand — so the audit harness needs to be able to ask "which garment
 * names did you fail to recognise?" rather than silently taking the fallback.
 */
export function classifyGarmentName(name: string): { kind: GarmentKind; matched: boolean } {
  for (const [pattern, kind] of GARMENT_KEYWORDS) {
    if (pattern.test(name)) return { kind, matched: true };
  }
  return { kind: 'tunic', matched: false };
}

export function classifyHeadwearName(name: string): { kind: HeadwearKind; matched: boolean } {
  for (const [pattern, kind] of HEADWEAR_KEYWORDS) {
    if (pattern.test(name)) return { kind, matched: true };
  }
  return { kind: 'cap', matched: false };
}

interface Piece {
  name?: string;
  material?: string;
  color?: string;
  /**
   * `ClothingPiece.adjectives` from `clothing.ts`, carried through unchanged.
   * Patched, Faded, Darned, Embroidered, Beaded — the words the card already
   * prints next to the picture.
   */
  adjectives?: string[];
}

function isEmptyPiece(piece: Piece | null | undefined): boolean {
  if (!piece || !piece.name) return true;
  const name = piece.name.trim().toLowerCase();
  return name === '' || name === 'none' || name === 'barefoot' || name === 'nothing';
}

/**
 * What the item says first, and what its fibre and its province say after.
 *
 * The two passes are in this order because a name that claims a treatment is
 * evidence and a fibre in a place is an inference, and where they disagree the
 * item wins. They never combine: an item that already says "Silk Brocade" gets
 * nothing added to it, or the same bolt of cloth ends up brocaded and striped.
 */
function garmentSurfaceSpecs(
  piece: Piece, source: PortraitSource, wealth: number, seed: number
): GarmentSurfaceSpec[] {
  const named = garmentSurfacesFor(
    piece.name || '', piece.material || '', wealth, piece.adjectives || []);
  if (named.matched) return named.surfaces;
  return inferGarmentSurfaces(
    piece.name || '', piece.material || '',
    source.culturalZone || 'EUROPEAN', String(source.era || ''),
    wealth, seed, piece.adjectives || []);
}

/**
 * When the app supplies a garment or covering with no colour of its own, the
 * material is the best clue available. A steel helmet painted in the persona's
 * palette secondary reads as a gold bowl, which is how you end up with medieval
 * Londoners in party hats.
 */
const MATERIAL_COLORS: Array<[RegExp, string]> = [
  [/steel|iron/i, '#8e949c'],
  [/bronze/i, '#a8763f'],
  [/brass/i, '#b5913f'],
  [/silver/i, '#b9bcc2'],
  [/gold/i, '#cfa044'],
  [/linen/i, '#d9d0bb'],
  [/cotton|muslin|calico/i, '#cfc7b4'],
  [/silk|satin/i, '#8c6a7a'],
  [/wool|felt|broadcloth/i, '#6b6153'],
  [/leather|hide/i, '#6b482f'],
  [/fur|sheepskin/i, '#8b7358'],
  [/straw|reed|grass|raffia/i, '#c2a463'],
  // Warp-dyed indigo, faded by wear on the crests — the colour denim *is*.
  [/denim|dungaree/i, '#43597c'],
  [/khaki/i, '#b09a6f'],
  // Bamboo and its relatives were falling through to the generic garment
  // palette, which is why a woven bamboo hat came out the same grey as a felt
  // one. Split bamboo weathers to a warmer, slightly greener straw than reed.
  [/bamboo|rattan|cane|sedge|palm leaf|pandanus/i, '#c0a566'],
  [/barkcloth|bark cloth|fibre|fiber|plant/i, '#a98a63'],
];

function colorForMaterial(material: string | undefined): string | null {
  if (!material) return null;
  for (const [pattern, color] of MATERIAL_COLORS) {
    if (pattern.test(material)) return color;
  }
  return null;
}

/**
 * The colour of a material that is never dyed, or null for anything that is.
 *
 * Linen, hemp, wool and cotton all take dye, so a generated colour on those is
 * meaningful and must win. Sedge, straw, bark, hide, wood and metal do not, and
 * for those the material *is* the colour — which is the whole reason a sedge
 * sunhat was arriving at the renderer as a lilac bowler.
 */
function intrinsicColorFor(material: string | undefined): string | null {
  if (!hasIntrinsicColor(material)) return null;
  return colorForMaterial(material);
}

/**
 * A colour off an item, which may be a hex — or may be the name of a dye.
 *
 * `applyColorToItem` in `characterGenerator.ts` names an item for its colour
 * and then stores that *word* in `item.color`, because the word is what the
 * equipment panel prints. The renderer wanted a hex, and nothing translated
 * between them, so every dyed garment and every dyed hat in the app has been
 * arriving here as an unparseable string.
 *
 * What it did with one is the interesting part. `hexToRgb` strips a `#`, and
 * for anything six characters or longer runs `parseInt(…, 16)` over the
 * result — so "Rust" fell to the grey fallback and came out drab, while
 * "Russet", "Indigo" and "Madder" parsed to *NaN channels*: `r: null, g: null,
 * b: 14`. That is why the wall of head coverings was cream. It was not a
 * palette decision at all; it was arithmetic on the word.
 *
 * `hexForName` has existed all along for exactly this, and its own comment
 * says to prefer it wherever the colour was chosen, because name → hex is
 * lossless and hex → name is not. It was simply never called from here.
 */
function resolveColor(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }
  if (trimmed.startsWith('rgb')) return trimmed;
  return hexForName(trimmed) || null;
}

/**
 * The dye an item is named for.
 *
 * For most equipped items the colour is *only* in the name — "Rust Cotton
 * Cap", "Woad Head Wrap", "Green Linen Veil" all arrive with no `color` field
 * at all, because the generator built the name by prefixing a dye word and
 * then, for these paths, never wrote the word anywhere else. So the name is
 * not a label for the colour; it is the sole record of it, and reading it is
 * the only way the portrait can agree with the equipment panel beside it.
 *
 * First word wins. Dye words lead in every name this table produces, and
 * scanning further finds the material — "Green Linen Veil" in *White* Linen is
 * a real entry, and the right answer for the cloth is green.
 */
function colorFromName(name: string | undefined): string | null {
  if (!name) return null;
  for (const word of name.toLowerCase().split(/[\s,\-]+/)) {
    const hex = hexForName(word);
    if (hex) return hex;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

/**
 * One backdrop pair per cultural zone: a base for the field and a lighter
 * accent for the rake of key light across the upper left.
 *
 * These are all cool or neutral on purpose. Human complexions occupy a narrow
 * warm band — every one of them sits between about 20° and 40° of hue — so a
 * warm ground is a ground the face cannot separate from, no matter how the
 * lighting is handled. Zone character has to come from *which* cool it is
 * (northern steel, Sahelian petrol, indigo, ink-green) and from the accent,
 * not from putting brown behind brown.
 */
const ZONE_BACKGROUNDS: Record<string, [string, string]> = {
  EUROPEAN: ['#4a5a6a', '#8d9a9c'],
  MENA: ['#5c6272', '#a09a8c'],
  SOUTH_ASIAN: ['#4d4870', '#9b8fa8'],
  EAST_ASIAN: ['#3f5a55', '#8b9a8e'],
  SUB_SAHARAN_AFRICAN: ['#2f5560', '#9aa896'],
  NORTH_AMERICAN_PRE_COLUMBIAN: ['#4b5a4e', '#979c84'],
  NORTH_AMERICAN_COLONIAL: ['#445a5c', '#8e9a8e'],
  SOUTH_AMERICAN: ['#3d5a48', '#8ea183'],
  OCEANIA: ['#35606e', '#8fa9ac'],
};

/** Shortest distance between two hues, in degrees. */
const hueGap = (a: number, b: number): number =>
  Math.abs(((a - b) % 360 + 540) % 360 - 180);

/**
 * The guarantee behind the table above, and the one thing that has to hold for
 * a backdrop supplied from outside — the authenticity service picks colours for
 * place, not for legibility, and a warm earth from a context pack will happily
 * bury a warm complexion.
 *
 * The constraint is the whole *figure*, not the face. An earlier version of
 * this checked skin only, which let a green hemp robe sit on a green ground:
 * at this framing the garment occupies more of the silhouette than the head
 * does, so cloth has at least as much claim on the separation as skin.
 *
 * The zone colour sets the intent; the figure sets the constraint. A ground
 * that lands within 45° of either the skin's hue or the garment's is rotated
 * onto the complementary side of whichever it collides with (taking the branch
 * nearer the zone's own hue, so packs stay distinguishable), chroma is capped
 * so the ground never competes with the figure, and value is pushed away from
 * the skin's.
 */
/**
 * Hold a garment's three colours apart in value.
 *
 * Every named feature — a lapel facing, a sari border, a poncho band, a stoop
 * of fringe — is drawn in the secondary or the accent against the primary, and
 * a feature drawn in a colour that matches its ground is not drawn at all. The
 * clothing tables' palettes are not chosen with that in mind: they are chosen
 * to look like a wardrobe, and a wardrobe is full of three browns.
 *
 * So this is a floor, not a scheme. Hue is left exactly where the palette put
 * it — the historical claim is in the hue and it is not this function's to
 * make. Only lightness moves, and only when two colours are close enough that
 * one would vanish into the other.
 */
/**
 * Trim that is a different colour from the cloth it runs along.
 *
 * The lightness-only rule below is right about the *field* colours and wrong
 * about this one. A border, a facing, a woven band, an embroidered cuff — the
 * whole reason any of them exist is contrast, and a dyer putting a band on a
 * madder coat did not reach for a paler madder. Holding hue fixed here was not
 * declining to make a historical claim; it was making the claim that trim
 * matched, which is the one thing trim reliably did not do.
 *
 * It only fires on a *collision*: an accent already distinct in hue, or already
 * carrying real chroma, is left exactly where the tables put it. What it
 * catches is the case the clothing palettes produce constantly — three browns,
 * where the trim was drawn from the same six-entry list as the coat — and there
 * the accent contains no information to preserve.
 *
 * The rotation lands opposite the cloth rather than anywhere: complementary
 * trim is what reads at this size, and it is also what the surviving textiles
 * do. Chroma is floored rather than set, so a dull-but-distinct accent keeps
 * its own weight.
 */
function contrastingTrim(accent: string, primary: string, secondary: string, seed: number): string {
  const a = rgbToHsl(hexToRgb(accent));
  const p = rgbToHsl(hexToRgb(primary));
  if (hueGap(a.h, p.h) >= 32 && a.s >= 0.28) return accent;

  const s = rgbToHsl(hexToRgb(secondary));
  // Three branches around the complement, so a sheet of a hundred does not come
  // out with the same trim angle on every garment; the one that also clears the
  // secondary wins, since a band is usually sewn along a facing.
  const branches = [150, 180, 205, 130].map(d => (p.h + d) % 360);
  const best = branches.reduce((chosen, h) =>
    hueGap(h, s.h) > hueGap(chosen, s.h) ? h : chosen,
    branches[Math.floor(unit(seed, 'trim-hue') * branches.length)]);

  return rgbToHex(hslToRgb({
    h: best,
    s: Math.max(a.s, 0.42),
    // Value is left alone. `separateGarmentColors` has already put this colour
    // a legible distance from both grounds, and rotating hue does not undo it.
    l: a.l,
  }));
}

/**
 * Whether a skirted garment brings its own bodice.
 *
 * Both patterns are the ones `encounter/sprite/construction.ts` already sorts
 * silhouettes with; the answer has to be reached here rather than there so the
 * bust can reach it too. Anything that is not skirted is one piece of cloth and
 * gets `null` — the overwhelming majority.
 */
const SKIRTED_NAME = /\bskirt|petticoat|wrapper|lehenga|sari\b|saree/i;
/**
 * Cloth that goes over the shoulder as part of the same garment.
 *
 * `wrap\b` used to be on this list and had to come off it, for the same reason
 * it came off the drape pattern in `encounter/sprite/construction.ts`: a wrap
 * skirt is a skirt, and reading it as self-bodiced said the cloth continued up
 * over the chest. It does not — a wrap skirt is worn with a blouse, and the
 * blouse is the separate bodice this is meant to detect.
 */
const DRAPED_NAME = /sari\b|saree|odhani|dupatta|chunni|shawl|pallu|stole|himation|toga|rebozo/i;

function bodiceFor(name: string): BodiceSource | null {
  if (!SKIRTED_NAME.test(name)) return null;
  return DRAPED_NAME.test(name) ? 'self' : 'separate';
}

/**
 * Hold the garment's own colour off the skin it is worn against.
 *
 * The undyed materials are the whole problem, and they are the ones that cannot
 * be argued with: leather, hide, rawhide, bark cloth and fur all resolve to a
 * fixed mid-brown, because that is what they are. Skin over most of the app's
 * range is also a mid-brown. Measured across 400 personas, 19% had less than 35
 * of RGB distance between the cloth the sprite painted and the skin beside it,
 * and the closest pairs sat at *four* — a figure in a hide wrap and a figure
 * wearing nothing are the same picture at that distance, which is exactly the
 * complaint that sent me looking.
 *
 * Value only, and only when the hues already agree. A leather jerkin over pale
 * skin needs nothing done to it, and rotating a hue here would make tanned hide
 * some colour hide is not — but the *same* hide is legitimately lighter or
 * darker depending on how it was worked, so moving lightness costs nothing that
 * matters and is the axis the eye reads a silhouette along anyway.
 */
function separateFromSkin(hex: string, skinHex: string): string {
  const GAP = 0.15;
  const cloth = rgbToHsl(hexToRgb(hex));
  const skin = rgbToHsl(hexToRgb(skinHex));
  const delta = cloth.l - skin.l;
  if (Math.abs(delta) >= GAP) return hex;

  // Chroma, not HSL saturation. `s` for a dark brown like #6b482f is 0.39 —
  // higher than a mid indigo's — so gating on it excluded the tanned hides and
  // barkcloths this whole function exists for while letting pale cloth through.
  // The span between the channels is what the eye is actually reading, and by
  // that measure a hide is 0.24 and a madder red is 0.48.
  const rgb = hexToRgb(hex);
  const chroma = (Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b)) / 255;
  // A vivid dye reads as cloth at any value: saffron on tan skin is unmistakably
  // a garment even where the two are the same weight.
  if (chroma > 0.45) return hex;

  // Hue does the rest of the work: skin sits in a narrow band around 25–35°, so
  // a cloth outside that band is legible against it however dark either is. But
  // a near-neutral has no meaningful hue to compare — a charcoal apron scores
  // 240° purely on rounding noise, and letting it claim separation on that
  // basis is how a black work apron ends up invisible on a dark-skinned figure.
  if (chroma > 0.06) {
    let hueGap = Math.abs(cloth.h - skin.h);
    if (hueGap > 180) hueGap = 360 - hueGap;
    if (hueGap > 45) return hex;
  }

  const away = delta === 0 ? (skin.l > 0.5 ? -1 : 1) : Math.sign(delta);
  const target = skin.l + away * GAP;
  const clamped = target > 0.92 ? skin.l - GAP : target < 0.10 ? skin.l + GAP : target;
  return rgbToHex(hslToRgb({
    h: cloth.h, s: cloth.s, l: Math.max(0.07, Math.min(0.93, clamped)),
  }));
}

function separateGarmentColors(
  primary: string, secondary: string, accent: string, seed: number
): SpecColorSet {
  const GAP = 0.17;
  const shift = (hex: string, from: string): string => {
    const a = rgbToHsl(hexToRgb(hex));
    const b = rgbToHsl(hexToRgb(from));
    const delta = a.l - b.l;
    if (Math.abs(delta) >= GAP) return hex;
    // Move away from whichever side has room. Pushing a pale cloth paler until
    // it clips is how you get two whites instead of a white and a grey.
    const away = delta === 0 ? (b.l > 0.5 ? -1 : 1) : Math.sign(delta);
    const target = b.l + away * GAP;
    const clamped = target > 0.94 ? b.l - GAP : target < 0.08 ? b.l + GAP : target;
    return rgbToHex(hslToRgb({ h: a.h, s: a.s, l: Math.max(0.05, Math.min(0.95, clamped)) }));
  };
  const nextSecondary = shift(secondary, primary);
  return {
    primary,
    secondary: nextSecondary,
    // The accent has to clear both, or a trim can be legible against the cloth
    // and invisible against the facing it runs along. Value first, then hue:
    // the rotation preserves lightness, so doing it in this order means the
    // separation survives it.
    accent: contrastingTrim(
      shift(shift(accent, primary), nextSecondary), primary, nextSecondary, seed),
  };
}

function separateFromFigure(
  hex: string,
  skinHex: string,
  garmentHex: string | undefined,
  range: [number, number],
  chromaCap = 0.2
): string {
  const bg = rgbToHsl(hexToRgb(hex));
  const skin = rgbToHsl(hexToRgb(skinHex));
  const skinLum = luminance(hexToRgb(skinHex));
  const [lo, hi] = range;

  // Only a garment with real chroma can swallow a background. A grey-brown
  // homespun cannot, and treating it as a constraint would rotate every
  // backdrop in the app for no gain.
  const garment = garmentHex ? rgbToHsl(hexToRgb(garmentHex)) : null;
  const garmentBites = garment !== null && garment.s > 0.18;

  // The garment wants a wider berth than the skin does. Skin is never vivid, so
  // 45° of hue plus the value push below is enough to hold it apart; a
  // saturated dyed cloth against a desaturated ground of the same family reads
  // as one mass at 48° and only separates around 50.
  const collides = (h: number) =>
    hueGap(h, skin.h) < 45 || (garmentBites && hueGap(h, garment!.h) < 50);

  let hue = bg.h;
  if (collides(bg.h)) {
    // Complementary branches off whichever part of the figure we clashed with;
    // keep the one closer to where the zone wanted to be, and prefer a branch
    // that does not simply collide with the other half of the figure instead.
    const anchor = hueGap(bg.h, skin.h) < 45 ? skin.h : garment!.h;
    const candidates = [anchor + 120, anchor + 205, anchor + 160]
      .filter(h => !collides(h));
    const usable = candidates.length > 0 ? candidates : [anchor + 160];
    hue = usable.reduce((best, h) =>
      hueGap(bg.h, h) < hueGap(bg.h, best) ? h : best);
  }

  // A backdrop is scenery. Chroma here reads as "painted flat", and it steals
  // saturation contrast from the one saturated thing that matters, the figure.
  const sat = Math.min(bg.s, chromaCap);

  // Dark complexions want a backdrop lighter than they are, pale ones a darker
  // backdrop; either way the gap has to be real.
  const wantLighter = skinLum <= 0.42;
  let l = wantLighter ? Math.max(bg.l, skin.l + 0.14) : Math.min(bg.l, skin.l - 0.16);
  l = Math.max(lo, Math.min(hi, l));
  if (Math.abs(luminance(hslToRgb({ h: hue, s: sat, l })) - skinLum) < 0.12) {
    l = wantLighter ? Math.min(hi + 0.08, l + 0.1) : Math.max(lo - 0.08, l - 0.1);
  }

  return rgbToHex(hslToRgb({ h: hue, s: sat, l }));
}

/**
 * What the *century* does to a backdrop, as distinct from what the place does.
 *
 * The zone table above answers "where", and it was the only question being
 * asked: nine hundred years of European portraits came out of the same slate
 * blue with the same soft vignette, so a Frankish ploughman and a Victorian
 * clerk sat against identical walls. But a portrait is not only of a person in
 * a place, it is an artefact of a period, and the period is legible in the
 * ground long before you reach the sitter — the chalky tooth of fresco, the
 * deep panel of tempera, the raking single-window dark of oil, the silver flat
 * grey of an albumen print, the evenly lit studio wall of a modern photograph.
 *
 * So era carries value, chroma, surface and how hard the corners close, and
 * place keeps the hue. Both survive: a Ming backdrop and a Renaissance European
 * one are still different colours, and a prehistoric and a modern East Asian
 * one are now different pictures.
 */
const ERA_BACKDROPS: Record<string, {
  /** The value band the ground is allowed to occupy, before the figure has its say. */
  band: [number, number];
  /** Hard chroma cap. A backdrop is scenery; some centuries painted flatter scenery. */
  chroma: number;
  /** How strongly the ground is modelled — halo depth and top-to-bottom fall. */
  depth: number;
  /** Pushes the whole ground darker (positive) or lighter (negative). */
  lift: number;
  texture: BackgroundSpec['texture'];
  vignette: number;
}> = {
  // Open air and firelight; nothing here was made to be looked at indoors.
  PREHISTORY: {
    band: [0.13, 0.34], chroma: 0.13, depth: 1.0, lift: 0.5, texture: 'grain', vignette: 1.15,
  },
  // Lime plaster taking pigment while wet: pale, dry, faintly chalky, and lit
  // from everywhere at once the way a wall in a courtyard is.
  ANTIQUITY: {
    band: [0.32, 0.54], chroma: 0.17, depth: 0.6, lift: -0.9, texture: 'plaster', vignette: 0.7,
  },
  // Egg tempera on a gessoed panel — saturated, and deliberately flat.
  MEDIEVAL: {
    band: [0.20, 0.42], chroma: 0.26, depth: 0.55, lift: -0.3, texture: 'subtle', vignette: 0.95,
  },
  // Oil on canvas by one high window. The darkest ground of the six, and the
  // only one where the corners are doing real work.
  RENAISSANCE_EARLY_MODERN: {
    band: [0.08, 0.24], chroma: 0.15, depth: 1.4, lift: 0.7, texture: 'weave', vignette: 1.5,
  },
  // Albumen and collodion: chroma all but gone, silver grain everywhere.
  INDUSTRIAL_ERA: {
    band: [0.24, 0.46], chroma: 0.05, depth: 1.05, lift: 0.0, texture: 'grain', vignette: 1.3,
  },
  // A lit studio wall — flat, even, and slightly cool.
  MODERN_ERA: {
    band: [0.36, 0.60], chroma: 0.10, depth: 0.35, lift: -1.2, texture: 'none', vignette: 0.4,
  },
  FUTURE_ERA: {
    band: [0.32, 0.56], chroma: 0.12, depth: 0.3, lift: -1.1, texture: 'none', vignette: 0.35,
  },
};

function backgroundFor(
  source: PortraitSource,
  overrides: Record<string, any> | undefined,
  skinHex: string,
  garmentHex: string | undefined
): BackgroundSpec {
  const provided = overrides?.background;
  const zone = source.culturalZone || 'EUROPEAN';
  const [base, accent] = ZONE_BACKGROUNDS[zone] || ZONE_BACKGROUNDS.EUROPEAN;
  const era = ERA_BACKDROPS[source.era ? String(source.era) : ''];

  // The era moves the *band*, not the colour. Pre-shifting the hex and then
  // handing it to the separator was the obvious way round and it did nothing:
  // the separator clamps value into a fixed window and caps chroma, so every
  // century's adjustment was thrown away a line later and six eras came out as
  // one. The window is the thing to move.
  const band: [number, number] = era ? era.band : [0.17, 0.44];
  // The accent only ever appears as a rake of light across the upper corner, so
  // it lives a band above the base rather than competing with it.
  const accentBand: [number, number] = [
    Math.min(0.82, band[0] + 0.25), Math.min(0.9, band[1] + 0.18),
  ];
  /**
   * The two social facts the ground is allowed to know about.
   *
   * A portrait of somebody who mattered locally was a different object from a
   * portrait of somebody who did not — better ground, more of the painter's
   * time — so a sitter of standing gets a slightly richer, slightly deeper
   * backdrop, and an exceptional persona a touch more of the same. Both effects
   * are deliberately small. The era and the place still have to be legible
   * through them, and the moment a viewer can read wealth off the wall faster
   * than they can read the century, this has gone too far.
   */
  const lift = (era?.lift ?? 0)
    + (source.hasDistinction ? -0.25 : 0)
    + (source.rarityTier === 'legendary' ? -0.3 : source.rarityTier === 'rare' ? -0.15 : 0);
  const chroma = (era ? era.chroma : 0.2)
    * (source.hasDistinction ? 1.3 : 1)
    * (source.rarityTier === 'legendary' ? 1.25 : source.rarityTier === 'rare' ? 1.12 : 1);
  const depth = (era?.depth ?? 1)
    * (source.hasDistinction ? 1.12 : 1)
    * (source.rarityTier === 'legendary' ? 1.15 : 1);

  // A context pack has already chosen for both place and period out of real
  // sources, so era treatment only fills in what the pack left unsaid.
  return {
    // An explicitly supplied backdrop is still held to the contrast rule — the
    // authenticity service picks for place, not for legibility.
    base: separateFromFigure(provided?.base || base, skinHex, garmentHex, band, chroma),
    accent: separateFromFigure(
      provided?.accent || accent, skinHex, garmentHex, accentBand, chroma + 0.06),
    vignette: provided?.vignette ?? true,
    vignetteStrength: era?.vignette ?? 1,
    depth,
    lift,
    texture: provided?.texture || era?.texture || 'subtle',
  };
}

// ---------------------------------------------------------------------------
// Condition and mood
// ---------------------------------------------------------------------------

function buildCondition(source: PortraitSource): ConditionSpec {
  const health = source.health ?? 100;
  const maxHealth = source.maxHealth ?? 100;
  const fatigue = source.fatigue ?? 0;
  const maxFatigue = source.maxFatigue ?? 100;
  const healthRatio = clamp01(maxHealth > 0 ? health / maxHealth : 1);
  const fatigueRatio = clamp01(maxFatigue > 0 ? fatigue / maxFatigue : 0);

  const diseases = (source.diseaseHealth?.currentDiseases || [])
    .map(entry => (entry?.disease?.name || '').toLowerCase())
    .filter(Boolean);

  // Severity comes from what the illness *is*, not from how much health is
  // left. That distinction matters because the health figure barely moves: over
  // four hundred personas it ran 0.79 to 0.99, so the old ladder's `< 0.6` and
  // `< 0.35` rungs were unreachable and severity never once left 0 or 1 — even
  // though two personas in five are carrying something. A scraped knee and
  // tuberculosis both produced severity 1, and nobody ever looked ill.
  //
  // The disease *names* are the signal that was going unused, and they separate
  // cleanly. What a face shows is not how dangerous a thing is but how long it
  // has been draining you: a broken finger hurts more than worms this week and
  // shows less than worms this year.
  // Anything not on this list stays at severity 1, which is the right home for
  // both a sprained ankle and a name the table has not learned yet.
  const WASTING = /(worm|tubercul|consumption|malaria|ague|rickets|scurvy|typhoid|dysenter|cholera|plague|leprosy|syphilis|tularemia|quinsy|influenza|fever|pox|palsy|dropsy|gout|wasting|flux)/;
  const wasting = diseases.filter(name => WASTING.test(name)).length;

  let severity: 0 | 1 | 2 | 3 = 0;
  if (diseases.length > 0) severity = 1;
  if (wasting > 0) severity = 2;
  // Two chronic conditions at once, or one carried by someone already old
  // enough for it to be doing real damage.
  if (wasting > 1 || (wasting > 0 && ((source.age ?? 30) > 55 || healthRatio < 0.84))) severity = 3;

  const feverish = diseases.some(name =>
    /(fever|influenza|typhoid|malaria|pneumonia|infection|plague|smallpox|measles)/.test(name)
  );

  return {
    healthRatio,
    fatigueRatio,
    diseases,
    severity,
    pallor: clamp01((1 - healthRatio) * 0.8 + severity * 0.12),
    fever: feverish ? clamp01(0.35 + severity * 0.22) : clamp01((1 - healthRatio) * 0.25),
  };
}

function buildMood(source: PortraitSource, condition: ConditionSpec, seed: number): MoodSpec {
  const personality = source.personality || {};
  const affect = String(source.appearance?.affect || 'neutral').toLowerCase();

  // Personality values are 0..1 in this codebase.
  const extraversion = personality.extraversion ?? 0.5;
  const agreeableness = personality.agreeableness ?? 0.5;
  const neuroticism = personality.neuroticism ?? 0.5;

  let valence = (agreeableness - 0.5) * 0.9 + (extraversion - 0.5) * 0.7 - (neuroticism - 0.5) * 0.8;
  let guarded = clamp01(0.5 - (agreeableness - 0.5) * 1.1 + (neuroticism - 0.5) * 0.6);
  let energy = clamp01(0.55 + (extraversion - 0.5) * 0.8);

  if (affect === 'friendly') { valence += 0.35; guarded -= 0.2; }
  if (affect === 'guarded') { valence -= 0.15; guarded += 0.3; }
  if (affect === 'anxious') { valence -= 0.25; energy += 0.1; guarded += 0.15; }
  if (affect === 'intimidating') { valence -= 0.3; guarded += 0.25; }

  // Illness and exhaustion read on the face before anything else does.
  valence -= condition.severity * 0.12 + condition.fatigueRatio * 0.2;
  energy -= condition.fatigueRatio * 0.45 + condition.severity * 0.12;

  const finalValence = Math.max(-1, Math.min(1, valence));

  return {
    valence: finalValence,
    energy: clamp01(energy),
    guarded: clamp01(guarded),
    disposition: dispositionFor(personality),
    flourish: flourishFor(personality, finalValence, condition, seed),
  };
}

/**
 * The rare face. See `MoodSpec.flourish`.
 *
 * Each candidate names a face, the stats that make it plausible, and the share
 * of the people who qualify who actually wear it. The gates are loose on
 * purpose — they are asking "could this person look like that?", not "must
 * they?" — and the rate does the rarefying. That division is what lets a grin
 * exist at all: a gate tight enough to *mean* grin catches nobody, and a gate
 * loose enough to catch anybody hands out grins by the hundred.
 *
 * The rates are per-qualifier, so the population share of each face is the rate
 * times however much of the population clears its gate; `portrait-audit`'s
 * resting-expression table is the measurement. Read in order, first match wins,
 * so the rarer and stranger faces come first.
 */
function flourishFor(
  personality: {
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
  },
  valence: number,
  condition: ConditionSpec,
  seed: number
): Expression | null {
  // Illness owns the face outright, and `restingExpression` already returns
  // `weary` above severity 2. Below that it does not, but a fever is still no
  // time to be handed a grin.
  if (condition.severity >= 2 || condition.fever > 0.5) return null;

  const openness = personality.openness ?? 0.5;
  const extraversion = personality.extraversion ?? 0.5;
  const agreeableness = personality.agreeableness ?? 0.5;
  const neuroticism = personality.neuroticism ?? 0.5;

  const roll = unit(seed, 'flourish');

  // Caught mid-thought by whoever is painting them. Reads as startled, which is
  // a moment and not a disposition — so this is the rarest face in the set, and
  // it goes to the people most likely to be having one: curious and highly
  // strung. Valence is allowed to run low here, unlike the warm faces below,
  // because being wide-eyed is not the same as being pleased.
  if (openness > 0.58 && neuroticism > 0.58 && valence > -0.45 && roll < 0.025) return 'surprise';

  // The warm faces. All three require a valence that is not actively against
  // them: a persona whose affect is `intimidating` or who is worn down enough
  // to read grim does not get to be beaming, or the picture contradicts the
  // rest of the card.
  if (valence > -0.12) {
    // Open-mouthed, teeth showing. Sociable, warm, and not anxious.
    if (extraversion > 0.56 && agreeableness > 0.52 && neuroticism < 0.56 && roll < 0.12) return 'grin';

    // The same warmth, held closed. A wider gate and a wider rate — of the
    // three this is the one that should turn up often enough to feel like part
    // of the population rather than a find.
    if (agreeableness > 0.48 && neuroticism < 0.62 && roll < 0.16) return 'smile';
  }

  // Amused at something they are not saying. `dispositionFor` already has a
  // smirk rule, but it is narrow enough to reach about one persona in thirty;
  // this one catches the near-misses — anyone curious and a little cool — and
  // lets the seed decide.
  if (openness > 0.52 && agreeableness < 0.52 && roll < 0.09) return 'smirk';

  return null;
}

/**
 * The handful of people whose personality shows on their face as something
 * more specific than cheerful or grim.
 *
 * Every threshold here is deliberately extreme, because this is meant to be a
 * face you notice once in a wall of forty rather than a fourth common mood.
 * `openness` and `conscientiousness` do the work, and both were being thrown
 * away — the adapter read three of the five traits the app generates, and the
 * two it ignored are precisely the two that distinguish a considering face
 * from a determined one. Valence cannot express either: a very curious person
 * is not happier than average, they simply look like they are thinking.
 *
 * Order is most-specific first, and each rule is written to be narrow rather
 * than to cover its trait's whole upper range.
 */
function dispositionFor(personality: {
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
}): Expression | null {
  const openness = personality.openness ?? 0.5;
  const conscientiousness = personality.conscientiousness ?? 0.5;
  const extraversion = personality.extraversion ?? 0.5;
  const agreeableness = personality.agreeableness ?? 0.5;
  const neuroticism = personality.neuroticism ?? 0.5;

  // Sly rather than merely disagreeable: curious, sociable, and not especially
  // interested in being liked.
  if (openness > 0.72 && agreeableness < 0.34 && extraversion > 0.55) return 'smirk';

  // Steady and driven, and untroubled enough to hold a course.
  if (conscientiousness > 0.86 && neuroticism < 0.42) return 'determined';

  // Turned inward. The low extraversion matters: without it this fires on
  // gregarious people who read as animated, not contemplative.
  if (openness > 0.82 && extraversion < 0.45) return 'thinking';

  // No `grin` rule, and not for want of trying. A grin needs high extraversion
  // and high agreeableness, and those two are most of what `valence` is built
  // from — so anyone who qualifies has already been caught by the `content`
  // branch above, which is checked first and rightly so. Every set of
  // thresholds that reached a grin also required a neuroticism low enough to
  // contradict itself. Content already owns that face; a second, louder
  // version of it is not worth an unreachable branch.
  return null;
}

// ---------------------------------------------------------------------------
// Attributes that show on a face
// ---------------------------------------------------------------------------

/**
 * Attributes that already have art, routed into the marking pipeline.
 *
 * `details.ts` has drawn scars, tattoos, scarification and birthmarks since it
 * was written — for `culturalMarkings`, which is a different source of the same
 * shapes. So most of this costs nothing but a mapping: a persona marked
 * `scarred` gets the scar that was always available to draw, and the audit's
 * existing marking coverage report picks it up for free.
 *
 * Location and size are chosen so the face still reads. A large marking on the
 * cheek is fine; the same marking across both eyes is how an earlier version of
 * this renderer buried eighty faces.
 */
const ATTRIBUTE_MARKINGS: Record<string, Omit<MarkingSpec, 'color'> & { color?: string }> = {
  scarred: { type: 'scar', location: 'cheek', size: 'medium', pattern: 'solid' },
  burn_scarred: { type: 'scar', location: 'jaw', size: 'large', pattern: 'burn' },
  scarified: { type: 'scarification', location: 'cheek', size: 'medium', pattern: 'scarification' },
  kin_tattoos: { type: 'tattoo', location: 'cheek', size: 'medium', pattern: 'lines' },
  birthmark_omen: { type: 'birthmark', location: 'temple', size: 'medium', pattern: 'solid' },

  // Depigmentation, drawn as several patches rather than one. A single pale
  // blob on a cheek is a birthmark whatever you call it; what says vitiligo is
  // that the patches are scattered and that their edges are ragged. The colour
  // is left off and filled in from the sitter's own complexion below — a fixed
  // pale hex is right for one skin tone and wrong for every other.
  vitiligo: { type: 'birthmark', location: 'cheek', size: 'large', pattern: 'vitiligo' },

  // The word the app uses for a face that was visibly damaged and healed badly.
  // Deliberately the largest scar in the table and placed across the cheek and
  // jaw rather than on a temple, because an attribute that says "disfigured"
  // and a portrait with a neat two-pixel nick beside the ear are the picture
  // and the card disagreeing again.
  disfigured: { type: 'scar', location: 'cheek', size: 'large', pattern: 'burn' },

  // Tertiary syphilis and yaws both leave gummatous scarring, and at this size
  // they leave the same one. Kept away from the nose: collapse of the bridge is
  // the famous sign and it is a different drawing than a surface mark, so the
  // honest version of it here is a scar rather than a wrong nose.
  syphilitic: { type: 'scar', location: 'forehead', size: 'medium', pattern: 'solid' },
  yaws: { type: 'scar', location: 'cheek', size: 'medium', pattern: 'solid' },

  // Favus. Crusted patches on the scalp with the hair gone over them, which is
  // why it sits at the hairline rather than on the face.
  scald_head: { type: 'scar', location: 'forehead', size: 'medium', pattern: 'burn' },

  // The King's Evil: tubercular lymph nodes in the neck, which ulcerate and
  // scar. It is the one entry here that is not on the face at all.
  scrofulous: { type: 'scar', location: 'jaw', size: 'medium', pattern: 'solid' },
};

// ---------------------------------------------------------------------------
// Pose
// ---------------------------------------------------------------------------

const CANONICAL_POSE: PoseSpec = {
  scale: 1, offsetY: 0, chin: 0, tilt: 0, turn: 0,
  shoulderDrop: 0, hunch: 0, square: 0, reason: null,
};

/**
 * Which axes a signal is allowed to touch.
 *
 * A persona gets at most one signal per family, so two signals can never fight
 * over the same number. Without that, a `frail shy stooped` persona accumulates
 * three deviations that cancel into a fourth meaning nobody can read — which is
 * the failure mode that makes pose look like noise rather than information.
 */
type PoseFamily = 'size' | 'address' | 'carriage';

interface PoseSignal {
  /** The attribute id, or a predicate over the whole persona. */
  when: string | ((ids: Set<string>, build: Build, wealth: string) => boolean);
  /** What the audit calls this. Required for predicates, which have no id. */
  label?: string;
  family: PoseFamily;
  pose: Partial<PoseSpec>;
}

/**
 * Read in order. The first match becomes the persona's pose; the first match in
 * a *different* family may join it. Two is the cap — a portrait carrying three
 * simultaneous departures from the canonical bust stops reading as a person
 * held a certain way and starts reading as a mistake.
 *
 * The order is by how much the thing would actually have struck someone in the
 * room. A missing arm changes a silhouette more than a shy disposition does.
 */
const POSE_SIGNALS: PoseSignal[] = [
  // Carriage: bodies shaped by injury, work, or illness.
  { when: 'one_armed', family: 'carriage', pose: { shoulderDrop: 3, hunch: 0.2 } },
  { when: 'hunchback', family: 'carriage', pose: { hunch: 1, offsetY: 1 } },
  { when: 'weavers_stoop', family: 'carriage', pose: { hunch: 0.55 } },
  { when: 'lame', family: 'carriage', pose: { shoulderDrop: 2 } },
  { when: 'palsied', family: 'address', pose: { tilt: 2 } },

  // Size: how much of the frame this person takes up.
  //
  // Four attributes describe stature and only two were read. `giant_boned` and
  // `little_stature` are the app's own words for the same axis as `towering`
  // and `diminutive`, and they sat here unmatched — so a persona whose card
  // said "giant-boned" was drawn at exactly the height of everybody else. Read
  // before their milder siblings, and pushed a little further, because both are
  // the more emphatic word of the pair.
  { when: 'giant_boned', family: 'size', pose: { scale: 1.09, offsetY: -3 } },
  { when: 'little_stature', family: 'size', pose: { scale: 0.9, offsetY: 3 } },
  { when: 'towering', family: 'size', pose: { scale: 1.07, offsetY: -2 } },
  { when: 'diminutive', family: 'size', pose: { scale: 0.93, offsetY: 2 } },
  { when: 'corpulent', family: 'size', pose: { scale: 1.04 } },
  { when: 'frail', family: 'size', pose: { scale: 0.95, offsetY: 1 } },

  // Strength and its absence, in the shoulders rather than the head.
  { when: 'strong', family: 'carriage', pose: { square: 0.85 } },
  { when: 'athletic', family: 'carriage', pose: { square: 0.6 } },
  { when: 'gaunt', family: 'carriage', pose: { square: -0.6 } },
  { when: 'consumptive', family: 'carriage', pose: { square: -0.7, hunch: 0.3 } },
  {
    when: (_ids, build) => build === 'imposing' || build === 'stocky',
    label: 'build:broad',
    family: 'carriage',
    pose: { square: 0.5 },
  },
  {
    when: (_ids, build) => build === 'slight',
    label: 'build:slight',
    family: 'carriage',
    pose: { square: -0.4 },
  },

  // Address: how they meet the viewer. Chin up is command, chin tucked is
  // wariness, and turning off-axis is refusal to be looked at straight.
  { when: 'proud', family: 'address', pose: { chin: -2 } },
  { when: 'coward', family: 'address', pose: { chin: 2, turn: -2 } },
  { when: 'crowd_averse', family: 'address', pose: { chin: 1, turn: -2 } },
  { when: 'shy', family: 'address', pose: { chin: 2, turn: -1 } },
  { when: 'brave', family: 'address', pose: { chin: -1 } },
  { when: 'loner', family: 'address', pose: { turn: -2 } },
  { when: 'taciturn', family: 'address', pose: { turn: -1 } },
  { when: 'cunning', family: 'address', pose: { turn: 2 } },
  { when: 'humble', family: 'address', pose: { chin: 1 } },
  { when: 'curious', family: 'address', pose: { tilt: 3 } },
  { when: 'dreamer', family: 'address', pose: { tilt: 3, chin: -1 } },

  // The sitter's own century had a convention for this, and it is the one place
  // where status rather than body decides how a head is held.
  {
    when: (_ids, _build, wealth) => wealth === 'noble',
    label: 'noble',
    family: 'address',
    pose: { chin: -1 },
  },
];

function buildPose(ids: Set<string>, build: Build, wealth: string): PoseSpec {
  const fires = (signal: PoseSignal) =>
    typeof signal.when === 'string' ? ids.has(signal.when) : signal.when(ids, build, wealth);

  const primary = POSE_SIGNALS.find(fires);
  if (!primary) return CANONICAL_POSE;

  const secondary = POSE_SIGNALS.find(s => s.family !== primary.family && fires(s));
  const label = (signal: PoseSignal) =>
    signal.label ?? (typeof signal.when === 'string' ? signal.when : signal.family);

  // Added rather than assigned. The families own an axis each *mostly* — a
  // hunched back also drops the whole figure a pixel, which is a size axis —
  // and spreading the second signal over the first would silently discard
  // whichever of them wrote that number second.
  const pose = { ...CANONICAL_POSE };
  for (const part of secondary ? [primary.pose, secondary.pose] : [primary.pose]) {
    pose.scale *= part.scale ?? 1;
    pose.offsetY += part.offsetY ?? 0;
    pose.chin += part.chin ?? 0;
    pose.tilt += part.tilt ?? 0;
    pose.turn += part.turn ?? 0;
    pose.shoulderDrop += part.shoulderDrop ?? 0;
    pose.hunch += part.hunch ?? 0;
    pose.square += part.square ?? 0;
  }
  pose.hunch = Math.min(1, pose.hunch);
  pose.square = Math.max(-1, Math.min(1, pose.square));
  pose.reason = secondary ? `${label(primary)}+${label(secondary)}` : label(primary);
  return pose;
}

function buildFaceTraits(ids: Set<string>, seed: number): FaceTraits {
  return {
    gaunt: ids.has('gaunt') || ids.has('frail'),
    poxScarred: ids.has('pox_scarred'),
    toothless: ids.has('toothless'),
    // A cataract and a blind eye are the same drawing at this size — a pale
    // iris with the pupil gone — and the attribute list carries both words.
    blind: ids.has('blind') || ids.has('clouded_eyes'),
    // Which eye turns is not recorded anywhere, and it is not a coin flip in
    // life either; the seed picks one and keeps it.
    wallEye: ids.has('wall_eyed') ? (unit(seed, 'wall-eye') < 0.5 ? -1 : 1) : 0,
    heterochromia: ids.has('heterochromia') ? HETEROCHROMIA_IRIS[
      Math.floor(unit(seed, 'heterochromia') * HETEROCHROMIA_IRIS.length)
    ] : null,
    goiter: ids.has('goiter'),
  };
}

/**
 * The second iris, when the two do not match.
 *
 * Not drawn from the same table the first eye comes from. Heterochromia that
 * reads at 96px needs the two eyes far apart in *value*, not merely in hue — a
 * hazel eye beside a brown one is a real condition and an invisible drawing —
 * so these are all pale, and the other eye keeps whatever colour the persona
 * was generated with. Which is also the commoner form in life: one eye lighter.
 */
const HETEROCHROMIA_IRIS = ['#6f93a8', '#8aa88f', '#a8a06a', '#9c9fa8'];

/**
 * Red hair, which is four or five different colours in practice — copper,
 * auburn, carrot, and the dark red that reads as brown until the light catches
 * it. Picking one at random per persona keeps a page of redheads from looking
 * like a single dye lot.
 */
const RED_HAIR = ['#8c3b1e', '#a84a22', '#6f2f1c', '#b46230'];

/**
 * Spectacles, from `hasGlasses` or from the attribute that means the sitter
 * needs them.
 *
 * `drawGlasses` has existed since the details module was written and could only
 * ever be reached by `appearance.hasGlasses`, a flag almost nothing sets — so a
 * persona whose card says `nearsighted` was drawn without them every time.
 *
 * Two gates, and both are the point rather than caution. Spectacles are a
 * fourteenth-century object: putting them on a Roman scribe would be the same
 * class of error the context packs exist to prevent, so anything before the
 * early modern era gets none no matter what its attributes say. And they were
 * expensive for most of their history — being short-sighted did not mean owning
 * glasses, it meant holding things closer — so past that date it is wealth and
 * a roll, not a certainty. A poor eighteenth-century labourer who cannot see
 * far is drawn squinting into the middle distance like everyone else, which is
 * the honest picture.
 */
const SPECTACLE_ERAS = new Set(['RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA']);

function spectaclesFor(
  appearance: Record<string, any>,
  ids: Set<string>,
  era: string | undefined,
  wealth: number,
  seed: number
): PortraitSpec['glasses'] {
  if (appearance.hasGlasses) return { style: appearance.glassesStyle || 'round' };
  if (!ids.has('nearsighted')) return null;
  if (!SPECTACLE_ERAS.has(String(era))) return null;
  // Cheap and universal by the twentieth century; a luxury before it.
  const chance = era === 'MODERN_ERA' || era === 'FUTURE_ERA' ? 0.85 : 0.2 + wealth * 0.6;
  if (unit(seed, 'spectacles') > chance) return null;
  // Round wire was the only shape for four centuries. Square and half-rim are
  // modern, so they are only reachable once they existed.
  const modern = era === 'MODERN_ERA' || era === 'FUTURE_ERA';
  const roll = unit(seed, 'spectacle-style');
  return {
    style: !modern ? 'round'
      : roll < 0.4 ? 'round' : roll < 0.7 ? 'square' : roll < 0.9 ? 'oval' : 'half_rim',
  };
}

/** The resting face a persona wears when nothing else is driving it. */
export function restingExpression(mood: MoodSpec, condition: ConditionSpec): Expression {
  // Illness, and illness only. Fatigue used to share this test at `> 0.7`,
  // against a value whose measured range across eight hundred personas is
  // 0.04–0.20 with a mean of 0.15 — so it never fired at all. Moving the bound
  // into the real band did not fix it either: at 0.18 it caught a third of the
  // population, because that range is not a spread so much as a cluster with a
  // little noise on it. A signal with no dynamic range cannot be thresholded
  // into a meaningful minority, and pretending otherwise just relocates the
  // bug. Fatigue still tells on the face through pallor and through the drag
  // it puts on valence and energy; it no longer decides this.
  if (condition.severity >= 2) return 'weary';

  // The rare face, before valence gets a say. This is the whole point of it
  // being a separate field: `disposition` below is only consulted once the
  // valence branches have declined, and those branches own every face that a
  // smile or a grin would have to displace.
  if (mood.flourish) return mood.flourish;

  // The strong moods keep their faces. A disposition never overrides someone
  // who is plainly delighted or plainly furious — it is a tie-breaker for the
  // large middle of the population, which is where the dull faces were.
  if (mood.valence > 0.42) return 'content';
  if (mood.valence < -0.42) {
    // Which unhappy face, decided by *energy* rather than by guardedness.
    //
    // This branch used to read `guarded > 0.6 ? 'scowl' : 'sad'`, and it made
    // scowl the single most common resting face in the app at 23.5% — nearly a
    // quarter of every grid glaring at the viewer. The reason is that the test
    // was not the conjunction it looked like: `valence` and `guarded` are both
    // built from agreeableness in `buildMood`, pulling in opposite directions,
    // so anything that cleared the valence bound had already very nearly
    // cleared the guarded one. Two collinear conditions filter no more than one
    // of them does.
    //
    // `energy` is the axis that is actually independent here, and it is the
    // right one on the merits too. A scowl is *outward*: brow driven down, jaw
    // set, aimed at whoever is looking. That takes vigour as well as ill
    // temper. Hardship without vigour does not scowl — it goes flat and closed,
    // which is `guarded`, or it goes down, which is `sad`. Those two are the
    // faces of a hard life; a scowl is a face aimed at somebody, and it should
    // be the rare case rather than the default.
    if (mood.guarded > 0.6 && mood.energy > 0.55) return 'scowl';
    return mood.guarded > 0.6 ? 'guarded' : 'sad';
  }
  if (mood.disposition) return mood.disposition;
  if (mood.guarded > 0.68) return 'guarded';
  if (mood.valence > 0.18) return 'content';
  if (mood.valence < -0.18) return 'concern';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

export function buildPortraitSpec(source: PortraitSource): PortraitSpec {
  const overrides = source.portraitVisualOverrides;
  const appearance = { ...(source.appearance || {}), ...(overrides?.appearance || {}) };

  const seed =
    source.portraitSeed ??
    hashString(
      `${source.name ?? ''}|${source.age ?? 30}|${source.gender ?? 'Male'}|${appearance.skinColor ?? ''}|${source.profession ?? ''}`
    );

  const age = source.age ?? 30;
  const genderRaw = String(source.gender || 'Male');
  const gender = (genderRaw === 'Female' || genderRaw === 'Non-binary' ? genderRaw : 'Male') as PortraitSpec['gender'];
  const wealth = (source.wealthLevel || 'modest') as PortraitSpec['wealth'];
  const ornamentBase = WEALTH_ORNAMENT[wealth] ?? 0.2;

  // Read here rather than down beside the face traits, because three of these
  // decide colours and the colours are settled first.
  const attributeIds = new Set(
    (source.attributes || [])
      .map(entry => String(entry?.id || ''))
      .filter(Boolean)
  );

  // --- hair colour, greyed by age ------------------------------------------
  // `albino` and `red_haired` are pigment, and pigment is not something the
  // renderer has to learn to draw — it is the input the hair ramp is built
  // from. Both attributes were sitting in the list unread while the generator
  // handed the portrait whatever hair colour it had picked at random, so a
  // persona the card called red-haired came out brown about four times in five.
  const baseHair =
    attributeIds.has('albino') ? '#e8e2d4'
    : attributeIds.has('red_haired') ? RED_HAIR[Math.floor(unit(seed, 'red-hair') * RED_HAIR.length)]
    : appearance.hairColor || '#4b2f21';
  // Greying is near-universal by the sixties and well underway through the
  // fifties; the old curve left too many fifty-somethings with the hair colour
  // they had at twenty.
  let grayAmount = 0;
  if (age > 66) grayAmount = 0.7 + unit(seed, 'gray-old') * 0.3;
  else if (age > 54) grayAmount = 0.22 + unit(seed, 'gray-late') * 0.4;
  else if (age > 44) grayAmount = 0.12 + unit(seed, 'gray-mid') * 0.38;
  else if (age > 33) grayAmount = unit(seed, 'gray-early') > 0.62 ? 0.06 + unit(seed, 'gray-amt') * 0.14 : 0;
  // Grey by thirty at the latest, and the attribute means nothing on someone
  // the age curve has already greyed — so this is a floor, not an assignment.
  if (attributeIds.has('prematurely_gray')) {
    grayAmount = Math.max(grayAmount, 0.45 + unit(seed, 'early-gray') * 0.35);
  }
  // White hair on an albino is not grey hair. Greying mixes toward a neutral
  // and would drag the warmth out of a head that is already pale.
  if (attributeIds.has('albino')) grayAmount = 0;
  const hairColor = grayAmount > 0.01
    ? rgbToHex(mixRgb(hexToRgb(baseHair), hexToRgb('#b7b2ab'), grayAmount))
    : baseHair;

  const recession =
    gender === 'Male' && age > 30
      ? clamp01(((age - 30) / 45) * (0.4 + unit(seed, 'recede') * 0.9))
      : 0;

  // --- hair arrangement -----------------------------------------------------
  // The style name and the length are generated independently upstream, so they
  // can contradict each other: `getHairstyle` will happily hand a bun to a
  // persona whose `hairLength` is `very_short`. Rather than drop the style —
  // which is the more specific and more interesting of the two facts — let the
  // arrangement pull the length up to whatever it needs to exist.
  const rawHairLength: HairLength = appearance.hairLength || 'short';
  const rawStyle = String(appearance.hairstyle || '');
  const classified = classifyHairstyleName(rawStyle);

  const LENGTH_ORDER: HairLength[] = ['bald', 'very_short', 'short', 'medium', 'long', 'very_long'];
  /** The shortest length at which an arrangement is physically possible. */
  const MINIMUM_LENGTH: Partial<Record<HairSilhouette, HairLength>> = {
    bun: 'medium', top_knot: 'medium', twin_buns: 'medium', updo: 'medium',
    ponytail: 'medium', braid_single: 'long', braid_twin: 'long',
    braid_crown: 'medium', locs: 'medium', tied_back: 'medium',
    bob: 'medium', bowl: 'short', cornrows: 'very_short',
  };

  let hairSilhouette: HairSilhouette = classified.silhouette;
  let hairLength = rawHairLength;

  if (rawHairLength === 'bald') {
    // Nothing to arrange. A tonsure is the one exception: it *is* a bald crown,
    // and it is the reading a shaved-crown style is after.
    hairSilhouette = hairSilhouette === 'tonsure' ? 'tonsure' : 'loose';
  } else {
    const needed = MINIMUM_LENGTH[hairSilhouette];
    if (needed && LENGTH_ORDER.indexOf(rawHairLength) < LENGTH_ORDER.indexOf(needed)) {
      hairLength = needed;
    }
  }

  // What the hair *does* when the name does not say.
  //
  // The classifier reads the style's name and nothing else, so a silhouette
  // only ever appeared if some table happened to name it. Measured over 500
  // personas that left `afro`, `locs`, `cornrows` and `ponytail` at exactly
  // zero — not rare, absent — while `loose` took 44.6% and became the bucket
  // everything unnamed fell into. No table says "afro" because no period
  // source calls it that, and "ponytail" is a modern word for one of the
  // oldest things anyone has ever done with long hair.
  //
  // So where the name has told us nothing, the persona's own hair does. This
  // fires only on `loose` — an explicit `gathered_bun` is still a bun — and it
  // reads fields the spec already carries.
  const hairTexture: HairTexture = appearance.hairTexture || 'straight';
  const weathering = weatheringFor(source.profession, appearance.skinTexture, age);
  if (hairSilhouette === 'loose' && rawHairLength !== 'bald') {
    hairSilhouette = looseHairFallback(
      hairLength, hairTexture, source.culturalZone, weathering, seed);
  }

  // A cut is an intent, and the same intent gives a different shape on
  // different hair.
  //
  // The style tables name arrangements — a bob, a bowl cut, a fringe, hair
  // parted and swept — without knowing what the hair they are describing
  // actually does. Those four all mean *worn out, cut to a shape*, and on
  // tightly coiled hair worn out to a shape is a halo standing off the skull:
  // it is an afro, whatever the table called it. Rendering it as a blunt
  // jaw-length curtain instead is drawing the intent on the wrong head.
  //
  // Bound arrangements are left alone, because binding does the same thing to
  // any hair: a bun is a bun and cornrows are cornrows.
  const CUT_TO_SHAPE = new Set<HairSilhouette>(['bob', 'bowl', 'bangs', 'swept']);
  if ((hairTexture === 'coily' || hairTexture === 'kinky')
      && CUT_TO_SHAPE.has(hairSilhouette)
      && rawHairLength !== 'bald'
      && rawHairLength !== 'very_short') {
    hairSilhouette = 'afro';
  }

  // A heavily receded hairline cannot support anything that gathers at the
  // front or frames the face; it can still carry a knot at the back.
  if (recession > 0.55 && (hairSilhouette === 'bangs' || hairSilhouette === 'bowl' || hairSilhouette === 'braid_twin')) {
    hairSilhouette = 'loose';
  }

  // --- garment --------------------------------------------------------------
  const garmentPiece: Piece =
    (overrides?.garment as Piece) ||
    (source.equippedItems?.torso as Piece) ||
    (appearance.garment as Piece) ||
    {};

  const palette = {
    ...(appearance.palette || {}),
    ...(overrides?.palette || {}),
  };

  const garmentKind: GarmentKind =
    (overrides?.garmentKind as GarmentKind) ||
    classify(`${garmentPiece.name || ''} ${garmentPiece.material || ''}`, GARMENT_KEYWORDS, 'tunic');

  // A persona with no named garment and no palette is given a plain tunic, and
  // the neckline has to be chosen for the kind actually drawn — the seeded pick
  // is keyed on it.
  const resolvedKind: GarmentKind =
    isEmptyPiece(garmentPiece) && !palette.primary ? 'tunic' : garmentKind;

  const garment: GarmentSpec = {
    kind: resolvedKind,
    name: garmentPiece.name || 'Simple Garment',
    material: (garmentPiece.material || 'wool').toLowerCase(),
    colors: separateGarmentColors(
      // An intrinsic material outranks whatever colour the generator picked.
      // Straw is the colour of straw; leather is the colour of leather. The
      // old precedence let a generated palette entry paint a sedge sunhat
      // lilac and a bark-cloth wrap sky blue.
      //
      // …and then the cloth has to clear the body wearing it, which is the same
      // constraint the background already answers to a few lines down and for
      // the same reason: a colour is only a colour relative to what it is next
      // to. This is where a hide loincloth stops being invisible.
      separateFromSkin(
        intrinsicColorFor(garmentPiece.material)
          || resolveColor(garmentPiece.color) || colorFromName(garmentPiece.name)
          || resolveColor(palette.primary) || '#7c6a54',
        appearance.skinColor || '#c58f68'),
      resolveColor(palette.secondary) || '#9a8768',
      resolveColor(palette.accent) || '#a8834f',
      seed
    ),
    bodice: bodiceFor(garmentPiece.name || ''),
    feature: garmentFeatureFor(
      garmentPiece.name || 'Simple Garment',
      (garmentPiece.material || 'wool').toLowerCase(),
      { gender, separateBodice: bodiceFor(garmentPiece.name || '') === 'separate' }
    ),
    neckline: necklineFor({
      packId: overrides?.contextPackId,
      kind: resolvedKind,
      gender,
      wealth,
      culturalZone: source.culturalZone,
    }, options => choose(options, seed, `neckline-${resolvedKind}`)),
    ornament: ornamentBase,
    surfaces: garmentSurfaceSpecs(garmentPiece, source, ornamentBase, seed),
    wear: garmentWearFor(
      garmentPiece.name || '', garmentPiece.adjectives || [], wealth, age, seed),
  };

  // --- legwear --------------------------------------------------------------
  // Same precedence as everything else: what the persona is actually wearing
  // first, the procedural appearance behind it. The fallback carries most of
  // the traffic — `createItemInstance` only knows the base ids in the item
  // tables and most trousers are not among them — so a persona whose card says
  // "Denim Jeans" would otherwise be drawn bare-legged.
  const legPiece: Piece | null =
    (overrides?.legwear as Piece) ||
    (source.equippedItems?.legs as Piece) ||
    (appearance.legwear as Piece) ||
    null;
  const legwear: LegwearSpec | null = !isEmptyPiece(legPiece) ? {
    name: legPiece!.name || 'Trousers',
    material: (legPiece!.material || 'cloth').toLowerCase(),
    // Denim is indigo and khaki is khaki, whatever the persona's palette says —
    // the same rule that keeps a sedge hat the colour of sedge. Everything that
    // does take dye falls through to the outfit's second colour, which is what
    // the second garment in a two-piece outfit has always been painted in.
    color: intrinsicColorFor(legPiece!.material)
      || resolveColor(legPiece!.color) || colorFromName(legPiece!.name)
      || resolveColor(palette.secondary) || garment.colors.secondary,
    form: legwearFormFor(`${legPiece!.name ?? ''} ${legPiece!.material ?? ''}`),
  } : impliesMatchingLegs(garment.name, gender) ? {
    // A suit brings its own trousers, in its own cloth. Nothing names them
    // because nobody would: "Designer Suit" already said it. Without this the
    // sprite drew the jacket to the knee and left the shins bare, which is the
    // failure the whole two-piece pass exists to remove.
    name: garment.name,
    material: garment.material,
    color: garment.colors.primary,
    form: 'trousers',
  } : null;

  // --- headwear -------------------------------------------------------------
  const headPiece: Piece | null =
    (overrides?.headgear as Piece) ||
    (source.equippedItems?.head as Piece) ||
    (appearance.headgear as Piece) ||
    null;

  const explicitKind = overrides?.headgearKind as HeadwearKind | undefined;
  let headwear: HeadwearSpec | null = null;
  if (explicitKind === 'none') {
    headwear = null;
  } else if (!isEmptyPiece(headPiece) || explicitKind) {
    const name = headPiece?.name || 'Cap';
    const kind = explicitKind || classify(`${name} ${headPiece?.material || ''}`, HEADWEAR_KEYWORDS, 'cap');
    headwear = kind === 'none' ? null : {
      kind,
      name,
      material: (headPiece?.material || 'cloth').toLowerCase(),
      color: intrinsicColorFor(headPiece?.material)
        || resolveColor(headPiece?.color) || colorFromName(name)
        || colorForMaterial(headPiece?.material)
        || resolveColor(palette.secondary) || '#5c5347',
      accent: resolveColor(palette.accent) || '#a8834f',
      ornament: ornamentBase,
      ornaments: ornamentsFor(name, headPiece?.material || '', ornamentBase).ornaments,
    };
  }

  // --- everything else ------------------------------------------------------
  const condition = buildCondition(source);
  const mood = buildMood(source, condition, seed);

  // --- attributes that show on a face ---------------------------------------
  const traits = buildFaceTraits(attributeIds, seed);
  const attributeMarkings: MarkingSpec[] = [];
  for (const [id, marking] of Object.entries(ATTRIBUTE_MARKINGS)) {
    if (!attributeIds.has(id)) continue;
    attributeMarkings.push({
      ...marking,
      // Scars and healed tissue read as a shade of the persona's own skin
      // rather than as a colour of their own; the drawing code shifts against
      // whatever is underneath, so this is mostly a fallback for the cases
      // that do paint.
      color: marking.color || (marking.type === 'tattoo' ? '#2f3a44' : appearance.skinColor || '#c58f68'),
    } as MarkingSpec);
  }

  // `bearded_woman` is an attribute the app generates and the renderer was
  // throwing away at this line, because the sex test ran first and nothing
  // could get past it. It is also the whole reason the attribute exists — a
  // bearded woman who is drawn clean-shaven is just a woman, and the card
  // beside her says otherwise.
  const facialHairWanted =
    (gender !== 'Female' || attributeIds.has('bearded_woman'))
    && (Boolean(appearance.facialHair) || attributeIds.has('bearded_woman'))
    && age >= 15;

  const markings = attributeMarkings.length
    ? [...((appearance.markings || []) as MarkingSpec[]), ...attributeMarkings]
    : (appearance.markings || []) as MarkingSpec[];

  return {
    seed,
    gender,
    age,

    // Albinism lightens the complexion without erasing it: the generated skin
    // tone is mixed most of the way toward a pale pink rather than replaced,
    // so an albino persona still reads as belonging to the population they
    // were generated into. Replacing it outright would draw every albino in
    // the app as the same north-European face, which is the opposite of what
    // the attribute says.
    skinColor: attributeIds.has('albino')
      ? rgbToHex(mixRgb(hexToRgb(appearance.skinColor || '#c58f68'), hexToRgb('#f3ddd4'), 0.78))
      : appearance.skinColor || '#c58f68',
    hairColor,
    // The pale iris that goes with it — the pink is the vessels showing through
    // an iris with no pigment of its own.
    eyeColor: attributeIds.has('albino') ? '#b07f86' : appearance.eyeColor || '#4b3a2a',
    lipColor: appearance.lipColor,

    faceShape: appearance.faceShape || 'oval',
    jawline: appearance.jawline || (gender === 'Female' ? 'soft' : 'square'),
    cheekbones: appearance.cheekbones || 'average',
    eyeShape: appearance.eyeShape || 'almond',
    noseShape: appearance.noseShape || 'straight',
    lipShape: appearance.lipShape || 'medium',
    browShape: appearance.eyebrowShape || 'straight',
    browThickness: appearance.eyebrowThickness || 'medium',
    eyelashes: appearance.eyelashes || 'medium',

    hairLength: hairLength,
    hairTexture,
    hairstyle: appearance.hairstyle || 'short',
    hairSilhouette,
    grayAmount,
    recession,

    facialHair: facialHairWanted
      ? {
          // Stubble is the right default for a man the generator gave no style
          // to — it is what an unshaven face looks like. It is the wrong one for
          // `bearded_woman`, which is not a description of neglect: the
          // attribute exists because the beard was remarked on, and a persona
          // whose card says so needs a beard you can see.
          style: appearance.facialHairStyle
            || (attributeIds.has('bearded_woman') ? 'full_beard' : 'stubble'),
          thickness: appearance.facialHairThickness
            || (attributeIds.has('bearded_woman') ? 'thick' : 'medium'),
        }
      : null,

    build: (appearance.build || 'average') as Build,
    ageLines: clamp01((age - 26) / 46),
    lidDroop: clamp01((age - 44) / 32),
    weathering,

    garment,
    legwear,
    headwear,
    jewelry: withAccessory(
      normalizeJewelry((appearance.jewelry || []) as Parameters<typeof normalizeJewelry>[0]),
      accessoryJewelryFor(appearance.accessory, ornamentBase)
    ),
    markings,
    skull: skullShapeFrom(markings),
    dental: dentalWorkFrom(markings),
    pose: buildPose(attributeIds, (appearance.build || 'average') as Build, wealth),
    glasses: spectaclesFor(appearance, attributeIds, source.era, ornamentBase, seed),

    condition,
    traits,
    mood,
    // The garment's primary is what actually fills the lower two-thirds of the
    // frame, so it constrains the backdrop alongside the complexion.
    background: backgroundFor(
      source, overrides, appearance.skinColor || '#c58f68', garment.colors.primary),

    contextPackId: overrides?.contextPackId,
    contextMarks: contextMarksFor(overrides?.contextPackId, {
      gender, wealth, ornament: garment.ornament, garmentName: garment.name,
    }),
    culturalZone: source.culturalZone,
    era: source.era,
    wealth,
  };
}

/**
 * Modification that has to leave the marking list to be drawn at all.
 *
 * Both of these arrive from `culturalMarkings.ts` as `structural` markings with
 * a pattern string, and both were falling through every case in the drawing
 * code, because neither is something you can stamp onto a finished face: one is
 * a different skull and the other is only visible if the mouth opens. Reading
 * them here turns them into anatomy and into a mouth pose instead.
 */
function skullShapeFrom(markings: MarkingSpec[]): SkullShape {
  for (const marking of markings) {
    const pattern = marking.pattern || '';
    if (/cranial_elongation|elongat/.test(pattern)) return 'elongated';
  }
  return 'natural';
}

function dentalWorkFrom(markings: MarkingSpec[]): DentalWork | null {
  for (const marking of markings) {
    const pattern = marking.pattern || '';
    if (pattern === 'teeth_black') return { style: 'blackened', color: '#14100f' };
    if (pattern === 'teeth_filed') return { style: 'filed', color: '#e8e0d0' };
    if (pattern === 'teeth_inlay') return { style: 'inlay', color: marking.color || '#4f9d7a' };
  }
  return null;
}

/** Map the app's expression vocabulary onto the renderer's. */
export function normalizeExpression(name: string | null | undefined): Expression | null {
  if (!name) return null;
  switch (name) {
    case 'smile': return 'smile';
    case 'approve': return 'grin';
    case 'excited': return 'grin';
    case 'smirk': return 'smirk';
    case 'sad': return 'sad';
    case 'concern': return 'concern';
    case 'scowl': return 'scowl';
    case 'annoyed': return 'scowl';
    case 'angry': return 'scowl';
    case 'tired': return 'weary';
    case 'surprise': return 'surprise';
    case 'confused': return 'thinking';
    case 'thinking': return 'thinking';
    case 'skeptical': return 'guarded';
    case 'determined': return 'determined';
    case 'neutral': return 'neutral';
    default: return null;
  }
}
