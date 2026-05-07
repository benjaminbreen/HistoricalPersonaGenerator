import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const schemaPath = path.join(__dirname, 'src/schemas/historicalPersonaAnnotation.schema.json');
const annotationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const stripCodeFence = text => {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const parseJsonObject = text => {
  const stripped = stripCodeFence(text);
  try {
    return JSON.parse(stripped);
  } catch {
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(stripped.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Gemini did not return parseable JSON.');
  }
};

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
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const geminiText = async (prompt, options = {}) => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;
  if (!key) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY before starting the server.');
  }

  const model = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.35,
        ...(options.json ? { response_mime_type: 'application/json' } : {}),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}. Check the API key, model name, and quota.`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map(part => part.text).join('\n') || '';
};

const buildAnnotationPrompt = (source, options) => {
  const targetInstruction = options?.target === 'named_subject'
    ? `Generate the persona record for the named subject of the source if the source clearly has one. For a Wikipedia biography, this means the article subject. Use a historically situated moment during that person's life, not a posthumous summary.`
    : `Generate a plausible ordinary person from the source world, not the famous subject unless the source itself is ordinary-person evidence.`;

  return [
    'You are filling a strict JSONL annotation record for a historical persona generator.',
    'Return exactly one JSON object and no markdown.',
    targetInstruction,
    options?.preferredMoment ? `Preferred moment or angle: ${options.preferredMoment}` : '',
    'Use schema_version "1.1.0".',
    'The output must conform to this JSON Schema. Do not include properties outside the schema:',
    JSON.stringify(annotationSchema),
    '',
    'Evidence rules:',
    '- Fill every required field.',
    '- Prefer direct evidence from the source.',
    '- Use conservative historical inference for guessable fields.',
    '- Use plausible synthesis only for mundane gaps like dwelling, food security, clothing, temperament, or concerns.',
    '- Mark synthesized or inferred fields in field_evidence using support_level.',
    '- Fill persona_seed.identity_name for ordinary fictional personas or inferred source-world people. Use historically plausible names for the place, language, status, gender role, and period; mark support_level and confidence.',
    '- Fill persona_seed.social_position, persona_seed.constraint_regimes, persona_seed.public_world, persona_seed.religious_practice, persona_seed.normative_world, and persona_seed.interaction_style when evidence or conservative inference supports them.',
    '- Use the new compact fields to classify portable dimensions: social/economic security, autonomy, structural constraints, public-world scale, religious or ritual practice, normative frame, and behavior under social conditions. Put culturally specific terms in detail fields rather than inventing narrow enum values.',
    '- For literary salons, reform circles, artistic circles, or public intellectual communities, prefer public_world.scale "cultural_or_reform_network" over ritual_or_scholarly_network unless ritual institutions or formal scholarship are central.',
    '- For unpaid editorial, household, or business collaboration within a marriage or family enterprise, prefer work.labor_relation "family_enterprise_or_spousal_collaboration" over self_employed.',
    '- For work.workplace, use only the schema enum values: household, field, workshop, shop, street, dock, office, kitchen, ship, barracks, court, religious_house, factory, mixed. Map home, residence, sickroom, parlor, nursery, or domestic space to household; map study, desk, correspondence, schoolroom, or classroom to office; use mixed if no single workplace fits.',
    '- Ensure persona_seed.temporal.period_bucket contains persona_seed.temporal.specific_year.',
    '- Fill persona_seed.family.members when parents, spouse, children, or siblings are known or can be conservatively inferred. Use real known family for named historical subjects when available; otherwise use sparse plausible placeholders and mark support_level synthetic_fill or weak_inference.',
    '- Fill persona_seed.temperament_and_voice.personality_traits as Big Five values from 0 to 1. Ground them in the source where possible; otherwise infer conservatively from temperament, voice, work, and social position.',
    '- Keep source_snippets short.',
    '- Use evidence.bias_flags to note Wikipedia/reference source limitations, elite bias, model_synthesized_gaps, and uncertainty.',
    '- Do not give modern concepts, later hindsight, or broad omniscience to the persona.',
    '- If the named subject is elite or famous, household economy and material life should reflect their actual social position rather than ordinary defaults.',
    '- Choose a specific_year between 1400 and 1930. For biography pages, choose a meaningful living-year moment supported by the page.',
    '',
    'Source metadata:',
    JSON.stringify({
      title: source?.title,
      url: source?.url,
      citation_label: source?.citationLabel,
      source_basis: source?.sourceBasis,
      extraction_method: source?.extractionMethod,
      reliability_notes: source?.reliabilityNotes,
    }),
    '',
    'Source text:',
    String(source?.text || '').slice(0, 30000),
  ].filter(Boolean).join('\n');
};

const buildSketchPrompt = record => [
  'Write a historically grounded persona sketch from this annotation record.',
  'Use 4-6 compact paragraphs.',
  'Do not write a generic encyclopedia biography. Write a vivid but sober character sheet sketch anchored to the selected year, social position, work, household economy, material life, concerns, and worldview.',
  'Distinguish direct evidence from plausible inference in natural prose without footnotes.',
  'Avoid modern hindsight and anachronistic vocabulary.',
  'Return plain text only.',
  JSON.stringify(record),
].join('\n\n');

const handleGeminiRoute = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (body.action === 'generate_annotation') {
      const text = await geminiText(buildAnnotationPrompt(body.source, body.options), { json: true, temperature: 0.35 });
      sendJson(res, 200, { record: parseJsonObject(text) });
      return;
    }

    if (body.action === 'generate_sketch') {
      const sketch = await geminiText(buildSketchPrompt(body.record), { temperature: 0.45 });
      sendJson(res, 200, { sketch: sketch.trim() });
      return;
    }

    sendJson(res, 400, { error: 'Unknown Gemini action.' });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Gemini route failed.' });
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
