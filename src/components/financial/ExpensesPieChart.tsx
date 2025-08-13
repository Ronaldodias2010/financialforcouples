import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseByCategory {
  categoryName: string;
  amount: number;
  color: string;
}

interface ExpensesPieChartProps {
  viewMode: 'both' | 'user1' | 'user2';
}

export const ExpensesPieChart: React.FC<ExpensesPieChartProps> = ({ viewMode }) => {
  const { user } = useAuth();
  const { couple: coupleData } = useCouple();
  const { t } = useLanguage();
  
  const [expenseData, setExpenseData] = useState<ExpenseByCategory[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  const fetchExpensesByCategory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      let query = supabase
        .from('transactions')
        .select(`
          amount,
          categories!inner(name, color),
          owner_user
        `)
        .eq('type', 'expense')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      // Apply user filters based on viewMode
      if (viewMode === 'user1') {
        query = query.eq('owner_user', 'user1');
      } else if (viewMode === 'user2') {
        query = query.eq('owner_user', 'user2');
      }

      // Apply couple or individual user filter
      if (coupleData?.status === 'active') {
        const partnerId = coupleData.user1_id === user.id ? coupleData.user2_id : coupleData.user1_id;
        query = query.or(`user_id.eq.${user.id},user_id.eq.${partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses by category:', error);
        return;
      }

      // Group by category and sum amounts
      const categoryMap = new Map<string, { amount: number; color: string }>();
      
      data?.forEach((transaction) => {
        const categoryName = transaction.categories?.name || 'Sem categoria';
        const categoryColor = transaction.categories?.color || '#6366f1';
        const amount = Number(transaction.amount);
        
        if (categoryMap.has(categoryName)) {
          categoryMap.get(categoryName)!.amount += amount;
        } else {
          categoryMap.set(categoryName, { amount, color: categoryColor });
        }
      });

      // Convert to array and sort by amount
      const expensesByCategory = Array.from(categoryMap.entries())
        .map(([categoryName, { amount, color }]) => ({
          categoryName,
          amount,
          color
        }))
        .sort((a, b) => b.amount - a.amount);

      setExpenseData(expensesByCategory);
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesByCategory();
  }, [selectedMonth, viewMode, user, coupleData]);

  const chartData = {
    labels: expenseData.map(item => item.categoryName),
    datasets: [
      {
        data: expenseData.map(item => item.amount),
        backgroundColor: expenseData.map(item => item.color),
        borderColor: expenseData.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const total = expenseData.reduce((sum, item) => sum + item.amount, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const label = `${monthNames[date.getMonth()]} ${year}`;
      options.push({ value, label });
    }
    
    return options;
  };

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {totalExpenses > 0 && (
          <p className="text-sm text-muted-foreground">
            Total: R$ {totalExpenses.toFixed(2)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : expenseData.length > 0 ? (
          <div className="h-64">
            <Pie data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <p>Nenhuma despesa encontrada</p>
              <p className="text-sm">para o período selecionado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};