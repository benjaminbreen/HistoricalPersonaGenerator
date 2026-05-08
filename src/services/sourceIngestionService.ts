import { IngestedPersonaSource } from '../types/personaAnnotation';

const WIKIPEDIA_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKIPEDIA_ACTION_API = 'https://en.wikipedia.org/w/api.php';

const normalizeWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim();

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
  qid: string;
  label: string;
  description?: string;
  birthYear?: number;
  deathYear?: number;
  wikipediaTitle: string;
  wikipediaUrl: string;
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
  const response = await fetch('/api/wikidata/random-person');
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Wikidata returned ${response.status}`);
  }
  return response.json();
}

export async function ingestUrlSource(url: string): Promise<IngestedPersonaSource> {
  const parsed = new URL(url);
  const isWikipedia = parsed.hostname.includes('wikipedia.org') && parsed.pathname.includes('/wiki/');

  if (isWikipedia) {
    const pageTitle = parsed.pathname.split('/wiki/')[1]?.split('#')[0] || '';
    const encodedPageTitle = encodeURIComponent(decodeURIComponent(pageTitle));
    const [summaryResponse, extractResponse] = await Promise.all([
      fetch(`${WIKIPEDIA_SUMMARY_BASE}${encodedPageTitle}`, {
        headers: {
          'Api-User-Agent': 'HistoricalPersonaGenerator/1.0',
        },
      }),
      fetch(`${WIKIPEDIA_ACTION_API}?origin=*&action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodedPageTitle}`, {
        headers: {
          'Api-User-Agent': 'HistoricalPersonaGenerator/1.0',
        },
      }),
    ]);

    if (!summaryResponse.ok) {
      throw new Error(`Wikipedia returned ${summaryResponse.status} for ${decodeURIComponent(pageTitle)}`);
    }

    const data = await summaryResponse.json();
    let fullExtract = '';

    if (extractResponse.ok) {
      const extractData = await extractResponse.json();
      const pages = extractData?.query?.pages ? Object.values(extractData.query.pages) as Array<any> : [];
      fullExtract = pages[0]?.extract || '';
    }

    const text = normalizeWhitespace([data.description, fullExtract || data.extract].filter(Boolean).join('\n\n'));

    return {
      title: data.title || titleFromUrl(url),
      text: text.slice(0, 30000),
      url: data.content_urls?.desktop?.page || url,
      imageUrl: data.originalimage?.source || data.thumbnail?.source,
      imageAttribution: data.originalimage?.source || data.thumbnail?.source ? `Wikipedia image for ${data.title || titleFromUrl(url)}` : undefined,
      sourceBasis: 'wikipedia_or_reference',
      extractionMethod: 'wikipedia_api',
      citationLabel: `Wikipedia: ${data.title || titleFromUrl(url)}`,
      reliabilityNotes: fullExtract
        ? 'Wikipedia plain-text extract. Use as contextual synthesis unless checked against cited sources.'
        : 'Wikipedia summary API extract. Use as contextual synthesis unless checked against cited sources.',
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
