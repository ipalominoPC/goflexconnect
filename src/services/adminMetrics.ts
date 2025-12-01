/**
 * Admin metrics service for fetching real analytics data from Supabase
 * Used exclusively by the Admin Dashboard
 */

import { supabase } from './supabaseClient';

export interface AdminSummaryStats {
  newUsersLast7Days: number;
  activeUsersLast7Days: number;
  newProjectsLast7Days: number;
  surveysLast7Days: number;
}

export interface DailyTrend {
  date: string;
  newUsers: number;
  newProjects: number;
  surveysRun: number;
}

export interface SiteHealthData {
  projectId: string;
  projectName: string;
  location?: string;
  measurementCount: number;
  avgRsrp: number;
  avgSinr: number;
  qualityBucket: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'NoService';
  poorPercentage: number;
  lastUpdated: string;
}

/**
 * Fetch summary statistics for admin dashboard top cards
 */
export async function fetchAdminSummaryStats(): Promise<AdminSummaryStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  try {
    // Fetch new users (last 7 days) from profiles table
    const { count: newUsersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgoISO);

    if (usersError) throw usersError;

    // Fetch active users (distinct user_ids from session_events last 7 days)
    const { data: sessionData, error: sessionError } = await supabase
      .from('session_events')
      .select('user_id')
      .gte('created_at', sevenDaysAgoISO);

    if (sessionError) throw sessionError;

    const uniqueUserIds = new Set(sessionData?.map((s) => s.user_id) || []);
    const activeUsersCount = uniqueUserIds.size;

    // Fetch new projects (last 7 days)
    const { count: projectsCount, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgoISO);

    if (projectsError) throw projectsError;

    // Fetch surveys run (distinct projects with measurements in last 7 days)
    const { data: measurementData, error: measurementsError } = await supabase
      .from('measurements')
      .select('project_id')
      .gte('created_at', sevenDaysAgoISO);

    if (measurementsError) throw measurementsError;

    const uniqueProjectsWithSurveys = new Set(
      measurementData?.map((m) => m.project_id) || []
    );
    const surveysCount = uniqueProjectsWithSurveys.size;

    return {
      newUsersLast7Days: newUsersCount || 0,
      activeUsersLast7Days: activeUsersCount,
      newProjectsLast7Days: projectsCount || 0,
      surveysLast7Days: surveysCount,
    };
  } catch (error) {
    console.error('Failed to fetch admin summary stats:', error);
    return {
      newUsersLast7Days: 0,
      activeUsersLast7Days: 0,
      newProjectsLast7Days: 0,
      surveysLast7Days: 0,
    };
  }
}

/**
 * Fetch daily trends for the last 30 days
 */
export async function fetchDailyTrends(): Promise<DailyTrend[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  try {
    // Fetch all users created in last 30 days
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoISO)
      .order('created_at', { ascending: true });

    if (usersError) throw usersError;

    // Fetch all projects created in last 30 days
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoISO)
      .order('created_at', { ascending: true });

    if (projectsError) throw projectsError;

    // Fetch all measurements in last 30 days
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('created_at, project_id')
      .gte('created_at', thirtyDaysAgoISO)
      .order('created_at', { ascending: true });

    if (measurementsError) throw measurementsError;

    // Group by date
    const trendsMap = new Map<string, { newUsers: number; newProjects: number; projectsSet: Set<string> }>();

    // Initialize all 30 days with zero counts
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateKey = date.toISOString().split('T')[0];
      trendsMap.set(dateKey, { newUsers: 0, newProjects: 0, projectsSet: new Set() });
    }

    // Aggregate users
    users?.forEach((user) => {
      const dateKey = new Date(user.created_at).toISOString().split('T')[0];
      const entry = trendsMap.get(dateKey);
      if (entry) {
        entry.newUsers++;
      }
    });

    // Aggregate projects
    projects?.forEach((project) => {
      const dateKey = new Date(project.created_at).toISOString().split('T')[0];
      const entry = trendsMap.get(dateKey);
      if (entry) {
        entry.newProjects++;
      }
    });

    // Aggregate surveys (unique projects per day)
    measurements?.forEach((m) => {
      const dateKey = new Date(m.created_at).toISOString().split('T')[0];
      const entry = trendsMap.get(dateKey);
      if (entry && m.project_id) {
        entry.projectsSet.add(m.project_id);
      }
    });

    // Convert to array
    const trends: DailyTrend[] = [];
    trendsMap.forEach((value, date) => {
      trends.push({
        date,
        newUsers: value.newUsers,
        newProjects: value.newProjects,
        surveysRun: value.projectsSet.size,
      });
    });

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Failed to fetch daily trends:', error);
    return [];
  }
}

