// Auto-complete competitions based on end_date
// This utility checks if competitions have passed their end_date and updates status to 'completed'

const { pool } = require('../db');

/**
 * Check and update competitions that have passed their end_date
 * @returns {Promise<{updated: number, competitions: Array}>}
 */
async function autoCompleteCompetitions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for competitions to auto-complete...');

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');

    // Find competitions where end_date < today and status is not 'completed'
    const query = `
      SELECT id, name, end_date, status
      FROM competitions
      WHERE end_date < $1
        AND status != 'completed'
      ORDER BY end_date DESC
    `;

    const result = await client.query(query, [todayStr]);

    if (result.rows.length === 0) {
      console.log('✅ No competitions need to be auto-completed');
      return { updated: 0, competitions: [] };
    }

    console.log(`📋 Found ${result.rows.length} competition(s) to auto-complete:`);
    result.rows.forEach(comp => {
      console.log(`   - ID ${comp.id}: ${comp.name} (ended: ${comp.end_date}, status: ${comp.status})`);
    });

    // Update all expired competitions to 'completed'
    const updateQuery = `
      UPDATE competitions
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE end_date < $1
        AND status != 'completed'
      RETURNING id, name, end_date, status
    `;

    const updateResult = await client.query(updateQuery, [todayStr]);

    console.log(`✅ Auto-completed ${updateResult.rowCount} competition(s):`);
    updateResult.rows.forEach(comp => {
      console.log(`   - ID ${comp.id}: ${comp.name} -> ${comp.status}`);
    });

    // Try to invalidate caches if redis is available
    try {
      const { redisHelpers } = require('../redis');
      for (const comp of updateResult.rows) {
        try {
          await redisHelpers.invalidateCompetitionCaches(comp.id);
          await redisHelpers.removeActiveCompetition(comp.id);
          console.log(`   ✅ Invalidated cache for competition ${comp.id}`);
        } catch (redisError) {
          console.warn(`   ⚠️  Redis cache invalidation failed for ${comp.id}:`, redisError.message);
        }
      }
    } catch (redisError) {
      console.warn('   ⚠️  Redis not available - skipping cache invalidation');
    }

    return {
      updated: updateResult.rowCount,
      competitions: updateResult.rows
    };

  } catch (error) {
    console.error('❌ Error in autoCompleteCompetitions:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Schedule auto-complete check to run periodically
 * @param {number} intervalMinutes - How often to check (default: 60 minutes)
 */
function scheduleAutoComplete(intervalMinutes = 60) {
  console.log(`⏰ Scheduling auto-complete check every ${intervalMinutes} minutes`);

  // Run immediately on startup
  autoCompleteCompetitions().catch(err => {
    console.error('❌ Initial auto-complete check failed:', err);
  });

  // Then run periodically
  setInterval(() => {
    autoCompleteCompetitions().catch(err => {
      console.error('❌ Scheduled auto-complete check failed:', err);
    });
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  autoCompleteCompetitions,
  scheduleAutoComplete
};
