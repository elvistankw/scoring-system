# Requirements Document

## Introduction

The Realtime Scoring System is a web-based platform designed to manage competitive scoring events with real-time score updates. The system supports three distinct user roles (Admin, Judge, Display) and three competition types (Individual Stage, Duo/Team Stage, Challenge) with different scoring criteria. The system provides real-time score broadcasting to display screens while maintaining secure judge authentication and score submission workflows.

## Glossary

- **System**: The Realtime Scoring System web application
- **Admin**: A user with administrative privileges who manages competitions and athlete rosters
- **Judge**: An authenticated user authorized to submit scores for athletes in competitions
- **Display_Screen**: A public-facing interface that shows real-time scores and rankings
- **Competition**: A scoring event with a specific type and regional division
- **Athlete**: A participant in one or more competitions
- **Region**: A geographical or organizational division within a competition
- **Score_Dimension**: A specific scoring criterion (e.g., difficulty, artistry, creativity)
- **Individual_Stage_Competition**: A competition type with five scoring dimensions weighted differently
- **Duo_Team_Competition**: A competition type emphasizing interaction between performers
- **Challenge_Competition**: A competition type focused on difficulty and creativity
- **Backend_API**: The Node.js Express server handling business logic and database operations
- **WebSocket_Server**: The real-time communication server for score broadcasting
- **Database**: The PostgreSQL database storing persistent data
- **Cache**: The Redis cache storing real-time score data
- **JWT_Token**: JSON Web Token used for authentication
- **Score_Submission**: The act of a Judge entering scores for an Athlete

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a Judge, I want to authenticate with the system, so that I can securely submit scores for competitions.

#### Acceptance Criteria

1. WHEN a Judge submits valid credentials, THE System SHALL generate a JWT_Token containing the Judge's role and identifier
2. WHEN a Judge submits invalid credentials, THE System SHALL return an authentication error message
3. WHEN a Judge accesses a scoring endpoint, THE Backend_API SHALL validate the JWT_Token before processing the request
4. THE System SHALL reject Score_Submission requests from unauthenticated users
5. THE System SHALL store JWT_Token validation logic in a server-side middleware component

### Requirement 2: Competition Management

**User Story:** As an Admin, I want to create competitions with athlete rosters, so that Judges can score participants.

#### Acceptance Criteria

1. WHEN an Admin creates a Competition, THE System SHALL store the competition type, name, and Region in the Database
2. WHEN an Admin adds an Athlete to a Competition, THE System SHALL create an association between the Athlete and Competition in the Database
3. THE System SHALL support three Competition types: Individual_Stage_Competition, Duo_Team_Competition, and Challenge_Competition
4. THE System SHALL allow an Athlete to participate in multiple Competition types simultaneously
5. WHEN an Admin creates a Competition, THE System SHALL assign a unique identifier to the Competition
6. THE System SHALL store all Competition data using parameterized SQL queries

### Requirement 3: Individual Stage Competition Scoring

**User Story:** As a Judge, I want to score Individual Stage performances across five dimensions, so that Athletes receive comprehensive evaluations.

#### Acceptance Criteria

1. WHEN a Judge submits scores for an Individual_Stage_Competition, THE System SHALL accept five Score_Dimension values: action_difficulty, stage_artistry, action_creativity, action_fluency, and costume_styling
2. THE System SHALL store each Score_Dimension value without calculating weighted totals
3. WHEN a Judge submits an Individual_Stage_Competition score, THE Backend_API SHALL validate that all five Score_Dimension fields are present
4. THE System SHALL persist Individual_Stage_Competition scores to the Database before broadcasting to the Cache
5. WHEN Individual_Stage_Competition scores are stored, THE System SHALL associate them with the Athlete, Judge, and Competition identifiers

### Requirement 4: Duo/Team Competition Scoring

**User Story:** As a Judge, I want to score Duo/Team performances with emphasis on interaction, so that collaborative performances are properly evaluated.

#### Acceptance Criteria

1. WHEN a Judge submits scores for a Duo_Team_Competition, THE System SHALL accept five Score_Dimension values: action_difficulty, stage_artistry, action_interaction, action_creativity, and costume_styling
2. THE System SHALL store each Score_Dimension value without calculating weighted totals
3. WHEN a Judge submits a Duo_Team_Competition score, THE Backend_API SHALL validate that all five Score_Dimension fields are present
4. THE System SHALL persist Duo_Team_Competition scores to the Database before broadcasting to the Cache
5. WHEN Duo_Team_Competition scores are stored, THE System SHALL associate them with the Athlete, Judge, and Competition identifiers

### Requirement 5: Challenge Competition Scoring

**User Story:** As a Judge, I want to score Challenge performances across three dimensions, so that technical skill is prioritized.

#### Acceptance Criteria

