import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import test, { after, before } from 'node:test';
import { createApp, generateContentWithResilience } from './app.ts';

// Route tests run fully offline: every case below is answered before any upstream call.
delete process.env.GEMINI_API_KEY;
delete process.env.VERCEL;

let server: Server;
let base = '';

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

const postJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('sets security headers and hides the Express fingerprint', async () => {
  const res = await fetch(`${base}/api/community`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('rejects invalid geocode queries and coordinates with 400', async () => {
  assert.equal((await fetch(`${base}/api/geocode?q=a`)).status, 400);
  assert.equal((await fetch(`${base}/api/aqi?lat=999&lon=10`)).status, 400);
  assert.equal((await fetch(`${base}/api/aqi?lat=abc&lon=10`)).status, 400);
  assert.equal((await fetch(`${base}/api/reverse-geocode?lat=10`)).status, 400);
});

test('rejects request bodies above the 32 KB cap', async () => {
  const res = await postJson('/api/chat', { message: 'hi', padding: 'x'.repeat(40_000) });
  assert.equal(res.status, 413);
  assert.deepEqual(await res.json(), { error: 'Request body too large.' });
});

test('malformed JSON returns a JSON 400 without leaking a stack trace', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"message": ',
  });
  assert.equal(res.status, 400);
  const body = await res.text();
  assert.equal(body, JSON.stringify({ error: 'Malformed request.' }));
});

test('plan endpoint rejects missing or oversized situation objects', async () => {
  assert.equal((await postJson('/api/plan', {})).status, 400);
  const oversized = { profile: {}, air: {}, blob: 'x'.repeat(20_000) };
  assert.equal((await postJson('/api/plan', { situation: oversized })).status, 400);
});

test('plan endpoint reports a missing Gemini key as 503 instead of crashing', async () => {
  const res = await postJson('/api/plan', { situation: { profile: {}, air: {} } });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /GEMINI_API_KEY/);
});

test('chat endpoint rejects empty messages and oversized situation context', async () => {
  assert.equal((await postJson('/api/chat', { message: '   ' })).status, 400);
  const res = await postJson('/api/chat', { message: 'hello', situation: { blob: 'x'.repeat(20_000) } });
  assert.equal(res.status, 400);
});

test('community leaderboard stays bounded under many distinct contributors', async () => {
  let last: { community: { leaderboard: unknown[] } } | undefined;
  for (let i = 0; i < 25; i += 1) {
    const res = await postJson('/api/community', {
      action: 'contribute',
      communityId: 'rwa-green-park',
      memberName: `Household ${i}`,
      co2SavedKg: 10,
      smogScore: 50,
    });
    assert.equal(res.status, 200);
    last = await res.json();
  }
  assert.ok(last && last.community.leaderboard.length <= 20);
});

test('community names are sanitized and validated', async () => {
  assert.equal((await postJson('/api/community', { action: 'create', name: 'ab' })).status, 400);
  assert.equal((await postJson('/api/community', { action: 'bogus' })).status, 400);
});

test('rate limiter cannot be bypassed with a spoofed X-Forwarded-For header', async () => {
  for (let i = 0; i < 30; i += 1) {
    await postJson('/api/chat', { message: '' });
  }
  assert.equal((await postJson('/api/chat', { message: '' })).status, 429);
  const spoofed = await postJson('/api/chat', { message: '' }, { 'X-Forwarded-For': '203.0.113.7' });
  assert.equal(spoofed.status, 429);
  assert.ok(Number(spoofed.headers.get('retry-after')) >= 1);
});

test('Gemini calls fall back to the second model when the primary model is out of quota', async () => {
  const calls: string[] = [];
  const fakeAi = {
    models: {
      generateContent: async ({ model }: { model: string }) => {
        calls.push(model);
        if (calls.length === 1) throw new Error('got status: 429 RESOURCE_EXHAUSTED');
        return { text: 'ok' };
      },
    },
  } as unknown as Parameters<typeof generateContentWithResilience>[0];
  const res = await generateContentWithResilience(fakeAi, { contents: 'hi' });
  assert.equal(res.text, 'ok');
  assert.equal(calls.length, 2, 'quota error must not be retried on the same model');
  assert.notEqual(calls[1], calls[0]);
});

test('a stalled Gemini request times out and moves to the fallback model', async () => {
  const calls: string[] = [];
  const fakeAi = {
    models: {
      generateContent: ({ model }: { model: string }) => {
        calls.push(model);
        return calls.length === 1 ? new Promise(() => {}) : Promise.resolve({ text: 'fallback ok' });
      },
    },
  } as unknown as Parameters<typeof generateContentWithResilience>[0];
  const res = await generateContentWithResilience(fakeAi, { contents: 'hi' }, 50);
  assert.equal(res.text, 'fallback ok');
  assert.equal(calls.length, 2, 'a timed-out model must not be retried');
  assert.notEqual(calls[1], calls[0]);
});
