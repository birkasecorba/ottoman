// const express = require('express');
import express from 'express';
import http from 'http';
import * as socketio from 'socket.io';
import next from 'next';
import cookie from 'cookie';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Utils
import { v4 as uuidv4 } from 'uuid';

// Models
import User from './models/User.mjs';
import Conversation from './models/Conversation.mjs';

dotenv.config();

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.resolve(fileURLToPath(import.meta.url), '..');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({
  dev,
  // https://nodejs.org/api/esm.html#esm_import_meta_url
  dir: path.resolve(__dirname, '..'),
});
const nextHandler = nextApp.getRequestHandler();

const app = express();
const server = http.Server(app);
const io = new socketio.Server(server);

const url = `mongodb+srv://birkasecorba:${process.env.MONGO_PASS}@cluster0.to7hl.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  // we're connected!
  console.log('connected');
});

// Fake DB
// type Conversation = {
//   id: string,
//   users: [User],
//   messages: [Message],
//   prompt: Prompt
// }

// type User = {
//   id: string,
//   name: string,
// }

// type Message = {
//   userId: <userId>,
//   message: string,
// }

// type Waitlist = [User]

// list of questions
// type Prompt = ENUM[string];

const conversationsDB = {};
const usersDB = {};
const promptsDB = [
  'What was the last funny video you saw?',
  'What do you do to get rid of stress?',
  'What is something you are obsessed with?',
];

let waitlistDB = [];

function createConversation(...users) {
  const conversationId = uuidv4();

  const conversation = {
    id: conversationId,
    users: [...users],
    messages: [],
    prompt: promptsDB[Math.floor(Math.random() * promptsDB.length)],
  };

  conversationsDB[conversationId] = conversation;
  return conversation;
}

// socket.io server
io.on('connection', (socket) => {
  socket.on('conversation.search', async ({ name }) => {
    const { userId } = cookie.parse(socket.request.headers.cookie || '');

    if (!userId) {
      console.log('ERROR, NO USER ID');
    }

    // eslint-disable-next-line no-param-reassign
    socket.userId = userId;

    const user = {
      _id: userId,
      name,
    };

    // Add user to DB if record doesn't exist
    if (!usersDB[user._id]) {
      usersDB[user._id] = user;
    }

    const userFromDB = await User.findById(userId).exec();
    if (!userFromDB) {
      await User.create(user);
    }

    // TODO: Make sure to filter for double entry
    waitlistDB.push({
      ...user,
      // saving this to send conversation
      // info once match is found
      socketId: socket.id,
    });

    const sanitizedWaitlist = waitlistDB.filter((u) => u._id !== user._id);
    const hasWaitingUser = sanitizedWaitlist.length > 0;

    if (hasWaitingUser) {
      const match = sanitizedWaitlist[0];
      waitlistDB = waitlistDB.filter((u) => u._id !== user._id && u._id !== match._id);
      const conversation = createConversation(user, match);

      const matchFromDB = await User.findById(match._id).exec();
      await Conversation.create({
        users: [userFromDB, matchFromDB],
        messages: [],
        prompt: promptsDB[Math.floor(Math.random() * promptsDB.length)],
      });

      // Get socket of the matched user and
      // send the conversation information to them
      io.of('/').sockets.get(match.socketId).emit('conversation.search', conversation);
      // We don't need to do the same for the user
      // since the current connection sockeet is our user
      socket.emit('conversation.search', conversation);
    }
  });

  socket.on('conversation.join', ({ conversationId }) => {
    const { userId } = socket;
    console.log('userId', userId);

    if (!usersDB[userId]) {
      console.error('NO USER trying to join conversation');
      return;
    }

    socket.join(conversationId);

    const conversation = conversationsDB[conversationId];
    socket.emit('conversation.info', conversation);
    io.to(conversationId).emit('conversation.info', conversation);
  });

  socket.on('conversation.message', async ({ conversationId, message }) => {
    const { userId } = socket;
    const conversation = conversationsDB[conversationId];

    const con = await Conversation.getById(conversationId);
    con.messages.push(con);
    await con.save();

    conversation.messages.push({
      value: message,
      user: usersDB[userId],
      id: uuidv4(),
    });

    io.to(conversationId).emit('conversation.info', conversation);
  });
});

nextApp.prepare().then(() => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('*', (req, res) => nextHandler(req, res));

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
