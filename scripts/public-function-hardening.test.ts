import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations')
const migrations = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith('.sql'))
  .map((name) => ({ name, source: readFileSync(join(migrationsDirectory, name), 'utf8') }))
const hardeningMigration = migrations.find(({ source }) => source.includes('hardened public function execution'))?.source ?? ''

it('keeps privileged public-schema functions inaccessible to browser roles', () => {
  expect(hardeningMigration).toContain('revoke all on function public.create_public_profile() from public, anon, authenticated;')
  expect(hardeningMigration).toContain('revoke all on function public.activate_confirmed_profile() from public, anon, authenticated;')
  expect(hardeningMigration).toContain('revoke all on function public.claim_invitation(text, text, text) from public, anon, authenticated;')
})

it('tracks activity under RLS instead of a security definer function', () => {
  expect(hardeningMigration).toContain('create or replace function public.record_profile_activity()')
  expect(hardeningMigration).toContain('security invoker')
  expect(hardeningMigration).toContain('grant execute on function public.record_profile_activity() to authenticated;')
})
