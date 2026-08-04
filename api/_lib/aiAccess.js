import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { ACTION_COST } from './rateLimit.js';

export const FREE_BIOGRAPHY_RUNS = 5;
export const FREE_SCHEMA_RUNS = 3;
export const SUPPORTER_CREDITS_PER_DONATION = 50;
export const SUPPORTER_ACCESS_DAYS = 30;

const COOKIE_NAME = 'hpg_ai_visitor';
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_ACCESS_DIRECTORY = path.join(process.cwd(), '.ai-access');
const DEFAULT_DONATION_URL = 'https://buy.stripe.com/eVqfZhaprgRG7ab1aV4F200';
const DAY_MS = 24 * 60 * 60 * 1000;

const usesBlobStorage = () =>
  process.env.AI_ACCESS_STORAGE !== 'local' && Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );

const signingSecret = () => {
  const secret =
    process.env.AI_ACCESS_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;
  if (secret) return secret;
  if (!process.env.VERCEL) return 'historical-persona-generator-local-development';
  const error = new Error('AI access signing is not configured.');
  error.statusCode = 503;
  throw error;
};

const signatureFor = id =>
  createHmac('sha256', signingSecret()).update(id).digest('base64url');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const cookiesFromRequest = req => {
  const result = {};
  for (const pair of String(req.headers?.cookie || '').split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 1) continue;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
};

const verifiedCookieId = req => {
  const value = cookiesFromRequest(req)[COOKIE_NAME] || '';
  const separator = value.indexOf('.');
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  return VISITOR_ID_PATTERN.test(id) && safeEqual(signatureFor(id), signature) ? id : null;
};

const appendSetCookie = (res, cookie) => {
  const existing = res.getHeader?.('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
  } else {
    res.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, cookie] : [existing, cookie]);
  }
};

