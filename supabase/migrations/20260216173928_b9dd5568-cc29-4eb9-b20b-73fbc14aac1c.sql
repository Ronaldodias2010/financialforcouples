
-- Add IA/AI Tools tag to category_tags with relevant keywords
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
VALUES (
  'IA / Inteligência Artificial',
  'AI / Artificial Intelligence',
  'IA / Inteligencia Artificial',
  '#8b5cf6',
  ARRAY['ia', 'inteligência artificial', 'inteligencia artificial', 'gemini', 'gpt', 'chatgpt', 'openai', 'lovable', 'claude', 'copilot', 'midjourney', 'dall-e', 'cursor', 'v0', 'perplexity', 'anthropic', 'deepseek', 'llm', 'ai'],
  ARRAY['ai', 'artificial intelligence', 'gemini', 'gpt', 'chatgpt', 'openai', 'lovable', 'claude', 'copilot', 'midjourney', 'dall-e', 'cursor', 'v0', 'perplexity', 'anthropic', 'deepseek', 'llm'],
  ARRAY['ia', 'inteligencia artificial', 'gemini', 'gpt', 'chatgpt', 'openai', 'lovable', 'claude', 'copilot', 'midjourney', 'dall-e', 'cursor', 'v0', 'perplexity', 'anthropic', 'deepseek', 'llm']
);

-- Link the new tag to Tecnologia default category
INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
SELECT '63ece746-f7b0-4232-abe0-eb4fe3b5a22c', id, true
FROM public.category_tags
WHERE name_pt = 'IA / Inteligência Artificial';
