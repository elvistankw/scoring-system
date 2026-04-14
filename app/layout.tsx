// Root layout - required by Next.js
// This is the top-level layout that wraps all pages

import type { Metadata } from 'next';
import { useTranslation } from '@/i18n/use-dictionary';
import './globals.css';

export const metadata: Metadata = {
  title: '评分系统 | Scoring System',
  description: '实时评分系统 - 支持多种比赛类型的专业评分平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif !important;
            }
            body, html {
              font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif !important;
            }
          `
        }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('scoring-system-theme') || 'system';
                  var resolvedTheme = theme;
                  
                  if (theme === 'system') {
                    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(resolvedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
