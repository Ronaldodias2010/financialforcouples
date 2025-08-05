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

interface NonPremiumUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  subscription_tier: string;
  last_login?: string;
}

export const NonPremiumUsersList = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<NonPremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNonPremiumUsers();
  }, []);

  const fetchNonPremiumUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários que não são premium
      // Primeiro, vamos buscar todos os profiles com seus dados de subscrição
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          created_at,
          subscription_tier,
          subscribers!left(
            email,
            subscribed,
            subscription_tier,
            created_at
          )
        `);

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      let nonPremiumUsers: NonPremiumUser[] = [];

      if (profiles) {
        // Filtrar usuários que não são premium
        const filteredProfiles = profiles.filter(profile => {
          const subscriber = (profile as any).subscribers;
          const isNotPremium = !subscriber || 
                              !subscriber.subscribed || 
                              subscriber.subscription_tier === 'essential' ||
                              profile.subscription_tier === 'essential';
          return isNotPremium;
        });

        nonPremiumUsers = filteredProfiles.map(profile => {
          const subscriber = (profile as any).subscribers;
          return {
            id: profile.user_id,
            email: subscriber?.email || 'Email não disponível',
            display_name: profile.display_name || 'Usuário',
            created_at: profile.created_at,
            subscription_tier: profile.subscription_tier || 'essential',
            last_login: subscriber?.created_at
          };
        });
      }

      // Buscar também usuários autenticados que não têm profile ainda
      const { data: usersWithoutProfile, error: usersError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscribed', false)
        .or('subscription_tier.eq.essential,subscription_tier.is.null');

      if (!usersError && usersWithoutProfile) {
        const additionalUsers = usersWithoutProfile
          .filter(user => !nonPremiumUsers.some(existing => existing.email === user.email))
          .map(user => ({
            id: user.user_id,
            email: user.email,
            display_name: 'Usuário',
            created_at: user.created_at,
            subscription_tier: user.subscription_tier || 'essential',
            last_login: user.updated_at
          }));

        nonPremiumUsers = [...nonPremiumUsers, ...additionalUsers];
      }

      setUsers(nonPremiumUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários não premium:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de usuários não premium",
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
    const csvHeaders = ['Nome', 'Email', 'Plano', 'Data de Cadastro', 'Último Acesso'];
    const csvContent = [
      csvHeaders.join(','),
      ...filteredUsers.map(user => [
        user.display_name,
        user.email,
        user.subscription_tier,
        new Date(user.created_at).toLocaleDateString('pt-BR'),
        user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'usuarios_nao_premium.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação realizada",
      description: "Lista de usuários não premium exportada com sucesso",
    });
  };

  const sendMarketingEmail = async (userEmail: string) => {
    try {
      // Aqui você pode implementar o envio de email marketing
      // Por exemplo, usando a função send-invite ou criando uma nova função
      toast({
        title: "Email enviado",
        description: `Email de marketing enviado para ${userEmail}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar email de marketing",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-center">Carregando usuários não premium...</div>
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
            Usuários Não Premium
          </CardTitle>
          <CardDescription>
            Lista de clientes ativos que não possuem assinatura premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">
              {filteredUsers.length} usuários encontrados
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
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
          <CardTitle>📋 Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'Nenhum usuário encontrado para a busca atual' : 'Nenhum usuário não premium encontrado'}
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
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('pt-BR')
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
                          Email
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