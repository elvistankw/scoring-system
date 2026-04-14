#!/usr/bin/env node

/**
 * 最终翻译脚本
 * 处理剩余的复杂翻译情况
 */

const fs = require('fs');
const path = require('path');

// 复杂翻译模式 - 使用正则表达式处理包含变量的文本
const complexTranslations = [
  // 确认对话框
  {
    pattern: /确定要删除选手\s*"([^"]*?)"\s*吗？此操作不可撤销。/g,
    replacement: `确定要删除选手 "\${athlete.name}" 吗？此操作不可撤销。`,
    translationKey: 'athlete.confirmDeleteMessage'
  },
  {
    pattern: /确定要删除比赛\s*"([^"]*?)"\s*吗？此操作不可撤销。/g,
    replacement: `确定要删除比赛 "\${competition.name}" 吗？此操作不可撤销。`,
    translationKey: 'competition.confirmDeleteMessage'
  },
  
  // 计数文本
  {
    pattern: /共\s*\{[^}]+\}\s*名选手/g,
    replacement: `共 \${count} 名选手`,
    translationKey: 'athlete.totalCount'
  },
  {
    pattern: /从\s*\{[^}]+\}\s*名中筛选/g,
    replacement: `从 \${total} 名中筛选`,
    translationKey: 'athlete.filteredCount'
  },
  {
    pattern: /找到\s*\{[^}]+\}\s*个比赛/g,
    replacement: `找到 \${count} 个比赛`,
    translationKey: 'competition.foundCount'
  },
  {
    pattern: /\{[^}]+\}\s*位选手/g,
    replacement: `\${count} 位选手`,
    translationKey: 'athlete.athleteCount'
  },
  {
    pattern: /共\s*\{[^}]+\}\s*条/g,
    replacement: `共 \${count} 条`,
    translationKey: 'common.totalItems'
  },
  
  // 状态文本
  {
    pattern: /编号:\s*\{[^}]+\}/g,
    replacement: `编号: \${number}`,
    translationKey: 'athlete.numberLabel'
  },
  {
    pattern: /团队:\s*\{[^}]+\}/g,
    replacement: `团队: \${teamName}`,
    translationKey: 'athlete.teamLabel'
  },
  {
    pattern: /选手:\s*<span[^>]*>\{[^}]+\}<\/span>/g,
    replacement: `选手: <span className="font-bold">\${athleteName}</span>`,
    translationKey: 'athlete.athleteLabel'
  },
  {
    pattern: /评委:\s*\{[^}]+\}/g,
    replacement: `评委: \${judgeName}`,
    translationKey: 'judge.judgeLabel'
  },
  {
    pattern: /赛区:\s*\{[^}]+\}/g,
    replacement: `赛区: \${region}`,
    translationKey: 'competition.regionLabel'
  },
  
  // 连接状态
  {
    pattern: /🟢\s*已连接/g,
    replacement: '🟢 已连接',
    translationKey: 'connection.connected'
  },
  {
    pattern: /🟡\s*连接中\.\.\./g,
    replacement: '🟡 连接中...',
    translationKey: 'connection.connecting'
  },
  {
    pattern: /🟠\s*重新连接中\.\.\./g,
    replacement: '🟠 重新连接中...',
    translationKey: 'connection.reconnecting'
  },
  {
    pattern: /⚪\s*未连接/g,
    replacement: '⚪ 未连接',
    translationKey: 'connection.disconnected'
  },
  {
    pattern: /🔴\s*连接失败/g,
    replacement: '🔴 连接失败',
    translationKey: 'connection.failed'
  },
  {
    pattern: /⚪\s*未知状态/g,
    replacement: '⚪ 未知状态',
    translationKey: 'connection.unknown'
  },
  
  // 评分维度
  {
    pattern: /<div>难度:\s*\{[^}]+\}<\/div>/g,
    replacement: `<div>难度: \${score}</div>`,
    translationKey: 'score.difficultyLabel'
  },
  {
    pattern: /<div>艺术:\s*\{[^}]+\}<\/div>/g,
    replacement: `<div>艺术: \${score}</div>`,
    translationKey: 'score.artistryLabel'
  },
  {
    pattern: /<div>创意:\s*\{[^}]+\}<\/div>/g,
    replacement: `<div>创意: \${score}</div>`,
    translationKey: 'score.creativityLabel'
  },
  {
    pattern: /<div>流畅:\s*\{[^}]+\}<\/div>/g,
    replacement: `<div>流畅: \${score}</div>`,
    translationKey: 'score.fluencyLabel'
  },
  {
    pattern: /<div>服装:\s*\{[^}]+\}<\/div>/g,
    replacement: `<div>服装: \${score}</div>`,
    translationKey: 'score.costumeLabel'
  },
  {
    pattern: /<div>互动:\s*\{[^}]+\}<\/div>/g,
    replacement: `<div>互动: \${score}</div>`,
    translationKey: 'score.interactionLabel'
  }
];

