// Authentication form component for login and registration
// Requirements: 1.1, 1.2, 14.1, 14.2, 14.3, 16.1

'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/use-dictionary';
import type { UserRole } from '@/interface/user';

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  role?: UserRole;
}

export function AuthForm({ mode, onSubmit, isLoading = false }: AuthFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    username: '',
    role: 'admin', // Only admin role allowed
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AuthFormData, string>> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.passwordMinLength');
    }

    // Username validation for sign-up
    if (mode === 'sign-up') {
      if (!formData.username) {
        newErrors.username = t('auth.usernameRequired');
      } else if (formData.username.length < 3) {
        newErrors.username = t('auth.usernameMinLength');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('auth.checkFormInput'));
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: keyof AuthFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'sign-up' && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            {t('auth.username')}
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-800 dark:text-white`}
            placeholder={t('auth.usernameRequired')}
            disabled={isLoading}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          {t('auth.email')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-800 dark:text-white`}
          placeholder={t('auth.emailRequired')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          {t('auth.password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-800 dark:text-white`}
          placeholder={t('auth.passwordMinLength')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      {mode === 'sign-up' && (
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-2">
            {t('auth.role')}
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value as UserRole)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
          >
            <option value="admin">{t('auth.admin')}</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('auth.adminOnlyRegistration')}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {t('auth.processing')}
          </span>
        ) : mode === 'sign-in' ? (
          t('auth.signIn')
        ) : (
          t('auth.signUp')
        )}
      </button>
    </form>
  );
}
