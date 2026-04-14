#!/usr/bin/env node

/**
 * Auto Translation Script
 * 自动为组件添加翻译支持
 */

const fs = require('fs');
const path = require('path');

// 翻译映射表
const translationMap = {
  // 通用
  '加载中...': 'common.loading',
  '提交': 'common.submit',
  '取消': 'common.cancel',
  '保存': 'common.save',
  '删除': 'common.delete',
  '编辑': 'common.edit',
  '创建': 'common.create',
  '搜索': 'common.search',
  '筛选': 'common.filter',
  '导出': 'common.export',
  '刷新': 'common.refresh',
  '返回': 'common.back',
  '确认': 'common.confirm',
  '关闭': 'common.close',
  '是': 'common.yes',
  '否': 'common.no',
  '全部': 'common.all',
  '选择': 'common.select',
  '清除': 'common.clear',
  '重置': 'common.reset',
  '应用': 'common.apply',
  '下载': 'common.download',
  '上传': 'common.upload',
  '查看': 'common.view',
  '详情': 'common.details',
  '设置': 'common.settings',
  '退出登录': 'common.logout',
  '登录': 'common.login',
  '注册': 'common.register',
  '欢迎': 'common.welcome',
  '错误': 'common.error',
  '成功': 'common.success',
  '警告': 'common.warning',
  '信息': 'common.info',

  // 认证
  '请先登录': 'auth.emailRequired',
  '登录成功': 'auth.signInSuccess',
  '注册成功': 'auth.signUpSuccess',
  '登录失败': 'auth.signInError',
  '注册失败': 'auth.signUpError',
  '邮箱': 'auth.email',
  '密码': 'auth.password',
  '用户名': 'auth.username',
  '忘记密码？': 'auth.forgotPassword',
  '记住我': 'auth.rememberMe',
  '还没有账号？': 'auth.noAccount',
  '已有账号？': 'auth.hasAccount',
  '立即登录': 'auth.signInNow',
  '立即注册': 'auth.signUpNow',
  '验证邮箱': 'auth.verifyEmail',
  '请输入邮箱': 'auth.emailRequired',
  '请输入密码': 'auth.passwordRequired',
  '邮箱格式不正确': 'auth.invalidEmail',
  '密码至少需要6个字符': 'auth.passwordTooShort',
  '两次输入的密码不一致': 'auth.passwordMismatch',
  '已成功退出登录': 'auth.logoutSuccess',
  '退出登录失败，请重试': 'auth.logoutError',

  // 管理员
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

  // 选手
  '选手': 'athlete.athlete',
  '选手列表': 'athlete.athletes',
  '选手编号': 'athlete.athleteNumber',
  '姓名': 'athlete.name',
  '团队名称': 'athlete.teamName',
  '赛区': 'athlete.region',
  '类别': 'athlete.category',
  '状态': 'athlete.status',
  '操作': 'athlete.actions',
  '添加选手': 'athlete.addAthlete',
  '编辑选手': 'athlete.editAthlete',
  '删除选手': 'athlete.deleteAthlete',
  '选手详情': 'athlete.athleteDetails',
  '暂无选手': 'athlete.noAthletes',
  '选手添加成功': 'athlete.athleteAdded',
  '选手更新成功': 'athlete.athleteUpdated',
  '选手删除成功': 'athlete.athleteDeleted',
  '确认删除此选手？': 'athlete.confirmDelete',
  '搜索选手姓名或编号': 'athlete.searchPlaceholder',
  '按赛区筛选': 'athlete.filterByRegion',
  '按类别筛选': 'athlete.filterByCategory',
  '总选手数': 'athlete.totalAthletes',

  // 比赛
  '比赛': 'competition.competition',
  '比赛列表': 'competition.competitions',
  '比赛名称': 'competition.competitionName',
  '比赛类型': 'competition.competitionType',
  '开始日期': 'competition.startDate',
  '结束日期': 'competition.endDate',
  '描述': 'competition.description',
  '添加比赛': 'competition.addCompetition',
  '编辑比赛': 'competition.editCompetition',
  '删除比赛': 'competition.deleteCompetition',
  '比赛详情': 'competition.competitionDetails',
  '暂无比赛': 'competition.noCompetitions',
  '比赛添加成功': 'competition.competitionAdded',
  '比赛更新成功': 'competition.competitionUpdated',
  '比赛删除成功': 'competition.competitionDeleted',
  '确认删除此比赛？': 'competition.confirmDelete',
  '选择比赛': 'competition.selectCompetition',
  '个人': 'competition.individual',
  '双人/团队': 'competition.duoTeam',
  '挑战': 'competition.challenge',
  '进行中': 'competition.active',
  '已完成': 'competition.completed',
  '即将开始': 'competition.upcoming',
  '已取消': 'competition.cancelled',

  // 评审
  '评审控制台': 'judge.dashboard',
  '选择比赛': 'judge.selectCompetition',
  '选择选手': 'judge.selectAthlete',
  '评分': 'judge.scoring',
  '评分汇总': 'judge.scoreSummary',
  '提交评分': 'judge.submitScore',
  '评分提交成功': 'judge.scoreSubmitted',
  '每项评分范围: 0-30 分': 'judge.scoreRange',
  '请填写所有评分项': 'judge.fillAllScores',
  '评分必须在 0-30 之间': 'judge.invalidScore',
  '暂无可评分的比赛': 'judge.noCompetitions',
  '暂无选手': 'judge.noAthletes',
  '提交中...': 'judge.submitting',
  '帮助文档': 'judge.help',
  '查看评分规则和使用说明': 'judge.helpDescription',
  '查看帮助': 'judge.viewHelp',
  '评分提示': 'judge.scoringTip',
  '您已成功登录为评委。请先选择比赛，然后为选手打分。评分界面已针对平板设备优化。': 'judge.scoringTipDesc',

  // 评分维度
  '动作难度': 'score.actionDifficulty',
  '舞台艺术': 'score.stageArtistry',
  '动作创意': 'score.actionCreativity',
  '动作流畅': 'score.actionFluency',
  '服装造型': 'score.costumeStyling',
  '动作互动': 'score.actionInteraction',
  '总分': 'score.totalScore',
  '平均分': 'score.averageScore',
  '最高分': 'score.highestScore',
  '最低分': 'score.lowestScore',
  '排名': 'score.rank',
  '评分': 'score.scores',
  '评分详情': 'score.scoreDetails',

  // 显示
  '实时比分大屏幕': 'display.scoreboard',
  '排行榜': 'display.rankings',
  '实时比分': 'display.liveScores',
  '当前排名': 'display.currentRankings',
  '暂无数据': 'display.noData',
  '加载比赛数据...': 'display.loading',
  '加载失败': 'display.loadFailed',
  '重新加载': 'display.retry',
  '暂无活动比赛': 'display.noActiveCompetitions',
  '当前没有正在进行的比赛': 'display.noActiveCompetitionsDesc',

  // 验证
  '此项为必填项': 'validation.required',
  '格式不正确': 'validation.invalidFormat',
  '内容过短': 'validation.tooShort',
  '内容过长': 'validation.tooLong',
  '必须是数字': 'validation.mustBeNumber',
  '必须是正数': 'validation.mustBePositive',
  '超出范围': 'validation.outOfRange',

  // 通知
  '操作成功': 'notification.success',
  '操作失败': 'notification.error',
  '已保存': 'notification.saved',
  '已删除': 'notification.deleted',
  '已更新': 'notification.updated',
  '已创建': 'notification.created'
};

