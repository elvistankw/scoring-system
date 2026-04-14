#!/usr/bin/env node

/**
 * 单个组件翻译更新脚本
 * 为指定组件添加翻译支持
 */

const fs = require('fs');
const path = require('path');

// 常用翻译映射
const commonTranslations = {
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
  
  // 比赛相关
  '比赛': 'competition.competition',
  '比赛列表': 'competition.competitions',
  '比赛名称': 'competition.competitionName',
  '比赛类型': 'competition.competitionType',
  '选择比赛': 'competition.selectCompetition',
  '赛区': 'competition.region',
  '状态': 'competition.status',
  '个人赛': 'competition.individual',
  '双人/团队赛': 'competition.duoTeam',
  '挑战赛': 'competition.challenge',
  '进行中': 'competition.active',
  '已完成': 'competition.completed',
  '即将开始': 'competition.upcoming',
  '暂无比赛': 'competition.noCompetitions',
  
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
  
  // 显示相关
  '实时比分大屏幕': 'display.scoreboard',
  '排行榜': 'display.rankings',
  '暂无数据': 'display.noData',
  '加载失败': 'display.loadFailed',
  '重新加载': 'display.retry',
  
  // 通知相关
  '操作成功': 'notification.success',
  '操作失败': 'notification.error',
  '操作失败，请重试': 'notification.error'
};

// 添加翻译导入
function addTranslationImport(content) {
  if (content.includes('useTranslation') || content.includes('useDictionary')) {
    return content;
  }
  
  // 查找导入区域
  const lines = content.split('\n');
  let insertIndex = -1;
  
  // 找到最后一个 import 语句
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && lines[i].includes('from ')) {
      insertIndex = i;
    }
  }
  
  if (insertIndex === -1) {
    // 没有找到导入语句，在文件开头添加
    return "import { useTranslation } from '@/i18n/use-dictionary';\n" + content;
  }
  
  // 在最后一个导入后添加
  lines.splice(insertIndex + 1, 0, "import { useTranslation } from '@/i18n/use-dictionary';");
  return lines.join('\n');
}

// 添加翻译 hook
function addTranslationHook(content) {
  if (content.includes('const { t } = useTranslation()')) {
    return content;
  }
  
  // 查找函数组件定义
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
  
  for (const [chinese, key] of Object.entries(commonTranslations)) {
    // 转义特殊字符
    const escapedChinese = chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 替换字符串字面量 - 注意不要添加额外的花括号
    result = result.replace(new RegExp(`'${escapedChinese}'`, 'g'), `t('${key}')`);
    result = result.replace(new RegExp(`"${escapedChinese}"`, 'g'), `t('${key}')`);
    
    // 替换 JSX 文本内容
    result = result.replace(new RegExp(`>${escapedChinese}<`, 'g'), `>{t('${key}')}<`);
    
    // 替换模板字符串
    result = result.replace(new RegExp(`\`${escapedChinese}\``, 'g'), `t('${key}')`);
  }
  
  return result;
}

// 处理文件
function updateComponent(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    return false;
  }
  
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
      console.log(`✅ 已更新: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  无需更新: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 更新失败: ${filePath}`, error.message);
    return false;
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法: node scripts/update-component.js <file-path>');
    console.log('示例: node scripts/update-component.js components/admin/athlete-form.tsx');
    process.exit(1);
  }
  
  const filePath = args[0];
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  console.log(`🔄 更新组件翻译: ${filePath}`);
  
  if (updateComponent(fullPath)) {
    console.log('🎉 更新完成！');
  } else {
    console.log('⚠️  更新失败或无需更新');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateComponent, commonTranslations };