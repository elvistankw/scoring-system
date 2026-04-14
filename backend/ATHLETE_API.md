# Athlete Management API Documentation

## Overview

The Athlete Management API provides comprehensive CRUD operations for managing athletes, including search functionality and athlete-competition relationship queries. All endpoints require authentication, and write operations require admin role.

**Base URL**: `/api/athletes`

**Requirements**: 2.2, 2.4, 10.4, 10.5

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Write operations (POST, PUT, DELETE) require admin role.

---

## Endpoints

### 1. Get All Athletes

**GET** `/api/athletes`

Retrieve all athletes with optional filtering and search.

**Query Parameters:**
- `search` (optional): Search by name or athlete_number (partial match, case-insensitive)
- `competition_id` (optional): Filter athletes by competition

**Example Requests:**
```bash
# Get all athletes
GET /api/athletes

# Search by name
GET /api/athletes?search=张三

# Search by athlete number
GET /api/athletes?search=A001

# Filter by competition
GET /api/athletes?competition_id=1

# Combined search and filter
GET /api/athletes?search=张&competition_id=1
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "athletes": [
      {
        "id": 1,
        "name": "张三",
        "athlete_number": "A001",
        "team_name": "测试队",
        "contact_email": "zhangsan@example.com",
        "contact_phone": "13800138000",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### 2. Search Athletes (Dedicated Endpoint)

**GET** `/api/athletes/search`

Search athletes by name or athlete_number with ranking by relevance.

**Query Parameters:**
- `q` (required): Search query string

**Example Request:**
```bash
GET /api/athletes/search?q=张三
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "athletes": [
      {
        "id": 1,
        "name": "张三",
        "athlete_number": "A001",
        "team_name": "测试队",
        "contact_email": "zhangsan@example.com",
        "contact_phone": "13800138000",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "count": 1,
    "query": "张三"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Search query is required"
}
```

---

### 3. Get Athlete by ID

**GET** `/api/athletes/:id`

Retrieve a specific athlete by ID.

**URL Parameters:**
- `id` (required): Athlete ID

**Example Request:**
```bash
GET /api/athletes/1
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "athlete": {
      "id": 1,
      "name": "张三",
      "athlete_number": "A001",
      "team_name": "测试队",
      "contact_email": "zhangsan@example.com",
      "contact_phone": "13800138000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Athlete not found"
}
```

---

### 4. Get Athlete Competitions

**GET** `/api/athletes/:id/competitions`

Retrieve all competitions an athlete is registered for.

**URL Parameters:**
- `id` (required): Athlete ID

**Example Request:**
```bash
GET /api/athletes/1/competitions
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "athlete": {
      "id": 1,
      "name": "张三",
      "athlete_number": "A001",
      "team_name": "测试队",
      "contact_email": "zhangsan@example.com",
      "contact_phone": "13800138000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "competitions": [
      {
        "id": 1,
        "name": "2024春季个人赛",
        "competition_type": "individual",
        "region": "华东赛区",
        "status": "active",
        "start_date": "2024-03-01T00:00:00Z",
        "end_date": "2024-03-03T00:00:00Z",
        "registration_date": "2024-02-15T10:30:00Z",
        "created_by": 1,
        "created_at": "2024-02-01T10:00:00Z",
        "updated_at": "2024-02-01T10:00:00Z"
      }
    ],
    "competition_count": 1
  }
}
```

---

### 5. Create Athlete

**POST** `/api/athletes`

Create a new athlete. Requires admin role.

**Request Body:**
```json
{
  "name": "张三",
  "athlete_number": "A001",
  "team_name": "测试队",
  "contact_email": "zhangsan@example.com",
  "contact_phone": "13800138000"
}
```

**Required Fields:**
- `name`: Athlete name (string)

**Optional Fields:**
- `athlete_number`: Unique athlete number (string)
- `team_name`: Team name (string)
- `contact_email`: Contact email (string)
- `contact_phone`: Contact phone (string)

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Athlete created successfully",
  "data": {
    "athlete": {
      "id": 1,
      "name": "张三",
      "athlete_number": "A001",
      "team_name": "测试队",
      "contact_email": "zhangsan@example.com",
      "contact_phone": "13800138000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Please provide athlete name"
}
```

