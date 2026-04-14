#!/bin/bash

# 数据库备份脚本
# 用途: 自动备份 PostgreSQL 数据库
# 使用: ./backup-database.sh

# 配置
DB_NAME="${DB_NAME:-scoring}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/scoring_$DATE.sql"
RETENTION_DAYS=7

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 pg_dump 是否存在
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    if [ $? -ne 0 ]; then
        log_error "Failed to create backup directory"
        exit 1
    fi
fi

# 检查磁盘空间
AVAILABLE_SPACE=$(df -BM "$BACKUP_DIR" | awk 'NR==2 {print $4}' | sed 's/M//')
if [ "$AVAILABLE_SPACE" -lt 100 ]; then
    log_warn "Low disk space: ${AVAILABLE_SPACE}MB available"
fi

# 备份数据库
log_info "Starting database backup..."
log_info "Database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE"

PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log_info "Database backup completed successfully"
    
    # 压缩备份
    log_info "Compressing backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        log_info "Backup compressed: ${BACKUP_FILE}.gz (${BACKUP_SIZE})"
    else
        log_error "Failed to compress backup"
        exit 1
    fi
else
    log_error "Database backup failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 删除旧备份
log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "scoring_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log_info "Deleted $DELETED_COUNT old backup(s)"
else
    log_info "No old backups to delete"
fi

# 列出当前备份
log_info "Current backups:"
ls -lh "$BACKUP_DIR"/scoring_*.sql.gz | tail -5

# 备份完成
log_info "Backup process completed successfully"
log_info "Backup location: ${BACKUP_FILE}.gz"

exit 0
