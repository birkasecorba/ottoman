import * as socketio from 'socket.io';

import { EVENTS } from '../../index';
import User from '../../../models/User';
import Conversation from '../../../models/Conversation';

type ProjectSocket = socketio.Socket & { userId?: string }

export default async (
  io: socketio.Server,
  socket: ProjectSocket,
  { conversationId },
) => {
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
  io.to(conversationId).emit(EVENTS.conversation.info, con);
};
