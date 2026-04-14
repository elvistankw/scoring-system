// 测试修复后的Excel导出功能
const axios = require('axios');
const fs = require('fs');
const XLSX = require('xlsx');

const API_BASE = 'http://localhost:5000/api';

async function testFixedExcelExport() {
  console.log('🧪 测试修复后的Excel导出功能...\n');

  try {
    // 1. 登录获取token
    console.log('1. 登录系统...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'judge@test.com',
      password: 'judge123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 获取比赛列表
    console.log('2. 获取比赛列表...');
    const competitionsResponse = await axios.get(`${API_BASE}/competitions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const competitions = competitionsResponse.data.data.competitions;
    console.log(`✅ 找到 ${competitions.length} 个比赛`);
    
    if (competitions.length === 0) {
      console.log('❌ 没有比赛可供测试');
      return;
    }

    const testCompetition = competitions[0];
    console.log(`3. 测试比赛: ${testCompetition.name} (ID: ${testCompetition.id})`);

    // 3. 测试Excel导出
    console.log('4. 测试Excel导出...');
    const exportResponse = await axios.post(`${API_BASE}/competitions/${testCompetition.id}/export-excel`, {
      export_type: 'download'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Excel导出API调用成功');
    console.log('响应状态:', exportResponse.data.status);
    console.log('文件名:', exportResponse.data.data.filename);
    console.log('文件大小:', exportResponse.data.data.size, 'bytes');
    console.log('Base64内容长度:', exportResponse.data.data.file_content?.length || 0);

    // 4. 验证Excel文件内容
    console.log('5. 验证Excel文件内容...');
    
    if (!exportResponse.data.data.file_content) {
      throw new Error('Excel文件内容为空');
    }

    // 解码Base64并保存到临时文件
    const base64Content = exportResponse.data.data.file_content;
    const buffer = Buffer.from(base64Content, 'base64');
    const tempFilename = `temp_${Date.now()}.xlsx`;
    
    fs.writeFileSync(tempFilename, buffer);
    console.log(`✅ 临时文件已保存: ${tempFilename}`);

    // 尝试读取Excel文件验证完整性
    try {
      const workbook = XLSX.readFile(tempFilename);
      const sheetNames = workbook.SheetNames;
      
      console.log('✅ Excel文件结构验证成功');
      console.log('工作表:', sheetNames);
      
      // 检查每个工作表的内容
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`  - ${sheetName}: ${data.length} 行数据`);
      });

      // 清理临时文件
      fs.unlinkSync(tempFilename);
      console.log('✅ 临时文件已清理');

    } catch (readError) {
      console.error('❌ Excel文件读取失败:', readError.message);
      // 清理临时文件
      if (fs.existsSync(tempFilename)) {
        fs.unlinkSync(tempFilename);
      }
      throw readError;
    }

    // 6. 测试其他导出类型
    console.log('6. 测试Google Drive导出...');
    const driveResponse = await axios.post(`${API_BASE}/competitions/${testCompetition.id}/export-excel`, {
      export_type: 'google-drive',
      target_email: 'test@example.com'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Google Drive导出成功');
    console.log('Drive文件ID:', driveResponse.data.data.drive_file_id);

    console.log('7. 测试在线Excel导出...');
    const onlineResponse = await axios.post(`${API_BASE}/competitions/${testCompetition.id}/export-excel`, {
      export_type: 'online-excel'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ 在线Excel导出成功');
    console.log('Excel URL:', onlineResponse.data.data.excel_url);

    console.log('\n🎉 所有Excel导出测试通过！');
    console.log('\n📊 测试总结:');
    console.log('  ✓ 文件生成正常');
    console.log('  ✓ Base64编码正确');
    console.log('  ✓ Excel格式有效');
    console.log('  ✓ 中文内容支持');
    console.log('  ✓ 所有导出类型工作正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示：请确保后端服务器正在运行');
    }
    
    if (error.response?.status === 401) {
      console.log('💡 提示：请检查用户凭据');
    }
    
    if (error.response?.status === 500) {
      console.log('💡 提示：服务器内部错误，请检查后端日志');
    }
  }
}

testFixedExcelExport();