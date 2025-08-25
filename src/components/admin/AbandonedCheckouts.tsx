import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, Mail, Phone, Calendar, DollarSign, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface CheckoutSession {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  selected_plan: string;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

const text = {
  pt: {
    title: 'Carrinhos Abandonados',
    loading: 'Carregando...',
    noCheckouts: 'Nenhum carrinho abandonado encontrado.',
    created: 'Criado',
    expires: 'Expira',
    contact: 'Contatar',
    whatsapp: 'WhatsApp',
    update: 'Atualizar',
    delete: 'Excluir',
    deleteSuccess: 'Carrinho excluído com sucesso',
    deleteError: 'Erro ao excluir carrinho',
    expired: 'Expirado',
    pendingVerification: 'Aguardando verificação',
    pendingPayment: 'Aguardando pagamento',
    sendEmail: 'Enviar Email',
    emailSent: 'Email enviado com sucesso',
    emailError: 'Erro ao enviar email',
    sendingEmail: 'Enviando...'
  },
  en: {
    title: 'Abandoned Checkouts',
    loading: 'Loading...',
    noCheckouts: 'No abandoned checkouts found.',
    created: 'Created',
    expires: 'Expires',
    contact: 'Contact',
    whatsapp: 'WhatsApp',
    update: 'Update',
    delete: 'Delete',
    deleteSuccess: 'Checkout deleted successfully',
    deleteError: 'Error deleting checkout',
    expired: 'Expired',
    pendingVerification: 'Awaiting verification',
    pendingPayment: 'Awaiting payment',
    sendEmail: 'Send Email',
    emailSent: 'Email sent successfully',
    emailError: 'Error sending email',
    sendingEmail: 'Sending...'
  },
  es: {
    title: 'Carritos Abandonados',
    loading: 'Cargando...',
    noCheckouts: 'No se encontraron carritos abandonados.',
    created: 'Creado',
    expires: 'Expira',
    contact: 'Contactar',
    whatsapp: 'WhatsApp',
    update: 'Actualizar',
    delete: 'Eliminar',
    deleteSuccess: 'Carrito eliminado exitosamente',
    deleteError: 'Error al eliminar carrito',
    expired: 'Expirado',
    pendingVerification: 'Esperando verificación',
    pendingPayment: 'Esperando pago',
    sendEmail: 'Enviar Email',
    emailSent: 'Email enviado exitosamente',
    emailError: 'Error al enviar email',
    sendingEmail: 'Enviando...'
  }
};

const AbandonedCheckouts = () => {
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = text[language as keyof typeof text] || text.pt;

  const fetchAbandonedCheckouts = async () => {
    try {
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select('*')
        .in('status', ['pending', 'payment_pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching abandoned checkouts:', error);
      toast({
        title: t.deleteError,
        description: t.deleteError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbandonedCheckouts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    if (isExpired(expiresAt)) {
      return <Badge variant="default" className="bg-red-500 text-white">{t.expired}</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t.pendingVerification}</Badge>;
      case 'payment_pending':
        return <Badge variant="outline">{t.pendingPayment}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const deleteCheckout = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('checkout_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: t.deleteSuccess,
        variant: "default",
      });
      
      fetchAbandonedCheckouts();
    } catch (error) {
      console.error('Error deleting checkout:', error);
      toast({
        title: t.deleteError,
        variant: "destructive",
      });
    }
  };

  const getPlanPrice = (plan: string) => {
    return plan === 'yearly' ? 'R$ 179,80/ano' : 'R$ 19,90/mês';
  };

  const sendAbandonedCartEmail = async (session: CheckoutSession) => {
    setSendingEmails(prev => new Set(prev).add(session.id));
    
    try {
      const { error } = await supabase.functions.invoke('send-abandoned-cart-email', {
        body: {
          customerName: session.full_name,
          customerEmail: session.email,
          selectedPlan: session.selected_plan,
          checkoutUrl: "https://elxttabdtddlavhseipz.lovableproject.com"
        }
      });

      if (error) throw error;

      toast({
        title: t.emailSent,
        description: `Email enviado para ${session.email}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error sending abandoned cart email:', error);
      toast({
        title: t.emailError,
        description: `Erro ao enviar email para ${session.email}`,
        variant: "destructive",
      });
    } finally {
      setSendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(session.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t.loading}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          {t.title} ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground">{t.noCheckouts}</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{session.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {session.email}
                    </div>
                    {session.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {session.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(session.status, session.expires_at)}
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      {getPlanPrice(session.selected_plan)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t.created}: {formatDate(session.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t.expires}: {formatDate(session.expires_at)}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`mailto:${session.email}`, '_blank')}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    {t.contact}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => sendAbandonedCartEmail(session)}
                    disabled={sendingEmails.has(session.id)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {sendingEmails.has(session.id) ? t.sendingEmail : t.sendEmail}
                  </Button>
                  {session.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${session.phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      {t.whatsapp}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => deleteCheckout(session.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t.delete}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4">
          <Button onClick={fetchAbandonedCheckouts} variant="outline" size="sm">
            {t.update}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AbandonedCheckouts;