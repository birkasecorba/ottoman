// const express = require('express');
import express from 'express';
import http from 'http';
import next from 'next';

// Utils
import dotenv from 'dotenv';
import path from 'path';

// Models
import User from './models/User';
import Conversation from './models/Conversation';
import Message from './models/Message';

// Setup
import setupRedis from './setup/redis';
import setupMongoose from './setup/mongoose';
import setupIO from './socketio';

dotenv.config();

const redisClient = setupRedis();
const mongooseClient = setupMongoose({
  redisClient,
});

mongooseClient.connection.once('open', () => {
  console.log('clearing DB');
  User.collection.drop();
  Conversation.collection.drop();
  Message.collection.drop();
});

// __dirname is not available in modules so this is how you get it
// const __dirname = path.resolve(fileURLToPath(import.meta.url), '..');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({
  dev,
  // Resolves where the output of FE is
  // https://nodejs.org/api/esm.html#esm_import_meta_url
  dir: path.resolve(__dirname, '..'),
});
const nextHandler = nextApp.getRequestHandler();

const app = express();
const server = new http.Server(app);
setupIO(server);

nextApp.prepare().then(() => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('*', (req, res) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
