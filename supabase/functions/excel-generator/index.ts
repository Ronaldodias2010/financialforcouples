import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Excel generator using CSV format with proper headers
// In production, you would use a proper Excel library like xlsx
function generateExcelCSV(data: any): string {
  const { transactions, totals, currency, metadata } = data;
  
  let csv = '';
  
  // Add title and metadata
  csv += `EXTRATO CONVERTIDO\n`;
  csv += `Arquivo: ${data.fileName}\n`;
  csv += `Data de Exportação: ${new Date(metadata.exportDate).toLocaleDateString('pt-BR')}\n`;
  csv += `Total de Transações: ${metadata.totalTransactions}\n`;
  csv += `Moeda: ${currency}\n`;
  csv += `\n`;
  
  // Add headers
  csv += `Data,Descrição,Entradas,Saídas,Saldo,Categoria,Método Pagamento,Confiança\n`;
  
  // Add transactions
  for (const transaction of transactions) {
    const date = transaction.date;
    const description = `"${transaction.description.replace(/"/g, '""')}"`;
    const income = transaction.income > 0 ? transaction.income.toFixed(2) : '';
    const expense = transaction.expense > 0 ? transaction.expense.toFixed(2) : '';
    const balance = transaction.balance.toFixed(2);
    const category = `"${transaction.category}"`;
    const paymentMethod = transaction.paymentMethod;
    const confidence = `${Math.round(transaction.confidence * 100)}%`;
    
    csv += `${date},${description},${income},${expense},${balance},${category},${paymentMethod},${confidence}\n`;
  }
  
  // Add totals
  csv += `\n`;
  csv += `RESUMO\n`;
  csv += `Total Receitas,${totals.totalIncome.toFixed(2)}\n`;
  csv += `Total Despesas,${totals.totalExpense.toFixed(2)}\n`;
  csv += `Saldo Final,${totals.finalBalance.toFixed(2)}\n`;
  
  // Add analysis
  csv += `\n`;
  csv += `ANÁLISE\n`;
  csv += `Transações de Receita,${transactions.filter((t: any) => t.income > 0).length}\n`;
  csv += `Transações de Despesa,${transactions.filter((t: any) => t.expense > 0).length}\n`;
  csv += `Maior Receita,"${Math.max(...transactions.map((t: any) => t.income)).toFixed(2)}"\n`;
  csv += `Maior Despesa,"${Math.max(...transactions.map((t: any) => t.expense)).toFixed(2)}"\n`;
  
  // Add monthly summary if data spans multiple months
  const monthlyData = new Map();
  for (const transaction of transactions) {
    const month = transaction.date.substring(3); // MM/YYYY
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { income: 0, expense: 0 });
    }
    const monthData = monthlyData.get(month);
    monthData.income += transaction.income;
    monthData.expense += transaction.expense;
  }
  
  if (monthlyData.size > 1) {
    csv += `\n`;
    csv += `RESUMO MENSAL\n`;
    csv += `Mês,Receitas,Despesas,Saldo\n`;
    
    for (const [month, data] of monthlyData.entries()) {
      const balance = data.income - data.expense;
      csv += `${month},${data.income.toFixed(2)},${data.expense.toFixed(2)},${balance.toFixed(2)}\n`;
    }
  }
  
  return csv;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    console.log('Generating Excel file...', {
      fileName: requestData.fileName,
      transactionCount: requestData.transactions?.length || 0,
      currency: requestData.currency
    });

    // Generate CSV content (Excel-compatible)
    const csvContent = generateExcelCSV(requestData);
    
    // Convert to proper encoding for Excel
    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const content = bom + csvContent;
    
    // Create response with proper headers for Excel file
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${requestData.fileName}"`,
      'Content-Length': new TextEncoder().encode(content).length.toString(),
    };

    console.log('Excel file generated successfully');
    
    return new Response(content, { headers });

  } catch (error) {
    console.error('Excel generation error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});