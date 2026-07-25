import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { get, put } from '@vercel/blob';
import Ajv2020 from 'ajv/dist/2020.js';

const SHARE_SCHEMA_VERSION = 1;
const MAX_REQUEST_BYTES = 384 * 1024;
const MAX_STRING_LENGTH = 30_000;
const MAX_ARRAY_LENGTH = 600;
const MAX_OBJECT_KEYS = 500;
const MAX_DEPTH = 18;
const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const LOCAL_SHARE_DIRECTORY = path.join(process.cwd(), '.persona-shares');
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_WRITES = 20;
const writeBuckets = new Map();
const annotationSchema = JSON.parse(readFileSync(
  path.join(process.cwd(), 'src/schemas/historicalPersonaAnnotation.schema.json'),
  'utf8'
));
const validateAnnotationRecord = new Ajv2020({
  allErrors: true,
  strict: false,
  formats: {
    uri: value => {
      try {
        return Boolean(new URL(value));
      } catch {
        return false;
      }
    },
    'date-time': value => (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
      !Number.isNaN(Date.parse(value))
    ),
  },
}).compile(annotationSchema);

const jsonResponse = (res, status, body, cacheControl = 'no-store') => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
};

const requestIp = req => String(
  req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
).split(',')[0].trim();

const checkWriteRateLimit = req => {
  const now = Date.now();
  const key = requestIp(req);
  const existing = writeBuckets.get(key);
  if (!existing || now - existing.startedAt >= RATE_LIMIT_WINDOW_MS) {
    writeBuckets.set(key, { startedAt: now, count: 1 });
    if (writeBuckets.size > 5_000) {
      for (const [bucketKey, bucket] of writeBuckets) {
        if (now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) writeBuckets.delete(bucketKey);
      }
    }
    return { allowed: true, retryAfter: 0 };
  }
  if (existing.count >= RATE_LIMIT_MAX_WRITES) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - existing.startedAt)) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfter: 0 };
};

const readRequestBody = async req => {
  const declaredLength = Number(req.headers?.['content-length'] || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    const error = new Error('Share snapshot is too large.');
    error.statusCode = 413;
    throw error;
  }
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const rawBody = String(req.body);
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BYTES) {
      const error = new Error('Share snapshot is too large.');
      error.statusCode = 413;
      throw error;
    }
    return JSON.parse(rawBody || '{}');
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_REQUEST_BYTES) {
      const error = new Error('Share snapshot is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  if (Buffer.byteLength(raw, 'utf8') > MAX_REQUEST_BYTES) {
    const error = new Error('Share snapshot is too large.');
    error.statusCode = 413;
    throw error;
  }
  return JSON.parse(raw);
};

const sanitizeText = value => String(value)
  .replace(/<[^>]*>/g, '')
  .replace(/[<>&]/g, character => ({ '<': '‹', '>': '›', '&': ' and ' }[character]))
  .replace(/"/g, '”')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .slice(0, MAX_STRING_LENGTH);

const sanitizeUrl = value => {
  const candidate = String(value || '').trim();
  if (!candidate) return '';
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate.slice(0, 2_000);
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString().slice(0, 2_000)
      : '';
  } catch {
    return '';
  }
};

const looksLikeUrlKey = key =>
  /(?:^|_)(?:url|uri)$|(?:Url|URL|profileImage|imageUrl|downloadUrl)$/i.test(key);

const sanitizeValue = (value, depth = 0, key = '') => {
  if (depth > MAX_DEPTH) throw new Error('Share snapshot is too deeply nested.');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === 'string') {
    return looksLikeUrlKey(key) ? sanitizeUrl(value) : sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map(item => sanitizeValue(item, depth + 1, key))
      .filter(item => item !== undefined);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length > MAX_OBJECT_KEYS) throw new Error('Share snapshot contains too many fields.');
    const sanitized = {};
    for (const [entryKey, entryValue] of entries) {
      if (['__proto__', 'prototype', 'constructor'].includes(entryKey)) continue;
      if (!/^[^\u0000-\u001F\u007F]{1,100}$/.test(entryKey)) continue;
      const next = sanitizeValue(entryValue, depth + 1, entryKey);
      if (next !== undefined) sanitized[entryKey] = next;
    }
    return sanitized;
  }
  return undefined;
};

const requiredString = (value, label, maxLength = 300) => {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`${label} is missing or invalid.`);
  }
};

