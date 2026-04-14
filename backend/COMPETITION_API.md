# Competition Management API Documentation

## Overview

The Competition Management API provides CRUD operations for managing competitions, including athlete associations, filtering, and Redis caching for optimal performance.

**Requirements Implemented:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 10.4, 10.5

## Base URL

```
http://localhost:5000/api/competitions
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get All Competitions

**GET** `/api/competitions`

Retrieve all competitions with optional filtering by status, region, and type.

**Query Parameters:**
- `status` (optional): Filter by status (`upcoming`, `active`, `completed`)
- `region` (optional): Filter by region (e.g., `华东赛区`, `华北赛区`)
- `type` (optional): Filter by competition type (`individual`, `duo_team`, `challenge`)

**Response:**
```json
{
  "status": "success",
  "cached": false,
  "data": {
    "competitions": [
      {
        "id": 1,
        "name": "2024春季个人赛",
        "competition_type": "individual",
        "region": "华东赛区",
        "status": "active",
        "start_date": "2024-05-01T09:00:00Z",
        "end_date": "2024-05-01T18:00:00Z",
        "created_by": 1,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

**Cache:** Results are cached for 1 hour with key pattern `competitions:list:{status}:{region}:{type}`

---

### 2. Get Competition by ID

**GET** `/api/competitions/:id`

Retrieve a specific competition by its ID.

**URL Parameters:**
- `id` (required): Competition ID

**Response:**
```json
{
  "status": "success",
  "cached": false,
  "data": {
    "competition": {
      "id": 1,
      "name": "2024春季个人赛",
      "competition_type": "individual",
      "region": "华东赛区",
      "status": "active",
      "start_date": "2024-05-01T09:00:00Z",
      "end_date": "2024-05-01T18:00:00Z",
      "created_by": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Cache:** Results are cached for 1 hour with key `competition:{id}`

**Error Responses:**
- `400`: Invalid competition ID
- `404`: Competition not found

---

### 3. Create Competition

**POST** `/api/competitions`

Create a new competition. **Requires admin role.**

**Request Body:**
```json
{
  "name": "2024春季个人赛",
  "competition_type": "individual",
  "region": "华东赛区",
  "status": "upcoming",
  "start_date": "2024-05-01T09:00:00Z",
  "end_date": "2024-05-01T18:00:00Z"
}
```

**Required Fields:**
- `name`: Competition name
- `competition_type`: Must be `individual`, `duo_team`, or `challenge`
- `region`: Regional division

**Optional Fields:**
- `status`: Competition status (default: `upcoming`)
- `start_date`: Competition start date/time
- `end_date`: Competition end date/time

**Response:**
```json
{
  "status": "success",
  "message": "Competition created successfully",
  "data": {
    "competition": {
      "id": 1,
      "name": "2024春季个人赛",
      "competition_type": "individual",
      "region": "华东赛区",
      "status": "upcoming",
      "start_date": "2024-05-01T09:00:00Z",
      "end_date": "2024-05-01T18:00:00Z",
      "created_by": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Cache Behavior:**
- Invalidates all competition list caches
- Caches the new competition with key `competition:{id}`
- Adds to `active_competitions` set if status is `active`

**Error Responses:**
- `400`: Missing required fields or invalid values
- `403`: User is not an admin

---

### 4. Update Competition

**PUT** `/api/competitions/:id`

Update an existing competition. **Requires admin role.**

**URL Parameters:**
- `id` (required): Competition ID

**Request Body:** (all fields optional)
```json
{
  "name": "2024春季个人赛（更新）",
  "competition_type": "individual",
  "region": "华东赛区",
  "status": "active",
  "start_date": "2024-05-01T09:00:00Z",
  "end_date": "2024-05-01T18:00:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Competition updated successfully",
  "data": {
    "competition": {
      "id": 1,
      "name": "2024春季个人赛（更新）",
      "competition_type": "individual",
      "region": "华东赛区",
      "status": "active",
      "start_date": "2024-05-01T09:00:00Z",
      "end_date": "2024-05-01T18:00:00Z",
      "created_by": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

**Cache Behavior:**
- Invalidates competition cache (`competition:{id}`)
- Invalidates all competition list caches
- Updates `active_competitions` set based on status

**Error Responses:**
- `400`: Invalid competition ID, invalid values, or no fields to update
- `403`: User is not an admin
- `404`: Competition not found

---

### 5. Delete Competition

**DELETE** `/api/competitions/:id`

Delete a competition. **Requires admin role.**

**URL Parameters:**
- `id` (required): Competition ID

**Response:**
```json
{
  "status": "success",
  "message": "Competition deleted successfully",
  "data": null
}
```

**Cache Behavior:**
- Removes competition cache (`competition:{id}`)
- Removes from `active_competitions` set
- Invalidates all competition list caches
- Cleans up related cache keys (scores, leaderboard, WebSocket connections)

**Database Behavior:**
- Cascade deletes related records in `competition_athletes` and `scores` tables

**Error Responses:**
- `400`: Invalid competition ID
- `403`: User is not an admin
- `404`: Competition not found

---

### 6. Add Athlete to Competition

**POST** `/api/competitions/:id/athletes`

Associate an athlete with a competition. **Requires admin role.**

**URL Parameters:**
- `id` (required): Competition ID

**Request Body:**
```json
{
  "athlete_id": 5
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Athlete added to competition successfully",
  "data": {
    "association": {
      "id": 1,
      "competition_id": 1,
      "athlete_id": 5,
      "registration_date": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Cache Behavior:**
- Invalidates competition cache (`competition:{id}`)
- Invalidates competition athletes cache (`competition:{id}:athletes`)

**Error Responses:**
- `400`: Invalid competition ID or athlete ID
- `403`: User is not an admin
- `404`: Competition or athlete not found
- `409`: Athlete is already registered for this competition

---

### 7. Remove Athlete from Competition

**DELETE** `/api/competitions/:id/athletes/:athleteId`

Remove an athlete from a competition. **Requires admin role.**

**URL Parameters:**
- `id` (required): Competition ID
- `athleteId` (required): Athlete ID

**Response:**
```json
{
  "status": "success",
  "message": "Athlete removed from competition successfully",
  "data": null
}
```

**Cache Behavior:**
- Invalidates competition cache (`competition:{id}`)
- Invalidates competition athletes cache (`competition:{id}:athletes`)

**Error Responses:**
- `400`: Invalid competition ID or athlete ID
- `403`: User is not an admin
- `404`: Athlete is not registered for this competition

---

### 8. Get Competition Athletes

**GET** `/api/competitions/:id/athletes`

Retrieve all athletes registered for a specific competition.

**URL Parameters:**
- `id` (required): Competition ID

**Response:**
```json
{
  "status": "success",
  "cached": false,
  "data": {
    "athletes": [
      {
        "id": 5,
        "name": "张三",
        "athlete_number": "A001",
        "team_name": "测试队",
        "contact_email": "zhangsan@example.com",
        "contact_phone": "13800138000",
        "created_at": "2024-01-15T09:00:00Z",
        "updated_at": "2024-01-15T09:00:00Z",
        "registration_date": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

**Cache:** Results are cached for 1 hour with key `competition:{id}:athletes`

**Error Responses:**
- `400`: Invalid competition ID

---

## Redis Caching Strategy

### Cache Keys

1. **Competition List**: `competitions:list:{status}:{region}:{type}`
   - TTL: 3600 seconds (1 hour)
   - Invalidated on: create, update, delete

2. **Single Competition**: `competition:{id}`
   - TTL: 3600 seconds (1 hour)
   - Invalidated on: update, delete

3. **Competition Athletes**: `competition:{id}:athletes`
   - TTL: 3600 seconds (1 hour)
   - Invalidated on: add athlete, remove athlete

4. **Active Competitions Set**: `active_competitions`
   - No TTL (persistent)
   - Updated on: create (if active), update (status change), delete

### Cache Invalidation

The API implements a cache-aside pattern with proactive invalidation:
- **Create**: Invalidates all list caches, caches new competition
- **Update**: Invalidates specific competition and all list caches
- **Delete**: Removes all related cache keys
- **Add/Remove Athlete**: Invalidates competition and athlete list caches

---

## Security Features

### Parameterized Queries

All database operations use parameterized queries to prevent SQL injection:

```javascript
// ✅ Correct (parameterized)
await db.query('SELECT * FROM competitions WHERE id = $1', [id]);

// ❌ Wrong (vulnerable to SQL injection)
await db.query(`SELECT * FROM competitions WHERE id = ${id}`);
```

### Role-Based Access Control

- **Admin-only endpoints**: Create, Update, Delete, Add/Remove Athletes
- **Authenticated endpoints**: Get All, Get by ID, Get Athletes
- **JWT validation**: All endpoints require valid JWT token

### Input Validation

- Competition type validation (individual, duo_team, challenge)
- Status validation (upcoming, active, completed)
- ID validation (numeric check)
- Required field validation

---

## Error Handling

All errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

### Common Error Codes

- `400`: Bad Request (invalid input, validation errors)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate entry)
- `500`: Internal Server Error

---

## Testing

Run the test script to verify all endpoints:

```bash
node backend/test-competitions.js
```

The test script covers:
1. Admin registration
2. Competition creation
3. Get all competitions
4. Get competition by ID
5. Filter by status, region, and type
6. Update competition
7. Add athlete to competition
8. Get competition athletes
9. Cache hit testing
10. Remove athlete from competition
11. Delete competition
12. Verify deletion

---

## Performance Considerations

1. **Connection Pooling**: PostgreSQL connection pool (max 20 connections)
2. **Redis Caching**: 1-hour TTL for most data
3. **Indexed Queries**: Database indexes on competition_type, region, status
4. **Parameterized Queries**: Prepared statements for better performance
5. **Cache-Aside Pattern**: Read-through caching with proactive invalidation

---

## Future Enhancements

1. Pagination for large competition lists
2. Full-text search for competition names
3. Bulk athlete registration
4. Competition templates
5. Advanced filtering (date ranges, multiple regions)
6. Competition statistics and analytics
