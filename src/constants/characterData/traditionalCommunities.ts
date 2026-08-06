/**
 * constants/characterData/traditionalCommunities.ts
 *
 * Whether a persona lives among the people who kept a practice, as against the
 * national society that grew up around them.
 *
 * Body marking is the case this was written for. Genipapo, urucum, cheek plugs
 * and lineage tattoos are still worn in the Amazon, the Chaco and the Andes; a
 * plumber in Rio de Janeiro in 2015 wears none of them, and every rule that
 * reaches for "South American, therefore painted" put them on him anyway. The
 * cultural zone cannot answer this question on its own, because after the
 * nineteenth century the zone mostly means a nation state. The place can.
 *
 * Deliberately a list of communities and country rather than of ethnonyms
 * alone: a persona located in "Mato Grosso" or on a "terra indígena" is placed
 * in that world even when no people is named.
 *
 * **Location and region are not the same question.** The app's macro-regions are
 * named for two things at once — "Gran Chaco and Pampas", "Llanos and Orinoco" —
 * so a keyword tested against the region label admits everyone inside it. That
 * is how a German-Argentine farmer in the Pampas Grasslands in 1936 came to be
 * wearing daily face paint: the region he was in contained the word "Chaco",
 * and one word whitelisted six of the seven places under it. Hence two lists.
 */

/**
 * Tested against the **location** — a specific place, where a keyword means
 * what it says.
 */
export const TRADITIONAL_COMMUNITY_PLACES = new RegExp([
  // Amazonia and the Guiana shield
  'amazon', 'amazôn', 'amazon(?:as|ia)', 'orinoco', 'xingu', 'rio negro', 'ucayali',
  'tapajos', 'tapajós', 'mato grosso', 'rainforest', 'guiana', 'guyana', 'roraima',
  'acre', 'rondônia', 'rondonia', 'madre de dios', 'putumayo', 'caquetá', 'caqueta',
  // The seasonally flooded forest, which is a way of living and not just a
  // landform: the várzea communities are riverine and kept the practice.
  'varzea', 'várzea',
  // Peoples
  'yanomami', 'kayapo', 'kayapó', 'ashaninka', 'asháninka', 'shipibo', 'ticuna',
  'tikuna', 'guaraní', 'guarani', 'mapuche', 'aymara', 'quechua', 'wayuu',
  'kuna', 'guna', 'shuar', 'awá', 'suruí', 'surui', 'xavante', 'bororo',
  // Highland and lowland country where the practice held
  'altiplano', 'chaco', 'sierra nevada', 'chiapas', 'oaxaca',
  // What a modern indigenous territory is called, in four languages
  'terra indígena', 'terra indigena', 'resguardo', 'reserva indígena',
  'reserva indigena', 'comunidad indígena', 'comunidad indigena',
  'reservation', 'indigenous', 'tribal territory',
].join('|'));

/**
 * Tested against the **region**, which covers millions of people and several
 * ways of living at once.
 *
 * Only terms that stay true of everyone under them survive here. A named people
 * does — a region called for the Mapuche is a region of Mapuche. An explicit
 * indigenous territory does. A landform does not: "Chaco", "Orinoco", "Amazon"
 * and "Guiana" are all half of a compound region label in this app, and the
 * other half is farmland, ranching country or a city of two million.
 *
 * Nothing is lost by dropping them, because the locations that genuinely
 * qualify carry their own names — Xingu, Rio Negro, Ucayali, Gran Chaco — and
 * are matched by the list above on their own account.
 */
export const TRADITIONAL_REGION_TERMS = new RegExp([
  'yanomami', 'kayapo', 'kayapó', 'ashaninka', 'asháninka', 'shipibo', 'ticuna',
  'tikuna', 'guaraní', 'guarani', 'mapuche', 'aymara', 'quechua', 'wayuu',
  'kuna', 'guna', 'shuar', 'awá', 'suruí', 'surui', 'xavante', 'bororo',
  'terra indígena', 'terra indigena', 'resguardo', 'reserva indígena',
  'reserva indigena', 'comunidad indígena', 'comunidad indigena',
  'reservation', 'indigenous', 'tribal territory',
].join('|'));

/**
 * Both arguments lowercased. `regionLower` is optional and defaults to empty:
 * a caller that has only one string should pass it as the *location*, because
 * over-admitting is the failure this file exists to prevent.
 */
export const livesInTraditionalCommunity = (
  locationLower: string,
  regionLower = ''
): boolean =>
  TRADITIONAL_COMMUNITY_PLACES.test(locationLower)
  || TRADITIONAL_REGION_TERMS.test(regionLower);
