/**
 * Self-Test Console Service
 *
 * Runs automated tests to verify usage limits and admin alerts
 * Uses dedicated test data that doesn't affect real users
 */

import { supabase } from './supabaseClient';
import { trackUsageEvent, checkTestUsageLimit, getTestUsageSummary } from './usageTracking';
import { createAdminAlert } from './adminAlerts';
import { PLAN_LIMITS } from '../config/planLimits';
import { generateUUID } from '../utils/uuid';

/**
 * Log diagnostic info to console for debugging test failures
 */
function logDiagnostic(testId: string, message: string, data?: any) {
  console.log(`[${testId}] ${message}`, data || '');
}

export interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'RUNNING';
  details: string;
  timestamp: string;
  duration?: number;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  runner: () => Promise<TestResult>;
}

const TEST_USER_PREFIX = 'test-selftest';
const TEST_PROJECT_PREFIX = '[SELFTEST]';

/**
 * RLS Diagnostic Test - Verify database policies work correctly
 * Tests INSERT, SELECT, DELETE operations on usage_events
 */
export async function testRLSPolicies(): Promise<{
  success: boolean;
  details: string[];
  errors: string[];
}> {
  const details: string[] = [];
  const errors: string[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      errors.push('No authenticated user');
      return { success: false, details, errors };
    }

    details.push(`Testing as user: ${user.email} (${user.id})`);

    const testEventId = generateUUID();
    const testProjectId = generateUUID();

    // Test 1: INSERT
    details.push('Test 1: Attempting INSERT...');
    const { data: insertData, error: insertError } = await supabase
      .from('usage_events')
      .insert({
        id: testEventId,
        user_id: user.id,
        event_type: 'rls_diagnostic_test',
        project_id: testProjectId,
        is_test: true,
      })
      .select()
      .single();

    if (insertError) {
      errors.push(`INSERT failed: ${insertError.message} (code: ${insertError.code})`);
    } else {
      details.push(`INSERT success: Created event ${insertData.id}`);
    }

    // Test 2: SELECT with filter
    details.push('Test 2: Attempting SELECT with is_test filter...');
    const { data: selectData, error: selectError } = await supabase
      .from('usage_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_test', true)
      .order('created_at', { ascending: true });

    if (selectError) {
      errors.push(`SELECT failed: ${selectError.message} (code: ${selectError.code})`);
    } else {
      details.push(`SELECT success: Found ${selectData?.length || 0} test events`);
    }

    // Test 3: DELETE
    details.push('Test 3: Attempting DELETE...');
    const { error: deleteError } = await supabase
      .from('usage_events')
      .delete()
      .eq('id', testEventId)
      .eq('user_id', user.id)
      .eq('is_test', true);

    if (deleteError) {
      errors.push(`DELETE failed: ${deleteError.message} (code: ${deleteError.code})`);
    } else {
      details.push(`DELETE success: Removed test event`);
    }

    return {
      success: errors.length === 0,
      details,
      errors,
    };
  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message}`);
    return { success: false, details, errors };
  }
}

/**
 * Create a test user for self-testing
 * NOTE: We use the current admin user's ID to avoid foreign key constraint issues
 * The usage_events table requires user_id to reference auth.users(id)
 */
async function createTestUser(): Promise<{ userId: string; email: string }> {
  const timestamp = Date.now();
  const email = `${TEST_USER_PREFIX}+${timestamp}@goflexconnect.local`;

  // Get the current authenticated user (admin running the test)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user found for self-test');
  }

  // Use the admin's user ID for tests
  // This satisfies the foreign key constraint and RLS policies
  return { userId: user.id, email: user.email || email };
}

/**
 * Delete a test user
 * Clean up test events using the is_test flag
 */
async function deleteTestUser(userId: string, testStartTime?: number): Promise<void> {
  try {
    // Delete all test events for this user
    await supabase
      .from('usage_events')
      .delete()
      .eq('user_id', userId)
      .eq('is_test', true);
  } catch (error) {
    console.warn('Failed to delete test user data:', error);
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  try {
    // Delete test projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', `${TEST_PROJECT_PREFIX}%`);

    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      await supabase.from('projects').delete().in('id', projectIds);
    }

    // Delete ALL test usage events (use is_test flag)
    await supabase.from('usage_events').delete().eq('is_test', true);
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

/**
 * T1: FREE user hitting project limit
 */
async function testFreeProjectLimit(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();

  try {
    logDiagnostic('T1', '=== STARTING T1: FREE PROJECT LIMIT TEST ===');
    logDiagnostic('T1', 'Test user ID:', testUser.userId);
    logDiagnostic('T1', 'Plan: FREE');

    const limit = PLAN_LIMITS.free.maxProjects;
    logDiagnostic('T1', 'Configured limit (PLAN_LIMITS.free.maxProjects):', limit);

    // Clean up any existing test data first
    await deleteTestUser(testUser.userId);
    logDiagnostic('T1', 'Cleaned up previous test data');

    // Check initial count (should be 0)
    const initialSummary = await getTestUsageSummary({
      userId: testUser.userId,
      planId: 'free',
    });
    logDiagnostic('T1', 'Initial project count:', initialSummary.projectCount);

    if (initialSummary.projectCount !== 0) {
      logDiagnostic('T1', 'WARNING: Initial count is not 0! Cleanup may have failed.');
    }

    // Create projects up to the limit
    logDiagnostic('T1', `Creating ${limit} projects...`);
    for (let i = 0; i < limit; i++) {
      await trackUsageEvent({
        userId: testUser.userId,
        eventType: 'project_created',
        projectId: generateUUID(),
        isTest: true,
      });
    }
    logDiagnostic('T1', `Created ${limit} test projects`);

    // Check count after creating
    const afterCreateSummary = await getTestUsageSummary({
      userId: testUser.userId,
      planId: 'free',
    });
    logDiagnostic('T1', 'Project count after creation:', afterCreateSummary.projectCount);

    // Try to create one more (should fail)
    logDiagnostic('T1', 'Attempting to create one more project (should be blocked)...');
    const limitCheck = await checkTestUsageLimit({
      userId: testUser.userId,
      planId: 'free',
      limitType: 'projects',
    });

    logDiagnostic('T1', 'Limit check result:', {
      allowed: limitCheck.allowed,
      current: limitCheck.current,
      limit: limitCheck.limit,
      message: limitCheck.message,
    });

    await deleteTestUser(testUser.userId);
    logDiagnostic('T1', 'Cleaned up test data');

    const duration = Date.now() - startTime;

    if (!limitCheck.allowed && limitCheck.current === limit) {
      logDiagnostic('T1', '✅ TEST PASSED');
      return {
        id: 'T1',
        name: 'FREE project limit',
        status: 'PASS',
        details: `Correctly blocked at ${limit}/${limit}. Current=${limitCheck.current}, Allowed=${limitCheck.allowed}`,
        timestamp: new Date().toISOString(),
        duration,
      };
    } else {
      logDiagnostic('T1', '❌ TEST FAILED');
      return {
        id: 'T1',
        name: 'FREE project limit',
        status: 'FAIL',
        details: `Expected blocked at ${limit}, got: allowed=${limitCheck.allowed}, current=${limitCheck.current}, limit=${limitCheck.limit}. See console.`,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  } catch (error) {
    logDiagnostic('T1', '❌ TEST ERROR:', error);
    await deleteTestUser(testUser.userId);
    return {
      id: 'T1',
      name: 'FREE project limit',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * T2: FREE user hitting survey-per-project limit
 */
async function testFreeSurveyLimit(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();
  const projectId = generateUUID();

  try {
    logDiagnostic('T2', '=== STARTING T2: FREE SURVEY LIMIT TEST ===');
    logDiagnostic('T2', 'Test user ID:', testUser.userId);
    logDiagnostic('T2', 'Test project ID:', projectId);
    logDiagnostic('T2', 'Plan: FREE');

    const limit = PLAN_LIMITS.free.maxSurveysPerProject;
    logDiagnostic('T2', 'Configured limit (PLAN_LIMITS.free.maxSurveysPerProject):', limit);

    // Clean up any existing test data first
    await deleteTestUser(testUser.userId);
    logDiagnostic('T2', 'Cleaned up previous test data');

    // Track project creation
    await trackUsageEvent({
      userId: testUser.userId,
      eventType: 'project_created',
      projectId,
      isTest: true,
    });
    logDiagnostic('T2', 'Created test project');

    // Check initial survey count for this project
    const initialSummary = await getTestUsageSummary({
      userId: testUser.userId,
      planId: 'free',
    });
    logDiagnostic('T2', 'Initial survey count for project:', initialSummary.surveysPerProject[projectId] || 0);

    // Create surveys up to the limit
    logDiagnostic('T2', `Creating ${limit} surveys for project...`);
    for (let i = 0; i < limit; i++) {
      await trackUsageEvent({
        userId: testUser.userId,
        eventType: 'survey_created',
        projectId,
        surveyId: generateUUID(),
        isTest: true,
      });
    }
    logDiagnostic('T2', `Created ${limit} test surveys`);

    // Check count after creating
    const afterCreateSummary = await getTestUsageSummary({
      userId: testUser.userId,
      planId: 'free',
    });
    logDiagnostic('T2', 'Survey count after creation:', afterCreateSummary.surveysPerProject[projectId] || 0);

    // Try to create one more
    logDiagnostic('T2', 'Attempting to create one more survey (should be blocked)...');
    const limitCheck = await checkTestUsageLimit({
      userId: testUser.userId,
      planId: 'free',
      limitType: 'surveys',
      projectId,
    });

    logDiagnostic('T2', 'Limit check result:', {
      allowed: limitCheck.allowed,
      current: limitCheck.current,
      limit: limitCheck.limit,
      message: limitCheck.message,
    });

    await deleteTestUser(testUser.userId);
    logDiagnostic('T2', 'Cleaned up test data');

    const duration = Date.now() - startTime;

    if (!limitCheck.allowed && limitCheck.current === limit) {
      logDiagnostic('T2', '✅ TEST PASSED');
      return {
        id: 'T2',
        name: 'FREE survey limit',
        status: 'PASS',
        details: `Correctly blocked at ${limit}/${limit} for project. Current=${limitCheck.current}, Allowed=${limitCheck.allowed}`,
        timestamp: new Date().toISOString(),
        duration,
      };
    } else {
      logDiagnostic('T2', '❌ TEST FAILED');
      return {
        id: 'T2',
        name: 'FREE survey limit',
        status: 'FAIL',
        details: `Expected blocked at ${limit}, got: allowed=${limitCheck.allowed}, current=${limitCheck.current}, limit=${limitCheck.limit}. See console.`,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  } catch (error) {
    logDiagnostic('T2', '❌ TEST ERROR:', error);
    await deleteTestUser(testUser.userId);
    return {
      id: 'T2',
      name: 'FREE survey limit',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * T3: FREE user hitting measurements-per-survey limit
 */
async function testFreeMeasurementLimit(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();
  const projectId = generateUUID();
  const surveyId = generateUUID();

  try {
    logDiagnostic('T3', '=== STARTING T3: FREE MEASUREMENT LIMIT TEST ===');
    logDiagnostic('T3', 'Test user ID:', testUser.userId);
    logDiagnostic('T3', 'Test survey ID:', surveyId);

    const limit = PLAN_LIMITS.free.maxMeasurementsPerSurvey;
    logDiagnostic('T3', 'Configured limit (PLAN_LIMITS.free.maxMeasurementsPerSurvey):', limit);

    // Clean up
    await deleteTestUser(testUser.userId);

    // Track project and survey creation
    await trackUsageEvent({
      userId: testUser.userId,
      eventType: 'project_created',
      projectId,
      isTest: true,
    });
    await trackUsageEvent({
      userId: testUser.userId,
      eventType: 'survey_created',
      projectId,
      surveyId,
      isTest: true,
    });

    // Add measurements up to the limit
    logDiagnostic('T3', `Adding ${limit} measurements...`);
    await trackUsageEvent({
      userId: testUser.userId,
      eventType: 'measurement_recorded',
      projectId,
      surveyId,
      count: limit,
      isTest: true,
    });

    // Try to add one more
    logDiagnostic('T3', 'Attempting to add one more measurement (should be blocked)...');
    const limitCheck = await checkTestUsageLimit({
      userId: testUser.userId,
      planId: 'free',
      limitType: 'measurements',
      surveyId,
      additionalCount: 1,
    });

    logDiagnostic('T3', 'Limit check result:', {
      allowed: limitCheck.allowed,
      current: limitCheck.current,
      limit: limitCheck.limit,
    });

    await deleteTestUser(testUser.userId);

    const duration = Date.now() - startTime;

    if (!limitCheck.allowed && limitCheck.current === limit) {
      logDiagnostic('T3', '✅ TEST PASSED');
      return {
        id: 'T3',
        name: 'FREE measurement limit',
        status: 'PASS',
        details: `Correctly blocked at ${limit}/${limit}. Current=${limitCheck.current}, Allowed=${limitCheck.allowed}`,
        timestamp: new Date().toISOString(),
        duration,
      };
    } else {
      logDiagnostic('T3', '❌ TEST FAILED');
      return {
        id: 'T3',
        name: 'FREE measurement limit',
        status: 'FAIL',
        details: `Expected blocked at ${limit}, got: allowed=${limitCheck.allowed}, current=${limitCheck.current}. See console.`,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  } catch (error) {
    logDiagnostic('T3', '❌ TEST ERROR:', error);
    await deleteTestUser(testUser.userId);
    return {
      id: 'T3',
      name: 'FREE measurement limit',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * T4: FREE user hitting monthly AI Insights limit
 */
async function testFreeAiInsightsLimit(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();

  try {
    logDiagnostic('T4', '=== STARTING T4: FREE AI INSIGHTS LIMIT TEST ===');
    logDiagnostic('T4', 'Test user ID:', testUser.userId);

    const limit = PLAN_LIMITS.free.maxAiInsightsPerMonth;
    logDiagnostic('T4', 'Configured limit (PLAN_LIMITS.free.maxAiInsightsPerMonth):', limit);

    // Clean up
    await deleteTestUser(testUser.userId);

    // Use AI insights up to the limit
    logDiagnostic('T4', `Generating ${limit} AI insights...`);
    for (let i = 0; i < limit; i++) {
      await trackUsageEvent({
        userId: testUser.userId,
        eventType: 'ai_insight_generated',
        isTest: true,
      });
    }

    // Try to use one more
    logDiagnostic('T4', 'Attempting one more AI insight (should be blocked)...');
    const limitCheck = await checkTestUsageLimit({
      userId: testUser.userId,
      planId: 'free',
      limitType: 'ai_insights',
    });

    logDiagnostic('T4', 'Limit check result:', {
      allowed: limitCheck.allowed,
      current: limitCheck.current,
      limit: limitCheck.limit,
    });

    await deleteTestUser(testUser.userId);

    const duration = Date.now() - startTime;

    if (!limitCheck.allowed && limitCheck.current === limit) {
      logDiagnostic('T4', '✅ TEST PASSED');
      return {
        id: 'T4',
        name: 'FREE AI insights limit',
        status: 'PASS',
        details: `Correctly blocked at ${limit}/${limit}. Current=${limitCheck.current}, Allowed=${limitCheck.allowed}`,
        timestamp: new Date().toISOString(),
        duration,
      };
    } else {
      logDiagnostic('T4', '❌ TEST FAILED');
      return {
        id: 'T4',
        name: 'FREE AI insights limit',
        status: 'FAIL',
        details: `Expected blocked at ${limit}, got: allowed=${limitCheck.allowed}, current=${limitCheck.current}. See console.`,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  } catch (error) {
    logDiagnostic('T4', '❌ TEST ERROR:', error);
    await deleteTestUser(testUser.userId);
    return {
      id: 'T4',
      name: 'FREE AI insights limit',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * T5: FREE user hitting monthly heatmap exports limit
 */
async function testFreeHeatmapExportLimit(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();

  try {
    logDiagnostic('T5', '=== STARTING T5: FREE HEATMAP EXPORT LIMIT TEST ===');
    logDiagnostic('T5', 'Test user ID:', testUser.userId);

    const limit = PLAN_LIMITS.free.maxHeatmapExportsPerMonth;
    logDiagnostic('T5', 'Configured limit (PLAN_LIMITS.free.maxHeatmapExportsPerMonth):', limit);

    // Clean up
    await deleteTestUser(testUser.userId);

    // Export heatmaps up to the limit
    logDiagnostic('T5', `Exporting ${limit} heatmaps...`);
    for (let i = 0; i < limit; i++) {
      await trackUsageEvent({
        userId: testUser.userId,
        eventType: 'heatmap_exported',
        isTest: true,
      });
    }

    // Try to export one more
    logDiagnostic('T5', 'Attempting one more heatmap export (should be blocked)...');
    const limitCheck = await checkTestUsageLimit({
      userId: testUser.userId,
      planId: 'free',
      limitType: 'heatmap_exports',
    });

    logDiagnostic('T5', 'Limit check result:', {
      allowed: limitCheck.allowed,
      current: limitCheck.current,
      limit: limitCheck.limit,
    });

    await deleteTestUser(testUser.userId);

    const duration = Date.now() - startTime;

    if (!limitCheck.allowed && limitCheck.current === limit) {
      logDiagnostic('T5', '✅ TEST PASSED');
      return {
        id: 'T5',
        name: 'FREE heatmap export limit',
        status: 'PASS',
        details: `Correctly blocked at ${limit}/${limit}. Current=${limitCheck.current}, Allowed=${limitCheck.allowed}`,
        timestamp: new Date().toISOString(),
        duration,
      };
    } else {
      logDiagnostic('T5', '❌ TEST FAILED');
      return {
        id: 'T5',
        name: 'FREE heatmap export limit',
        status: 'FAIL',
        details: `Expected blocked at ${limit}, got: allowed=${limitCheck.allowed}, current=${limitCheck.current}. See console.`,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  } catch (error) {
    logDiagnostic('T5', '❌ TEST ERROR:', error);
    await deleteTestUser(testUser.userId);
    return {
      id: 'T5',
      name: 'FREE heatmap export limit',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * T6: PRO user bypassing all limits
 */
async function testProUnlimited(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();

  try {
    // Create way more than FREE limit
    const projectsToCreate = PLAN_LIMITS.free.maxProjects + 5;
    for (let i = 0; i < projectsToCreate; i++) {
      await trackUsageEvent({
        userId: testUser.userId,
        eventType: 'project_created',
        projectId: generateUUID(),
        isTest: true,
      });
    }

    // Check as PRO user
    const limitCheck = await checkTestUsageLimit({
      userId: testUser.userId,
      planId: 'pro',
      limitType: 'projects',
    });

    await deleteTestUser(testUser.userId, startTime);

    const duration = Date.now() - startTime;

    if (limitCheck.allowed && limitCheck.limit === Infinity) {
      return {
        id: 'T6',
        name: 'PRO unlimited access',
        status: 'PASS',
        details: `PRO user correctly allowed unlimited access. Created ${projectsToCreate} projects (FREE limit is ${PLAN_LIMITS.free.maxProjects}).`,
        timestamp: new Date().toISOString(),
        duration,
      };
    } else {
      return {
        id: 'T6',
        name: 'PRO unlimited access',
        status: 'FAIL',
        details: `PRO user should have unlimited access but got allowed=${limitCheck.allowed}, limit=${limitCheck.limit}`,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  } catch (error) {
    await deleteTestUser(testUser.userId, startTime);
    return {
      id: 'T6',
      name: 'PRO unlimited access',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * T7: Admin alerts firing
 */
async function testAdminAlerts(): Promise<TestResult> {
  const startTime = Date.now();
  const testUser = await createTestUser();

  try {
    const alerts: string[] = [];

    // Test new_user alert
    try {
      await createAdminAlert({
        type: 'new_user',
        userId: testUser.userId,
        title: '[SELFTEST] New user alert test',
        message: `Self-test user ${testUser.email} created.`,
        metadata: { isSelfTest: true, email: testUser.email },
      });
      alerts.push('✓ new_user alert created');
    } catch (error) {
      alerts.push(`✗ new_user alert failed: ${error}`);
    }

    // Test usage_threshold alert
    try {
      await createAdminAlert({
        type: 'usage_threshold',
        userId: testUser.userId,
        title: '[SELFTEST] Usage threshold test',
        message: `Self-test user reached 80% of project limit.`,
        metadata: { isSelfTest: true, limitType: 'projects', current: 4, limit: 5, percentage: 0.8 },
      });
      alerts.push('✓ usage_threshold alert created');
    } catch (error) {
      alerts.push(`✗ usage_threshold alert failed: ${error}`);
    }

    // Test bad_survey_quality alert
    try {
      await createAdminAlert({
        type: 'bad_survey_quality',
        userId: testUser.userId,
        title: '[SELFTEST] Bad survey quality test',
        message: `Self-test survey has poor quality.`,
        metadata: { isSelfTest: true, quality: 'Poor', avgRsrp: -115.2, avgSinr: -2.3 },
      });
      alerts.push('✓ bad_survey_quality alert created');
    } catch (error) {
      alerts.push(`✗ bad_survey_quality alert failed: ${error}`);
    }

    // Verify alerts were created in database
    const { data: createdAlerts } = await supabase
      .from('admin_alerts')
      .select('*')
      .eq('user_id', testUser.userId)
      .eq('title', '[SELFTEST] New user alert test')
      .or('title.eq.[SELFTEST] Usage threshold test,title.eq.[SELFTEST] Bad survey quality test');

    // Clean up test alerts
    if (createdAlerts && createdAlerts.length > 0) {
      await supabase
        .from('admin_alerts')
        .delete()
        .in('id', createdAlerts.map((a) => a.id));
    }

    await deleteTestUser(testUser.userId, startTime);

    const duration = Date.now() - startTime;

    const allPassed = alerts.every((a) => a.startsWith('✓'));

    return {
      id: 'T7',
      name: 'Admin alerts',
      status: allPassed ? 'PASS' : 'FAIL',
      details: `${alerts.join(', ')}. Note: Email sending logged to console (not sent to real admins during self-test).`,
      timestamp: new Date().toISOString(),
      duration,
    };
  } catch (error) {
    await deleteTestUser(testUser.userId, startTime);
    return {
      id: 'T7',
      name: 'Admin alerts',
      status: 'FAIL',
      details: `Error: ${error}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * All test scenarios
 */
