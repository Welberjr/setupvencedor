export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  AI: Ai
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  APP_URL?: string
  MCP_OAUTH_SIGNING_KEY: string
  MCP_PUBLIC_ORIGIN?: string
  MCP_ACCESS_TOKEN_TTL_SECONDS?: string
}
