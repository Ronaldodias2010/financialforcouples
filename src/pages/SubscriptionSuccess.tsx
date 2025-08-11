import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const SubscriptionSuccess = () => {
  const { checkSubscription } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Pagamento concluído - Couples Financials";

    let mounted = true;
    const run = async () => {
      try {
        await checkSubscription();
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
