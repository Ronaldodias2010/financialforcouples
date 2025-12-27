import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIP, createRateLimitResponse } from "../_shared/rateLimiter.ts";
import { logSecurityEvent, createAuditContext } from "../_shared/auditLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a proper Excel file using SheetJS (XLSX) format
async function generateExcelFile(data: any): Promise<Uint8Array> {
  const { transactions, totals, currency, metadata } = data;
  
  console.log('Generating Excel with transactions:', transactions.length);
  
  // Import XLSX library from CDN
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Transactions
  const transactionData = [
    // Header with metadata
    ['EXTRATO CONVERTIDO'],
    [`Arquivo: ${data.fileName}`],
    [`Data de Exportação: ${new Date(metadata.exportDate).toLocaleDateString('pt-BR')}`],
    [`Total de Transações: ${metadata.totalTransactions}`],
    [`Moeda: ${currency}`],
    [],
    // Table headers
    ['Data', 'Descrição', 'Entradas', 'Saídas', 'Saldo', 'Categoria', 'Método Pagamento', 'Confiança']
  ];
  
  // Add transaction rows
  for (const transaction of transactions) {
    transactionData.push([
      transaction.date,
      transaction.description,
      transaction.income > 0 ? transaction.income : '',
      transaction.expense > 0 ? transaction.expense : '',
      transaction.balance,
      transaction.category || 'Sem categoria',
      transaction.paymentMethod || 'cash',
      `${Math.round(transaction.confidence * 100)}%`
    ]);
  }
  
  // Add summary section
  transactionData.push(
    [],
    ['RESUMO'],
    ['Total Receitas', totals.totalIncome],
    ['Total Despesas', totals.totalExpense],
    ['Saldo Final', totals.finalBalance]
  );
  
  // Add analysis section
  const incomeTransactions = transactions.filter((t: any) => t.income > 0);
  const expenseTransactions = transactions.filter((t: any) => t.expense > 0);
  
  transactionData.push(
    [],
    ['ANÁLISE'],
    ['Transações de Receita', incomeTransactions.length],
    ['Transações de Despesa', expenseTransactions.length]
  );
  
  if (incomeTransactions.length > 0) {
    const maxIncome = Math.max(...incomeTransactions.map((t: any) => t.income));
    transactionData.push(['Maior Receita', maxIncome]);
  }
  
  if (expenseTransactions.length > 0) {
    const maxExpense = Math.max(...expenseTransactions.map((t: any) => t.expense));
    transactionData.push(['Maior Despesa', maxExpense]);
  }
  
  // Create worksheet from data
  const ws = XLSX.utils.aoa_to_sheet(transactionData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Data
    { wch: 40 },  // Descrição
    { wch: 12 },  // Entradas
    { wch: 12 },  // Saídas
    { wch: 12 },  // Saldo
    { wch: 20 },  // Categoria
    { wch: 18 },  // Método Pagamento
    { wch: 10 }   // Confiança
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');
  
  // Generate Excel file buffer
  const excelBuffer = XLSX.write(wb, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true
  });
  
  return new Uint8Array(excelBuffer);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const auditContext = createAuditContext(req);

  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'excel-generator');
    
    if (!rateLimitResult.allowed) {
      console.log(`[EXCEL-GENERATOR] Rate limit exceeded for IP: ${clientIP}`);

      // Log rate limit exceeded event
      await logSecurityEvent({
        actionType: 'rate_limit_exceeded',
        resourceType: 'excel_file',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          function: 'excel-generator',
          currentCount: rateLimitResult.currentCount,
          limit: rateLimitResult.limit,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds
        }
      });

      return createRateLimitResponse(rateLimitResult.retryAfterSeconds || 60, corsHeaders);
    }

    const requestData = await req.json();
    
    console.log('Generating Excel file...', {
      fileName: requestData.fileName,
      transactionCount: requestData.transactions?.length || 0,
      currency: requestData.currency
    });

    // Validate input data
    if (!requestData.transactions || requestData.transactions.length === 0) {
      console.warn('No transactions provided, generating empty Excel');
    }

    // Generate real XLSX file
    const excelBuffer = await generateExcelFile(requestData);
    
    console.log('Excel file generated successfully', {
      bufferSize: excelBuffer.length,
      fileName: requestData.fileName
    });

    // Log successful export
    await logSecurityEvent({
      actionType: 'data_export',
      resourceType: 'excel_file',
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: { 
        fileName: requestData.fileName,
        transactionCount: requestData.transactions?.length || 0,
        currency: requestData.currency,
        fileSize: excelBuffer.length
      }
    });
    
    // Create response with proper XLSX headers
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${requestData.fileName}"`,
      'Content-Length': excelBuffer.length.toString(),
    };
    
    return new Response(excelBuffer, { headers });

  } catch (error) {
    console.error('Excel generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Log error
    await logSecurityEvent({
      actionType: 'data_export',
      resourceType: 'excel_file',
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
