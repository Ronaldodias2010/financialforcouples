import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';
export type ViewMode = 'both' | 'user1' | 'user2';

interface ExportData {
  cashFlow: any[];
  expenses: any[];
  revenues: any[];
  taxReport: any[];
}

export async function fetchExportData(
  dateFrom: string,
  dateTo: string,
  viewMode: ViewMode,
  userId: string
): Promise<ExportData> {
  console.log('Fetching export data:', { dateFrom, dateTo, viewMode, userId });

  // Get user's couple relationship if exists
  const { data: couples } = await supabase
    .from('user_couples')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')
    .single();

  // Build user IDs array (user + partner if in couple)
  let userIds = [userId];
  if (couples) {
    const partnerId = couples.user1_id === userId ? couples.user2_id : couples.user1_id;
    userIds.push(partnerId);
  }

  // Fetch transactions with proper filtering
  let transactionsQuery = supabase
    .from('transactions')
    .select(`
      *,
      categories(name, category_type),
      cards(name),
      accounts(name)
    `)
    .gte('transaction_date', dateFrom)
    .lte('transaction_date', dateTo)
    .in('user_id', userIds);

  // Apply viewMode filter
  if (viewMode === 'user1') {
    transactionsQuery = transactionsQuery.eq('owner_user', 'user1');
  } else if (viewMode === 'user2') {
    transactionsQuery = transactionsQuery.eq('owner_user', 'user2');
  }

  const { data: transactions, error: transactionsError } = await transactionsQuery;
  
  if (transactionsError) {
    console.error('Error fetching transactions:', transactionsError);
  }
  
  console.log('Transactions fetched:', transactions?.length || 0);

  // Fetch accounts with proper filtering
  let accountsQuery = supabase
    .from('accounts')
    .select('*')
    .in('user_id', userIds)
    .eq('is_active', true);

  // Apply viewMode filter
  if (viewMode === 'user1') {
    accountsQuery = accountsQuery.eq('owner_user', 'user1');
  } else if (viewMode === 'user2') {
    accountsQuery = accountsQuery.eq('owner_user', 'user2');
  }

  const { data: accounts, error: accountsError } = await accountsQuery;
  
  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
  }
  
  console.log('Accounts fetched:', accounts?.length || 0);

  // Process data
  const expenses = transactions?.filter(t => t.type === 'expense') || [];
  const revenues = transactions?.filter(t => t.type === 'income') || [];

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryName = expense.categories?.name || 'Sem categoria';
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, items: [] };
    }
    acc[categoryName].total += expense.amount;
    acc[categoryName].items.push(expense);
    return acc;
  }, {});

  // Group revenues by category
  const revenuesByCategory = revenues.reduce((acc, revenue) => {
    const categoryName = revenue.categories?.name || 'Sem categoria';
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, items: [] };
    }
    acc[categoryName].total += revenue.amount;
    acc[categoryName].items.push(revenue);
    return acc;
  }, {});

  // Calculate cash flow by month
  let cashFlowSeparated: any[] = [];

  if (viewMode === 'both' && couples) {
    // Separate cash flow by user when viewing both users in a couple
    const cashFlowUser1: any = {};
    const cashFlowUser2: any = {};
    const cashFlowTotal: any = {};

    transactions?.forEach(transaction => {
      const month = format(new Date(transaction.transaction_date), 'yyyy-MM');
      
      // Initialize month objects
      if (!cashFlowUser1[month]) {
        cashFlowUser1[month] = { income: 0, expense: 0, balance: 0 };
        cashFlowUser2[month] = { income: 0, expense: 0, balance: 0 };
        cashFlowTotal[month] = { income: 0, expense: 0, balance: 0 };
      }

      const amount = transaction.amount;
      const isUser1 = transaction.owner_user === 'user1';

      if (transaction.type === 'income') {
        if (isUser1) {
          cashFlowUser1[month].income += amount;
        } else {
          cashFlowUser2[month].income += amount;
        }
        cashFlowTotal[month].income += amount;
      } else {
        if (isUser1) {
          cashFlowUser1[month].expense += amount;
        } else {
          cashFlowUser2[month].expense += amount;
        }
        cashFlowTotal[month].expense += amount;
      }

      // Calculate balances
      cashFlowUser1[month].balance = cashFlowUser1[month].income - cashFlowUser1[month].expense;
      cashFlowUser2[month].balance = cashFlowUser2[month].income - cashFlowUser2[month].expense;
      cashFlowTotal[month].balance = cashFlowTotal[month].income - cashFlowTotal[month].expense;
    });

    // Create separated entries for each month
    Object.keys(cashFlowTotal).forEach(month => {
      const monthName = format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR });
      
      // User 1 line
      cashFlowSeparated.push({
        description: `${monthName} - Usuário 1`,
        type: 'Usuário 1',
        amount: cashFlowUser1[month].balance
      });
      
      // User 2 line
      cashFlowSeparated.push({
        description: `${monthName} - Usuário 2`,
        type: 'Usuário 2', 
        amount: cashFlowUser2[month].balance
      });
      
      // Total line
      cashFlowSeparated.push({
        description: `${monthName} - Total`,
        type: 'Total',
        amount: cashFlowTotal[month].balance
      });
    });
  } else {
    // Single user or filtered view - consolidated cash flow
    const cashFlowByMonth = transactions?.reduce((acc, transaction) => {
      const month = format(new Date(transaction.transaction_date), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = { income: 0, expense: 0, balance: 0 };
      }
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expense += transaction.amount;
      }
      acc[month].balance = acc[month].income - acc[month].expense;
      return acc;
    }, {});

    Object.entries(cashFlowByMonth || {}).forEach(([month, data]: [string, any]) => {
      const monthName = format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR });
      
      cashFlowSeparated.push({
        description: `${monthName} - Saldo`,
        type: 'Saldo',
        amount: data.balance
      });
    });
  }

  return {
    cashFlow: cashFlowSeparated,
    expenses: Object.entries(expensesByCategory).map(([category, data]: [string, any]) => ({
      category,
      total: data.total,
      items: data.items
    })),
    revenues: Object.entries(revenuesByCategory).map(([category, data]: [string, any]) => ({
      category,
      total: data.total,
      items: data.items
    })),
    taxReport: [
      {
        totalrevenues: revenues.reduce((sum, r) => sum + r.amount, 0),
        totalexpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        saldocontas: accounts?.reduce((sum, a) => sum + a.balance, 0) || 0
      }
    ]
  };
}

