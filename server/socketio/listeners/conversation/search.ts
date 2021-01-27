import { EVENTS, promptsDB } from '../../index';
import User from '../../../models/User';
import Conversation from '../../../models/Conversation';

let waitlistDB = [];

export default async (io, socket, { name }) => {
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
    io.of('/').sockets.get(match.socketId).emit(EVENTS.conversation.search, con);
    // We don't need to do the same for the user
    // since the current connection sockeet is our user
    socket.emit(EVENTS.conversation.search, con);
  }
};
