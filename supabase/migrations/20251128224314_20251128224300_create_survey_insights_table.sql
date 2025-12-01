/*
  # Create Survey Insights Table

  ## Overview
  This migration creates the survey_insights table for storing AI-generated analysis
  and recommendations for survey projects.

  ## New Tables

  ### `survey_insights`
  Stores AI-generated insights, summaries, and recommendations for survey projects
  - `id` (uuid, primary key) - Unique insight identifier
  - `survey_id` (uuid, foreign key) - References the projects table (survey/project)
  - `summary` (text) - AI-generated summary of survey findings
  - `recommendations` (text) - AI-generated recommendations for improvement
  - `problem_zones` (jsonb, nullable) - JSON data about identified problem areas
  - `improvement_notes` (jsonb, nullable) - JSON data with improvement suggestions
  - `created_at` (timestamptz) - When the insight was generated

  ## Security
  - Enable RLS on survey_insights table
  - Users can only access insights for their own projects
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Indexes
  - Index on `survey_id` for faster queries
  - Unique constraint on `survey_id` to ensure one insight per survey
*/

-- Create survey_insights table
CREATE TABLE IF NOT EXISTS survey_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  summary text NOT NULL,
  recommendations text NOT NULL,
  problem_zones jsonb,
  improvement_notes jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(survey_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_survey_insights_survey_id ON survey_insights(survey_id);

-- Enable Row Level Security
ALTER TABLE survey_insights ENABLE ROW LEVEL SECURITY;

-- Survey insights policies
CREATE POLICY "Users can view insights for own projects"
  ON survey_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = survey_insights.survey_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert insights for own projects"
  ON survey_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = survey_insights.survey_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update insights for own projects"
  ON survey_insights FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = survey_insights.survey_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = survey_insights.survey_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete insights for own projects"
  ON survey_insights FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = survey_insights.survey_id
      AND projects.user_id = auth.uid()
    )
  );
