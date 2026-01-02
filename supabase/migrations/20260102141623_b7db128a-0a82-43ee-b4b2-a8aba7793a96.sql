-- Adicionar campos de CPF ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf_partner VARCHAR(14);

-- Criar bucket para documentos fiscais
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax-documents', 'tax-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para o bucket tax-documents
CREATE POLICY "Users can upload own tax docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own tax docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own tax docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own tax docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);