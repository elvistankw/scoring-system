# Deployment Guide - Realtime Scoring System

This guide covers deployment of the Realtime Scoring System to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Production Checklist](#production-checklist)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **PostgreSQL**: v12.x or higher
- **Redis**: v6.x or higher
- **npm** or **yarn**: Latest stable version

### Production Server Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum
- **Network**: Stable internet connection with open ports

### Required Ports

- **3000**: Next.js frontend (or custom port)
- **5000**: Express backend API (or custom port)
- **5432**: PostgreSQL database
- **6379**: Redis cache

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd scoring-system
```

### 2. Configure Environment Variables

#### Frontend (.env.local)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=https://api.yourdomain.com
```

#### Backend (backend/.env)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DB_USER=scoring_user
DB_HOST=localhost
DB_NAME=scoring_production
DB_PASSWORD=<strong-password>
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password-if-required>
REDIS_DB=0

JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=24h

PORT=5000
NODE_ENV=production

CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Generate Secure JWT Secret

```bash
openssl rand -base64 32
```

Copy the output to `JWT_SECRET` in `backend/.env`.

---

## Database Migration

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE scoring_production;
CREATE USER scoring_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE scoring_production TO scoring_user;

# Exit psql
\q
```

### 2. Run Migrations

```bash
cd backend
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema.sql
```

### 3. Verify Database Setup

```bash
psql -U scoring_user -d scoring_production

# List tables
\dt

# Check indexes
\di

# Exit
\q
```

Expected tables:
- users
- competitions
- athletes
- competition_athletes
- scores

---

## Backend Deployment

### Option 1: PM2 (Recommended for Production)

#### Install PM2

```bash
npm install -g pm2
```

#### Start Backend with PM2

```bash
cd backend
npm install --production
pm2 start index.js --name scoring-backend
pm2 save
pm2 startup
```

#### PM2 Commands

```bash
# View logs
pm2 logs scoring-backend

# Restart
pm2 restart scoring-backend

# Stop
pm2 stop scoring-backend

# Monitor
pm2 monit
```

### Option 2: systemd Service

Create `/etc/systemd/system/scoring-backend.service`:

```ini
[Unit]
Description=Scoring System Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/scoring-system/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable scoring-backend
sudo systemctl start scoring-backend
sudo systemctl status scoring-backend
```

### Option 3: Docker (See Docker Section)

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub/GitLab
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
4. Deploy

### Option 2: Self-Hosted with PM2

```bash
# Build frontend
npm install
npm run build

# Start with PM2
pm2 start npm --name scoring-frontend -- start
pm2 save
```

### Option 3: Nginx + PM2

#### Build and Start

```bash
npm install
npm run build
pm2 start npm --name scoring-frontend -- start
```

#### Nginx Configuration

Create `/etc/nginx/sites-available/scoring-system`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/scoring-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Docker Deployment

### Docker Compose Setup

See `docker-compose.yml` and individual Dockerfiles for complete setup.

#### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production Docker Compose

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Container Management

```bash
# Build backend
docker build -t scoring-backend ./backend

# Build frontend
docker build -t scoring-frontend .

# Run backend
docker run -d --name scoring-backend \
  --env-file backend/.env \
  -p 5000:5000 \
  scoring-backend

# Run frontend
docker run -d --name scoring-frontend \
  --env-file .env.local \
  -p 3000:3000 \
  scoring-frontend
```

---

## Production Checklist

### Security

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL certificates (Let's Encrypt)
- [ ] Configure CORS to allow only your domain
- [ ] Enable Redis password authentication
- [ ] Set `NODE_ENV=production`
- [ ] Review and configure rate limiting
- [ ] Enable PostgreSQL SSL connections
- [ ] Disable unnecessary ports in firewall
- [ ] Set up fail2ban for SSH protection

### Performance

- [ ] Enable Redis persistence (AOF or RDB)
- [ ] Configure PostgreSQL connection pooling
- [ ] Set up database indexes (already in migration)
- [ ] Enable gzip compression in Nginx
- [ ] Configure CDN for static assets
- [ ] Set up Redis maxmemory policy
- [ ] Optimize PostgreSQL configuration
- [ ] Enable HTTP/2 in Nginx

### Monitoring

- [ ] Set up application logging
- [ ] Configure PM2 monitoring
- [ ] Set up database backup automation
- [ ] Configure Redis backup
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring (New Relic, DataDog)
- [ ] Create health check endpoints

### Backup

- [ ] Automate PostgreSQL backups
- [ ] Automate Redis snapshots
- [ ] Store backups off-site
- [ ] Test backup restoration
- [ ] Document backup procedures

---

## Monitoring and Maintenance

### Health Checks

#### Backend Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

#### Database Connection Test

```bash
psql -U scoring_user -d scoring_production -c "SELECT NOW();"
```

#### Redis Connection Test

```bash
redis-cli ping
```

### Log Management

#### PM2 Logs

```bash
# View all logs
pm2 logs

# View specific service
pm2 logs scoring-backend

# Clear logs
pm2 flush
```

#### System Logs

```bash
# Backend service logs
sudo journalctl -u scoring-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Maintenance

#### Backup Database

```bash
# Create backup
pg_dump -U scoring_user scoring_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restore Database

```bash
# Restore from backup
psql -U scoring_user scoring_production < backup_20240115_103000.sql
```

#### Vacuum and Analyze

```bash
psql -U scoring_user -d scoring_production -c "VACUUM ANALYZE;"
```

### Redis Maintenance

#### Save Redis Snapshot

```bash
redis-cli SAVE
```

#### Check Redis Memory Usage

```bash
redis-cli INFO memory
```

#### Clear Redis Cache (if needed)

```bash
redis-cli FLUSHDB
```

### Performance Monitoring

#### Check Backend Performance

```bash
# CPU and memory usage
pm2 monit

# Detailed process info
pm2 show scoring-backend
```

#### Check Database Performance

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Scaling Considerations

#### Horizontal Scaling

- Use load balancer (Nginx, HAProxy) for multiple backend instances
- Configure Redis in cluster mode
- Use PostgreSQL read replicas for read-heavy workloads

#### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize PostgreSQL configuration for larger datasets
- Increase Redis maxmemory limit

---

## Troubleshooting

### Backend Won't Start

1. Check environment variables: `cat backend/.env`
2. Verify database connection: `psql -U scoring_user -d scoring_production`
3. Verify Redis connection: `redis-cli ping`
4. Check logs: `pm2 logs scoring-backend`
5. Verify port availability: `netstat -tuln | grep 5000`

### Frontend Build Fails

1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check environment variables: `cat .env.local`
4. Verify API URL is accessible

### WebSocket Connection Issues

1. Verify backend is running: `curl http://localhost:5000/health`
2. Check CORS configuration in backend
3. Verify WebSocket URL in frontend `.env.local`
4. Check Nginx WebSocket proxy configuration
5. Verify firewall allows WebSocket connections

### Database Performance Issues

1. Run VACUUM ANALYZE: `psql -U scoring_user -d scoring_production -c "VACUUM ANALYZE;"`
2. Check for missing indexes
3. Review slow query log
4. Increase PostgreSQL shared_buffers if needed

### Redis Memory Issues

1. Check memory usage: `redis-cli INFO memory`
2. Configure maxmemory policy: `redis-cli CONFIG SET maxmemory-policy allkeys-lru`
3. Clear old data: `redis-cli FLUSHDB` (use with caution)

---

## Support and Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Redis Documentation**: https://redis.io/documentation
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Documentation**: https://nginx.org/en/docs/

---

## Requirements Satisfied

This deployment guide satisfies:
- **Requirement 1**: JWT authentication setup
- **Requirement 2**: Competition and athlete data management
- **Requirement 6**: Real-time score broadcasting infrastructure
- **Requirement 10**: Frontend-backend separation
- **Requirement 20**: WebSocket connection management

For user-specific guides, see:
- `ADMIN_GUIDE.md` - Admin user documentation
- `JUDGE_GUIDE.md` - Judge user documentation
- `DISPLAY_GUIDE.md` - Display screen setup
