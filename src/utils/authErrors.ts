import { Language } from '@/contexts/LanguageContext';

interface ErrorTranslation {
  pt: string;
  en: string;
  es: string;
}

const errorTranslations: Record<string, ErrorTranslation> = {
  'Email not confirmed': {
    pt: 'E-mail não confirmado. Verifique sua caixa de entrada.',
    en: 'Email not confirmed. Please check your inbox.',
    es: 'Correo no confirmado. Revise su bandeja de entrada.'
  },
  'Invalid login credentials': {
    pt: 'Credenciais inválidas. Verifique seu e-mail e senha.',
    en: 'Invalid credentials. Please check your email and password.',
    es: 'Credenciales inválidas. Verifique su correo y contraseña.'
  },
  'Password should be at least 6 characters': {
    pt: 'A senha deve ter pelo menos 6 caracteres.',
    en: 'Password should be at least 6 characters.',
    es: 'La contraseña debe tener al menos 6 caracteres.'
  },
  'Password must contain uppercase, lowercase and numbers': {
    pt: 'A senha deve conter letras maiúsculas, minúsculas e números.',
    en: 'Password must contain uppercase, lowercase and numbers.',
    es: 'La contraseña debe contener mayúsculas, minúsculas y números.'
  },
  'User not found': {
    pt: 'Usuário não encontrado.',
    en: 'User not found.',
    es: 'Usuario no encontrado.'
  },
  'Too many requests': {
    pt: 'Muitas tentativas. Tente novamente em alguns minutos.',
    en: 'Too many requests. Please try again in a few minutes.',
    es: 'Demasiados intentos. Inténtelo de nuevo en unos minutos.'
  },
  'Weak password': {
    pt: 'Senha muito fraca. Use pelo menos 6 caracteres com letras maiúsculas, minúsculas e números.',
    en: 'Weak password. Use at least 6 characters with uppercase, lowercase letters and numbers.',
    es: 'Contraseña débil. Use al menos 6 caracteres con mayúsculas, minúsculas y números.'
  },
  'Profile creation failed': {
    pt: 'Erro ao criar perfil de usuário. Por favor, tente novamente.',
    en: 'Failed to create user profile. Please try again.',
    es: 'Error al crear el perfil de usuario. Por favor, inténtelo de nuevo.'
  },
  'Phone number required': {
    pt: 'Número de telefone necessário para continuar',
    en: 'Phone number required to continue',
    es: 'Se requiere número de teléfono para continuar'
  }
};

export const translateAuthError = (error: string, language: Language): string => {
  // Verificar se o erro contém alguma das chaves conhecidas
  for (const [key, translations] of Object.entries(errorTranslations)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return translations[language];
    }
  }
  
  // Se não encontrou tradução, retornar mensagem genérica
  const genericError = {
    pt: 'Erro de autenticação. Tente novamente.',
    en: 'Authentication error. Please try again.',
    es: 'Error de autenticación. Inténtelo de nuevo.'
  };
  
  return genericError[language];
};