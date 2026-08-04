'use client';

import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp, Award } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Post } from '@/types';

interface HotRankingProps {
  onPostClick: (post: Post) => void;
}

export default function HotRanking({ onPostClick }: HotRankingProps) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'professional' | 'life'>('all');

  useEffect(() => {
    fetchHotPosts();
  }, []);

  const fetchHotPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts/hot');
      const data = await res.json();
      if (res.ok) {
        setAllPosts(data.posts || []);
      }
    } catch (err) {
      console.error('获取热点榜失败', err);
    } finally {
      setLoading(false);
    }
  };

  // 根据当前 tab 在前端筛选
  const displayPosts = activeTab === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === activeTab);

  const topPosts = displayPosts.slice(0, 10);

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 1: return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 2: return 'bg-gradient-to-r from-orange-600 to-orange-700';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-6 h-6" />
          <h2 className="text-xl font-bold">🔥 实时热点榜</h2>
          <TrendingUp className="w-5 h-5 opacity-80" />
        </div>

        <div className="flex gap-2">
          {(['all', 'professional', 'life'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'professional' ? '📚 专业知识' : '🌈 生活服务'}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : topPosts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {activeTab === 'all' ? '暂无热门帖子' : '该领域暂无热门帖子'}
          </div>
        ) : (
          topPosts.map((post, index) => (
            <div
              key={post._id}
              onClick={() => onPostClick(post)}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getRankColor(index)} flex items-center justify-center text-white font-bold text-sm`}>
                  {index < 3 ? index + 1 : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 truncate">
                    {post.title}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded ${
                      post.category === 'professional'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-pink-100 text-pink-600'
                    }`}>
                      {post.category === 'professional' ? '专业' : '生活'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>❤️</span>
                      {post.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💬</span>
                      {post.comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⭐</span>
                      {post.bookmarks}
                    </div>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>

                {index < 3 && (
                  <Award className={`w-6 h-6 flex-shrink-0 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-500'}`} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
        共 {topPosts.length} 条热门内容
      </div>
    </div>
  );
}