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
import { ExportUtils } from '@/components/financial/ExportUtils';

interface Transfer {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  user_id: string;
  owner_user?: string;
  source_account_name: string;
  dest_account_name: string;
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

      // Query to get unique transfers by pairing expense/income transactions
      const { data: rawData, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          description,
          transaction_date,
          payment_method,
          user_id,
          owner_user,
          type,
          account_id,
          card_id,
          accounts(name),
          cards(name)
        `)
        .in('user_id', userIds)
        .in('payment_method', ['account_transfer', 'account_investment'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching transfers:', error);
        return;
      }

      // Process transfers to avoid duplication - group by description, amount, date, user
      const transfersMap = new Map();
      const rawTransfers = rawData || [];

      for (const transaction of rawTransfers) {
        const key = `${transaction.description}-${transaction.amount}-${transaction.transaction_date}-${transaction.user_id}-${transaction.payment_method}`;
        
        if (!transfersMap.has(key)) {
          transfersMap.set(key, {
            expense: null,
            income: null
          });
        }

        if (transaction.type === 'expense') {
          transfersMap.get(key).expense = transaction;
        } else if (transaction.type === 'income') {
          transfersMap.get(key).income = transaction;
        }
      }

      // Build final transfers array with source and destination
      const processedTransfers: Transfer[] = [];
      
      for (const [key, pair] of transfersMap.entries()) {
        if (pair.expense) {
          // Check if it's a card payment transfer
          const isCardPayment = pair.expense.description?.startsWith('Pagamento de Cartão:');
          
          // Use the expense transaction as the main record
          const transfer: Transfer = {
            id: pair.expense.id,
            amount: pair.expense.amount,
            description: pair.expense.description,
            transaction_date: pair.expense.transaction_date,
            payment_method: pair.expense.payment_method,
            user_id: pair.expense.user_id,
            owner_user: pair.expense.owner_user,
            source_account_name: isCardPayment 
              ? (pair.expense.accounts?.name || t('transfers.bankAccount'))
              : (pair.expense.accounts?.name || t('transfers.unknownAccount')),
            dest_account_name: isCardPayment
              ? (pair.income?.cards?.name || t('transfers.creditCard'))
              : (pair.income?.accounts?.name || 
                  (pair.expense.payment_method === 'account_investment' ? t('transfers.investment') : t('transfers.unknownAccount')))
          };
          
          processedTransfers.push(transfer);
        }
      }

      let filteredData = processedTransfers;
      
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

  const formatRowForCSV = (transfer: Transfer): string[] => {
    return [
      formatDate(transfer.transaction_date),
      transfer.description,
      transfer.source_account_name || '',
      transfer.dest_account_name || '',
      formatCurrency(transfer.amount),
      getUserName(transfer),
      getTransferTypeText(transfer.payment_method || '')
    ];
  };

  const formatRowForPDF = (transfer: Transfer): string[] => {
    return [
      formatDate(transfer.transaction_date),
      transfer.description.length > 30 ? transfer.description.substring(0, 30) + '...' : transfer.description,
      transfer.source_account_name || '',
      transfer.dest_account_name || '',
      formatCurrency(transfer.amount),
      getUserName(transfer).split(' ')[0], // Apenas primeiro nome para PDF
      getTransferTypeText(transfer.payment_method || '')
    ];
  };

  const exportHeaders = [
    t('export.date'),
    t('transactions.description'),
    t('transfers.fromAccount'),
    t('transfers.toAccount'),
    t('export.amount'),
    t('export.user'),
    t('transfers.transferType')
  ];

  const totalTransfers = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('transfers.betweenAccounts')}</h3>
        <div className="flex items-center gap-4">
          <ExportUtils
            data={transfers}
            filename={`transferencias-${selectedMonth}`}
            headers={exportHeaders}
            formatRowForCSV={formatRowForCSV}
            formatRowForPDF={formatRowForPDF}
            title={`${t('transfers.betweenAccounts')} - ${getMonthOptions().find(opt => opt.value === selectedMonth)?.label}`}
            additionalInfo={[
              { label: t('export.totalTransfers'), value: formatCurrency(totalTransfers) },
              { label: t('export.period'), value: getMonthOptions().find(opt => opt.value === selectedMonth)?.label || '' }
            ]}
            disabled={loading}
          />
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
                       <span className="font-medium text-blue-600 dark:text-blue-400">
                         {t('transfers.transferAmount').replace('{{amount}}', formatCurrency(transfer.amount))}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="font-medium">{transfer.source_account_name}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium">{transfer.dest_account_name}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{transfer.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(transfer.transaction_date)}</span>
                        <span>{getUserName(transfer)}</span>
                        <Badge variant="outline" className="text-xs">
                          {getTransferTypeText(transfer.payment_method)}
                        </Badge>
                      </div>
                    </div>
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