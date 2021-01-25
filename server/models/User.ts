import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  name: string;
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
    // index: true,
  },
});

export default mongoose.model('User', UserSchema);
