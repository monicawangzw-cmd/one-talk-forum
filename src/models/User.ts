import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  password: string;
  username: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^1[3-9]\d{9}$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
