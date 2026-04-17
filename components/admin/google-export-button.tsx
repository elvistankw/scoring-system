'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import { useGoogleAuth, useGoogleSheets } from '@/hooks/use-google-integration';
import { toast } from 'sonner';

interface GoogleExportButtonProps {
  competitionId: number;
  competitionName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function GoogleExportButton({
  competitionId,
  competitionName,
  variant = 'outline',
  size = 'default',
  className = ''
}: GoogleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { isAuthorized, authorize, isLoading: authLoading } = useGoogleAuth();
  const { exportToSheets } = useGoogleSheets();

  const handleExport = async () => {
    // 检查授权状态
    if (!isAuthorized) {
      toast.info('请先授权 Google 访问');
      authorize();
      return;
    }

    setIsExporting(true);
    try {
      await exportToSheets(competitionId);
    } catch (error) {
      // 错误已在 hook 中处理
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        检查授权...
      </Button>
    );
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          导出中...
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4" />
          导出到 Google Sheets
          {isAuthorized && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </>
      )}
    </Button>
  );
}
