const requiredVariables = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
]

const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim())

if (missingVariables.length > 0) {
  console.error(`Build cancelado: configure ${missingVariables.join(' e ')} antes de publicar o front-end.`)
  process.exit(1)
}
