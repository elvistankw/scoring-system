'use client';

// Judge List Component
// Requirements: Judge Identity System

import { useState, useMemo } from 'react';
import { Judge } from '@/interface/judge';
import { useJudges, useJudgeOperations } from '@/hooks/use-judges';
import { JudgeForm } from './judge-form';
import { JudgeCompetitionManager } from './judge-competition-manager';
import { SkeletonCard } from '@/components/shared/loading-skeleton';
import { BilingualText } from '@/components/shared/bilingual-text';
import { Pagination } from '@/components/shared/pagination';
import { useTranslation } from '@/i18n/use-dictionary';
import { toast } from 'sonner';

export function JudgeList() {
  const { t } = useTranslation();
  const { judges, total, isLoading, error, mutate } = useJudges();
  const { createJudge, updateJudge, deleteJudge, toggleJudgeActive, isSubmitting } = useJudgeOperations();
  
  const [showForm, setShowForm] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [managingCompetitionsJudge, setManagingCompetitionsJudge] = useState<Judge | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Handle create judge
  const handleCreate = () => {
    setEditingJudge(null);
    setShowForm(true);
  };

  // Handle edit judge
  const handleEdit = (judge: Judge) => {
    setEditingJudge(judge);
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingJudge) {
        await updateJudge(editingJudge.id, data);
        toast.success(t('judge.judgeUpdated'));
      } else {
        await createJudge(data);
        toast.success(t('judge.judgeAdded'));
      }
      
      setShowForm(false);
      setEditingJudge(null);
      mutate(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : t('judge.operationFailed');
      toast.error(message);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingJudge(null);
  };

  // Handle delete judge
  const handleDelete = async (judge: Judge) => {
    if (!confirm(t('judge.confirmDeleteMessage'))) {
      return;
    }

    setDeletingId(judge.id);
    try {
      await deleteJudge(judge.id);
      toast.success(t('judge.judgeDeleted'));
      mutate(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : t('judge.deleteFailed');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (judge: Judge) => {
    try {
      const updatedJudge = await toggleJudgeActive(judge.id);
      toast.success(updatedJudge.is_active ? t('judge.judgeActivated') : t('judge.judgeDeactivated'));
      mutate(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : t('judge.operationFailed');
      toast.error(message);
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('judge.never');
    return new Date(dateString).toLocaleString();
  };

  // Paginate judges
  const paginatedJudges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return judges.slice(startIndex, endIndex);
  }, [judges, currentPage, itemsPerPage]);

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          {t('judge.loadJudgesFailed')}: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            <BilingualText 
              translationKey="judge.judges" 
              chineseSize="text-2xl" 
              englishSize="text-lg"
              layout="vertical"
            />
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            <BilingualText 
              translationKey="judge.totalJudges" 
              chineseSize="text-base" 
              englishSize="text-sm"
            />: {total}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                   transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <BilingualText 
            translationKey="judge.addJudge" 
            chineseSize="text-base" 
            englishSize="text-sm"
          />
        </button>
      </div>

      {/* Judge List */}
      {judges.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            <BilingualText 
              translationKey="judge.noJudges" 
              chineseSize="text-base" 
              englishSize="text-sm"
              layout="vertical"
            />
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <BilingualText 
              translationKey="judge.createJudge" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.judgeCode" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.judgeName" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.displayName" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.isActive" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.currentlyActive" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.lastSession" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <BilingualText 
                      translationKey="judge.actions" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                      layout="vertical"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedJudges.map((judge) => (
                  <tr key={judge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {judge.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {judge.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {judge.display_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        judge.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        <BilingualText 
                          translationKey={judge.is_active ? 'judge.active' : 'judge.inactive'}
                          chineseSize="text-xs" 
                          englishSize="text-xs"
                        />
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {judge.is_currently_active ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                            <BilingualText 
                              translationKey="judge.yes"
                              chineseSize="text-xs" 
                              englishSize="text-xs"
                            />
                          </span>
                          {judge.current_device_id && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {judge.current_device_id.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          <BilingualText 
                            translationKey="judge.no"
                            chineseSize="text-xs" 
                            englishSize="text-xs"
                          />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(judge.last_session_start)}
                        </span>
                        {judge.is_currently_active && judge.current_session_last_activity && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <BilingualText 
                              translationKey="judge.lastActivity"
                              chineseSize="text-xs" 
                              englishSize="text-xs"
                            />: {formatDate(judge.current_session_last_activity)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Manage Competitions Button */}
                        <button
                          onClick={() => setManagingCompetitionsJudge(judge)}
                          disabled={isSubmitting}
                          className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <BilingualText 
                            translationKey="judge.manageCompetitions"
                            chineseSize="text-xs" 
                            englishSize="text-xs"
                          />
                        </button>

                        {/* Toggle Active Button */}
                        <button
                          onClick={() => handleToggleActive(judge)}
                          disabled={isSubmitting}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            judge.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                          } disabled:opacity-50`}
                        >
                          <BilingualText 
                            translationKey={judge.is_active ? 'judge.inactive' : 'judge.active'}
                            chineseSize="text-xs" 
                            englishSize="text-xs"
                          />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(judge)}
                          disabled={isSubmitting}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        >
                          <BilingualText 
                            translationKey="common.edit"
                            chineseSize="text-sm" 
                            englishSize="text-xs"
                          />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(judge)}
                          disabled={isSubmitting || deletingId === judge.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <BilingualText 
                            translationKey={deletingId === judge.id ? 'judge.deleting' : 'common.delete'}
                            chineseSize="text-sm" 
                            englishSize="text-xs"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {judges.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalItems={judges.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
                showItemsPerPage={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Judge Form Modal */}
      {showForm && (
        <JudgeForm
          judge={editingJudge}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Judge Competition Manager Modal */}
      {managingCompetitionsJudge && (
        <JudgeCompetitionManager
          judge={managingCompetitionsJudge}
          onClose={() => setManagingCompetitionsJudge(null)}
        />
      )}
    </div>
  );
}