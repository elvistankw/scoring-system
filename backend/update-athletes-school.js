/**
 * Update Athletes School Information
 * 批量更新选手的学校信息
 */

const db = require('./db');

async function updateAthletesSchool() {
  try {
    console.log('🏫 Updating Athletes School Information...\n');

    // Get all athletes
    const athletesResult = await db.query(
      'SELECT id, name, athlete_number, school FROM athletes ORDER BY id'
    );

    console.log(`📊 Found ${athletesResult.rows.length} athletes\n`);

    // Sample school names
    const schools = [
      '北京市第一中学',
      '上海实验学校',
      '广州外国语学校',
      '深圳中学',
      '杭州学军中学',
      '南京外国语学校',
      '成都七中',
      '武汉二中',
      '西安高新一中',
      '天津南开中学',
      '重庆巴蜀中学',
      '苏州中学',
      '厦门一中',
      '长沙雅礼中学',
      '郑州外国语学校'
    ];

    let updateCount = 0;

    for (let i = 0; i < athletesResult.rows.length; i++) {
      const athlete = athletesResult.rows[i];
      
      // Assign school in a round-robin fashion
      const school = schools[i % schools.length];
      
      await db.query(
        'UPDATE athletes SET school = $1 WHERE id = $2',
        [school, athlete.id]
      );
      
      console.log(`✅ Updated athlete ${athlete.id} (${athlete.name}): ${school}`);
      updateCount++;
    }

    console.log(`\n✅ Successfully updated ${updateCount} athletes with school information`);

    // Verify updates
    console.log('\n📋 Sample of updated athletes:');
    const verifyResult = await db.query(
      'SELECT id, name, athlete_number, school FROM athletes ORDER BY id LIMIT 10'
    );
    console.table(verifyResult.rows);

    console.log('\n💡 Now you can export Excel and see the school column populated!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

updateAthletesSchool();
