-- =====================================================
-- ENRIQUECER KEYWORDS DAS TAGS PARA MELHOR CATEGORIZAÇÃO
-- =====================================================

-- TAG: ifood/delivery (id: 52fd4660-7380-4f63-9d43-27c1ca09f489)
UPDATE category_tags SET 
  keywords_pt = ARRAY['ifood', 'delivery', 'comida', 'entrega', 'uber eats', 'ubereats', 'rappi', '99food', 'aiqfome', 'zé delivery', 'ze delivery', 'james', 'pedido'],
  keywords_en = ARRAY['ifood', 'delivery', 'food', 'uber eats', 'ubereats', 'rappi', 'doordash', 'grubhub', 'postmates', 'order'],
  keywords_es = ARRAY['ifood', 'delivery', 'comida', 'entrega', 'uber eats', 'ubereats', 'rappi', 'pedidos ya', 'pedidosya', 'pedido']
WHERE id = '52fd4660-7380-4f63-9d43-27c1ca09f489';

-- TAG: delivery (id: 40331d1c-39e5-47cb-8138-1f31ad6a30ac)
UPDATE category_tags SET 
  keywords_pt = ARRAY['delivery', 'entrega', 'ifood', 'uber eats', 'rappi', '99food', 'aiqfome', 'pedido online', 'app comida'],
  keywords_en = ARRAY['delivery', 'order', 'ifood', 'uber eats', 'doordash', 'food app'],
  keywords_es = ARRAY['delivery', 'entrega', 'ifood', 'uber eats', 'rappi', 'pedidos ya', 'app comida']
WHERE id = '40331d1c-39e5-47cb-8138-1f31ad6a30ac';

-- TAG: delivery (id: a2a4b4e8-dea6-465a-95e9-31d12c322e96)
UPDATE category_tags SET 
  keywords_pt = ARRAY['delivery', 'entrega', 'ifood', 'uber eats', 'ubereats', 'rappi', '99food', 'aiqfome', 'zé delivery'],
  keywords_en = ARRAY['delivery', 'order', 'ifood', 'uber eats', 'ubereats', 'doordash', 'grubhub'],
  keywords_es = ARRAY['delivery', 'entrega', 'ifood', 'uber eats', 'ubereats', 'rappi', 'pedidos ya']
WHERE id = 'a2a4b4e8-dea6-465a-95e9-31d12c322e96';

-- TAG: delivery (id: 8c27d16f-36a6-4703-b34f-60f34bb9955e)
UPDATE category_tags SET 
  keywords_pt = ARRAY['delivery', 'entrega', 'ifood', 'uber eats', 'rappi', '99food', 'aiqfome'],
  keywords_en = ARRAY['delivery', 'order', 'ifood', 'uber eats', 'doordash'],
  keywords_es = ARRAY['delivery', 'entrega', 'ifood', 'uber eats', 'rappi']
WHERE id = '8c27d16f-36a6-4703-b34f-60f34bb9955e';

-- TAG: fast food (id: f8afcd08-d07b-4464-939d-b5aac36275f4)
UPDATE category_tags SET 
  keywords_pt = ARRAY['fast food', 'mcdonald', 'mcdonalds', 'burger king', 'bk', 'kfc', 'subway', 'bob''s', 'bobs', 'giraffas', 'habibs', 'habib''s', 'popeyes', 'taco bell', 'pizza hut', 'dominos', 'domino''s'],
  keywords_en = ARRAY['fast food', 'mcdonald', 'mcdonalds', 'burger king', 'kfc', 'subway', 'wendys', 'taco bell', 'pizza hut', 'dominos', 'popeyes', 'chick-fil-a'],
  keywords_es = ARRAY['fast food', 'mcdonald', 'mcdonalds', 'burger king', 'kfc', 'subway', 'taco bell', 'pizza hut', 'dominos', 'popeyes']
WHERE id = 'f8afcd08-d07b-4464-939d-b5aac36275f4';

