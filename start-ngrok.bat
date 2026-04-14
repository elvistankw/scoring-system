@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 评分系统 - 快速分享设置
echo ================================
echo.

REM 检查 ngrok 是否安装
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok 未安装
    echo.
    echo 请访问 https://ngrok.com 下载并安装 ngrok
    echo.
    echo 安装后运行:
    echo   ngrok authtoken 你的token
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok 已安装
echo.

echo 📊 检查服务状态...
echo.

REM 检查后端
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端正在运行 ^(端口 5000^)
) else (
    echo ❌ 后端未运行
    echo 请在另一个终端运行: cd backend ^&^& npm start
    pause
    exit /b 1
)

REM 检查前端
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端正在运行 ^(端口 3000^)
) else (
    echo ❌ 前端未运行
    echo 请在另一个终端运行: npm run dev
    pause
    exit /b 1
)

echo.
echo 🌐 启动 ngrok 隧道...
echo.

REM 启动后端 ngrok
start /B ngrok http 5000 --log=stdout > ngrok-backend.log 2>&1
timeout /t 3 /nobreak >nul

REM 获取后端 URL
for /f "tokens=*" %%i in ('curl -s http://localhost:4040/api/tunnels ^| findstr "public_url"') do (
    set "line=%%i"
    set "line=!line:*https://=https://!"
    set "line=!line:",=!"
    set "BACKEND_URL=https://!line!"
    goto :backend_found
)
:backend_found

if "!BACKEND_URL!"=="" (
    echo ❌ 无法获取后端 URL
    taskkill /F /IM ngrok.exe >nul 2>&1
    pause
    exit /b 1
)

echo ✅ 后端 URL: !BACKEND_URL!

REM 启动前端 ngrok
start /B ngrok http 3000 --log=stdout > ngrok-frontend.log 2>&1
timeout /t 3 /nobreak >nul

REM 获取前端 URL (使用不同端口)
for /f "tokens=*" %%i in ('curl -s http://localhost:4040/api/tunnels ^| findstr "public_url" ^| findstr /V "!BACKEND_URL!"') do (
    set "line=%%i"
    set "line=!line:*https://=https://!"
    set "line=!line:",=!"
    set "FRONTEND_URL=https://!line!"
    goto :frontend_found
)
:frontend_found

if "!FRONTEND_URL!"=="" (
    echo ❌ 无法获取前端 URL
    taskkill /F /IM ngrok.exe >nul 2>&1
    pause
    exit /b 1
)

echo ✅ 前端 URL: !FRONTEND_URL!
echo.

REM 更新配置文件
echo 📝 更新配置文件...
echo.

REM 更新 .env.local
echo NEXT_PUBLIC_API_URL=!BACKEND_URL! > .env.local
echo ✅ 已更新 .env.local

REM 更新 backend/.env
if exist backend\.env (
    powershell -Command "(Get-Content backend\.env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=!FRONTEND_URL!' | Set-Content backend\.env"
    echo ✅ 已更新 backend/.env
) else (
    echo ⚠️  backend/.env 不存在，请手动创建
)

echo.
echo ================================
echo 🎉 设置完成！
echo ================================
echo.
echo 📱 分享链接:
echo    !FRONTEND_URL!
echo.
echo ⚠️  重要提示:
echo    1. 请重启前端服务以应用新配置
echo    2. 保持此窗口打开
echo    3. 按任意键停止分享
echo.
echo 🔗 ngrok 控制台:
echo    http://localhost:4040
echo.

pause

REM 清理
echo.
echo 🛑 停止 ngrok...
taskkill /F /IM ngrok.exe >nul 2>&1
del ngrok-backend.log ngrok-frontend.log >nul 2>&1
echo ✅ 已停止

endlocal
