// Test script to verify athlete_count for judge role
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testJudgeCompetitions() {
  console.log('🧪 测试评审端比赛列表（含选手数量）\n');

  try {
    // 1. Login as admin (to see all competitions)
    console.log('🔐 登录为管理员...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功\n');

    // 2. Get competitions (judge can only see active/upcoming)
    console.log('📋 获取评审可见的比赛列表...');
    const competitionsResponse = await axios.get(`${API_BASE_URL}/competitions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const competitions = competitionsResponse.data.data.competitions;
    console.log(`✅ 获取到 ${competitions.length} 个比赛`);
    console.log(`📦 缓存状态: ${competitionsResponse.data.cached ? '来自缓存' : '来自数据库'}\n`);

    // 3. Display first 5 competitions with details
    console.log('📊 比赛详情（前5个）：\n');
    competitions.slice(0, 5).forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   赛区: ${comp.region}`);
      console.log(`   类型: ${comp.competition_type}`);
      console.log(`   状态: ${comp.status}`);
      console.log(`   选手数量: ${comp.athlete_count !== undefined ? comp.athlete_count + ' 人' : '❌ 未返回'}`);
      console.log('');
    });

    // 4. Check if athlete_count exists
    const hasAthleteCount = competitions.every(comp => comp.athlete_count !== undefined);
    
    if (hasAthleteCount) {
      console.log('✅ 所有比赛都包含 athlete_count 字段');
      
      // Show one with athletes
      const withAthletes = competitions.find(c => c.athlete_count > 0);
      if (withAthletes) {
        console.log(`\n📌 示例（有选手的比赛）：`);
        console.log(`   ${withAthletes.name}`);
        console.log(`   选手数量: ${withAthletes.athlete_count} 人`);
      }
    } else {
      console.log('❌ 部分比赛缺少 athlete_count 字段');
      console.log('💡 提示：可能需要清除缓存或重启后端服务');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('💡 提示：请确保有 judge@example.com 账号，或修改测试脚本使用其他评审账号');
    }
  }
}

testJudgeCompetitions();
