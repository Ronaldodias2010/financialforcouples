import { useState } from "react";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft } from "lucide-react";

interface AccountsPageProps {
  onBack: () => void;
}

export const AccountsPage = ({ onBack }: AccountsPageProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();

  const handleAccountAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <h1 className="text-3xl font-bold">{t('accounts.manage')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AccountForm onAccountAdded={handleAccountAdded} />
        <AccountList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};