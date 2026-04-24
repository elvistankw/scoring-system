'use client';

/**
 * Judge Competition Manager Component
 * Allows admin to assign/remove competitions for a specific judge
 */

import { useState, useEffect } from 'react';
import { Judge } from '@/interface/judge';
import { Competition } from '@/interface/competition';
import { BilingualText } from '@/components/shared/bilingual-text';
import { useTranslation } from '@/i18n/use-dictionary';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface JudgeCompetitionManagerProps {
  judge: Judge;
  onClose: () => void;
}

interface AssignedCompetition extends Competition {
  assigned_at: string;
  notes?: string;
  assigned_by_username?: string;
}

export function JudgeCompetitionManager({ judge, onClose }: JudgeCompetitionManagerProps) {
  const { t } = useTranslation();
  const [assignedCompetitions, setAssignedCompetitions] = useState<AssignedCompetition[]>([]);
  const [availableCompetitions, setAvailableCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch assigned and available competitions
  useEffect(() => {
    fetchData();
  }, [judge.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        toast.error('请先登录');
        onClose();
        return;
      }

      console.log('🔍 Fetching judge competitions for judge ID:', judge.id);
      console.log('🔍 API URL:', `${API_BASE_URL}/api/judges/${judge.id}/competitions`);
      
      // Fetch assigned competitions
      const assignedRes = await fetch(`${API_BASE_URL}/api/judges/${judge.id}/competitions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 Assigned competitions response status:', assignedRes.status);
      
      if (!assignedRes.ok) {
        const errorData = await assignedRes.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Failed to fetch assigned competitions:', errorData);
        throw new Error(errorData.message || 'Failed to fetch assigned competitions');
      }
      const assignedData = await assignedRes.json();
      console.log('✅ Assigned competitions data:', assignedData);
      setAssignedCompetitions(assignedData.data.competitions || []);

      // Fetch all competitions
      const allRes = await fetch(`${API_BASE_URL}/api/competitions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 All competitions response status:', allRes.status);
      
      if (!allRes.ok) {
        const errorData = await allRes.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Failed to fetch competitions:', errorData);
        throw new Error(errorData.message || 'Failed to fetch competitions');
      }
      const allData = await allRes.json();
      console.log('✅ All competitions count:', allData.data.competitions.length);
      
      // Filter out already assigned competitions
      const assignedIds = new Set(assignedData.data.competitions.map((c: AssignedCompetition) => c.id));
      const available = allData.data.competitions.filter((c: Competition) => !assignedIds.has(c.id));
      console.log('✅ Available competitions count:', available.length);
      setAvailableCompetitions(available);

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error(error instanceof Error ? error.message : t('judge.fetchCompetitionsFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle competition selection
  const toggleCompetitionSelection = (competitionId: number) => {
    setSelectedCompetitions(prev => 
      prev.includes(competitionId)
        ? prev.filter(id => id !== competitionId)
        : [...prev, competitionId]
    );
  };

  // Assign selected competitions
  const handleAssignCompetitions = async () => {
    if (selectedCompetitions.length === 0) {
      toast.error(t('judge.selectCompetitionsFirst'));
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/api/judges/${judge.id}/competitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          competitionIds: selectedCompetitions
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to assign competitions');
      }
      
      toast.success(t('judge.competitionsAssigned'));
      setSelectedCompetitions([]);
      await fetchData(); // Refresh data

    } catch (error) {
      console.error('Error assigning competitions:', error);
      toast.error(error instanceof Error ? error.message : t('judge.assignCompetitionsFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove competition assignment
  const handleRemoveCompetition = async (competitionId: number) => {
    if (!confirm(t('judge.confirmRemoveCompetition'))) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/api/judges/${judge.id}/competitions/${competitionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to remove competition');
      }
      
      toast.success(t('judge.competitionRemoved'));
      await fetchData(); // Refresh data

    } catch (error) {
      console.error('Error removing competition:', error);
      toast.error(error instanceof Error ? error.message : t('judge.removeCompetitionFailed'));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                <BilingualText 
                  translationKey="judge.manageCompetitions"
                  chineseSize="text-2xl"
                  englishSize="text-lg"
                  layout="vertical"
                />
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {judge.display_name || judge.name} ({judge.code})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                <BilingualText translationKey="common.loading" />
              </p>
            </div>
          ) : (
            <>
              {/* Assigned Competitions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  <BilingualText 
                    translationKey="judge.assignedCompetitions"
                    chineseSize="text-lg"
                    englishSize="text-base"
                    layout="vertical"
                  />
                  <span className="ml-2 text-sm text-gray-500">({assignedCompetitions.length})</span>
                </h3>
                
                {assignedCompetitions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      <BilingualText translationKey="judge.noAssignedCompetitions" />
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedCompetitions.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {comp.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {comp.region} • {comp.competition_type} • {comp.status}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            <BilingualText translationKey="judge.assignedAt" />: {formatDate(comp.assigned_at)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCompetition(comp.id)}
                          className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <BilingualText translationKey="common.remove" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Competitions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  <BilingualText 
                    translationKey="judge.availableCompetitions"
                    chineseSize="text-lg"
                    englishSize="text-base"
                    layout="vertical"
                  />
                  <span className="ml-2 text-sm text-gray-500">({availableCompetitions.length})</span>
                </h3>
                
                {availableCompetitions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      <BilingualText translationKey="judge.noAvailableCompetitions" />
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableCompetitions.map((comp) => (
                      <label
                        key={comp.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCompetitions.includes(comp.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompetitions.includes(comp.id)}
                          onChange={() => toggleCompetitionSelection(comp.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {comp.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {comp.region} • {comp.competition_type} • {comp.status}
                          </div>
                          {comp.start_date && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatDate(comp.start_date)}
                              {comp.end_date && ` - ${formatDate(comp.end_date)}`}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCompetitions.length > 0 && (
              <span>
                <BilingualText translationKey="judge.selected" />: {selectedCompetitions.length}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <BilingualText translationKey="common.cancel" />
            </button>
            <button
              onClick={handleAssignCompetitions}
              disabled={selectedCompetitions.length === 0 || isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <BilingualText translationKey="common.saving" />
              ) : (
                <BilingualText translationKey="judge.assignSelected" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
