const EN_WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

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

const wikiArticleUrlFromTitle = title => `https://en.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g, '_'))}`;

const fetchRandomWikipediaPages = async () => {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'random',
    grnnamespace: '0',
    grnlimit: '50',
    prop: 'pageprops|info',
    inprop: 'url',
    origin: '*',
  });
  const response = await fetch(`${EN_WIKIPEDIA_API}?${query.toString()}`);
  if (!response.ok) throw new Error(`Wikipedia random API returned ${response.status}`);
  const data = await response.json();
  return Object.values(data?.query?.pages || {});
};

const fetchWikidataEntities = async ids => {
  const query = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    props: 'claims|sitelinks|descriptions|labels',
    languages: 'en',
    ids: ids.join('|'),
    origin: '*',
  });
  const response = await fetch(`${WIKIDATA_API}?${query.toString()}`);
  if (!response.ok) throw new Error(`Wikidata entities API returned ${response.status}`);
  const data = await response.json();
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
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    for (let attempt = 0; attempt < 12; attempt++) {
      const pages = await fetchRandomWikipediaPages();
      const ids = Array.from(new Set(pages.map(page => page?.pageprops?.wikibase_item).filter(Boolean)));
      if (!ids.length) continue;
      const entities = await fetchWikidataEntities(ids);
      const candidates = pages
        .map(page => wikidataPersonCandidate(page, entities[page?.pageprops?.wikibase_item]))
        .filter(Boolean);
      if (candidates.length) {
        res.status(200).json(candidates[Math.floor(Math.random() * candidates.length)]);
        return;
      }
    }
    throw new Error('Could not find a random Wikipedia biography with Wikidata dates in the supported range.');
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Wikidata lookup failed.' });
  }
}
