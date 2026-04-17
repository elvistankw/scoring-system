// Athlete form component for creating and editing athletes
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Athlete, CreateAthleteRequest, UpdateAthleteRequest } from '@/interface/athlete';
import { createAthlete, updateAthlete } from '@/hooks/use-athletes';
import { useTranslation } from '@/i18n/use-dictionary';

interface AthleteFormProps {
  athlete?: Athlete | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AthleteForm({ athlete, onSuccess, onCancel }: AthleteFormProps) {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateAthleteRequest>({
    name: '',
    athlete_number: '',
    team_name: '',
    contact_email: '',
    contact_phone: '',
    age: 0,
    gender: '' as any,
    school: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (athlete) {
      setFormData({
        name: athlete.name,
        athlete_number: athlete.athlete_number,
        team_name: athlete.team_name || '',
        contact_email: athlete.contact_email || '',
        contact_phone: athlete.contact_phone || '',
        age: athlete.age,
        gender: athlete.gender,
        school: athlete.school || '',
      });
    }
  }, [athlete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (athlete) {
        // Update existing athlete
        await updateAthlete(athlete.id, formData as UpdateAthleteRequest);
        toast.success(t('athlete.athleteUpdated'));
      } else {
        // Create new athlete
        await createAthlete(formData);
        toast.success(t('athlete.athleteAdded'));
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('notification.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'age' ? parseInt(value) || 0 : value 
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.athleteName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder={t('athlete.athleteNamePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="athlete_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.athleteNumber')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="athlete_number"
          name="athlete_number"
          required
          value={formData.athlete_number}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder={t('athlete.athleteNumberExample')}
        />
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.age')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="age"
          name="age"
          required
          min="1"
          max="100"
          value={formData.age || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder={t('athlete.agePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.gender')} <span className="text-red-500">*</span>
        </label>
        <select
          id="gender"
          name="gender"
          required
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="">{t('athlete.selectGender')}</option>
          <option value="male">{t('athlete.male')}</option>
          <option value="female">{t('athlete.female')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="school" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.school')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="school"
          name="school"
          required
          maxLength={200}
          value={formData.school || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder={t('athlete.schoolPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="team_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.teamName')}
        </label>
        <input
          type="text"
          id="team_name"
          name="team_name"
          value={formData.team_name || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder={t('athlete.teamNamePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.contactEmail')}
        </label>
        <input
          type="email"
          id="contact_email"
          name="contact_email"
          value={formData.contact_email || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder="example@email.com"
        />
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('athlete.contactPhone')}
        </label>
        <input
          type="tel"
          id="contact_phone"
          name="contact_phone"
          value={formData.contact_phone || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          placeholder="13800138000"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isSubmitting ? t('judge.submitting') : athlete ? t('athlete.updateAthlete') : t('athlete.createAthlete')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
