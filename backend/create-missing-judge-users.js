// Create user accounts for existing judges that don't have them
const db = require('./db');
const bcrypt = require('bcrypt');

async function createMissingJudgeUsers() {
  const client = await db.getClient();
  
  try {
    console.log('🔍 Finding judges without user accounts...\n');

    // Find judges that don't have corresponding user accounts
    const judgesWithoutUsers = await client.query(`
      SELECT j.id, j.name, j.display_name, j.code
      FROM judges j
      LEFT JOIN users u ON j.id = u.id
      WHERE u.id IS NULL
      ORDER BY j.id
    `);

    if (judgesWithoutUsers.rows.length === 0) {
      console.log('✅ All judges already have user accounts!');
      return;
    }

    console.log(`📋 Found ${judgesWithoutUsers.rows.length} judges without user accounts:\n`);

    await client.query('BEGIN');

    for (const judge of judgesWithoutUsers.rows) {
      console.log(`Creating user for judge: ${judge.name} (${judge.code})`);

      // Check if username already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [judge.code]
      );

      if (existingUser.rows.length > 0) {
        console.log(`  ⚠️  Username ${judge.code} already exists, skipping...`);
        continue;
      }

      // Create user account with judge code as password
      const hashedPassword = await bcrypt.hash(judge.code, 10);

      const userQuery = `
        INSERT INTO users (id, username, password_hash, email, role, is_judge_account)
        VALUES ($1, $2, $3, $4, 'judge', true)
        ON CONFLICT (id) DO NOTHING
      `;

      await client.query(userQuery, [
        judge.id,
        judge.code,
        hashedPassword,
        `${judge.code}@judge.local`
      ]);

      console.log(`  ✅ Created user account for ${judge.name} (ID: ${judge.id})`);
    }

    await client.query('COMMIT');

    console.log(`\n✅ Successfully created ${judgesWithoutUsers.rows.length} user accounts`);
    console.log('\n📝 Note: Default password for each judge is their judge code');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

createMissingJudgeUsers();
