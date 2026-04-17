// Competition form component for creating and editing competitions
// Requirements: 2.1, 2.2, 8.1, 8.2, 14.1, 14.2, 16.1

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { 
  Competition, 
  CreateCompetitionRequest,
  CompetitionType,
  CompetitionStatus 
} from '@/interface/competition';
import { createCompetition, updateCompetition } from '@/hooks/use-competitions';
import { useTranslation } from '@/i18n/use-dictionary';

interface CompetitionFormProps {
  competition?: Competition | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CompetitionForm({ competition, onSuccess, onCancel }: CompetitionFormProps) {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCompetitionRequest & { status?: CompetitionStatus }>({
    name: '',
    competition_type: 'individual',
    region: '',
    division: '', // Required field
    start_date: '',
    end_date: '',
    // 注意：创建新比赛时不设置 status，让后端自动判断
  });

  // Populate form when editing
  useEffect(() => {
    if (competition) {
      setFormData({
        name: competition.name,
        competition_type: competition.competition_type,
        region: competition.region,
        division: competition.division || '', // 确保不是 null 或 undefined
        start_date: competition.start_date.split('T')[0],
        end_date: competition.end_date.split('T')[0],
        status: competition.status,
      });
    }
  }, [competition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error(t('competition.enterCompetitionName'));
      return;
    }
    
    if (!formData.region.trim()) {
      toast.error(t('competition.enterRegion'));
      return;
    }
    
    if (!formData.division.trim()) {
      toast.error(t('competition.enterDivision') || '请输入组别');
      return;
    }
    
    if (!formData.start_date || !formData.end_date) {
      toast.error(t('competition.selectDate'));
      return;
    }
    
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error(t('competition.startDateAfterEnd'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (competition) {
        // Update existing competition - include status
        await updateCompetition(competition.id, formData);
        toast.success(t('competition.competitionUpdated'));
      } else {
        // Create new competition - exclude status to let backend auto-determine
        const { status, ...createData } = formData;
        await createCompetition(createData);
        toast.success(t('competition.competitionAdded'));
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('notification.error');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('competition.competitionName')} *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder={t('competition.competitionNameExample')}
          required
        />
      </div>

      <div>
        <label htmlFor="competition_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('competition.competitionType')} *
        </label>
        <select
          id="competition_type"
          name="competition_type"
          value={formData.competition_type}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          required
        >
          <option value="individual">{t('competition.individualType')}</option>
          <option value="duo">{t('competition.duoType')}</option>
          <option value="team">{t('competition.teamType')}</option>
          <option value="challenge">{t('competition.challengeType')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('competition.region')} *
        </label>
        <input
          type="text"
          id="region"
          name="region"
          value={formData.region}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder={t('competition.regionExample')}
          required
        />
      </div>

      <div>
        <label htmlFor="division" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('competition.division') || '组别'} *
        </label>
        <select
          id="division"
          name="division"
          value={formData.division || ''} // 确保不是 null 或 undefined
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          required
        >
          <option value="">{t('competition.selectDivision') || '请选择组别'}</option>
          <option value="小学组">{t('competition.primaryDivision') || '小学组'}</option>
          <option value="公开组">{t('competition.openDivision') || '公开组（中学组）'}</option>
        </select>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('competition.divisionHelp') || '小学组或公开组（中学组）'}
        </p>
      </div>

      {competition && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('competition.status')}
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="upcoming">{t('competition.upcomingStatus')}</option>
            <option value="active">{t('competition.activeStatus')}</option>
            <option value="completed">{t('competition.completedStatus')}</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('competition.startDate')} *
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('competition.endDate')} *
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('judge.submitting') : competition ? t('competition.updateCompetition') : t('competition.createCompetition')}
        </button>
      </div>
    </form>
  );
}
