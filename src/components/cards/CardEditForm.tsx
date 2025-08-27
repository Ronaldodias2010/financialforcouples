import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CardData {
  id: string;
  name: string;
  card_type: "credit" | "debit";
  credit_limit: number | null;
  due_date: number | null;
  closing_date: number | null;
}

interface CardEditFormProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CardEditForm = ({ card, isOpen, onClose, onSuccess }: CardEditFormProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    credit_limit: "",
    due_date: "",
    closing_date: ""
  });

  // Update form data when card changes
  useEffect(() => {
    if (card) {
      setFormData({
        credit_limit: card.credit_limit?.toString() || "",
        due_date: card.due_date?.toString() || "",
        closing_date: card.closing_date?.toString() || ""
      });
    }
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;

    // Only allow editing credit cards
    if (card.card_type !== "credit") {
      toast.error("Apenas cartões de crédito podem ser editados");
      return;
    }

    // Validate required fields
    if (!formData.credit_limit) {
      toast.error("Limite de crédito é obrigatório");
      return;
    }

    if (!formData.due_date) {
      toast.error("Data de vencimento é obrigatória");
      return;
    }

    if (!formData.closing_date) {
      toast.error("Data de fechamento é obrigatória");
      return;
    }

    // Validate that due date is different from closing date
    if (formData.due_date === formData.closing_date) {
      toast.error("Data de vencimento deve ser diferente da data de fechamento");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("cards")
        .update({
          credit_limit: parseFloat(formData.credit_limit),
          due_date: parseInt(formData.due_date),
          closing_date: parseInt(formData.closing_date),
        })
        .eq("id", card.id);

      if (error) throw error;

      toast.success(t('cards.editSuccess'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error(t('cards.editError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form data to original values
    if (card) {
      setFormData({
        credit_limit: card.credit_limit?.toString() || "",
        due_date: card.due_date?.toString() || "",
        closing_date: card.closing_date?.toString() || ""
      });
    }
    onClose();
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('cards.editCard')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {t('cards.name')}
            </Label>
            <div className="mt-1 text-sm">{card.name}</div>
          </div>

          <div>
            <Label htmlFor="credit_limit">{t('cards.creditLimit')}</Label>
            <Input
              id="credit_limit"
              type="number"
              step="0.01"
              min="0"
              value={formData.credit_limit}
              onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="closing_date">{t('cards.closingDate')}</Label>
            <Select 
              value={formData.closing_date} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, closing_date: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('cards.selectDay')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="due_date">{t('cards.dueDate')}</Label>
            <Select 
              value={formData.due_date} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, due_date: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('cards.selectDay')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('cards.editing') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};