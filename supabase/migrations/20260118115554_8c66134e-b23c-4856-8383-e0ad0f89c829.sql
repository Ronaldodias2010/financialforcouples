-- Add tracking fields for SMS error logging and notification preferences
ALTER TABLE user_2fa_settings 
ADD COLUMN IF NOT EXISTS last_notification_channel TEXT,
ADD COLUMN IF NOT EXISTS last_sms_error_code TEXT,
ADD COLUMN IF NOT EXISTS last_sms_error_message TEXT,
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT true;