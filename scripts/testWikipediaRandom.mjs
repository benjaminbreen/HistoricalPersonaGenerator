import assert from 'node:assert/strict';
import { CURATED_HISTORICAL_PEOPLE, findRandomWikipediaPerson } from '../api/_lib/randomWikipediaPerson.js';

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const wikipediaPage = {
  pageid: 1,
  title: 'Example Person',
  fullurl: 'https://en.wikipedia.org/wiki/Example_Person',
  length: 5000,
  pageprops: { wikibase_item: 'Q123' },
};

const wikidataEntity = {
  id: 'Q123',
  labels: { en: { value: 'Example Person' } },
  descriptions: { en: { value: 'example historical person' } },
  sitelinks: { enwiki: { title: 'Example Person' }, frwiki: { title: 'Exemple' } },
  claims: {
    P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }],
    P569: [{ mainsnak: { datavalue: { value: { time: '+1800-01-01T00:00:00Z' } } } }],
    P570: [{ mainsnak: { datavalue: { value: { time: '+1860-01-01T00:00:00Z' } } } }],
  },
};

{
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return calls.length === 1
      ? jsonResponse(200, { query: { pages: { 1: wikipediaPage } } })
      : jsonResponse(200, { entities: { Q123: wikidataEntity } });
  };
  const person = await findRandomWikipediaPerson({ fetchImpl, random: () => 0, useCache: false });
  assert.equal(person.selectionMode, 'live_random');
  assert.equal(person.label, 'Example Person');
  assert.equal(person.birthYear, 1800);
  assert.match(calls[0].init.headers['Api-User-Agent'], /HistoricalPersonaGenerator/);
  assert.equal(calls.length, 2);
}

{
  let calls = 0;
  const person = await findRandomWikipediaPerson({
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(429, {});
    },
    random: () => 0,
    useCache: false,
  });
  assert.equal(calls, 1, 'a 429 should not trigger an immediate retry storm');
  assert.equal(person.selectionMode, 'curated_fallback');
  assert.equal(person.label, CURATED_HISTORICAL_PEOPLE[0].label);
  assert.match(person.notice, /429/);
}

{
  let calls = 0;
  const person = await findRandomWikipediaPerson({
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(200, { query: { pages: {} } });
    },
    random: () => 0.5,
    maxAttempts: 3,
    useCache: false,
  });
  assert.equal(calls, 3);
  assert.equal(person.selectionMode, 'curated_fallback');
  assert.ok(person.wikipediaUrl.startsWith('https://en.wikipedia.org/wiki/'));
}

console.log('Wikipedia random-person resilience tests passed');
