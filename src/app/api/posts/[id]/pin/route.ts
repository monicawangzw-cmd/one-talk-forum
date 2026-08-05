import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findPostById, togglePostPin, isUserAdminAsync } from '@/lib/db';

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
    const post = await findPostById(params.id);
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    // 只有管理员可以置顶
    const isAdmin = await isUserAdminAsync(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: '无权限，仅管理员可置顶' }, { status: 403 });
    }

    const updated = await togglePostPin(params.id);
    return NextResponse.json({
      success: true,
      isPinned: updated?.isPinned ?? false,
    });
  } catch (error) {
    console.error('置顶错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}