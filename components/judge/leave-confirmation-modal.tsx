'use client';

import { BilingualText } from '@/components/shared/bilingual-text';

interface LeaveConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LeaveConfirmationModal({ isOpen, onConfirm, onCancel }: LeaveConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-3">
          <BilingualText 
            translationKey="judge.confirmLeave" 
            chineseSize="text-lg" 
            englishSize="text-base"
            layout="vertical"
          />
        </h3>

        {/* Message */}
        <div className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
          <BilingualText 
            translationKey="judge.unsavedScoresWarning" 
            chineseSize="text-sm" 
            englishSize="text-xs"
            layout="vertical"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm"
          >
            <BilingualText 
              translationKey="common.cancel" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors text-sm"
          >
            <BilingualText 
              translationKey="judge.leaveAnyway" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          </button>
        </div>
      </div>
    </div>
  );
}