1. WHEN a Judge submits scores for a Challenge_Competition, THE System SHALL accept three Score_Dimension values: action_difficulty, action_creativity, and action_fluency
2. THE System SHALL store each Score_Dimension value without calculating weighted totals
3. WHEN a Judge submits a Challenge_Competition score, THE Backend_API SHALL validate that all three Score_Dimension fields are present
4. THE System SHALL persist Challenge_Competition scores to the Database before broadcasting to the Cache
5. WHEN Challenge_Competition scores are stored, THE System SHALL associate them with the Athlete, Judge, and Competition identifiers

### Requirement 6: Real-time Score Broadcasting

**User Story:** As a Display_Screen operator, I want to see scores update in real-time, so that audiences can follow competition progress.

#### Acceptance Criteria

1. WHEN the Backend_API receives a valid Score_Submission, THE System SHALL write the score to the Database within 500 milliseconds
2. WHEN a score is written to the Database, THE System SHALL publish the score data to the Cache within 200 milliseconds
3. WHEN score data is published to the Cache, THE WebSocket_Server SHALL broadcast the update to all connected Display_Screen clients within 100 milliseconds
4. THE System SHALL maintain WebSocket connections for Display_Screen clients throughout the competition duration
5. WHEN a Display_Screen client disconnects, THE System SHALL attempt to reconnect automatically within 3 seconds

### Requirement 7: Judge Competition Selection

**User Story:** As a Judge, I want to select which competition I am scoring, so that my scores are associated with the correct event.

#### Acceptance Criteria

1. WHEN a Judge authenticates successfully, THE System SHALL display a list of available Competitions
2. WHEN a Judge selects a Competition, THE System SHALL store the Competition identifier in the Judge's session context
3. THE System SHALL prevent a Judge from submitting scores without first selecting a Competition
4. WHEN a Judge submits a score, THE Backend_API SHALL validate that the Competition identifier matches an active Competition
5. THE System SHALL allow a Judge to switch between Competitions during a session

### Requirement 8: Regional Competition Support

**User Story:** As an Admin, I want to organize competitions by region, so that scores are grouped geographically.

#### Acceptance Criteria

1. WHEN an Admin creates a Competition, THE System SHALL require a Region identifier
2. THE System SHALL associate all Athletes in a Competition with the Competition's Region
3. WHEN a Display_Screen requests scores, THE System SHALL filter results by Region if specified
4. THE System SHALL allow Athletes to participate in Competitions across different Regions
5. WHEN scores are displayed, THE System SHALL group Athletes by their Competition's Region

### Requirement 9: Score Display Without Totals

**User Story:** As a Display_Screen operator, I want to see individual dimension scores, so that audiences understand performance details.

#### Acceptance Criteria

1. WHEN the Display_Screen receives score data, THE System SHALL display all Score_Dimension values separately
2. THE System SHALL not calculate or display weighted total scores
3. WHEN multiple Judges score the same Athlete, THE Display_Screen SHALL show each Judge's individual Score_Dimension values
4. THE System SHALL display Score_Dimension names alongside their values
5. WHEN displaying scores, THE System SHALL indicate which Competition type the scores belong to

### Requirement 10: Frontend-Backend API Separation

**User Story:** As a developer, I want strict separation between frontend and backend, so that security and data integrity are maintained.

#### Acceptance Criteria

1. THE System SHALL prevent frontend components from directly accessing the Database
2. THE System SHALL prevent frontend components from directly accessing the Cache
3. WHEN a frontend component needs data, THE System SHALL require the component to call a Backend_API endpoint
4. THE System SHALL implement all Database queries using parameterized statements
5. THE System SHALL implement all Cache operations in Backend_API routes or middleware

### Requirement 11: Theme Support

**User Story:** As a user, I want to switch between light and dark themes, so that I can use the system in different lighting conditions.

#### Acceptance Criteria

1. THE System SHALL support both light and dark color themes
2. WHEN a user toggles the theme, THE System SHALL apply the selected theme to all interface elements within 100 milliseconds
3. THE System SHALL persist the user's theme preference across sessions
4. WHEN the Display_Screen loads, THE System SHALL default to dark theme
5. WHEN Judge or Admin interfaces load, THE System SHALL default to light theme

### Requirement 12: Responsive Layout for Tablets

**User Story:** As a Judge using a tablet, I want the interface to adapt to my screen size, so that I can score efficiently.

#### Acceptance Criteria

1. WHEN the System detects a tablet viewport, THE System SHALL adjust layout elements to fit the screen width
2. THE System SHALL ensure all scoring controls are accessible without horizontal scrolling on tablet devices
3. WHEN a Judge uses a tablet in portrait orientation, THE System SHALL stack scoring dimension inputs vertically
4. WHEN a Judge uses a tablet in landscape orientation, THE System SHALL arrange scoring dimension inputs in a grid layout
5. THE System SHALL ensure touch targets for scoring inputs are at least 44 pixels in height on tablet devices

