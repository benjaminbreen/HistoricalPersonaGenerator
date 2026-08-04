import fs from 'node:fs';
import path from 'node:path';
import { parseJsonObject } from './_lib/llmJson.js';
import { checkRateLimit, clientIpFromRequest, rateLimitMessage } from './_lib/rateLimit.js';
import { consumeAiCredit, ensureVisitorId } from './_lib/aiAccess.js';
import { buildAnnotationPrompt, buildSketchPrompt } from './_lib/personaPrompts.js';
import { callModel, TRUNCATED_CODE } from './_lib/llm.js';

const schemaPath = path.join(process.cwd(), 'src/schemas/historicalPersonaAnnotation.schema.json');
const annotationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    if (body.action === 'generate_annotation' || body.action === 'generate_sketch') {
      const verdict = checkRateLimit(clientIpFromRequest(req), body.action);
      if (!verdict.allowed) {
        res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
        res.status(429).json({ error: rateLimitMessage(verdict.scope), retryAfterSeconds: verdict.retryAfterSeconds });
        return;
      }
      const visitorId = ensureVisitorId(req, res);
      const accessVerdict = await consumeAiCredit(visitorId, body.action);
      if (!accessVerdict.allowed) {
        res.status(402).json({
          code: 'AI_SUPPORT_REQUIRED',
          error: body.action === 'generate_annotation'
            ? 'The full schema record costs six supporter credits.'
            : 'You have used all five free AI biographies. A donation unlocks 50 credits for 30 days.',
          access: accessVerdict.access,
        });
        return;
      }
    }

    if (body.action === 'generate_annotation') {
      const { text, usage } = await callModel({
        variant: body.model,
        action: 'generate_annotation',
        prompt: buildAnnotationPrompt(body.source, body.options, annotationSchema),
        json: true,
      });
      res.status(200).json({ record: parseJsonObject(text), usage });
      return;
    }

    if (body.action === 'generate_sketch') {
      const { text, usage } = await callModel({
        variant: body.model,
        action: 'generate_sketch',
        prompt: buildSketchPrompt(body.record),
      });
      res.status(200).json({ sketch: text, usage });
      return;
    }

    res.status(400).json({ error: 'Unknown Gemini persona action.' });
  } catch (error) {
    console.error('Persona generation failed:', error);
    if (error?.code === TRUNCATED_CODE) {
      res.status(502).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Persona generation is temporarily unavailable. Please try again.' });
  }
}
