import type { Metadata } from 'next';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: '管理端 | Scoring System',
  description: '比赛管理与选手录入',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