### Requirement 13: Loading State Feedback

**User Story:** As a user, I want to see loading indicators, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHEN a page is loading data, THE System SHALL display a skeleton screen matching the expected content layout
2. THE System SHALL not display blank white screens during data loading
3. WHEN a Score_Submission is processing, THE System SHALL display a loading indicator on the submit button
4. WHEN data loading completes, THE System SHALL replace skeleton elements with actual content within 50 milliseconds
5. THE System SHALL implement skeleton screens for athlete lists, score displays, and competition selections

### Requirement 14: User Feedback Notifications

**User Story:** As a user, I want to receive feedback on my actions, so that I know whether operations succeeded or failed.

#### Acceptance Criteria

1. WHEN a Judge successfully submits a score, THE System SHALL display a success notification using the Sonner toast library
2. WHEN an Admin successfully creates a Competition, THE System SHALL display a success notification using the Sonner toast library
3. WHEN an operation fails, THE System SHALL display an error notification with a descriptive message using the Sonner toast library
4. THE System SHALL not use browser native alert() or confirm() dialogs
5. WHEN a notification is displayed, THE System SHALL automatically dismiss it after 4 seconds

### Requirement 15: SEO Metadata Configuration

**User Story:** As a system administrator, I want proper page metadata, so that pages are identifiable in browsers and search engines.

#### Acceptance Criteria

1. THE System SHALL define a title and description metadata for every page route
2. WHEN a Display_Screen page loads, THE System SHALL set the page title to include "实时比分" (Real-time Scores)
3. WHEN a Judge scoring page loads, THE System SHALL set the page title to include "评分" (Scoring)
4. WHEN an Admin page loads, THE System SHALL set the page title to include "管理" (Management)
5. THE System SHALL include the application name "Scoring System" in all page titles

### Requirement 16: File Naming Convention

**User Story:** As a developer, I want consistent file naming, so that the codebase is maintainable.

#### Acceptance Criteria

1. THE System SHALL use kebab-case naming for all component files
2. THE System SHALL use kebab-case naming for all hook files
3. THE System SHALL use kebab-case naming for all API route files
4. THE System SHALL use kebab-case naming for all directory names
5. WHEN a new file is created, THE System SHALL validate that the filename follows kebab-case convention

### Requirement 17: Centralized API Configuration

**User Story:** As a developer, I want API endpoints defined in one location, so that changes are easy to manage.

#### Acceptance Criteria

1. THE System SHALL define all Backend_API endpoint URLs in a single configuration file
2. THE System SHALL locate the API configuration file at lib/api-config.ts
3. WHEN a frontend component needs to call an API, THE System SHALL require the component to import the endpoint URL from the configuration file
4. THE System SHALL not allow hardcoded API URLs in component files
5. THE System SHALL export API endpoint URLs as named constants from the configuration file

### Requirement 18: Hook-Based Data Fetching

**User Story:** As a developer, I want data fetching logic encapsulated in hooks, so that components remain clean and reusable.

#### Acceptance Criteria

1. THE System SHALL implement all data fetching logic in custom React hooks
2. THE System SHALL store all custom hooks in the hooks/ directory
3. WHEN a component needs data from the Backend_API, THE System SHALL require the component to use a custom hook
4. THE System SHALL implement hooks using SWR or React Query for caching and revalidation
5. THE System SHALL not allow direct fetch() or axios calls in component files

### Requirement 19: TypeScript Interface Definitions

**User Story:** As a developer, I want type definitions for all API responses, so that type safety is enforced.

#### Acceptance Criteria

1. THE System SHALL define TypeScript interfaces for all Backend_API response types
2. THE System SHALL store all interface definitions in the interface/ directory
3. WHEN the Backend_API returns JSON data, THE System SHALL have a corresponding TypeScript interface
4. THE System SHALL use interface definitions in both frontend hooks and Backend_API route handlers
5. THE System SHALL define interfaces for Competition, Athlete, Score_Submission, and Judge entities

### Requirement 20: WebSocket Connection Management

**User Story:** As a Display_Screen operator, I want reliable real-time updates, so that scores are always current.

#### Acceptance Criteria

1. WHEN a Display_Screen page loads, THE System SHALL establish a WebSocket connection to the WebSocket_Server
2. WHEN a WebSocket connection is lost, THE System SHALL attempt to reconnect every 3 seconds for up to 10 attempts
3. WHEN a WebSocket connection is re-established, THE System SHALL request the latest score data from the Backend_API
4. THE System SHALL not establish WebSocket connections on Admin or authentication pages
5. WHEN a Judge page loads, THE System SHALL establish a WebSocket connection for receiving score updates from other Judges
