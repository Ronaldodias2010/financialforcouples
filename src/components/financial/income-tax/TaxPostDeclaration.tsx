import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar,
  FileText,
  TrendingUp,
  Receipt,
  Home,
  Clock,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Save,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxReportSummary } from '@/hooks/useIncomeTaxReport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ReceitaStatus = 'pending' | 'processing' | 'approved' | 'malha_fina' | 'refund_released';

const statusConfig: Record<ReceitaStatus, { labelKey: string; className: string; icon: React.ElementType }> = {
  pending: { labelKey: 'tax.post.status.pending', className: 'bg-muted text-muted-foreground', icon: Clock },
  processing: { labelKey: 'tax.post.status.processing', className: 'bg-blue-500/10 text-blue-500', icon: FileText },
  approved: { labelKey: 'tax.post.status.approved', className: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  malha_fina: { labelKey: 'tax.post.status.malhaFina', className: 'bg-red-500/10 text-red-500', icon: AlertTriangle },
  refund_released: { labelKey: 'tax.post.status.refundReleased', className: 'bg-green-500/10 text-green-500', icon: TrendingUp },
};

interface TaxPostDeclarationProps {
  taxYear: number;
  summary: TaxReportSummary;
  declaredAt: string;
  receitaStatus: ReceitaStatus | null;
  notesNextYear: string | null;
  estimatedTax: number;
  estimatedRefund: number;
  onUpdateStatus: (status: ReceitaStatus) => void;
  onUpdateNotes: (notes: string) => void;
  isSaving?: boolean;
}

export function TaxPostDeclaration({
  taxYear,
  summary,
  declaredAt,
  receitaStatus,
  notesNextYear,
  estimatedTax,
  estimatedRefund,
  onUpdateStatus,
  onUpdateNotes,
  isSaving,
}: TaxPostDeclarationProps) {
  const { t } = useLanguage();
  const [notes, setNotes] = React.useState(notesNextYear || '');
  const [status, setStatus] = React.useState<ReceitaStatus>(receitaStatus || 'pending');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const StatusIcon = statusConfig[status]?.icon || Clock;

  const handleSaveNotes = () => {
    onUpdateNotes(notes);
  };

  const handleStatusChange = (newStatus: ReceitaStatus) => {
    setStatus(newStatus);
    onUpdateStatus(newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
                {t('tax.post.declared')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('tax.post.declaredOn')} {format(new Date(declaredAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-500 border-green-500/20 text-lg px-4 py-2">
              {taxYear}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('tax.card.taxableIncome')}</p>
                <p className="font-bold">{formatCurrency(summary.taxableIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('tax.card.deductions')}</p>
                <p className="font-bold">{formatCurrency(summary.deductibleExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('tax.card.assets')}</p>
                <p className="font-bold">{formatCurrency(summary.totalAssets)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={estimatedRefund > 0 ? 'border-green-500/30' : 'border-red-500/30'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className={`h-5 w-5 ${estimatedRefund > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-xs text-muted-foreground">
                  {estimatedRefund > 0 ? t('tax.post.refundEstimate') : t('tax.post.taxDue')}
                </p>
                <p className="font-bold">
                  {formatCurrency(estimatedRefund > 0 ? estimatedRefund : estimatedTax)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig[status]?.className.split(' ')[1]}`} />
            {t('tax.post.receitaStatus')}
          </CardTitle>
          <CardDescription>{t('tax.post.receitaStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={status} onValueChange={(v) => handleStatusChange(v as ReceitaStatus)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className={`h-4 w-4 ${config.className.split(' ')[1]}`} />
                    {t(config.labelKey)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="link"
            className="mt-2 p-0 h-auto text-sm"
            asChild
          >
            <a href="https://cav.receita.fazenda.gov.br" target="_blank" rel="noopener noreferrer">
              {t('tax.post.checkReceita')}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Tips for Next Year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {t('tax.post.tipsTitle')}
          </CardTitle>
          <CardDescription>{t('tax.post.tipsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm">{t('tax.post.tip1')}</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm">{t('tax.post.tip2')}</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm">{t('tax.post.tip3')}</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm">{t('tax.post.tip4')}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('tax.post.personalNotes')}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('tax.post.notesPlaceholder')}
              rows={3}
            />
            <Button 
              size="sm" 
              onClick={handleSaveNotes}
              disabled={isSaving || notes === notesNextYear}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
