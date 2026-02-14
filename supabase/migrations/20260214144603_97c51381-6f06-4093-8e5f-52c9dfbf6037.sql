-- Clean invalid promotions data
DELETE FROM public.scraped_promotions 
WHERE destino IN ('Promoção Geral', 'Destino não especificado')
   OR titulo ILIKE '%is blocked%'
   OR titulo ILIKE '%rezync%';