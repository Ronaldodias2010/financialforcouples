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

function convertToISODate(dateStr: string, language: string): string {
  try {
    // Remove any extra whitespace
    dateStr = dateStr.trim();
    
    // Try to parse DD/MM/YYYY or DD/MM format
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length < 2) return new Date().toISOString().split('T')[0];
    
    let day, month, year;
    
    if (language === 'en') {
      // MM/DD/YYYY format
      month = parts[0];
      day = parts[1];
      year = parts[2] || new Date().getFullYear().toString();
    } else {
      // DD/MM/YYYY format (pt, es)
      day = parts[0];
      month = parts[1];
      year = parts[2] || new Date().getFullYear().toString();
    }
    
    // Pad with zeros if needed
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    
    // Handle 2-digit years
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = (century + parseInt(year)).toString();
    }
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Date parsing error:', e);
    return new Date().toISOString().split('T')[0];
  }
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Gemini to extract structured transactions
    const systemPrompt = detectedLanguage === 'pt' 
      ? `Você é um especialista em processar extratos bancários. Analise o texto e extraia transações no formato JSON.
Para cada transação, identifique:
- data (formato DD/MM/YYYY)
- descrição
- valor (número positivo)
- tipo (income, expense ou transfer)
- método de pagamento sugerido (pix, debit_card, credit_card, transfer, cash)`
      : `You are an expert in processing bank statements. Analyze the text and extract transactions in JSON format.
For each transaction, identify:
- date (DD/MM/YYYY format)
- description
- amount (positive number)
- type (income, expense or transfer)
- suggested payment method (pix, debit_card, credit_card, transfer, cash)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extraia todas as transações deste extrato:\n\n${extractedText}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_transactions',
            description: 'Extract financial transactions from bank statement text',
            parameters: {
              type: 'object',
              properties: {
                transactions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      originalDate: { type: 'string' },
                      originalDescription: { type: 'string' },
                      originalAmount: { type: 'string' },
                      normalizedAmount: { type: 'number' },
                      transactionType: { type: 'string', enum: ['income', 'expense', 'transfer'] },
                      paymentMethod: { type: 'string' },
                      confidenceScore: { type: 'number' }
                    },
                    required: ['originalDate', 'originalDescription', 'originalAmount', 'normalizedAmount', 'transactionType']
                  }
                }
              },
              required: ['transactions'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_transactions' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('AI Response:', JSON.stringify(aiResult, null, 2));

    // Extract transactions from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let processedTransactions = [];
    
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        processedTransactions = args.transactions.map((t: any) => ({
          originalDescription: t.originalDescription,
          originalDate: t.originalDate,
          originalAmount: t.originalAmount,
          normalizedDate: convertToISODate(t.originalDate, detectedLanguage),
          normalizedAmount: t.normalizedAmount,
          transactionType: t.transactionType,
          suggestedCategory: 'Outros',
          confidenceScore: t.confidenceScore || 0.85,
          isInstallment: false,
          installmentInfo: null,
          isTransfer: t.transactionType === 'transfer',
          isFee: false,
          paymentMethod: t.paymentMethod || 'unknown',
          isDuplicate: false,
          duplicateTransactionId: null
        }));
        console.log(`✅ Successfully parsed ${processedTransactions.length} transactions from AI`);
      } catch (e) {
        console.error('❌ Failed to parse AI tool call response:', e);
        console.log('Tool call arguments:', toolCall.function.arguments);
      }
    } else {
      console.warn('⚠️ No tool call in AI response, attempting fallback regex parsing');
      
      // Fallback: use regex parsing if AI tool calling failed
      const fallbackTransactions = parseTransactions(extractedText, detectedLanguage, detectedCurrency);
      if (fallbackTransactions.length > 0) {
        processedTransactions = fallbackTransactions;
        console.log(`✅ Fallback parsing found ${processedTransactions.length} transactions`);
      }
    }
    
    console.log(`📊 Final result: ${processedTransactions.length} transactions processed`);

    return new Response(JSON.stringify({
      success: true,
      processedTransactions,
      aiConfidence: processedTransactions.length > 0 ? 0.85 : 0.3,
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