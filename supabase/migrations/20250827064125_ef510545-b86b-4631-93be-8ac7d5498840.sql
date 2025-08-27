-- Adicionar campo image_url para conteúdo educacional
ALTER TABLE educational_content 
ADD COLUMN image_url TEXT;

-- Comentário: Este campo vai armazenar a URL da imagem de capa/thumbnail para os materiais educacionais