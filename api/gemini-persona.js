import fs from 'node:fs';
import path from 'node:path';
import { parseJsonObject } from './_lib/llmJson.js';
import { checkRateLimit, clientIpFromRequest, rateLimitMessage } from './_lib/rateLimit.js';
import { consumeAiCredit, ensureVisitorId } from './_lib/aiAccess.js';
import {
  ANNOTATION_TEMPERATURE,
  SKETCH_TEMPERATURE,
  buildAnnotationPrompt,
  buildSketchPrompt,
} from './_lib/personaPrompts.js';

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_OPENAI_MODEL = 'gpt-5-nano';
const schemaPath = path.join(process.cwd(), 'src/schemas/historicalPersonaAnnotation.schema.json');
const annotationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const geminiText = async (prompt, options = {}) => {
  // VITE_* variables are compiled into the browser bundle; never read secrets from them.
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY in Vercel environment variables.');
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
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
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ''}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map(part => part.text).join('\n') || '';
};

const openaiText = async (prompt, options = {}) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY.');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      input: prompt,
      ...(options.json ? { text: { format: { type: 'json_object' } } } : {}),
    }),
  });
  if (!response.ok) throw new Error(`OpenAI returned ${response.status}.`);
  const data = await response.json();
  return data?.output_text || '';
};

const llmText = (prompt, options) => {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'openai') return openaiText(prompt, options);
  if (provider === 'gemini') return geminiText(prompt, options);
  throw new Error('Unsupported LLM_PROVIDER.');
};

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
      const text = await llmText(buildAnnotationPrompt(body.source, body.options, annotationSchema), { json: true, temperature: ANNOTATION_TEMPERATURE });
      res.status(200).json({ record: parseJsonObject(text) });
      return;
    }

    if (body.action === 'generate_sketch') {
      const sketch = await llmText(buildSketchPrompt(body.record), { temperature: SKETCH_TEMPERATURE });
      res.status(200).json({ sketch });
      return;
    }

    res.status(400).json({ error: 'Unknown Gemini persona action.' });
  } catch (error) {
    console.error('Persona generation failed:', error);
    res.status(500).json({ error: 'Persona generation is temporarily unavailable. Please try again.' });
  }
}
