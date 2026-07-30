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
 */
export const TRADITIONAL_COMMUNITY_PLACES = new RegExp([
  // Amazonia and the Guiana shield
  'amazon', 'amazôn', 'amazon(?:as|ia)', 'orinoco', 'xingu', 'rio negro', 'ucayali',
  'tapajos', 'tapajós', 'mato grosso', 'rainforest', 'guiana', 'guyana', 'roraima',
  'acre', 'rondônia', 'rondonia', 'madre de dios', 'putumayo', 'caquetá', 'caqueta',
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
 * `placeLower` is the region and location joined and lowercased, as the
 * generators already assemble it for the `places` scoping on markings.
 */
export const livesInTraditionalCommunity = (placeLower: string): boolean =>
  TRADITIONAL_COMMUNITY_PLACES.test(placeLower);
