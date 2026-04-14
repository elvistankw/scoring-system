// backend/test-middleware.js
// Test script for middleware functionality
// Run with: node test-middleware.js

const { 
  AppError, 
  validate, 
  validateScoreSubmission,
  validators 
} = require('./middleware');

console.log('🧪 Testing Middleware Components...\n');

// Test 1: AppError class
console.log('Test 1: AppError Class');
try {
  const error = new AppError('Test error message', 400);
  console.log('✅ AppError created:', {
    message: error.message,
    statusCode: error.statusCode,
    status: error.status,
    isOperational: error.isOperational
  });
} catch (err) {
  console.log('❌ AppError test failed:', err.message);
}

// Test 2: Validators
console.log('\nTest 2: Validators');
const testCases = [
  { name: 'isString', fn: validators.isString, input: 'test', expected: true },
  { name: 'isString (empty)', fn: validators.isString, input: '', expected: false },
  { name: 'isEmail', fn: validators.isEmail, input: 'test@example.com', expected: true },
  { name: 'isEmail (invalid)', fn: validators.isEmail, input: 'invalid', expected: false },
  { name: 'isPositiveInteger', fn: validators.isPositiveInteger, input: 5, expected: true },
  { name: 'isPositiveInteger (zero)', fn: validators.isPositiveInteger, input: 0, expected: false },
  { name: 'isNumberInRange', fn: () => validators.isNumberInRange(50, 0, 100), input: null, expected: true },
  { name: 'isOneOf', fn: () => validators.isOneOf('admin', ['admin', 'judge']), input: null, expected: true }
];

testCases.forEach(test => {
  const result = test.fn(test.input);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.name}: ${result} (expected: ${test.expected})`);
});

// Test 3: Validation middleware
console.log('\nTest 3: Validation Middleware');
const mockReq = {
  body: {
    username: 'testuser',
    email: 'test@example.com',
    role: 'judge'
  }
};

const mockRes = {};
let nextCalled = false;
let nextError = null;

const mockNext = (err) => {
  nextCalled = true;
  nextError = err;
};

const schema = {
  username: { required: true, type: 'string', minLength: 3 },
  email: { required: true, type: 'email' },
  role: { required: true, oneOf: ['admin', 'judge'] }
};

const validationMiddleware = validate(schema);
validationMiddleware(mockReq, mockRes, mockNext);

if (nextCalled && !nextError) {
  console.log('✅ Validation passed for valid data');
} else if (nextError) {
  console.log('❌ Validation failed unexpectedly:', nextError.message);
} else {
  console.log('❌ Next was not called');
}

// Test 4: Score validation
console.log('\nTest 4: Score Validation');
const scoreReq = {
  body: {
    competition_id: 1,
    athlete_id: 5,
    competition_type: 'individual',
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5
    }
  }
};

nextCalled = false;
nextError = null;

validateScoreSubmission(scoreReq, mockRes, mockNext);

if (nextCalled && !nextError) {
  console.log('✅ Score validation passed for individual competition');
} else if (nextError) {
  console.log('❌ Score validation failed:', nextError.message);
} else {
  console.log('❌ Next was not called');
}

// Test 5: Invalid score validation
console.log('\nTest 5: Invalid Score Validation');
const invalidScoreReq = {
  body: {
    competition_id: 1,
    athlete_id: 5,
    competition_type: 'individual',
    scores: {
      action_difficulty: 28.5,
      // Missing required fields
    }
  }
};

nextCalled = false;
nextError = null;

validateScoreSubmission(invalidScoreReq, mockRes, mockNext);

if (nextCalled && nextError && nextError.statusCode === 400) {
  console.log('✅ Invalid score correctly rejected:', nextError.message);
} else if (!nextError) {
  console.log('❌ Invalid score was not rejected');
} else {
  console.log('❌ Unexpected result');
}

console.log('\n✅ All middleware tests completed!');
console.log('\n📝 Note: Run the server with "npm start" to test middleware in action');
