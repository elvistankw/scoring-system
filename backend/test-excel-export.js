// Test script for Excel export functionality
const XLSX = require('xlsx');

console.log('Testing Excel export functionality...');

try {
  // Create a simple workbook
  const workbook = XLSX.utils.book_new();
  
  // Create test data
  const testData = [
    ['选手编号', '选手姓名', '团队名称', '评审', '动作难度', '舞台艺术'],
    ['001', '张三', '团队A', '评审1', 85, 90],
    ['002', '李四', '团队B', '评审1', 88, 87],
    ['003', '王五', '团队C', '评审2', 92, 89]
  ];
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(testData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '测试数据');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  console.log('✅ Excel file generated successfully');
  console.log('Buffer size:', buffer.length, 'bytes');
  console.log('Base64 length:', buffer.toString('base64').length, 'characters');
  
  // Test base64 conversion
  const base64 = buffer.toString('base64');
  const decoded = Buffer.from(base64, 'base64');
  
  if (decoded.equals(buffer)) {
    console.log('✅ Base64 encoding/decoding works correctly');
  } else {
    console.log('❌ Base64 encoding/decoding failed');
  }
  
} catch (error) {
  console.error('❌ Excel export test failed:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed!');