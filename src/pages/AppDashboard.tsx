import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { LogOut, User, Crown, Settings, Mail, ArrowLeft, BookOpen, Download, ExternalLink } from "lucide-react";
import { SubscriptionPage } from "./SubscriptionPage";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { PremiumExpirationWarning } from "@/components/subscription/PremiumExpirationWarning";
import { downloadTutorialPDF, openTutorialHTML } from "@/utils/tutorialUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CurrencyRatesDisplay } from "@/components/financial/CurrencyRatesDisplay";

const AppDashboard = () => {
  const { user, signOut } = useAuth();
  const { t, tFor, inBrazil, language } = useLanguage();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'subscription'>('dashboard');
  const [displayName, setDisplayName] = useState<string>('');

  // Check if user is admin (simplified - in production use proper role system)
  const isAdmin = user?.email === 'admin@arxexperience.com.br' || user?.email?.includes('admin');

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
        
        // Use display_name se disponível, senão usa o nome dos user_metadata, ou email como fallback
        const name = data?.display_name || 
                    user.user_metadata?.display_name || 
                    user.email?.split('@')[0] || 
                    'Usuário';
        setDisplayName(name);
      }
    };

    fetchDisplayName();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-end items-center">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/')}
                className="hidden sm:flex"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Landing
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-none">{displayName}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="sm">
                   <BookOpen className="h-4 w-4 mr-2 hidden sm:block" />
                   {!inBrazil ? tFor('en','nav.tutorial') : t('nav.tutorial')}
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openTutorialHTML(language as 'pt' | 'en' | 'es')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadTutorialPDF(language as 'pt' | 'en' | 'es')}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setCurrentPage('subscription')}
             >
               <Crown className="h-4 w-4 mr-2 hidden sm:block" />
               {!inBrazil ? tFor('en','nav.subscription') : t('nav.subscription')}
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
                  {t('nav.testEmail')}
                </Button>
              </>
            )}
            <ThemeSwitcher />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main>
        {currentPage === 'dashboard' ? (
          <div>
            <div className="container mx-auto px-4 py-4 space-y-4">
              <PremiumExpirationWarning />
              <div className="flex justify-center">
                <CurrencyRatesDisplay />
              </div>
            </div>
            <FinancialDashboard />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <SubscriptionPage onBack={() => setCurrentPage('dashboard')} />
          </div>
        )}
      </main>
    </div>
  );
};

export default AppDashboard;