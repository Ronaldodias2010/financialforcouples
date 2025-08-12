import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGlobalSettings, Language } from '@/contexts/GlobalSettingsContext';

const languages = [
  { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
];

const StableLanguageSelector = () => {
  const { language, setLanguage, currency, setCurrency, isInternational } = useGlobalSettings();
  
  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    console.log('🗣️ Language changed from', language, 'to', newLanguage);
    setLanguage(newLanguage);
    
    // Auto-adjust currency based on language/region
    if (newLanguage === 'pt' && !isInternational) {
      setCurrency('BRL');
    } else if (['en', 'es'].includes(newLanguage) && isInternational) {
      // For international users, prefer USD for EN and keep current for ES
      if (newLanguage === 'en') {
        setCurrency('USD');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Globe className="h-4 w-4" />
          <span>{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-white/20">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={
              language === lang.code 
                ? "bg-primary/10 text-primary cursor-pointer" 
                : "hover:bg-white/50 cursor-pointer"
            }
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StableLanguageSelector;
