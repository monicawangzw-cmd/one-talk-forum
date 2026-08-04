import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findPostById, updatePost, deletePost, incrementPostViews, isUserAdmin } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    incrementPostViews(params.id);
    const post = findPostById(params.id);
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      post: {
        ...post,
        _id: post.id,
        author: { _id: post.authorId, username: post.authorName },
      },
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    return NextResponse.json({ error: '获取帖子详情失败' }, { status: 500 });
  }
}

export async function PUT(
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
    // 作者或管理员可编辑
    if (post.authorId !== decoded.userId && !isUserAdmin(decoded.userId)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { title, content, tags } = await req.json();
    const updated = updatePost(params.id, {
      ...(title && { title }),
      ...(content && { content }),
      ...(tags && { tags }),
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error('更新帖子错误:', error);
    return NextResponse.json({ error: '更新帖子失败' }, { status: 500 });
  }
}

export async function DELETE(
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

    // 作者本人 或 管理员 可以删除
    const isAuthor = post.authorId === decoded.userId;
    const isAdmin = isUserAdmin(decoded.userId);
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '无权限删除此帖子' }, { status: 403 });
    }

    deletePost(params.id);
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除帖子错误:', error);
    return NextResponse.json({ error: '删除帖子失败' }, { status: 500 });
  }
}