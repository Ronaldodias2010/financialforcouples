-- Remove mock/manual promotions to prepare for real API data
DELETE FROM airline_promotions WHERE data_source = 'manual';