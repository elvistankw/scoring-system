'use client';

// Event List Component
// Displays all events with actions

import { useState } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import type { Event } from '@/interface/event';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onRefresh: () => void;
}

export function EventList({ events, onEdit, onRefresh }: EventListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const handleDelete = async (event: Event) => {
    if (!confirm(`确定要删除活动 "${event.name}" 吗？\nAre you sure you want to delete event "${event.name}"?`)) {
      return;
    }

    setDeletingId(event.id);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录 / Please login first');
        return;
      }

      const response = await fetch(API_ENDPOINTS.events.delete(event.id), {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '删除失败 / Delete failed');
      }

      toast.success('活动已删除 / Event deleted');
      onRefresh();
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      toast.error(error instanceof Error ? error.message : '删除失败 / Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleActivate = async (event: Event) => {
    setActivatingId(event.id);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录 / Please login first');
        return;
      }

      const response = await fetch(API_ENDPOINTS.events.activate(event.id), {
        method: 'POST',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '激活失败 / Activation failed');
      }

      toast.success('活动已激活 / Event activated');
      onRefresh();
    } catch (error) {
      console.error('❌ Error activating event:', error);
      toast.error(error instanceof Error ? error.message : '激活失败 / Activation failed');
    } finally {
      setActivatingId(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          暂无活动 / No Events
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          点击上方按钮创建第一个活动 / Click the button above to create your first event
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            {/* Event Info */}
            <div className="flex items-center gap-4 flex-1">
              {/* Poster Preview */}
              {event.poster_url ? (
                <img
                  src={event.poster_url}
                  alt={event.name}
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/default-event-poster.jpg';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Event Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                  {event.status === 'active' && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      激活中 / Active
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {event.start_date && (
                    <span>
                      开始: {new Date(event.start_date).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                  {event.end_date && (
                    <span>
                      结束: {new Date(event.end_date).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                  {event.background_video_url && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      视频背景 / Video
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {/* Activate Button */}
              {event.status !== 'active' && (
                <button
                  onClick={() => handleActivate(event)}
                  disabled={activatingId === event.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                  title="激活此活动 / Activate this event"
                >
                  {activatingId === event.id ? '...' : '激活 / Activate'}
                </button>
              )}

              {/* Edit Button */}
              <button
                onClick={() => onEdit(event)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="编辑 / Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(event)}
                disabled={deletingId === event.id}
                className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="删除 / Delete"
              >
                {deletingId === event.id ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
