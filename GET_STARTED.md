# 🚀 智享论坛 - 快速启动指南

## 📋 系统要求

### 必装软件
- **Node.js**: 18.x 或更高版本
- **MongoDB**: 6.0+ (本地安装或 MongoDB Atlas 云数据库)
- **npm**: 9.x 或更高版本 (通常随 Node.js 一起安装)

### 可选工具
- **Git**: 用于版本控制
- **VS Code**: 推荐的代码编辑器
- **MongoDB Compass**: MongoDB 管理工具

## 🔥 5分钟快速启动

### 方式一：Windows 用户（推荐）

1. **双击运行初始化脚本**
   ```
   双击 setup.bat 文件
   ```

2. **配置环境变量**
   - 打开 `.env.local` 文件
   - 根据你的 MongoDB 设置修改连接字符串

3. **启动 MongoDB**
   ```bash
   # 如果 MongoDB 作为服务运行，确保服务已启动
   # 或者手动启动
   mongod
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   ```
   在浏览器中打开: http://localhost:3000
   ```

### 方式二：macOS/Linux 用户

1. **运行初始化脚本**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件
   ```

3. **启动 MongoDB**
   ```bash
   # macOS (如果通过 Homebrew 安装)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongodb
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 🎯 功能演示

### 1. 用户注册
1. 点击右上角"登录/注册"按钮
2. 填写手机号：`13800138000`
3. 设置密码：至少 6 位
4. 填写用户名：如"张三"
5. 点击"注册"完成注册

### 2. 发布帖子
1. 登录成功后点击"发布"按钮
2. 选择发布领域：
   - 📚 专业知识
   - 🌈 生活服务
3. 填写标题和内容
4. 添加相关标签（如："AI", "编程", "生活技巧"）
5. 点击"发布帖子"

### 3. 互动功能
- **点赞**: 点击帖子下方的 ❤️ 图标
- **评论**: 点击帖子查看详细内容，可以发表评论
- **收藏**: 点击 ⭐ 图标收藏帖子
- **浏览**: 查看帖子的浏览次数

### 4. 热点榜
- 右侧边栏显示实时热点榜
- Top 10 热门帖子，按点赞、评论、收藏数排序
- 支持按分类筛选热门内容

## 💻 开发工具

### VS Code 推荐插件
```
ESLint
Prettier
TypeScript Vue Plugin (if using VS Code)
MongoDB for VS Code
Tailwind CSS IntelliSense
Material Icon Theme
```

### 常用命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 🔧 环境配置

### MongoDB 本地安装

**Windows:**
1. 下载 MongoDB Community Server
2. 安装时选择 "Install MongoDB as a Service"
3. 默认端口：27017
4. 连接字符串：`mongodb://localhost:27017/forum`

**macOS:**
```bash
# 通过 Homebrew 安装
brew tap mongodb/brew
brew install mongodb-community

# 启动服务
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# 添加 MongoDB 仓库
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装
sudo apt update
sudo apt install mongodb-org

# 启动
sudo systemctl start mongodb
```

### 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
# MongoDB连接字符串
MONGODB_URI=mongodb://localhost:27017/forum

# JWT密钥 (生产环境必须修改为随机字符串)
JWT_SECRET=your-secret-key-change-in-production-min-32-chars

# 站点配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🎨 自定义配置

### 修改端口
在 `npm run dev` 后添加参数：
```bash
npm run dev -- -p 3001
```

### 修改数据库
编辑 `.env.local`：
```env
# 使用 MongoDB Atlas 云数据库
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/forum?retryWrites=true&w=majority
```

### 修改颜色主题
编辑 `src/app/globals.css`：
```css
:root {
  --primary: 262 83% 58%;  /* 改为其他色相值 */
  /* 其他颜色配置 */
}
```

## 🐛 常见问题

### Q1: MongoDB 连接失败
**A:** 检查以下几点：
1. MongoDB 服务是否运行
2. 连接字符串是否正确
3. 防火墙是否阻止连接
4. 用户名密码是否正确

### Q2: npm install 失败
**A:** 尝试以下解决方案：
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 使用淘宝镜像（国内用户）
npm config set registry https://registry.npmmirror.com
```

### Q3: 端口被占用
**A:** 修改运行端口或关闭占用端口的程序
```bash
# 查找占用端口进程
netstat -tulpn | grep 3000

# 修改端口运行
npm run dev -- -p 3001
```

### Q4: TypeScript 类型错误
**A:** 确保所有依赖都正确安装：
```bash
npm install -D @types/node @types/react @types/react-dom
```

## 📱 测试账号

### 测试数据注入
创建 `scripts/seed.js` 文件：
```javascript
const mongoose = require('mongoose');
const Post = require('../src/models/Post');
const User = require('../src/models/User');

async function seed() {
  // 连接数据库
  await mongoose.connect(process.env.MONGODB_URI);

  // 创建测试用户
  const user = await User.create({
    phone: '13800138000',
    password: 'hashed_password',
    username: '测试用户'
  });

  // 创建测试帖子
  for (let i = 1; i <= 20; i++) {
    await Post.create({
      title: `测试帖子 ${i} - ${i > 10 ? '生活' : '专业'}领域`,
      content: '这是一个测试帖子的内容，用于演示论坛功能。',
      author: user._id,
      category: i > 10 ? 'life' : 'professional',
      tags: ['测试', i % 2 ? 'AI' : '编程'],
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 20),
      bookmarks: Math.floor(Math.random() * 30)
    });
  }

  console.log('测试数据创建完成！');
  process.exit(0);
}

seed();
```

## 🎯 下一步

### 学习路径
1. **熟悉基础** → 运行项目，体验功能
2. **代码研究** → 阅读组件和 API 代码
3. **功能扩展** → 添加新功能
4. **性能优化** → 优化数据库和前端
5. **部署上线** → 部署到生产环境

### 扩展资源
- [Next.js 官方文档](https://nextjs.org/docs)
- [MongoDB 教程](https://www.mongodb.com/docs/manual/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React 官方文档](https://react.dev/)

## 🚀 部署准备

### 生产环境检查清单
- ✅ 修改 JWT_SECRET 为强随机字符串
- ✅ 配置生产 MongoDB 数据库
- ✅ 设置正确的域名和 SSL
- ✅ 配置环境变量
- ✅ 测试构建：`npm run build`
- ✅ 性能测试
- ✅ 安全检查

### Vercel 部署
1. 连接 GitHub 仓库
2. 添加环境变量
3. 触发自动部署
4. 配置自定义域名

### 自建服务器部署
```bash
# 使用 PM2 管理进程
npm install -g pm2

# 启动应用
pm2 start npm --name "forum" -- start

# 设置开机自启
pm2 startup
pm2 save
```

## 🆘 获取帮助

如果遇到问题，可以：
1. 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构
2. 查看 [README.md](./README.md) 了解项目详情
3. 提交 Issue 到项目仓库
4. 联系技术支持

---

**祝使用愉快！🎉**
