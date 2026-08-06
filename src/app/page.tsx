'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, User as UserIcon, LogOut, Trash2, Shield, Bell } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import AuthModal from '@/components/AuthModal';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import HotRanking from '@/components/HotRanking';
import UserProfile from '@/components/UserProfile';
import type { Post as PostType, User } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'professional' | 'life'>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [postReturnTarget, setPostReturnTarget] = useState<'none' | 'profile' | 'notifications'>('none');

  useEffect(() => {
    checkAuth();
    loadPosts();
  }, [selectedCategory]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      try {
        const res = await fetch('/api/user', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const latestUser = { ...JSON.parse(savedUser), ...data.user };
            localStorage.setItem('user', JSON.stringify(latestUser));
            setUser(latestUser);
          }
        }
      } catch (err) {}
    }
  };

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications?unread=1', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUnreadCount(data.count || 0);
    } catch (err) {}
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const handleAuth = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUnreadCount(0);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'all' ? '' : selectedCategory;
      const res = await fetch(`/api/posts?category=${category}`);
      const data = await res.json();
      if (res.ok) setPosts(data.posts);
    } catch (err) {
      console.error('加载帖子失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = async (post: PostType) => {
    setSelectedPost(post);
    setComments([]);
    try {
      const res = await fetch(`/api/comments?postId=${post._id}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch (err) {
      console.error('加载评论失败', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost || !commentText.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ postId: selectedPost._id, content: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments([data.comment, ...comments]);
        setCommentText('');
      } else {
        alert(data.error || '评论失败');
      }
    } catch (err) {
      alert('评论失败');
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost || !user) return;
    if (!confirm('确定要删除这个帖子吗？删除后无法恢复。')) return;
    try {
      const res = await fetch(`/api/posts/${selectedPost._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedPost(null);
        loadPosts();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleTogglePin = async () => {
    if (!selectedPost || !user?.isAdmin) return;
    try {
      const res = await fetch(`/api/posts/${selectedPost._id}/pin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedPost({ ...selectedPost, isPinned: data.isPinned });
        loadPosts();
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleReport = async () => {
    if (!user || !selectedPost || !reportReason.trim()) return;
    setReporting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ postId: selectedPost._id, postTitle: selectedPost.title, reason: reportReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowReportModal(false);
        setReportReason('');
        alert('举报已提交，管理员将尽快处理');
      } else {
        alert(data.error || '举报失败');
      }
    } catch (err) {
      alert('举报失败');
    } finally {
      setReporting(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const canDeletePost = (post: PostType) => {
    if (!user) return false;
    return post.author?._id === user.id || user.isAdmin;
  };

  useEffect(() => {
    const handleOpenPost = (e: any) => {
      if (e.detail) {
        handlePostClick(e.detail);
        setPostReturnTarget(e.detail.returnTarget || 'none');
      }
    };
    window.addEventListener('openPost', handleOpenPost);
    return () => window.removeEventListener('openPost', handleOpenPost);
  }, []);

  useEffect(() => {
    const handleRefreshNotif = () => { if (user) fetchUnreadCount(); };
    window.addEventListener('refreshNotifications', handleRefreshNotif);
    return () => window.removeEventListener('refreshNotifications', handleRefreshNotif);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuth={handleAuth} />
      <CreatePost isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} user={user} onPostCreated={loadPosts} />
      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }}
      />

      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent tracking-tight">One Talk</h1>
            <div className="flex-1 max-w-md mx-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索帖子、标签..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button onClick={() => setShowProfile(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="消息通知">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg">
                    <Plus className="w-4 h-4" />发布
                  </button>
                  <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-all" title="个人中心">
                    <span className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                    <span className="font-semibold hidden sm:inline">{user.username}</span>
                    {user.isAdmin && <span className="flex items-center px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full"><Shield className="w-3 h-3" /></span>}
                  </button>
                  <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="退出登录">
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg">
                  <UserIcon className="w-4 h-4" />登录 / 注册
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 animate-gradient-x bg-[length:200%_200%]"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-purple-300/30 rounded-full blur-2xl animate-float-delayed"></div>
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight animate-fade-in-down drop-shadow-lg">有趣的人，都在这里</h2>
          <p className="text-lg md:text-xl text-white/90 mb-6 animate-fade-in-up drop-shadow">专业知识 · 生活服务 · 自由交流</p>
          <div className="flex gap-3 animate-fade-in-up">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/30">✨ 点赞互动</span>
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/30">🔥 实时热点</span>
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/30">💬 自由评论</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-2 p-1 bg-white rounded-xl border shadow-sm">
                {['all', 'professional', 'life'].map((category) => (
                  <button key={category} onClick={() => setSelectedCategory(category as any)} className={cn('flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', selectedCategory === category ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100')}>
                    {category === 'all' ? '📱 全部' : category === 'professional' ? '📚 专业知识' : '🌈 生活服务'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">加载中...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{searchQuery ? '未找到相关帖子' : '暂无帖子'}</h3>
                <p className="text-gray-600">{searchQuery ? '试试其他关键词' : user ? '快来发布第一个帖子吧！' : '登录后发布帖子'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard key={post._id} post={post} user={user} onPostClick={handlePostClick} />
                ))}
              </div>
            )}
          </div>
          <aside className="w-80 flex-shrink-0">
            <HotRanking onPostClick={handlePostClick} />
          </aside>
        </div>
      </main>

      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                    {selectedPost.author?.avatar ? <img src={selectedPost.author.avatar} alt="" className="w-full h-full object-cover" /> : selectedPost.author?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selectedPost.author?.username}</div>
                    <div className="text-sm text-gray-500">{formatRelativeTime(selectedPost.createdAt)}</div>
                  </div>
                  {user && selectedPost.author?._id !== user.id && <FollowButton targetUserId={selectedPost.author._id} />}
                </div>
                <div className="flex items-center gap-1">
                  {postReturnTarget !== 'none' && (
                    <button
                      onClick={() => {
                        setSelectedPost(null);
                        if (postReturnTarget === 'profile') setShowProfile(true);
                        setPostReturnTarget('none');
                      }}
                      className="flex items-center gap-1 px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors text-gray-500 hover:text-purple-600"
                      title="返回"
                    >
                      <span className="text-base">←</span>
                      <span className="text-xs">返回</span>
                    </button>
                  )}
                  <button onClick={() => { setSelectedPost(null); setPostReturnTarget('none'); }} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {selectedPost.isPinned && <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">📌 置顶</span>}
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', selectedPost.category === 'professional' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700')}>
                  {selectedPost.category === 'professional' ? '📚 专业知识' : '🌈 生活服务'}
                </span>
                {selectedPost.subCategory && <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">{selectedPost.subCategory}</span>}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>
              {selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">{selectedPost.tags.map((tag) => <span key={tag} className="text-sm text-purple-600">#{tag}</span>)}</div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{selectedPost.content}</p>
              {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                <div className="mb-6 border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">📎 附件 ({selectedPost.attachments.length})</h3>
                  <div className="space-y-2">
                    {selectedPost.attachments.map((att: any, idx: number) => (
                      <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <span className="text-xl">📄</span>
                        <span className="flex-1 text-sm text-gray-700 truncate">{att.name}</span>
                        <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">💬 评论 ({comments.length})</h3>
                {user && (
                  <form onSubmit={handleCommentSubmit} className="mb-6">
                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} placeholder="写下你的评论..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-2" />
                    <button type="submit" disabled={!commentText.trim()} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium disabled:opacity-50">发表评论</button>
                  </form>
                )}
                <div className="space-y-4">
                  {comments.length === 0 ? <p className="text-gray-400 text-center py-4">暂无评论，快来抢沙发！</p> : comments.map((c) => (
                    <div key={c._id || c.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                        {c.author?.avatar ? <img src={c.author.avatar} alt="" className="w-full h-full object-cover" /> : c.author?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{c.author?.username}</span>
                          <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6 text-gray-600">
                <span>❤️ {selectedPost.likes}</span>
                <span>💬 {selectedPost.comments}</span>
                <span>⭐ {selectedPost.bookmarks}</span>
                <span>👁️ {selectedPost.views}</span>
              </div>
              <div className="flex gap-2">
                {user && selectedPost.author?._id !== user.id && (
                  <button onClick={() => setShowReportModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">⚠️ 举报</button>
                )}
                {user?.isAdmin && (
                  <button onClick={handleTogglePin} className={cn('px-3 py-1.5 rounded-lg text-sm', selectedPost.isPinned ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600')}>📌 {selectedPost.isPinned ? '取消置顶' : '置顶'}</button>
                )}
                {canDeletePost(selectedPost) && (
                  <button onClick={handleDeletePost} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"><Trash2 className="w-4 h-4" />删除</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => { setShowReportModal(false); setReportReason(''); }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ 举报帖子</h3>
            <div className="space-y-2 mb-4">
              {['垃圾广告', '违法违规', '色情低俗', '辱骂攻击', '侵权抄袭', '其他'].map((r) => (
                <button key={r} onClick={() => setReportReason(r)} className={cn('w-full text-left px-4 py-2.5 rounded-lg border', reportReason === r ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-700 hover:border-purple-300')}>{r}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowReportModal(false); setReportReason(''); }} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium">取消</button>
              <button onClick={handleReport} disabled={!reportReason.trim() || reporting} className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium disabled:opacity-50">{reporting ? '提交中...' : '提交举报'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/follow?targetId=${targetUserId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok) setFollowing(data.following);
      } catch (err) {}
    };
    check();
  }, [targetUserId]);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ targetId: targetUserId }),
      });
      const data = await res.json();
      if (res.ok) setFollowing(data.following);
    } catch (err) {}
    setLoading(false);
  };

  return (
    <button onClick={toggle} disabled={loading} className={cn('px-4 py-1.5 rounded-full text-sm font-medium', following ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md')}>
      {loading ? '...' : following ? '已关注' : '+ 关注'}
    </button>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}