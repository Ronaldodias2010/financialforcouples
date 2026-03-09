-- Fix: link automatic debit to correct card (Inter Black - Ronaldo) and correct owner
UPDATE public.automatic_debits 
SET card_id = 'c76d59fe-81ff-4236-a136-c6bb63dfc609',  -- Inter Black (Ronaldo)
    owner_user = 'fdc6cdb6-9478-4225-b450-93bfbaaf499a' -- Ronaldo
WHERE id = 'cfc2660f-eb1d-488d-937a-6d66c5ebf24f';