import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { format } from 'date-fns';

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
  const { names } = usePartnerNames();
  
  const [expenseDataUser1, setExpenseDataUser1] = useState<ExpenseByCategory[]>([]);
  const [expenseDataUser2, setExpenseDataUser2] = useState<ExpenseByCategory[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseByCategory[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  // Function to translate category names from database to localized names
  const translateCategoryName = React.useCallback((categoryName: string): string => {
    if (!categoryName) return t('categories.uncategorized');
    
    console.log('translateCategoryName called with:', categoryName, 'current lang test:', t('categories.food'));
    
    // Normalize the category name (remove accents and convert to lowercase for better matching)
    const normalizedName = categoryName.toLowerCase().trim();
    
    const categoryMap: { [key: string]: string } = {
      // Portuguese variations
      'alimentação': t('categories.food'),
      'alimentacao': t('categories.food'),
      'comida': t('categories.food'),
      'transporte': t('categories.transport'),
      'combustível': t('categories.fuel'),
      'combustivel': t('categories.fuel'),
      'gasolina': t('categories.fuel'),
      'saúde': t('categories.health'),
      'saude': t('categories.health'),
      'entretenimento': t('categories.entertainment'),
      'educação': t('categories.education'),
      'educacao': t('categories.education'),
      'moradia': t('categories.housing'),
      'casa': t('categories.housing'),
      'vestuário': t('categories.clothing'),
      'vestuario': t('categories.clothing'),
      'roupa': t('categories.clothing'),
      'utilidades': t('categories.utilities'),
      'contas': t('categories.utilities'),
      'contas básicas': t('categories.basicBills'),
      'contas basicas': t('categories.basicBills'),
      'presente ou doação': t('categories.giftOrDonation'),
      'presente ou doacao': t('categories.giftOrDonation'),
      'aposentadoria': t('categories.retirement'),
      'reembolso': t('categories.refund'),
      'outros': t('categories.other'),
      'outro': t('categories.other'),
      
      // English variations
      'food': t('categories.food'),
      'transportation': t('categories.transport'),
      'transport': t('categories.transport'),
      'fuel': t('categories.fuel'),
      'gas': t('categories.fuel'),
      'gasoline': t('categories.fuel'),
      'health': t('categories.health'),
      'entertainment': t('categories.entertainment'),
      'education': t('categories.education'),
      'housing': t('categories.housing'),
      'clothing': t('categories.clothing'),
      'utilities': t('categories.utilities'),
      'basic bills': t('categories.basicBills'),
      'gift or donation': t('categories.giftOrDonation'),
      'retirement': t('categories.retirement'),
      'refund': t('categories.refund'),
      'other': t('categories.other'),
      
      // Spanish variations
      'alimentación': t('categories.food'),
      'alimentacion': t('categories.food'),
      'combustible': t('categories.fuel'),
      'salud': t('categories.health'),
      'entretenimiento': t('categories.entertainment'),
      'educación': t('categories.education'),
      'educacion': t('categories.education'),
      'vivienda': t('categories.housing'),
      'ropa': t('categories.clothing'),
      'servicios': t('categories.utilities'),
      'cuentas básicas': t('categories.basicBills'),
      'cuentas basicas': t('categories.basicBills'),
      'regalo o donación': t('categories.giftOrDonation'),
      'regalo o donacion': t('categories.giftOrDonation'),
      'jubilación': t('categories.retirement'),
      'jubilacion': t('categories.retirement'),
      'otros': t('categories.other'),
    };

    const result = categoryMap[normalizedName] || categoryName;
    console.log('translateCategoryName result:', normalizedName, '->', result);
    return result;
  }, [t]); // Dependency on 't' so it updates when language changes

  const fetchExpensesByCategory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd');
      
      let query = supabase
        .from('transactions')
        .select(`
          amount,
          user_id,
          categories!inner(name, color)
        `)
        .eq('type', 'expense')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      // Apply couple or individual user filter first
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

      // Group by category and sum amounts for each user separately
      const categoryMapUser1 = new Map<string, { amount: number; color: string }>();
      const categoryMapUser2 = new Map<string, { amount: number; color: string }>();
      const categoryMapBoth = new Map<string, { amount: number; color: string }>();
      
      data?.forEach((transaction) => {
        const originalCategoryName = transaction.categories?.name || t('categories.uncategorized');
        const categoryName = translateCategoryName(originalCategoryName);
        const categoryColor = transaction.categories?.color || '#6366f1';
        const amount = Number(transaction.amount);
        
        // Determine which user this transaction belongs to
        let ownerUser = 'user1';
        if (coupleData?.status === 'active') {
          if (transaction.user_id === coupleData.user1_id) {
            ownerUser = 'user1';
          } else if (transaction.user_id === coupleData.user2_id) {
            ownerUser = 'user2';
          }
        }
        
        // Add to "both" map
        if (categoryMapBoth.has(categoryName)) {
          categoryMapBoth.get(categoryName)!.amount += amount;
        } else {
          categoryMapBoth.set(categoryName, { amount, color: categoryColor });
        }
        
        // Add to user-specific maps
        if (ownerUser === 'user1') {
          if (categoryMapUser1.has(categoryName)) {
            categoryMapUser1.get(categoryName)!.amount += amount;
          } else {
            categoryMapUser1.set(categoryName, { amount, color: categoryColor });
          }
        } else if (ownerUser === 'user2') {
          if (categoryMapUser2.has(categoryName)) {
            categoryMapUser2.get(categoryName)!.amount += amount;
          } else {
            categoryMapUser2.set(categoryName, { amount, color: categoryColor });
          }
        }
      });

      // Convert to arrays and sort by amount
      const convertToArray = (map: Map<string, { amount: number; color: string }>) =>
        Array.from(map.entries())
          .map(([categoryName, { amount, color }]) => ({
            categoryName,
            amount,
            color
          }))
          .sort((a, b) => b.amount - a.amount);

      setExpenseDataUser1(convertToArray(categoryMapUser1));
      setExpenseDataUser2(convertToArray(categoryMapUser2));
      setExpenseData(convertToArray(categoryMapBoth));
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesByCategory();
  }, [selectedMonth, viewMode, user, coupleData, t]); // Added 't' as dependency

  // Set up real-time updates for transactions and categories
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('expenses-pie-chart-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction change detected:', payload);
          // Refetch data when transactions change
          fetchExpensesByCategory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        (payload) => {
          console.log('Category change detected:', payload);
          // Refetch data when categories change
          fetchExpensesByCategory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedMonth, viewMode, coupleData]);

  const getChartData = (data: ExpenseByCategory[]) => ({
    labels: data.map(item => item.categoryName),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
      },
    ],
  });

  const getChartOptions = (data: ExpenseByCategory[]) => ({
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
            const total = data.reduce((sum, item) => sum + item.amount, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  });

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      
      const monthKey = `months.${date.getMonth()}` as const;
      const label = `${t(monthKey)} ${year}`;
      options.push({ value, label });
    }
    
    return options;
  };

  const renderChartSection = (data: ExpenseByCategory[], title: string) => {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
          {total > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {t('dashboard.total')}: R$ {total.toFixed(2)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">{t('common.loading')}</div>
            </div>
          ) : data.length > 0 ? (
            <div className="h-64">
              <Pie data={getChartData(data)} options={getChartOptions(data)} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <p>{t('dashboard.noExpensesFound')}</p>
                <p className="text-sm">{t('dashboard.forSelectedPeriod')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('dashboard.expensesByCategory')}</h2>
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

      {viewMode === 'both' && coupleData?.status === 'active' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderChartSection(expenseDataUser1, `${t('dashboard.expensesByCategory')} - ${names.user1Name}`)}
          {renderChartSection(expenseDataUser2, `${t('dashboard.expensesByCategory')} - ${names.user2Name}`)}
        </div>
      ) : (
        renderChartSection(
          viewMode === 'user1' ? expenseDataUser1 : viewMode === 'user2' ? expenseDataUser2 : expenseData,
          viewMode === 'user1' ? `${t('dashboard.expensesByCategory')} - ${names.user1Name}` :
          viewMode === 'user2' ? `${t('dashboard.expensesByCategory')} - ${names.user2Name}` :
          t('dashboard.expensesByCategory')
        )
      )}
    </div>
  );
};