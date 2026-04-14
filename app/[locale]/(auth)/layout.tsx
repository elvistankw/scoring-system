import type { Metadata } from 'next';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: '登录 | Scoring System',
  description: '用户登录与注册',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
