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
    const index = post.likesBy.indexOf(userId);

    let newLikesBy;
    if (index === -1) {
      newLikesBy = [...post.likesBy, userId];
    } else {
      newLikesBy = post.likesBy.filter(id => id !== userId);
    }

    const updated = updatePost(params.id, {
      likes: newLikesBy.length,
      likesBy: newLikesBy,
    });

    return NextResponse.json({
      success: true,
      liked: index === -1,
      likes: updated?.likes ?? 0,
    });
  } catch (error) {
    console.error('点赞错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}