-- TAG: fast food (id: 2c6f7a25-62ec-4df3-bce0-44eb9642a981)
UPDATE category_tags SET 
  keywords_pt = ARRAY['fast food', 'mcdonald', 'mcdonalds', 'burger king', 'bk', 'kfc', 'subway', 'bob''s', 'giraffas', 'habibs'],
  keywords_en = ARRAY['fast food', 'mcdonald', 'burger king', 'kfc', 'subway', 'wendys'],
  keywords_es = ARRAY['fast food', 'mcdonald', 'burger king', 'kfc', 'subway']
WHERE id = '2c6f7a25-62ec-4df3-bce0-44eb9642a981';

-- TAG: fast food (id: d6166536-a362-46c2-817e-89b0861d91b1)
UPDATE category_tags SET 
  keywords_pt = ARRAY['fast food', 'mcdonald', 'mcdonalds', 'burger king', 'bk', 'kfc', 'subway', 'bob''s', 'giraffas'],
  keywords_en = ARRAY['fast food', 'mcdonald', 'burger king', 'kfc', 'subway'],
  keywords_es = ARRAY['fast food', 'mcdonald', 'burger king', 'kfc', 'subway']
WHERE id = 'd6166536-a362-46c2-817e-89b0861d91b1';

-- TAG: mercado (id: c62ef0c1-58c2-4d35-8b45-83f4bb9c962e)
UPDATE category_tags SET 
  keywords_pt = ARRAY['mercado', 'supermercado', 'feira', 'compras', 'extra', 'carrefour', 'pão de açúcar', 'pao de acucar', 'atacadão', 'atacadao', 'assaí', 'assai', 'dia', 'aldi', 'makro', 'sam''s club', 'costco'],
  keywords_en = ARRAY['grocery', 'supermarket', 'market', 'walmart', 'costco', 'target', 'whole foods', 'trader joes', 'aldi', 'kroger'],
  keywords_es = ARRAY['mercado', 'supermercado', 'feria', 'compras', 'carrefour', 'walmart', 'costco', 'aldi']
WHERE id = 'c62ef0c1-58c2-4d35-8b45-83f4bb9c962e';

-- TAG: supermercado (id: 46db8a0b-c3f9-4df2-8c3c-b431b42392f5)
UPDATE category_tags SET 
  keywords_pt = ARRAY['supermercado', 'mercado', 'compras', 'extra', 'carrefour', 'pão de açúcar', 'atacadão', 'assaí', 'makro', 'big', 'nacional'],
  keywords_en = ARRAY['supermarket', 'grocery', 'market', 'walmart', 'costco', 'target'],
  keywords_es = ARRAY['supermercado', 'mercado', 'compras', 'carrefour', 'walmart']
WHERE id = '46db8a0b-c3f9-4df2-8c3c-b431b42392f5';

-- TAG: supermercado (id: 58c838f9-d624-464c-a72c-ca071451c4d5)
UPDATE category_tags SET 
  keywords_pt = ARRAY['supermercado', 'mercado', 'compras', 'extra', 'carrefour', 'pão de açúcar', 'atacadão', 'assaí'],
  keywords_en = ARRAY['supermarket', 'grocery', 'market', 'walmart', 'costco'],
  keywords_es = ARRAY['supermercado', 'mercado', 'compras', 'carrefour']
WHERE id = '58c838f9-d624-464c-a72c-ca071451c4d5';

-- TAG: supermercado (id: 0be589aa-98aa-4764-a329-593b89b1fd21)
UPDATE category_tags SET 
  keywords_pt = ARRAY['supermercado', 'mercado', 'compras', 'extra', 'carrefour', 'pão de açúcar', 'atacadão', 'assaí'],
  keywords_en = ARRAY['supermarket', 'grocery', 'market', 'walmart', 'costco'],
  keywords_es = ARRAY['supermercado', 'mercado', 'compras', 'carrefour']
WHERE id = '0be589aa-98aa-4764-a329-593b89b1fd21';

