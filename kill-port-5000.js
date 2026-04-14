#!/usr/bin/env node
/**
 * Kill process running on port 5000
 * Useful when backend server doesn't shut down properly
 */

const { execSync } = require('child_process');

try {
  console.log('🔍 Checking for processes on port 5000...');
  
  // Find process on port 5000
  const result = execSync('netstat -ano | findstr :5000', { encoding: 'utf-8' });
  
  // Extract PID (last column)
  const lines = result.split('\n').filter(line => line.includes('LISTENING'));
  
  if (lines.length === 0) {
    console.log('✅ No process found on port 5000');
    process.exit(0);
  }
  
  const pid = lines[0].trim().split(/\s+/).pop();
  
  console.log(`🎯 Found process with PID: ${pid}`);
  console.log('🔪 Killing process...');
  
  execSync(`taskkill /F /PID ${pid}`);
  
  console.log('✅ Process killed successfully!');
  console.log('💡 You can now start the backend server');
  
} catch (error) {
  if (error.message.includes('No Instance(s) Available')) {
    console.log('✅ No process found on port 5000');
  } else {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
