import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { LogOut, User, Crown, Settings, Mail } from "lucide-react";
import { SubscriptionPage } from "./SubscriptionPage";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'subscription'>('dashboard');

  // Check if user is admin (simplified - in production use proper role system)
  const isAdmin = user?.email === 'admin@arxexperience.com.br' || user?.email?.includes('admin');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-end items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage('subscription')}
            >
              <Crown className="h-4 w-4 mr-2" />
              Planos
            </Button>
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('nav.admin')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/email-test')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Teste Email
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main>
        {currentPage === 'dashboard' ? (
          <>
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col items-center text-center mb-8">
                <img 
                  src="/lovable-uploads/13ca0846-97a1-42b6-a0b8-232573bff76d.png"
                  alt="Financial Management Logo" 
                  className="h-48 w-48 object-contain -mb-14"
                />
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent -mb-10">
                  Gestão Financeira para Casais
                </h1>
              </div>
            </div>
            <FinancialDashboard />
          </>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <SubscriptionPage onBack={() => setCurrentPage('dashboard')} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
