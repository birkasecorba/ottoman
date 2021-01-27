// import { Server } from 'socket.io';

// export default function setupSocketIO(io: Server) {
//   io.on('connection', (socket) => {
//     console.log('socket connected');
//     const { userId: cookieUserId } = cookie.parse(socket.request.headers.cookie || '');
//   });
// }

import path from 'path';
import glob from 'glob';
import http from 'http';
import cookie from 'cookie';

import * as socketio from 'socket.io';

export const EVENTS = {
  setCookie: 'setCookie',
  conversation: {
    info: 'conversation.info',
    search: 'conversation.search',
  },
};

export const promptsDB = [
  'What was the last funny video you saw?',
  'What do you do to get rid of stress?',
  'What is something you are obsessed with?',
];

export const waitlistDB = [];

export default function setupIO(server: http.Server) {
  const io = new socketio.Server(server);

  io.on('connection', (socket) => {
    const { userId: cookieUserId } = cookie.parse(socket.request.headers.cookie || '');

    if (cookieUserId) {
      // eslint-disable-next-line no-param-reassign
      socket.userId = cookieUserId;
    }

    console.log('this is setupIO');
    const listenersPath = path.resolve(__dirname);
    glob(`${listenersPath}/listeners/**/*.ts`, {}, (er, files) => {
      console.log('aaa');
      files.forEach(async (file) => {
        const relativePath = file
          .replace(`${__dirname}/listeners/`, '')
          .replace('.ts', '');
        const listenerName = relativePath.split('/').join('.');
        const listener = await import(file);

        socket.on(listenerName, (args) => listener.default(io, socket, args));
      });
    });
  });

  return io;
}
