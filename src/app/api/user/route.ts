import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById, saveUsers, getUsers, getPosts, getComments } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isPhoneAdmin } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

// 获取当前用户信息 + 我的帖子/点赞/收藏/评论
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const allPosts = await getPosts();
    const allComments = await getComments();

    const myPosts = allPosts
      .filter(p => p.authorId === user.id)
      .map(p => ({ ...p, _id: p.id, author: { _id: p.authorId, username: p.authorName } }));

    const myLikedPosts = allPosts
      .filter(p => p.likesBy.includes(user.id))
      .map(p => ({ ...p, _id: p.id, author: { _id: p.authorId, username: p.authorName } }));

    const myBookmarkedPosts = allPosts
      .filter(p => p.bookmarksBy.includes(user.id))
      .map(p => ({ ...p, _id: p.id, author: { _id: p.authorId, username: p.authorName } }));

    const myComments = allComments
      .filter(c => c.authorId === user.id)
      .map(c => {
        const post = allPosts.find(p => p.id === c.postId);
        return { ...c, _id: c.id, postTitle: post?.title || '已删除的帖子' };
      });

    const { getFollowingIds, getFollowerIds, getUsers } = await import('@/lib/db');
    const followingIds = await getFollowingIds(user.id);
    const followerIds = await getFollowerIds(user.id);
    const allUsers = await getUsers();
    const followingUsers = followingIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean).map((u: any) => ({
      id: u.id, username: u.username, avatar: u.avatar, bio: u.bio,
    }));
    const followerUsers = followerIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean).map((u: any) => ({
      id: u.id, username: u.username, avatar: u.avatar, bio: u.bio,
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        isAdmin: isPhoneAdmin(user.phone),
        createdAt: user.createdAt,
      },
      stats: {
        posts: myPosts.length,
        liked: myLikedPosts.length,
        bookmarked: myBookmarkedPosts.length,
        comments: myComments.length,
        following: followingIds.length,
        followers: followerIds.length,
      },
      myPosts,
      myLikedPosts,
      myBookmarkedPosts,
      myComments,
      followingUsers,
      followerUsers,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}

// 更新用户资料 / 修改密码
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const users = await getUsers();
    const index = users.findIndex(u => u.id === decoded.userId);
    if (index === -1) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const body = await req.json();
    const { username, bio, avatar, oldPassword, newPassword } = body;

    // 修改密码
    if (oldPassword && newPassword) {
      const valid = await bcrypt.compare(oldPassword, users[index].password);
      if (!valid) {
        return NextResponse.json({ error: '原密码错误' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
      }
      users[index].password = await bcrypt.hash(newPassword, 10);
    }

    // 更新昵称
    if (username !== undefined) {
      if (!username.trim()) {
        return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
      }
      users[index].username = username.trim();
    }

    // 更新简介
    if (bio !== undefined) {
      users[index].bio = bio;
    }

    // 更新头像
    if (avatar !== undefined) {
      users[index].avatar = avatar;
    }

    await saveUsers(users);
    const updated = users[index];

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        phone: updated.phone,
        username: updated.username,
        avatar: updated.avatar,
        bio: updated.bio,
        isAdmin: isPhoneAdmin(updated.phone),
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return NextResponse.json({ error: '更新失败: ' + (error instanceof Error ? error.message : '未知错误') }, { status: 500 });
  }
}