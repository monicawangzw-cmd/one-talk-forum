# 🔥 智享论坛 - 专业知识与生活服务社区

一个现代化的全栈论坛应用，采用 Next.js 14 + MongoDB 构建，支持用户注册登录、内容发布、点赞评论收藏以及实时热点榜功能。

## ✨ 核心功能

### 🎯 用户系统
- **手机号注册/登录** - 安全的密码加密和JWT认证
- **个人资料** - 用户名、头像、个人简介
- **安全认证** - 30天token有效期

### 📝 内容功能
- **双领域分类** - 专业知识和生活服务两大领域
- **帖子发布** - 支持标题、内容、标签
- **多媒体互动** - 点赞、评论、收藏、浏览
- **实时热点榜** - Top 50 热门帖子排行榜
- **内容搜索** - 按标题、内容、标签搜索

### 💡 技术亮点
- **现代化UI** - 精美观的渐变色设计
- **响应式布局** - 适配移动端和桌面端
- **实时更新** - 即时数据刷新和状态同步
- **高性能** - Next.js 14 App Router + MongoDB优化
- **类型安全** - 完整的 TypeScript 支持

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MongoDB 6.0+
- npm/pnpm/yarn

### 安装依赖

```bash
cd forum-app
npm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
MONGODB_URI=mongodb://localhost:27017/forum
JWT_SECRET=your-secret-key-change-in-production
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
forum-app/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证API
│   │   │   ├── posts/         # 帖子API
│   │   │   └── comments/      # 评论API
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── AuthModal.tsx      # 登录注册弹窗
│   │   ├── CreatePost.tsx     # 发布帖子
│   │   ├── PostCard.tsx       # 帖子卡片
│   │   ├── HotRanking.tsx     # 热点榜
│   │   └── ui/                # UI组件
│   ├── models/                # MongoDB 模型
│   │   ├── User.ts            # 用户模型
│   │   ├── Post.ts            # 帖子模型
│   │   └── Comment.ts         # 评论模型
│   ├── lib/                   # 工具函数
│   │   ├── utils.ts           # 通用工具
│   │   └── mongodb.ts         # 数据库连接
│   └── types/                 # TypeScript 类型
│       └── index.ts           # 类型定义
├── public/                    # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 🎨 技术栈

### 前端
- **Next.js 14** - React 框架（App Router）
- **React 18** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 后端
- **Next.js API Routes** - API 接口
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 用户认证
- **bcrypt** - 密码加密

### 特色功能
- 实时热点榜算法（点赞+评论+收藏加权）
- 响应式设计适配
- 登录状态持久化
- 内容分类和标签系统

## 🔐 数据库模型

### User (用户)
```typescript
{
  phone: string        // 手机号
  password: string     // 加密密码
  username: string     // 用户名
  avatar?: string      // 头像
  bio?: string         // 个人简介
  createdAt: Date
  updatedAt: Date
}
```

### Post (帖子)
```typescript
{
  title: string        // 标题
  content: string      // 内容
  author: ObjectId     // 作者ID
  category: 'professional' | 'life'  // 分类
  tags: string[]       // 标签
  likes: number        // 点赞数
  comments: number     // 评论数
  bookmarks: number    // 收藏数
  views: number        // 浏览数
  createdAt: Date
  updatedAt: Date
}
```

### Comment (评论)
```typescript
{
  content: string      // 评论内容
  post: ObjectId       // 帖子ID
  author: ObjectId     // 作者ID
  parentComment?: ObjectId  // 父评论ID（回复）
  likes: number        // 点赞数
  createdAt: Date
  updatedAt: Date
}
```

## 🌟 使用指南

### 用户注册/登录
1. 首次使用点击"登录/注册"按钮
2. 输入手机号（中国大陆手机格式）
3. 设置至少6位的密码
4. 填写用户名完成注册

### 发布帖子
1. 登录后点击"发布"按钮
2. 选择发布领域（专业知识/生活服务）
3. 填写标题和内容
4. 添加相关标签
5. 提交发布

### 互动功能
- **点赞** - 点击爱心图标点赞帖子
- **收藏** - 点击星标图标收藏帖子
- **评论** - 点击评论图标查看和发表评论
- **分享** - 帖子可查看完整内容

### 热点榜
- 右侧边栏显示实时热点榜
- 按点赞、评论、收藏综合排序
- 支持按分类筛选

## 📊 热点榜算法

热点榜采用加权算法计算帖子热度：

```
热度 = 点赞数 × 2 + 评论数 × 3 + 收藏数 × 2
```

每周更新一次，支持分类筛选。

## 🔧 开发建议

### 添加新功能
1. 在 `models/` 添加新数据模型
2. 在 `app/api/` 创建对应API路由
3. 在 `components/` 创建UI组件
4. 在页面中集成新功能

### 扩展数据库索引
```typescript
// 在模型中添加索引
PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
```

### 优化性能
- 使用 Redis 缓存热点数据
- 添加 API 响应缓存
- 优化数据库查询

## 📱 部署

### Vercel 部署
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### 自定义服务器
```bash
npm run build
npm start
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🌈 特色亮点

- 🎨 **精美设计** - 现代化渐变色UI
- 📱 **响应式** - 完美适配移动端
- ⚡ **高性能** - Next.js 14 + MongoDB优化
- 🔐 **安全可靠** - JWT认证 + 密码加密
- 📊 **数据驱动** - 实时热点榜算法
- 🎯 **用户友好** - 直观的操作流程

## 📞 支持

如有问题，请提交 Issue 或联系维护者。

---

**Made with ❤️ by Next.js & MongoDB**
