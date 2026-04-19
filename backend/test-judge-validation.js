// Test script for judge validation
// Tests various valid and invalid inputs

const {
  validateJudgeName,
  validateDisplayName,
  validateJudgeCode,
  validateIsActive
} = require('./middleware/validate-judge');

console.log('🧪 Testing Judge Validation\n');

// Test cases
const testCases = {
  names: {
    valid: ['张三', 'John Smith', '李明-Wang', "O'Brien", 'Test User 123'],
    invalid: ['A', '<script>alert("xss")</script>', 'Test@#$%', '', '   ']
  },
  displayNames: {
    valid: ['评审张三', 'Judge Smith', '', null, undefined],
    invalid: ['A', '<img src=x onerror=alert(1)>']
  },
  codes: {
    valid: ['J001', 'JUDGE-01', 'J-2024-001', 'EVAL-A1', 'j001'],
    invalid: ['1J', 'J@001', 'J--001', 'J001-', '', 'j']
  },
  isActive: {
    valid: [true, false, undefined, null],
    invalid: ['true', 1, 0, 'yes']
  }
};

// Test judge names
console.log('📝 Testing Judge Names:');
console.log('Valid names:');
testCases.names.valid.forEach(name => {
  try {
    const result = validateJudgeName(name);
    console.log(`  ✅ "${name}" → "${result}"`);
  } catch (error) {
    console.log(`  ❌ "${name}" → ERROR: ${error.message}`);
  }
});

console.log('\nInvalid names:');
testCases.names.invalid.forEach(name => {
  try {
    const result = validateJudgeName(name);
    console.log(`  ❌ "${name}" → "${result}" (should have failed!)`);
  } catch (error) {
    console.log(`  ✅ "${name}" → Correctly rejected: ${error.message}`);
  }
});

// Test display names
console.log('\n📝 Testing Display Names:');
console.log('Valid display names:');
testCases.displayNames.valid.forEach(name => {
  try {
    const result = validateDisplayName(name);
    console.log(`  ✅ "${name}" → "${result}"`);
  } catch (error) {
    console.log(`  ❌ "${name}" → ERROR: ${error.message}`);
  }
});

console.log('\nInvalid display names:');
testCases.displayNames.invalid.forEach(name => {
  try {
    const result = validateDisplayName(name);
    console.log(`  ❌ "${name}" → "${result}" (should have failed!)`);
  } catch (error) {
    console.log(`  ✅ "${name}" → Correctly rejected: ${error.message}`);
  }
});

// Test judge codes
console.log('\n📝 Testing Judge Codes:');
console.log('Valid codes:');
testCases.codes.valid.forEach(code => {
  try {
    const result = validateJudgeCode(code);
    console.log(`  ✅ "${code}" → "${result}"`);
  } catch (error) {
    console.log(`  ❌ "${code}" → ERROR: ${error.message}`);
  }
});

console.log('\nInvalid codes:');
testCases.codes.invalid.forEach(code => {
  try {
    const result = validateJudgeCode(code);
    console.log(`  ❌ "${code}" → "${result}" (should have failed!)`);
  } catch (error) {
    console.log(`  ✅ "${code}" → Correctly rejected: ${error.message}`);
  }
});

// Test is_active
console.log('\n📝 Testing is_active:');
console.log('Valid values:');
testCases.isActive.valid.forEach(value => {
  try {
    const result = validateIsActive(value);
    console.log(`  ✅ ${value} → ${result}`);
  } catch (error) {
    console.log(`  ❌ ${value} → ERROR: ${error.message}`);
  }
});

console.log('\nInvalid values:');
testCases.isActive.invalid.forEach(value => {
  try {
    const result = validateIsActive(value);
    console.log(`  ❌ ${value} → ${result} (should have failed!)`);
  } catch (error) {
    console.log(`  ✅ ${value} → Correctly rejected: ${error.message}`);
  }
});

console.log('\n✅ Validation tests completed!');
