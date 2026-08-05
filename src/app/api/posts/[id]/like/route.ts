import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findPostById, updatePost, findUserById, createNotification } from '@/lib/db';

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
    const actor = await findUserById(decoded.userId);
    if (!actor) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    const post = await findPostById(params.id);
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    const userId = decoded.userId;
    const index = post.likesBy.indexOf(userId);

    let newLikesBy;
    let isLiking;
    if (index === -1) {
      newLikesBy = [...post.likesBy, userId];
      isLiking = true;
    } else {
      newLikesBy = post.likesBy.filter(id => id !== userId);
      isLiking = false;
    }

    const updated = await updatePost(params.id, {
      likes: newLikesBy.length,
      likesBy: newLikesBy,
    });

    // 点赞时发通知给帖子作者
    if (isLiking) {
      await createNotification({
        userId: post.authorId,
        actorId: actor.id,
        actorName: actor.username,
        actorAvatar: actor.avatar,
        type: 'like',
        content: '赞了你的帖子',
        postId: post.id,
        postTitle: post.title,
      });
    }

    return NextResponse.json({
      success: true,
      liked: isLiking,
      likes: updated?.likes ?? 0,
    });
  } catch (error) {
    console.error('点赞错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}