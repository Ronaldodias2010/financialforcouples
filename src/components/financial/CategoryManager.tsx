import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, Trash2, Edit } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  category_type: "income" | "expense";
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [hasEnsuredDefaults, setHasEnsuredDefaults] = useState(false);

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const categoryTranslations: Record<string, Record<string, string>> = {
    pt: {
      'food': 'Alimentação',
      'fuel': 'Combustível', 
      'health': 'Saúde',
      'education': 'Educação',
      'clothing': 'Vestuário',
      'travel': 'Viagem',
      'transport': 'Transporte',
      'housing': 'Moradia',
      'salary': 'Salário',
      'commission': 'Comissão',
      'extra income': 'Renda Extra',
      'credit card payment': 'Pagamento de Cartão de Crédito',
      'transfer': 'Transferência',
    },
    en: {
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
    },
    es: {
      'alimentacao': 'Comida',
      'food': 'Comida',
      'combustivel': 'Combustible',
      'fuel': 'Combustible',
      'saude': 'Salud',
      'health': 'Salud',
      'educacao': 'Educación',
      'education': 'Educación',
      'vestuario': 'Ropa',
      'clothing': 'Ropa',
      'viagem': 'Viaje',
      'travel': 'Viaje',
      'transporte': 'Transporte',
      'transport': 'Transporte',
      'moradia': 'Vivienda',
      'housing': 'Vivienda',
      'salario': 'Salario',
      'salary': 'Salario',
      'comissao': 'Comisión',
      'commission': 'Comisión',
      'renda extra': 'Ingresos Extra',
      'extra income': 'Ingresos Extra',
      'pagamento de cartao de credito': 'Pago de Tarjeta de Crédito',
      'credit card payment': 'Pago de Tarjeta de Crédito',
      'transferencia': 'Transferencia',
      'transfer': 'Transferencia',
    }
  };

  const translateCategoryName = (name: string, lang: 'pt' | 'en' | 'es') => {
    const key = normalize(name);
    const translations = categoryTranslations[lang];
    return translations?.[key] ?? name;
  };

  useEffect(() => {
    const init = async () => {
      await ensureDefaultCategories();
    };
    init();
  }, [language]);

  useEffect(() => {
    if (hasEnsuredDefaults) {
      fetchCategories();
    }
  }, [filterType, hasEnsuredDefaults]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCategories([]);
        return;
      }

      let query = supabase
        .from('categories')
        .select('id, name, color, icon, category_type, user_id')
        .eq('user_id', user.id)
        .order('name');
      
      if (filterType !== 'all') {
        query = query.eq('category_type', filterType);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      const items = (data || []) as Category[];
      const map = new Map<string, Category>();
      for (const it of items) {
        const key = `${normalize(it.name)}|${it.category_type}`;
        if (!map.has(key)) map.set(key, it);
      }
      setCategories(Array.from(map.values()));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const ensureDefaultCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasEnsuredDefaults(true);
        return;
      }

      const { count, error: countError } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        setHasEnsuredDefaults(true);
        return;
      }

      const expensePt = [
        'Alimentação',
        'Combustível',
        'Saúde',
        'Educação',
        'Vestuário',
        'Viagem',
        'Transporte',
        'Moradia',
      ];
      const incomePt = ['Salário', 'Comissão', 'Renda Extra'];

      const expenseEn = [
        'Food',
        'Fuel',
        'Health',
        'Education',
        'Clothing',
        'Travel',
        'Transport',
        'Housing',
      ];
      const incomeEn = ['Salary', 'Commission', 'Extra Income'];

      const expense = language === 'en' ? expenseEn : expensePt;
      const income = language === 'en' ? incomeEn : incomePt;

      const payload = [
        ...expense.map((name) => ({
          name,
          color: '#6366f1',
          category_type: 'expense',
          owner_user: 'user1',
          user_id: user.id,
        })),
        ...income.map((name) => ({
          name,
          color: '#6366f1',
          category_type: 'income',
          owner_user: 'user1',
          user_id: user.id,
        })),
      ];

      const { error: insertError } = await supabase.from('categories').insert(payload);
      if (insertError) throw insertError;

      toast({
        title: language === 'en' ? 'Categories added' : 'Categorias adicionadas',
        description:
          language === 'en'
            ? 'Default categories were created for you.'
            : 'Categorias padrão foram criadas para você.',
      });
    } catch (error) {
      // Silent failure to avoid blocking UI; categories can still be created manually
    } finally {
      setHasEnsuredDefaults(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.replace(/\s+/g, ' ').trim();
    if (!trimmedName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Se estamos editando e apenas mudando cor/tipo (nome igual), pular validação de duplicata
      const isOnlyColorOrTypeChange = editingCategory && 
        normalize(trimmedName) === normalize(editingCategory.name);

      if (!isOnlyColorOrTypeChange) {
        // Load existing categories for duplicate check (same user and type)
        const { data: existingList } = await supabase
          .from('categories')
          .select('id, name, category_type')
          .eq('user_id', user.id)
          .eq('category_type', newCategoryType);

        const exists = (existingList || []).some((c) => 
          normalize(c.name) === normalize(trimmedName) && 
          (!editingCategory || c.id !== editingCategory.id)
        );

        if (exists) {
          toast({
            title: t('attention'),
            description: t('categoryExists'),
            variant: "default",
          });
          return;
        }
      }

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: trimmedName,
            color: newCategoryColor,
            category_type: newCategoryType,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!",
        });
      } else {
        // Create new category (owner_user left default; categories are per user)
        const { error } = await supabase
          .from('categories')
          .insert({
            name: trimmedName,
            color: newCategoryColor,
            category_type: newCategoryType,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso!",
        });
      }

      // Reset form and refresh list
      setNewCategoryName("");
      setNewCategoryColor("#6366f1");
      setNewCategoryType("expense");
      setEditingCategory(null);
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color || "#6366f1");
    setNewCategoryType(category.category_type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir categoria",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewCategoryName("");
    setNewCategoryColor("#6366f1");
    setNewCategoryType("expense");
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
        <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "income" | "expense")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('categories.filter.all')}</SelectItem>
            <SelectItem value="income">{t('categories.filter.income')}</SelectItem>
            <SelectItem value="expense">{t('categories.filter.expense')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{t('categories.heading')}</h3>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('categories.add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? t('categories.edit') : t('categories.add')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">{t('categories.name')}</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t('categories.placeholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoryColor">{t('categories.color')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="categoryColor"
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category-type">{t('categories.type')}</Label>
                  <Select value={newCategoryType} onValueChange={(value) => setNewCategoryType(value as "income" | "expense")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">{t('categories.type.expense')}</SelectItem>
                      <SelectItem value="income">{t('categories.type.income')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCategory ? t('categories.update') : t('categories.create')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('categories.none')}
            </p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: category.color || "#6366f1" }}
                  />
                  <span className="font-medium">{translateCategoryName(category.name, language as 'pt' | 'en' | 'es')}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted">
                    {category.category_type === 'income' ? t('categories.type.income') : t('categories.type.expense')}
                  </span>
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};