import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
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
  // prompt: {
  //   type: 'ObjectId',
  //   ref: 'Prompt',
  // },
  prompt: {
    type: String,
    required: true,
  },
});

export default mongoose.model('Conversation', ConversationSchema);