/**
 * Fetch sites needing attention based on signal health
 */
export async function fetchSitesNeedingAttention(): Promise<SiteHealthData[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  try {
    // Fetch all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, location');

    if (projectsError) throw projectsError;
    if (!projects || projects.length === 0) return [];

    // Fetch measurements for last 30 days
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('project_id, rsrp, sinr, created_at')
      .gte('created_at', thirtyDaysAgoISO);

    if (measurementsError) throw measurementsError;

    // Group measurements by project
    const projectMeasurementsMap = new Map<string, any[]>();
    measurements?.forEach((m) => {
      if (!projectMeasurementsMap.has(m.project_id)) {
        projectMeasurementsMap.set(m.project_id, []);
      }
      projectMeasurementsMap.get(m.project_id)!.push(m);
    });

    // Calculate health for each project
    const sitesHealth: SiteHealthData[] = [];

    projects.forEach((project) => {
      const projectMeasurements = projectMeasurementsMap.get(project.id) || [];

      if (projectMeasurements.length === 0) return; // Skip projects with no recent measurements

      // Calculate averages
      const validMeasurements = projectMeasurements.filter(m => m.rsrp != null && m.sinr != null);
      if (validMeasurements.length === 0) return;

      const avgRsrp = validMeasurements.reduce((sum, m) => sum + m.rsrp, 0) / validMeasurements.length;
      const avgSinr = validMeasurements.reduce((sum, m) => sum + m.sinr, 0) / validMeasurements.length;

      // Calculate poor percentage (RSRP < -100 or SINR < 0)
      const poorCount = validMeasurements.filter(m => m.rsrp < -100 || m.sinr < 0).length;
      const poorPercentage = (poorCount / validMeasurements.length) * 100;

      // Determine quality bucket
      let qualityBucket: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'NoService' = 'Good';

      if (avgRsrp <= -120) {
        qualityBucket = 'NoService';
      } else if (avgRsrp >= -90 && avgSinr >= 10) {
        qualityBucket = 'Excellent';
      } else if (avgRsrp >= -100 && avgSinr >= 5) {
        qualityBucket = 'Good';
      } else if (avgRsrp >= -110 && avgSinr >= 0) {
        qualityBucket = 'Fair';
      } else {
        qualityBucket = 'Poor';
      }

      // Only include sites that need attention (Fair, Poor, or NoService)
      if (qualityBucket === 'Fair' || qualityBucket === 'Poor' || qualityBucket === 'NoService' || poorPercentage >= 20) {
        const lastMeasurement = projectMeasurements.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        sitesHealth.push({
          projectId: project.id,
          projectName: project.name,
          location: project.location,
          measurementCount: validMeasurements.length,
          avgRsrp,
          avgSinr,
          qualityBucket,
          poorPercentage,
          lastUpdated: lastMeasurement.created_at,
        });
      }
    });

    // Sort by worst quality first
    const qualityOrder = { NoService: 0, Poor: 1, Fair: 2, Good: 3, Excellent: 4 };
    return sitesHealth.sort((a, b) => {
      const orderDiff = qualityOrder[a.qualityBucket] - qualityOrder[b.qualityBucket];
      if (orderDiff !== 0) return orderDiff;
      return b.poorPercentage - a.poorPercentage; // Then by poor percentage
    });
  } catch (error) {
    console.error('Failed to fetch sites needing attention:', error);
    return [];
  }
}
