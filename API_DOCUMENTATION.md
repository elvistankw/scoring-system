# API Documentation - Realtime Scoring System

Complete API reference for the Realtime Scoring System backend.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Competition Endpoints](#competition-endpoints)
5. [Athlete Endpoints](#athlete-endpoints)
6. [Score Endpoints](#score-endpoints)
7. [Display Endpoints](#display-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [WebSocket Events](#websocket-events)

---

## Overview

### Base URL

```
Development: http://localhost:5000
Production: https://api.yourdomain.com
```

### API Version

Current version: `v1`

### Response Format

All API responses follow this structure:

```json
{
  "status": "success" | "error",
  "message": "Optional message",
  "data": { ... } | null,
  "cached": true | false
}
```

### HTTP Status Codes

- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Authentication

### JWT Token Authentication

All endpoints (except public display endpoints) require JWT authentication.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

**Token Expiration:** 24 hours (configurable)

**Token Payload:**
```json
{
  "userId": 1,
  "role": "admin" | "judge",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Role-Based Access

- **Admin**: Full access to all endpoints
- **Judge**: Read access + score submission
- **Public**: Display endpoints only (no authentication)

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "judge1",
  "email": "judge1@example.com",
  "password": "password123",
  "role": "judge"
}
```

**Validation:**
- Username: Required, unique
- Email: Required, unique, valid format
- Password: Required, min 8 characters, must contain letters and numbers
- Role: Required, must be "admin" or "judge"

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": 1,
      "username": "judge1",
      "email": "judge1@example.com",
      "role": "judge"
    }
  }
}
```

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "judge1@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": 1,
      "username": "judge1",
      "email": "judge1@example.com",
      "role": "judge"
    }
  }
}
```

---

### Get Current User

Get authenticated user information.

**Endpoint:** `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "judge1",
      "email": "judge1@example.com",
      "role": "judge"
    }
  }
}
```

---

## Competition Endpoints

### Get All Competitions

Retrieve all competitions with optional filtering.

**Endpoint:** `GET /api/competitions`

**Query Parameters:**
- `status`: Filter by status (upcoming, active, completed)
- `region`: Filter by region
- `type`: Filter by type (individual, duo_team, challenge)

**Example:**
```
GET /api/competitions?status=active&region=华东赛区
```

**Response (200):**
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

---

### Get Competition by ID

**Endpoint:** `GET /api/competitions/:id`

**Response (200):**
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

---

### Create Competition

**Endpoint:** `POST /api/competitions`

**Auth:** Admin only

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
- `competition_type`: individual, duo_team, or challenge
- `region`: Regional division

**Response (201):**
```json
{
  "status": "success",
  "message": "Competition created successfully",
  "data": {
    "competition": { ... }
  }
}
```

---

### Update Competition

**Endpoint:** `PUT /api/competitions/:id`

**Auth:** Admin only

**Request Body:** (all fields optional)
```json
{
  "name": "2024春季个人赛（更新）",
  "status": "active"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Competition updated successfully",
  "data": {
    "competition": { ... }
  }
}
```

---

### Delete Competition

**Endpoint:** `DELETE /api/competitions/:id`

**Auth:** Admin only

**Response (200):**
```json
{
  "status": "success",
  "message": "Competition deleted successfully",
  "data": null
}
```

---

### Add Athlete to Competition

**Endpoint:** `POST /api/competitions/:id/athletes`

**Auth:** Admin only

**Request Body:**
```json
{
  "athlete_id": 5
}
```

**Response (201):**
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

---

### Remove Athlete from Competition

**Endpoint:** `DELETE /api/competitions/:id/athletes/:athleteId`

**Auth:** Admin only

**Response (200):**
```json
{
  "status": "success",
  "message": "Athlete removed from competition successfully",
  "data": null
}
```

---

### Get Competition Athletes

**Endpoint:** `GET /api/competitions/:id/athletes`

**Response (200):**
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
        "registration_date": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

## Athlete Endpoints

### Get All Athletes

**Endpoint:** `GET /api/athletes`

**Query Parameters:**
- `search`: Search by name or athlete_number
- `competition_id`: Filter by competition

**Example:**
```
GET /api/athletes?search=张三&competition_id=1
```

**Response (200):**
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

### Get Athlete by ID

**Endpoint:** `GET /api/athletes/:id`

**Response (200):**
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

---

### Create Athlete

**Endpoint:** `POST /api/athletes`

**Auth:** Admin only

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
- `name`: Athlete name

**Response (201):**
```json
{
  "status": "success",
  "message": "Athlete created successfully",
  "data": {
    "athlete": { ... }
  }
}
```

---

### Update Athlete

**Endpoint:** `PUT /api/athletes/:id`

**Auth:** Admin only

**Request Body:** (all fields optional)
```json
{
  "name": "张三（更新）",
  "contact_phone": "13900139000"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Athlete updated successfully",
  "data": {
    "athlete": { ... }
  }
}
```

---

### Delete Athlete

**Endpoint:** `DELETE /api/athletes/:id`

**Auth:** Admin only

**Response (200):**
```json
{
  "status": "success",
  "message": "Athlete deleted successfully",
  "data": null
}
```

---

### Get Athlete Competitions

**Endpoint:** `GET /api/athletes/:id/competitions`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "athlete": { ... },
    "competitions": [
      {
        "id": 1,
        "name": "2024春季个人赛",
        "competition_type": "individual",
        "region": "华东赛区",
        "status": "active",
        "registration_date": "2024-02-15T10:30:00Z"
      }
    ],
    "competition_count": 1
  }
}
```

---

## Score Endpoints

### Submit Score

**Endpoint:** `POST /api/scores/submit`

**Auth:** Judge or Admin

**Request Body (Individual):**
```json
{
  "competition_id": 1,
  "athlete_id": 5,
  "action_difficulty": 28.5,
  "stage_artistry": 22.0,
  "action_creativity": 15.5,
  "action_fluency": 18.0,
  "costume_styling": 8.5
}
```

**Request Body (Duo/Team):**
```json
{
  "competition_id": 1,
  "athlete_id": 5,
  "action_difficulty": 28.5,
  "stage_artistry": 22.0,
  "action_interaction": 25.0,
  "action_creativity": 15.5,
  "costume_styling": 8.5
}
```

**Request Body (Challenge):**
```json
{
  "competition_id": 1,
  "athlete_id": 5,
  "action_difficulty": 28.5,
  "action_creativity": 15.5,
  "action_fluency": 18.0
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Score submitted successfully",
  "data": {
    "score": {
      "id": 1,
      "competition_id": 1,
      "athlete_id": 5,
      "judge_id": 3,
      "action_difficulty": 28.5,
      "stage_artistry": 22.0,
      "action_creativity": 15.5,
      "action_fluency": 18.0,
      "costume_styling": 8.5,
      "submitted_at": "2024-01-15T10:30:45Z"
    }
  }
}
```

---

### Get Scores by Competition

**Endpoint:** `GET /api/scores/competition/:competitionId`

**Query Parameters:**
- `athlete_id`: Filter by specific athlete

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "scores": [
      {
        "id": 1,
        "competition_id": 1,
        "athlete_id": 5,
        "athlete_name": "张三",
        "judge_id": 3,
        "judge_name": "评委A",
        "action_difficulty": 28.5,
        "stage_artistry": 22.0,
        "action_creativity": 15.5,
        "action_fluency": 18.0,
        "costume_styling": 8.5,
        "submitted_at": "2024-01-15T10:30:45Z"
      }
    ]
  }
}
```

