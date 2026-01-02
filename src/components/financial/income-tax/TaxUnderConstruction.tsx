import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Globe, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxCountry } from '@/hooks/useTaxCountry';

interface TaxUnderConstructionProps {
  country: TaxCountry;
  onChangeCountry: () => void;
}

export function TaxUnderConstruction({ country, onChangeCountry }: TaxUnderConstructionProps) {
  const { t } = useLanguage();

  const countryLabel = country === 'US' 
    ? t('tax.underConstruction.usa') 
    : t('tax.underConstruction.other');

  const countryFlag = country === 'US' ? '🇺🇸' : '🌍';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 p-4 bg-amber-500/10 rounded-full w-fit">
            <Construction className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <span>{countryFlag}</span>
            {t('tax.underConstruction.title')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CardDescription className="text-base">
            {t('tax.underConstruction.description').replace('{country}', countryLabel)}
          </CardDescription>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Globe className="h-5 w-5" />
              <span className="text-sm">{t('tax.underConstruction.comingSoon')}</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onChangeCountry}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('tax.underConstruction.changeCountry')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
