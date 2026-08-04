@echo off
chcp 65001 >nul
title 智享论坛 - 诊断启动脚本

echo ========================================
echo    智享论坛 - 诊断启动脚本
echo ========================================
echo.

echo 第1步：检查 Node.js 是否安装...
node --version
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    echo 下载后一路点击"下一步"完成安装
    goto :error_end
)
echo ✅ Node.js 已安装
echo.

echo 第2步：配置环境变量...
echo MONGODB_URI=mongodb://localhost:27017/forum > .env.local
echo JWT_SECRET=forum-secret-key-2024-production-ready-secure-auth-token >> .env.local
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> .env.local
type .env.local
echo ✅ 环境变量配置完成
echo.

echo 第3步：检查项目文件是否存在...
if exist package.json (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 不存在，项目文件可能不完整
    goto :error_end
)

if exist src/app/page.tsx (
    echo ✅ 前端页面文件存在
) else (
    echo ❌ 前端页面文件不存在
    goto :error_end
)
echo.

echo 第4步：安装项目依赖...
echo ⚠️  这个过程可能需要几分钟，请耐心等待...
echo.
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. npm 配置问题
    echo.
    echo 解决方法：
    echo 尝试使用国内镜像：
    echo npm config set registry https://registry.npmmirror.com
    goto :error_end
)
echo ✅ 依赖安装完成
echo.

echo 第5步：启动论坛...
echo 🌐 请在浏览器中打开以下地址：
echo http://localhost:3000
echo.
echo 📋 提示：
echo - 首次启动需要编译，可能较慢
echo - 看到 "Ready" 字样表示启动成功
echo - 按 Ctrl+C 可以停止服务
echo.
echo ========================================
echo.

call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo ❌ 论坛启动失败
    goto :error_end
)

goto :success_end

:error_end
echo.
echo ========================================
echo ❌ 诊断完成，发现错误
echo ========================================
echo.
echo 可能的解决方案：
echo.
echo 1. 如果 Node.js 未安装：
echo    - 访问 https://nodejs.org/ 下载安装
echo.
echo 2. 如果依赖安装失败：
echo    - 运行：npm config set registry https://registry.npmmirror.com
echo    - 然后重新运行此脚本
echo.
echo 3. 如果端口被占用：
echo    - 运行：npm run dev -- -p 3001
echo    - 然后访问 http://localhost:3001
echo.
echo 4. 手动启动步骤：
echo    cd c:\Users\monica.wangzw.GOEROPTICS\.claude\forum-app
echo    npm install
echo    npm run dev
echo.
goto :end_pause

:success_end
echo.
echo ✅ 论坛启动成功！
echo.

:end_pause
echo 按任意键退出...
pause >nul
