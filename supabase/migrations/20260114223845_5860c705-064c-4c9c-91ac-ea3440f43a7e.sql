-- Fix permissive RLS policies on phone_verifications (avoid USING/WITH CHECK true)
-- Goal: allow authenticated users to manage ONLY the verification records for the phone number on their own profile.

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can read and update phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can create phone verifications" ON public.phone_verifications;

-- Helper expression: phone_number must match the current user's profile phone number (digits-only)
-- Note: phone_verifications.phone_number is stored as digits only in our edge functions.

CREATE POLICY "Users can create own phone verifications"
ON public.phone_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  phone_number = regexp_replace(
    (SELECT p.phone_number FROM public.profiles p WHERE p.user_id = auth.uid()),
    '\\D',
    '',
    'g'
  )
);

CREATE POLICY "Users can view own phone verifications"
ON public.phone_verifications
FOR SELECT
TO authenticated
USING (
  phone_number = regexp_replace(
    (SELECT p.phone_number FROM public.profiles p WHERE p.user_id = auth.uid()),
    '\\D',
    '',
    'g'
  )
);

CREATE POLICY "Users can update own phone verifications"
ON public.phone_verifications
FOR UPDATE
TO authenticated
USING (
  phone_number = regexp_replace(
    (SELECT p.phone_number FROM public.profiles p WHERE p.user_id = auth.uid()),
    '\\D',
    '',
    'g'
  )
)
WITH CHECK (
  phone_number = regexp_replace(
    (SELECT p.phone_number FROM public.profiles p WHERE p.user_id = auth.uid()),
    '\\D',
    '',
    'g'
  )
);

CREATE POLICY "Users can delete own phone verifications"
ON public.phone_verifications
FOR DELETE
TO authenticated
USING (
  phone_number = regexp_replace(
    (SELECT p.phone_number FROM public.profiles p WHERE p.user_id = auth.uid()),
    '\\D',
    '',
    'g'
  )
);