// 简单文本替换
const simpleReplacements = {
  '重试': 'common.retry',
  '编辑': 'common.edit',
  '参赛': 'athlete.competition',
  '团队': 'athlete.team',
  '编号': 'athlete.number',
  '评委': 'judge.judge',
  '评审': 'judge.judge',
  '选手': 'athlete.athlete',
  '赛区': 'competition.region',
  '比赛状态': 'competition.status',
  '比赛类型': 'competition.competitionType',
  '比赛名称': 'competition.competitionName',
  '开始日期': 'competition.startDate',
  '结束日期': 'competition.endDate',
  '查看详情': 'competition.viewDetails',
  '重新加载': 'common.reload',
  '重新连接': 'connection.reconnect',
  '清空记录': 'connection.clearRecords',
  '在线观众': 'display.onlineViewers',
  '参赛选手': 'display.participants',
  '连接错误': 'display.connectionError',
  '得分记录': 'display.scoreRecords',
  '最新得分': 'display.latestScore',
  '新得分': 'display.newScore',
  '评分详情': 'score.scoreDetails',
  '动作难度': 'score.actionDifficulty',
  '舞台艺术': 'score.stageArtistry',
  '动作创意': 'score.actionCreativity',
  '动作流畅': 'score.actionFluency',
  '服装造型': 'score.costumeStyling',
  '动作互动': 'score.actionInteraction',
  '难度': 'score.actionDifficulty',
  '艺术': 'score.stageArtistry',
  '创意': 'score.actionCreativity',
  '流畅': 'score.actionFluency',
  '服装': 'score.costumeStyling',
  '互动': 'score.actionInteraction',
  '出错了': 'common.error',
  '错误详情': 'common.errorDetails',
  '返回首页': 'common.backToHome',
  '页面未找到': 'common.pageNotFound',
  '返回登录': 'common.backToLogin',
  '关闭窗口': 'common.closeWindow',
  '正在关闭窗口...': 'common.closingWindow',
  '窗口将在5秒后自动关闭': 'common.windowAutoClose',
  '授权成功！': 'auth.signInSuccess',
  '授权失败': 'auth.signInError',
  '您的Google账户已成功连接': 'auth.googleConnected',
  '账户授权成功': 'auth.signInSuccess',
  '账户授权失败': 'auth.signInError'
};

// 处理单个文件
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    const originalContent = content;
    
    // 处理复杂模式
    for (const { pattern, translationKey } of complexTranslations) {
      if (pattern.test(content)) {
        // 这些需要手动处理，因为包含变量
        console.log(`⚠️  需要手动处理复杂模式: ${filePath} - ${translationKey}`);
      }
    }
    
    // 处理简单替换
    for (const [chinese, key] of Object.entries(simpleReplacements)) {
      const escapedChinese = chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 替换独立的中文文本
      const patterns = [
        new RegExp(`>${escapedChinese}<`, 'g'),
        new RegExp(`'${escapedChinese}'`, 'g'),
        new RegExp(`"${escapedChinese}"`, 'g')
      ];
      
      patterns.forEach(pattern => {
        if (pattern.source.includes('>') && pattern.source.includes('<')) {
          const newContent = content.replace(pattern, `>{t('${key}')}<`);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        } else if (pattern.source.includes("'")) {
          const newContent = content.replace(pattern, `t('${key}')`);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        } else if (pattern.source.includes('"')) {
          const newContent = content.replace(pattern, `t('${key}')`);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        }
      });
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error.message);
    return false;
  }
}

// 获取所有需要处理的文件
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
  console.log('🔧 开始最终翻译处理...\n');
  
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  
  const allFiles = [
    ...getAllTsxFiles(componentsDir),
    ...getAllTsxFiles(appDir)
  ];
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // 检查文件是否包含中文
    const content = fs.readFileSync(filePath, 'utf-8');
    const chineseRegex = /[\u4e00-\u9fff]/;
    
    if (chineseRegex.test(content)) {
      processedCount++;
      if (processFile(filePath)) {
        modifiedCount++;
        console.log(`✅ 已更新: ${relativePath}`);
      }
    }
  }
  
  console.log(`\n📊 最终翻译处理完成:`);
  console.log(`   处理文件: ${processedCount}`);
  console.log(`   修改文件: ${modifiedCount}`);
  
  if (modifiedCount > 0) {
    console.log('\n🎉 最终翻译处理完成！');
    console.log('💡 建议运行 `node scripts/check-translations.js` 检查结果');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, simpleReplacements };