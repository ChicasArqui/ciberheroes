const { randomUUID } = require('node:crypto');

const databaseName = 'ciberheroes_dev';
const writeOptions = { writeConcern: { w: 'majority' } };
const readOptions = { readPreference: 'primary' };

const dnsCodes = new Set(['ENOTFOUND', 'ENODATA', 'EAI_AGAIN', 'EAI_FAIL', 'ESERVFAIL', 'EREFUSED', 'EFORMERR']);
const networkCodes = new Set(['ECONNREFUSED', 'ECONNRESET', 'ECONNABORTED', 'EHOSTUNREACH', 'ENETUNREACH', 'EPIPE']);

function connectionDiagnostic(error) {
  const pending = [error];
  const visited = new Set();
  let fallback = 'error de conexión sin clasificar.';
  let timedOut = false;

  while (pending.length) {
    const detail = pending.pop();
    if (!detail || typeof detail !== 'object' || visited.has(detail)) {
      continue;
    }
    visited.add(detail);

    const { name, code, codeName, syscall, message, cause, reason } = detail;
    if (name === 'MongoParseError' || name === 'MongoInvalidArgumentError' || code === 'ERR_INVALID_URL') {
      return 'MONGODB_URI es inválida.';
    }
    // Atlas can report bad credentials with a generic server error code.
    if (code === 18 || codeName === 'AuthenticationFailed'
      || (name === 'MongoServerError' && /\bbad auth\b|\bauthentication failed\b/i.test(message))) {
      return 'autenticación rechazada. Revisa las credenciales y authSource.';
    }
    if (dnsCodes.has(code) || /^(querySrv|queryTxt|getaddrinfo)$/.test(syscall)) {
      return 'falló la resolución DNS.';
    }
    if (networkCodes.has(code)) {
      return 'falló la conexión de red.';
    }
    if (code === 'ETIMEDOUT' || name === 'MongoNetworkTimeoutError' || name === 'MongoOperationTimeoutError') {
      return 'se agotó el tiempo de espera.';
    }

    if (name === 'MongoServerSelectionError' || name === 'MongooseServerSelectionError') {
      timedOut = true;
    }
    if (name === 'MongoNetworkError') {
      fallback = 'falló la conexión de red.';
    }

    if (reason?.servers instanceof Map) {
      for (const server of reason.servers.values()) {
        pending.push(server.error);
      }
    }
    pending.push(reason, cause);
  }

  return timedOut && fallback === 'error de conexión sin clasificar.'
    ? 'se agotó el tiempo de espera al seleccionar un servidor.'
    : fallback;
}

async function checkPersistence({ connect, connection }) {
  const runId = randomUUID();
  const collectionName = 'cib27_persistence_check_' + runId.replace(/-/g, '');
  const document = { _id: runId, runId, purpose: 'cib27-persistence-check', value: 27 };
  const filter = { _id: runId, runId };
  let stage = 'comprobación de la colección exclusiva';
  let cleanupFailed = false;

  try {
    await connect();
  } catch (error) {
    throw new Error('CIB-27: falló connectDB(): ' + connectionDiagnostic(error));
  }

  if (connection.db?.databaseName !== databaseName) {
    throw new Error('CIB-27: base inesperada. Se esperaba ciberheroes_dev.');
  }

  try {
    const exists = await connection.db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();
    if (exists) {
      throw new Error('La colección ya existe');
    }

    const collection = connection.db.collection(collectionName);
    try {
      stage = 'escritura';
      const result = await collection.insertOne({ ...document }, writeOptions);
      if (!result.acknowledged || result.insertedId !== runId) {
        throw new Error('Inserción no confirmada');
      }

      stage = 'lectura y verificación';
      const stored = await collection.findOne(filter, readOptions);
      const matches = stored
        && stored._id === document._id
        && stored.runId === document.runId
        && stored.purpose === document.purpose
        && stored.value === document.value;
      if (!matches) {
        throw new Error('El documento leído no coincide');
      }
    } finally {
      // An insert may reach the server even when the client receives an error.
      try {
        const deleted = await collection.deleteOne(filter, writeOptions);
        cleanupFailed = !deleted.acknowledged || Boolean(await collection.findOne(filter, readOptions));
      } catch {
        cleanupFailed = true;
      }
    }

    if (cleanupFailed) {
      throw new Error('Falló la limpieza');
    }

    return { collectionName, runId };
  } catch {
    const failure = cleanupFailed ? 'limpieza no confirmada' : stage;
    throw new Error('CIB-27: fallo en ' + failure + '. Colección: ' + collectionName + '. ID: ' + runId + '.');
  }
}

async function main() {
  if (process.argv[2] !== '--execute' || process.argv.length !== 3) {
    console.error('Uso: node backend/scripts/check-persistence.js --execute');
    process.exitCode = 1;
    return;
  }

  const mongoose = require('mongoose');
  const { connectDB } = require('../src/config/database');
  let result;

  try {
    if (!process.env.MONGODB_URI?.trim()) {
      throw new Error('CIB-27: falló connectDB(): MONGODB_URI está ausente o vacía.');
    }
    result = await checkPersistence({ connect: connectDB, connection: mongoose.connection });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      console.error('CIB-27: no se pudo confirmar el cierre de la conexión.');
      process.exitCode = 1;
    }
  }

  if (result && !process.exitCode) {
    console.log('Escritura, lectura y limpieza verificadas. Colección: ' + result.collectionName + '. ID: ' + result.runId + '.');
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('CIB-27: no se pudo iniciar la prueba.');
    process.exitCode = 1;
  });
}

module.exports = { checkPersistence };
