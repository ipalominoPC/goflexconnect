/*
  # Create admin analytics function
  
  1. New Functions
    - `admin_get_analytics()` - Returns comprehensive analytics data
      - Only callable by approved admin emails
      - Returns JSON object with user, usage, ad metrics, and top users
      - Bypasses RLS with SECURITY DEFINER
      
  2. Security
    - Function has SECURITY DEFINER (runs with elevated privileges)
    - Checks caller is approved admin before returning data
    - If not admin, raises exception
    
  3. Data Returned
    - userSummary: Total users, new users, active users, plan distribution
    - usageSummary: Projects, measurements, speed tests, AI insights, heatmaps
    - adSummary: Impressions, clicks, CTR
    - topHeavyUsers: Top 10 users by activity (last 7 days)
*/

CREATE OR REPLACE FUNCTION admin_get_analytics()
RETURNS jsonb
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  caller_email text;
  result jsonb;
  
  -- Time boundaries
  now_ts timestamptz := now();
  last_24h timestamptz := now() - interval '24 hours';
  last_7d timestamptz := now() - interval '7 days';
  last_7d_ms bigint := extract(epoch from (now() - interval '7 days')) * 1000;
  last_24h_ms bigint := extract(epoch from (now() - interval '24 hours')) * 1000;
  
  -- User metrics
  total_users int;
  new_users_7d int;
  active_users_24h int;
  active_users_7d int;
  free_users int;
  pro_users int;
  overridden_pro int;
  
  -- Usage metrics
  projects_7d int;
  measurements_24h int;
  measurements_7d int;
  speed_tests_24h int;
  speed_tests_7d int;
  ai_insights_7d int;
  heatmap_exports_7d int;
  
  -- Ad metrics
  ad_impressions_7d int;
  ad_clicks_7d int;
  ad_ctr numeric;
  
  -- Top users
  top_users jsonb;
  
BEGIN
  -- Get the caller's email
  SELECT au.email INTO caller_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  -- Check if caller is an approved admin
  IF caller_email NOT IN (
    'ipalominopc@gmail.com',
    'isaac@goflexconnect.com',
    'isaac@goflexcloud.com',
    'dev@goflexconnect.com'
  ) THEN
    RAISE EXCEPTION 'User not allowed';
  END IF;

  -- USER SUMMARY --
  
  -- Total users
  SELECT COUNT(*) INTO total_users
  FROM auth.users;
  
  -- New users (last 7 days)
  SELECT COUNT(*) INTO new_users_7d
  FROM auth.users
  WHERE created_at >= last_7d;
  
  -- Active users (unique sessions)
  SELECT COUNT(DISTINCT user_id) INTO active_users_24h
  FROM session_events
  WHERE created_at >= last_24h
    AND event_type = 'session_started';
  
  SELECT COUNT(DISTINCT user_id) INTO active_users_7d
  FROM session_events
  WHERE created_at >= last_7d
    AND event_type = 'session_started';
  
  -- Plan distribution
  SELECT COUNT(*) INTO overridden_pro
  FROM profiles
  WHERE plan_override = 'PRO';
  
  pro_users := overridden_pro;
  free_users := total_users - pro_users;
  
  -- USAGE SUMMARY --
  
  -- Projects (last 7 days)
  SELECT COUNT(*) INTO projects_7d
  FROM projects
  WHERE created_at >= last_7d;
  
  -- Measurements
  SELECT COUNT(*) INTO measurements_24h
  FROM measurements
  WHERE timestamp >= last_24h_ms;
  
  SELECT COUNT(*) INTO measurements_7d
  FROM measurements
  WHERE timestamp >= last_7d_ms;
  
  -- Speed tests
  SELECT COUNT(*) INTO speed_tests_24h
  FROM speed_tests
  WHERE timestamp >= last_24h_ms;
  
  SELECT COUNT(*) INTO speed_tests_7d
  FROM speed_tests
  WHERE timestamp >= last_7d_ms;
  
  -- AI insights
  SELECT COUNT(*) INTO ai_insights_7d
  FROM usage_events
  WHERE created_at >= last_7d
    AND event_type = 'ai_insight_generated';
  
  -- Heatmap exports
  SELECT COUNT(*) INTO heatmap_exports_7d
  FROM usage_events
  WHERE created_at >= last_7d
    AND event_type = 'heatmap_exported';
  
  -- AD SUMMARY --
  
  -- Impressions
  SELECT COUNT(*) INTO ad_impressions_7d
  FROM ad_events
  WHERE created_at >= last_7d
    AND event_type = 'impression';
  
  -- Clicks
  SELECT COUNT(*) INTO ad_clicks_7d
  FROM ad_events
  WHERE created_at >= last_7d
    AND event_type = 'click';
  
  -- CTR
  IF ad_impressions_7d > 0 THEN
    ad_ctr := ROUND((ad_clicks_7d::numeric / ad_impressions_7d::numeric) * 100, 1);
  ELSE
    ad_ctr := 0;
  END IF;
  
  -- TOP HEAVY USERS --
  SELECT jsonb_agg(user_data ORDER BY total_activity DESC)
  INTO top_users
  FROM (
    SELECT 
      u.id as "userId",
      u.email,
      COALESCE(UPPER(p.plan_override), 'FREE') as plan,
      COALESCE(m.count, 0) as "measurementsLast7Days",
      COALESCE(s.count, 0) as "speedTestsLast7Days",
      COALESCE(pr.count, 0) as "projectsTotal",
      COALESCE(m.count, 0) + COALESCE(s.count, 0) as total_activity
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as count
      FROM measurements
      WHERE timestamp >= last_7d_ms
      GROUP BY user_id
    ) m ON m.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as count
      FROM speed_tests
      WHERE timestamp >= last_7d_ms
      GROUP BY user_id
    ) s ON s.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as count
      FROM projects
      GROUP BY user_id
    ) pr ON pr.user_id = u.id
    WHERE COALESCE(m.count, 0) + COALESCE(s.count, 0) > 0
    ORDER BY total_activity DESC
    LIMIT 10
  ) user_data;
  
  -- Build final result
  result := jsonb_build_object(
    'userSummary', jsonb_build_object(
      'totalUsers', total_users,
      'newUsersLast7Days', new_users_7d,
      'activeUsersLast24h', active_users_24h,
      'activeUsersLast7Days', active_users_7d,
      'freeUsersCount', free_users,
      'proUsersCount', pro_users,
      'overriddenProCount', overridden_pro
    ),
    'usageSummary', jsonb_build_object(
      'projectsLast7Days', projects_7d,
      'measurementsLast24h', measurements_24h,
      'measurementsLast7Days', measurements_7d,
      'speedTestsLast24h', speed_tests_24h,
      'speedTestsLast7Days', speed_tests_7d,
      'aiInsightsLast7Days', ai_insights_7d,
      'heatmapExportsLast7Days', heatmap_exports_7d
    ),
    'adSummary', jsonb_build_object(
      'impressionsLast7Days', ad_impressions_7d,
      'clicksLast7Days', ad_clicks_7d,
      'ctrLast7Days', ad_ctr
    ),
    'topHeavyUsers', COALESCE(top_users, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;