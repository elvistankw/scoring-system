import type { Metadata } from 'next';
import { JudgeLandingClient } from '@/components/judge/judge-landing-client';

export const metadata: Metadata = {
  title: '评审入口 | Judge Entry - Scoring System',
  description: '评审员登录后的欢迎页面，点击开始进入评分系统',
};

interface JudgeLandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function JudgeLandingPage({ params }: JudgeLandingPageProps) {
  const { locale } = await params;
  return <JudgeLandingClient locale={locale} />;
}