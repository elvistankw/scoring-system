// Competition-athlete association management component
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2

'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import type { Athlete } from '@/interface/athlete';
import { useAthletes, addAthleteToCompetition, removeAthleteFromCompetition } from '@/hooks/use-athletes';
import { API_ENDPOINTS } from '@/lib/api-config';
import { AthleteForm } from './athlete-form';
import { useTranslation } from '@/i18n/use-dictionary';

interface CompetitionAthleteListProps {
  competitionId: number;
  onClose?: () => void;
}

export function CompetitionAthleteList({ competitionId, onClose }: CompetitionAthleteListProps) {
  const { t } = useTranslation();

  const [competitionAthletes, setCompetitionAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [showAthleteForm, setShowAthleteForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  
  // Filter states
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  
  const { athletes: allAthletes, refresh: refreshAthletes } = useAthletes();

  // Fetch athletes in this competition
  useEffect(() => {
    fetchCompetitionAthletes();
  }, [competitionId]);

  const fetchCompetitionAthletes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error(t('auth.pleaseLogin'));
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.competitions.athletes(competitionId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(t('common.loginExpired'));
          return;
        }
        throw new Error('Failed to fetch competition athletes');
      }

      const result = await response.json();
      setCompetitionAthletes(result.data?.athletes || []);
    } catch (error) {
      toast.error(t('athlete.loadAthletesFailed'));
      console.error('Fetch athletes error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAthlete = async () => {
    if (!selectedAthleteId) {
      toast.error(t('common.pleaseSelectAthlete'));
      return;
    }

    setIsAdding(true);
    try {
      await addAthleteToCompetition(competitionId, selectedAthleteId);
      toast.success(t('common.athleteAddedSuccess'));
      setSelectedAthleteId(null);
      await fetchCompetitionAthletes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.addFailed'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAthlete = async (athleteId: number) => {
    if (!confirm(t('common.confirmRemoveAthlete'))) {
      return;
    }

    setRemovingId(athleteId);
    try {
      await removeAthleteFromCompetition(competitionId, athleteId);
      toast.success(t('common.athleteRemovedSuccess'));
      await fetchCompetitionAthletes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.removeFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateAthlete = () => {
    setEditingAthlete(null);
    setShowAthleteForm(true);
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setShowAthleteForm(true);
  };

  const handleAthleteFormSuccess = async () => {
    setShowAthleteForm(false);
    setEditingAthlete(null);
    await refreshAthletes();
    await fetchCompetitionAthletes();
    toast.success(editingAthlete ? t('athlete.athleteUpdated') : t('athlete.athleteAdded'));
  };

  const handleAthleteFormCancel = () => {
    setShowAthleteForm(false);
    setEditingAthlete(null);
  };

  // Filter out athletes already in competition
  const availableAthletes = allAthletes.filter(
    (athlete: Athlete) => !competitionAthletes.some((ca: Athlete) => ca.id === athlete.id)
  );

  // Apply filters to competition athletes
  const filteredCompetitionAthletes = useMemo(() => {
    return competitionAthletes.filter((athlete: Athlete) => {
      // Gender filter
      if (filterGender !== 'all' && athlete.gender !== filterGender) {
        return false;
      }
      
      // Age filter (12岁以上 or 12岁以下)
      if (filterAge !== 'all') {
        if (filterAge === 'above12' && athlete.age && athlete.age <= 12) {
          return false;
        }
        if (filterAge === 'below12' && athlete.age && athlete.age > 12) {
          return false;
        }
      }
      
      // School filter
      if (filterSchool !== 'all' && athlete.school !== filterSchool) {
        return false;
      }
      
      return true;
    });
  }, [competitionAthletes, filterGender, filterAge, filterSchool]);

  // Apply filters to available athletes (for the add athlete dropdown)
  const filteredAvailableAthletes = useMemo(() => {
    return availableAthletes.filter((athlete: Athlete) => {
      // Gender filter
      if (filterGender !== 'all' && athlete.gender !== filterGender) {
        return false;
      }
      
      // Age filter (12岁以上 or 12岁以下)
      if (filterAge !== 'all') {
        if (filterAge === 'above12' && athlete.age && athlete.age <= 12) {
          return false;
        }
        if (filterAge === 'below12' && athlete.age && athlete.age > 12) {
          return false;
        }
      }
      
      // School filter
      if (filterSchool !== 'all' && athlete.school !== filterSchool) {
        return false;
      }
      
      return true;
    });
  }, [availableAthletes, filterGender, filterAge, filterSchool]);

  // Extract unique schools from ALL athletes (both in competition and available)
  const uniqueSchools = useMemo(() => {
    const allAthletesInContext = [...competitionAthletes, ...availableAthletes];
    const schools = allAthletesInContext
      .map((athlete: Athlete) => athlete.school)
      .filter((school): school is string => !!school && school.trim() !== '');
    return Array.from(new Set(schools)).sort();
  }, [competitionAthletes, availableAthletes]);

  // Filter UI Component
  const FilterSection = () => (
    <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('common.filterAthletes')}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Gender filter */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('athlete.gender')}
          </label>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          >
            <option value="all">{t('common.allGenders')}</option>
            <option value="male">{t('athlete.male')}</option>
            <option value="female">{t('athlete.female')}</option>
          </select>
        </div>

        {/* Age filter */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('athlete.age')}
          </label>
          <select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          >
            <option value="all">{t('common.allAges')}</option>
            <option value="above12">{t('athlete.above12')}</option>
            <option value="below12">{t('athlete.below12')}</option>
          </select>
        </div>

        {/* School filter */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('athlete.school')}
          </label>
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          >
            <option value="all">{t('common.allSchools')}</option>
            {uniqueSchools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear filters button */}
      {(filterGender !== 'all' || filterAge !== 'all' || filterSchool !== 'all') && (
        <button
          onClick={() => {
            setFilterGender('all');
            setFilterAge('all');
            setFilterSchool('all');
          }}
          className="mt-3 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {t('common.clearFilters')}
        </button>
      )}
    </div>
  );

  // Athlete List Component
  const AthleteListDisplay = () => (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg" />
          ))}
        </div>
      ) : filteredCompetitionAthletes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {competitionAthletes.length === 0 
            ? t('common.noParticipants')
            : t('athlete.noMatchingAthletes')}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCompetitionAthletes.map((athlete: Athlete) => (
            <div
              key={athlete.id}
              className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                  {athlete.athlete_number}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {athlete.name}
                  </p>
                  <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                    {athlete.team_name && <span>{athlete.team_name}</span>}
                    {athlete.school && <span>• {athlete.school}</span>}
                    {athlete.age && <span>• {athlete.age}{t('athlete.yearsOld')}</span>}
                    {athlete.gender && <span>• {t(`athlete.${athlete.gender}`)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditAthlete(athlete)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleRemoveAthlete(athlete.id)}
                  disabled={removingId === athlete.id}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                >
                  {removingId === athlete.id ? t('common.removing') : t('common.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {onClose ? (
        // Modal version with overlay
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('common.participantManagement')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('common.manageCompetitionAthletes')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={t('common.close')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Add athlete section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('common.addAthleteToCompetition')}
                </h3>
                <button
                  onClick={handleCreateAthlete}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('common.createNewAthlete')}
                </button>
              </div>
            <div className="flex gap-3">
              <select
                value={selectedAthleteId || ''}
                onChange={(e) => setSelectedAthleteId(Number(e.target.value) || null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={isAdding}
              >
                <option value="">{t('common.selectAthlete')}</option>
                {filteredAvailableAthletes.map((athlete: Athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} ({athlete.athlete_number})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddAthlete}
                disabled={!selectedAthleteId || isAdding}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isAdding ? t('common.adding') : t('common.add')}
              </button>
            </div>
            {filteredAvailableAthletes.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {availableAthletes.length === 0 
                  ? t('common.allAthletesAdded')
                  : t('common.noMatchingAthletesToAdd')}
              </p>
            )}
          </div>

          {/* Current athletes list */}
          <div>
            <FilterSection />
            
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('common.currentParticipants')} ({filteredCompetitionAthletes.length}/{competitionAthletes.length})
            </h3>
            
            <AthleteListDisplay />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
      ) : (
        // Inline version without overlay
        <div className="space-y-6">
          {/* Add athlete section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('common.addAthleteToCompetition')}
              </h3>
              <button
                onClick={handleCreateAthlete}
                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('common.createNewAthlete')}
              </button>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedAthleteId || ''}
                onChange={(e) => setSelectedAthleteId(Number(e.target.value) || null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={isAdding}
              >
                <option value="">{t('common.selectAthlete')}</option>
                {filteredAvailableAthletes.map((athlete: Athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} ({athlete.athlete_number})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddAthlete}
                disabled={!selectedAthleteId || isAdding}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isAdding ? t('common.adding') : t('common.add')}
              </button>
            </div>
            {filteredAvailableAthletes.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {availableAthletes.length === 0 
                  ? t('common.allAthletesAdded')
                  : t('common.noMatchingAthletesToAdd')}
              </p>
            )}
          </div>

          {/* Current athletes list */}
          <div>
            <FilterSection />
            
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('common.currentParticipants')} ({filteredCompetitionAthletes.length}/{competitionAthletes.length})
            </h3>
            
            <AthleteListDisplay />
          </div>
        </div>
      )}

    {/* Athlete Form Modal */}
    {showAthleteForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingAthlete ? t('athlete.editAthlete') : t('common.createNewAthlete')}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <AthleteForm
              athlete={editingAthlete}
              onSuccess={handleAthleteFormSuccess}
              onCancel={handleAthleteFormCancel}
            />
          </div>
        </div>
      </div>
    )}
  </>
  );
}
