import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPosts, createPost, findUserById } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'forum-secret-key-2024';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '用户不存在，请重新登录' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, subCategory, tags, attachments } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: '请填写标题、内容和版面' }, { status: 400 });
    }

    if (category === 'professional' && !subCategory) {
      return NextResponse.json({ error: '请选择专业领域分类（品质/工程/研发/其他）' }, { status: 400 });
    }

    const post = await createPost({
      title,
      content,
      authorId: user.id,
      authorName: user.username,
      category,
      subCategory: category === 'professional' ? subCategory : undefined,
      tags: tags || [],
      attachments: attachments || [],
    });

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        _id: post.id,
        author: { _id: post.authorId, username: post.authorName, avatar: user.avatar },
      },
    });
  } catch (error) {
    console.error('发帖错误:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '发帖失败: ' + msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let posts = await getPosts();
    if (category && category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }
    if (subCategory) {
      posts = posts.filter(p => p.subCategory === subCategory);
    }

    // 收集所有作者ID，批量查询头像
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const { getUsers } = await import('@/lib/db');
    const allUsers = await getUsers();
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const total = posts.length;
    const pagedPosts = posts.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      posts: pagedPosts.map(p => {
        const author = userMap.get(p.authorId);
        return {
          ...p,
          _id: p.id,
          author: { _id: p.authorId, username: p.authorName, avatar: author?.avatar, bio: author?.bio },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取帖子错误:', error);
    return NextResponse.json({ error: '获取帖子失败' }, { status: 500 });
  }
}