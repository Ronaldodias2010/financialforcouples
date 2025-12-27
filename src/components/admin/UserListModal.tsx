import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/hooks/useLanguage";
import { Users, XCircle, AlertTriangle } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name?: string;
  subscription_tier?: string;
  subscription_end?: string | null;
  status?: string;
  failure_date?: string;
  failure_reason?: string;
  created_at?: string;
  canceled_at?: string;
  user_type?: 'payer' | 'partner';
  source?: 'payment_failure' | 'subscription_overdue';
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'active' | 'canceled' | 'failed';
  users: User[];
  loading?: boolean;
}

export const UserListModal = ({ isOpen, onClose, type, users, loading }: UserListModalProps) => {
  const { language, t } = useLanguage();

  const getTitle = () => {
    switch (type) {
      case 'active':
        return language === 'pt' ? 'Usuários Ativos' : language === 'es' ? 'Usuarios Activos' : 'Active Users';
      case 'canceled':
        return language === 'pt' ? 'Assinaturas Canceladas' : language === 'es' ? 'Suscripciones Canceladas' : 'Canceled Subscriptions';
      case 'failed':
        return language === 'pt' ? 'Pagamentos Falhados' : language === 'es' ? 'Pagos Fallidos' : 'Failed Payments';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'active':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(
      language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()} ({users.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              {getIcon()}
              <p className="mt-2">
                {language === 'pt' ? 'Nenhum usuário encontrado' : language === 'es' ? 'No se encontraron usuarios' : 'No users found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'pt' ? 'Nome' : language === 'es' ? 'Nombre' : 'Name'}</TableHead>
                  <TableHead>Email</TableHead>
                  {type === 'active' && (
                    <>
                      <TableHead>{language === 'pt' ? 'Tipo' : language === 'es' ? 'Tipo' : 'Type'}</TableHead>
                      <TableHead>{language === 'pt' ? 'Plano' : language === 'es' ? 'Plan' : 'Plan'}</TableHead>
                      <TableHead>{language === 'pt' ? 'Expira em' : language === 'es' ? 'Expira en' : 'Expires'}</TableHead>
                    </>
                  )}
                  {type === 'canceled' && (
                    <TableHead>{language === 'pt' ? 'Cancelado há' : language === 'es' ? 'Cancelado hace' : 'Canceled Since'}</TableHead>
                  )}
                  {type === 'failed' && (
                    <>
                      <TableHead>{language === 'pt' ? 'Data da Falha' : language === 'es' ? 'Fecha del Fallo' : 'Failure Date'}</TableHead>
                      <TableHead>{language === 'pt' ? 'Motivo' : language === 'es' ? 'Razón' : 'Reason'}</TableHead>
                    </>
                  )}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.display_name || user.email?.split('@')[0] || 'Usuário'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    {type === 'active' && (
                      <>
                        <TableCell>
                          {user.user_type === 'payer' ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {language === 'pt' ? 'Pagante' : language === 'es' ? 'Pagador' : 'Payer'}
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              {language === 'pt' ? 'Parceiro' : language === 'es' ? 'Socio' : 'Partner'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="border-blue-500 bg-blue-100 text-blue-800 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300">
                            {user.subscription_tier === 'partner' 
                              ? (language === 'pt' ? 'Via parceiro' : language === 'es' ? 'Vía socio' : 'Via partner')
                              : (user.subscription_tier || 'premium')}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.subscription_end ? formatDate(user.subscription_end) : '-'}</TableCell>
                      </>
                    )}
                    {type === 'canceled' && (
                      <TableCell>{formatDate(user.canceled_at)}</TableCell>
                    )}
                    {type === 'failed' && (
                      <>
                        <TableCell>{formatDate(user.failure_date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={user.failure_reason}>
                          {user.failure_reason || '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {type === 'active' && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {language === 'pt' ? 'Ativo' : language === 'es' ? 'Activo' : 'Active'}
                        </Badge>
                      )}
                      {type === 'canceled' && (
                        <Badge variant="destructive">
                          {language === 'pt' ? 'Cancelado' : language === 'es' ? 'Cancelado' : 'Canceled'}
                        </Badge>
                      )}
                      {type === 'failed' && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          {user.status || (language === 'pt' ? 'Pendente' : language === 'es' ? 'Pendiente' : 'Pending')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
