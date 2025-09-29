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

    console.log(`Processing ${fileType} file: ${fileName}`);

    let extractedText = '';
    let detectedLanguage = 'pt';
    let detectedCurrency = 'BRL';
    let detectedRegion = 'BR';
    let statementType = 'auto';

    if (fileType === 'pdf') {
      // For PDF processing, we'll use a simple text extraction approach
      // In a real implementation, you'd use a proper PDF parsing library
      const base64Data = fileData.split(',')[1] || fileData;
      const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Simulate PDF text extraction
      extractedText = "Sample extracted text from PDF";
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