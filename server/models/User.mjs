import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    // index: true,
  },
});

export default mongoose.model('User', UserSchema);
