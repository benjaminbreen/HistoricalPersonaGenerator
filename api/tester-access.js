import {
  ensureVisitorId,
  grantTesterAccessCookie,
  loadAiAccessRecord,
  publicAiAccessStatus,
} from './_lib/aiAccess.js';

const jsonResponse = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
};

const requestBody = async req => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4096) throw new Error('Tester access request is too large.');
  }
  return raw ? JSON.parse(raw) : {};
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      jsonResponse(res, 405, { error: 'Method not allowed.' });
      return;
    }
    const body = await requestBody(req);
    grantTesterAccessCookie(req, res, body?.token);
    const visitorId = ensureVisitorId(req, res);
    const record = await loadAiAccessRecord(visitorId);
    jsonResponse(res, 200, publicAiAccessStatus(record, Date.now(), true));
  } catch (error) {
    const status = Number(error?.statusCode) || (error instanceof SyntaxError ? 400 : 500);
    if (status >= 500) console.error('Tester access exchange failed:', error);
    jsonResponse(res, status, {
      error: status >= 500
        ? 'Tester access is temporarily unavailable.'
        : (error instanceof Error ? error.message : 'Tester access request failed.'),
    });
  }
}
