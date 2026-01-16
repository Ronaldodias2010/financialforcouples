import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Landmark, 
  CreditCard, 
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface CreditCard {
  id: string;
  name: string;
  card_type: string;
  credit_limit: number;
  current_balance: number;
  currency: string;
  closing_date: number;
  due_date: number;
}

interface ReconciliationSelectorProps {
  statementPeriod?: {
    start: string;
    end: string;
  };
  onStartReconciliation: (config: {
    sourceType: 'account' | 'card';
    sourceId: string;
    sourceName: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export const ReconciliationSelector: React.FC<ReconciliationSelectorProps> = ({
  statementPeriod,
  onStartReconciliation
}) => {
  const { t } = useLanguage();
  const [sourceType, setSourceType] = useState<'account' | 'card'>('account');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [startDate, setStartDate] = useState(statementPeriod?.start || '');
  const [endDate, setEndDate] = useState(statementPeriod?.end || '');

  // Fetch accounts
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts-reconciliation'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return [];

      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, account_type, balance, currency')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data as Account[];
    }
  });

  // Fetch cards
  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['cards-reconciliation'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return [];

      const { data, error } = await supabase
        .from('cards')
        .select('id, name, card_type, credit_limit, current_balance, currency, closing_date, due_date')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data as CreditCard[];
    }
  });

  // Auto-detect source type from statement period
  useEffect(() => {
    if (statementPeriod?.start) {
      setStartDate(statementPeriod.start);
    }
    if (statementPeriod?.end) {
      setEndDate(statementPeriod.end);
    }
  }, [statementPeriod]);

  const handleSubmit = () => {
    const source = sourceType === 'account' 
      ? accounts.find(a => a.id === selectedSourceId)
      : cards.find(c => c.id === selectedSourceId);
    
    if (!source || !selectedSourceId) return;

    onStartReconciliation({
      sourceType,
      sourceId: selectedSourceId,
      sourceName: source.name,
      startDate,
      endDate
    });
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency
    }).format(value);
  };

  const isValid = selectedSourceId && startDate && endDate && new Date(startDate) <= new Date(endDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Selecionar Origem para Reconciliação
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escolha a conta bancária ou cartão de crédito para comparar com o extrato importado
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Source Type Selection */}
        <div className="space-y-3">
          <Label>Tipo de Origem</Label>
          <RadioGroup
            value={sourceType}
            onValueChange={(v: 'account' | 'card') => {
              setSourceType(v);
              setSelectedSourceId('');
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="account" id="account" className="peer sr-only" />
              <Label
                htmlFor="account"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Landmark className="mb-3 h-6 w-6" />
                <span className="font-medium">Conta Bancária</span>
                <span className="text-xs text-muted-foreground">{accounts.length} contas</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="card" id="card" className="peer sr-only" />
              <Label
                htmlFor="card"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <CreditCard className="mb-3 h-6 w-6" />
                <span className="font-medium">Cartão de Crédito</span>
                <span className="text-xs text-muted-foreground">{cards.length} cartões</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Source Selection */}
        <div className="space-y-3">
          <Label>{sourceType === 'account' ? 'Conta' : 'Cartão'}</Label>
          {(loadingAccounts || loadingCards) ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${sourceType === 'account' ? 'a conta' : 'o cartão'}`} />
              </SelectTrigger>
              <SelectContent>
                {sourceType === 'account' ? (
                  accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {formatCurrency(account.balance, account.currency)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <span>{card.name}</span>
                        <Badge variant="outline" className="ml-2">
                          Venc: {card.due_date}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {/* Show selected source details */}
          {selectedSourceId && (
            <div className="bg-muted/50 rounded-lg p-3 mt-2">
              {sourceType === 'account' ? (
                (() => {
                  const account = accounts.find(a => a.id === selectedSourceId);
                  if (!account) return null;
                  return (
                    <div className="space-y-1">
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {account.account_type} • Saldo: {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const card = cards.find(c => c.id === selectedSourceId);
                  if (!card) return null;
                  return (
                    <div className="space-y-1">
                      <p className="font-medium">{card.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Fechamento: dia {card.closing_date} • Vencimento: dia {card.due_date}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Limite: {formatCurrency(card.credit_limit || 0, card.currency)} • 
                        Usado: {formatCurrency(card.current_balance || 0, card.currency)}
                      </p>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período de Comparação
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          {statementPeriod && (
            <p className="text-xs text-muted-foreground">
              Período detectado no extrato: {statementPeriod.start} a {statementPeriod.end}
            </p>
          )}
        </div>

        {/* Warning if no source selected */}
        {accounts.length === 0 && cards.length === 0 && !loadingAccounts && !loadingCards && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não possui contas ou cartões cadastrados. Cadastre primeiro para poder reconciliar.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Iniciar Reconciliação
        </Button>
      </CardContent>
    </Card>
  );
};
