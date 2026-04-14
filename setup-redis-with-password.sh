#!/bin/bash

# Redis密码设置脚本
# 用于生产环境配置

echo "🔐 Redis密码配置脚本"
echo "===================="
echo ""

# 1. 生成随机密码（或使用自定义密码）
echo "选择密码设置方式:"
echo "1. 自动生成安全密码（推荐）"
echo "2. 手动输入密码"
echo ""
read -p "请选择 (1/2): " choice

if [ "$choice" = "1" ]; then
    # 生成32位随机密码
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    echo ""
    echo "✅ 已生成安全密码: $REDIS_PASSWORD"
    echo "⚠️  请妥善保存此密码！"
else
    echo ""
    read -sp "请输入Redis密码: " REDIS_PASSWORD
    echo ""
fi

echo ""
echo "2. 停止并删除现有Redis容器..."
docker stop redis-scoring 2>/dev/null
docker rm redis-scoring 2>/dev/null

echo "3. 启动带密码的Redis容器..."
docker run --name redis-scoring \
  -p 6379:6379 \
  -d redis:latest \
  redis-server --requirepass "$REDIS_PASSWORD"

if [ $? -eq 0 ]; then
    echo "✅ Redis容器已启动"
    
    echo ""
    echo "4. 更新.env文件..."
    
    # 备份原文件
    cp backend/.env backend/.env.backup
    
    # 更新密码
    sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" backend/.env
    
    echo "✅ .env文件已更新"
    
    echo ""
    echo "5. 测试连接..."
    sleep 2
    
    PONG=$(docker exec redis-scoring redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null)
    
    if [ "$PONG" = "PONG" ]; then
        echo "✅ Redis密码配置成功！"
        echo ""
        echo "📋 配置摘要:"
        echo "  容器名称: redis-scoring"
        echo "  端口: 6379"
        echo "  密码: $REDIS_PASSWORD"
        echo ""
        echo "⚠️  重要提示:"
        echo "  1. 密码已保存到 backend/.env"
        echo "  2. 原配置已备份到 backend/.env.backup"
        echo "  3. 请勿将.env文件提交到Git"
        echo "  4. 生产环境请使用环境变量或密钥管理服务"
    else
        echo "❌ 连接测试失败"
    fi
else
    echo "❌ Redis容器启动失败"
fi