// 检查文件是否需要添加翻译导入
function needsTranslationImport(content) {
  return !content.includes('useTranslation') && !content.includes('useDictionary');
}

// 添加翻译导入
function addTranslationImport(content) {
  // 查找现有的导入语句
  const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\n/g;
  const imports = content.match(importRegex) || [];
  
  // 检查是否已经有翻译导入
  if (content.includes('useTranslation') || content.includes('useDictionary')) {
    return content;
  }
  
  // 添加翻译导入
  const translationImport = "import { useTranslation } from '@/i18n/use-dictionary';\n";
  
  if (imports.length > 0) {
    // 在最后一个导入后添加
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
    return content.slice(0, lastImportIndex) + translationImport + content.slice(lastImportIndex);
  } else {
    // 在文件开头添加
    return translationImport + content;
  }
}

// 添加翻译 hook 使用
function addTranslationHook(content) {
  // 查找函数组件定义
  const componentRegex = /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{/;
  const match = content.match(componentRegex);
  
  if (!match) return content;
  
  const functionStart = match.index + match[0].length;
  
  // 检查是否已经有翻译 hook
  if (content.includes('const { t } = useTranslation()')) {
    return content;
  }
  
  // 添加翻译 hook
  const hookLine = '\n  const { t } = useTranslation();\n';
  
  return content.slice(0, functionStart) + hookLine + content.slice(functionStart);
}

// 替换硬编码文本为翻译调用
function replaceHardcodedText(content) {
  let updatedContent = content;
  
  for (const [chinese, key] of Object.entries(translationMap)) {
    // 匹配各种格式的中文文本
    const patterns = [
      // 字符串字面量
      new RegExp(`'${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'),
      new RegExp(`"${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
      // JSX 文本内容
      new RegExp(`>${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`, 'g'),
      // 模板字符串中的文本
      new RegExp(`\`${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``, 'g')
    ];
    
    patterns.forEach(pattern => {
      if (pattern.source.includes("'")) {
        updatedContent = updatedContent.replace(pattern, `{t('${key}')}`);
      } else if (pattern.source.includes('"')) {
        updatedContent = updatedContent.replace(pattern, `{t('${key}')}`);
      } else if (pattern.source.includes('>') && pattern.source.includes('<')) {
        updatedContent = updatedContent.replace(pattern, `>{t('${key}')}<`);
      } else if (pattern.source.includes('`')) {
        updatedContent = updatedContent.replace(pattern, `{t('${key}')}`);
      }
    });
  }
  
  return updatedContent;
}

// 处理单个文件
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // 检查是否需要添加翻译导入
    if (needsTranslationImport(content)) {
      content = addTranslationImport(content);
      modified = true;
    }
    
    // 添加翻译 hook
    const originalContent = content;
    content = addTranslationHook(content);
    if (content !== originalContent) {
      modified = true;
    }
    
    // 替换硬编码文本
    const beforeReplace = content;
    content = replaceHardcodedText(content);
    if (content !== beforeReplace) {
      modified = true;
    }
    
    // 如果有修改，写回文件
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ 已更新: ${path.relative(process.cwd(), filePath)}`);
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
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过某些目录
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.spec.')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 主函数
function main() {
  console.log('🚀 开始自动添加翻译支持...\n');
  
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  
  const allFiles = [
    ...getAllTsxFiles(componentsDir),
    ...getAllTsxFiles(appDir)
  ];
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  for (const filePath of allFiles) {
    processedCount++;
    if (processFile(filePath)) {
      modifiedCount++;
    }
  }
  
  console.log(`\n📊 处理完成:`);
  console.log(`   处理文件: ${processedCount}`);
  console.log(`   修改文件: ${modifiedCount}`);
  console.log(`   跳过文件: ${processedCount - modifiedCount}`);
  
  if (modifiedCount > 0) {
    console.log('\n🎉 翻译支持添加完成！');
    console.log('💡 建议运行 `node scripts/check-translations.js` 检查结果');
  } else {
    console.log('\n✅ 所有文件都已支持翻译！');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, translationMap };