import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, MinusCircle, CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  subcategory?: string;
  transaction_date: Date;
  payment_method: "cash" | "deposit" | "transfer" | "debit_card" | "credit_card";
  card_id?: string;
  user_id: string;
  currency: CurrencyCode;
}

interface Category {
  id: string;
  name: string;
}

interface Card {
  id: string;
  user_id: string;
  name: string;
  card_type: string;
  owner_user?: string;
  closing_date?: number;
  due_date?: number;
}
const CREDIT_CARD_PAYMENT_NAMES = { pt: "Pagamento de Cartão de Crédito", en: "Credit Card Payment" } as const;
interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  owner_user?: string;
}

const normalizeCategory = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'alimentacao': 'Food',
  'combustivel': 'Fuel',
  'saude': 'Health',
  'educacao': 'Education',
  'vestuario': 'Clothing',
  'viagem': 'Travel',
  'transporte': 'Transport',
  'moradia': 'Housing',
  'salario': 'Salary',
  'comissao': 'Commission',
  'renda extra': 'Extra Income',
  'pagamento de cartao de credito': 'Credit Card Payment',
};
const translateCategoryName = (name: string, lang: 'pt' | 'en') => {
  if (lang === 'en') {
    const key = normalizeCategory(name);
    return CATEGORY_TRANSLATIONS[key] ?? name;
  }
  return name;
};

export const TransactionForm = ({ onSubmit }: TransactionFormProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "deposit" | "transfer" | "debit_card" | "credit_card">("cash");
  const [accountId, setAccountId] = useState("");
  const [cardId, setCardId] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("BRL");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<CurrencyCode>("BRL");
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [paymentPlan, setPaymentPlan] = useState<"avista" | "parcelado">("avista");
  const [totalInstallments, setTotalInstallments] = useState<number>(2);
  const installmentValue = paymentPlan === "parcelado" && amount && Number(totalInstallments) > 0
    ? parseFloat(amount) / Number(totalInstallments)
    : 0;
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { convertCurrency, formatCurrency, getCurrencySymbol, CURRENCY_INFO, loading: ratesLoading } = useCurrencyConverter();
const { couple, isPartOfCouple } = useCouple();
const { names } = usePartnerNames();

const getOwnerName = (ownerUser?: string) => {
  if (ownerUser === 'user2') return names.user2Name;
  return names.user1Name;
};
const getCardOwnerName = (card: Card) => {
  if (isPartOfCouple && couple) {
    return card.user_id === couple.user1_id ? names.user1Name : names.user2Name;
  }
  return names.currentUserName;
};
  useEffect(() => {
    fetchCategories();
    fetchUserPreferredCurrency();
    if (type === "income") {
      fetchAccounts();
    } else {
      fetchCards();
      fetchAccounts(); // Buscar contas também para despesas (cartão de débito)
    }
  }, [type]);

  const fetchUserPreferredCurrency = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('user_id', user.id)
        .single();

      if (data && data.preferred_currency) {
        setUserPreferredCurrency(data.preferred_currency as CurrencyCode);
        setCurrency(data.preferred_currency as CurrencyCode);
      }
    } catch (error) {
      console.error('Error fetching user preferred currency:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, category_type')
        .eq('category_type', type)
        .order('name');

      if (error) throw error;

      let result = (data || []).map((c) => ({ id: c.id as string, name: c.name as string }));

      const paymentNames = Object.values(CREDIT_CARD_PAYMENT_NAMES) as string[];
      const hasPaymentCat = result.some((c) => paymentNames.includes(c.name));
      if (type === 'expense' && !hasPaymentCat) {
        const targetName = CREDIT_CARD_PAYMENT_NAMES[language as 'pt' | 'en'] || CREDIT_CARD_PAYMENT_NAMES.en;
        const { data: inserted, error: insertErr } = await supabase
          .from('categories')
          .insert({
            name: targetName,
            category_type: 'expense',
            user_id: user.id,
          })
          .select('id, name, category_type')
          .single();
        if (!insertErr && inserted) {
          result = [...result, { id: inserted.id as string, name: inserted.name as string }];
        }
      }

      setCategories(result);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, account_type, balance, currency, owner_user')
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas",
        variant: "destructive",
      });
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id, user_id, name, card_type, owner_user, closing_date, due_date')
        .order('name');

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cartões",
        variant: "destructive",
      });
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const paymentNames = Object.values(CREDIT_CARD_PAYMENT_NAMES) as string[];
  const isCreditCardPaymentCategory = selectedCategory ? paymentNames.includes(selectedCategory.name) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) return;

    // Validar conta para receitas com depósito ou transferência
    if (type === "income" && (paymentMethod === "deposit" || paymentMethod === "transfer") && !accountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta para o depósito/transferência",
        variant: "destructive",
      });
      return;
    }

    // Validar cartão para despesas com cartão de crédito
    if (type === "expense" && paymentMethod === "credit_card" && !cardId) {
      toast({
        title: "Erro",
        description: "Selecione um cartão para o pagamento",
        variant: "destructive",
      });
      return;
    }

  // Validar conta para despesas com cartão de débito
  if (type === "expense" && paymentMethod === "debit_card" && !accountId) {
    toast({
      title: "Erro",
      description: "Selecione uma conta para o cartão de débito",
      variant: "destructive",
    });
    return;
  }

  // Validar parcelas para cartão de crédito parcelado
  if (type === "expense" && paymentMethod === "credit_card" && paymentPlan === "parcelado") {
    if (!totalInstallments || totalInstallments < 2) {
      toast({
        title: "Erro",
        description: "Informe a quantidade de parcelas (mínimo 2).",
        variant: "destructive",
      });
      return;
    }
  }

  // Validar seleção de cartão quando a categoria for Pagamento de Cartão de Crédito
  if (type === "expense" && isCreditCardPaymentCategory && !cardId) {
    toast({
      title: "Erro",
      description: "Selecione o cartão cuja fatura está sendo paga",
      variant: "destructive",
    });
    return;
  }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const transactionAmount = parseFloat(amount);

      // Determine owner_user based on couple relationship
      let ownerUser = "user1"; // default
      if (isPartOfCouple && couple) {
        // If user is part of a couple, determine if they are user1 or user2
        ownerUser = user.id === couple.user1_id ? "user1" : "user2";
      }

      console.log('Creating transaction with owner_user:', ownerUser, 'for user:', user.id);

