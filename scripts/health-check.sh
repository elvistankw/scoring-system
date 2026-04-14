#!/bin/bash

# 健康检查脚本
# 用途: 检查所有服务的健康状态
# 使用: ./health-check.sh

# 配置
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-scoring}"
DB_USER="${DB_USER:-postgres}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 状态变量
ALL_HEALTHY=true

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ALL_HEALTHY=false
}

# 分隔线
print_separator() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 开始检查
echo ""
print_separator
log_info "Starting health check at $(date '+%Y-%m-%d %H:%M:%S')"
print_separator
echo ""

# 1. 检查后端 API
log_info "Checking Backend API..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>/dev/null)

if [ "$BACKEND_STATUS" = "200" ]; then
    log_success "Backend API is healthy (HTTP $BACKEND_STATUS)"
    
    # 获取详细健康信息
    BACKEND_HEALTH=$(curl -s "$BACKEND_URL/health" 2>/dev/null)
    if [ -n "$BACKEND_HEALTH" ]; then
        echo "   Response: $BACKEND_HEALTH"
    fi
else
    log_error "Backend API is unhealthy (HTTP $BACKEND_STATUS)"
fi
echo ""

# 2. 检查前端
log_info "Checking Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)

if [ "$FRONTEND_STATUS" = "200" ]; then
    log_success "Frontend is healthy (HTTP $FRONTEND_STATUS)"
else
    log_error "Frontend is unhealthy (HTTP $FRONTEND_STATUS)"
fi
echo ""

# 3. 检查数据库
log_info "Checking PostgreSQL Database..."
if command -v psql &> /dev/null; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "PostgreSQL is healthy"
        
        # 获取连接数
        CONN_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
        if [ -n "$CONN_COUNT" ]; then
            echo "   Active connections: $CONN_COUNT"
        fi
        
        # 获取数据库大小
        DB_SIZE=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')
        if [ -n "$DB_SIZE" ]; then
            echo "   Database size: $DB_SIZE"
        fi
    else
        log_error "PostgreSQL connection failed"
    fi
else
    log_warn "psql not found, skipping database check"
fi
echo ""

# 4. 检查 Redis
log_info "Checking Redis..."
if command -v redis-cli &> /dev/null; then
    if [ -n "$REDIS_PASSWORD" ]; then
        REDIS_RESPONSE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping 2>/dev/null)
    else
        REDIS_RESPONSE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null)
    fi
    
    if [ "$REDIS_RESPONSE" = "PONG" ]; then
        log_success "Redis is healthy"
        
        # 获取 Redis 信息
        if [ -n "$REDIS_PASSWORD" ]; then
            REDIS_MEMORY=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
            REDIS_KEYS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" DBSIZE 2>/dev/null | cut -d: -f2 | tr -d ' \r')
        else
            REDIS_MEMORY=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
            REDIS_KEYS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DBSIZE 2>/dev/null | cut -d: -f2 | tr -d ' \r')
        fi
        
        if [ -n "$REDIS_MEMORY" ]; then
            echo "   Memory usage: $REDIS_MEMORY"
        fi
        if [ -n "$REDIS_KEYS" ]; then
            echo "   Keys count: $REDIS_KEYS"
        fi
    else
        log_error "Redis connection failed"
    fi
else
    log_warn "redis-cli not found, skipping Redis check"
fi
echo ""

# 5. 检查磁盘空间
log_info "Checking Disk Space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -lt 80 ]; then
    log_success "Disk space is healthy (${DISK_USAGE}% used)"
elif [ "$DISK_USAGE" -lt 90 ]; then
    log_warn "Disk space is getting low (${DISK_USAGE}% used)"
else
    log_error "Disk space is critical (${DISK_USAGE}% used)"
fi
echo ""

# 6. 检查内存使用
log_info "Checking Memory Usage..."
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        log_success "Memory usage is healthy (${MEMORY_USAGE}% used)"
    elif [ "$MEMORY_USAGE" -lt 90 ]; then
        log_warn "Memory usage is high (${MEMORY_USAGE}% used)"
    else
        log_error "Memory usage is critical (${MEMORY_USAGE}% used)"
    fi
else
    log_warn "free command not found, skipping memory check"
fi
echo ""

# 7. 检查 CPU 负载
log_info "Checking CPU Load..."
if command -v uptime &> /dev/null; then
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    CPU_COUNT=$(nproc 2>/dev/null || echo "1")
    
    echo "   Load average: $LOAD_AVG (CPUs: $CPU_COUNT)"
    
    # 简单的负载检查（负载 > CPU 数量 * 2 为高负载）
    LOAD_THRESHOLD=$(echo "$CPU_COUNT * 2" | bc 2>/dev/null || echo "2")
    LOAD_CHECK=$(echo "$LOAD_AVG > $LOAD_THRESHOLD" | bc 2>/dev/null || echo "0")
    
    if [ "$LOAD_CHECK" = "1" ]; then
        log_warn "CPU load is high"
    else
        log_success "CPU load is normal"
    fi
else
    log_warn "uptime command not found, skipping CPU check"
fi
echo ""

# 总结
print_separator
if [ "$ALL_HEALTHY" = true ]; then
    log_success "All health checks passed!"
    EXIT_CODE=0
else
    log_error "Some health checks failed!"
    EXIT_CODE=1
fi
print_separator
echo ""

exit $EXIT_CODE
