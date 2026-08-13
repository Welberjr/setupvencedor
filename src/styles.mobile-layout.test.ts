import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8')

it('keeps mobile grid rows sized by their own content', () => {
  expect(stylesheet).toMatch(
    /@media \(max-width: 820px\) \{\s*\.app-shell:not\(\.auth-shell\) \{[^}]*align-content:\s*start;/,
  )
})
