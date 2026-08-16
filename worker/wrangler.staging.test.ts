import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('routes the staging API and OAuth discovery through the staging hostname', () => {
  const projectConfig = resolve(process.cwd(), 'wrangler.staging.jsonc')
  const configPath = existsSync(projectConfig) ? projectConfig : resolve(process.cwd(), 'worker', 'wrangler.staging.jsonc')
  const config = readFileSync(configPath, 'utf8')

  expect(config).toContain('"MCP_PUBLIC_ORIGIN": "https://staging.setupvencedor.com.br"')
  expect(config).toContain('"pattern": "staging.setupvencedor.com.br/api/*"')
  expect(config).toContain('"pattern": "staging.setupvencedor.com.br/v1/*"')
  expect(config).toContain('"pattern": "staging.setupvencedor.com.br/.well-known/*"')
})
