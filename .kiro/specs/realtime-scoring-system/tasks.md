# Implementation Plan: Realtime Scoring System

## Overview

This implementation plan converts the feature design into actionable coding tasks. The system is a full-stack web application with Next.js frontend and Node.js/Express backend, supporting real-time score broadcasting via WebSocket. Tasks are organized by dependency order, starting with infrastructure setup, then core features, and finally testing and optimization.

## Tasks

- [x] 1. Backend Core Infrastructure Setup
  - Create database schema with all tables (users, competitions, athletes, competition_athletes, scores)
  - Implement PostgreSQL connection pool with proper configuration
  - Set up Redis connection with retry strategy
  - Create database migration script (backend/migrations/001_initial_schema.sql)
  - Add all required database indexes for performance
  - _Requirements: 2.1, 2.2, 2.6, 10.4, 10.5_

- [ ] 1.1 Write unit tests for database connection
  - Test PostgreSQL connection pool initialization
  - Test Redis connection and retry logic
  - _Requirements: 2.6, 10.5_

- [x] 2. Backend Middleware and Error Handling
  - Implement global error handler middleware (middleware/error-handler.js)
  - Create AppError class for operational errors
  - Implement JWT authentication middleware (middleware/auth.js)
  - Create role-based authorization middleware (requireRole function)
  - Add request validation middleware (middleware/validate.js)
  - Implement rate limiting middleware for auth and score endpoints
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 10.4_

- [ ] 2.1 Write unit tests for middleware
  - Test error handler with different error types
  - Test JWT validation with valid/invalid/expired tokens
  - Test role-based authorization
  - Test input validation and sanitization
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 3. Backend Authentication System
  - Implement user registration endpoint (POST /api/auth/register)
  - Implement login endpoint with JWT generation (POST /api/auth/login)
  - Add bcrypt password hashing (SALT_ROUNDS = 10)
  - Create JWT utility functions (utils/jwt.util.js)
  - Implement current user endpoint (GET /api/auth/me)
  - Add email validation and password strength checks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3.1 Write integration tests for authentication
  - Test user registration with valid/invalid data
  - Test login with correct/incorrect credentials
  - Test JWT token generation and validation
  - Test duplicate email registration prevention
  - _Requirements: 1.1, 1.2_

- [x] 4. Frontend Core Setup and Configuration
  - Create TypeScript interfaces for all entities (interface/user.ts, competition.ts, athlete.ts, score.ts)
  - Implement centralized API configuration (lib/api-config.ts)
  - Create auth client with token management (lib/auth-client.ts)
  - Set up SWR configuration in root layout with authentication
  - Implement theme provider for light/dark mode support
  - Create loading skeleton components (components/shared/loading-skeleton.tsx)
  - Add error boundary component (components/shared/error-boundary.tsx)
  - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 13.1, 13.2, 17.1, 17.2, 19.1, 19.2, 19.3_

- [ ] 4.1 Write unit tests for frontend utilities
  - Test API error handler with different status codes
  - Test auth client token management
  - Test theme toggle functionality
  - _Requirements: 10.3, 11.1, 14.1, 14.2_

- [x] 5. Authentication UI Implementation
  - Create sign-in page with form validation (app/[locale]/(auth)/sign-in/page.tsx)
  - Create sign-up page with role selection (app/[locale]/(auth)/sign-up/page.tsx)
  - Implement auth form component (components/auth/auth-form.tsx)
  - Create use-user hook for authentication state (hooks/use-user.ts)
  - Add loading states for auth pages (loading.tsx files)
  - Implement Sonner toast notifications for success/error feedback
  - Add SEO metadata for auth pages
  - _Requirements: 1.1, 1.2, 14.1, 14.2, 14.3, 14.4, 15.1, 15.4, 15.5, 16.1, 16.2_

- [x] 6. Checkpoint - Ensure authentication works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Backend Competition Management API
  - Implement competition CRUD endpoints (routes/competitions.routes.js)
  - Create competition controller with all operations (controllers/competitions.controller.js)
  - Add competition-athlete association endpoints (POST/DELETE /api/competitions/:id/athletes)
  - Implement filtering by status, region, and type
  - Add Redis caching for competition data
  - Use parameterized queries for all database operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 10.4, 10.5_

- [x] 7.1 Write integration tests for competition API
  - Test competition creation with admin role
  - Test competition retrieval with filters
  - Test athlete association/removal
  - Test authorization (non-admin cannot create)
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 8. Backend Athlete Management API
  - Implement athlete CRUD endpoints (routes/athletes.routes.js)
  - Create athlete controller (controllers/athletes.controller.js)
  - Add search functionality by name and athlete_number
  - Implement athlete-competition relationship queries
  - Use parameterized queries for all operations
  - _Requirements: 2.2, 2.4, 10.4, 10.5_

- [x] 8.1 Write integration tests for athlete API
  - Test athlete creation and retrieval
  - Test search functionality
  - Test athlete update and deletion
  - _Requirements: 2.2, 2.4_

