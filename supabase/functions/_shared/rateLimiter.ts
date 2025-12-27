import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Rate limit configurations per function
export const RATE_LIMITS: Record<string, { requests: number; windowMinutes: number }> = {
  'validate-promo-code': { requests: 10, windowMinutes: 15 },
  'validate-temp-login': { requests: 5, windowMinutes: 15 },
  'create-checkout-session': { requests: 20, windowMinutes: 60 },
  'confirm-email-admin': { requests: 5, windowMinutes: 60 },
  'send-confirmation': { requests: 3, windowMinutes: 60 },
  'send-confirmation-manual': { requests: 5, windowMinutes: 60 },
  'send-confirmation-webhook': { requests: 10, windowMinutes: 60 },
  'pdf-extractor': { requests: 30, windowMinutes: 60 },
  'excel-generator': { requests: 30, windowMinutes: 60 },
  'default': { requests: 100, windowMinutes: 60 }
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds?: number;
  currentCount: number;
  limit: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - IP address or user ID to identify the requester
 * @param functionName - Name of the edge function being called
 * @returns RateLimitResult with allowed status and remaining requests
 */
export async function checkRateLimit(
  identifier: string,
  functionName: string
): Promise<RateLimitResult> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const config = RATE_LIMITS[functionName] || RATE_LIMITS['default'];
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  try {
    // Get current request count within the window
    const { data: existingEntries, error: fetchError } = await supabase
      .from('rate_limit_entries')
      .select('id, request_count, window_start')
      .eq('identifier', identifier)
      .eq('function_name', functionName)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[RATE-LIMITER] Error fetching rate limit entries:', fetchError);
      // On error, allow the request (fail open for availability)
      return {
        allowed: true,
        remaining: config.requests,
        resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        currentCount: 0,
        limit: config.requests
      };
    }

    let currentCount = 0;
    let windowStartTime = new Date();

    if (existingEntries && existingEntries.length > 0) {
      const entry = existingEntries[0];
      currentCount = entry.request_count;
      windowStartTime = new Date(entry.window_start);

      // Check if limit exceeded
      if (currentCount >= config.requests) {
        const resetAt = new Date(windowStartTime.getTime() + config.windowMinutes * 60 * 1000);
        const retryAfterSeconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

        console.log(`[RATE-LIMITER] Rate limit exceeded for ${identifier} on ${functionName}`, {
          currentCount,
          limit: config.requests,
          retryAfterSeconds
        });

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfterSeconds: Math.max(0, retryAfterSeconds),
          currentCount,
          limit: config.requests
        };
      }

      // Increment the counter
      const { error: updateError } = await supabase
        .from('rate_limit_entries')
        .update({ request_count: currentCount + 1 })
        .eq('id', entry.id);

      if (updateError) {
        console.error('[RATE-LIMITER] Error updating rate limit entry:', updateError);
      }

      currentCount += 1;
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('rate_limit_entries')
        .insert({
          identifier,
          function_name: functionName,
          request_count: 1,
          window_start: new Date().toISOString()
        });

      if (insertError) {
        console.error('[RATE-LIMITER] Error inserting rate limit entry:', insertError);
      }

      currentCount = 1;
      windowStartTime = new Date();
    }

    const resetAt = new Date(windowStartTime.getTime() + config.windowMinutes * 60 * 1000);
    const remaining = Math.max(0, config.requests - currentCount);

    console.log(`[RATE-LIMITER] Request allowed for ${identifier} on ${functionName}`, {
      currentCount,
      remaining,
      limit: config.requests
    });

    return {
      allowed: true,
      remaining,
      resetAt,
      currentCount,
      limit: config.requests
    };

  } catch (error) {
    console.error('[RATE-LIMITER] Unexpected error:', error);
    // On error, allow the request (fail open for availability)
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
      currentCount: 0,
      limit: config.requests
    };
  }
}

/**
 * Get client IP from request headers
 * @param req - The incoming request
 * @returns The client IP address or 'unknown'
 */
export function getClientIP(req: Request): string {
  // Try various headers in order of preference
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return 'unknown';
}

/**
 * Create a rate limit exceeded response
 * @param retryAfterSeconds - Seconds until the rate limit resets
 * @param corsHeaders - CORS headers to include
 * @returns Response object with 429 status
 */
export function createRateLimitResponse(
  retryAfterSeconds: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
      retryAfter: retryAfterSeconds
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds)
      }
    }
  );
}
