import { readFile, writeFile } from 'node:fs/promises'

export function createRevisionedServiceWorker(source, release) {
  const escapedRelease = release.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `const SETUP_VENCEDOR_RELEASE = '${escapedRelease}'\n${source}`
}

const isDirectRun = process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).pathname

if (isDirectRun) {
  const release = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? `local-${Date.now()}`
  const source = await readFile('public/sw.js', 'utf8')
  await writeFile('dist/sw.js', createRevisionedServiceWorker(source, release))
}
