// Test script to verify athlete_count is returned in competition list
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAthleteCount() {
  console.log('🧪 测试比赛列表中的选手数量显示\n');

  try {
    // 1. Login as admin
    console.log('🔐 登录为管理员...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功\n');

    // 2. Get all competitions
    console.log('📋 获取比赛列表...');
    const competitionsResponse = await axios.get(`${API_BASE_URL}/competitions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const competitions = competitionsResponse.data.data.competitions;
    console.log(`✅ 获取到 ${competitions.length} 个比赛\n`);

    // 3. Display competitions with athlete count
    console.log('📊 比赛列表（含选手数量）：\n');
    competitions.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name}`);
      console.log(`   赛区: ${comp.region}`);
      console.log(`   类型: ${comp.competition_type}`);
      console.log(`   状态: ${comp.status}`);
      console.log(`   选手数量: ${comp.athlete_count !== undefined ? comp.athlete_count : '未返回'}`);
      console.log('');
    });

    // 4. Verify athlete_count field exists
    const hasAthleteCount = competitions.every(comp => comp.athlete_count !== undefined);
    
    if (hasAthleteCount) {
      console.log('✅ 所有比赛都包含 athlete_count 字段');
    } else {
      console.log('❌ 部分比赛缺少 athlete_count 字段');
    }

    // 5. Show statistics
    const totalAthletes = competitions.reduce((sum, comp) => sum + (comp.athlete_count || 0), 0);
    console.log(`\n📈 统计信息：`);
    console.log(`   总比赛数: ${competitions.length}`);
    console.log(`   总选手数: ${totalAthletes}`);
    console.log(`   平均每场: ${competitions.length > 0 ? (totalAthletes / competitions.length).toFixed(1) : 0} 人`);

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
  }
}

testAthleteCount();
