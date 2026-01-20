import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Plus, Tag, Globe } from "lucide-react";
import { useUserCategoryTags } from "@/hooks/useUserCategoryTags";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useLanguage } from "@/hooks/useLanguage";

interface CategoryTag {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  color: string;
}

// Safe translation helper for CategoryTag
const getTranslatedTagName = (tag: CategoryTag, language: string): string => {
  if (!tag) return '';
  
  const safeName = (name?: string) => name?.toLowerCase()?.trim() || '';
  
  switch (language) {
    case 'en':
      return safeName(tag.name_en) || safeName(tag.name_pt) || '';
    case 'es':
      return safeName(tag.name_es) || safeName(tag.name_pt) || '';
    case 'pt':
    default:
      return safeName(tag.name_pt) || '';
  }
};

interface UserCategoryTag {
  id: string;
  tag_name: string;
  tag_name_en?: string;
  tag_name_es?: string;
  color: string;
  category_id: string;
}

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  systemTags: CategoryTag[];
  excludedTagIds: string[];
  onExcludeSystemTag: (systemTagId: string, categoryId: string) => void;
  onRestoreSystemTag: (systemTagId: string, categoryId: string) => void;
}

export const TagEditModal = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  systemTags,
  excludedTagIds,
  onExcludeSystemTag,
  onRestoreSystemTag,
}: TagEditModalProps) => {
  const [newTagName, setNewTagName] = useState("");
  const [newTagNameEn, setNewTagNameEn] = useState("");
  const [newTagNameEs, setNewTagNameEs] = useState("");
  const [showTranslations, setShowTranslations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addUserTag, removeUserTag, getUserTagsForCategory } = useUserCategoryTags();
  const { addSubcategory, deleteSubcategory, getSubcategoriesForCategory, getLocalizedName } = useSubcategories();
  const { language, t } = useLanguage();

  const userTags = getUserTagsForCategory(categoryId);
  const subcategories = getSubcategoriesForCategory(categoryId).filter(s => !s.is_system);

  const handleAddSubcategory = async () => {
    if (!newTagName.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await addSubcategory(
        categoryId, 
        newTagName.trim(),
        undefined,
        newTagNameEn.trim() || undefined,
        newTagNameEs.trim() || undefined
      );
      
      if (result) {
        setNewTagName("");
        setNewTagNameEn("");
        setNewTagNameEs("");
        setShowTranslations(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubcategory();
    }
  };

  const getTranslationPlaceholder = (lang: 'en' | 'es'): string => {
    const placeholders = {
      en: { pt: 'Nome em inglês', en: 'English name', es: 'Nombre en inglés' },
      es: { pt: 'Nome em espanhol', en: 'Spanish name', es: 'Nombre en español' },
    };
    return placeholders[lang][language as 'pt' | 'en' | 'es'] || placeholders[lang].en;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('tags.title')} - {categoryName}
          </DialogTitle>
          <DialogDescription>
            {language === 'pt' 
              ? 'Gerencie as subcategorias desta categoria.' 
              : language === 'es'
              ? 'Gestione las subcategorías de esta categoría.'
              : 'Manage subcategories for this category.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new subcategory */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {language === 'pt' ? 'Adicionar subcategoria' : language === 'es' ? 'Agregar subcategoría' : 'Add subcategory'}
            </Label>
            
            <div className="flex gap-2">
              <Input
                placeholder={language === 'pt' ? 'Nome em português' : language === 'es' ? 'Nombre en portugués' : 'Portuguese name'}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setShowTranslations(!showTranslations)}
                className={showTranslations ? 'bg-accent' : ''}
                title={language === 'pt' ? 'Adicionar traduções' : language === 'es' ? 'Agregar traducciones' : 'Add translations'}
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleAddSubcategory}
                disabled={!newTagName.trim() || isSubmitting}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showTranslations && (
              <div className="space-y-2 pl-2 border-l-2 border-accent">
                <Input
                  placeholder={getTranslationPlaceholder('en')}
                  value={newTagNameEn}
                  onChange={(e) => setNewTagNameEn(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                />
                <Input
                  placeholder={getTranslationPlaceholder('es')}
                  value={newTagNameEs}
                  onChange={(e) => setNewTagNameEs(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'pt' 
                    ? 'Traduções são opcionais. Se não fornecidas, será usado o nome em português.'
                    : language === 'es'
                    ? 'Las traducciones son opcionales. Si no se proporcionan, se usará el nombre en portugués.'
                    : 'Translations are optional. If not provided, the Portuguese name will be used.'}
                </p>
              </div>
            )}
          </div>

          {/* System Tags */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">{t('tags.suggested')}</h4>
            <div className="flex flex-wrap gap-2">
              {systemTags.map(tag => {
                const isExcluded = excludedTagIds.includes(tag.id);
                const translatedName = getTranslatedTagName(tag, language);
                
                return (
                  <Badge
                    key={tag.id}
                    variant={isExcluded ? "outline" : "secondary"}
                    className={`text-xs transition-all cursor-pointer ${
                      isExcluded 
                        ? "opacity-50 line-through" 
                        : "hover:bg-primary/10"
                    }`}
                    onClick={() => {
                      if (isExcluded) {
                        onRestoreSystemTag(tag.id, categoryId);
                      } else {
                        onExcludeSystemTag(tag.id, categoryId);
                      }
                    }}
                  >
                    {translatedName}
                    {!isExcluded && (
                      <X className="h-3 w-3 ml-1 opacity-60" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* User Subcategories */}
          {subcategories.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {language === 'pt' ? 'Suas subcategorias' : language === 'es' ? 'Sus subcategorías' : 'Your subcategories'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {subcategories.map(sub => (
                  <Badge
                    key={sub.id}
                    variant="outline"
                    className="text-xs bg-accent/30 hover:bg-destructive/10 cursor-pointer transition-colors"
                    onClick={() => deleteSubcategory(sub.id)}
                  >
                    {getLocalizedName(sub)}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Legacy User Tags (for backward compatibility) */}
          {userTags.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{t('tags.yourTags')}</h4>
              <div className="flex flex-wrap gap-2">
                {userTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs bg-accent/30 hover:bg-destructive/10 cursor-pointer transition-colors"
                    onClick={() => removeUserTag(tag.id, categoryId)}
                  >
                    {tag.tag_name}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};