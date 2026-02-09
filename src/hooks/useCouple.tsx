import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

interface CoupleData {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCouple = () => {
  const { user } = useAuth();
  const [couple, setCouple] = useState<CoupleData | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isPartOfCouple, setIsPartOfCouple] = useState(false);

  const fetchCoupleData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: coupleData, error } = await supabase
        .from("user_couples")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error('Error fetching couple data:', error);
        setLoading(false);
        return;
      }

      if (coupleData) {
        setCouple(coupleData);
        setIsPartOfCouple(true);
      } else {
        setCouple(null);
        setIsPartOfCouple(false);
      }
    } catch (error) {
      console.error('Error in fetchCoupleData:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCoupleData();
  }, [fetchCoupleData]);

  // Use centralized realtime manager
  useRealtimeTable('user_couples', (payload) => {
    const data = payload.new || payload.old;
    if (data && 'user1_id' in data && 'user2_id' in data &&
        (data.user1_id === user?.id || data.user2_id === user?.id)) {
      fetchCoupleData();
    }
  }, !!user?.id);

  const getPartnerUserId = () => {
    if (!couple || !user?.id) return null;
    return couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
  };

  const isUserOne = () => {
    if (!couple || !user?.id) return true;
    return couple.user1_id === user.id;
  };

  const refreshCoupleData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      const { data: coupleData, error } = await supabase
        .from("user_couples")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error('Error fetching couple data:', error);
        return;
      }

      if (coupleData) {
        setCouple(coupleData);
        setIsPartOfCouple(true);
        console.log('User is part of a couple:', coupleData);
      } else {
        setCouple(null);
        setIsPartOfCouple(false);
        console.log('User is not part of a couple');
      }
    } catch (error) {
      console.error('Error in refreshCoupleData:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    couple,
    loading,
    isPartOfCouple,
    getPartnerUserId,
    isUserOne,
    refreshCoupleData
  };
};