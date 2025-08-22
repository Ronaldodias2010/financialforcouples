import { useState } from "react";
import { UserProfileForm } from "@/components/user/UserProfileForm";
import { BillingManagementPage } from "./BillingManagementPage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft } from "lucide-react";

interface UserProfilePageProps {
  onBack: () => void;
  activeTab?: string;
}

export const UserProfilePage = ({ onBack, activeTab }: UserProfilePageProps) => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<'profile' | 'billing'>('profile');
  
  if (currentView === 'billing') {
    return <BillingManagementPage onBack={() => setCurrentView('profile')} />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
      </div>

      <UserProfileForm 
        activeTab={activeTab} 
        onNavigateToBilling={() => setCurrentView('billing')}
      />
    </div>
  );
};