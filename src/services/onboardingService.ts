/**
 * Onboarding Service
 *
 * Manages new user onboarding flow state
 */

import { supabase } from './supabaseClient';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface OnboardingState {
  status: OnboardingStatus;
  lastCompletedStep?: number;
}

const STORAGE_KEY = 'goflexconnect_onboarding_completed';

/**
 * Get the current onboarding state for a user
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  try {
    // 1. Query profiles table for onboarding fields
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('has_seen_onboarding, onboarding_completed_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch onboarding state:', error);
      // Fall through to localStorage check
    }

    // 2. If has_seen_onboarding is true AND onboarding_completed_at is set
    if (profile && profile.has_seen_onboarding && profile.onboarding_completed_at) {
      return { status: 'completed' };
    }

    // 3. Check localStorage as fallback
    const localCompleted = localStorage.getItem(STORAGE_KEY);
    if (localCompleted === 'true') {
      return { status: 'completed' };
    }

    // 4. Default to not started
    return { status: 'not_started' };
  } catch (error) {
    console.error('Error getting onboarding state:', error);
    return { status: 'not_started' };
  }
}

/**
 * Mark onboarding as completed for a user
 */
export async function markOnboardingCompleted(userId: string): Promise<void> {
  try {
    // 1. Set localStorage FIRST for immediate feedback (prevents loop)
    localStorage.setItem(STORAGE_KEY, 'true');

    // 2. Update profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        has_seen_onboarding: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to mark onboarding completed:', error);
      // Don't throw - localStorage is already set, so user won't see loop
      // But log for debugging
    }

    console.log('[Onboarding] Marked as completed for user:', userId);
  } catch (error) {
    console.error('Error marking onboarding completed:', error);
    // Don't throw - localStorage is already set
  }
}

/**
 * Reset onboarding state (for replay feature)
 */
export async function resetOnboardingState(userId: string): Promise<void> {
  try {
    // 1. Update profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        has_seen_onboarding: false,
        onboarding_completed_at: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to reset onboarding state:', error);
      throw error;
    }

    // 2. Clear localStorage
    localStorage.removeItem(STORAGE_KEY);

    console.log('[Onboarding] Reset for user:', userId);
  } catch (error) {
    console.error('Error resetting onboarding state:', error);
    throw error;
  }
}
