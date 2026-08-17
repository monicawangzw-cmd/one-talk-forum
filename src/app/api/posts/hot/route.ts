import { NextResponse } from 'next/server';
import { getPosts, getUsers } from '@/lib/db';

// 强制动态渲染，每次请求都重新查询数据库，避免 Next.js 缓存空结果
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await getPosts();
    const sorted = [...posts].sort((a, b) => {
      // 置顶帖排前面
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const scoreA = a.likes + a.comments + a.bookmarks;
      const scoreB = b.likes + b.comments + b.bookmarks;
      return scoreB - scoreA;
    });

    const topPosts = sorted.slice(0, 50);

    const allUsers = await getUsers();
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return NextResponse.json({
      success: true,
      posts: topPosts.map(p => {
        const author = userMap.get(p.authorId);
        return {
          ...p,
          _id: p.id,
          author: { _id: p.authorId, username: p.authorName, avatar: author?.avatar },
        };
      }),
    });
  } catch (error) {
    console.error('获取热点榜错误:', error);
    return NextResponse.json({ error: '获取热点榜失败' }, { status: 500 });
  }
}