import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle,
  X,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  icon: React.ReactNode;
}

interface TaxAIAssistantProps {
  taxYear: number;
  onClose?: () => void;
  isFloating?: boolean;
}

export function TaxAIAssistant({ taxYear, onClose, isFloating = false }: TaxAIAssistantProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('tax.ai.welcomeMessage'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'deductions',
      label: t('tax.ai.quickActions.deductions'),
      query: t('tax.ai.queries.deductions'),
      icon: <Lightbulb className="h-3 w-3" />
    },
    {
      id: 'documents',
      label: t('tax.ai.quickActions.documents'),
      query: t('tax.ai.queries.documents'),
      icon: <HelpCircle className="h-3 w-3" />
    },
    {
      id: 'exempt',
      label: t('tax.ai.quickActions.exempt'),
      query: t('tax.ai.queries.exempt'),
      icon: <CheckCircle className="h-3 w-3" />
    }
  ];

  const handleSend = async (query?: string) => {
    const messageText = query || input;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (will be replaced with actual AI call later)
    setTimeout(() => {
      const responses = getContextualResponse(messageText, taxYear);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerClass = isFloating 
    ? "fixed bottom-4 right-4 w-96 max-h-[500px] shadow-xl z-50 flex flex-col"
    : "w-full";

  return (
    <Card className={containerClass}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {t('tax.ai.title')}
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {t('tax.ai.subtitle')}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4 mb-4" style={{ maxHeight: isFloating ? '280px' : '400px' }}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
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
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1 mb-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSend(action.query)}
              disabled={isTyping}
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('tax.ai.inputPlaceholder')}
            className="min-h-[40px] max-h-[80px] resize-none"
            rows={1}
          />
          <Button 
            size="icon" 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to provide contextual responses
function getContextualResponse(query: string, taxYear: number): string {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('deduz') || queryLower.includes('deduct')) {
    return `Para o ano de ${taxYear}, você pode deduzir despesas com:

• **Saúde**: Consultas, exames, internações, planos de saúde (sem limite)
• **Educação**: Mensalidades escolares e faculdade (limite R$ 3.561,50/pessoa)
• **Previdência privada**: PGBL (limite de 12% da renda tributável)
• **Dependentes**: R$ 2.275,08 por dependente
• **Pensão alimentícia**: Judicial ou em escritura pública

Lembre-se de guardar todos os comprovantes!`;
  }
  
  if (queryLower.includes('documento') || queryLower.includes('comprova')) {
    return `Para comprovar suas deduções, você precisa:

• **Saúde**: Recibos com nome, CPF/CNPJ do prestador e valor
• **Educação**: Declaração da instituição de ensino
• **Previdência**: Informe de contribuições do plano
• **Aluguel**: Recibos ou contrato

💡 Dica: Você pode anexar os documentos diretamente aqui no sistema para organizá-los!`;
  }
  
  if (queryLower.includes('isent') || queryLower.includes('exempt')) {
    return `Rendimentos isentos comuns incluem:

• Rendimentos de poupança
• Lucros e dividendos recebidos
• Indenizações trabalhistas
• Bolsas de estudo
• Venda de imóvel residencial (se comprar outro em 180 dias)
• Aposentadoria por doença grave

Esses valores devem ser declarados na ficha "Rendimentos Isentos".`;
  }
  
  if (queryLower.includes('prazo') || queryLower.includes('deadline') || queryLower.includes('entrega')) {
    return `O prazo para entrega da declaração do IR ${taxYear + 1} geralmente vai de março a maio.

⚠️ Importante: 
- Verifique o calendário oficial da Receita Federal
- Quem entrega primeiro e tem restituição, recebe antes
- Multa por atraso: mínimo R$ 165,74`;
  }
  
  return `Entendi sua pergunta sobre "${query.slice(0, 30)}...".

Com base nos seus dados do ano ${taxYear}, posso ajudar você a:
1. Identificar despesas dedutíveis
2. Verificar documentos necessários  
3. Revisar categorias de rendimentos

O que gostaria de saber especificamente?`;
}

// Floating button to open the assistant
export function TaxAIAssistantButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40"
      size="icon"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
}
