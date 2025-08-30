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
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-red-500" />
    )}
    <span className={`text-xs ${isValid ? 'text-green-500' : 'text-red-500'}`}>
      {text}
    </span>
  </div>
);

export const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
  };
};

export const PasswordValidation = ({ password, className = "" }: PasswordValidationProps) => {
  const { t } = useLanguage();
  const validation = validatePassword(password);

  if (!password) return null;

  return (
    <div className={`bg-muted/50 p-3 rounded-md space-y-1.5 ${className}`}>
      <p className="text-xs font-medium text-muted-foreground">Regras para a senha:</p>
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
      <ValidationItem 
        isValid={validation.hasSpecialChar} 
        text={t('password.validation.specialChar')} 
      />
    </div>
  );
};

export const PasswordMatchValidation = ({ passwordsMatch }: { passwordsMatch: boolean }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center space-x-2">
      {passwordsMatch ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500" />
      )}
      <span className={`text-xs ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
        {passwordsMatch ? t('password.validation.match') : t('password.validation.noMatch')}
      </span>
    </div>
  );
};