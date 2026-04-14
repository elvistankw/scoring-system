#!/usr/bin/env node

/**
 * Comprehensive Component Translation Script
 * Systematically translates all hardcoded Chinese text in components
 */

const fs = require('fs');
const path = require('path');

// Translation mappings for common hardcoded text
const translations = {
  // Common actions and states
  '确定要删除选手吗？此操作不可撤销。': 't(\'athlete.confirmDeleteMessage\')',
  '确定要删除比赛吗？此操作不可撤销。': 't(\'competition.confirmDeleteMessage\')',
  '重试': 't(\'common.retry\')',
  '共 {': 't(\'common.total\') + \' \' + ',
  '名选手': ' + \' \' + t(\'athlete.athletes\')',
  '从 {': 't(\'common.from\') + \' \' + ',
  '名中筛选': ' + \' \' + t(\'common.filtered\')',
  '团队: {': 't(\'common.team\') + \': \' + ',
  '参赛': 't(\'common.competition\')',
  '编辑': 't(\'common.edit\')',
  '删除中...': 't(\'common.deleting\')',
  '添加中...': 't(\'common.adding\')',
  '移除中...': 't(\'common.removing\')',
  
  // Competition athlete list specific
  '参赛选手管理': 't(\'common.participantManagement\')',
  '管理比赛参赛选手名单': 't(\'common.manageCompetitionAthletes\')',
  '添加选手到比赛': 't(\'common.addAthleteToCompetition\')',
  '创建新选手': 't(\'common.createNewAthlete\')',
  '选择选手...': 't(\'common.selectAthlete\')',
  '添加': 't(\'common.add\')',
  '所有选手都已添加到此比赛': 't(\'common.allAthletesAdded\')',
  '当前参赛选手': 't(\'common.currentParticipants\')',
  '暂无参赛选手': 't(\'common.noParticipants\')',
  '移除': 't(\'common.remove\')',
  '关闭': 't(\'common.close\')',
  
  // Competition edit client
  '加载比赛信息失败': 't(\'competition.loadCompetitionsFailed\')',
  '比赛信息更新成功！': 't(\'competition.competitionUpdated\')',
  '比赛不存在': 't(\'competition.competitionNotFound\')',
  '找不到指定的比赛信息': 't(\'competition.competitionNotFoundDesc\')',
  '返回': 't(\'common.back\')',
  '编辑比赛：': 't(\'competition.editCompetition\') + \': \'',
  '比赛信息': 't(\'competition.competitionDetails\')',
  '选手管理': 't(\'athlete.athleteManagement\')',
  '编辑比赛信息': 't(\'competition.editCompetition\')',
  
  // Competition form
  '比赛更新成功！': 't(\'competition.competitionUpdated\')',
  '比赛创建成功！': 't(\'competition.competitionAdded\')',
  '比赛名称 *': 't(\'competition.competitionName\') + \' *\'',
  '比赛类型 *': 't(\'competition.competitionType\') + \' *\'',
  '赛区 *': 't(\'competition.region\') + \' *\'',
  '比赛状态': 't(\'competition.status\')',
  '开始日期 *': 't(\'competition.startDate\') + \' *\'',
  '结束日期 *': 't(\'competition.endDate\') + \' *\'',
  '取消': 't(\'common.cancel\')',
  
  // Competition list
  '比赛删除成功！': 't(\'competition.competitionDeleted\')',
  '查看详情': 't(\'common.viewDetails\')',
  
  // Athlete list
  '搜索选手姓名、编号或团队...': 't(\'athlete.searchAthletes\')',
  
  // Google auth
  '授权失败': 't(\'auth.authorizationFailed\')',
  '关闭窗口': 't(\'common.closeWindow\')',
  '授权成功！': 't(\'auth.authorizationSuccess\')',
  '您的Google账户已成功连接': 't(\'auth.googleAccountConnected\')',
  
  // Display components
  '赛区: ': 't(\'common.region\') + \': \'',
  '重新加载': 't(\'common.reload\')',
  '实时排名系统': 't(\'display.realtimeRankingSystem\')',
  '实时比分系统': 't(\'display.realtimeScoreSystem\')',
  
  // Realtime score display
  '🟢 已连接': '\'🟢 \' + t(\'common.connected\')',
  '🟡 连接中...': '\'🟡 \' + t(\'common.connecting\')',
  '🟠 重新连接中...': '\'🟠 \' + t(\'common.reconnecting\')',
  '⚪ 未连接': '\'⚪ \' + t(\'common.disconnected\')',
  '🔴 连接失败': '\'🔴 \' + t(\'common.failed\')',
  '⚪ 未知状态': '\'⚪ \' + t(\'common.unknown\')',
  
  // Score dimensions
  '难度: ': 't(\'score.actionDifficulty\') + \': \'',
  '艺术: ': 't(\'score.stageArtistry\') + \': \'',
  '创意: ': 't(\'score.actionCreativity\') + \': \'',
  '流畅: ': 't(\'score.actionFluency\') + \': \'',
  '服装: ': 't(\'score.costumeStyling\') + \': \'',
  '互动: ': 't(\'score.actionInteraction\') + \': \'',
  
  // Judge components
  '编号: ': 't(\'common.number\') + \': \'',
  '加载比赛失败': 't(\'competition.loadCompetitionsFailed\')',
  '找到 ': 't(\'common.found\') + \' \'',
  ' 个比赛': ' + \' \' + t(\'competition.competitions\')',
  '没有找到符合条件的比赛': 't(\'competition.noMatchingCompetitions\')',
  '请尝试调整筛选条件': 't(\'competition.adjustFilterConditions\')',
  
  // Score input form
  '提交失败，请重试': 't(\'common.operationFailed\')',
  
  // Settings modal
  '语言 / Language': 't(\'common.language\')',
  '简体中文': 't(\'common.simplifiedChinese\')',
  
  // Error messages and notifications
  '您没有评审权限': 't(\'auth.noJudgePermission\')',
  '无法连接到服务器，请检查网络连接': 't(\'common.serverConnectionError\')',
  '获取评分数据失败': 't(\'score.loadScoresFailed\')',
  '请先选择比赛': 't(\'common.pleaseSelectCompetition\')',
  '文件内容为空': 't(\'common.fileContentEmpty\')',
  '评分汇总': 't(\'judge.scoreSummary\')',
  '文件下载成功！文件大小: ': 't(\'common.fileDownloadSuccess\') + \' \'',
  'KB': 'KB',
  '文件下载失败，请重试': 't(\'common.fileDownloadFailed\')',
  '文件已保存到': 't(\'common.fileSavedTo\')',
  '的Google Drive': '\' \' + t(\'common.googleDrive\')',
  '在线Excel已创建，新窗口已打开': 't(\'common.onlineExcelCreated\')',
  '导出失败，请重试': 't(\'common.exportFailed\')',
};

