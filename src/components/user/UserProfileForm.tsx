import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, CreditCard, Lock, DollarSign } from "lucide-react";

export const UserProfileForm = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    preferred_currency: "BRL",
    second_user_name: "",
    second_user_email: ""
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
        .select("display_name, preferred_currency, second_user_name, second_user_email")
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
          second_user_name: data.second_user_name || "",
          second_user_email: data.second_user_email || ""
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
        .update({
          display_name: profile.display_name,
          preferred_currency: profile.preferred_currency as "BRL" | "USD" | "EUR",
          second_user_name: profile.second_user_name,
          second_user_email: profile.second_user_email
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      
      // Force refresh the window to ensure currency changes are applied
      window.location.reload();
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

  const sendInvite = async () => {
    if (!profile.second_user_email || !profile.second_user_name) {
      toast.error("Preencha o nome e email do segundo usuário");
      return;
    }

    setLoading(true);
    try {
      // Check if there's an existing invite for this email
      const { data: existingInvite, error: checkError } = await supabase
        .from('user_invites')
        .select('created_at, status')
        .eq('inviter_user_id', user?.id)
        .eq('invitee_email', profile.second_user_email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If there's a pending invite less than 7 days old, don't allow resending
      if (existingInvite && existingInvite.status === 'pending') {
        const inviteDate = new Date(existingInvite.created_at);
        const daysDiff = (new Date().getTime() - inviteDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff < 7) {
          toast.error(`Você pode reenviar o convite após ${Math.ceil(7 - daysDiff)} dias`);
          return;
        }
      }

      const { error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: profile.second_user_email,
          name: profile.second_user_name,
          inviter_name: profile.display_name || user?.email
        }
      });

      if (error) {
        // Check if it's the Resend domain verification error
        if (error.message && error.message.includes('verify a domain')) {
          toast.error("Para enviar emails para outros usuários, é necessário verificar um domínio no Resend. Por enquanto, você só pode enviar convites para ronadias2010@gmail.com");
        } else {
          throw error;
        }
      } else {
        toast.success("Convite enviado com sucesso!");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const removeIncompleteUser = async () => {
    if (!profile.second_user_email) {
      toast.error("Nenhum usuário para remover");
      return;
    }

    setLoading(true);
    try {
      // Remove pending invites
      const { error: inviteError } = await supabase
        .from('user_invites')
        .delete()
        .eq('inviter_user_id', user?.id)
        .eq('invitee_email', profile.second_user_email);

      if (inviteError) throw inviteError;

      // Clear the second user fields
      setProfile(prev => ({
        ...prev,
        second_user_name: "",
        second_user_email: ""
      }));

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          second_user_name: null,
          second_user_email: null
        })
        .eq("user_id", user?.id);

      if (updateError) throw updateError;

      toast.success("Usuário removido com sucesso! Agora você pode reenviar o convite.");
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Erro ao remover usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{t('userProfile.title')}</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{t('userProfile.profile')}</TabsTrigger>
          <TabsTrigger value="users">{t('userProfile.users')}</TabsTrigger>
          <TabsTrigger value="billing">{t('userProfile.billing')}</TabsTrigger>
          <TabsTrigger value="security">{t('userProfile.security')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('userProfile.personalInfo')}</h3>
              
              <div>
                <Label htmlFor="email">{t('userProfile.email')}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="display_name">{t('userProfile.displayName')}</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Como você gostaria de ser chamado"
                />
              </div>

              <div>
                <Label htmlFor="currency">{t('userProfile.preferredCurrency')}</Label>
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
                {loading ? t('userProfile.saving') : t('userProfile.saveProfile')}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t('userProfile.userConfig')}</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{t('userProfile.mainUser')}</h4>
                  <div>
                    <Label htmlFor="user1_name">{t('userProfile.displayName')}</Label>
                    <Input
                      id="user1_name"
                      value={profile.display_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{t('userProfile.secondUser')}</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="user2_name">{t('userProfile.displayName')}</Label>
                      <Input
                        id="user2_name"
                        value={profile.second_user_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, second_user_name: e.target.value }))}
                        placeholder="Nome do segundo usuário (ex: Maria, João, etc.)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user2_email">{t('userProfile.inviteEmail')}</Label>
                      <Input
                        id="user2_email"
                        type="email"
                        value={profile.second_user_email}
                        onChange={(e) => setProfile(prev => ({ ...prev, second_user_email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Email onde o convite será enviado para o segundo usuário se cadastrar
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {profile.second_user_email && profile.second_user_name && (
                        <Button 
                          onClick={sendInvite} 
                          disabled={loading}
                          variant="outline"
                          className="flex-1"
                        >
                          {loading ? t('userProfile.sending') : t('userProfile.sendInvite')}
                        </Button>
                      )}
                      {profile.second_user_email && (
                        <Button 
                          onClick={removeIncompleteUser} 
                          disabled={loading}
                          variant="outline"
                          className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          {loading ? "Removendo..." : "Remover Usuário"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={updateProfile} disabled={loading}>
                {loading ? t('userProfile.saving') : t('userProfile.saveSettings')}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t('userProfile.billingInfo')}</h3>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
                <p>{t('userProfile.freePlan')}</p>
                <p className="text-sm">{t('userProfile.upgradeText')}</p>
              </div>

              <Button variant="outline" className="w-full">
                {t('userProfile.upgradePlan')}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{t('userProfile.changePassword')}</h3>
              </div>

              <div>
                <Label htmlFor="new_password">{t('userProfile.newPassword')}</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Digite a nova senha"
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">{t('userProfile.confirmPassword')}</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Confirme a nova senha"
                />
              </div>

              <Button onClick={updatePassword} disabled={loading}>
                {loading ? t('userProfile.updating') : t('userProfile.updatePassword')}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};