-- Create partnership_applications table
CREATE TABLE public.partnership_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  audience_type TEXT,
  social_media TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by_admin_id UUID,
  referral_code_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partnership_applications
ALTER TABLE public.partnership_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for partnership_applications
CREATE POLICY "Only admins can manage partnership applications" 
ON public.partnership_applications 
FOR ALL 
USING (public.is_admin_user());

-- Create trigger for updated_at
CREATE TRIGGER update_partnership_applications_updated_at
BEFORE UPDATE ON public.partnership_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Modify referral_codes table to make user_id NOT NULL for new records
-- First, update existing NULL user_ids to a default admin user
UPDATE public.referral_codes 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@arxexperience.com.br', 'admin@example.com') 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.referral_codes 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key relationship for partnership applications to referral codes
ALTER TABLE public.partnership_applications 
ADD CONSTRAINT fk_partnership_referral_code 
FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id);

-- Add index for better performance
CREATE INDEX idx_partnership_applications_status ON public.partnership_applications(status);
CREATE INDEX idx_partnership_applications_email ON public.partnership_applications(email);