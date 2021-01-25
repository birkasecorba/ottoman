import mongoose from 'mongoose';

import { IUser } from './User';

export interface IMessage extends mongoose.Document {
  user: Array<IUser>,
  value: string;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  user: {
    type: 'ObjectId',
    ref: 'User',
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

export default mongoose.model('Message', MessageSchema);
