'use client';

import { useState } from 'react';
import { DiaboloLoading, DiaboloLoadingInline } from '@/components/shared/diabolo-loading';
import { GlassCard } from '@/components/shared/animated-card';
import { Particles } from '@/components/shared/animated-background';

export function LoadingDemoClient() {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const [customMessage, setCustomMessage] = useState('加载中...');

  const messages = [
    '加载评分页面...',
    '加载评审面板...',
    '加载成绩汇总...',
    '加载管理面板...',
    '加载选手管理...',
    '加载比赛详情...',
    '加载实时比分...',
    '加载排行榜...',
    '验证邮箱中...',
    '处理数据中...',
  ];

  return (
    <Particles>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🪀 空竹加载动画演示
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Diabolo Loading Animation Demo
            </p>
          </div>

          {/* Full Screen Demo */}
          <GlassCard>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              全屏加载动画
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              点击按钮查看全屏加载效果（3秒后自动关闭）
            </p>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {messages.map((msg) => (
                  <button
                    key={msg}
                    onClick={() => {
                      setCustomMessage(msg);
                      setShowFullScreen(true);
                      setTimeout(() => setShowFullScreen(false), 3000);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Inline Demo */}
          <GlassCard>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              内联加载动画
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              在组件内部显示的加载动画
            </p>
            
            <button
              onClick={() => setShowInline(!showInline)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mb-4"
            >
              {showInline ? '隐藏' : '显示'} 内联动画
            </button>

            {showInline && (
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <DiaboloLoadingInline message="内联加载示例..." />
              </div>
            )}
          </GlassCard>

          {/* Animation Details */}
          <GlassCard>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              动画详情
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  动画元素
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>🎯 旋转的空竹核心（橙色，720°/秒）</li>
                  <li>🎾 上下弹跳效果（8px振幅）</li>
                  <li>🎪 左右控制棒摆动（±10°）</li>
                  <li>🧵 连接细绳（脉冲效果）</li>
                  <li>🌫️ 玻璃态背景（模糊效果）</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  技术特点
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>✅ GPU 硬件加速</li>
                  <li>✅ 60fps 流畅动画</li>
                  <li>✅ 低 CPU 占用</li>
                  <li>✅ 响应式设计</li>
                  <li>✅ 支持深色模式</li>
                </ul>
              </div>
            </div>
          </GlassCard>

          {/* Usage Example */}
          <GlassCard>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              使用示例
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  全屏加载
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
{`import { DiaboloLoading } from '@/components/shared/diabolo-loading';

export default function MyPage() {
  return <DiaboloLoading message="加载中..." />;
}`}
                  </code>
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  内联加载
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
{`import { DiaboloLoadingInline } from '@/components/shared/diabolo-loading';

export default function MyComponent() {
  if (loading) {
    return <DiaboloLoadingInline message="处理中..." />;
  }
  return <div>内容</div>;
}`}
                  </code>
                </pre>
              </div>
            </div>
          </GlassCard>

          {/* Applied Pages */}
          <GlassCard>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              已应用页面
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  评审端
                </h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                  <li>✅ 评审面板</li>
                  <li>✅ 评分页面</li>
                  <li>✅ 成绩汇总</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  管理端
                </h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                  <li>✅ 管理面板</li>
                  <li>✅ 选手管理</li>
                  <li>✅ 比赛详情</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  展示端
                </h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                  <li>✅ 实时比分</li>
                  <li>✅ 排行榜</li>
                  <li>✅ 认证页面</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Full Screen Loading Overlay */}
      {showFullScreen && <DiaboloLoading message={customMessage} />}
    </Particles>
  );
}
