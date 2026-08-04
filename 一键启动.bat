@echo off
chcp 65001 >nul
title 启动智享论坛

echo ========================================
echo    智享论坛 - 一键启动
echo ========================================
echo.

echo 1. 正在配置环境变量...
echo MONGODB_URI=mongodb://localhost:27017/forum > .env.local
echo JWT_SECRET=forum-secret-key-2024-production-ready-secure-auth-token >> .env.local
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> .env.local
echo    ✓ 环境变量配置完成

echo.
echo 2. 正在安装项目依赖...
call npm install
echo    ✓ 依赖安装完成

echo.
echo 3. 正在启动论坛...
echo.
echo ═══════════════════════════════════════════
echo    论坛地址: http://localhost:3000
echo    按 Ctrl+C 停止服务
echo ═══════════════════════════════════════════
echo.

call npm run dev
