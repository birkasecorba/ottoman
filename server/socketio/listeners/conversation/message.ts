import { EVENTS } from '../../index';
import User from '../../../models/User';
import Conversation from '../../../models/Conversation';
import Message from '../../../models/Message';

export default async (io, socket, { conversationId, message }) => {
  const { userId } = socket;

  if (!message.trim()) {
    console.error('Empty message is being sent');
    return;
  }

  const user = await User.get(userId);

  const newMessage = await Message.create({
    user,
    value: message.trim(),
  });

  const conversation = await Conversation.get(conversationId);
  await conversation.addMessage(newMessage);

  io.to(conversationId).emit(EVENTS.conversation.info, conversation);
};
