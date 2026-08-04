'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
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

  const categoryColor = post.category === 'professional'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-pink-100 text-pink-700';

  const categoryLabel = post.category === 'professional' ? '专业知识' : '生活服务';

  return (
    <div
      onClick={() => onPostClick(post)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer p-6 animate-slide-up"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
            {post.author?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{post.author?.username}</div>
            <div className="text-sm text-gray-500">
              {formatRelativeTime(post.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}>
            {categoryLabel}
          </span>
          {post.subCategory && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              {post.subCategory}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {post.title}
      </h3>

      <p className="text-gray-600 mb-4 line-clamp-3">
        {post.content}
      </p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-sm text-purple-600">
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-sm text-gray-500">+{post.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-2 transition-colors',
            liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          )}
        >
          <Heart className={cn('w-5 h-5', liked && 'fill-current')} />
          <span className="text-sm">{likeCount}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-500">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments}</span>
        </div>

        <button
          onClick={handleBookmark}
          className={cn(
            'flex items-center gap-2 transition-colors',
            bookmarked ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'
          )}
        >
          <Bookmark className={cn('w-5 h-5', bookmarked && 'fill-current')} />
          <span className="text-sm">{bookmarkCount}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-500 ml-auto">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{post.views} 次浏览</span>
        </div>
      </div>
    </div>
  );
}
