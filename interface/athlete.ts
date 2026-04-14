// TypeScript interfaces for Athlete entity
// Requirements: 2.2, 2.4, 19.1, 19.2, 19.3, 19.5

import type { Competition } from './competition';

export interface Athlete {
  id: number;
  name: string;
  athlete_number: string;
  team_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAthleteRequest {
  name: string;
  athlete_number: string;
  team_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateAthleteRequest {
  name?: string;
  athlete_number?: string;
  team_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface AthleteWithCompetitions extends Athlete {
  competitions: Competition[];
  competition_count: number;
}

export interface AthleteListResponse {
  success: boolean;
  athletes: Athlete[];
  total: number;
}

export interface AthleteDetailResponse {
  success: boolean;
  athlete: AthleteWithCompetitions;
}

export interface CompetitionAthleteAssociation {
  id: number;
  competition_id: number;
  athlete_id: number;
  registration_date: string;
}

export interface AddAthleteToCompetitionRequest {
  competition_id: number;
  athlete_id: number;
}
