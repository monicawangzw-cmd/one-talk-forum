@echo off
chcp 65001 >nul
echo 🚀 智享论坛 - 初始化脚本
echo.

echo 📦 正在安装依赖...
call npm install

echo.
echo 🔧 创建环境变量文件...
if not exist .env.local (
    copy .env.example .env.local >nul
    echo ✅ 环境变量文件已创建 (.env.local)
    echo ⚠️  请根据实际情况修改 MONGODB_URI 和 JWT_SECRET
) else (
    echo ✅ 环境变量文件已存在
)

echo.
echo 🎉 初始化完成！
echo.
echo 启动项目：
echo   npm run dev
echo.
echo 访问：
echo   http://localhost:3000
echo.
pause
