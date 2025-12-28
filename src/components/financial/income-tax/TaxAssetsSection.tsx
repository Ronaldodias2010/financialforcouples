import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Car, 
  TrendingUp, 
  Wallet,
  Edit,
  Info
} from 'lucide-react';
import { TaxAsset } from '@/hooks/useIncomeTaxReport';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaxAssetsSectionProps {
  assets: TaxAsset[];
  formatCurrency: (value: number) => string;
}

const assetIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  property: Home,
  vehicle: Car,
  investment: TrendingUp,
  bank_account: Wallet
};

const assetColors: Record<string, { color: string; bg: string }> = {
  property: { color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  vehicle: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  investment: { color: 'text-green-500', bg: 'bg-green-500/10' },
  bank_account: { color: 'text-purple-500', bg: 'bg-purple-500/10' }
};

export function TaxAssetsSection({ assets, formatCurrency }: TaxAssetsSectionProps) {
  const { t } = useLanguage();

  const totalValue = assets.reduce((sum, a) => sum + a.valueAtYearEnd, 0);

  if (assets.length === 0) {
    return (
      <div className="pt-4">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Home className="h-10 w-10 text-indigo-500 mb-3 opacity-50" />
            <p className="text-muted-foreground text-center">
              {t('tax.assets.noAssets')}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {t('tax.assets.autoDetected')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Info Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-center gap-3 py-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            {t('tax.assets.info')}
          </p>
        </CardContent>
      </Card>

      {/* Asset Cards */}
      <div className="grid gap-3">
        {assets.map((asset, index) => {
          const Icon = assetIcons[asset.type] || Wallet;
          const colors = assetColors[asset.type] || assetColors.bank_account;
          const valueChange = asset.valueAtYearEnd - asset.valueAtYearStart;

          return (
            <Card key={index} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colors.bg}`}>
                    <Icon className={`h-5 w-5 ${colors.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium truncate">{asset.description}</h4>
                        <p className="text-xs text-muted-foreground">
                          {t(`tax.assets.type.${asset.type}`)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {asset.owner === 'user1' ? t('tax.personA') : t('tax.personB')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('tax.assets.startValue')}</p>
                        <p className="font-medium">{formatCurrency(asset.valueAtYearStart)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('tax.assets.endValue')}</p>
                        <p className="font-bold">{formatCurrency(asset.valueAtYearEnd)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('tax.assets.variation')}</p>
                        <p className={`font-medium ${valueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {valueChange >= 0 ? '+' : ''}{formatCurrency(valueChange)}
                        </p>
                      </div>
                    </div>

                    {asset.irDescription && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                        <span className="text-muted-foreground">{t('tax.assets.irDescription')}:</span>{' '}
                        <span className="font-medium">{asset.irDescription}</span>
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total */}
      <Card className="bg-indigo-500/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-indigo-600">{t('tax.assets.totalValue')}</span>
            <span className="text-xl font-bold text-indigo-600">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
