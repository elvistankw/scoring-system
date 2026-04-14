'use client';

import { useTranslation } from '@/i18n/use-dictionary';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import type { Locale } from '@/i18n/config';

export function I18nDemoClient({ locale }: { locale: Locale }) {
  const { t, dict } = useTranslation();

  return (
    <>
      {/* Language Switcher */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('common.settings')} - Language Switcher
        </h2>
        <LanguageSwitcher currentLocale={locale} />
      </div>

      {/* Client Component Example */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Client Component - useTranslation Hook
        </h2>
        
        <div className="space-y-4">
          {/* Common */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('common.welcome')}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {t('common.submit')}
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg">
                {t('common.cancel')}
              </button>
            </div>
          </div>

          {/* Auth */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('auth.signIn')} / {t('auth.signUp')}
            </h3>
            <div className="space-y-2">
              <input
                type="email"
                placeholder={t('auth.email')}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <input
                type="password"
                placeholder={t('auth.password')}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>

          {/* Admin */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('admin.dashboard')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {dict.admin.systemInfoDesc}
            </p>
          </div>

          {/* Athlete */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('athlete.athletes')}
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>{t('athlete.name')}: {t('athlete.athleteNumber')}</p>
              <p>{t('athlete.region')}: {t('athlete.category')}</p>
            </div>
          </div>

          {/* Competition */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('competition.competitions')}
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {t('competition.individual')}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
                {t('competition.duoTeam')}
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                {t('competition.challenge')}
              </span>
            </div>
          </div>

          {/* Score */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('score.scores')}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div>{t('score.actionDifficulty')}</div>
              <div>{t('score.stageArtistry')}</div>
              <div>{t('score.actionCreativity')}</div>
              <div>{t('score.actionFluency')}</div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('notification.info')}
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg text-sm">
                {t('notification.success')}
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {t('notification.error')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Translations Preview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          All Translations (JSON Preview)
        </h2>
        <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-96 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          {JSON.stringify(dict, null, 2)}
        </pre>
      </div>
    </>
  );
}
