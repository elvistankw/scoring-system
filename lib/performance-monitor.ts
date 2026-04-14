// Performance monitoring utilities
// Requirements: 13.5

/**
 * Measure page load performance
 * Captures key metrics like FCP, LCP, FID, CLS
 */
export function measurePageLoad(pageName: string) {
  if (typeof window === 'undefined') return;

  // Wait for page to fully load
  if (document.readyState === 'complete') {
    captureMetrics(pageName);
  } else {
    window.addEventListener('load', () => captureMetrics(pageName));
  }
}

function captureMetrics(pageName: string) {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return;

    const metrics = {
      page: pageName,
      // DNS lookup time
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      // TCP connection time
      tcp: navigation.connectEnd - navigation.connectStart,
      // Time to first byte
      ttfb: navigation.responseStart - navigation.requestStart,
      // DOM content loaded
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      // Full page load time
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      // Total time from navigation start
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };

    // Log metrics (in production, send to analytics service)
    console.log(`[Performance] ${pageName}:`, metrics);

    // Store in sessionStorage for debugging
    const allMetrics = JSON.parse(sessionStorage.getItem('performance_metrics') || '[]');
    allMetrics.push({ timestamp: Date.now(), ...metrics });
    sessionStorage.setItem('performance_metrics', JSON.stringify(allMetrics));

    return metrics;
  } catch (error) {
    console.error('[Performance] Error capturing metrics:', error);
  }
}

/**
 * Measure component render time
 */
export function measureComponentRender(componentName: string, callback: () => void) {
  const startTime = performance.now();
  
  callback();
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  console.log(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
  
  return renderTime;
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`[Performance] API ${apiName}: ${duration.toFixed(2)}ms`);
    
    // Store API metrics
    const apiMetrics = JSON.parse(sessionStorage.getItem('api_metrics') || '[]');
    apiMetrics.push({
      timestamp: Date.now(),
      api: apiName,
      duration,
      success: true,
    });
    sessionStorage.setItem('api_metrics', JSON.stringify(apiMetrics));
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`[Performance] API ${apiName} failed after ${duration.toFixed(2)}ms:`, error);
    
    // Store failed API metrics
    const apiMetrics = JSON.parse(sessionStorage.getItem('api_metrics') || '[]');
    apiMetrics.push({
      timestamp: Date.now(),
      api: apiName,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    sessionStorage.setItem('api_metrics', JSON.stringify(apiMetrics));
    
    throw error;
  }
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  if (typeof window === 'undefined') return null;

  const pageMetrics = JSON.parse(sessionStorage.getItem('performance_metrics') || '[]');
  const apiMetrics = JSON.parse(sessionStorage.getItem('api_metrics') || '[]');

  return {
    pages: pageMetrics,
    apis: apiMetrics,
    summary: {
      totalPages: pageMetrics.length,
      totalApiCalls: apiMetrics.length,
      successfulApiCalls: apiMetrics.filter((m: any) => m.success).length,
      failedApiCalls: apiMetrics.filter((m: any) => !m.success).length,
      avgPageLoadTime: pageMetrics.length > 0
        ? pageMetrics.reduce((sum: number, m: any) => sum + m.totalTime, 0) / pageMetrics.length
        : 0,
      avgApiDuration: apiMetrics.length > 0
        ? apiMetrics.reduce((sum: number, m: any) => sum + m.duration, 0) / apiMetrics.length
        : 0,
    },
  };
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics() {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('performance_metrics');
  sessionStorage.removeItem('api_metrics');
  console.log('[Performance] Metrics cleared');
}

/**
 * React hook for measuring component mount time
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return;

  const mountTime = performance.now();

  return () => {
    const unmountTime = performance.now();
    const lifetime = unmountTime - mountTime;
    console.log(`[Performance] ${componentName} lifetime: ${lifetime.toFixed(2)}ms`);
  };
}
