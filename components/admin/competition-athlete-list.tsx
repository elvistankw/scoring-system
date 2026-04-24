// Competition-athlete association management component
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2

'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import type { Athlete } from '@/interface/athlete';
import { useAthletes, addAthleteToCompetition, removeAthleteFromCompetition } from '@/hooks/use-athletes';
import { API_ENDPOINTS } from '@/lib/api-config';
import { AthleteForm } from './athlete-form';
import { Pagination } from '@/components/shared/pagination';
import { useTranslation } from '@/i18n/use-dictionary';

interface CompetitionAthleteListProps {
  competitionId: number;
  competitionType?: 'individual' | 'duo' | 'team' | 'challenge';
  onClose?: () => void;
}

export function CompetitionAthleteList({ competitionId, competitionType, onClose }: CompetitionAthleteListProps) {
  const { t } = useTranslation();

  const [competitionAthletes, setCompetitionAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [showAthleteForm, setShowAthleteForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  
  // Filter states
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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

  // Handle adding athlete(s) - for duo/team, add all team members
  const handleAddAthlete = async () => {
    const isDuoOrTeam = competitionType === 'duo' || competitionType === 'team';
    
    if (isDuoOrTeam && !selectedTeamName) {
      toast.error('请选择团队');
      return;
    }
    
    if (!isDuoOrTeam && !selectedAthleteId) {
      toast.error(t('common.pleaseSelectAthlete'));
      return;
    }

    setIsAdding(true);
    try {
      if (isDuoOrTeam) {
        // Add all athletes from the selected team
        const teamMembers = eligibleAthletes.filter(
          (athlete: Athlete) => athlete.team_name === selectedTeamName
        );
        
        if (teamMembers.length === 0) {
          toast.error('该团队没有可添加的选手');
          return;
        }

        // Add all team members
        const addPromises = teamMembers.map((athlete: Athlete) =>
          addAthleteToCompetition(competitionId, athlete.id)
        );
        
        await Promise.all(addPromises);
        toast.success(`成功添加 ${teamMembers.length} 位选手（${selectedTeamName}）`);
        setSelectedTeamName('');
      } else {
        // Add single athlete for individual/challenge
        await addAthleteToCompetition(competitionId, selectedAthleteId!);
        toast.success(t('common.athleteAddedSuccess'));
        setSelectedAthleteId(null);
      }
      
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

  // For duo and team competitions, only show athletes with team names
  const eligibleAthletes = useMemo<Athlete[]>(() => {
    if (competitionType === 'duo' || competitionType === 'team') {
      return availableAthletes.filter((athlete: Athlete) => 
        athlete.team_name && athlete.team_name.trim() !== ''
      );
    }
    return availableAthletes;
  }, [availableAthletes, competitionType]);

  // Get unique team names from eligible athletes
  const availableTeams = useMemo<string[]>(() => {
    if (competitionType === 'duo' || competitionType === 'team') {
      const teamNames = eligibleAthletes
        .map((athlete: Athlete) => athlete.team_name)
        .filter((name: string | null | undefined): name is string => !!name && name.trim() !== '');
      return Array.from(new Set(teamNames)).sort();
    }
    return [];
  }, [eligibleAthletes, competitionType]);

  // Get team members for selected team
  const selectedTeamMembers = useMemo(() => {
    if (!selectedTeamName) return [];
    return eligibleAthletes.filter(
      (athlete: Athlete) => athlete.team_name === selectedTeamName
    );
  }, [selectedTeamName, eligibleAthletes]);

  // Count athletes without team names (for info message)
  const athletesWithoutTeam = useMemo(() => {
    if (competitionType === 'duo' || competitionType === 'team') {
      return availableAthletes.filter((athlete: Athlete) => 
        !athlete.team_name || athlete.team_name.trim() === ''
      ).length;
    }
    return 0;
  }, [availableAthletes, competitionType]);

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

  // Paginate filtered athletes
  const paginatedCompetitionAthletes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCompetitionAthletes.slice(startIndex, endIndex);
  }, [filteredCompetitionAthletes, currentPage, itemsPerPage]);

  // Apply filters to available athletes (for the add athlete dropdown)
  const filteredAvailableAthletes = useMemo(() => {
    return eligibleAthletes.filter((athlete: Athlete) => {
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
  }, [eligibleAthletes, filterGender, filterAge, filterSchool]);

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
            setCurrentPage(1); // Reset to first page when clearing filters
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
        <>
          <div className="space-y-2">
            {paginatedCompetitionAthletes.map((athlete: Athlete) => (
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

          {/* Pagination */}
          {filteredCompetitionAthletes.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredCompetitionAthletes.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                showItemsPerPage={true}
              />
            </div>
          )}
        </>
      )}
    </>
  );

  // Add Athlete Section Component (reusable for both modal and inline)
  const AddAthleteSection = () => {
    const isDuoOrTeam = competitionType === 'duo' || competitionType === 'team';
    
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDuoOrTeam ? '添加团队到比赛' : t('common.addAthleteToCompetition')}
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
        
        {isDuoOrTeam ? (
          // Team selection for duo/team competitions
          <>
            <div className="flex gap-3">
              <select
                value={selectedTeamName}
                onChange={(e) => setSelectedTeamName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={isAdding}
              >
                <option value="">选择团队</option>
                {availableTeams.map((teamName: string) => {
                  const memberCount = eligibleAthletes.filter(
                    (a: Athlete) => a.team_name === teamName
                  ).length;
                  return (
                    <option key={teamName} value={teamName}>
                      {teamName} ({memberCount} 位选手)
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleAddAthlete}
                disabled={!selectedTeamName || isAdding}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isAdding ? '添加中...' : '添加团队'}
              </button>
            </div>
            
            {/* Show team members preview */}
            {selectedTeamName && selectedTeamMembers.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  将添加以下 {selectedTeamMembers.length} 位选手：
                </p>
                <div className="space-y-1">
                  {selectedTeamMembers.map((athlete: Athlete) => (
                    <div key={athlete.id} className="text-sm text-blue-800 dark:text-blue-300">
                      • {athlete.name} ({athlete.athlete_number})
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Team requirement info */}
            {athletesWithoutTeam > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">
                      {competitionType === 'duo' ? '双人赛要求选手有团队名称' : '团体赛要求选手有团队名称'}
                    </p>
                    <p>
                      有 {athletesWithoutTeam} 位选手因没有团队名称而无法添加
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {availableTeams.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {eligibleAthletes.length === 0 
                  ? '没有符合条件的选手（需要有团队名称）'
                  : '没有可用的团队'}
              </p>
            )}
          </>
        ) : (
          // Individual athlete selection for individual/challenge competitions
          <>
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
                    {athlete.name} ({athlete.athlete_number}){athlete.team_name ? ` - ${athlete.team_name}` : ''}
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
                {eligibleAthletes.length === 0 
                  ? t('common.allAthletesAdded')
                  : t('common.noMatchingAthletesToAdd')}
              </p>
            )}
          </>
        )}
      </div>
    );
  };

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
              <AddAthleteSection />

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
          <AddAthleteSection />

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
