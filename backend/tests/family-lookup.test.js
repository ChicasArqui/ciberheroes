const express = require('express');
const request = require('supertest');
const app = require('../src/app');
const createFamilyLookupRouter = require('../src/modules/family/family.routes');

const endpoint = '/api/child/family/lookup';

function lookupWith(findProfilesByFamilyCode) {
  const testApp = express();
  testApp.use('/api/child/family', createFamilyLookupRouter({ findProfilesByFamilyCode }));
  return request(testApp).post(endpoint);
}

test('normalizes a valid code and returns eligible profiles without caching', async () => {
  const profiles = [{ id: 'kid-1', nickname: 'Luna', avatarId: 'tortuga-01' }, { id: 2, nickname: 'Sol' }];
  const lookup = jest.fn().mockResolvedValue(profiles);

  await lookupWith(lookup).send({ familyCode: ' equipo-1 ' })
    .expect('Cache-Control', 'no-store')
    .expect(200, { profiles });
  expect(lookup).toHaveBeenCalledTimes(1);
  expect(lookup).toHaveBeenCalledWith('EQUIPO-1');
});

test.each([
  {}, { familyCode: '   ' }, { familyCode: 42 },
  { familyCode: 'DOS PALABRAS' }, { familyCode: 'A'.repeat(65) }
])('rejects invalid input without consulting the repository (%#)', async body => {
  const lookup = jest.fn();

  await lookupWith(lookup).send(body).expect(400, { code: 'INVALID_FAMILY_CODE' });
  expect(lookup).not.toHaveBeenCalled();
});

test('returns a safe JSON error for a malformed request body', async () => {
  await request(app).post(endpoint).type('json').send('{"familyCode":"ficticio"')
    .expect('Cache-Control', 'no-store')
    .expect(400, { code: 'INVALID_FAMILY_CODE' });
});

test('rejects oversized JSON before consulting the repository', async () => {
  const lookup = jest.fn();

  await lookupWith(lookup).send({ familyCode: 'A'.repeat(2048) })
    .expect(413, { code: 'INVALID_FAMILY_CODE' });
  expect(lookup).not.toHaveBeenCalled();
});

test('reports a missing family using the provisional client discriminator', async () => {
  await lookupWith(jest.fn().mockResolvedValue(null)).send({ familyCode: 'OTRA' })
    .expect(404, { code: 'FAMILY_NOT_FOUND' });
});

test('keeps a family without eligible profiles distinct from a missing family', async () => {
  await lookupWith(jest.fn().mockResolvedValue([])).send({ familyCode: 'EQUIPO' })
    .expect(200, { profiles: [] });
});

test('returns only explicitly projected public profile fields', async () => {
  const lookup = jest.fn().mockResolvedValue([{
    id: ' kid-1 ', nickname: ' Luna ', avatarId: ' tortuga-01 ', avatar: 'campo-anterior',
    pin: '0000', pinHash: 'hash-ficticio', password: 'clave-ficticia',
    guardian: { email: 'guardian@example.invalid' }, familyCode: 'EQUIPO'
  }]);

  await lookupWith(lookup).send({ familyCode: 'EQUIPO' })
    .expect(200, { profiles: [{ id: 'kid-1', nickname: 'Luna', avatarId: 'tortuga-01' }] });
});

test('does not expose repository error details', async () => {
  const lookup = jest.fn().mockRejectedValue(new Error('credencial-ficticia'));

  await lookupWith(lookup).send({ familyCode: 'EQUIPO' })
    .expect(500, { code: 'FAMILY_LOOKUP_FAILED' });
});

test.each([
  { profiles: [{ id: {}, nickname: 'Luna' }] },
  { profiles: [{ id: 'kid-1', nickname: {} }] },
  { profiles: [{ id: 1, nickname: 'Luna' }, { id: '1', nickname: 'Sol' }] }
])('rejects invalid repository data without returning it (%#)', async ({ profiles }) => {
  const lookup = jest.fn().mockResolvedValue(profiles);

  await lookupWith(lookup).send({ familyCode: 'EQUIPO' })
    .expect(500, { code: 'FAMILY_LOOKUP_FAILED' });
});

test('returns unavailable when the real app has no family repository', async () => {
  await request(app).post(endpoint).send({ familyCode: 'EQUIPO' })
    .expect('Cache-Control', 'no-store')
    .expect(503, { code: 'FAMILY_LOOKUP_UNAVAILABLE' });
});

test('omits invalid avatar IDs and never returns the legacy avatar field', async () => {
  const lookup = jest.fn().mockResolvedValue([
    { id: 'kid-1', nickname: 'Luna', avatarId: { privateData: 'ficticio' } },
    { id: 'kid-2', nickname: 'Sol', avatar: '⭐' },
    { id: 'kid-3', nickname: 'Mar', avatarId: '  ' }
  ]);

  await lookupWith(lookup).send({ familyCode: 'EQUIPO' }).expect(200, {
    profiles: [
      { id: 'kid-1', nickname: 'Luna' },
      { id: 'kid-2', nickname: 'Sol' },
      { id: 'kid-3', nickname: 'Mar' }
    ]
  });
});
