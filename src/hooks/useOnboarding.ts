/**
 * useOnboarding Hook
 *
 * Manages onboarding state for the current user
 */

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  getOnboardingState,
  markOnboardingCompleted,
  resetOnboardingState,
  OnboardingState,
} from '../services/onboardingService';
import { ADMIN_EMAILS } from '../config/admin';

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<OnboardingState>({ status: 'not_started' });
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Check if user is admin (case-insensitive)
      const userIsAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
      setIsAdmin(userIsAdmin);

      // Admins always have completed onboarding (skip it)
      if (userIsAdmin) {
        setState({ status: 'completed' });
        setLoading(false);
        return;
      }

      // Load onboarding state for non-admin users
      const onboardingState = await getOnboardingState(user.id);
      setState(onboardingState);
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!userId || isAdmin) return;

    try {
      await markOnboardingCompleted(userId);
      setState({ status: 'completed' });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    if (!userId || isAdmin) return;

    try {
      await resetOnboardingState(userId);
      setState({ status: 'not_started' });
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      throw error;
    }
  };

  return {
    loading,
    state,
    isCompleted: state.status === 'completed',
    isAdmin,
    completeOnboarding,
    resetOnboarding,
  };
}
