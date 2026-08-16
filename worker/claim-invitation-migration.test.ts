import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('qualifies the delivery column when claiming a direct invitation', () => {
  const repoRoot = existsSync(resolve(process.cwd(), 'supabase')) ? process.cwd() : resolve(process.cwd(), '..')
  const migration = readFileSync(resolve(repoRoot, 'supabase', 'migrations', '20260816171029_fix_direct_invitation_claim.sql'), 'utf8')

  expect(migration).toContain("invitations.delivery = 'email'")
})