// Additional translation keys to add to translation files
const additionalKeys = {
  zh: {
    competition: {
      competitionNotFound: "比赛不存在",
      competitionNotFoundDesc: "找不到指定的比赛信息",
      noMatchingCompetitions: "没有找到符合条件的比赛",
      adjustFilterConditions: "请尝试调整筛选条件"
    },
    auth: {
      authorizationFailed: "授权失败",
      authorizationSuccess: "授权成功！",
      googleAccountConnected: "您的Google账户已成功连接",
      noJudgePermission: "您没有评审权限"
    },
    display: {
      realtimeRankingSystem: "实时排名系统",
      realtimeScoreSystem: "实时比分系统"
    },
    score: {
      loadScoresFailed: "获取评分数据失败"
    },
    common: {
      language: "语言 / Language",
      simplifiedChinese: "简体中文",
      serverConnectionError: "无法连接到服务器，请检查网络连接",
      pleaseSelectCompetition: "请先选择比赛",
      fileContentEmpty: "文件内容为空",
      fileDownloadSuccess: "文件下载成功！文件大小:",
      fileDownloadFailed: "文件下载失败，请重试",
      fileSavedTo: "文件已保存到",
      googleDrive: "的Google Drive",
      onlineExcelCreated: "在线Excel已创建，新窗口已打开",
      exportFailed: "导出失败，请重试"
    }
  },
  en: {
    competition: {
      competitionNotFound: "Competition Not Found",
      competitionNotFoundDesc: "Cannot find the specified competition information",
      noMatchingCompetitions: "No matching competitions found",
      adjustFilterConditions: "Please try adjusting the filter conditions"
    },
    auth: {
      authorizationFailed: "Authorization Failed",
      authorizationSuccess: "Authorization Successful!",
      googleAccountConnected: "Your Google account has been successfully connected",
      noJudgePermission: "You do not have judge permissions"
    },
    display: {
      realtimeRankingSystem: "Real-time Ranking System",
      realtimeScoreSystem: "Real-time Scoring System"
    },
    score: {
      loadScoresFailed: "Failed to load score data"
    },
    common: {
      language: "Language / 语言",
      simplifiedChinese: "Simplified Chinese",
      serverConnectionError: "Unable to connect to server, please check network connection",
      pleaseSelectCompetition: "Please select a competition first",
      fileContentEmpty: "File content is empty",
      fileDownloadSuccess: "File downloaded successfully! File size:",
      fileDownloadFailed: "File download failed, please try again",
      fileSavedTo: "File saved to",
      googleDrive: " Google Drive",
      onlineExcelCreated: "Online Excel created, new window opened",
      exportFailed: "Export failed, please try again"
    }
  }
};

