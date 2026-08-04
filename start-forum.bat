@echo off
chcp 65001 >nul
title 智享论坛 - 启动论坛

echo 🚀 智享论坛 - 一键启动
echo.

echo 🔧 配置环境变量...
echo MONGODB_URI=mongodb://localhost:27017/forum > .env.local
echo JWT_SECRET=forum-secret-key-2024-production-ready-secure-auth-token >> .env.local
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> .env.local
echo ✅ 环境变量已自动配置

echo 📦 安装依赖（如果还没安装）...
call npm install

echo 🎊 启动论坛...
echo ✨ 访问地址: http://localhost:3000
echo ⏹️  按 Ctrl+C 可以停止服务
echo.

call npm run dev
pause
