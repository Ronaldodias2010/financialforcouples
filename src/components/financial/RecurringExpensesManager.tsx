import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUserNames } from "@/hooks/useUserNames";
import { useLanguage } from "@/hooks/useLanguage";
interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category_id?: string;
  card_id?: string;
  frequency_days: number;
  next_due_date: Date;
  is_active: boolean;
  owner_user?: string;
  contract_duration_months?: number;
}

interface Category {
  id: string;
  name: string;
  category_type: string;
}

interface Card {
  id: string;
  name: string;
  card_type: string;
  owner_user?: string;
}

interface RecurringExpensesManagerProps {
  viewMode: "both" | "user1" | "user2";
}

export const RecurringExpensesManager = ({ viewMode }: RecurringExpensesManagerProps) => {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [frequencyDays, setFrequencyDays] = useState("30");
  const [nextDueDate, setNextDueDate] = useState<Date>(new Date());
  const [contractDuration, setContractDuration] = useState("");
  
const { toast } = useToast();
const { userNames } = useUserNames();
const { t } = useLanguage();
const getOwnerName = (owner?: string) => owner === 'user2' ? userNames.user2 : userNames.user1;
  useEffect(() => {
    fetchRecurringExpenses();
    fetchCategories();
    fetchCards();
  }, [viewMode]);

  const fetchRecurringExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('next_due_date');

      if (error) throw error;

      let allExpenses = (data || []).map(expense => ({
        ...expense,
        next_due_date: new Date(expense.next_due_date)
      }));

      // Filtrar por viewMode
      if (viewMode !== "both") {
        allExpenses = allExpenses.filter(expense => {
          const ownerUser = expense.owner_user || 'user1';
          return ownerUser === viewMode;
        });
      }

      setExpenses(allExpenses);
    } catch (error) {
      toast({
        title: t('recurring.error'),
        description: t('recurring.loadError'),
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Scope to couple and deduplicate by normalized name (prefer current user's id)
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
        .eq('category_type', 'expense')
        .in('user_id', userIds)
        .order('name');

      if (error) throw error;

      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      const map = new Map<string, { id: string; name: string }>();
      (data || []).forEach((c: any) => {
        const key = normalize(c.name);
        const current = map.get(key);
        if (!current) {
          map.set(key, { id: c.user_id === user.id ? c.id : c.id, name: c.name });
        } else if (c.user_id === user.id) {
          map.set(key, { id: c.id, name: current.name });
        }
      });

      setCategories(Array.from(map.values()) as any);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, card_type, owner_user')
        .order('name');

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('recurring.userNotAuth'));

      if (editingExpense) {
        const { error } = await supabase
          .from('recurring_expenses')
          .update({
            name,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            card_id: cardId || null,
            frequency_days: parseInt(frequencyDays),
            next_due_date: nextDueDate.toISOString().split('T')[0],
            contract_duration_months: contractDuration ? parseInt(contractDuration) : null,
          })
          .eq('id', editingExpense.id);

        if (error) throw error;

        toast({
          title: t('recurring.success'),
          description: t('recurring.updated'),
        });
      } else {
        // Determine owner_user based on couple relationship
        const { data: coupleData } = await supabase
          .from('user_couples')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('status', 'active')
          .maybeSingle();

        const ownerUser = coupleData 
          ? (coupleData.user1_id === user.id ? 'user1' : 'user2')
          : 'user1';

        const { error } = await supabase
          .from('recurring_expenses')
          .insert({
            name,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            card_id: cardId || null,
            frequency_days: parseInt(frequencyDays),
            next_due_date: nextDueDate.toISOString().split('T')[0],
            owner_user: ownerUser,
            user_id: user.id,
            contract_duration_months: contractDuration ? parseInt(contractDuration) : null,
          });

        if (error) throw error;

        toast({
          title: t('recurring.success'),
          description: t('recurring.created'),
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchRecurringExpenses();
    } catch (error: any) {
      toast({
        title: t('recurring.error'),
        description: error.message || t('recurring.saveError'),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setName(expense.name);
    setAmount(expense.amount.toString());
    setCategoryId(expense.category_id || "");
    setCardId(expense.card_id || "");
    setFrequencyDays(expense.frequency_days.toString());
    setNextDueDate(new Date(expense.next_due_date));
    setContractDuration(expense.contract_duration_months?.toString() || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('recurring.success'),
        description: t('recurring.deleted'),
      });

      fetchRecurringExpenses();
    } catch (error: any) {
      toast({
        title: t('recurring.error'),
        description: error.message || t('recurring.deleteError'),
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (expense: RecurringExpense) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: !expense.is_active })
        .eq('id', expense.id);

      if (error) throw error;

      toast({
        title: t('recurring.success'),
        description: expense.is_active ? t('recurring.deactivated') : t('recurring.activated'),
      });

      fetchRecurringExpenses();
    } catch (error: any) {
      toast({
        title: t('recurring.error'),
        description: error.message || t('recurring.statusError'),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setAmount("");
    setCategoryId("");
    setCardId("");
    setFrequencyDays("30");
    setNextDueDate(new Date());
    setContractDuration("");
    setEditingExpense(null);
  };

  const getFrequencyLabel = (days: number) => {
    if (days === 7) return t('recurring.weeklyShort');
    if (days === 30) return t('recurring.monthlyShort');
    if (days === 90) return t('recurring.quarterlyShort');
    if (days === 365) return t('recurring.yearlyShort');
    return t('recurring.everyDays').replace('{days}', days.toString());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('recurring.title')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('recurring.addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? t('recurring.editTitle') : t('recurring.newTitle')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('recurring.name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('recurring.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">{t('recurring.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('recurring.amountPlaceholder')}
                  required
                />
              </div>

              <div>
                <Label>{t('recurring.category')}</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('recurring.categoryPlaceholder')} />
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

              <div>
                <Label>{t('recurring.card')}</Label>
                <Select value={cardId} onValueChange={setCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('recurring.cardPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name} ({card.card_type}) • {getOwnerName(card.owner_user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('recurring.frequency')}</Label>
                <Select value={frequencyDays} onValueChange={setFrequencyDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{t('recurring.weekly')}</SelectItem>
                    <SelectItem value="30">{t('recurring.monthly')}</SelectItem>
                    <SelectItem value="90">{t('recurring.quarterly')}</SelectItem>
                    <SelectItem value="365">{t('recurring.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contractDuration">{t('recurring.contractDuration')}</Label>
                <Input
                  id="contractDuration"
                  type="number"
                  min="1"
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  placeholder={t('recurring.contractDurationPlaceholder')}
                />
              </div>

              <div>
                <Label>{t('recurring.nextDue')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !nextDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextDueDate ? format(nextDueDate, "PPP", { locale: ptBR }) : <span>{t('recurring.datePlaceholder')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={nextDueDate}
                      onSelect={(date) => date && setNextDueDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingExpense ? t('recurring.update') : t('recurring.create')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('recurring.cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {expenses.length === 0 ? (
          <Card className="p-8 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t('recurring.noExpenses')}
            </p>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className={cn("p-4", !expense.is_active && "opacity-50")}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{expense.name}</h3>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      expense.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    )}>
                      {expense.is_active ? t('recurring.active') : t('recurring.inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R$ {expense.amount.toFixed(2)} • {getFrequencyLabel(expense.frequency_days)} • {getOwnerName(expense.owner_user)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('recurring.next')}: {format(new Date(expense.next_due_date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(expense)}
                  >
                    {expense.is_active ? t('recurring.deactivate') : t('recurring.activate')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(expense)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};