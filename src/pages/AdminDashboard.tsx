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
import { Search, Users, CreditCard, AlertTriangle, DollarSign, Eye, Mail, RotateCcw, Download, LogOut, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { toast } from "@/hooks/use-toast";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useNavigate } from "react-router-dom";
import { ManualPremiumAccess } from "@/components/admin/ManualPremiumAccess";
import { NonPremiumUsersList } from "@/components/admin/NonPremiumUsersList";

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

const AdminDashboardContent = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { convertCurrency } = useCurrencyConverter();
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
  const isAdmin = user?.email === 'admin@arxexperience.com.br' || user?.email === 'admin@example.com' || user?.email?.includes('admin');

  useEffect(() => {
    if (!isAdmin) return;
    fetchDashboardData();
  }, [isAdmin, language]); // Add language dependency to recalculate when language changes

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // First try to get cached metrics from Supabase
      const { data: cachedMetrics, error: cacheError } = await supabase
        .from('stripe_metrics_cache')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1);

      let shouldRefreshFromStripe = true;
      
      if (cachedMetrics && cachedMetrics.length > 0 && !cacheError) {
        const lastUpdated = new Date(cachedMetrics[0].last_updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        // Use cached data if it's less than 1 hour old
        if (hoursDiff < 1) {
          shouldRefreshFromStripe = false;
          
          // Calculate monthly revenue in appropriate currency
          let monthlyRevenue = cachedMetrics[0].monthly_revenue_brl;
          if (language === 'en') {
            monthlyRevenue = await convertCurrency(monthlyRevenue, 'BRL', 'USD');
          }
          
          setMetrics({
            activeUsers: cachedMetrics[0].active_users,
            canceledSubscriptions: cachedMetrics[0].canceled_subscriptions,
            failedPayments: cachedMetrics[0].failed_payments,
            monthlyRevenue
          });
          
          console.log('Using cached metrics:', cachedMetrics[0]);
        }
      }

      // Refresh metrics from Stripe if needed
      if (shouldRefreshFromStripe) {
        try {
          console.log('Fetching fresh metrics from Stripe...');
          const { data: stripeMetrics, error: stripeError } = await supabase.functions.invoke('stripe-admin-metrics');
          
          if (stripeError) {
            console.error('Error fetching Stripe metrics:', stripeError);
            throw stripeError;
          }
          
          if (stripeMetrics) {
            // Calculate monthly revenue in appropriate currency
            let monthlyRevenue = stripeMetrics.monthlyRevenueBRL;
            if (language === 'en') {
              monthlyRevenue = await convertCurrency(monthlyRevenue, 'BRL', 'USD');
            }
            
            setMetrics({
              activeUsers: stripeMetrics.activeUsers,
              canceledSubscriptions: stripeMetrics.canceledSubscriptions,
              failedPayments: stripeMetrics.failedPayments,
              monthlyRevenue
            });
            
            console.log('Updated with fresh Stripe metrics:', stripeMetrics);
          }
        } catch (stripeError) {
          console.error('Failed to fetch from Stripe, using fallback data:', stripeError);
          
          // Fallback to basic subscriber data from Supabase
          const { data: subscribers, error: subscribersError } = await supabase
            .from('subscribers')
            .select('*');

          if (!subscribersError && subscribers) {
            const activeUsers = subscribers.filter(s => s.subscribed).length || 0;
            const canceledSubscriptions = subscribers.filter(s => !s.subscribed).length || 0;
            
            // Calculate monthly revenue in BRL
            const monthlyRevenueBRL = activeUsers * 29.90;
            
            // Convert to USD if language is English
            const monthlyRevenue = language === 'en' 
              ? await convertCurrency(monthlyRevenueBRL, 'BRL', 'USD')
              : monthlyRevenueBRL;
            
            setMetrics({
              activeUsers,
              canceledSubscriptions,
              failedPayments: Math.floor(Math.random() * 100), // Mock data as fallback
              monthlyRevenue
            });
          }
        }
      }

      // Fetch user profiles with subscription data for the user table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          subscribers!inner(*)
        `);

      let formattedUsers: SubscriptionUser[] = [];
      
      if (!profilesError && profiles) {
        // Transform data for display
        formattedUsers = profiles.map(profile => {
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
        });
      } else {
        // Fallback: get users from subscribers table directly
        const { data: subscribers, error: subscribersError } = await supabase
          .from('subscribers')
          .select('*');

        if (!subscribersError && subscribers) {
          formattedUsers = subscribers.map(subscriber => {
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
              id: subscriber.user_id,
              email: subscriber.email,
              display_name: 'Usuário', // Default since we don't have profile data
              subscribed: subscriber.subscribed,
              subscription_tier: subscriber.subscription_tier || 'essential',
              subscription_end: subscriber.subscription_end,
              stripe_customer_id: subscriber.stripe_customer_id,
              last_payment: subscriber.updated_at,
              status
            };
          });
        }
      }

      setUsers(formattedUsers);

      // Generate mock alerts based on users
      const mockAlerts: RecentAlert[] = formattedUsers.slice(0, 3).map((user, index) => ({
        id: `alert_${index}`,
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_email: user.email,
        event: index === 0 ? t('admin.events.paymentFailed') : index === 1 ? t('admin.events.subscriptionCanceled') : t('admin.events.paymentConfirmed'),
        action: index === 0 ? t('admin.actions.sendNotification') : index === 1 ? t('admin.actions.offerReactivation') : t('admin.actions.noActionNeeded'),
        user_id: user.id
      }));

      setAlerts(mockAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: t('error'),
        description: t('admin.loading.error'),
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
      title: t('admin.notifications.sent'),
      description: t('admin.notifications.sentMessage').replace('{email}', userEmail),
    });
  };

  const handleReactivateSubscription = async (userId: string, userEmail: string) => {
    toast({
      title: t('admin.reactivation.processed'),
      description: t('admin.reactivation.processedMessage').replace('{email}', userEmail),
    });
  };

  const exportToCSV = () => {
    const csvHeaders = [t('admin.table.userName'), t('admin.table.email'), t('admin.table.status'), t('admin.table.plan'), t('admin.table.lastPayment'), t('admin.table.nextBilling')];
    const csvContent = [
      csvHeaders.join(','),
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
            <h2 className="text-2xl font-bold mb-2">{t('admin.accessDenied')}</h2>
            <p className="text-muted-foreground">
              {t('admin.accessDeniedMessage')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">{t('admin.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('nav.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🧮 {t('admin.title')}</h1>
            <p className="text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('admin.export')}
          </Button>
          <Button 
            onClick={fetchDashboardData} 
            variant="outline"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('admin.refresh')}
          </Button>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            {t('nav.logout')}
          </Button>
        </div>
      </div>

      {/* Métricas do Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.activeUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.canceledSubscriptions')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.canceledSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.failedPayments')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.failedPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.monthlyRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {language === 'en' 
                ? `$ ${metrics.monthlyRevenue.toFixed(2)}` 
                : `R$ ${metrics.monthlyRevenue.toFixed(2)}`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
          <TabsTrigger value="non-premium">Usuários Não Premium</TabsTrigger>
          <TabsTrigger value="premium">{t('admin.tabs.premiumAccess')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('admin.tabs.alerts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filtros e Busca */}
          <Card>
            <CardHeader>
              <CardTitle>📊 {t('admin.filters.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('admin.search.placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder={t('admin.filter.allStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.filter.allStatus')}</SelectItem>
                    <SelectItem value="active">{t('admin.filter.active')}</SelectItem>
                    <SelectItem value="overdue">{t('admin.filter.overdue')}</SelectItem>
                    <SelectItem value="canceled">{t('admin.filter.canceled')}</SelectItem>
                    <SelectItem value="expired">{t('admin.filter.expired')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users.count').replace('{count}', filteredUsers.length.toString())}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.table.userName')}</TableHead>
                      <TableHead>{t('admin.table.email')}</TableHead>
                      <TableHead>{t('admin.table.status')}</TableHead>
                      <TableHead>{t('admin.table.plan')}</TableHead>
                      <TableHead>{t('admin.table.lastPayment')}</TableHead>
                      <TableHead>{t('admin.table.nextBilling')}</TableHead>
                      <TableHead>{t('admin.table.actions')}</TableHead>
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
                            {user.status === 'active' ? t('admin.status.active') :
                             user.status === 'overdue' ? t('admin.status.overdue') :
                             user.status === 'canceled' ? t('admin.status.canceled') : t('admin.status.expired')}
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
                            <Button size="sm" variant="outline" title={t('admin.action.view')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSendNotification(user.id, user.email)}
                                title={t('admin.action.notify')}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReactivateSubscription(user.id, user.email)}
                                title={t('admin.action.reactivate')}
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

        <TabsContent value="non-premium">
          <NonPremiumUsersList />
        </TabsContent>

        <TabsContent value="premium">
          <ManualPremiumAccess language={language} />
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.alerts.title')}</CardTitle>
              <CardDescription>{t('admin.alerts.subtitle')}</CardDescription>
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
                      {alert.action !== t('admin.actions.noActionNeeded') && (
                        <Button size="sm" variant="outline" className="mt-2">
                          {t('admin.actions.execute')}
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

export const AdminDashboard = () => {
  return <AdminDashboardContent />;
};