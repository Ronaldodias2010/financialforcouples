import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserCategoryTags } from "@/hooks/useUserCategoryTags";
import { getTranslatedTagName, sortTagsByTranslatedName } from "@/utils/userTagTranslation";
import { translateCategoryName as translateCategoryUtil } from "@/utils/categoryTranslation";
import { TagInput } from "@/components/ui/TagInput";
import { TagEditModal } from "./TagEditModal";
import { Plus, Trash2, Edit, ArrowUpCircle, ArrowDownCircle, HelpCircle, Tag, X, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  category_type: "income" | "expense";
  description?: string;
}

interface CategoryTag {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  color: string;
}

const CategoryManagerContent = () => {
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [categoryTags, setCategoryTags] = useState<Record<string, CategoryTag[]>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tagEditModal, setTagEditModal] = useState<{ isOpen: boolean; categoryId: string; categoryName: string }>({
    isOpen: false,
    categoryId: "",
    categoryName: ""
  });
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { 
    userTags, 
    excludedSystemTags, 
    addUserTag, 
    removeUserTag, 
    excludeSystemTag, 
    restoreSystemTag, 
    getUserTagsForCategory,
    refetch: refetchUserTags
  } = useUserCategoryTags();
  const [hasEnsuredDefaults, setHasEnsuredDefaults] = useState(false);

  const translateCategoryName = (name: string, language: string): string => {
    const normalizedName = name.toLowerCase().trim();
    
    const translations: Record<string, Record<string, string>> = {
      en: {
        'alimentacao': 'Food',
        'food': 'Food',
        'combustivel': 'Fuel',
        'fuel': 'Fuel',
        'saude': 'Health',
        'health': 'Health',
        'educacao': 'Education',
        'education': 'Education',
        'vestuario': 'Clothing',
        'clothing': 'Clothing',
        'viagem': 'Travel',
        'travel': 'Travel',
        'transporte': 'Transportation',
        'transport': 'Transportation',
        'moradia': 'Housing',
        'housing': 'Housing',
        'salario': 'Salary',
        'salary': 'Salary',
        'comissao': 'Commission',
        'commission': 'Commission',
        'renda extra': 'Extra Income',
        'extra income': 'Extra Income',
        'pagamento de cartao de credito': 'Credit Card Payment',
        'credit card payment': 'Credit Card Payment',
        'transferencia': 'Transfer',
        'transfer': 'Transfer',
        'transferencia entre contas': 'Account Transfer',
        'account transfer': 'Account Transfer',
        'aposentadoria': 'Retirement',
        'retirement': 'Retirement',
        'pensao': 'Pension',
        'pension': 'Pension',
        'investimento': 'Investment',
        'investment': 'Investment',
        'rendimento de investimento': 'Investment Return',
        'investment return': 'Investment Return',
        'bonus': 'Bonus',
        'premios': 'Awards',
        'awards': 'Awards',
        'vendas': 'Sales',
        'sales': 'Sales',
        'aluguel recebido': 'Rent Received',
        'rent received': 'Rent Received',
        'dividendos': 'Dividends',
        'dividends': 'Dividends',
        'freelance': 'Freelance',
        'servicos prestados': 'Services Provided',
        'services provided': 'Services Provided',
        'restituicao de imposto': 'Tax Refund',
        'tax refund': 'Tax Refund',
        'receita extraordinaria': 'Extraordinary Income',
        'extraordinary income': 'Extraordinary Income',
        'entretenimento': 'Entertainment',
        'entertainment': 'Entertainment',
        'lazer': 'Leisure',
        'leisure': 'Leisure',
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
        'saidas_gastos': 'Expenses (Outgoing)',
        'saidas': 'Expenses',
        'gastos': 'Expenses',
        'compras_pessoais': 'Personal Shopping',
        'doacoes_presentes': 'Donations & Gifts',
        'familia_filhos': 'Family & Children',
        'lazer_entretenimento': 'Leisure & Entertainment',
        'outros': 'Others',
        'trabalho_negocios': 'Work & Business',
        'entradas_receitas': 'Income (Revenue)',
        'entradas': 'Income',
        'receitas': 'Revenue',
        'financas_servicos': 'Finance & Services',
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
        'rendimento de investimento': 'Retorno de Inversión',
        'investment return': 'Retorno de Inversión',
        'bonus': 'Bono',
        'premios': 'Premios',
        'awards': 'Premios',
        'vendas': 'Ventas',
        'sales': 'Ventas',
        'aluguel recebido': 'Alquiler Recibido',
        'rent received': 'Alquiler Recibido',
        'dividendos': 'Dividendos',
        'dividends': 'Dividendos',
        'freelance': 'Freelance',
        'servicos prestados': 'Servicios Prestados',
        'services provided': 'Servicios Prestados',
        'restituicao de imposto': 'Devolución de Impuestos',
        'tax refund': 'Devolución de Impuestos',
        'receita extraordinaria': 'Ingresos Extraordinarios',
        'extraordinary income': 'Ingresos Extraordinarios',
        'entretenimento': 'Entretenimiento',
        'entertainment': 'Entretenimiento',
        'lazer': 'Ocio',
        'leisure': 'Ocio',
        'supermercado': 'Supermercado',
        'farmacia': 'Farmacia',
        'beleza': 'Belleza',
        'pet': 'Mascota',
        'presente': 'Regalo',
        'doacao': 'Donación',
        'contas basicas': 'Cuentas Básicas',
        'presente ou doacao': 'Regalo o Donación',
        'reembolso': 'Reembolso',
        'veiculos': 'Vehículos',
        'consorcio': 'Consorcio',
        'saidas_gastos': 'Gastos (Salidas)',
        'saidas': 'Gastos',
        'gastos': 'Gastos',
        'compras_pessoais': 'Compras Personales',
        'doacoes_presentes': 'Donaciones y Regalos',
        'familia_filhos': 'Familia e Hijos',
        'lazer_entretenimento': 'Ocio y Entretenimiento',
        'outros': 'Otros',
        'trabalho_negocios': 'Trabajo y Negocios',
        'entradas_receitas': 'Ingresos (Recetas)',
        'entradas': 'Ingresos',
        'receitas': 'Recetas',
        'financas_servicos': 'Finanzas y Servicios',
      }
    };

    const languageTranslations = translations[language];
    if (languageTranslations && languageTranslations[normalizedName]) {
      return languageTranslations[normalizedName];
    }

    return name;
  };

  const getTranslatedTagName = (tag: CategoryTag, lang?: string): string => {
    const targetLang = lang || language;
    switch (targetLang) {
      case 'en':
        return tag.name_en || tag.name_pt;
      case 'es':
        return tag.name_es || tag.name_pt;
      default:
        return tag.name_pt;
    }
  };

  useEffect(() => {
    ensureDefaultCategories();
  }, []);

  useEffect(() => {
    if (hasEnsuredDefaults) {
      fetchCategories();
      fetchCategoryTags();
    }
  }, [hasEnsuredDefaults]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      const income = data?.filter(cat => cat.category_type === 'income') || [];
      const expense = data?.filter(cat => cat.category_type === 'expense') || [];

      setIncomeCategories(income as Category[]);
      setExpenseCategories(expense as Category[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const fetchCategoryTags = async () => {
    try {
      console.log('🏷️ Fetching category tags...');
      
      // Fetch all system tags by matching default category names to user categories
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user categories to match with default categories
      const { data: userCategories } = await supabase
        .from('categories')
        .select('id, name, default_category_id')
        .eq('user_id', user.id);

      if (!userCategories) return;

      // Fetch category tag relations through default categories
      const { data: systemTagsData, error: systemError } = await supabase
        .from('category_tag_relations')
        .select(`
          category_id,
          category_tags!inner (
            id,
            name_pt,
            name_en,
            name_es,
            color
          )
        `)
        .eq('is_active', true);

      if (systemError) {
        console.error('Error fetching system category tags:', systemError);
        return;
      }

      const tagsMap: Record<string, CategoryTag[]> = {};
      
      // Map system tags to user categories through default_category_id
      if (systemTagsData && userCategories) {
        systemTagsData.forEach((relation: any) => {
          const defaultCategoryId = relation.category_id;
          const tag = relation.category_tags;
          
          // Find user categories that match this default category
          const matchingUserCategories = userCategories.filter(
            uc => uc.default_category_id === defaultCategoryId
          );
          
          matchingUserCategories.forEach(userCat => {
            if (!tagsMap[userCat.id]) {
              tagsMap[userCat.id] = [];
            }
            
            tagsMap[userCat.id].push({
              id: tag.id,
              name_pt: tag.name_pt,
              name_en: tag.name_en,
              name_es: tag.name_es,
              color: tag.color
            });
          });
        });
      }

      // Add user-created tags
      if (userTags) {
        Object.values(userTags).flat().forEach(userTag => {
          const categoryId = userTag.category_id;
          const tag: CategoryTag = {
            id: userTag.id,
            name_pt: userTag.tag_name,
            name_en: userTag.tag_name_en || userTag.tag_name,
            name_es: userTag.tag_name_es || userTag.tag_name,
            color: userTag.color
          };
          
          if (!tagsMap[categoryId]) {
            tagsMap[categoryId] = [];
          }
          tagsMap[categoryId].push(tag);
        });
      }

      console.log('🏷️ Tags map created:', tagsMap);
      setCategoryTags(tagsMap);
    } catch (error) {
      console.error('Error in fetchCategoryTags:', error);
    }
  };

  const ensureDefaultCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasEnsuredDefaults(true);
        return;
      }

      // Check if user already has categories
      const { count, error: countError } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        setHasEnsuredDefaults(true);
        return;
      }

      // Use database function to create default categories
      const { error: createError } = await supabase.rpc('create_default_categories_for_user', {
        p_user_id: user.id,
        user_language: language || 'pt'
      });

      if (createError) throw createError;
      setHasEnsuredDefaults(true);
    } catch (error) {
      console.error('Error ensuring default categories:', error);
      setHasEnsuredDefaults(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: newCategoryName.trim(),
            color: newCategoryColor,
            category_type: newCategoryType,
          })
          .eq('id', editingCategory.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: newCategoryName.trim(),
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

      setNewCategoryName("");
      setNewCategoryColor("#6366f1");
      setNewCategoryType("expense");
      setEditingCategory(null);
      setIsDialogOpen(false);
      fetchCategories();
      fetchCategoryTags();
    } catch (error: any) {
      console.error('Error saving category:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso!",
      });

      fetchCategories();
      fetchCategoryTags();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro", 
        description: error.message || "Erro ao remover categoria",
        variant: "destructive",
      });
    }
  };

  const renderCategorySection = (categories: Category[], title: string, icon: React.ReactNode) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
               <Button variant="outline" size="sm" onClick={() => {
                 setEditingCategory(null);
                 setNewCategoryName("");
                 setNewCategoryColor("#6366f1");
                 setNewCategoryType(title.includes('Entradas') ? 'income' : 'expense');
               }}>
                 <Plus className="h-4 w-4 mr-2" />
                 Adicionar Categoria
               </Button>
            </DialogTrigger>
          </Dialog>
        </div>
        
        <div className="grid gap-4">
          {categories.map((category) => {
            const systemTags = categoryTags[category.id] || [];
            const userTagsForCategory = getUserTagsForCategory(category.id);
            const excludedTagIds = excludedSystemTags[category.id] || [];

            return (
              <Card key={category.id} className="border border-border/50 hover:border-border transition-colors">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {translateCategoryName(category.name, language)}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                     <div className="flex items-center gap-1">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setTagEditModal({
                           isOpen: true,
                           categoryId: category.id,
                           categoryName: translateCategoryName(category.name, language)
                         })}
                         className="h-8 w-8 p-0 hover:bg-muted"
                         title="Editar tags"
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDelete(category.id)}
                         className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                  </div>

                  {/* Tags Section - Aparentes e Simples */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tags Sugeridas</span>
                    </div>
                    
                     <div className="flex flex-wrap gap-2">
                       {systemTags.length > 0 ? (
                         systemTags.filter(tag => !excludedTagIds.includes(tag.id)).map(tag => (
                           <Badge
                             key={tag.id}
                             variant="outline"
                             className="text-xs bg-muted/30 hover:bg-primary/10 border-primary/20 text-primary transition-colors"
                            style={{ borderColor: tag.color + '40', color: tag.color }}
                          >
                             {getTranslatedTagName(tag as any, language).toLowerCase()}
                           </Badge>
                         ))
                       ) : (
                         <span className="text-xs text-muted-foreground italic">
                           Carregando tags para esta categoria...
                         </span>
                       )}
                       
                       {/* User tags with distinctive styling */}
                       {userTagsForCategory.map(tag => (
                         <Badge
                           key={tag.id}
                           variant="outline"
                           className="text-xs bg-accent/30 hover:bg-primary/10 border-accent/40 text-accent-foreground transition-colors"
                         >
                          {getTranslatedTagName({
                            id: tag.id,
                            name_pt: tag.tag_name,
                            name_en: tag.tag_name_en || tag.tag_name,
                            name_es: tag.tag_name_es || tag.tag_name,
                            color: tag.color
                          }, language)}
                          <X className="h-3 w-3 ml-1 cursor-pointer" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          </div>
          
          {/* Dialog for adding/editing categories */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? "Modifique os dados da categoria existente"
                    : "Crie uma nova categoria para organizar suas transações"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Categoria</Label>
                  <Input
                    id="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Alimentação, Transporte..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={newCategoryType} onValueChange={(value: "income" | "expense") => setNewCategoryType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa (Saída)</SelectItem>
                      <SelectItem value="income">Receita (Entrada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                  />
                </div>

                {/* Tag Input integrado no formulário */}
                {!editingCategory && (
                  <div className="space-y-2">
                    <Label>Tags Personalizadas (Opcional)</Label>
                    <TagInput
                      tags={[]}
                      onAddTag={async (tagName: string) => true}
                      onRemoveTag={() => {}}
                      placeholder="Adicione tags para esta categoria..."
                      maxTags={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tags serão adicionadas automaticamente baseadas no tipo de categoria
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCategory ? "Atualizar Categoria" : "Criar Categoria"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Seção de Saídas (Expenses) */}
          {renderCategorySection(
            expenseCategories,
            `📤 ${translateCategoryUtil('Saídas (Gastos)', language)}`,
            <ArrowUpCircle className="h-5 w-5 text-destructive" />
          )}

          {/* Seção de Entradas (Income) */}
          {renderCategorySection(
            incomeCategories,
            `📥 ${translateCategoryUtil('Entradas (Receitas)', language)}`,
            <ArrowDownCircle className="h-5 w-5 text-primary" />
           )}
         </Card>

         <TagEditModal
           isOpen={tagEditModal.isOpen}
           onClose={() => setTagEditModal({ isOpen: false, categoryId: "", categoryName: "" })}
           categoryId={tagEditModal.categoryId}
           categoryName={tagEditModal.categoryName}
           systemTags={categoryTags[tagEditModal.categoryId] || []}
           excludedTagIds={excludedSystemTags[tagEditModal.categoryId] || []}
           onExcludeSystemTag={excludeSystemTag}
           onRestoreSystemTag={restoreSystemTag}
         />
       </div>
     </TooltipProvider>
   );
 };

// Create a small QueryClient for CategoryManager if not in a QueryClientProvider context
const categoryQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const CategoryManager = () => {
  return (
    <QueryClientProvider client={categoryQueryClient}>
      <CategoryManagerContent />
    </QueryClientProvider>
  );
};