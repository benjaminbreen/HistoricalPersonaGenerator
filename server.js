import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import personaShareHandler from './api/persona-share.js';
import aiAccessHandler from './api/ai-access.js';
import testerAccessHandler from './api/tester-access.js';
import stripeWebhookHandler from './api/stripe-webhook.js';
import { parseJsonObject } from './api/_lib/llmJson.js';
import { checkRateLimit, clientIpFromRequest, rateLimitMessage } from './api/_lib/rateLimit.js';
import { consumeAiCredit, ensureVisitorId, hasTesterAccess } from './api/_lib/aiAccess.js';
import { buildAnnotationPrompt, buildOrientationModelSchema, buildSketchPrompt, buildSourcePersonaModelSchema, buildSourcePersonaPrompt } from './api/_lib/personaPrompts.js';
import { callModel } from './api/_lib/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const schemaPath = path.join(__dirname, 'src/schemas/personaOrientation.schema.json');
const orientationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const orientationModelSchema = buildOrientationModelSchema(orientationSchema);
const sourcePersonaModelSchema = buildSourcePersonaModelSchema(orientationSchema);

// Vite reads .env.local through loadEnv; this server has to do it itself, or
// `npm start` silently runs with no API key and every persona quietly falls
// back to the offline heuristic record.
const loadLocalEnvFile = () => {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(__dirname, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      // Real environment variables win over file values.
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
    }
  }
};

loadLocalEnvFile();

const readRequestBody = req => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  req.on('end', () => {
    try {
      resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
    } catch (error) {
      reject(error);
    }
  });
  req.on('error', reject);
});

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

const OLD_BAILEY_API = 'https://www.dhi.ac.uk/api/data/oldbailey_record';
const OLD_BAILEY_SINGLE_API = 'https://www.dhi.ac.uk/api/data/oldbailey_record_single';
const EN_WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
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
const oldBaileyDefendantSubject = source => {
  const name = String(source?.title || '').split('.')[0].trim();
  const gender = String(source?.xml || '').match(/type="defendantName"[\s\S]{0,1600}?type="gender"\s+value="(female|male)"/i)?.[1]?.toLowerCase();
  if (!name) return undefined;
  return {
    name,
    description: 'Defendant named in the tagged Old Bailey trial record.',
    genderRole: gender === 'female' ? 'woman' : gender === 'male' ? 'man' : undefined,
    externalId: source?.idkey,
  };
};
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
const buildOldBaileyTextQuery = filters => [oldBaileyGenderTerms[filters.get('gender') || ''], oldBaileyCrimeTerms[filters.get('crime') || '']].filter(Boolean).join(' ');
const oldBaileyTrialMatches = (hit, filters, startDate, endDate) => {
  const source = hit?._source || {};
  if (!String(source.idkey || '').startsWith('t')) return false;
  const date = oldBaileyHitDate(hit);
  if (startDate && (!date || date < startDate)) return false;
  if (endDate && (!date || date >= endDate)) return false;
  const text = `${source.title || ''} ${source.text || ''}`.toLowerCase();
  const taggedGender = oldBaileyDefendantSubject(source)?.genderRole;
  if (filters.get('gender') === 'female' && (taggedGender ? taggedGender !== 'woman' : !/\b(woman|female|she|her|spinster|wife|widow|elizabeth|mary|ann|anne|sarah|margaret|jane)\b/.test(text))) return false;
  if (filters.get('gender') === 'male' && (taggedGender ? taggedGender !== 'man' : !/\b(man|male|he|his|husband|john|william|thomas|james|george|henry)\b/.test(text))) return false;
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
    sourceDate: date?.toISOString().slice(0, 10),
    subject: oldBaileyDefendantSubject(source),
  };
};
const handleOldBaileyRoute = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }
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
          sendJson(res, 200, oldBaileySourceFromHit(hit, filters));
          return;
        }
      }
      throw new Error('Found Old Bailey sessions for that decade, but no trial matched the selected filters. Try broader filters.');
    }
    const firstPage = await fetchOldBaileyPage({ text, from: 0 });
    const total = Number(firstPage?.hits?.total || 0);
    if (!total) throw new Error('No Old Bailey records matched those filters.');
    const startOffset = 0;
    const endOffset = Math.min(total, 9990);
    const searchWindow = Math.max(1, endOffset - startOffset);
    for (let attempt = 0; attempt < 12; attempt++) {
      const page = await fetchOldBaileyPage({ text, from: startOffset + Math.floor(Math.random() * searchWindow) });
      const hit = (page?.hits?.hits || []).find(candidate => oldBaileyTrialMatches(candidate, filters, startDate, endDate));
      if (hit) {
        sendJson(res, 200, oldBaileySourceFromHit(hit, filters));
        return;
      }
    }
    throw new Error('Found Old Bailey results, but none survived the trial/date/person filters. Try broader filters.');
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Old Bailey lookup failed.' });
  }
};

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
const handleRandomWikidataPersonRoute = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }
    for (let attempt = 0; attempt < 12; attempt++) {
      const pages = await fetchRandomWikipediaPages();
      const ids = Array.from(new Set(pages.map(page => page?.pageprops?.wikibase_item).filter(Boolean)));
      if (!ids.length) continue;
      const entities = await fetchWikidataEntities(ids);
      const candidates = pages
        .map(page => wikidataPersonCandidate(page, entities[page?.pageprops?.wikibase_item]))
        .filter(Boolean);
      if (candidates.length) {
        sendJson(res, 200, candidates[Math.floor(Math.random() * candidates.length)]);
        return;
      }
    }
    throw new Error('Could not find a random Wikipedia biography with Wikidata dates in the supported range.');
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Wikidata lookup failed.' });
  }
};

