# Database Schema Reference

## Quick Reference

### Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| users | Admin and judge accounts | → competitions (created_by), scores (judge_id) |
| competitions | Competition events | ← users, ↔ athletes, → scores |
| athletes | Athlete/team information | ↔ competitions, → scores |
| competition_athletes | Competition-athlete association | ← competitions, ← athletes |
| scores | Judge scores | ← competitions, ← athletes, ← users |

## Table Details

### users
```sql
id              SERIAL PRIMARY KEY
username        VARCHAR(50) UNIQUE NOT NULL
email           VARCHAR(100) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
role            VARCHAR(20) CHECK (role IN ('admin', 'judge'))
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**
- `idx_users_email` on email
- `idx_users_role` on role
- `idx_users_username` on username

**Constraints:**
- Unique: username, email
- Check: role IN ('admin', 'judge')

---

### competitions
```sql
id                SERIAL PRIMARY KEY
name              VARCHAR(100) NOT NULL
competition_type  VARCHAR(20) CHECK (competition_type IN ('individual', 'duo_team', 'challenge'))
region            VARCHAR(50) NOT NULL
division          VARCHAR(50)
status            VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed'))
start_date        TIMESTAMP
end_date          TIMESTAMP
created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**
- `idx_competitions_type` on competition_type
- `idx_competitions_region` on region
- `idx_competitions_division` on division
- `idx_competitions_status` on status
- `idx_competitions_created_by` on created_by
- `idx_competitions_start_date` on start_date

**Constraints:**
- Check: competition_type IN ('individual', 'duo_team', 'challenge')
- Check: status IN ('upcoming', 'active', 'completed')
- Foreign Key: created_by → users(id)

**Competition Types:**
- `individual`: Individual Stage (5 dimensions)
- `duo_team`: Duo/Team Stage (5 dimensions with interaction)
- `challenge`: Challenge (3 dimensions)

---

### athletes
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
athlete_number  VARCHAR(20) UNIQUE
team_name       VARCHAR(100)
contact_email   VARCHAR(100)
contact_phone   VARCHAR(20)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**
- `idx_athletes_number` on athlete_number
- `idx_athletes_name` on name
- `idx_athletes_team_name` on team_name

**Constraints:**
- Unique: athlete_number

---

### competition_athletes
```sql
id                  SERIAL PRIMARY KEY
competition_id      INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE
athlete_id          INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE
registration_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(competition_id, athlete_id)
```

**Indexes:**
- `idx_comp_athletes_comp` on competition_id
- `idx_comp_athletes_athlete` on athlete_id
- `idx_comp_athletes_reg_date` on registration_date

**Constraints:**
- Unique: (competition_id, athlete_id)
- Foreign Key: competition_id → competitions(id) CASCADE
- Foreign Key: athlete_id → athletes(id) CASCADE

---

### scores
```sql
id                   SERIAL PRIMARY KEY
competition_id       INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE
athlete_id           INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE
judge_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
action_difficulty    DECIMAL(5,2)
stage_artistry       DECIMAL(5,2)
action_creativity    DECIMAL(5,2)
action_fluency       DECIMAL(5,2)
costume_styling      DECIMAL(5,2)
action_interaction   DECIMAL(5,2)
submitted_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(competition_id, athlete_id, judge_id)
```

**Indexes:**
- `idx_scores_competition` on competition_id
- `idx_scores_athlete` on athlete_id
- `idx_scores_judge` on judge_id
- `idx_scores_submitted` on submitted_at DESC
- `idx_scores_comp_athlete` on (competition_id, athlete_id)

**Constraints:**
- Unique: (competition_id, athlete_id, judge_id)
- Foreign Key: competition_id → competitions(id) CASCADE
- Foreign Key: athlete_id → athletes(id) CASCADE
- Foreign Key: judge_id → users(id) CASCADE

**Score Dimensions by Competition Type:**

