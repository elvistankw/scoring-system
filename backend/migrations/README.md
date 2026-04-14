# Database Migrations

This folder contains SQL migration scripts for the Realtime Scoring System database.

## Running Migrations

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run migrate
```

### Option 2: Using psql directly
```bash
psql -U postgres -d scoring -f backend/migrations/001_initial_schema.sql
```

### Option 3: Using psql with password prompt
```bash
psql -U postgres -d scoring -W -f backend/migrations/001_initial_schema.sql
```

## Migration Files

### 001_initial_schema.sql
Creates the initial database schema including:
- **users** table: Admin and judge accounts
- **competitions** table: Competition events with type and region
- **athletes** table: Athlete and team information
- **competition_athletes** table: Many-to-many relationship
- **scores** table: Judge scores with multiple dimensions
- All required indexes for performance optimization
- Triggers for automatic timestamp updates

## Database Setup

### 1. Create Database
```sql
CREATE DATABASE scoring;
```

### 2. Connect to Database
```bash
psql -U postgres -d scoring
```

### 3. Run Migration
```bash
\i backend/migrations/001_initial_schema.sql
```

### 4. Verify Tables
```sql
\dt
```

Expected output:
```
                List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | athletes              | table | postgres
 public | competition_athletes  | table | postgres
 public | competitions          | table | postgres
 public | scores                | table | postgres
 public | users                 | table | postgres
```

### 5. Verify Indexes
```sql
\di
```

## Requirements Mapping

This migration satisfies the following requirements:
- **Requirement 2.1**: Competition data storage with parameterized queries
- **Requirement 2.2**: Athlete-competition associations
- **Requirement 2.6**: Database persistence before cache updates
- **Requirement 10.4**: Parameterized SQL queries
- **Requirement 10.5**: Backend-only database operations

## Notes

- All tables include `created_at` and `updated_at` timestamps
- Foreign key constraints ensure referential integrity
- Indexes are created for frequently queried columns
- The `scores` table supports all three competition types (individual, duo_team, challenge)
- Unique constraints prevent duplicate scores from the same judge for the same athlete
