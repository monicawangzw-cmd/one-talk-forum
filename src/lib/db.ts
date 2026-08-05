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

// ============ 举报相关操作 ============

export interface ReportRecord {
  id: string;
  postId: string;
  postTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export async function getReports(): Promise<ReportRecord[]> {
  return getItem<ReportRecord[]>('reports', []);
}

export async function saveReports(reports: ReportRecord[]): Promise<void> {
  await setItem('reports', reports);
}

export async function createReport(data: {
  postId: string;
  postTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
}): Promise<ReportRecord> {
  const reports = await getReports();
  const newReport: ReportRecord = {
    id: generateId(),
    postId: data.postId,
    postTitle: data.postTitle,
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    reason: data.reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  reports.unshift(newReport);
  await saveReports(reports);
  return newReport;
}

export async function updateReportStatus(id: string, status: 'resolved' | 'dismissed'): Promise<ReportRecord | undefined> {
  const reports = await getReports();
  const index = reports.findIndex(r => r.id === id);
  if (index === -1) return undefined;
  reports[index].status = status;
  await saveReports(reports);
  return reports[index];
}

export async function hasUserReported(userId: string, postId: string): Promise<boolean> {
  const reports = await getReports();
  return reports.some(r => r.reporterId === userId && r.postId === postId);
}

// ============ 关注相关操作 ============

export interface FollowRecord {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export async function getFollows(): Promise<FollowRecord[]> {
  return getItem<FollowRecord[]>('follows', []);
}

export async function saveFollows(follows: FollowRecord[]): Promise<void> {
  await setItem('follows', follows);
}

// 关注/取消关注（切换）
export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  const follows = await getFollows();
  const existing = follows.find(f => f.followerId === followerId && f.followingId === followingId);
  if (existing) {
    // 已关注，取消
    const filtered = follows.filter(f => !(f.followerId === followerId && f.followingId === followingId));
    await saveFollows(filtered);
    return false;
  } else {
    // 未关注，添加
    follows.unshift({
      id: generateId(),
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    });
    await saveFollows(follows);
    return true;
  }
}

// 是否已关注
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follows = await getFollows();
  return follows.some(f => f.followerId === followerId && f.followingId === followingId);
}

// 获取我关注的人ID列表
export async function getFollowingIds(userId: string): Promise<string[]> {
  const follows = await getFollows();
  return follows.filter(f => f.followerId === userId).map(f => f.followingId);
}

// 获取关注我的人ID列表（粉丝）
export async function getFollowerIds(userId: string): Promise<string[]> {
  const follows = await getFollows();
  return follows.filter(f => f.followingId === userId).map(f => f.followerId);
}

// ============ 通知相关操作 ============

export interface NotificationRecord {
  id: string;
  userId: string;        // 接收通知的用户
  actorId: string;       // 触发通知的用户
  actorName: string;
  actorAvatar?: string;
  type: 'like' | 'comment' | 'follow';
  content: string;       // 通知描述
  postId?: string;       // 相关帖子（点赞/评论）
  postTitle?: string;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<NotificationRecord[]> {
  return getItem<NotificationRecord[]>('notifications', []);
}

export async function saveNotifications(notifications: NotificationRecord[]): Promise<void> {
  await setItem('notifications', notifications);
}

export async function createNotification(data: {
  userId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  type: 'like' | 'comment' | 'follow';
  content: string;
  postId?: string;
  postTitle?: string;
}): Promise<void> {
  // 不给自己发通知
  if (data.userId === data.actorId) return;

  const notifications = await getNotifications();
  notifications.unshift({
    id: generateId(),
    userId: data.userId,
    actorId: data.actorId,
    actorName: data.actorName,
    actorAvatar: data.actorAvatar,
    type: data.type,
    content: data.content,
    postId: data.postId,
    postTitle: data.postTitle,
    read: false,
    createdAt: new Date().toISOString(),
  });
  await saveNotifications(notifications);
}

export async function getNotificationsByUser(userId: string): Promise<NotificationRecord[]> {
  const notifications = await getNotifications();
  return notifications.filter(n => n.userId === userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter(n => n.userId === userId && !n.read).length;
}

export async function markAllRead(userId: string): Promise<void> {
  const notifications = await getNotifications();
  notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  await saveNotifications(notifications);
}