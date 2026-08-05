import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { toggleFollow, isFollowing, findUserById } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

// 查询是否关注某人
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');
    if (!targetId) {
      return NextResponse.json({ error: '缺少targetId' }, { status: 400 });
    }

    const following = await isFollowing(decoded.userId, targetId);
    return NextResponse.json({ success: true, following });
  } catch (error) {
    console.error('查询关注错误:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

// 关注/取消关注
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { targetId } = await req.json();
    if (!targetId) {
      return NextResponse.json({ error: '缺少目标用户' }, { status: 400 });
    }

    const targetUser = await findUserById(targetId);
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const following = await toggleFollow(decoded.userId, targetId);
    return NextResponse.json({ success: true, following });
  } catch (error) {
    console.error('关注错误:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}