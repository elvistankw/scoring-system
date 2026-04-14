#!/usr/bin/env node

/**
 * 批量翻译脚本
 * 自动为所有组件添加翻译支持
 */

const fs = require('fs');
const path = require('path');

// 扩展的翻译映射表
const translationMap = {
  // 通用操作
  '加载中...': 'common.loading',
  '提交': 'common.submit',
  '取消': 'common.cancel',
  '保存': 'common.save',
  '删除': 'common.delete',
  '编辑': 'common.edit',
  '创建': 'common.create',
  '搜索': 'common.search',
  '查看': 'common.view',
  '关闭': 'common.close',
  '确认': 'common.confirm',
  '返回': 'common.back',
  '重试': 'common.retry',
  '刷新': 'common.refresh',
  '重新加载': 'common.retry',
  '详情': 'common.details',
  '设置': 'common.settings',
  '操作': 'common.actions',
  '状态': 'common.status',
  '全部': 'common.all',
  '选择': 'common.select',
  
  // 认证相关
  '请先登录': 'auth.pleaseLogin',
  '登录成功': 'auth.signInSuccess',
  '登录失败': 'auth.signInError',
  '退出登录': 'auth.signOut',
  '已成功退出登录': 'auth.logoutSuccess',
  '退出登录失败，请重试': 'auth.logoutError',
  '邮箱': 'auth.email',
  '密码': 'auth.password',
  '用户名': 'auth.username',
  '角色': 'auth.role',
  '评委': 'auth.judge',
  '管理员': 'auth.admin',
  '处理中...': 'auth.processing',
  '登录': 'auth.signIn',
  '注册': 'auth.signUp',
  '授权成功': 'auth.signInSuccess',
  '授权失败': 'auth.signInError',
  '账户授权成功': 'auth.signInSuccess',
  '账户授权失败': 'auth.signInError',
  
  // 选手相关
  '选手': 'athlete.athlete',
  '选手列表': 'athlete.athletes',
  '选手编号': 'athlete.athleteNumber',
  '姓名': 'athlete.name',
  '团队名称': 'athlete.teamName',
  '编号': 'athlete.athleteNumber',
  '团队': 'athlete.teamName',
  '选手信息更新成功': 'athlete.athleteUpdated',
  '选手创建成功': 'athlete.athleteAdded',
  '选手删除成功': 'athlete.athleteDeleted',
  '暂无选手': 'athlete.noAthletes',
  '添加选手': 'athlete.addAthlete',
  '编辑选手': 'athlete.editAthlete',
  '删除选手': 'athlete.deleteAthlete',
  '选手姓名': 'athlete.athleteName',
  '请输入选手姓名': 'athlete.athleteNamePlaceholder',
  '例如: A001': 'athlete.athleteNumberExample',
  '双人/团队赛时填写': 'athlete.teamNamePlaceholder',
  '联系邮箱': 'athlete.contactEmail',
  '联系电话': 'athlete.contactPhone',
  '更新选手': 'athlete.updateAthlete',
  '创建选手': 'athlete.createAthlete',
  '操作失败，请重试': 'athlete.operationFailed',
  '删除失败，请重试': 'athlete.deleteFailed',
  '确定要删除选手': 'athlete.confirmDeleteMessage',
  '加载选手列表失败': 'athlete.loadAthletesFailed',
  '搜索选手姓名、编号或团队...': 'athlete.searchAthletes',
  '未找到匹配的选手': 'athlete.noMatchingAthletes',
  '暂无选手数据': 'athlete.noAthleteData',
  '查看参赛记录': 'athlete.viewCompetitionRecord',
  '参赛': 'athlete.competition',
  '编辑选手信息': 'athlete.editAthleteInfo',
  '删除中...': 'athlete.deleting',
  
  // 比赛相关
  '比赛': 'competition.competition',
  '比赛列表': 'competition.competitions',
  '比赛名称': 'competition.competitionName',
  '比赛类型': 'competition.competitionType',
  '选择比赛': 'competition.selectCompetition',
  '赛区': 'competition.region',
  '个人赛': 'competition.individual',
  '双人/团队赛': 'competition.duoTeam',
  '挑战赛': 'competition.challenge',
  '进行中': 'competition.active',
  '已完成': 'competition.completed',
  '已结束': 'competition.completed',
  '即将开始': 'competition.upcoming',
  '暂无比赛': 'competition.noCompetitions',
  '请输入比赛名称': 'competition.enterCompetitionName',
  '请输入赛区': 'competition.enterRegion',
  '请选择比赛日期': 'competition.selectDate',
  '开始日期不能晚于结束日期': 'competition.startDateAfterEnd',
  '例如：2024春季个人赛': 'competition.competitionNameExample',
  '个人赛 (Individual)': 'competition.individualType',
  '双人/团队赛 (Duo/Team)': 'competition.duoTeamType',
  '挑战赛 (Challenge)': 'competition.challengeType',
  '比赛状态': 'competition.competitionStatus',
  '即将开始 (Upcoming)': 'competition.upcomingStatus',
  '进行中 (Active)': 'competition.activeStatus',
  '已结束 (Completed)': 'competition.completedStatus',
  '例如：华东赛区': 'competition.regionExample',
  '更新比赛': 'competition.updateCompetition',
  '创建比赛': 'competition.createCompetition',
  '确定要删除比赛': 'competition.confirmDeleteMessage',
  '删除失败': 'competition.deleteFailed',
  '加载比赛列表失败': 'competition.loadCompetitionsFailed',
  '筛选条件': 'competition.filterConditions',
  '全部状态': 'competition.allStatus',
  '全部类型': 'competition.allTypes',
  '全部赛区': 'competition.allRegions',
  '输入赛区名称': 'competition.enterRegionName',
  '暂无比赛数据': 'competition.noCompetitionData',
  '赛区：': 'competition.regionLabel',
  '日期：': 'competition.dateLabel',
  '查看详情': 'competition.viewDetails',
  '比赛更新成功': 'competition.competitionUpdated',
  '比赛创建成功': 'competition.competitionAdded',
  '比赛删除成功': 'competition.competitionDeleted',
  '开始日期': 'competition.startDate',
  '结束日期': 'competition.endDate',
  
  // 评分相关
  '评分': 'judge.scoring',
  '评分汇总': 'judge.scoreSummary',
  '提交评分': 'judge.submitScore',
  '评分提交成功': 'judge.scoreSubmitted',
  '提交中...': 'judge.submitting',
  '请填写所有评分项': 'judge.fillAllScores',
  '每项评分范围: 0-30 分': 'judge.scoreRange',
  '动作难度': 'score.actionDifficulty',
  '舞台艺术': 'score.stageArtistry',
  '动作创意': 'score.actionCreativity',
  '动作流畅': 'score.actionFluency',
  '服装造型': 'score.costumeStyling',
  '动作互动': 'score.actionInteraction',
  '评分详情': 'score.scoreDetails',
  '难度': 'score.actionDifficulty',
  '艺术': 'score.stageArtistry',
  '创意': 'score.actionCreativity',
  '流畅': 'score.actionFluency',
  '服装': 'score.costumeStyling',
  '互动': 'score.actionInteraction',
  '评审控制台': 'judge.dashboard',
  '评委控制台': 'judge.dashboard',
  '帮助文档': 'judge.help',
  '查看评分规则和使用说明': 'judge.helpDescription',
  '查看帮助': 'judge.viewHelp',
  '评分提示': 'judge.scoringTip',
  '您已成功登录为评委。请先选择比赛，然后为选手打分。评分界面已针对平板设备优化。': 'judge.scoringTipDesc',
  '评审': 'judge.judge',
  '评委': 'judge.judge',
  
  // 显示相关
  '实时比分大屏幕': 'display.scoreboard',
  '排行榜': 'display.rankings',
  '暂无数据': 'display.noData',
  '加载失败': 'display.loadFailed',
  '重新加载': 'display.retry',
  '实时排名榜': 'display.rankings',
  '加载排名数据...': 'display.loading',
  '在线观众': 'display.onlineViewers',
  '参赛选手': 'display.participants',
  '连接错误': 'display.connectionError',
  '暂无排名数据': 'display.noRankingData',
  '请等待连接...': 'display.waitingConnection',
  '实时排名系统': 'display.realtimeRankingSystem',
  '实时比分系统': 'display.scoreboard',
  '得分记录': 'display.scoreRecords',
  '等待新的得分...': 'display.waitingScores',
  '请连接以接收实时得分': 'display.connectToReceiveScores',
  '最新得分': 'display.latestScore',
  '新得分': 'display.newScore',
  
  // 连接状态
  '已连接': 'connection.connected',
  '连接中': 'connection.connecting',
  '重连中': 'connection.reconnecting',
  '未连接': 'connection.disconnected',
  '失败': 'connection.failed',
  '连接中...': 'connection.connecting',
  '重新连接中...': 'connection.reconnecting',
  '连接失败': 'connection.failed',
  '未知状态': 'connection.unknown',
  '重新连接': 'connection.reconnect',
  '清空记录': 'connection.clearRecords',
  
  // 通知相关
  '操作成功': 'notification.success',
  '操作失败': 'notification.error',
  '已保存': 'notification.saved',
  '已删除': 'notification.deleted',
  '已更新': 'notification.updated',
  '已创建': 'notification.created',
  
  // 管理员相关
  '管理员控制台': 'admin.dashboard',
  '欢迎回来': 'admin.welcomeBack',
  '比赛管理': 'admin.competitionManagement',
  '选手管理': 'admin.athleteManagement',
  '统计数据': 'admin.statistics',
  '管理比赛': 'admin.manageCompetitions',
  '管理选手': 'admin.manageAthletes',
  '查看统计': 'admin.viewStatistics',
  '创建和管理比赛项目': 'admin.createCompetition',
  '录入和管理选手信息': 'admin.createAthlete',
  '查看比赛统计信息': 'admin.viewStats',
  '系统信息': 'admin.systemInfo',
  '您已成功登录为管理员。您可以创建比赛、管理选手和查看统计数据。': 'admin.systemInfoDesc',
  
  // 错误和加载
  '出错了': 'common.error',
  '应用程序遇到了一个错误。请尝试刷新页面或联系技术支持。': 'common.applicationError',
  '错误详情': 'common.errorDetails',
  '返回首页': 'common.backToHome',
  '页面未找到': 'common.pageNotFound',
  '返回登录': 'common.backToLogin',
  
  // 其他常用
  '共': 'common.total',
  '位选手': 'athlete.athleteCount',
  '个比赛': 'competition.competitionCount',
  '条': 'common.items',
  '从': 'common.from',
  '中筛选': 'common.filtered',
  '找到': 'common.found',
  '没有找到符合条件的比赛': 'competition.noMatchingCompetitions',
  '请尝试调整筛选条件': 'competition.adjustFilters',
  '已选择': 'common.selected',
  '加载比赛失败': 'competition.loadFailed',
  '请稍后重试': 'common.retryLater'
};

