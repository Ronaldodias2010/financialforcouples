-- Create table to track user exclusions of system tags
CREATE TABLE public.user_category_tag_exclusions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  system_tag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_category_tag_exclusions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own tag exclusions"
ON public.user_category_tag_exclusions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tag exclusions"
ON public.user_category_tag_exclusions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tag exclusions"
ON public.user_category_tag_exclusions
FOR DELETE
USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate exclusions
ALTER TABLE public.user_category_tag_exclusions
ADD CONSTRAINT unique_user_category_system_tag
UNIQUE (user_id, category_id, system_tag_id);

-- Add foreign key constraints
ALTER TABLE public.user_category_tag_exclusions
ADD CONSTRAINT fk_category_tag_exclusions_category
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE public.user_category_tag_exclusions
ADD CONSTRAINT fk_category_tag_exclusions_system_tag
FOREIGN KEY (system_tag_id) REFERENCES public.category_tags(id) ON DELETE CASCADE;