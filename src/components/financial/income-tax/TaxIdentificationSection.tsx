import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaxIdentificationSectionProps {
  profile: any;
  declarationType: 'individual' | 'joint';
}

export function TaxIdentificationSection({ profile, declarationType }: TaxIdentificationSectionProps) {
  const { t } = useLanguage();

  const hasProfile = !!profile;

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {t('tax.identification.help')}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Person A */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{t('tax.identification.personA')}</h4>
                <p className="text-sm text-muted-foreground">{t('tax.identification.mainDeclarant')}</p>
              </div>
              {hasProfile ? (
                <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              ) : (
                <Badge className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('tax.incomplete')}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax.identification.name')}</span>
                <span className="font-medium">{profile?.display_name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPF</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Person B (if joint declaration) */}
        {declarationType === 'joint' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-secondary/10">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-medium">{t('tax.identification.personB')}</h4>
                  <p className="text-sm text-muted-foreground">{t('tax.identification.partner')}</p>
                </div>
                {profile?.second_user_name ? (
                  <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OK
                  </Badge>
                ) : (
                  <Badge className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/20">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t('tax.incomplete')}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('tax.identification.name')}</span>
                  <span className="font-medium">{profile?.second_user_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPF</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Declaration Type Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            <strong>{t('tax.identification.declarationType')}:</strong>{' '}
            {declarationType === 'individual' 
              ? t('tax.identification.individualDesc')
              : t('tax.identification.jointDesc')
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
