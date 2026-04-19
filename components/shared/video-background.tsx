'use client';

// 🎥 Video Background Component
// 视频背景组件 - 用于评审端界面

import { ReactNode, useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  children: ReactNode;
  videoSrc?: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function VideoBackground({ 
  children, 
  videoSrc = '/judge-background.mp4',
  className = '',
  overlay = true,
  overlayOpacity = 0.3
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // 确保视频静音并自动播放
      video.muted = true;
      video.playsInline = true;
      
      // 尝试播放视频
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Video autoplay failed:', error);
        });
      }
    }
  }, []);

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* 视频背景层 */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
          {/* 视频加载失败时的后备背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" />
        </video>
        
        {/* 视频遮罩层 - 提高文字可读性 */}
        {overlay && (
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        )}
        
        {/* 渐变遮罩 - 增强视觉效果 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      </div>
      
      {/* 内容层 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// 预设组件 - 评审端专用
export function JudgeVideoBackground({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <VideoBackground 
      videoSrc="/judge-background.mp4"
      overlay={true}
      overlayOpacity={0.4}
      className={className}
    >
      {children}
    </VideoBackground>
  );
}