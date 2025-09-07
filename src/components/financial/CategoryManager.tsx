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

  // Use the central translation function
  const translateCategoryName = (name: string): string => {
    return translateCategoryUtil(name, language);
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

  // Helper to deduplicate system tags based on translated names
  const deduplicateSystemTags = (tags: CategoryTag[]): CategoryTag[] => {
    const seen = new Set<string>();
    return tags.filter(tag => {
      const translatedName = getTranslatedTagName(tag, language);
      if (seen.has(translatedName)) {
        return false;
      }
      seen.add(translatedName);
      return true;
    });
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      const income = data?.filter(cat => cat.category_type === "income") || [];
      const expense = data?.filter(cat => cat.category_type === "expense") || [];

      setIncomeCategories(income as Category[]);
      setExpenseCategories(expense as Category[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive",
      });
    }
  };

  const fetchCategoryTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get system tags
      const { data: systemTagsData, error: systemTagsError } = await supabase
        .from("category_tags")
        .select("*");

      if (systemTagsError) throw systemTagsError;

      // Map all system tags to each category (simple fallback)
      const allCategories = [...incomeCategories, ...expenseCategories];
      const tagsByCategory: Record<string, CategoryTag[]> = {};
      allCategories.forEach(cat => {
        tagsByCategory[cat.id] = (systemTagsData as unknown as CategoryTag[]) || [];
      });
      setCategoryTags(tagsByCategory);

    } catch (error) {
      console.error("Error fetching category tags:", error);
    }
  };

  const ensureDefaultCategories = async () => {
    if (hasEnsuredDefaults) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingCategories } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id);

      if (existingCategories && existingCategories.length > 0) {
        setHasEnsuredDefaults(true);
        return;
      }

      const defaultCategories = [
        // Expense categories
        { name: "Alimentação", type: "expense", color: "#ef4444" },
        { name: "Transporte", type: "expense", color: "#f97316" },
        { name: "Saúde", type: "expense", color: "#06b6d4" },
        { name: "Educação", type: "expense", color: "#8b5cf6" },
        { name: "Lazer & Entretenimento", type: "expense", color: "#ec4899" },
        { name: "Vestuário", type: "expense", color: "#84cc16" },
        { name: "Moradia", type: "expense", color: "#6366f1" },
        
        // Income categories
        { name: "Salário", type: "income", color: "#10b981" },
        { name: "Freelance", type: "income", color: "#f59e0b" },
        { name: "Investimentos", type: "income", color: "#3b82f6" },
        { name: "Renda Extra", type: "income", color: "#8b5cf6" },
      ];

      for (const category of defaultCategories) {
        await supabase
          .from("categories")
          .insert({
            name: category.name,
            category_type: category.type,
            color: category.color,
            user_id: user.id,
          });
      }

      setHasEnsuredDefaults(true);
      fetchCategories();
    } catch (error) {
      console.error("Error ensuring default categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCategoryTags();
    ensureDefaultCategories();
  }, []);

  // Refresh system tags mapping once categories are loaded
  useEffect(() => {
    if (incomeCategories.length > 0 || expenseCategories.length > 0) {
      fetchCategoryTags();
    }
  }, [incomeCategories.length, expenseCategories.length]);

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
      if (!user) return;

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: newCategoryName,
            color: newCategoryColor,
            category_type: newCategoryType,
          })
          .eq("id", editingCategory.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({
            name: newCategoryName,
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

      fetchCategories();
      setNewCategoryName("");
      setNewCategoryColor("#6366f1");
      setEditingCategory(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
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
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });

      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
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
                 Adicionar
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
                          {translateCategoryName(category.name)}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTagEditModal({
                          isOpen: true,
                          categoryId: category.id,
                          categoryName: category.name
                        })}
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title={t('tags.title')}
                        aria-label={t('tags.title')}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('tags.suggested')}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {systemTags.length > 0 ? (
                        deduplicateSystemTags(systemTags)
                          .filter(tag => !excludedTagIds.includes(tag.id))
                          .map(tag => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs bg-muted/30 hover:bg-primary/10 border-primary/20 text-primary transition-colors"
                              style={{ borderColor: tag.color + '40', color: tag.color }}
                            >
                              {getTranslatedTagName(tag, language)}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t('tags.loading')}
                        </span>
                      )}
                      
                      {/* User tags */}
                      {userTagsForCategory.map(tag => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs bg-accent/30 hover:bg-primary/10 border-accent/40 text-accent-foreground transition-colors"
                        >
                          {tag.tag_name}
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
            <h2 className="text-2xl font-bold">{t('categories.manage')}</h2>
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
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-input"
                    />
                    <Input
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={newCategoryType} onValueChange={(value: "income" | "expense") => setNewCategoryType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Gasto</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingCategory(null);
                      setNewCategoryName("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Categories List */}
          <div className="space-y-8">
            {renderCategorySection(
              expenseCategories,
              translateCategoryName("Saídas (Gastos)"),
              <ArrowDownCircle className="h-5 w-5 text-destructive" />
            )}
            
            {renderCategorySection(
              incomeCategories,
              translateCategoryName("Entradas (Receitas)"),
              <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
            )}
          </div>
        </Card>
        
        <TagEditModal
          isOpen={tagEditModal.isOpen}
          onClose={() => setTagEditModal({ isOpen: false, categoryId: "", categoryName: "" })}
          categoryId={tagEditModal.categoryId}
          categoryName={tagEditModal.categoryName}
          systemTags={deduplicateSystemTags(categoryTags[tagEditModal.categoryId] || [])}
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