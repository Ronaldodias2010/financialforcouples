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
import { PlusCircle, MinusCircle, CalendarIcon, RefreshCw, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Enums } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCategoryName as translateCategoryUtil } from "@/utils/categoryTranslation";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCashBalance } from "@/hooks/useCashBalance";
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
  payment_method: "cash" | "deposit" | "transfer" | "debit_card" | "credit_card" | "payment_transfer";
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
  currency?: CurrencyCode;
}
const CREDIT_CARD_PAYMENT_NAMES = { pt: "Pagamento de Cartão de Crédito", en: "Credit Card Payment" } as const;
interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  owner_user?: string;
  overdraft_limit?: number;
  is_cash_account?: boolean;
}

interface Investment {
  id: string;
  name: string;
  broker?: string;
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
  'transferencia': 'Transfer',
  'transferencia entre contas': 'Account Transfer',
  'aposentadoria': 'Retirement',
  'contas basicas': 'Basic Bills',
  'entretenimento': 'Entertainment',
  'presente ou doacao': 'Gift or Donation',
  'reembolso': 'Refund',
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
  const [transactionDate, setTransactionDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Ensure we're using midnight local time
    return now;
  });
const [paymentMethod, setPaymentMethod] = useState<
  | "cash"
  | "deposit"
  | "transfer"
  | "debit_card"
  | "credit_card"
  | "payment_transfer"
  | "account_transfer"
  | "account_investment"
  | "saque"
  | "card_payment"
