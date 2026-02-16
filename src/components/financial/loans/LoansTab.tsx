import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Landmark, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { useLoans } from '@/hooks/useLoans';
import { LoansList } from './LoansList';
import { NewLoanModal } from './NewLoanModal';

interface LoansTabProps {
  viewMode: 'both' | 'user1' | 'user2';
}

export const LoansTab: React.FC<LoansTabProps> = ({ viewMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loans, loading, createLoan, deleteLoan, fetchInstallments, fetchLoans, totalActiveDebt, totalInterestPaid, activeLoansCount } = useLoans(viewMode);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Dívidas Ativas</span>
          </div>
          <p className="text-lg font-bold mt-1">{activeLoansCount}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Saldo Devedor</span>
          </div>
          <p className="text-lg font-bold mt-1 text-destructive">
            R$ {totalActiveDebt.toFixed(2)}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Juros Pagos</span>
          </div>
          <p className="text-lg font-bold mt-1 text-orange-600">
            R$ {totalInterestPaid.toFixed(2)}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Contratado</span>
          </div>
          <p className="text-lg font-bold mt-1">
            R$ {loans.reduce((s, l) => s + l.principal_amount, 0).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Empréstimos & Financiamentos</h3>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Empréstimo
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </Card>
      ) : (
        <LoansList
          loans={loans}
          onDelete={deleteLoan}
          fetchInstallments={fetchInstallments}
        />
      )}

      {/* Modal */}
      <NewLoanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLoans}
        createLoan={createLoan}
      />
    </div>
  );
};