function updateTranslationFiles() {
  console.log('📝 Updating translation files with additional keys...');
  
  // Update Chinese translation file
  const zhPath = path.join(__dirname, '../i18n/locales/zh.json');
  const zhContent = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  
  // Merge additional keys
  Object.keys(additionalKeys.zh).forEach(category => {
    if (!zhContent[category]) zhContent[category] = {};
    Object.assign(zhContent[category], additionalKeys.zh[category]);
  });
  
  fs.writeFileSync(zhPath, JSON.stringify(zhContent, null, 2), 'utf8');
  
  // Update English translation file
  const enPath = path.join(__dirname, '../i18n/locales/en.json');
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  
  // Merge additional keys
  Object.keys(additionalKeys.en).forEach(category => {
    if (!enContent[category]) enContent[category] = {};
    Object.assign(enContent[category], additionalKeys.en[category]);
  });
  
  fs.writeFileSync(enPath, JSON.stringify(enContent, null, 2), 'utf8');
  
  console.log('✅ Translation files updated successfully');
}

function translateComponent(filePath) {
  console.log(`🔄 Translating: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Apply translations
  Object.entries(translations).forEach(([chinese, translation]) => {
    if (content.includes(chinese)) {
      // Handle different contexts for the same text
      if (chinese.includes('{') || chinese.includes('}')) {
        // Template literal replacement - more complex
        const regex = new RegExp(chinese.replace(/[{}]/g, '\\$&'), 'g');
        if (regex.test(content)) {
          content = content.replace(regex, translation);
          hasChanges = true;
        }
      } else {
        // Simple string replacement
        content = content.replaceAll(`'${chinese}'`, translation);
        content = content.replaceAll(`"${chinese}"`, translation);
        content = content.replaceAll(`>${chinese}<`, `>{${translation}}<`);
        hasChanges = true;
      }
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function findComponentFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function main() {
  console.log('🚀 Starting comprehensive component translation...\n');
  
  // Update translation files first
  updateTranslationFiles();
  
  // Find all component files
  const componentDirs = [
    path.join(__dirname, '../components'),
    path.join(__dirname, '../app'),
  ];
  
  let totalFiles = 0;
  let translatedFiles = 0;
  
  componentDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = findComponentFiles(dir);
      totalFiles += files.length;
      
      files.forEach(file => {
        if (translateComponent(file)) {
          translatedFiles++;
        }
      });
    }
  });
  
  console.log(`\n📊 Translation Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files with translations: ${translatedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - translatedFiles}`);
  console.log('\n✨ Component translation completed!');
}

if (require.main === module) {
  main();
}

module.exports = { translateComponent, updateTranslationFiles };