import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  user: "user1" | "user2";
}

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const { t } = useLanguage();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getUserColor = (user: string) => {
    return user === "user1" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary";
  };

  return (
    <Card className="p-6 border-card-border bg-card">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Transações Recentes</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma transação registrada ainda.</p>
            <p className="text-sm">Adicione sua primeira transação acima!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border border-card-border hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === "income" 
                      ? "bg-income/10 text-income" 
                      : "bg-expense/10 text-expense"
                  }`}>
                    {transaction.type === "income" ? (
                      <ArrowUpCircle className="h-4 w-4" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                      <Badge className={`text-xs ${getUserColor(transaction.user)}`}>
                        <User className="h-3 w-3 mr-1" />
                        {transaction.user === "user1" ? t('dashboard.user1') : t('dashboard.user2')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === "income" ? "text-income" : "text-expense"
                  }`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};