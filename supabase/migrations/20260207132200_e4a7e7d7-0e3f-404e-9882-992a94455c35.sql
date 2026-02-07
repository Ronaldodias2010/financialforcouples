-- Update the LATAM Pass program to simulate a sync via browser extension
-- This is to test the visual confirmation in the card
UPDATE mileage_programs 
SET 
  sync_source = 'browser_extension', 
  status = 'connected', 
  balance_miles = 15000, 
  last_sync_at = NOW(),
  last_error = NULL,
  updated_at = NOW()
WHERE program_code = 'latam_pass' 
  AND user_id = 'fdc6cdb6-9478-4225-b450-93bfbaaf499a';