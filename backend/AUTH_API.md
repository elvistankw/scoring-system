# Authentication API Documentation

## Overview

The authentication system provides secure user registration, login, and session management using JWT tokens and bcrypt password hashing.

## Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account (admin or judge).

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 8 chars, must contain letters and numbers)",
  "role": "string (required, 'admin' or 'judge')"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": 1,
      "username": "testjudge",
      "email": "testjudge@example.com",
      "role": "judge"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, weak password, invalid email, invalid role)
- `409` - User already exists (duplicate email or username)
- `500` - Server error

**Validation Rules:**
- Username: Required, unique
- Email: Required, unique, valid email format
- Password: Required, minimum 8 characters, must contain both letters and numbers
- Role: Required, must be either "admin" or "judge"

---

### 2. Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": 1,
      "username": "testjudge",
      "email": "testjudge@example.com",
      "role": "judge"
    }
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid email or password
- `500` - Server error

---

### 3. Get Current User

**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "testjudge",
      "email": "testjudge@example.com",
      "role": "judge"
    }
  }
}
```

**Error Responses:**
- `401` - Not authenticated (missing or invalid token)
- `404` - User not found
- `500` - Server error

---

## Security Features

### Password Hashing
- Uses bcrypt with 10 salt rounds
- Passwords are never stored in plain text
- Password strength validation enforced

### JWT Tokens
- Tokens expire after 24 hours (configurable via `JWT_EXPIRES_IN` env variable)
- Tokens contain user ID and role
- Signed with secret key (`JWT_SECRET` env variable)

### Rate Limiting
- Authentication endpoints are rate-limited
- Prevents brute force attacks
- Configured in `middleware/rate-limit.js`

### Input Validation
- Email format validation
- Password strength requirements
- Role validation (only 'admin' or 'judge' allowed)
- Duplicate user prevention

---

## Usage Examples

### Register a Judge
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "judge1",
    "email": "judge1@example.com",
    "password": "password123",
    "role": "judge"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "judge1@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-token-here>"
```

---

## Environment Variables

Required environment variables in `.env`:

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

---

## Testing

Run the test suite:
```bash
node test-auth-complete.js
```

This tests:
- User registration with validation
- User login with JWT generation
- Protected route access
- Password strength validation
- Email format validation
- Duplicate prevention
- Role validation
- Token validation

---

## Requirements Fulfilled

- **1.1**: JWT token generation and validation
- **1.2**: User registration and login
- **1.3**: JWT authentication middleware
- **1.4**: Role-based authorization
- **1.5**: Secure password hashing with bcrypt
