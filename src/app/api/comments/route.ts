import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createComment, findUserById, getCommentsByPostId, findPostById } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

// 获取某帖子的评论
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    if (!postId) {
      return NextResponse.json({ error: '缺少postId' }, { status: 400 });
    }

    const comments = getCommentsByPostId(postId);
    return NextResponse.json({
      success: true,
      comments: comments.map(c => ({
        ...c,
        _id: c.id,
        author: { _id: c.authorId, username: c.authorName },
      })),
    });
  } catch (error) {
    console.error('获取评论错误:', error);
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 });
  }
}

// 发表评论
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    const { postId, content, parentCommentId } = await req.json();
    if (!postId || !content) {
      return NextResponse.json({ error: '请填写完整的评论信息' }, { status: 400 });
    }

    const post = findPostById(postId);
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    const comment = createComment({
      content,
      postId,
      authorId: user.id,
      authorName: user.username,
      parentCommentId: parentCommentId || undefined,
    });

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        _id: comment.id,
        author: { _id: comment.authorId, username: comment.authorName },
      },
    });
  } catch (error) {
    console.error('评论错误:', error);
    return NextResponse.json({ error: '评论失败' }, { status: 500 });
  }
}