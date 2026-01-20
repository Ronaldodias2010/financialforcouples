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
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCategoryName } from "@/utils/categoryTranslation";
import { parseLocalDate } from "@/utils/date";

// Helper to format date for DB without timezone issues
const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to safely convert to Date object
const toSafeDate = (dateValue: Date | string): Date => {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  const parsed = parseLocalDate(dateValue);
  return parsed;
};

// Helper to format date safely for display
const formatSafeDate = (dateValue: Date | string): string => {
  try {
    const date = toSafeDate(dateValue);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Data inválida';
  }
};

// Component to show installment progress and future expense status
const InstallmentProgress = ({ total, remaining, nextDueDate }: { 
  total: number, 
  remaining: number, 
  nextDueDate: Date 
}) => {
  const { t } = useLanguage();
  const [hasFutureExpense, setHasFutureExpense] = useState(false);
  
  useEffect(() => {
    const checkFutureExpense = async () => {
      try {
        const { data } = await supabase
          .from('manual_future_expenses')
          .select('id')
          .eq('is_paid', false)
          .eq('due_date', nextDueDate.toISOString().split('T')[0])
          .limit(1);
        
        setHasFutureExpense((data || []).length > 0);
      } catch (error) {
        console.error('Error checking future expense:', error);
      }
    };
    
    checkFutureExpense();
  }, [nextDueDate]);

  const progress = ((total - remaining) / total) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{t('recurring.progressLabel')}: {total - remaining}/{total}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {hasFutureExpense && (
        <p className="text-xs text-blue-600 font-medium">
          💳 Próxima parcela em Gastos Futuros
        </p>
      )}
    </div>
  );
};
interface Subcategory {
  id: string;
  name: string;
  name_en: string | null;
  name_es: string | null;
}

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category_id?: string;
  subcategory_id?: string;
  card_id?: string;
  frequency_days: number;
  frequency_type?: 'days' | 'months';
  next_due_date: Date;
  is_active: boolean;
  owner_user?: string;
  contract_duration_months?: number;
  created_at: string;
  remaining_installments?: number;
  total_installments?: number;
  is_completed?: boolean;
  category?: { id: string; name: string };
  subcategory?: Subcategory;
}

interface Category {
  id: string;
  name: string;
  category_type: 'income' | 'expense';
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
  console.log('📊 [DEBUG] RecurringExpensesManager mounted with viewMode:', viewMode);
  
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [frequencyDays, setFrequencyDays] = useState("30");
  const [frequencyType, setFrequencyType] = useState<'days' | 'months'>('months');
  const [nextDueDate, setNextDueDate] = useState<Date>(new Date());
  const [contractDuration, setContractDuration] = useState("");
  
  const { toast } = useToast();
  const { names } = usePartnerNames();
  const { t, language } = useLanguage();

  const getLocalizedSubcategoryName = (sub: Subcategory) => {
    if (language === 'en' && sub.name_en) return sub.name_en;
    if (language === 'es' && sub.name_es) return sub.name_es;
    return sub.name;
  };

  const getOwnerName = (owner?: string) => owner === 'user2' ? names.user2Name : names.user1Name;

