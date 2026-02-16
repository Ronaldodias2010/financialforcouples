import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { calculateLoanSchedule } from '@/utils/loanCalculations';
import { parseLocalDate } from '@/utils/date';

export interface Loan {
  id: string;
  user_id: string;
  owner_user: string;
  account_id: string | null;
  institution_name: string;
  principal_amount: number;
  interest_rate: number;
  amortization_type: 'price' | 'sac';
  total_installments: number;
  installment_value: number;
  total_interest: number;
  total_payable: number;
  remaining_balance: number;
  total_paid: number;
  installments_paid: number;
  first_installment_date: string;
  status: string;
  notes: string | null;
  currency: string;
  created_at: string;
  account?: { id: string; name: string };
}

export interface LoanInstallmentRow {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_part: number;
  interest_part: number;
  total_value: number;
  remaining_balance_after: number;
  is_paid: boolean;
  paid_at: string | null;
}

interface CreateLoanInput {
  principal_amount: number;
  interest_rate: number;
  amortization_type: 'price' | 'sac';
  total_installments: number;
  first_installment_date: string;
  account_id: string;
  institution_name: string;
  notes?: string;
}

export function useLoans(viewMode: 'both' | 'user1' | 'user2' = 'both') {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*, account:accounts(id, name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filtered = (data || []) as any[];
      if (viewMode !== 'both') {
        filtered = filtered.filter((l: any) => (l.owner_user || 'user1') === viewMode);
      }

      setLoans(filtered);
    } catch (err: any) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  }, [user, viewMode]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const createLoan = async (input: CreateLoanInput): Promise<boolean> => {
    if (!user) return false;

    try {
      // 1. Calculate amortization schedule
      const firstDate = parseLocalDate(input.first_installment_date);
      const schedule = calculateLoanSchedule(
        input.principal_amount,
        input.interest_rate,
        input.total_installments,
        firstDate,
        input.amortization_type
      );

      // 2. Determine owner_user
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      const ownerUser = coupleData
        ? (coupleData.user1_id === user.id ? 'user1' : 'user2')
        : 'user1';

      // 3. Create loan record
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          owner_user: ownerUser,
          account_id: input.account_id,
          institution_name: input.institution_name,
          principal_amount: input.principal_amount,
          interest_rate: input.interest_rate,
          amortization_type: input.amortization_type,
          total_installments: input.total_installments,
          installment_value: schedule.installment_value,
          total_interest: schedule.total_interest,
          total_payable: schedule.total_payable,
          remaining_balance: input.principal_amount,
          total_paid: 0,
          installments_paid: 0,
          first_installment_date: input.first_installment_date,
          notes: input.notes || null,
        })
        .select('id')
        .single();

      if (loanError) throw loanError;

      // 4. Create all installments
      const installmentRows = schedule.installments.map((inst) => ({
        loan_id: loanData.id,
        user_id: user.id,
        installment_number: inst.installment_number,
        due_date: inst.due_date,
        principal_part: inst.principal_part,
        interest_part: inst.interest_part,
        total_value: inst.total_value,
        remaining_balance_after: inst.remaining_balance_after,
      }));

      const { error: installError } = await supabase
        .from('loan_installments')
        .insert(installmentRows);

      if (installError) throw installError;

      // 5. Create deposit transaction (loan_deposit) - increases account balance
      // This is a special transaction that increases the account balance
      // but should NOT count as income/revenue
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          description: `Empréstimo - ${input.institution_name}`,
          amount: input.principal_amount,
          type: 'income', // Will be filtered by payment_method = 'loan_deposit'
          payment_method: 'loan_deposit',
          account_id: input.account_id,
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          owner_user: ownerUser,
          notes: `Entrada de empréstimo: ${input.institution_name} - ${input.total_installments}x`,
        });

      if (txError) {
        console.error('Error creating deposit transaction:', txError);
        // Non-fatal: loan was created, just log the error
      }

      // 6. Update account balance
      const { data: accountData } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', input.account_id)
        .single();

      if (accountData) {
        const newBalance = (accountData.balance || 0) + input.principal_amount;
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', input.account_id);
      }

      toast({
        title: 'Sucesso',
        description: `Empréstimo de R$ ${input.principal_amount.toFixed(2)} criado com ${input.total_installments} parcelas`,
      });

      await fetchLoans();
      return true;
    } catch (err: any) {
      console.error('Error creating loan:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar empréstimo',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLoan = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Empréstimo excluído' });
      await fetchLoans();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao excluir empréstimo',
        variant: 'destructive',
      });
    }
  };

  const fetchInstallments = async (loanId: string): Promise<LoanInstallmentRow[]> => {
    const { data, error } = await supabase
      .from('loan_installments')
      .select('*')
      .eq('loan_id', loanId)
      .order('installment_number');

    if (error) {
      console.error('Error fetching installments:', error);
      return [];
    }
    return (data || []) as LoanInstallmentRow[];
  };

  // Summary stats
  const totalActiveDebt = loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.remaining_balance, 0);

  const totalInterestPaid = loans
    .reduce((sum, l) => sum + l.total_paid - (l.principal_amount - l.remaining_balance), 0);

  const activeLoansCount = loans.filter(l => l.status === 'active').length;

  return {
    loans,
    loading,
    createLoan,
    deleteLoan,
    fetchInstallments,
    fetchLoans,
    totalActiveDebt,
    totalInterestPaid: Math.max(0, totalInterestPaid),
    activeLoansCount,
  };
}
