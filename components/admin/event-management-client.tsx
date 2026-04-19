'use client';

// Event Management Client Component
// Requirements: Admin Dashboard, Event Management

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useEvents } from '@/hooks/use-events';
import { useTranslation } from '@/i18n/use-dictionary';
import { BackButton } from '@/components/shared/back-button';
import { EventForm } from '@/components/admin/event-form';
import { EventList } from '@/components/admin/event-list';
import type { Event } from '@/interface/event';
import type { Locale } from '@/i18n/config';

interface EventManagementClientProps {
  locale: Locale;
}

export function EventManagementClient({ locale }: EventManagementClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { events, isLoading, mutate } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateNew = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEvent(null);
    mutate(); // Refresh the events list
    toast.success(editingEvent ? '活动更新成功' : '活动创建成功');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleGoBack = () => {
    const segments = pathname.split('/');
    const localeSegment = segments[1] || 'zh';
    router.push(`/${localeSegment}/admin-dashboard`);
  };

  // Show loading state during SSR and initial client load
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton 
                onClick={handleGoBack}
                label={t('common.back')}
              />
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('admin.eventManagement')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  管理活动海报和背景视频 / Manage event posters and background videos
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建活动 / Create Event
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {editingEvent ? '编辑活动 / Edit Event' : '创建活动 / Create Event'}
                </h2>
                <EventForm
                  event={editingEvent}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Event List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <EventList
            events={events}
            onEdit={handleEdit}
            onRefresh={mutate}
          />
        </div>
      </div>
    </div>
  );
}
