import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCategoryName, translateCategoryDescription } from "@/utils/categoryTranslation";
import { Palette, Type, FileText } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  category_type: "income" | "expense";
  description?: string;
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: () => void;
}

export const CategoryEditModal = ({ isOpen, onClose, category, onSuccess }: CategoryEditModalProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [categoryType, setCategoryType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color || "#6366f1");
      setCategoryType(category.category_type);
      setDescription(category.description || "");
    } else {
      setName("");
      setColor("#6366f1");
      setCategoryType("expense");
      setDescription("");
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            color,
            category_type: categoryType,
            description: description.trim() || null,
          })
          .eq('id', category.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: name.trim(),
            color,
            category_type: categoryType,
            description: description.trim() || null,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso!",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {category ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Nome da Categoria
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              disabled={isLoading}
              className="focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor da Categoria
            </Label>
            <div className="flex items-center gap-3">
              <ColorPicker
                value={color}
                onChange={setColor}
                disabled={isLoading}
              />
              <div className="text-sm text-muted-foreground">
                Esta cor será usada nos gráficos e relatórios
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo da Categoria</Label>
            <Select value={categoryType} onValueChange={(value: "income" | "expense") => setCategoryType(value)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">💸 Despesa</SelectItem>
                <SelectItem value="income">💰 Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito desta categoria..."
              disabled={isLoading}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Preview da categoria */}
          <div className="p-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Preview</Label>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: color }}
              />
              <div>
                <div className="font-medium text-sm">{name || "Nome da categoria"}</div>
                {description && (
                  <div className="text-xs text-muted-foreground">{description}</div>
                )}
              </div>
              <div className="ml-auto text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {categoryType === 'income' ? '💰 Receita' : '💸 Despesa'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : category ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};