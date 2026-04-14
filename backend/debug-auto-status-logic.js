// 调试自动状态转变逻辑
const axios = require('axios');

async function debugAutoStatusLogic() {
  try {
    console.log('🐛 调试自动状态转变逻辑\n');

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

    // 测试各种情况
    const testCases = [
      {
        name: '测试1: 不提供status，不提供start_date',
        data: {
          name: '测试比赛1',
          competition_type: 'individual',
          region: '调试赛区'
        },
        expected: 'upcoming' // 应该默认为upcoming
      },
      {
        name: '测试2: 不提供status，start_date是昨天',
        data: {
          name: '测试比赛2',
          competition_type: 'individual',
          region: '调试赛区',
          start_date: '2026-04-13' // 昨天
        },
        expected: 'active' // 应该自动设为active
      },
      {
        name: '测试3: 不提供status，start_date是今天',
        data: {
          name: '测试比赛3',
          competition_type: 'individual',
          region: '调试赛区',
          start_date: '2026-04-14' // 今天
        },
        expected: 'active' // 应该自动设为active
      },
      {
        name: '测试4: 不提供status，start_date是明天',
        data: {
          name: '测试比赛4',
          competition_type: 'individual',
          region: '调试赛区',
          start_date: '2026-04-15' // 明天
        },
        expected: 'upcoming' // 应该自动设为upcoming
      },
      {
        name: '测试5: 明确提供status=upcoming，start_date是今天',
        data: {
          name: '测试比赛5',
          competition_type: 'individual',
          region: '调试赛区',
          start_date: '2026-04-14', // 今天
          status: 'upcoming' // 明确指定
        },
        expected: 'upcoming' // 应该使用明确指定的状态
      },
      {
        name: '测试6: 明确提供status=active，start_date是明天',
        data: {
          name: '测试比赛6',
          competition_type: 'individual',
          region: '调试赛区',
          start_date: '2026-04-15', // 明天
          status: 'active' // 明确指定
        },
        expected: 'active' // 应该使用明确指定的状态
      }
    ];

    const createdCompetitions = [];

    for (const testCase of testCases) {
      console.log(`🧪 ${testCase.name}`);
      console.log(`   数据: ${JSON.stringify(testCase.data, null, 2)}`);
      console.log(`   预期状态: ${testCase.expected}`);

      try {
        const response = await axios.post('http://localhost:5000/api/competitions', testCase.data, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const newComp = response.data.data.competition;
        createdCompetitions.push(newComp);
        
        const statusCorrect = newComp.status === testCase.expected;
        const statusIcon = statusCorrect ? '✅' : '❌';

        console.log(`   实际状态: ${newComp.status} ${statusIcon}`);
        console.log(`   比赛ID: ${newComp.id}`);
        
        if (!statusCorrect) {
          console.log(`   ⚠️  状态不正确！应该是 ${testCase.expected}`);
          console.log(`   🔍 可能的问题:`);
          if (!testCase.data.status && !testCase.data.start_date) {
            console.log(`      - 没有start_date时应该默认为upcoming`);
          } else if (!testCase.data.status && testCase.data.start_date) {
            console.log(`      - 自动状态判断逻辑有问题`);
          } else if (testCase.data.status) {
            console.log(`      - 明确指定的状态被覆盖了`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ 创建失败: ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }

    // 总结
    const correctCount = createdCompetitions.filter((comp, index) => 
      comp.status === testCases[index].expected
    ).length;
    
    console.log('📊 测试总结:');
    console.log(`   总测试: ${testCases.length}`);
    console.log(`   通过: ${correctCount}`);
    console.log(`   失败: ${testCases.length - correctCount}`);

    if (correctCount === testCases.length) {
      console.log('\n✅ 自动状态逻辑完全正确！');
    } else {
      console.log('\n❌ 自动状态逻辑有问题！');
      console.log('\n🔧 需要检查的问题:');
      console.log('   1. 没有start_date时是否正确默认为upcoming');
      console.log('   2. 有start_date但没有status时是否正确自动判断');
      console.log('   3. 明确提供status时是否被正确使用');
      console.log('   4. 日期比较逻辑是否正确');
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

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugAutoStatusLogic();