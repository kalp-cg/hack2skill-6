import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeUserText,
  validateCoordinates,
  validateGeocodeQuery,
  validateCommunityName,
  SlidingWindowRateLimiter,
} from './security.ts';
import { TtlLruCache } from './cache.ts';
import { loadKnowledgeBase, retrieveKnowledge } from './rag.ts';

test('validateCoordinates accepts valid Indian coordinates and rejects out-of-range inputs', () => {
  const valid = validateCoordinates(28.5672, 77.21);
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.lat, 28.5672);
    assert.equal(valid.lon, 77.21);
  }

  assert.equal(validateCoordinates(95, 77).ok, false);
  assert.equal(validateCoordinates(28, 200).ok, false);
  assert.equal(validateCoordinates('NaN', 77).ok, false);
});

test('sanitizeUserText strips control characters and enforces max length', () => {
  const dirty = '  Hello\u0000World\u0007!  ';
  assert.equal(sanitizeUserText(dirty, 50), 'HelloWorld!');
  assert.equal(sanitizeUserText('a'.repeat(1000), 120).length, 120);
});

test('validateGeocodeQuery and validateCommunityName reject short or unsafe strings', () => {
  assert.equal(validateGeocodeQuery('a').ok, false);
  const okGeo = validateGeocodeQuery('New Delhi');
  assert.equal(okGeo.ok, true);

  assert.equal(validateCommunityName('ab').ok, false);
  const okComm = validateCommunityName('<script>Green Park RWA</script>');
  assert.equal(okComm.ok, true);
  if (okComm.ok) {
    assert.equal(okComm.name.includes('<'), false);
    assert.equal(okComm.name.includes('>'), false);
  }
});

test('SlidingWindowRateLimiter enforces request caps and resets after window expiry', () => {
  const limiter = new SlidingWindowRateLimiter({ maxRequests: 2, windowMs: 1000, maxKeys: 5 });
  assert.equal(limiter.check('1.2.3.4', 1000).allowed, true);
  assert.equal(limiter.check('1.2.3.4', 1100).allowed, true);

  const blocked = limiter.check('1.2.3.4', 1200);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);

  // After window passes, requests are allowed again
  assert.equal(limiter.check('1.2.3.4', 2100).allowed, true);
});

test('TtlLruCache supports cache hits, TTL expiry, and bounded LRU eviction', () => {
  const cache = new TtlLruCache<string>({ maxEntries: 2, ttlMs: 1000 });
  cache.set('a', 'alpha', 100);
  cache.set('b', 'beta', 100);
  assert.equal(cache.get('a', 200), 'alpha'); // 'a' becomes most recently used

  cache.set('c', 'gamma', 250); // 'b' should be evicted
  assert.equal(cache.size(), 2);
  assert.equal(cache.get('b', 300), undefined);
  assert.equal(cache.get('a', 300), 'alpha');
  assert.equal(cache.get('c', 300), 'gamma');

  // Expired after TTL
  assert.equal(cache.get('a', 1500), undefined);
});

test('RAG knowledge base loads all 4 policy documents and retrieves relevant citations', () => {
  const chunks = loadKnowledgeBase();
  assert.ok(chunks.length >= 8, 'Expected chunked sections from 4 markdown docs');

  const cadrResults = retrieveKnowledge('purifier CADR 120 sq ft HEPA box fan', 2);
  assert.ok(cadrResults.length >= 1);
  assert.ok(
    cadrResults.some((c) => /CADR|EPA|HEPA/i.test(`${c.sourceName} ${c.content}`)),
    'Expected EPA/CADR chunk for purifier sizing query'
  );

  const asthmaResults = retrieveKnowledge('child asthma wheezing chest pain emergency smog', 2);
  assert.ok(
    asthmaResults.some((c) => /MoHFW|ICMR|doctor|wheezing/i.test(`${c.sourceName} ${c.content}`)),
    'Expected MoHFW/ICMR clinical safety guidance chunk'
  );
});
