import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, DollarSign, Target, Clock } from "lucide-react";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import type { CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useLanguage } from "@/hooks/useLanguage";
import { formatMonetaryValue, parseMonetaryValue } from "@/utils/monetary";

interface RentabilitySimulatorProps {
  userPreferredCurrency: string;
}

interface SimulationResult {
  finalAmount: number;
  totalInvested: number;
  totalReturn: number;
  returnPercentage: number;
  timeToGoal?: {
    years: number;
    months: number;
    achievable: boolean;
  };
  monthlyBreakdown: {
    month: number;
    investment: number;
    accumulated: number;
    interest: number;
  }[];
}

export const RentabilitySimulator = ({ userPreferredCurrency }: RentabilitySimulatorProps) => {
  const { t, language } = useLanguage();
  const { formatCurrency, convertCurrency } = useCurrencyConverter();
  const [simulationMode, setSimulationMode] = useState<'time' | 'goal'>('time');
  const [formData, setFormData] = useState({
    initialAmount: "",
    monthlyAmount: "",
    annualRate: "",
    years: "",
    targetGoal: "",
    targetCurrency: language === 'pt' ? 'BRL' : language === 'en' ? 'USD' : 'EUR',
    investmentType: language === 'pt' ? "tesouro_selic" : "treasury_bills"
  });
  const [result, setResult] = useState<SimulationResult | null>(null);

  const getInvestmentTypes = () => {
    if (language === 'pt') {
      return [
        { value: "tesouro_selic", label: "Tesouro Selic", rate: 11.5 },
        { value: "tesouro_ipca", label: "Tesouro IPCA+", rate: 12.0 },
        { value: "cdb", label: "CDB", rate: 12.5 },
        { value: "lci_lca", label: "LCI/LCA", rate: 10.5 },
        { value: "fundos_di", label: "Fundos DI", rate: 10.8 },
        { value: "acoes", label: "Ações (histórico)", rate: 15.0 },
        { value: "fundos_imobiliarios", label: "Fundos Imobiliários", rate: 13.0 },
        { value: "custom", label: "Taxa Personalizada", rate: 0 }
      ];
    } else {
      // US/International market investments
      return [
        { value: "treasury_bills", label: t('simulator.investments.treasuryBills') || 'Treasury Bills', rate: 4.5 },
        { value: "treasury_notes", label: t('simulator.investments.treasuryNotes') || 'Treasury Notes', rate: 4.8 },
        { value: "treasury_bonds", label: t('simulator.investments.treasuryBonds') || 'Treasury Bonds', rate: 5.0 },
        { value: "corporate_bonds", label: t('simulator.investments.corporateBonds') || 'Corporate Bonds', rate: 6.5 },
        { value: "cds", label: t('simulator.investments.cds') || 'Certificates of Deposit', rate: 4.2 },
        { value: "stocks", label: t('simulator.investments.stocks') || 'Stocks (historical)', rate: 10.0 },
        { value: "etfs", label: t('simulator.investments.etfs') || 'ETFs', rate: 8.5 },
        { value: "reits", label: t('simulator.investments.reits') || 'REITs', rate: 7.8 },
        { value: "custom", label: t('simulator.investments.custom') || 'Custom Rate', rate: 0 }
      ];
    }
  };

  const investmentTypes = getInvestmentTypes();

  const calculateTimeToGoal = (initial: number, monthly: number, monthlyRate: number, targetGoal: number) => {
    if (targetGoal <= initial) {
      return { years: 0, months: 0, achievable: true };
    }

    if (monthly <= 0 && monthlyRate <= 0) {
      return { years: 0, months: 0, achievable: false };
    }

    let accumulated = initial;
    let months = 0;
    const maxMonths = 100 * 12; // Limite máximo de 100 anos

    while (accumulated < targetGoal && months < maxMonths) {
      months++;
      const interestEarned = accumulated * monthlyRate;
      accumulated += interestEarned + monthly;
    }

    if (months >= maxMonths) {
      return { years: 0, months: 0, achievable: false };
    }

    return {
      years: Math.floor(months / 12),
      months: months % 12,
      achievable: true
    };
  };

  const calculateCompoundInterest = () => {
    const initial = parseMonetaryValue(formData.initialAmount);
    const monthly = parseMonetaryValue(formData.monthlyAmount);
    const selectedType = investmentTypes.find(t => t.value === formData.investmentType);
    const annualRate = formData.investmentType === "custom" 
      ? (parseMonetaryValue(formData.annualRate)) / 100
      : (selectedType?.rate || 0) / 100;
    const monthlyRate = annualRate / 12;

    let timeToGoal: { years: number; months: number; achievable: boolean } | undefined;

    // Se estiver no modo Meta, calcular o tempo necessário
    if (simulationMode === 'goal' && formData.targetGoal) {
      let targetGoalValue = parseMonetaryValue(formData.targetGoal);
      
      // Converter meta para moeda do usuário se necessário
      if (formData.targetCurrency !== userPreferredCurrency) {
        targetGoalValue = convertCurrency(
          targetGoalValue,
          formData.targetCurrency as CurrencyCode,
          userPreferredCurrency as CurrencyCode
        );
      }

      timeToGoal = calculateTimeToGoal(initial, monthly, monthlyRate, targetGoalValue);
    }

    // Calcular com base no período definido ou na meta
    const years = simulationMode === 'time' 
      ? parseFloat(formData.years) || 0 
      : (timeToGoal?.achievable ? timeToGoal.years + (timeToGoal.months / 12) : 10);
    
    const months = years * 12;

    let accumulated = initial;
    const monthlyBreakdown = [];
    let totalInvested = initial;

    for (let month = 1; month <= months; month++) {
      const interestEarned = accumulated * monthlyRate;
      accumulated += interestEarned + monthly;
      totalInvested += monthly;

      monthlyBreakdown.push({
        month,
        investment: monthly,
        accumulated: formatMonetaryValue(accumulated),
        interest: formatMonetaryValue(interestEarned)
      });
    }

    const finalAmount = formatMonetaryValue(accumulated);
    const totalReturn = formatMonetaryValue(finalAmount - totalInvested);
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    setResult({
      finalAmount,
      totalInvested: formatMonetaryValue(totalInvested),
      totalReturn,
      returnPercentage,
      timeToGoal,
      monthlyBreakdown
    });
  };

  const resetSimulation = () => {
    setFormData({
      initialAmount: "",
      monthlyAmount: "",
      annualRate: "",
      years: "",
      targetGoal: "",
      targetCurrency: language === 'pt' ? 'BRL' : language === 'en' ? 'USD' : 'EUR',
      investmentType: language === 'pt' ? "tesouro_selic" : "treasury_bills"
    });
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('simulator.title')}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Simulação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t('simulator.parameters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seletor de Modo */}
            <div className="space-y-2">
              <Label>{t('simulator.parameters')}</Label>
              <div className="flex gap-2">
                <Button
                  variant={simulationMode === 'time' ? 'default' : 'outline'}
                  onClick={() => setSimulationMode('time')}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t('simulator.timeMode')}
                </Button>
                <Button
                  variant={simulationMode === 'goal' ? 'default' : 'outline'}
                  onClick={() => setSimulationMode('goal')}
                  className="flex-1"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {t('simulator.goalMode')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialAmount">{t('simulator.initialAmount')}</Label>
              <Input
                id="initialAmount"
                type="number"
                step="0.01"
                value={formData.initialAmount}
                onChange={(e) => setFormData({...formData, initialAmount: e.target.value})}
                placeholder="10000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">{t('simulator.monthlyAmount')}</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                value={formData.monthlyAmount}
                onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value})}
                placeholder="1000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentType">{t('simulator.investmentType')}</Label>
              <Select
                value={formData.investmentType}
                onValueChange={(value) => setFormData({...formData, investmentType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.rate > 0 && `(${type.rate}% a.a.)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.investmentType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="annualRate">{t('simulator.customRate')}</Label>
                <Input
                  id="annualRate"
                  type="number"
                  step="0.1"
                  value={formData.annualRate}
                  onChange={(e) => setFormData({...formData, annualRate: e.target.value})}
                  placeholder="12.0"
                />
              </div>
            )}

            {/* Campos condicionais baseados no modo */}
            {simulationMode === 'time' ? (
              <div className="space-y-2">
                <Label htmlFor="years">{t('simulator.period')}</Label>
                <Input
                  id="years"
                  type="number"
                  step="0.5"
                  value={formData.years}
                  onChange={(e) => setFormData({...formData, years: e.target.value})}
                  placeholder="5"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetGoal">{t('simulator.targetGoal')}</Label>
                  <Input
                    id="targetGoal"
                    type="number"
                    step="0.01"
                    value={formData.targetGoal}
                    onChange={(e) => setFormData({...formData, targetGoal: e.target.value})}
                    placeholder="100000.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCurrency">{t('simulator.targetCurrency')}</Label>
                  <Select
                    value={formData.targetCurrency}
                    onValueChange={(value) => setFormData({...formData, targetCurrency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={calculateCompoundInterest} className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                {t('simulator.simulate')}
              </Button>
              <Button variant="outline" onClick={resetSimulation}>
                {t('simulator.clear')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('simulator.results')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                {/* Resultado da Meta (se aplicável) */}
                {simulationMode === 'goal' && result.timeToGoal && (
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-primary">{t('simulator.timeToGoal')}</h4>
                    </div>
                    {result.timeToGoal.achievable ? (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {result.timeToGoal.years > 0 && `${result.timeToGoal.years} ${result.timeToGoal.years === 1 ? t('simulator.year') : t('simulator.years')}`}
                          {result.timeToGoal.years > 0 && result.timeToGoal.months > 0 && ' e '}
                          {result.timeToGoal.months > 0 && `${result.timeToGoal.months} ${result.timeToGoal.months === 1 ? t('simulator.month') : t('simulator.months')}`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('simulator.goalAchievable')} {formatCurrency(parseMonetaryValue(formData.targetGoal), formData.targetCurrency as CurrencyCode)}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-lg font-semibold text-red-600">
                          {t('simulator.goalNotAchievable')}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('simulator.increaseContribution')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Resumo dos Resultados */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('simulator.finalAmount')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(result.finalAmount, formData.targetCurrency as CurrencyCode)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('simulator.profitability')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.returnPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('simulator.totalInvested')}</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {formatCurrency(result.totalInvested, formData.targetCurrency as CurrencyCode)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('simulator.totalProfit')}</p>
                    <p className="text-xl font-semibold text-orange-600">
                      {formatCurrency(result.totalReturn, formData.targetCurrency as CurrencyCode)}
                    </p>
                  </div>
                </div>

                {/* Comparação com outros investimentos */}
                <div className="space-y-3">
                  <h4 className="font-semibold">{t('simulator.comparison')}</h4>
                  {investmentTypes
                    .filter(type => type.value !== "custom" && type.value !== formData.investmentType)
                    .slice(0, 3)
                    .map(type => {
                      // Recalcular para cada tipo
                      const initial = parseFloat(formData.initialAmount) || 0;
                      const monthly = parseFloat(formData.monthlyAmount) || 0;
                      const years = parseFloat(formData.years) || 0;
                      const months = years * 12;
                      const monthlyRate = (type.rate / 100) / 12;
                      
                      let accumulated = initial;
                      let totalInvested = initial;
                      
                      for (let month = 1; month <= months; month++) {
                        const interestEarned = accumulated * monthlyRate;
                        accumulated += interestEarned + monthly;
                        totalInvested += monthly;
                      }
                      
                      const difference = accumulated - result.finalAmount;
                      const isHigher = difference > 0;

                      return (
                        <div key={type.value} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                          <span className="font-medium">{type.label}</span>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(accumulated, formData.targetCurrency as CurrencyCode)}
                            </p>
                            <p className={`text-sm ${isHigher ? 'text-green-600' : 'text-red-600'}`}>
                              {isHigher ? '+' : ''}{formatCurrency(difference, formData.targetCurrency as CurrencyCode)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Dicas baseadas nos resultados */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">{t('simulator.tips')}</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.returnPercentage > 200 && (
                      <li>{t('simulator.excellent')}</li>
                    )}
                    {parseFloat(formData.monthlyAmount) > 0 && (
                      <li>{t('simulator.regularContributions')}</li>
                    )}
                    <li>{t('simulator.diversify')}</li>
                    <li>{t('simulator.inflation')}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('simulator.fillData')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};