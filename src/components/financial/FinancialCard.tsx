import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";

interface FinancialCardProps {
  title: string;
  amount: number;
  currency?: CurrencyCode;
  displayCurrency?: CurrencyCode;
  icon: LucideIcon;
  type: "income" | "expense" | "balance";
  change?: number;
  className?: string;
}

export const FinancialCard = ({ 
  title, 
  amount, 
  currency = "BRL", 
  displayCurrency,
  icon: Icon, 
  type,
  change,
  className 
}: FinancialCardProps) => {
  const { convertCurrency, formatCurrency } = useCurrencyConverter();
  
  const finalDisplayCurrency = displayCurrency || currency;
  const displayAmount = currency !== finalDisplayCurrency 
    ? convertCurrency(amount, currency, finalDisplayCurrency)
    : amount;

  const getColorClasses = () => {
    switch (type) {
      case "income":
        return "border-income/20 bg-gradient-to-br from-income/5 to-income/10 hover:shadow-income/20";
      case "expense":
        return "border-expense/20 bg-gradient-to-br from-expense/5 to-expense/10 hover:shadow-expense/20";
      case "balance":
        return "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-primary/20";
      default:
        return "border-card-border";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "income":
        return "text-income";
      case "expense":
        return "text-expense";
      case "balance":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn(
      "p-6 transition-all duration-300 hover:shadow-lg",
      getColorClasses(),
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(displayAmount, finalDisplayCurrency)}
          </p>
          {change !== undefined && (
            <p className={cn(
              "text-xs flex items-center gap-1",
              change >= 0 ? "text-income" : "text-expense"
            )}>
              {change >= 0 ? "+" : ""}{change.toFixed(2)}% vs mês anterior
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          getIconColor(),
          "bg-current/10"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};