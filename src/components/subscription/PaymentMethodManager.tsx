import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  onUpdate: () => void;
}

export const PaymentMethodManager = ({ paymentMethods, onUpdate }: PaymentMethodManagerProps) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAddPaymentMethod = async () => {
    if (!session) return;

    setLoading(true);
    try {
      // Get setup intent for adding new payment method
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { action: 'get_setup_intent' }
      });

      if (error) throw error;

      // Load Stripe.js dynamically
      const stripe = (window as any).Stripe;
      if (!stripe) {
        // Dynamically load Stripe.js if not already loaded
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const stripeInstance = (window as any).Stripe(process.env.NODE_ENV === 'production' 
        ? 'pk_live_your_live_key' 
        : 'pk_test_your_test_key');

      const { error: stripeError } = await stripeInstance.confirmCardSetup(
        data.client_secret,
        {
          payment_method: {
            card: await stripeInstance.elements().create('card').mount('#card-element'),
          }
        }
      );

      if (stripeError) throw stripeError;

      toast.success('Método de pagamento adicionado com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Erro ao adicionar método de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'update_payment_method',
          paymentMethodId 
        }
      });

      if (error) throw error;

      toast.success('Método de pagamento padrão atualizado!');
      onUpdate();
    } catch (error) {
      console.error('Error updating default payment method:', error);
      toast.error('Erro ao atualizar método de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return '💳';
    if (brandLower.includes('mastercard')) return '💳';
    if (brandLower.includes('amex')) return '💳';
    return '💳';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Métodos de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length > 0 ? (
          <>
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCardBrandIcon(method.brand)}</span>
                  <div>
                    <div className="font-medium">
                      {method.brand.toUpperCase()} •••• •••• •••• {method.last4}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expira em {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.is_default && (
                    <Badge variant="default">Padrão</Badge>
                  )}
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={loading}
                    >
                      Definir como padrão
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum método de pagamento cadastrado
          </div>
        )}

        <Button
          onClick={handleAddPaymentMethod}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {loading ? 'Adicionando...' : 'Adicionar Novo Cartão'}
        </Button>

        {/* Placeholder for Stripe Elements */}
        <div id="card-element" className="hidden"></div>
      </CardContent>
    </Card>
  );
};