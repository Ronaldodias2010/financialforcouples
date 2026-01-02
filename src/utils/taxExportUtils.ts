import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TaxReportSummary, 
  TaxableIncome, 
  DeductibleExpense, 
  TaxAsset,
  PendingItem 
} from '@/hooks/useIncomeTaxReport';
import { supabase } from '@/integrations/supabase/client';

interface TaxExportData {
  taxYear: number;
  summary: TaxReportSummary;
  taxableIncomes: TaxableIncome[];
  exemptIncomes: TaxableIncome[];
  deductibleExpenses: DeductibleExpense[];
  taxAssets: TaxAsset[];
  pendingItems?: PendingItem[];
  profile?: {
    display_name?: string;
    cpf?: string;
  };
}

// Format currency
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
};

// Fetch documents for export
async function fetchTaxDocuments(taxYear: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tax_deduction_documents')
    .select('*')
    .eq('tax_year', taxYear);

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
  return data || [];
}

// Export Tax Report to PDF
export async function exportTaxReportPDF(data: TaxExportData): Promise<void> {
  const doc = new jsPDF();
  const documents = await fetchTaxDocuments(data.taxYear);
  
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Primary color
  doc.text('Relatório para Imposto de Renda', 20, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`Ano-Calendário: ${data.taxYear}`, 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, yPos);
  yPos += 15;

  // Identification
  if (data.profile) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('IDENTIFICAÇÃO DO CONTRIBUINTE', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Nome: ${data.profile.display_name || 'Não informado'}`, 25, yPos);
    yPos += 6;
    doc.text(`CPF: ${data.profile.cpf || 'Não informado'}`, 25, yPos);
    yPos += 12;
  }

  // Summary Box
  doc.setFillColor(249, 250, 251);
  doc.rect(20, yPos, 170, 35, 'F');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('RESUMO', 25, yPos + 8);
  
  doc.setFontSize(10);
  yPos += 14;
  doc.text(`Rendimentos Tributáveis: ${formatCurrency(data.summary.taxableIncome)}`, 25, yPos);
  yPos += 6;
  doc.text(`Rendimentos Isentos: ${formatCurrency(data.summary.exemptIncome)}`, 25, yPos);
  yPos += 6;
  doc.text(`Despesas Dedutíveis: ${formatCurrency(data.summary.deductibleExpenses)}`, 25, yPos);
  yPos += 6;
  doc.text(`Total em Bens: ${formatCurrency(data.summary.totalAssets)}`, 25, yPos);
  yPos += 15;

  // Taxable Income Section
  if (data.taxableIncomes.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text('RENDIMENTOS TRIBUTÁVEIS', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Qtd.', 'Total']],
      body: data.taxableIncomes.map(income => [
        income.category,
        income.count.toString(),
        formatCurrency(income.total)
      ]),
      foot: [[
        'TOTAL',
        '',
        formatCurrency(data.taxableIncomes.reduce((sum, i) => sum + i.total, 0))
      ]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Exempt Income Section
  if (data.exemptIncomes.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text('RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Qtd.', 'Total']],
      body: data.exemptIncomes.map(income => [
        income.category,
        income.count.toString(),
        formatCurrency(income.total)
      ]),
      foot: [[
        'TOTAL',
        '',
        formatCurrency(data.exemptIncomes.reduce((sum, i) => sum + i.total, 0))
      ]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Deductible Expenses Section
  if (data.deductibleExpenses.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text('DESPESAS DEDUTÍVEIS', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Total', 'Dedutível', 'Limite', 'Docs']],
      body: data.deductibleExpenses.map(expense => [
        `${expense.icon} ${expense.category}`,
        formatCurrency(expense.total),
        formatCurrency(expense.deductibleAmount),
        expense.legalLimit ? formatCurrency(expense.legalLimit) : 'Sem limite',
        expense.documentsCount.toString()
      ]),
      foot: [[
        'TOTAL DEDUTÍVEL',
        '',
        formatCurrency(data.deductibleExpenses.reduce((sum, e) => sum + e.deductibleAmount, 0)),
        '',
        ''
      ]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 88, 12] },
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Assets Section
  if (data.taxAssets.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text('BENS E DIREITOS', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Tipo', 'Valor 31/12']],
      body: data.taxAssets.map(asset => [
        asset.irDescription || asset.description,
        asset.type === 'investment' ? 'Investimento' : 'Conta Bancária',
        formatCurrency(asset.valueAtYearEnd)
      ]),
      foot: [[
        'TOTAL',
        '',
        formatCurrency(data.taxAssets.reduce((sum, a) => sum + a.valueAtYearEnd, 0))
      ]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Documents Section
  if (documents.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(139, 92, 246);
    doc.text('DOCUMENTOS COMPROBATÓRIOS ARMAZENADOS', 20, yPos);
    yPos += 5;

    const categoryLabels: Record<string, string> = {
      health: 'Saúde',
      education: 'Educação',
      pension: 'Previdência',
      dependents: 'Dependentes',
      alimony: 'Pensão Alimentícia'
    };

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Descrição', 'Data Upload', 'Arquivo']],
      body: documents.map(d => [
        categoryLabels[d.category] || d.category,
        d.document_name || d.notes || '-',
        format(new Date(d.created_at), 'dd/MM/yyyy', { locale: ptBR }),
        d.document_name || '-'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const disclaimer = 'Este relatório é um resumo informativo para auxiliar na declaração do IR. Consulte um contador para validação.';
  doc.text(disclaimer, 20, 280);

  // Save
  doc.save(`Relatorio-IR-${data.taxYear}.pdf`);
}

// Export Tax Report to Excel
export async function exportTaxReportExcel(data: TaxExportData): Promise<void> {
  const documents = await fetchTaxDocuments(data.taxYear);
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['RELATÓRIO PARA IMPOSTO DE RENDA'],
    [`Ano-Calendário: ${data.taxYear}`],
    [`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`],
    [],
    ['RESUMO GERAL'],
    ['Descrição', 'Valor'],
    ['Rendimentos Tributáveis', data.summary.taxableIncome],
    ['Rendimentos Isentos', data.summary.exemptIncome],
    ['Despesas Dedutíveis', data.summary.deductibleExpenses],
    ['Total em Bens', data.summary.totalAssets],
    ['Progresso', `${data.summary.progress}%`]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Taxable Income Sheet
  if (data.taxableIncomes.length > 0) {
    const incomeData = [
      ['RENDIMENTOS TRIBUTÁVEIS'],
      ['Categoria', 'Quantidade', 'Total'],
      ...data.taxableIncomes.map(i => [i.category, i.count, i.total]),
      [],
      ['TOTAL', '', data.taxableIncomes.reduce((sum, i) => sum + i.total, 0)]
    ];
    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
    incomeSheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Rend. Tributáveis');
  }

  // Exempt Income Sheet
  if (data.exemptIncomes.length > 0) {
    const exemptData = [
      ['RENDIMENTOS ISENTOS'],
      ['Categoria', 'Quantidade', 'Total'],
      ...data.exemptIncomes.map(i => [i.category, i.count, i.total]),
      [],
      ['TOTAL', '', data.exemptIncomes.reduce((sum, i) => sum + i.total, 0)]
    ];
    const exemptSheet = XLSX.utils.aoa_to_sheet(exemptData);
    exemptSheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, exemptSheet, 'Rend. Isentos');
  }

  // Deductible Expenses Sheet
  if (data.deductibleExpenses.length > 0) {
    const expenseData = [
      ['DESPESAS DEDUTÍVEIS'],
      ['Categoria', 'Total', 'Valor Dedutível', 'Limite Legal', 'Documentos'],
      ...data.deductibleExpenses.map(e => [
        e.category,
        e.total,
        e.deductibleAmount,
        e.legalLimit || 'Sem limite',
        e.documentsCount
      ]),
      [],
      ['TOTAL DEDUTÍVEL', '', data.deductibleExpenses.reduce((sum, e) => sum + e.deductibleAmount, 0), '', '']
    ];
    const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
    expenseSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Desp. Dedutíveis');
  }

  // Assets Sheet
  if (data.taxAssets.length > 0) {
    const assetData = [
      ['BENS E DIREITOS'],
      ['Descrição IR', 'Tipo', 'Valor Início', 'Valor Fim'],
      ...data.taxAssets.map(a => [
        a.irDescription || a.description,
        a.type === 'investment' ? 'Investimento' : 'Conta Bancária',
        a.valueAtYearStart,
        a.valueAtYearEnd
      ]),
      [],
      ['TOTAL', '', '', data.taxAssets.reduce((sum, a) => sum + a.valueAtYearEnd, 0)]
    ];
    const assetSheet = XLSX.utils.aoa_to_sheet(assetData);
    assetSheet['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, assetSheet, 'Bens e Direitos');
  }

  // Documents Sheet
  if (documents.length > 0) {
    const categoryLabels: Record<string, string> = {
      health: 'Saúde',
      education: 'Educação',
      pension: 'Previdência',
      dependents: 'Dependentes',
      alimony: 'Pensão Alimentícia'
    };

    const docData = [
      ['DOCUMENTOS COMPROBATÓRIOS'],
      ['Categoria', 'Descrição', 'Arquivo', 'Data Upload'],
      ...documents.map(d => [
        categoryLabels[d.category] || d.category,
        d.document_name || d.notes || '-',
        d.document_name || '-',
        format(new Date(d.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ])
    ];
    const docSheet = XLSX.utils.aoa_to_sheet(docData);
    docSheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, docSheet, 'Documentos');
  }

  // Save
  XLSX.writeFile(workbook, `Relatorio-IR-${data.taxYear}.xlsx`);
}
