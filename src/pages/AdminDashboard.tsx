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
import { Search, Users, CreditCard, AlertTriangle, DollarSign, Eye, Mail, RotateCcw, Download, LogOut, ArrowLeft, Crown, UserCheck, FileSpreadsheet, FileText } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { toast } from "@/hooks/use-toast";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useNavigate } from "react-router-dom";
import { ManualPremiumAccess } from "@/components/admin/ManualPremiumAccess";
import { NonPremiumUsersList } from "@/components/admin/NonPremiumUsersList";
import AbandonedCheckouts from "@/components/admin/AbandonedCheckouts";
import { EducationalContentManager } from "@/components/admin/EducationalContentManager";
import { AIControlSection } from '@/components/admin/AIControlSection';


interface SubscriptionMetrics {
  activeUsers: number;
  canceledSubscriptions: number;
  failedPayments: number;
  monthlyRevenue: number;
  annualRevenue: number;
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
  isCoupled?: boolean;
  partnerName?: string;
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
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { convertCurrency } = useCurrencyConverter();
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    activeUsers: 0,
    canceledSubscriptions: 0,
    failedPayments: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
  });
  const [users, setUsers] = useState<SubscriptionUser[]>([]);
  const [alerts, setAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activeUsersSubTab, setActiveUsersSubTab] = useState("users");
  const [activeAISubTab, setActiveAISubTab] = useState("overview");

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
          
          // Calculate monthly/annual revenue in appropriate currency
          let monthlyRevenue = cachedMetrics[0].monthly_revenue_brl || 0;
          let annualRevenue = cachedMetrics[0].annual_revenue_brl || 0;
          if (language === 'en' || language === 'es') {
            monthlyRevenue = convertCurrency(monthlyRevenue, 'BRL', 'USD');
            annualRevenue = convertCurrency(annualRevenue, 'BRL', 'USD');
          }
          
          setMetrics({
            activeUsers: cachedMetrics[0].active_users,
            canceledSubscriptions: cachedMetrics[0].canceled_subscriptions,
            failedPayments: cachedMetrics[0].failed_payments,
            monthlyRevenue,
            annualRevenue,
          });
          
          console.log('Using cached metrics:', cachedMetrics[0]);
        }
      }

      // Refresh metrics from Stripe if needed
      if (shouldRefreshFromStripe) {
        try {
          console.log('Fetching fresh metrics from Stripe...');
          const { data: stripeMetrics, error: stripeError } = await supabase.functions.invoke('stripe-admin-metrics', {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          });
          
          if (stripeError) {
            console.error('Error fetching Stripe metrics:', stripeError);
            throw stripeError;
          }
          
          if (stripeMetrics) {
            // Calculate monthly/annual revenue in appropriate currency
            let monthlyRevenue = stripeMetrics.monthlyRevenueBRL || 0;
            let annualRevenue = stripeMetrics.annualRevenueBRL || 0;
            if (language === 'en' || language === 'es') {
              monthlyRevenue = convertCurrency(monthlyRevenue, 'BRL', 'USD');
              annualRevenue = convertCurrency(annualRevenue, 'BRL', 'USD');
            }
            
            setMetrics({
              activeUsers: stripeMetrics.activeUsers,
              canceledSubscriptions: stripeMetrics.canceledSubscriptions,
              failedPayments: stripeMetrics.failedPayments,
              monthlyRevenue,
              annualRevenue,
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
            const monthlyRevenueBRL = activeUsers * 19.90;
            
            // Convert to USD if language is English or Spanish
            const monthlyRevenue = (language === 'en' || language === 'es')
              ? convertCurrency(monthlyRevenueBRL, 'BRL', 'USD')
              : monthlyRevenueBRL;
            
            setMetrics({
              activeUsers,
              canceledSubscriptions,
              failedPayments: Math.floor(Math.random() * 100), // Mock data as fallback
              monthlyRevenue,
              annualRevenue: 0,
            });
          }
        }
      }

      // Fetch ONLY premium AND subscribed users
      console.log('🔍 Fetching premium users...');
      const { data: premiumSubscribers, error: profilesError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscription_tier', 'premium')
        .eq('subscribed', true);
      
      console.log('📊 Premium subscribers result:', { data: premiumSubscribers, error: profilesError });

      let formattedUsers: SubscriptionUser[] = [];
      
      if (!profilesError && premiumSubscribers) {
        console.log('📝 Raw premium subscribers data:', premiumSubscribers);
        
        // Buscar profiles dos usuários premium
        const userIds = premiumSubscribers.map(sub => sub.user_id);
        console.log('👥 User IDs to fetch profiles for:', userIds);
        
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: fetchedProfiles, error: profilesFetchError } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', userIds);

          if (profilesFetchError) {
            console.error('❌ Error fetching profiles:', profilesFetchError);
          } else {
            profilesData = fetchedProfiles || [];
          }
        }
        
        console.log('👤 Profiles data:', profilesData);
        
        // Combine data and check for couples
        formattedUsers = await Promise.all(premiumSubscribers.map(async (subscriber) => {
          const profile = profilesData.find(p => p.user_id === subscriber.user_id);
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

          // Check for couple connection
          const { data: coupleData } = await supabase
            .from('user_couples')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${subscriber.user_id},user2_id.eq.${subscriber.user_id}`)
            .eq('status', 'active')
            .maybeSingle();

          let isCoupled = false;
          let partnerName = '';
          
          if (coupleData) {
            isCoupled = true;
            const partnerId = coupleData.user1_id === subscriber.user_id ? 
              coupleData.user2_id : coupleData.user1_id;
            
            const { data: partnerProfile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', partnerId)
              .maybeSingle();
            
            partnerName = partnerProfile?.display_name || 'Parceiro';
          }

          const formattedUser = {
            id: subscriber.user_id,
            email: subscriber.email,
            display_name: profile?.display_name || subscriber.email?.split('@')[0] || 'Usuário',
            subscribed: subscriber.subscribed,
            subscription_tier: subscriber.subscription_tier || 'premium',
            subscription_end: subscriber.subscription_end,
            stripe_customer_id: subscriber.stripe_customer_id,
            last_payment: subscriber.updated_at,
            status,
            isCoupled,
            partnerName
          };
          
          console.log('✨ Formatted premium user:', formattedUser);
          return formattedUser;
        }));
        
        console.log('✅ Formatted premium users with names:', formattedUsers);
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

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Contextual export functions
  const exportOverviewMetrics = () => {
    const currencySymbol = (language === 'en' || language === 'es') ? '$' : 'R$';
    
    const metricsData = [
      [t('admin.export.metricColumn'), t('admin.export.valueColumn')],
      [t('admin.metrics.activeUsers'), metrics.activeUsers.toString()],
      [t('admin.metrics.canceledSubscriptions'), metrics.canceledSubscriptions.toString()],
      [t('admin.metrics.failedPayments'), metrics.failedPayments.toString()],
      [t('admin.metrics.monthlyRevenue'), `${currencySymbol} ${metrics.monthlyRevenue.toFixed(2)}`],
      [t('admin.metrics.annualRevenue'), `${currencySymbol} ${metrics.annualRevenue.toFixed(2)}`]
    ];

    if (exportFormat === 'csv') {
      const csvContent = metricsData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', language === 'en' ? 'dashboard_metrics.csv' : language === 'es' ? 'metricas_panel.csv' : 'metricas_dashboard.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        import('jspdf-autotable').then((autoTableModule) => {
          const autoTable = autoTableModule.default;
          const doc = new jsPDF();
          
          doc.setFontSize(18);
          doc.text(t('admin.export.overviewTitle'), 14, 22);
          doc.setFontSize(12);
          doc.text(`${language === 'en' ? 'Date' : language === 'es' ? 'Fecha' : 'Data'}: ${new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR')}`, 14, 32);
          
          autoTable(doc, {
            head: [metricsData[0]],
            body: metricsData.slice(1),
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [71, 85, 105] }
          });
          
          doc.save(language === 'en' ? 'dashboard_metrics.pdf' : language === 'es' ? 'metricas_panel.pdf' : 'metricas_dashboard.pdf');
        });
      });
    } else if (exportFormat === 'excel') {
      import('xlsx').then((XLSX) => {
        const worksheet = XLSX.utils.aoa_to_sheet(metricsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, language === 'en' ? 'Metrics' : language === 'es' ? 'Métricas' : 'Métricas');
        XLSX.writeFile(workbook, language === 'en' ? 'dashboard_metrics.xlsx' : language === 'es' ? 'metricas_panel.xlsx' : 'metricas_dashboard.xlsx');
      });
    }
  };

  const exportContextualData = () => {
    // Determine context based on active tabs
    if (activeMainTab === 'overview') {
      exportOverviewMetrics();
    } else if (activeMainTab === 'users') {
      if (activeUsersSubTab === 'users') {
        exportPremiumUsers();
      } else if (activeUsersSubTab === 'alerts') {
        exportAlerts();
      } else {
        // For other sub-tabs, show a message
        toast({
          title: "Exportação em desenvolvimento",
          description: `A exportação para a aba ${activeUsersSubTab} ainda está sendo desenvolvida.`,
          variant: "default"
        });
      }
    } else {
      toast({
        title: "Exportação em desenvolvimento", 
        description: `A exportação para a aba ${activeMainTab} ainda está sendo desenvolvida.`,
        variant: "default"
      });
    }
  };

  const exportPremiumUsers = () => {
    const csvHeaders = [t('admin.table.userName'), t('admin.table.email'), t('admin.table.status'), t('admin.table.plan'), t('admin.table.lastPayment'), t('admin.table.nextBilling')];
    
    if (exportFormat === 'csv') {
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
      link.setAttribute('download', language === 'en' ? 'premium_users.csv' : language === 'es' ? 'usuarios_premium.csv' : 'usuarios_premium.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        import('jspdf-autotable').then((autoTableModule) => {
          const autoTable = autoTableModule.default;
          const doc = new jsPDF();
          
          doc.setFontSize(18);
          doc.text(t('admin.export.premiumUsersTitle'), 14, 22);
          doc.setFontSize(12);
          doc.text(`${language === 'en' ? 'Date' : language === 'es' ? 'Fecha' : 'Data'}: ${new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR')}`, 14, 32);
          
          const headers = [[t('admin.table.userName'), t('admin.table.email'), t('admin.table.status'), t('admin.table.plan'), t('admin.table.lastPayment')]];
          const data = filteredUsers.map(user => [
            user.display_name,
            user.email,
            user.status,
            user.subscription_tier,
            user.last_payment ? new Date(user.last_payment).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR') : ''
          ]);
          
          autoTable(doc, {
            head: headers,
            body: data,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105] }
          });
          
          doc.save(language === 'en' ? 'premium_users.pdf' : language === 'es' ? 'usuarios_premium.pdf' : 'usuarios_premium.pdf');
        });
      });
    } else if (exportFormat === 'excel') {
      import('xlsx').then((XLSX) => {
        const worksheetData = [
          csvHeaders,
          ...filteredUsers.map(user => [
            user.display_name,
            user.email,
            user.status,
            user.subscription_tier,
            user.last_payment || '',
            user.subscription_end || ''
          ])
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, language === 'en' ? 'Premium Users' : language === 'es' ? 'Usuarios Premium' : 'Usuários Premium');
        XLSX.writeFile(workbook, language === 'en' ? 'premium_users.xlsx' : language === 'es' ? 'usuarios_premium.xlsx' : 'usuarios_premium.xlsx');
      });
    }
  };

  const exportAlerts = () => {
    const alertsData = [
      [language === 'en' ? 'Date' : language === 'es' ? 'Fecha' : 'Data', 
       language === 'en' ? 'User Email' : language === 'es' ? 'Email del Usuario' : 'Email do Usuário',
       language === 'en' ? 'Event' : language === 'es' ? 'Evento' : 'Evento',
       language === 'en' ? 'Action' : language === 'es' ? 'Acción' : 'Ação'],
      ...alerts.map(alert => [
        alert.date,
        alert.user_email,
        alert.event,
        alert.action
      ])
    ];

    if (exportFormat === 'csv') {
      const csvContent = alertsData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', language === 'en' ? 'alerts.csv' : language === 'es' ? 'alertas.csv' : 'alertas_admin.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        import('jspdf-autotable').then((autoTableModule) => {
          const autoTable = autoTableModule.default;
          const doc = new jsPDF();
          
          doc.setFontSize(18);
          doc.text(t('admin.export.alertsTitle'), 14, 22);
          doc.setFontSize(12);
          doc.text(`${language === 'en' ? 'Date' : language === 'es' ? 'Fecha' : 'Data'}: ${new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR')}`, 14, 32);
          
          autoTable(doc, {
            head: [alertsData[0]],
            body: alertsData.slice(1),
            startY: 40,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [71, 85, 105] }
          });
          
          doc.save(language === 'en' ? 'alerts.pdf' : language === 'es' ? 'alertas.pdf' : 'alertas_admin.pdf');
        });
      });
    } else if (exportFormat === 'excel') {
      import('xlsx').then((XLSX) => {
        const worksheet = XLSX.utils.aoa_to_sheet(alertsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, language === 'en' ? 'Alerts' : language === 'es' ? 'Alertas' : 'Alertas');
        XLSX.writeFile(workbook, language === 'en' ? 'alerts.xlsx' : language === 'es' ? 'alertas.xlsx' : 'alertas_admin.xlsx');
      });
    }
  };

  const handleExport = () => {
    exportContextualData();
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
          <Button variant="outline" size="sm" onClick={() => navigate('/app')}>
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
          <div className="flex gap-1">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('admin.export.title')}
            </Button>
          </div>
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

      {/* Main Admin Tabs */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => setActiveMainTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 {t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="users">👥 {t('admin.tabs.users')}</TabsTrigger>
          <TabsTrigger value="content">📚 {t('admin.tabs.content')}</TabsTrigger>
          <TabsTrigger value="ai-control">🤖 {t('admin.tabs.aiControl')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas do Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                  {(language === 'en' || language === 'es')
                    ? `$ ${metrics.monthlyRevenue.toFixed(2)}` 
                    : `R$ ${metrics.monthlyRevenue.toFixed(2)}`
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.metrics.annualRevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(language === 'en' || language === 'es')
                    ? `$ ${metrics.annualRevenue.toFixed(2)}` 
                    : `R$ ${metrics.annualRevenue.toFixed(2)}`
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Tabs defaultValue="users" className="space-y-6" onValueChange={(value) => setActiveUsersSubTab(value)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger 
            value="users" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <Crown className="h-4 w-4 mr-2" />
            {t('admin.tabs.premiumUsers')}
          </TabsTrigger>
          <TabsTrigger 
            value="non-premium"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {t('admin.tabs.essentialUsers')}
          </TabsTrigger>
          <TabsTrigger 
            value="premium"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {t('admin.tabs.premiumAccess')}
          </TabsTrigger>
          <TabsTrigger 
            value="abandoned"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <Search className="h-4 w-4 mr-2" />
            {language === 'pt' ? 'Carrinho Abandonado' : language === 'en' ? 'Abandoned Checkouts' : 'Carritos Abandonados'}
          </TabsTrigger>
          <TabsTrigger 
            value="alerts"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('admin.tabs.alerts')}
          </TabsTrigger>
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
                         <TableCell className="font-medium">
                           <div className="flex items-center gap-2">
                             <div>{user.display_name}</div>
                             {user.isCoupled && (
                               <Badge variant="outline" className="text-xs">
                                 Casal
                               </Badge>
                             )}
                           </div>
                           {user.isCoupled && user.partnerName && (
                             <div className="text-xs text-muted-foreground">
                               Parceiro: {user.partnerName}
                             </div>
                           )}
                         </TableCell>
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
                          {user.last_payment ? new Date(user.last_payment).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR') : '—'}
                        </TableCell>
                        <TableCell>
                          {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR') : '—'}
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
          <NonPremiumUsersList language={language === 'es' ? 'en' : language as 'pt' | 'en'} />
        </TabsContent>

        <TabsContent value="premium">
          <div className="grid grid-cols-1 gap-6">
            <ManualPremiumAccess language={language === 'es' ? 'en' : language as 'pt' | 'en'} />
          </div>
        </TabsContent>

            <TabsContent value="abandoned">
              <AbandonedCheckouts />
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
                          <div className="mt-2 flex items-center justify-end gap-2">
                            {alert.action !== t('admin.actions.noActionNeeded') && (
                              <Button size="sm" variant="outline">
                                {t('admin.actions.execute')}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleDeleteAlert(alert.id)}>
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="content">
          <EducationalContentManager />
        </TabsContent>

        <TabsContent value="ai-control">
          <AIControlSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const AdminDashboard = () => {
  return <AdminDashboardContent />;
};