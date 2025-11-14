import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePhoneRequest = () => {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [hasPhone, setHasPhone] = useState(true);

  useEffect(() => {
    const checkPhoneStatus = async () => {
      if (!user?.id) {
        setShouldShow(false);
        return;
      }

      // Check if user completed or skipped the request
      const completed = localStorage.getItem(`phone_request_completed_${user.id}`);
      const skipped = localStorage.getItem(`phone_request_skipped_${user.id}`);

      if (completed || skipped) {
        setShouldShow(false);
        return;
      }

      // Check if user signed in with Google
      const provider = user.app_metadata?.provider;
      if (provider !== 'google') {
        setShouldShow(false);
        return;
      }

      // Check if user has phone number in profile
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('user_id', user.id)
          .single();

        const phoneExists = profile?.phone_number && profile.phone_number.length > 0;
        setHasPhone(phoneExists);
        
        // Show modal only if no phone and not skipped/completed
        setShouldShow(!phoneExists);
      } catch (error) {
        console.error('Error checking phone status:', error);
        setShouldShow(false);
      }
    };

    checkPhoneStatus();
  }, [user?.id]);

  const closeModal = () => {
    setShouldShow(false);
  };

  return {
    shouldShow,
    hasPhone,
    closeModal
  };
};
