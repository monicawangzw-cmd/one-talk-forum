import bcrypt from 'bcryptjs';
import { getItem, setItem } from './storage';

export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

// 管理员手机号列表
const ADMIN_PHONES = ['13734034607'];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function isPhoneAdmin(phone: string): boolean {
  return ADMIN_PHONES.includes(phone);
}

export function isUserAdmin(userId: string): boolean {
  // 异步检查的简化版：在登录时已经返回了 isAdmin，这里用同步方式无法查DB
  // 实际管理员判断在各API中用 phone 判断
  return false;
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

export async function getUsers(): Promise<UserRecord[]> {
  return getItem<UserRecord[]>('users', []);
}

export async function saveUsers(users: UserRecord[]): Promise<void> {
  await setItem('users', users);
}

export async function findUserByPhone(phone: string): Promise<UserRecord | undefined> {
  const users = await getUsers();
  return users.find(u => u.phone === phone);
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

export async function createUser(phone: string, password: string, username: string): Promise<UserRecord> {
  const users = await getUsers();
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: UserRecord = {
    id: generateId(),
    phone,
    password: hashedPassword,
    username,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

// 根据userId异步判断管理员
export async function isUserAdminAsync(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  return user ? ADMIN_PHONES.includes(user.phone) : false;
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
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getPosts(): Promise<PostRecord[]> {
  return getItem<PostRecord[]>('posts', []);
}

export async function savePosts(posts: PostRecord[]): Promise<void> {
  await setItem('posts', posts);
}

export async function createPost(data: {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: 'professional' | 'life';
  subCategory?: string;
  tags: string[];
  attachments?: Attachment[];
}): Promise<PostRecord> {
  const posts = await getPosts();
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
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.unshift(newPost);
  await savePosts(posts);
  return newPost;
}

export async function findPostById(id: string): Promise<PostRecord | undefined> {
  const posts = await getPosts();
  return posts.find(p => p.id === id);
}

export async function updatePost(id: string, updates: Partial<PostRecord>): Promise<PostRecord | undefined> {
  const posts = await getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() };
  await savePosts(posts);
  return posts[index];
}

export async function deletePost(id: string): Promise<boolean> {
  const posts = await getPosts();
  const filtered = posts.filter(p => p.id !== id);
  if (filtered.length === posts.length) return false;
  await savePosts(filtered);
  const comments = (await getComments()).filter(c => c.postId !== id);
  await saveComments(comments);
  return true;
}

export async function incrementPostViews(id: string): Promise<void> {
  const posts = await getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index !== -1) {
    posts[index].views += 1;
    await savePosts(posts);
  }
}

export async function togglePostPin(id: string): Promise<PostRecord | undefined> {
  const posts = await getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  posts[index].isPinned = !posts[index].isPinned;
  posts[index].updatedAt = new Date().toISOString();
  await savePosts(posts);
  return posts[index];
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

export async function getComments(): Promise<CommentRecord[]> {
  return getItem<CommentRecord[]>('comments', []);
}

export async function saveComments(comments: CommentRecord[]): Promise<void> {
  await setItem('comments', comments);
}

export async function createComment(data: {
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string;
}): Promise<CommentRecord> {
  const comments = await getComments();
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
  await saveComments(comments);

  const posts = await getPosts();
  const postIndex = posts.findIndex(p => p.id === data.postId);
  if (postIndex !== -1) {
    posts[postIndex].comments += 1;
    await savePosts(posts);
  }

  return newComment;
}

export async function getCommentsByPostId(postId: string): Promise<CommentRecord[]> {
  const comments = await getComments();
  return comments.filter(c => c.postId === postId);
}