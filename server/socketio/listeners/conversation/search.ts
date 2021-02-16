import { EVENTS } from '../../index';
import User from '../../../models/User';
import Conversation from '../../../models/Conversation';

let waitlistDB = [];

export default async (io, socket, { name }) => {
  const { userId } = socket;
  let user = await User.get(userId);
  console.log('name', name);
  console.log('userId', userId);
  console.log('user', user);

  if (!user) {
    user = await User.create({ name });
  }

  if (!userId) {
    console.log('new user, set cookie:', user, user.id);
    socket.emit('setCookie', { userId: user.id });
  }

  // eslint-disable-next-line no-param-reassign
  socket.userId = user.id;

  // Make sure to filter for double entry
  if (!waitlistDB.find((u) => u.id === user.id)) {
    waitlistDB.push({
      id: user.id,
      name: user.name,
      // saving this to send conversation
      // info once match is found
      socketId: socket.id,
    });
  }

  const sanitizedWaitlist = waitlistDB.filter((u) => u.id !== user.id);
  const hasWaitingUser = sanitizedWaitlist.length > 0;

  if (hasWaitingUser) {
    const match = sanitizedWaitlist[0];
    waitlistDB = waitlistDB.filter((u) => u.id !== user.id && u.id !== match.id);

    const matchFromDB = await User.get(match.id);
    const conversation = await Conversation.createNew({
      users: [user, matchFromDB],
    });

    // Get socket of the matched user and
    // send the conversation information to them
    io.of('/').sockets.get(match.socketId).emit(EVENTS.conversation.search, conversation);
    // We don't need to do the same for the user
    // since the current connection socket is our user
    socket.emit(EVENTS.conversation.search, conversation);
  }
};
