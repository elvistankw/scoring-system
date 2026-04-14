// TypeScript interfaces for Score entity
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4, 9.5, 19.1, 19.2, 19.3, 19.5

import type { CompetitionType } from './competition';

// Individual Stage Competition: 5 dimensions
export interface IndividualScores {
  action_difficulty: number;
  stage_artistry: number;
  action_creativity: number;
  action_fluency: number;
  costume_styling: number;
}

// Duo/Team Competition: 5 dimensions (interaction instead of fluency)
export interface DuoTeamScores {
  action_difficulty: number;
  stage_artistry: number;
  action_interaction: number;
  action_creativity: number;
  costume_styling: number;
}

// Challenge Competition: 3 dimensions
export interface ChallengeScores {
  action_difficulty: number;
  action_creativity: number;
  action_fluency: number;
}

// Union type for all score dimensions
export type ScoreDimensions = IndividualScores | DuoTeamScores | ChallengeScores;

// Database score record (all fields nullable to support different competition types)
export interface Score {
  id: number;
  competition_id: number;
  athlete_id: number;
  judge_id: number;
  action_difficulty: number | null;
  stage_artistry: number | null;
  action_creativity: number | null;
  action_fluency: number | null;
  costume_styling: number | null;
  action_interaction: number | null;
  submitted_at: string;
}

// Score submission request
export interface SubmitScoreRequest {
  competition_id: number;
  athlete_id: number;
  scores: ScoreDimensions;
}

// Score with additional details for display
export interface ScoreWithDetails extends Score {
  athlete_name: string;
  athlete_number: string;
  judge_name: string;
  competition_type: CompetitionType;
  competition_name: string;
  region: string;
}

// Real-time score update (WebSocket broadcast)
export interface RealtimeScoreUpdate {
  competition_id: number;
  athlete_id: number;
  athlete_name: string;
  athlete_number: string;
  judge_id: number;
  judge_name: string;
  scores: ScoreDimensions;
  competition_type: CompetitionType;
  timestamp: string;
}

// API response types
export interface SubmitScoreResponse {
  success: boolean;
  score: Score;
  message?: string;
}

export interface ScoreListResponse {
  success: boolean;
  scores: ScoreWithDetails[];
  total: number;
}

export interface LatestScoresResponse {
  success: boolean;
  scores: ScoreWithDetails[];
  competition_id: number;
  competition_type: CompetitionType;
}

// Helper type to get score dimensions by competition type
export type ScoreDimensionsByType<T extends CompetitionType> = 
  T extends 'individual' ? IndividualScores :
  T extends 'duo_team' ? DuoTeamScores :
  T extends 'challenge' ? ChallengeScores :
  never;

// Rankings interfaces
export interface AverageScores {
  action_difficulty: string | null;
  stage_artistry: string | null;
  action_creativity: string | null;
  action_fluency: string | null;
  costume_styling: string | null;
  action_interaction: string | null;
}

export interface AthleteRanking {
  rank: number;
  athlete_id: number;
  athlete_name: string;
  athlete_number: string;
  judge_count: number;
  average_scores: AverageScores;
  competition_type: CompetitionType;
  competition_name: string;
}

export interface RankingsResponse {
  success: boolean;
  source: 'cache' | 'database';
  data: AthleteRanking[];
}
