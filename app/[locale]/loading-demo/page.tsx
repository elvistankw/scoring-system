import type { Metadata } from 'next';
import { LoadingDemoClient } from './loading-demo-client';

export const metadata: Metadata = {
  title: '加载动画演示 | Scoring System',
  description: '展示空竹加载动画效果',
};

export default function LoadingDemoPage() {
  return <LoadingDemoClient />;
}
