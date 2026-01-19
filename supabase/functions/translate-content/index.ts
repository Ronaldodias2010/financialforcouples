import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  title: string;
  description?: string;
  webContent?: string;
  targetLanguages: ('en' | 'es')[];
}

interface TranslationResponse {
  translations: {
    en?: {
      title: string;
      description?: string;
      webContent?: string;
    };
    es?: {
      title: string;
      description?: string;
      webContent?: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { title, description, webContent, targetLanguages } = await req.json() as TranslationRequest;
    
    console.log('Translation request received:', { 
      title: title?.substring(0, 50), 
      hasDescription: !!description,
      hasWebContent: !!webContent,
      targetLanguages 
    });

    if (!title) {
      throw new Error("Title is required for translation");
    }

    const translations: TranslationResponse['translations'] = {};

    // Process each target language
    for (const targetLang of targetLanguages) {
      const langName = targetLang === 'en' ? 'English' : 'Spanish';
      
      // Build content to translate
      const contentToTranslate = {
        title,
        ...(description && { description }),
        ...(webContent && { webContent })
      };

      const prompt = `You are a professional translator specializing in financial content. Translate the following content from Portuguese to ${langName}.

IMPORTANT RULES:
1. Maintain the same tone and style
2. Keep financial terms accurate
3. Preserve any formatting (line breaks, paragraphs)
4. Do NOT translate brand names like "Couples Financials"
5. Return ONLY a valid JSON object with the translated fields

Content to translate:
${JSON.stringify(contentToTranslate, null, 2)}

Return the translation in this exact JSON format:
{
  "title": "translated title",
  ${description ? '"description": "translated description",' : ''}
  ${webContent ? '"webContent": "translated web content"' : ''}
}`;

      console.log(`Translating to ${langName}...`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a professional translator. Always respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI gateway error for ${langName}:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Payment required. Please add funds to continue.");
        }
        throw new Error(`Translation failed for ${langName}: ${response.status}`);
      }

      const data = await response.json();
      const translatedContent = data.choices?.[0]?.message?.content;

      if (!translatedContent) {
        console.error(`Empty response for ${langName}`);
        continue;
      }

      // Parse the JSON response
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanJson = translatedContent.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.slice(7);
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.slice(3);
        }
        if (cleanJson.endsWith('```')) {
          cleanJson = cleanJson.slice(0, -3);
        }
        cleanJson = cleanJson.trim();

        const parsed = JSON.parse(cleanJson);
        translations[targetLang] = {
          title: parsed.title || title,
          ...(parsed.description && { description: parsed.description }),
          ...(parsed.webContent && { webContent: parsed.webContent })
        };
        
        console.log(`Successfully translated to ${langName}`);
      } catch (parseError) {
        console.error(`Failed to parse translation for ${langName}:`, parseError, translatedContent);
        // Use original content as fallback
        translations[targetLang] = {
          title,
          ...(description && { description }),
          ...(webContent && { webContent })
        };
      }
    }

    console.log('Translation completed successfully');

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
