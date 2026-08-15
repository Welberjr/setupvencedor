const requiredVariables = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
]

const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim())

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function isValidPublishableKey(value) {
  return /^(?:sb_publishable_[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(value)
}

if (missingVariables.length > 0) {
  console.error(`Build cancelado: configure ${missingVariables.join(' e ')} antes de publicar o front-end.`)
  process.exit(1)
}

if (!isValidSupabaseUrl(process.env.VITE_SUPABASE_URL.trim())) {
  console.error('Build cancelado: VITE_SUPABASE_URL precisa ser uma URL HTTPS valida do Supabase.')
  process.exit(1)
}

if (!isValidPublishableKey(process.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim())) {
  console.error('Build cancelado: VITE_SUPABASE_PUBLISHABLE_KEY precisa ser uma chave publica do Supabase valida.')
  process.exit(1)
}
