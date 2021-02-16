import * as socketio from 'socket.io';

import { EVENTS } from '../../index';
import User from '../../../models/User';
import Conversation from '../../../models/Conversation';

// TODO: Move this to .d.ts
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

  const user = await User.get(userId);
  if (!user) {
    console.error({ error: 'NO USER trying to join conversation' });
    return;
  }

  // Use conversationId as a roomId and add
  // current socket to this room
  socket.join(conversationId);

  const conversation = await Conversation.get(conversationId);

  // TODO: is 'socket.emit' unnessary?
  socket.emit(EVENTS.conversation.info, conversation);
  io.to(conversationId).emit(EVENTS.conversation.info, conversation);
};
