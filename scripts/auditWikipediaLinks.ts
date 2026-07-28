/**
 * scripts/auditWikipediaLinks.ts — check every clickable name against Wikipedia.
 *
 * Walks the geography tree (cultural zones, regions, locations) plus every entry
 * already in WIKIPEDIA_TITLE_OVERRIDES, resolves each through getWikipediaArticle,
 * and asks the live Wikipedia API what it actually gets. Reports three failures:
 *
 *   MISSING       — no such article; the panel shows nothing
 *   DISAMBIGUATION — a "may refer to" list, e.g. Central Highlands
 *   REDIRECT      — works, but lands somewhere else (usually fine, worth seeing)
 *
 * Fix a failure by adding a line to src/constants/gameData/wikipediaTitles.ts.
 *
 *   npm run wiki-audit            all names
 *   npm run wiki-audit -- --places  geography only
 */
import { GEOGRAPHICAL_DATA } from '../src/constants/gameData/geography';
import {
  WIKIPEDIA_TITLE_OVERRIDES,
  getWikipediaArticle,
} from '../src/constants/gameData/wikipediaTitles';

const API = 'https://en.wikipedia.org/w/api.php';
const BATCH = 50;

type Status = 'ok' | 'missing' | 'disambiguation' | 'redirect';
interface Result {
  display: string;
  title: string;
  status: Status;
  landsOn?: string;
}

/** Every place name a user can click: region keys and location keys. */
function collectPlaceNames(): string[] {
  const names = new Set<string>();
  for (const zone of Object.values(GEOGRAPHICAL_DATA)) {
    for (const [region, locations] of Object.entries(zone)) {
      names.add(region);
      for (const location of Object.keys(locations)) names.add(location);
    }
  }
  return [...names];
}

async function queryBatch(titles: string[]): Promise<any> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'pageprops',
    ppprop: 'disambiguation',
    redirects: '1',
    titles: titles.join('|'),
    origin: '*',
  });
  // Wikipedia rate-limits anonymous bursts; back off and identify ourselves.
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${API}?${params}`, {
      headers: { 'User-Agent': 'historical-persona-generator link audit (bebreen@ucsc.edu)' },
    });
    if (response.ok) return response.json();
    if (response.status !== 429 || attempt >= 5) {
      throw new Error(`Wikipedia API ${response.status}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000 * 2 ** attempt));
  }
}

async function audit(displayNames: string[]): Promise<Result[]> {
  // Several display names can resolve to the same article; query each title once.
  const byTitle = new Map<string, string[]>();
  for (const display of displayNames) {
    const title = getWikipediaArticle(display).replace(/_/g, ' ');
    const bucket = byTitle.get(title);
    if (bucket) bucket.push(display);
    else byTitle.set(title, [display]);
  }

  const titles = [...byTitle.keys()];
  const results: Result[] = [];

  for (let i = 0; i < titles.length; i += BATCH) {
    const chunk = titles.slice(i, i + BATCH);
    if (i) await new Promise(resolve => setTimeout(resolve, 500));
    const data = await queryBatch(chunk);
    const query = data.query ?? {};

    // The API normalizes and follows redirects, so map back to what we asked for.
    const resolved = new Map<string, string>(chunk.map(t => [t, t]));
    for (const { from, to } of query.normalized ?? []) resolved.set(from, to);
    for (const { from, to } of query.redirects ?? []) {
      for (const [asked, current] of resolved) if (current === from) resolved.set(asked, to);
    }

    const pages: any[] = Object.values(query.pages ?? {});
    const pageByTitle = new Map(pages.map(p => [p.title, p]));

    for (const asked of chunk) {
      const landsOn = resolved.get(asked)!;
      const page = pageByTitle.get(landsOn);
      let status: Status = 'ok';
      if (!page || page.missing !== undefined) status = 'missing';
      else if (page.pageprops?.disambiguation !== undefined) status = 'disambiguation';
      else if (landsOn !== asked) status = 'redirect';

      for (const display of byTitle.get(asked)!) {
        results.push({ display, title: asked, status, landsOn });
      }
    }
    process.stderr.write(`\rchecked ${Math.min(i + BATCH, titles.length)}/${titles.length} titles`);
  }
  process.stderr.write('\n');
  return results;
}

function report(label: string, results: Result[], status: Status): number {
  const hits = results.filter(r => r.status === status).sort((a, b) => a.display.localeCompare(b.display));
  if (!hits.length) return 0;
  console.log(`\n${label} (${hits.length})`);
  for (const hit of hits) {
    const suffix = status === 'redirect' ? ` -> ${hit.landsOn}` : '';
    const mapped = hit.display === hit.title ? '' : ` [mapped from "${hit.display}"]`;
    console.log(`  ${hit.title}${suffix}${mapped}`);
  }
  return hits.length;
}

async function main() {
  const placesOnly = process.argv.includes('--places');
  const names = placesOnly
    ? collectPlaceNames()
    : [...new Set([...collectPlaceNames(), ...Object.keys(WIKIPEDIA_TITLE_OVERRIDES)])];

  console.log(`auditing ${names.length} display names${placesOnly ? ' (geography only)' : ''}`);
  const results = await audit(names);

  const missing = report('MISSING — no article', results, 'missing');
  const ambiguous = report('DISAMBIGUATION — "may refer to" page', results, 'disambiguation');
  report('REDIRECT — resolves elsewhere', results, 'redirect');

  const broken = missing + ambiguous;
  console.log(
    `\n${results.length - broken}/${results.length} names resolve to a real article.` +
      (broken ? ` ${broken} need an entry in wikipediaTitles.ts.` : '')
  );
  if (broken) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
