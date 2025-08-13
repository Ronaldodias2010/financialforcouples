import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  yield_type?: string;
  yield_value?: number;
  auto_calculate_yield?: boolean;
}

interface InvestmentGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  currency: string;
}

interface InvestmentListProps {
  investments: Investment[];
  goals: InvestmentGoal[];
  onRefresh: () => void;
  userPreferredCurrency: string;
  onEdit: (investment: Investment) => void;
}

export const InvestmentList = ({ investments, goals, onRefresh, userPreferredCurrency, onEdit }: InvestmentListProps) => {
  const { t } = useLanguage();
  const { formatCurrency, convertCurrency } = useCurrencyConverter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'renda_fixa': 'bg-blue-100 text-blue-800',
      'renda_variavel': 'bg-green-100 text-green-800',
      'cripto': 'bg-orange-100 text-orange-800',
      'fundos': 'bg-purple-100 text-purple-800',
      'tesouro_direto': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateReturn = (investment: Investment) => {
    const returnValue = investment.current_value - investment.amount;
    const returnPercentage = investment.amount > 0 ? (returnValue / investment.amount) * 100 : 0;
    return { returnValue, returnPercentage };
  };

  const findGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find(g => g.id === goalId);
    return goal?.name;
  };

  const handleDelete = async (investmentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", investmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Investimento excluído com sucesso!",
      });
      
      onRefresh();
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir investimento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            {t('investments.noInvestments')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('investments.listTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('investments.name')}</TableHead>
                <TableHead>{t('investments.type')}</TableHead>
                <TableHead>{t('investments.amount')}</TableHead>
                <TableHead>{t('investments.currentValueField')}</TableHead>
                <TableHead>{t('investments.returnPercentage')}</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>{t('investments.date')}</TableHead>
                <TableHead>{t('investments.goal')}</TableHead>
                <TableHead>{t('investments.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => {
                const { returnValue, returnPercentage } = calculateReturn(investment);
                const convertedInvested = convertCurrency(
                  investment.amount, 
                  investment.currency as any, 
                  userPreferredCurrency as any
                );
                const convertedCurrent = convertCurrency(
                  investment.current_value, 
                  investment.currency as any, 
                  userPreferredCurrency as any
                );
                const convertedReturn = convertCurrency(
                  returnValue, 
                  investment.currency as any, 
                  userPreferredCurrency as any
                );
                const goalName = findGoalName(investment.goal_id);

                return (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{investment.name}</div>
                        {investment.broker && (
                          <div className="text-sm text-muted-foreground">{investment.broker}</div>
                        )}
                        {investment.is_shared && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {t('investments.shared')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(investment.type)}>
                        {getTypeLabel(investment.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(convertedInvested, userPreferredCurrency as any)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(convertedCurrent, userPreferredCurrency as any)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {returnPercentage >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <div className={returnPercentage >= 0 ? "text-green-600" : "text-red-600"}>
                          <div className="font-medium">
                            {returnPercentage >= 0 ? "+" : ""}{returnPercentage.toFixed(2)}%
                          </div>
                          <div className="text-xs">
                            {returnValue >= 0 ? "+" : ""}{formatCurrency(convertedReturn, userPreferredCurrency as any)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {investment.yield_type ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {investment.yield_type === 'percentage' 
                              ? `${investment.yield_value}% a.m.`
                              : formatCurrency(investment.yield_value || 0, userPreferredCurrency as any)
                            }
                          </div>
                          <div className="text-muted-foreground">
                            {investment.auto_calculate_yield ? 'Automático' : 'Manual'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(investment.purchase_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {goalName ? (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className="text-sm">{goalName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEdit(investment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={loading}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Investimento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o investimento "{investment.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(investment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};