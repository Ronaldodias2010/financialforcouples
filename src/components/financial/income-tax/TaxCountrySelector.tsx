import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxCountry } from '@/hooks/useTaxCountry';

interface TaxCountrySelectorProps {
  onSelect: (country: TaxCountry) => Promise<void>;
  isDetectedUS: boolean;
  isLoading?: boolean;
}

export function TaxCountrySelector({ onSelect, isDetectedUS, isLoading }: TaxCountrySelectorProps) {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<TaxCountry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries: { code: TaxCountry; flag: string; label: string }[] = [
    { code: 'BR', flag: '🇧🇷', label: t('tax.countrySelector.brazil') },
    { code: 'US', flag: '🇺🇸', label: t('tax.countrySelector.usa') },
    { code: 'OTHER', flag: '🌍', label: t('tax.countrySelector.other') }
  ];

  const handleConfirm = async () => {
    if (!selectedCountry) return;
    
    setIsSubmitting(true);
    try {
      await onSelect(selectedCountry);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('tax.countrySelector.title')}</CardTitle>
          <CardDescription>{t('tax.countrySelector.subtitle')}</CardDescription>
          
          {isDetectedUS && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-600 dark:text-amber-400 text-left">
                {t('tax.countrySelector.detected')}
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Country Options */}
          <div className="grid gap-3">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.code)}
                disabled={isLoading || isSubmitting}
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                  ${selectedCountry === country.code 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${(isLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-4xl">{country.flag}</span>
                <span className="text-lg font-medium">{country.label}</span>
                
                {selectedCountry === country.code && (
                  <div className="absolute right-4 p-1 bg-primary rounded-full">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                {country.code === 'US' && isDetectedUS && (
                  <Badge variant="outline" className="absolute right-4 top-2 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {t('tax.countrySelector.detectedBadge')}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedCountry || isSubmitting || isLoading}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
            ) : (
              t('tax.countrySelector.confirm')
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
