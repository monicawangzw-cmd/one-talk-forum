import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

// 管理员手机号列表
const ADMIN_PHONES = ['13734034607'];

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('write error:', filePath, error);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 判断手机号是否是管理员
export function isPhoneAdmin(phone: string): boolean {
  return ADMIN_PHONES.includes(phone);
}

// 判断用户ID是否是管理员
export function isUserAdmin(userId: string): boolean {
  const user = findUserById(userId);
  return user ? ADMIN_PHONES.includes(user.phone) : false;
}

// ============ 用户相关操作 ============

export interface UserRecord {
  id: string;
  phone: string;
  password: string;
  username: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export function getUsers(): UserRecord[] {
  return readJSON<UserRecord[]>(USERS_FILE, []);
}

export function saveUsers(users: UserRecord[]): void {
  writeJSON(USERS_FILE, users);
}

export function findUserByPhone(phone: string): UserRecord | undefined {
  return getUsers().find(u => u.phone === phone);
}

export function findUserById(id: string): UserRecord | undefined {
  return getUsers().find(u => u.id === id);
}

export async function createUser(phone: string, password: string, username: string): Promise<UserRecord> {
  const users = getUsers();
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: UserRecord = {
    id: generateId(),
    phone,
    password: hashedPassword,
    username,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

// ============ 帖子相关操作 ============

export interface PostRecord {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
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
  createdAt: string;
  updatedAt: string;
}

export function getPosts(): PostRecord[] {
  return readJSON<PostRecord[]>(POSTS_FILE, []);
}

export function savePosts(posts: PostRecord[]): void {
  writeJSON(POSTS_FILE, posts);
}

export function createPost(data: {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: 'professional' | 'life';
  subCategory?: string;
  tags: string[];
  attachments?: Attachment[];
}): PostRecord {
  const posts = getPosts();
  const newPost: PostRecord = {
    id: generateId(),
    title: data.title,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    category: data.category,
    subCategory: data.subCategory,
    tags: data.tags || [],
    attachments: data.attachments || [],
    likes: 0,
    likesBy: [],
    comments: 0,
    bookmarks: 0,
    bookmarksBy: [],
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.unshift(newPost);
  savePosts(posts);
  return newPost;
}

export function findPostById(id: string): PostRecord | undefined {
  return getPosts().find(p => p.id === id);
}

export function updatePost(id: string, updates: Partial<PostRecord>): PostRecord | undefined {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() };
  savePosts(posts);
  return posts[index];
}

export function deletePost(id: string): boolean {
  const posts = getPosts();
  const filtered = posts.filter(p => p.id !== id);
  if (filtered.length === posts.length) return false;
  savePosts(filtered);
  const comments = getComments().filter(c => c.postId !== id);
  saveComments(comments);
  return true;
}

export function incrementPostViews(id: string): void {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index !== -1) {
    posts[index].views += 1;
    savePosts(posts);
  }
}

// ============ 评论相关操作 ============

export interface CommentRecord {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string;
  likes: number;
  likesBy: string[];
  createdAt: string;
}

export function getComments(): CommentRecord[] {
  return readJSON<CommentRecord[]>(COMMENTS_FILE, []);
}

export function saveComments(comments: CommentRecord[]): void {
  writeJSON(COMMENTS_FILE, comments);
}

export function createComment(data: {
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string;
}): CommentRecord {
  const comments = getComments();
  const newComment: CommentRecord = {
    id: generateId(),
    content: data.content,
    postId: data.postId,
    authorId: data.authorId,
    authorName: data.authorName,
    parentCommentId: data.parentCommentId,
    likes: 0,
    likesBy: [],
    createdAt: new Date().toISOString(),
  };
  comments.unshift(newComment);
  saveComments(comments);

  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === data.postId);
  if (postIndex !== -1) {
    posts[postIndex].comments += 1;
    savePosts(posts);
  }

  return newComment;
}

export function getCommentsByPostId(postId: string): CommentRecord[] {
  return getComments().filter(c => c.postId === postId);
}