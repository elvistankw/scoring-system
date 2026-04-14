// TypeScript interfaces for Competition entity
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 19.1, 19.2, 19.3, 19.5

export type CompetitionType = 'individual' | 'duo' | 'team' | 'challenge';
export type CompetitionStatus = 'upcoming' | 'active' | 'completed';

export interface Competition {
  id: number;
  name: string;
  competition_type: CompetitionType;
  region: string;
  status: CompetitionStatus;
  start_date: string;
  end_date: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  athlete_count?: number; // Optional: number of athletes in this competition
}

export interface CreateCompetitionRequest {
  name: string;
  competition_type: CompetitionType;
  region: string;
  start_date: string;
  end_date: string;
}

export interface UpdateCompetitionRequest {
  name?: string;
  competition_type?: CompetitionType;
  region?: string;
  status?: CompetitionStatus;
  start_date?: string;
  end_date?: string;
}

export interface CompetitionWithAthletes extends Competition {
  athletes: any[]; // Use any[] to avoid circular dependency
  athlete_count: number;
}

export interface CompetitionListResponse {
  status: string;
  cached?: boolean;
  data: {
    competitions: Competition[];
    total?: number;
  };
}

export interface CompetitionDetailResponse {
  status: string;
  cached?: boolean;
  data: {
    competition: CompetitionWithAthletes;
  };
}
