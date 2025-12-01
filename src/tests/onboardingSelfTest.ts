/**
 * Onboarding Self-Test Utility
 *
 * Developer-only helper for testing onboarding state management.
 * NOT exposed in production UI.
 */

import {
  getOnboardingState,
  markOnboardingCompleted,
  resetOnboardingState,
} from '../services/onboardingService';

export async function runOnboardingSelfTest(userId: string): Promise<void> {
  console.group('🧪 Onboarding Self-Test');

  try {
    // Step 1: Get initial state
    console.log('📊 Step 1: Fetching initial onboarding state...');
    const initialState = await getOnboardingState(userId);
    console.log(`✓ Initial state for user ${userId}:`, initialState);

    // Step 2: Mark as completed
    console.log('\n📝 Step 2: Marking onboarding as completed...');
    await markOnboardingCompleted(userId);
    console.log('✓ Onboarding marked as completed');

    // Step 3: Verify completion
    console.log('\n📊 Step 3: Verifying updated state...');
    const updatedState = await getOnboardingState(userId);
    console.log(`✓ Updated state for user ${userId}:`, updatedState);

    // Step 4: Validate
    if (updatedState.status === 'completed') {
      console.log('\n✅ Self-test PASSED: Onboarding state updated correctly');
    } else {
      console.warn('\n⚠️ Self-test FAILED: Expected status "completed", got:', updatedState.status);
    }

  } catch (error) {
    console.error('\n❌ Self-test ERROR:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Helper to reset onboarding for testing purposes
 */
export async function resetOnboardingForTest(userId: string): Promise<void> {
  console.group('🔄 Reset Onboarding Test');

  try {
    console.log(`Resetting onboarding for user ${userId}...`);
    await resetOnboardingState(userId);

    const state = await getOnboardingState(userId);
    console.log('✓ Reset complete. Current state:', state);

  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    console.groupEnd();
  }
}

// Example usage (comment out in production):
// import { runOnboardingSelfTest } from './tests/onboardingSelfTest';
// runOnboardingSelfTest('user-id-here');
