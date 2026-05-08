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
    '- For work.workplace, use only schema enum values: household, field, workshop, shop, street, dock, office, kitchen, ship, barracks, court, religious_house, factory, mixed.',
    '- For persona_seed.place.residence_locale and activity_locale, use only schema enum values. If unsure, use urban_neighborhood for residence_locale and mixed_or_itinerant for activity_locale.',
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

const OLD_BAILEY_API = 'https://www.dhi.ac.uk/api/data/oldbailey_record'
const OLD_BAILEY_SINGLE_API = 'https://www.dhi.ac.uk/api/data/oldbailey_record_single'
const EN_WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php'

const oldBaileyCrimeTerms: Record<string, string> = {
  theft: 'stealing',
  violent_theft: 'highway robbery',
  deception: 'forgery',
  killing: 'murder',
  sexual: 'rape',
  royal: 'treason',
  damage: 'damage',
  miscellaneous: 'misdemeanour',
}

const oldBaileyGenderTerms: Record<string, string> = {
  female: 'woman',
  male: 'man',
}

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

const oldBaileyDateFromTitle = (title = ''): Date | null => {
  const match = title.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/)
  if (!match) return null
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]} 00:00:00 UTC`)
  return Number.isNaN(date.getTime()) ? null : date
}

const oldBaileyHitDate = (hit: any): Date | null => oldBaileyDateFromTitle(hit?._source?.title)

const fetchOldBaileyPage = async (params: { text?: string; from?: number }) => {
  const query = new URLSearchParams()
  if (params.text) query.set('text', params.text)
  if (params.from) query.set('from', String(Math.max(0, params.from)))
  const response = await fetch(`${OLD_BAILEY_API}?${query.toString()}`)
  if (!response.ok) throw new Error(`Old Bailey API returned ${response.status}`)
  return response.json()
}

const fetchOldBaileySingle = async (idkey: string) => {
  const query = new URLSearchParams({ idkey })
  const response = await fetch(`${OLD_BAILEY_SINGLE_API}?${query.toString()}`)
  if (!response.ok) throw new Error(`Old Bailey single-record API returned ${response.status}`)
  const page = await response.json()
  return page?.hits?.hits?.[0] || null
}

const oldBaileySessionKeysForDecade = async (decade: number): Promise<string[]> => {
  const keys = new Set<string>()
  for (let year = decade; year < decade + 10; year++) {
    const page = await fetchOldBaileyPage({ text: String(year), from: 0 })
    for (const hit of page?.hits?.hits || []) {
      const date = oldBaileyHitDate(hit)
      if (!date || date.getUTCFullYear() !== year) continue
      const yyyy = String(date.getUTCFullYear())
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(date.getUTCDate()).padStart(2, '0')
      keys.add(`${yyyy}${mm}${dd}`)
    }
  }
  return Array.from(keys)
}

const buildOldBaileyTextQuery = (filters: URLSearchParams): string => {
  const terms = [
    oldBaileyGenderTerms[filters.get('gender') || ''],
    oldBaileyCrimeTerms[filters.get('crime') || ''],
  ].filter(Boolean)
  return terms.join(' ')
}

const oldBaileyTrialMatches = (hit: any, filters: URLSearchParams, startDate?: Date, endDate?: Date): boolean => {
  const source = hit?._source || {}
  const id = source.idkey || ''
  if (!id.startsWith('t')) return false

  const date = oldBaileyHitDate(hit)
  if (startDate && (!date || date < startDate)) return false
  if (endDate && (!date || date >= endDate)) return false

  const text = `${source.title || ''} ${source.text || ''}`.toLowerCase()
  const gender = filters.get('gender')
  if (gender === 'female' && !/\b(woman|female|she|her|spinster|wife|widow|elizabeth|mary|ann|anne|sarah|margaret|jane)\b/.test(text)) return false
  if (gender === 'male' && !/\b(man|male|he|his|husband|john|william|thomas|james|george|henry)\b/.test(text)) return false
  const crime = filters.get('crime')
  if (crime === 'theft' && !/(theft|steal|stole|stealing|shoplifting|burglary|larceny)/.test(text)) return false
  if (crime === 'violent_theft' && !/(violent theft|robbery|highway robbery|highway|assault)/.test(text)) return false
  if (crime === 'deception' && !/(deception|forgery|fraud|perjury|counterfeit)/.test(text)) return false
  if (crime === 'killing' && !/(killing|murder|manslaughter|infanticide)/.test(text)) return false
  if (crime === 'sexual' && !/(sexual offences|rape|bigamy|assault with intent)/.test(text)) return false
  if (crime === 'royal' && !/(royal offences|treason|coining|seditious|tax)/.test(text)) return false
  if (crime === 'damage' && !/(damage|arson|riot|breaking peace)/.test(text)) return false
  if (crime === 'miscellaneous' && !/(miscellaneous|vagrancy|conspiracy|libel|kidnapping)/.test(text)) return false

  return true
}

const oldBaileySourceFromHit = (hit: any, filters: URLSearchParams) => {
  const source = hit._source || {}
  const title = source.title || `Old Bailey trial ${source.idkey}`
  const idkey = source.idkey
  const date = oldBaileyHitDate(hit)
  const imageUrl = Array.isArray(source.images) ? source.images[0] : undefined
  const text = normalizeWhitespace([
    title,
    `Trial reference: ${idkey}.`,
    date ? `Trial/session date: ${date.toISOString().slice(0, 10)}.` : '',
    filters.get('personaAngle') === 'ordinary_person_from_source_world'
      ? 'Persona angle requested: ordinary person from the world of this trial, not necessarily the defendant.'
      : 'Persona angle requested: named person directly connected to the trial where possible.',
    source.text || '',
  ].filter(Boolean).join('\n\n'))

  return {
    title,
    text: text.slice(0, 30000),
    url: `https://www.dhi.ac.uk/data/oldbailey/record/${idkey}`,
    imageUrl,
    imageAttribution: imageUrl ? `Old Bailey Proceedings page image for ${idkey}` : undefined,
    sourceBasis: 'court_testimony',
    extractionMethod: 'structured_api',
    citationLabel: `Old Bailey Proceedings: ${idkey}`,
    reliabilityNotes: 'Old Bailey trial account from the DHI API. Treat as institutional/legal testimony with reporting, transcription, and courtroom bias.',
  }
}

