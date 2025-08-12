import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, BarChart3, TrendingUp } from "lucide-react";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
  currency: string;
  is_shared: boolean;
  owner_user: string;
  broker?: string;
  notes?: string;
  goal_id?: string;
}

interface PortfolioChartProps {
  investments: Investment[];
  userPreferredCurrency: string;
}

export const PortfolioChart = ({ investments, userPreferredCurrency }: PortfolioChartProps) => {
  const { convertCurrency, formatCurrency } = useCurrencyConverter();
  const { t } = useLanguage();

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'renda_fixa': 'Renda Fixa',
      'renda_variavel': 'Renda Variável',
      'cripto': 'Criptomoedas',
      'fundos': 'Fundos',
      'tesouro_direto': 'Tesouro Direto'
    };
    return types[type] || type;
  };

  // Distribuição por tipo
  const distributionByType = investments.reduce((acc, investment) => {
    const value = convertCurrency(investment.current_value, investment.currency as any, userPreferredCurrency as any);
    const typeLabel = getTypeLabel(investment.type);
    acc[typeLabel] = (acc[typeLabel] || 0) + value;
    return acc;
  }, {} as { [key: string]: number });

  const pieData = {
    labels: Object.keys(distributionByType),
    datasets: [
      {
        label: t('portfolioChart.investedValue'),
        data: Object.values(distributionByType),
        backgroundColor: [
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#3B82F6',
          '#6366F1',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Rentabilidade por investimento
  const returnsData = investments.map(investment => {
    const returnValue = investment.current_value - investment.amount;
    const returnPercentage = investment.amount > 0 ? (returnValue / investment.amount) * 100 : 0;
    return {
      name: investment.name,
      returnPercentage,
      returnValue: convertCurrency(returnValue, investment.currency as any, userPreferredCurrency as any)
    };
  }).sort((a, b) => b.returnPercentage - a.returnPercentage);

  const barData = {
    labels: returnsData.map(item => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name),
    datasets: [
      {
        label: t('portfolioChart.profitabilityPercent'),
        data: returnsData.map(item => item.returnPercentage),
        backgroundColor: returnsData.map(item => 
          item.returnPercentage >= 0 ? '#10B981' : '#EF4444'
        ),
        borderColor: returnsData.map(item => 
          item.returnPercentage >= 0 ? '#059669' : '#DC2626'
        ),
        borderWidth: 1,
      },
    ],
  };

  // Evolução temporal (simulada - seria ideal ter dados históricos reais)
  const monthlyData = () => {
    const months = [];
    const values = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
      
      // Simulação de crescimento - em um caso real, viria do historical data
      const baseValue = investments.reduce((total, inv) => {
        return total + convertCurrency(inv.amount, inv.currency as any, userPreferredCurrency as any);
      }, 0);
      
      const growthFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5% de variação
      values.push(baseValue * growthFactor * (1 + i * 0.02)); // Tendência de crescimento
    }
    
    return { months, values };
  };

  const { months, values } = monthlyData();

  const lineData = {
    labels: months,
    datasets: [
      {
        label: t('portfolioChart.totalPortfolioValue'),
        data: values,
        fill: false,
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        tension: 0.1,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            if (context.chart.config.type === 'pie') {
              const value = context.raw;
              return `${label}: ${formatCurrency(value, userPreferredCurrency as any)}`;
            }
            return `${label}: ${context.formattedValue}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value, userPreferredCurrency as any)} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('portfolioChart.emptyState')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('portfolioChart.analysis')}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t('portfolioChart.distributionByType')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidade por Investimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('portfolioChart.profitabilityByInvestment')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={barData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('portfolioChart.portfolioEvolution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={lineData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('portfolioChart.bestInvestment')}</h3>
              {returnsData.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">{returnsData[0].name}</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{returnsData[0].returnPercentage.toFixed(2)}%
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('portfolioChart.diversification')}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(distributionByType).length}
              </p>
              <p className="text-sm text-muted-foreground">{t('portfolioChart.differentTypes')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('portfolioChart.totalInvestments')}</h3>
              <p className="text-2xl font-bold text-purple-600">
                {investments.length}
              </p>
              <p className="text-sm text-muted-foreground">{t('portfolioChart.activeInvestments')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};