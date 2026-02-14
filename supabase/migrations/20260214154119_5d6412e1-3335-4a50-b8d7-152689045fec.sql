-- Clean all active promotions to allow fresh re-scrape with corrected program detection
DELETE FROM scraped_promotions WHERE is_active = true;