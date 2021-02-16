import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  name: string;
}
export interface IUserModel extends mongoose.Model<IUser> {
  get(id: string): Promise<IUser>
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
    // index: true,
  },
});

UserSchema.statics.get = function get(id) {
  return this.findById(id).cache(20, id).exec();
};

const model = mongoose.model<IUser, IUserModel>('User', UserSchema);
export default model;
