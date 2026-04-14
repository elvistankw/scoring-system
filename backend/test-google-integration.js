// Test Google OAuth integration
// This script verifies that Google OAuth is properly configured

require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

console.log('🔍 Testing Google OAuth Configuration...\n');

// Check environment variables
console.log('1. Checking environment variables:');
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'FRONTEND_URL'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please check your backend/.env file.');
  process.exit(1);
}

// Test OAuth2Client initialization
console.log('\n2. Testing OAuth2Client initialization:');
try {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  console.log('   ✅ OAuth2Client initialized successfully');
  
  // Generate auth URL
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: 'test-user-123',
    prompt: 'consent'
  });
  
  console.log('   ✅ Auth URL generated successfully');
  console.log(`   📝 Sample Auth URL: ${authUrl.substring(0, 80)}...`);
} catch (error) {
  console.log('   ❌ Failed to initialize OAuth2Client');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Test Google API client initialization
console.log('\n3. Testing Google API clients:');
try {
  const drive = google.drive({ version: 'v3' });
  console.log('   ✅ Google Drive API client initialized');
  
  const sheets = google.sheets({ version: 'v4' });
  console.log('   ✅ Google Sheets API client initialized');
} catch (error) {
  console.log('   ❌ Failed to initialize Google API clients');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Check database table
console.log('\n4. Checking database table:');
const db = require('./db');

(async () => {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_google_tokens'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('   ✅ user_google_tokens table exists');
      
      // Check table structure
      const columns = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_google_tokens'
        ORDER BY ordinal_position;
      `);
      
      console.log('   📋 Table columns:');
      columns.rows.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ❌ user_google_tokens table does not exist');
      console.log('   💡 Run migration: psql -U postgres -d scoring -f backend/migrations/002_google_integration.sql');
    }
  } catch (error) {
    console.log('   ❌ Database check failed');
    console.error('   Error:', error.message);
  } finally {
    // Close database connection pool
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
  }

  console.log('\n✅ Google OAuth integration test completed!');
  console.log('\n📚 Next steps:');
  console.log('   1. Make sure the database migration has been run');
  console.log('   2. Start the backend server: cd backend && npm run dev');
  console.log('   3. Start the frontend: npm run dev');
  console.log('   4. Navigate to the score summary page');
  console.log('   5. Click "连接Google账户" button');
  console.log('   6. Complete the OAuth flow');
  console.log('\n🔗 Useful links:');
  console.log('   - Google Cloud Console: https://console.cloud.google.com/');
  console.log('   - OAuth Redirect URI: ' + process.env.GOOGLE_REDIRECT_URI);
  console.log('   - Frontend URL: ' + process.env.FRONTEND_URL);
})();
