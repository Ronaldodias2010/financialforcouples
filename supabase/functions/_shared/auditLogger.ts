import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AuditActionType = 
  | 'login_attempt'
  | 'promo_validation'
  | 'temp_login'
  | 'checkout_created'
  | 'ai_query'
  | 'data_export'
  | 'admin_action'
  | 'rate_limit_exceeded'
  | 'pdf_extraction'
  | 'excel_generation'
  | 'email_sent'
  | 'password_reset'
  | 'email_confirmed';

export type AuditResourceType = 
  | 'promo_code'
  | 'user_invite'
  | 'checkout_session'
  | 'ai_consultant'
  | 'pdf_file'
  | 'excel_file'
  | 'user_account'
  | 'email'
  | 'rate_limit';

export interface AuditLogEntry {
  userId?: string;
  actionType: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Log a security event to the audit log
 * This function is designed to be non-blocking and fail silently to not impact the main request
 * @param entry - The audit log entry to record
 */
export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Mask sensitive data in details
    const sanitizedDetails = entry.details ? sanitizeDetails(entry.details) : null;

    const { error } = await supabase
      .from('security_audit_log')
      .insert({
        user_id: entry.userId || null,
        action_type: entry.actionType,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent ? truncateString(entry.userAgent, 500) : null,
        details: sanitizedDetails,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[AUDIT-LOGGER] Error inserting audit log:', error);
    } else {
      console.log(`[AUDIT-LOGGER] Event logged: ${entry.actionType} on ${entry.resourceType}`, {
        userId: entry.userId ? maskId(entry.userId) : null,
        resourceId: entry.resourceId ? maskId(entry.resourceId) : null,
        ip: entry.ipAddress ? maskIP(entry.ipAddress) : null
      });
    }
  } catch (error) {
    // Fail silently to not impact the main request
    console.error('[AUDIT-LOGGER] Unexpected error:', error);
  }
}

/**
 * Sanitize details object to mask sensitive information
 */
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  const sensitiveFields = ['password', 'temp_password', 'token', 'secret', 'api_key', 'apikey'];
  const partialMaskFields = ['email', 'phone'];
  
  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (partialMaskFields.some(field => lowerKey.includes(field)) && typeof value === 'string') {
      sanitized[key] = maskEmail(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Mask an email address for logging (e.g., j***@example.com)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * Mask an IP address for logging (e.g., 192.168.xxx.xxx)
 */
function maskIP(ip: string): string {
  if (!ip || ip === 'unknown') return ip;
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  
  // For IPv6, just show first segment
  if (ip.includes(':')) {
    return ip.split(':')[0] + ':xxxx:xxxx';
  }
  
  return ip;
}

/**
 * Mask a UUID for logging (e.g., abc12xxx-xxxx-xxxx)
 */
function maskId(id: string): string {
  if (!id || id.length < 8) return id;
  return `${id.substring(0, 5)}xxx-xxxx`;
}

/**
 * Truncate a string to a maximum length
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Create audit context from request
 */
export function createAuditContext(req: Request, userId?: string): {
  ipAddress: string;
  userAgent: string;
  userId?: string;
} {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
    
  return {
    ipAddress,
    userAgent: getUserAgent(req),
    userId
  };
}
