import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getNotificationsByUser, getUnreadCount, markAllRead } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

// 获取通知列表 + 未读数
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { searchParams } = new URL(req.url);
    const onlyUnread = searchParams.get('unread');

    if (onlyUnread === '1') {
      const count = await getUnreadCount(decoded.userId);
      return NextResponse.json({ success: true, count });
    }

    const notifications = await getNotificationsByUser(decoded.userId);
    const unreadCount = await getUnreadCount(decoded.userId);
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('获取通知错误:', error);
    return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
  }
}

// 全部已读
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await markAllRead(decoded.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记已读错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}