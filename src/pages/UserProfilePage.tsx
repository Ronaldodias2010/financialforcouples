import { UserProfileForm } from "@/components/user/UserProfileForm";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft } from "lucide-react";

interface UserProfilePageProps {
  onBack: () => void;
  activeTab?: string;
}

export const UserProfilePage = ({ onBack, activeTab }: UserProfilePageProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
      </div>

      <UserProfileForm activeTab={activeTab} />
    </div>
  );
};