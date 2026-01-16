import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MistralOCRRequest {
  document: string; // base64 encoded document or URL
  type: 'image' | 'pdf';
  fileName?: string;
}

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  balance?: number;
  category?: string;
  confidence: number;
}

interface MistralOCRResponse {
  success: boolean;
  extractedText: string;
  transactions: ExtractedTransaction[];
  metadata: {
    pages: number;
    language: string;
    currency: string;
    bankName?: string;
    accountNumber?: string;
    statementPeriod?: {
      start: string;
      end: string;
    };
  };
  rawMarkdown?: string;
  error?: string;
}

function logStep(step: string, details?: any) {
  console.log(`[MISTRAL-OCR] ${step}`, details ? JSON.stringify(details) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
    
    if (!MISTRAL_API_KEY) {
      logStep('ERROR', 'MISTRAL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'MISTRAL_API_KEY não configurada' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { document, type, fileName }: MistralOCRRequest = await req.json();
    
    logStep('Processing document', { type, fileName, documentLength: document?.length });

    if (!document) {
      return new Response(
        JSON.stringify({ success: false, error: 'Documento não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the document for Mistral OCR API
    // Mistral's Pixtral model can process images directly
    let imageContent: any;
    
    if (document.startsWith('data:')) {
      // Base64 encoded with data URL prefix
      imageContent = {
        type: "image_url",
        image_url: document
      };
    } else if (document.startsWith('http')) {
      // Direct URL
      imageContent = {
        type: "image_url",
        image_url: document
      };
    } else {
      // Raw base64 - add appropriate prefix
      const mimeType = type === 'pdf' ? 'application/pdf' : 'image/png';
      imageContent = {
        type: "image_url",
        image_url: `data:${mimeType};base64,${document}`
      };
    }

    logStep('Calling Mistral API with Pixtral model');

    // Use Mistral's vision model for OCR
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409', // Mistral's vision model
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extrair transações financeiras de extratos bancários e faturas de cartão de crédito.

IMPORTANTE: Extraia TODAS as transações do documento, linha por linha.

Para cada transação, identifique:
- Data (formato YYYY-MM-DD)
- Descrição (exatamente como aparece no documento)
- Valor (número positivo)
- Tipo: "expense" para débitos/saídas ou "income" para créditos/entradas
- Saldo (se disponível)

Responda APENAS em JSON válido, sem markdown:
{
  "metadata": {
    "bankName": "nome do banco",
    "accountNumber": "número da conta (parcial ok)",
    "currency": "BRL/USD/EUR",
    "language": "pt/en/es",
    "statementPeriod": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
    "pages": 1
  },
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "PAGAMENTO PIX RECEBIDO",
      "amount": 1500.00,
      "type": "income",
      "balance": 5000.00,
      "confidence": 0.95
    }
  ],
  "rawText": "texto completo extraído do documento"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extraia todas as transações deste extrato bancário ou fatura. Seja extremamente preciso com datas, valores e descrições. Retorne APENAS JSON válido.`
              },
              imageContent
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1, // Low temperature for accuracy
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      logStep('Mistral API error', { status: mistralResponse.status, error: errorText });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro na API Mistral: ${mistralResponse.status}`,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mistralData = await mistralResponse.json();
    logStep('Mistral response received', { 
      choices: mistralData.choices?.length,
      usage: mistralData.usage 
    });

    const content = mistralData.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Resposta vazia da API Mistral' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsedResult;
    try {
      // Try to extract JSON from the response (might have markdown code blocks)
      let jsonString = content;
      
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }
      
      parsedResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      logStep('JSON parse error, using raw text', { error: String(parseError) });
      
      // Fallback: return raw text for manual processing
      parsedResult = {
        metadata: {
          pages: 1,
          language: 'pt',
          currency: 'BRL'
        },
        transactions: [],
        rawText: content
      };
    }

    const response: MistralOCRResponse = {
      success: true,
      extractedText: parsedResult.rawText || content,
      transactions: parsedResult.transactions || [],
      metadata: {
        pages: parsedResult.metadata?.pages || 1,
        language: parsedResult.metadata?.language || 'pt',
        currency: parsedResult.metadata?.currency || 'BRL',
        bankName: parsedResult.metadata?.bankName,
        accountNumber: parsedResult.metadata?.accountNumber,
        statementPeriod: parsedResult.metadata?.statementPeriod
      },
      rawMarkdown: content
    };

    logStep('OCR completed successfully', { 
      transactionsFound: response.transactions.length,
      metadata: response.metadata 
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Unexpected error', { error: String(error) });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
