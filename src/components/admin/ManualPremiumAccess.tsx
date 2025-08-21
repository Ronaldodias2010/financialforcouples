import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, UserPlus, Eye, Trash2, Shield } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ManualPremiumAccessProps {
  language: 'en' | 'pt';
}

const texts = {
  en: {
    title: "Grant Manual Premium Access",
    userEmail: "User Email",
    startDate: "Start Date",
    endDate: "End Date",
    grantAccess: "Grant Premium Access",
    tempPassword: "Temporary Password",
    activeAccess: "Active Access Grants",
    email: "Email",
    period: "Period",
    status: "Status",
    password: "Password",
    actions: "Actions",
    revoke: "Revoke",
    view: "View",
    active: "Active",
    expired: "Expired",
    revoked: "Revoked",
    maxDays: "Maximum 90 days from start date",
    accessGranted: "Premium access granted successfully",
    accessRevoked: "Premium access revoked successfully",
    generated: "Generated",
    loading: "Processing...",
    noActiveGrants: "No active access grants found"
  },
  pt: {
    title: "Conceder Acesso Premium Manual",
    userEmail: "E-mail do Usuário",
    startDate: "Data de Início",
    endDate: "Data de Expiração",
    grantAccess: "Conceder Acesso Premium",
    tempPassword: "Senha Temporária",
    activeAccess: "Acessos Ativos Concedidos",
    email: "E-mail",
    period: "Período",
    status: "Status",
    password: "Senha",
    actions: "Ações",
    revoke: "Revogar",
    view: "Ver",
    active: "Ativo",
    expired: "Expirado",
    revoked: "Revogado",
    maxDays: "Máximo de 90 dias a partir da data de início",
    accessGranted: "Acesso premium concedido com sucesso",
    accessRevoked: "Acesso premium revogado com sucesso",
    generated: "Gerada",
    loading: "Processando...",
    noActiveGrants: "Nenhum acesso ativo encontrado"
  }
};

const manualAccessSchema = z.object({
  email: z.string().email('Invalid email format'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + 90);
  
  return end > start && end <= maxDate;
}, {
  message: "End date must be after start date and within 90 days",
  path: ["endDate"],
});

type ManualAccessForm = z.infer<typeof manualAccessSchema>;

export const ManualPremiumAccess = ({ language }: ManualPremiumAccessProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeGrants, setActiveGrants] = useState<any[]>([]);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const getTempPassword = async (recordId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_temp_password_for_invite', { p_record_id: recordId });
      
      if (error) throw error;
      
      setTempPasswords(prev => ({
        ...prev,
        [recordId]: data
      }));
    } catch (error) {
      console.error('Error getting temp password:', error);
      toast({
        title: 'Error',
        description: 'Could not retrieve temporary password',
        variant: 'destructive',
      });
    }
  };
  const t = texts[language];

  const form = useForm<ManualAccessForm>({
    resolver: zodResolver(manualAccessSchema),
    defaultValues: {
      email: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchActiveGrants = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_premium_access')
        .select(`
          id,
          user_id,
          email,
          start_date,
          end_date,
          status,
          temp_password_hash
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveGrants(data || []);
    } catch (error) {
      console.error('Error fetching active grants:', error);
    }
  };

  const onSubmit = async (data: ManualAccessForm) => {
    if (!session) return;

    setLoading(true);
    try {
      // Locate the target user by email in subscribers
      const { data: targetSub, error: targetSubErr } = await supabase
        .from('subscribers')
        .select('user_id, email')
        .eq('email', data.email)
        .maybeSingle();

      if (targetSubErr) throw targetSubErr;
      if (!targetSub?.user_id) {
        throw new Error('Usuário não encontrado pelo e-mail informado');
      }

      const targetUserId = targetSub.user_id as string;

      // Insert manual access for the target user
      const tempPasswordMain = generateTempPassword();
      
      // Hash the password using the database function
      const { data: hashedPasswordMain, error: hashError1 } = await supabase
        .rpc('hash_temp_password', { password: tempPasswordMain });
      if (hashError1) throw hashError1;
      
      const { error: insertMainErr } = await supabase
        .from('manual_premium_access')
        .insert({
          user_id: targetUserId,
          email: targetSub.email,
          start_date: data.startDate,
          end_date: data.endDate,
          temp_password_hash: hashedPasswordMain,
          created_by_admin_id: session.user.id,
        });
      if (insertMainErr) throw insertMainErr;

      // Check for active couple and grant to partner as well
      const { data: couple, error: coupleErr } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id, status')
        .eq('status', 'active')
        .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`)
        .maybeSingle();
      if (coupleErr) throw coupleErr;

      if (couple) {
        const partnerId = couple.user1_id === targetUserId ? couple.user2_id : couple.user1_id;
        if (partnerId) {
          // Fetch partner email from subscribers
          const { data: partnerSub } = await supabase
            .from('subscribers')
            .select('user_id, email')
            .eq('user_id', partnerId)
            .maybeSingle();

          if (partnerSub?.email) {
            const tempPasswordPartner = generateTempPassword();
            
            // Hash the password using the database function
            const { data: hashedPasswordPartner, error: hashError2 } = await supabase
              .rpc('hash_temp_password', { password: tempPasswordPartner });
            if (hashError2) throw hashError2;
            
            const { error: insertPartnerErr } = await supabase
              .from('manual_premium_access')
              .insert({
                user_id: partnerId,
                email: partnerSub.email,
                start_date: data.startDate,
                end_date: data.endDate,
                temp_password_hash: hashedPasswordPartner,
                created_by_admin_id: session.user.id,
              });
            if (insertPartnerErr) throw insertPartnerErr;
          }
        }
      }

      toast({
        title: t.accessGranted,
      });

      form.reset();
      fetchActiveGrants();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('manual_premium_access')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t.accessRevoked,
      });

      fetchActiveGrants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    if (!showPassword[id] && !tempPasswords[id]) {
      getTempPassword(id);
    }
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  React.useEffect(() => {
    fetchActiveGrants();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.userEmail}</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.startDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.endDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="text-sm text-muted-foreground">{t.maxDays}</p>

              <Button type="submit" disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? t.loading : t.grantAccess}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t.activeAccess}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeGrants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t.noActiveGrants}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.period}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.password}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeGrants.map((grant) => (
                  <TableRow key={grant.id}>
                    <TableCell>{grant.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(grant.start_date).toLocaleDateString()} - 
                        {new Date(grant.end_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={grant.status === 'active' ? 'default' : 'secondary'}>
                        {t[grant.status as keyof typeof t] || grant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showPassword[grant.id] ? (tempPasswords[grant.id] || 'Loading...') : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(grant.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeAccess(grant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};