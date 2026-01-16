import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { MapPin, Globe, ArrowRight, ArrowLeft, Check, DollarSign, Banknote, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardOption {
  id: string;
  name: string;
  card_type: string;
  user_id?: string;
}

export type MileageCalcType = 'brl' | 'usd' | 'both';

export interface RuleFormData {
  card_id: string;
  bank_name: string;
  card_brand: string;
  existing_miles: number;
  domestic: {
    enabled: boolean;
    currency: "BRL" | "USD" | "EUR";
    miles_per_amount: number;
    amount_threshold: number;
  };
  international: {
    enabled: boolean;
    currency: "BRL" | "USD" | "EUR";
    miles_per_amount: number;
    amount_threshold: number;
  };
}

interface MileageRuleWizardProps {
  cards: CardOption[];
  userId?: string;
  onSubmit: (data: RuleFormData) => void;
  onCancel: () => void;
}

export const MileageRuleWizard = ({ cards, userId, onSubmit, onCancel }: MileageRuleWizardProps) => {
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrencyConverter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mileageType, setMileageType] = useState<MileageCalcType | null>(null);
  
  const [formData, setFormData] = useState<RuleFormData>({
    card_id: "",
    bank_name: "",
    card_brand: "",
    existing_miles: 0,
    domestic: {
      enabled: true,
      currency: "BRL",
      miles_per_amount: 1,
      amount_threshold: 1,
    },
    international: {
      enabled: false,
      currency: "USD",
      miles_per_amount: 3,
      amount_threshold: 1,
    }
  });

  const canProceedStep1 = formData.card_id && formData.bank_name && formData.card_brand;

  const handleTypeSelection = (type: MileageCalcType) => {
    setMileageType(type);
    
    // Pre-configure form based on selection
    if (type === 'brl') {
      setFormData(prev => ({
        ...prev,
        domestic: { ...prev.domestic, enabled: true, currency: 'BRL' },
        international: { ...prev.international, enabled: false }
      }));
    } else if (type === 'usd') {
      setFormData(prev => ({
        ...prev,
        domestic: { ...prev.domestic, enabled: true, currency: 'USD' },
        international: { ...prev.international, enabled: false }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        domestic: { ...prev.domestic, enabled: true, currency: 'BRL' },
        international: { ...prev.international, enabled: true, currency: 'USD' }
      }));
    }
    
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step >= s 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div 
              className={cn(
                "w-12 h-0.5 mx-1",
                step > s ? "bg-primary" : "bg-muted"
              )} 
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Informações do Cartão</h3>
        <p className="text-sm text-muted-foreground">Selecione o cartão e preencha os dados básicos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="card">{t('mileage.card')}</Label>
          <Select 
            value={formData.card_id} 
            onValueChange={(value) => setFormData({...formData, card_id: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('mileage.selectCard')} />
            </SelectTrigger>
            <SelectContent>
              {cards.filter(card => card.user_id === userId).map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_name">{t('mileage.bankName')}</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
            placeholder={t('mileage.bankPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="card_brand">{t('mileage.cardBrand')}</Label>
          <Input
            id="card_brand"
            value={formData.card_brand}
            onChange={(e) => setFormData({...formData, card_brand: e.target.value})}
            placeholder={t('mileage.brandPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="existing_miles">{t('mileage.existingMiles')}</Label>
          <Input
            id="existing_miles"
            type="number"
            step="1"
            value={formData.existing_miles}
            onChange={(e) => setFormData({...formData, existing_miles: Number(e.target.value)})}
            placeholder="Ex: 15000"
          />
          <p className="text-xs text-muted-foreground">
            {t('mileage.existingMilesDescription')}
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button 
          type="button" 
          onClick={() => setStep(2)}
          disabled={!canProceedStep1}
        >
          Próximo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Como seu cartão calcula milhas?</h3>
        <p className="text-sm text-muted-foreground">Selecione a opção que corresponde ao seu cartão</p>
      </div>

      <div className="grid gap-4">
        {/* Opção BRL */}
        <button
          type="button"
          onClick={() => handleTypeSelection('brl')}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-accent",
            mileageType === 'brl' ? "border-primary bg-accent" : "border-muted"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Reais para Milhas (BRL)</h4>
                <Badge variant="outline" className="border-green-500 text-green-600">Mais Comum</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Meu cartão calcula milhas baseado em Reais gastos
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Exemplo:</span> R$ 4,00 gastos = 1 milha
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                Nubank, Inter, C6 Bank, Itaú Click, Santander Free
              </p>
            </div>
          </div>
        </button>

        {/* Opção USD */}
        <button
          type="button"
          onClick={() => handleTypeSelection('usd')}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-accent",
            mileageType === 'usd' ? "border-primary bg-accent" : "border-muted"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Dólar para Milhas (USD)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Meu cartão converte para dólar antes de calcular milhas
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Exemplo:</span> US$ 1,00 gasto = 2 milhas
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                Itaú Personnalité, Bradesco Prime, XP Visa Infinite
              </p>
            </div>
          </div>
        </button>

        {/* Opção Ambos */}
        <button
          type="button"
          onClick={() => handleTypeSelection('both')}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-accent",
            mileageType === 'both' ? "border-primary bg-accent" : "border-muted"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Regras Diferentes (Nacional e Internacional)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Meu cartão tem taxas diferentes para compras nacionais e internacionais
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Exemplo:</span> Nacional: R$ 4 = 1 pt | Internacional: US$ 1 = 2 pts
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                American Express, Mastercard Black, Visa Signature
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-start pt-4">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Configure sua regra de pontos</h3>
        <p className="text-sm text-muted-foreground">
          {mileageType === 'both' 
            ? 'Configure as taxas para compras nacionais e internacionais'
            : `Configure quantos pontos você ganha por ${mileageType === 'brl' ? 'real' : 'dólar'} gasto`
          }
        </p>
      </div>

      <div className={cn(
        "grid gap-4",
        mileageType === 'both' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"
      )}>
        {/* Card Nacional - sempre visível para 'brl' e 'both' */}
        {(mileageType === 'brl' || mileageType === 'both') && (
          <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">
                {mileageType === 'both' ? 'Compras Nacionais' : 'Regra de Pontuação'}
              </h4>
            </div>
            {mileageType === 'both' && (
              <p className="text-xs text-muted-foreground mb-4">Compras realizadas no Brasil (BRL)</p>
            )}
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Moeda da Regra</Label>
                <Select 
                  value={formData.domestic.currency} 
                  onValueChange={(value: "BRL" | "USD" | "EUR") => setFormData({
                    ...formData, 
                    domestic: {...formData.domestic, currency: value}
                  })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.domestic.currency !== 'BRL' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    BRL → {formData.domestic.currency} (conversão automática)
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Pontos ganhos</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-9"
                    value={formData.domestic.miles_per_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      domestic: {...formData.domestic, miles_per_amount: Number(e.target.value)}
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">A cada ({formData.domestic.currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9"
                    value={formData.domestic.amount_threshold}
                    onChange={(e) => setFormData({
                      ...formData, 
                      domestic: {...formData.domestic, amount_threshold: Number(e.target.value)}
                    })}
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div className="p-3 bg-background rounded-lg border text-sm">
                <span className="text-muted-foreground">Simulação: </span>
                {formData.domestic.currency !== 'BRL' ? (
                  <span>
                    R$ 100 → {getCurrencySymbol(formData.domestic.currency)} {(100 * (formData.domestic.currency === 'USD' ? 0.18 : 0.16)).toFixed(2)} → <span className="text-green-600 font-medium">≈ {Math.floor(((100 * (formData.domestic.currency === 'USD' ? 0.18 : 0.16)) / formData.domestic.amount_threshold) * formData.domestic.miles_per_amount)} pts</span>
                  </span>
                ) : (
                  <span>
                    R$ 100 gastos → <span className="text-green-600 font-medium">{Math.floor((100 / formData.domestic.amount_threshold) * formData.domestic.miles_per_amount)} pontos</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Card USD - visível para 'usd' */}
        {mileageType === 'usd' && (
          <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Regra de Pontuação</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Compras são convertidas para dólar antes de calcular pontos
            </p>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Pontos ganhos</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-9"
                    value={formData.domestic.miles_per_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      domestic: {...formData.domestic, miles_per_amount: Number(e.target.value)}
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">A cada (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9"
                    value={formData.domestic.amount_threshold}
                    onChange={(e) => setFormData({
                      ...formData, 
                      domestic: {...formData.domestic, amount_threshold: Number(e.target.value)}
                    })}
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div className="p-3 bg-background rounded-lg border text-sm">
                <span className="text-muted-foreground">Simulação: </span>
                <span>
                  R$ 100 → ≈ US$ 18,00 → <span className="text-blue-600 font-medium">{Math.floor((18 / formData.domestic.amount_threshold) * formData.domestic.miles_per_amount)} pontos</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card Internacional - visível apenas para 'both' */}
        {mileageType === 'both' && (
          <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Compras Internacionais</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Compras no exterior (USD/EUR)</p>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Moeda da Regra</Label>
                <Select 
                  value={formData.international.currency} 
                  onValueChange={(value: "BRL" | "USD" | "EUR") => setFormData({
                    ...formData, 
                    international: {...formData.international, currency: value}
                  })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Pontos ganhos</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-9"
                    value={formData.international.miles_per_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      international: {...formData.international, miles_per_amount: Number(e.target.value)}
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">A cada ({formData.international.currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9"
                    value={formData.international.amount_threshold}
                    onChange={(e) => setFormData({
                      ...formData, 
                      international: {...formData.international, amount_threshold: Number(e.target.value)}
                    })}
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div className="p-3 bg-background rounded-lg border text-sm">
                <span className="text-muted-foreground">Simulação: </span>
                <span>
                  {getCurrencySymbol(formData.international.currency)} 100 → <span className="text-blue-600 font-medium">{Math.floor((100 / formData.international.amount_threshold) * formData.international.miles_per_amount)} pontos</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit" onClick={handleSubmit}>
          {mileageType === 'both' ? 'Criar 2 Regras' : 'Criar Regra'}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('mileage.ruleTitle')}</CardTitle>
        <CardDescription>
          {t('mileage.ruleDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}
        
        <form onSubmit={(e) => e.preventDefault()}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </form>
      </CardContent>
    </Card>
  );
};
