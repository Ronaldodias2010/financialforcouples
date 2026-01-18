import React from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Loader2, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MileageProgram } from '@/hooks/useMileagePrograms';
import { getProgramByCode, formatMilesValue } from '@/data/mileagePrograms';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface MileageProgramCardProps {
  program: MileageProgram;
  isSyncing: boolean;
  onSync: () => void;
  onEdit: () => void;
  onDisconnect: () => void;
}

// For now, no programs have real automatic sync - all use manual entry
const PROGRAMS_WITH_AUTO_SYNC: string[] = []; // e.g., ['latam_pass'] when OAuth is implemented

export function MileageProgramCard({
  program,
  isSyncing,
  onSync,
  onEdit,
  onDisconnect
}: MileageProgramCardProps) {
  const { t, language } = useLanguage();
  const programConfig = getProgramByCode(program.program_code);

  const getDateLocale = () => {
    switch (language) {
      case 'pt': return ptBR;
      case 'es': return es;
      default: return enUS;
    }
  };

  const getStatusIcon = () => {
    switch (program.status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (program.status) {
      case 'connected':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            {t('mileage.programs.status.connected')}
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            {t('mileage.programs.status.connecting')}
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            {t('mileage.programs.status.error')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatLastSync = () => {
    if (!program.last_sync_at) return null;
    return format(new Date(program.last_sync_at), 'dd/MM', { locale: getDateLocale() });
  };

  return (
    <Card 
      className="relative overflow-hidden transition-all hover:shadow-lg"
      style={{ 
        borderTop: `3px solid ${programConfig?.primaryColor || 'hsl(var(--primary))'}` 
      }}
    >
      <div className="p-4">
        {/* Header with Logo and Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {programConfig?.logo ? (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center p-2"
                style={{ backgroundColor: `${programConfig.primaryColor}15` }}
              >
                <img 
                  src={programConfig.logo} 
                  alt={program.program_name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<span class="text-lg font-bold" style="color: ${programConfig.primaryColor}">${program.program_name.charAt(0)}</span>`;
                  }}
                />
              </div>
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${programConfig?.primaryColor || '#888'}15` }}
              >
                <span 
                  className="text-lg font-bold"
                  style={{ color: programConfig?.primaryColor || '#888' }}
                >
                  {program.program_name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">{program.program_name}</h3>
              {getStatusBadge()}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDisconnect} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('mileage.programs.disconnect')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Balance Display */}
        <div className="text-center py-4">
          {program.status === 'error' ? (
            <div className="text-red-500 text-sm">
              {program.last_error || t('mileage.programs.status.error')}
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-foreground">
                {program.balance_miles.toLocaleString()}
              </div>
              {program.balance_value && program.balance_value > 0 && (
                <div className="text-muted-foreground text-sm mt-1">
                  {formatMilesValue(program.balance_miles, programConfig?.estimatedValuePerMile || 0)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Last Sync and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {getStatusIcon()}
            {program.last_sync_at ? (
              <span>{formatLastSync()}</span>
            ) : (
              <span>{t('mileage.programs.neverSynced')}</span>
            )}
          </div>
          
          {PROGRAMS_WITH_AUTO_SYNC.includes(program.program_code) ? (
            // Programs with real sync capability
            <Button
              variant="ghost"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="h-8"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          ) : (
            // Programs without auto sync - show edit button instead
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 text-xs gap-1"
            >
              <Edit className="h-3 w-3" />
              {t('mileage.programs.updateBalance')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
