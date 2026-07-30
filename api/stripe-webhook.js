import { createHmac, timingSafeEqual } from 'node:crypto';
import { grantSupporterCredits } from './_lib/aiAccess.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_WEBHOOK_BYTES = 256 * 1024;
const SIGNATURE_TOLERANCE_SECONDS = 300;

const jsonResponse = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
};

const readRawBody = async req => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_WEBHOOK_BYTES) {
      const error = new Error('Webhook payload is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
};

const secureHexEqual = (left, right) => {
  if (!/^[a-f0-9]{64}$/i.test(String(left)) || !/^[a-f0-9]{64}$/i.test(String(right))) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
};

export const verifyStripeSignature = (
  rawBody,
  signatureHeader,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000)
) => {
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  const parts = String(signatureHeader || '').split(',');
  const timestamp = Number(parts.find(part => part.startsWith('t='))?.slice(2));
  const signatures = parts
    .filter(part => part.startsWith('v1='))
    .map(part => part.slice(3));
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');
  return signatures.some(signature => secureHexEqual(expected, signature));
};

const paidCheckoutSession = event => {
  if (event?.type === 'checkout.session.completed') {
    return event.data?.object?.payment_status === 'paid' ? event.data.object : null;
  }
  if (event?.type === 'checkout.session.async_payment_succeeded') {
    return event.data?.object || null;
  }
  return null;
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      jsonResponse(res, 405, { error: 'Method not allowed.' });
      return;
    }

    const rawBody = await readRawBody(req);
    if (!verifyStripeSignature(
      rawBody,
      req.headers?.['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )) {
      jsonResponse(res, 400, { error: 'Invalid Stripe signature.' });
      return;
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const session = paidCheckoutSession(event);
    if (!session) {
      jsonResponse(res, 200, { received: true });
      return;
    }

    const expectedPaymentLink = process.env.STRIPE_AI_PAYMENT_LINK_ID;
    if (expectedPaymentLink && session.payment_link !== expectedPaymentLink) {
      jsonResponse(res, 200, { received: true, ignored: 'unrelated_payment_link' });
      return;
    }

    const result = await grantSupporterCredits(session.client_reference_id, session.id);
    jsonResponse(res, 200, { received: true, granted: result.granted });
  } catch (error) {
    const status = Number(error?.statusCode) || (error instanceof SyntaxError ? 400 : 500);
    if (status >= 500) console.error('Stripe supporter webhook failed:', error);
    jsonResponse(res, status, {
      error: status >= 500
        ? 'Supporter access could not be updated.'
        : (error instanceof Error ? error.message : 'Invalid webhook request.'),
    });
  }
}