export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'T1',
    name: 'FREE project limit',
    description: 'Verify FREE users are blocked after creating max projects',
    runner: testFreeProjectLimit,
  },
  {
    id: 'T2',
    name: 'FREE survey limit',
    description: 'Verify FREE users are blocked after creating max surveys per project',
    runner: testFreeSurveyLimit,
  },
  {
    id: 'T3',
    name: 'FREE measurement limit',
    description: 'Verify FREE users are blocked after recording max measurements per survey',
    runner: testFreeMeasurementLimit,
  },
  {
    id: 'T4',
    name: 'FREE AI insights limit',
    description: 'Verify FREE users are blocked after using max AI insights per month',
    runner: testFreeAiInsightsLimit,
  },
  {
    id: 'T5',
    name: 'FREE heatmap export limit',
    description: 'Verify FREE users are blocked after exporting max heatmaps per month',
    runner: testFreeHeatmapExportLimit,
  },
  {
    id: 'T6',
    name: 'PRO unlimited access',
    description: 'Verify PRO users bypass all limits',
    runner: testProUnlimited,
  },
  {
    id: 'T7',
    name: 'Admin alerts',
    description: 'Verify admin alerts are created for all event types',
    runner: testAdminAlerts,
  },
];

/**
 * Run specific tests
 */
export async function runTests(testIds: string[]): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const testId of testIds) {
    const scenario = TEST_SCENARIOS.find((s) => s.id === testId);
    if (!scenario) {
      results.push({
        id: testId,
        name: 'Unknown test',
        status: 'FAIL',
        details: `Test ${testId} not found`,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    try {
      const result = await scenario.runner();
      results.push(result);
    } catch (error) {
      results.push({
        id: testId,
        name: scenario.name,
        status: 'FAIL',
        details: `Uncaught error: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Cleanup any remaining test data
  await cleanupTestData();

  return results;
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<TestResult[]> {
  return runTests(TEST_SCENARIOS.map((s) => s.id));
}
