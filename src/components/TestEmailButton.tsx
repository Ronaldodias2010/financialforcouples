import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

export default function TestEmailButton() {
  const [sending, setSending] = useState(false);

  const sendTestEmail = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          email: 'ronadias2010@gmail.com' // Usando seu email verificado
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("Email de teste enviado com sucesso para ronadias2010@gmail.com!");
      } else {
        throw new Error(data.error || "Erro ao enviar email");
      }
    } catch (error: any) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error(`Erro ao enviar email: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Button 
      onClick={sendTestEmail} 
      disabled={sending}
      variant="outline"
      className="gap-2"
    >
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      {sending ? "Enviando..." : "Testar Email"}
    </Button>
  );
}