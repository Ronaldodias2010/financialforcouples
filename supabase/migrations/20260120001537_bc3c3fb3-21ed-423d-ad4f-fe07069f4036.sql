-- Habilitar RLS na tabela default_subcategories
ALTER TABLE default_subcategories ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para subcategorias padrão (todos podem ver)
CREATE POLICY "Anyone can read default subcategories"
ON default_subcategories
FOR SELECT
USING (true);

-- Apenas admins podem modificar (não permitir via API pública)
CREATE POLICY "No public insert on default_subcategories"
ON default_subcategories
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public update on default_subcategories"
ON default_subcategories
FOR UPDATE
USING (false);

CREATE POLICY "No public delete on default_subcategories"
ON default_subcategories
FOR DELETE
USING (false);