-- TAG: uber/99 (id: 17304bbe-c05a-4ce4-a489-6fc34dc6b3f8)
UPDATE category_tags SET 
  keywords_pt = ARRAY['uber', '99', 'corrida', 'rideshare', 'taxi', 'táxi', '99pop', '99taxi', 'cabify', 'indriver', 'bolt', 'lyft'],
  keywords_en = ARRAY['uber', '99', 'rideshare', 'ride', 'taxi', 'lyft', 'cabify', 'bolt'],
  keywords_es = ARRAY['uber', '99', 'corrida', 'rideshare', 'taxi', 'cabify', 'didi', 'beat']
WHERE id = '17304bbe-c05a-4ce4-a489-6fc34dc6b3f8';

-- TAG: uber/99 (id: 37e927ff-02ad-4aac-a28f-3bd8484bad59)
UPDATE category_tags SET 
  keywords_pt = ARRAY['uber', '99', 'corrida', 'taxi', 'táxi', '99pop', 'cabify', 'indriver'],
  keywords_en = ARRAY['uber', '99', 'rideshare', 'ride', 'taxi', 'lyft'],
  keywords_es = ARRAY['uber', '99', 'corrida', 'taxi', 'cabify', 'didi']
WHERE id = '37e927ff-02ad-4aac-a28f-3bd8484bad59';

-- TAG: uber/99 (id: 974e967c-2458-4140-bd20-c6a8121135ee)
UPDATE category_tags SET 
  keywords_pt = ARRAY['uber', '99', 'corrida', 'taxi', 'táxi', '99pop', 'cabify', 'indriver'],
  keywords_en = ARRAY['uber', '99', 'rideshare', 'ride', 'taxi', 'lyft'],
  keywords_es = ARRAY['uber', '99', 'corrida', 'taxi', 'cabify', 'didi']
WHERE id = '974e967c-2458-4140-bd20-c6a8121135ee';

-- TAG: uber/99 que tinha keywords nulos (id: de129ed9-e75f-4d47-a866-73543defd800)
UPDATE category_tags SET 
  keywords_pt = ARRAY['uber', '99', 'corrida', 'taxi', 'táxi', '99pop', 'cabify', 'indriver', 'bolt'],
  keywords_en = ARRAY['uber', '99', 'rideshare', 'ride', 'taxi', 'lyft', 'bolt'],
  keywords_es = ARRAY['uber', '99', 'corrida', 'taxi', 'cabify', 'didi', 'beat']
WHERE id = 'de129ed9-e75f-4d47-a866-73543defd800';

-- TAG: uber/transporte (id: cf0a9991-0e9c-41da-a109-fc7275233ca0)
UPDATE category_tags SET 
  keywords_pt = ARRAY['uber', 'transporte', 'corrida', 'táxi', 'taxi', '99', 'cabify', 'indriver', 'bolt', 'blablacar'],
  keywords_en = ARRAY['uber', 'transport', 'ride', 'taxi', 'lyft', '99', 'bolt', 'cabify'],
  keywords_es = ARRAY['uber', 'transporte', 'corrida', 'taxi', '99', 'cabify', 'didi', 'beat']
WHERE id = 'cf0a9991-0e9c-41da-a109-fc7275233ca0';

-- TAG: café (id: 6b927702-fcdc-4844-9866-4e2f9f167bdd)
UPDATE category_tags SET 
  keywords_pt = ARRAY['café', 'cafe', 'cafeteria', 'starbucks', 'cappuccino', 'espresso', 'latte', 'nespresso', 'dolce gusto', 'kopenhagen'],
  keywords_en = ARRAY['coffee', 'cafe', 'starbucks', 'cappuccino', 'espresso', 'latte', 'dunkin'],
  keywords_es = ARRAY['café', 'cafeteria', 'starbucks', 'cappuccino', 'espresso', 'latte']
WHERE id = '6b927702-fcdc-4844-9866-4e2f9f167bdd';

-- TAG: café (id: a515c364-ce8a-4639-94f5-fbee0c4216d7)
UPDATE category_tags SET 
  keywords_pt = ARRAY['café', 'cafe', 'cafeteria', 'starbucks', 'cappuccino', 'espresso', 'latte'],
  keywords_en = ARRAY['coffee', 'cafe', 'starbucks', 'cappuccino', 'espresso'],
  keywords_es = ARRAY['café', 'cafeteria', 'starbucks', 'cappuccino']
