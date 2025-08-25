import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export const usePremiumReminder = () => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const [shouldShow, setShouldShow] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user || subscribed) {
      setShouldShow(false);
      return;
    }

    const userId = user.id;
    const dismissKey = `premiumReminderDismissed_${userId}`;
    const loginCountKey = `loginCount_${userId}`;
    const lastDismissCountKey = `lastDismissLoginCount_${userId}`;

    // Get current values from localStorage
    const isDismissedSession = sessionStorage.getItem(dismissKey) === 'true';
    const currentLoginCount = parseInt(localStorage.getItem(loginCountKey) || '0');
    const lastDismissCount = parseInt(localStorage.getItem(lastDismissCountKey) || '0');

    // Increment login count on each app entry
    const newLoginCount = currentLoginCount + 1;
    localStorage.setItem(loginCountKey, newLoginCount.toString());

    // Logic: show if not dismissed this session AND it's been 3+ logins since last dismiss
    const shouldShowNow = !isDismissedSession && (newLoginCount - lastDismissCount >= 3);
    
    setShouldShow(shouldShowNow);
    setIsDismissed(isDismissedSession);
  }, [user, subscribed]);

  const dismissReminder = () => {
    if (!user) return;

    const userId = user.id;
    const dismissKey = `premiumReminderDismissed_${userId}`;
    const loginCountKey = `loginCount_${userId}`;
    const lastDismissCountKey = `lastDismissLoginCount_${userId}`;

    // Mark as dismissed for this session
    sessionStorage.setItem(dismissKey, 'true');
    
    // Record the login count when dismissed
    const currentLoginCount = parseInt(localStorage.getItem(loginCountKey) || '0');
    localStorage.setItem(lastDismissCountKey, currentLoginCount.toString());

    setIsDismissed(true);
    setShouldShow(false);
  };

  return {
    shouldShow: shouldShow && !subscribed,
    dismissReminder,
    isDismissed
  };
};