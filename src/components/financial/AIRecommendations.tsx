import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Download, Brain, BookOpen, MessageSquare, TrendingUp, PieChart, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const AIRecommendations = () => {
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
          <h2 className="text-3xl font-bold">{t('nav.aiRecommendations')}</h2>
        </div>
        <p className="text-muted-foreground">
          Análise inteligente das suas finanças e recomendações personalizadas
        </p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">De:</span>
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
                    {dateFrom ? format(dateFrom, "PPP", { locale: getDateLocale() }) : "Selecionar data"}
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
              <span className="text-sm font-medium">Até:</span>
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
                    {dateTo ? format(dateTo, "PPP", { locale: getDateLocale() }) : "Selecionar data"}
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
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Extração completa do fluxo de caixa consolidado
            </p>
            <Button 
              onClick={() => handleExportData('cashflow')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              Gastos Consolidados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Relatório detalhado de todas as despesas
            </p>
            <Button 
              onClick={() => handleExportData('expenses')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Receitas Consolidadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Compilado de todas as receitas do período
            </p>
            <Button 
              onClick={() => handleExportData('income')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Imposto de Renda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Dados organizados para declaração do IR
            </p>
            <Button 
              onClick={() => handleExportData('taxes')} 
              className="w-full"
              disabled={!dateFrom || !dateTo}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Consultor Financeiro IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat History */}
            <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/30">
              {chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Pergunte qualquer coisa sobre suas finanças!</p>
                  <p className="text-sm">Ex: "Como está meu orçamento este mês?"</p>
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
                placeholder="Digite sua pergunta sobre finanças..."
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

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Conteúdo Educacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">📊 Planejamento Financeiro</h4>
              <p className="text-sm text-muted-foreground">
                Aprenda a criar um orçamento eficiente e alcançar suas metas financeiras.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">💰 Investimentos Básicos</h4>
              <p className="text-sm text-muted-foreground">
                Guia completo para iniciantes em investimentos e diversificação.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">🏠 Reserva de Emergência</h4>
              <p className="text-sm text-muted-foreground">
                Como construir e manter uma reserva de emergência sólida.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h4 className="font-semibold mb-2">📈 Análise de Gastos</h4>
              <p className="text-sm text-muted-foreground">
                Técnicas para identificar e otimizar seus padrões de gastos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};