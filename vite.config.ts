import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import personaShareHandler from './api/persona-share.js'
import aiAccessHandler from './api/ai-access.js'
import stripeWebhookHandler from './api/stripe-webhook.js'
// @ts-expect-error - plain JS helper shared with the Vercel routes and server.js
import { parseJsonObject } from './api/_lib/llmJson.js'
// @ts-expect-error - plain JS helper shared with the Vercel routes and server.js
import { checkRateLimit, clientIpFromRequest, rateLimitMessage } from './api/_lib/rateLimit.js'
// @ts-expect-error - plain JS helper shared with the Vercel routes and server.js
import { consumeAiCredit, ensureVisitorId } from './api/_lib/aiAccess.js'
// @ts-expect-error - plain JS helper shared with the Vercel routes and server.js
import { buildAnnotationPrompt, buildSketchPrompt } from './api/_lib/personaPrompts.js'
// @ts-expect-error - plain JS helper shared with the Vercel routes and server.js
import { callModel } from './api/_lib/llm.js'

const readRequestBody = async (req: any): Promise<any> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

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
  // API helpers run in Node and intentionally read server-only process.env.
  // Mirror Vite's loaded .env values without replacing real shell variables.
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
  const schemaPath = path.resolve(process.cwd(), 'src/schemas/historicalPersonaAnnotation.schema.json')
  const annotationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

  return {
    name: 'gemini-persona-api',
    configureServer(server: any) {
      server.middlewares.use('/api/stripe-webhook', async (req: any, res: any) => {
        await stripeWebhookHandler(req, res)
      })

      server.middlewares.use('/api/ai-access', async (req: any, res: any) => {
        await aiAccessHandler(req, res)
      })

      server.middlewares.use('/api/persona-share', async (req: any, res: any) => {
        await personaShareHandler(req, res)
      })

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
          if (body.action === 'generate_annotation' || body.action === 'generate_sketch') {
            const verdict = checkRateLimit(clientIpFromRequest(req), body.action)
            if (!verdict.allowed) {
              res.statusCode = 429
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Retry-After', String(verdict.retryAfterSeconds))
              res.end(JSON.stringify({ error: rateLimitMessage(verdict.scope), retryAfterSeconds: verdict.retryAfterSeconds }))
              return
            }
            const visitorId = ensureVisitorId(req, res)
            const accessVerdict = await consumeAiCredit(visitorId, body.action)
            if (!accessVerdict.allowed) {
              res.statusCode = 402
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-store')
              res.end(JSON.stringify({
                code: 'AI_SUPPORT_REQUIRED',
                error: body.action === 'generate_annotation'
                  ? 'You have used all three free full schema generations. A donation unlocks 50 credits for 30 days.'
                  : 'You have used all five free AI biographies. A donation unlocks 50 credits for 30 days.',
                access: accessVerdict.access,
              }))
              return
            }
          }

          if (body.action === 'generate_annotation') {
            const { text, usage } = await callModel({
              variant: body.model,
              action: 'generate_annotation',
              prompt: buildAnnotationPrompt(body.source, body.options, annotationSchema),
              json: true,
              env,
            })
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ record: parseJsonObject(text), usage }))
            return
          }

          if (body.action === 'generate_sketch') {
            const { text, usage } = await callModel({
              variant: body.model,
              action: 'generate_sketch',
              prompt: buildSketchPrompt(body.record),
              env,
            })
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ sketch: text.trim(), usage }))
            return
          }

          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Unknown Gemini action.' }))
        } catch (error) {
          console.error('Persona generation failed:', error)
          // The credit gate runs before the model and throws 503s of its own; a
          // flat 500 here made a missing env var look like a model outage.
          res.statusCode = Number((error as any)?.statusCode) || 500
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({
            error: (error as any)?.code
              ? (error as Error).message
              : 'Persona generation is temporarily unavailable. Please try again.',
          }))
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
      port: 5173,
    },
    esbuild: {
      // Allow duplicate object keys (last one wins) - these are present in data files
      logOverride: { 'duplicate-object-key': 'silent' },
    },
  }
})
