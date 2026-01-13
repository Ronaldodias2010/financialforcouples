import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type FirstAccessStep = 'welcome' | 'phone' | 'completed';

export const useFirstAccess = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FirstAccessStep>('completed');
  const [loading, setLoading] = useState(true);
  const [isFirstAccess, setIsFirstAccess] = useState(false);

  const checkFirstAccess = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Check localStorage first
      const completed = localStorage.getItem(`first_access_completed_${user.id}`);
      if (completed === 'true') {
        setCurrentStep('completed');
        setIsFirstAccess(false);
        setLoading(false);
        return;
      }

      // Check profile for phone_number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone_number, created_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking first access:', error);
        setLoading(false);
        return;
      }

      // If user has phone number, mark as completed
      if (profile?.phone_number && profile.phone_number.length > 0) {
        localStorage.setItem(`first_access_completed_${user.id}`, 'true');
        setCurrentStep('completed');
        setIsFirstAccess(false);
        setLoading(false);
        return;
      }

      // Check if profile was created recently (within last 5 minutes = first access)
      const createdAt = new Date(profile?.created_at || 0);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      // If created within 5 minutes OR no phone number, show first access flow
      const isNewUser = diffMinutes < 5;
      
      // For existing users without phone: show just phone modal
      // For new users: show welcome + phone modal
      if (isNewUser) {
        setCurrentStep('welcome');
        setIsFirstAccess(true);
      } else {
        // Existing user without phone - skip welcome, go straight to phone
        setCurrentStep('phone');
        setIsFirstAccess(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in checkFirstAccess:', error);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkFirstAccess();
  }, [checkFirstAccess]);

  const completeWelcome = useCallback(() => {
    setCurrentStep('phone');
  }, []);

  const completePhone = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(`first_access_completed_${user.id}`, 'true');
    }
    setCurrentStep('completed');
    setIsFirstAccess(false);
  }, [user?.id]);

  const resetFirstAccess = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`first_access_completed_${user.id}`);
      setCurrentStep('welcome');
      setIsFirstAccess(true);
    }
  }, [user?.id]);

  return {
    currentStep,
    loading,
    isFirstAccess,
    completeWelcome,
    completePhone,
    resetFirstAccess
  };
};
