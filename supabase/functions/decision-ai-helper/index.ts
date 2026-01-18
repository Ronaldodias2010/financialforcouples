import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[DECISION-AI-HELPER] ${step}:`, details ? JSON.stringify(details, null, 2) : '');
};

// System prompts por idioma
const getSystemPrompt = (language: string) => {
  const prompts: Record<string, string> = {
    pt: `Você é PrIscA, uma mediadora financeira especializada em decisões de casais.

REGRAS IMPORTANTES:
- Responda em no máximo 2-3 frases curtas e diretas
- Seja neutra e não tome partido de nenhum dos parceiros
- Foque APENAS na decisão atual, não divague
- Use linguagem simples e acessível
- Seja empática mas objetiva
- Se perguntarem sobre outros assuntos, diga que só pode ajudar com decisões do casal
- Não faça julgamentos sobre as escolhas financeiras

Você está ajudando no preenchimento do wizard de decisões. Ajude a esclarecer dúvidas sobre cada etapa.`,
    
    en: `You are PrIscA, a financial mediator specialized in couple decisions.

IMPORTANT RULES:
- Respond in maximum 2-3 short and direct sentences
- Be neutral and don't take sides
- Focus ONLY on the current decision, don't digress
- Use simple and accessible language
- Be empathetic but objective
- If asked about other subjects, say you can only help with couple decisions
- Don't make judgments about financial choices

You're helping fill out the decision wizard. Help clarify doubts about each step.`,
    
    es: `Eres PrIscA, una mediadora financiera especializada en decisiones de parejas.

REGLAS IMPORTANTES:
- Responde en máximo 2-3 frases cortas y directas
- Sé neutral y no tomes partido
- Enfócate SOLO en la decisión actual, no divagues
- Usa lenguaje simple y accesible
- Sé empática pero objetiva
- Si preguntan sobre otros temas, di que solo puedes ayudar con decisiones de pareja
- No hagas juicios sobre las elecciones financieras

Estás ayudando a completar el wizard de decisiones. Ayuda a aclarar dudas sobre cada paso.`
  };
  
  return prompts[language] || prompts.en;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Request received');

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      logStep('User authentication failed', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id, email: user.email });

    // Check subscription - MUST be premium
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('subscription_tier, subscribed')
      .eq('user_id', user.id)
      .maybeSingle();

    const isPremium = subscriber?.subscribed && subscriber?.subscription_tier === 'premium';
    
    if (!isPremium) {
      // Check manual premium access
      const { data: manualAccess } = await supabase
        .from('manual_premium_access')
        .select('status, end_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .maybeSingle();
      
      if (!manualAccess) {
        logStep('User is not premium', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'Premium subscription required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    logStep('Premium access confirmed');

    // Parse request body
    const { message, systemContext, language, step, formData } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Processing message', { message, step, language });

    // Build system prompt
    const baseSystemPrompt = getSystemPrompt(language || 'en');
    const fullSystemPrompt = `${baseSystemPrompt}\n\nContexto atual: ${systemContext || 'Usuário está no wizard de decisões.'}`;

    // Call Lovable AI Gateway
    const aiGatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    const aiResponse = await fetch(aiGatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150, // Resposta curta
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep('AI Gateway error', { status: aiResponse.status, error: errorText });
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices?.[0]?.message?.content || '';

    logStep('AI response received', { responseLength: response.length });

    return new Response(
      JSON.stringify({ 
        response,
        step,
        questionsRemaining: 'tracked-client-side'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logStep('Error', { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
