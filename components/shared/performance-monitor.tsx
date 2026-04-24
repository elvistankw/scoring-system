'use client';

/**
 * Performance Monitor Component
 * 性能监控组件 - 自动检测和报告性能问题
 */

import { useEffect, useRef, useState } from 'react';

interface PerformanceIssue {
  type: 'render' | 'memory' | 'network' | 'error';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  onIssueDetected?: (issue: PerformanceIssue) => void;
}

export function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  showOverlay = true,
  onIssueDetected 
}: PerformanceMonitorProps) {
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const renderCount = useRef<number>(0);
  const lastRenderTime = useRef<number>(Date.now());
  const memoryCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // 检测频繁渲染
    if (timeSinceLastRender < 16 && renderCount.current > 10) {
      const issue: PerformanceIssue = {
        type: 'render',
        severity: 'high',
        message: `组件渲染过于频繁 (${timeSinceLastRender}ms 间隔)`,
        timestamp: now
      };
      addIssue(issue);
    }

    // 检测渲染次数过多
    if (renderCount.current > 100) {
      const issue: PerformanceIssue = {
        type: 'render',
        severity: 'medium',
        message: `组件已渲染 ${renderCount.current} 次`,
        timestamp: now
      };
      addIssue(issue);
    }
  });

  useEffect(() => {
    if (!enabled) return;

    // 监控内存使用
    if ('memory' in performance) {
      memoryCheckInterval.current = setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const percentage = (usedMB / totalMB) * 100;

        if (percentage > 90) {
          const issue: PerformanceIssue = {
            type: 'memory',
            severity: 'high',
            message: `内存使用率过高: ${percentage.toFixed(1)}% (${usedMB.toFixed(1)}MB / ${totalMB.toFixed(1)}MB)`,
            timestamp: Date.now()
          };
          addIssue(issue);
        }
      }, 5000);
    }

    // 监控长任务
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              const issue: PerformanceIssue = {
                type: 'render',
                severity: entry.duration > 100 ? 'high' : 'medium',
                message: `检测到长任务: ${entry.name} (${entry.duration.toFixed(0)}ms)`,
                timestamp: Date.now()
              };
              addIssue(issue);
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        return () => observer.disconnect();
      } catch (error) {
        console.warn('PerformanceObserver not supported for longtask');
      }
    }

    // 监控网络请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        if (duration > 3000) {
          const issue: PerformanceIssue = {
            type: 'network',
            severity: duration > 5000 ? 'high' : 'medium',
            message: `慢速网络请求: ${args[0]} (${duration}ms)`,
            timestamp: Date.now()
          };
          addIssue(issue);
        }

        return response;
      } catch (error) {
        const issue: PerformanceIssue = {
          type: 'network',
          severity: 'high',
          message: `网络请求失败: ${args[0]}`,
          timestamp: Date.now()
        };
        addIssue(issue);
        throw error;
      }
    };

    // 监控错误
    const handleError = (event: ErrorEvent) => {
      const issue: PerformanceIssue = {
        type: 'error',
        severity: 'high',
        message: `JavaScript 错误: ${event.message}`,
        timestamp: Date.now()
      };
      addIssue(issue);
    };

    window.addEventListener('error', handleError);

    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
      window.fetch = originalFetch;
      window.removeEventListener('error', handleError);
    };
  }, [enabled]);

  const addIssue = (issue: PerformanceIssue) => {
    setIssues(prev => {
      // 避免重复的问题
      const isDuplicate = prev.some(
        i => i.type === issue.type && 
             i.message === issue.message && 
             Date.now() - i.timestamp < 5000
      );
      
      if (isDuplicate) return prev;

      const newIssues = [...prev, issue];
      // 只保留最近 20 个问题
      if (newIssues.length > 20) {
        newIssues.shift();
      }

      if (onIssueDetected) {
        onIssueDetected(issue);
      }

      return newIssues;
    });
  };

  const clearIssues = () => {
    setIssues([]);
    renderCount.current = 0;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'render': return '🔄';
      case 'memory': return '💾';
      case 'network': return '🌐';
      case 'error': return '❌';
      default: return '⚠️';
    }
  };

  if (!enabled || !showOverlay) return null;

  const highSeverityCount = issues.filter(i => i.severity === 'high').length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 折叠按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          px-4 py-2 rounded-lg shadow-lg font-mono text-sm
          ${highSeverityCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-white'}
          hover:opacity-90 transition-opacity
        `}
      >
        {highSeverityCount > 0 && (
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-ping" />
        )}
        性能监控 ({issues.length})
      </button>

      {/* 展开的面板 */}
      {isExpanded && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 overflow-y-auto bg-gray-900 text-white rounded-lg shadow-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">性能问题</h3>
            <button
              onClick={clearIssues}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            >
              清除
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              ✅ 未检测到性能问题
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded p-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getTypeIcon(issue.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityColor(issue.severity)}`} />
                        <span className="text-xs text-gray-400">
                          {new Date(issue.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-200">{issue.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
            <p>渲染次数: {renderCount.current}</p>
            <p className="mt-1">
              提示: 查看 PAGE_FREEZE_AUTO_FIX_GUIDE.md 了解如何修复
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
