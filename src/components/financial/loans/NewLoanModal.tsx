import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateLoanSchedule } from '@/utils/loanCalculations';
import { parseLocalDate } from '@/utils/date';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createLoan: (input: any) => Promise<boolean>;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  createLoan,
}) => {
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [firstDate, setFirstDate] = useState<Date>();
  const [accountId, setAccountId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [amortizationType, setAmortizationType] = useState<'price' | 'sac'>('price');
  const [installmentValue, setInstallmentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{ totalPayable: number; totalInterest: number; firstInstallment: number } | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) fetchAccounts();
  }, [isOpen]);

  // Live preview of calculation
  useEffect(() => {
    if (principalAmount && interestRate && totalInstallments && firstDate) {
      try {
        const result = calculateLoanSchedule(
          parseFloat(principalAmount),
          parseFloat(interestRate),
          parseInt(totalInstallments),
          firstDate,
          amortizationType
        );
        setPreview({
          totalPayable: result.total_payable,
          totalInterest: result.total_interest,
          firstInstallment: result.installment_value,
        });
      } catch {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [principalAmount, interestRate, totalInstallments, firstDate, amortizationType]);

  const fetchAccounts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('accounts')
      .select('id, name, account_type, balance')
      .is('deleted_at', null)
      .order('name');
    setAccounts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalAmount || !totalInstallments || !firstDate || !accountId || !institutionName) return;

    setIsLoading(true);
    const success = await createLoan({
      principal_amount: parseFloat(principalAmount),
      interest_rate: parseFloat(interestRate || '0'),
      amortization_type: amortizationType,
      total_installments: parseInt(totalInstallments),
      first_installment_date: format(firstDate, 'yyyy-MM-dd'),
      account_id: accountId,
      institution_name: institutionName,
      notes,
    });

    setIsLoading(false);
    if (success) {
      resetForm();
      onSuccess();
      onClose();
    }
  };

  const resetForm = () => {
    setPrincipalAmount('');
    setInterestRate('');
    setTotalInstallments('');
    setInstallmentValue('');
    setFirstDate(undefined);
    setAccountId('');
    setInstitutionName('');
    setAmortizationType('price');
    setNotes('');
    setPreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Novo Empréstimo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Contratado *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="10000.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Juros (% a.a.) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="12.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº de Parcelas *</Label>
              <Input
                type="number"
                min="1"
                max="600"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="36"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Amortização *</Label>
              <Select value={amortizationType} onValueChange={(v) => setAmortizationType(v as 'price' | 'sac')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price (Parcelas Fixas)</SelectItem>
                  <SelectItem value="sac">SAC (Parcelas Decrescentes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data da Primeira Parcela *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !firstDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {firstDate ? format(firstDate, "PP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={firstDate}
                  onSelect={setFirstDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Conta de Depósito *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} (R$ {acc.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Instituição Financeira *</Label>
            <Input
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="Ex: Banco do Brasil, Nubank..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Valor da Parcela</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={installmentValue}
              onChange={(e) => setInstallmentValue(e.target.value)}
              placeholder="Opcional - calculado automaticamente"
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={2}
            />
          </div>

          {/* Live Preview */}
          {preview && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Simulação
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">1ª Parcela</p>
                  <p className="font-semibold">R$ {preview.firstInstallment.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Juros</p>
                  <p className="font-semibold text-destructive">R$ {preview.totalInterest.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total a Pagar</p>
                  <p className="font-semibold">R$ {preview.totalPayable.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Criando...' : 'Criar Empréstimo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
