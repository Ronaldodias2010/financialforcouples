import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPartOfCouple, setIsPartOfCouple] = useState(false);

  useEffect(() => {
    const fetchCoupleData = async () => {
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
          console.log('✅ User is part of a couple:', coupleData);
          console.log('✅ Couple relationship found - should see shared dashboard');
        } else {
          setCouple(null);
          setIsPartOfCouple(false);
          console.log('❌ User is not part of a couple - will see individual dashboard');
        }
      } catch (error) {
        console.error('Error in fetchCoupleData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupleData();
  }, [user?.id]);

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