export function exportToPDF(data: any[], title: string, columns: string[], filename: string) {
  console.log('Exporting to PDF:', { dataLength: data.length, columns });
  
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 20, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);

  // Column mapping
  const columnMap: { [key: string]: string } = {
    'Mês': 'month',
    'Receitas': 'income', 
    'Despesas': 'expense',
    'Saldo': 'balance',
    'Descrição': 'description',
    'Tipo': 'type', 
    'Valor': 'amount',
    'Categoria': 'category',
    'Total': 'total',
    'Total Receitas': 'totalrevenues',
    'Total Despesas': 'totalexpenses', 
    'Saldo Contas': 'saldocontas'
  };

  // Add table
  autoTable(doc, {
    head: [columns],
    body: data.map(row => columns.map(col => {
      const key = columnMap[col] || col.toLowerCase().replace(/\s+/g, '');
      const value = row[key];
      if (typeof value === 'number') {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      return value || '';
    })),
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [99, 102, 241] }
  });

  doc.save(`${filename}.pdf`);
}

export function exportToCSV(data: any[], columns: string[], filename: string) {
  console.log('Exporting to CSV:', { dataLength: data.length, columns });
  
  // Column mapping
  const columnMap: { [key: string]: string } = {
    'Mês': 'month',
    'Receitas': 'income', 
    'Despesas': 'expense',
    'Saldo': 'balance',
    'Descrição': 'description',
    'Tipo': 'type', 
    'Valor': 'amount',
    'Categoria': 'category',
    'Total': 'total',
    'Total Receitas': 'totalrevenues',
    'Total Despesas': 'totalexpenses', 
    'Saldo Contas': 'saldocontas'
  };

  const headers = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const key = columnMap[col] || col.toLowerCase().replace(/\s+/g, '');
      const value = row[key];
      if (typeof value === 'number') {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      }
      return `"${value || ''}"`;
    }).join(',')
  ).join('\n');

  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToExcel(data: any[], title: string, columns: string[], filename: string) {
  console.log('Exporting to Excel:', { dataLength: data.length, columns });
  
  // Column mapping
  const columnMap: { [key: string]: string } = {
    'Mês': 'month',
    'Receitas': 'income', 
    'Despesas': 'expense',
    'Saldo': 'balance',
    'Descrição': 'description',
    'Tipo': 'type', 
    'Valor': 'amount',
    'Categoria': 'category',
    'Total': 'total',
    'Total Receitas': 'totalrevenues',
    'Total Despesas': 'totalexpenses', 
    'Saldo Contas': 'saldocontas'
  };

  // Prepare data for Excel
  const worksheetData = [
    columns, // Headers
    ...data.map(row => 
      columns.map(col => {
        const key = columnMap[col] || col.toLowerCase().replace(/\s+/g, '');
        const value = row[key];
        return value || '';
      })
    )
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;

  // Style headers
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center" }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, title);

  // Save file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export async function exportCashFlow(
  format: ExportFormat,
  dateFrom: string,
  dateTo: string,
  viewMode: ViewMode,
  userId: string
) {
  const data = await fetchExportData(dateFrom, dateTo, viewMode, userId);
  const columns = ['Descrição', 'Tipo', 'Valor'];
  
  if (format === 'pdf') {
    exportToPDF(data.cashFlow, 'Relatório de Fluxo de Caixa', columns, 'fluxo-de-caixa');
  } else if (format === 'csv') {
    exportToCSV(data.cashFlow, columns, 'fluxo-de-caixa');
  } else {
    exportToExcel(data.cashFlow, 'Fluxo de Caixa', columns, 'fluxo-de-caixa');
  }
}

export async function exportConsolidatedExpenses(
  format: ExportFormat,
  dateFrom: string,
  dateTo: string,
  viewMode: ViewMode,
  userId: string
) {
  const data = await fetchExportData(dateFrom, dateTo, viewMode, userId);
  const columns = ['Categoria', 'Total'];
  
  if (format === 'pdf') {
    exportToPDF(data.expenses, 'Relatório de Gastos Consolidados', columns, 'gastos-consolidados');
  } else if (format === 'csv') {
    exportToCSV(data.expenses, columns, 'gastos-consolidados');
  } else {
    exportToExcel(data.expenses, 'Gastos Consolidados', columns, 'gastos-consolidados');
  }
}

export async function exportConsolidatedRevenues(
  format: ExportFormat,
  dateFrom: string,
  dateTo: string,
  viewMode: ViewMode,
  userId: string
) {
  const data = await fetchExportData(dateFrom, dateTo, viewMode, userId);
  const columns = ['Categoria', 'Total'];
  
  if (format === 'pdf') {
    exportToPDF(data.revenues, 'Relatório de Receitas Consolidadas', columns, 'receitas-consolidadas');
  } else if (format === 'csv') {
    exportToCSV(data.revenues, columns, 'receitas-consolidadas');
  } else {
    exportToExcel(data.revenues, 'Receitas Consolidadas', columns, 'receitas-consolidadas');
  }
}

export async function exportTaxReport(
  format: ExportFormat,
  dateFrom: string,
  dateTo: string,
  viewMode: ViewMode,
  userId: string
) {
  const data = await fetchExportData(dateFrom, dateTo, viewMode, userId);
  const columns = ['Total Receitas', 'Total Despesas', 'Saldo Contas'];
  
  if (format === 'pdf') {
    exportToPDF(data.taxReport, 'Relatório para Imposto de Renda', columns, 'relatorio-imposto-renda');
  } else if (format === 'csv') {
    exportToCSV(data.taxReport, columns, 'relatorio-imposto-renda');
  } else {
    exportToExcel(data.taxReport, 'Imposto de Renda', columns, 'relatorio-imposto-renda');
  }
}