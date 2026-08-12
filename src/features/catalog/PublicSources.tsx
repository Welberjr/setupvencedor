type PublicSourcesProps = {
  officialUrl: string
  sourceUrls: string[]
}

export function PublicSources({ officialUrl, sourceUrls }: PublicSourcesProps) {
  const additionalSources = [...new Set(sourceUrls.filter((url) => url !== officialUrl))]
  const additionalSourceLabel = additionalSources.length === 1 ? 'fonte pública adicional' : 'fontes públicas adicionais'
  return <div className="public-sources">
    <a href={officialUrl} rel="noreferrer" target="_blank">Abrir fonte oficial</a>
    {additionalSources.length ? <details><summary>{additionalSources.length} {additionalSourceLabel}</summary><div>{additionalSources.map((url, index) => <a href={url} key={url} rel="noreferrer" target="_blank" aria-label={`Abrir fonte pública adicional ${index + 1}`}>Fonte adicional {index + 1} →</a>)}</div></details> : null}
  </div>
}
