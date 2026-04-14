import type { Metadata } from 'next';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: '评审端 | Scoring System',
  description: '评审打分界面',
};

export default function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
