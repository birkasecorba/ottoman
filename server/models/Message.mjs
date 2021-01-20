import mongoose from 'mongoose';

// type Message = {
//   userId: <userId>,
//   message: string,
// }

const UserSchema = new mongoose.Schema({
  user: [{
    type: 'ObjectId',
    ref: 'User',
    required: true,
  }],
  value: {
    type: String,
    required: true,
  },
});

export default mongoose.model('User', UserSchema);
