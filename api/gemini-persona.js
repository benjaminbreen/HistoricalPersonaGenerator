import fs from 'node:fs';
import path from 'node:path';
import { parseJsonObject } from './_lib/llmJson.js';
import { checkRateLimit, clientIpFromRequest, rateLimitMessage } from './_lib/rateLimit.js';
import { consumeAiCredit, ensureVisitorId } from './_lib/aiAccess.js';
import { buildAnnotationPrompt, buildOrientationModelSchema, buildSketchPrompt, buildSourcePersonaModelSchema, buildSourcePersonaPrompt } from './_lib/personaPrompts.js';
import { callModel } from './_lib/llm.js';

const schemaPath = path.join(process.cwd(), 'src/schemas/personaOrientation.schema.json');
const orientationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const orientationModelSchema = buildOrientationModelSchema(orientationSchema);
const sourcePersonaModelSchema = buildSourcePersonaModelSchema(orientationSchema);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    if (body.action === 'generate_annotation' || body.action === 'generate_sketch' || body.action === 'generate_source_persona') {
      const billedAction = body.action === 'generate_source_persona' ? 'generate_sketch' : body.action;
      const verdict = checkRateLimit(clientIpFromRequest(req), billedAction);
      if (!verdict.allowed) {
        res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
        res.status(429).json({ error: rateLimitMessage(verdict.scope), retryAfterSeconds: verdict.retryAfterSeconds });
        return;
      }
      const visitorId = ensureVisitorId(req, res);
      const accessVerdict = await consumeAiCredit(visitorId, billedAction);
      if (!accessVerdict.allowed) {
        res.status(402).json({
          code: 'AI_SUPPORT_REQUIRED',
          error: billedAction === 'generate_annotation'
            ? 'You have used all three free persona-record generations. A donation unlocks 50 credits for 30 days.'
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
      res.status(200).json({ record, sketch: record.day_in_life || '', usage, transparency });
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
      res.status(200).json({ record: parseJsonObject(text), usage, transparency });
      return;
    }

    if (body.action === 'generate_sketch') {
      const { text, usage, transparency } = await callModel({
        variant: body.model,
        action: 'generate_sketch',
        prompt: buildSketchPrompt(body.record),
      });
      res.status(200).json({ sketch: text, usage, transparency });
      return;
    }

    res.status(400).json({ error: 'Unknown Gemini persona action.' });
  } catch (error) {
    console.error('Persona generation failed:', error);
    // The credit gate runs before the model and throws 503s of its own; a flat
    // 500 here made a missing env var look like a model outage.
    res.status(Number(error?.statusCode) || 500).json({
      error: error?.code ? error.message : 'Persona generation is temporarily unavailable. Please try again.',
    });
  }
}
