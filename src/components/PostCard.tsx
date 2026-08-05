'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Eye } from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { Post } from '@/types';
import type { User } from '@/types';

interface PostCardProps {
  post: Post;
  user: User | null;
  onPostClick: (post: Post) => void;
}

export default function PostCard({ post, user, onPostClick }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarks);

  useEffect(() => {
    if (user) {
      setLiked(post.likesBy.includes(user.id as any));
      setBookmarked(post.bookmarksBy.includes(user.id as any));
    }
  }, [user, post.likesBy, post.bookmarksBy]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikeCount(data.likes);
      }
    } catch (err) {
      console.error('点赞失败', err);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.bookmarked);
        setBookmarkCount(data.bookmarks);
      }
    } catch (err) {
      console.error('收藏失败', err);
    }
  };

  const isProfessional = post.category === 'professional';

  return (
    <div
      onClick={() => onPostClick(post)}
      className="group bg-white rounded-2xl border border-gray-200/80 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 cursor-pointer p-5 animate-slide-up relative overflow-hidden"
    >
      {/* 左侧装饰条 */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5',
        isProfessional ? 'bg-gradient-to-b from-purple-500 to-purple-600' : 'bg-gradient-to-b from-pink-500 to-pink-600'
      )} />

      {/* 头部 */}
      <div className="flex items-start justify-between mb-3 pl-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden',
            isProfessional
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : 'bg-gradient-to-br from-pink-500 to-pink-600'
          )}>
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              post.author?.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">{post.author?.username}</div>
            <div className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            isProfessional ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-600'
          )}>
            {isProfessional ? '📚 专业知识' : '🌈 生活服务'}
          </span>
          {post.subCategory && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
              {post.subCategory}
            </span>
          )}
        </div>
      </div>

      {/* 标题 */}
      <h3 className="font-semibold text-gray-900 text-base mb-1.5 line-clamp-2 group-hover:text-purple-700 transition-colors pl-2">
        {post.title}
      </h3>

      {/* 内容 */}
      <p className="text-gray-500 text-sm mb-3 line-clamp-3 pl-2 leading-relaxed">
        {post.content}
      </p>

      {/* 标签 */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pl-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-purple-500 bg-purple-50/50 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs text-gray-400 px-2 py-0.5">+{post.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* 底部互动栏 */}
      <div className="flex items-center gap-5 pt-3 border-t border-gray-100 pl-2">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 transition-all',
            liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          )}
        >
          <Heart className={cn('w-4 h-4 transition-transform hover:scale-110', liked && 'fill-current')} />
          <span className="text-xs font-medium">{likeCount}</span>
        </button>

        <div className="flex items-center gap-1.5 text-gray-400">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{post.comments}</span>
        </div>

        <button
          onClick={handleBookmark}
          className={cn(
            'flex items-center gap-1.5 transition-all',
            bookmarked ? 'text-purple-500' : 'text-gray-400 hover:text-purple-500'
          )}
        >
          <Bookmark className={cn('w-4 h-4 transition-transform hover:scale-110', bookmarked && 'fill-current')} />
          <span className="text-xs font-medium">{bookmarkCount}</span>
        </button>

        <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
          <Eye className="w-4 h-4" />
          <span className="text-xs">{post.views}</span>
        </div>
      </div>
    </div>
  );
}