const handleOldBaileyRoute = async (req: any, res: any) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    const filters = url.searchParams
    const text = buildOldBaileyTextQuery(filters)
    const decade = filters.get('decade')
    const decadeNumber = decade && /^\d{4}$/.test(decade) ? Number(decade) : undefined
    const startDate = decadeNumber ? new Date(`${decadeNumber}-01-01T00:00:00Z`) : undefined
    const endDate = decadeNumber ? new Date(`${decadeNumber + 10}-01-01T00:00:00Z`) : undefined

    if (decadeNumber) {
      if (decadeNumber < 1670 || decadeNumber > 1830) {
        throw new Error('Decade filters currently support Old Bailey sessions from the 1670s through the 1830s.')
      }
      const sessionKeys = await oldBaileySessionKeysForDecade(decadeNumber)
      if (!sessionKeys.length) throw new Error('No Old Bailey sessions found for that decade.')

      for (let attempt = 0; attempt < 80; attempt++) {
        const sessionKey = sessionKeys[Math.floor(Math.random() * sessionKeys.length)]
        const trialNumber = 1 + Math.floor(Math.random() * 160)
        const hit = await fetchOldBaileySingle(`t${sessionKey}-${trialNumber}`)
        if (hit && oldBaileyTrialMatches(hit, filters, startDate, endDate)) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(oldBaileySourceFromHit(hit, filters)))
          return
        }
      }

      throw new Error('Found Old Bailey sessions for that decade, but no trial matched the selected filters. Try broader filters.')
    }

    const firstPage = await fetchOldBaileyPage({ text, from: 0 })
    const total = Number(firstPage?.hits?.total || 0)
    if (!total) throw new Error('No Old Bailey records matched those filters.')

    const startOffset = 0
    const endOffset = Math.min(total, 9990)

    const searchWindow = Math.max(1, endOffset - startOffset)
    for (let attempt = 0; attempt < 12; attempt++) {
      const randomOffset = startOffset + Math.floor(Math.random() * searchWindow)
      const page = await fetchOldBaileyPage({ text, from: randomOffset })
      const hit = (page?.hits?.hits || []).find((candidate: any) => oldBaileyTrialMatches(candidate, filters, startDate, endDate))
      if (hit) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(oldBaileySourceFromHit(hit, filters)))
        return
      }
    }

    throw new Error('Found Old Bailey results, but none survived the trial/date/person filters. Try broader filters.')
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Old Bailey lookup failed.' }))
  }
}

