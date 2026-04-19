// Centralized API configuration
// Requirements: 10.3, 17.1, 17.2, 17.3, 17.4, 17.5

// Base API URL - defaults to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// WebSocket URL - defaults to localhost for development
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    verify: `${API_BASE_URL}/api/auth/verify`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    google: `${API_BASE_URL}/api/auth/google`,
  },

  // Competition endpoints
  competitions: {
    list: `${API_BASE_URL}/api/competitions`,
    public: `${API_BASE_URL}/api/competitions/public`, // Public endpoint for display components
    create: `${API_BASE_URL}/api/competitions`,
    detail: (id: number) => `${API_BASE_URL}/api/competitions/${id}`,
    update: (id: number) => `${API_BASE_URL}/api/competitions/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/competitions/${id}`,
    athletes: (id: number) => `${API_BASE_URL}/api/competitions/${id}/athletes`,
    addAthlete: (id: number) => `${API_BASE_URL}/api/competitions/${id}/athletes`,
    removeAthlete: (competitionId: number, athleteId: number) => 
      `${API_BASE_URL}/api/competitions/${competitionId}/athletes/${athleteId}`,
    exportExcel: (id: number) => `${API_BASE_URL}/api/competitions/${id}/export-excel`,
    byRegion: (region: string) => `${API_BASE_URL}/api/competitions?region=${region}`,
    byStatus: (status: string) => `${API_BASE_URL}/api/competitions?status=${status}`,
    publicByStatus: (status: string) => `${API_BASE_URL}/api/competitions/public?status=${status}`,
    judgeScoringStatus: `${API_BASE_URL}/api/competitions/judge-scoring-status`,
  },

  // Athlete endpoints
  athletes: {
    list: `${API_BASE_URL}/api/athletes`,
    create: `${API_BASE_URL}/api/athletes`,
    detail: (id: number) => `${API_BASE_URL}/api/athletes/${id}`,
    update: (id: number) => `${API_BASE_URL}/api/athletes/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/athletes/${id}`,
    competitions: (id: number) => `${API_BASE_URL}/api/athletes/${id}/competitions`,
  },

  // Judge endpoints
  judges: {
    // Public judge identity selection (no authentication required)
    available: `${API_BASE_URL}/api/judges/available`,
    selectIdentity: `${API_BASE_URL}/api/judges/select-identity`,
    currentSession: (deviceId: string) => `${API_BASE_URL}/api/judges/current-session?deviceId=${deviceId}`,
    endSession: `${API_BASE_URL}/api/judges/end-session`,
    extendSession: `${API_BASE_URL}/api/judges/extend-session`,
    
    // Judge management (Admin authentication required)
    list: `${API_BASE_URL}/api/judges`,
    create: `${API_BASE_URL}/api/judges`,
    detail: (id: number) => `${API_BASE_URL}/api/judges/${id}`,
    update: (id: number) => `${API_BASE_URL}/api/judges/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/judges/${id}`,
    toggleActive: (id: number) => `${API_BASE_URL}/api/judges/${id}/toggle-active`,
    stats: `${API_BASE_URL}/api/judges/stats`,
  },

  // Events endpoints
  events: {
    active: `${API_BASE_URL}/api/events/active`,
    list: `${API_BASE_URL}/api/events`,
    create: `${API_BASE_URL}/api/events`,
    detail: (id: number) => `${API_BASE_URL}/api/events/${id}`,
    update: (id: number) => `${API_BASE_URL}/api/events/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/events/${id}`,
    activate: (id: number) => `${API_BASE_URL}/api/events/${id}/activate`,
  },

  // Score endpoints
  scores: {
    submit: `${API_BASE_URL}/api/scores/submit`,
    batchSubmit: `${API_BASE_URL}/api/scores/batch-submit`,
    partialUpdate: `${API_BASE_URL}/api/scores/partial-update`,
    list: `${API_BASE_URL}/api/scores`,
    update: (scoreId: number) => `${API_BASE_URL}/api/scores/${scoreId}`,
    delete: (scoreId: number) => `${API_BASE_URL}/api/scores/${scoreId}`,
    byCompetition: (competitionId: number) => 
      `${API_BASE_URL}/api/scores?competition_id=${competitionId}`,
    byAthlete: (athleteId: number) => 
      `${API_BASE_URL}/api/scores?athlete_id=${athleteId}`,
    byJudge: (judgeId: number) => 
      `${API_BASE_URL}/api/scores?judge_id=${judgeId}`,
    latest: (competitionId: number) => 
      `${API_BASE_URL}/api/scores/latest?competition_id=${competitionId}`,
  },

  // Display endpoints (for real-time scoreboard)
  display: {
    scoreboard: (competitionId: number) => 
      `${API_BASE_URL}/api/scores/competition/${competitionId}`,
    rankings: (competitionId: number) => 
      `${API_BASE_URL}/api/scores/rankings/${competitionId}`,
    latestScores: (competitionId: number) => 
      `${API_BASE_URL}/api/scores/latest/${competitionId}`,
  },

  // Google integration endpoints
  google: {
    // Google Auth
    authUrl: `${API_BASE_URL}/api/auth/google/auth-url`,
    authStatus: `${API_BASE_URL}/api/auth/google/status`,
    authCallback: `${API_BASE_URL}/api/auth/google/callback`,

    // Google Sheets
    exportToSheets: (competitionId: number) => 
      `${API_BASE_URL}/api/google/sheets/export/${competitionId}`,
    exportHistory: (params?: { competition_id?: number; export_type?: string }) => {
      const query = params ? `?${buildQueryString(params as any)}` : '';
      return `${API_BASE_URL}/api/google/sheets/history${query}`;
    },
    deleteExport: (exportId: number) => 
      `${API_BASE_URL}/api/google/sheets/history/${exportId}`,

    // Google Drive
    uploadToDrive: `${API_BASE_URL}/api/google/drive/upload`,
    createFolder: `${API_BASE_URL}/api/google/drive/folder`,
    listFiles: (params?: { folder_id?: string; mime_type?: string; page_size?: number }) => {
      const query = params ? `?${buildQueryString(params as any)}` : '';
      return `${API_BASE_URL}/api/google/drive/files${query}`;
    },
    deleteFile: (fileId: string) => 
      `${API_BASE_URL}/api/google/drive/files/${fileId}`,
    shareFile: (fileId: string) => 
      `${API_BASE_URL}/api/google/drive/files/${fileId}/share`,
    fileMetadata: (fileId: string) => 
      `${API_BASE_URL}/api/google/drive/files/${fileId}/metadata`,
    downloadFile: (fileId: string) => 
      `${API_BASE_URL}/api/google/drive/files/${fileId}/download`,
  },
} as const;

// WebSocket event names
export const WS_EVENTS = {
  // Client events
  connect: 'connect',
  disconnect: 'disconnect',
  joinCompetition: 'join-competition',
  leaveCompetition: 'leave-competition',

  // Server events
  scoreUpdate: 'score-update',
  competitionUpdate: 'competition-update',
  error: 'error',
  reconnect: 'reconnect',
} as const;

// HTTP request configuration
export const REQUEST_CONFIG = {
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// Helper function to get auth headers
export function getAuthHeaders(token: string): HeadersInit {
  return {
    ...REQUEST_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
}

// Helper function to get judge session headers
export function getJudgeSessionHeaders(sessionId: string, deviceId: string): HeadersInit {
  return {
    ...REQUEST_CONFIG.headers,
    'x-judge-session-id': sessionId,
    'x-device-id': deviceId,
  };
}

// Helper function to build query string
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
}