- [x] 9. Admin Competition Management UI
  - Create admin dashboard page (app/[locale]/(admin)/dashboard/page.tsx)
  - Implement competition list component with filters
  - Create competition form component (components/admin/competition-form.tsx)
  - Add competition creation and editing functionality
  - Implement use-competitions hook with SWR (hooks/use-competitions.ts)
  - Add loading skeletons for admin pages
  - Add Sonner notifications for CRUD operations
  - Add SEO metadata for admin pages
  - _Requirements: 2.1, 2.2, 8.1, 8.2, 13.1, 13.2, 13.5, 14.1, 14.2, 15.1, 15.4, 17.3, 18.1, 18.2, 18.3_

- [x] 10. Admin Athlete Management UI
  - Create athlete management page (app/[locale]/(admin)/athletes/page.tsx)
  - Implement athlete form component (components/admin/athlete-form.tsx)
  - Create athlete list component with search
  - Implement use-athletes hook with SWR (hooks/use-athletes.ts)
  - Add competition-athlete association UI (components/admin/competition-athlete-list.tsx)
  - Add loading states and error handling
  - _Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 17.3, 18.1, 18.2, 18.3_

- [x] 11. Checkpoint - Ensure admin features work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Backend Score Submission API
  - Implement score submission endpoint (POST /api/scores/submit)
  - Create score controller with validation (controllers/scores.controller.js)
  - Add competition type-specific validation (individual: 5 fields, duo_team: 5 fields, challenge: 3 fields)
  - Implement duplicate score prevention (unique constraint check)
  - Add score range validation (0-30 for each dimension)
  - Write scores to PostgreSQL first, then update Redis cache
  - Use parameterized queries for all operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 10.4, 10.5_

- [x] 12.1 Write integration tests for score submission
  - Test score submission for all three competition types
  - Test validation for missing fields
  - Test score range validation (reject > 30)
  - Test duplicate score prevention
  - Test judge authorization requirement
  - _Requirements: 3.3, 4.3, 5.3, 6.1_

- [x] 13. Backend Score Retrieval API
  - Implement score retrieval endpoints (GET /api/scores/competition/:id)
  - Create latest score endpoint (GET /api/scores/latest/:id)
  - Implement rankings endpoint (GET /api/display/rankings/:id)
  - Add filtering by athlete_id and judge_id
  - Implement efficient queries with JOINs for athlete/judge names
  - Add Redis caching for latest scores and rankings
  - _Requirements: 6.1, 6.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13.1 Write integration tests for score retrieval
  - Test score retrieval by competition
  - Test latest score caching
  - Test rankings calculation
  - Test filtering by athlete and judge
  - _Requirements: 6.1, 6.2, 9.1, 9.2_

- [x] 14. Judge Competition Selection UI
  - Create judge dashboard page (app/[locale]/(judge)/dashboard/page.tsx)
  - Implement competition selector component (components/judge/competition-selector.tsx)
  - Add competition filtering by region
  - Store selected competition in React state/context
  - Add loading states and error handling
  - Add SEO metadata for judge pages
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 15.1, 15.3, 17.3, 18.1, 18.2_

- [x] 15. Judge Scoring Interface
  - Create scoring page (app/[locale]/(judge)/scoring/page.tsx)
  - Implement athlete selection component (components/judge/athlete-card.tsx)
  - Create dynamic score input form (components/judge/score-input-form.tsx)
  - Implement form that adapts to competition type (individual: 5 fields, duo_team: 5 fields, challenge: 3 fields)
  - Add score validation (0-30 range, required fields)
  - Implement score submission with loading states
  - Add Sonner toast for success/error feedback
  - Create tablet-responsive layout (iPad optimization)
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.2, 7.3, 7.4, 12.1, 12.2, 12.3, 12.4, 12.5, 14.1, 14.2, 14.3_

- [ ] 15.1 Write component tests for score input form
  - Test form renders correct fields for each competition type
  - Test score range validation
  - Test form submission with valid data
  - Test error handling for invalid data
  - _Requirements: 3.1, 3.3, 4.1, 4.3, 5.1, 5.3_

- [x] 16. Checkpoint - Ensure judge scoring workflow works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Backend WebSocket Server Setup
  - Set up Socket.io server (backend/socket.js)
  - Implement WebSocket connection handling
  - Create room management (join-competition, leave-competition events)
  - Add connection tracking in Redis (ws_connections:competition:{id})
  - Implement disconnect cleanup logic
  - Add error handling for WebSocket events
  - _Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.5_

- [x] 17.1 Write integration tests for WebSocket
  - Test client connection and disconnection
  - Test room join/leave functionality
  - Test connection tracking in Redis
  - Test error handling
  - _Requirements: 6.4, 6.5, 20.1, 20.2_

- [x] 18. Backend Real-time Score Broadcasting
  - Implement score broadcast logic after score submission
  - Emit score-update event to competition room
  - Include all score dimensions and athlete/judge info in broadcast
  - Update Redis cache before broadcasting
  - Add broadcast logging for monitoring
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4_

