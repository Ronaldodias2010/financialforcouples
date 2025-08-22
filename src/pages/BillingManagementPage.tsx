import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Calendar, Receipt, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import { PaymentMethodManager } from "@/components/subscription/PaymentMethodManager";

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  description: string;
  type: 'charge' | 'subscription';
  payment_method?: {
    brand: string;
    last4: string;
  };
  invoice_number?: string;
  period?: {
    start: string;
    end: string;
  };
}

interface BillingDetails {
  subscribed: boolean;
  renewal_date?: string;
  subscription_id?: string;
  cancel_at_period_end?: boolean;
  plan?: {
    amount: number;
    interval: string;
    currency: string;
  };
  card?: {
    brand: string;
    last4: string;
  };
  payment_methods?: Array<{
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
  }>;
}

interface BillingManagementPageProps {
  onBack: () => void;
}

export const BillingManagementPage = ({ onBack }: BillingManagementPageProps) => {
  const { user, session } = useAuth();
  const { subscribed, subscriptionTier, subscriptionEnd, openCustomerPortal } = useSubscription();
  const { t, language } = useLanguage();
  
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (user && session) {
      fetchBillingData();
    }
  }, [user, session]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch billing details
      const { data: billing, error: billingError } = await supabase.functions.invoke(
        'get-billing-details',
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (billingError) throw billingError;
      setBillingDetails(billing);

      // Fetch payment history
      const { data: history, error: historyError } = await supabase.functions.invoke(
        'get-payment-history',
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (historyError) throw historyError;
      setPaymentHistory(history?.payments || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Erro ao carregar dados de faturamento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setOpeningPortal(true);
    try {
      await openCustomerPortal();
      toast.success('Redirecionando para o portal do cliente...');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal do cliente');
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'download_invoice',
          invoiceId 
        }
      });

      if (error) throw error;

      // Open PDF in new tab
      window.open(data.download_url, '_blank');
      toast.success('Fatura baixada com sucesso!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Erro ao baixar fatura');
    }
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'pt' ? 'pt-BR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMoney = (amount: number, currency: string = 'BRL') => {
    const locale = language === 'pt' ? 'pt-BR' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency.toUpperCase() 
      }).format(amount);
    } catch {
      return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(amount);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return '💳';
    if (brandLower.includes('mastercard')) return '💳';
    if (brandLower.includes('amex')) return '💳';
    return '💳';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Carregando dados de faturamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Gerenciar Assinatura</h2>
      </div>

      {/* Current Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscribed ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Plano Premium</div>
                  <div className="text-sm text-muted-foreground">
                    {billingDetails?.plan && (
                      `${formatMoney(billingDetails.plan.amount, billingDetails.plan.currency)} / ${
                        billingDetails.plan.interval === 'year' ? 'ano' : 'mês'
                      }`
                    )}
                  </div>
                </div>
                <Badge variant="default" className="bg-primary">Ativo</Badge>
              </div>
              
              {subscriptionEnd && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Próximo pagamento: {formatDate(subscriptionEnd)}</span>
                </div>
              )}

              {billingDetails?.card && (
                <div className="flex items-center gap-2 text-sm">
                  <span>{getCardBrandIcon(billingDetails.card.brand)}</span>
                  <span>
                    {billingDetails.card.brand.toUpperCase()} •••• •••• •••• {billingDetails.card.last4}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <SubscriptionManager
                  subscriptionId={billingDetails?.subscription_id}
                  currentPlan={{
                    name: "Premium",
                    amount: billingDetails?.plan?.amount || 0,
                    interval: billingDetails?.plan?.interval || 'month',
                    currency: billingDetails?.plan?.currency || 'BRL'
                  }}
                  isCancelled={billingDetails?.cancel_at_period_end}
                  onUpdate={fetchBillingData}
                />
                
                <PaymentMethodManager
                  paymentMethods={billingDetails?.payment_methods || []}
                  onUpdate={fetchBillingData}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-muted-foreground">Nenhuma assinatura ativa</div>
              <Badge variant="outline" className="mt-2">Plano Essencial</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.map((payment, index) => (
                <div key={payment.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <div className="font-medium">{payment.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(payment.date)}
                        {payment.invoice_number && (
                          <span className="ml-2">• Fatura #{payment.invoice_number}</span>
                        )}
                      </div>
                      {payment.period && (
                        <div className="text-xs text-muted-foreground">
                          Período: {formatDate(payment.period.start)} - {formatDate(payment.period.end)}
                        </div>
                      )}
                      {payment.payment_method && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <span>{getCardBrandIcon(payment.payment_method.brand)}</span>
                          <span>
                            {payment.payment_method.brand.toUpperCase()} •••• {payment.payment_method.last4}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatMoney(payment.amount, payment.currency)}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                        {payment.invoice_number && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment.id)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < paymentHistory.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};