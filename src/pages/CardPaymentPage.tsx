import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SmartCardPaymentForm } from "@/components/financial/SmartCardPaymentForm";

interface CardPaymentPageProps {
  onBack: () => void;
}

export const CardPaymentPage = ({ onBack }: CardPaymentPageProps) => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Sistema Inteligente de Pagamento de Cartão</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <SmartCardPaymentForm onPaymentSuccess={() => window.location.reload()} />
      </div>

      <div className="max-w-4xl mx-auto mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Como funciona o Sistema Inteligente:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-primary mb-2">🔍 Detecção Automática</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Busca gastos futuros relacionados ao cartão</li>
              <li>• Verifica pagamentos pendentes</li>
              <li>• Identifica valor mínimo do cartão</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-primary mb-2">⚡ Sincronização Inteligente</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Abate valor dos gastos futuros automaticamente</li>
              <li>• Atualiza limite disponível do cartão</li>
              <li>• Remove duplicações de pagamento</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-primary mb-2">📊 Status Inteligente</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• "Em Dia": Sem dívida ou totalmente pago</li>
              <li>• "Mínimo Pago": Pagou valor mínimo mensal</li>
              <li>• "Em Dívida": Não pagou valor mínimo</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-primary mb-2">💰 Integração Completa</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Aparece nas Despesas mensais</li>
              <li>• Impacta saldo das contas</li>
              <li>• Histórico unificado de pagamentos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};