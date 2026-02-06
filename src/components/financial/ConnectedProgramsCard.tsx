import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link2, RefreshCw, CheckCircle, Clock, AlertCircle, Download, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncLog {
  id: string;
  program_code: string;
  program_name: string;
  balance: number;
  created_at: string;
  sync_status: string;
}

interface ConnectedProgram {
  code: string;
  name: string;
  logo: string;
  lastSync: Date | null;
  balance: number | null;
  status: 'connected' | 'pending' | 'error';
}

const SUPPORTED_PROGRAMS = [
  { code: 'latam_pass', name: 'LATAM Pass', logo: '/mileage-logos/latam.png', domain: 'latam.com' },
  { code: 'azul', name: 'Azul Fidelidade', logo: '/mileage-logos/azul.jpg', domain: 'tudoazul.com.br' },
  { code: 'smiles', name: 'Smiles', logo: '/mileage-logos/smiles.png', domain: 'smiles.com.br' },
  { code: 'livelo', name: 'Livelo', logo: '/mileage-logos/livelo.png', domain: 'livelo.com.br' },
];

export const ConnectedProgramsCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSyncLogs();
    }
  }, [user]);

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('extension_sync_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectedPrograms = (): ConnectedProgram[] => {
    return SUPPORTED_PROGRAMS.map(program => {
      const latestLog = syncLogs.find(log => log.program_code === program.code);
      
      return {
        code: program.code,
        name: program.name,
        logo: program.logo,
        lastSync: latestLog ? new Date(latestLog.created_at) : null,
        balance: latestLog?.balance || null,
        status: latestLog 
          ? (latestLog.sync_status === 'success' ? 'connected' : 'error')
          : 'pending'
      };
    });
  };

  const programs = getConnectedPrograms();
  const connectedCount = programs.filter(p => p.status === 'connected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sincronizado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        );
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca sincronizado';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Programas Conectados</CardTitle>
              <CardDescription>
                Sincronize seus saldos via extensão do navegador
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {connectedCount}/{SUPPORTED_PROGRAMS.length} conectados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Extension Download CTA */}
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Extensão Couples Miles</p>
              <p className="text-xs text-muted-foreground">
                Instale para sincronizar automaticamente seus saldos
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" disabled>
            <Download className="w-4 h-4 mr-2" />
            Em breve
          </Button>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {programs.map((program) => (
            <div
              key={program.code}
              className={`p-4 rounded-lg border transition-all ${
                program.status === 'connected'
                  ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  : 'bg-muted/30 border-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm">
                  <img
                    src={program.logo}
                    alt={program.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{program.name}</p>
                    {getStatusBadge(program.status)}
                  </div>
                  {program.balance !== null ? (
                    <p className="text-lg font-bold text-primary">
                      {program.balance.toLocaleString('pt-BR')} milhas
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {formatLastSync(program.lastSync)}
                    </p>
                  )}
                  {program.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Última sync: {formatLastSync(program.lastSync)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Como funciona?
          </h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Instale a extensão Couples Miles no seu navegador</li>
            <li>Faça login na sua conta Couples pela extensão</li>
            <li>Acesse o site da companhia aérea e faça login normalmente</li>
            <li>Clique em "Sincronizar Milhas" na extensão</li>
            <li>Pronto! Seu saldo será atualizado automaticamente aqui</li>
          </ol>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={loadSyncLogs}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Status
        </Button>
      </CardContent>
    </Card>
  );
};