WHERE id = 'a515c364-ce8a-4639-94f5-fbee0c4216d7';

-- TAG: café (id: b419820d-6b5b-41c9-b5de-311b85668ca5)
UPDATE category_tags SET 
  keywords_pt = ARRAY['café', 'cafe', 'cafeteria', 'starbucks', 'cappuccino', 'espresso'],
  keywords_en = ARRAY['coffee', 'cafe', 'starbucks', 'cappuccino'],
  keywords_es = ARRAY['café', 'cafeteria', 'starbucks', 'cappuccino']
WHERE id = 'b419820d-6b5b-41c9-b5de-311b85668ca5';

-- TAG: farmácia (id: 4701a325-6b92-47c6-9679-775efa010e9b)
UPDATE category_tags SET 
  keywords_pt = ARRAY['farmácia', 'farmacia', 'drogaria', 'remédio', 'remedio', 'drogasil', 'droga raia', 'drogaraia', 'pague menos', 'ultrafarma', 'panvel', 'nissei', 'venancio', 'pacheco', 'araújo'],
  keywords_en = ARRAY['pharmacy', 'drugstore', 'medicine', 'cvs', 'walgreens', 'rite aid'],
  keywords_es = ARRAY['farmacia', 'drogueria', 'medicamento', 'remedio']
WHERE id = '4701a325-6b92-47c6-9679-775efa010e9b';

-- TAG: farmácia (id: d78e1c4a-b8c1-47c1-98f8-7d5bbc061d64)
UPDATE category_tags SET 
  keywords_pt = ARRAY['farmácia', 'farmacia', 'remédio', 'remedio', 'medicamento', 'drogaria', 'drogasil', 'droga raia', 'pague menos'],
  keywords_en = ARRAY['pharmacy', 'drugstore', 'medicine', 'cvs', 'walgreens'],
  keywords_es = ARRAY['farmacia', 'drogueria', 'medicamento']
WHERE id = 'd78e1c4a-b8c1-47c1-98f8-7d5bbc061d64';

-- TAG: farmácia (id: e998b9ef-47ce-4702-b229-0e49176e99f1)
UPDATE category_tags SET 
  keywords_pt = ARRAY['farmácia', 'farmacia', 'remédio', 'remedio', 'medicamento', 'drogaria', 'drogasil', 'droga raia'],
  keywords_en = ARRAY['pharmacy', 'drugstore', 'medicine', 'cvs'],
  keywords_es = ARRAY['farmacia', 'drogueria', 'medicamento']
WHERE id = 'e998b9ef-47ce-4702-b229-0e49176e99f1';

-- TAG: farmácia (id: c668432d-9c37-4970-b008-ed41ba4cbcff)
UPDATE category_tags SET 
  keywords_pt = ARRAY['farmácia', 'farmacia', 'remédio', 'remedio', 'medicamento', 'saúde', 'saude', 'drogaria'],
  keywords_en = ARRAY['pharmacy', 'drugstore', 'medicine', 'health'],
  keywords_es = ARRAY['farmacia', 'drogueria', 'medicamento', 'salud']
WHERE id = 'c668432d-9c37-4970-b008-ed41ba4cbcff';

-- TAG: combustível (id: 310c61db-9c98-4402-bd3e-6699af249841)
UPDATE category_tags SET 
  keywords_pt = ARRAY['combustível', 'combustivel', 'gasolina', 'álcool', 'alcool', 'etanol', 'diesel', 'shell', 'petrobras', 'ipiranga', 'br', 'posto', 'abastecimento'],
  keywords_en = ARRAY['fuel', 'gas', 'gasoline', 'diesel', 'shell', 'chevron', 'exxon', 'bp', 'gas station'],
  keywords_es = ARRAY['combustible', 'gasolina', 'diesel', 'shell', 'gasolinera', 'estacion']
WHERE id = '310c61db-9c98-4402-bd3e-6699af249841';

