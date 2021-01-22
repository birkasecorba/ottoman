import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // index: true,
  },
});

export default mongoose.model('User', UserSchema);
