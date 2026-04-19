-- Create events table for managing competition posters and branding
-- This table is separate from competitions and focuses on visual/branding aspects

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    poster_url VARCHAR(500),
    background_video_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for quick lookup of active events
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);

-- Insert a default event
INSERT INTO events (name, poster_url, status, description) VALUES 
('马六甲扯铃竞赛', '/default-event-poster.jpg', 'active', '2026年度扯铃比赛活动')
ON CONFLICT DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- Comments for documentation
COMMENT ON TABLE events IS 'Events table for managing competition branding and visual assets';
COMMENT ON COLUMN events.poster_url IS 'URL to the event poster image displayed on judge landing page';
COMMENT ON COLUMN events.background_video_url IS 'Optional background video URL for enhanced visuals';
COMMENT ON COLUMN events.status IS 'Only one event should be active at a time for judge landing page';