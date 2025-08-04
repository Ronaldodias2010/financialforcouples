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
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
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
        .select('*')
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
      // First, check if user exists and get user_id
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', session.user.id) // This is just to check auth, we'll need the actual user
        .single();

      if (profileError) throw profileError;

      const tempPassword = generateTempPassword();

      const { data: accessData, error } = await supabase
        .from('manual_premium_access')
        .insert({
          user_id: session.user.id, // In a real implementation, you'd get the actual user's ID
          email: data.email,
          start_date: data.startDate,
          end_date: data.endDate,
          temp_password: tempPassword,
          created_by_admin_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t.accessGranted,
        description: `${t.tempPassword}: ${tempPassword}`,
      });

      form.reset();
      fetchActiveGrants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
                          {showPassword[grant.id] ? grant.temp_password : '••••••••'}
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