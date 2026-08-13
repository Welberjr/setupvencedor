const BLOCKED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'])
const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export const SUPPORT_ATTACHMENT_ACCEPT = 'image/png,image/jpeg,image/webp'
export const SUPPORT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? '')
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const element = node as HTMLElement
  if (BLOCKED_TAGS.has(element.tagName)) return ''
  const children = Array.from(element.childNodes).map(sanitizeNode).join('')

  if (element.tagName === 'BR') return '<br>'
  if (element.tagName === 'STRONG' || element.tagName === 'B') return `<strong>${children}</strong>`
  if (element.tagName === 'EM' || element.tagName === 'I') return `<em>${children}</em>`
  if (element.tagName === 'U') return `<u>${children}</u>`
  return children
}

export function sanitizeSupportMarkup(input: string): string {
  const template = document.createElement('template')
  template.innerHTML = input
  return Array.from(template.content.childNodes).map(sanitizeNode).join('')
}

export function toSupportPlainText(markup: string): string {
  const template = document.createElement('template')
  template.innerHTML = sanitizeSupportMarkup(markup).replaceAll('<br>', ' ')
  return (template.content.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function validateSupportAttachment(file: File): string | null {
  if (!IMAGE_MIME_TYPES.has(file.type)) return 'Envie uma imagem PNG, JPEG ou WebP.'
  if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) return 'A imagem deve ter no máximo 5 MB.'
  return null
}
