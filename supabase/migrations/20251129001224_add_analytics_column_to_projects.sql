/*
  # Add analytics column to projects table

  1. Changes
    - Add `analytics` (JSONB) column to `projects` table to store computed analytics data
    - Analytics will include:
      - surveyAverages (avg RSRP/SINR, quality bucket)
      - zoneSummaries (per-zone stats)
      - rankingOfWorstZones (sorted by signal strength)
      - histograms (RSRP and SINR distributions)
      - scorecard (quality scores)

  2. Notes
    - Column is nullable to support existing projects without analytics
    - Will be populated automatically when measurements are processed
*/

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT NULL;