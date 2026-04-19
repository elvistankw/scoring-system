'use client';

// Bilingual Text Component
// Displays both Chinese and English text with different font sizes

import { useTranslation } from '@/i18n/use-dictionary';

interface BilingualTextProps {
  /** Translation key for the text */
  translationKey?: string;
  /** Direct Chinese text (alternative to translationKey) */
  zh?: string;
  /** Direct English text (alternative to translationKey) */
  en?: string;
  /** Chinese text size class (default: text-base) */
  chineseSize?: string;
  /** English text size class (default: text-sm) */
  englishSize?: string;
  /** Additional CSS classes */
  className?: string;
  /** Layout direction: horizontal or vertical */
  layout?: 'horizontal' | 'vertical';
  /** Separator for horizontal layout */
  separator?: string;
  /** Whether to show only Chinese when locale is zh */
  respectLocale?: boolean;
}

export function BilingualText({
  translationKey,
  zh,
  en,
  chineseSize = 'text-base',
  englishSize = 'text-sm',
  className = '',
  layout = 'horizontal',
  separator = ' / ',
  respectLocale = false,
}: BilingualTextProps) {
  const { t } = useTranslation();
  
  // Get locale from URL path
  const getLocaleFromPath = () => {
    if (typeof window !== 'undefined') {
      const pathLocale = window.location.pathname.split('/')[1];
      return pathLocale === 'en' ? 'en' : 'zh';
    }
    return 'zh';
  };
  
  const locale = getLocaleFromPath();

  // Get translations for both languages
  const getTranslation = (key: string, targetLocale: 'zh' | 'en') => {
    // Handle undefined or empty key
    if (!key) {
      return '';
    }
    
    // This is a simplified approach - in a real implementation,
    // you might want to load both translation dictionaries
    if (targetLocale === locale && key) {
      return t(key);
    }
    
    // For now, we'll use a mapping approach
    // In production, you'd want to load both dictionaries
    const translations: Record<string, { zh: string; en: string }> = {
      'judge.dashboard': { zh: '评审控制台', en: 'Judge Dashboard' },
      'judge.judges': { zh: '评委列表', en: 'Judges' },
      'judge.addJudge': { zh: '添加评委', en: 'Add Judge' },
      'judge.editJudge': { zh: '编辑评委', en: 'Edit Judge' },
      'judge.deleteJudge': { zh: '删除评委', en: 'Delete Judge' },
      'judge.judgeName': { zh: '评委姓名', en: 'Judge Name' },
      'judge.judgeCode': { zh: '评委代码', en: 'Judge Code' },
      'judge.displayName': { zh: '显示名称', en: 'Display Name' },
      'judge.isActive': { zh: '激活状态', en: 'Active Status' },
      'judge.currentlyActive': { zh: '当前活跃', en: 'Currently Active' },
      'judge.lastSession': { zh: '最后登录', en: 'Last Login' },
      'judge.actions': { zh: '操作', en: 'Actions' },
      'judge.totalJudges': { zh: '总评委数', en: 'Total Judges' },
      'judge.active': { zh: '激活', en: 'Active' },
      'judge.inactive': { zh: '停用', en: 'Inactive' },
      'judge.yes': { zh: '是', en: 'Yes' },
      'judge.no': { zh: '否', en: 'No' },
      'judge.never': { zh: '从未', en: 'Never' },
      'judge.selectCompetition': { zh: '选择比赛', en: 'Select Competition' },
      'judge.selectAthlete': { zh: '选择选手', en: 'Select Athlete' },
      'judge.scoring': { zh: '评分', en: 'Scoring' },
      'judge.scoreSummary': { zh: '评分汇总', en: 'Score Summary' },
      'judge.submitScore': { zh: '提交评分', en: 'Submit Score' },
      'judge.scoreSubmitted': { zh: '评分提交成功', en: 'Score submitted successfully' },
      'judge.submitting': { zh: '提交中...', en: 'Submitting...' },
      'judge.canScore': { zh: '可评分', en: 'Can Score' },
      'judge.cannotScore': { zh: '不可评分', en: 'Cannot Score' },
      'judge.scoringCompleted': { zh: '评分已完成', en: 'Scoring Completed' },
      'judge.noCompetitions': { zh: '暂无可评分的比赛', en: 'No competitions available for scoring' },
      'judge.noAthletes': { zh: '暂无选手', en: 'No athletes' },
      'judge.athletesCount': { zh: '位选手', en: 'athletes' },
      'judge.noAthletesInCompetition': { zh: '该比赛暂无选手', en: 'No athletes in this competition' },
      'judge.endSession': { zh: '退出会话', en: 'End Session' },
      'judge.athleteNumber': { zh: '编号', en: 'Number' },
      'judge.judgeNumber': { zh: '评审', en: 'Judge' },
      'judge.selectAthleteFirst': { zh: '请选择选手', en: 'Please select an athlete' },
      'judge.selectAthleteFromList': { zh: '从左侧列表中选择要查看评分的选手', en: 'Select an athlete from the left list to view their scores' },
      'judge.noScoreData': { zh: '暂无评分数据', en: 'No score data' },
      'judge.athleteNoScores': { zh: '该选手还没有收到任何评分', en: 'This athlete has not received any scores yet' },
      'judge.competitionNotActive': { zh: '比赛未激活', en: 'Competition Not Active' },
      'judge.competitionUpcoming': { zh: '此比赛尚未开始，无法进行评分。', en: 'This competition has not started yet and cannot be scored.' },
      'judge.competitionCompleted': { zh: '此比赛已结束，无法进行评分。', en: 'This competition has ended and cannot be scored.' },
      'judge.onlyActiveCompetitionsCanBeScored': { zh: '只有状态为"进行中"的比赛才能进行评分。', en: 'Only competitions with "Active" status can be scored.' },
      'judge.scoringTip': { zh: '评分提示', en: 'Scoring Tips' },
      'judge.scoringTipDesc': { zh: '您已成功登录为评委。请先选择比赛，然后为选手打分。评分界面已针对平板设备优化。', en: 'You are successfully logged in as a judge. Please select a competition first, then score athletes. The scoring interface is optimized for tablet devices.' },
      'judge.scoreSummaryTitle': { zh: '评分汇总', en: 'Score Summary' },
      'judge.scoreSummaryDescription': { zh: '查看比赛评分汇总和选手得分详情', en: 'View competition score summary and athlete score details' },
      'judge.judgeRole': { zh: '评审', en: 'Judge' },
      'judge.judgeDashboard': { zh: '评审仪表板', en: 'Judge Dashboard' },
      'judge.selectCompetitionFirst': { zh: '选择比赛', en: 'Select Competition' },
      'judge.exportExcel': { zh: '导出Excel', en: 'Export Excel' },
      'judge.exportExcelFile': { zh: '导出Excel文件', en: 'Export Excel File' },
      'judge.selectExportMethod': { zh: '选择导出方式：', en: 'Select export method:' },
      'judge.directDownload': { zh: '直接下载', en: 'Direct Download' },
      'judge.directDownloadDesc': { zh: '下载Excel文件到本地', en: 'Download Excel file to local device' },
      'judge.saveToGoogleDrive': { zh: '保存到Google Drive', en: 'Save to Google Drive' },
      'judge.saveToGoogleDriveDesc': { zh: '保存到当前账户的Google Drive', en: 'Save to current account\'s Google Drive' },
      'judge.createOnlineExcel': { zh: '创建在线Excel', en: 'Create Online Excel' },
      'judge.createOnlineExcelDesc': { zh: '创建可在线编辑的Excel链接', en: 'Create an online editable Excel link' },
      'judge.googleAccountConnected': { zh: 'Google账户已连接，现在可以使用Google Drive导出功能', en: 'Google account connected, you can now use Google Drive export functionality' },
      'judge.judgeAdded': { zh: '评委添加成功', en: 'Judge added successfully' },
      'judge.judgeUpdated': { zh: '评委更新成功', en: 'Judge updated successfully' },
      'judge.judgeDeleted': { zh: '评委删除成功', en: 'Judge deleted successfully' },
      'judge.judgeActivated': { zh: '评委已激活', en: 'Judge activated' },
      'judge.judgeDeactivated': { zh: '评委已停用', en: 'Judge deactivated' },
      'judge.confirmDelete': { zh: '确认删除此评委？', en: 'Confirm delete this judge?' },
      'judge.confirmDeleteMessage': { zh: '确定要删除评委吗？如果该评委有评分记录，将只会停用而不会删除。', en: 'Are you sure you want to delete this judge? If the judge has scoring records, they will only be deactivated instead of deleted.' },
      'judge.judgeNamePlaceholder': { zh: '请输入评委姓名', en: 'Enter judge name' },
      'judge.displayNamePlaceholder': { zh: '请输入显示名称（可选）', en: 'Enter display name (optional)' },
      'judge.createJudge': { zh: '创建评委', en: 'Create Judge' },
      'judge.updateJudge': { zh: '更新评委', en: 'Update Judge' },
      'judge.operationFailed': { zh: '操作失败，请重试', en: 'Operation failed, please try again' },
      'judge.deleteFailed': { zh: '删除失败，请重试', en: 'Delete failed, please try again' },
      'judge.loadJudgesFailed': { zh: '加载评委列表失败', en: 'Failed to load judges list' },
      'judge.noJudges': { zh: '暂无评委', en: 'No judges' },
      'judge.deleting': { zh: '删除中...', en: 'Deleting...' },
      // Competition related translations
      'competition.status': { zh: '状态', en: 'Status' },
      'competition.region': { zh: '赛区', en: 'Region' },
      'competition.competitionType': { zh: '比赛类型', en: 'Competition Type' },
      'competition.division': { zh: '组别', en: 'Division' },
      'competition.allStatus': { zh: '全部状态', en: 'All Status' },
      'competition.allRegions': { zh: '全部赛区', en: 'All Regions' },
      'competition.allTypes': { zh: '全部类型', en: 'All Types' },
      'competition.allDivisions': { zh: '全部组别', en: 'All Divisions' },
      'competition.active': { zh: '进行中', en: 'Active' },
      'competition.upcoming': { zh: '即将开始', en: 'Upcoming' },
      'competition.completed': { zh: '已完成', en: 'Completed' },
      'competition.individual': { zh: '个人', en: 'Individual' },
      'competition.duo': { zh: '双人', en: 'Duo' },
      'competition.team': { zh: '团体', en: 'Team' },
      'competition.challenge': { zh: '挑战', en: 'Challenge' },
      'competition.primarySchool': { zh: '小学组', en: 'Primary School' },
      'competition.openDivision': { zh: '公开组（中学组）', en: 'Open Division (Middle School)' },
      'competition.competitions': { zh: '比赛列表', en: 'Competitions' },
      'competition.noMatchingCompetitions': { zh: '没有找到符合条件的比赛', en: 'No matching competitions found' },
      'competition.loadCompetitionsFailed': { zh: '加载比赛列表失败', en: 'Failed to load competitions list' },
      'competition.selectCompetition': { zh: '选择比赛', en: 'Select Competition' },
      // Common translations
      'common.found': { zh: '找到', en: 'Found' },
      'common.selected': { zh: '已选择', en: 'Selected' },
      'common.number': { zh: '编号', en: 'Number' },
      'common.edit': { zh: '编辑', en: 'Edit' },
      'common.delete': { zh: '删除', en: 'Delete' },
      'common.cancel': { zh: '取消', en: 'Cancel' },
      'common.settings': { zh: '设置', en: 'Settings' },
      'common.logout': { zh: '退出登录', en: 'Logout' },
      'common.all': { zh: '全部', en: 'All' },
      // Athlete related translations
      'athlete.athleteNumber': { zh: '选手编号', en: 'Athlete Number' },
      'athlete.teamName': { zh: '团队名称', en: 'Team Name' },
      'athlete.age': { zh: '岁', en: 'years old' },
      'athlete.male': { zh: '男', en: 'Male' },
      'athlete.female': { zh: '女', en: 'Female' },
      'athlete.athletes': { zh: '选手', en: 'Athletes' },
      'athlete.filterByRegion': { zh: '按赛区筛选', en: 'Filter by Region' },
      // Judge sorting translations
      'judge.sortBy': { zh: '排序方式', en: 'Sort By' },
      'judge.sortByNumber': { zh: '按编号', en: 'By Number' },
      'judge.sortByName': { zh: '按姓名', en: 'By Name' },
      'judge.sortByTeam': { zh: '按团队', en: 'By Team' },
      'judge.code': { zh: '评委代码', en: 'Judge Code' },
      // Score dimension translations
      'score.actionDifficulty': { zh: '动作难度', en: 'Action Difficulty' },
      'score.stageArtistry': { zh: '舞台艺术', en: 'Stage Artistry' },
      'score.actionCreativity': { zh: '动作创意', en: 'Action Creativity' },
      'score.actionFluency': { zh: '动作流畅', en: 'Action Fluency' },
      'score.costumeStyling': { zh: '服装造型', en: 'Costume Styling' },
      'score.actionInteraction': { zh: '动作配合', en: 'Action Interaction' },
      'score.scoreDetails': { zh: '评分详情', en: 'Score Details' },
      'score.loadScoresFailed': { zh: '加载评分失败', en: 'Failed to load scores' },
      'judge.scoreRangeNote': { zh: '每个维度的评分范围为 0 到其权重百分比', en: 'Each dimension\'s score range is 0 to its weight percentage' },
      'judge.welcomeMessage': { zh: '欢迎评审员，准备开始专业评分', en: 'Welcome Judge, Ready to Begin Professional Scoring' },
      'judge.startJudging': { zh: '开始评分', en: 'Start Judging' },
      'judge.clickToBegin': { zh: '点击按钮进入评分系统', en: 'Click to Enter Scoring System' },
      'judge.confirmLeave': { zh: '确认离开', en: 'Confirm Leave' },
      'judge.unsavedScoresWarning': { zh: '您有未提交的评分，确定要离开吗？评分已缓存，下次可以继续。', en: 'You have unsubmitted scores. Are you sure you want to leave? Scores are cached and you can continue later.' },
      'judge.leaveAnyway': { zh: '仍要离开', en: 'Leave Anyway' },
      // Display related translations
      'display.loading': { zh: '加载中...', en: 'Loading...' },
      'display.loadFailed': { zh: '加载失败', en: 'Load Failed' },
      'display.retry': { zh: '重试', en: 'Retry' },
      'display.noActiveCompetitions': { zh: '暂无进行中的比赛', en: 'No Active Competitions' },
      'display.noActiveCompetitionsDesc': { zh: '当前没有进行中的比赛可以显示', en: 'No active competitions to display at the moment' },
    };

    return translations[key]?.[targetLocale] || (key ? t(key) : '');
  };

  // Determine the text to display
  let chineseText: string;
  let englishText: string;

  if (translationKey) {
    // Use translation key
    chineseText = getTranslation(translationKey, 'zh');
    englishText = getTranslation(translationKey, 'en');
  } else if (zh && en) {
    // Use direct text
    chineseText = zh;
    englishText = en;
  } else {
    // Fallback
    chineseText = zh || en || '';
    englishText = en || zh || '';
  }

  // If respectLocale is true and we're in Chinese locale, show only Chinese
  if (respectLocale && locale === 'zh') {
    return (
      <span className={`${chineseSize} ${className}`}>
        {chineseText}
      </span>
    );
  }

  // If respectLocale is true and we're in English locale, show only English
  if (respectLocale && locale === 'en') {
    return (
      <span className={`${englishSize} ${className}`}>
        {englishText}
      </span>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={className}>
        <div className={`${chineseSize} font-medium`}>
          {chineseText}
        </div>
        <div className={`${englishSize} text-gray-500 dark:text-gray-400 mt-0.5`}>
          {englishText}
        </div>
      </div>
    );
  }

  return (
    <span className={className}>
      <span className={`${chineseSize} font-medium`}>
        {chineseText}
      </span>
      <span className="text-gray-400 dark:text-gray-500 mx-1">
        {separator}
      </span>
      <span className={`${englishSize} text-gray-500 dark:text-gray-400`}>
        {englishText}
      </span>
    </span>
  );
}