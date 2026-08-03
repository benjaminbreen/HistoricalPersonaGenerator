/**
 * constants/characterData/ancestryAppearance.ts
 *
 * What people look like, by where their ancestors lived — as distinct from
 * where *they* live.
 *
 * Two problems this fixes, and they are different problems.
 *
 * **The first is that the feature model was four one-off binaries.** Face
 * shape asked "East Asian?", nose asked "MENA?", hair asked "Sub-Saharan
 * African?", and cheekbones asked nothing at all. Everyone outside the named
 * zone drew from one undifferentiated pool, so a West African persona was no
 * likelier to have a broad nose than a Norwegian, and East Asian hair — which
 * is close to universally straight — came out curly a third of the time.
 *
 * **The second is that appearance never learned who the persona was.** The
 * naming layer has known about the African diaspora for a long time:
 * `AFRICAN_AMERICAN` is dated from 1619 and `AFRO_BRAZILIAN` from 1540, and
 * they are wired into the Chesapeake, the Carolinas, Louisiana, Cuba, Haiti,
 * Puerto Rico, Texas and the Brazilian coast with the right date bounds. But
 * `generateFacialFeatures` took a `culturalZone` and nothing else, and the zone
 * for all of those places is `NORTH_AMERICAN_COLONIAL` or `SOUTH_AMERICAN`. So
 * the generator would name a persona from the African American set, place her
 * on a Virginia plantation in 1750, and then draw her with straight hair and
 * possibly fair skin. Ancestry is not a function of latitude, and after 1500 it
 * stops being a function of anything the location knows.
 *
 * ## How to read the tables
 *
 * Weights are **repetition in an array**, which is the idiom the eye-shape
 * table in `npcUtils` already used, and it is picked from uniformly. Ten slots
 * per feature, so a slot is ten percent.
 *
 * ## What these tables are and are not
 *
 * They are **statistical tendencies with enormous variation inside every
 * group**, and they are written as weights precisely so that nothing is ever
 * gated. Every texture, nose and eye shape remains reachable in every
 * population; the ancestry moves the odds and never closes a door. The old
 * code did gate — Sub-Saharan African personas could not have straight hair
 * and nobody else could have coiled hair — and hard exclusions are both false
 * and the reason a zone's personas came out looking interchangeable.
 *
 * The single largest simplification here is `SUB_SAHARAN_AFRICAN` as one
 * bucket. Africa holds more human genetic variation than the whole rest of the
 * world combined, and Khoisan, Nilotic, West African and Horn populations
 * differ from one another more than several of the other zones differ from
 * each other. The per-group entries below (`AKAN`, `SOMALI`,
 * `ETHIOPIAN_HIGHLAND`, `WEST_AFRICAN_SAHEL`…) exist to take some of that
 * weight off the zone, and they are still coarse.
 */

import { CulturalZone } from '../../types/characterData';

export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily' | 'kinky';
export type NoseShape = 'straight' | 'aquiline' | 'broad' | 'button' | 'roman';
export type EyeShape = 'almond' | 'round' | 'narrow' | 'wide' | 'hooded' | 'large';
export type CheekboneLevel = 'high' | 'average' | 'low';
export type SkinToneLabel =
  | 'very_pale' | 'pale' | 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'dark' | 'very_dark';

export interface FeatureWeights {
  hairTexture: readonly HairTexture[];
  noseShape: readonly NoseShape[];
  eyeShape: readonly EyeShape[];
  cheekbones: readonly CheekboneLevel[];
  skinTone: readonly SkinToneLabel[];
}

// --- Shorthand so the tables below stay readable. -------------------------
const rep = <T>(...pairs: Array<[T, number]>): T[] => {
  const out: T[] = [];
  for (const [value, n] of pairs) for (let i = 0; i < n; i += 1) out.push(value);
  return out;
};

/**
 * Nose breadth relative to height is the best-attested of these clines: it
 * tracks the humidity of the climate a population's ancestors adapted to —
 * narrow passages warm and moisten cold dry air, broad ones do not need to.
 * Hot-humid ancestry runs broad, cold-dry ancestry narrow, and the correlation
 * survives across continents that are otherwise unrelated.
 */

// ===========================================================================
//  By cultural zone — the fallback when nothing more specific is known.
// ===========================================================================

