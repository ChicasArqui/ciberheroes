const { spawnSync } = require('node:child_process');
const { checkPersistence } = require('../scripts/check-persistence');

const writeOptions = { writeConcern: { w: 'majority' } };
const readOptions = { readPreference: 'primary' };

function fixture(databaseName = 'ciberheroes_dev') {
  let stored;
  const collection = {
    insertOne: jest.fn(async document => {
      stored = document;
      return { acknowledged: true, insertedId: document._id };
    }),
    findOne: jest.fn(async () => stored ?? null),
    deleteOne: jest.fn(async () => {
      stored = null;
      return { acknowledged: true, deletedCount: 1 };
    })
  };
  const db = {
    databaseName,
    listCollections: jest.fn(() => ({ hasNext: async () => false })),
    collection: jest.fn(() => collection)
  };

  return { collection, db, options: { connect: jest.fn(), connection: { db } } };
}

test('writes, reads and removes only the generated document in an exclusive collection', async () => {
  const { collection, db, options } = fixture();
  const { collectionName, runId } = await checkPersistence(options);
  const filter = { _id: runId, runId };

  expect(options.connect).toHaveBeenCalledTimes(1);
  expect(collectionName).toMatch(/^cib27_persistence_check_[a-f0-9]{32}$/);
  expect(db.listCollections).toHaveBeenCalledWith({ name: collectionName }, { nameOnly: true });
  expect(db.collection).toHaveBeenCalledWith(collectionName);
  expect(collection.insertOne).toHaveBeenCalledWith({
    ...filter, purpose: 'cib27-persistence-check', value: 27
  }, writeOptions);
  expect(collection.findOne.mock.calls).toEqual([[filter, readOptions], [filter, readOptions]]);
  expect(collection.deleteOne.mock.calls).toEqual([[filter, writeOptions]]);
});

test('stops before accessing collections in the wrong database', async () => {
  const { db, options } = fixture('ciberheroes_prod');
  await expect(checkPersistence(options)).rejects.toThrow('base inesperada');
  expect(db.listCollections).not.toHaveBeenCalled();
  expect(db.collection).not.toHaveBeenCalled();
});

test('stops before writing when the collection already exists', async () => {
  const { collection, db, options } = fixture();
  db.listCollections.mockReturnValue({ hasNext: async () => true });
  await expect(checkPersistence(options)).rejects.toThrow('colección exclusiva');
  expect(collection.insertOne).not.toHaveBeenCalled();
  expect(collection.deleteOne).not.toHaveBeenCalled();
});

test('tries to clean up when the insert outcome is uncertain', async () => {
  const { collection, options } = fixture();
  collection.insertOne.mockRejectedValue(new Error('private connection detail'));
  const failure = await checkPersistence(options).catch(error => error);

  expect(failure.message).toContain('escritura');
  expect(failure.message).not.toContain('private connection detail');
  const [{ _id, runId }] = collection.insertOne.mock.calls[0];
  expect(collection.deleteOne.mock.calls).toEqual([[{ _id, runId }, writeOptions]]);
});

test('cleans up if the stored data does not match', async () => {
  const { collection, options } = fixture();
  collection.findOne.mockResolvedValueOnce({ value: 99 });
  await expect(checkPersistence(options)).rejects.toThrow('lectura y verificación');
  expect(collection.deleteOne).toHaveBeenCalledTimes(1);
  expect(collection.findOne).toHaveBeenCalledTimes(2);
});

test('reports when the cleanup could not be verified', async () => {
  const { collection, options } = fixture();
  collection.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 0 });
  await expect(checkPersistence(options)).rejects.toThrow('limpieza no confirmada');
});

test('does not expose an error from the connection driver', async () => {
  const { db, options } = fixture();
  options.connect.mockRejectedValue(new Error('private connection detail'));
  const failure = await checkPersistence(options).catch(error => error);

  expect(failure.message).toContain('falló connectDB()');
  expect(failure.message).not.toContain('private connection detail');
  expect(db.collection).not.toHaveBeenCalled();
});

const fakeUri = 'mongodb+srv://usuario-ficticio:clave-ficticia@host-ficticio.invalid/base-privada';

test.each([
  [{ name: 'MongoServerError', code: 18 }, 'autenticación rechazada'],
  [{ name: 'MongoServerError', code: 800, message: 'bad auth: ' + fakeUri }, 'autenticación rechazada'],
  [{ name: 'MongoParseError' }, 'MONGODB_URI es inválida'],
  [{ name: 'TypeError', code: 'ERR_INVALID_URL' }, 'MONGODB_URI es inválida'],
  [{ name: 'MongoNetworkError', cause: { code: 'ENOTFOUND', message: fakeUri } }, 'resolución DNS'],
  [{ name: 'MongoNetworkError', cause: { code: 'ECONNREFUSED', message: fakeUri } }, 'conexión de red'],
  [{ name: 'MongoNetworkTimeoutError' }, 'tiempo de espera'],
  [{ name: 'MongooseServerSelectionError' }, 'tiempo de espera al seleccionar'],
  [{
    name: 'MongooseServerSelectionError',
    reason: { servers: new Map([['host-ficticio.invalid', { error: { code: 'ECONNRESET', message: fakeUri } }]]) }
  }, 'conexión de red']
])('reports a safe connection category (%#)', async (details, category) => {
  const { db, options } = fixture();
  options.connect.mockRejectedValue(Object.assign(new Error(fakeUri), details));
  const failure = await checkPersistence(options).catch(error => error);

  expect(failure.message).toContain('falló connectDB()');
  expect(failure.message).toContain(category);
  expect(failure.stack).not.toMatch(/mongodb(?:\+srv)?:\/\/|usuario-ficticio|clave-ficticia|host-ficticio|base-privada/i);
  expect(failure.cause).toBeUndefined();
  expect(db.listCollections).not.toHaveBeenCalled();
});

test('reports an absent URI through the CLI without opening a connection', () => {
  const result = spawnSync(process.execPath, [
    require.resolve('../scripts/check-persistence'), '--execute'
  ], { encoding: 'utf8', env: { ...process.env, MONGODB_URI: '' } });

  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr.trim()).toBe('CIB-27: falló connectDB(): MONGODB_URI está ausente o vacía.');
});
