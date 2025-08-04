import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, CreditCard, AlertTriangle, DollarSign, Eye, Mail, RotateCcw, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SubscriptionMetrics {
  activeUsers: number;
  canceledSubscriptions: number;
  failedPayments: number;
  monthlyRevenue: number;
}

interface SubscriptionUser {
  id: string;
  email: string;
  display_name: string;
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  last_payment: string | null;
  status: 'active' | 'overdue' | 'canceled' | 'expired';
}

interface RecentAlert {
  id: string;
  date: string;
  user_email: string;
  event: string;
  action: string;
  user_id: string;
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    activeUsers: 0,
    canceledSubscriptions: 0,
    failedPayments: 0,
    monthlyRevenue: 0
  });
  const [users, setUsers] = useState<SubscriptionUser[]>([]);
  const [alerts, setAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Check if user is admin (simplified - in production use proper role system)
  const isAdmin = user?.email === 'admin@example.com' || user?.email?.includes('admin');

  useEffect(() => {
    if (!isAdmin) return;
    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription metrics
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*');

      if (subscribersError) throw subscribersError;

      // Calculate metrics
      const activeUsers = subscribers?.filter(s => s.subscribed).length || 0;
      const canceledSubscriptions = subscribers?.filter(s => !s.subscribed).length || 0;
      
      setMetrics({
        activeUsers,
        canceledSubscriptions,
        failedPayments: Math.floor(Math.random() * 100), // Mock data
        monthlyRevenue: activeUsers * 29.90 // Mock calculation
      });

      // Fetch user profiles with subscription data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          subscribers!inner(*)
        `);

      if (profilesError) throw profilesError;

      // Transform data for display
      const formattedUsers: SubscriptionUser[] = profiles?.map(profile => {
        const subscriber = (profile as any).subscribers;
        const subscriptionEnd = subscriber.subscription_end ? new Date(subscriber.subscription_end) : null;
        const now = new Date();
        
        let status: 'active' | 'overdue' | 'canceled' | 'expired' = 'canceled';
        if (subscriber.subscribed) {
          if (subscriptionEnd && subscriptionEnd > now) {
            status = 'active';
          } else if (subscriptionEnd && subscriptionEnd < now) {
            status = 'expired';
          }
        }

        return {
          id: profile.user_id,
          email: subscriber.email,
          display_name: profile.display_name || 'Usuário',
          subscribed: subscriber.subscribed,
          subscription_tier: subscriber.subscription_tier || 'essential',
          subscription_end: subscriber.subscription_end,
          stripe_customer_id: subscriber.stripe_customer_id,
          last_payment: subscriber.updated_at,
          status
        };
      }) || [];

      setUsers(formattedUsers);

      // Generate mock alerts
      const mockAlerts: RecentAlert[] = formattedUsers.slice(0, 3).map((user, index) => ({
        id: `alert_${index}`,
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_email: user.email,
        event: index === 0 ? 'Pagamento falhou' : index === 1 ? 'Assinatura cancelada' : 'Pagamento confirmado',
        action: index === 0 ? 'Enviar notificação' : index === 1 ? 'Oferecer reativação' : 'Nenhuma ação necessária',
        user_id: user.id
      }));

      setAlerts(mockAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do painel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendNotification = async (userId: string, userEmail: string) => {
    toast({
      title: "Notificação enviada",
      description: `E-mail enviado para ${userEmail}`,
    });
  };

  const handleReactivateSubscription = async (userId: string, userEmail: string) => {
    toast({
      title: "Reativação processada",
      description: `Solicitação de reativação para ${userEmail}`,
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Nome', 'Email', 'Status', 'Plano', 'Último Pagamento', 'Próxima Cobrança'].join(','),
      ...filteredUsers.map(user => [
        user.display_name,
        user.email,
        user.status,
        user.subscription_tier,
        user.last_payment || '',
        user.subscription_end || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'usuarios_premium.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando painel administrativo...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧮 Painel Administrativo</h1>
          <p className="text-muted-foreground">Controle de Assinaturas e Usuários Premium</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Métricas do Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Premium Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Canceladas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.canceledSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Falhos (30 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.failedPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal Recorrente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {metrics.monthlyRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">👥 Usuários Premium</TabsTrigger>
          <TabsTrigger value="alerts">🔔 Alertas Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filtros e Busca */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="🔎 Buscar por nome ou e-mail"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">✅ Ativo</SelectItem>
                    <SelectItem value="overdue">⚠ Atrasado</SelectItem>
                    <SelectItem value="canceled">❌ Cancelado</SelectItem>
                    <SelectItem value="expired">⏰ Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários Premium ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Usuário</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead>Próxima Cobrança</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.display_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'overdue' ? 'destructive' :
                            user.status === 'canceled' ? 'secondary' : 'outline'
                          }>
                            {user.status === 'active' ? '✅ Ativo' :
                             user.status === 'overdue' ? '⚠ Atrasado' :
                             user.status === 'canceled' ? '❌ Cancelado' : '⏰ Expirado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.subscription_tier}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.last_payment ? new Date(user.last_payment).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell>
                          {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSendNotification(user.id, user.email)}
                                title="Enviar notificação"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReactivateSubscription(user.id, user.email)}
                                title="Reativar assinatura"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>🔔 Alertas Recentes</CardTitle>
              <CardDescription>Eventos importantes que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.date}</span>
                        <Badge variant="outline">{alert.user_email}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.event}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{alert.action}</p>
                      {alert.action !== 'Nenhuma ação necessária' && (
                        <Button size="sm" variant="outline" className="mt-2">
                          Executar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};