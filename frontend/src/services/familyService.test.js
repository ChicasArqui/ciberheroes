import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FamilyLookupError, lookupFamily } from './familyService.js';

function mockJson(t, body, status = 200) {
  return t.mock.method(globalThis, 'fetch', async () => Response.json(body, { status }));
}

async function expectLookupError(kind) {
  await assert.rejects(() => lookupFamily('EQUIPO'), { name: FamilyLookupError.name, kind });
}

test('sends a same-origin request and returns only public profile fields', async t => {
  const fetchMock = mockJson(t, { profiles: [{ id: ' kid-1 ', nickname: ' Luna ', avatar: ' ⭐ ', extra: 'unused' }] });
  assert.deepEqual(await lookupFamily('EQUIPO'), [{ id: 'kid-1', nickname: 'Luna', avatar: '⭐' }]);
  const [[url, options]] = fetchMock.mock.calls.map(call => call.arguments);
  assert.equal(url, '/api/child/family/lookup');
  assert.equal(options.method, 'POST');
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(options.body), { familyCode: 'EQUIPO' });
});

test('returns an empty list for a family without profiles', async t => {
  mockJson(t, { profiles: [] });
  assert.deepEqual(await lookupFamily('EQUIPO'), []);
});

test('distinguishes an explicitly missing family', async t => {
  mockJson(t, { code: 'FAMILY_NOT_FOUND' }, 404);
  await expectLookupError('not-found');
});

test('does not treat an unrecognized route 404 as a missing family', async t => {
  mockJson(t, { error: 'Ruta de API no encontrada' }, 404);
  await expectLookupError('server');
});

test('reports a network failure and allows a new request with the same code', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Network error');
  });
  fetchMock.mock.mockImplementationOnce(async () => Response.json({ profiles: [] }), 1);
  await expectLookupError('connection');
  assert.deepEqual(await lookupFamily('EQUIPO'), []);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('reports an internal server error even when the error body is HTML', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<h1>Error</h1>', { status: 500 }));
  await expectLookupError('server');
});

test('reports invalid JSON as a malformed response', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{'));
  await expectLookupError('malformed');
});

test('reports a failure while reading the response body as a connection failure', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new TypeError('Connection interrupted'); }
  }));
  await expectLookupError('connection');
});

for (const [label, body] of [
  ['missing profiles', {}],
  ['non-array profiles', { profiles: 'invalid' }],
  ['missing profile ID', { profiles: [{ nickname: 'Luna' }] }],
  ['blank profile ID', { profiles: [{ id: ' ', nickname: 'Luna' }] }],
  ['invalid profile ID', { profiles: [{ id: {}, nickname: 'Luna' }] }],
  ['missing nickname', { profiles: [{ id: 1 }] }],
  ['blank nickname', { profiles: [{ id: 1, nickname: ' ' }] }],
  ['non-string nickname', { profiles: [{ id: 1, nickname: 3 }] }],
  ['mixed valid and invalid profiles', { profiles: [{ id: 1, nickname: 'Luna' }, null] }],
  ['duplicate profile IDs', { profiles: [{ id: 1, nickname: 'Luna' }, { id: '1', nickname: 'Sol' }] }]
]) {
  test('rejects a malformed response with ' + label, async t => {
    mockJson(t, body);
    await expectLookupError('malformed');
  });
}

test('ignores an avatar of an unsupported type', async t => {
  mockJson(t, { profiles: [{ id: 0, nickname: 'Luna', avatar: { url: '/avatar' } }] });
  assert.deepEqual(await lookupFamily('EQUIPO'), [{ id: 0, nickname: 'Luna', avatar: undefined }]);
});
