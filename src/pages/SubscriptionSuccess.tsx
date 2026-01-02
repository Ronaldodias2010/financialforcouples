import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/utils/analytics";

const SubscriptionSuccess = () => {
  const { checkSubscription } = useSubscription();
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Pagamento concluído - Couples Financials";

    let mounted = true;
    const run = async () => {
      try {
        await checkSubscription();
        
        // Track purchase conversion for Google Ads
        const transactionId = session?.user?.id || `purchase_${Date.now()}`;
        trackPurchase(transactionId, 25.90, 'BRL'); // Default BRL price
        
        // Send welcome email after successful subscription
        try {
          await supabase.functions.invoke('send-premium-welcome', {
            body: {
              type: 'welcome',
              user_email: session?.user?.email || '',
              language: 'pt', // Could be enhanced to detect user language
              subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default 1 year
            }
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
        }
      } catch (e) {
        console.error("Erro ao atualizar assinatura após checkout:", e);
      } finally {
        if (mounted) navigate("/app", { replace: true });
      }
    };
    run();

    return () => {
      mounted = false;
    };
  }, [checkSubscription, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <h1 className="text-xl font-semibold">Pagamento confirmado</h1>
        <p className="text-muted-foreground">Redirecionando para o painel...</p>
      </section>
    </main>
  );
};

export default SubscriptionSuccess;