| Dimension | Individual | Duo/Team | Challenge |
|-----------|-----------|----------|-----------|
| action_difficulty | ✅ | ✅ | ✅ |
| stage_artistry | ✅ | ✅ | ❌ |
| action_creativity | ✅ | ✅ | ✅ |
| action_fluency | ✅ | ❌ | ✅ |
| costume_styling | ✅ | ✅ | ❌ |
| action_interaction | ❌ | ✅ | ❌ |

---

## Relationships Diagram

```
┌─────────────┐
│    users    │
│  (admin/    │
│   judge)    │
└──────┬──────┘
       │ created_by
       │
       ▼
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│  competitions   │◄───────►│ competition_athletes │◄───────►│   athletes  │
│  (events)       │         │  (many-to-many)      │         │  (players)  │
└────────┬────────┘         └──────────────────────┘         └──────┬──────┘
         │                                                           │
         │                  ┌─────────────┐                         │
         └─────────────────►│   scores    │◄────────────────────────┘
                            │  (results)  │
                            └──────┬──────┘
                                   │ judge_id
                                   │
                            ┌──────▼──────┐
                            │    users    │
                            │   (judge)   │
                            └─────────────┘
```

## Common Queries

### Get all athletes in a competition
```sql
SELECT a.*
FROM athletes a
JOIN competition_athletes ca ON a.id = ca.athlete_id
WHERE ca.competition_id = $1;
```

### Get all scores for an athlete in a competition
```sql
SELECT s.*, u.username as judge_name
FROM scores s
JOIN users u ON s.judge_id = u.id
WHERE s.competition_id = $1 AND s.athlete_id = $2;
```

### Get active competitions
```sql
SELECT * FROM competitions
WHERE status = 'active'
ORDER BY start_date DESC;
```

### Get competitions by region
```sql
SELECT * FROM competitions
WHERE region = $1
ORDER BY start_date DESC;
```

### Get latest scores for a competition
```sql
SELECT s.*, a.name as athlete_name, u.username as judge_name
FROM scores s
JOIN athletes a ON s.athlete_id = a.id
JOIN users u ON s.judge_id = u.id
WHERE s.competition_id = $1
ORDER BY s.submitted_at DESC
LIMIT 10;
```

### Check if judge already scored an athlete
```sql
SELECT EXISTS(
    SELECT 1 FROM scores
    WHERE competition_id = $1
    AND athlete_id = $2
    AND judge_id = $3
) as already_scored;
```

## Data Validation Rules

### Users
- Username: 3-50 characters, alphanumeric
- Email: Valid email format
- Password: Minimum 8 characters (hashed with bcrypt)
- Role: Must be 'admin' or 'judge'

### Competitions
- Name: 1-100 characters
- Type: Must be 'individual', 'duo_team', or 'challenge'
- Region: 1-50 characters
- Status: Must be 'upcoming', 'active', or 'completed'
- Dates: start_date should be before end_date

### Athletes
- Name: 1-100 characters
- Athlete number: Unique, 1-20 characters
- Team name: Optional, 1-100 characters
- Email: Valid email format if provided
- Phone: Valid phone format if provided

### Scores
- All score dimensions: DECIMAL(5,2) - allows values like 28.50
- Typical range: 0-30 per dimension
- Required dimensions depend on competition type
- One score per judge per athlete per competition

## Performance Considerations

### Indexed Queries (Fast)
- ✅ Find user by email
- ✅ Find competitions by type/region/status
- ✅ Find athletes by number
- ✅ Find scores by competition
- ✅ Find scores by athlete
- ✅ Find scores by judge
- ✅ Get latest scores (submitted_at DESC)

### Composite Index Usage
- ✅ Find scores by competition and athlete together

### Avoid
- ❌ Full table scans without WHERE clause
- ❌ LIKE queries without leading wildcard
- ❌ Joining without indexed columns
- ❌ Selecting unnecessary columns

## Backup and Maintenance

### Backup Database
```bash
pg_dump -U postgres scoring > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U postgres scoring < backup_20240115.sql
```

### Vacuum and Analyze
```sql
VACUUM ANALYZE;
```

### Check Table Sizes
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```
