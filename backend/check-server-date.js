// 检查服务器的实际日期
console.log('🕐 服务器日期检查');
console.log('');

const now = new Date();
console.log(`完整时间戳: ${now.toISOString()}`);
console.log(`本地时间: ${now.toLocaleString()}`);
console.log(`本地日期: ${now.toLocaleDateString()}`);
console.log('');

// 使用我们修复后的逻辑
const today = new Date();
const todayStr = today.getFullYear() + '-' + 
                String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                String(today.getDate()).padStart(2, '0');

console.log(`格式化今天: ${todayStr}`);
console.log('');

// 测试不同日期的比较
const testDates = ['2026-04-12', '2026-04-13', '2026-04-14', '2026-04-15'];

testDates.forEach(dateStr => {
  const startDateObj = new Date(dateStr);
  const startStr = startDateObj.getFullYear() + '-' + 
                  String(startDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(startDateObj.getDate()).padStart(2, '0');
  
  const comparison = startStr <= todayStr;
  const expectedStatus = comparison ? 'active' : 'upcoming';
  
  console.log(`${dateStr}: ${startStr} <= ${todayStr} = ${comparison} → ${expectedStatus}`);
});

process.exit(0);