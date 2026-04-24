'use client';

/**
 * Judge Competition Debug Component
 * Helps diagnose 404 errors when fetching judge competitions
 */

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api-config';

export function JudgeCompetitionDebug() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    try {
      // 1. Check API_BASE_URL
      diagnostics.checks.push({
        name: 'API_BASE_URL Configuration',
        status: 'info',
        value: API_BASE_URL,
        message: `Using API base URL: ${API_BASE_URL}`
      });

      // 2. Check localStorage token
      const token = localStorage.getItem('token');
      diagnostics.checks.push({
        name: 'Authentication Token',
        status: token ? 'success' : 'error',
        value: token ? `${token.substring(0, 20)}...` : 'Not found',
        message: token ? 'Token exists in localStorage' : 'No token found - please login'
      });

      if (!token) {
        setResults(diagnostics);
        setIsLoading(false);
        return;
      }

      // 3. Test backend connectivity
      try {
        const pingRes = await fetch(`${API_BASE_URL}/api/judges/available`);
        diagnostics.checks.push({
          name: 'Backend Server Connectivity',
          status: pingRes.ok ? 'success' : 'error',
          value: `Status: ${pingRes.status}`,
          message: pingRes.ok ? 'Backend server is reachable' : `Backend returned ${pingRes.status}`
        });
      } catch (error) {
        diagnostics.checks.push({
          name: 'Backend Server Connectivity',
          status: 'error',
          value: 'Connection failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // 4. Test judge competitions endpoint
      const testJudgeId = 1;
      const testUrl = `${API_BASE_URL}/api/judges/${testJudgeId}/competitions`;
      
      diagnostics.checks.push({
        name: 'Test URL',
        status: 'info',
        value: testUrl,
        message: 'This is the URL being tested'
      });

      try {
        const judgeCompRes = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const responseText = await judgeCompRes.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        diagnostics.checks.push({
          name: 'Judge Competitions Endpoint',
          status: judgeCompRes.ok ? 'success' : 'error',
          value: `Status: ${judgeCompRes.status}`,
          message: judgeCompRes.ok 
            ? `Successfully fetched competitions for judge ${testJudgeId}` 
            : `Failed with status ${judgeCompRes.status}`,
          response: responseData
        });

        // 5. Test all competitions endpoint
        const allCompsRes = await fetch(`${API_BASE_URL}/api/competitions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        diagnostics.checks.push({
          name: 'All Competitions Endpoint',
          status: allCompsRes.ok ? 'success' : 'error',
          value: `Status: ${allCompsRes.status}`,
          message: allCompsRes.ok 
            ? 'Successfully fetched all competitions' 
            : `Failed with status ${allCompsRes.status}`
        });

      } catch (error) {
        diagnostics.checks.push({
          name: 'Judge Competitions Endpoint',
          status: 'error',
          value: 'Request failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // 6. Check browser info
      diagnostics.checks.push({
        name: 'Browser Information',
        status: 'info',
        value: navigator.userAgent,
        message: 'User agent string'
      });

      // 7. Check environment
      diagnostics.checks.push({
        name: 'Environment',
        status: 'info',
        value: process.env.NODE_ENV || 'development',
        message: 'Current environment'
      });

    } catch (error) {
      diagnostics.checks.push({
        name: 'Diagnostic Error',
        status: 'error',
        value: 'Diagnostic failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setResults(diagnostics);
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Judge Competition API Diagnostics
      </h2>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        This tool helps diagnose 404 errors when fetching judge competitions.
      </p>

      <button
        onClick={runDiagnostics}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>

      {results && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Timestamp: {new Date(results.timestamp).toLocaleString()}
          </div>

          {results.checks.map((check: any, index: number) => (
            <div
              key={index}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start space-x-2">
                <span className="text-xl">{getStatusIcon(check.status)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {check.name}
                  </h3>
                  <p className={`text-sm mt-1 ${getStatusColor(check.status)}`}>
                    {check.message}
                  </p>
                  {check.value && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto">
                      {check.value}
                    </div>
                  )}
                  {check.response && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                        View Response
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(check.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Troubleshooting Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>If backend is not reachable, make sure it's running on port 5000</li>
              <li>If you get 401 errors, try logging out and logging back in</li>
              <li>If you get 404 errors, check that the backend routes are properly registered</li>
              <li>Try hard refreshing the page (Ctrl+Shift+R)</li>
              <li>Check browser Console and Network tabs for more details</li>
              <li>Verify .env.local has NEXT_PUBLIC_API_URL=http://localhost:5000</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
