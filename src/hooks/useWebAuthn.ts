import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WebAuthnCredential {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject?: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string;
  };
  type: string;
  authenticatorAttachment?: string;
}

// Helper to encode ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to decode base64url to ArrayBuffer
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useWebAuthn() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      if (
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential === 'function'
      ) {
        try {
          // Check for platform authenticator (biometrics)
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  // Check if user has registered credentials
  const checkHasCredentials = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('webauthn-login-options', {
        body: { email },
      });

      if (error || data?.error === 'no_credentials') {
        setHasCredentials(false);
        return false;
      }

      setHasCredentials(true);
      return true;
    } catch {
      setHasCredentials(false);
      return false;
    }
  }, []);

  // Register a new biometric credential
  const registerCredential = useCallback(async (deviceName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get registration options from server
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-register-options'
      );

      if (optionsError || !optionsData?.options) {
        throw new Error(optionsError?.message || 'Falha ao obter opções de registro');
      }

      const options = optionsData.options;
      
      // Use the RP ID from server (which already handles environment detection)
      const rpId = options.rp.id;
      console.log('[WebAuthn] Using RP ID from server:', rpId);

      // Prepare public key credential creation options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlToArrayBuffer(options.challenge),
        rp: {
          name: options.rp.name,
          id: rpId,
        },
        user: {
          id: base64UrlToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: options.timeout,
        attestation: 'none',
        excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
          id: base64UrlToArrayBuffer(cred.id),
          type: cred.type,
          transports: cred.transports,
        })) || [],
      };

      // Create credential using platform authenticator (biometrics)
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Criação de credencial cancelada');
      }

      const attestationResponse = credential.response as AuthenticatorAttestationResponse;

      // Prepare credential for server verification
      const credentialForServer: WebAuthnCredential = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(attestationResponse.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(attestationResponse.attestationObject),
        },
        type: credential.type,
        authenticatorAttachment: (credential as any).authenticatorAttachment,
      };

      // Verify with server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-register-verify',
        {
          body: {
            credential: credentialForServer,
            deviceName: deviceName || 'Meu dispositivo',
          },
        }
      );

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || verifyData?.error || 'Falha na verificação');
      }

      setHasCredentials(true);
      return true;
    } catch (err: any) {
      console.error('[WebAuthn] Registration error:', err);
      
      // Handle specific errors
      if (err.name === 'NotAllowedError') {
        setError('Autenticação cancelada ou não permitida');
      } else if (err.name === 'SecurityError') {
        setError('Erro de segurança. Verifique se está usando HTTPS.');
      } else if (err.name === 'NotSupportedError') {
        setError('Seu dispositivo não suporta biometria');
      } else {
        setError(err.message || 'Erro ao registrar biometria');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Authenticate using biometric credential
  const authenticate = useCallback(async (email: string): Promise<{
    success: boolean;
    email?: string;
    actionLink?: string;
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get authentication options from server
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-login-options',
        { body: { email } }
      );

      if (optionsError || !optionsData?.options) {
        if (optionsData?.error === 'no_credentials') {
          throw new Error('Nenhuma credencial biométrica encontrada para este email');
        }
        throw new Error(optionsError?.message || 'Falha ao obter opções de login');
      }

      const options = optionsData.options;
      const userId = optionsData.userId;
      
      // Use the RP ID from server
      const rpId = options.rpId;
      console.log('[WebAuthn] Using RP ID from server for auth:', rpId);

      // Prepare public key credential request options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToArrayBuffer(options.challenge),
        rpId: rpId,
        allowCredentials: options.allowCredentials.map((cred: any) => ({
          id: base64UrlToArrayBuffer(cred.id),
          type: cred.type,
          transports: cred.transports,
        })),
        userVerification: 'required',
        timeout: options.timeout,
      };

      // Get credential using platform authenticator (biometrics)
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Autenticação cancelada');
      }

      const assertionResponse = credential.response as AuthenticatorAssertionResponse;

      // Prepare credential for server verification
      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(assertionResponse.clientDataJSON),
          authenticatorData: arrayBufferToBase64Url(assertionResponse.authenticatorData),
          signature: arrayBufferToBase64Url(assertionResponse.signature),
          userHandle: assertionResponse.userHandle 
            ? arrayBufferToBase64Url(assertionResponse.userHandle)
            : null,
        },
        type: credential.type,
      };

      // Verify with server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-login-verify',
        {
          body: {
            credential: credentialForServer,
            userId: userId,
          },
        }
      );

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || verifyData?.error || 'Falha na verificação');
      }

      return {
        success: true,
        email: verifyData.email,
        actionLink: verifyData.action_link,
      };
    } catch (err: any) {
      console.error('[WebAuthn] Authentication error:', err);
      
      // Handle specific errors
      if (err.name === 'NotAllowedError') {
        setError('Autenticação cancelada ou não permitida');
      } else if (err.name === 'SecurityError') {
        setError('Erro de segurança. Verifique se está usando HTTPS.');
      } else {
        setError(err.message || 'Erro ao autenticar com biometria');
      }
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSupported,
    isLoading,
    error,
    hasCredentials,
    registerCredential,
    authenticate,
    checkHasCredentials,
    clearError,
  };
}
