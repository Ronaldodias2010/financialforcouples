import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PasswordValidationProps {
  password: string;
  className?: string;
}

interface ValidationItemProps {
  isValid: boolean;
  text: string;
}

const ValidationItem = ({ isValid, text }: ValidationItemProps) => (
  <div className="flex items-center space-x-2">
    {isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )}
    <span className={`text-sm ${isValid ? 'text-green-500' : 'text-red-500'}`}>
      {text}
    </span>
  </div>
);

export const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber
  };
};

export const PasswordValidation = ({ password, className = "" }: PasswordValidationProps) => {
  const { t } = useLanguage();
  const validation = validatePassword(password);

  if (!password) return null;

  return (
    <div className={`bg-muted p-3 rounded-md space-y-2 ${className}`}>
      <p className="text-sm font-medium">{t('password.validation.title')}</p>
      <ValidationItem 
        isValid={validation.hasMinLength} 
        text={t('password.validation.minLength')} 
      />
      <ValidationItem 
        isValid={validation.hasUppercase} 
        text={t('password.validation.uppercase')} 
      />
      <ValidationItem 
        isValid={validation.hasLowercase} 
        text={t('password.validation.lowercase')} 
      />
      <ValidationItem 
        isValid={validation.hasNumber} 
        text={t('password.validation.number')} 
      />
    </div>
  );
};

export const PasswordMatchValidation = ({ passwordsMatch }: { passwordsMatch: boolean }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center space-x-2">
      {passwordsMatch ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
        {passwordsMatch ? t('password.validation.match') : t('password.validation.noMatch')}
      </span>
    </div>
  );
};