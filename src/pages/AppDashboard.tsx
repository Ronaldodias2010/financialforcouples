import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirstAccess } from "@/hooks/useFirstAccess";
import { Button } from "@/components/ui/button";
import { LogOut, User, Crown, Settings, Mail, ArrowLeft, BookOpen, Download, ExternalLink, MessageSquare, MoreVertical, Shield, Moon, Sun } from "lucide-react";
import { SubscriptionPage } from "./SubscriptionPage";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { PremiumExpirationWarning } from "@/components/subscription/PremiumExpirationWarning";
import { downloadTutorialPDF, openTutorialHTML } from "@/utils/tutorialUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CurrencyRatesDisplay } from "@/components/financial/CurrencyRatesDisplay";
import TestimonialFormModal from "@/components/landing/TestimonialFormModal";
import { FirstAccessWelcomeModal } from "@/components/onboarding/FirstAccessWelcomeModal";
import { WhatsAppPhoneRequiredModal } from "@/components/onboarding/WhatsAppPhoneRequiredModal";
import { TwoFactorToggle } from "@/components/auth/TwoFactorToggle";
import { useTheme } from "@/hooks/useTheme";

const AppDashboard = () => {
  const { user, signOut } = useAuth();
  const { t, tFor, inBrazil, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currentStep, completeWelcome, completePhone } = useFirstAccess();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'subscription'>('dashboard');
  const [displayName, setDisplayName] = useState<string>('');
  const [testimonialOpen, setTestimonialOpen] = useState(false);
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3 flex justify-between items-center gap-2 min-w-0">
          {/* Cotações à esquerda */}
          <div className="flex-shrink-0 min-w-0">
            <CurrencyRatesDisplay compact />
          </div>
          
          {/* Controles à direita */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Nome do usuário - sempre visível */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate max-w-[60px] sm:max-w-[120px]">{displayName}</span>
            </div>

            {/* Botões visíveis apenas em desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Landing
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {!inBrazil ? tFor('en','nav.tutorial') : t('nav.tutorial')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg z-50">
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

              {/* Toggle 2FA ao lado do tutorial */}
              <TwoFactorToggle variant="compact" showLabel={false} />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage('subscription')}
              >
                <Crown className="h-4 w-4 mr-2" />
                {!inBrazil ? tFor('en','nav.subscription') : t('nav.subscription')}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTestimonialOpen(true)}
                title={t('testimonials.submitButton')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('testimonials.submitButton')}
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
            </div>

            {/* Menu dropdown para mobile - contém TUDO */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg z-50 min-w-[200px]">
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar à Landing
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => openTutorialHTML(language as 'pt' | 'en' | 'es')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {!inBrazil ? tFor('en','nav.tutorial') : t('nav.tutorial')} - Online
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadTutorialPDF(language as 'pt' | 'en' | 'es')}>
                    <Download className="h-4 w-4 mr-2" />
                    {!inBrazil ? tFor('en','nav.tutorial') : t('nav.tutorial')} - PDF
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setCurrentPage('subscription')}>
                    <Crown className="h-4 w-4 mr-2" />
                    {!inBrazil ? tFor('en','nav.subscription') : t('nav.subscription')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setTestimonialOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('testimonials.submitButton')}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/security-settings')}>
                    <Shield className="h-4 w-4 mr-2" />
                    {t('2fa.security.title')}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    document.documentElement.classList.toggle('dark', !isDark);
                    localStorage.setItem('theme', isDark ? 'light' : 'dark');
                    window.dispatchEvent(new Event('storage'));
                  }}>
                    {document.documentElement.classList.contains('dark') ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {document.documentElement.classList.contains('dark') ? (t('theme.light') || 'Claro') : (t('theme.dark') || 'Escuro')}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="h-4 w-4 mr-2" />
                        {t('nav.admin')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/email-test')}>
                        <Mail className="h-4 w-4 mr-2" />
                        {t('nav.testEmail')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ThemeSwitcher e Logout - apenas desktop */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeSwitcher />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                title={t('nav.logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{t('nav.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <TestimonialFormModal open={testimonialOpen} onOpenChange={setTestimonialOpen} />
      
      {/* First Access Modals */}
      <FirstAccessWelcomeModal 
        isOpen={currentStep === 'welcome'} 
        onComplete={completeWelcome} 
      />
      <WhatsAppPhoneRequiredModal 
        isOpen={currentStep === 'phone'} 
        onComplete={completePhone}
        onSkip={completePhone}
        userId={user?.id || ''}
      />
      
      <main>
        {currentPage === 'dashboard' ? (
          <div>
            <div className="container mx-auto px-4 pt-2 pb-2">
              <PremiumExpirationWarning />
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