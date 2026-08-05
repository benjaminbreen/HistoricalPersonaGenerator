import { IngestedPersonaSource } from '../types/personaAnnotation';

const WIKIPEDIA_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKIPEDIA_ACTION_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_ACTION_API = 'https://www.wikidata.org/w/api.php';

const normalizeWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim();

export type SourceIngestionStage = 'discovery' | 'fetch' | 'extract';

export class SourceIngestionError extends Error {
  code: string;
  stage: SourceIngestionStage;
  retryable: boolean;
  technicalDetail?: string;
  modelCalled: boolean;

  constructor(message: string, options: {
    code: string;
    stage: SourceIngestionStage;
    retryable?: boolean;
    technicalDetail?: string;
    modelCalled?: boolean;
  }) {
    super(message);
    this.name = 'SourceIngestionError';
    this.code = options.code;
    this.stage = options.stage;
    this.retryable = options.retryable ?? true;
    this.technicalDetail = options.technicalDetail;
    this.modelCalled = options.modelCalled ?? false;
  }
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit, attempts = 2): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok || (response.status !== 429 && response.status < 500) || attempt === attempts - 1) {
        return response;
      }
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;
      await wait(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 1500) : 350 * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
      await wait(350 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Source request failed.');
};

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, nav, header, footer, aside, form').forEach(node => node.remove());
  const main = doc.querySelector('main, article') || doc.body;
  return normalizeWhitespace(main?.textContent || '');
};

const titleFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const finalPath = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname;
    return decodeURIComponent(finalPath.replace(/_/g, ' '));
  } catch {
    return 'Submitted URL';
  }
};

const yearFromWikidataClaim = (entity: any, property: string): number | undefined => {
  const time = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time;
  const match = typeof time === 'string' ? time.match(/^([+-])(\d{1,6})/) : null;
  if (!match) return undefined;
  const year = Number(match[2]);
  return match[1] === '-' ? -year : year;
};

export function createPastedTextSource(text: string, title = 'Pasted source text'): IngestedPersonaSource {
  return {
    title,
    text: normalizeWhitespace(text),
    sourceBasis: 'other',
    extractionMethod: 'paste',
    citationLabel: title,
    reliabilityNotes: 'User-submitted pasted text. Source genre and transcription quality require review.',
  };
}

export interface OldBaileyRandomFilters {
  gender?: 'any' | 'female' | 'male';
  decade?: string;
  crime?: 'any' | 'theft' | 'violent_theft' | 'deception' | 'killing' | 'sexual' | 'royal' | 'damage' | 'miscellaneous';
  personaAngle?: 'named_subject' | 'ordinary_person_from_source_world';
}

export interface WikidataRandomPerson {
  qid?: string;
  label: string;
  description?: string;
  birthYear?: number;
  deathYear?: number;
  wikipediaTitle: string;
  wikipediaUrl: string;
  selectionMode?: 'live_random' | 'curated_fallback';
  notice?: string;
}

export async function ingestRandomOldBaileySource(filters: OldBaileyRandomFilters = {}): Promise<IngestedPersonaSource> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'any') query.set(key, String(value));
  });

  const response = await fetch(`/api/old-bailey/random?${query.toString()}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Old Bailey returned ${response.status}`);
  }

  return response.json();
}

export async function getRandomWikidataPerson(): Promise<WikidataRandomPerson> {
  const response = await fetchWithRetry('/api/wikidata/random-person');
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SourceIngestionError(
      errorBody.error || 'Wikipedia could not choose a historical person just now.',
      {
        code: errorBody.code || 'WIKIPEDIA_DISCOVERY_UNAVAILABLE',
        stage: 'discovery',
        retryable: errorBody.retryable !== false,
        technicalDetail: errorBody.technicalDetail || `Historical Persona Generator endpoint returned HTTP ${response.status}.`,
        modelCalled: errorBody.modelCalled === true,
      },
    );
  }
  return response.json();
}