  useEffect(() => {
    fetchRecurringExpenses();
    fetchCategories();
    fetchCards();
  }, [viewMode]);

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [categoryId]);

  const fetchSubcategories = async (catId: string) => {
    if (!catId) {
      setSubcategories([]);
      return;
    }

    const { data } = await supabase
      .from('subcategories')
      .select('id, name, name_en, name_es')
      .eq('category_id', catId)
      .is('deleted_at', null)
      .order('name');

    setSubcategories(data || []);
  };

  const fetchRecurringExpenses = async () => {
    try {
      // Fetch both active and completed recurring expenses for better overview
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
          *, 
          created_at,
          category:categories(id, name),
          subcategory:subcategories(id, name, name_en, name_es)
        `)
        .order('next_due_date');

      if (error) throw error;

      let allExpenses = (data || []).map(expense => ({
        ...expense,
        next_due_date: parseLocalDate(expense.next_due_date),
        frequency_type: (expense.frequency_type || 'days') as 'days' | 'months'
      }));

      // Filter by viewMode
      if (viewMode !== "both") {
        allExpenses = allExpenses.filter(expense => {
          const ownerUser = expense.owner_user || 'user1';
          return ownerUser === viewMode;
        });
      }

      // Separate active from completed for better display
      const activeExpenses = allExpenses.filter(exp => exp.is_active && !exp.is_completed);
      const completedExpenses = allExpenses.filter(exp => exp.is_completed);

      // Show active first, then completed with different styling
      setExpenses([...activeExpenses, ...completedExpenses]);
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
        
        // Skip "Veículo" (singular) in favor of "Veículos" (plural)
        if (key === 'veiculo' && data.some((cat: any) => normalize(cat.name) === 'veiculos')) {
          return;
        }
        
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
        // Recalculate total installments if contract duration or frequency changed
        const totalInstallments = contractDuration ? 
          Math.ceil((parseInt(contractDuration) * 30) / parseInt(frequencyDays)) : null;
          
        const { error } = await supabase
          .from('recurring_expenses')
          .update({
            name,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            card_id: cardId || null,
            frequency_days: parseInt(frequencyDays),
            frequency_type: frequencyType,
            next_due_date: formatDateForDB(nextDueDate),
            contract_duration_months: contractDuration ? parseInt(contractDuration) : null,
            total_installments: totalInstallments,
            remaining_installments: totalInstallments
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

        // Calculate total installments based on contract duration and frequency
        const totalInstallments = contractDuration ? 
          Math.ceil((parseInt(contractDuration) * 30) / parseInt(frequencyDays)) : null;

        const { error } = await supabase
          .from('recurring_expenses')
          .insert({
            name,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            card_id: cardId || null,
            frequency_days: parseInt(frequencyDays),
            frequency_type: frequencyType,
            next_due_date: formatDateForDB(nextDueDate),
            owner_user: ownerUser,
            user_id: user.id,
            contract_duration_months: contractDuration ? parseInt(contractDuration) : null,
            total_installments: totalInstallments,
            remaining_installments: totalInstallments,
            is_completed: false
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

  const handleEdit = async (expense: RecurringExpense) => {
    console.log('✏️ [DEBUG] Editing expense:', expense);
    setEditingExpense(expense);
    setName(expense.name);
    setAmount(expense.amount.toString());
    setCategoryId(expense.category_id || "");
    setCardId(expense.card_id || "");
    setFrequencyDays(expense.frequency_days.toString());
    const monthlyOptions = ['30', '90', '365'];
    setFrequencyType(
      expense.frequency_type || 
      (monthlyOptions.includes(expense.frequency_days.toString()) ? 'months' : 'days')
    );
    const safeDate = toSafeDate(expense.next_due_date);
    console.log('📅 [DEBUG] Setting next due date:', safeDate);
    setNextDueDate(safeDate);
    setContractDuration(expense.contract_duration_months?.toString() || "");
    
    // Load subcategories if category exists
    if (expense.category_id) {
      await fetchSubcategories(expense.category_id);
    }
    setSubcategoryId(expense.subcategory_id || "");
    
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
    setSubcategoryId("");
    setSubcategories([]);
    setCardId("");
    setFrequencyDays("30");
    setFrequencyType('months');
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
                        {translateCategoryName(cat.name, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcategories.length > 0 && (
                <div>
                  <Label>{t('recurring.subcategory') || 'Subcategoria'}</Label>
                  <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('recurring.subcategoryPlaceholder') || 'Selecione uma subcategoria (opcional)'} />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {getLocalizedSubcategoryName(sub)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Select value={frequencyDays} onValueChange={(value) => {
                  setFrequencyDays(value);
                  // ⭐ Automaticamente definir frequency_type baseado na seleção
                  const monthlyOptions = ['30', '90', '365'];
                  setFrequencyType(monthlyOptions.includes(value) ? 'months' : 'days');
                }}>
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
            <Card key={expense.id} className={cn(
              "p-3 sm:p-4", 
              !expense.is_active && "opacity-50",
              expense.is_completed && "border-green-200 bg-green-50"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base break-words">{expense.name}</h3>
                    <span className={cn(
                      "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap flex-shrink-0",
                      expense.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    )}>
                      {expense.is_active ? t('recurring.active') : t('recurring.inactive')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    R$ {expense.amount.toFixed(2)} • {getFrequencyLabel(expense.frequency_days)} • {getOwnerName(expense.owner_user)}
                    {expense.category && (
                      <span className="ml-2">
                        • {translateCategoryName(expense.category.name, language)}
                        {expense.subcategory && ` > ${getLocalizedSubcategoryName(expense.subcategory)}`}
                      </span>
                    )}
                  </p>
                  {expense.is_completed ? (
                    <p className="text-xs text-green-600 font-medium">
                      ✅ Gasto recorrente finalizado
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('recurring.next')}: {formatSafeDate(expense.next_due_date)}
                    </p>
                  )}
                  {expense.remaining_installments !== null && expense.total_installments ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium text-primary">
                        📊 {t('recurring.installmentsLabel')}: {expense.remaining_installments} de {expense.total_installments} restantes
                      </p>
                      {expense.remaining_installments > 0 && (
                        <InstallmentProgress 
                          total={expense.total_installments} 
                          remaining={expense.remaining_installments}
                          nextDueDate={expense.next_due_date}
                        />
                      )}
                    </div>
                  ) : expense.contract_duration_months && (
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const startDate = new Date(expense.created_at);
                        const currentDate = new Date();
                        const monthsPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                        const remainingMonths = Math.max(0, expense.contract_duration_months - monthsPassed);
                        return `📅 ${monthsPassed + 1}/${expense.contract_duration_months} • ${t('recurring.remaining')} ${remainingMonths} ${t('recurring.installments')}`;
                      })()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto sm:flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(expense)}
                    className="flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    {expense.is_active ? t('recurring.deactivate') : t('recurring.activate')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(expense)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-700 flex-1 sm:flex-initial"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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