import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { format } from 'date-fns';
import { formatLocalDate, getMonthDateRange } from "@/utils/date";
import { ArrowRight } from "lucide-react";

interface Transfer {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  user_id: string;
  owner_user?: string;
  account_id?: string;
  accounts?: {
    name: string;
  };
}

interface TransfersBetweenAccountsProps {
  viewMode: 'both' | 'user1' | 'user2';
}

export const TransfersBetweenAccounts: React.FC<TransfersBetweenAccountsProps> = ({ viewMode }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { t, language } = useLanguage();
  const { names } = usePartnerNames();
  
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, [selectedMonth, viewMode, user, couple]);

  const fetchTransfers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);
      
      let userIds = [user.id];
      if (couple?.status === 'active') {
        userIds = [couple.user1_id, couple.user2_id];
      }

      let query = supabase
        .from('transactions')
        .select(`
          id,
          amount,
          description,
          transaction_date,
          payment_method,
          user_id,
          owner_user,
          account_id,
          accounts(name)
        `)
        .in('user_id', userIds)
        .in('payment_method', ['account_transfer', 'account_investment'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transfers:', error);
        return;
      }

      let filteredData = data || [];
      
      // Apply user filter based on viewMode
      if (viewMode !== "both" && couple) {
        filteredData = filteredData.filter(transfer => {
          let owner: 'user1' | 'user2' = 'user1';
          if (transfer.user_id === couple.user1_id) owner = 'user1';
          else if (transfer.user_id === couple.user2_id) owner = 'user2';
          return owner === viewMode;
        });
      }
      
      setTransfers(filteredData);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return formatLocalDate(dateString, "dd/MM/yyyy", language as 'pt' | 'en' | 'es');
  };

  const getUserName = (transfer: Transfer) => {
    if (!couple) return names.currentUserName;
    
    let ownerUser = transfer.owner_user || 'user1';
    if (transfer.user_id === couple.user1_id) ownerUser = 'user1';
    else if (transfer.user_id === couple.user2_id) ownerUser = 'user2';
    
    switch (ownerUser) {
      case 'user1':
        return names.user1Name;
      case 'user2':
        return names.user2Name;
      default:
        return 'Usuário';
    }
  };

  const getTransferTypeText = (method: string) => {
    switch (method) {
      case 'account_transfer': return t('transfers.betweenAccounts');
      case 'account_investment': return t('transfers.toInvestment');
      default: return method;
    }
  };

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

  const totalTransfers = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('transfers.betweenAccounts')}</h3>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('transfers.summary')}</span>
            <span className="text-lg font-normal text-blue-600 dark:text-blue-400">
              {formatCurrency(totalTransfers)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t('common.loading')}</div>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('transfers.noTransfers')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div 
                  key={transfer.id} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {getTransferTypeText(transfer.payment_method)}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {transfer.accounts?.name || t('transfers.unknownDestination')}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium">{transfer.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDate(transfer.transaction_date)}</span>
                        <span>{getUserName(transfer)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(transfer.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};