import {
  ensureVisitorId,
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

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      jsonResponse(res, 405, { error: 'Method not allowed.' });
      return;
    }
    const visitorId = ensureVisitorId(req, res);
    const record = await loadAiAccessRecord(visitorId);
    const access = publicAiAccessStatus(record);
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    if (requestUrl.searchParams.get('checkout') === '1') {
      res.statusCode = 302;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Location', access.donateUrl);
      res.end();
      return;
    }
    jsonResponse(res, 200, access);
  } catch (error) {
    const status = Number(error?.statusCode) || 500;
    if (status >= 500) console.error('AI access lookup failed:', error);
    jsonResponse(res, status, {
      error: status >= 500
        ? 'AI access is temporarily unavailable.'
        : (error instanceof Error ? error.message : 'Invalid AI access request.'),
    });
  }
}
