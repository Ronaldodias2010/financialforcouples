import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

interface RentabilitySimulatorProps {
  userPreferredCurrency: string;
}

interface SimulationResult {
  finalAmount: number;
  totalInvested: number;
  totalReturn: number;
  returnPercentage: number;
  monthlyBreakdown: {
    month: number;
    investment: number;
    accumulated: number;
    interest: number;
  }[];
}

export const RentabilitySimulator = ({ userPreferredCurrency }: RentabilitySimulatorProps) => {
  const { formatCurrency } = useCurrencyConverter();
  const [formData, setFormData] = useState({
    initialAmount: "",
    monthlyAmount: "",
    annualRate: "",
    years: "",
    investmentType: "tesouro_selic"
  });
  const [result, setResult] = useState<SimulationResult | null>(null);

  const investmentTypes = [
    { value: "tesouro_selic", label: "Tesouro Selic", rate: 11.5 },
    { value: "tesouro_ipca", label: "Tesouro IPCA+", rate: 12.0 },
    { value: "cdb", label: "CDB", rate: 12.5 },
    { value: "lci_lca", label: "LCI/LCA", rate: 10.5 },
    { value: "fundos_di", label: "Fundos DI", rate: 10.8 },
    { value: "acoes", label: "Ações (histórico)", rate: 15.0 },
    { value: "fundos_imobiliarios", label: "Fundos Imobiliários", rate: 13.0 },
    { value: "custom", label: "Taxa Personalizada", rate: 0 }
  ];

  const calculateCompoundInterest = () => {
    const initial = parseFloat(formData.initialAmount) || 0;
    const monthly = parseFloat(formData.monthlyAmount) || 0;
    const selectedType = investmentTypes.find(t => t.value === formData.investmentType);
    const annualRate = formData.investmentType === "custom" 
      ? (parseFloat(formData.annualRate) || 0) / 100
      : (selectedType?.rate || 0) / 100;
    const years = parseFloat(formData.years) || 0;
    const months = years * 12;
    const monthlyRate = annualRate / 12;

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
        accumulated,
        interest: interestEarned
      });
    }

    const finalAmount = accumulated;
    const totalReturn = finalAmount - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    setResult({
      finalAmount,
      totalInvested,
      totalReturn,
      returnPercentage,
      monthlyBreakdown
    });
  };

  const resetSimulation = () => {
    setFormData({
      initialAmount: "",
      monthlyAmount: "",
      annualRate: "",
      years: "",
      investmentType: "tesouro_selic"
    });
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Simulador de Rentabilidade</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Simulação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parâmetros da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount">Valor Inicial</Label>
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
              <Label htmlFor="monthlyAmount">Aporte Mensal</Label>
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
              <Label htmlFor="investmentType">Tipo de Investimento</Label>
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
                <Label htmlFor="annualRate">Taxa Anual (%)</Label>
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

            <div className="space-y-2">
              <Label htmlFor="years">Período (anos)</Label>
              <Input
                id="years"
                type="number"
                step="0.5"
                value={formData.years}
                onChange={(e) => setFormData({...formData, years: e.target.value})}
                placeholder="5"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={calculateCompoundInterest} className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Simular
              </Button>
              <Button variant="outline" onClick={resetSimulation}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultados da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                {/* Resumo dos Resultados */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Final</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(result.finalAmount, userPreferredCurrency as any)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Rentabilidade</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.returnPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Investido</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {formatCurrency(result.totalInvested, userPreferredCurrency as any)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Lucro Total</p>
                    <p className="text-xl font-semibold text-orange-600">
                      {formatCurrency(result.totalReturn, userPreferredCurrency as any)}
                    </p>
                  </div>
                </div>

                {/* Comparação com outros investimentos */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Comparação com outros investimentos:</h4>
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
                              {formatCurrency(accumulated, userPreferredCurrency as any)}
                            </p>
                            <p className={`text-sm ${isHigher ? 'text-green-600' : 'text-red-600'}`}>
                              {isHigher ? '+' : ''}{formatCurrency(difference, userPreferredCurrency as any)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Dicas baseadas nos resultados */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.returnPercentage > 200 && (
                      <li>• Excelente! Sua estratégia pode multiplicar o investimento.</li>
                    )}
                    {parseFloat(formData.monthlyAmount) > 0 && (
                      <li>• Aportes regulares potencializam os juros compostos.</li>
                    )}
                    <li>• Considere diversificar entre diferentes tipos de investimento.</li>
                    <li>• Lembre-se de considerar a inflação no seu planejamento.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Preencha os dados e clique em "Simular" para ver os resultados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};