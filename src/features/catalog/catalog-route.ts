const RESOURCE_PATH = /^\/recurso\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/

export function readResourceSlug(pathname: string): string | null {
  return pathname.match(RESOURCE_PATH)?.[1] ?? null
}

export function resourcePath(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug de recurso inválido.')
  return `/recurso/${slug}`
}
