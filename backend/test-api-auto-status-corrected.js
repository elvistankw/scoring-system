// 修正的 API 自动状态测试 - 使用服务器的实际日期
const axios = require('axios');

async function testApiAutoStatusCorrected() {
  try {
    console.log('🌐 修正的 API 自动状态测试\n');

    // 使用与服务器相同的日期计算逻辑
    const serverToday = new Date();
    const todayStr = serverToday.getFullYear() + '-' + 
                    String(serverToday.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(serverToday.getDate()).padStart(2, '0');
    
    // 计算相对日期
    const yesterday = new Date(serverToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.getFullYear() + '-' + 
                        String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(yesterday.getDate()).padStart(2, '0');
    
    const tomorrow = new Date(serverToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.getFullYear() + '-' + 
                       String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(tomorrow.getDate()).padStart(2, '0');
    
    console.log(`📅 服务器时间: ${serverToday.toLocaleString()}`);
    console.log(`📅 昨天: ${yesterdayStr}`);
    console.log(`📅 今天: ${todayStr}`);
    console.log(`📅 明天: ${tomorrowStr}\n`);

    // 获取认证 token
    console.log('🔐 获取认证 token...');
    let token;
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'apitest@example.com',
        password: 'testpass123'
      });
      
      token = loginResponse.data.data.token;
      console.log('✅ 获取到认证 token\n');
    } catch (error) {
      console.log('❌ 登录失败:', error.response?.data || error.message);
      return;
    }

    // 测试比赛数据
    const testCompetitions = [
      {
        name: '修正测试 - 昨天开始',
        competition_type: 'individual',
        region: '修正测试赛区',
        start_date: yesterdayStr,
        end_date: todayStr,
        expected_status: 'active'
      },
      {
        name: '修正测试 - 今天开始',
        competition_type: 'duo_team',
        region: '修正测试赛区',
        start_date: todayStr,
        end_date: tomorrowStr,
        expected_status: 'active'
      },
      {
        name: '修正测试 - 明天开始',
        competition_type: 'challenge',
        region: '修正测试赛区',
        start_date: tomorrowStr,
        end_date: new Date(tomorrow.getTime() + 24*60*60*1000).toISOString().split('T')[0],
        expected_status: 'upcoming'
      }
    ];

    console.log('🔧 通过 API 创建测试比赛...\n');
    const createdCompetitions = [];

    for (const comp of testCompetitions) {
      console.log(`创建: ${comp.name}`);
      console.log(`  开始日期: ${comp.start_date}`);
      console.log(`  预期状态: ${comp.expected_status}`);

      try {
        const response = await axios.post('http://localhost:5000/api/competitions', {
          name: comp.name,
          competition_type: comp.competition_type,
          region: comp.region,
          start_date: comp.start_date,
          end_date: comp.end_date
          // 注意：不提供 status，让系统自动判断
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const newComp = response.data.data.competition;
        createdCompetitions.push(newComp);
        
        const statusCorrect = newComp.status === comp.expected_status;
        const statusIcon = statusCorrect ? '✅' : '❌';

        console.log(`  实际状态: ${newComp.status} ${statusIcon}`);
        console.log(`  比赛ID: ${newComp.id}`);
        
        if (!statusCorrect) {
          console.log(`  ⚠️  状态不正确！应该是 ${comp.expected_status}`);
        }
        
      } catch (error) {
        console.log(`  ❌ 创建失败: ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }

    // 验证结果
    console.log('🔍 结果总结:');
    const correctCount = createdCompetitions.filter((comp, index) => 
      comp.status === testCompetitions[index].expected_status
    ).length;
    
    console.log(`  总计: ${createdCompetitions.length} 个比赛`);
    console.log(`  正确: ${correctCount} 个`);
    console.log(`  错误: ${createdCompetitions.length - correctCount} 个`);

    if (correctCount === createdCompetitions.length) {
      console.log('\n✅ 自动状态逻辑工作正常！');
      console.log('🎯 用户问题已解决：');
      console.log('   • 创建今天开始的比赛 → 自动设为 active');
      console.log('   • 创建昨天开始的比赛 → 自动设为 active');
      console.log('   • 创建明天开始的比赛 → 自动设为 upcoming');
    } else {
      console.log('\n❌ 自动状态逻辑仍有问题！');
    }

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    for (const comp of createdCompetitions) {
      try {
        await axios.delete(`http://localhost:5000/api/competitions/${comp.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ 删除比赛 ${comp.id}`);
      } catch (error) {
        console.log(`❌ 删除失败 ${comp.id}: ${error.message}`);
      }
    }

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testApiAutoStatusCorrected();