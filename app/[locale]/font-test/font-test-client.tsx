'use client';

import { useTranslation } from '@/i18n/use-dictionary';
import type { Locale } from '@/i18n/config';

export function FontTestClient({ locale }: { locale: Locale }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        客户端组件测试 / Client Component Test
      </h2>

      <div className="space-y-6">
        {/* i18n Text Test */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            i18n 翻译测试 / i18n Translation Test
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p><strong>{t('common.welcome')}:</strong> {t('common.loading')}</p>
              <p><strong>{t('auth.signIn')}:</strong> {t('auth.email')}</p>
              <p><strong>{t('admin.dashboard')}:</strong> {t('admin.welcomeBack')}</p>
              <p><strong>{t('athlete.athletes')}:</strong> {t('athlete.name')}</p>
              <p><strong>{t('competition.competitions')}:</strong> {t('competition.individual')}</p>
            </div>
            <div className="space-y-2">
              <p><strong>{t('judge.dashboard')}:</strong> {t('judge.scoring')}</p>
              <p><strong>{t('score.actionDifficulty')}:</strong> {t('score.totalScore')}</p>
              <p><strong>{t('display.scoreboard')}:</strong> {t('display.rankings')}</p>
              <p><strong>{t('notification.success')}:</strong> {t('notification.saved')}</p>
              <p><strong>{t('common.settings')}:</strong> {t('theme.appearance')}</p>
            </div>
          </div>
        </div>

        {/* Font Weight Test */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            字重测试 / Font Weight Test
          </h3>
          <div className="space-y-2">
            <p className="font-thin">细体 Thin (100): 评分系统 Scoring System</p>
            <p className="font-light">轻体 Light (300): 评分系统 Scoring System</p>
            <p className="font-normal">正常 Normal (400): 评分系统 Scoring System</p>
            <p className="font-medium">中等 Medium (500): 评分系统 Scoring System</p>
            <p className="font-semibold">半粗 Semibold (600): 评分系统 Scoring System</p>
            <p className="font-bold">粗体 Bold (700): 评分系统 Scoring System</p>
            <p className="font-extrabold">特粗 Extrabold (800): 评分系统 Scoring System</p>
            <p className="font-black">黑体 Black (900): 评分系统 Scoring System</p>
          </div>
        </div>

        {/* Font Size Test */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            字号测试 / Font Size Test
          </h3>
          <div className="space-y-2">
            <p className="text-xs">超小号 (12px): 评分系统 Scoring System</p>
            <p className="text-sm">小号 (14px): 评分系统 Scoring System</p>
            <p className="text-base">正常 (16px): 评分系统 Scoring System</p>
            <p className="text-lg">大号 (18px): 评分系统 Scoring System</p>
            <p className="text-xl">特大 (20px): 评分系统 Scoring System</p>
            <p className="text-2xl">超大 (24px): 评分系统 Scoring System</p>
            <p className="text-3xl">巨大 (30px): 评分系统 Scoring System</p>
          </div>
        </div>

        {/* UI Components Font Test */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            UI 组件字体测试 / UI Components Font Test
          </h3>
          <div className="space-y-4">
            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {t('common.submit')}
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg">
                {t('common.cancel')}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg">
                {t('notification.success')}
              </button>
            </div>

            {/* Input Fields */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder={t('auth.email')}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <input
                type="text"
                placeholder="Mixed 混合文字 Test 测试"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            {/* Code Block */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <code className="text-sm">
                {`const message = "${t('common.welcome')}";`}<br/>
                {`console.log("评分系统启动成功 / System started successfully");`}
              </code>
            </div>
          </div>
        </div>

        {/* Font Detection */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            字体检测 / Font Detection
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>当前用户代理: {navigator.userAgent}</p>
            <p>当前语言: {locale}</p>
            <p>系统语言: {navigator.language}</p>
            <p>支持的语言: {navigator.languages.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}