export const ensureVisitorId = (req, res) => {
  const existing = verifiedCookieId(req);
  if (existing) return existing;
  const id = randomUUID();
  const secure = process.env.VERCEL || String(req.headers?.['x-forwarded-proto'] || '').includes('https');
  appendSetCookie(
    res,
    `${COOKIE_NAME}=${encodeURIComponent(`${id}.${signatureFor(id)}`)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
  );
  return id;
};

export const isValidVisitorId = id => VISITOR_ID_PATTERN.test(String(id || ''));

const recordPathname = id => `ai-access/v1/${id}.json`;

const emptyRecord = id => ({
  schemaVersion: 1,
  id,
  freeBiographyRunsUsed: 0,
  freeSchemaRunsUsed: 0,
  supporterCredits: 0,
  supporterExpiresAt: null,
  processedStripeSessions: [],
  updatedAt: new Date(0).toISOString(),
});

const normalizeRecord = (value, id) => {
  if (!value || typeof value !== 'object' || value.id !== id) return emptyRecord(id);
  return {
    schemaVersion: 1,
    id,
    freeBiographyRunsUsed: Math.max(0, Math.min(
      FREE_BIOGRAPHY_RUNS,
      Math.floor(Number(value.freeBiographyRunsUsed) || 0)
    )),
    freeSchemaRunsUsed: Math.max(0, Math.min(
      FREE_SCHEMA_RUNS,
      Math.floor(Number(value.freeSchemaRunsUsed) || 0)
    )),
    supporterCredits: Math.max(0, Math.floor(Number(value.supporterCredits) || 0)),
    supporterExpiresAt:
      typeof value.supporterExpiresAt === 'string' && !Number.isNaN(Date.parse(value.supporterExpiresAt))
        ? value.supporterExpiresAt
        : null,
    processedStripeSessions: Array.isArray(value.processedStripeSessions)
      ? value.processedStripeSessions.filter(item => typeof item === 'string').slice(-30)
      : [],
    updatedAt:
      typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt))
        ? value.updatedAt
        : new Date(0).toISOString(),
  };
};

export const loadAiAccessRecord = async id => {
  if (!isValidVisitorId(id)) return null;
  if (usesBlobStorage()) {
    const result = await get(recordPathname(id), { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return emptyRecord(id);
    const record = normalizeRecord(JSON.parse(await new Response(result.stream).text()), id);
    Object.defineProperty(record, '_etag', {
      configurable: true,
      enumerable: false,
      value: result.blob.etag,
      writable: true,
    });
    return record;
  }
  if (process.env.VERCEL && process.env.AI_ACCESS_STORAGE !== 'local') {
    const error = new Error('AI access storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
  try {
    return normalizeRecord(
      JSON.parse(await readFile(path.join(LOCAL_ACCESS_DIRECTORY, `${id}.json`), 'utf8')),
      id
    );
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyRecord(id);
    throw error;
  }
};

export const saveAiAccessRecord = async record => {
  const normalized = normalizeRecord(
    { ...record, updatedAt: new Date().toISOString() },
    record.id
  );
  const serialized = JSON.stringify(normalized);
  if (usesBlobStorage()) {
    await put(recordPathname(normalized.id), serialized, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: Boolean(record._etag),
      ...(record._etag ? { ifMatch: record._etag } : {}),
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 60,
    });
    return normalized;
  }
  if (process.env.VERCEL && process.env.AI_ACCESS_STORAGE !== 'local') {
    const error = new Error('AI access storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
  await mkdir(LOCAL_ACCESS_DIRECTORY, { recursive: true });
  await writeFile(
    path.join(LOCAL_ACCESS_DIRECTORY, `${normalized.id}.json`),
    serialized,
    'utf8'
  );
  return normalized;
};

const supporterIsActive = (record, now) =>
  Boolean(record.supporterExpiresAt) &&
  Date.parse(record.supporterExpiresAt) > now &&
  record.supporterCredits > 0;

export const donationUrlFor = id => {
  const url = new URL(process.env.STRIPE_DONATION_URL || DEFAULT_DONATION_URL);
  url.searchParams.set('client_reference_id', id);
  return url.toString();
};

export const publicAiAccessStatus = (record, now = Date.now()) => {
  const supporterActive = supporterIsActive(record, now);
  const freeBiographyRunsRemaining = Math.max(0, FREE_BIOGRAPHY_RUNS - record.freeBiographyRunsUsed);
  const freeSchemaRunsRemaining = Math.max(0, FREE_SCHEMA_RUNS - record.freeSchemaRunsUsed);
  const supporterCredits = supporterActive ? record.supporterCredits : 0;
  return {
    freeBiographyRunsUsed: record.freeBiographyRunsUsed,
    freeBiographyRunsRemaining,
    freeSchemaRunsUsed: record.freeSchemaRunsUsed,
    freeSchemaRunsRemaining,
    supporterActive,
    supporterCredits,
    supporterExpiresAt: supporterActive ? record.supporterExpiresAt : null,
    canUseBiography: supporterCredits >= ACTION_COST.generate_sketch || freeBiographyRunsRemaining > 0,
    canUseSchema: supporterCredits >= ACTION_COST.generate_annotation || freeSchemaRunsRemaining > 0,
    biographyCreditCost: ACTION_COST.generate_sketch,
    schemaCreditCost: ACTION_COST.generate_annotation,
    supporterCreditGrant: SUPPORTER_CREDITS_PER_DONATION,
    supporterAccessDays: SUPPORTER_ACCESS_DAYS,
    donateUrl: donationUrlFor(record.id),
  };
};

const isConcurrentWrite = error =>
  error instanceof BlobPreconditionFailedError ||
  /already exists|precondition|etag/i.test(String(error?.message || ''));

const mutateAiAccessRecord = async (id, mutate) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const record = await loadAiAccessRecord(id);
    if (!record) throw new Error('AI visitor identity is invalid.');
    const result = mutate(record);
    if (!result.save) return { ...result, record };
    try {
      const saved = await saveAiAccessRecord(record);
      return { ...result, record: saved };
    } catch (error) {
      if (!isConcurrentWrite(error) || attempt === 3) throw error;
    }
  }
  throw new Error('AI access record could not be updated.');
};

/**
 * Charge a model request before it is sent. Supporter credits are used while
 * active; otherwise biographies and schema records use their separate free
 * allowances.
 */
export const consumeAiCredit = async (id, action, now = Date.now()) => {
  const cost = ACTION_COST[action];
  if (!cost) throw new Error('Unknown AI action.');
  const result = await mutateAiAccessRecord(id, record => {
    if (supporterIsActive(record, now) && record.supporterCredits >= cost) {
      record.supporterCredits -= cost;
      return { allowed: true, save: true };
    }
    if (action === 'generate_sketch' && record.freeBiographyRunsUsed < FREE_BIOGRAPHY_RUNS) {
      record.freeBiographyRunsUsed += 1;
      return { allowed: true, save: true };
    }
    if (action === 'generate_annotation' && record.freeSchemaRunsUsed < FREE_SCHEMA_RUNS) {
      record.freeSchemaRunsUsed += 1;
      return { allowed: true, save: true };
    }
    return { allowed: false, save: false };
  });
  return {
    allowed: result.allowed,
    access: publicAiAccessStatus(result.record, now),
  };
};

export const grantSupporterCredits = async (
  id,
  stripeSessionId,
  now = Date.now()
) => {
  if (!isValidVisitorId(id)) throw new Error('Stripe session has an invalid client reference.');
  if (!stripeSessionId || typeof stripeSessionId !== 'string') {
    throw new Error('Stripe session ID is missing.');
  }
  const result = await mutateAiAccessRecord(id, record => {
    if (record.processedStripeSessions.includes(stripeSessionId)) {
      return { granted: false, save: false };
    }
    const currentExpiry = supporterIsActive(record, now)
      ? Date.parse(record.supporterExpiresAt)
      : now;
    record.supporterCredits += SUPPORTER_CREDITS_PER_DONATION;
    record.supporterExpiresAt = new Date(currentExpiry + SUPPORTER_ACCESS_DAYS * DAY_MS).toISOString();
    record.processedStripeSessions.push(stripeSessionId);
    record.processedStripeSessions = record.processedStripeSessions.slice(-30);
    return { granted: true, save: true };
  });
  return { granted: result.granted, record: result.record };
};
