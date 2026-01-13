import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  MessageSquare, 
  PieChart, 
  CreditCard, 
  Shield, 
  ArrowRight, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface FirstAccessWelcomeModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const FirstAccessWelcomeModal = ({ isOpen, onComplete }: FirstAccessWelcomeModalProps) => {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const text = {
    pt: {
      welcomeTitle: '🎉 Bem-vindo ao Couples Financials!',
      welcomeDescription: 'Vamos conhecer os principais recursos da plataforma',
      continueButton: 'Continuar',
      backButton: 'Voltar',
      finishButton: 'Começar!',
      cards: [
        {
          icon: MessageSquare,
          title: 'WhatsApp Inteligente',
          description: 'Registre suas despesas enviando mensagens pelo WhatsApp. É simples: "Gastei R$50 no mercado" e pronto!'
        },
        {
          icon: PieChart,
          title: 'Dashboard Completo',
          description: 'Visualize todas as suas finanças em um só lugar: receitas, despesas, investimentos e metas.'
        },
        {
          icon: CreditCard,
          title: 'Controle de Cartões',
          description: 'Gerencie seus cartões de crédito, acompanhe faturas e controle seus limites.'
        },
        {
          icon: Shield,
          title: 'Segurança Total',
          description: 'Seus dados financeiros são criptografados e protegidos. Sua privacidade é nossa prioridade.'
        }
      ]
    },
    en: {
      welcomeTitle: '🎉 Welcome to Couples Financials!',
      welcomeDescription: "Let's explore the main features of the platform",
      continueButton: 'Continue',
      backButton: 'Back',
      finishButton: 'Get Started!',
      cards: [
        {
          icon: MessageSquare,
          title: 'Smart WhatsApp',
          description: 'Record your expenses by sending WhatsApp messages. Simply: "Spent $50 at grocery" and done!'
        },
        {
          icon: PieChart,
          title: 'Complete Dashboard',
          description: 'View all your finances in one place: income, expenses, investments, and goals.'
        },
        {
          icon: CreditCard,
          title: 'Card Control',
          description: 'Manage your credit cards, track bills, and control your limits.'
        },
        {
          icon: Shield,
          title: 'Total Security',
          description: 'Your financial data is encrypted and protected. Your privacy is our priority.'
        }
      ]
    },
    es: {
      welcomeTitle: '🎉 ¡Bienvenido a Couples Financials!',
      welcomeDescription: 'Conozcamos las principales características de la plataforma',
      continueButton: 'Continuar',
      backButton: 'Atrás',
      finishButton: '¡Comenzar!',
      cards: [
        {
          icon: MessageSquare,
          title: 'WhatsApp Inteligente',
          description: 'Registra tus gastos enviando mensajes por WhatsApp. Simple: "Gasté €50 en el mercado" ¡y listo!'
        },
        {
          icon: PieChart,
          title: 'Panel Completo',
          description: 'Visualiza todas tus finanzas en un solo lugar: ingresos, gastos, inversiones y metas.'
        },
        {
          icon: CreditCard,
          title: 'Control de Tarjetas',
          description: 'Gestiona tus tarjetas de crédito, sigue tus facturas y controla tus límites.'
        },
        {
          icon: Shield,
          title: 'Seguridad Total',
          description: 'Tus datos financieros están encriptados y protegidos. Tu privacidad es nuestra prioridad.'
        }
      ]
    }
  };

  const t = text[language as keyof typeof text] || text.pt;
  const totalSteps = t.cards.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentCard = t.cards[currentStep];
  const IconComponent = currentCard.icon;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {t.welcomeTitle}
          </DialogTitle>
          <DialogDescription>
            {t.welcomeDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Card atual */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-primary/20">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/20">
                <IconComponent className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{currentCard.title}</h3>
              <p className="text-muted-foreground">{currentCard.description}</p>
            </div>
          </div>

          {/* Indicadores de progresso */}
          <div className="flex justify-center gap-2 mt-6">
            {t.cards.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button 
              onClick={handleBack} 
              variant="outline"
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t.backButton}
            </Button>
          )}
          <Button 
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep < totalSteps - 1 ? (
              <>
                {t.continueButton}
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                {t.finishButton}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
