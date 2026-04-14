import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { FontTestClient } from './font-test-client';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: 'Font Test | 字体测试',
  description: 'Font rendering test for Chinese and English',
};

export default async function FontTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            字体测试 / Font Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            测试中英文字体渲染效果 / Testing Chinese and English font rendering
          </p>
        </div>

        {/* Server Component Test */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            服务端组件测试 / Server Component Test
          </h2>
          
          <div className="space-y-4">
            {/* Chinese Text */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                中文字体测试
              </h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p className="text-sm">小号文字：评分系统支持多种比赛类型的专业评分平台</p>
                <p className="text-base">正常文字：实时比赛评分系统，支持多种赛事类型的实时评分与展示</p>
                <p className="text-lg">大号文字：欢迎使用评分系统，这是一个专业的比赛评分平台</p>
                <p className="text-xl font-semibold">加粗文字：管理员控制台 - 比赛管理 - 选手管理</p>
              </div>
            </div>

            {/* English Text */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                English Font Test
              </h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p className="text-sm">Small text: Real-time scoring system for various competition types</p>
                <p className="text-base">Normal text: Professional scoring platform supporting multiple event types</p>
                <p className="text-lg">Large text: Welcome to the Scoring System, a professional competition platform</p>
                <p className="text-xl font-semibold">Bold text: Admin Dashboard - Competition Management - Athlete Management</p>
              </div>
            </div>

            {/* Mixed Text */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                中英文混合 / Mixed Text
              </h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p>评分系统 Scoring System - 实时评分 Real-time Scoring</p>
                <p>管理员 Admin - 评审 Judge - 选手 Athlete - 比赛 Competition</p>
                <p>登录 Sign In - 注册 Sign Up - 设置 Settings - 退出 Logout</p>
              </div>
            </div>

            {/* Numbers and Special Characters */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                数字和特殊字符 / Numbers & Special Characters
              </h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p className="font-mono">数字: 0123456789 | Numbers: 0123456789</p>
                <p className="font-mono">分数: 28.5 分 | Score: 28.5 points</p>
                <p>特殊字符: ！@#￥%……&*（）—— | Special: !@#$%^&*()-_=+</p>
                <p>标点符号: 。，；：？！""''【】《》 | Punctuation: .,;:?!&quot;&apos;[]&lt;&gt;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Component Test */}
        <FontTestClient locale={locale} />
      </div>
    </div>
  );
}