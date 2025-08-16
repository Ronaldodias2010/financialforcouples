-- Fix security vulnerabilities identified in scan
-- Add proper RLS policies to prevent anonymous access to sensitive data

-- Fix couple_relationship_requests table
-- Drop existing permissive policies and add restrictive ones
DROP POLICY IF EXISTS "Users can create relationship requests" ON public.couple_relationship_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.couple_relationship_requests;

-- Add deny anonymous policy
CREATE POLICY "Deny anonymous access to couple_relationship_requests" 
ON public.couple_relationship_requests FOR ALL TO anon 
USING (false) WITH CHECK (false);

-- Add authenticated user policies
CREATE POLICY "Authenticated users can create relationship requests" 
ON public.couple_relationship_requests FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = requester_user_id);

CREATE POLICY "Users can view their own relationship requests" 
ON public.couple_relationship_requests FOR SELECT TO authenticated 
USING (auth.uid() = requester_user_id);

-- Fix user_invites table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can create invites" ON public.user_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON public.user_invites;
DROP POLICY IF EXISTS "Users can update their own invites" ON public.user_invites;

-- Add deny anonymous policy
CREATE POLICY "Deny anonymous access to user_invites" 
ON public.user_invites FOR ALL TO anon 
USING (false) WITH CHECK (false);

-- Add authenticated user policies
CREATE POLICY "Authenticated users can create invites" 
ON public.user_invites FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = inviter_user_id);

CREATE POLICY "Users can view their own invites" 
ON public.user_invites FOR SELECT TO authenticated 
USING (auth.uid() = inviter_user_id);

CREATE POLICY "Users can update their own invites" 
ON public.user_invites FOR UPDATE TO authenticated 
USING (auth.uid() = inviter_user_id);