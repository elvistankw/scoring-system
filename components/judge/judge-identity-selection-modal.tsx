// Judge Identity Selection Modal - Device-based judge selection
// Requirements: Show available judges, handle device locking, visual status indicators

'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n/use-dictionary';
import { BilingualText } from '@/components/shared/bilingual-text';
import { DiaboloSpinner } from '@/components/shared/diabolo-spinner';
import type { AvailableJudge } from '@/interface/judge';
import { toast } from 'sonner';

interface JudgeIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  judges: AvailableJudge[];
  onJudgeSelect: (judgeId: number) => Promise<void>;
  loading?: boolean;
}

export function JudgeIdentityModal({
  isOpen,
  onClose,
  judges,
  onJudgeSelect,
  loading = false
}: JudgeIdentityModalProps) {
  const { t } = useTranslation();
  const [selecting, setSelecting] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleJudgeSelect = async (judge: AvailableJudge) => {
    if (!judge.is_available) {
      toast.error('该评委身份已被其他设备使用');
      return;
    }

    try {
      setSelecting(judge.id);
      await onJudgeSelect(judge.id);
    } catch (error) {
      console.error('Judge selection error:', error);
    } finally {
      setSelecting(null);
    }
  };

  const availableJudges = judges.filter(j => j.is_available);
  const unavailableJudges = judges.filter(j => !j.is_available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              <BilingualText zh="选择评委身份" en="Select Judge Identity" />
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              disabled={selecting !== null}
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            <BilingualText 
              zh="请选择您的评委身份开始评分。每个身份只能在一台设备上使用。" 
              en="Please select your judge identity to start scoring. Each identity can only be used on one device." 
            />
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-12">
              <DiaboloSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                <BilingualText zh="加载评委列表..." en="Loading judges..." />
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Available Judges */}
              {availableJudges.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <BilingualText zh="可用评委" en="Available Judges" />
                    <span className="text-sm text-gray-500">({availableJudges.length})</span>
                  </h3>
                  <div className="grid gap-3">
                    {availableJudges.map((judge) => (
                      <button
                        key={judge.id}
                        onClick={() => handleJudgeSelect(judge)}
                        disabled={selecting !== null}
                        className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                              {judge.display_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t('judge.code')}: {judge.code}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {selecting === judge.id ? (
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                                <span className="text-sm">
                                  <BilingualText zh="选择中..." en="Selecting..." />
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                  <BilingualText zh="可选" en="Available" />
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unavailable Judges */}
              {unavailableJudges.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <BilingualText zh="已被使用" en="In Use" />
                    <span className="text-sm text-gray-500">({unavailableJudges.length})</span>
                  </h3>
                  <div className="grid gap-3">
                    {unavailableJudges.map((judge) => (
                      <div
                        key={judge.id}
                        className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
                              {judge.display_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t('judge.code')}: {judge.code}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                              <BilingualText zh="已被使用" en="In Use" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Judges Available */}
              {judges.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    <BilingualText zh="暂无评委身份" en="No Judge Identities" />
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    <BilingualText 
                      zh="请联系管理员添加评委身份" 
                      en="Please contact administrator to add judge identities" 
                    />
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <BilingualText 
              zh="提示：每个评委身份只能在一台设备上使用" 
              en="Note: Each judge identity can only be used on one device" 
            />
          </div>
          <button
            onClick={onClose}
            disabled={selecting !== null}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <BilingualText zh="取消" en="Cancel" />
          </button>
        </div>
      </div>
    </div>
  );
}