const handleGeminiRoute = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (body.action === 'generate_annotation' || body.action === 'generate_sketch' || body.action === 'generate_source_persona') {
      const billedAction = body.action === 'generate_source_persona' ? 'generate_sketch' : body.action;
      const verdict = checkRateLimit(clientIpFromRequest(req), billedAction);
      if (!verdict.allowed) {
        res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
        sendJson(res, 429, { error: rateLimitMessage(verdict.scope), retryAfterSeconds: verdict.retryAfterSeconds });
        return;
      }
      const visitorId = ensureVisitorId(req, res);
      const accessVerdict = await consumeAiCredit(visitorId, billedAction, Date.now(), {
        testerAccess: hasTesterAccess(req),
      });
      if (!accessVerdict.allowed) {
        sendJson(res, 402, {
          code: 'AI_SUPPORT_REQUIRED',
          error: billedAction === 'generate_annotation'
            ? 'You have used all three free full schema generations. A donation unlocks 50 credits for 30 days.'
            : 'You have used all five free AI biographies. A donation unlocks 50 credits for 30 days.',
          access: accessVerdict.access,
        });
        return;
      }
    }

    if (body.action === 'generate_source_persona') {
      const { text, usage, transparency } = await callModel({
        variant: body.model,
        action: 'generate_source_persona',
        prompt: buildSourcePersonaPrompt(body.source, body.options),
        json: true,
        schema: sourcePersonaModelSchema,
      });
      const record = parseJsonObject(text);
      sendJson(res, 200, { record, sketch: record.day_in_life || '', usage, transparency });
      return;
    }

    if (body.action === 'generate_annotation') {
      const { text, usage, transparency } = await callModel({
        variant: body.model,
        action: 'generate_annotation',
        prompt: buildAnnotationPrompt(body.source, body.options),
        json: true,
        schema: orientationModelSchema,
      });
      sendJson(res, 200, { record: parseJsonObject(text), usage, transparency });
      return;
    }

    if (body.action === 'generate_sketch') {
      const { text, usage, transparency } = await callModel({
        variant: body.model,
        action: 'generate_sketch',
        prompt: buildSketchPrompt(body.record),
      });
      sendJson(res, 200, { sketch: text.trim(), usage, transparency });
      return;
    }

    sendJson(res, 400, { error: 'Unknown Gemini action.' });
  } catch (error) {
    console.error('Persona generation failed:', error);
    // The credit gate runs before the model and throws 503s of its own; a flat
    // 500 here made a missing env var look like a model outage.
    sendJson(res, Number(error?.statusCode) || 500, {
      error: error?.code ? error.message : 'Persona generation is temporarily unavailable. Please try again.',
    });
  }
};

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const serveStatic = (req, res) => {
  const requestPath = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  const candidate = path.normalize(path.join(distDir, requestPath === '/' ? 'index.html' : requestPath));
  const filePath = candidate.startsWith(distDir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(distDir, 'index.html');

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Build output not found. Run npm run build first.');
    return;
  }

  res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer((req, res) => {
  if ((req.url || '').startsWith('/api/stripe-webhook')) {
    void stripeWebhookHandler(req, res);
    return;
  }

  if ((req.url || '').startsWith('/api/ai-access')) {
    void aiAccessHandler(req, res);
    return;
  }

  if ((req.url || '').startsWith('/api/tester-access')) {
    void testerAccessHandler(req, res);
    return;
  }

  if ((req.url || '').startsWith('/api/persona-share')) {
    void personaShareHandler(req, res);
    return;
  }

  if ((req.url || '').startsWith('/api/old-bailey/random')) {
    void handleOldBaileyRoute(req, res);
    return;
  }

  if ((req.url || '').startsWith('/api/wikidata/random-person')) {
    void handleRandomWikidataPersonRoute(req, res);
    return;
  }

  if ((req.url || '').startsWith('/api/gemini-persona')) {
    void handleGeminiRoute(req, res);
    return;
  }

  serveStatic(req, res);
});

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => {
  console.log(`Historical Persona Generator server listening on http://${host}:${port}`);
});
