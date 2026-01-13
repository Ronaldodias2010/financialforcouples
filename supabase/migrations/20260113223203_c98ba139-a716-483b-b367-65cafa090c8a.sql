-- Normalizar telefones existentes na tabela profiles
-- Remove TUDO que não é número e adiciona código do país 55 se necessário

UPDATE profiles
SET phone_number = CASE
  -- Se já tem 12-13 dígitos começando com 55, manter
  WHEN LENGTH(regexp_replace(phone_number, '\D', '', 'g')) >= 12 
       AND regexp_replace(phone_number, '\D', '', 'g') LIKE '55%'
  THEN regexp_replace(phone_number, '\D', '', 'g')
  
  -- Se tem 10-11 dígitos (DDD + número), adicionar 55
  WHEN LENGTH(regexp_replace(phone_number, '\D', '', 'g')) BETWEEN 10 AND 11
  THEN '55' || regexp_replace(phone_number, '\D', '', 'g')
  
  -- Senão, apenas remover caracteres não numéricos
  ELSE regexp_replace(phone_number, '\D', '', 'g')
END
WHERE phone_number IS NOT NULL 
  AND phone_number != ''
  AND phone_number != regexp_replace(phone_number, '\D', '', 'g');

-- Criar índice para melhorar performance de busca por telefone (se não existir)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Log para verificar quantos registros foram normalizados
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Telefones normalizados: %', affected_count;
END $$;