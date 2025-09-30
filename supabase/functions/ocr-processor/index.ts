import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract text from PDF using native text (for text-based PDFs)
async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Simple text extraction from PDF (looking for text streams)
    const pdfText = new TextDecoder().decode(bytes);
    
    // Extract text between stream markers
    const textMatches = pdfText.match(/\(([^)]+)\)/g);
    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches
        .map(match => match.slice(1, -1))
        .join(' ')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .trim();
      
      if (extractedText.length > 100) {
        console.log('✅ Successfully extracted text from PDF natively');
        return extractedText;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Native PDF text extraction failed:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, fileName, detectedLanguage = 'pt' } = await req.json();

    console.log(`🔍 Processing file: ${fileName} in language: ${detectedLanguage}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extract base64 data from data URL if needed
    let base64Image = imageData;
    let mimeType = 'image/jpeg';
    let isPDF = false;
    
    if (imageData.includes('base64,')) {
      const parts = imageData.split('base64,');
      base64Image = parts[1];
      // Extract mime type from data URL (e.g., data:image/png;base64,...)
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
        isPDF = mimeType === 'application/pdf';
      }
    } else {
      // Detect from filename if no data URL
      if (fileName.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
        isPDF = true;
      }
    }

    console.log(`📄 File info: type=${mimeType}, isPDF=${isPDF}, size=${base64Image.length} chars`);
    
    // Strategy 1: For PDFs, try native text extraction first
    if (isPDF) {
      console.log('🔧 Attempting native PDF text extraction...');
      const nativeText = await extractTextFromPDF(base64Image);
      
      if (nativeText.length > 100) {
        console.log(`✅ Native PDF extraction successful: ${nativeText.length} characters`);
        
        // Return early with native extraction
        return new Response(JSON.stringify({
          success: true,
          ocrText: nativeText,
          extractedTransactions: [],
          confidence: 0.95,
          language: detectedLanguage,
          processingTime: 0,
          extractedText: nativeText,
          method: 'native_pdf'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('⚠️ Native PDF extraction failed or insufficient text, will try OCR');
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

    // Strategy 2: Try Gemini OCR (works better for images than PDFs)
    const startTime = Date.now();
    
    // For PDFs, we need to inform the user that Gemini has limitations
    if (isPDF) {
      console.log('⚠️ PDF detected - Gemini may have difficulty processing. Consider using image formats.');
    }
    
    console.log('📡 Calling Gemini Vision API...');
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
                  url: isPDF ? `data:image/jpeg;base64,${base64Image}` : `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      
      // Return graceful error for frontend to handle
      return new Response(JSON.stringify({
        success: false,
        ocrText: '',
        extractedTransactions: [],
        confidence: 0,
        language: detectedLanguage,
        processingTime: Date.now() - startTime,
        extractedText: '',
        error: `Gemini OCR failed: ${response.status}. ${isPDF ? 'Considere converter o PDF para imagem ou usar um PDF com texto selecionável.' : 'Tente com uma imagem de melhor qualidade.'}`,
        method: 'gemini_failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const aiResult = await response.json();
    const ocrText = aiResult.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    console.log(`✅ Gemini OCR completed in ${processingTime}ms`);
    console.log(`📄 Extracted text length: ${ocrText.length} characters`);
    
    if (ocrText.length > 0) {
      console.log(`📝 First 200 chars: ${ocrText.substring(0, 200)}...`);
    }
    
    if (ocrText.length === 0) {
      console.error('⚠️ Gemini OCR returned empty text');
      
      return new Response(JSON.stringify({
        success: false,
        ocrText: '',
        extractedTransactions: [],
        confidence: 0,
        language: detectedLanguage,
        processingTime,
        extractedText: '',
        error: isPDF 
          ? 'Não foi possível extrair texto do PDF. Recomendação: converta o PDF para imagem (PNG/JPG) ou use um PDF com texto selecionável.' 
          : 'Não foi possível extrair texto da imagem. Tente com uma imagem de melhor qualidade.',
        method: 'gemini_empty',
        suggestions: isPDF 
          ? ['Converter PDF para imagem', 'Usar PDF com texto selecionável', 'Tirar screenshot do PDF']
          : ['Melhorar qualidade da imagem', 'Garantir boa iluminação', 'Evitar reflexos']
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    if (ocrText.length < 50) {
      console.warn('⚠️ OCR returned very short text - may indicate processing failure');
      console.log('Full extracted text:', ocrText);
    }

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

    console.log(`🔍 Pattern matching found ${extractedTransactions.length} transactions`);
    
    if (extractedTransactions.length === 0) {
      console.warn('⚠️ No transactions extracted via pattern matching - AI processor will attempt extraction');
    }

    return new Response(JSON.stringify({
      success: true,
      ocrText: ocrText,
      extractedTransactions,
      confidence: 0.85,
      language: detectedLanguage,
      processingTime,
      extractedText: ocrText,
      method: 'gemini_vision',
      fileType: isPDF ? 'pdf' : 'image'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ OCR processing error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
      details: error instanceof Error ? error.stack : undefined,
      ocrText: '',
      extractedTransactions: [],
      extractedText: '',
      suggestions: [
        'Verifique se o arquivo não está corrompido',
        'Para PDFs: tente converter para imagem primeiro',
        'Para imagens: verifique a qualidade e formato (PNG ou JPG)',
        'Certifique-se de que o documento está legível'
      ]
    }), {
      status: 200, // Return 200 to allow graceful handling
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});