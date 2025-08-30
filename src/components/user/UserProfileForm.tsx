import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscription } from "@/hooks/useSubscription";
import { useCouple } from "@/hooks/useCouple";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, CreditCard, Lock, DollarSign } from "lucide-react";

interface UserProfileFormProps {
  onBack?: () => void;
  activeTab?: string;
}

export const UserProfileForm = ({ onBack, activeTab }: UserProfileFormProps) => {
  const { user, session } = useAuth();
  const { t, language } = useLanguage();
  const { subscribed, subscriptionTier, subscriptionEnd, createCheckoutSession, openCustomerPortal, loading: subscriptionLoading } = useSubscription();
  const { isPartOfCouple } = useCouple();
  const [loading, setLoading] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    phone_number: "",
    preferred_currency: "BRL",
    second_user_name: "",
    second_user_email: ""
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [billing, setBilling] = useState<{
    planAmount?: number;
    planInterval?: string;
    planCurrency?: string | null;
    renewalDate?: string | null;
    cardBrand?: string | null;
    last4?: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const loadBilling = async () => {
      if (!session) return;
      try {
        const { data, error } = await supabase.functions.invoke('get-billing-details', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        setBilling({
          planAmount: data?.plan?.amount,
          planInterval: data?.plan?.interval,
          planCurrency: (data?.plan?.currency || 'BRL')?.toUpperCase(),
          renewalDate: data?.renewal_date || subscriptionEnd,
          cardBrand: data?.card?.brand,
          last4: data?.card?.last4,
        });
      } catch (e) {
        console.error('Error loading billing details:', e);
      }
    };
    loadBilling();
  }, [session, subscribed, subscriptionEnd]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone_number, preferred_currency, second_user_name, second_user_email")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          phone_number: data.phone_number || "",
          preferred_currency: data.preferred_currency || "BRL",
          second_user_name: data.second_user_name || "",
          second_user_email: data.second_user_email || ""
        });
      } else {
        // No profile found, keep default values
        setProfile({
          display_name: "",
          phone_number: "",
          preferred_currency: "BRL",
          second_user_name: "",
          second_user_email: ""
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
          phone_number: profile.phone_number,
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
      // Temporarily removed 7-day restriction for testing
      // TODO: Re-implement with personalized message after 24 hours

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

  const handleUpgrade = async (priceId: string) => {
    setCreatingCheckout(true);
    try {
      await createCheckoutSession(priceId);
      toast.success(t('subscription.redirectingToPayment'));
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao iniciar upgrade. Tente novamente.");
    } finally {
      setCreatingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento. Tente novamente.");
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'pt' ? 'pt-BR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale);
  };

  const formatMoney = (amount: number, currency?: string) => {
    const locale = language === 'pt' ? 'pt-BR' : 'en-US';
    const curr = (currency || 'BRL').toUpperCase();
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(amount);
    } catch {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(amount);
    }
  };

  const dismissInvitePermanently = () => {
    localStorage.setItem('dismissInvitePermanently', 'true');
    toast.success("O lembrete de convite não aparecerá mais.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{t('userProfile.title')}</h2>
      </div>

      <Tabs defaultValue={activeTab || "profile"} className="w-full">
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
                <Label htmlFor="phone_number">{t('userProfile.phone')}</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={profile.phone_number}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder={t('userProfile.phonePlaceholder')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('userProfile.phoneHelp')}
                </p>
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
                        disabled={isPartOfCouple}
                      />
                      {isPartOfCouple && (
                        <p className="text-sm text-green-600 mt-1">
                          ✅ Usuário vinculado com sucesso! Não é possível alterar.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="user2_email">{t('userProfile.inviteEmail')}</Label>
                      <Input
                        id="user2_email"
                        type="email"
                        value={profile.second_user_email}
                        onChange={(e) => setProfile(prev => ({ ...prev, second_user_email: e.target.value }))}
                        placeholder="email@exemplo.com"
                        disabled={isPartOfCouple}
                      />
                      {!isPartOfCouple && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('userProfile.inviteEmailHelp')}
                        </p>
                      )}
                    </div>
                    {!isPartOfCouple && (
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
                        <Button
                          onClick={dismissInvitePermanently}
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          {t('userProfile.dismissReminders')}
                        </Button>
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
                    )}
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
              
              {subscriptionLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('subscription.loading')}</p>
                </div>
              ) : subscribed ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 className="font-medium text-green-800">{t('subscription.planActive')} {subscriptionTier || 'Premium'}</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      {t('subscription.premiumAccess')}
                    </p>
                    {subscriptionEnd && (
                      <p className="text-sm text-green-600 mt-2">
                        {t('subscription.nextRenewal')}: {formatDate(subscriptionEnd)}
                      </p>
                    )}
                    {billing?.cardBrand && billing?.last4 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('billing.cardLabel')}: {billing.cardBrand.toUpperCase()} •••• {billing.last4}
                      </p>
                    )}
                    {typeof billing?.planAmount === 'number' && billing?.planInterval && (
                      <p className="text-sm text-muted-foreground">
                        {`${t('billing.planLabel')}: Premium (${billing.planInterval === 'year' ? t('billing.interval.yearly') : t('billing.interval.monthly')}) — ${formatMoney(billing!.planAmount as number, billing?.planCurrency || 'BRL')}`}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                    variant="outline" 
                    className="w-full"
                  >
                    {openingPortal ? t('subscription.redirectingToPortal') : t('subscription.manageSubscription')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p>{t('userProfile.freePlan')}</p>
                    <p className="text-sm">{t('userProfile.upgradeText')}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleUpgrade('price_1RsLL5FOhUY5r0H1WIXv7yuP')}
                      disabled={creatingCheckout}
                      className="w-full"
                    >
                      {creatingCheckout ? t('subscription.loading') : t('subscription.subscribeMonthly')}
                    </Button>
                    <Button 
                      onClick={() => handleUpgrade('price_1S1qudFOhUY5r0H1ZqGYFERQ')}
                      disabled={creatingCheckout}
                      variant="outline"
                      className="w-full"
                    >
                      {creatingCheckout ? t('subscription.loading') : t('subscription.subscribeAnnually')}
                    </Button>
                  </div>
                </div>
              )}
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