# WebSocket Hook Tests

## Overview

This directory contains unit tests for the `use-realtime-scores` hook, which manages WebSocket connections for real-time score updates.

## Test Coverage

The test suite covers all requirements specified in task 19.1:

### ✅ Connection Establishment (Requirement 20.1)
- Initializes with correct status
- Creates socket connection with proper configuration
- Transitions to connected status when socket connects
- Emits join-competition event after connecting
- Respects enabled flag and competitionId validation
- Updates connection count when joined-competition event received

### ✅ Score Update Handling (Requirements 6.3, 6.4)
- Handles score-update events and updates latestScore
- Adds new scores to scores array for SCORE_UPDATED type
- Does not add initial scores to scores array
- Clears scores when clearScores is called

### ✅ Reconnection Logic (Requirements 6.5, 20.2)
- Schedules reconnection on connect_error
- Attempts reconnection on unexpected disconnect
- Retries up to maxReconnectAttempts times
- Resets reconnect attempts on successful connection
- Allows manual reconnection via reconnect function
- Does not reconnect on manual disconnect

### ✅ Disconnect Cleanup (Requirement 20.3)
- Emits leave-competition on unmount if connected
- Disconnects socket on unmount
- Clears reconnection timeout on unmount
- Handles error events from server

### ✅ Edge Cases
- Handles rapid score updates
- Handles competition ID changes
- Handles null to valid competition ID transitions

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Results

All 24 tests pass successfully:
- Connection Establishment: 6 tests
- Score Update Handling: 4 tests
- Reconnection Logic: 6 tests
- Disconnect Cleanup: 4 tests
- Edge Cases: 4 tests

## Test Framework

- **Vitest**: Fast unit test framework
- **@testing-library/react**: React testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

## Mock Strategy

The tests use a comprehensive mock of Socket.io client that simulates:
- Connection/disconnection events
- Score update events
- Error events
- Reconnection behavior

This allows testing the hook's behavior without requiring an actual WebSocket server.
