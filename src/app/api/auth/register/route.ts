import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createUser, findUserByPhone, isPhoneAdmin } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

export async function POST(req: Request) {
  try {
    const { phone, password, username } = await req.json();

    if (!phone || !password || !username) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    const existingUser = findUserByPhone(phone);
    if (existingUser) {
      return NextResponse.json({ error: '该手机号已注册' }, { status: 400 });
    }

    const user = await createUser(phone, password, username);
    const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        isAdmin: isPhoneAdmin(user.phone),
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '注册失败: ' + (error instanceof Error ? error.message : '未知错误') }, { status: 500 });
  }
}