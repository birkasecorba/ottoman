// const express = require('express');
import express from 'express';
import http from 'http';
import * as socketio from 'socket.io';
import next from 'next';

// Utils
import dotenv from 'dotenv';
import cookie from 'cookie';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import User from './models/User';
import Conversation from './models/Conversation';
import Message from './models/Message';

// Helpers
import setupRedis from './setupRedis';
import setupMongoose from './setupMongoose';

dotenv.config();

const redisClient = setupRedis();
const mongooseClient = setupMongoose({
  redisClient,
});

mongooseClient.connection.once('open', () => {
  console.log('clearing DB');
  User.deleteMany({});
  Conversation.deleteMany({});
  Message.deleteMany({});
});

// __dirname is not available in modules so this is how you get it
const __dirname = path.resolve(fileURLToPath(import.meta.url), '..');

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
const io = new socketio.Server(server);

// Fake DB
// type Waitlist = [User]

// list of questions
// type Prompt = ENUM[string];

const promptsDB = [
  'What was the last funny video you saw?',
  'What do you do to get rid of stress?',
  'What is something you are obsessed with?',
];

let waitlistDB = [];

// socket.io server
io.on('connection', (socket) => {
  console.log('socket connected');
  const { userId: cookieUserId } = cookie.parse(socket.request.headers.cookie || '');

  if (cookieUserId) {
    // eslint-disable-next-line no-param-reassign
    socket.userId = cookieUserId;
  }

  socket.on('conversation.search', async ({ name }) => {
    const { userId } = socket;

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { name },
      {
        upsert: true,
        new: true,
      },
    ).cache(20, userId).exec();

    if (!userId) {
      socket.emit('setCookie', { userId: user.id });
    }
    // eslint-disable-next-line no-param-reassign
    socket.userId = user._id;

    // Make sure to filter for double entry
    if (!waitlistDB.find((u) => u._id === user._id)) {
      waitlistDB.push({
        _id: user._id,
        name: user.name,
        // saving this to send conversation
        // info once match is found
        socketId: socket.id,
      });
    }

    const sanitizedWaitlist = waitlistDB.filter((u) => u._id !== user._id);
    const hasWaitingUser = sanitizedWaitlist.length > 0;

    if (hasWaitingUser) {
      const match = sanitizedWaitlist[0];
      waitlistDB = waitlistDB.filter((u) => u._id !== user._id && u._id !== match._id);

      const matchFromDB = await User.findById(match._id).exec();
      const con = await Conversation.create({
        users: [user, matchFromDB],
        messages: [],
        prompt: promptsDB[Math.floor(Math.random() * promptsDB.length)],
      });

      // Get socket of the matched user and
      // send the conversation information to them
      io.of('/').sockets.get(match.socketId).emit('conversation.search', con);
      // We don't need to do the same for the user
      // since the current connection sockeet is our user
      socket.emit('conversation.search', con);
    }
  });

  socket.on('conversation.join', async ({ conversationId }) => {
    const { userId } = socket;

    if (!userId) {
      console.error({ error: 'No userId on socket' });
      return;
    }

    const user = await User.findById(userId).cache(20, userId).exec();
    if (!user) {
      console.error({ error: 'NO USER trying to join conversation' });
      return;
    }

    socket.join(conversationId);

    const con = await Conversation.findById(conversationId)
      .populate('users')
      .populate({
        path: 'messages',
        populate: { path: 'user' },
      })
      .exec();
    socket.emit('conversation.info', con);
    io.to(conversationId).emit('conversation.info', con);
  });

  socket.on('conversation.message', async ({ conversationId, message }) => {
    const { userId } = socket;

    const user = await User.findById(userId).exec();

    const newMessage = await Message.create({
      user,
      value: message,
    });
    const con = await Conversation.findById(conversationId)
      .populate('users')
      .populate({
        path: 'messages',
        populate: { path: 'user' },
      })
      .exec();

    con.messages.push(newMessage);

    await con.save();
    io.to(conversationId).emit('conversation.info', con);
  });
});

nextApp.prepare().then(() => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('*', (req, res) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
