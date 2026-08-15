import { pathToFileURL } from 'node:url'

function assetUrl(html, extension, siteUrl) {
  const match = html.match(new RegExp(`(?:href|src)=["']([^"']+\\.${extension})["']`, 'i'))
  if (!match) throw new Error(`Release sem arquivo ${extension.toUpperCase()} referenciado no HTML.`)
  return new URL(match[1], siteUrl).href
}

async function requireResponse(fetchImpl, url, kind, contentType) {
  const response = await fetchImpl(url, { headers: { 'cache-control': 'no-cache' } })
  if (!response.ok) throw new Error(`${kind} indisponível: HTTP ${response.status}.`)
  const receivedType = response.headers.get('content-type') ?? ''
  if (!contentType.test(receivedType)) throw new Error(`${kind} respondeu com tipo incorreto: ${receivedType || 'ausente'}.`)
  return response
}

export async function verifyPublicRelease({ siteUrl, fetchImpl = fetch }) {
  const root = new URL(siteUrl)
  root.searchParams.set('release-check', Date.now().toString())
  const page = await requireResponse(fetchImpl, root.href, 'Página', /text\/html/i)
  const html = await page.text()
  const stylesheet = assetUrl(html, 'css', siteUrl)
  const script = assetUrl(html, 'js', siteUrl)
  const css = await requireResponse(fetchImpl, stylesheet, 'CSS', /text\/css/i)
  await requireResponse(fetchImpl, script, 'JavaScript', /(?:java|ecma)script/i)

  if (!(await css.text()).includes('.app-shell')) throw new Error('CSS não contém a interface da plataforma.')
  return { stylesheet, script }
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (isDirectRun) {
  const siteUrl = process.env.SITE_URL ?? 'https://setupvencedor.com.br'
  const { stylesheet, script } = await verifyPublicRelease({ siteUrl })
  console.log(`Release verificado: ${stylesheet} | ${script}`)
}
