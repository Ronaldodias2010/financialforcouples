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
    const { fileData, fileName, fileType } = await req.json();

    console.log(`Processing ${fileType} file: ${fileName} with real OCR`);

    let extractedText = '';
    let detectedLanguage = 'pt';
    let detectedCurrency = 'BRL';
    let detectedRegion = 'BR';
    let statementType = 'auto';
    let detectedBank = null;

    if (fileType === 'pdf' || fileType === 'image') {
      // Real OCR processing using Gemini via ocr-processor
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        console.log('Calling OCR processor with Gemini...');
        
        // Call the ocr-processor edge function
        const ocrResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ocr-processor`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: fileData,
            fileName: fileName,
            detectedLanguage: 'pt'
          })
        });

        if (!ocrResponse.ok) {
          const errorText = await ocrResponse.text();
          console.error('OCR processor error:', ocrResponse.status, errorText);
          throw new Error(`OCR processor failed: ${ocrResponse.status}`);
        }

        const ocrResult = await ocrResponse.json();
        console.log('OCR Result:', {
          success: ocrResult.success,
          textLength: ocrResult.extractedText?.length || 0,
          transactionsFound: ocrResult.extractedTransactions?.length || 0
        });

        if (ocrResult.success && ocrResult.extractedText) {
          extractedText = ocrResult.extractedText;
          detectedLanguage = ocrResult.language || 'pt';
          
          console.log('OCR processing completed successfully');
          console.log(`Extracted text length: ${extractedText.length}`);
        } else {
          throw new Error('OCR processing returned no text');
        }
      } catch (error) {
        console.error('OCR processing failed:', error);
        extractedText = `Error extracting text from ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else if (fileType === 'csv') {
      // Handle CSV files
      const csvContent = atob(fileData.split(',')[1] || fileData);
      extractedText = csvContent;
    } else if (fileType === 'ofx') {
      // Handle OFX files  
      const ofxContent = atob(fileData.split(',')[1] || fileData);
      extractedText = ofxContent;
    }

    // Language detection based on keywords
    const languageKeywords = {
      en: ['posted', 'pending', 'balance', 'debit', 'credit', 'statement', 'account'],
      es: ['fecha', 'saldo', 'débito', 'crédito', 'estado', 'cuenta', 'movimientos'],
      pt: ['data', 'saldo', 'débito', 'crédito', 'extrato', 'conta', 'lançamento']
    };

    const lowerText = extractedText.toLowerCase();
    let maxMatches = 0;
    
    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLanguage = lang;
      }
    }

    // Currency detection
    const currencyPatterns = {
      'BRL': /R\$|reais?|real/i,
      'USD': /\$|USD|dollar/i,
      'EUR': /€|EUR|euro/i,
      'MXN': /MXN|peso/i,
      'ARS': /ARS|\$.*argentina/i
    };

    for (const [currency, pattern] of Object.entries(currencyPatterns)) {
      if (pattern.test(extractedText)) {
        detectedCurrency = currency;
        break;
      }
    }

    // Region detection based on payment methods and keywords
    const regionKeywords = {
      'BR': ['pix', 'ted', 'doc', 'boleto', 'itau', 'bradesco', 'santander'],
      'US': ['ach', 'zelle', 'wire', 'check', 'chase', 'wells fargo'],
      'MX': ['spei', 'clabe', 'bbva', 'santander mexico'],
      'ES': ['sepa', 'iban', 'transferencia', 'santander españa'],
      'AR': ['cbu', 'alias cbu', 'banco nación', 'banco provincia']
    };

    for (const [region, keywords] of Object.entries(regionKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedRegion = region;
        break;
      }
    }

    // Statement type detection
    if (lowerText.includes('credit card') || lowerText.includes('cartão de crédito') || 
        lowerText.includes('tarjeta de crédito') || lowerText.includes('fatura')) {
      statementType = 'credit_card';
    } else if (lowerText.includes('bank') || lowerText.includes('banco') || 
               lowerText.includes('extrato') || lowerText.includes('statement')) {
      statementType = 'bank';
    }

    return new Response(JSON.stringify({
      success: true,
      extractedText,
      detectedLanguage,
      detectedCurrency,
      detectedRegion,
      statementType,
      confidence: maxMatches > 2 ? 'high' : maxMatches > 0 ? 'medium' : 'low'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});