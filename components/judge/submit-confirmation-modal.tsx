'use client';

// Confirmation modal for batch score submission
// Requirements: 14.1, 14.2, 14.3
// Supports both individual athletes and team-based competitions

import { useState } from 'react';
import type { Competition } from '@/interface/competition';
import type { AthleteScore, TeamScore } from './scoring-client';

interface SubmitConfirmationModalProps {
  athleteScores?: AthleteScore[];
  teamScores?: TeamScore[];
  competition: Competition;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmitConfirmationModal({
  athleteScores = [],
  teamScores = [],
  competition,
  onConfirm,
  onCancel,
}: SubmitConfirmationModalProps) {
  const isTeamMode = competition.competition_type === 'duo' || competition.competition_type === 'team';
  const completedScores = isTeamMode 
    ? teamScores.filter(ts => ts.isComplete)
    : athleteScores.filter(as => as.isComplete);
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Get score dimension label
  const getScoreDimensionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      action_difficulty: '动作难度 / Action Difficulty',
      stage_artistry: '舞台艺术 / Stage Artistry',
      action_creativity: '动作创意 / Action Creativity',
      action_fluency: '动作流畅 / Action Fluency',
      costume_styling: '服装造型 / Costume Styling',
      action_interaction: '动作互动 / Action Interaction',
    };
    return labels[key] || key;
  };

  // Calculate total athletes (for team mode, count all members)
  const totalAthletes = isTeamMode
    ? teamScores.reduce((sum, ts) => sum + ts.team.members.length, 0)
    : completedScores.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            确认提交评分 / Confirm Submission
          </h2>
          <p className="text-blue-100 mt-2">
            {competition.name} - {competition.region}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                📊 提交摘要 / Submission Summary
              </h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 block">
                  {completedScores.length} {isTeamMode ? '个团队 / Teams' : '位选手 / Athletes'}
                </span>
                {isTeamMode && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({totalAthletes} 位选手 / athletes)
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isTeamMode ? (
                <>
                  您即将提交 {completedScores.length} 个团队（共 {totalAthletes} 位选手）的评分。提交后将无法修改。
                  <br />
                  You are about to submit scores for {completedScores.length} teams ({totalAthletes} athletes total). This action cannot be undone.
                </>
              ) : (
                <>
                  您即将提交 {completedScores.length} 位选手的评分。提交后将无法修改。
                  <br />
                  You are about to submit scores for {completedScores.length} athletes. This action cannot be undone.
                </>
              )}
            </p>
          </div>

          {/* Team/Athlete List */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {isTeamMode ? '团队列表 / Team List' : '选手列表 / Athlete List'}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isTeamMode ? (
                /* Team Mode: Show teams with members */
                teamScores.filter(ts => ts.isComplete).map((teamScore, index) => {
                  const { team, scores } = teamScore;
                  const isExpanded = expandedItems.has(team.teamName);

                  return (
                    <div
                      key={team.teamName}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden"
                    >
                      {/* Team Header - Clickable */}
                      <button
                        onClick={() => toggleExpand(team.teamName)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {team.teamName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {team.members.length} 位成员 / members
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isExpanded ? '收起 / Collapse' : '展开 / Expand'}
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                          {/* Team Members */}
                          <div>
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              团队成员 / Team Members:
                            </p>
                            <div className="space-y-1">
                              {team.members.map((member, idx) => (
                                <div 
                                  key={member.id}
                                  className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded px-2 py-1"
                                >
                                  <span className="flex-shrink-0 w-5 h-5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center text-xs font-medium">
                                    {idx + 1}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                    {member.athlete_number}
                                  </span>
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {member.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Team Scores */}
                          {scores && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                团队评分 / Team Scores:
                              </p>
                              <div className="space-y-2">
                                {Object.entries(scores).map(([key, value]) => {
                                  if (value === null || value === undefined) return null;
                                  
                                  return (
                                    <div 
                                      key={key}
                                      className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded"
                                    >
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {getScoreDimensionLabel(key)}
                                      </span>
                                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {typeof value === 'number' ? value.toFixed(1) : value}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Individual Mode: Show athletes */
                athleteScores.filter(as => as.isComplete).map((athleteScore, index) => {
                  const { athlete, scores } = athleteScore;
                  const isExpanded = expandedItems.has(athlete.id.toString());

                  return (
                    <div
                      key={athlete.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden"
                    >
                      {/* Athlete Header - Clickable */}
                      <button
                        onClick={() => toggleExpand(athlete.id.toString())}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {athlete.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              #{athlete.athlete_number}
                              {athlete.team_name && ` - ${athlete.team_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isExpanded ? '收起 / Collapse' : '展开 / Expand'}
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Score Details */}
                      {isExpanded && scores && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-600 pt-3">
                          {Object.entries(scores).map(([key, value]) => {
                            if (value === null || value === undefined) return null;
                            
                            return (
                              <div 
                                key={key}
                                className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {getScoreDimensionLabel(key)}
                                </span>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {typeof value === 'number' ? value.toFixed(1) : value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ 重要提示 / Important Notice
                </h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>• 请仔细检查所有评分是否正确</p>
                  <p>• Please double-check all scores are correct</p>
                  {isTeamMode && (
                    <>
                      <p className="mt-2">• 团队中所有成员将获得相同的分数</p>
                      <p>• All team members will receive the same scores</p>
                    </>
                  )}
                  <p className="mt-2">• 提交后如需修改，请联系技术人员</p>
                  <p>• If any modifications are needed after submission, please contact the technical staff.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 flex gap-3">
          <button
            onClick={onCancel}
            className="
              flex-1 py-3 px-6 rounded-lg font-semibold text-base
              bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
              text-gray-700 dark:text-gray-200
              transition-colors duration-200
              active:scale-[0.98]
            "
          >
            取消 / Cancel
          </button>
          <button
            onClick={onConfirm}
            className="
              flex-1 py-3 px-6 rounded-lg font-semibold text-base
              bg-green-600 hover:bg-green-700 text-white
              transition-colors duration-200
              active:scale-[0.98]
              shadow-lg hover:shadow-xl
            "
          >
            确认提交 / Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
}
