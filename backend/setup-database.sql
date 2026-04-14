-- Setup script for Realtime Scoring System
-- This script creates the database and runs the initial migration

-- Create database (run this as postgres superuser)
-- Note: You may need to disconnect from the 'scoring' database first if it exists
DROP DATABASE IF EXISTS scoring;
CREATE DATABASE scoring;

-- Connect to the new database
\c scoring

-- Run the initial schema migration
\i migrations/001_initial_schema.sql

-- Verify tables were created
\dt

-- Show indexes
\di

-- Success message
SELECT 'Database setup completed successfully!' as status;
