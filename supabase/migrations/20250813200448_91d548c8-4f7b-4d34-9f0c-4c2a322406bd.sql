-- Add explicit policies to prevent anonymous access to sensitive tables

-- Subscribers table: Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to subscribers"
ON public.subscribers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Profiles table: Explicitly deny anonymous access  
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Accounts table: Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to accounts"
ON public.accounts
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Cards table: Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to cards"
ON public.cards
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Transactions table: Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to transactions"
ON public.transactions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Additional sensitive tables: Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to investments"
ON public.investments
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny anonymous access to investment_goals"
ON public.investment_goals
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny anonymous access to recurring_expenses"
ON public.recurring_expenses
FOR ALL
TO anon
USING (false)
WITH CHECK (false);