// 检查文件是否需要翻译
function needsTranslation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 检查是否已有翻译导入
    const hasImport = content.includes('useTranslation') || content.includes('useDictionary');
    
    // 检查是否有中文文本
    const chineseRegex = /[\u4e00-\u9fff]/;
    const hasChineseText = chineseRegex.test(content);
    
    // 跳过注释和 console.log 中的中文
    const lines = content.split('\n');
    let hasMeaningfulChinese = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        continue;
      }
      if (line.includes('console.')) {
        continue;
      }
      if (chineseRegex.test(line) && !line.includes('t(')) {
        hasMeaningfulChinese = true;
        break;
      }
    }
    
    return hasMeaningfulChinese;
  } catch (error) {
    return false;
  }
}

// 添加翻译导入
function addTranslationImport(content) {
  if (content.includes('useTranslation') || content.includes('useDictionary')) {
    return content;
  }
  
  const lines = content.split('\n');
  let insertIndex = -1;
  
  // 找到最后一个 import 语句
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && lines[i].includes('from ')) {
      insertIndex = i;
    }
  }
  
  if (insertIndex === -1) {
    return "import { useTranslation } from '@/i18n/use-dictionary';\n" + content;
  }
  
  lines.splice(insertIndex + 1, 0, "import { useTranslation } from '@/i18n/use-dictionary';");
  return lines.join('\n');
}

