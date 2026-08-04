import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByPhone, verifyPassword, isPhoneAdmin } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: '请输入手机号和密码' }, { status: 400 });
    }

    const user = findUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 });
    }

    const isValid = await verifyPassword(user, password);
    if (!isValid) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 });
    }

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
    console.error('登录错误:', error);
    return NextResponse.json({ error: '登录失败: ' + (error instanceof Error ? error.message : '未知错误') }, { status: 500 });
  }
}