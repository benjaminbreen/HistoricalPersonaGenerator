const EN_WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const WIKIMEDIA_HEADERS = {
  Accept: 'application/json',
  'Api-User-Agent': 'HistoricalPersonaGenerator/1.0 (https://historical-persona-generator.vercel.app; mailto:breen85@gmail.com)',
  'User-Agent': 'HistoricalPersonaGenerator/1.0 (https://historical-persona-generator.vercel.app; mailto:breen85@gmail.com)',
};

// This is not the primary selection pool. It keeps the feature useful when a
// shared Vercel IP is temporarily throttled by Wikimedia's random endpoint.
// Each entry still points to a real Wikipedia biography; article ingestion and
// Luna grounding proceed normally in the browser.
export const CURATED_HISTORICAL_PEOPLE = [
  { label: 'Nzinga of Ndongo and Matamba', birthYear: 1583, deathYear: 1663, wikipediaTitle: 'Nzinga of Ndongo and Matamba' },
  { label: 'Sor Juana Inés de la Cruz', birthYear: 1648, deathYear: 1695, wikipediaTitle: 'Juana Inés de la Cruz' },
  { label: 'Ayuba Suleiman Diallo', birthYear: 1701, deathYear: 1773, wikipediaTitle: 'Ayuba Suleiman Diallo' },
  { label: 'Olaudah Equiano', birthYear: 1745, deathYear: 1797, wikipediaTitle: 'Olaudah Equiano' },
  { label: 'Mary Prince', birthYear: 1788, wikipediaTitle: 'Mary Prince' },
  { label: 'Ignatius Sancho', birthYear: 1729, deathYear: 1780, wikipediaTitle: 'Ignatius Sancho' },
  { label: 'Zheng He', birthYear: 1371, deathYear: 1433, wikipediaTitle: 'Zheng He' },
  { label: 'Hasekura Tsunenaga', birthYear: 1571, deathYear: 1622, wikipediaTitle: 'Hasekura Tsunenaga' },
  { label: 'Qiu Jin', birthYear: 1875, deathYear: 1907, wikipediaTitle: 'Qiu Jin' },
  { label: 'Sunthorn Phu', birthYear: 1786, deathYear: 1855, wikipediaTitle: 'Sunthorn Phu' },
  { label: 'Abdullah bin Abdul Kadir', birthYear: 1796, deathYear: 1854, wikipediaTitle: 'Abdullah bin Abdul Kadir' },
  { label: 'Pandita Ramabai', birthYear: 1858, deathYear: 1922, wikipediaTitle: 'Pandita Ramabai' },
  { label: 'Lakshmibai', birthYear: 1828, deathYear: 1858, wikipediaTitle: 'Rani of Jhansi' },
  { label: 'Cornelia Sorabji', birthYear: 1866, deathYear: 1954, wikipediaTitle: 'Cornelia Sorabji' },
  { label: 'José Rizal', birthYear: 1861, deathYear: 1896, wikipediaTitle: 'José Rizal' },
  { label: 'Túpac Amaru II', birthYear: 1738, deathYear: 1781, wikipediaTitle: 'Túpac Amaru II' },
  { label: 'Juana Azurduy de Padilla', birthYear: 1780, deathYear: 1862, wikipediaTitle: 'Juana Azurduy de Padilla' },
  { label: 'Catalina de Erauso', birthYear: 1592, deathYear: 1650, wikipediaTitle: 'Catalina de Erauso' },
  { label: 'Estebanico', birthYear: 1500, deathYear: 1539, wikipediaTitle: 'Estevanico' },
  { label: 'Juan Latino', birthYear: 1518, deathYear: 1594, wikipediaTitle: 'Juan Latino' },
  { label: 'Sayyida al Hurra', birthYear: 1485, deathYear: 1561, wikipediaTitle: 'Sayyida al Hurra' },
  { label: 'Leo Africanus', birthYear: 1494, deathYear: 1554, wikipediaTitle: 'Leo Africanus' },
  { label: 'Artemisia Gentileschi', birthYear: 1593, deathYear: 1656, wikipediaTitle: 'Artemisia Gentileschi' },
  { label: 'Ah Toy', birthYear: 1829, deathYear: 1928, wikipediaTitle: 'Ah Toy' },
  { label: 'Mary Seacole', birthYear: 1805, deathYear: 1881, wikipediaTitle: 'Mary Seacole' },
  { label: 'Yaa Asantewaa', birthYear: 1840, deathYear: 1921, wikipediaTitle: 'Yaa Asantewaa' },
  { label: 'Ranavalona I', birthYear: 1778, deathYear: 1861, wikipediaTitle: 'Ranavalona I' },
  { label: 'Tewodros II', birthYear: 1818, deathYear: 1868, wikipediaTitle: 'Tewodros II' },
  { label: 'Pocahontas', birthYear: 1596, deathYear: 1617, wikipediaTitle: 'Pocahontas' },
  { label: 'Venture Smith', birthYear: 1729, deathYear: 1805, wikipediaTitle: 'Venture Smith' },
];

