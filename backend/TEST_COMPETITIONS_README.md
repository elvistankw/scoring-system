# Competition API Integration Tests

## Overview

This document describes the integration tests for the Competition Management API (Task 7.1).

**Requirements Tested:** 2.1, 2.2, 2.4

## Test Coverage

### Test Suite: Competition API Integration Tests

The test suite covers the following scenarios:

#### 1. Competition Creation (Requirement 2.1)
- ✅ Admin can create competitions with all required fields
- ✅ Competition data integrity verification
- ✅ Proper storage of competition type, region, and status

#### 2. Competition Retrieval with Filters (Requirement 2.2)
- ✅ Filter by status (upcoming, active, completed)
- ✅ Filter by region (e.g., 华东赛区, 华北赛区)
- ✅ Filter by competition type (individual, duo_team, challenge)
- ✅ Multiple filters combined
- ✅ Judge role can read competitions

#### 3. Athlete Association (Requirement 2.4)
- ✅ Add athlete to competition
- ✅ Add multiple athletes to competition
- ✅ Prevent duplicate athlete associations
- ✅ Get all athletes in a competition
- ✅ Remove athlete from competition
- ✅ Verify athlete removal

#### 4. Authorization (Requirement 2.4)
- ✅ Non-admin (judge) cannot create competitions
- ✅ Non-admin (judge) cannot update competitions
- ✅ Non-admin (judge) cannot delete competitions
- ✅ Judge can read competitions (read-only access)

#### 5. Redis Caching (Requirement 2.6)
- ✅ First request hits database
- ✅ Subsequent requests hit cache
- ✅ Cache invalidation on update

## Prerequisites

Before running the tests, ensure the following services are running:

1. **PostgreSQL Database**
   ```bash
   # Make sure PostgreSQL is running
   # Default: localhost:5432
   ```

2. **Redis Server**
   ```bash
   # Make sure Redis is running
   # Default: localhost:6379
   ```

3. **Backend Server**
   ```bash
   cd backend
   npm run dev
   # Server should be running on http://localhost:5000
   ```

4. **Database Migrations**
   ```bash
   cd backend
   npm run migrate
   # Or manually run: psql -U postgres -d scoring -f migrations/001_initial_schema.sql
   ```

## Running the Tests

### Run All Integration Tests

```bash
cd backend
node test-competitions-integration.js
```

### Expected Output

```
🧪 COMPETITION API INTEGRATION TESTS
Requirements: 2.1, 2.2, 2.4
Task 7.1: Integration tests for competition API

======================================================================
Test SETUP: Creating test users
======================================================================
✅ Admin user created (ID: 123)
✅ Judge user created (ID: 124)
✅ Athlete 1 created (ID: 45)
✅ Athlete 2 created (ID: 46)

======================================================================
Test 1: Competition creation with admin role
======================================================================
✅ Competition created successfully
ℹ️  Competition details
   Data: {
     "id": 78,
     "name": "2024春季个人赛",
     "competition_type": "individual",
     "region": "华东赛区",
     "status": "upcoming",
     ...
   }

... (more tests)

======================================================================
TEST SUMMARY
======================================================================
✅ Tests Passed: 18
❌ Tests Failed: 0
📊 Total Tests: 18
🎯 Success Rate: 100.0%
======================================================================

🎉 ALL TESTS PASSED! 🎉
```

## Test Details

### Test 1: Competition Creation with Admin Role
**Requirement:** 2.1  
**Description:** Verifies that an admin user can create a competition with all required fields.  
**Expected:** 201 status code, competition object returned with ID.

### Test 2: Verify Competition Data Integrity
**Requirement:** 2.1  
**Description:** Verifies that all competition fields are stored correctly.  
**Expected:** All fields match the input data.

### Test 3-6: Competition Retrieval with Filters
**Requirement:** 2.2  
**Description:** Tests filtering competitions by status, region, type, and combinations.  
**Expected:** Only competitions matching the filter criteria are returned.

### Test 7-12: Athlete Association
**Requirement:** 2.4  
**Description:** Tests adding, removing, and listing athletes in competitions.  
**Expected:** Athletes can be associated and removed, duplicates are prevented.

### Test 13-16: Authorization
**Requirement:** 2.4  
**Description:** Tests role-based access control for competition management.  
**Expected:** Judge role can read but not modify competitions (403 Forbidden).

### Test 17-18: Redis Caching
**Requirement:** 2.6  
**Description:** Tests Redis caching and cache invalidation.  
**Expected:** Second request is cached, cache is invalidated on update.

## Troubleshooting

### Error: "ECONNREFUSED"
**Problem:** Cannot connect to backend server.  
**Solution:** Make sure the backend server is running on port 5000.
```bash
cd backend
npm run dev
```

### Error: "Connection terminated unexpectedly"
**Problem:** PostgreSQL is not running or connection failed.  
**Solution:** Start PostgreSQL and verify connection settings in `.env`.

### Error: "Redis connection failed"
**Problem:** Redis server is not running.  
**Solution:** Start Redis server.
```bash
redis-server
```

### Error: "relation does not exist"
**Problem:** Database tables not created.  
**Solution:** Run database migrations.
```bash
cd backend
npm run migrate
```

## Test Architecture

### Test Structure
```
test-competitions-integration.js
├── Setup Phase
│   ├── Create admin user
│   ├── Create judge user
│   └── Create test athletes
├── Test Phase
│   ├── Competition CRUD tests
│   ├── Filter tests
│   ├── Athlete association tests
│   ├── Authorization tests
│   └── Caching tests
└── Cleanup Phase
    └── Delete test data
```

### Helper Functions
- `authRequest(token)`: Creates authenticated HTTP client
- `logTest(number, description)`: Formats test output
- `logSuccess(message)`: Logs successful test
- `logError(message, error)`: Logs failed test with details

## Integration with CI/CD

To integrate these tests into a CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  run: |
    cd backend
    npm install
    npm run migrate
    npm run dev &
    sleep 5
    node test-competitions-integration.js
```

## Related Files

- `backend/routes/competitions.routes.js` - Competition routes
- `backend/controllers/competitions.controller.js` - Competition controller
- `backend/routes/athletes.routes.js` - Athletes routes (minimal for testing)
- `backend/controllers/athletes.controller.js` - Athletes controller (minimal for testing)
- `backend/middleware/auth.js` - Authentication middleware
- `backend/test-competitions.js` - Original manual test script

## Next Steps

After Task 7.1 is complete, the following tasks will build on this foundation:

- **Task 8:** Backend Athlete Management API (full implementation)
- **Task 8.1:** Write integration tests for athlete API
- **Task 9:** Admin Competition Management UI
- **Task 10:** Admin Athlete Management UI

## Notes

- Tests create temporary users and data, which are cleaned up after execution
- Each test run uses unique email addresses to avoid conflicts
- Tests are designed to be idempotent and can be run multiple times
- The test suite takes approximately 5-10 seconds to complete