export const validateAndSanitizeSnapshot = input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('A persona snapshot is required.');
  }

  const allowedKeys = new Set([
    'schemaVersion',
    'persona',
    'annotationRecord',
    'personaSketch',
    'sourcePortraitUrl',
    'sourcePortraitAttribution',
    'sourceTarget',
    'portraitEngine',
    'samplingMode',
    'generatorVersion',
    'originalSeed',
  ]);
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) throw new Error(`Unexpected snapshot field: ${key}.`);
  }
  if (input.schemaVersion !== SHARE_SCHEMA_VERSION) {
    throw new Error(`Unsupported share schema version: ${input.schemaVersion}.`);
  }
  if (!input.persona || typeof input.persona !== 'object' || Array.isArray(input.persona)) {
    throw new Error('Persona data is missing.');
  }

  const persona = input.persona;
  const character = persona.character;
  if (!character || typeof character !== 'object' || Array.isArray(character)) {
    throw new Error('Character data is missing.');
  }
  requiredString(character.name, 'Character name');
  requiredString(character.profession, 'Character profession');
  requiredString(persona.location, 'Persona location');
  requiredString(persona.region, 'Persona region');
  if (!Number.isInteger(persona.year) || persona.year < -40_000 || persona.year > 2_100) {
    throw new Error('Persona year is invalid.');
  }
  if (!Number.isFinite(character.age) || character.age < 0 || character.age > 130) {
    throw new Error('Character age is invalid.');
  }
  if (!['classic', 'lab'].includes(input.portraitEngine)) {
    throw new Error('Portrait engine is invalid.');
  }
  if (input.sourceTarget && !['named_subject', 'ordinary_person_from_source_world'].includes(input.sourceTarget)) {
    throw new Error('Source target is invalid.');
  }
  if (input.samplingMode && !['explore', 'true-frequency'].includes(input.samplingMode)) {
    throw new Error('Sampling mode is invalid.');
  }

  const sanitized = sanitizeValue(input);
  if (sanitized.annotationRecord && !validateAnnotationRecord(sanitized.annotationRecord)) {
    const firstError = validateAnnotationRecord.errors?.[0];
    const location = firstError?.instancePath || 'record';
    throw new Error(`Annotation ${location} ${firstError?.message || 'is invalid'}.`);
  }
  const serialized = JSON.stringify(sanitized);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_REQUEST_BYTES) {
    const error = new Error('Share snapshot is too large.');
    error.statusCode = 413;
    throw error;
  }
  return sanitized;
};

const usesBlobStorage = () =>
  process.env.PERSONA_SHARE_STORAGE !== 'local' && Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );

const sharePathname = id => `persona-shares/v1/${id}.json`;

const saveStoredShare = async (id, storedShare) => {
  const serialized = JSON.stringify(storedShare);
  if (usesBlobStorage()) {
    await put(sharePathname(id), serialized, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 31_536_000,
    });
    return;
  }
  if (process.env.VERCEL && process.env.PERSONA_SHARE_STORAGE !== 'local') {
    const error = new Error('Persona sharing storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
  await mkdir(LOCAL_SHARE_DIRECTORY, { recursive: true });
  await writeFile(path.join(LOCAL_SHARE_DIRECTORY, `${id}.json`), serialized, {
    encoding: 'utf8',
    flag: 'wx',
  });
};

const loadStoredShare = async id => {
  if (usesBlobStorage()) {
    const result = await get(sharePathname(id), { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await new Response(result.stream).text());
  }
  if (process.env.VERCEL && process.env.PERSONA_SHARE_STORAGE !== 'local') {
    const error = new Error('Persona sharing storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
  try {
    return JSON.parse(await readFile(path.join(LOCAL_SHARE_DIRECTORY, `${id}.json`), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

const verifyStoredShare = (storedShare, requestedId) => {
  if (
    !storedShare ||
    typeof storedShare !== 'object' ||
    storedShare.id !== requestedId ||
    typeof storedShare.createdAt !== 'string' ||
    Number.isNaN(Date.parse(storedShare.createdAt)) ||
    !/^[a-f0-9]{64}$/.test(storedShare.checksum || '')
  ) {
    throw new Error('Stored persona share metadata is invalid.');
  }
  const snapshot = validateAndSanitizeSnapshot(storedShare.snapshot);
  const checksum = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  if (checksum !== storedShare.checksum) {
    throw new Error('Stored persona share checksum does not match.');
  }
  return {
    id: requestedId,
    createdAt: storedShare.createdAt,
    checksum,
    snapshot,
  };
};

const createShare = async (req, res) => {
  const rate = checkWriteRateLimit(req);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    jsonResponse(res, 429, { error: 'Too many share links created. Please try again later.' });
    return;
  }

  let snapshot;
  try {
    snapshot = validateAndSanitizeSnapshot(await readRequestBody(req));
  } catch (error) {
    if (error && typeof error === 'object' && !error.statusCode) error.statusCode = 400;
    throw error;
  }
  const id = randomBytes(16).toString('base64url');
  const createdAt = new Date().toISOString();
  const checksum = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  const storedShare = {
    id,
    createdAt,
    checksum,
    snapshot,
  };
  await saveStoredShare(id, storedShare);
  jsonResponse(res, 201, { id, createdAt });
};

const getShare = async (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const id = requestUrl.searchParams.get('id') || '';
  if (!SHARE_ID_PATTERN.test(id)) {
    jsonResponse(res, 400, { error: 'Share link is invalid.' });
    return;
  }
  const storedShare = await loadStoredShare(id);
  if (!storedShare) {
    jsonResponse(res, 404, { error: 'This shared persona could not be found.' });
    return;
  }
  const verifiedShare = verifyStoredShare(storedShare, id);
  jsonResponse(
    res,
    200,
    verifiedShare,
    'public, max-age=60, s-maxage=31536000, stale-while-revalidate=86400, immutable'
  );
};

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      await createShare(req, res);
      return;
    }
    if (req.method === 'GET') {
      await getShare(req, res);
      return;
    }
    res.setHeader('Allow', 'GET, POST');
    jsonResponse(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    const status = Number(error?.statusCode) || (error instanceof SyntaxError ? 400 : 500);
    if (status >= 500) console.error('Persona share failed:', error);
    jsonResponse(res, status, {
      error: status >= 500
        ? 'Persona sharing is temporarily unavailable.'
        : (error instanceof Error ? error.message : 'Invalid share request.'),
    });
  }
}
