#!/usr/bin/env node

/**
 * 优先级翻译脚本
 * 按重要性排序需要翻译的组件
 */

const fs = require('fs');
const path = require('path');

// 中文字符正则表达式
const chineseRegex = /[\u4e00-\u9fff]/g;

// 组件重要性权重
const componentWeights = {
  // 核心认证组件
  'auth-form.tsx': 10,
  'sign-in-client.tsx': 10,
  'sign-up-client.tsx': 10,
  
  // 管理员组件
  'admin-dashboard.tsx': 9,
  'admin-dashboard-client.tsx': 9,
  'competition-form.tsx': 8,
  'athlete-form.tsx': 8,
  'competition-list.tsx': 8,
  'athlete-list.tsx': 8,
  
  // 评审组件
  'judge-dashboard.tsx': 9,
  'judge-dashboard-client.tsx': 9,
  'score-input-form.tsx': 9,
  'score-summary-client.tsx': 8,
  'competition-selector.tsx': 7,
  
  // 显示组件
  'scoreboard-client.tsx': 7,
  'rankings-client.tsx': 7,
  'ranking-table.tsx': 6,
  'scoreboard-grid.tsx': 6,
  
  // 共享组件
  'settings-modal.tsx': 6,
  'google-auth-button.tsx': 5,
  'connection-status.tsx': 4,
  'error-boundary.tsx': 4,
  
  // 页面组件
  'page.tsx': 3,
  'layout.tsx': 2,
  'loading.tsx': 1,
  'not-found.tsx': 2
};

// 获取文件权重
function getFileWeight(filePath) {
  const fileName = path.basename(filePath);
  
  // 直接匹配
  if (componentWeights[fileName]) {
    return componentWeights[fileName];
  }
  
  // 模糊匹配
  for (const [pattern, weight] of Object.entries(componentWeights)) {
    if (fileName.includes(pattern.replace('.tsx', ''))) {
      return weight;
    }
  }
  
  // 默认权重
  if (filePath.includes('/admin/')) return 6;
  if (filePath.includes('/judge/')) return 6;
  if (filePath.includes('/auth/')) return 7;
  if (filePath.includes('/display/')) return 5;
  if (filePath.includes('/shared/')) return 4;
  
  return 1;
}

// 检查文件中的中文文本数量
function countChineseText(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let count = 0;
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // 跳过注释
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      // 跳过 console.log
      if (line.includes('console.')) {
        return;
      }
      
      // 跳过已经翻译的
      if (line.includes('t(') || line.includes('dict.')) {
        return;
      }
      
      const matches = line.match(chineseRegex);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  } catch (error) {
    return 0;
  }
}

// 检查是否已有翻译导入
function hasTranslationImport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('useTranslation') || content.includes('useDictionary');
  } catch (error) {
    return false;
  }
}

// 获取所有 TSX 文件
function getAllTsxFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
            traverse(fullPath);
          }
        } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // 忽略权限错误
    }
  }
  
  traverse(dir);
  return files;
}

// 主函数
function main() {
  console.log('🔍 分析组件翻译优先级...\n');
  
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  
  const allFiles = [
    ...getAllTsxFiles(componentsDir),
    ...getAllTsxFiles(appDir)
  ];
  
  const results = [];
  
  for (const filePath of allFiles) {
    const chineseCount = countChineseText(filePath);
    if (chineseCount > 0) {
      const weight = getFileWeight(filePath);
      const hasTranslation = hasTranslationImport(filePath);
      const priority = weight * chineseCount * (hasTranslation ? 0.5 : 1);
      
      results.push({
        filePath: path.relative(process.cwd(), filePath),
        chineseCount,
        weight,
        hasTranslation,
        priority: Math.round(priority)
      });
    }
  }
  
  // 按优先级排序
  results.sort((a, b) => b.priority - a.priority);
  
  console.log('📊 翻译优先级排序 (前20个):\n');
  console.log('优先级 | 中文数 | 权重 | 已翻译 | 文件路径');
  console.log('-------|--------|------|--------|----------');
  
  results.slice(0, 20).forEach(({ filePath, chineseCount, weight, hasTranslation, priority }) => {
    const translationStatus = hasTranslation ? '✅' : '❌';
    console.log(`${priority.toString().padStart(6)} | ${chineseCount.toString().padStart(6)} | ${weight.toString().padStart(4)} | ${translationStatus.padStart(6)} | ${filePath}`);
  });
  
  console.log(`\n📈 统计信息:`);
  console.log(`   需要翻译的文件: ${results.length}`);
  console.log(`   已有翻译导入: ${results.filter(r => r.hasTranslation).length}`);
  console.log(`   待处理文件: ${results.filter(r => !r.hasTranslation).length}`);
  
  // 输出高优先级文件列表
  const highPriority = results.filter(r => r.priority >= 50 && !r.hasTranslation);
  if (highPriority.length > 0) {
    console.log(`\n🚨 高优先级待处理文件 (优先级 >= 50):`);
    highPriority.forEach(({ filePath, priority }) => {
      console.log(`   ${priority}: ${filePath}`);
    });
  }
  
  // 输出建议
  console.log(`\n💡 建议:`);
  console.log(`   1. 优先处理高优先级文件 (优先级 >= 50)`);
  console.log(`   2. 重点关注认证、管理员、评审相关组件`);
  console.log(`   3. 使用 'node scripts/update-component.js <file>' 更新单个文件`);
}

if (require.main === module) {
  main();
}

module.exports = { getFileWeight, countChineseText, hasTranslationImport };