// Inserir transação (regras para cartão de crédito)
      if (type === "expense" && paymentMethod === "credit_card") {
        const selectedCard = cards.find(c => c.id === cardId);
        if (!selectedCard) {
          throw new Error("Cartão não encontrado.");
        }
        const closingDay = Number(selectedCard.closing_date);
        const dueDay = Number(selectedCard.due_date);
        if (!closingDay || !dueDay) {
          throw new Error("Defina fechamento e vencimento do cartão antes de lançar.");
        }

        const purchaseDate = transactionDate;
        const purchaseDay = purchaseDate.getDate();
        // No dia OU após a data de fechamento => próximo mês
        const firstOffset = purchaseDay < closingDay ? 0 : 1;
        const makeDueDate = (base: Date, monthOffset: number) => {
          const d = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
          return new Date(d.getFullYear(), d.getMonth(), dueDay);
        };

        if (paymentPlan === "parcelado") {
          const total = Math.round(transactionAmount * 100);
          const per = Math.floor(total / totalInstallments);

          const rows = Array.from({ length: totalInstallments }, (_, i) => {
            const isLast = i === totalInstallments - 1;
            const amountCents = isLast ? total - per * (totalInstallments - 1) : per;
            const dueDate = makeDueDate(purchaseDate, firstOffset + i);
            return {
              user_id: user.id,
              owner_user: ownerUser,
              type: "expense" as const,
              amount: amountCents / 100,
              currency,
              description,
              category_id: categoryId,
              subcategory: subcategory || null,
              transaction_date: dueDate.toISOString().split("T")[0],
              payment_method: "credit_card" as const,
              card_id: cardId,
              account_id: null,
              is_installment: true,
              total_installments: totalInstallments,
              installment_number: i + 1,
            };
          });

          const { error: insertErr } = await supabase.from("transactions").insert(rows);
          if (insertErr) throw insertErr;
        } else {
          // À vista => 1/1 respeitando corte
          const dueDate = makeDueDate(purchaseDate, firstOffset);
          const { error: insertErr } = await supabase.from("transactions").insert({
            user_id: user.id,
            owner_user: ownerUser,
            type: "expense",
            amount: transactionAmount,
            currency,
            description,
            category_id: categoryId,
            subcategory: subcategory || null,
            transaction_date: dueDate.toISOString().split("T")[0],
            payment_method: "credit_card",
            card_id: cardId,
            account_id: null,
            is_installment: true,
            total_installments: 1,
            installment_number: 1,
          });
          if (insertErr) throw insertErr;
        }
      } else {
        // Inserção padrão (dinheiro, depósito, transferência, débito ou receitas)
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            owner_user: ownerUser,
            type,
            amount: transactionAmount,
            currency: currency,
            description,
            category_id: categoryId,
            subcategory: subcategory || null,
            transaction_date: transactionDate.toISOString().split('T')[0],
            payment_method: paymentMethod,
            card_id: cardId || null,
            account_id: accountId || null,
            is_installment: false,
            total_installments: null,
            installment_number: null
          });

        if (error) throw error;
      }

      // Atualizar saldo da conta para receitas com depósito ou transferência
      if (type === "income" && (paymentMethod === "deposit" || paymentMethod === "transfer") && accountId) {
        const selectedAccount = accounts.find(acc => acc.id === accountId);
        if (selectedAccount) {
          const newBalance = selectedAccount.balance + transactionAmount;
          
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);

          if (updateError) {
            console.error('Erro ao atualizar saldo da conta:', updateError);
          }
        }
      }

      // Atualizar saldo da conta para despesas com cartão de débito
      if (type === "expense" && paymentMethod === "debit_card" && accountId) {
        const selectedAccount = accounts.find(acc => acc.id === accountId);
        if (selectedAccount) {
          const newBalance = selectedAccount.balance - transactionAmount;
          
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);

          if (updateError) {
            console.error('Erro ao atualizar saldo da conta:', updateError);
          }
        }
      }

      // Repor limite do cartão quando a categoria for Pagamento de Cartão de Crédito
      if (type === "expense" && isCreditCardPaymentCategory && cardId) {
        const { data: cardData, error: cardErr } = await supabase
          .from('cards')
          .select('current_balance')
          .eq('id', cardId)
          .single();
        if (!cardErr && cardData) {
          const currentBalance = Number(cardData.current_balance || 0);
          const newBalance = Math.max(0, currentBalance - transactionAmount);
          const { error: updateCardErr } = await supabase
            .from('cards')
            .update({ current_balance: newBalance })
            .eq('id', cardId);
          if (updateCardErr) {
            console.error('Erro ao atualizar limite do cartão:', updateCardErr);
          }
        }
      }

      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId("");
      setSubcategory("");
      setTransactionDate(new Date());
      setPaymentMethod("cash");
      setAccountId("");
      setCardId("");
      setCurrency(userPreferredCurrency);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar transação",
        variant: "destructive",
      });
    }
  };


  return (
    <Card className="p-6 border-card-border bg-card">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{t('transactionForm.title')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "income" ? "income" : "outline"}
              onClick={() => setType("income")}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              {t('transactionForm.income')}
            </Button>
            <Button
              type="button"
              variant={type === "expense" ? "expense" : "outline"}
              onClick={() => setType("expense")}
              className="flex items-center gap-2"
            >
              <MinusCircle className="h-4 w-4" />
              {t('transactionForm.expense')}
            </Button>
          </div>

          {/* Date */}
          <div>
            <Label>{t('transactionForm.transactionDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transactionDate ? format(transactionDate, "PPP", { locale: ptBR }) : <span>{t('transactionForm.selectDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border border-border" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Currency and Amount */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="currency">{t('transactionForm.currency')}</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CURRENCY_INFO).map((currencyInfo) => (
                    <SelectItem key={currencyInfo.code} value={currencyInfo.code}>
                      <div className="flex items-center gap-2">
                        <span>{currencyInfo.symbol}</span>
                        <span>{currencyInfo.name} ({currencyInfo.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">{t('transactionForm.amount')}</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg pl-12"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                  {getCurrencySymbol(currency)}
                </div>
              </div>
              
              {/* Currency Conversion Preview */}
              {amount && currency !== userPreferredCurrency && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Valor convertido para {CURRENCY_INFO[userPreferredCurrency].name}:
                  </div>
                  <div className="font-medium text-primary">
                    {formatCurrency(
                      convertCurrency(parseFloat(amount), currency, userPreferredCurrency),
                      userPreferredCurrency
                    )}
                  </div>
                  {ratesLoading && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Atualizando cotação...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t('transactionForm.description')}</Label>
            <Input
              id="description"
              placeholder="Ex: Almoço no restaurante"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label>{type === "income" ? t('transactionForm.receiptMethod') : t('transactionForm.paymentMethod')}</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "cash" | "deposit" | "transfer" | "debit_card" | "credit_card")}>
              <SelectTrigger>
                <SelectValue placeholder={t('transactionForm.selectPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('transactionForm.cash')}</SelectItem>
                {type === "income" ? (
                  <>
                    <SelectItem value="deposit">{t('transactionForm.deposit')}</SelectItem>
                    <SelectItem value="transfer">{t('transactionForm.transfer')}</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="debit_card">{t('transactionForm.debitCard')}</SelectItem>
                    <SelectItem value="credit_card">{t('transactionForm.creditCard')}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Account Selection for Income with Deposit/Transfer */}
          {type === "income" && (paymentMethod === "deposit" || paymentMethod === "transfer") && (
            <div>
              <Label htmlFor="account">{t('transactionForm.selectAccount')}</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {account.currency} {account.balance.toFixed(2)} • {getOwnerName(account.owner_user)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Card Selection for Expenses with Credit Card */}
          {type === "expense" && paymentMethod === "credit_card" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="card">{t('transactionForm.selectCard')}</Label>
                <Select value={cardId} onValueChange={setCardId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactionForm.selectCardPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{card.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {card.card_type} • {getCardOwnerName(card)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Forma de pagamento: À vista ou Parcelado */}
              <div className="space-y-3">
                <Label>Forma de pagamento</Label>
                <RadioGroup
                  value={paymentPlan}
                  onValueChange={(v) => setPaymentPlan(v as "avista" | "parcelado")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="avista" value="avista" />
                    <Label htmlFor="avista">À vista</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="parcelado" value="parcelado" />
                    <Label htmlFor="parcelado">Parcelado</Label>
                  </div>
                </RadioGroup>

                {paymentPlan === "parcelado" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installments">Quantidade de Parcelas</Label>
                      <Input
                        id="installments"
                        type="number"
                        min={2}
                        step={1}
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(Math.max(2, parseInt(e.target.value || "2", 10)))}
                      />
                    </div>
                    <div className="self-end">
                      <div className="text-sm text-muted-foreground">Valor por Parcela</div>
                      <div className="text-base font-medium">
                        {formatCurrency(isFinite(installmentValue) ? installmentValue : 0, currency)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Selection for Expenses with Debit Card */}
          {type === "expense" && paymentMethod === "debit_card" && (
            <div>
              <Label htmlFor="account">{t('transactionForm.selectAccount')}</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {account.currency} {account.balance.toFixed(2)} • {getOwnerName(account.owner_user)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          <div>
            <Label htmlFor="category">{t('transactionForm.category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder={t('transactionForm.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {translateCategoryName(cat.name, language as 'pt' | 'en')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Cartão para categoria: Pagamento de Cartão de Crédito */}
          {type === "expense" && isCreditCardPaymentCategory && (
            <div>
              <Label htmlFor="card">{language === 'pt' ? 'Selecione o cartão para pagamento da fatura' : 'Select the credit card to pay the invoice'}</Label>
              <Select value={cardId} onValueChange={setCardId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionForm.selectCardPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{card.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {card.card_type} • {getCardOwnerName(card)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subcategory */}
          <div>
            <Label htmlFor="subcategory">{t('transactionForm.subcategory')}</Label>
            <Input
              id="subcategory"
              placeholder="Ex: Mercado, Posto de gasolina..."
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            />
          </div>


          <Button type="submit" className="w-full">
            {t('transactionForm.addTransaction')}
          </Button>
        </form>
      </div>
    </Card>
  );
};