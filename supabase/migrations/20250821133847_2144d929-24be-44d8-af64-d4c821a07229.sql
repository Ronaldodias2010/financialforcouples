-- Add couple-view SELECT policy for card_mileage_rules
CREATE POLICY "Users can view couple mileage rules"
ON public.card_mileage_rules
FOR SELECT
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_couples
    WHERE user_couples.status = 'active'
      AND (
        (user_couples.user1_id = auth.uid() AND user_couples.user2_id = card_mileage_rules.user_id)
        OR
        (user_couples.user2_id = auth.uid() AND user_couples.user1_id = card_mileage_rules.user_id)
      )
  )
);

-- Add couple-view SELECT policy for mileage_history
CREATE POLICY "Users can view couple mileage history"
ON public.mileage_history
FOR SELECT
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_couples
    WHERE user_couples.status = 'active'
      AND (
        (user_couples.user1_id = auth.uid() AND user_couples.user2_id = mileage_history.user_id)
        OR
        (user_couples.user2_id = auth.uid() AND user_couples.user1_id = mileage_history.user_id)
      )
  )
);