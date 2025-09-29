import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    console.log(`Processing OCR for image: ${fileName} in language: ${detectedLanguage}`);

    // In a real implementation, you would integrate with:
    // - Google Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js (client-side)
    
    // For now, we'll simulate OCR processing
    const simulatedOcrText = `
      BANCO EXEMPLO S.A.
      EXTRATO BANCÁRIO
      
      Data: 15/01/2024
      Conta: 12345-6
      
      DATA       DESCRIÇÃO                    VALOR
      10/01      PIX RECEBIDO                +1.500,00
      11/01      PAGAMENTO CARTÃO CRÉDITO    -2.350,50
      12/01      TED DOC 123456              -500,00
      13/01      SALDO ANTERIOR               8.234,67
      
      SALDO ATUAL: R$ 6.884,17
    `;

    // Language-specific OCR confidence adjustments
    const languageConfidence: Record<string, number> = {
      'pt': 0.85,
      'en': 0.80,
      'es': 0.82
    };

    const confidence = languageConfidence[detectedLanguage] || 0.75;

    // Extract structured data from OCR text
    const extractedTransactions = [];
    const lines = simulatedOcrText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Simple pattern matching for transaction lines
      const transactionMatch = line.match(/(\d{2}\/\d{2})\s+(.+?)\s+([-+]?\d{1,3}(?:\.\d{3})*,\d{2})/);
      
      if (transactionMatch) {
        const [, date, description, amount] = transactionMatch;
        extractedTransactions.push({
          date: date,
          description: description.trim(),
          amount: amount,
          confidence: confidence
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ocrText: simulatedOcrText,
      extractedTransactions,
      confidence,
      language: detectedLanguage,
      processingTime: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});