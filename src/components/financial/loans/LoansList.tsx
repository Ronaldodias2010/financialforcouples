import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, ChevronDown, ChevronUp, Building2, RotateCcw } from 'lucide-react';
import { Loan, LoanInstallmentRow, useLoans } from '@/hooks/useLoans';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface LoansListProps {
  loans: Loan[];
  onDelete: (id: string) => void;
  fetchInstallments: (loanId: string) => Promise<LoanInstallmentRow[]>;
}

export const LoansList: React.FC<LoansListProps> = ({ loans, onDelete, fetchInstallments }) => {
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [installments, setInstallments] = useState<LoanInstallmentRow[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  const toggleExpand = async (loanId: string) => {
    if (expandedLoan === loanId) {
      setExpandedLoan(null);
      setInstallments([]);
      return;
    }
    setExpandedLoan(loanId);
    setLoadingInstallments(true);
    const data = await fetchInstallments(loanId);
    setInstallments(data);
    setLoadingInstallments(false);
  };

  if (loans.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Nenhum empréstimo registrado. Crie seu primeiro!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => {
        const progressPercent = loan.total_installments > 0
          ? ((loan.installments_paid / loan.total_installments) * 100)
          : 0;
        const isExpanded = expandedLoan === loan.id;

        return (
          <Card key={loan.id} className={cn("p-4", loan.status !== 'active' && "opacity-60")}>
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base">{loan.institution_name}</h3>
                    <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                      {loan.status === 'active' ? 'Ativo' : loan.status === 'completed' ? 'Quitado' : 'Cancelado'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {loan.amortization_type === 'price' ? 'Price' : 'SAC'}
                    </Badge>
                  </div>
                  {loan.account && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Conta: {loan.account.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(loan.id)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(loan.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Valor Contratado</p>
                  <p className="font-semibold">R$ {loan.principal_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                  <p className="font-semibold text-destructive">R$ {loan.remaining_balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Juros</p>
                  <p className="font-semibold text-orange-600">R$ {loan.total_interest.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parcelas</p>
                  <p className="font-semibold">{loan.installments_paid}/{loan.total_installments}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso da quitação</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Installments detail */}
              {isExpanded && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="text-sm font-semibold mb-2">Parcelas</h4>
                  {loadingInstallments ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b">
                        <span>#</span>
                        <span>Vencimento</span>
                        <span>Valor</span>
                        <span>Juros</span>
                        <span>Status</span>
                      </div>
                      {installments.map((inst) => (
                        <div key={inst.id} className={cn(
                          "grid grid-cols-5 gap-2 text-xs py-1",
                          inst.is_paid && "text-muted-foreground line-through"
                        )}>
                          <span>{inst.installment_number}</span>
                          <span>{format(parseLocalDate(inst.due_date), 'dd/MM/yy')}</span>
                          <span>R$ {inst.total_value.toFixed(2)}</span>
                          <span>R$ {inst.interest_part.toFixed(2)}</span>
                          <span>
                            {inst.is_paid ? (
                              <Badge variant="secondary" className="text-[10px] px-1">Pago</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1">Pendente</Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
