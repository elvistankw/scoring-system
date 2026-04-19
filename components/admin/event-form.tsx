'use client';

// Event Form Component
// For creating and editing events

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import type { Event } from '@/interface/event';

interface EventFormProps {
  event?: Event | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    poster_url: '',
    background_video_url: '',
    description: '',
    start_date: '',
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        poster_url: event.poster_url || '',
        background_video_url: event.background_video_url || '',
        description: event.description || '',
        start_date: event.start_date ? event.start_date.split('T')[0] : '',
        end_date: event.end_date ? event.end_date.split('T')[0] : '',
      });
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('请输入活动名称 / Please enter event name');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录 / Please login first');
        return;
      }

      const url = event 
        ? `${API_ENDPOINTS.events.update(event.id)}`
        : API_ENDPOINTS.events.create;

      const method = event ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '操作失败 / Operation failed');
      }

      const result = await response.json();
      console.log('✅ Event saved:', result);

      toast.success(event ? '活动更新成功 / Event updated' : '活动创建成功 / Event created');
      onSuccess();
    } catch (error) {
      console.error('❌ Error saving event:', error);
      toast.error(error instanceof Error ? error.message : '保存失败 / Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          活动名称 / Event Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="例如：2025 华东区扯铃比赛"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          活动描述 / Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="活动简介..."
        />
      </div>

      {/* Poster URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          海报 URL / Poster URL
        </label>
        <input
          type="url"
          name="poster_url"
          value={formData.poster_url}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="https://example.com/poster.jpg"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          用于评委登录页面显示 / Used for judge landing page
        </p>
      </div>

      {/* Background Video URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          背景视频 URL / Background Video URL
        </label>
        <input
          type="url"
          name="background_video_url"
          value={formData.background_video_url}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="https://example.com/video.mp4"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          用于评委登录页面背景 / Used for judge landing page background
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            开始日期 / Start Date
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            结束日期 / End Date
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isSubmitting ? '保存中... / Saving...' : event ? '更新 / Update' : '创建 / Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
        >
          取消 / Cancel
        </button>
      </div>
    </form>
  );
}