export async function ingestUrlSource(url: string): Promise<IngestedPersonaSource> {
  const parsed = new URL(url);
  const isWikipedia = parsed.hostname.includes('wikipedia.org') && parsed.pathname.includes('/wiki/');

  if (isWikipedia) {
    const pageTitle = parsed.pathname.split('/wiki/')[1]?.split('#')[0] || '';
    const encodedPageTitle = encodeURIComponent(decodeURIComponent(pageTitle));
    const [summaryResult, extractResult] = await Promise.allSettled([
      fetchWithRetry(`${WIKIPEDIA_SUMMARY_BASE}${encodedPageTitle}`, {
        headers: {
          'Api-User-Agent': 'HistoricalPersonaGenerator/1.0',
        },
      }),
      fetchWithRetry(`${WIKIPEDIA_ACTION_API}?origin=*&action=query&prop=extracts%7Cpageprops%7Cinfo%7Cpageimages&inprop=url&piprop=original%7Cthumbnail&pithumbsize=1200&explaintext=1&redirects=1&format=json&titles=${encodedPageTitle}`, {
        headers: {
          'Api-User-Agent': 'HistoricalPersonaGenerator/1.0',
        },
      }),
    ]);

    const summaryResponse = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
    const extractResponse = extractResult.status === 'fulfilled' ? extractResult.value : null;
    if (!summaryResponse?.ok && !extractResponse?.ok) {
      const statuses = [summaryResponse?.status, extractResponse?.status].filter(Boolean).join(', ');
      const rejected = [summaryResult, extractResult]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason))
        .join('; ');
      throw new SourceIngestionError(
        'Wikipedia is temporarily unavailable, so the article could not be read. No Luna call was made.',
        {
          code: 'WIKIPEDIA_ARTICLE_UNAVAILABLE',
          stage: 'fetch',
          retryable: true,
          technicalDetail: statuses ? `Wikipedia APIs returned HTTP ${statuses}.` : rejected || 'Both Wikipedia requests failed.',
        },
      );
    }

    const data = summaryResponse?.ok ? await summaryResponse.json().catch(() => ({})) : {};
    let fullExtract = '';
    let wikidataId: string | undefined;
    let birthYear: number | undefined;
    let deathYear: number | undefined;
    let articlePage: any;

    if (extractResponse?.ok) {
      const extractData = await extractResponse.json();
      const pages = extractData?.query?.pages ? Object.values(extractData.query.pages) as Array<any> : [];
      articlePage = pages[0];
      fullExtract = articlePage?.extract || '';
      wikidataId = articlePage?.pageprops?.wikibase_item;
    }

    if (wikidataId) {
      const wikidataQuery = new URLSearchParams({
        action: 'wbgetentities',
        format: 'json',
        props: 'claims',
        ids: wikidataId,
        origin: '*',
      });
      try {
        const wikidataResponse = await fetchWithRetry(`${WIKIDATA_ACTION_API}?${wikidataQuery.toString()}`);
        if (wikidataResponse.ok) {
          const wikidata = await wikidataResponse.json();
          const entity = wikidata?.entities?.[wikidataId];
          birthYear = yearFromWikidataClaim(entity, 'P569');
          deathYear = yearFromWikidataClaim(entity, 'P570');
        }
      } catch {
        // Dates improve grounding but are not required when the article text is
        // already available; Luna can use explicit dates from the extract.
      }
    }

    const text = normalizeWhitespace([data.description, fullExtract || data.extract].filter(Boolean).join('\n\n'));
    if (!text) {
      throw new SourceIngestionError(
        'Wikipedia returned the page but no readable article text. Try another person or paste an article excerpt.',
        {
          code: 'WIKIPEDIA_ARTICLE_EMPTY',
          stage: 'extract',
          retryable: true,
          technicalDetail: `No extract was returned for ${decodeURIComponent(pageTitle)}.`,
        },
      );
    }

    const resolvedTitle = data.title || articlePage?.title || titleFromUrl(url);
    const imageUrl = data.originalimage?.source || data.thumbnail?.source || articlePage?.original?.source || articlePage?.thumbnail?.source;

    return {
      title: resolvedTitle,
      text: text.slice(0, 30000),
      url: data.content_urls?.desktop?.page || articlePage?.fullurl || url,
      imageUrl,
      imageAttribution: imageUrl ? `Wikipedia image for ${resolvedTitle}` : undefined,
      sourceBasis: 'wikipedia_or_reference',
      extractionMethod: 'wikipedia_api',
      citationLabel: `Wikipedia: ${resolvedTitle}`,
      reliabilityNotes: fullExtract
        ? 'Wikipedia plain-text extract. Use as contextual synthesis unless checked against cited sources.'
        : 'Wikipedia summary API extract. Use as contextual synthesis unless checked against cited sources.',
      subject: {
        name: resolvedTitle,
        description: data.description,
        birthYear,
        deathYear,
        externalId: wikidataId,
      },
    };
  }

  const response = await fetch(url, {
    headers: {
      'Accept': 'text/html,text/plain',
    },
  });
  if (!response.ok) {
    throw new Error(`URL returned ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  const text = contentType.includes('html') ? stripHtml(body) : normalizeWhitespace(body);

  return {
    title: titleFromUrl(url),
    text: text.slice(0, 12000),
    url,
    sourceBasis: 'other',
    extractionMethod: contentType.includes('html') ? 'html_readability' : 'paste',
    citationLabel: titleFromUrl(url),
    reliabilityNotes: 'Generic browser-side URL extraction. Some pages may be blocked by CORS or include boilerplate.',
  };
}
