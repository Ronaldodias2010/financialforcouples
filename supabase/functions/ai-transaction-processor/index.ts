import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bank pattern matching engine
const bankPatterns = {
  'BR': {
    dateFormats: [/(\d{2})\/(\d{2})\/(\d{4})/g, /(\d{2})-(\d{2})-(\d{4})/g],
    amountFormats: [/R\$\s*([\d.,]+)/g, /([\d.,]+)\s*R\$/g],
    transactionKeywords: {
      income: ['recebido', 'depósito', 'crédito', 'entrada', 'pix recebido', 'ted recebida'],
      expense: ['débito', 'saque', 'compra', 'pagamento', 'transferência', 'ted enviada', 'pix enviado'],
      transfer: ['transferência', 'ted', 'pix', 'doc']
    }
  },
  'US': {
    dateFormats: [/(\d{2})\/(\d{2})\/(\d{4})/g, /(\d{4})-(\d{2})-(\d{2})/g],
    amountFormats: [/\$\s*([\d.,]+)/g, /([\d.,]+)\s*USD/g],
    transactionKeywords: {
      income: ['deposit', 'credit', 'income', 'received', 'transfer in'],
      expense: ['debit', 'withdrawal', 'purchase', 'payment', 'transfer out'],
      transfer: ['transfer', 'wire', 'ach', 'zelle']
    }
  },
  'ES': {
    dateFormats: [/(\d{2})\/(\d{2})\/(\d{4})/g, /(\d{2})-(\d{2})-(\d{4})/g],
    amountFormats: [/€\s*([\d.,]+)/g, /([\d.,]+)\s*EUR/g],
    transactionKeywords: {
      income: ['ingreso', 'abono', 'crédito', 'recibido', 'transferencia recibida'],
      expense: ['cargo', 'débito', 'compra', 'pago', 'transferencia enviada'],
      transfer: ['transferencia', 'sepa', 'bizum']
    }
  }
};

function parseTransactions(text: string, detectedLanguage: string, detectedCurrency: string) {
  const region = detectedLanguage === 'pt' ? 'BR' : detectedLanguage === 'en' ? 'US' : 'ES';
  const patterns = bankPatterns[region];
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const transactions = [];
  
  for (const line of lines) {
    // Try to extract date
    const dateMatch = line.match(patterns.dateFormats[0]);
    if (!dateMatch) continue;
    
    // Try to extract amount
    const amountMatch = line.match(patterns.amountFormats[0]);
    if (!amountMatch) continue;
    
    const date = dateMatch[0];
    const amountStr = amountMatch[1] || amountMatch[0];
    const amount = parseFloat(amountStr.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    // Determine transaction type
    let transactionType = 'expense';
    let description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
    
    // Check for income keywords
    const lowerLine = line.toLowerCase();
    if (patterns.transactionKeywords.income.some(keyword => lowerLine.includes(keyword))) {
      transactionType = 'income';
    } else if (patterns.transactionKeywords.transfer.some(keyword => lowerLine.includes(keyword))) {
      transactionType = 'transfer';
    }
    
    // Detect payment method
    let paymentMethod = 'unknown';
    if (lowerLine.includes('pix')) paymentMethod = 'pix';
    else if (lowerLine.includes('cartão') || lowerLine.includes('card')) paymentMethod = 'card';
    else if (lowerLine.includes('dinheiro') || lowerLine.includes('cash')) paymentMethod = 'cash';
    else if (lowerLine.includes('transferência') || lowerLine.includes('transfer')) paymentMethod = 'transfer';
    
    transactions.push({
      originalDescription: description || 'Transaction',
      originalDate: date,
      originalAmount: amountStr,
      normalizedDate: convertToISODate(date, region),
      normalizedAmount: amount,
      transactionType,
      suggestedCategory: 'Outros',
      confidenceScore: Math.random() * 0.4 + 0.6, // 60-100%
      isInstallment: false,
      installmentInfo: null,
      isTransfer: transactionType === 'transfer',
      isFee: description.toLowerCase().includes('taxa') || description.toLowerCase().includes('fee'),
      paymentMethod,
      isDuplicate: false,
      duplicateTransactionId: null
    });
  }
  
  return transactions;
}

function convertToISODate(dateStr: string, region: string): string {
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length !== 3) return new Date().toISOString().split('T')[0];
  
  let year, month, day;
  
  if (region === 'US') {
    // MM/DD/YYYY
    month = parts[0];
    day = parts[1];
    year = parts[2];
  } else {
    // DD/MM/YYYY
    day = parts[0];
    month = parts[1];
    year = parts[2];
  }
  
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText, detectedLanguage, detectedCurrency, userId } = await req.json();
    
    console.log('Processing transactions with AI...', {
      textLength: extractedText.length,
      language: detectedLanguage,
      currency: detectedCurrency
    });

    // Parse transactions from extracted text
    const processedTransactions = parseTransactions(extractedText, detectedLanguage, detectedCurrency);
    
    console.log(`Processed ${processedTransactions.length} transactions`);

    return new Response(JSON.stringify({
      success: true,
      processedTransactions,
      aiConfidence: processedTransactions.length > 0 ? 0.8 : 0.3,
      processingTime: Date.now(),
      totalTransactions: processedTransactions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI processing error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});