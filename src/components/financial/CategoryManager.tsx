import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserCategoryTags } from "@/hooks/useUserCategoryTags";
import { TagInput } from "@/components/ui/TagInput";
import { Plus, Trash2, Edit, ArrowUpCircle, ArrowDownCircle, HelpCircle, Merge, Loader2 } from "lucide-react";
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
  id: string;
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
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [consolidationSuggestions, setConsolidationSuggestions] = useState<{parent: Category, children: Category[]}[]>([]);
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { 
    userTags, 
    excludedSystemTags, 
    addUserTag, 
    removeUserTag, 
    excludeSystemTag, 
    restoreSystemTag, 
    getUserTagsForCategory 
  } = useUserCategoryTags();
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
        .select(`
          id, name, color, icon, category_type, description, user_id, default_category_id,
          default_categories(name_pt)
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      const items = (data || []) as Category[];
      
      // Filter out consolidated child categories (those that should now be tags)
      const consolidatedNames = ['restaurante', 'supermercado', 'academia'];
      const filteredItems = items.filter(item => {
        const normalizedName = normalize(item.name);
        return !consolidatedNames.includes(normalizedName);
      });
      
      const map = new Map<string, Category>();
      for (const it of filteredItems) {
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

  // Enhanced mapping function for custom categories to default categories
  const mapCategoryToDefault = (categoryName: string): string => {
    const normalizedName = normalize(categoryName.toLowerCase());
    
    // Enhanced mapping with more comprehensive coverage
    const mappings: { [key: string]: string } = {
      // Saúde
      'academia': 'Saúde',
      'farmacia': 'Saúde', 
      'médico': 'Saúde',
      'medico': 'Saúde',
      'hospital': 'Saúde',
      'clinica': 'Saúde',
      'clínica': 'Saúde',
      'dentista': 'Saúde',
      'saude': 'Saúde',
      'saúde': 'Saúde',
      'consulta': 'Saúde',
      'exame': 'Saúde',
      'medicamento': 'Saúde',
      'plano de saude': 'Saúde',
      'plano de saúde': 'Saúde',
      'fisioterapia': 'Saúde',
      'psicologo': 'Saúde',
      'psicólogo': 'Saúde',
      'terapia': 'Saúde',

      // Transporte  
      'combustivel': 'Transporte',
      'combustível': 'Transporte',
      'gasolina': 'Transporte',
      'uber': 'Transporte',
      'uber/99': 'Transporte',
      'taxi': 'Transporte',
      'táxi': 'Transporte',
      'onibus': 'Transporte',
      'ônibus': 'Transporte',
      'metro': 'Transporte',
      'metrô': 'Transporte',
      'estacionamento': 'Transporte',
      'pedagio': 'Transporte',
      'pedágio': 'Transporte',
      'transporte': 'Transporte',
      'carro': 'Transporte',
      'moto': 'Transporte',
      'bicicleta': 'Transporte',
      'manutencao do carro': 'Transporte',
      'manutenção veículo': 'Transporte',
      'veiculos': 'Transporte',
      'veículos': 'Transporte',

      // Alimentação
      'supermercado': 'Alimentação',
      'restaurante': 'Alimentação',
      'lanchonete': 'Alimentação',
      'padaria': 'Alimentação',
      'feira': 'Alimentação',
      'delivery': 'Alimentação',
      'ifood': 'Alimentação',
      'alimentacao': 'Alimentação',
      'alimentação': 'Alimentação',
      'comida': 'Alimentação',
      'mercado': 'Alimentação',
      'acougue': 'Alimentação',
      'açougue': 'Alimentação',
      'hortifruti': 'Alimentação',
      'cafe': 'Alimentação',
      'café': 'Alimentação',
      'lanche': 'Alimentação',
      'jantar': 'Alimentação',
      'almoco': 'Alimentação',
      'almoço': 'Alimentação',
      'fast food': 'Alimentação',

      // Lazer & Entretenimento
      'cinema': 'Lazer & Entretenimento',
      'teatro': 'Lazer & Entretenimento',
      'show': 'Lazer & Entretenimento',
      'shows': 'Lazer & Entretenimento',
      'netflix': 'Lazer & Entretenimento',
      'spotify': 'Lazer & Entretenimento',
      'jogos': 'Lazer & Entretenimento',
      'balada': 'Lazer & Entretenimento',
      'festa entretenimento': 'Lazer & Entretenimento',
      'parque': 'Lazer & Entretenimento',
      'museu': 'Lazer & Entretenimento',
      'bar': 'Lazer & Entretenimento',
      'pub': 'Lazer & Entretenimento',
      'diversao': 'Lazer & Entretenimento',
      'diversão': 'Lazer & Entretenimento',
      'lazer': 'Lazer & Entretenimento',
      'streaming': 'Lazer & Entretenimento',
      'viagem': 'Lazer & Entretenimento',
      'hotel': 'Lazer & Entretenimento',
      'passagem': 'Lazer & Entretenimento',
      'turismo': 'Lazer & Entretenimento',
      'hospedagem': 'Lazer & Entretenimento',
      'aviao': 'Lazer & Entretenimento',
      'avião': 'Lazer & Entretenimento',
      'onibus viagem': 'Lazer & Entretenimento',
      'ônibus viagem': 'Lazer & Entretenimento',
      'excursao': 'Lazer & Entretenimento',
      'excursão': 'Lazer & Entretenimento',

      // Compras Pessoais
      'roupas': 'Compras Pessoais',
      'sapatos': 'Compras Pessoais',
      'calcados': 'Compras Pessoais',
      'calçados': 'Compras Pessoais',
      'shopping': 'Compras Pessoais',
      'loja': 'Compras Pessoais',
      'cosmeticos': 'Compras Pessoais',
      'cosméticos': 'Compras Pessoais',
      'perfume': 'Compras Pessoais',
      'maquiagem': 'Compras Pessoais',
      'acessorios': 'Compras Pessoais',
      'acessórios': 'Compras Pessoais',
      'eletronicos': 'Compras Pessoais',
      'eletrônicos': 'Compras Pessoais',
      'vestuario': 'Compras Pessoais',
      'vestuário': 'Compras Pessoais',

      // Educação
      'curso': 'Educação',
      'faculdade': 'Educação',
      'escola': 'Educação',
      'livros': 'Educação',
      'educacao': 'Educação',
      'educação': 'Educação',
      'universidade': 'Educação',
      'pos graduacao': 'Educação',
      'pós graduação': 'Educação',
      'mestrado': 'Educação',
      'doutorado': 'Educação',
      'material escolar': 'Educação',
      'treinamentos': 'Educação',
      'palestras': 'Educação',
      'curso online': 'Educação',

      // Moradia
      'aluguel': 'Moradia',
      'condominio': 'Moradia', 
      'condomínio': 'Moradia', 
      'agua': 'Moradia',
      'água': 'Moradia',
      'luz': 'Moradia',
      'gas': 'Moradia',
      'gás': 'Moradia',
      'internet': 'Moradia',
      'limpeza': 'Moradia',
      'manutencao': 'Moradia',
      'manutenção': 'Moradia',
      'energia': 'Moradia',
      'telefone': 'Moradia',
      'telefone fixo': 'Moradia',
      'tv': 'Moradia',
      'móveis': 'Moradia',
      'moveis': 'Moradia',
      'eletrodomesticos': 'Moradia',
      'eletrodomésticos': 'Moradia',

      // Família & Filhos  
      'creche': 'Família & Filhos',
      'brinquedos': 'Família & Filhos',
      'roupas infantis': 'Família & Filhos',
      'mesada': 'Família & Filhos',
      'cuidados': 'Família & Filhos',
      'família': 'Família & Filhos',
      'filhos': 'Família & Filhos',

      // Finanças & Serviços
      'taxas bancarias': 'Finanças & Serviços',
      'taxas bancárias': 'Finanças & Serviços',
      'seguros': 'Finanças & Serviços',
      'seguro': 'Finanças & Serviços',
      'investimentos': 'Finanças & Serviços',
      'investimento': 'Finanças & Serviços',
      'impostos': 'Finanças & Serviços',
      'mensalidades': 'Finanças & Serviços',
      'assinatura': 'Finanças & Serviços',
      'assinatura de serviços': 'Finanças & Serviços',
      'banco': 'Finanças & Serviços',
      'taxa': 'Finanças & Serviços',

      // Trabalho & Negócios
      'coworking': 'Trabalho & Negócios',
      'software': 'Trabalho & Negócios',
      'equipamentos': 'Trabalho & Negócios',
      'viagens de trabalho': 'Trabalho & Negócios',
      'marketing': 'Trabalho & Negócios',
      'impostos pj': 'Trabalho & Negócios',
      'negocios': 'Trabalho & Negócios',
      'negócios': 'Trabalho & Negócios',
      'trabalho': 'Trabalho & Negócios',
      'pj': 'Trabalho & Negócios',
      'empresa': 'Trabalho & Negócios',

      // Doações & Presentes
      'doacao': 'Doações & Presentes',
      'doações': 'Doações & Presentes',
      'presente': 'Doações & Presentes',
      'presentes': 'Doações & Presentes',
      'caridade': 'Doações & Presentes',
      'casamento': 'Doações & Presentes',
      'casamentos': 'Doações & Presentes',
      'aniversario': 'Doações & Presentes',
      'aniversário': 'Doações & Presentes',

      // Outros (fallback explícitos)
      'pet': 'Outros',
      'pets': 'Outros',
      'utilidades': 'Moradia',
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

  // Analyze categories for consolidation opportunities
  const analyzeConsolidationOpportunities = () => {
    const suggestions: {parent: Category, children: Category[]}[] = [];
    const processedCategories = new Set<string>();
    
    // Group categories by their mapped default category
    const groupedCategories = new Map<string, Category[]>();
    
    expenseCategories.forEach(category => {
      const defaultCategory = mapCategoryToDefault(category.name);
      if (!groupedCategories.has(defaultCategory)) {
        groupedCategories.set(defaultCategory, []);
      }
      groupedCategories.get(defaultCategory)!.push(category);
    });
    
    // Find groups with multiple categories that can be consolidated
    groupedCategories.forEach((categories, defaultCategory) => {
      if (categories.length > 1) {
        // Find the most general category as parent (shortest name or most common)
        const sortedByGenerality = [...categories].sort((a, b) => a.name.length - b.name.length);
        const parent = sortedByGenerality[0];
        const children = sortedByGenerality.slice(1);
        
        if (children.length > 0) {
          suggestions.push({ parent, children });
        }
      }
    });
    
    setConsolidationSuggestions(suggestions);
  };

  // Consolidate categories by moving transactions and merging
  const consolidateCategories = async (parent: Category, children: Category[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Move all transactions from children to parent category
      for (const child of children) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category_id: parent.id })
          .eq('category_id', child.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Also update future expenses if they reference the child category
        await supabase
          .from('manual_future_expenses')
          .update({ category_id: parent.id })
          .eq('category_id', child.id)
          .eq('user_id', user.id);

        // Delete the child category
        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .eq('id', child.id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Consolidação realizada",
        description: `${children.length} categorias foram consolidadas em "${parent.name}"`,
      });

      // Refresh data
      fetchCategories();
      analyzeConsolidationOpportunities();
      
    } catch (error: any) {
      toast({
        title: "Erro na consolidação",
        description: error.message || "Erro ao consolidar categorias",
        variant: "destructive",
      });
    }
  };

  const fetchCategoryTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar tags do sistema através das categorias de usuário com default_category_id
      const { data: userCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, default_category_id')
        .eq('category_type', 'expense')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      const tagsMap: Record<string, CategoryTag[]> = {};

      // Para cada categoria de usuário que tem default_category_id, buscar suas tags
      for (const userCategory of userCategories || []) {
        if (userCategory.default_category_id) {
          const { data: tagRelations, error: tagsError } = await supabase
            .from('category_tag_relations')
            .select(`
              category_tags!category_tag_relations_tag_id_fkey(id, name_pt, name_en, name_es, color)
            `)
            .eq('category_id', userCategory.default_category_id)
            .eq('is_active', true);

          if (!tagsError && tagRelations) {
            tagsMap[userCategory.id] = tagRelations
              .map(relation => relation.category_tags)
              .filter(tag => tag)
              .map(tag => ({
                id: tag.id,
                name_pt: tag.name_pt,
                name_en: tag.name_en,
                name_es: tag.name_es,
                color: tag.color,
              }));
          }
        }
      }

      console.log('Tags mapeadas por ID de categoria de usuário:', tagsMap);
      setCategoryTags(tagsMap);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar as tags das categorias",
        variant: "default",
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
        {categories.map((category: any) => {
          // Use the user category id to fetch system tags mapped earlier
          const tags = isExpense ? (categoryTags[category.id] || []) : [];
          
          // Debug log for categories with tags
          if (isExpense && tags.length > 0) {
            console.log(`✅ ${category.name} (${category.id}) -> (${tags.length} tags)`);
          } else if (isExpense) {
            console.log(`❌ ${category.name} (${category.id}) (sem tags disponíveis)`);
          }
          
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
              
              {/* Tags Section - Sistema tags + User tags */}
              {(tags.length > 0 || getUserTagsForCategory(category.id).length > 0) && (
                <div className="ml-8 mt-2 pt-3 border-t border-border/30">
                  <div className="flex flex-wrap gap-2">
                    {/* Sistema tags */}
                    {tags.map((tag, index) => (
                      <Badge 
                        key={`system-${index}`} 
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
                    {/* User tags */}
                    {getUserTagsForCategory(category.id).map((userTag) => (
                      <Badge 
                        key={`user-${userTag.id}`} 
                        variant="secondary"
                        className="text-xs px-3 py-1.5 font-medium rounded-full transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: userTag.color + '20',
                          borderColor: userTag.color + '60',
                          color: userTag.color,
                          borderWidth: '1.5px'
                        }}
                      >
                        {userTag.tag_name}
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                analyzeConsolidationOpportunities();
                setIsConsolidating(true);
              }}
              className="flex items-center gap-2"
            >
              <Merge className="h-4 w-4" />
              Consolidar Categorias
            </Button>
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
             </Dialog>
           </div>
         </div>

         {/* Consolidation Modal */}
         <AlertDialog open={isConsolidating} onOpenChange={setIsConsolidating}>
           <AlertDialogContent className="max-w-2xl">
             <AlertDialogHeader>
               <AlertDialogTitle>Consolidar Categorias Redundantes</AlertDialogTitle>
               <AlertDialogDescription>
                 Encontramos categorias que podem ser consolidadas para simplificar sua organização:
               </AlertDialogDescription>
             </AlertDialogHeader>
             <div className="max-h-96 overflow-y-auto space-y-4">
               {consolidationSuggestions.length > 0 ? (
                 consolidationSuggestions.map((suggestion, index) => (
                   <Card key={index} className="p-4">
                     <div className="space-y-3">
                       <div className="flex items-center gap-2">
                         <span className="font-medium">Manter:</span>
                         <Badge variant="outline" style={{ borderColor: suggestion.parent.color }}>
                           {suggestion.parent.name}
                         </Badge>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="font-medium">Consolidar:</span>
                         <div className="flex flex-wrap gap-2">
                           {suggestion.children.map((child) => (
                             <Badge key={child.id} variant="secondary" style={{ borderColor: child.color }}>
                               {child.name}
                             </Badge>
                           ))}
                         </div>
                       </div>
                       <Button
                         size="sm"
                         onClick={() => consolidateCategories(suggestion.parent, suggestion.children)}
                         className="w-full"
                       >
                         Consolidar este grupo
                       </Button>
                     </div>
                   </Card>
                 ))
               ) : (
                 <p className="text-center text-muted-foreground py-8">
                   Nenhuma oportunidade de consolidação encontrada.
                 </p>
               )}
             </div>
             <AlertDialogFooter>
               <AlertDialogCancel>Fechar</AlertDialogCancel>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>

         <Dialog open={isDialogOpen} onOpenChange={(open) => {
           setIsDialogOpen(open);
           if (!open) resetForm();
         }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? t('categories.edit') : t('categories.add')}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Edite o nome, cor, tipo e tags desta categoria.' : 'Crie uma nova categoria de entrada ou saída.'}
                </DialogDescription>
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
                
                {editingCategory && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="categoryTags">Tags</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adicione tags para categorizar melhor suas transações</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                     <TagInput
                       tags={(() => {
                         const currentSystemTags = categoryTags[editingCategory.id] || [];
                         const currentUserTags = getUserTagsForCategory(editingCategory.id);
                         const currentExcludedSystemTags = excludedSystemTags[editingCategory.id] || [];
                         
                         // Filter system tags to exclude those the user has removed
                         const visibleSystemTags = currentSystemTags.filter(tag => 
                           !currentExcludedSystemTags.includes(tag.id)
                         );
                         
                         return [
                           // System tags (now removable)
                           ...visibleSystemTags.map(tag => ({
                             id: `system-${tag.id}`,
                             name: getTagName(tag),
                             color: tag.color,
                             removable: true,
                             isSystemTag: true,
                             systemTagId: tag.id
                           })),
                           // User tags
                           ...currentUserTags.map(tag => ({
                             id: tag.id,
                             name: tag.tag_name,
                             color: tag.color,
                             removable: true,
                             isSystemTag: false
                           }))
                         ];
                       })()}
                       onAddTag={async (tagName) => {
                         if (editingCategory) {
                           return await addUserTag(editingCategory.id, tagName);
                         }
                         return false;
                       }}
                       onRemoveTag={(tagId) => {
                         if (!editingCategory) return;
                         
                         // Find the tag to determine if it's system or user
                         const allTags = [
                           ...(categoryTags[editingCategory.id] || []).map(tag => ({
                             id: `system-${tag.id}`,
                             isSystemTag: true,
                             systemTagId: tag.id
                           })),
                           ...getUserTagsForCategory(editingCategory.id).map(tag => ({
                             id: tag.id,
                             isSystemTag: false,
                             systemTagId: undefined
                           }))
                         ];
                         
                         const tag = allTags.find(t => t.id === tagId);
                         if (!tag) return;
                         
                         if (tag.isSystemTag && tag.systemTagId) {
                           // Exclude system tag from this category
                           excludeSystemTag(tag.systemTagId, editingCategory.id);
                         } else {
                           // Remove user custom tag
                           removeUserTag(tagId, editingCategory.id);
                         }
                       }}
                      placeholder="Digite uma tag e pressione Enter..."
                      suggestions={[
                        "Emergência", "Imprevistos", "Não Categorizado",
                        "Veículos", "Uber", "Combustível", "Manutenção",
                        "Medicamentos", "Consultas", "Exames",
                        "Supermercado", "Restaurante", "Delivery"
                      ]}
                    />
                  </div>
                )}
                
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