export const ZONE_FEATURES: Record<CulturalZone, FeatureWeights> = {
  SUB_SAHARAN_AFRICAN: {
    hairTexture: rep<HairTexture>(['kinky', 3], ['coily', 5], ['curly', 2]),
    noseShape: rep<NoseShape>(['broad', 6], ['straight', 2], ['button', 1], ['roman', 1]),
    eyeShape: rep<EyeShape>(['round', 3], ['wide', 3], ['almond', 3], ['large', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['very_dark', 3], ['dark', 5], ['tan', 2]),
  },

  // Lumps Melanesia, Polynesia, Micronesia and Aboriginal Australia, whose
  // hair could hardly be more different — Melanesian hair is tightly coiled
  // and Polynesian is straight to wavy. The zone default sits between them and
  // is close to wrong for everybody; the per-group entries below are what
  // should actually fire, and this is here only for the unclassified case.
  OCEANIA: {
    hairTexture: rep<HairTexture>(['straight', 2], ['wavy', 3], ['curly', 2], ['coily', 2], ['kinky', 1]),
    noseShape: rep<NoseShape>(['broad', 5], ['straight', 3], ['roman', 2]),
    eyeShape: rep<EyeShape>(['almond', 3], ['wide', 2], ['round', 2], ['hooded', 2], ['narrow', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 4], ['tan', 3], ['very_dark', 2], ['medium', 1]),
  },

  // Straight hair is close to universal here — the thick, straight shaft of
  // the EDAR variant. A third of East Asians drawn with curly hair, which is
  // what the old undifferentiated pool produced, was the most visible single
  // error in the old model.
  EAST_ASIAN: {
    hairTexture: rep<HairTexture>(['straight', 8], ['wavy', 2]),
    noseShape: rep<NoseShape>(['straight', 4], ['button', 4], ['broad', 2]),
    eyeShape: rep<EyeShape>(['narrow', 4], ['almond', 4], ['hooded', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 5], ['average', 4], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['light', 4], ['medium', 3], ['olive', 2], ['fair', 1]),
  },

  // Beringian ancestry, and it shows in the same places it shows in East Asia:
  // straight hair and prominent malars. The convex "Roman" nose is common
  // across many Amerindian populations and had no way to appear before.
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    hairTexture: rep<HairTexture>(['straight', 8], ['wavy', 2]),
    noseShape: rep<NoseShape>(['aquiline', 3], ['roman', 3], ['straight', 3], ['broad', 1]),
    eyeShape: rep<EyeShape>(['almond', 4], ['narrow', 3], ['hooded', 2], ['round', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 5], ['average', 4], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['tan', 4], ['medium', 3], ['olive', 2], ['dark', 1]),
  },

  SOUTH_AMERICAN: {
    hairTexture: rep<HairTexture>(['straight', 6], ['wavy', 2], ['curly', 1], ['coily', 1]),
    noseShape: rep<NoseShape>(['aquiline', 3], ['straight', 3], ['roman', 2], ['broad', 2]),
    eyeShape: rep<EyeShape>(['almond', 4], ['narrow', 2], ['round', 2], ['hooded', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 5], ['average', 4], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['tan', 4], ['medium', 3], ['olive', 2], ['dark', 1]),
  },

  // Straight to wavy, with curly common — markedly more so in the south and
  // east than in the north-west. Tightly coiled hair is uncommon but real,
  // among some Adivasi groups and in the Siddi communities descended from
  // East African arrivals from about the twelfth century.
  SOUTH_ASIAN: {
    hairTexture: rep<HairTexture>(['straight', 4], ['wavy', 3], ['curly', 3]),
    noseShape: rep<NoseShape>(['straight', 4], ['aquiline', 2], ['broad', 2], ['roman', 2]),
    eyeShape: rep<EyeShape>(['almond', 4], ['large', 2], ['round', 2], ['hooded', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 3], ['average', 5], ['low', 2]),
    skinTone: rep<SkinToneLabel>(['tan', 3], ['medium', 3], ['dark', 2], ['olive', 2]),
  },

  SOUTHEAST_ASIAN: {
    hairTexture: rep<HairTexture>(['straight', 6], ['wavy', 2], ['curly', 2]),
    noseShape: rep<NoseShape>(['broad', 4], ['button', 3], ['straight', 3]),
    eyeShape: rep<EyeShape>(['almond', 4], ['narrow', 3], ['round', 2], ['hooded', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['tan', 4], ['medium', 3], ['olive', 2], ['dark', 1]),
  },

  // Wavy and curly are the norm rather than the exception, and coiled hair is
  // present through long contact across the Sahara and the Red Sea — Nubia and
  // Upper Egypt, the Maghreb, and the Arabian peninsula.
  MENA: {
    hairTexture: rep<HairTexture>(['straight', 2], ['wavy', 4], ['curly', 3], ['coily', 1]),
    noseShape: rep<NoseShape>(['aquiline', 4], ['roman', 3], ['straight', 3]),
    eyeShape: rep<EyeShape>(['almond', 4], ['large', 2], ['round', 2], ['hooded', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 3], ['average', 5], ['low', 2]),
    skinTone: rep<SkinToneLabel>(['olive', 3], ['tan', 3], ['medium', 2], ['light', 2]),
  },

  EUROPEAN: {
    hairTexture: rep<HairTexture>(['straight', 4], ['wavy', 4], ['curly', 2]),
    noseShape: rep<NoseShape>(['straight', 4], ['roman', 2], ['aquiline', 2], ['button', 2]),
    eyeShape: rep<EyeShape>(['almond', 3], ['round', 3], ['hooded', 3], ['wide', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 3], ['average', 5], ['low', 2]),
    skinTone: rep<SkinToneLabel>(['fair', 3], ['light', 3], ['pale', 2], ['medium', 1], ['very_pale', 1]),
  },

  // A settler society, and its mix is the point: European settlers, enslaved
  // and free Africans, and the Indigenous nations already there. The zone
  // default is broad because the ancestry entries below are what should
  // usually decide an individual.
  NORTH_AMERICAN_COLONIAL: {
    hairTexture: rep<HairTexture>(['straight', 4], ['wavy', 3], ['curly', 2], ['coily', 1]),
    noseShape: rep<NoseShape>(['straight', 3], ['roman', 2], ['aquiline', 2], ['button', 2], ['broad', 1]),
    eyeShape: rep<EyeShape>(['almond', 3], ['round', 3], ['hooded', 2], ['wide', 1], ['narrow', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 3], ['average', 5], ['low', 2]),
    skinTone: rep<SkinToneLabel>(['fair', 3], ['light', 3], ['medium', 2], ['tan', 1], ['dark', 1]),
  },
};

// ===========================================================================
//  By ancestry — keyed on the name set the persona was actually named from.
// ===========================================================================

/**
 * Overrides the zone when the generator has already committed to an ancestry
 * by naming the persona. Keys are `CHARACTER_NAMES` keys, so every one of them
 * is a set that really exists and really gets used.
 *
 * Partial by design: a key absent here falls back to its zone, which is the
 * right answer for the large majority of name sets.
 */
export const ANCESTRY_FEATURES: Record<string, FeatureWeights> = {
  // --- The African diaspora in the Americas. ------------------------------
  //
  // Admixed populations, and the tables say so. US African Americans average
  // roughly a quarter European ancestry and Brazilian populations vary more
  // widely still, so these run less uniformly coiled than continental African
  // tables and span a much wider range of complexion — which is the historical
  // fact, and also what keeps a page of them from looking stamped out.
  AFRICAN_AMERICAN: {
    hairTexture: rep<HairTexture>(['kinky', 2], ['coily', 4], ['curly', 3], ['wavy', 1]),
    noseShape: rep<NoseShape>(['broad', 5], ['straight', 3], ['button', 1], ['roman', 1]),
    eyeShape: rep<EyeShape>(['round', 3], ['almond', 3], ['wide', 2], ['large', 1], ['hooded', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 4], ['very_dark', 2], ['tan', 2], ['medium', 2]),
  },
  AFRO_BRAZILIAN: {
    hairTexture: rep<HairTexture>(['kinky', 2], ['coily', 4], ['curly', 3], ['wavy', 1]),
    noseShape: rep<NoseShape>(['broad', 5], ['straight', 3], ['button', 1], ['roman', 1]),
    eyeShape: rep<EyeShape>(['round', 3], ['almond', 3], ['wide', 2], ['large', 1], ['hooded', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 4], ['very_dark', 2], ['tan', 2], ['medium', 2]),
  },

  // --- Continental Africa, where one zone table cannot carry the range. ---
  //
  // The Horn is the clearest case: Ethiopian and Somali hair is very often
  // curly rather than tightly coiled, and the nose runs markedly narrower than
  // in West Africa. Drawing them off the zone table made them West Africans.
  ETHIOPIAN_HIGHLAND: {
    hairTexture: rep<HairTexture>(['curly', 4], ['coily', 4], ['kinky', 1], ['wavy', 1]),
    noseShape: rep<NoseShape>(['straight', 4], ['aquiline', 3], ['broad', 2], ['roman', 1]),
    eyeShape: rep<EyeShape>(['almond', 4], ['large', 2], ['round', 2], ['wide', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 5], ['average', 4], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 5], ['tan', 3], ['very_dark', 2]),
  },
  SOMALI: {
    hairTexture: rep<HairTexture>(['curly', 4], ['coily', 4], ['kinky', 1], ['wavy', 1]),
    noseShape: rep<NoseShape>(['straight', 4], ['aquiline', 4], ['broad', 2]),
    eyeShape: rep<EyeShape>(['almond', 4], ['large', 2], ['round', 2], ['wide', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 5], ['average', 4], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 5], ['tan', 3], ['very_dark', 2]),
  },
  // Swahili coast: East African, with Arab and South Asian ancestry along it
  // from centuries of Indian Ocean trade.
  SWAHILI_COASTAL: {
    hairTexture: rep<HairTexture>(['coily', 4], ['curly', 3], ['kinky', 2], ['wavy', 1]),
    noseShape: rep<NoseShape>(['broad', 4], ['straight', 3], ['aquiline', 2], ['roman', 1]),
    eyeShape: rep<EyeShape>(['almond', 4], ['round', 3], ['wide', 2], ['large', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 4], ['very_dark', 3], ['tan', 3]),
  },

  // --- Oceania, where the zone is least useful. ---------------------------
  //
  // Melanesian hair is tightly coiled, and it got that way *independently* —
  // the variant behind it in the Solomon Islands is unrelated to any African
  // one. It is the clearest single case of coiled hair outside Africa, and the
  // old model could not produce it at all.
  MELANESIAN: {
    hairTexture: rep<HairTexture>(['kinky', 3], ['coily', 5], ['curly', 2]),
    noseShape: rep<NoseShape>(['broad', 6], ['straight', 2], ['roman', 2]),
    eyeShape: rep<EyeShape>(['wide', 3], ['round', 3], ['almond', 3], ['large', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['very_dark', 4], ['dark', 4], ['tan', 2]),
  },

  // Straight to wavy, and a broad nose — nothing like their Melanesian
  // neighbours, which is exactly why one OCEANIA table served neither.
  POLYNESIAN: {
    hairTexture: rep<HairTexture>(['straight', 4], ['wavy', 4], ['curly', 2]),
    noseShape: rep<NoseShape>(['broad', 4], ['straight', 4], ['button', 2]),
    eyeShape: rep<EyeShape>(['almond', 4], ['round', 3], ['wide', 2], ['hooded', 1]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['tan', 4], ['medium', 3], ['dark', 3]),
  },

  // Wavy to curly rather than coiled, and blond hair occurs naturally in
  // central desert groups — one of the few places outside Europe it does.
  ABORIGINAL_AUSTRALIAN: {
    hairTexture: rep<HairTexture>(['wavy', 4], ['curly', 4], ['straight', 2]),
    noseShape: rep<NoseShape>(['broad', 6], ['straight', 3], ['roman', 1]),
    eyeShape: rep<EyeShape>(['hooded', 3], ['almond', 3], ['wide', 2], ['round', 2]),
    cheekbones: rep<CheekboneLevel>(['high', 4], ['average', 5], ['low', 1]),
    skinTone: rep<SkinToneLabel>(['dark', 5], ['very_dark', 2], ['tan', 3]),
  },
};

