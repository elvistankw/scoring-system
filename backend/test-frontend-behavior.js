// 测试修复后的前端行为
const axios = require('axios');

async function testFrontendBehavior() {
  try {
    console.log('🧪 测试修复后的前端行为\n');

    // 获取认证 token
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

    // 模拟修复后的前端行为：创建比赛时不发送 status 字段
    const testCompetitions = [
      {
        name: '前端测试 - 昨天开始',
        competition_type: 'individual',
        region: '前端测试赛区',
        start_date: '2026-04-13', // 昨天
        end_date: '2026-04-14'
        // 注意：不包含 status 字段
      },
      {
        name: '前端测试 - 今天开始',
        competition_type: 'duo_team',
        region: '前端测试赛区',
        start_date: '2026-04-14', // 今天
        end_date: '2026-04-15'
        // 注意：不包含 status 字段
      },
      {
        name: '前端测试 - 明天开始',
        competition_type: 'challenge',
        region: '前端测试赛区',
        start_date: '2026-04-15', // 明天
        end_date: '2026-04-16'
        // 注意：不包含 status 字段
      }
    ];

    console.log('🔧 模拟前端创建比赛（不发送status字段）...\n');
    const createdCompetitions = [];

    for (const comp of testCompetitions) {
      console.log(`创建: ${comp.name}`);
      console.log(`  开始日期: ${comp.start_date}`);
      console.log(`  发送数据: ${JSON.stringify(comp, null, 2)}`);

      try {
        const response = await axios.post('http://localhost:5000/api/competitions', comp, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const newComp = response.data.data.competition;
        createdCompetitions.push(newComp);
        
        // 判断预期状态
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        const startDateObj = new Date(comp.start_date);
        const startStr = startDateObj.getFullYear() + '-' + 
                        String(startDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(startDateObj.getDate()).padStart(2, '0');
        
        const shouldBeActive = startStr <= todayStr;
        const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
        const statusCorrect = newComp.status === expectedStatus;
        const statusIcon = statusCorrect ? '✅' : '❌';

        console.log(`  实际状态: ${newComp.status} ${statusIcon}`);
        console.log(`  预期状态: ${expectedStatus}`);
        console.log(`  比赛ID: ${newComp.id}`);
        
        if (!statusCorrect) {
          console.log(`  ⚠️  状态不正确！`);
        }
        
      } catch (error) {
        console.log(`  ❌ 创建失败: ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }

    // 验证结果
    const correctCount = createdCompetitions.filter((comp, index) => {
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
      
      const startDateObj = new Date(testCompetitions[index].start_date);
      const startStr = startDateObj.getFullYear() + '-' + 
                      String(startDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(startDateObj.getDate()).padStart(2, '0');
      
      const shouldBeActive = startStr <= todayStr;
      const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
      return comp.status === expectedStatus;
    }).length;
    
    console.log('📊 测试结果:');
    console.log(`   总计: ${createdCompetitions.length} 个比赛`);
    console.log(`   正确: ${correctCount} 个`);
    console.log(`   错误: ${createdCompetitions.length - correctCount} 个`);

    if (correctCount === createdCompetitions.length) {
      console.log('\n✅ 前端修复成功！自动状态逻辑正常工作！');
      console.log('🎯 现在前端创建比赛时：');
      console.log('   • 昨天/今天开始的比赛 → 自动设为 active');
      console.log('   • 明天开始的比赛 → 自动设为 upcoming');
    } else {
      console.log('\n❌ 仍有问题，需要进一步调试');
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

testFrontendBehavior();