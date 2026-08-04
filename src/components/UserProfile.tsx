'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, FileText, Heart, Bookmark, MessageSquare, Save } from 'lucide-react';
import Modal from './ui/Modal';
import { formatRelativeTime } from '@/lib/utils';
import type { User as UserType } from '@/types';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onUserUpdate: (user: UserType) => void;
}

export default function UserProfile({ isOpen, onClose, user, onUserUpdate }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'liked' | 'bookmarked' | 'comments'>('profile');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 编辑表单
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
      setUsername(user.username);
      setBio(user.bio || '');
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await res.json();
      if (res.ok) {
        setData(result);
      }
    } catch (err) {
      console.error('获取用户数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setMessage('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username, bio }),
      });
      const result = await res.json();
      if (res.ok) {
        onUserUpdate(result.user);
        setMessage('✅ 资料更新成功');
        fetchUserData();
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (err) {
      setMessage('❌ 更新失败');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setMessage('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('✅ 密码修改成功');
        setOldPassword('');
        setNewPassword('');
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (err) {
      setMessage('❌ 修改失败');
    } finally {
      setSavingPassword(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const stats = data?.stats || { posts: 0, liked: 0, bookmarked: 0, comments: 0 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="个人中心" size="lg">
      <div className="p-0">
        {/* 顶部用户信息卡片 */}
        <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-white/80 text-sm">📱 {user?.phone}</p>
              <p className="text-white/60 text-xs mt-1">
                注册于 {user ? formatRelativeTime(user.createdAt) : ''}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.posts}</div>
              <div className="text-xs">我的帖子</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.liked}</div>
              <div className="text-xs">点赞</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.bookmarked}</div>
              <div className="text-xs">收藏</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.comments}</div>
              <div className="text-xs">评论</div>
            </div>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b sticky top-0 bg-white z-10">
          {[
            { key: 'profile', label: '资料设置', icon: User },
            { key: 'posts', label: '我的帖子', icon: FileText },
            { key: 'liked', label: '我的点赞', icon: Heart },
            { key: 'bookmarked', label: '我的收藏', icon: Bookmark },
            { key: 'comments', label: '我的评论', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="p-6 min-h-[300px]">
          {message && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* 资料编辑 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">编辑个人资料</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="请输入昵称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      placeholder="介绍一下自己吧..."
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? '保存中...' : '保存资料'}
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">修改密码</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">原密码</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="请输入原密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="至少6位"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !oldPassword || !newPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    {savingPassword ? '修改中...' : '修改密码'}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'posts' ? (
            <PostList posts={data?.myPosts || []} emptyText="还没有发布过帖子" />
          ) : activeTab === 'liked' ? (
            <PostList posts={data?.myLikedPosts || []} emptyText="还没有点赞过帖子" />
          ) : activeTab === 'bookmarked' ? (
            <PostList posts={data?.myBookmarkedPosts || []} emptyText="还没有收藏过帖子" />
          ) : (
            <div className="space-y-3">
              {(data?.myComments || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  还没有发表过评论
                </div>
              ) : (
                data.myComments.map((comment: any) => (
                  <div key={comment._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-500">评论于：</span>
                      <span className="text-sm font-medium text-purple-600 truncate">
                        {comment.postTitle}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap pl-6">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// 帖子列表子组件
function PostList({ posts, emptyText }: { posts: any[]; emptyText: string }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        {emptyText}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              post.category === 'professional'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-pink-100 text-pink-700'
            }`}>
              {post.category === 'professional' ? '专业知识' : '生活服务'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1 truncate">{post.title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>❤️ {post.likes}</span>
            <span>💬 {post.comments}</span>
            <span>⭐ {post.bookmarks}</span>
          </div>
        </div>
      ))}
    </div>
  );
}