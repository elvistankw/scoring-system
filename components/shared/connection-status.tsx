// Connection status indicator component
// Requirements: 2.1, 2.2, 18.1, 18.2, 18.3

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/use-dictionary';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const { t } = useTranslation();

  const [isOnline, setIsOnline] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Check backend health
  const checkBackendHealth = async () => {
    if (!mounted) return;
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        cache: 'no-cache',
      });
      
      const isHealthy = response.ok;
      
      if (isHealthy !== isBackendAvailable) {
        setIsBackendAvailable(isHealthy);
        
        if (isHealthy) {
          toast.success('服务器连接已恢复');
        } else {
          toast.error('服务器连接中断');
        }
      }
      
      setLastCheck(new Date());
    } catch (error) {
      if (isBackendAvailable) {
        setIsBackendAvailable(false);
        toast.error('服务器连接中断');
      }
      setLastCheck(new Date());
    }
  };

  // Initialize component after mount
  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
  }, []);

  // Monitor browser online/offline status
  useEffect(() => {
    if (!mounted) return;

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('网络连接已恢复');
      checkBackendHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('网络连接中断');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isBackendAvailable, mounted]);

  // Periodic backend health check
  useEffect(() => {
    if (!mounted) return;

    checkBackendHealth();
    
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isBackendAvailable, mounted]);

  // Don't render until mounted or if everything is working
  if (!mounted || (isOnline && isBackendAvailable)) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-sm font-medium">
            {!isOnline ? '网络连接中断' : '服务器连接中断'}
          </p>
          <p className="text-xs opacity-90">
            上次检查: {lastCheck.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={checkBackendHealth}
          className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}