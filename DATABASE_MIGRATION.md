# Database Migration Instructions

This guide provides detailed instructions for setting up and migrating the PostgreSQL database for the Realtime Scoring System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Migration Files](#migration-files)
4. [Running Migrations](#running-migrations)
5. [Rollback Procedures](#rollback-procedures)
6. [Data Seeding](#data-seeding)
7. [Backup and Restore](#backup-and-restore)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **PostgreSQL**: Version 12 or higher
- **psql**: PostgreSQL command-line tool
- **Node.js**: Version 18 or higher (for npm scripts)

### Verify Installation

```bash
# Check PostgreSQL version
psql --version

# Check PostgreSQL service status
# Windows
pg_isready

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

---

## Initial Setup

### 1. Create Database User

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database user
CREATE USER scoring_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant necessary privileges
ALTER USER scoring_user CREATEDB;

# Exit psql
\q
```

### 2. Create Database

#### Option A: Using psql

```bash
# Connect as postgres user
psql -U postgres

# Create database
CREATE DATABASE scoring_production;

# Grant privileges to scoring_user
GRANT ALL PRIVILEGES ON DATABASE scoring_production TO scoring_user;

# Exit
\q
```

#### Option B: Using SQL Script

```bash
# Run the setup script
psql -U postgres -f backend/setup-database.sql
```

**backend/setup-database.sql:**
```sql
-- Create database
CREATE DATABASE scoring_production;

-- Connect to the database
\c scoring_production

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'scoring_user') THEN
      CREATE USER scoring_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE scoring_production TO scoring_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scoring_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scoring_user;
```

### 3. Configure Environment Variables

Update `backend/.env`:

```env
DB_USER=scoring_user
DB_HOST=localhost
DB_NAME=scoring_production
DB_PASSWORD=your_secure_password
DB_PORT=5432
```

---

## Migration Files

### Migration File Structure

```
backend/migrations/
├── 001_initial_schema.sql       # Initial database schema
├── 002_add_indexes.sql          # Performance indexes (if needed)
├── 003_add_constraints.sql      # Additional constraints (if needed)
└── README.md                    # Migration documentation
```

### Migration Naming Convention

Format: `{version}_{description}.sql`

Examples:
- `001_initial_schema.sql`
- `002_add_user_roles.sql`
- `003_add_score_validation.sql`

### Current Migration: 001_initial_schema.sql

This migration creates:
- **users** table: Admin and judge accounts
- **competitions** table: Competition events
- **athletes** table: Athlete/team information
- **competition_athletes** table: Many-to-many relationship
- **scores** table: Judge scores with dimensions
- **Indexes**: Performance optimization indexes
- **Constraints**: Foreign keys and check constraints

---

## Running Migrations

### Method 1: Using npm Script (Recommended)

```bash
cd backend
npm run migrate
```

This runs: `psql -U scoring_user -d scoring_production -f migrations/001_initial_schema.sql`

### Method 2: Manual Execution

```bash
# Navigate to backend directory
cd backend

# Run migration
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema.sql
```

### Method 3: Using psql Interactive Mode

```bash
# Connect to database
psql -U scoring_user -d scoring_production

# Run migration file
\i migrations/001_initial_schema.sql

# Exit
\q
```

### Verify Migration Success

```bash
# Connect to database
psql -U scoring_user -d scoring_production

# List all tables
\dt

# Expected output:
#              List of relations
#  Schema |        Name          | Type  |    Owner
# --------+----------------------+-------+--------------
#  public | athletes             | table | scoring_user
#  public | competition_athletes | table | scoring_user
#  public | competitions         | table | scoring_user
#  public | scores               | table | scoring_user
#  public | users                | table | scoring_user

# List all indexes
\di

# Describe specific table
\d users
\d competitions
\d athletes
\d scores

# Exit
\q
```

---

## Rollback Procedures

### Create Rollback Script

**backend/migrations/001_initial_schema_rollback.sql:**

```sql
-- Rollback for 001_initial_schema.sql
-- WARNING: This will delete all data!

-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS competition_athletes CASCADE;
DROP TABLE IF EXISTS athletes CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop indexes (if they weren't cascade deleted)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_competitions_type;
DROP INDEX IF EXISTS idx_competitions_region;
DROP INDEX IF EXISTS idx_competitions_status;
DROP INDEX IF EXISTS idx_competitions_created_by;
DROP INDEX IF EXISTS idx_competitions_start_date;
DROP INDEX IF EXISTS idx_athletes_number;
DROP INDEX IF EXISTS idx_athletes_name;
DROP INDEX IF EXISTS idx_athletes_team_name;
DROP INDEX IF EXISTS idx_comp_athletes_comp;
DROP INDEX IF EXISTS idx_comp_athletes_athlete;
DROP INDEX IF EXISTS idx_comp_athletes_reg_date;
DROP INDEX IF EXISTS idx_scores_competition;
DROP INDEX IF EXISTS idx_scores_athlete;
DROP INDEX IF EXISTS idx_scores_judge;
DROP INDEX IF EXISTS idx_scores_submitted;
DROP INDEX IF EXISTS idx_scores_comp_athlete;
```

### Execute Rollback

```bash
# CAUTION: This will delete all data!
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema_rollback.sql
```

### Rollback and Re-run Migration

```bash
# Rollback
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema_rollback.sql

# Re-run migration
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema.sql
```

---

## Data Seeding

### Create Seed Data Script

**backend/seeds/001_initial_data.sql:**

```sql
-- Seed initial data for testing and development

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'admin',
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere',
  'admin'
);

-- Insert judge users
INSERT INTO users (username, email, password_hash, role)
VALUES 
  ('judge1', 'judge1@example.com', '$2b$10$YourHashedPasswordHere', 'judge'),
  ('judge2', 'judge2@example.com', '$2b$10$YourHashedPasswordHere', 'judge'),
  ('judge3', 'judge3@example.com', '$2b$10$YourHashedPasswordHere', 'judge');

-- Insert sample competitions
INSERT INTO competitions (name, competition_type, region, status, start_date, end_date, created_by)
VALUES 
  ('2024春季个人赛', 'individual', '华东赛区', 'active', '2024-05-01 09:00:00', '2024-05-01 18:00:00', 1),
  ('2024春季双人赛', 'duo_team', '华东赛区', 'upcoming', '2024-05-02 09:00:00', '2024-05-02 18:00:00', 1),
  ('2024春季挑战赛', 'challenge', '华北赛区', 'upcoming', '2024-05-03 09:00:00', '2024-05-03 18:00:00', 1);

-- Insert sample athletes
INSERT INTO athletes (name, athlete_number, team_name, contact_email, contact_phone)
VALUES 
  ('张三', 'A001', NULL, 'zhangsan@example.com', '13800138000'),
  ('李四', 'A002', NULL, 'lisi@example.com', '13800138001'),
  ('王五', 'A003', NULL, 'wangwu@example.com', '13800138002'),
  ('龙腾队', 'T001', '龙腾队', 'longteng@example.com', '13800138003'),
  ('凤凰队', 'T002', '凤凰队', 'fenghuang@example.com', '13800138004');

-- Register athletes for competitions
INSERT INTO competition_athletes (competition_id, athlete_id)
VALUES 
  (1, 1), (1, 2), (1, 3),  -- Individual competition
  (2, 4), (2, 5),          -- Duo/Team competition
  (3, 1), (3, 2);          -- Challenge competition
```

### Run Seed Script

```bash
# Development/Testing only
psql -U scoring_user -d scoring_production -f backend/seeds/001_initial_data.sql
```

### Generate Password Hashes

```javascript
// backend/generate-hash.js
const bcrypt = require('bcrypt');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

generateHash('admin123');
generateHash('judge123');
```

Run:
```bash
node backend/generate-hash.js
```

---

## Backup and Restore

### Create Backup

#### Full Database Backup

```bash
# Backup entire database
pg_dump -U scoring_user scoring_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump -U scoring_user scoring_production | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### Schema-Only Backup

```bash
# Backup schema without data
pg_dump -U scoring_user --schema-only scoring_production > schema_backup.sql
```

#### Data-Only Backup

```bash
# Backup data without schema
pg_dump -U scoring_user --data-only scoring_production > data_backup.sql
```

#### Specific Tables Backup

```bash
# Backup specific tables
pg_dump -U scoring_user -t users -t competitions scoring_production > tables_backup.sql
```

### Restore from Backup

#### Restore Full Database

```bash
# Drop existing database (CAUTION!)
psql -U postgres -c "DROP DATABASE scoring_production;"

# Create new database
psql -U postgres -c "CREATE DATABASE scoring_production;"

# Restore from backup
psql -U scoring_user scoring_production < backup_20240115_103000.sql
```

#### Restore from Compressed Backup

```bash
# Restore from gzipped backup
gunzip -c backup_20240115_103000.sql.gz | psql -U scoring_user scoring_production
```

#### Restore Specific Tables

```bash
# Restore only specific tables
psql -U scoring_user scoring_production < tables_backup.sql
```

### Automated Backup Script

**backend/scripts/backup.sh:**

```bash
#!/bin/bash

# Configuration
DB_USER="scoring_user"
DB_NAME="scoring_production"
BACKUP_DIR="/var/backups/scoring"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Make executable:
```bash
chmod +x backend/scripts/backup.sh
```

### Schedule Automated Backups

#### Using cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backend/scripts/backup.sh
```

#### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 2 AM)
4. Set action: Run `backup.sh` script

---

## Troubleshooting

### Migration Fails: Permission Denied

**Problem:**
```
ERROR: permission denied for schema public
```

**Solution:**
```sql
-- Connect as postgres
psql -U postgres -d scoring_production

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO scoring_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scoring_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scoring_user;
```

### Migration Fails: Table Already Exists

**Problem:**
```
ERROR: relation "users" already exists
```

**Solution:**
```bash
# Option 1: Drop existing tables
psql -U scoring_user -d scoring_production -c "DROP TABLE IF EXISTS users CASCADE;"

# Option 2: Use rollback script
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema_rollback.sql

# Then re-run migration
psql -U scoring_user -d scoring_production -f migrations/001_initial_schema.sql
```

### Cannot Connect to Database

**Problem:**
```
psql: error: connection to server at "localhost" (::1), port 5432 failed
```

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
# Windows
pg_isready

# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

2. **Start PostgreSQL:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start postgresql-x64-14
```

3. **Check pg_hba.conf:**
```bash
# Find pg_hba.conf location
psql -U postgres -c "SHOW hba_file;"

# Edit file and add:
# local   all   all   md5
# host    all   all   127.0.0.1/32   md5
```

### Foreign Key Constraint Violation

**Problem:**
```
ERROR: insert or update on table "scores" violates foreign key constraint
```

**Solution:**
```sql
-- Verify referenced records exist
SELECT * FROM competitions WHERE id = 1;
SELECT * FROM athletes WHERE id = 5;
SELECT * FROM users WHERE id = 3;

-- If missing, insert required records first
```

### Index Creation Fails

**Problem:**
```
ERROR: could not create unique index "idx_athletes_number"
```

**Solution:**
```sql
-- Find duplicate values
SELECT athlete_number, COUNT(*)
FROM athletes
GROUP BY athlete_number
HAVING COUNT(*) > 1;

-- Remove duplicates or update values
UPDATE athletes SET athlete_number = 'A001_NEW' WHERE id = 2;

-- Then create index
CREATE UNIQUE INDEX idx_athletes_number ON athletes(athlete_number);
```

---

## Migration Best Practices

1. **Always backup before migration**: Create a backup before running any migration
2. **Test in development first**: Test migrations in development environment
3. **Use transactions**: Wrap migrations in transactions when possible
4. **Version control**: Keep migration files in version control
5. **Document changes**: Add comments explaining complex migrations
6. **Rollback plan**: Always have a rollback script ready
7. **Monitor performance**: Check query performance after adding indexes
8. **Validate data**: Verify data integrity after migration

---

## Requirements Satisfied

This migration guide supports:
- **Requirement 2.1**: Competition data storage
- **Requirement 2.2**: Athlete-competition associations
- **Requirement 2.6**: Database persistence with parameterized queries
- **Requirement 10.4**: Parameterized SQL queries
- **Requirement 10.5**: Backend-only database operations

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Database Schema Reference](backend/DATABASE_SCHEMA.md)
- [Backend Setup Guide](backend/SETUP.md)
