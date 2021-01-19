const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const next = require('next');
const cookie = require('cookie');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const app = express();
const server = http.Server(app);
const io = socketio(server);

// Utils
const { v4: uuidv4 } = require('uuid');

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
  socket.on('conversation.search', ({ name }) => {
    const { userId } = cookie.parse(socket.request.headers.cookie || '');

    if (!userId) {
      console.log('ERROR, NO USER ID');
    }

    // eslint-disable-next-line no-param-reassign
    socket.userId = userId;

    const user = {
      id: userId,
      name,
    };

    // Add user to DB if record doesn't exist
    if (!usersDB[user.id]) {
      usersDB[user.id] = user;
    }

    // TODO: Make sure to filter for double entry
    waitlistDB.push({
      ...user,
      // saving this to send conversation
      // info once match is found
      socketId: socket.id,
    });

    const sanitizedWaitlist = waitlistDB.filter((u) => u.id !== user.id);
    const hasWaitingUser = sanitizedWaitlist.length > 0;

    if (hasWaitingUser) {
      const match = sanitizedWaitlist[0];
      waitlistDB = waitlistDB.filter((u) => u.id !== user.id || match.id);

      const conversation = createConversation(user, match);

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

  socket.on('conversation.message', ({ conversationId, message }) => {
    const { userId } = socket;
    const conversation = conversationsDB[conversationId];

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
