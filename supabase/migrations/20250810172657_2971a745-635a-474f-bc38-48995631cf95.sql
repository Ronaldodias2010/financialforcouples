-- Set search_path for normalize_text_simple to satisfy linter
ALTER FUNCTION public.normalize_text_simple(text) SET search_path TO 'public';