// 添加翻译 hook
function addTranslationHook(content) {
  if (content.includes('const { t } = useTranslation()')) {
    return content;
  }
  
  const componentRegex = /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{/;
  const match = content.match(componentRegex);
  
  if (!match) return content;
  
  const functionStart = match.index + match[0].length;
  const beforeHook = content.slice(0, functionStart);
  const afterHook = content.slice(functionStart);
  
  return beforeHook + '\n  const { t } = useTranslation();\n' + afterHook;
}

// 替换硬编码文本
function replaceHardcodedText(content) {
  let result = content;
  
  for (const [chinese, key] of Object.entries(translationMap)) {
    const escapedChinese = chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 替换字符串字面量
    result = result.replace(new RegExp(`'${escapedChinese}'`, 'g'), `t('${key}')`);
    result = result.replace(new RegExp(`"${escapedChinese}"`, 'g'), `t('${key}')`);
    
    // 替换 JSX 文本内容
    result = result.replace(new RegExp(`>${escapedChinese}<`, 'g'), `>{t('${key}')}<`);
    
    // 替换模板字符串
    result = result.replace(new RegExp(`\`${escapedChinese}\``, 'g'), `t('${key}')`);
  }
  
  return result;
}

// 处理单个文件
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // 1. 添加翻译导入
    content = addTranslationImport(content);
    
    // 2. 添加翻译 hook
    content = addTranslationHook(content);
    
    // 3. 替换硬编码文本
    content = replaceHardcodedText(content);
    
    if (content !== originalContent) {
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
  console.log('🚀 开始批量翻译所有组件...\n');
  
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  
  const allFiles = [
    ...getAllTsxFiles(componentsDir),
    ...getAllTsxFiles(appDir)
  ];
  
  let processedCount = 0;
  let modifiedCount = 0;
  let skippedCount = 0;
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    if (needsTranslation(filePath)) {
      processedCount++;
      if (processFile(filePath)) {
        modifiedCount++;
        console.log(`✅ 已更新: ${relativePath}`);
      } else {
        console.log(`ℹ️  无需更新: ${relativePath}`);
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`\n📊 批量翻译完成:`);
  console.log(`   总文件数: ${allFiles.length}`);
  console.log(`   处理文件: ${processedCount}`);
  console.log(`   修改文件: ${modifiedCount}`);
  console.log(`   跳过文件: ${skippedCount}`);
  
  if (modifiedCount > 0) {
    console.log('\n🎉 批量翻译完成！');
    console.log('💡 建议运行 `node scripts/check-translations.js` 检查结果');
  } else {
    console.log('\n✅ 所有文件都已支持翻译！');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, translationMap, needsTranslation };