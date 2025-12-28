import { useState, useCallback } from 'react';
import { fetchSchemaAuditData, generateSchemaAuditPDF, SchemaAuditData } from '@/utils/schemaAuditExport';
import { toast } from '@/hooks/use-toast';

export interface SchemaAuditSummary {
  totalTables: number;
  totalForeignKeys: number;
  totalRLSPolicies: number;
  totalTriggers: number;
  criticalRisks: number;
  warningRisks: number;
  infoRisks: number;
  lastAuditDate: string | null;
}

export function useSchemaAudit() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<SchemaAuditData | null>(null);
  const [summary, setSummary] = useState<SchemaAuditSummary>({
    totalTables: 0,
    totalForeignKeys: 0,
    totalRLSPolicies: 0,
    totalTriggers: 0,
    criticalRisks: 0,
    warningRisks: 0,
    infoRisks: 0,
    lastAuditDate: null,
  });

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const auditData = await fetchSchemaAuditData();
      setData(auditData);
      
      setSummary({
        totalTables: auditData.tables.length,
        totalForeignKeys: auditData.foreignKeys.length,
        totalRLSPolicies: auditData.rlsPolicies.length,
        totalTriggers: auditData.triggers.length,
        criticalRisks: auditData.risks.filter(r => r.level === 'critical').length,
        warningRisks: auditData.risks.filter(r => r.level === 'warning').length,
        infoRisks: auditData.risks.filter(r => r.level === 'info').length,
        lastAuditDate: auditData.generatedAt,
      });

      toast({
        title: 'Auditoria concluída',
        description: `${auditData.tables.length} tabelas analisadas`,
      });

      return auditData;
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast({
        title: 'Erro na auditoria',
        description: 'Não foi possível coletar dados do schema',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToPDF = useCallback(async () => {
    setExporting(true);
    try {
      let auditData = data;
      
      // If no data, fetch it first
      if (!auditData) {
        auditData = await fetchSchemaAuditData();
        setData(auditData);
        
        setSummary({
          totalTables: auditData.tables.length,
          totalForeignKeys: auditData.foreignKeys.length,
          totalRLSPolicies: auditData.rlsPolicies.length,
          totalTriggers: auditData.triggers.length,
          criticalRisks: auditData.risks.filter(r => r.level === 'critical').length,
          warningRisks: auditData.risks.filter(r => r.level === 'warning').length,
          infoRisks: auditData.risks.filter(r => r.level === 'info').length,
          lastAuditDate: auditData.generatedAt,
        });
      }

      await generateSchemaAuditPDF(auditData);

      toast({
        title: 'PDF exportado',
        description: 'O dossiê de auditoria foi baixado com sucesso',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [data]);

  return {
    loading,
    exporting,
    data,
    summary,
    fetchAuditData,
    exportToPDF,
  };
}
