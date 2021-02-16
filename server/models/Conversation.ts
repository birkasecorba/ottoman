import mongoose from 'mongoose';

import { IMessage } from './Message';
import { IUser } from './User';

// TODO: Move this to somewhere better
import { promptsDB } from '../socketio/index';

export interface IConversation extends mongoose.Document {
  users: Array<IUser>,
  messages: Array<IMessage>,
  prompt: string;
  createdAt: Date,
  addMessage(message: IMessage): Promise<IConversation>
}
export interface IConversationModel extends mongoose.Model<IConversation> {
  get(id: string): Promise<IConversation>,
  createNew({ users }: { users: Array<IUser> }): Promise<IConversation>,
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

ConversationSchema.statics.get = function get(id) {
  return this.findById(id)
    .populate('users')
    .populate({
      path: 'messages',
      populate: { path: 'user' },
    })
    .exec();
};

ConversationSchema.statics.createNew = function createNew({ users }) {
  return this.create({
    users,
    messages: [],
    prompt: promptsDB[Math.floor(Math.random() * promptsDB.length)],
  });
};

ConversationSchema.methods.addMessage = function addMessage(message) {
  this.messages.push(message);
  return this.save();
};

export default mongoose.model<IConversation, IConversationModel>(
  'Conversation',
  ConversationSchema,
);
