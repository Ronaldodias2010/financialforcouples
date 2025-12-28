import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, MessageSquare, Loader2, Lock, AlertCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from '@/hooks/useSubscription';
import { AIHistorySection } from "./AIHistorySection";
import { EducationalContentSection } from "@/components/educational/EducationalContentSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpeech } from "@/hooks/useSpeech";

const AIRecommendationsContent = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice functionality
  const {
    isListening,
    isSpeaking,
    currentTranscript,
    capabilities,
    speak,
    toggleListening,
    toggleSpeaking
  } = useSpeech({
    onTranscription: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setChatMessage(text.trim());
      }
    },
    autoSpeak: true
  });

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;
    
    const userMessage = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-financial-consultant', {
        body: {
          message: userMessage,
          chatHistory: chatHistory
        }
      });

      if (error) {
        console.error('AI Consultant error:', error);
        
        // Handle specific error cases based on error code or message
        if (data?.error === 'AI_ACCESS_DENIED' || error.message === 'AI_ACCESS_DENIED') {
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            message: 'Acesso negado: Esta funcionalidade está disponível apenas para usuários Premium. Faça upgrade do seu plano para continuar.'
          }]);
        } else if (data?.error === 'DAILY_LIMIT_REACHED' || error.message === 'DAILY_LIMIT_REACHED') {
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            message: 'Limite diário de IA atingido. Você pode tentar novamente amanhã ou fazer upgrade do seu plano para ter mais acesso.'
          }]);
        } else if (data?.error === 'TOKEN_LIMIT_WOULD_EXCEED') {
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            message: `Esta consulta excederia seu limite diário de tokens. Tente uma pergunta mais curta ou aguarde até amanhã.`
          }]);
        } else if (data?.error === 'OPENAI_API_ERROR') {
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            message: 'Não foi possível processar sua solicitação no momento. Tente novamente em alguns minutos.'
          }]);
        } else {
          throw error;
        }
        return;
      }

      const aiResponse = data.response || 'Desculpe, não consegui processar sua solicitação.';
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        message: aiResponse
      }]);

      // Auto-speak the AI response if capabilities allow
      if (capabilities.speechSynthesis) {
        speak(aiResponse);
      }

      toast({
        title: "Análise concluída",
        description: "Sua consulta foi processada pela IA.",
      });

    } catch (error) {
      console.error('Error calling AI consultant:', error);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        message: 'Desculpe, ocorreu um erro ao processar sua consulta. Tente novamente.'
      }]);
      
      toast({
        title: "Erro na consulta",
        description: "Não foi possível processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">{t('aiRecommendations.title')}</h2>
        </div>
        <p className="text-muted-foreground">
          {t('aiRecommendations.subtitle')}
        </p>
      </div>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('aiRecommendations.aiConsultant')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat History */}
            <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/30">
              {chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                  <p className="text-yellow-500 font-medium">{t('aiRecommendations.askAnything')}</p>
                  <p className="text-sm text-yellow-500">{t('aiRecommendations.exampleQuestion')}</p>
                </div>
              ) : (
                chatHistory.map((chat, index) => (
                  <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      chat.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {chat.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="space-y-2">
              {/* Voice Status */}
              {(isListening || currentTranscript) && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-primary font-medium">
                      {isListening ? t('voice.listening') : t('voice.processing')}
                    </span>
                  </div>
                  {currentTranscript && (
                    <span className="text-muted-foreground">"{currentTranscript}"</span>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Textarea
                  placeholder={t('aiRecommendations.typePlaceholder')}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="flex-1 min-h-[40px] max-h-[120px]"
                />
                
                {/* Voice Input Button */}
                {capabilities.speechRecognition && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={cn(
                      "transition-colors",
                      isListening && "bg-red-500 hover:bg-red-600 text-white"
                    )}
                    title={isListening ? t('voice.stopMic') : t('voice.micButton')}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {/* Voice Output Button */}
                {capabilities.speechSynthesis && chatHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSpeaking}
                    disabled={isLoading}
                    className={cn(
                      "transition-colors",
                      isSpeaking && "bg-blue-500 hover:bg-blue-600 text-white"
                    )}
                    title={isSpeaking ? t('voice.stopSpeech') : t('voice.speakResponse')}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <Button onClick={handleSendMessage} disabled={!chatMessage.trim() || isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <AIHistorySection />

      {/* Educational Content */}
      <EducationalContentSection />
    </div>
  );
};

const PremiumUpgradeFallback = () => {
  const { language } = useLanguage();
  const { hasAccess } = useSubscription();
  
  const translations = {
    pt: {
      title: 'IA Disponível Apenas para Premium',
      message: 'A funcionalidade de IA está disponível apenas para usuários Premium. Faça upgrade do seu plano para ter acesso ao consultor financeiro com IA.',
      upgradeButton: 'Fazer Upgrade'
    },
    en: {
      title: 'AI Available for Premium Only',
      message: 'AI functionality is available only for Premium users. Upgrade your plan to access the AI financial consultant.',
      upgradeButton: 'Upgrade Plan'
    },
    es: {
      title: 'IA Disponible Solo para Premium',
      message: 'La funcionalidad de IA está disponible solo para usuarios Premium. Actualiza tu plan para acceder al consultor financiero con IA.',
      upgradeButton: 'Actualizar Plan'
    }
  };

  const text = translations[language as keyof typeof translations] || translations.pt;
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-8 pb-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Brain className="h-16 w-16 text-muted-foreground" />
                <Lock className="h-6 w-6 text-destructive absolute -top-1 -right-1" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">{text.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {text.message}
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Essential users do not have access to AI features
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AIRecommendations = () => {
  const { hasAccess } = useSubscription();
  
  console.log('🤖 [AI RECOMMENDATIONS] Checking access for aiRecommendations feature');
  
  if (!hasAccess('aiRecommendations')) {
    console.log('❌ [AI RECOMMENDATIONS] Access denied - showing fallback');
    return <PremiumUpgradeFallback />;
  }
  
  console.log('✅ [AI RECOMMENDATIONS] Access granted - showing content');
  return <AIRecommendationsContent />;
};