const firstClaim = (entity: any, property: string) => entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value
const entityClaimIds = (entity: any, property: string): string[] =>
  (entity?.claims?.[property] || [])
    .map((claim: any) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)

const yearFromWikidataTime = (value: any): number | undefined => {
  const time = value?.time
  if (typeof time !== 'string') return undefined
  const match = time.match(/^([+-])(\d{1,6})/)
  if (!match) return undefined
  const year = Number(match[2])
  return match[1] === '-' ? -year : year
}

const wikiArticleUrlFromTitle = (title: string): string =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

const fetchRandomWikipediaPages = async () => {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'random',
    grnnamespace: '0',
    grnlimit: '50',
    prop: 'pageprops|info',
    inprop: 'url',
    origin: '*',
  })
  const response = await fetch(`${EN_WIKIPEDIA_API}?${query.toString()}`)
  if (!response.ok) throw new Error(`Wikipedia random API returned ${response.status}`)
  const data = await response.json()
  return Object.values(data?.query?.pages || {}) as any[]
}

const fetchWikidataEntities = async (ids: string[]) => {
  const query = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    props: 'claims|sitelinks|descriptions|labels',
    languages: 'en',
    ids: ids.join('|'),
    origin: '*',
  })
  const response = await fetch(`${WIKIDATA_API}?${query.toString()}`)
  if (!response.ok) throw new Error(`Wikidata entities API returned ${response.status}`)
  const data = await response.json()
  return data?.entities || {}
}

const wikidataPersonCandidate = (page: any, entity: any) => {
  if (!entity || entity.missing) return null
  if (!entityClaimIds(entity, 'P31').includes('Q5')) return null
  const birthYear = yearFromWikidataTime(firstClaim(entity, 'P569'))
  const deathYear = yearFromWikidataTime(firstClaim(entity, 'P570'))
  if (birthYear === undefined || birthYear < 1300 || birthYear > 1930) return null
  if (deathYear !== undefined && deathYear < 1300) return null
  if (deathYear === undefined && birthYear > 1880) return null
  const enwikiTitle = entity?.sitelinks?.enwiki?.title || page.title
  if (!enwikiTitle) return null
  const sitelinkCount = Object.keys(entity?.sitelinks || {}).length
  const pageLength = Number(page.length || 0)
  if (sitelinkCount < 2 && pageLength < 2500) return null
  return {
    qid: entity.id,
    label: entity?.labels?.en?.value || enwikiTitle,
    description: entity?.descriptions?.en?.value,
    birthYear,
    deathYear,
    wikipediaTitle: enwikiTitle,
    wikipediaUrl: page.fullurl || wikiArticleUrlFromTitle(enwikiTitle),
  }
}

const handleRandomWikidataPersonRoute = async (_req: any, res: any) => {
  try {
    for (let attempt = 0; attempt < 12; attempt++) {
      const pages = await fetchRandomWikipediaPages()
      const ids = Array.from(new Set(pages.map(page => page?.pageprops?.wikibase_item).filter(Boolean)))
      if (!ids.length) continue
      const entities = await fetchWikidataEntities(ids)
      const candidates = pages
        .map(page => wikidataPersonCandidate(page, entities[page?.pageprops?.wikibase_item]))
        .filter(Boolean)
      if (candidates.length) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)]
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(selected))
        return
      }
    }
    throw new Error('Could not find a random Wikipedia biography with Wikidata dates in the supported range.')
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Wikidata lookup failed.' }))
  }
}

const geminiPersonaApiPlugin = (env: Record<string, string>) => {
  const schemaPath = path.resolve(process.cwd(), 'src/schemas/historicalPersonaAnnotation.schema.json')
  const annotationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

  return {
    name: 'gemini-persona-api',
    configureServer(server: any) {
      server.middlewares.use('/api/old-bailey/random', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        await handleOldBaileyRoute(req, res)
      })

      server.middlewares.use('/api/wikidata/random-person', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        await handleRandomWikidataPersonRoute(req, res)
      })

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
