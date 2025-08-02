import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, CreditCard, Lock, DollarSign } from "lucide-react";

export const UserProfileForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    preferred_currency: "BRL",
    second_user_name: ""
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          preferred_currency: data.preferred_currency || "BRL",
          second_user_name: data.second_user_name || ""
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          preferred_currency: profile.preferred_currency as "BRL" | "USD" | "EUR",
          second_user_name: profile.second_user_name
        });

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!passwordData.new_password || passwordData.new_password !== passwordData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Configurações de Usuário</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="billing">Cobrança</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Pessoais</h3>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="display_name">Seu Nome</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Como você gostaria de ser chamado"
                />
              </div>

              <div>
                <Label htmlFor="currency">Moeda Preferida</Label>
                <select
                  id="currency"
                  value={profile.preferred_currency}
                  onChange={(e) => setProfile(prev => ({ ...prev, preferred_currency: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <Button onClick={updateProfile} disabled={loading}>
                {loading ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Configuração de Usuários</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Usuário Principal (Você)</h4>
                  <div>
                    <Label htmlFor="user1_name">Nome de Exibição</Label>
                    <Input
                      id="user1_name"
                      value={profile.display_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Segundo Usuário</h4>
                  <div>
                    <Label htmlFor="user2_name">Nome de Exibição</Label>
                    <Input
                      id="user2_name"
                      value={profile.second_user_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, second_user_name: e.target.value }))}
                      placeholder="Nome do segundo usuário (ex: Maria, João, etc.)"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Este nome aparecerá no lugar de "Usuário 2" em todo o sistema
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={updateProfile} disabled={loading}>
                {loading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Informações de Cobrança</h3>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
                <p>Plano gratuito ativo</p>
                <p className="text-sm">Atualize para o plano premium para funcionalidades avançadas</p>
              </div>

              <Button variant="outline" className="w-full">
                Atualizar Plano
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Alterar Senha</h3>
              </div>

              <div>
                <Label htmlFor="new_password">Nova Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Digite a nova senha"
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Confirme a nova senha"
                />
              </div>

              <Button onClick={updatePassword} disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};