- [x] 18.1 Write integration tests for score broadcasting
  - Test score broadcast after submission
  - Test only clients in correct room receive updates
  - Test broadcast includes all required data
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 19. Frontend WebSocket Integration
  - Create use-realtime-scores hook (hooks/use-realtime-scores.ts)
  - Implement WebSocket connection with Socket.io-client
  - Add auto-reconnection logic (retry every 3s, max 10 attempts)
  - Handle score-update events
  - Track connection status
  - Implement connection error handling
  - _Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4_

- [x] 19.1 Write unit tests for WebSocket hook
  - Test connection establishment
  - Test score update handling
  - Test reconnection logic
  - Test disconnect cleanup
  - _Requirements: 6.5, 20.2, 20.3_

- [x] 20. Display Scoreboard Interface
  - Create scoreboard page (app/[locale]/(display)/scoreboard/page.tsx)
  - Implement scoreboard grid component (components/display/scoreboard-grid.tsx)
  - Use use-realtime-scores hook for live updates
  - Display all score dimensions separately (no totals)
  - Add score animation component (components/display/score-animation.tsx)
  - Implement dark theme optimization
  - Create large display layout (1080p/4K optimization)
  - Add SEO metadata for display pages
  - _Requirements: 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 15.1, 15.2, 20.1, 20.3_

- [x] 21. Display Rankings Interface
  - Create rankings page (app/[locale]/(display)/rankings/page.tsx)
  - Implement ranking table component (components/display/ranking-table.tsx)
  - Display average scores by dimension
  - Add regional filtering support
  - Implement WebSocket updates for live ranking changes
  - Optimize for large display screens
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2_

- [x] 22. Checkpoint - Ensure real-time display works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Performance Optimization - Database
  - Verify all database indexes are created
  - Optimize score retrieval queries with DISTINCT ON
  - Optimize rankings query with aggregations
  - Implement connection pool monitoring
  - Add query performance logging for slow queries (> 1s)
  - _Requirements: 6.1, 6.2, 10.4, 10.5_

- [x] 24. Performance Optimization - Redis Caching
  - Implement cache-aside pattern for competitions
  - Implement write-through pattern for scores
  - Add cache invalidation logic
  - Set appropriate TTL values (competitions: 1h, scores: 1h, leaderboard: 2h)
  - Monitor cache hit rates
  - _Requirements: 6.2, 6.3, 10.5_

- [x] 25. Performance Optimization - Frontend
  - Implement code splitting with dynamic imports
  - Add lazy loading for heavy components
  - Optimize SWR caching configuration
  - Implement skeleton loading for all data-fetching components
  - Add performance monitoring (measurePageLoad)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 26. Security Hardening
  - Verify all SQL queries use parameterized statements
  - Test JWT token expiration and refresh
  - Verify rate limiting on all sensitive endpoints
  - Test CORS configuration
  - Add security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
  - Verify input sanitization for all user inputs
  - Test role-based authorization on all protected endpoints
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 10.4, 10.5_

- [x] 26.1 Write security tests
  - Test SQL injection prevention
  - Test XSS prevention
  - Test CSRF protection
  - Test rate limiting enforcement
  - _Requirements: 10.4, 10.5_

- [x] 27. Responsive Design Verification
  - Test judge interface on iPad/tablets (portrait and landscape)
  - Verify touch targets are at least 44px height
  - Test admin interface on desktop
  - Test display interface on 1080p and 4K screens
  - Verify all layouts work without horizontal scrolling
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 28. Theme and Accessibility
  - Verify light/dark theme switching works
  - Test theme persistence across sessions
  - Verify default themes (judge/admin: light, display: dark)
  - Ensure all components support both themes
  - Test keyboard navigation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 29. Documentation and Deployment Preparation
  - Create environment variable documentation (.env.example)
  - Write database migration instructions
  - Create Docker configuration files
  - Write deployment guide
  - Create user guides (admin, judge, display)
  - Document API endpoints
  - _Requirements: All_

- [x] 30. Final Integration Testing
  - Test complete admin workflow (create competition, add athletes)
  - Test complete judge workflow (login, select competition, submit scores)
  - Test complete display workflow (connect, receive real-time updates)
  - Test multi-user scenarios (multiple judges scoring simultaneously)
  - Test WebSocket reconnection scenarios
  - Verify all Sonner notifications work correctly
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- All database operations must use parameterized queries (Requirement 10.4)
- All API endpoints must be defined in lib/api-config.ts (Requirement 17.1, 17.2)
- All data fetching must use custom hooks with SWR (Requirement 18.1, 18.2, 18.3)
- All file names must use kebab-case (Requirement 16.1, 16.2, 16.3)
- All pages must have SEO metadata (Requirement 15.1, 15.2, 15.3, 15.4, 15.5)
- All user feedback must use Sonner toasts (Requirement 14.1, 14.2, 14.3, 14.4)
- Frontend must never directly access database or Redis (Requirement 10.1, 10.2, 10.3)
- Judge interface must be optimized for tablets (Requirement 12.1, 12.2, 12.3, 12.4, 12.5)
- Display interface must support dark theme and large screens (Requirement 11.4, 12.1, 12.2)
