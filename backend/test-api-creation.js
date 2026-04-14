// 测试通过 API 创建比赛
const axios = require('axios');

async function testApiCreation() {
  try {
    console.log('🌐 测试通过 API 创建比赛\n');

    // 首先需要获取认证 token
    console.log('🔐 获取认证 token...');
    
    // 假设有一个测试用户，或者我们需要先登录
    // 为了测试，我们直接调用 API 看看错误信息
    
    const testCompetition = {
      name: 'API测试比赛 - 今天开始',
      competition_type: 'individual',
      region: 'API测试赛区',
      start_date: '2026-04-13', // 今天
      end_date: '2026-04-14'
      // 注意：不提供 status，让系统自动判断
    };

    console.log('📝 测试数据:');
    console.log(JSON.stringify(testCompetition, null, 2));

    try {
      const response = await axios.post('http://localhost:5000/api/competitions', testCompetition, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('\n✅ API 调用成功！');
      console.log('📋 返回数据:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
      if (error.response) {
        console.log('\n❌ API 调用失败:');
        console.log(`状态码: ${error.response.status}`);
        console.log('错误信息:', error.response.data);
        
        if (error.response.status === 401) {
          console.log('\n💡 需要认证 token。让我们尝试创建一个测试用户...');
          
          // 尝试注册测试用户
          try {
            const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
              username: 'testuser',
              email: 'test@example.com',
              password: 'testpass123',
              role: 'admin'
            });
            
            console.log('✅ 测试用户创建成功');
            
            // 登录获取 token
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
              email: 'test@example.com',
              password: 'testpass123'
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ 获取到 token');
            
            // 重新尝试创建比赛
            const retryResponse = await axios.post('http://localhost:5000/api/competitions', testCompetition, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('\n✅ 使用 token 创建比赛成功！');
            console.log('📋 比赛数据:');
            const competition = retryResponse.data.data.competition;
            console.log(`  ID: ${competition.id}`);
            console.log(`  名称: ${competition.name}`);
            console.log(`  状态: ${competition.status}`);
            console.log(`  开始日期: ${competition.start_date}`);
            
            // 验证状态
            const expectedStatus = 'active';
            const statusCorrect = competition.status === expectedStatus;
            console.log(`\n🔍 状态验证:`);
            console.log(`  预期: ${expectedStatus}`);
            console.log(`  实际: ${competition.status}`);
            console.log(`  正确: ${statusCorrect ? '✅' : '❌'}`);
            
            // 清理测试数据
            console.log('\n🧹 清理测试数据...');
            await axios.delete(`http://localhost:5000/api/competitions/${competition.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('✅ 测试比赛已删除');
            
          } catch (authError) {
            console.log('❌ 认证过程失败:', authError.response?.data || authError.message);
          }
        }
      } else {
        console.log('❌ 网络错误:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testApiCreation();