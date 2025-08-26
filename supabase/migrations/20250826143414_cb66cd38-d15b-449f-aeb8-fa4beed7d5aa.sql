-- Create storage bucket for educational content
INSERT INTO storage.buckets (id, name, public) VALUES ('educational-content', 'educational-content', true);

-- Create educational content table
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('planning', 'investments', 'emergency', 'analysis')),
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'video', 'article', 'image')),
  created_by_admin_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Educational content is viewable by authenticated users" 
ON public.educational_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can create educational content" 
ON public.educational_content 
FOR INSERT 
WITH CHECK (public.is_admin_user());

CREATE POLICY "Only admins can update educational content" 
ON public.educational_content 
FOR UPDATE 
USING (public.is_admin_user());

CREATE POLICY "Only admins can delete educational content" 
ON public.educational_content 
FOR DELETE 
USING (public.is_admin_user());

-- Create storage policies
CREATE POLICY "Educational content files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'educational-content');

CREATE POLICY "Admins can upload educational content" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'educational-content' AND public.is_admin_user());

CREATE POLICY "Admins can update educational content files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'educational-content' AND public.is_admin_user());

CREATE POLICY "Admins can delete educational content files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'educational-content' AND public.is_admin_user());

-- Create trigger for updated_at
CREATE TRIGGER update_educational_content_updated_at
BEFORE UPDATE ON public.educational_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();