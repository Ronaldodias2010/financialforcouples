import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Download, Brain, BookOpen, MessageSquare, TrendingUp, PieChart, Receipt, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PremiumFeatureGuard } from "@/components/subscription/PremiumFeatureGuard";
import { AIHistorySection } from "./AIHistorySection";

const AIRecommendationsContent = () => {
  const { t, language } = useLanguage();
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);

  const getDateLocale = () => {
    switch (language) {
      case 'pt': return ptBR;
      case 'es': return es;
      default: return enUS;
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', message: chatMessage }]);
    // Simulated AI response for now
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        message: "Esta é uma resposta simulada da IA. Aqui será integrada a análise real das suas finanças." 
      }]);
    }, 1000);
    setChatMessage("");
  };

  const handleExportData = (type: string) => {
    // Placeholder for export functionality
    console.log(`Exporting ${type} data from ${dateFrom} to ${dateTo}`);
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

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('aiRecommendations.analysisPanel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('aiRecommendations.from')}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP", { locale: getDateLocale() }) : t('aiRecommendations.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('aiRecommendations.to')}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP", { locale: getDateLocale() }) : t('aiRecommendations.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Extraction Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              {t('aiRecommendations.cashflow')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('aiRecommendations.cashflowDesc')}
            </p>
            <Button 
              onClick={() => handleExportData('cashflow')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('aiRecommendations.export')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              {t('aiRecommendations.expensesConsolidated')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('aiRecommendations.expensesDesc')}
            </p>
            <Button 
              onClick={() => handleExportData('expenses')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('aiRecommendations.export')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              {t('aiRecommendations.incomeConsolidated')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('aiRecommendations.incomeDesc')}
            </p>
            <Button 
              onClick={() => handleExportData('income')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('aiRecommendations.export')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              {t('aiRecommendations.taxReport')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('aiRecommendations.taxDesc')}
            </p>
            <Button 
              onClick={() => handleExportData('taxes')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('aiRecommendations.export')}
            </Button>
          </CardContent>
        </Card>
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
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('aiRecommendations.askAnything')}</p>
                  <p className="text-sm">{t('aiRecommendations.exampleQuestion')}</p>
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
            <div className="flex gap-2">
              <Textarea
                placeholder={t('aiRecommendations.typePlaceholder')}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                className="flex-1 min-h-[40px] max-h-[120px]"
              />
              <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <AIHistorySection />

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('aiRecommendations.educationalContent')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">📊 {t('aiRecommendations.planning')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('aiRecommendations.planningDesc')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">💰 {t('aiRecommendations.investments')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('aiRecommendations.investmentsDesc')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">🏠 {t('aiRecommendations.emergency')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('aiRecommendations.emergencyDesc')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">📈 {t('aiRecommendations.analysis')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('aiRecommendations.analysisDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PremiumUpgradeFallback = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-8 pb-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Brain className="h-16 w-16 text-primary" />
                <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">{t('aiRecommendations.premiumTitle')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('aiRecommendations.premiumMessage')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AIRecommendations = () => {
  return (
    <PremiumFeatureGuard 
      feature="aiPlanning"
      fallback={<PremiumUpgradeFallback />}
    >
      <AIRecommendationsContent />
    </PremiumFeatureGuard>
  );
};