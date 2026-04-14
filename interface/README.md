# TypeScript Interfaces

This directory contains all TypeScript interface definitions for the Realtime Scoring System frontend.

## Files

### user.ts
- **User**: User account information (admin/judge)
- **AuthResponse**: Authentication API response
- **LoginRequest**: Login credentials
- **RegisterRequest**: Registration data
- **JWTPayload**: JWT token payload structure

### competition.ts
- **Competition**: Competition event entity
- **CompetitionType**: Type union ('individual' | 'duo_team' | 'challenge')
- **CompetitionStatus**: Status union ('upcoming' | 'active' | 'completed')
- **CreateCompetitionRequest**: Competition creation payload
- **UpdateCompetitionRequest**: Competition update payload
- **CompetitionWithAthletes**: Competition with athlete list
- **CompetitionListResponse**: API response for competition list
- **CompetitionDetailResponse**: API response for competition detail

### athlete.ts
- **Athlete**: Athlete/team entity
- **CreateAthleteRequest**: Athlete creation payload
- **UpdateAthleteRequest**: Athlete update payload
- **AthleteWithCompetitions**: Athlete with competition list
- **AthleteListResponse**: API response for athlete list
- **AthleteDetailResponse**: API response for athlete detail
- **CompetitionAthleteAssociation**: Many-to-many relationship record
- **AddAthleteToCompetitionRequest**: Association creation payload

### score.ts
- **IndividualScores**: 5 dimensions for individual stage competitions
- **DuoTeamScores**: 5 dimensions for duo/team competitions (with interaction)
- **ChallengeScores**: 3 dimensions for challenge competitions
- **ScoreDimensions**: Union type for all score types
- **Score**: Database score record
- **SubmitScoreRequest**: Score submission payload
- **ScoreWithDetails**: Score with athlete/judge/competition details
- **RealtimeScoreUpdate**: WebSocket score update event
- **SubmitScoreResponse**: API response for score submission
- **ScoreListResponse**: API response for score list
- **LatestScoresResponse**: API response for latest scores

## Usage

Import interfaces in your components:

```typescript
import type { User, AuthResponse } from '@/interface/user';
import type { Competition, CompetitionType } from '@/interface/competition';
import type { Athlete } from '@/interface/athlete';
import type { Score, ScoreDimensions } from '@/interface/score';
```

## Requirements Mapping

- **Requirement 19.1**: TypeScript interfaces for all Backend_API response types
- **Requirement 19.2**: All interfaces stored in interface/ directory
- **Requirement 19.3**: Corresponding TypeScript interface for all JSON responses
- **Requirement 19.5**: Interfaces for Competition, Athlete, Score_Submission, and Judge entities
