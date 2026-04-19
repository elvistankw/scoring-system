// Event interface definitions
// For managing competition branding and visual assets

export interface Event {
  id: number;
  name: string;
  poster_url?: string | null;
  background_video_url?: string | null;
  status: 'active' | 'inactive';
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateEventRequest {
  name: string;
  poster_url?: string;
  background_video_url?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateEventRequest {
  name?: string;
  poster_url?: string;
  background_video_url?: string;
  status?: 'active' | 'inactive';
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface EventResponse {
  success: boolean;
  data: Event;
  message?: string;
}

export interface EventsListResponse {
  success: boolean;
  count: number;
  data: Event[];
}