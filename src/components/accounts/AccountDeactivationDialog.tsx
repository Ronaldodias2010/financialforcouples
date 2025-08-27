import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AccountDeactivationDialogProps {
  accountId: string;
  accountName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountDeactivationDialog = ({
  accountId,
  accountName,
  isOpen,
  onClose,
  onSuccess,
}: AccountDeactivationDialogProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (isOpen && accountId) {
      checkTransactions();
    }
  }, [isOpen, accountId]);

  const checkTransactions = async () => {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: 'exact', head: true })
        .eq("account_id", accountId);

      if (error) throw error;
      setHasTransactions((count || 0) > 0);
    } catch (error) {
      console.error("Error checking transactions:", error);
      toast.error(t('accounts.deactivation.checkError') || "Erro ao verificar transações");
      onClose();
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("id", accountId);

      if (error) throw error;

      toast.success(t('accounts.deactivation.deactivated') || "Conta desativada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deactivating account:", error);
      toast.error(t('accounts.deactivation.deactivateError') || "Erro ao desativar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast.success(t('accounts.deactivation.deleted') || "Conta removida com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t('accounts.deactivation.deleteError') || "Erro ao remover conta");
    } finally {
      setLoading(false);
    }
  };

  if (hasTransactions === null) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.loading') || "Carregando..."}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accounts.deactivation.checking') || "Verificando transações vinculadas..."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasTransactions ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                {t('accounts.deactivation.deactivateTitle') || "Desativar Conta?"}
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t('accounts.deactivation.deleteTitle') || "Excluir Conta?"}
              </>
            )}
          </AlertDialogTitle>
        </AlertDialogHeader>

        {hasTransactions ? (
          // Situação A - Conta com transações
          <div className="space-y-4">
            <AlertDialogDescription>
              <strong>"{accountName}"</strong> {t('accounts.deactivation.hasTransactions') || "possui lançamentos financeiros vinculados."}
            </AlertDialogDescription>
            
            <div className="bg-destructive/10 p-3 rounded-md">
              <p className="text-sm font-medium text-destructive mb-2">
                ❌ {t('accounts.deactivation.cannotDelete') || "Não podemos apagar definitivamente porque:"}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {t('accounts.deactivation.reason1') || "Seus lançamentos precisam ser mantidos para Imposto de Renda"}</li>
                <li>• {t('accounts.deactivation.reason2') || "O histórico é importante para fluxo de caixa"}</li>
                <li>• {t('accounts.deactivation.reason3') || "Relatórios mensais dependem destes dados"}</li>
              </ul>
            </div>

            <div className="bg-primary/10 p-3 rounded-md">
              <p className="text-sm font-medium text-primary mb-2">
                ✅ {t('accounts.deactivation.whatWillDo') || "O que faremos:"}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {t('accounts.deactivation.action1') || "A conta será DESATIVADA (não aparece mais em seleções)"}</li>
                <li>• {t('accounts.deactivation.action2') || "Ficará transparente na lista \"Suas Contas\""}</li>
                <li>• {t('accounts.deactivation.action3') || "Lançamentos antigos permanecem nos relatórios"}</li>
                <li>• {t('accounts.deactivation.action4') || "Você pode reativar a qualquer momento"}</li>
              </ul>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>
                {t('common.cancel') || "Cancelar"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivate}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? (
                  t('accounts.deactivation.deactivating') || "Desativando..."
                ) : (
                  t('accounts.deactivation.deactivateButton') || "Desativar Conta"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        ) : (
          // Situação B - Conta sem transações
          <div className="space-y-4">
            <AlertDialogDescription>
              <strong>"{accountName}"</strong> {t('accounts.deactivation.noTransactions') || "não possui lançamentos vinculados."}
            </AlertDialogDescription>
            
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                {t('accounts.deactivation.canDeleteSafely') || "Podemos removê-la completamente do sistema."}
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>
                {t('common.cancel') || "Cancelar"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? (
                  t('accounts.deactivation.deleting') || "Excluindo..."
                ) : (
                  t('accounts.deactivation.deleteButton') || "Excluir Permanentemente"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};