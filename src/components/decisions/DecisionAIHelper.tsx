import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, X, Send, Lightbulb, MessageCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DecisionAIHelperProps {
  currentStep: number;
  formData: any;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_QUESTIONS = 3;

// Quick actions por etapa
const getQuickActionsForStep = (step: number, t: (key: string) => string): string[] => {
  switch (step) {
    case 1:
      return [
        t('decisions.aiHelper.quickActions.whatType'),
        t('decisions.aiHelper.quickActions.typeDifference')
      ];
    case 2:
      return [
        t('decisions.aiHelper.quickActions.howToFill'),
        t('decisions.aiHelper.quickActions.whatIsUrgency')
      ];
    case 3:
      return [
        t('decisions.aiHelper.quickActions.whatAreRestrictions'),
        t('decisions.aiHelper.quickActions.idealInstallments')
      ];
    case 4:
      return [
        t('decisions.aiHelper.quickActions.summarizeScenarios'),
        t('decisions.aiHelper.quickActions.bestOption')
      ];
    case 5:
      return [
        t('decisions.aiHelper.quickActions.howToVote'),
        t('decisions.aiHelper.quickActions.canChange')
      ];
    case 6:
      return [
        t('decisions.aiHelper.quickActions.whatAreAgreements'),
        t('decisions.aiHelper.quickActions.summarizeAll')
      ];
    default:
      return [];
  }
};

// Contexto do sistema por etapa
const getStepContext = (step: number, formData: any, t: (key: string) => string): string => {
  const baseContext = `Você é PrIscA, uma mediadora financeira de casais. Responda em no máximo 2-3 frases curtas e diretas. Seja neutra e não tome partido. Foque APENAS na decisão atual.`;
  
  switch (step) {
    case 1:
      return `${baseContext} O usuário está escolhendo o tipo de decisão. Tipos disponíveis: Comprar vs Alugar, Quitar Dívida vs Investir, Trocar de Carro, Viagem (Milhas vs Dinheiro), Grande Compra, Personalizado.`;
    case 2:
      return `${baseContext} O usuário está preenchendo o contexto da decisão. Campos: título, descrição, valor estimado, data alvo, urgência, quem deseja e motivação.${formData.decision_type ? ` Tipo escolhido: ${formData.decision_type}.` : ''}`;
    case 3:
      return `${baseContext} O usuário está definindo restrições financeiras: limite mensal, parcelamento, máximo de parcelas, adiamento, impacto na reserva e metas.${formData.estimated_value ? ` Valor: ${formData.estimated_value}.` : ''}`;
    case 4:
      return `${baseContext} O usuário está avaliando 3 cenários: Pagamento à Vista, Parcelado, ou Adiar. Cada cenário mostra impacto no fluxo de caixa, reserva de emergência e investimentos.${formData.title ? ` Decisão: ${formData.title}.` : ''}`;
    case 5:
      return `${baseContext} O usuário vai registrar seu voto: Topo (concordo), Topo com condição (aceito se), ou Não topo agora. Pode escolher um cenário preferido e adicionar condições.`;
    case 6:
      return `${baseContext} O usuário está criando regras/combinados opcionais que valerão para decisões futuras: limite de gasto sem avisar, máximo de parcelas sem consenso.${formData.title ? ` Decisão: ${formData.title}.` : ''}${formData.vote ? ` Voto: ${formData.vote}.` : ''}`;
    default:
      return baseContext;
  }
};

export const DecisionAIHelper = ({ currentStep, formData, isOpen, onClose }: DecisionAIHelperProps) => {
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const remainingQuestions = MAX_QUESTIONS - questionsUsed;
  const canAsk = remainingQuestions > 0;

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mensagem de boas-vindas ao abrir
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t('decisions.aiHelper.welcome')
      }]);
    }
  }, [isOpen, t]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !canAsk || !session) return;
    
    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const systemContext = getStepContext(currentStep, formData, t);
      
      const { data, error } = await supabase.functions.invoke('decision-ai-helper', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          message: messageContent,
          systemContext,
          language,
          step: currentStep,
          formData: {
            decision_type: formData.decision_type,
            title: formData.title,
            estimated_value: formData.estimated_value,
            urgency: formData.urgency,
            vote: formData.vote
          }
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.response || t('decisions.aiHelper.errorResponse')
      };
      setMessages(prev => [...prev, assistantMessage]);
      setQuestionsUsed(prev => prev + 1);
      
    } catch (error) {
      console.error('Error calling decision-ai-helper:', error);
      toast.error(t('decisions.aiHelper.error'));
      // Remove a mensagem do usuário se falhou
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) return null;

  const quickActions = getQuickActionsForStep(currentStep, t);

  return (
    <Card className="fixed bottom-4 right-4 w-80 md:w-96 shadow-2xl z-50 border-primary/20">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary/10 to-primary/5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-medium">
            {t('decisions.aiHelper.title')}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canAsk ? "secondary" : "destructive"} className="text-xs">
            {remainingQuestions}/3
          </Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Quick Actions */}
        <div className="p-2 border-b flex flex-wrap gap-1">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              disabled={!canAsk || isLoading}
              onClick={() => handleQuickAction(action)}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {action}
            </Button>
          ))}
        </div>
        
        {/* Messages */}
        <ScrollArea className="h-48 p-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {t('decisions.aiHelper.thinking')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="p-2 border-t">
          {canAsk ? (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('decisions.aiHelper.placeholder')}
                className="text-sm h-9"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-9 w-9"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                {t('decisions.aiHelper.limitReached')}
              </p>
              <p className="text-xs text-primary mt-1">
                {t('decisions.aiHelper.goToFullPrisca')}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

// Botão flutuante para abrir o helper
interface DecisionAIHelperButtonProps {
  onClick: () => void;
  remainingQuestions: number;
}

export const DecisionAIHelperButton = ({ onClick, remainingQuestions }: DecisionAIHelperButtonProps) => {
  const { t } = useLanguage();
  
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90"
      size="icon"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6" />
        <Badge 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          variant="secondary"
        >
          {remainingQuestions}
        </Badge>
      </div>
    </Button>
  );
};
