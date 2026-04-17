// Manual script to complete expired competitions
// Run with: node backend/complete-expired-competitions.js

const { autoCompleteCompetitions } = require('./utils/auto-complete-competitions');
const { pool } = require('./db');

async function main() {
  console.log('🚀 Starting manual competition completion check...\n');
  console.log('='.repeat(60));

  try {
    const result = await autoCompleteCompetitions();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total competitions updated: ${result.updated}`);

    if (result.updated > 0) {
      console.log('\n✅ Updated competitions:');
      result.competitions.forEach(comp => {
        console.log(`   - ${comp.name} (ID: ${comp.id})`);
        console.log(`     End date: ${comp.end_date}`);
        console.log(`     New status: ${comp.status}`);
      });

      console.log('\n💡 These competitions will no longer appear in Judge Dashboard');
    } else {
      console.log('\n✅ All competitions are up to date!');
      console.log('   No expired competitions found.');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

main();