---

### Get Latest Score

**Endpoint:** `GET /api/scores/latest/:competitionId`

**Response (200):**
```json
{
  "status": "success",
  "cached": true,
  "data": {
    "score": {
      "competition_id": 1,
      "athlete_id": 5,
      "athlete_name": "张三",
      "judge_id": 3,
      "judge_name": "评委A",
      "scores": {
        "action_difficulty": 28.5,
        "stage_artistry": 22.0,
        "action_creativity": 15.5,
        "action_fluency": 18.0,
        "costume_styling": 8.5
      },
      "competition_type": "individual",
      "timestamp": "2024-01-15T10:30:45Z"
    }
  }
}
```

---

## Display Endpoints

### Get Scoreboard

**Endpoint:** `GET /api/display/scoreboard/:competitionId`

**Auth:** None (public)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "competition": {
      "id": 1,
      "name": "2024春季个人赛",
      "competition_type": "individual"
    },
    "latest_scores": [
      {
        "athlete_name": "张三",
        "athlete_number": "A001",
        "judge_name": "评委A",
        "scores": {
          "action_difficulty": 28.5,
          "stage_artistry": 22.0,
          "action_creativity": 15.5,
          "action_fluency": 18.0,
          "costume_styling": 8.5
        },
        "timestamp": "2024-01-15T10:30:45Z"
      }
    ]
  }
}
```

---

### Get Rankings

**Endpoint:** `GET /api/display/rankings/:competitionId`

**Auth:** None (public)

**Query Parameters:**
- `region`: Filter by region
- `limit`: Limit number of results (default: all)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "competition": {
      "id": 1,
      "name": "2024春季个人赛",
      "competition_type": "individual"
    },
    "rankings": [
      {
        "rank": 1,
        "athlete_id": 5,
        "athlete_name": "张三",
        "athlete_number": "A001",
        "average_scores": {
          "action_difficulty": 28.5,
          "stage_artistry": 22.0,
          "action_creativity": 15.5,
          "action_fluency": 18.0,
          "costume_styling": 8.5
        },
        "judge_count": 3,
        "total_average": 92.5
      }
    ]
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

### Common Errors

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "Missing required fields: name, competition_type",
  "statusCode": 400
}
```

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "No token provided",
  "statusCode": 401
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "message": "Admin access required",
  "statusCode": 403
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Competition not found",
  "statusCode": 404
}
```

**409 Conflict:**
```json
{
  "status": "error",
  "message": "Athlete number already exists",
  "statusCode": 409
}
```

---

## Rate Limiting

### Default Limits

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Write operations**: 100 requests per 15 minutes per user
- **Read operations**: 1000 requests per 15 minutes per user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded Response

```json
{
  "status": "error",
  "message": "Too many requests, please try again later",
  "statusCode": 429
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});
```

### Join Competition Room

```javascript
socket.emit('join-competition', competitionId);
```

### Score Update Event

```javascript
socket.on('score-update', (data) => {
  console.log('New score:', data);
  // data structure:
  {
    competition_id: 1,
    athlete_id: 5,
    athlete_name: "张三",
    judge_id: 3,
    judge_name: "评委A",
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5
    },
    competition_type: "individual",
    timestamp: "2024-01-15T10:30:45Z"
  }
});
```

### Disconnect

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

### Reconnection

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

---

## Requirements Satisfied

This API documentation covers:
- **Requirement 1**: User authentication and authorization
- **Requirement 2**: Competition management
- **Requirement 3-5**: Score submission for all competition types
- **Requirement 6**: Real-time score broadcasting
- **Requirement 7**: Judge competition selection
- **Requirement 8**: Regional competition support
- **Requirement 9**: Score display without totals
- **Requirement 10**: Frontend-backend API separation
- **Requirement 20**: WebSocket connection management

---

## Additional Resources

- [Backend Setup Guide](backend/SETUP.md)
- [Database Schema](backend/DATABASE_SCHEMA.md)
- [Redis Caching Guide](backend/REDIS_CACHING_GUIDE.md)
- [Security Hardening](backend/SECURITY_HARDENING_REPORT.md)
- [Performance Optimization](backend/PERFORMANCE_OPTIMIZATION.md)
