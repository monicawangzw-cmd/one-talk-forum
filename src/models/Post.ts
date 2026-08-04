import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: 'professional' | 'life';
  tags: string[];
  likes: number;
  likesBy: mongoose.Types.ObjectId[];
  comments: number;
  bookmarks: number;
  bookmarksBy: mongoose.Types.ObjectId[];
  views: number;
  isHot: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      minlength: 10,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['professional', 'life'],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likesBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    comments: {
      type: Number,
      default: 0,
    },
    bookmarks: {
      type: Number,
      default: 0,
    },
    bookmarksBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    isHot: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ hotScore: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
