/*
  # Fix Security Issues and Performance Optimizations

  This migration addresses multiple security and performance issues identified by Supabase advisor:

  ## 1. Missing Foreign Key Indexes
    - Add index on `admin_alerts.user_id`
    - Add index on `floors.user_id`

  ## 2. RLS Policy Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in ALL policies to prevent re-evaluation per row
    - This improves query performance at scale by evaluating auth once instead of per-row

  ## 3. Remove Unused Indexes
    - Drop 35+ unused indexes to reduce storage and maintenance overhead
    - Keeps only actively used indexes

  ## 4. Fix Multiple Permissive Policies
    - Consolidate duplicate permissive policies into single policies
    - Prevents policy confusion and improves performance

  ## 5. Fix Function Search Path (Security)
    - Set proper search_path for all functions to prevent SQL injection attacks

  ## Security Impact
    - High: Function search path vulnerabilities fixed
    - Medium: RLS policy performance improved (prevents DoS at scale)
    - Low: Unused indexes removed (maintenance improvement)
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_alerts_user_id ON public.admin_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_floors_user_id ON public.floors(user_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES TO REDUCE OVERHEAD
-- ============================================================================

DROP INDEX IF EXISTS idx_projects_user_date;
DROP INDEX IF EXISTS idx_speed_tests_created_at;
DROP INDEX IF EXISTS idx_speed_tests_user_timestamp;
DROP INDEX IF EXISTS idx_usage_events_user_id;
DROP INDEX IF EXISTS idx_usage_events_event_type;
DROP INDEX IF EXISTS idx_profiles_onboarding;
DROP INDEX IF EXISTS idx_profiles_plan_override;
DROP INDEX IF EXISTS idx_admin_reports_project_id;
DROP INDEX IF EXISTS idx_admin_reports_user_id;
DROP INDEX IF EXISTS idx_admin_alerts_type;
DROP INDEX IF EXISTS idx_admin_alerts_is_read;
DROP INDEX IF EXISTS idx_donor_alignment_user_id;
DROP INDEX IF EXISTS idx_survey_data_user_id;
DROP INDEX IF EXISTS idx_ad_events_created_at;
DROP INDEX IF EXISTS idx_ad_events_ad_id;
DROP INDEX IF EXISTS idx_ad_events_user_id;
DROP INDEX IF EXISTS idx_ad_events_placement;
DROP INDEX IF EXISTS idx_ad_events_event_type;
DROP INDEX IF EXISTS idx_ad_events_analytics;
DROP INDEX IF EXISTS idx_measurements_grid_position;
DROP INDEX IF EXISTS idx_measurements_with_photos;
DROP INDEX IF EXISTS idx_measurements_floor_id;
DROP INDEX IF EXISTS idx_measurements_user_timestamp;
DROP INDEX IF EXISTS idx_session_events_user_id;
DROP INDEX IF EXISTS idx_session_events_created_at;
DROP INDEX IF EXISTS idx_session_events_analytics;
DROP INDEX IF EXISTS idx_checklists_project_id;
DROP INDEX IF EXISTS idx_checklists_floor_id;
DROP INDEX IF EXISTS idx_plan_overrides_user_id;
DROP INDEX IF EXISTS idx_plan_overrides_plan_id;
DROP INDEX IF EXISTS idx_plan_overrides_granted_by;
DROP INDEX IF EXISTS idx_support_tickets_user_id;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_category;
DROP INDEX IF EXISTS idx_donor_alignments_project_id;
DROP INDEX IF EXISTS idx_donor_alignments_user_id;

-- ============================================================================
-- 3. FIX RLS POLICIES - OPTIMIZE auth.uid() CALLS
-- ============================================================================

-- PROJECTS TABLE
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- MEASUREMENTS TABLE
DROP POLICY IF EXISTS "Users can view own measurements" ON public.measurements;
DROP POLICY IF EXISTS "Users can insert own measurements" ON public.measurements;
DROP POLICY IF EXISTS "Users can update own measurements" ON public.measurements;
DROP POLICY IF EXISTS "Users can delete own measurements" ON public.measurements;

CREATE POLICY "Users can view own measurements"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own measurements"
  ON public.measurements FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own measurements"
  ON public.measurements FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- SPEED_TESTS TABLE - Also fix multiple permissive policies
DROP POLICY IF EXISTS "Users can view own speed tests" ON public.speed_tests;
DROP POLICY IF EXISTS "Users can insert own speed tests" ON public.speed_tests;
DROP POLICY IF EXISTS "Allow read all speed tests" ON public.speed_tests;
DROP POLICY IF EXISTS "Allow insert speed tests" ON public.speed_tests;

CREATE POLICY "Users can view own speed tests"
  ON public.speed_tests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own speed tests"
  ON public.speed_tests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- FLOORS TABLE
DROP POLICY IF EXISTS "Users can view own floors" ON public.floors;
DROP POLICY IF EXISTS "Users can insert own floors" ON public.floors;
DROP POLICY IF EXISTS "Users can update own floors" ON public.floors;
DROP POLICY IF EXISTS "Users can delete own floors" ON public.floors;

CREATE POLICY "Users can view own floors"
  ON public.floors FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own floors"
  ON public.floors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own floors"
  ON public.floors FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own floors"
  ON public.floors FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- COMMISSIONING_CHECKLISTS TABLE
DROP POLICY IF EXISTS "Users can view own checklists" ON public.commissioning_checklists;
DROP POLICY IF EXISTS "Users can insert own checklists" ON public.commissioning_checklists;
DROP POLICY IF EXISTS "Users can update own checklists" ON public.commissioning_checklists;
DROP POLICY IF EXISTS "Users can delete own checklists" ON public.commissioning_checklists;

CREATE POLICY "Users can view own checklists"
  ON public.commissioning_checklists FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own checklists"
  ON public.commissioning_checklists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own checklists"
  ON public.commissioning_checklists FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own checklists"
  ON public.commissioning_checklists FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- SURVEY_INSIGHTS TABLE
DROP POLICY IF EXISTS "Users can view insights for own projects" ON public.survey_insights;
DROP POLICY IF EXISTS "Users can insert insights for own projects" ON public.survey_insights;
DROP POLICY IF EXISTS "Users can update insights for own projects" ON public.survey_insights;
DROP POLICY IF EXISTS "Users can delete insights for own projects" ON public.survey_insights;

CREATE POLICY "Users can view insights for own projects"
  ON public.survey_insights FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.measurements m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = survey_insights.survey_id
    AND p.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can insert insights for own projects"
  ON public.survey_insights FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.measurements m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = survey_insights.survey_id
    AND p.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update insights for own projects"
  ON public.survey_insights FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.measurements m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = survey_insights.survey_id
    AND p.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.measurements m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = survey_insights.survey_id
    AND p.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete insights for own projects"
  ON public.survey_insights FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.measurements m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = survey_insights.survey_id
    AND p.user_id = (select auth.uid())
  ));

-- AD_EVENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can insert ad events" ON public.ad_events;

CREATE POLICY "Authenticated users can insert ad events"
  ON public.ad_events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- SESSION_EVENTS TABLE
DROP POLICY IF EXISTS "Users can insert own session events" ON public.session_events;

CREATE POLICY "Users can insert own session events"
  ON public.session_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- USAGE_EVENTS TABLE
DROP POLICY IF EXISTS "usage_events_user_insert" ON public.usage_events;
DROP POLICY IF EXISTS "usage_events_user_select" ON public.usage_events;
DROP POLICY IF EXISTS "usage_events_user_delete_tests" ON public.usage_events;

CREATE POLICY "usage_events_user_insert"
  ON public.usage_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "usage_events_user_select"
  ON public.usage_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "usage_events_user_delete_tests"
  ON public.usage_events FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) AND is_test = true);

-- PLAN_OVERRIDES TABLE - Fix multiple permissive policies
DROP POLICY IF EXISTS "plan_overrides_user_select" ON public.plan_overrides;
DROP POLICY IF EXISTS "plan_overrides_admin_all" ON public.plan_overrides;
DROP POLICY IF EXISTS "plan_overrides_select" ON public.plan_overrides;

CREATE POLICY "plan_overrides_select"
  ON public.plan_overrides FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

CREATE POLICY "plan_overrides_admin_all"
  ON public.plan_overrides FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

-- PROFILES TABLE - Fix multiple permissive policies
DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_overrides" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_user_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "profiles_user_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    id = (select auth.uid())
    OR (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

-- ADMIN_REPORTS TABLE
DROP POLICY IF EXISTS "Users can insert own reports" ON public.admin_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.admin_reports;

CREATE POLICY "Users can view own reports"
  ON public.admin_reports FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own reports"
  ON public.admin_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- SUPPORT_TICKETS TABLE - Fix multiple permissive policies
DROP POLICY IF EXISTS "support_tickets_user_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_user_select" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_admin_select" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_admin_update" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_select" ON public.support_tickets;

CREATE POLICY "support_tickets_user_insert"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "support_tickets_select"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

CREATE POLICY "support_tickets_admin_update"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

-- DONOR_ALIGNMENT TABLE
DROP POLICY IF EXISTS "Users can view own donor alignment data" ON public.donor_alignment;
DROP POLICY IF EXISTS "Users can insert own donor alignment data" ON public.donor_alignment;
DROP POLICY IF EXISTS "Users can update own donor alignment data" ON public.donor_alignment;
DROP POLICY IF EXISTS "Users can delete own donor alignment data" ON public.donor_alignment;

CREATE POLICY "Users can view own donor alignment data"
  ON public.donor_alignment FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own donor alignment data"
  ON public.donor_alignment FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own donor alignment data"
  ON public.donor_alignment FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own donor alignment data"
  ON public.donor_alignment FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- DONOR_ALIGNMENTS TABLE - Fix multiple permissive policies
DROP POLICY IF EXISTS "Users can view own donor alignments" ON public.donor_alignments;
DROP POLICY IF EXISTS "Users can insert own donor alignments" ON public.donor_alignments;
DROP POLICY IF EXISTS "Users can update own donor alignments" ON public.donor_alignments;
DROP POLICY IF EXISTS "Users can delete own donor alignments" ON public.donor_alignments;
DROP POLICY IF EXISTS "Admins can view all donor alignments" ON public.donor_alignments;
DROP POLICY IF EXISTS "donor_alignments_select" ON public.donor_alignments;

CREATE POLICY "donor_alignments_select"
  ON public.donor_alignments FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

CREATE POLICY "Users can insert own donor alignments"
  ON public.donor_alignments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own donor alignments"
  ON public.donor_alignments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own donor alignments"
  ON public.donor_alignments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- SURVEY_DATA TABLE - Fix multiple permissive policies
DROP POLICY IF EXISTS "Users can view own survey data" ON public.survey_data;
DROP POLICY IF EXISTS "Users can insert own survey data" ON public.survey_data;
DROP POLICY IF EXISTS "Users can update own survey data" ON public.survey_data;
DROP POLICY IF EXISTS "Users can delete own survey data" ON public.survey_data;
DROP POLICY IF EXISTS "Admins can view all survey data" ON public.survey_data;
DROP POLICY IF EXISTS "survey_data_select" ON public.survey_data;

CREATE POLICY "survey_data_select"
  ON public.survey_data FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (SELECT email FROM auth.users WHERE id = (select auth.uid())) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

CREATE POLICY "Users can insert own survey data"
  ON public.survey_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own survey data"
  ON public.survey_data FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own survey data"
  ON public.survey_data FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATHS (SECURITY - Prevents SQL Injection)
-- ============================================================================

ALTER FUNCTION public.update_plan_overrides_updated_at() SET search_path = '';
ALTER FUNCTION public.get_all_users_admin() SET search_path = '';
ALTER FUNCTION public.update_profiles_updated_at() SET search_path = '';
ALTER FUNCTION public.create_user_profile() SET search_path = '';
ALTER FUNCTION public.admin_get_analytics() SET search_path = '';
ALTER FUNCTION public.update_app_settings_updated_at() SET search_path = '';
ALTER FUNCTION public.admin_get_users_with_plans() SET search_path = '';
ALTER FUNCTION public.update_support_tickets_updated_at() SET search_path = '';
ALTER FUNCTION public.admin_get_support_tickets(text, text, text) SET search_path = '';
