import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AccountData {
  id: string;
  name: string;
  overdraft_limit: number;
}

interface AccountEditFormProps {
  account: AccountData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountEditForm = ({ account, isOpen, onClose, onSuccess }: AccountEditFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: account.name,
    overdraft_limit: account.overdraft_limit
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: formData.name,
          overdraft_limit: formData.overdraft_limit
        })
        .eq('id', account.id);

      if (error) {
        if (error.message.includes('duplicate_account_name')) {
          toast({
            variant: "destructive",
            title: t('accounts.editError'),
            description: "Já existe uma conta com este nome."
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: t('accounts.editSuccess'),
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast({
        variant: "destructive",
        title: t('accounts.editError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: account.name,
      overdraft_limit: account.overdraft_limit
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('accounts.editAccount')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="overdraft_limit">Limite do Cheque Especial</Label>
            <Input
              id="overdraft_limit"
              type="number"
              step="0.01"
              min="0"
              value={formData.overdraft_limit}
              onChange={(e) => setFormData({ ...formData, overdraft_limit: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t('accounts.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('accounts.editing') : t('accounts.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};