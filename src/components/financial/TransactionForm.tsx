import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, MinusCircle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

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
  payment_method: "cash" | "credit_card" | "debit_card";
  card_id?: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface Card {
  id: string;
  name: string;
  card_type: string;
}

export const TransactionForm = ({ onSubmit }: TransactionFormProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card" | "debit_card">("cash");
  const [cardId, setCardId] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("1");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchCategories();
    fetchCards();
  }, [type]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, category_type')
        .eq('category_type', type)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, card_type')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          owner_user: user.email || "user1",
          type,
          amount: parseFloat(amount),
          description,
          category_id: categoryId,
          subcategory: subcategory || null,
          transaction_date: transactionDate.toISOString().split('T')[0],
          payment_method: paymentMethod,
          card_id: paymentMethod !== 'cash' ? cardId : null,
          is_installment: paymentMethod === 'credit_card' ? isInstallment : false,
          total_installments: paymentMethod === 'credit_card' && isInstallment ? parseInt(totalInstallments) : null,
          installment_number: paymentMethod === 'credit_card' && isInstallment ? 1 : null
        });

      if (error) throw error;

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
      setCardId("");
      setIsInstallment(false);
      setTotalInstallments("1");
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
              <PopoverContent className="w-auto p-0" align="start">
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

          {/* Amount */}
          <div>
            <Label htmlFor="amount">{t('transactionForm.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
              required
            />
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
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "cash" | "credit_card" | "debit_card")}>
              <SelectTrigger>
                <SelectValue placeholder={t('transactionForm.selectPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('transactionForm.cash')}</SelectItem>
                <SelectItem value="credit_card">{t('transactionForm.creditCard')}</SelectItem>
                <SelectItem value="debit_card">{t('transactionForm.debitCard')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Selection */}
          {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
            <div>
              <Label>{t('transactionForm.card')}</Label>
              <Select value={cardId} onValueChange={setCardId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionForm.selectCard')} />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} ({card.card_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Installment Options for Credit Card */}
          {paymentMethod === "credit_card" && type === "expense" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="installment"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="installment">{t('transactionForm.installmentPayment')}</Label>
              </div>
              
              {isInstallment && (
                <div>
                  <Label htmlFor="installments">{t('transactionForm.installments')}</Label>
                  <Select value={totalInstallments} onValueChange={setTotalInstallments}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('transactionForm.selectInstallments')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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