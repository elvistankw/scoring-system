// Judge Landing Client - Device-based judge identity selection
// Requirements: No authentication required, device-based judge selection

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJudgeSession } from '@/hooks/use-judge-session';
import { useActiveEvent } from '@/hooks/use-events';
import { JudgeIdentityModal } from './judge-identity-selection-modal';
import { AnimatedButton } from '@/components/shared/animated-button';
import { DiaboloSpinner } from '@/components/shared/diabolo-spinner';
import { BilingualText } from '@/components/shared/bilingual-text';
import { toast } from 'sonner';
import Image from 'next/image';

interface JudgeLandingClientProps {
  locale: string;
}

export function JudgeLandingClient({ locale }: JudgeLandingClientProps) {
  const router = useRouter();
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  
  const {
    currentSession,
    loadingSession,
    availableJudges,
    loadingJudges,
    selectJudge,
    endSession,
    deviceId,
    deviceInfo
  } = useJudgeSession();

  // Get active event for background
  const { event, isLoading: loadingEvent } = useActiveEvent();

  // Auto-redirect if already has active session
  useEffect(() => {
    if (currentSession && !loadingSession) {
      console.log('✅ Active judge session found, redirecting to dashboard');
      router.push(`/${locale}/judge-dashboard`);
    }
  }, [currentSession, loadingSession, locale, router]);

  const handleStartJudging = () => {
    if (loadingJudges) {
      toast.info('正在加载评委列表，请稍候...');
      return;
    }

    if (availableJudges.length === 0) {
      toast.error('暂无可用的评委身份，请联系管理员');
      return;
    }

    setShowIdentityModal(true);
  };

  const handleJudgeSelected = async (judgeId: number) => {
    const success = await selectJudge(judgeId);
    if (success) {
      setShowIdentityModal(false);
      // Navigation will be handled by useEffect when currentSession updates
    }
  };

  const handleEndSession = async () => {
    const success = await endSession();
    if (success) {
      toast.success('已结束当前评委会话');
    }
  };

  // Show loading state
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <DiaboloSpinner size="lg" className="mx-auto mb-4 text-white" />
          <p className="text-xl">正在检查评委会话...</p>
        </div>
      </div>
    );
  }

  // Get poster URL from event or use default
  const posterUrl = event?.poster_url || '/default-event-poster.jpg';
  const eventName = event?.name || '扯铃比赛 / Diabolo Competition';
  const eventDescription = event?.description || '欢迎参加扯铃比赛评分 / Welcome to Diabolo Competition Judging';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background Image from Event */}
      <div className="absolute inset-0 z-0">
        <Image
          src={posterUrl}
          alt={eventName}
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Event Name */}
          {!loadingEvent && event && (
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white/90 drop-shadow-lg">
                {eventName}
              </h2>
              {eventDescription && (
                <p className="text-lg text-white/80 mt-2 drop-shadow">
                  {eventDescription}
                </p>
              )}
            </div>
          )}

          {/* Current Session Info */}
          {currentSession && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">
                <BilingualText zh="当前评委身份" en="Current Judge Identity" />
              </h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-200 mb-2">
                  {currentSession.judge_name}
                </div>
                <div className="text-blue-300 mb-4">
                  <BilingualText zh="评委代码" en="Judge Code" />: {currentSession.judge_code}
                </div>
                <div className="flex gap-4 justify-center">
                  <AnimatedButton
                    onClick={() => router.push(`/${locale}/judge-dashboard`)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <BilingualText zh="继续评分" en="Continue Scoring" />
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleEndSession}
                    variant="danger"
                    className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <BilingualText zh="结束会话" en="End Session" />
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}

          {/* Start Button - Main CTA */}
          {!currentSession && (
            <div className="space-y-6">
              <AnimatedButton
                onClick={handleStartJudging}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-16 py-6 text-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                disabled={loadingJudges}
              >
                {loadingJudges ? (
                  <div className="flex items-center gap-3">
                    <DiaboloSpinner size="sm" className="text-white" />
                    <BilingualText zh="加载中..." en="Loading..." />
                  </div>
                ) : (
                  <BilingualText zh="开始评分" en="Start Judging" />
                )}
              </AnimatedButton>

              {/* Available Judges Count */}
              {!loadingJudges && (
                <p className="text-blue-200 text-sm drop-shadow">
                  <BilingualText 
                    zh={`${availableJudges.filter(j => j.is_available).length} 个评委身份可用`}
                    en={`${availableJudges.filter(j => j.is_available).length} judge identities available`}
                  />
                </p>
              )}
            </div>
          )}

          {/* Device Info (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 bg-black/30 backdrop-blur-sm rounded-lg p-4 text-xs text-white/70">
              <details>
                <summary className="cursor-pointer mb-2">设备信息 (开发模式)</summary>
                <div className="text-left space-y-1">
                  <div>设备ID: {deviceId.substring(0, 8)}...</div>
                  <div>指纹: {deviceInfo.fingerprint}</div>
                  <div>屏幕: {deviceInfo.screen}</div>
                  <div>时区: {deviceInfo.timezone}</div>
                  {event && <div>活跃赛事: {event.name}</div>}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Judge Identity Selection Modal */}
      <JudgeIdentityModal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        judges={availableJudges}
        onJudgeSelect={handleJudgeSelected}
        loading={loadingJudges}
      />
    </div>
  );
}