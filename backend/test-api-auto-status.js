// 通过 API 测试自动状态逻辑
const axios = require('axios');

async function testApiAutoStatus() {
  try {
    console.log('🌐 通过 API 测试自动状态逻辑\n');

    // 获取今天和昨天的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`📅 昨天: ${yesterday.toISOString().split('T')[0]}`);
    console.log(`📅 今天: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 明天: ${tomorrow.toISOString().split('T')[0]}\n`);

    // 首先创建测试用户并获取 token
    console.log('🔐 设置测试用户...');
    
    let token;
    try {
      // 尝试注册测试用户
      await axios.post('http://localhost:5000/api/auth/register', {
        username: 'apitestuser',
        email: 'apitest@example.com',
        password: 'testpass123',
        role: 'admin'
      });
      console.log('✅ 测试用户创建成功');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  测试用户已存在');
      } else {
        console.log('⚠️  用户创建失败，尝试继续...');
      }
    }

    // 登录获取 token
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
        name: 'API测试 - 昨天开始',
        competition_type: 'individual',
        region: 'API测试赛区',
        start_date: yesterday.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        expected_status: 'active'
      },
      {
        name: 'API测试 - 今天开始',
        competition_type: 'duo_team',
        region: 'API测试赛区',
        start_date: today.toISOString().split('T')[0],
        end_date: tomorrow.toISOString().split('T')[0],
        expected_status: 'active'
      },
      {
        name: 'API测试 - 明天开始',
        competition_type: 'challenge',
        region: 'API测试赛区',
        start_date: tomorrow.toISOString().split('T')[0],
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
    } else {
      console.log('\n❌ 自动状态逻辑有问题！');
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

testApiAutoStatus();