// backend/test-connections.js
// Test script to verify PostgreSQL and Redis connections
require('dotenv').config();

const db = require('./db');
const { redis, redisHelpers } = require('./redis');

async function testConnections() {
    console.log('🧪 Testing database and cache connections...\n');

    // Test PostgreSQL
    try {
        console.log('1️⃣  Testing PostgreSQL connection...');
        const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ PostgreSQL connected successfully!');
        console.log('   Current time:', result.rows[0].current_time);
        console.log('   Version:', result.rows[0].pg_version.split(',')[0]);
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        process.exit(1);
    }

    // Test Redis
    try {
        console.log('\n2️⃣  Testing Redis connection...');
        const pong = await redis.ping();
        console.log('✅ Redis connected successfully! Response:', pong);

        // Test Redis operations
        console.log('\n3️⃣  Testing Redis operations...');
        await redis.set('test_key', 'test_value', 'EX', 10);
        const value = await redis.get('test_key');
        console.log('✅ Redis SET/GET test passed! Value:', value);

        // Test Redis helpers
        console.log('\n4️⃣  Testing Redis helper functions...');
        const testScore = {
            competition_id: 1,
            athlete_id: 1,
            athlete_name: 'Test Athlete',
            judge_id: 1,
            judge_name: 'Test Judge',
            scores: {
                action_difficulty: 28.5,
                stage_artistry: 22.0,
                action_creativity: 15.5,
                action_fluency: 18.0,
                costume_styling: 8.5
            },
            competition_type: 'individual',
            timestamp: new Date().toISOString()
        };

        await redisHelpers.setLatestScore(1, testScore, 60);
        const retrievedScore = await redisHelpers.getLatestScore(1);
        console.log('✅ Redis helper test passed! Retrieved score:', retrievedScore.athlete_name);

        // Clean up test data
        await redis.del('test_key');
        await redis.del('latest_score:competition:1');

    } catch (error) {
        console.error('❌ Redis connection/operation failed:', error.message);
        process.exit(1);
    }

    console.log('\n✅ All connection tests passed successfully!\n');
    
    // Close connections
    await redis.quit();
    await db.pool.end();
    
    process.exit(0);
}

testConnections();