/**
 * Name sets that are the same ancestry under a different label — precontact
 * variants, modern/traditional pairs, and the regional African sets that
 * should read off the zone's African table rather than the settler-society
 * zone they may be standing in.
 */
const ANCESTRY_ALIASES: Record<string, string> = {
  AFRO_CARIBBEAN: 'AFRICAN_AMERICAN',
  MELANESIAN_PRECONTACT: 'MELANESIAN',
  POLYNESIAN_PRECONTACT: 'POLYNESIAN',
  HAWAIIAN: 'POLYNESIAN',
  HAWAIIAN_PRECONTACT: 'POLYNESIAN',
  MAORI_PRECONTACT: 'POLYNESIAN',
  SWAHILI_INTERIOR: 'SWAHILI_COASTAL',
};

/** African name sets that should read off the Sub-Saharan table wherever they appear. */
const CONTINENTAL_AFRICAN = new Set([
  'AKAN', 'IGBO', 'YORUBA_TRADITIONAL', 'YORUBA_MODERN', 'WEST_AFRICAN_SAHEL',
  'SUB_SAHARAN_AFRICAN', 'PREHISTORIC_AFRICAN',
]);

/**
 * The features a persona should be drawn from, given where they live and who
 * they are descended from. Ancestry wins where it is known; the zone is the
 * fallback, not the authority.
 */
export function featuresFor(zone: CulturalZone, nameKey?: string): FeatureWeights {
  if (nameKey) {
    const resolved = ANCESTRY_ALIASES[nameKey] ?? nameKey;
    const direct = ANCESTRY_FEATURES[resolved];
    if (direct) return direct;
    if (CONTINENTAL_AFRICAN.has(resolved)) return ZONE_FEATURES.SUB_SAHARAN_AFRICAN;
  }
  return ZONE_FEATURES[zone] ?? ZONE_FEATURES.EUROPEAN;
}

/** Whether a name set commits the persona to an ancestry distinct from their zone. */
export function hasAncestryOverride(nameKey?: string): boolean {
  if (!nameKey) return false;
  const resolved = ANCESTRY_ALIASES[nameKey] ?? nameKey;
  return resolved in ANCESTRY_FEATURES || CONTINENTAL_AFRICAN.has(resolved);
}
