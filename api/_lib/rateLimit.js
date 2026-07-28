// Abuse and spend ceiling for the LLM persona routes.
//
// The route is public and unauthenticated, so the only thing standing between a
// scripted loop and a large API bill is this file. Limits are cost-weighted:
// a schema record costs roughly six times a biography, so it draws six times as
// much from the same budget.
//
// State is in-process. On Vercel that means the limit is per warm instance
// rather than global, which bounds a single attacker but not a distributed one;
// move the counters to KV/Upstash if this ever needs to hold across instances.
// The global daily budget below is the backstop that actually caps the bill.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const ACTION_COST = {
  generate_annotation: 6,
  generate_sketch: 1,
};

const numberFromEnv = (name, fallback) => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

const limits = () => ({
  hourlyPerIp: numberFromEnv('LLM_HOURLY_COST_PER_IP', 30),
  dailyPerIp: numberFromEnv('LLM_DAILY_COST_PER_IP', 120),
  dailyGlobal: numberFromEnv('LLM_DAILY_COST_GLOBAL', 3000),
});

const buckets = new Map();
const global = { resetAt: 0, cost: 0 };

const roll = (bucket, windowMs, now) => {
  if (!bucket.resetAt || now >= bucket.resetAt) {
    bucket.resetAt = now + windowMs;
    bucket.cost = 0;
  }
  return bucket;
};

/** Drop idle callers so a long-lived process does not grow a bucket per IP seen. */
const prune = now => {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets) {
    if (now >= entry.day.resetAt) buckets.delete(key);
  }
};

export const clientIpFromRequest = req => {
  const header = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || '';
  const first = String(header).split(',')[0].trim();
  return first || req?.socket?.remoteAddress || 'unknown';
};

/**
 * Charge one request against the IP and global budgets.
 * Returns { allowed } or { allowed: false, scope, retryAfterSeconds }.
 */
export const checkRateLimit = (ip, action, now = Date.now()) => {
  const cost = ACTION_COST[action] ?? 1;
  const { hourlyPerIp, dailyPerIp, dailyGlobal } = limits();

  roll(global, DAY_MS, now);
  if (global.cost + cost > dailyGlobal) {
    return { allowed: false, scope: 'global_daily', retryAfterSeconds: Math.ceil((global.resetAt - now) / 1000) };
  }

  prune(now);
  const entry = buckets.get(ip) || { hour: { resetAt: 0, cost: 0 }, day: { resetAt: 0, cost: 0 } };
  roll(entry.hour, HOUR_MS, now);
  roll(entry.day, DAY_MS, now);

  if (entry.hour.cost + cost > hourlyPerIp) {
    buckets.set(ip, entry);
    return { allowed: false, scope: 'ip_hourly', retryAfterSeconds: Math.ceil((entry.hour.resetAt - now) / 1000) };
  }
  if (entry.day.cost + cost > dailyPerIp) {
    buckets.set(ip, entry);
    return { allowed: false, scope: 'ip_daily', retryAfterSeconds: Math.ceil((entry.day.resetAt - now) / 1000) };
  }

  entry.hour.cost += cost;
  entry.day.cost += cost;
  global.cost += cost;
  buckets.set(ip, entry);
  return { allowed: true };
};

export const rateLimitMessage = scope => (
  scope === 'global_daily'
    ? 'This free tool has reached its daily AI budget. Procedural personas still work, and AI generation returns tomorrow.'
    : 'You have used this session\'s share of AI generation. Procedural personas still work; please try AI again a little later.'
);

/** Test seam: clears every counter. */
export const resetRateLimitState = () => {
  buckets.clear();
  global.resetAt = 0;
  global.cost = 0;
};
