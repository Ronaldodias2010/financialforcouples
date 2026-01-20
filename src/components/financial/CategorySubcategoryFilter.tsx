import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubcategories, type Subcategory } from "@/hooks/useSubcategories";
import { translateCategoryName } from "@/utils/categoryTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CategorySubcategoryFilterProps {
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onSubcategoryChange: (subcategoryId: string | null) => void;
  categoryType?: 'expense' | 'income' | 'all';
  showClear?: boolean;
  compact?: boolean;
  className?: string;
}

export const CategorySubcategoryFilter: React.FC<CategorySubcategoryFilterProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  categoryType = 'expense',
  showClear = true,
  compact = false,
  className = '',
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { fetchSubcategoriesForCategory, getLocalizedName } = useSubcategories();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      
      setLoadingCategories(true);
      try {
        let query = supabase
          .from('categories')
          .select('id, name, color')
          .is('deleted_at', null)
          .order('name');

        if (categoryType !== 'all') {
          query = query.eq('category_type', categoryType);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Deduplicate categories by normalized name
        const normalize = (s: string) =>
          s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        
        const uniqueCategories = new Map<string, Category>();
        (data || []).forEach((cat) => {
          const key = normalize(cat.name);
          if (!uniqueCategories.has(key)) {
            uniqueCategories.set(key, cat);
          }
        });
        
        setCategories(Array.from(uniqueCategories.values()));
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [user, categoryType]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }
      
      setLoadingSubcategories(true);
      try {
        const subs = await fetchSubcategoriesForCategory(selectedCategoryId);
        setSubcategories(subs);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setLoadingSubcategories(false);
      }
    };

    loadSubcategories();
    // Reset subcategory when category changes
    if (selectedSubcategoryId) {
      onSubcategoryChange(null);
    }
  }, [selectedCategoryId, fetchSubcategoriesForCategory]);

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      onCategoryChange(null);
    } else {
      onCategoryChange(value);
    }
  };

  const handleSubcategoryChange = (value: string) => {
    if (value === 'all') {
      onSubcategoryChange(null);
    } else {
      onSubcategoryChange(value);
    }
  };

  const handleClear = () => {
    onCategoryChange(null);
    onSubcategoryChange(null);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedSubcategory = subcategories.find(s => s.id === selectedSubcategoryId);

  const hasActiveFilters = selectedCategoryId || selectedSubcategoryId;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Category Filter */}
        <Select value={selectedCategoryId || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder={t('filters.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {language === 'pt' ? 'Todas categorias' : 'All categories'}
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  {cat.color && (
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  <span>{translateCategoryName(cat.name, language)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Subcategory Filter - only show when category is selected and has subcategories */}
        {selectedCategoryId && subcategories.length > 0 && (
          <Select 
            value={selectedSubcategoryId || 'all'} 
            onValueChange={handleSubcategoryChange}
            disabled={loadingSubcategories}
          >
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <ChevronDown className="h-3 w-3 mr-1" />
              <SelectValue placeholder={t('filters.subcategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'pt' ? 'Todas subcategorias' : 'All subcategories'}
              </SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  <div className="flex items-center gap-2">
                    {sub.color && (
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: sub.color }}
                      />
                    )}
                    <span>{getLocalizedName(sub)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear button */}
        {showClear && hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-8 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {language === 'pt' ? 'Filtros ativos:' : 'Active filters:'}
          </span>
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {translateCategoryName(selectedCategory.name, language)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onCategoryChange(null)}
              />
            </Badge>
          )}
          {selectedSubcategory && (
            <Badge variant="outline" className="gap-1">
              {getLocalizedName(selectedSubcategory)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onSubcategoryChange(null)}
              />
            </Badge>
          )}
          {showClear && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-2 text-xs">
              {language === 'pt' ? 'Limpar' : 'Clear'}
            </Button>
          )}
        </div>
      )}

      {/* Filter Selects */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Category Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">
            {t('filters.category')}
          </label>
          <Select value={selectedCategoryId || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={language === 'pt' ? 'Selecione...' : 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'pt' ? 'Todas categorias' : 'All categories'}
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    {cat.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <span>{translateCategoryName(cat.name, language)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory Filter */}
        {selectedCategoryId && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">
              {t('filters.subcategory')}
            </label>
            <Select 
              value={selectedSubcategoryId || 'all'} 
              onValueChange={handleSubcategoryChange}
              disabled={loadingSubcategories || subcategories.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue 
                  placeholder={
                    loadingSubcategories 
                      ? (language === 'pt' ? 'Carregando...' : 'Loading...')
                      : subcategories.length === 0
                        ? (language === 'pt' ? 'Sem subcategorias' : 'No subcategories')
                        : (language === 'pt' ? 'Selecione...' : 'Select...')
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'pt' ? 'Todas subcategorias' : 'All subcategories'}
                </SelectItem>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    <div className="flex items-center gap-2">
                      {sub.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: sub.color }}
                        />
                      )}
                      <span>{getLocalizedName(sub)}</span>
                      {sub.is_system && (
                        <span className="text-xs text-muted-foreground">(sistema)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySubcategoryFilter;
