'use client';

import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp, Crown } from 'lucide-react';
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

  const displayPosts = activeTab === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === activeTab);

  const topPosts = displayPosts.slice(0, 10);

  // 计算热度分数
  const getScore = (post: Post) => post.likes + post.comments + post.bookmarks;
  const maxScore = topPosts.length > 0 ? Math.max(...topPosts.map(getScore), 1) : 1;

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
          text: 'text-amber-600',
          ring: 'ring-amber-200',
          label: '🥇',
          gradient: 'from-amber-50 to-yellow-50/50',
        };
      case 1:
        return {
          bg: 'bg-gradient-to-br from-slate-300 to-slate-400',
          text: 'text-slate-500',
          ring: 'ring-slate-200',
          label: '🥈',
          gradient: 'from-slate-50 to-gray-50/50',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
          text: 'text-orange-600',
          ring: 'ring-orange-200',
          label: '🥉',
          gradient: 'from-orange-50 to-amber-50/50',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-400',
          ring: 'ring-gray-100',
          label: '',
          gradient: '',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-20">
      {/* 标题区 */}
      <div className="relative p-5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white overflow-hidden">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">实时热点榜</h2>
              <p className="text-xs text-white/70 mt-0.5">Top 10 热门内容</p>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 opacity-70" />
        </div>
      </div>

      {/* 标签栏 */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
          {(['all', 'professional', 'life'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'professional' ? '专业' : '生活'}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      <div>
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="inline-block w-8 h-8 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm">加载中...</p>
          </div>
        ) : topPosts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm text-gray-400">
              {activeTab === 'all' ? '暂无热门帖子' : '该领域暂无热门内容'}
            </p>
          </div>
        ) : (
          topPosts.map((post, index) => {
            const style = getRankStyle(index);
            const score = getScore(post);
            const isTop3 = index < 3;
            const percent = Math.round((score / maxScore) * 100);

            return (
              <div
                key={post._id}
                onClick={() => onPostClick(post)}
                className={`group relative px-4 ${isTop3 ? `py-3.5 bg-gradient-to-r ${style.gradient}` : 'py-3'} hover:bg-purple-50/60 transition-all cursor-pointer border-b border-gray-50 last:border-0`}
              >
                <div className="flex items-center gap-3">
                  {/* 排名 */}
                  <div className={`flex-shrink-0 ${isTop3 ? 'w-9 h-9' : 'w-7 h-7'} rounded-xl ${style.bg} flex items-center justify-center font-bold text-sm ${isTop3 ? 'text-white' : style.text} shadow-sm ring-2 ring-white`}>
                    {isTop3 ? <span className="text-base">{style.label}</span> : index + 1}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-gray-800 truncate group-hover:text-purple-600 transition-colors text-sm`}>
                      {post.title}
                    </h4>

                    {/* 热度进度条 + 数据 */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${isTop3 ? 'from-amber-400 to-orange-400' : 'from-purple-400 via-pink-400 to-orange-300'} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${style.text} flex-shrink-0`}>
                        {score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部统计 */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-yellow-500" />
            实时更新
          </span>
          <span>共 {topPosts.length} 条</span>
        </div>
      </div>
    </div>
  );
}