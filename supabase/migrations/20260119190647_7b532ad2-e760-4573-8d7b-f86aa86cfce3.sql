-- Adicionar coluna web_content para suportar artigos web nativos
ALTER TABLE public.educational_content 
ADD COLUMN IF NOT EXISTS web_content TEXT DEFAULT NULL;

COMMENT ON COLUMN public.educational_content.web_content IS 'Conteúdo HTML/texto para artigos web nativos - permite criar conteúdo diretamente sem upload de PDF';