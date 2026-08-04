import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/db';

export async function GET() {
  try {
    const posts = await getPosts();
    const sorted = [...posts].sort((a, b) => {
      const scoreA = a.likes + a.comments + a.bookmarks;
      const scoreB = b.likes + b.comments + b.bookmarks;
      return scoreB - scoreA;
    });

    const topPosts = sorted.slice(0, 50);

    return NextResponse.json({
      success: true,
      posts: topPosts.map(p => ({
        ...p,
        _id: p.id,
        author: { _id: p.authorId, username: p.authorName },
      })),
    });
  } catch (error) {
    console.error('获取热点榜错误:', error);
    return NextResponse.json({ error: '获取热点榜失败' }, { status: 500 });
  }
}