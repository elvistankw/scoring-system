// Test script to check routes import
require('dotenv').config();

console.log('Testing routes import...');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

try {
  console.log('Importing judges routes...');
  const judgesRoutes = require('./routes/judges.routes');
  console.log('✅ Judges routes imported successfully');
  console.log('Routes type:', typeof judgesRoutes);
} catch (error) {
  console.error('❌ Failed to import judges routes:', error.message);
  console.error('Stack:', error.stack);
}