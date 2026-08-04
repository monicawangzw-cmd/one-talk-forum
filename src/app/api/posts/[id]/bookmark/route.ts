import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findPostById, updatePost } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const post = findPostById(params.id);
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    const userId = decoded.userId;
    const index = post.bookmarksBy.indexOf(userId);

    let newBookmarksBy;
    if (index === -1) {
      newBookmarksBy = [...post.bookmarksBy, userId];
    } else {
      newBookmarksBy = post.bookmarksBy.filter(id => id !== userId);
    }

    const updated = updatePost(params.id, {
      bookmarks: newBookmarksBy.length,
      bookmarksBy: newBookmarksBy,
    });

    return NextResponse.json({
      success: true,
      bookmarked: index === -1,
      bookmarks: updated?.bookmarks ?? 0,
    });
  } catch (error) {
    console.error('收藏错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}