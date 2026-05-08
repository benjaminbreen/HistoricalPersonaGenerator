const OLD_BAILEY_API = 'https://www.dhi.ac.uk/api/data/oldbailey_record';
const OLD_BAILEY_SINGLE_API = 'https://www.dhi.ac.uk/api/data/oldbailey_record_single';

const oldBaileyCrimeTerms = {
  theft: 'stealing',
  violent_theft: 'highway robbery',
  deception: 'forgery',
  killing: 'murder',
  sexual: 'rape',
  royal: 'treason',
  damage: 'damage',
  miscellaneous: 'misdemeanour',
};

const oldBaileyGenderTerms = { female: 'woman', male: 'man' };
const normalizeWhitespace = value => String(value || '').replace(/\s+/g, ' ').trim();

const oldBaileyDateFromTitle = (title = '') => {
  const match = String(title).match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return null;
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]} 00:00:00 UTC`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const oldBaileyHitDate = hit => oldBaileyDateFromTitle(hit?._source?.title);

const fetchOldBaileyPage = async ({ text, from }) => {
  const query = new URLSearchParams();
  if (text) query.set('text', text);
  if (from) query.set('from', String(Math.max(0, from)));
  const response = await fetch(`${OLD_BAILEY_API}?${query.toString()}`);
  if (!response.ok) throw new Error(`Old Bailey API returned ${response.status}`);
  return response.json();
};

const fetchOldBaileySingle = async idkey => {
  const query = new URLSearchParams({ idkey });
  const response = await fetch(`${OLD_BAILEY_SINGLE_API}?${query.toString()}`);
  if (!response.ok) throw new Error(`Old Bailey single-record API returned ${response.status}`);
  const page = await response.json();
  return page?.hits?.hits?.[0] || null;
};

const oldBaileySessionKeysForDecade = async decade => {
  const keys = new Set();
  for (let year = decade; year < decade + 10; year++) {
    const page = await fetchOldBaileyPage({ text: String(year), from: 0 });
    for (const hit of page?.hits?.hits || []) {
      const date = oldBaileyHitDate(hit);
      if (!date || date.getUTCFullYear() !== year) continue;
      const yyyy = String(date.getUTCFullYear());
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      keys.add(`${yyyy}${mm}${dd}`);
    }
  }
  return Array.from(keys);
};

const buildOldBaileyTextQuery = filters => [
  oldBaileyGenderTerms[filters.get('gender') || ''],
  oldBaileyCrimeTerms[filters.get('crime') || ''],
].filter(Boolean).join(' ');

const oldBaileyTrialMatches = (hit, filters, startDate, endDate) => {
  const source = hit?._source || {};
  if (!String(source.idkey || '').startsWith('t')) return false;
  const date = oldBaileyHitDate(hit);
  if (startDate && (!date || date < startDate)) return false;
  if (endDate && (!date || date >= endDate)) return false;
  const text = `${source.title || ''} ${source.text || ''}`.toLowerCase();
  if (filters.get('gender') === 'female' && !/\b(woman|female|she|her|spinster|wife|widow|elizabeth|mary|ann|anne|sarah|margaret|jane)\b/.test(text)) return false;
  if (filters.get('gender') === 'male' && !/\b(man|male|he|his|husband|john|william|thomas|james|george|henry)\b/.test(text)) return false;
  const crime = filters.get('crime');
  if (crime === 'theft' && !/(theft|steal|stole|stealing|shoplifting|burglary|larceny)/.test(text)) return false;
  if (crime === 'violent_theft' && !/(violent theft|robbery|highway robbery|highway|assault)/.test(text)) return false;
  if (crime === 'deception' && !/(deception|forgery|fraud|perjury|counterfeit)/.test(text)) return false;
  if (crime === 'killing' && !/(killing|murder|manslaughter|infanticide)/.test(text)) return false;
  if (crime === 'sexual' && !/(sexual offences|rape|bigamy|assault with intent)/.test(text)) return false;
  if (crime === 'royal' && !/(royal offences|treason|coining|seditious|tax)/.test(text)) return false;
  if (crime === 'damage' && !/(damage|arson|riot|breaking peace)/.test(text)) return false;
  if (crime === 'miscellaneous' && !/(miscellaneous|vagrancy|conspiracy|libel|kidnapping)/.test(text)) return false;
  return true;
};

const oldBaileySourceFromHit = (hit, filters) => {
  const source = hit._source || {};
  const title = source.title || `Old Bailey trial ${source.idkey}`;
  const idkey = source.idkey;
  const date = oldBaileyHitDate(hit);
  const imageUrl = Array.isArray(source.images) ? source.images[0] : undefined;
  const text = normalizeWhitespace([
    title,
    `Trial reference: ${idkey}.`,
    date ? `Trial/session date: ${date.toISOString().slice(0, 10)}.` : '',
    filters.get('personaAngle') === 'ordinary_person_from_source_world'
      ? 'Persona angle requested: ordinary person from the world of this trial, not necessarily the defendant.'
      : 'Persona angle requested: named person directly connected to the trial where possible.',
    source.text || '',
  ].filter(Boolean).join('\n\n'));

  return {
    title,
    text: text.slice(0, 30000),
    url: `https://www.dhi.ac.uk/data/oldbailey/record/${idkey}`,
    imageUrl,
    imageAttribution: imageUrl ? `Old Bailey Proceedings page image for ${idkey}` : undefined,
    sourceBasis: 'court_testimony',
    extractionMethod: 'structured_api',
    citationLabel: `Old Bailey Proceedings: ${idkey}`,
    reliabilityNotes: 'Old Bailey trial account from the DHI API. Treat as institutional/legal testimony with reporting, transcription, and courtroom bias.',
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const filters = new URL(req.url || '/', 'http://localhost').searchParams;
    const text = buildOldBaileyTextQuery(filters);
    const decade = filters.get('decade');
    const decadeNumber = decade && /^\d{4}$/.test(decade) ? Number(decade) : undefined;
    const startDate = decadeNumber ? new Date(`${decadeNumber}-01-01T00:00:00Z`) : undefined;
    const endDate = decadeNumber ? new Date(`${decadeNumber + 10}-01-01T00:00:00Z`) : undefined;

    if (decadeNumber) {
      if (decadeNumber < 1670 || decadeNumber > 1830) {
        throw new Error('Decade filters currently support Old Bailey sessions from the 1670s through the 1830s.');
      }
      const sessionKeys = await oldBaileySessionKeysForDecade(decadeNumber);
      if (!sessionKeys.length) throw new Error('No Old Bailey sessions found for that decade.');
      for (let attempt = 0; attempt < 80; attempt++) {
        const sessionKey = sessionKeys[Math.floor(Math.random() * sessionKeys.length)];
        const trialNumber = 1 + Math.floor(Math.random() * 160);
        const hit = await fetchOldBaileySingle(`t${sessionKey}-${trialNumber}`);
        if (hit && oldBaileyTrialMatches(hit, filters, startDate, endDate)) {
          res.status(200).json(oldBaileySourceFromHit(hit, filters));
          return;
        }
      }
      throw new Error('Found Old Bailey sessions for that decade, but no trial matched the selected filters. Try broader filters.');
    }

    const firstPage = await fetchOldBaileyPage({ text, from: 0 });
    const total = Number(firstPage?.hits?.total || 0);
    if (!total) throw new Error('No Old Bailey records matched those filters.');
    const searchWindow = Math.max(1, Math.min(total, 9990));
    for (let attempt = 0; attempt < 12; attempt++) {
      const page = await fetchOldBaileyPage({ text, from: Math.floor(Math.random() * searchWindow) });
      const hit = (page?.hits?.hits || []).find(candidate => oldBaileyTrialMatches(candidate, filters, startDate, endDate));
      if (hit) {
        res.status(200).json(oldBaileySourceFromHit(hit, filters));
        return;
      }
    }
    throw new Error('Found Old Bailey results, but none survived the trial/date/person filters. Try broader filters.');
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Old Bailey lookup failed.' });
  }
}
