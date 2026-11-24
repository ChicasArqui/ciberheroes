const express = require('express');
const request = require('supertest');
const createFamilyLookupRouter = require('../src/modules/family/family.routes');

const endpoint = '/api/child/family/lookup';

function createLookup(rateLimit, remoteAddress) {
  const app = express();
  app.set('trust proxy', true);
  if (remoteAddress) {
    app.use((req, res, next) => {
      Object.defineProperty(req.socket, 'remoteAddress', { value: remoteAddress });
      next();
    });
  }

  const repository = { findProfilesByFamilyCode: jest.fn().mockResolvedValue([]) };
  app.use('/api/child/family', createFamilyLookupRouter(repository, rateLimit));
  return {
    search: () => request(app).post(endpoint),
    findProfiles: repository.findProfilesByFamilyCode
  };
}

function lookup(search) {
  return search().send({ familyCode: 'EQUIPO-FICTICIO' });
}

test('allows the configured limit, rejects the next request before parsing, and recovers after the window', async () => {
  let time = 250;
  const { search, findProfiles } = createLookup({ limit: 2, windowMs: 2500, now: () => time });

  await lookup(search).expect(200);
  await lookup(search).expect(200);
  await search().type('json').send('{"familyCode":')
    .expect('Retry-After', '3')
    .expect('Cache-Control', 'no-store')
    .expect(429, { code: 'FAMILY_LOOKUP_RATE_LIMITED' });
  expect(findProfiles).toHaveBeenCalledTimes(2);

  time = 2499;
  await lookup(search).expect('Retry-After', '1').expect(429);
  expect(findProfiles).toHaveBeenCalledTimes(2);

  time = 2500;
  await lookup(search).expect(200);
  expect(findProfiles).toHaveBeenCalledTimes(3);
});

test('shares the same source budget across two Express instances', async () => {
  let count = 0;
  const store = { increment: jest.fn(async () => ({ count: ++count, resetAt: 60_000 })) };
  const options = { store, limit: 2, now: () => 0 };
  const first = createLookup(options, '192.0.2.10');
  const second = createLookup(options, '192.0.2.10');

  await lookup(first.search).expect(200);
  await lookup(second.search).expect(200);
  await lookup(second.search)
    .expect('Retry-After', '60')
    .expect(429, { code: 'FAMILY_LOOKUP_RATE_LIMITED' });

  expect(store.increment.mock.calls).toEqual(Array.from({ length: 3 }, () => ['family-lookup:192.0.2.10', 60_000]));
  expect(first.findProfiles).toHaveBeenCalledTimes(1);
  expect(second.findProfiles).toHaveBeenCalledTimes(1);
});

test('fails closed without exposing a shared-store error or querying the repository', async () => {
  const store = { increment: jest.fn().mockRejectedValue(new Error('secreto-ficticio')) };
  const { search, findProfiles } = createLookup({ store });

  await lookup(search)
    .expect('Cache-Control', 'no-store')
    .expect(503, { code: 'FAMILY_LOOKUP_UNAVAILABLE' });
  expect(findProfiles).not.toHaveBeenCalled();
});

test('fails closed if the store returns an invalid counter', async () => {
  const store = { increment: jest.fn().mockResolvedValue({ count: 0, resetAt: 60_000 }) };
  const { search, findProfiles } = createLookup({ store });

  await lookup(search).expect(503, { code: 'FAMILY_LOOKUP_UNAVAILABLE' });
  expect(findProfiles).not.toHaveBeenCalled();
});

test('does not use a memory fallback in production when no store is configured', async () => {
  const environment = jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
  try {
    const { search, findProfiles } = createLookup();

    await lookup(search).expect(503, { code: 'FAMILY_LOOKUP_UNAVAILABLE' });
    expect(findProfiles).not.toHaveBeenCalled();
  } finally {
    environment.restore();
  }
});

test('ignores arbitrary forwarded origin headers even if Express trusts proxies elsewhere', async () => {
  const { search, findProfiles } = createLookup({ limit: 1, now: () => 0 });

  await search().set('X-Forwarded-For', '192.0.2.1').send({ familyCode: 'EQUIPO' }).expect(200);
  await search().set('X-Forwarded-For', '198.51.100.2').set('Forwarded', 'for=203.0.113.3')
    .send({ familyCode: 'EQUIPO' }).expect(429);
  expect(findProfiles).toHaveBeenCalledTimes(1);
});

test('groups compressed and expanded IPv6 addresses in the same /64 and separates another prefix', async () => {
  const store = { increment: jest.fn(async () => ({ count: 1, resetAt: 60_000 })) };
  const options = { store, now: () => 0 };
  for (const address of ['2001:db8:1234:5678::1', '2001:0db8:1234:5678:0000:0000:0000:beef', '2001:db8:1234:5679::1']) {
    await lookup(createLookup(options, address).search).expect(200);
  }

  expect(store.increment.mock.calls).toEqual([
    ['family-lookup:2001:db8:1234:5678/64', 60_000],
    ['family-lookup:2001:db8:1234:5678/64', 60_000],
    ['family-lookup:2001:db8:1234:5679/64', 60_000]
  ]);
});

test('uses the same quota key for IPv4 and IPv4-mapped IPv6', async () => {
  const store = { increment: jest.fn(async () => ({ count: 1, resetAt: 60_000 })) };
  const options = { store, now: () => 0 };
  await lookup(createLookup(options, '192.0.2.10').search).expect(200);
  await lookup(createLookup(options, '::ffff:192.0.2.10').search).expect(200);

  expect(store.increment.mock.calls).toEqual([
    ['family-lookup:192.0.2.10', 60_000],
    ['family-lookup:192.0.2.10', 60_000]
  ]);
});
