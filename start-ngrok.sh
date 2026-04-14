#!/bin/bash

# 快速启动 ngrok 分享脚本

echo "🚀 评分系统 - 快速分享设置"
echo "================================"
echo ""

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安装"
    echo ""
    echo "请访问 https://ngrok.com 下载并安装 ngrok"
    echo ""
    echo "安装后运行:"
    echo "  ngrok authtoken 你的token"
    echo ""
    exit 1
fi

echo "✅ ngrok 已安装"
echo ""

# 检查服务是否运行
echo "📊 检查服务状态..."
echo ""

# 检查后端
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ 后端正在运行 (端口 5000)"
else
    echo "❌ 后端未运行"
    echo "请在另一个终端运行: cd backend && npm start"
    exit 1
fi

# 检查前端
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端正在运行 (端口 3000)"
else
    echo "❌ 前端未运行"
    echo "请在另一个终端运行: npm run dev"
    exit 1
fi

echo ""
echo "🌐 启动 ngrok 隧道..."
echo ""

# 启动后端 ngrok (后台运行)
ngrok http 5000 > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 3

# 获取后端 URL
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ 无法获取后端 URL"
    kill $BACKEND_PID
    exit 1
fi

echo "✅ 后端 URL: $BACKEND_URL"

# 启动前端 ngrok (后台运行)
ngrok http 3000 --region=us > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 3

# 获取前端 URL
FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ 无法获取前端 URL"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
fi

echo "✅ 前端 URL: $FRONTEND_URL"
echo ""

# 更新配置文件
echo "📝 更新配置文件..."
echo ""

# 更新 .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$BACKEND_URL
EOF
echo "✅ 已更新 .env.local"

# 更新 backend/.env
if [ -f backend/.env ]; then
    # 保留其他配置，只更新 FRONTEND_URL
    sed -i.bak "s|FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|" backend/.env
    echo "✅ 已更新 backend/.env"
else
    echo "⚠️  backend/.env 不存在，请手动创建"
fi

echo ""
echo "================================"
echo "🎉 设置完成！"
echo "================================"
echo ""
echo "📱 分享链接:"
echo "   $FRONTEND_URL"
echo ""
echo "⚠️  重要提示:"
echo "   1. 请重启前端服务以应用新配置"
echo "   2. 保持此终端窗口打开"
echo "   3. 按 Ctrl+C 停止分享"
echo ""
echo "🔗 ngrok 控制台:"
echo "   后端: http://localhost:4040"
echo "   前端: http://localhost:4041"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止 ngrok...'; kill $BACKEND_PID $FRONTEND_PID; echo '✅ 已停止'; exit 0" INT

echo "⏳ ngrok 正在运行... (按 Ctrl+C 停止)"
wait