>("cash");
const [accountId, setAccountId] = useState("");
const [fromAccountId, setFromAccountId] = useState("");
const [toAccountId, setToAccountId] = useState("");
const [investmentId, setInvestmentId] = useState("");
const [saqueSourceAccountId, setSaqueSourceAccountId] = useState("");
const [saqueSourceType, setSaqueSourceType] = useState<"account" | "card">("account"); // Tipo de fonte do saque
const [investments, setInvestments] = useState<Investment[]>([]);
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
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const { convertCurrency, formatCurrency, getCurrencySymbol, CURRENCY_INFO, loading: ratesLoading } = useCurrencyConverter();
const { couple, isPartOfCouple } = useCouple();
const { names } = usePartnerNames();
const { canSpendCash, getCashBalanceError } = useCashBalance();

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
const getAccountOwnerName = (account: Account) => {
  if (isPartOfCouple && couple) {
    return account.user_id === couple.user1_id ? names.user1Name : names.user2Name;
  }
  return names.currentUserName;
};
  useEffect(() => {
    fetchCategories();
    fetchUserPreferredCurrency();
    if (type === "income") {
      fetchAccounts();
      fetchInvestments();
    } else {
      fetchCards();
      fetchAccounts(); // Buscar contas também para despesas (cartão de débito)
    }
  }, [type, paymentMethod]); // Adicionamos paymentMethod como dependência

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

      // Get couple user IDs (if any) to scope categories and deduplicate across partners
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      const userIds = coupleData ? [coupleData.user1_id, coupleData.user2_id] : [user.id];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, category_type, user_id')
        .eq('category_type', type)
        .in('user_id', userIds)
        .order('name');

      if (error) throw error;

      // Deduplicate by normalized name, prefer current user's category id
      const normalize = (s: string) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      const map = new Map<string, { name: string; id: string }>();
      (data || []).forEach((c: any) => {
        const key = normalize(c.name);
        
        // Skip "Veículo" (singular) in favor of "Veículos" (plural)
        if (key === 'veiculo' && data.some((cat: any) => normalize(cat.name) === 'veiculos')) {
          return;
        }
        
        const preferred = map.get(key);
        if (!preferred) {
          map.set(key, { name: c.name, id: c.user_id === user.id ? c.id : c.id });
        } else if (c.user_id === user.id) {
          // Replace with current user's id if we previously stored partner's id
          map.set(key, { name: preferred.name, id: c.id });
        }
      });

      // Ensure "Credit Card Payment" category exists for the current user (expense type only)
      if (type === 'expense') {
        const paymentNames = Object.values(CREDIT_CARD_PAYMENT_NAMES) as string[];
        const targetName = CREDIT_CARD_PAYMENT_NAMES[language as 'pt' | 'en'] || CREDIT_CARD_PAYMENT_NAMES.en;
        const hasAnyPaymentCat = Array.from(map.values()).some((c) => paymentNames.includes(c.name));

        // Insert for current user if none exists under current user specifically
        const existsForCurrentUser = (data || []).some(
          (c: any) => paymentNames.includes(c.name) && c.user_id === user.id
        );

        if (!hasAnyPaymentCat || !existsForCurrentUser) {
          const { data: inserted, error: insertErr } = await supabase
            .from('categories')
            .insert({ name: targetName, category_type: 'expense', user_id: user.id })
            .select('id, name, category_type, user_id')
            .single();
          if (!insertErr && inserted) {
            map.set(normalize(inserted.name), { name: inserted.name, id: inserted.id });
          }
        }
      }

      const result = Array.from(map.values());
      setCategories(result as { id: string; name: string }[]);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For income/expense transactions, only show current user's accounts
      const { data, error } = await supabase
        .from('accounts')
        .select('id, user_id, name, account_type, balance, currency, owner_user, overdraft_limit, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For expense transactions, show current user's credit cards
      // For "saque", we need all credit cards (for cash advance)
      const { data, error } = await supabase
        .from('cards')
        .select('id, user_id, name, card_type, owner_user, closing_date, due_date, currency')
        .eq('user_id', user.id)
        .eq('card_type', 'credit') // Only credit cards for expenses
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

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('id, name, broker')
        .order('name');
      if (error) throw error;
      setInvestments((data as any) || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os investimentos",
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

    // Para débito, sempre requer seleção de conta (débito = conta corrente)
    if (type === "expense" && paymentMethod === "debit_card" && !accountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta para o débito (débito = conta corrente)",
        variant: "destructive",
      });
      return;
    }

  // Validar conta para despesas com transferência de pagamento
        if (type === "expense" && paymentMethod === "payment_transfer" && !accountId) {
          toast({
            title: t('transactionForm.error'),
            description: t('transactionForm.selectAccountError'),
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

  // Validar método de pagamento de cartão
  if (type === "expense" && paymentMethod === "card_payment") {
    if (!accountId) {
      toast({
        title: "Erro",
        description: "Selecione a conta de origem para o pagamento",
        variant: "destructive",
      });
      return;
    }
    if (!cardId) {
      toast({
        title: "Erro",
        description: "Selecione o cartão que será pago",
        variant: "destructive",
      });
      return;
    }
  }

  // Validar transferência entre contas
  if (type === "income" && paymentMethod === "account_transfer") {
    if (!fromAccountId || !toAccountId) {
      toast({ title: "Erro", description: "Selecione as contas de origem e destino", variant: "destructive" });
      return;
    }
    if (fromAccountId === toAccountId) {
      toast({ title: "Erro", description: "As contas de origem e destino devem ser diferentes", variant: "destructive" });
      return;
    }
  }
  // Validar transferência entre conta e investimento
  if (type === "income" && paymentMethod === "account_investment") {
    if (!fromAccountId || !investmentId) {
      toast({ title: "Erro", description: "Selecione a conta de saída e o investimento", variant: "destructive" });
      return;
    }
  }

  // Validar saque
  if (type === "expense" && paymentMethod === "saque") {
    if (!saqueSourceAccountId) {
      toast({ title: t('saqueError'), description: t('saqueSelectAccount'), variant: "destructive" });
      return;
    }
    
    // Verificar se a fonte do saque tem saldo/limite suficiente
    if (saqueSourceType === "account") {
      const sourceAccount = accounts.find(a => a.id === saqueSourceAccountId);
      if (sourceAccount) {
        const transactionAmount = parseFloat(amount);
        const convertedAmount = convertCurrency(transactionAmount, currency, sourceAccount.currency as CurrencyCode);
        if (sourceAccount.balance < convertedAmount) {
          toast({ 
            title: t('saqueError'), 
            description: t('saqueInsufficientBalance'),
            variant: "destructive" 
          });
          return;
        }
      }
    } else if (saqueSourceType === "card") {
      // Para cartão de crédito, verificamos apenas se existe (limite será validado pelo sistema)
      const sourceCard = cards.find(c => c.id === saqueSourceAccountId);
      if (!sourceCard) {
        toast({ 
          title: t('saqueError'), 
          description: "Cartão não encontrado",
          variant: "destructive" 
        });
        return;
      }
    }
  }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const transactionAmount = parseFloat(parseFloat(amount).toFixed(2));

      // Determine owner_user based on couple relationship
      let ownerUser = "user1"; // default
      if (isPartOfCouple && couple) {
        // If user is part of a couple, determine if they are user1 or user2
        ownerUser = user.id === couple.user1_id ? "user1" : "user2";
      }

      console.log('Creating transaction with owner_user:', ownerUser, 'for user:', user.id);

// Inserir transação (regras para fluxo especial de receitas)
      if (type === "income" && paymentMethod === "account_transfer") {
        const fromAcc = accounts.find(a => a.id === fromAccountId);
        const toAcc = accounts.find(a => a.id === toAccountId);
        if (!fromAcc || !toAcc) throw new Error("Contas inválidas");
        const amtFrom = convertCurrency(transactionAmount, currency, (fromAcc.currency || "BRL") as CurrencyCode);
        const amtTo = convertCurrency(transactionAmount, currency, (toAcc.currency || "BRL") as CurrencyCode);

        // Saldos serão atualizados automaticamente pelo trigger do banco

        // Registra duas transações (saída e entrada)
        const transferDescOut = description || 'Transferência entre contas - saída';
        const transferDescIn = description || 'Transferência entre contas - entrada';
const transferInserts: TablesInsert<'transactions'>[] = [
          {
            user_id: user.id,
            owner_user: ownerUser,
            type: 'expense',
            amount: amtFrom,
            currency: (fromAcc.currency || 'BRL') as Enums<'currency_type'>,
            description: transferDescOut,
            category_id: categoryId || null,
            subcategory: subcategory || null,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            payment_method: 'account_transfer' as any,
            card_id: null,
            account_id: fromAcc.id,
            is_installment: false,
            total_installments: null,
            installment_number: null
          },
          {
            user_id: user.id,
            owner_user: ownerUser,
            type: 'income',
            amount: amtTo,
            currency: (toAcc.currency || 'BRL') as Enums<'currency_type'>,
            description: transferDescIn,
            category_id: categoryId || null,
            subcategory: subcategory || null,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            payment_method: 'account_transfer' as any,
            card_id: null,
            account_id: toAcc.id,
            is_installment: false,
            total_installments: null,
            installment_number: null
          }
        ];
        const insertRes = await supabase.from('transactions').insert(transferInserts);
        if (insertRes.error) throw insertRes.error;

        toast({ title: t('transactionForm.success'), description: t('transactionForm.transferSuccess') });
        // Reset
        setAmount(""); setDescription(""); setCategoryId(""); setSubcategory(""); setTransactionDate(() => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return now;
        });
        setPaymentMethod("cash"); setAccountId(""); setFromAccountId(""); setToAccountId(""); setSaqueSourceAccountId(""); setSaqueSourceType("account"); setCardId(""); setCurrency(userPreferredCurrency);
        return;
      }

      if (type === "income" && paymentMethod === "account_investment") {
        const fromAcc = accounts.find(a => a.id === fromAccountId);
        if (!fromAcc) throw new Error("Conta de saída inválida");
        const amtFrom = convertCurrency(transactionAmount, currency, (fromAcc.currency || "BRL") as CurrencyCode);

        // Saldo será atualizado automaticamente pelo trigger do banco

        // Registra transação de saída da conta para investimento
        const transferDesc = description || 'Transferência para investimento';
const invTxn: TablesInsert<'transactions'> = {
          user_id: user.id,
          owner_user: ownerUser,
          type: 'expense',
          amount: amtFrom,
          currency: (fromAcc.currency || 'BRL') as Enums<'currency_type'>,
          description: transferDesc,
          category_id: categoryId || null,
          subcategory: subcategory || null,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          payment_method: 'account_investment' as any,
          card_id: null,
          account_id: fromAcc.id,
          is_installment: false,
          total_installments: null,
          installment_number: null
        };
        const { error: invErr } = await supabase.from('transactions').insert(invTxn);
        if (invErr) throw invErr;

        toast({ title: t('transactionForm.success'), description: t('transactionForm.investmentTransferSuccess') });
        // Reset
        setAmount(""); setDescription(""); setCategoryId(""); setSubcategory(""); setTransactionDate(() => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return now;
        });
        setPaymentMethod("cash"); setAccountId(""); setFromAccountId(""); setToAccountId(""); setInvestmentId(""); setSaqueSourceAccountId(""); setSaqueSourceType("account"); setCardId(""); setCurrency(userPreferredCurrency);
        return;
      }

      // Handle SAQUE (withdrawal) - expenses only
      if (type === "expense" && paymentMethod === "saque") {
        try {
          // Use the process_withdrawal function to handle both account and card withdrawals
          const { data: withdrawalResult, error: withdrawalError } = await supabase.rpc(
            'process_withdrawal',
            {
              p_user_id: user.id,
              p_amount: transactionAmount,
              p_currency: currency as Enums<'currency_type'>,
              p_source_account_id: saqueSourceType === "account" ? saqueSourceAccountId : null,
              p_source_card_id: saqueSourceType === "card" ? saqueSourceAccountId : null,
              p_description: description || (saqueSourceType === "account" ? "Saque bancário" : "Adiantamento cartão")
            }
          );
          
          if (withdrawalError) throw withdrawalError;
          
          toast({ 
            title: t('transactionForm.success'), 
            description: saqueSourceType === "account" 
              ? "Saque realizado com sucesso! O dinheiro foi creditado na sua conta de dinheiro."
              : "Adiantamento realizado com sucesso! O dinheiro foi creditado na sua conta de dinheiro."
          });
          
          // Reset form
          setAmount(""); setDescription(""); setCategoryId(""); setSubcategory(""); 
          setTransactionDate(() => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return now;
          });
          setPaymentMethod("cash"); setAccountId(""); setSaqueSourceAccountId(""); setSaqueSourceType("account"); setCardId(""); setCurrency(userPreferredCurrency);
          return;
        } catch (error: any) {
          toast({
            title: "Erro no saque",
            description: error.message || "Erro ao processar saque",
            variant: "destructive",
          });
          return;
        }
      }

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

          // Primeira parcela vai para gastos mensais (current)
          const firstInstallmentDate = makeDueDate(purchaseDate, firstOffset);
          const firstInstallmentAmount = per / 100;
          
          const firstInstallment = {
            user_id: user.id,
            owner_user: ownerUser,
            type: "expense" as const,
            amount: firstInstallmentAmount,
            currency,
            description: `${description} (1/${totalInstallments})`,
            category_id: categoryId,
            subcategory: subcategory || null,
            transaction_date: format(firstInstallmentDate, 'yyyy-MM-dd'),
            purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
            payment_method: "credit_card" as const,
            card_id: cardId,
            account_id: null,
            is_installment: true,
            total_installments: totalInstallments,
            installment_number: 1,
            expense_source_type: 'installment_current'
          };

          // Inserir primeira parcela em transactions (gastos mensais)
          const { data: firstInstallmentData, error: firstInstallmentErr } = await supabase
            .from("transactions")
            .insert(firstInstallment)
            .select()
            .single();
          
          if (firstInstallmentErr) throw firstInstallmentErr;

          // Demais parcelas vão para gastos futuros
          const futureInstallments = Array.from({ length: totalInstallments - 1 }, (_, i) => {
            const installmentNumber = i + 2; // Começa da segunda parcela
            const isLast = installmentNumber === totalInstallments;
            const amountCents = isLast ? total - per * (totalInstallments - 1) : per;
            const dueDate = makeDueDate(purchaseDate, firstOffset + installmentNumber - 1);
            
            return {
              user_id: user.id,
              recurring_expense_id: null,
              installment_transaction_id: firstInstallmentData.id,
              card_payment_info: null,
              original_due_date: format(dueDate, 'yyyy-MM-dd'),
              payment_date: format(dueDate, 'yyyy-MM-dd'),
              amount: amountCents / 100,
              description: `${description} (${installmentNumber}/${totalInstallments})`,
              category_id: categoryId,
              payment_method: 'credit_card',
              account_id: null,
              card_id: cardId,
              transaction_id: null,
              owner_user: ownerUser,
              expense_source_type: 'installment'
            };
          });

          // Inserir parcelas futuras em future_expense_payments
          if (futureInstallments.length > 0) {
            const { error: futureInstallmentsErr } = await supabase
              .from("future_expense_payments")
              .insert(futureInstallments);
            
            if (futureInstallmentsErr) throw futureInstallmentsErr;
          }
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
          transaction_date: format(dueDate, 'yyyy-MM-dd'),
          purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
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
        // Validar limite (overdraft) para despesas com débito/transferência de pagamento (com conversão de moeda)
        if (type === "expense" && (paymentMethod === "debit_card" || paymentMethod === "payment_transfer") && accountId) {
          const selectedAccount = accounts.find(acc => acc.id === accountId);
          const limit = Number(selectedAccount?.overdraft_limit ?? 0);
          const accCurrency = (selectedAccount?.currency || "BRL") as CurrencyCode;
          const txnInAccCurrency = convertCurrency(transactionAmount, currency, accCurrency);
          const proposed = (Number(selectedAccount?.balance ?? 0)) - txnInAccCurrency;
          if (proposed < -limit) {
            toast({
              title: t('transactionForm.limitExceeded'),
              description: t('transactionForm.limitExceededMessage'),
              variant: "destructive",
            });
            return;
          }
        }

        // Check credit card limit and warn if exceeded (but allow transaction)
        let limitExceeded = false;
        let cardName = "";
        let availableLimit = 0;
        
        if (type === "expense" && paymentMethod === "credit_card" && cardId) {
          const selectedCard = cards.find(card => card.id === cardId);
          if (selectedCard) {
            // Get current card data with limit information
            const { data: cardData, error: cardError } = await supabase
              .from('cards')
              .select('name, credit_limit, initial_balance_original, current_balance, currency')
              .eq('id', cardId)
              .single();

            if (!cardError && cardData) {
              cardName = cardData.name;
              const creditLimit = Number(cardData.credit_limit || 0);
              const initialBalanceOriginal = Number(cardData.initial_balance_original || 0);
              const currentBalance = Number(cardData.current_balance || 0);
              const cardCurrency = (cardData.currency || "BRL") as CurrencyCode;
              const convertedAmount = convertCurrency(transactionAmount, currency, cardCurrency);
              
              // Calculate available limit
              availableLimit = creditLimit - initialBalanceOriginal - currentBalance;
              
              // Check if this transaction would exceed the limit
              if (convertedAmount > availableLimit && availableLimit >= 0) {
                limitExceeded = true;
              }
            }
          }
        }
        // Para método de pagamento de cartão ou categoria de Pagamento de Cartão de Crédito, usar função unificada
        if (type === "expense" && (paymentMethod === "card_payment" || isCreditCardPaymentCategory) && cardId) {
          const { data, error } = await supabase.rpc('process_card_payment', {
            p_user_id: user.id,
            p_card_id: cardId,
            p_payment_amount: transactionAmount,
            p_payment_date: format(transactionDate, 'yyyy-MM-dd'),
            p_payment_method: (paymentMethod === 'deposit' || paymentMethod === 'transfer' || paymentMethod === 'card_payment') ? 'account' : 'cash',
            p_account_id: accountId || null,
            p_notes: description,
          });

          if (error) {
            throw error;
          }

          if (data && typeof data === 'object' && 'success' in data && data.success) {
            toast({
              title: "Sucesso",
              description: "Pagamento de cartão processado com sucesso",
              variant: "default",
            });
            
            // Return transaction data for onSubmit callback
            const transactionData = {
              id: (data as any).transaction_id,
              type,
              amount: transactionAmount,
              description,
              category_id: categoryId,
              subcategory,
              transaction_date: transactionDate,
              payment_method: paymentMethod,
              card_id: cardId,
              user_id: user.id,
              currency,
            };
            
            onSubmit(transactionData as any);
            // Reset form
            setType("expense");
            setAmount("");
            setDescription("");
            setCategoryId("");
            setSubcategory("");
            setTransactionDate(new Date());
            setPaymentMethod("cash");
            setCardId("");
            setAccountId("");
            return;
          } else {
            throw new Error('Falha no processamento do pagamento');
          }
        } else {
          // Para outras transações, manter lógica existente
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
              transaction_date: format(transactionDate, 'yyyy-MM-dd'),
              purchase_date: format(transactionDate, 'yyyy-MM-dd'),
              payment_method: paymentMethod,
              card_id: paymentMethod === "credit_card" ? cardId : null,
              account_id: paymentMethod === "credit_card" ? null : (accountId || null),
              is_installment: false,
              total_installments: null,
              installment_number: null
            });

          if (error) {
            // Handle specific cash balance error
            if (error.message?.includes('Saldo insuficiente em dinheiro')) {
              toast({
                title: t('insufficientCashBalance'),
                description: t('cashBalanceError'),
                variant: "destructive",
              });
              return;
            }
            throw error;
          }
        }

        // Show limit exceeded warning if applicable
        if (limitExceeded) {
          const formatCurrency = (value: number, currency: string = 'BRL') => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: currency,
            }).format(value);
          };

          toast({
            title: "⚠️ Limite do Cartão Extrapolado",
            description: `Você gastou além do limite disponível do cartão ${cardName}. Limite disponível era: ${formatCurrency(availableLimit, currency)}`,
            variant: "destructive",
            duration: 8000,
          });

          // Add to AI history for premium users
          try {
            const { data: subscription } = await supabase
              .from('subscribers')
              .select('subscribed, subscription_tier')
              .eq('user_id', user.id)
              .single();

            if (subscription?.subscribed && subscription?.subscription_tier === 'premium') {
              await supabase.from('ai_history').insert({
                user_id: user.id,
                entry_type: 'limit_exceeded',
                message: `Limite do cartão ${cardName} foi extrapolado. Gasto de ${formatCurrency(transactionAmount, currency)} excedeu o limite disponível de ${formatCurrency(availableLimit, currency)} em ${new Date().toLocaleDateString('pt-BR')}.`,
                card_name: cardName,
                amount: transactionAmount,
                currency: currency
              });
            }
          } catch (historyError) {
            console.error('Error adding to AI history:', historyError);
          }
        }
      }

      // Atualizar saldo da conta para receitas com depósito ou transferência
      if (type === "income" && (paymentMethod === "deposit" || paymentMethod === "transfer") && accountId) {
        const selectedAccount = accounts.find(acc => acc.id === accountId);
        if (selectedAccount) {
          const accCurrency = (selectedAccount.currency || "BRL") as CurrencyCode;
          const amtInAcc = convertCurrency(transactionAmount, currency, accCurrency);
          const newBalance = Number(selectedAccount.balance) + amtInAcc;
          
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);

          if (updateError) {
            console.error('Erro ao atualizar saldo da conta:', updateError);
          }
        }
      }

      // Atualizar saldo da conta para despesas com débito/transferência de pagamento
      if (type === "expense" && (paymentMethod === "debit_card" || paymentMethod === "payment_transfer") && accountId) {
        const selectedAccount = accounts.find(acc => acc.id === accountId);
        if (selectedAccount) {
          const accCurrency = (selectedAccount.currency || "BRL") as CurrencyCode;
          const amtInAcc = convertCurrency(transactionAmount, currency, accCurrency);
          const newBalance = Number(selectedAccount.balance) - amtInAcc;
          
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);

          if (updateError) {
            console.error('Erro ao atualizar saldo da conta:', updateError);
          }
        }
      }

      // Repor limite/saldo do cartão quando a categoria for Pagamento de Cartão de Crédito
      if (type === "expense" && isCreditCardPaymentCategory && cardId) {
        const { data: cardData, error: cardErr } = await supabase
          .from('cards')
          .select('current_balance, currency')
          .eq('id', cardId)
          .single();
        if (!cardErr && cardData) {
          const currentBalance = Number((cardData as any).current_balance || 0);
          const cardCurrency = ((cardData as any).currency || "BRL") as CurrencyCode;
          const amountInCardCurrency = convertCurrency(transactionAmount, currency, cardCurrency);
          const newBalance = currentBalance - amountInCardCurrency; // permite saldo positivo no cartão após pagamento superior
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
        title: t('transactionForm.success'),
        description: t('transactionForm.successMessage'),
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId("");
      setSubcategory("");
      setTransactionDate(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
      });
      setPaymentMethod("cash");
      setAccountId("");
      setSaqueSourceAccountId("");
      setSaqueSourceType("account");
      setCardId("");
      setCurrency(userPreferredCurrency);
    } catch (error: any) {
      const errorMessage = error.message?.includes('transaction_payment_method__check') || error.message?.includes('violates check constraint')
        ? t('transactionForm.constraintError')
        : error.message || t('transactionForm.errorMessage');
      
      toast({
        title: t('transactionForm.error'),
        description: errorMessage,
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
                  {transactionDate ? format(transactionDate, "PPP", { locale: dateLocale }) : <span>{t('transactionForm.selectDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border border-border" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  locale={dateLocale}
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
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder={t('transactionForm.selectPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('transactionForm.cash')}</SelectItem>
                {type === "income" ? (
                  <>
                    <SelectItem value="deposit">{t('transactionForm.deposit')}</SelectItem>
                    <SelectItem value="transfer">{t('transactionForm.receivedTransfer')}</SelectItem>
                    <SelectItem value="account_transfer">{t('transactionForm.accountTransfer')}</SelectItem>
                    <SelectItem value="account_investment">{t('transactionForm.accountInvestmentTransfer')}</SelectItem>
                  </>
                  ) : (
                  <>
                    <SelectItem value="debit_card">{t('transactionForm.debitCard')}</SelectItem>
                     <SelectItem value="payment_transfer">
                       {t('transactionForm.paymentTransfer')}
                       <span className="text-xs text-muted-foreground ml-1">
                         ({language === 'pt' ? 'PIX' : 'ZELLE'})
                       </span>
                     </SelectItem>
                     <SelectItem value="credit_card">{t('transactionForm.creditCard')}</SelectItem>
                     <SelectItem value="card_payment">Pagamento de Cartão</SelectItem>
                     <SelectItem value="saque">{t('saque')}</SelectItem>
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
                          {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Account Selection for Income with Account-to-Account Transfer */}
          {type === "income" && paymentMethod === "account_transfer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromAccount">{t('transactionForm.selectSourceAccount')}</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toAccount">{t('transactionForm.selectDestinationAccount')}</Label>
                <Select value={toAccountId} onValueChange={setToAccountId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Account to Investment Transfer */}
          {type === "income" && paymentMethod === "account_investment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromAccount">{t('transactionForm.selectSourceAccount')}</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="investment">{t('transactionForm.selectInvestment')}</Label>
                <Select value={investmentId} onValueChange={setInvestmentId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactionForm.selectInvestment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {investments.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{inv.name}</span>
                          {inv.broker && (
                            <span className="text-muted-foreground ml-2">{inv.broker}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          {type === "expense" && (paymentMethod === "debit_card" || paymentMethod === "payment_transfer") && (
            <div>
              <Label htmlFor="account">{t('transactionForm.selectAccount')}</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const limit = Number(account.overdraft_limit || 0);
                    const bal = Number(account.balance || 0);
                    const used = bal < 0 ? Math.min(limit, Math.abs(bal)) : 0;
                    const exhausted = limit > 0 && used >= limit;
                    return (
                      <SelectItem key={account.id} value={account.id} disabled={exhausted}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                            {exhausted && <span className="ml-2 text-destructive">• Limite esgotado</span>}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Warning when selected account has exhausted overdraft */}
              {accountId && (() => {
                const acc = accounts.find(a => a.id === accountId);
                if (!acc) return null;
                const limit = Number(acc.overdraft_limit || 0);
                const bal = Number(acc.balance || 0);
                const used = bal < 0 ? Math.min(limit, Math.abs(bal)) : 0;
                const exhausted = limit > 0 && used >= limit;
                return exhausted ? (
                  <div className="mt-2 text-sm text-destructive">
                    Limite utilizado igual ao limite desta conta. Despesa via débito bloqueada.
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Source Selection for SAQUE - Account or Credit Card */}
          {type === "expense" && paymentMethod === "saque" && (
            <div className="space-y-4">
              {/* Source Type Selection */}
              <div>
                <Label>Fonte do Saque</Label>
                <RadioGroup
                  value={saqueSourceType}
                  onValueChange={(value) => {
                    setSaqueSourceType(value as "account" | "card");
                    setSaqueSourceAccountId(""); // Reset selection when changing type
                  }}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="account" value="account" />
                    <Label htmlFor="account">Conta Bancária</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="card" value="card" />
                    <Label htmlFor="card">Cartão de Crédito (Adiantamento)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Account Selection */}
              {saqueSourceType === "account" && (
                <div>
                  <Label htmlFor="saqueAccount">Selecionar Conta Bancária</Label>
                  <Select value={saqueSourceAccountId} onValueChange={setSaqueSourceAccountId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta bancária" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(account => !account.is_cash_account).map((account) => {
                        const hasBalance = Number(account.balance || 0) > 0;
                        const convertedAmount = amount ? convertCurrency(parseFloat(amount), currency, account.currency as CurrencyCode) : 0;
                        const sufficientBalance = hasBalance && Number(account.balance) >= convertedAmount;
                        
                        return (
                          <SelectItem 
                            key={account.id} 
                            value={account.id}
                            disabled={!sufficientBalance}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{account.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                                {!sufficientBalance && amount && (
                                  <span className="ml-2 text-destructive">• Saldo insuficiente</span>
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Show balance validation message for accounts */}
                  {saqueSourceAccountId && amount && (() => {
                    const sourceAccount = accounts.find(a => a.id === saqueSourceAccountId);
                    if (!sourceAccount) return null;
                    const convertedAmount = convertCurrency(parseFloat(amount), currency, sourceAccount.currency as CurrencyCode);
                    const sufficientBalance = sourceAccount.balance >= convertedAmount;
                    
                    return !sufficientBalance ? (
                      <div className="mt-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                        ⚠️ Saldo insuficiente na conta
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                        ✅ Saldo suficiente para saque
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Credit Card Selection */}
              {saqueSourceType === "card" && (
                <div>
                  <Label htmlFor="saqueCard">Selecionar Cartão de Crédito</Label>
                  <Select value={saqueSourceAccountId} onValueChange={setSaqueSourceAccountId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cartão de crédito" />
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
                  
                  {saqueSourceAccountId && (
                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                      ℹ️ Adiantamento em cartão de crédito. O valor será debitado do limite disponível.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Smart Card Payment Section */}
          {type === "expense" && paymentMethod === "card_payment" && (
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-primary">Pagamento Inteligente de Cartão</h4>
              </div>
              
              {/* Conta origem */}
              <div>
                <Label htmlFor="sourceAccount">Conta de Origem</Label>
                <Select value={accountId} onValueChange={setAccountId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta que pagará" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(account => !account.is_cash_account).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {account.currency} {account.balance.toFixed(2)} • {getAccountOwnerName(account)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cartão destino */}
              <div>
                <Label htmlFor="targetCard">Cartão a Pagar</Label>
                <Select value={cardId} onValueChange={setCardId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão para pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.filter(card => card.card_type === 'credit').map((card) => (
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

              {/* Preview do pagamento */}
              {accountId && cardId && amount && (
                <div className="p-3 bg-white/50 border border-primary/10 rounded-md">
                  <div className="text-sm text-muted-foreground mb-2">Preview do Pagamento:</div>
                  <div className="flex items-center justify-between">
                    <span>Valor a pagar:</span>
                    <span className="font-semibold text-primary">{formatCurrency(parseFloat(amount), currency)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    ✓ Sistema detectará automaticamente gastos futuros relacionados
                    <br />
                    ✓ Status do cartão será atualizado baseado no pagamento mínimo
                  </div>
                </div>
              )}
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
                    {translateCategoryUtil(cat.name, language)}
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

          {/* Cash Balance Warning */}
          {type === "expense" && paymentMethod === "cash" && amount && (
            <div className="mt-2">
              {!canSpendCash(parseFloat(amount), currency) ? (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  ⚠️ {getCashBalanceError(parseFloat(amount), currency)}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  ✅ Saldo em dinheiro suficiente
                </div>
              )}
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


          <Button
            type="submit"
            className="w-full"
            disabled={
              type === "expense" &&
              (
                // Cash payment validation
                (paymentMethod === "cash" && amount && !canSpendCash(parseFloat(amount), currency)) ||
                // Debit card and transfer validation
                ((paymentMethod === "debit_card" || paymentMethod === "payment_transfer") &&
                (() => {
                  const acc = accounts.find(a => a.id === accountId);
                  if (!acc) return false;
                  const limit = Number(acc.overdraft_limit || 0);
                  const bal = Number(acc.balance || 0);
                  if (amount) {
                    const amtNum = parseFloat(amount || "0");
                    const amtInAcc = convertCurrency(amtNum, currency, (acc.currency || "BRL") as CurrencyCode);
                    const proposed = bal - amtInAcc;
                    return proposed < -limit;
                  }
                  const used = bal < 0 ? Math.min(limit, Math.abs(bal)) : 0;
                  return limit > 0 && used >= limit;
                })())
              )
            }
            title={
              type === "expense" && paymentMethod === "cash" && amount && !canSpendCash(parseFloat(amount), currency)
                ? getCashBalanceError(parseFloat(amount), currency) || t('insufficientCashBalance')
                : type === "expense" && (paymentMethod === "debit_card" || paymentMethod === "payment_transfer") 
                ? t('transactionForm.blockedLimitExhausted') 
                : undefined
            }
          >
            {t('transactionForm.addTransaction')}
          </Button>
        </form>
      </div>
    </Card>
  );
};