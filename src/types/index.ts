export interface User {
  id: string;
  phone: string;
  username: string;
  avatar?: string;
  bio?: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  category: 'professional' | 'life';
  subCategory?: string;
  tags: string[];
  attachments: Attachment[];
  likes: number;
  likesBy: string[];
  comments: number;
  bookmarks: number;
  bookmarksBy: string[];
  views: number;
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  post: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  parentComment?: {
    _id: string;
    author: {
      username: string;
    };
  };
  likes: number;
  likesBy: string[];
  createdAt: string;
  updatedAt: string;
}
