// Display layout with dark theme optimization
// Requirements: 11.1, 11.4, 12.1, 12.2

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '实时比分大屏幕 | Scoring System',
  description: '实时展示各赛区选手的最新得分情况',
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-gray-900 flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      {/* No footer for display pages - full screen experience */}
    </div>
  );
}
