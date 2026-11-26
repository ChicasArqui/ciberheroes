const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');

function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET no está configurada');
  }

  const store = MongoStore.create({
    clientPromise: Promise.resolve(mongoose.connection.getClient()),
    collectionName: 'sessions',
    ttl: 60 * 60
  });

  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    name: 'ciberheroes.sid',
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    }
  });
}

module.exports = { createSessionMiddleware };