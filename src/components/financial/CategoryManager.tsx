import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, Trash2, Edit, ArrowUpCircle, ArrowDownCircle, HelpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  category_type: "income" | "expense";
  description?: string;
}

interface CategoryTag {
  name_pt: string;
  name_en: string;
  name_es: string;
  color: string;
}

export const CategoryManager = () => {
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [categoryTags, setCategoryTags] = useState<Record<string, CategoryTag[]>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
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
      'account transfer': 'Transferência entre Contas',
      'retirement': 'Aposentadoria',
      'pension': 'Pensão',
      'investment': 'Investimento',
      'dividend': 'Dividendo',
      'bonus': 'Bônus',
      'freelance': 'Freelance',
      'entertainment': 'Entretenimento',
      'shopping': 'Compras',
      'gym': 'Academia',
      'insurance': 'Seguro',
      'taxes': 'Impostos',
      'utilities': 'Utilidades',
      'internet': 'Internet',
      'phone': 'Telefone',
      'streaming': 'Streaming',
      'subscription': 'Assinatura',
      'restaurant': 'Restaurante',
      'groceries': 'Supermercado',
      'pharmacy': 'Farmácia',
      'beauty': 'Beleza',
      'pet': 'Pet',
      'gift': 'Presente',
      'donation': 'Doação',
      'basic bills': 'Contas Básicas',
      'gift or donation': 'Presente ou Doação',
      'refund': 'Reembolso',
      'reimbursement': 'Reembolso',
      'veiculos': 'Veículos',
      'consorcio': 'Consórcio',
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
      'transferencia entre contas': 'Account Transfer',
      'aposentadoria': 'Retirement',
      'pensao': 'Pension',
      'investimento': 'Investment',
      'dividendo': 'Dividend',
      'bonus': 'Bonus',
      'freelance': 'Freelance',
      'entretenimento': 'Entertainment',
      'compras': 'Shopping',
      'academia': 'Gym',
      'seguro': 'Insurance',
      'impostos': 'Taxes',
      'utilidades': 'Utilities',
      'internet': 'Internet',
      'telefone': 'Phone',
      'streaming': 'Streaming',
      'assinatura': 'Subscription',
      'restaurante': 'Restaurant',
      'supermercado': 'Groceries',
      'farmacia': 'Pharmacy',
      'beleza': 'Beauty',
      'pet': 'Pet',
      'presente': 'Gift',
      'doacao': 'Donation',
      'contas basicas': 'Basic Bills',
      'presente ou doacao': 'Gift or Donation',
      'reembolso': 'Refund',
      'veiculos': 'Vehicles',
      'consorcio': 'Consortium',
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
      'transferencia entre contas': 'Transferencia entre Cuentas',
      'account transfer': 'Transferencia entre Cuentas',
      'aposentadoria': 'Jubilación',
      'retirement': 'Jubilación',
      'pensao': 'Pensión',
      'pension': 'Pensión',
      'investimento': 'Inversión',
      'investment': 'Inversión',
      'dividendo': 'Dividendo',
      'dividend': 'Dividendo',
      'bonus': 'Bonificación',
      'freelance': 'Freelance',
      'entretenimento': 'Entretenimiento',
      'entertainment': 'Entretenimiento',
      'compras': 'Compras',
      'shopping': 'Compras',
      'academia': 'Gimnasio',
      'gym': 'Gimnasio',
      'seguro': 'Seguro',
      'insurance': 'Seguro',
      'impostos': 'Impuestos',
      'taxes': 'Impuestos',
      'utilidades': 'Servicios',
      'utilities': 'Servicios',
      'internet': 'Internet',
      'telefone': 'Teléfono',
      'phone': 'Teléfono',
      'streaming': 'Streaming',
      'assinatura': 'Suscripción',
      'subscription': 'Suscripción',
      'restaurante': 'Restaurante',
      'restaurant': 'Restaurante',
      'supermercado': 'Supermercado',
      'groceries': 'Supermercado',
      'farmacia': 'Farmacia',
      'pharmacy': 'Farmacia',
      'beleza': 'Belleza',
      'beauty': 'Belleza',
      'pet': 'Mascota',
      'presente': 'Regalo',
      'gift': 'Regalo',
      'doacao': 'Donación',
      'donation': 'Donación',
      'contas basicas': 'Cuentas Básicas',
      'basic bills': 'Cuentas Básicas',
      'presente ou doacao': 'Regalo o Donación',
      'gift or donation': 'Regalo o Donación',
      'reembolso': 'Reembolso',
      'refund': 'Reembolso',
      'reimbursement': 'Reembolso',
      'veiculos': 'Vehículos',
      'consorcio': 'Consorcio',
    }
  };

  const translateCategoryName = (name: string, lang: 'pt' | 'en' | 'es') => {
    const key = normalize(name);
    const translations = categoryTranslations[lang];
    const translated = translations?.[key];
    
    // Se não encontrou tradução e não é português, retorna o nome original
    if (!translated && lang !== 'pt') {
      return name;
    }
    
    return translated ?? name;
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
      fetchCategoryTags();
    }
  }, [hasEnsuredDefaults]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIncomeCategories([]);
        setExpenseCategories([]);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color, icon, category_type, description, user_id')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      const items = (data || []) as Category[];
      const map = new Map<string, Category>();
      for (const it of items) {
        const key = `${normalize(it.name)}|${it.category_type}`;
        if (!map.has(key)) map.set(key, it);
      }
      
      const uniqueCategories = Array.from(map.values());
      setIncomeCategories(uniqueCategories.filter(cat => cat.category_type === 'income'));
      setExpenseCategories(uniqueCategories.filter(cat => cat.category_type === 'expense'));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  // Create mapping function for custom categories to default categories
  const mapCategoryToDefault = (categoryName: string): string => {
    const normalizedName = normalize(categoryName.toLowerCase());
    
    // Mapping based on keywords and semantic context
    const mappings: { [key: string]: string } = {
      // Health & Fitness
      'academia': 'Saúde',
      'farmacia': 'Saúde', 
      'medico': 'Saúde',
      'hospital': 'Saúde',
      'clinica': 'Saúde',
      'dentista': 'Saúde',
      'saude': 'Saúde',
      
      // Transportation
      'combustivel': 'Transporte',
      'gasolina': 'Transporte',
      'uber': 'Transporte',
      'taxi': 'Transporte',
      'onibus': 'Transporte',
      'metro': 'Transporte',
      'estacionamento': 'Transporte',
      'pedagio': 'Transporte',
      'transporte': 'Transporte',
      
      // Food & Drinks
      'supermercado': 'Alimentação',
      'restaurante': 'Alimentação',
      'lanchonete': 'Alimentação',
      'padaria': 'Alimentação',
      'feira': 'Alimentação',
      'delivery': 'Alimentação',
      'ifood': 'Alimentação',
      'alimentacao': 'Alimentação',
      'comida': 'Alimentação',
      
      // Entertainment
      'cinema': 'Entretenimento',
      'teatro': 'Entretenimento',
      'show': 'Entretenimento',
      'netflix': 'Entretenimento',
      'spotify': 'Entretenimento',
      'jogos': 'Entretenimento',
      'balada': 'Entretenimento',
      'festa': 'Entretenimento',
      
      // Shopping
      'roupas': 'Compras',
      'sapatos': 'Compras',
      'shopping': 'Compras',
      'loja': 'Compras',
      'presente': 'Compras',
      'cosmeticos': 'Compras',
      
      // Education
      'curso': 'Educação',
      'faculdade': 'Educação',
      'escola': 'Educação',
      'livros': 'Educação',
      'educacao': 'Educação',
      
      // Housing
      'aluguel': 'Moradia',
      'condominio': 'Moradia',
      'agua': 'Moradia',
      'luz': 'Moradia',
      'gas': 'Moradia',
      'internet': 'Moradia',
      'limpeza': 'Moradia',
      'manutencao': 'Moradia',
      
      // Personal Care
      'cabelo': 'Cuidados Pessoais',
      'estetica': 'Cuidados Pessoais',
      'massagem': 'Cuidados Pessoais',
      'spa': 'Cuidados Pessoais',
      
      // Pets
      'veterinario': 'Pets',
      'racao': 'Pets',
      'pet': 'Pets',
      'cachorro': 'Pets',
      'gato': 'Pets',
      
      // Technology
      'celular': 'Tecnologia',
      'computador': 'Tecnologia',
      'software': 'Tecnologia',
      'aplicativo': 'Tecnologia',
      
      // Travel
      'viagem': 'Viagem',
      'hotel': 'Viagem',
      'passagem': 'Viagem',
      'turismo': 'Viagem'
    };

    // Try direct mapping first
    if (mappings[normalizedName]) {
      return mappings[normalizedName];
    }

    // Try partial matching for compound names
    for (const [key, value] of Object.entries(mappings)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value;
      }
    }

    // Default fallback
    return 'Outros';
  };

  const fetchCategoryTags = async () => {
    try {
      const { data, error } = await supabase
        .from('category_tags')
        .select(`
          name_pt, name_en, name_es, color,
          category_tag_relations!inner(
            category_id,
            default_categories!inner(name_pt, category_type)
          )
        `)
        .eq('category_tag_relations.is_active', true);

      if (error) throw error;

      const tagsMap: Record<string, CategoryTag[]> = {};
      
      data?.forEach((item: any) => {
        const categoryName = item.category_tag_relations.default_categories.name_pt;
        if (!tagsMap[categoryName]) {
          tagsMap[categoryName] = [];
        }
        tagsMap[categoryName].push({
          name_pt: item.name_pt,
          name_en: item.name_en,
          name_es: item.name_es,
          color: item.color,
        });
      });

      setCategoryTags(tagsMap);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const ensureDefaultCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasEnsuredDefaults(true);
        return;
      }

      // Verificar se o usuário já tem categorias
      const { count, error: countError } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        setHasEnsuredDefaults(true);
        return;
      }

      // Usar a função do banco para criar categorias padrão
      const { error: createError } = await supabase.rpc('create_default_categories_for_user', {
        user_id: user.id,
        user_language: language
      });

      if (createError) throw createError;

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
            description: newCategoryDescription.trim() || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!",
        });
      } else {
        // Create new category with automatic translation
        // Primeiro, tentar obter traduções automáticas se disponíveis
        let finalName = trimmedName;
        
        try {
          const { data: translations } = await supabase.rpc('auto_translate_category_name', {
            input_name: trimmedName,
            from_lang: language
          });
          
          if (translations && translations.length > 0) {
            // Usar a tradução adequada baseada no idioma atual
            const translation = translations[0];
            finalName = language === 'en' ? translation.en_name :
                      language === 'es' ? translation.es_name :
                      translation.pt_name;
          }
        } catch (translationError) {
          // Se falhou a tradução, usar o nome original
          console.log('Translation failed, using original name');
        }

        const { error } = await supabase
          .from('categories')
          .insert({
            name: finalName,
            color: newCategoryColor,
            category_type: newCategoryType,
            description: newCategoryDescription.trim() || null,
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
      setNewCategoryDescription("");
      setNewCategoryColor("#6366f1");
      setNewCategoryType("expense");
      setEditingCategory(null);
      setIsDialogOpen(false);
      fetchCategories();
      fetchCategoryTags();
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
    setNewCategoryDescription(category.description || "");
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
      fetchCategoryTags();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir categoria",
        variant: "destructive",
      });
    }
  };

  // Check if a category is a fixed system category that shouldn't be deleted
  const isFixedCategory = (categoryName: string) => {
    const normalizedName = normalize(categoryName);
    const fixedCategories = [
      'transferencia entre contas',
      'account transfer',
      'transferencia entre cuentas'
    ];
    return fixedCategories.includes(normalizedName);
  };

  const resetForm = () => {
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryColor("#6366f1");
    setNewCategoryType("expense");
    setEditingCategory(null);
  };

  const getTagName = (tag: CategoryTag) => {
    switch (language) {
      case 'en': return tag.name_en;
      case 'es': return tag.name_es;
      default: return tag.name_pt;
    }
  };

  const renderCategorySection = (categories: Category[], title: string, icon: React.ReactNode, isExpense: boolean = false) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">({categories.length})</span>
      </div>
      
      <div className="space-y-3">
        {categories.map((category) => {
          // Map custom category to default category to get correct tags
          const defaultCategoryName = isExpense ? mapCategoryToDefault(category.name) : '';
          const tags = isExpense ? categoryTags[defaultCategoryName] || [] : [];
          return (
            <Card key={category.id} className="p-4 hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: category.color || "#6366f1" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-5 h-5 rounded-full border-2 shadow-sm"
                      style={{ 
                        backgroundColor: category.color + '20' || "#6366f120",
                        borderColor: category.color || "#6366f1"
                      }}
                    />
                    <h4 className="font-semibold text-foreground text-lg">
                      {translateCategoryName(category.name, language)}
                    </h4>
                  </div>
                  
                  {category.description && (
                    <p className="text-sm text-muted-foreground mb-3 ml-8">{category.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!isFixedCategory(category.name) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Tags Section - Prominent horizontal display for expense categories */}
              {isExpense && tags.length > 0 && (
                <div className="ml-8 mt-2 pt-3 border-t border-border/30">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className="text-xs px-3 py-1.5 font-medium rounded-full transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: tag.color + '10',
                          borderColor: tag.color + '40',
                          color: tag.color,
                          borderWidth: '1.5px'
                        }}
                      >
                        {getTagName(tag)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        
        {categories.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {isExpense ? 'Nenhuma categoria de gasto encontrada' : 'Nenhuma categoria de entrada encontrada'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="categoryDescription">{t('categories.description')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('categories.descriptionTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="categoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder={t('categories.descriptionPlaceholder')}
                    rows={3}
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

        {/* Seção de Saídas (Expenses) */}
        {renderCategorySection(
          expenseCategories,
          "📤 Saídas (Gastos)",
          <ArrowUpCircle className="h-5 w-5 text-destructive" />,
          true
        )}

        {/* Seção de Entradas (Income) */}
        {renderCategorySection(
          incomeCategories,
          "📥 Entradas (Receitas)",
          <ArrowDownCircle className="h-5 w-5 text-primary" />,
          false
        )}
      </Card>
    </div>
  );
};