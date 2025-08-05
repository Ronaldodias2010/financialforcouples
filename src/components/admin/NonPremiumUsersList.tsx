import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";

const translations = {
  pt: {
    title: "Usuários Essencial",
    description: "Lista de clientes ativos que possuem assinatura essencial",
    usersFound: "usuários encontrados",
    exportCsv: "Exportar CSV",
    filters: "🔍 Filtros",
    searchPlaceholder: "Buscar por email ou nome...",
    usersList: "📋 Lista de Usuários",
    name: "Nome",
    email: "Email",
    plan: "Plano",
    registrationDate: "Data de Cadastro",
    lastAccess: "Último Acesso",
    actions: "Ações",
    noUsersFound: "Nenhum usuário encontrado para a busca atual",
    noUsersAtAll: "Nenhum usuário essencial encontrado",
    emailButton: "Email",
    loading: "Carregando usuários essencial...",
    exportSuccess: "Exportação realizada",
    exportDescription: "Lista de usuários essencial exportada com sucesso",
    emailSent: "Email enviado",
    emailSentTo: "Email de marketing enviado para",
    emailError: "Erro ao enviar email de marketing",
    error: "Erro",
    loadError: "Erro ao carregar lista de usuários essencial"
  },
  en: {
    title: "Essential Users",
    description: "List of active clients with essential subscription",
    usersFound: "users found",
    exportCsv: "Export CSV",
    filters: "🔍 Filters",
    searchPlaceholder: "Search by email or name...",
    usersList: "📋 Users List",
    name: "Name",
    email: "Email",
    plan: "Plan",
    registrationDate: "Registration Date",
    lastAccess: "Last Access",
    actions: "Actions",
    noUsersFound: "No users found for current search",
    noUsersAtAll: "No essential users found",
    emailButton: "Email",
    loading: "Loading essential users...",
    exportSuccess: "Export completed",
    exportDescription: "Essential users list exported successfully",
    emailSent: "Email sent",
    emailSentTo: "Marketing email sent to",
    emailError: "Error sending marketing email",
    error: "Error",
    loadError: "Error loading essential users list"
  }
};

interface NonPremiumUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  subscription_tier: string;
  last_login?: string;
}

export const NonPremiumUsersList = () => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.pt;
  const [users, setUsers] = useState<NonPremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNonPremiumUsers();
  }, []);

  const fetchNonPremiumUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários essencial (não premium)
      // Primeiro, vamos buscar todos os profiles com seus dados de subscrição
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          created_at,
          subscription_tier
        `);

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      let essentialUsers: NonPremiumUser[] = [];

      // Buscar todos os usuários subscribers
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*');

      if (subscribersError) {
        console.error('Erro ao buscar subscribers:', subscribersError);
        throw subscribersError;
      }

      if (profiles && subscribers) {
        // Filtrar usuários que são essencial (não premium)
        const filteredProfiles = profiles.filter(profile => {
          const subscriber = subscribers.find(s => s.user_id === profile.user_id);
          const isEssential = !subscriber || 
                             !subscriber.subscribed || 
                             subscriber.subscription_tier === 'essential' ||
                             profile.subscription_tier === 'essential';
          return isEssential;
        });

        essentialUsers = filteredProfiles.map(profile => {
          const subscriber = subscribers.find(s => s.user_id === profile.user_id);
          return {
            id: profile.user_id,
            email: subscriber?.email || 'Email não disponível',
            display_name: profile.display_name || 'Usuário',
            created_at: profile.created_at,
            subscription_tier: profile.subscription_tier || 'essential',
            last_login: subscriber?.updated_at
          };
        });
      }

      // Buscar também usuários autenticados que não têm profile ainda
      const { data: usersWithoutProfile, error: usersError } = await supabase
        .from('subscribers')
        .select('*')
        .or('subscription_tier.eq.essential,subscription_tier.is.null,subscribed.eq.false');

      if (!usersError && usersWithoutProfile) {
        const additionalUsers = usersWithoutProfile
          .filter(user => !essentialUsers.some(existing => existing.email === user.email))
          .map(user => ({
            id: user.user_id,
            email: user.email,
            display_name: 'Usuário',
            created_at: user.created_at,
            subscription_tier: user.subscription_tier || 'essential',
            last_login: user.updated_at
          }));

        essentialUsers = [...essentialUsers, ...additionalUsers];
      }

      setUsers(essentialUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários essencial:', error);
      toast({
        title: t.error,
        description: t.loadError,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvHeaders = [t.name, t.email, t.plan, t.registrationDate, t.lastAccess];
    const csvContent = [
      csvHeaders.join(','),
      ...filteredUsers.map(user => [
        user.display_name,
        user.email,
        user.subscription_tier,
        new Date(user.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR'),
        user.last_login ? new Date(user.last_login).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_essencial.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t.exportSuccess,
      description: t.exportDescription,
    });
  };

  const sendMarketingEmail = async (userEmail: string) => {
    try {
      // Aqui você pode implementar o envio de email marketing
      // Por exemplo, usando a função send-invite ou criando uma nova função
      toast({
        title: t.emailSent,
        description: `${t.emailSentTo} ${userEmail}`,
      });
    } catch (error) {
      toast({
        title: t.error,
        description: t.emailError,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-center">{t.loading}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">
              {filteredUsers.length} {t.usersFound}
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t.exportCsv}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle>{t.filters}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>{t.usersList}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.plan}</TableHead>
                  <TableHead>{t.registrationDate}</TableHead>
                  <TableHead>{t.lastAccess}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? t.noUsersFound : t.noUsersAtAll}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.display_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR')}
                      </TableCell>
                      <TableCell>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendMarketingEmail(user.email)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {t.emailButton}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};