import { EVENTS } from '../../index';
import User from '../../../models/User';
import Conversation from '../../../models/Conversation';
import Message from '../../../models/Message';

export default async (io, socket, { conversationId, message }) => {
  const { userId } = socket;

  // TODO: Don't bother sending the message if message is empty (trim?)

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
  io.to(conversationId).emit(EVENTS.conversation.info, con);
};
