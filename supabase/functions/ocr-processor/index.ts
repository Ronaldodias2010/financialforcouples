import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, fileName, detectedLanguage = 'pt' } = await req.json();

    console.log(`Processing OCR with Gemini for image: ${fileName} in language: ${detectedLanguage}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extract base64 data from data URL if needed
    let base64Image = imageData;
    if (imageData.includes('base64,')) {
      base64Image = imageData.split('base64,')[1];
    }

    // Prepare prompt based on language
    const prompts: Record<string, string> = {
      'pt': `Você é um especialista em OCR de documentos financeiros. Extraia TODO o texto desta imagem de extrato bancário ou fatura de cartão.

INSTRUÇÕES:
1. Extraia TODAS as informações visíveis, incluindo:
   - Nome do banco/instituição
   - Datas
   - Descrições de transações
   - Valores (positivos e negativos)
   - Saldos
   - Números de conta/cartão

2. Mantenha a formatação e estrutura do documento

3. Seja preciso com números e datas

Retorne o texto completo extraído:`,
      'en': `You are an expert in financial document OCR. Extract ALL text from this bank statement or card bill image.

INSTRUCTIONS:
1. Extract ALL visible information including:
   - Bank/institution name
   - Dates
   - Transaction descriptions
   - Amounts (positive and negative)
   - Balances
   - Account/card numbers

2. Maintain document formatting and structure

3. Be precise with numbers and dates

Return the complete extracted text:`,
      'es': `Eres un experto en OCR de documentos financieros. Extrae TODO el texto de esta imagen de extracto bancario o factura de tarjeta.

INSTRUCCIONES:
1. Extrae TODA la información visible incluyendo:
   - Nombre del banco/institución
   - Fechas
   - Descripciones de transacciones
   - Montos (positivos y negativos)
   - Saldos
   - Números de cuenta/tarjeta

2. Mantén el formato y estructura del documento

3. Sé preciso con números y fechas

Devuelve el texto completo extraído:`
    };

    const prompt = prompts[detectedLanguage] || prompts['pt'];

    // Call Gemini via Lovable AI Gateway
    const startTime = Date.now();
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const ocrText = aiResult.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    console.log(`OCR completed in ${processingTime}ms, extracted ${ocrText.length} characters`);

    // Extract structured data from OCR text
    const extractedTransactions: Array<{
      date: string;
      description: string;
      amount: string;
      confidence: number;
    }> = [];
    const lines = ocrText.split('\n').filter((line: string) => line.trim());
    
    // Pattern matching for different date and amount formats
    const patterns = [
      // DD/MM/YYYY or DD/MM format with amounts
      /(\d{2}\/\d{2}(?:\/\d{4})?)\s+(.+?)\s+([-+]?(?:R\$\s*)?[\d.,]+(?:,\d{2})?)/i,
      // YYYY-MM-DD format
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([-+]?(?:R\$\s*)?[\d.,]+(?:,\d{2})?)/i,
    ];
    
    for (const line of lines) {
      for (const pattern of patterns) {
        const transactionMatch = line.match(pattern);
        
        if (transactionMatch) {
          const [, date, description, amount] = transactionMatch;
          
          // Skip lines that look like headers or totals
          if (description.toLowerCase().includes('data') || 
              description.toLowerCase().includes('descrição') ||
              description.toLowerCase().includes('valor')) {
            continue;
          }
          
          extractedTransactions.push({
            date: date.trim(),
            description: description.trim(),
            amount: amount.trim(),
            confidence: 0.85 // Gemini typically has high confidence
          });
          break;
        }
      }
    }

    console.log(`Extracted ${extractedTransactions.length} transactions`);

    return new Response(JSON.stringify({
      success: true,
      ocrText: ocrText,
      extractedTransactions,
      confidence: 0.85,
      language: detectedLanguage,
      processingTime,
      extractedText: ocrText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OCR processing error:', error);
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