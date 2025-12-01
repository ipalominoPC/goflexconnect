/*
  # Add indexes for admin analytics queries
  
  1. Purpose
    - Optimize admin analytics queries for performance
    - Support time-based filtering and aggregations
    - Enable efficient user activity tracking
    
  2. Indexes Added
    - usage_events: (user_id, created_at, event_type)
    - ad_events: (created_at, event_type)
    - session_events: (user_id, created_at, event_type)
    - projects: (user_id, created_at)
    - measurements: (user_id, timestamp)
    - speed_tests: (user_id, timestamp)
    
  3. Notes
    - All indexes support efficient filtering by date ranges
    - Composite indexes optimize common query patterns
    - Only created if they don't already exist
*/

-- Index for usage_events analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_events_analytics 
  ON usage_events(user_id, created_at, event_type);

-- Index for ad_events analytics queries
CREATE INDEX IF NOT EXISTS idx_ad_events_analytics 
  ON ad_events(created_at, event_type);

-- Index for session_events analytics queries (active users tracking)
CREATE INDEX IF NOT EXISTS idx_session_events_analytics 
  ON session_events(user_id, created_at, event_type);

-- Index for projects by user and date
CREATE INDEX IF NOT EXISTS idx_projects_user_date 
  ON projects(user_id, created_at);

-- Index for measurements by user and timestamp
CREATE INDEX IF NOT EXISTS idx_measurements_user_timestamp 
  ON measurements(user_id, timestamp);

-- Index for speed_tests by user and timestamp
CREATE INDEX IF NOT EXISTS idx_speed_tests_user_timestamp 
  ON speed_tests(user_id, timestamp);
