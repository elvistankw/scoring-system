'use client';

// Competition Scores Manager - Admin view/edit scores
// Allows administrators to view and modify athlete scores

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAthletes } from '@/hooks/use-athletes';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import { Pagination } from '@/components/shared/pagination';
import type { Athlete } from '@/interface/athlete';
import type { ScoreWithDetails } from '@/interface/score';

interface CompetitionScoresManagerProps {
  competitionId: number;
  competitionType: string;
}

export function CompetitionScoresManager({ competitionId, competitionType }: CompetitionScoresManagerProps) {
  const { athletes, isLoading: athletesLoading } = useAthletes(competitionId);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [scores, setScores] = useState<ScoreWithDetails[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [editingScore, setEditingScore] = useState<ScoreWithDetails | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isExporting, setIsExporting] = useState(false);

  // Pagination states for athletes list
  const [athletesPage, setAthletesPage] = useState(1);
  const [athletesPerPage, setAthletesPerPage] = useState(20);

  // Pagination states for scores list
  const [scoresPage, setScoresPage] = useState(1);
  const [scoresPerPage, setScoresPerPage] = useState(10);

  // Fetch scores for selected athlete
  const fetchAthleteScores = async (athleteId: number) => {
    setIsLoadingScores(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch(
        `${API_ENDPOINTS.scores.list}?athlete_id=${athleteId}&competition_id=${competitionId}`,
        {
          headers: getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('获取评分失败');
      }

      const data = await response.json();
      setScores(data.data?.scores || []);
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast.error(error instanceof Error ? error.message : '获取评分失败');
      setScores([]);
    } finally {
      setIsLoadingScores(false);
    }
  };

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setEditingScore(null);
    setScoresPage(1); // Reset scores pagination when selecting new athlete
    fetchAthleteScores(athlete.id);
  };

  const handleEditScore = (score: ScoreWithDetails) => {
    setEditingScore(score);
    setEditFormData({
      action_difficulty: score.action_difficulty || 0,
      stage_artistry: score.stage_artistry || 0,
      action_creativity: score.action_creativity || 0,
      action_fluency: score.action_fluency || 0,
      costume_styling: score.costume_styling || 0,
      action_interaction: score.action_interaction || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingScore(null);
    setEditFormData({});
  };

  const handleSaveScore = async () => {
    if (!editingScore) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      console.log('🔄 Updating score:', {
        scoreId: editingScore.id,
        data: editFormData,
        endpoint: API_ENDPOINTS.scores.update(editingScore.id)
      });

      const response = await fetch(
        API_ENDPOINTS.scores.update(editingScore.id),
        {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(token),
          },
          body: JSON.stringify(editFormData),
        }
      );

      console.log('📡 Response status:', response.status, 'OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `更新失败: HTTP ${response.status}` };
        }
        console.error('❌ Update failed:', errorData);
        throw new Error(errorData.message || `更新失败: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
        console.log('✅ Update successful:', result);
      } catch (e) {
        console.error('⚠️  Failed to parse response JSON, but update succeeded:', e);
        result = { success: true };
      }

      toast.success('评分更新成功');
      setEditingScore(null);
      setEditFormData({});
      
      // Refresh scores
      if (selectedAthlete) {
        console.log('🔄 Refreshing scores for athlete:', selectedAthlete.id);
        await fetchAthleteScores(selectedAthlete.id);
      }
      
      console.log('✅ Score update complete');
    } catch (error) {
      console.error('❌ Error updating score:', error);
      toast.error(error instanceof Error ? error.message : '更新评分失败');
    }
  };

  const handleDeleteScore = async (scoreId: number) => {
    if (!confirm('确定要删除这条评分记录吗？此操作不可撤销。')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.scores.delete(scoreId),
        {
          method: 'DELETE',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('删除评分失败');
      }

      toast.success('评分删除成功');
      
      // Refresh scores
      if (selectedAthlete) {
        fetchAthleteScores(selectedAthlete.id);
      }
    } catch (error) {
      console.error('Error deleting score:', error);
      toast.error(error instanceof Error ? error.message : '删除评分失败');
    }
  };

  // Get score fields based on competition type
  const getScoreFields = () => {
    const fields = {
      individual: ['action_difficulty', 'stage_artistry', 'action_creativity', 'action_fluency', 'costume_styling'],
      duo: ['action_difficulty', 'stage_artistry', 'action_interaction', 'action_creativity', 'costume_styling'],
      team: ['action_difficulty', 'stage_artistry', 'action_interaction', 'action_creativity', 'costume_styling'],
      challenge: ['action_difficulty', 'action_creativity', 'action_fluency'],
    };
    return fields[competitionType as keyof typeof fields] || fields.individual;
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      action_difficulty: '动作难度',
      stage_artistry: '舞台艺术',
      action_creativity: '动作创意',
      action_fluency: '动作流畅',
      costume_styling: '服装造型',
      action_interaction: '动作互动',
    };
    return labels[field] || field;
  };

  const scoreFields = getScoreFields();

  // Paginate athletes
  const paginatedAthletes = useMemo(() => {
    const startIndex = (athletesPage - 1) * athletesPerPage;
    const endIndex = startIndex + athletesPerPage;
    return athletes.slice(startIndex, endIndex);
  }, [athletes, athletesPage, athletesPerPage]);

  // Paginate scores
  const paginatedScores = useMemo(() => {
    const startIndex = (scoresPage - 1) * scoresPerPage;
    const endIndex = startIndex + scoresPerPage;
    return scores.slice(startIndex, endIndex);
  }, [scores, scoresPage, scoresPerPage]);

  // Export to Excel function
  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.competitions.exportExcel(competitionId),
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
          },
          body: JSON.stringify({
            export_type: 'download'
          }),
        }
      );

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data?.file_content) {
        // Convert base64 to blob
        const byteCharacters = atob(data.data.file_content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.data.filename || '评分汇总.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Excel 文件已下载');
      } else {
        throw new Error('导出数据格式错误');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(error instanceof Error ? error.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          评分管理
        </h3>
        <button
          onClick={handleExportToExcel}
          disabled={isExporting || athletes.length === 0}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${athletes.length === 0 || isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : 'bg-green-600 text-white hover:bg-green-700'
            }
          `}
          title={athletes.length === 0 ? '暂无数据可导出' : '导出评分详情到 Excel'}
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>导出中...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>导出 Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Athletes List */}
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          选择选手
        </h3>
        {athletesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            暂无参赛选手
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedAthletes.map((athlete: Athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => handleAthleteSelect(athlete)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAthlete?.id === athlete.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {athlete.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    编号: {athlete.athlete_number}
                  </div>
                  {athlete.team_name && (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {athlete.team_name}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Athletes Pagination */}
            {athletes.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={athletesPage}
                  totalItems={athletes.length}
                  itemsPerPage={athletesPerPage}
                  onPageChange={setAthletesPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setAthletesPerPage(newItemsPerPage);
                    setAthletesPage(1);
                  }}
                  showItemsPerPage={true}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Scores List */}
      {selectedAthlete && (
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            {selectedAthlete.name} 的评分记录
          </h3>
          
          {isLoadingScores ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
              该选手还没有评分记录
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedScores.map((score, index) => (
                <div
                  key={`score-${score.id}-${score.judge_id}-${index}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  {editingScore?.id === score.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            编辑评分
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            评委: {score.judge_name} · {new Date(score.submitted_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {scoreFields.map((field) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {getFieldLabel(field)}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              step="0.1"
                              value={editFormData[field] || 0}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                [field]: parseFloat(e.target.value) || 0
                              })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveScore}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {score.judge_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(score.submitted_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditScore(score)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteScore(score.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="删除"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {scoreFields.map((field) => {
                          const value = (score as any)[field];
                          if (value === null || value === undefined) return null;
                          
                          return (
                            <div key={field} className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                {getFieldLabel(field)}:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {Number(value).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Scores Pagination */}
            {scores.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={scoresPage}
                  totalItems={scores.length}
                  itemsPerPage={scoresPerPage}
                  onPageChange={setScoresPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setScoresPerPage(newItemsPerPage);
                    setScoresPage(1);
                  }}
                  showItemsPerPage={true}
                />
              </div>
            )}
          </>
          )}
        </div>
      )}
    </div>
  );
}