const firstClaim = (entity, property) => entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
const entityClaimIds = (entity, property) => (entity?.claims?.[property] || [])
  .map(claim => claim?.mainsnak?.datavalue?.value?.id)
  .filter(Boolean);

const yearFromWikidataTime = value => {
  const time = value?.time;
  if (typeof time !== 'string') return undefined;
  const match = time.match(/^([+-])(\d{1,6})/);
  if (!match) return undefined;
  const year = Number(match[2]);
  return match[1] === '-' ? -year : year;
};

const wikiArticleUrlFromTitle = title =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g, '_'))}`;

const fetchJson = async (url, fetchImpl, upstream) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetchImpl(url, { headers: WIKIMEDIA_HEADERS, signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`${upstream} returned ${response.status}`);
      error.status = response.status;
      error.upstream = upstream;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchRandomWikipediaPages = async fetchImpl => {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'random',
    grnnamespace: '0',
    grnlimit: '50',
    prop: 'pageprops|info',
    inprop: 'url',
  });
  const data = await fetchJson(`${EN_WIKIPEDIA_API}?${query.toString()}`, fetchImpl, 'Wikipedia random API');
  return Object.values(data?.query?.pages || {});
};

const fetchWikidataEntities = async (ids, fetchImpl) => {
  const query = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    props: 'claims|sitelinks|descriptions|labels',
    languages: 'en',
    ids: ids.join('|'),
  });
  const data = await fetchJson(`${WIKIDATA_API}?${query.toString()}`, fetchImpl, 'Wikidata entities API');
  return data?.entities || {};
};

const wikidataPersonCandidate = (page, entity) => {
  if (!entity || entity.missing) return null;
  if (!entityClaimIds(entity, 'P31').includes('Q5')) return null;
  const birthYear = yearFromWikidataTime(firstClaim(entity, 'P569'));
  const deathYear = yearFromWikidataTime(firstClaim(entity, 'P570'));
  if (birthYear === undefined || birthYear < 1300 || birthYear > 1930) return null;
  if (deathYear !== undefined && deathYear < 1300) return null;
  if (deathYear === undefined && birthYear > 1880) return null;
  const enwikiTitle = entity?.sitelinks?.enwiki?.title || page.title;
  if (!enwikiTitle) return null;
  const sitelinkCount = Object.keys(entity?.sitelinks || {}).length;
  const pageLength = Number(page.length || 0);
  if (sitelinkCount < 2 && pageLength < 2500) return null;
  return {
    qid: entity.id,
    label: entity?.labels?.en?.value || enwikiTitle,
    description: entity?.descriptions?.en?.value,
    birthYear,
    deathYear,
    wikipediaTitle: enwikiTitle,
    wikipediaUrl: page.fullurl || wikiArticleUrlFromTitle(enwikiTitle),
    selectionMode: 'live_random',
  };
};

let cachedCandidates = [];
let candidateCacheExpiresAt = 0;

const choose = (items, random) => items[Math.min(items.length - 1, Math.floor(random() * items.length))];

const curatedFallback = (random, reason) => {
  const selected = choose(CURATED_HISTORICAL_PEOPLE, random);
  return {
    ...selected,
    wikipediaUrl: wikiArticleUrlFromTitle(selected.wikipediaTitle),
    selectionMode: 'curated_fallback',
    notice: reason,
  };
};

export async function findRandomWikipediaPerson(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const random = options.random || Math.random;
  const maxAttempts = Math.max(1, Math.min(Number(options.maxAttempts || 4), 6));

  if (options.useCache !== false && cachedCandidates.length && Date.now() < candidateCacheExpiresAt) {
    return choose(cachedCandidates, random);
  }

  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const pages = await fetchRandomWikipediaPages(fetchImpl);
      const ids = Array.from(new Set(pages.map(page => page?.pageprops?.wikibase_item).filter(Boolean)));
      if (!ids.length) continue;
      const entities = await fetchWikidataEntities(ids, fetchImpl);
      const candidates = pages
        .map(page => wikidataPersonCandidate(page, entities[page?.pageprops?.wikibase_item]))
        .filter(Boolean);
      if (candidates.length) {
        if (options.useCache !== false) {
          cachedCandidates = candidates;
          candidateCacheExpiresAt = Date.now() + (10 * 60 * 1000);
        }
        return choose(candidates, random);
      }
    } catch (error) {
      lastError = error;
      // Retrying a throttled shared IP immediately makes the throttle worse.
      if (error?.status === 429) break;
    }
  }

  const technicalReason = lastError instanceof Error ? lastError.message : 'No eligible biography appeared in the random batches.';
  return curatedFallback(
    random,
    `Wikimedia's live random index was temporarily unavailable (${technicalReason}). A real Wikipedia biography was selected from the backup pool instead.`,
  );
}
