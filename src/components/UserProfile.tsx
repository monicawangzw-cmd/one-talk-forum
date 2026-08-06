'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, FileText, Heart, Bookmark, MessageSquare, Save, Shield, Calendar, Camera, Users, Bell } from 'lucide-react';
import Modal from './ui/Modal';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onUserUpdate: (user: UserType) => void;
}

export default function UserProfile({ isOpen, onClose, user, onUserUpdate }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'liked' | 'bookmarked' | 'comments' | 'reports' | 'following' | 'followers' | 'notifications'>('profile');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
      setUsername(user.username);
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('获取通知失败', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('标记已读失败', err);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
    if (isOpen && user?.isAdmin) {
      fetchReports();
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
        setAvatar(result.user?.avatar || '');
      }
    } catch (err) {
      console.error('获取用户数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await res.json();
      if (res.ok) {
        setReports(result.reports || []);
      }
    } catch (err) {
      console.error('获取举报失败', err);
    }
  };

  const handleReportStatus = async (reportId: string, status: 'resolved' | 'dismissed', postId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status, postId }),
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error('处理举报失败', err);
    }
  };

  const handleViewReportedPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      const data = await res.json();
      if (res.ok && data.post) {
        onClose();
        window.dispatchEvent(new CustomEvent('openPost', { detail: { ...data.post, returnTarget: 'profile' } }));
      } else {
        alert('该帖子可能已被删除');
      }
    } catch (err) {
      alert('查看帖子失败');
    }
  };

  // 跳转到通知相关的帖子
  const handleViewNotificationPost = async (postId?: string) => {
    if (!postId) {
      alert('该通知没有关联帖子');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}`);
      const data = await res.json();
      if (res.ok && data.post) {
        onClose();
        window.dispatchEvent(new CustomEvent('openPost', { detail: { ...data.post, returnTarget: 'profile' } }));
      } else {
        alert('该帖子可能已被删除');
      }
    } catch (err) {
      alert('查看帖子失败');
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage('❌ 头像图片不能超过2MB');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
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
        body: JSON.stringify({ username, bio, avatar }),
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

  const stats = data?.stats || { posts: 0, liked: 0, bookmarked: 0, comments: 0, following: 0, followers: 0 };
  const isAdmin = data?.user?.isAdmin || user?.isAdmin;

  const tabs = isAdmin ? [
    { key: 'profile', label: '资料', icon: User, count: 0 },
    { key: 'posts', label: '帖子', icon: FileText, count: stats.posts },
    { key: 'liked', label: '点赞', icon: Heart, count: stats.liked },
    { key: 'bookmarked', label: '收藏', icon: Bookmark, count: stats.bookmarked },
    { key: 'comments', label: '评论', icon: MessageSquare, count: stats.comments },
    { key: 'following', label: '关注', icon: Users, count: stats.following },
    { key: 'followers', label: '粉丝', icon: Users, count: stats.followers },
    { key: 'notifications', label: '通知', icon: Bell, count: unreadCount },
    { key: 'reports', label: '举报', icon: Shield, count: reports.filter(r => r.status === 'pending').length },
  ] : [
    { key: 'profile', label: '资料', icon: User, count: 0 },
    { key: 'posts', label: '帖子', icon: FileText, count: stats.posts },
    { key: 'liked', label: '点赞', icon: Heart, count: stats.liked },
    { key: 'bookmarked', label: '收藏', icon: Bookmark, count: stats.bookmarked },
    { key: 'comments', label: '评论', icon: MessageSquare, count: stats.comments },
    { key: 'following', label: '关注', icon: Users, count: stats.following },
    { key: 'followers', label: '粉丝', icon: Users, count: stats.followers },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="p-0">
        {/* 顶部用户信息卡片 */}
        <div className="relative p-6 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                {avatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg" title="管理员">
                  <Shield className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{user?.username}</h2>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-red-500/90 rounded-full text-xs font-medium">管理员</span>
                )}
              </div>
              <p className="text-white/80 text-sm mt-1">📱 {user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
              <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                注册于 {user ? formatRelativeTime(user.createdAt) : ''}
              </p>
              {user?.bio && (
                <p className="text-white/90 text-sm mt-2 line-clamp-2">{user.bio}</p>
              )}
            </div>
          </div>

          <div className="relative grid grid-cols-6 gap-2 mt-5">
            {[
              { label: '帖子', value: stats.posts, icon: FileText },
              { label: '点赞', value: stats.liked, icon: Heart },
              { label: '收藏', value: stats.bookmarked, icon: Bookmark },
              { label: '评论', value: stats.comments, icon: MessageSquare },
              { label: '关注', value: stats.following, icon: Users },
              { label: '粉丝', value: stats.followers, icon: Users },
            ].map((item) => (
              <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                <item.icon className="w-3 h-3 mx-auto mb-0.5 opacity-80" />
                <div className="text-lg font-bold leading-tight">{item.value}</div>
                <div className="text-[10px] text-white/70">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex-1 min-w-[55px] flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-medium border-b-2 transition-all relative',
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute top-2 right-1/4 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] leading-none">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="p-6 min-h-[300px]">
          {message && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 animate-fade-in-down">
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-gray-400">加载中...</p>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md flex items-center justify-center bg-gray-50 text-2xl font-bold text-gray-400">
                    {avatar ? (
                      <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                    ) : (
                      user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white hover:bg-purple-700 transition-all"
                    title="更换头像"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">头像</h3>
                  <p className="text-sm text-gray-500">点击相机图标上传图片</p>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG，最大2MB</p>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="text-xs text-red-500 hover:text-red-600 mt-1"
                    >
                      移除头像
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">编辑个人资料</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50/50"
                      placeholder="请输入昵称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none bg-gray-50/50"
                      placeholder="介绍一下自己吧..."
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? '保存中...' : '保存资料'}
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900">修改密码</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">原密码</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50/50"
                      placeholder="请输入原密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50/50"
                      placeholder="至少6位"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !oldPassword || !newPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          ) : activeTab === 'comments' ? (
            <div className="space-y-3">
              {(data?.myComments || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  还没有发表过评论
                </div>
              ) : (
                data.myComments.map((comment: any) => (
                  <div key={comment._id} className="relative p-4 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-purple-200 transition-all overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-pink-400"></div>
                    <div className="flex items-center gap-2 mb-2 pl-2">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-500">评论于</span>
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
          ) : activeTab === 'following' ? (
            <UserList users={data?.followingUsers || []} emptyText="还没有关注的人" />
          ) : activeTab === 'followers' ? (
            <UserList users={data?.followerUsers || []} emptyText="还没有粉丝" />
          ) : activeTab === 'notifications' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('profile')} className="flex items-center gap-1 px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors text-gray-500 hover:text-purple-600" title="返回资料">
                    <span className="text-base">←</span>
                    <span className="text-xs">返回</span>
                  </button>
                  <h3 className="font-semibold text-gray-900 text-sm">消息通知</h3>
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                    全部已读
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  暂无通知
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleViewNotificationPost(n.postId)}
                    className={`relative p-3 bg-white rounded-xl border ${!n.read ? 'border-purple-200 bg-purple-50/30' : 'border-gray-100'} overflow-hidden cursor-pointer hover:shadow-md transition-all`}
                  >
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
                    <div className="flex items-start gap-2 pl-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {n.actorAvatar ? <img src={n.actorAvatar} alt="" className="w-full h-full object-cover" /> : n.actorName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{n.actorName}</span>
                          <span className="text-gray-500"> {n.content}</span>
                        </p>
                        {n.postTitle && <p className="text-xs text-gray-400 truncate mt-0.5">《{n.postTitle}》</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'reports' && isAdmin ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setActiveTab('profile')} className="flex items-center gap-1 px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors text-gray-500 hover:text-purple-600" title="返回资料">
                  <span className="text-base">←</span>
                  <span className="text-xs">返回</span>
                </button>
                <h3 className="font-semibold text-gray-900 text-sm">举报管理</h3>
              </div>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  暂无举报记录
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="relative p-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-orange-400"></div>
                    <div className="flex items-center gap-2 mb-2 pl-2">
                      <button
                        onClick={() => handleViewReportedPost(report.postId)}
                        className="text-sm font-medium text-gray-900 truncate hover:text-purple-600 hover:underline transition-colors text-left"
                        title="点击查看帖子"
                      >
                        {report.postTitle}
                      </button>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs flex-shrink-0',
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      )}>
                        {report.status === 'pending' ? '待处理' : report.status === 'resolved' ? '已处理' : '已驳回'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1 pl-2">举报人：{report.reporterName}</p>
                    <p className="text-sm text-gray-700 pl-2 mb-3">原因：{report.reason}</p>
                    {report.status === 'pending' && (
                      <div className="flex gap-2 pl-2">
                        <button
                          onClick={() => {
                            if (confirm('确定处理此举报吗？该帖子将被自动删除。')) {
                              handleReportStatus(report.id, 'resolved', report.postId);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-all"
                        >
                          处理（删帖）
                        </button>
                        <button
                          onClick={() => handleReportStatus(report.id, 'dismissed', report.postId)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all"
                        >
                          忽略
                        </button>
                        <button
                          onClick={() => handleViewReportedPost(report.postId)}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-all"
                        >
                          查看帖子
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : null}
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
      {posts.map((post) => {
        const isProfessional = post.category === 'professional';
        return (
          <div key={post._id} className="relative p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer overflow-hidden">
            <div className={cn(
              'absolute left-0 top-0 bottom-0 w-1',
              isProfessional ? 'bg-gradient-to-b from-purple-400 to-purple-500' : 'bg-gradient-to-b from-pink-400 to-pink-500'
            )}></div>
            <div className="flex items-center gap-2 mb-2 pl-2">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                isProfessional ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-600'
              )}>
                {isProfessional ? '专业知识' : '生活服务'}
              </span>
              {post.subCategory && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                  {post.subCategory}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 truncate pl-2">{post.title}</h4>
            <p className="text-sm text-gray-500 line-clamp-2 pl-2 mb-2">{post.content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 pl-2">
              <span>❤️ {post.likes}</span>
              <span>💬 {post.comments}</span>
              <span>⭐ {post.bookmarks}</span>
              <span>👁️ {post.views}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 用户列表子组件（关注/粉丝）
function UserList({ users, emptyText }: { users: any[]; emptyText: string }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        {emptyText}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100 transition-all">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
            {u.avatar ? (
              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              u.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{u.username}</div>
            {u.bio && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{u.bio}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}