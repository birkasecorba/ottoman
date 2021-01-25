import mongoose from 'mongoose';

import { IMessage } from './Message';
import { IUser } from './User';

export interface IConversation extends mongoose.Document {
  user: Array<IUser>,
  messages: Array<IMessage>,
  prompt: string;
  createdAt: Date,
}

const ConversationSchema = new mongoose.Schema<IConversation>({
  users: [{
    type: 'ObjectId',
    ref: 'User',
    required: true,
  }],
  messages: [{
    type: 'ObjectId',
    ref: 'Message',
    required: true,
  }],
  prompt: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

export default mongoose.model('Conversation', ConversationSchema);
