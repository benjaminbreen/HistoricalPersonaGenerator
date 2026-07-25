import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

process.env.PERSONA_SHARE_STORAGE = 'local';
const { default: handler, validateAndSanitizeSnapshot } = await import('../api/persona-share.js');

const snapshot = {
  schemaVersion: 1,
  persona: {
    year: 1691,
    month: 4,
    day: 8,
    era: 'RENAISSANCE_EARLY_MODERN',
    culturalZone: 'EUROPEAN',
    location: 'Stepney',
    region: 'British Isles',
    historicalContext: { localeType: 'urban' },
    character: {
      id: 'share-test',
      name: 'Mary <script>alert(1)</script> Holloway',
      age: 45,
      gender: 'Female',
      profession: 'Midwife',
      religion: 'Protestantism',
      appearance: {},
      family: [],
      inventory: [],
      equippedItems: {},
    },
  },
  personaSketch: 'A practical neighborhood midwife.',
  portraitEngine: 'lab',
  samplingMode: 'explore',
};

const sanitized = validateAndSanitizeSnapshot(snapshot);
assert.equal(sanitized.persona.character.name, 'Mary alert(1) Holloway');
assert.throws(
  () => validateAndSanitizeSnapshot({ ...snapshot, sourceText: 'private transcript' }),
  /Unexpected snapshot field/
);
assert.throws(
  () => validateAndSanitizeSnapshot({ ...snapshot, annotationRecord: {} }),
  /Annotation/
);

class MockRequest extends Readable {
  constructor(method, url, body) {
    super();
    this.method = method;
    this.url = url;
    this.headers = {
      'content-type': 'application/json',
      'content-length': body ? String(Buffer.byteLength(body)) : '0',
      'x-forwarded-for': '127.0.0.1',
    };
    this.socket = { remoteAddress: '127.0.0.1' };
    this.bodyText = body || '';
  }

  _read() {
    this.push(this.bodyText);
    this.push(null);
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
  }

  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = String(value);
  }

  end(chunk = '') {
    this.body += String(chunk);
  }
}

const postResponse = new MockResponse();
await handler(
  new MockRequest('POST', '/api/persona-share', JSON.stringify(snapshot)),
  postResponse
);
assert.equal(postResponse.statusCode, 201);
const created = JSON.parse(postResponse.body);
assert.match(created.id, /^[A-Za-z0-9_-]{22}$/);

const getResponse = new MockResponse();
await handler(
  new MockRequest('GET', `/api/persona-share?id=${created.id}`),
  getResponse
);
assert.equal(getResponse.statusCode, 200);
const restored = JSON.parse(getResponse.body);
assert.equal(restored.id, created.id);
assert.equal(restored.snapshot.persona.character.name, 'Mary alert(1) Holloway');
assert.equal(restored.snapshot.portraitEngine, 'lab');
assert.match(restored.checksum, /^[a-f0-9]{64}$/);

const invalidResponse = new MockResponse();
await handler(
  new MockRequest(
    'POST',
    '/api/persona-share',
    JSON.stringify({ ...snapshot, annotationRecord: {} })
  ),
  invalidResponse
);
assert.equal(invalidResponse.statusCode, 400);

await unlink(path.join(process.cwd(), '.persona-shares', `${created.id}.json`));
console.log('persona share round trip passed');
