import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createReport, hasUserReported, findUserById, getReports, isPhoneAdmin } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

// 获取举报列表（仅管理员）
export async function GET(req: NextRequest) {
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

    const reports = await getReports();
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('获取举报列表错误:', error);
    return NextResponse.json({ error: '获取举报列表失败' }, { status: 500 });
  }
}

// 提交举报
export async function POST(req: NextRequest) {
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

    const { postId, postTitle, reason } = await req.json();
    if (!postId || !reason) {
      return NextResponse.json({ error: '请填写举报原因' }, { status: 400 });
    }

    const alreadyReported = await hasUserReported(user.id, postId);
    if (alreadyReported) {
      return NextResponse.json({ error: '您已举报过该帖子' }, { status: 400 });
    }

    const report = await createReport({
      postId,
      postTitle,
      reporterId: user.id,
      reporterName: user.username,
      reason,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('举报错误:', error);
    return NextResponse.json({ error: '举报失败' }, { status: 500 });
  }
}