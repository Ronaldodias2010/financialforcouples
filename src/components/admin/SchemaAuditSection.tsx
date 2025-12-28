import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSchemaAudit } from '@/hooks/useSchemaAudit';
import { exportN8NDocumentation } from '@/utils/n8nDocExport';
import { Database, Key, Shield, Zap, AlertTriangle, AlertCircle, Info, RefreshCw, Download, FileText, MessageSquare } from 'lucide-react';

interface SchemaAuditSectionProps {
  language?: 'pt' | 'en';
}

export function SchemaAuditSection({ language = 'pt' }: SchemaAuditSectionProps) {
  const { loading, exporting, summary, data, fetchAuditData, exportToPDF } = useSchemaAudit();
  const [exportingN8N, setExportingN8N] = useState(false);

  const handleExportN8N = async () => {
    setExportingN8N(true);
    try {
      exportN8NDocumentation();
    } finally {
      setExportingN8N(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const t = {
    pt: {
      title: 'Auditoria do Schema do Banco de Dados',
      subtitle: 'Dossiê técnico completo para análise arquitetural',
      tables: 'Tabelas',
      foreignKeys: 'Foreign Keys',
      rlsPolicies: 'Políticas RLS',
      triggers: 'Triggers',
      critical: 'CRÍTICO',
      warning: 'ATENÇÃO',
      ok: 'OK',
      risksTitle: 'Riscos Identificados',
      lastAudit: 'Última auditoria',
      refresh: 'Atualizar',
      export: 'Exportar PDF Completo',
      exportN8N: 'Guia N8N WhatsApp',
      loading: 'Carregando...',
      exporting: 'Gerando PDF...',
      noForeignKeys: 'Nenhuma Foreign Key explícita definida',
      triggersInactive: 'Funções de trigger podem não estar vinculadas',
      rlsActive: 'Row Level Security ativo na maioria das tabelas',
    },
    en: {
      title: 'Database Schema Audit',
      subtitle: 'Complete technical dossier for architectural analysis',
      tables: 'Tables',
      foreignKeys: 'Foreign Keys',
      rlsPolicies: 'RLS Policies',
      triggers: 'Triggers',
      critical: 'CRITICAL',
      warning: 'WARNING',
      ok: 'OK',
      risksTitle: 'Identified Risks',
      lastAudit: 'Last audit',
      refresh: 'Refresh',
      export: 'Export Full PDF',
      exportN8N: 'N8N WhatsApp Guide',
      loading: 'Loading...',
      exporting: 'Generating PDF...',
      noForeignKeys: 'No explicit Foreign Keys defined',
      triggersInactive: 'Trigger functions may not be linked',
      rlsActive: 'Row Level Security active on most tables',
    },
  };

  const text = t[language];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  🔍 {text.title}
                </CardTitle>
                <CardDescription>{text.subtitle}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAuditData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? text.loading : text.refresh}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportN8N}
                disabled={exportingN8N}
                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <MessageSquare className={`h-4 w-4 mr-2 ${exportingN8N ? 'animate-pulse' : ''}`} />
                {text.exportN8N}
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={exporting || loading}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? text.exporting : text.export}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tables */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{text.tables}</p>
                <p className="text-3xl font-bold">{summary.totalTables}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✅ {text.ok}
            </Badge>
          </CardContent>
        </Card>

        {/* Foreign Keys */}
        <Card className={summary.totalForeignKeys === 0 ? 'border-red-300 dark:border-red-800' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{text.foreignKeys}</p>
                <p className="text-3xl font-bold">{summary.totalForeignKeys}</p>
              </div>
              <div className={`p-3 rounded-full ${summary.totalForeignKeys === 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <Key className={`h-6 w-6 ${summary.totalForeignKeys === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
            </div>
            <Badge 
              variant="destructive" 
              className={summary.totalForeignKeys === 0 ? 'mt-2' : 'mt-2 bg-green-500'}
            >
              {summary.totalForeignKeys === 0 ? `🔴 ${text.critical}` : `✅ ${text.ok}`}
            </Badge>
          </CardContent>
        </Card>

        {/* RLS Policies */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{text.rlsPolicies}</p>
                <p className="text-3xl font-bold">{summary.totalRLSPolicies}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✅ {text.ok}
            </Badge>
          </CardContent>
        </Card>

        {/* Triggers */}
        <Card className={summary.totalTriggers === 0 ? 'border-yellow-300 dark:border-yellow-800' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{text.triggers}</p>
                <p className="text-3xl font-bold">{summary.totalTriggers}</p>
              </div>
              <div className={`p-3 rounded-full ${summary.totalTriggers === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <Zap className={`h-6 w-6 ${summary.totalTriggers === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
            </div>
            <Badge 
              variant={summary.totalTriggers === 0 ? 'secondary' : 'outline'}
              className={summary.totalTriggers === 0 ? 'mt-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'mt-2 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
            >
              {summary.totalTriggers === 0 ? `⚠️ ${text.warning}` : `✅ ${text.ok}`}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Risks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            {text.risksTitle}
          </CardTitle>
          <CardDescription>
            {text.lastAudit}: {formatDate(summary.lastAuditDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.risks.map((risk, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  risk.level === 'critical'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : risk.level === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {risk.level === 'critical' ? (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  ) : risk.level === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      risk.level === 'critical'
                        ? 'text-red-800 dark:text-red-300'
                        : risk.level === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      {risk.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {risk.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {(!data?.risks || data.risks.length === 0) && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Clique em "Atualizar" para executar a auditoria</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-3 animate-spin opacity-50" />
                <p>{text.loading}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
