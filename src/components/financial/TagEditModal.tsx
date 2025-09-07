import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Tag } from "lucide-react";
import { useUserCategoryTags } from "@/hooks/useUserCategoryTags";
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
  const { addUserTag, removeUserTag, getUserTagsForCategory, refetch } = useUserCategoryTags();
  const { language, t } = useLanguage();

  const userTags = getUserTagsForCategory(categoryId);

  // Re-fetch tags when modal opens
  useEffect(() => {
    if (isOpen && categoryId) {
      refetch();
    }
  }, [isOpen, categoryId, refetch]);

  const handleAddUserTag = async () => {
    if (!newTagName.trim()) return;
    
    const success = await addUserTag(categoryId, newTagName.trim());
    if (success) {
      setNewTagName("");
      // Trigger re-fetch to update UI
      await refetch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUserTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('tags.title')} - {categoryName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new tag */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('tags.addNew')}</label>
            <div className="flex gap-2">
              <Input
                placeholder={t('tags.placeholder')}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button 
                onClick={handleAddUserTag}
                disabled={!newTagName.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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

          {/* User Tags */}
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