import type { Metadata } from 'next';
import { UIDemoClient } from './ui-demo-client';

export const metadata: Metadata = {
  title: 'UI 组件演示 | Scoring System',
  description: '展示增强版UI组件和动画效果',
};

export default function UIDemoPage() {
  return <UIDemoClient />;
}
