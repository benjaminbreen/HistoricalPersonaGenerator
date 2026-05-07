import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite-preview'

const readRequestBody = async (req: any): Promise<any> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const stripCodeFence = (text: string): string => {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : trimmed
}

const parseJsonObject = (text: string): unknown => {
  const stripped = stripCodeFence(text)
  try {
    return JSON.parse(stripped)
  } catch {
    const firstBrace = stripped.indexOf('{')
    const lastBrace = stripped.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(stripped.slice(firstBrace, lastBrace + 1))
    }
    throw new Error('Gemini did not return parseable JSON.')
  }
}

const geminiText = async (prompt: string, env: Record<string, string>, options: { json?: boolean; temperature?: number } = {}): Promise<string> => {
  const key = env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY || env.VITE_GEMINI_API_KEY || env.VITE_GOOGLE_AI_API_KEY
  if (!key) {
    throw new Error('Missing Gemini API key. Add GEMINI_API_KEY to .env.local and restart the dev server.')
  }

  const model = env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
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
  })

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}. Check the API key, model name, and quota.`)
  }

  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join('\n') || ''
}

const buildAnnotationPrompt = (source: any, options: any, annotationSchema: unknown): string => {
  const targetInstruction = options?.target === 'named_subject'
    ? `Generate the persona record for the named subject of the source if the source clearly has one. For a Wikipedia biography, this means the article subject. Use a historically situated moment during that person's life, not a posthumous summary.`
    : `Generate a plausible ordinary person from the source world, not the famous subject unless the source itself is ordinary-person evidence.`

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
      title: source.title,
      url: source.url,
      citation_label: source.citationLabel,
      source_basis: source.sourceBasis,
      extraction_method: source.extractionMethod,
      reliability_notes: source.reliabilityNotes,
    }),
    '',
    'Source text:',
    String(source.text || '').slice(0, 30000),
  ].filter(Boolean).join('\n')
}

const buildSketchPrompt = (record: unknown): string => [
  'Write a historically grounded persona sketch from this annotation record.',
  'Use 4-6 compact paragraphs.',
  'Do not write a generic encyclopedia biography. Write a vivid but sober character sheet sketch anchored to the selected year, social position, work, household economy, material life, concerns, and worldview.',
  'Distinguish direct evidence from plausible inference in natural prose without footnotes.',
  'Avoid modern hindsight and anachronistic vocabulary.',
  'Return plain text only.',
  JSON.stringify(record),
].join('\n\n')

const geminiPersonaApiPlugin = (env: Record<string, string>) => {
  const schemaPath = path.resolve(process.cwd(), 'src/schemas/historicalPersonaAnnotation.schema.json')
  const annotationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

  return {
    name: 'gemini-persona-api',
    configureServer(server: any) {
      server.middlewares.use('/api/gemini-persona', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const body = await readRequestBody(req)
          if (body.action === 'generate_annotation') {
            const text = await geminiText(buildAnnotationPrompt(body.source, body.options, annotationSchema), env, { json: true, temperature: 0.35 })
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ record: parseJsonObject(text) }))
            return
          }

          if (body.action === 'generate_sketch') {
            const sketch = await geminiText(buildSketchPrompt(body.record), env, { temperature: 0.45 })
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ sketch: sketch.trim() }))
            return
          }

          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Unknown Gemini action.' }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Gemini route failed.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), geminiPersonaApiPlugin(env)],
    server: {
      port: 3001,
    },
    esbuild: {
      // Allow duplicate object keys (last one wins) - these are present in data files
      logOverride: { 'duplicate-object-key': 'silent' },
    },
  }
})
