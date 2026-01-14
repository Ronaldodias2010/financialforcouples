import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'none';

export interface TwoFactorSettings {
  id: string;
  user_id: string;
  method: TwoFactorMethod;
  is_enabled: boolean;
  phone_number: string | null;
  backup_codes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Use2FAReturn {
  settings: TwoFactorSettings | null;
  isLoading: boolean;
  isEnabled: boolean;
  method: TwoFactorMethod;
  fetchSettings: () => Promise<void>;
  enableTOTP: () => Promise<{ qrCode: string; secret: string } | null>;
  verifyTOTP: (code: string) => Promise<boolean>;
  enableSMS: (phoneNumber: string) => Promise<boolean>;
  verifySMS: (code: string) => Promise<boolean>;
  enableEmail: () => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
  disable2FA: () => Promise<boolean>;
  generateBackupCodes: () => Promise<string[] | null>;
  verifyBackupCode: (code: string) => Promise<boolean>;
  sendVerificationCode: (method: 'sms' | 'email') => Promise<boolean>;
}

export function use2FA(): Use2FAReturn {
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching 2FA settings:', error);
        return;
      }

      if (data) {
        setSettings({
          ...data,
          backup_codes_count: data.backup_codes?.length || 0,
        } as TwoFactorSettings);
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const enableTOTP = async (): Promise<{ qrCode: string; secret: string } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Use Supabase MFA to enroll TOTP
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Couples Financials 2FA'
      });

      if (error) {
        console.error('Error enrolling TOTP:', error);
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: t('2fa.error.enrollFailed'),
        });
        return null;
      }

      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      };
    } catch (error) {
      console.error('Error in enableTOTP:', error);
      return null;
    }
  };

  const verifyTOTP = async (code: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // First, get list of enrolled factors to find the correct factorId
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error listing factors:', factorsError);
        return false;
      }

      // Find the unverified TOTP factor (just enrolled)
      let factorId: string | null = null;
      
      // Check for unverified factors first (setup flow)
      if (factorsData?.totp && factorsData.totp.length > 0) {
        // Find unverified factor first, otherwise use the first verified one
        const unverifiedFactor = factorsData.totp.find(f => f.status === 'unverified');
        const verifiedFactor = factorsData.totp.find(f => f.status === 'verified');
        
        factorId = unverifiedFactor?.id || verifiedFactor?.id || null;
      }

      if (!factorId) {
        console.error('No TOTP factor found');
        return false;
      }

      console.log('[2FA] Using factorId:', factorId);

      // Get the challenge using the actual factor ID
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (challengeError) {
        console.error('Error getting challenge:', challengeError);
        return false;
      }

      console.log('[2FA] Challenge created:', challengeData.id);

      // Verify the code using the correct IDs
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) {
        console.error('Error verifying TOTP:', verifyError);
        return false;
      }

      console.log('[2FA] TOTP verified successfully');

      // Update 2FA settings in database
      await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          method: 'totp',
          is_enabled: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error in verifyTOTP:', error);
      return false;
    }
  };

  const sendVerificationCode = async (method: 'sms' | 'email'): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      if (method === 'email') {
        const { error } = await supabase.functions.invoke('send-2fa-email', {
          body: { userId: user.id, email: user.email }
        });

        if (error) {
          console.error('Error sending 2FA email:', error);
          return false;
        }
      } else if (method === 'sms') {
        const phoneNumber = settings?.phone_number;
        if (!phoneNumber) {
          toast({
            variant: 'destructive',
            title: t('2fa.error.title'),
            description: t('2fa.error.noPhone'),
          });
          return false;
        }

        const { error } = await supabase.functions.invoke('send-phone-verification', {
          body: { phoneNumber }
        });

        if (error) {
          console.error('Error sending SMS:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in sendVerificationCode:', error);
      return false;
    }
  };

  const enableSMS = async (phoneNumber: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Save phone number first
      await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      // Send verification code
      const { error } = await supabase.functions.invoke('send-phone-verification', {
        body: { phoneNumber }
      });

      if (error) {
        console.error('Error sending SMS:', error);
        return false;
      }

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error in enableSMS:', error);
      return false;
    }
  };

  const verifySMS = async (code: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Verify code in database
      const phoneNumber = settings?.phone_number;
      if (!phoneNumber) return false;

      const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber.replace(/\D/g, ''))
        .eq('verification_code', code)
        .gt('expires_at', new Date().toISOString())
        .eq('verified', false)
        .maybeSingle();

      if (error || !data) {
        console.error('SMS verification failed:', error);
        return false;
      }

      // Mark as verified
      await supabase
        .from('phone_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('id', data.id);

      // Enable 2FA via SMS
      await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          method: 'sms',
          is_enabled: true,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error in verifySMS:', error);
      return false;
    }
  };

  const enableEmail = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.functions.invoke('send-2fa-email', {
        body: { userId: user.id, email: user.email }
      });

      if (error) {
        console.error('Error sending 2FA email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in enableEmail:', error);
      return false;
    }
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Verify code in database
      const { data, error } = await supabase
        .from('user_2fa_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code_hash', code)
        .eq('method', 'email')
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .maybeSingle();

      if (error || !data) {
        console.error('Email verification failed:', error);
        return false;
      }

      // Mark code as used
      await supabase
        .from('user_2fa_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id);

      // Enable 2FA via email
      await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          method: 'email',
          is_enabled: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      return false;
    }
  };

  const disable2FA = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Disable in database
      const { error } = await supabase
        .from('user_2fa_settings')
        .update({
          is_enabled: false,
          method: 'none',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling 2FA:', error);
        return false;
      }

      // If TOTP was enabled, unenroll from Supabase MFA
      if (settings?.method === 'totp') {
        try {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          if (factors?.totp && factors.totp.length > 0) {
            await supabase.auth.mfa.unenroll({ factorId: factors.totp[0].id });
          }
        } catch (e) {
          console.error('Error unenrolling TOTP:', e);
        }
      }

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error in disable2FA:', error);
      return false;
    }
  };

  const generateBackupCodes = async (): Promise<string[] | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke('generate-backup-codes', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Error generating backup codes:', error);
        return null;
      }

      await fetchSettings();
      return data.codes;
    } catch (error) {
      console.error('Error in generateBackupCodes:', error);
      return null;
    }
  };

  const verifyBackupCode = async (code: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get current backup codes
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_2fa_settings')
        .select('backup_codes')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settingsData?.backup_codes) {
        return false;
      }

      // Check if code matches any backup code
      const backupCodes = settingsData.backup_codes as string[];
      const normalizedCode = code.toUpperCase().replace(/-/g, '');
      const codeIndex = backupCodes.findIndex(c => c === normalizedCode);

      if (codeIndex === -1) {
        return false;
      }

      // Remove used backup code and increment used count
      const newBackupCodes = [...backupCodes];
      newBackupCodes.splice(codeIndex, 1);

      await supabase
        .from('user_2fa_settings')
        .update({
          backup_codes: newBackupCodes,
          backup_codes_used: (settingsData as any).backup_codes_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error in verifyBackupCode:', error);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    isEnabled: settings?.is_enabled || false,
    method: settings?.method || 'none',
    fetchSettings,
    enableTOTP,
    verifyTOTP,
    enableSMS,
    verifySMS,
    enableEmail,
    verifyEmail,
    disable2FA,
    generateBackupCodes,
    verifyBackupCode,
    sendVerificationCode,
  };
}