**Error Response (409 Conflict):**
```json
{
  "status": "error",
  "message": "Athlete number already exists"
}
```

---

### 6. Update Athlete

**PUT** `/api/athletes/:id`

Update an existing athlete. Requires admin role.

**URL Parameters:**
- `id` (required): Athlete ID

**Request Body:**
```json
{
  "name": "张三（更新）",
  "contact_phone": "13900139000"
}
```

**Updatable Fields:**
- `name`: Athlete name
- `athlete_number`: Athlete number (must be unique)
- `team_name`: Team name
- `contact_email`: Contact email
- `contact_phone`: Contact phone

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Athlete updated successfully",
  "data": {
    "athlete": {
      "id": 1,
      "name": "张三（更新）",
      "athlete_number": "A001",
      "team_name": "测试队",
      "contact_email": "zhangsan@example.com",
      "contact_phone": "13900139000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Athlete not found"
}
```

**Error Response (409 Conflict):**
```json
{
  "status": "error",
  "message": "Athlete number already exists"
}
```

---

### 7. Delete Athlete

**DELETE** `/api/athletes/:id`

Delete an athlete. Requires admin role.

**URL Parameters:**
- `id` (required): Athlete ID

**Example Request:**
```bash
DELETE /api/athletes/1
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Athlete deleted successfully",
  "data": null
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Athlete not found"
}
```

---

## Security Features

### Parameterized Queries

All database operations use parameterized queries to prevent SQL injection:

```javascript
// ✅ Correct - Parameterized query
db.query('SELECT * FROM athletes WHERE id = $1', [id]);

// ❌ Wrong - String concatenation (vulnerable to SQL injection)
db.query(`SELECT * FROM athletes WHERE id = ${id}`);
```

### Duplicate Prevention

The system prevents duplicate athlete numbers:
- On creation: Checks if athlete_number already exists
- On update: Checks if new athlete_number conflicts with other athletes

### Role-Based Access Control

- **Read operations** (GET): Require authentication (any role)
- **Write operations** (POST, PUT, DELETE): Require admin role

---

## Database Indexes

The following indexes optimize query performance:

```sql
CREATE INDEX idx_athletes_number ON athletes(athlete_number);
CREATE INDEX idx_athletes_name ON athletes(name);
CREATE INDEX idx_athletes_team_name ON athletes(team_name);
```

---

## Usage Examples

### Frontend Integration

```typescript
// hooks/use-athletes.ts
import useSWR from 'swr';
import { athletesApi } from '@/lib/api-config';

export function useAthletes(search?: string, competitionId?: number) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (competitionId) params.append('competition_id', competitionId.toString());
  
  const url = `${athletesApi.list}?${params.toString()}`;
  const { data, error, mutate } = useSWR(url);
  
  return {
    athletes: data?.data?.athletes,
    count: data?.data?.count,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}
```

### Search Implementation

```typescript
// components/admin/athlete-search.tsx
import { useState } from 'react';
import { useAthletes } from '@/hooks/use-athletes';

export function AthleteSearch() {
  const [search, setSearch] = useState('');
  const { athletes, count, isLoading } = useAthletes(search);
  
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索选手姓名或编号"
      />
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div>
          <p>找到 {count} 位选手</p>
          {athletes?.map(athlete => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Testing

Run integration tests:

```bash
cd backend
node test-athletes.js
```

The test suite covers:
- ✅ Athlete creation
- ✅ Search by name and athlete_number
- ✅ Athlete-competition relationships
- ✅ Update and delete operations
- ✅ Duplicate prevention
- ✅ Authorization checks

---

## Related APIs

- **Competition API**: `/api/competitions` - Manage competitions
- **Competition-Athlete Association**: `/api/competitions/:id/athletes` - Link athletes to competitions
- **Scores API**: `/api/scores` - Submit and retrieve scores for athletes

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Search is case-insensitive and supports partial matches
3. Deleting an athlete will cascade delete their competition associations and scores
4. The `updated_at` field is automatically updated on every modification
5. Maximum 50 results returned for search endpoint (can be adjusted)