-- TAG: combustível (id: 1fe0a359-5c02-4339-84a9-1deb2b159e61)
UPDATE category_tags SET 
  keywords_pt = ARRAY['combustível', 'combustivel', 'gasolina', 'etanol', 'álcool', 'diesel', 'posto', 'abastecimento'],
  keywords_en = ARRAY['fuel', 'gas', 'gasoline', 'diesel', 'gas station'],
  keywords_es = ARRAY['combustible', 'gasolina', 'diesel', 'gasolinera']
WHERE id = '1fe0a359-5c02-4339-84a9-1deb2b159e61';

-- TAG: combustível (id: b8222b9e-8a4c-42b8-9e74-5c6955f13251)
UPDATE category_tags SET 
  keywords_pt = ARRAY['combustível', 'combustivel', 'gasolina', 'etanol', 'álcool', 'diesel', 'posto'],
  keywords_en = ARRAY['fuel', 'gas', 'gasoline', 'diesel'],
  keywords_es = ARRAY['combustible', 'gasolina', 'diesel']
WHERE id = 'b8222b9e-8a4c-42b8-9e74-5c6955f13251';

-- TAG: combustível que tinha keywords nulos (id: 94836473-9fab-4981-a805-cd09f3d2191f)
UPDATE category_tags SET 
  keywords_pt = ARRAY['combustível', 'combustivel', 'gasolina', 'etanol', 'álcool', 'diesel', 'posto', 'abastecimento'],
  keywords_en = ARRAY['fuel', 'gas', 'gasoline', 'diesel', 'gas station'],
  keywords_es = ARRAY['combustible', 'gasolina', 'diesel', 'gasolinera']
WHERE id = '94836473-9fab-4981-a805-cd09f3d2191f';

-- TAG: gasolina (id: c3e6fb8e-5611-4abb-bb89-bfde1537929b)
UPDATE category_tags SET 
  keywords_pt = ARRAY['gasolina', 'combustível', 'combustivel', 'posto', 'carro', 'abastecimento', 'shell', 'petrobras', 'ipiranga', 'br', 'etanol', 'álcool'],
  keywords_en = ARRAY['gasoline', 'gas', 'fuel', 'car', 'gas station', 'shell', 'chevron'],
  keywords_es = ARRAY['gasolina', 'combustible', 'gasolinera', 'carro', 'auto']
WHERE id = 'c3e6fb8e-5611-4abb-bb89-bfde1537929b';

-- TAG: restaurante (id: 7bad6f06-a4f6-4312-83de-52579f14a6e4)
UPDATE category_tags SET 
  keywords_pt = ARRAY['restaurante', 'jantar', 'almoço', 'almoco', 'comida', 'refeição', 'refeicao', 'buffet', 'rodízio', 'rodizio', 'churrascaria'],
  keywords_en = ARRAY['restaurant', 'dinner', 'lunch', 'meal', 'dining', 'buffet', 'steakhouse'],
  keywords_es = ARRAY['restaurante', 'cena', 'almuerzo', 'comida', 'buffet']
WHERE id = '7bad6f06-a4f6-4312-83de-52579f14a6e4';

-- TAG: restaurante (id: cfa72a36-2263-4ca0-b05b-73ee475a00a4)
UPDATE category_tags SET 
  keywords_pt = ARRAY['restaurante', 'jantar', 'almoço', 'almoco', 'comida', 'refeição', 'buffet', 'rodízio'],
  keywords_en = ARRAY['restaurant', 'dinner', 'lunch', 'meal', 'dining'],
  keywords_es = ARRAY['restaurante', 'cena', 'almuerzo', 'comida']
WHERE id = 'cfa72a36-2263-4ca0-b05b-73ee475a00a4';

-- TAG: restaurante (id: 61785503-f441-441e-922d-f0f9f30e6a00)
UPDATE category_tags SET 
  keywords_pt = ARRAY['restaurante', 'jantar', 'comida', 'almoço', 'refeição', 'buffet'],
  keywords_en = ARRAY['restaurant', 'dinner', 'food', 'lunch', 'meal'],
  keywords_es = ARRAY['restaurante', 'cena', 'comida', 'almuerzo']
WHERE id = '61785503-f441-441e-922d-f0f9f30e6a00';