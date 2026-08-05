import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById, updateReportStatus, isPhoneAdmin, deletePost } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

// 更新举报状态（仅管理员）
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
    const user = await findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    if (!isPhoneAdmin(user.phone)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { status, postId } = await req.json();
    if (!['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }

    // 如果是"处理"，同时删除帖子
    if (status === 'resolved' && postId) {
      await deletePost(postId);
    }

    const updated = await updateReportStatus(params.id, status);
    if (!updated) {
      return NextResponse.json({ error: '举报记录不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error('更新举报状态错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}