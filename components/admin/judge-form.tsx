'use client';

// Judge Form Component
// Requirements: Judge Identity System

import { useState, useEffect } from 'react';
import { Judge, JudgeCreateRequest, JudgeUpdateRequest } from '@/interface/judge';
import { BilingualText } from '@/components/shared/bilingual-text';
import { useTranslation } from '@/i18n/use-dictionary';

interface JudgeFormProps {
  judge?: Judge | null;
  onSubmit: (data: JudgeCreateRequest | JudgeUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function JudgeForm({ judge, onSubmit, onCancel, isSubmitting = false }: JudgeFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    code: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when judge prop changes
  useEffect(() => {
    if (judge) {
      setFormData({
        name: judge.name || '',
        display_name: judge.display_name || '',
        code: judge.code || '',
        is_active: judge.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        display_name: '',
        code: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [judge]);

  // Validate judge name
  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return '评审名字至少需要2个字符 / Name must be at least 2 characters';
    }
    if (trimmed.length > 50) {
      return '评审名字不能超过50个字符 / Name must not exceed 50 characters';
    }
    // Check for HTML tags
    if (/<[^>]*>/g.test(trimmed)) {
      return '评审名字不能包含HTML标签 / Name cannot contain HTML tags';
    }
    // Only letters, numbers, spaces, hyphens, apostrophes, periods
    if (!/^[\p{L}\p{N}\s\-'.]+$/u.test(trimmed)) {
      return '评审名字包含无效字符 / Name contains invalid characters';
    }
    return null;
  };

  // Validate display name
  const validateDisplayName = (displayName: string): string | null => {
    if (!displayName.trim()) return null; // Optional field
    
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      return '显示名字至少需要2个字符 / Display name must be at least 2 characters';
    }
    if (trimmed.length > 50) {
      return '显示名字不能超过50个字符 / Display name must not exceed 50 characters';
    }
    // Check for HTML tags
    if (/<[^>]*>/g.test(trimmed)) {
      return '显示名字不能包含HTML标签 / Display name cannot contain HTML tags';
    }
    // Only letters, numbers, spaces, hyphens, apostrophes, periods
    if (!/^[\p{L}\p{N}\s\-'.]+$/u.test(trimmed)) {
      return '显示名字包含无效字符 / Display name contains invalid characters';
    }
    return null;
  };

  // Validate judge code
  const validateCode = (code: string): string | null => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 2) {
      return '评审代码至少需要2个字符 / Code must be at least 2 characters';
    }
    if (trimmed.length > 20) {
      return '评审代码不能超过20个字符 / Code must not exceed 20 characters';
    }
    // Must start with a letter
    if (!/^[A-Z]/.test(trimmed)) {
      return '评审代码必须以字母开头 / Code must start with a letter';
    }
    // Only uppercase letters, numbers, and hyphens
    if (!/^[A-Z][A-Z0-9\-]*$/.test(trimmed)) {
      return '评审代码只能包含大写字母、数字和连字符 / Code can only contain uppercase letters, numbers, and hyphens';
    }
    // No consecutive hyphens
    if (/--/.test(trimmed)) {
      return '评审代码不能包含连续的连字符 / Code cannot contain consecutive hyphens';
    }
    // Cannot end with hyphen
    if (trimmed.endsWith('-')) {
      return '评审代码不能以连字符结尾 / Code cannot end with a hyphen';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const displayNameError = validateDisplayName(formData.display_name);
    if (displayNameError) newErrors.display_name = displayNameError;
    
    if (!judge) {
      const codeError = validateCode(formData.code);
      if (codeError) newErrors.code = codeError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      display_name: formData.display_name.trim() || undefined,
      code: formData.code.trim().toUpperCase(),
      ...(judge && { is_active: formData.is_active }),
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            <BilingualText 
              translationKey={judge ? 'judge.editJudge' : 'judge.addJudge'}
              chineseSize="text-lg" 
              englishSize="text-base"
              layout="vertical"
            />
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Judge Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BilingualText 
                translationKey="judge.judgeName"
                chineseSize="text-sm" 
                englishSize="text-xs"
              /> *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('judge.judgeNamePlaceholder')}
              className={`w-full px-3 py-2 border rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-500 dark:placeholder-gray-400
                       ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              disabled={isSubmitting}
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BilingualText 
                translationKey="judge.displayName"
                chineseSize="text-sm" 
                englishSize="text-xs"
              />
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              placeholder={t('judge.displayNamePlaceholder')}
              className={`w-full px-3 py-2 border rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-500 dark:placeholder-gray-400
                       ${errors.display_name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              disabled={isSubmitting}
              maxLength={50}
            />
            {errors.display_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.display_name}</p>
            )}
          </div>

          {/* Judge Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BilingualText 
                translationKey="judge.judgeCode"
                chineseSize="text-sm" 
                englishSize="text-xs"
              /> *
            </label>
            {judge ? (
              // Show code as read-only for editing
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                {judge.code}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder={t('judge.judgeCodePlaceholder')}
                  className={`w-full px-3 py-2 border rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-500 dark:placeholder-gray-400
                           ${errors.code ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  required
                  disabled={isSubmitting}
                  maxLength={20}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  格式: J001, JUDGE-01 等 / Format: J001, JUDGE-01, etc.
                </p>
              </>
            )}
          </div>

          {/* Active Status (only for edit) */}
          {judge && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                           focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
                           focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <BilingualText 
                    translationKey="judge.isActive"
                    chineseSize="text-sm" 
                    englishSize="text-xs"
                  />
                </span>
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 
                       hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BilingualText 
                translationKey="common.cancel"
                chineseSize="text-sm" 
                englishSize="text-xs"
              />
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || (!judge && !formData.code.trim())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <BilingualText 
                translationKey={
                  isSubmitting 
                    ? 'judge.submitting' 
                    : judge 
                      ? 'judge.updateJudge' 
                      : 'judge.createJudge'
                }
                chineseSize="text-sm" 
                englishSize="text-xs"
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}